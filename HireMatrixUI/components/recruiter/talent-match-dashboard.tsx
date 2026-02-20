"use client";

import { useState } from "react";
import { talentAPI, interviewAPI } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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

interface TalentMatchResult {
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
  const list = response?.scored_results;
  const candidates = response?.candidates;

  if (Array.isArray(list) && list.length > 0) {
    return list.map((c: Record<string, unknown>) => ({
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
      if (Array.isArray(parsed)) {
        return parsed.map((c: Record<string, unknown>) => ({
          name: String(c?.name ?? c?.candidate_name ?? "Unknown"),
          score: parseScore(c?.score),
          strengths: Array.isArray(c?.strengths) ? (c.strengths as string[]) : [],
          gaps: Array.isArray(c?.gaps) ? (c.gaps as string[]) : [],
        }));
      }
    } catch {
      // fall through to candidates
    }
  }

  if (Array.isArray(candidates) && candidates.length > 0) {
    return candidates.map((c: unknown) => {
      const row = c as Record<string, unknown>;
      const meta = (row?.metadata as Record<string, unknown>) ?? {};
      const name = String(meta?.candidate_name ?? meta?.name ?? "Unknown");
      const scoreVal = row?.score;
      const score = parseScore(scoreVal);
      const skills = meta?.skills;
      const strengths = Array.isArray(skills) ? (skills as string[]) : skills ? [String(skills)] : [];
      return { name, score, strengths, gaps: [] };
    });
  }

  return [];
}

export default function TalentMatchDashboard() {
  const [jobDescription, setJobDescription] = useState("");
  const [searchResults, setSearchResults] = useState<TalentMatchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [forwardingId, setForwardingId] = useState<string | null>(null);
  const [forwardSuccess, setForwardSuccess] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!jobDescription.trim()) return;

    setLoading(true);
    setSearchError("");
    setForwardSuccess(null);
    try {
      const response = await talentAPI.post("/search", {
        job_description: jobDescription,
        top_k: 20,
      });
      setSearchResults(normalizeResults(response.data ?? {}));
    } catch (error) {
      console.error("Search failed:", error);
      setSearchError("Failed to search resumes. Please try again.");
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleForwardToInterview = async (result: TalentMatchResult, rowIndex: number) => {
    setForwardSuccess(null);
    setForwardingId(String(rowIndex));
    try {
      const response = await interviewAPI.post("/interview/start", {
        name: result.name,
        score: result.score,
        strengths: result.strengths ?? [],
        gaps: result.gaps ?? [],
      });

      const iid = response.data?.interview_id;
      if (iid) {
        setForwardSuccess(`Interview started for ${result.name}. Interview ID: ${iid}`);
      } else {
        setForwardSuccess(`Interview started for ${result.name}.`);
      }
    } catch (error) {
      console.error("Forward to interview failed:", error);
      setSearchError("Failed to start interview. Please try again.");
    } finally {
      setForwardingId(null);
    }
  };

  return (
    <Card className="border-slate-200 shadow-sm dark:border-slate-800">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Match candidates</CardTitle>
        <p className="text-sm font-normal text-muted-foreground">
          Search by job description and forward candidates to interview
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="jd" className="text-slate-700 dark:text-slate-300">
            Job description
          </Label>
          <textarea
            id="jd"
            className="flex min-h-[100px] w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 dark:border-slate-700 dark:bg-slate-900 dark:placeholder:text-slate-500"
            placeholder="Paste job description here..."
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
          />
          <Button
            onClick={handleSearch}
            disabled={loading || !jobDescription.trim()}
            className="mt-1"
          >
            {loading ? "Searching…" : "Search resumes"}
          </Button>
        </div>

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

        {searchResults.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Matching candidates
            </h3>
            <div className="w-full overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/50">
                    <TableHead className="font-semibold text-slate-700 dark:text-slate-300">
                      Candidate
                    </TableHead>
                    <TableHead className="w-[100px] font-semibold text-slate-700 dark:text-slate-300">
                      Score
                    </TableHead>
                    <TableHead className="min-w-[180px] font-semibold text-slate-700 dark:text-slate-300">
                      Strengths
                    </TableHead>
                    <TableHead className="min-w-[180px] font-semibold text-slate-700 dark:text-slate-300">
                      Gaps
                    </TableHead>
                    <TableHead className="w-[160px] text-right font-semibold text-slate-700 dark:text-slate-300">
                      Action
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {searchResults.map((result, idx) => (
                    <TableRow
                      key={`${result.name}-${idx}`}
                      className="border-slate-200 dark:border-slate-800"
                    >
                      <TableCell className="font-medium text-slate-900 dark:text-slate-100">
                        {result.name}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            result.score >= 70
                              ? "default"
                              : result.score >= 50
                                ? "secondary"
                                : "outline"
                          }
                          className="font-medium tabular-nums"
                        >
                          {result.score}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1.5">
                          {(result.strengths || []).slice(0, 3).map((s, i) => (
                            <Badge
                              key={i}
                              variant="outline"
                              className="text-xs font-normal text-slate-600 dark:text-slate-400"
                            >
                              {String(s)}
                            </Badge>
                          ))}
                          {(result.strengths?.length ?? 0) > 3 && (
                            <span className="text-xs text-slate-400">
                              +{result.strengths!.length - 3}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1.5">
                          {(result.gaps || []).slice(0, 3).map((g, i) => (
                            <Badge
                              key={i}
                              variant="destructive"
                              className="text-xs font-normal"
                            >
                              {String(g)}
                            </Badge>
                          ))}
                          {(result.gaps?.length ?? 0) > 3 && (
                            <span className="text-xs text-slate-400">
                              +{result.gaps!.length - 3}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          onClick={() => handleForwardToInterview(result, idx)}
                          disabled={forwardingId === String(idx)}
                        >
                          {forwardingId === String(idx)
                            ? "Starting…"
                            : "Forward to interview"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {!loading && searchResults.length === 0 && jobDescription.trim() && !searchError && (
          <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50/50 px-4 py-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/30 dark:text-slate-400">
            No matching candidates. Try a different job description or upload more resumes.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
