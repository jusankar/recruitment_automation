import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

const interviewAPIBaseURL = process.env.NEXT_PUBLIC_INTERVIEW_API || "http://localhost:8001";
const credentialEmailWebhook = process.env.CREDENTIAL_EMAIL_WEBHOOK_URL;

function slugifyName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.|\.$/g, "") || "candidate";
}

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
  if (!credentialEmailWebhook) {
    console.warn("CREDENTIAL_EMAIL_WEBHOOK_URL is not configured. Skipping credential email send.");
    return false;
  }

  const payload = {
    to: params.to,
    subject: "HireMatrix Interview Login Credentials",
    text: `Hello ${params.candidateName},

Your interview credentials are ready.

Username: ${params.username}
Password: ${params.password}
Interview ID: ${params.interviewId}

Use these details to login and attend your interview.
`,
  };

  const response = await fetch(credentialEmailWebhook, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return response.ok;
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

    const candidateName = String(payload.name ?? "Unknown");
    const emailFromPayload = payload?.email ? String(payload.email).trim() : "";
    const generatedEmail = `${slugifyName(candidateName)}.${String(data.interview_id).slice(0, 6)}@candidate.hirematrix.local`;
    const candidateEmail = emailFromPayload || generatedEmail;
    const username = candidateEmail.split("@")[0];
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
