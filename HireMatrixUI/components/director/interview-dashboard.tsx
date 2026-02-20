"use client";

import { useState, useEffect } from "react";
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
import InterviewChart from "@/components/charts/interview-chart";
import { BarChart3, CircleCheckBig, DollarSign, ListChecks } from "lucide-react";

interface InterviewResult {
  id: string;
  candidate_name: string;
  jd_score: number;
  technical_score: number | null;
  communication_score: number | null;
  confidence_score: number | null;
  risk_level: string | null;
  status: string;
  evaluation_summary: string | null;
  question_count: number;
  interview_cost: number;
  created_at: string;
}

export default function InterviewDashboard() {
  const [interviews, setInterviews] = useState<InterviewResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInterviews();
  }, []);

  const fetchInterviews = async () => {
    try {
      // In a real app, you'd fetch from your API that queries Postgres
      // For now, we'll create a mock API route or fetch from InterviewAIx
      // Since InterviewAIx stores in Postgres, we need an API route to fetch
      const response = await fetch("/api/interviews");
      if (response.ok) {
        const data = await response.json();
        setInterviews(data);
      }
    } catch (error) {
      console.error("Failed to fetch interviews:", error);
    } finally {
      setLoading(false);
    }
  };

  const chartData = interviews
    .filter((i) => i.technical_score !== null)
    .map((i) => ({
      name: i.candidate_name,
      score: i.technical_score || 0,
      communication: i.communication_score || 0,
      confidence: i.confidence_score || 0,
    }));

  const totalCost = interviews.reduce((sum, interview) => sum + (interview.interview_cost || 0), 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium inline-flex items-center gap-1.5">
              <ListChecks className="h-4 w-4" />
              Total Interviews
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{interviews.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium inline-flex items-center gap-1.5">
              <CircleCheckBig className="h-4 w-4" />
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {interviews.filter((i) => i.status === "completed").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium inline-flex items-center gap-1.5">
              <BarChart3 className="h-4 w-4" />
              Avg Technical Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {interviews.length > 0
                ? Math.round(
                    interviews
                      .filter((i) => i.technical_score !== null)
                      .reduce((acc, i) => acc + (i.technical_score || 0), 0) /
                      interviews.filter((i) => i.technical_score !== null).length
                  )
                : 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium inline-flex items-center gap-1.5">
              <DollarSign className="h-4 w-4" />
              Interview Cost
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalCost.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Interview Scores Chart</CardTitle>
          </CardHeader>
          <CardContent>
            <InterviewChart data={chartData} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Interview Results</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : interviews.length === 0 ? (
            <p className="text-sm text-muted-foreground">No interviews found.</p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Candidate</TableHead>
                    <TableHead>JD Score</TableHead>
                    <TableHead>Technical</TableHead>
                    <TableHead>Communication</TableHead>
                    <TableHead>Confidence</TableHead>
                    <TableHead>Risk</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Result Summary</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {interviews.map((interview) => (
                    <TableRow key={interview.id}>
                      <TableCell className="font-medium">
                        {interview.candidate_name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{interview.jd_score}%</Badge>
                      </TableCell>
                      <TableCell>
                        {interview.technical_score !== null
                          ? `${interview.technical_score}%`
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {interview.communication_score !== null
                          ? `${interview.communication_score}%`
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {interview.confidence_score !== null
                          ? `${interview.confidence_score}%`
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {interview.risk_level && (
                          <Badge
                            variant={
                              interview.risk_level.toLowerCase().includes("low")
                                ? "default"
                                : interview.risk_level.toLowerCase().includes("high")
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {interview.risk_level}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            interview.status === "completed" ? "default" : "secondary"
                          }
                        >
                          {interview.status}
                        </Badge>
                      </TableCell>
                      <TableCell>${(interview.interview_cost || 0).toFixed(2)}</TableCell>
                      <TableCell className="max-w-[360px]">
                        {interview.status === "completed"
                          ? interview.evaluation_summary || "Completed. Evaluation pending."
                          : "Interview in progress"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
