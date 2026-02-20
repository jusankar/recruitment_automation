import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const interviewAPIBaseURL = process.env.NEXT_PUBLIC_INTERVIEW_API || "http://localhost:8001";

interface Params {
  params: { interviewId: string };
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
      select: { id: true, questionCount: true },
    });

    if (!interview) {
      return NextResponse.json({ error: "Interview not found" }, { status: 404 });
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

    await prisma.interview.update({
      where: { id: interviewId },
      data: {
        currentQuestion: isComplete ? null : String(data?.next_question ?? ""),
        evaluationSummary: String(data?.evaluation ?? ""),
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
