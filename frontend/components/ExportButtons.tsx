"use client";

import { useState, useCallback, useRef } from "react";
import { Copy, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Utterance } from "@/components/TranscriptDisplay";
import type { SoapNotes } from "@/components/SoapNotesDisplay";

function timeToMMSS(time: number): string {
  // Accept either milliseconds or seconds and normalize to seconds.
  const totalSeconds = time < 1000 ? time : time / 1000;
  const m = Math.floor(totalSeconds / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function generateExportText(
  format: "txt" | "md",
  utterances: Utterance[],
  soapNotes: SoapNotes,
  billingCodes?: BillingCodes | null
): string {
  const lines: string[] = [];

  if (format === "md") {
    lines.push("## Visit Notes", "");
    for (const u of utterances) {
      lines.push(`**${u.speaker}** [${timeToMMSS(u.start)}]: ${u.text}`);
    }
    lines.push("", "## SOAP Notes", "");
    lines.push("### Chief Complaint", "", soapNotes.chiefComplaint || "—", "");
    lines.push("### Symptoms", "");
    if (soapNotes.symptoms?.length) {
      soapNotes.symptoms.forEach((s) => lines.push(`- ${s}`));
    } else {
      lines.push("—");
    }
    lines.push("", "### Assessment", "", soapNotes.assessment || "—", "");
    lines.push("", "### Recommendation", "", soapNotes.recommendation || "—");
  } else {
    lines.push("VISIT NOTES / TRANSCRIPT", "");
    for (const u of utterances) {
      lines.push(`[${timeToMMSS(u.start)}] ${u.speaker}: ${u.text}`);
    }
    lines.push("", "SOAP NOTES", "");
    lines.push("Chief Complaint:", soapNotes.chiefComplaint || "—", "");
    lines.push("Symptoms:");
    if (soapNotes.symptoms?.length) {
      soapNotes.symptoms.forEach((s) => lines.push(`  - ${s}`));
    } else {
      lines.push("  —");
    }
    lines.push("", "Assessment:", soapNotes.assessment || "—", "");
    lines.push("", "Recommendation:", soapNotes.recommendation || "—");
  }

  if (billingCodes) {
    const hasCpt = (billingCodes.cpt ?? []).length > 0;
    const hasIcd = (billingCodes.icd10 ?? []).length > 0;
    if (hasCpt || hasIcd) {
      if (format === "md") {
        lines.push("", "## BILLING CODES", "");
        if (hasIcd) {
          lines.push("### ICD-10 Diagnoses");
          billingCodes.icd10.forEach((c) => lines.push(`- **${c.code}**: ${c.description}`));
          lines.push("");
        }
        if (hasCpt) {
          lines.push("### CPT Procedures");
          billingCodes.cpt.forEach((c) => lines.push(`- **${c.code}**: ${c.description}`));
        }
      } else {
        lines.push("", "BILLING CODES", "");
        if (hasIcd) {
          lines.push("ICD-10 Diagnoses:");
          billingCodes.icd10.forEach((c) => lines.push(`- ${c.code}: ${c.description}`));
          lines.push("");
        }
        if (hasCpt) {
          lines.push("CPT Procedures:");
          billingCodes.cpt.forEach((c) => lines.push(`- ${c.code}: ${c.description}`));
        }
      }
    }
  }

  return lines.join("\n");
}

function downloadFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

type ExportButtonsProps = {
  utterances: Utterance[];
  soapNotes: SoapNotes | null;
  billingCodes?: BillingCodes | null;
};

export type BillingCode = { code: string; description: string };
export type BillingCodes = { cpt: BillingCode[]; icd10: BillingCode[] };

export function ExportButtons({ utterances, soapNotes, billingCodes }: ExportButtonsProps) {
  const [copied, setCopied] = useState(false);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCopy = useCallback(() => {
    if (!soapNotes) return;
    const text = generateExportText("txt", utterances, soapNotes, billingCodes);
    navigator.clipboard.writeText(text).then(() => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      setCopied(true);
      copyTimeoutRef.current = setTimeout(() => {
        setCopied(false);
        copyTimeoutRef.current = null;
      }, 2000);
    });
  }, [utterances, soapNotes, billingCodes]);

  const handleDownloadTxt = useCallback(() => {
    if (!soapNotes) return;
    const text = generateExportText("txt", utterances, soapNotes, billingCodes);
    downloadFile("mediscript-notes.txt", text, "text/plain");
  }, [utterances, soapNotes, billingCodes]);

  const handleDownloadMd = useCallback(() => {
    if (!soapNotes) return;
    const text = generateExportText("md", utterances, soapNotes, billingCodes);
    downloadFile("mediscript-notes.md", text, "text/markdown");
  }, [utterances, soapNotes, billingCodes]);

  if (!soapNotes || utterances.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleCopy}
        className="gap-1.5"
      >
        <Copy className="size-4" />
        {copied ? "Copied!" : "Copy to Clipboard"}
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleDownloadTxt}
        className="gap-1.5"
      >
        <Download className="size-4" />
        Download TXT
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleDownloadMd}
        className="gap-1.5"
      >
        <Download className="size-4" />
        Download Markdown
      </Button>
    </div>
  );
}
