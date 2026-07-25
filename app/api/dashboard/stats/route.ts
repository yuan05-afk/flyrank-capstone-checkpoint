import { resolveTenantFromRequest, unauthorized } from "@/lib/auth";
import { submissionsService } from "@/services/submissions.service";

export async function GET(request: Request) {
  const tenant = await resolveTenantFromRequest(request);
  if (!tenant) return unauthorized();

  const url = new URL(request.url);
  const widgetId = url.searchParams.get("widgetId") ?? undefined;
  const include = url.searchParams.get("include");

  if (include === "list") {
    const submissions = await submissionsService.listForTenant(
      tenant.id,
      widgetId
    );
    return Response.json({ submissions });
  }

  const stats = await submissionsService.stats(tenant.id);
  return Response.json({ stats });
}
