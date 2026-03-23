import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const SYSTEM_PROMPT =
  "You are an expert medical coder. Review the provided SOAP notes and suggest 1-3 appropriate CPT codes (procedures/E&M) and 1-3 ICD-10 codes (diagnoses). Return ONLY valid JSON matching this schema: { \"cpt\": [{ \"code\": \"string\", \"description\": \"string\" }], \"icd10\": [{ \"code\": \"string\", \"description\": \"string\" }] }";

type BillingCode = {
  code: string;
  description: string;
};

type BillingCodes = {
  cpt: BillingCode[];
  icd10: BillingCode[];
};

export async function POST(request: NextRequest) {
  try {
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      return NextResponse.json({ success: false, error: "Missing OPENAI_API_KEY" }, { status: 500 });
    }

    const soapNotes = await request.json();

    const openai = new OpenAI({ apiKey: openaiKey });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: JSON.stringify(soapNotes ?? {}) },
      ],
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ success: false, error: "OpenAI returned no content" }, { status: 500 });
    }

    let parsed: BillingCodes;
    try {
      parsed = JSON.parse(content) as BillingCodes;
    } catch {
      return NextResponse.json({ success: false, error: "OpenAI response was not valid JSON" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      cpt: parsed.cpt ?? [],
      icd10: parsed.icd10 ?? [],
    });
  } catch (err) {
    console.error("generate-billing error:", err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Billing generation failed" },
      { status: 500 }
    );
  }
}

