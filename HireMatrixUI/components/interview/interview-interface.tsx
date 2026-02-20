"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import VideoPanel from "./video-panel";
import { useInterviewStore } from "@/store/interview-store";
import { Badge } from "@/components/ui/badge";
import { Clock3, Mic, Pause, Send, Square, Video } from "lucide-react";

export default function InterviewInterface() {
  const {
    interviewId,
    question,
    transcript,
    setInterview,
    setTranscript,
  } = useInterviewStore();

  const [answer, setAnswer] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [evaluation, setEvaluation] = useState("");
  const [risk, setRisk] = useState("");
  const [interviewComplete, setInterviewComplete] = useState(false);
  const [loading, setLoading] = useState(false);
  const [interviewIdInput, setInterviewIdInput] = useState("");
  const [timerSeconds, setTimerSeconds] = useState(20 * 60);
  const [sessionError, setSessionError] = useState("");
  const recognitionRef = useRef<any>(null);

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
        let finalTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + " ";
          } else {
            interimTranscript += transcript;
          }
        }

        setAnswer((prev) => prev + finalTranscript);
        setTranscript(finalTranscript);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
      };
    }
  }, []);

  useEffect(() => {
    if (!interviewId || interviewComplete) return;

    const timer = setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setInterviewComplete(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [interviewId, interviewComplete]);

  const loadInterviewById = async () => {
    if (!interviewIdInput.trim()) return;

    setLoading(true);
    setSessionError("");
    setInterviewComplete(false);
    setEvaluation("");
    setRisk("");
    setAnswer("");
    setTranscript("");
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
        setInterview(data.interview_id, data.question || "");
        setInterviewIdInput(data.interview_id);
        setInterviewComplete(Boolean(data?.interview_complete));
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

      setEvaluation(data.evaluation || "");
      setRisk(data.risk || "");

      if (data.interview_complete) {
        setInterviewComplete(true);
      } else if (data.next_question) {
        setInterview(data.interview_id || interviewId, data.next_question);
        setAnswer("");
      }
    } catch (error) {
      console.error("Failed to submit answer:", error);
      setSessionError(error instanceof Error ? error.message : "Failed to submit answer.");
    } finally {
      setLoading(false);
    }
  };

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition not supported in your browser.");
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  const pauseInterview = () => {
    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  };

  const stopInterview = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
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
          <div className="flex gap-2">
            <Button
              variant={isRecording ? "destructive" : "default"}
              onClick={toggleRecording}
              disabled={!interviewId || interviewComplete}
            >
              <Mic className="mr-2 h-4 w-4" />
              {isRecording ? "Stop Recording" : "Start Recording"}
            </Button>
            <Button
              variant="outline"
              onClick={pauseInterview}
              disabled={!isRecording}
            >
              <Pause className="mr-2 h-4 w-4" />
              Pause
            </Button>
            <Button
              variant="destructive"
              onClick={stopInterview}
              disabled={!interviewId}
            >
              <Square className="mr-2 h-4 w-4" />
              Stop/Close
            </Button>
          </div>
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
          {!interviewId ? (
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
                  <Label>Current Question</Label>
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
                  disabled={interviewComplete}
                />
              </div>

              {transcript && (
                <div className="space-y-2">
                  <Label>Captured Transcript</Label>
                  <div className="rounded-md border p-3 bg-muted/30 text-sm">
                    {transcript}
                  </div>
                </div>
              )}

              {evaluation && (
                <div className="space-y-2">
                  <Label>Evaluation</Label>
                  <div className="rounded-md border p-3 bg-muted/30 text-sm">
                    {evaluation}
                  </div>
                </div>
              )}

              {risk && (
                <div className="space-y-2">
                  <Label>Risk Level</Label>
                  <Badge
                    variant={
                      risk.toLowerCase().includes("low")
                        ? "default"
                        : risk.toLowerCase().includes("high")
                        ? "destructive"
                        : "secondary"
                    }
                  >
                    {risk}
                  </Badge>
                </div>
              )}

              {!interviewComplete ? (
                <Button
                  onClick={submitAnswer}
                  disabled={loading || !answer.trim()}
                  className="w-full"
                >
                  <Send className="mr-2 h-4 w-4" />
                  {loading ? "Submitting..." : "Submit Answer"}
                </Button>
              ) : (
                <div className="rounded-md border p-4 bg-green-50 dark:bg-green-950">
                  <p className="font-medium text-green-800 dark:text-green-200">
                    Interview Completed
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-300 mt-1">
                    Thank you for participating in the interview.
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
