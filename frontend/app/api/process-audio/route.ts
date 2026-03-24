import { NextRequest, NextResponse } from "next/server";

import { getBackendInternalUrl } from "@/lib/backendUrl";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const upstream = await fetch(`${getBackendInternalUrl()}/api/process-audio`, {
    method: "POST",
    body: formData,
  });
  const text = await upstream.text();
  const contentType = upstream.headers.get("content-type") ?? "application/json";
  return new NextResponse(text, { status: upstream.status, headers: { "Content-Type": contentType } });
}
