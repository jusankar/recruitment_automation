import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

const talentAPIBaseURL = process.env.NEXT_PUBLIC_TALENT_API || "http://localhost:8000";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "recruiter" && user.role !== "admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const inbound = await request.formData();
    const file = inbound.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    const outbound = new FormData();
    outbound.append("file", file, file.name);

    const response = await fetch(`${talentAPIBaseURL}/upload-resume/`, {
      method: "POST",
      body: outbound,
      cache: "no-store",
    });

    const data = await response.json().catch(() => ({ error: "Invalid response from talent service" }));
    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Talent upload proxy failed:", error);
    return NextResponse.json(
      { error: "Failed to upload resume" },
      { status: 500 }
    );
  }
}
