import { NextRequest, NextResponse } from "next/server";

import { getBackendInternalUrl } from "@/lib/backendUrl";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const contentType = request.headers.get("content-type") ?? "application/json";
  const upstream = await fetch(`${getBackendInternalUrl()}/api/generate-billing`, {
    method: "POST",
    headers: { "Content-Type": contentType },
    body,
  });
  const text = await upstream.text();
  const outType = upstream.headers.get("content-type") ?? "application/json";
  return new NextResponse(text, { status: upstream.status, headers: { "Content-Type": outType } });
}
