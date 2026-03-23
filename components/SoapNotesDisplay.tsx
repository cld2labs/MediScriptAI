"use client";

import { useEffect, useState } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export type SoapNotes = {
  chiefComplaint: string;
  symptoms: string[];
  assessment: string;
  recommendation: string;
};

type SoapNotesDisplayProps = {
  soapNotes: SoapNotes;
  onUpdate?: (updatedNotes: SoapNotes) => void;
};

export function SoapNotesDisplay({ soapNotes, onUpdate }: SoapNotesDisplayProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedNotes, setEditedNotes] = useState<SoapNotes>(soapNotes);
  const [symptomsDraftText, setSymptomsDraftText] = useState(soapNotes.symptoms.join("\n"));

  useEffect(() => {
    if (!isEditing) {
      setEditedNotes(soapNotes);
      setSymptomsDraftText(soapNotes.symptoms.join("\n"));
    }
  }, [isEditing, soapNotes]);

  const canEdit = typeof onUpdate === "function";
  const { chiefComplaint, symptoms, assessment, recommendation } = isEditing
    ? editedNotes
    : soapNotes;

  return (
    <div className="space-y-4 text-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[#A78BFA]">
            SOAP Notes
          </p>
        </div>
        {!isEditing && canEdit && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setIsEditing(true)}
            className="gap-2"
          >
            <Pencil className="size-4" />
            Edit
          </Button>
        )}
      </div>

      {!isEditing ? (
        <>
          <section className="rounded-r-lg border border-[#242032] border-l-4 border-l-[#8B5CF6] bg-muted/30 p-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#A78BFA]">
              Chief Complaint
            </h3>
            <p className="mt-2 text-[#EDE9FE]">{chiefComplaint || "—"}</p>
          </section>
          <section className="rounded-r-lg border border-[#242032] border-l-4 border-l-[#8B5CF6] bg-muted/30 p-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#A78BFA]">
              Symptoms
            </h3>
            {symptoms?.length ? (
              <ul className="mt-2 list-inside list-disc space-y-0.5 text-[#EDE9FE]">
                {symptoms.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-[#A78BFA]/80">—</p>
            )}
          </section>
          <section className="rounded-r-lg border border-[#242032] border-l-4 border-l-[#8B5CF6] bg-muted/30 p-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#A78BFA]">
              Assessment
            </h3>
            <p className="mt-2 text-[#EDE9FE]">{assessment || "—"}</p>
          </section>
          <section className="rounded-r-lg border border-[#242032] border-l-4 border-l-[#8B5CF6] bg-muted/30 p-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#A78BFA]">
              Recommendation
            </h3>
            <p className="mt-2 text-[#EDE9FE]">{recommendation || "—"}</p>
          </section>
        </>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-[#A78BFA]">
              Chief Complaint
            </label>
            <Input
              value={chiefComplaint ?? ""}
              onChange={(e) =>
                setEditedNotes((prev) => ({ ...prev, chiefComplaint: e.target.value }))
              }
              placeholder="e.g., Headache for one week"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-[#A78BFA]">
              Symptoms (one per line)
            </label>
            <Textarea
              value={symptomsDraftText}
              onChange={(e) => setSymptomsDraftText(e.target.value)}
              className="min-h-[110px]"
              placeholder="e.g., Headache\nMild nausea"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-[#A78BFA]">
              Assessment
            </label>
            <Textarea
              value={assessment ?? ""}
              onChange={(e) =>
                setEditedNotes((prev) => ({ ...prev, assessment: e.target.value }))
              }
              className="min-h-[90px]"
              placeholder="Enter the clinical assessment..."
            />
          </div>

          <div className="grid gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-[#A78BFA]">
              Recommendation
            </label>
            <Textarea
              value={recommendation ?? ""}
              onChange={(e) =>
                setEditedNotes((prev) => ({ ...prev, recommendation: e.target.value }))
              }
              className="min-h-[90px]"
              placeholder="Enter the recommended next steps..."
            />
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setEditedNotes(soapNotes);
                setSymptomsDraftText(soapNotes.symptoms.join("\n"));
                setIsEditing(false);
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                // Use the textarea draft to allow Enter/spacing while editing.
                const draftSymptomsArray = symptomsDraftText
                  .split("\n")
                  .map((s) => s.trim())
                  .filter((s) => s.length > 0);
                const next: SoapNotes = {
                  ...editedNotes,
                  symptoms: draftSymptomsArray,
                };
                onUpdate?.(next);
                setEditedNotes(next);
                setIsEditing(false);
              }}
            >
              Save changes
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
