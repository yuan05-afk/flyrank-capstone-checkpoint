import { cookies } from "next/headers";
import { tenantsRepository } from "@/repositories/tenants.repository";
import type { Tenant } from "@prisma/client";

export const SESSION_COOKIE = "wp_session";

export async function resolveTenantFromRequest(
  request: Request
): Promise<Tenant | null> {
  const header = request.headers.get("authorization");
  let apiKey: string | null = null;

  if (header?.startsWith("Bearer ")) {
    apiKey = header.slice(7).trim();
  }

  if (!apiKey) {
    const cookieHeader = request.headers.get("cookie") ?? "";
    const match = cookieHeader.match(/(?:^|;\s*)wp_session=([^;]+)/);
    if (match) apiKey = decodeURIComponent(match[1]);
  }

  if (!apiKey) {
    try {
      const jar = cookies();
      apiKey = jar.get(SESSION_COOKIE)?.value ?? null;
    } catch {
      // cookies() unavailable outside request context
    }
  }

  if (!apiKey) return null;
  return tenantsRepository.findByApiKey(apiKey);
}

export function unauthorized() {
  return Response.json(
    { error: "Unauthorized - provide Bearer API key or session cookie" },
    { status: 401 }
  );
}
