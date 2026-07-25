/**
 * CORS helpers.
 * - Config endpoint: CORS-open (public, non-sensitive).
 * - Submissions: echo/allowlist Origin only - never `*`.
 */

const DEFAULT_ALLOWLIST = [
  "http://localhost:5555",
  "http://127.0.0.1:5555",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "null", // file:// origin in some browsers
];

function allowlist(): string[] {
  const extra = process.env.CORS_ALLOWLIST?.split(",").map((s) => s.trim()).filter(Boolean);
  return [...DEFAULT_ALLOWLIST, ...(extra ?? [])];
}

export function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return false;
  if (origin === "null") return allowlist().includes("null");
  return allowlist().some((o) => o === origin);
}

/** Echo Origin when allowlisted; never returns `*` for write endpoints. */
export function corsHeadersForSubmission(origin: string | null): HeadersInit {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
  if (origin && isOriginAllowed(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }
  return headers;
}

/** Config is meant to be fetched by anyone embedding - CORS-open. */
export function corsHeadersOpen(): HeadersInit {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, If-None-Match",
    "Access-Control-Max-Age": "86400",
  };
}

export function clientIp(request: Request): string {
  const xf = request.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0]!.trim();
  const real = request.headers.get("x-real-ip");
  if (real) return real.trim();
  return "127.0.0.1";
}
