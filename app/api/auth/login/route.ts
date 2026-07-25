import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/auth";
import { tenantsRepository } from "@/repositories/tenants.repository";

export async function POST(request: Request) {
  let body: { apiKey?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const apiKey = body.apiKey?.trim();
  if (!apiKey) {
    return Response.json({ error: "apiKey required" }, { status: 400 });
  }

  const tenant = await tenantsRepository.findByApiKey(apiKey);
  if (!tenant) {
    return Response.json({ error: "Invalid API key" }, { status: 401 });
  }

  const jar = cookies();
  jar.set(SESSION_COOKIE, apiKey, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return Response.json({
    ok: true,
    tenant: { id: tenant.id, name: tenant.name, email: tenant.email },
  });
}

export async function DELETE() {
  const jar = cookies();
  jar.delete(SESSION_COOKIE);
  return Response.json({ ok: true });
}
