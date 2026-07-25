import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE } from "@/lib/auth";
import { tenantsRepository } from "@/repositories/tenants.repository";
import { widgetsService } from "@/services/widgets.service";
import { submissionsService } from "@/services/submissions.service";
import { BrandLockup } from "@/components/BrandMark";
import { DashboardClient } from "./dashboard-client";

async function clearSession() {
  "use server";
  cookies().delete(SESSION_COOKIE);
  redirect("/login");
}

export default async function DashboardPage() {
  const apiKey = cookies().get(SESSION_COOKIE)?.value;
  if (!apiKey) redirect("/login");

  const tenant = await tenantsRepository.findByApiKey(apiKey);
  if (!tenant) redirect("/login");

  const [widgets, desk] = await Promise.all([
    widgetsService.list(tenant.id),
    submissionsService.deskSnapshot(tenant.id),
  ]);

  return (
    <main className="min-h-screen bg-canvas">
      <header className="px-5 sm:px-6 py-3.5 flex items-center justify-between border-b border-line/80 bg-surface/75 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <BrandLockup />
          <span className="hidden sm:inline-flex items-center gap-2 text-[10px] font-mono tracking-[0.14em] uppercase text-signal px-2.5 py-1 rounded-full bg-signal-fog border border-signal/15">
            <span className="signal-status-dot !w-1.5 !h-1.5" />
            {tenant.name}
          </span>
        </div>
        <form action={clearSession}>
          <button type="submit" className="btn-ghost text-sm">
            Sign out
          </button>
        </form>
      </header>
      <DashboardClient
        widgets={widgets}
        submissions={desk.submissions}
        stats={desk.stats}
      />
    </main>
  );
}
