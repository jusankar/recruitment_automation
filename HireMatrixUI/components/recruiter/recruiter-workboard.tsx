"use client";

import { useMemo, useState } from "react";
import ResumeUpload from "@/components/recruiter/resume-upload";
import { talentAPI } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BriefcaseBusiness, MapPin, Search, Star, Upload, UserRoundCheck } from "lucide-react";

interface TalentMatchResult {
  row_key: string;
  name: string;
  score: number;
  strengths: string[];
  gaps: string[];
}

function parseScore(val: unknown): number {
  const n = Number(val);
  if (Number.isNaN(n)) return 0;
  if (n > 1) return Math.round(Math.min(100, Math.max(0, n)));
  return Math.round(n * 100);
}

function normalizeResults(response: {
  scored_results?: unknown;
  candidates?: unknown[];
}): TalentMatchResult[] {
  const raw = response?.scored_results;
  const list =
    raw &&
    typeof raw === "object" &&
    !Array.isArray(raw) &&
    "scored_results" in (raw as Record<string, unknown>)
      ? (raw as Record<string, unknown>).scored_results
      : raw;
  const candidates = response?.candidates;

  if (Array.isArray(list) && list.length > 0) {
    return list.map((c: Record<string, unknown>, idx: number) => ({
      row_key: `result-${idx}`,
      name: String(c?.name ?? c?.candidate_name ?? "Unknown"),
      score: parseScore(c?.score),
      strengths: Array.isArray(c?.strengths) ? (c.strengths as string[]) : [],
      gaps: Array.isArray(c?.gaps) ? (c.gaps as string[]) : [],
    }));
  }

  if (typeof list === "string" && list.trim()) {
    try {
      const text = list.trim();
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      const jsonStr = jsonMatch ? jsonMatch[0] : text;
      const parsed = JSON.parse(jsonStr);

      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((c: Record<string, unknown>, idx: number) => ({
          row_key: `result-string-${idx}`,
          name: String(c?.name ?? c?.candidate_name ?? "Unknown"),
          score: parseScore(c?.score),
          strengths: Array.isArray(c?.strengths) ? (c.strengths as string[]) : [],
          gaps: Array.isArray(c?.gaps) ? (c.gaps as string[]) : [],
        }));
      }
    } catch {
      // Fall through to candidates parsing
    }
  }

  if (
    list &&
    typeof list === "object" &&
    !Array.isArray(list) &&
    "scored_results" in (list as Record<string, unknown>)
  ) {
    const nested = (list as Record<string, unknown>).scored_results;
    if (Array.isArray(nested) && nested.length > 0) {
      return nested.map((c: Record<string, unknown>, idx: number) => ({
        row_key: `result-nested-${idx}`,
        name: String(c?.name ?? c?.candidate_name ?? "Unknown"),
        score: parseScore(c?.score),
        strengths: Array.isArray(c?.strengths) ? (c.strengths as string[]) : [],
        gaps: Array.isArray(c?.gaps) ? (c.gaps as string[]) : [],
      }));
    }
    if (typeof nested === "string" && nested.trim()) {
      try {
        const parsedNested = JSON.parse(nested);
        if (Array.isArray(parsedNested) && parsedNested.length > 0) {
          return parsedNested.map((c: Record<string, unknown>, idx: number) => ({
            row_key: `result-nested-string-${idx}`,
            name: String(c?.name ?? c?.candidate_name ?? "Unknown"),
            score: parseScore(c?.score),
            strengths: Array.isArray(c?.strengths) ? (c.strengths as string[]) : [],
            gaps: Array.isArray(c?.gaps) ? (c.gaps as string[]) : [],
          }));
        }
      } catch {
        // Fall through
      }
    }
  }

  if (Array.isArray(candidates) && candidates.length > 0) {
    return candidates.map((c: unknown, idx: number) => {
      const row = c as Record<string, unknown>;
      const meta = (row?.metadata as Record<string, unknown>) ?? {};
      const name = String(meta?.candidate_name ?? meta?.name ?? "Unknown");
      const scoreVal = row?.score;
      const score = parseScore(scoreVal);
      const skills = meta?.skills;
      const strengths = Array.isArray(skills) ? (skills as string[]) : skills ? [String(skills)] : [];
      return { row_key: `candidate-${idx}`, name, score, strengths, gaps: [] };
    });
  }

  return [];
}

