import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

async function main() {
  await prisma.submission.deleteMany();
  await prisma.widget.deleteMany();
  await prisma.tenant.deleteMany();

  const tenantA = await prisma.tenant.create({
    data: {
      name: "North Pier Customs",
      email: "a@checkpoint.local",
      apiKey: "tenant_a_key_demo_001",
    },
  });

  const tenantB = await prisma.tenant.create({
    data: {
      name: "South Gate Manifest",
      email: "b@checkpoint.local",
      apiKey: "tenant_b_key_demo_002",
    },
  });

  const widgetA = await prisma.widget.create({
    data: {
      tenantId: tenantA.id,
      type: "signup",
      name: "Pier newsletter desk",
      copy: JSON.stringify({
        headline: "Clearance desk",
        body: "Leave your particulars. We'll stamp the ledger.",
        buttonLabel: "File entry",
        successMessage: "ACCEPTED - entry filed.",
      }),
      fields: JSON.stringify([
        { name: "name", label: "Name", type: "text", required: true },
        { name: "email", label: "Email", type: "email", required: true },
        { name: "note", label: "Note", type: "textarea", required: false },
      ]),
      targeting: JSON.stringify({
        paths: ["/"],
        devices: ["desktop", "mobile"],
      }),
      active: true,
    },
  });

  await prisma.widget.create({
    data: {
      tenantId: tenantB.id,
      type: "cta",
      name: "Gate B CTA (should be invisible to A)",
      copy: JSON.stringify({
        headline: "Tenant B only",
        body: "Isolation check.",
        buttonLabel: "Go",
      }),
      fields: JSON.stringify([]),
      targeting: JSON.stringify({}),
      active: true,
    },
  });

  const fixturePath = path.join(process.cwd(), "fixtures", "customer-site.html");
  if (fs.existsSync(fixturePath)) {
    let html = fs.readFileSync(fixturePath, "utf8");
    html = html.replace(
      /data-widget-id="[^"]*"/,
      `data-widget-id="${widgetA.id}"`
    );
    fs.writeFileSync(fixturePath, html);
  }

  const smokePath = path.join(process.cwd(), "scripts", "smoke-submit.mjs");
  if (fs.existsSync(smokePath)) {
    let smoke = fs.readFileSync(smokePath, "utf8");
    smoke = smoke.replace(/const WID = "[^"]*"/, `const WID = "${widgetA.id}"`);
    fs.writeFileSync(smokePath, smoke);
  }

  console.log("Seeded tenants:");
  console.log("  Tenant A:", tenantA.name, "apiKey=", tenantA.apiKey);
  console.log("  Tenant B:", tenantB.name, "apiKey=", tenantB.apiKey);
  console.log("  Demo widget A id:", widgetA.id);
  console.log(
    "  Embed:",
    `<script src="http://localhost:3000/widget.js" data-widget-id="${widgetA.id}" async></script>`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
