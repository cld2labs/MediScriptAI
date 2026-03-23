import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const SYSTEM_PROMPT = `You are a medical AI assistant. You are given a transcript of a clinical visit broken into numbered audio segments.
Task 1: Reconstruct the dialogue. Determine if each segment is spoken by the 'Doctor' or 'Patient' based on context. Combine adjacent segments if they are the same speaker.
Task 2: Generate a clinical summary formatted as SOAP notes.
Task 3: Extract medical keywords.
You MUST respond in strict JSON matching this exact structure:
{
"utterances": [ { "speaker": "Doctor" | "Patient", "text": "...", "start": 0.0 } ],
"soapNotes": { "chiefComplaint": "...", "symptoms": ["..."], "assessment": "...", "recommendation": "..." },
"keywords": { "symptoms": ["..."], "medications": ["..."], "diagnoses": ["..."] }
}`;

type SoapNotes = {
  chiefComplaint: string;
  symptoms: string[];
  assessment: string;
  recommendation: string;
};

type Keywords = {
  symptoms: string[];
  medications: string[];
  diagnoses: string[];
};

type Utterance = {
  speaker: "Doctor" | "Patient";
  text: string;
  start: number;
};

type OpenAIResponse = {
  utterances: Utterance[];
  soapNotes: SoapNotes;
  keywords: Keywords;
};

export async function POST(request: NextRequest) {
  try {
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      return NextResponse.json({ success: false, error: "Missing OPENAI_API_KEY" }, { status: 500 });
    }

    const formData = await request.formData();
    const file = formData.get("audio") ?? formData.get("file");
    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: "Missing or invalid audio file in FormData (use field 'audio' or 'file')" },
        { status: 400 }
      );
    }

    const openai = new OpenAI({ apiKey: openaiKey });

    // Step 1: Whisper transcription with timestamps (verbose_json includes segments)
    const transcription = await openai.audio.transcriptions.create({
      file,
      model: "whisper-1",
      response_format: "verbose_json",
    });

    const segments = transcription.segments ?? [];
    if (!segments.length) {
      return NextResponse.json(
        { success: false, error: "Whisper returned no segments (cannot build numbered transcript)" },
        { status: 400 }
      );
    }

    const transcriptForLLM = segments
      .map((seg, idx) => {
        const start = typeof seg.start === "number" ? seg.start : Number(seg.start ?? 0);
        const text = typeof seg.text === "string" ? seg.text : "";
        return `[ID: ${idx}] (Start: ${start.toFixed(1)}s): ${text}`;
      })
      .join("\n");

    // Step 2: GPT-4o SOAP notes + speaker reconstruction
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: transcriptForLLM },
      ],
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ success: false, error: "OpenAI returned no content" }, { status: 500 });
    }

    let parsed: OpenAIResponse;
    try {
      parsed = JSON.parse(content) as OpenAIResponse;
    } catch {
      return NextResponse.json({ success: false, error: "OpenAI response was not valid JSON" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      utterances: parsed.utterances,
      soapNotes: parsed.soapNotes,
      keywords: parsed.keywords,
    });
  } catch (err) {
    console.error("process-audio error:", err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Processing failed" },
      { status: 500 }
    );
  }
}
