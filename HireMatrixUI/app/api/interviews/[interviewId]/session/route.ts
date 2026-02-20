import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

interface Params {
  params: { interviewId: string };
}

export async function GET(_request: Request, { params }: Params) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { interviewId } = params;
    const interview = await prisma.interview.findFirst({
      where: {
        id: interviewId,
        tenantId: user.tenantId,
      },
      select: {
        id: true,
        candidateName: true,
        currentQuestion: true,
        status: true,
      },
    });

    if (!interview) {
      return NextResponse.json({ error: "Interview not found" }, { status: 404 });
    }

    return NextResponse.json({
      interview_id: interview.id,
      candidate_name: interview.candidateName,
      question: interview.currentQuestion || "",
      status: interview.status,
      interview_complete: interview.status === "completed",
    });
  } catch (error) {
    console.error("Failed to fetch interview session:", error);
    return NextResponse.json(
      { error: "Failed to fetch interview session" },
      { status: 500 }
    );
  }
}
