"use client";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

export default function VideoPanel() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      // Cleanup: stop all tracks when component unmounts
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  const startVideo = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: true,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
        setError(null);
      }
    } catch (err: any) {
      setError(
        err.name === "NotAllowedError"
          ? "Camera/microphone access denied. Please allow access and refresh."
          : "Failed to access camera/microphone."
      );
    }
  };

  const stopVideo = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
  };

  useEffect(() => {
    // Auto-start video when component mounts
    startVideo();
  }, []);

  return (
    <div className="space-y-2">
      <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-black">
        {error ? (
          <div className="flex h-full items-center justify-center text-white">
            <div className="text-center">
              <p className="text-sm">{error}</p>
              <Button onClick={startVideo} className="mt-2" size="sm">
                Retry
              </Button>
            </div>
          </div>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={false}
            className="h-full w-full object-cover"
          />
        )}
      </div>
      {stream && (
        <Button variant="outline" onClick={stopVideo} className="w-full" size="sm">
          Stop Camera
        </Button>
      )}
    </div>
  );
}

