/**
 * Trim demo tenant widgets down to DEMO_WIDGET_TARGET (default 3).
 * Keeps the oldest widgets (usually the seed pier set) and deletes extras.
 *
 *   pnpm exec tsx scripts/trim-widgets.ts
 */
import { PrismaClient } from "@prisma/client";
import { DEMO_WIDGET_TARGET } from "../config/demo.config";

const prisma = new PrismaClient();
const DEMO_KEY = process.env.DEMO_TENANT_KEY || "tenant_a_key_demo_001";
const keep = Number(process.env.KEEP_WIDGETS || DEMO_WIDGET_TARGET);

async function main() {
  const tenant = await prisma.tenant.findUnique({ where: { apiKey: DEMO_KEY } });
  if (!tenant) throw new Error(`Tenant not found for key ${DEMO_KEY}`);

  const widgets = await prisma.widget.findMany({
    where: { tenantId: tenant.id },
    orderBy: { createdAt: "asc" },
  });

  if (widgets.length <= keep) {
    console.log(
      `tenant ${tenant.name}: ${widgets.length} widgets (already <= ${keep}), nothing to trim`
    );
    return;
  }

  const remove = widgets.slice(keep);
  for (const widget of remove) {
    await prisma.submission.deleteMany({ where: { widgetId: widget.id } });
    await prisma.widget.delete({ where: { id: widget.id } });
    console.log(`deleted ${widget.name} (${widget.id})`);
  }

  const remaining = await prisma.widget.findMany({
    where: { tenantId: tenant.id },
    orderBy: { createdAt: "asc" },
  });
  console.log(
    `kept ${remaining.length}: ${remaining.map((w) => w.name).join(", ")}`
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
