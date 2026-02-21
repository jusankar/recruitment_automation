import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

function cleanEvaluationSummary(summary: string | null): string | null {
  if (!summary) return summary;
  return summary
    .split("\n")
    .filter((line) => {
      const text = line.trim().toLowerCase();
      return (
        !text.startsWith("technical score:") &&
        !text.startsWith("communication score:") &&
        !text.startsWith("confidence score:")
      );
    })
    .join("\n")
    .trim();
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "director" && user.role !== "admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const interviews = await prisma.interview.findMany({
      where: {
        tenantId: user.tenantId,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        candidateName: true,
        jdScore: true,
        technicalScore: true,
        communicationScore: true,
        confidenceScore: true,
        riskLevel: true,
        status: true,
        evaluationSummary: true,
        questionCount: true,
        createdAt: true,
      },
    });

    const formatted = interviews.map((interview) => {
      const questionCount = interview.questionCount ?? 0;
      const estimatedCost = Number((questionCount * 0.35).toFixed(2));

      return {
        id: interview.id,
        candidate_name: interview.candidateName,
        jd_score: interview.jdScore,
        technical_score: interview.technicalScore,
        communication_score: interview.communicationScore,
        confidence_score: interview.confidenceScore,
        risk_level: interview.riskLevel,
        status: interview.status,
        evaluation_summary: cleanEvaluationSummary(interview.evaluationSummary),
        question_count: questionCount,
        interview_cost: estimatedCost,
        created_at: interview.createdAt,
      };
    });

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Failed to fetch interviews:", error);
    return NextResponse.json(
      { error: "Failed to fetch interviews" },
      { status: 500 }
    );
  }
}
