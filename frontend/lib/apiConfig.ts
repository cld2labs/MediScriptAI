/**
 * Base URL for browser-side API calls. Empty string = same origin (recommended
 * with Next.js rewrites to the FastAPI backend via BACKEND_INTERNAL_URL).
 */
export function getPublicApiBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (raw === undefined || raw === "") {
    return "";
  }
  return raw.replace(/\/$/, "");
}

export function apiUrl(path: string): string {
  const base = getPublicApiBaseUrl();
  const p = path.startsWith("/") ? path : `/${path}`;
  return base ? `${base}${p}` : p;
}
