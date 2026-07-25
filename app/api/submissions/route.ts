import {
  clientIp,
  corsHeadersForSubmission,
  isOriginAllowed,
} from "@/lib/cors";
import { submissionsService } from "@/services/submissions.service";

export async function OPTIONS(request: Request) {
  const origin = request.headers.get("origin");
  const headers = corsHeadersForSubmission(origin);

  if (!origin || !isOriginAllowed(origin)) {
    return Response.json(
      { error: "Origin not allowed" },
      { status: 403, headers }
    );
  }

  return new Response(null, { status: 204, headers });
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const headers = new Headers(corsHeadersForSubmission(origin));

  // Require Origin on write (browser embeds always send it; reject bare curl without allowlisted Origin for demo honesty)
  if (!origin || !isOriginAllowed(origin)) {
    return Response.json(
      { error: "Origin not allowed or missing" },
      { status: 403, headers }
    );
  }

  const rawBody = await request.text();
  const result = await submissionsService.submit({
    rawBody,
    origin,
    ip: clientIp(request),
  });

  if (!result.ok && result.headers) {
    for (const [k, v] of Object.entries(result.headers)) {
      headers.set(k, v);
    }
  }

  return Response.json(result.body, { status: result.status, headers });
}
