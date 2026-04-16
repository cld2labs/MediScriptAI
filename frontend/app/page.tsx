"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AudioInput } from "@/components/AudioInput";
import { TranscriptDisplay, type Utterance, type Keywords } from "@/components/TranscriptDisplay";
import { SoapNotesDisplay, type SoapNotes } from "@/components/SoapNotesDisplay";
import { ExportButtons, type BillingCodes } from "@/components/ExportButtons";
import { apiUrl } from "@/lib/apiConfig";

export default function Home() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [utterances, setUtterances] = useState<Utterance[]>([]);
  const [soapNotes, setSoapNotes] = useState<SoapNotes | null>(null);
  const [keywords, setKeywords] = useState<Keywords | null>(null);
  const [isGeneratingBilling, setIsGeneratingBilling] = useState(false);
  const [billingCodes, setBillingCodes] = useState<BillingCodes | null>(null);

  useEffect(() => {
    // If the doctor edits the SOAP notes, billing codes should be regenerated.
    setBillingCodes(null);
  }, [soapNotes]);

  const handleProcessAudio = useCallback(async (file: File | Blob) => {
    setIsProcessing(true);
    setUtterances([]);
    setSoapNotes(null);
    setKeywords(null);
    setBillingCodes(null);
    try {
      const formData = new FormData();
      formData.append("audio", file instanceof File ? file : new File([file], "audio.webm", { type: file.type }));
      const res = await fetch(apiUrl("/api/process-audio"), {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Request failed");
      if (data.success) {
        setUtterances(data.utterances ?? []);
        setSoapNotes(data.soapNotes ?? null);
        setKeywords(data.keywords ?? null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const generateBilling = useCallback(async () => {
    if (!soapNotes) return;
    setIsGeneratingBilling(true);
    setBillingCodes(null);
    try {
      const res = await fetch(apiUrl("/api/generate-billing"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(soapNotes),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Billing generation failed");
      if (data.success) {
        setBillingCodes({
          cpt: data.cpt ?? [],
          icd10: data.icd10 ?? [],
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingBilling(false);
    }
  }, [soapNotes]);

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* App title, tagline, disclaimer, and logo */}
        <header className="mb-8 flex justify-between items-start gap-4">
          <div className="min-w-0 text-left">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              MediScript AI
            </h1>
            <p className="mt-1 text-muted-foreground">
              From conversation to SOAP notes, effortlessly.
            </p>
            <div
              role="alert"
              className="mt-3 rounded-md border border-amber-500/30 bg-amber-950/80 px-3 py-2 text-sm font-medium text-amber-100"
            >
              This demo is not a clinical documentation system and should not be
              used for medical decision-making.
            </div>
          </div>
          <Image
            src="/logo.png"
            alt="Cloud2 Labs"
            width={140}
            height={50}
            className="shrink-0 opacity-90 transition-opacity hover:opacity-100"
          />
        </header>

        {/* Two-column grid */}
        <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
          {/* Left column: Audio Input & Transcript */}
          <section className="flex flex-col">
            <div className="flex-1 rounded-xl border border-border bg-card text-card-foreground shadow-md shadow-black/20">
              <div className="p-6">
                <h2 className="mb-4 text-lg font-semibold tracking-tight text-foreground">
                  Audio Input & Transcript
                </h2>
                <div className="space-y-4">
                  <AudioInput onProcessAudio={handleProcessAudio} />
                  {isProcessing && (
                    <div className="flex min-h-[120px] flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-muted/30 py-6">
                      <Loader2 className="size-8 animate-spin text-muted-foreground" />
                      <p className="text-center text-sm text-muted-foreground">
                        Generating transcript and notes… This usually takes 30–60 seconds.
                      </p>
                    </div>
                  )}
                  {!isProcessing && utterances.length > 0 && keywords && (
                    <div className="rounded-lg border border-border bg-card/80 p-4">
                      <TranscriptDisplay utterances={utterances} keywords={keywords} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Right column: AI SOAP Notes & Export */}
          <section className="flex flex-col">
            <div className="flex-1 rounded-xl border border-border bg-card text-card-foreground shadow-md shadow-black/20">
              <div className="p-6">
                <h2 className="mb-4 text-lg font-semibold tracking-tight text-foreground">
                  AI SOAP Notes & Export
                </h2>
                {isProcessing && (
                  <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-muted/30 py-6">
                    <Loader2 className="size-8 animate-spin text-muted-foreground" />
                    <p className="text-center text-sm text-muted-foreground">
                      Generating transcript and notes… This usually takes 30–60 seconds.
                    </p>
                  </div>
                )}
                {!isProcessing && soapNotes && (
                  <div className="space-y-4">
                    <div className="rounded-lg border border-border bg-card/80 p-4">
                      <SoapNotesDisplay
                        soapNotes={soapNotes}
                        onUpdate={(notes) => setSoapNotes(notes)}
                      />
                    </div>
                    {/* Billing generation UI */}
                    {!isGeneratingBilling && billingCodes === null && (
                      <div className="pt-1">
                        <Button
                          type="button"
                          onClick={generateBilling}
                          variant="secondary"
                          className="w-full justify-center gap-2"
                        >
                          <span aria-hidden>✨</span>
                          Generate Billing Codes (CPT & ICD-10)
                        </Button>
                      </div>
                    )}

                    {isGeneratingBilling && (
                      <div className="flex min-h-[120px] flex-col items-center justify-center gap-3 rounded-lg border border-border bg-muted/30 px-4 py-6">
                        <Loader2 className="size-8 animate-spin text-muted-foreground" />
                        <p className="text-center text-sm text-muted-foreground">
                          Analyzing clinical notes...
                        </p>
                      </div>
                    )}

                    {!isGeneratingBilling && billingCodes && (
                      <Card className="border-border bg-muted/40 p-4">
                        <div className="grid gap-5 md:grid-cols-2">
                          <div className="space-y-3">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-[#A78BFA]">
                              ICD-10 Diagnoses
                            </h3>
                            {billingCodes.icd10.length ? (
                              <div className="space-y-2">
                                {billingCodes.icd10.map((c, idx) => (
                                  <div key={`${c.code}-${idx}`} className="flex items-start gap-2">
                                    <Badge variant="outline" className="font-mono">
                                      {c.code}
                                    </Badge>
                                    <p className="text-sm text-[#EDE9FE]">{c.description}</p>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground">—</p>
                            )}
                          </div>

                          <div className="space-y-3">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-[#A78BFA]">
                              CPT Procedures
                            </h3>
                            {billingCodes.cpt.length ? (
                              <div className="space-y-2">
                                {billingCodes.cpt.map((c, idx) => (
                                  <div key={`${c.code}-${idx}`} className="flex items-start gap-2">
                                    <Badge variant="outline" className="font-mono">
                                      {c.code}
                                    </Badge>
                                    <p className="text-sm text-[#EDE9FE]">{c.description}</p>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground">—</p>
                            )}
                          </div>
                        </div>
                      </Card>
                    )}

                    <ExportButtons
                      utterances={utterances}
                      soapNotes={soapNotes}
                      billingCodes={billingCodes}
                    />
                  </div>
                )}
                {!isProcessing && !soapNotes && (
                  <div className="flex min-h-[200px] items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 text-muted-foreground">
                    SOAP notes placeholder
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
