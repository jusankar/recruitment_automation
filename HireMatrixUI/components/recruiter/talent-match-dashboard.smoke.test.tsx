import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import TalentMatchDashboard from "./talent-match-dashboard";

const { postTalent, postInterview } = vi.hoisted(() => ({
  postTalent: vi.fn(),
  postInterview: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  talentAPI: { post: postTalent },
  interviewAPI: { post: postInterview },
}));

describe("TalentMatchDashboard smoke", () => {
  beforeEach(() => {
    postTalent.mockReset();
    postInterview.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("keeps search button disabled until JD is provided", () => {
    render(<TalentMatchDashboard />);
    expect(screen.getByRole("button", { name: "Search resumes" })).toBeDisabled();
  });

  it("searches and renders candidate row", async () => {
    postTalent.mockResolvedValueOnce({
      data: {
        scored_results: [
          {
            name: "Ananya",
            score: 87,
            strengths: ["Strong Python API delivery"],
            gaps: ["Limited cloud IaC exposure"],
          },
        ],
      },
    });

    render(<TalentMatchDashboard />);
    fireEvent.change(screen.getByLabelText("Job description"), {
      target: { value: "Need backend engineer with API skills" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Search resumes" }));

    await screen.findByText("Ananya");
    expect(screen.getByText("87%")).toBeInTheDocument();
  });

  it("forwards a searched candidate to interview", async () => {
    postTalent.mockResolvedValueOnce({
      data: {
        scored_results: [
          { name: "Rahul", score: 78, strengths: ["Strong SQL"], gaps: ["Needs deeper testing"] },
        ],
      },
    });
    postInterview.mockResolvedValueOnce({
      data: { interview_id: "iv-talent-1" },
    });

    render(<TalentMatchDashboard />);
    fireEvent.change(screen.getByLabelText("Job description"), {
      target: { value: "Database-focused backend engineer" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Search resumes" }));

    await screen.findByText("Rahul");
    fireEvent.click(screen.getByRole("button", { name: "Forward to interview" }));

    await waitFor(() => {
      expect(screen.getByText(/Interview started for Rahul/)).toBeInTheDocument();
    });
    expect(screen.getByText(/Interview ID: iv-talent-1/)).toBeInTheDocument();
  });
});
