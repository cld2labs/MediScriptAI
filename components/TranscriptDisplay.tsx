"use client";

import type { ReactNode } from "react";

export type Utterance = {
  speaker: string;
  text: string;
  start: number;
  end: number;
};

export type Keywords = {
  symptoms: string[];
  medications: string[];
  diagnoses: string[];
};

function timeToMMSS(time: number): string {
  // Accept either milliseconds or seconds and normalize to seconds.
  const totalSeconds = time < 1000 ? time : time / 1000;
  const m = Math.floor(totalSeconds / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

type Span = { start: number; end: number; type: "symptom" | "medication" | "diagnosis" };

function highlightKeywords(text: string, keywords: Keywords): ReactNode[] {
  const spans: Span[] = [];

  const add = (arr: string[], type: Span["type"]) => {
    arr.forEach((k) => {
      const re = new RegExp(escapeRegex(k), "gi");
      let m: RegExpExecArray | null;
      while ((m = re.exec(text)) !== null) {
        spans.push({ start: m.index, end: m.index + m[0].length, type });
      }
    });
  };
  add(keywords.symptoms, "symptom");
  add(keywords.medications, "medication");
  add(keywords.diagnoses, "diagnosis");

  spans.sort(
    (a, b) =>
      a.start !== b.start ? a.start - b.start : b.end - b.start - (a.end - a.start)
  );

  const merged: Span[] = [];
  for (const s of spans) {
    if (merged.length && s.start < merged[merged.length - 1].end) continue;
    merged.push(s);
  }

  const result: ReactNode[] = [];
  let last = 0;
  merged.forEach(({ start, end, type }, i) => {
    if (start > last) result.push(text.slice(last, start));
    const cls =
      type === "symptom"
        ? "rounded border border-[#6D28D9]/50 bg-[#7C3AED]/25 px-1 text-[#EDE9FE]"
        : type === "medication"
          ? "rounded border border-[#8B5CF6]/45 bg-[#8B5CF6]/20 px-1 text-[#EDE9FE]"
          : "rounded border border-[#A78BFA]/50 bg-[#6D28D9]/30 px-1 text-[#EDE9FE]";
    result.push(
      <span key={`${start}-${end}-${i}`} className={cls}>
        {text.slice(start, end)}
      </span>
    );
    last = end;
  });
  if (last < text.length) result.push(text.slice(last));
  return result.length ? result : [text];
}

type TranscriptDisplayProps = {
  utterances: Utterance[];
  keywords: Keywords;
};

export function TranscriptDisplay({ utterances, keywords }: TranscriptDisplayProps) {
  return (
    <div className="space-y-3">
      {utterances.map((u, i) => (
        <div
          key={`${u.start}-${i}`}
          className={[
            "rounded-xl border border-[#242032] border-l-4 border-l-[#8B5CF6] px-3 py-2 text-sm text-[#EDE9FE]",
            u.speaker === "Doctor" ? "bg-card" : "bg-muted/40",
          ].join(" ")}
        >
          <div className="min-w-0">
            <span className="font-semibold text-[#A78BFA]">
              [{timeToMMSS(u.start)}] {u.speaker}:
            </span>{" "}
            <span className="text-[#EDE9FE]">
              {highlightKeywords(u.text, keywords)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
