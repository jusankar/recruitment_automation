import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import InterviewInterface from "./interview-interface";

const store = {
  interviewId: null as string | null,
  question: null as string | null,
  setInterview: vi.fn((id: string, question: string) => {
    store.interviewId = id;
    store.question = question;
  }),
  reset: vi.fn(() => {
    store.interviewId = null;
    store.question = null;
  }),
};

vi.mock("./video-panel", () => ({
  default: () => <div data-testid="video-panel">Video</div>,
}));

vi.mock("@/store/interview-store", () => ({
  useInterviewStore: () => store,
}));

function jsonResponse(payload: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => payload,
  } as Response;
}

describe("InterviewInterface smoke", () => {
  beforeEach(() => {
    store.interviewId = null;
    store.question = null;
    store.setInterview.mockClear();
    store.reset.mockClear();
    vi.stubGlobal("fetch", vi.fn());
    vi.stubGlobal("alert", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows entry state before session starts", () => {
    render(<InterviewInterface />);
    expect(screen.getByText("Enter your interview ID from recruiter to start interview.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Start Interview" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Start Recording" })).toBeDisabled();
  });

  it("locks the UI when interview id is already completed", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValueOnce(
      jsonResponse(
        {
          interview_id: "iv-1",
          interview_complete: true,
          question: "",
        },
        200
      )
    );

    render(<InterviewInterface />);

    fireEvent.change(screen.getByLabelText("Interview ID"), {
      target: { value: "iv-1" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Start Interview" }));

    await screen.findByText("This interview is already completed for this ID.");
    expect(screen.getByRole("button", { name: "Start Recording" })).toBeDisabled();
  });

  it("shows completion banner after final answer submit", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse(
          {
            interview_id: "iv-2",
            interview_complete: false,
            question: "Tell me about yourself.",
          },
          200
        )
      )
      .mockResolvedValueOnce(
        jsonResponse(
          {
            interview_id: "iv-2",
            interview_complete: true,
            next_question: null,
          },
          200
        )
      );

    render(<InterviewInterface />);

    fireEvent.change(screen.getByLabelText("Interview ID"), {
      target: { value: "iv-2" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Start Interview" }));

    await screen.findByText("Interview ID");

    fireEvent.change(screen.getByLabelText("Your Answer"), {
      target: { value: "I build APIs and lead backend projects." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Submit Answer" }));

    await waitFor(() => {
      expect(screen.getByText("Interview Completed")).toBeInTheDocument();
    });
    expect(screen.getByLabelText("Your Answer")).toBeDisabled();
  });
});
