import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const interviewAPIBaseURL = process.env.NEXT_PUBLIC_INTERVIEW_API || "http://localhost:8001";

interface Params {
  params: { interviewId: string };
}

function parseScoreFromEvaluation(evaluation: string, label: string): number | null {
  const regex = new RegExp(`${label}\\s*:\\s*(\\d{1,3})`, "i");
  const match = evaluation.match(regex);
  if (!match) return null;
  const value = Number(match[1]);
  if (Number.isNaN(value)) return null;
  return Math.max(0, Math.min(100, value));
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { interviewId } = params;
    const body = await request.json();

    const interview = await prisma.interview.findFirst({
      where: {
        id: interviewId,
        tenantId: user.tenantId,
      },
      select: {
        id: true,
        status: true,
        questionCount: true,
        technicalScore: true,
        communicationScore: true,
        confidenceScore: true,
      },
    });

    if (!interview) {
      return NextResponse.json({ error: "Interview not found" }, { status: 404 });
    }

    if (interview.status === "completed") {
      return NextResponse.json(
        { error: "This interview is already completed for this ID." },
        { status: 400 }
      );
    }

    const response = await fetch(`${interviewAPIBaseURL}/interview/${interviewId}/answer`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    const isComplete = Boolean(data?.interview_complete);
    const evaluationText = String(data?.evaluation ?? "");
    const technicalScore =
      parseScoreFromEvaluation(evaluationText, "Technical Score") ?? interview.technicalScore;
    const communicationScore =
      parseScoreFromEvaluation(evaluationText, "Communication Score") ?? interview.communicationScore;
    const confidenceScore =
      parseScoreFromEvaluation(evaluationText, "Confidence Score") ?? interview.confidenceScore;

    await prisma.interview.update({
      where: { id: interviewId },
      data: {
        currentQuestion: isComplete ? null : String(data?.next_question ?? ""),
        evaluationSummary: evaluationText,
        technicalScore,
        communicationScore,
        confidenceScore,
        riskLevel: String(data?.risk ?? ""),
        status: isComplete ? "completed" : "ongoing",
        questionCount: (interview.questionCount ?? 0) + 1,
      },
    });

    return NextResponse.json({
      ...data,
      interview_id: interviewId,
    });
  } catch (error) {
    console.error("Failed to submit answer:", error);
    return NextResponse.json(
      { error: "Failed to submit interview answer" },
      { status: 500 }
    );
  }
}
