import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

const talentAPIBaseURL = process.env.NEXT_PUBLIC_TALENT_API || "http://localhost:8000";

function normalizeScoredResults(scoredResults: unknown): unknown {
  if (Array.isArray(scoredResults)) {
    return scoredResults;
  }

  if (typeof scoredResults !== "string") {
    return [];
  }

  const text = scoredResults.trim();
  if (!text) {
    return [];
  }

  try {
    return JSON.parse(text);
  } catch {
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return [];
    }

    try {
      return JSON.parse(jsonMatch[0]);
    } catch {
      return [];
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "recruiter" && user.role !== "admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const payload = await request.json();
    const response = await fetch(`${talentAPIBaseURL}/search`, {
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

    return NextResponse.json({
      ...data,
      scored_results: normalizeScoredResults(data?.scored_results),
    });
  } catch (error) {
    console.error("Talent search proxy failed:", error);
    return NextResponse.json(
      { error: "Failed to search candidates" },
      { status: 500 }
    );
  }
}
