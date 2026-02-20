"use client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

interface ChartData {
  name: string;
  score: number;
  communication?: number;
  confidence?: number;
}

interface InterviewChartProps {
  data: ChartData[];
}

export default function InterviewChart({ data }: InterviewChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
        No data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis domain={[0, 100]} />
        <Tooltip />
        <Legend />
        <Bar dataKey="score" fill="#8884d8" name="Technical Score" />
        {data[0]?.communication !== undefined && (
          <Bar dataKey="communication" fill="#82ca9d" name="Communication" />
        )}
        {data[0]?.confidence !== undefined && (
          <Bar dataKey="confidence" fill="#ffc658" name="Confidence" />
        )}
      </BarChart>
    </ResponsiveContainer>
  );
}