export default function RecruiterWorkboard() {
  const [jobDescription, setJobDescription] = useState("");
  const [minExperience, setMinExperience] = useState<string>("0");
  const [location, setLocation] = useState("");
  const [searchResults, setSearchResults] = useState<TalentMatchResult[]>([]);
  const [forwardedCandidates, setForwardedCandidates] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [forwardingId, setForwardingId] = useState<string | null>(null);
  const [forwardSuccess, setForwardSuccess] = useState<string | null>(null);

  const visibleResults = useMemo(
    () => searchResults.filter((result) => !forwardedCandidates[result.row_key]),
    [searchResults, forwardedCandidates]
  );

  const handleSearch = async () => {
    if (!jobDescription.trim()) return;

    setLoading(true);
    setSearchError("");
    setForwardSuccess(null);
    setForwardedCandidates({});

    try {
      const response = await talentAPI.post("/search", {
          job_description: jobDescription,
          min_experience: Number(minExperience || 0),
          location: location?.trim() || null,
          top_k: 20,
        });
      const data = response.data;
      console.log("Search result:", data);
      setSearchResults(normalizeResults(data ?? {}));
    } catch (error) {
      console.error("Search failed:", error);
      setSearchError(error instanceof Error ? error.message : "Failed to search resumes. Please try again.");
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleForwardToInterview = async (result: TalentMatchResult, rowIndex: number) => {
    setForwardSuccess(null);
    setForwardingId(String(rowIndex));

    try {
      const response = await fetch("/api/interviews/forward", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: result.name,
          score: result.score,
          strengths: result.strengths ?? [],
          gaps: result.gaps ?? [],
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Failed to start interview.");
      }

      const iid = String(data?.interview_id ?? "");
      if (iid) {
        setForwardedCandidates((prev) => ({ ...prev, [result.row_key]: iid }));
        setForwardSuccess(`Forwarded ${result.name}. Interview ID: ${iid}`);
      } else {
        throw new Error("Interview service did not return interview ID.");
      }
    } catch (error) {
      console.error("Forward to interview failed:", error);
      setSearchError(error instanceof Error ? error.message : "Failed to start interview. Please try again.");
    } finally {
      setForwardingId(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="grid gap-8 lg:grid-cols-12">
        <aside className="lg:col-span-4 xl:col-span-3">
          <Card className="border-slate-200 shadow-sm dark:border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg inline-flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Upload Resume
              </CardTitle>
              <p className="text-sm font-normal text-muted-foreground">
                Recruiter uploads candidate resumes from hiring board
              </p>
            </CardHeader>
            <CardContent>
              <ResumeUpload />
            </CardContent>
          </Card>
        </aside>

        <section className="min-w-0 lg:col-span-8 xl:col-span-9">
          <Card className="border-slate-200 shadow-sm dark:border-slate-800">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg inline-flex items-center gap-2">
                <Search className="h-4 w-4" />
                Search Candidates
              </CardTitle>
              <p className="text-sm font-normal text-muted-foreground">
                Search by job description, years of experience, and location
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="jd">Job description</Label>
                <textarea
                  id="jd"
                  className="flex min-h-[120px] w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 dark:border-slate-700 dark:bg-slate-900 dark:placeholder:text-slate-500"
                  placeholder="Paste job description here..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="min-experience">Minimum years of experience</Label>
                  <div className="relative">
                    <BriefcaseBusiness className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                    <Input
                      id="min-experience"
                      type="number"
                      min={0}
                      value={minExperience}
                      onChange={(e) => setMinExperience(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <div className="relative">
                    <MapPin className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                    <Input
                      id="location"
                      placeholder="e.g. Dallas, TX"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
              </div>

              <Button onClick={handleSearch} disabled={loading || !jobDescription.trim()}>
                <Search className="mr-2 h-4 w-4" />
                {loading ? "Searching..." : "Search resumes"}
              </Button>
            </CardContent>
          </Card>
        </section>
      </div>

      <Card className="border-slate-200 shadow-sm dark:border-slate-800">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg inline-flex items-center gap-2">
            <UserRoundCheck className="h-4 w-4" />
            Matching candidates
          </CardTitle>
          <p className="text-sm font-normal text-muted-foreground">
            Forward selected candidates to interview. Forwarded candidates are removed from this list.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {searchError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
              {searchError}
            </p>
          )}

          {forwardSuccess && (
            <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
              {forwardSuccess}
            </p>
          )}

          {visibleResults.length > 0 ? (
            <div className="w-full overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/50">
                    <TableHead>Candidate</TableHead>
                    <TableHead className="w-[100px]">Score</TableHead>
                    <TableHead className="min-w-[180px]">Strengths</TableHead>
                    <TableHead className="min-w-[180px]">Gaps</TableHead>
                    <TableHead className="w-[160px] text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleResults.map((result, idx) => (
                    <TableRow key={result.row_key} className="border-slate-200 dark:border-slate-800">
                      <TableCell className="font-medium text-slate-900 dark:text-slate-100">
                        {result.name}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            result.score >= 70 ? "default" : result.score >= 50 ? "secondary" : "outline"
                          }
                          className="font-medium tabular-nums"
                        >
                          <Star className="mr-1 h-3.5 w-3.5" />
                          {result.score}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1.5">
                          {(result.strengths || []).slice(0, 3).map((s, i) => (
                            <Badge key={i} variant="outline" className="text-xs font-normal">
                              {String(s)}
                            </Badge>
                          ))}
                          {(result.strengths?.length ?? 0) > 3 && (
                            <span className="text-xs text-slate-400">+{result.strengths!.length - 3}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1.5">
                          {(result.gaps || []).slice(0, 3).map((g, i) => (
                            <Badge key={i} variant="destructive" className="text-xs font-normal">
                              {String(g)}
                            </Badge>
                          ))}
                          {(result.gaps?.length ?? 0) > 3 && (
                            <span className="text-xs text-slate-400">+{result.gaps!.length - 3}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          onClick={() => handleForwardToInterview(result, idx)}
                          disabled={forwardingId === String(idx)}
                        >
                          <UserRoundCheck className="mr-1 h-4 w-4" />
                          {forwardingId === String(idx) ? "Forwarding..." : "Forward to interview"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50/50 px-4 py-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/30 dark:text-slate-400">
              {loading
                ? "Searching candidates..."
                : "No matching candidates yet. Run a search using JD, experience, and location."}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
