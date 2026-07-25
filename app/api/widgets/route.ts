import { resolveTenantFromRequest, unauthorized } from "@/lib/auth";
import { widgetsService } from "@/services/widgets.service";
import { ZodError } from "zod";

export async function GET(request: Request) {
  const tenant = await resolveTenantFromRequest(request);
  if (!tenant) return unauthorized();
  const widgets = await widgetsService.list(tenant.id);
  return Response.json({ widgets });
}

export async function POST(request: Request) {
  const tenant = await resolveTenantFromRequest(request);
  if (!tenant) return unauthorized();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const widget = await widgetsService.create(tenant.id, body);
    return Response.json({ widget }, { status: 201 });
  } catch (err) {
    if (err instanceof ZodError) {
      return Response.json(
        { error: "Validation failed", details: err.flatten() },
        { status: 400 }
      );
    }
    throw err;
  }
}
