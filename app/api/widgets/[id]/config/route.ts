import { corsHeadersOpen } from "@/lib/cors";
import { widgetsService } from "@/services/widgets.service";
import { createHash } from "crypto";

type Ctx = { params: { id: string } };

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeadersOpen() });
}

export async function GET(request: Request, { params }: Ctx) {
  const config = await widgetsService.publicConfig(params.id);
  const headers = new Headers(corsHeadersOpen());

  if (!config) {
    return Response.json(
      { error: "Not found" },
      { status: 404, headers }
    );
  }

  const body = JSON.stringify(config);
  const etag = `"${createHash("sha1").update(body).digest("hex")}"`;

  headers.set("ETag", etag);
  headers.set(
    "Cache-Control",
    "public, max-age=60, s-maxage=300, stale-while-revalidate=600"
  );
  headers.set("Content-Type", "application/json");
  headers.set("Last-Modified", new Date(config.updatedAt).toUTCString());

  const inm = request.headers.get("if-none-match");
  if (inm && inm === etag) {
    return new Response(null, { status: 304, headers });
  }

  return new Response(body, { status: 200, headers });
}
