"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import VideoPanel from "./video-panel";
import { useInterviewStore } from "@/store/interview-store";
import { Badge } from "@/components/ui/badge";
import { Ban, Clock3, Mic, Send, Square, Video } from "lucide-react";

export default function InterviewInterface() {
  const {
    interviewId,
    question,
    setInterview,
    reset,
  } = useInterviewStore();

  const [answer, setAnswer] = useState("");
  const [capturedTranscript, setCapturedTranscript] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [interviewComplete, setInterviewComplete] = useState(false);
  const [interviewRejected, setInterviewRejected] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [questionNumber, setQuestionNumber] = useState(0);
  const [loading, setLoading] = useState(false);
  const [interviewIdInput, setInterviewIdInput] = useState("");
  const [timerSeconds, setTimerSeconds] = useState(20 * 60);
  const [sessionError, setSessionError] = useState("");
  const recognitionRef = useRef<any>(null);
  const finalTranscriptRef = useRef("");

  useEffect(() => {
    // Always force candidate to start manually with interview_id after login
    reset();
    setSessionStarted(false);
    setQuestionNumber(0);
  }, [reset]);

  useEffect(() => {
    if (typeof window !== "undefined" && "webkitSpeechRecognition" in window) {
      const SpeechRecognition =
        (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = "en-US";

      recognitionRef.current.onresult = (event: any) => {
        let interimTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscriptRef.current += `${transcript} `;
          } else {
            interimTranscript += transcript;
          }
        }

        setCapturedTranscript(`${finalTranscriptRef.current}${interimTranscript}`.trim());
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  useEffect(() => {
    if (!sessionStarted || !interviewId || interviewComplete || interviewRejected) return;

    const timer = setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (recognitionRef.current) {
            recognitionRef.current.stop();
            setIsRecording(false);
          }
          setSessionError("Time is up. The interview has been stopped.");
          setInterviewComplete(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [sessionStarted, interviewId, interviewComplete, interviewRejected]);

  const loadInterviewById = async () => {
    if (!interviewIdInput.trim()) return;

    setLoading(true);
    setSessionError("");
    setInterviewComplete(false);
    setInterviewRejected(false);
    setAnswer("");
    setCapturedTranscript("");
    finalTranscriptRef.current = "";
    setTimerSeconds(20 * 60);

    try {
      const response = await fetch(`/api/interviews/${interviewIdInput.trim()}/session`, {
        method: "GET",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Interview not found.");
      }

      if (data?.interview_id) {
        if (Boolean(data?.interview_complete)) {
          setSessionStarted(false);
          setSessionError("This interview is already completed for this ID.");
          return;
        }

        setInterview(data.interview_id, data.question || "");
        setSessionStarted(true);
        setQuestionNumber(1);
        setInterviewIdInput(data.interview_id);
        setInterviewComplete(false);
      }
    } catch (error) {
      console.error("Failed to load interview:", error);
      setSessionError(error instanceof Error ? error.message : "Failed to load interview.");
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async () => {
    if (!interviewId || !answer.trim()) return;

    setLoading(true);
    setSessionError("");
    try {
      const response = await fetch(`/api/interviews/${interviewId}/answer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          answer: answer.trim(),
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to submit answer.");
      }

      if (data.interview_complete) {
        setInterviewComplete(true);
        setIsRecording(false);
      } else if (data.next_question) {
        setInterview(data.interview_id || interviewId, data.next_question);
        setQuestionNumber((prev) => prev + 1);
        setAnswer("");
      } else {
        setSessionError("No next question returned from interview service.");
      }
    } catch (error) {
      console.error("Failed to submit answer:", error);
      setSessionError(error instanceof Error ? error.message : "Failed to submit answer.");
    } finally {
      setLoading(false);
    }
  };

  const startRecording = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition not supported in your browser.");
      return;
    }

    finalTranscriptRef.current = "";
    setCapturedTranscript("");
    recognitionRef.current.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);
    if (capturedTranscript.trim()) {
      setAnswer((prev) => `${prev}${prev ? " " : ""}${capturedTranscript.trim()}`.trim());
      setCapturedTranscript("");
      finalTranscriptRef.current = "";
    }
  };

  const rejectInterview = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
    setInterviewRejected(true);
    setInterviewComplete(true);
  };

  const timerLabel = `${Math.floor(timerSeconds / 60)
    .toString()
    .padStart(2, "0")}:${(timerSeconds % 60).toString().padStart(2, "0")}`;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="inline-flex items-center gap-2">
            <Video className="h-4 w-4" />
            Video Interview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <VideoPanel />
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={startRecording}
              disabled={!sessionStarted || !interviewId || interviewComplete || interviewRejected || isRecording}
            >
              <Mic className="mr-2 h-4 w-4" />
              Start Recording
            </Button>
            <Button
              variant="outline"
              onClick={stopRecording}
              disabled={!sessionStarted || !interviewId || interviewComplete || !isRecording}
            >
              <Square className="mr-2 h-4 w-4" />
              Stop
            </Button>
          </div>
          {capturedTranscript && (
            <div className="space-y-2 border-t pt-4">
              <Label>Captured Transcript</Label>
              <div className="rounded-md border bg-muted/30 p-3 text-sm">{capturedTranscript}</div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-4">
            <span>Interview Questions & Answers</span>
            <Badge variant={timerSeconds <= 300 ? "destructive" : "secondary"}>
              <Clock3 className="mr-1 h-3.5 w-3.5" />
              Timer: {timerLabel}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!sessionStarted || !interviewId ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Enter your interview ID from recruiter to start interview.
              </p>
              <div className="space-y-2">
                <Label htmlFor="interview-id">Interview ID</Label>
                <Input
                  id="interview-id"
                  value={interviewIdInput}
                  onChange={(e) => setInterviewIdInput(e.target.value)}
                  placeholder="Paste interview ID"
                />
              </div>
              <Button onClick={loadInterviewById} disabled={loading || !interviewIdInput.trim()} className="w-full">
                {loading ? "Loading..." : "Start Interview"}
              </Button>
              {sessionError && <p className="text-sm text-destructive">{sessionError}</p>}
            </div>
          ) : (
            <>
              <div className="rounded-md border bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground">Interview ID</p>
                <p className="font-mono text-sm">{interviewId}</p>
              </div>

              {question && (
                <div className="space-y-2">
                  <Label>{`Question ${questionNumber > 0 ? questionNumber : 1}`}</Label>
                  <div className="rounded-md border p-4 bg-muted/50">
                    <p className="font-medium">{question}</p>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="answer">Your Answer</Label>
                <textarea
                  id="answer"
                  className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="Type your answer or use voice recording..."
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  disabled={interviewComplete || interviewRejected}
                />
              </div>

              {!interviewComplete ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  <Button
                    onClick={submitAnswer}
                    disabled={loading || !answer.trim()}
                    className="w-full"
                  >
                    <Send className="mr-2 h-4 w-4" />
                    {loading ? "Submitting..." : "Submit Answer"}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={rejectInterview}
                    disabled={loading}
                    className="w-full"
                  >
                    <Ban className="mr-2 h-4 w-4" />
                    Reject
                  </Button>
                </div>
              ) : (
                <div className={`rounded-md border p-4 ${interviewRejected ? "bg-red-50 dark:bg-red-950" : "bg-green-50 dark:bg-green-950"}`}>
                  <p className={`font-medium ${interviewRejected ? "text-red-800 dark:text-red-200" : "text-green-800 dark:text-green-200"}`}>
                    {interviewRejected ? "Interview Rejected" : "Interview Completed"}
                  </p>
                  <p className={`mt-1 text-sm ${interviewRejected ? "text-red-600 dark:text-red-300" : "text-green-600 dark:text-green-300"}`}>
                    {interviewRejected
                      ? "Interview has been stopped before completion."
                      : "Thank you for participating in the interview."}
                  </p>
                </div>
              )}
              {sessionError && <p className="text-sm text-destructive">{sessionError}</p>}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
