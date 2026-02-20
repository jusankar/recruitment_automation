import { create } from "zustand";
import { persist } from "zustand/middleware";

interface InterviewState {
  interviewId: string | null;
  question: string | null;
  transcript: string;
  setInterview: (id: string, q: string) => void;
  setTranscript: (t: string) => void;
  reset: () => void;
}

export const useInterviewStore = create<InterviewState>()(
  persist(
    (set) => ({
      interviewId: null,
      question: null,
      transcript: "",
      setInterview: (id, q) => set({ interviewId: id, question: q }),
      setTranscript: (t) => set({ transcript: t }),
      reset: () =>
        set({
          interviewId: null,
          question: null,
          transcript: "",
        }),
    }),
    {
      name: "interview-storage",
    }
  )
);
