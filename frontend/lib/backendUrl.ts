/**
 * Base URL of the FastAPI service for server-side proxy routes (no trailing slash).
 * Read at request time so Docker/runtime env from docker-compose.yml applies correctly.
 */
export function getBackendInternalUrl(): string {
  const raw = process.env.BACKEND_INTERNAL_URL?.replace(/\/$/, "");
  return raw && raw.length > 0 ? raw : "http://127.0.0.1:8000";
}
