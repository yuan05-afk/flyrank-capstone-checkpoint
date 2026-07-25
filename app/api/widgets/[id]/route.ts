import { resolveTenantFromRequest, unauthorized } from "@/lib/auth";
import { widgetsService } from "@/services/widgets.service";
import { ZodError } from "zod";

type Ctx = { params: { id: string } };

export async function GET(request: Request, { params }: Ctx) {
  const tenant = await resolveTenantFromRequest(request);
  if (!tenant) return unauthorized();
  const widget = await widgetsService.get(tenant.id, params.id);
  if (!widget) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ widget });
}

export async function PATCH(request: Request, { params }: Ctx) {
  const tenant = await resolveTenantFromRequest(request);
  if (!tenant) return unauthorized();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const widget = await widgetsService.update(tenant.id, params.id, body);
    if (!widget) return Response.json({ error: "Not found" }, { status: 404 });
    return Response.json({ widget });
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

export async function DELETE(request: Request, { params }: Ctx) {
  const tenant = await resolveTenantFromRequest(request);
  if (!tenant) return unauthorized();
  const ok = await widgetsService.remove(tenant.id, params.id);
  if (!ok) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ ok: true });
}
