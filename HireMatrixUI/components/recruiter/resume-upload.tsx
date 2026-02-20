"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { talentAPI } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import axios from "axios";
import { FileUp } from "lucide-react";

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const msg = error.response?.data?.detail ?? error.response?.data?.message ?? error.message;
    if (typeof msg === "string") return msg;
    if (Array.isArray(msg)) return msg.map((e: { msg?: string }) => e?.msg ?? JSON.stringify(e)).join(", ");
    return error.message || "Request failed";
  }
  return error instanceof Error ? error.message : "Failed to upload resume. Please try again.";
}

export default function ResumeUpload() {
  const [file, setFile] = useState<File | null>(null);

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error("No file selected");

      const formData = new FormData();
      formData.append("file", file);

      const response = await talentAPI.post("/upload-resume/", formData, {
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      });

      return response.data;
    },
    onSuccess: () => {
      setFile(null);
      const fileInput = document.getElementById("resume-file") as HTMLInputElement;
      if (fileInput) fileInput.value = "";
    },
  });

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="resume-file">Select Resume File</Label>
        <Input
          id="resume-file"
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
      </div>

      <Button
        onClick={() => uploadMutation.mutate()}
        disabled={uploadMutation.isPending || !file}
        className="w-full"
      >
        <FileUp className="mr-2 h-4 w-4" />
        {uploadMutation.isPending ? "Uploading..." : "Upload Resume"}
      </Button>

      {uploadMutation.isSuccess && (
        <p className="text-sm text-green-600">
          Resume uploaded successfully and indexed in vector database.
        </p>
      )}

      {uploadMutation.isError && (
        <p className="text-sm text-destructive">
          {getErrorMessage(uploadMutation.error)}
        </p>
      )}
    </div>
  );
}
