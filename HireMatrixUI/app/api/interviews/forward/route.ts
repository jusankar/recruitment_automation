import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { sendEmail } from "@/lib/email-service";

const interviewAPIBaseURL = process.env.NEXT_PUBLIC_INTERVIEW_API || "http://localhost:8001";

function generatePassword(length = 12): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function sendCredentialsEmail(params: {
  to: string;
  candidateName: string;
  username: string;
  password: string;
  interviewId: string;
}): Promise<boolean> {
  return sendEmail({
    to: params.to,
    subject: "HireMatrix Interview Login Credentials",
    text: `Hello ${params.candidateName},

Your interview credentials are ready.

Username: ${params.username}
Password: ${params.password}
Interview ID: ${params.interviewId}

Use these details to login and attend your interview.
`,
    html: `<p>Hello ${params.candidateName},</p>
<p>Your interview credentials are ready.</p>
<p><strong>Username:</strong> ${params.username}<br/>
<strong>Password:</strong> ${params.password}<br/>
<strong>Interview ID:</strong> ${params.interviewId}</p>
<p>Use these details to login and attend your interview.</p>`,
  });
}

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

    const raw = await response.text();
    let data: any = null;
    if (raw) {
      try {
        data = JSON.parse(raw);
      } catch {
        data = { error: raw };
      }
    }

    if (!response.ok) {
      const upstreamError =
        data?.error ||
        data?.detail ||
        `Interview service error (${response.status})`;
      return NextResponse.json(
        { error: String(upstreamError), upstream_status: response.status },
        { status: response.status }
      );
    }

    if (!data?.interview_id) {
      return NextResponse.json(
        { error: "Interview service did not return an interview_id" },
        { status: 502 }
      );
    }

    const candidateName = String(payload.name ?? "Unknown");
    const candidateEmail = payload?.email ? String(payload.email).trim() : "";
    if (!candidateEmail || !candidateEmail.includes("@")) {
      return NextResponse.json(
        { error: "Candidate email is required from parsed resume before forwarding to interview." },
        { status: 400 }
      );
    }
    const username = candidateEmail;
    const plainPassword = generatePassword(12);
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    await prisma.interview.upsert({
      where: { id: data.interview_id },
      update: {
        candidateName,
        jdScore: Number(payload.score ?? 0),
        strengths: payload.strengths ?? [],
        gaps: payload.gaps ?? [],
        currentQuestion: String(data.question ?? ""),
        status: "ongoing",
        tenantId: user.tenantId,
      },
      create: {
        id: data.interview_id,
        candidateName,
        jdScore: Number(payload.score ?? 0),
        strengths: payload.strengths ?? [],
        gaps: payload.gaps ?? [],
        currentQuestion: String(data.question ?? ""),
        status: "ongoing",
        tenantId: user.tenantId,
      },
    });

    await prisma.application.upsert({
      where: { interviewId: data.interview_id },
      update: {
        candidateName,
        candidateEmail,
        jdScore: Number(payload.score ?? 0),
        strengths: payload.strengths ?? [],
        gaps: payload.gaps ?? [],
        status: "interviewed",
        tenantId: user.tenantId,
      },
      create: {
        candidateName,
        candidateEmail,
        jdScore: Number(payload.score ?? 0),
        strengths: payload.strengths ?? [],
        gaps: payload.gaps ?? [],
        status: "interviewed",
        interviewId: data.interview_id,
        tenantId: user.tenantId,
      },
    });

    await prisma.user.upsert({
      where: { email: candidateEmail },
      update: {
        name: candidateName,
        role: "candidate",
        password: hashedPassword,
        tenantId: user.tenantId,
      },
      create: {
        email: candidateEmail,
        password: hashedPassword,
        name: candidateName,
        role: "candidate",
        tenantId: user.tenantId,
      },
    });

    const emailSent = await sendCredentialsEmail({
      to: candidateEmail,
      candidateName,
      username,
      password: plainPassword,
      interviewId: data.interview_id,
    });

    return NextResponse.json({
      ...data,
      candidate_email: candidateEmail,
      username,
      password: plainPassword,
      email_sent: emailSent,
    });
  } catch (error) {
    console.error("Forward interview failed:", error);
    return NextResponse.json(
      { error: "Failed to forward candidate to interview" },
      { status: 500 }
    );
  }
}
