import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const interviewAPIBaseURL = process.env.NEXT_PUBLIC_INTERVIEW_API || "http://localhost:8001";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "recruiter" && user.role !== "admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const payload = await request.json();

    const response = await fetch(`${interviewAPIBaseURL}/interview/start`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    if (!data?.interview_id) {
      return NextResponse.json(
        { error: "Interview service did not return an interview_id" },
        { status: 502 }
      );
    }

    await prisma.interview.upsert({
      where: { id: data.interview_id },
      update: {
        candidateName: String(payload.name ?? "Unknown"),
        jdScore: Number(payload.score ?? 0),
        strengths: payload.strengths ?? [],
        gaps: payload.gaps ?? [],
        currentQuestion: String(data.question ?? ""),
        status: "ongoing",
        tenantId: user.tenantId,
      },
      create: {
        id: data.interview_id,
        candidateName: String(payload.name ?? "Unknown"),
        jdScore: Number(payload.score ?? 0),
        strengths: payload.strengths ?? [],
        gaps: payload.gaps ?? [],
        currentQuestion: String(data.question ?? ""),
        status: "ongoing",
        tenantId: user.tenantId,
      },
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("Forward interview failed:", error);
    return NextResponse.json(
      { error: "Failed to forward candidate to interview" },
      { status: 500 }
    );
  }
}
