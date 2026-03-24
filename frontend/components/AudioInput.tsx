"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, Square, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

const MAX_RECORDING_SECONDS = 600; // 10 minutes

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

type AudioInputProps = {
  onProcessAudio?: (file: File | Blob) => void;
};

export function AudioInput({ onProcessAudio }: AudioInputProps) {
  const [mode, setMode] = useState<"record" | "upload">("record");
  const [isRecording, setIsRecording] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [audio, setAudio] = useState<File | Blob | null>(null);
  const [uploadFileName, setUploadFileName] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Timer while recording; enforce 10-minute limit
  useEffect(() => {
    if (!isRecording) return;
    timerRef.current = setInterval(() => {
      setElapsedSeconds((prev) => {
        if (prev >= MAX_RECORDING_SECONDS - 1) {
          return MAX_RECORDING_SECONDS;
        }
        return prev + 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  // Auto-stop at 10 minutes
  useEffect(() => {
    if (isRecording && elapsedSeconds >= MAX_RECORDING_SECONDS) {
      mediaRecorderRef.current?.state === "recording" && mediaRecorderRef.current.stop();
    }
  }, [isRecording, elapsedSeconds]);

  const stopRecording = useCallback(() => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state !== "recording") return;
    mediaRecorderRef.current.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsRecording(false);
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setAudio(blob);
        setElapsedSeconds(0);
      };

      recorder.start(1000);
      setAudio(null);
      setUploadFileName(null);
      setElapsedSeconds(0);
      setIsRecording(true);
    } catch (err) {
      console.error("Failed to start recording:", err);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && (file.type === "audio/mpeg" || file.type === "audio/wav" || /\.(mp3|wav)$/i.test(file.name))) {
      setAudio(file);
      setUploadFileName(file.name);
      setElapsedSeconds(0);
      setIsRecording(false);
    }
    e.target.value = "";
  };

  const clearAudio = useCallback(() => {
    setAudio(null);
    setUploadFileName(null);
    setElapsedSeconds(0);
  }, []);

  const audioReady = audio !== null;
  const displayLabel = uploadFileName ?? (audio ? "Audio ready" : null);

  return (
    <div className="space-y-4">
      {/* Record / Upload tabs */}
      <div className="flex rounded-lg border border-border bg-muted/50 p-1">
        <button
          type="button"
          onClick={() => setMode("record")}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
            mode === "record"
              ? "bg-card text-card-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Mic className="size-4" />
          Record
        </button>
        <button
          type="button"
          onClick={() => setMode("upload")}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
            mode === "upload"
              ? "bg-card text-card-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Upload className="size-4" />
          Upload
        </button>
      </div>

      {mode === "record" && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            {!isRecording ? (
              <button
                type="button"
                onClick={startRecording}
                className="inline-flex items-center gap-2 rounded-lg bg-[#7C3AED] px-4 py-2.5 text-sm font-semibold text-[#EDE9FE] shadow-lg shadow-[#6D28D9]/35 ring-1 ring-[#A78BFA]/25 transition-all hover:bg-[#6D28D9] hover:shadow-[#7C3AED]/40 active:scale-[0.98]"
              >
            <Mic className="size-4" />
                Start Recording
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={stopRecording}
                  className="inline-flex items-center gap-2 rounded-lg border border-[#242032] bg-muted px-4 py-2.5 text-sm font-medium text-[#EDE9FE] shadow-sm ring-2 ring-[#8B5CF6]/50 transition-all animate-pulse hover:bg-accent hover:ring-[#A78BFA]/60"
                >
                  <Square className="size-4 fill-current text-[#A78BFA]" />
                  Stop Recording
                </button>
                <span
                  className={cn(
                    "tabular-nums font-medium text-[#EDE9FE]",
                    isRecording && "animate-pulse text-[#A78BFA]"
                  )}
                >
                  {formatTime(elapsedSeconds)}
                  {elapsedSeconds >= MAX_RECORDING_SECONDS && " (max reached)"}
                </span>
              </>
            )}
          </div>
          {isRecording && (
            <p className="text-xs text-[#EDE9FE]/90">
              Recording will stop automatically at 10 minutes.
            </p>
          )}
        </div>
      )}

      {mode === "upload" && (
        <div className="rounded-lg border border-dashed border-border bg-muted/30 p-4">
          <label className="flex cursor-pointer flex-col items-center gap-2 text-muted-foreground">
            <Upload className="size-8 text-muted-foreground/70" />
            <span className="text-sm font-medium">Choose .mp3 or .wav file</span>
            <input
              type="file"
              accept=".mp3,.wav,audio/mpeg,audio/wav"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        </div>
      )}

      {/* Audio ready state + Process with AI */}
      {audioReady && (
        <div className="space-y-3 rounded-lg border border-[#242032] bg-[#8B5CF6]/10 p-3 ring-1 ring-[#8B5CF6]/20">
          <p className="text-sm font-medium text-[#EDE9FE]">
            {displayLabel}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => audio && onProcessAudio?.(audio)}
              className="rounded-lg bg-[#8B5CF6] px-4 py-2.5 text-sm font-bold text-[#05030A] shadow-[0_0_15px_rgba(139,92,246,0.3)] transition-all hover:bg-[#7C3AED] hover:shadow-[0_0_20px_rgba(124,58,237,0.35)] active:scale-[0.98]"
            >
              Process with AI
            </button>
            <button
              type="button"
              onClick={clearAudio}
              className="rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-card-foreground transition-colors hover:bg-accent"
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
