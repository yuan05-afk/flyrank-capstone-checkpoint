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

  const widgetPopover = await prisma.widget.create({
    data: {
      tenantId: tenantA.id,
      type: "popover",
      name: "Pier waitlist popover",
      copy: JSON.stringify({
        headline: "Join the pier waitlist",
        body: "Get berth alerts before the next tide window.",
        buttonLabel: "Join waitlist",
        successMessage: "ACCEPTED - waitlist stamped.",
      }),
      fields: JSON.stringify([
        { name: "name", label: "Name", type: "text", required: true },
        { name: "email", label: "Email", type: "email", required: true },
      ]),
      targeting: JSON.stringify({
        paths: ["/"],
        devices: ["desktop", "mobile"],
      }),
      active: true,
    },
  });

  const widgetCta = await prisma.widget.create({
    data: {
      tenantId: tenantA.id,
      type: "cta",
      name: "Pier berth CTA",
      copy: JSON.stringify({
        headline: "Reserve a berth",
        body: "Tap through when the next clearance window opens.",
        buttonLabel: "Request berth",
        successMessage: "ACCEPTED - request stamped.",
      }),
      fields: JSON.stringify([
        { name: "email", label: "Email", type: "email", required: true },
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

  const sampleSubs = [
    {
      widgetId: widgetA.id,
      name: "Aya Santos",
      email: "aya@harbor.example",
      note: "Interested in weekly pier updates",
      verdict: "ACCEPTED",
      spamScore: 0,
      city: "Singapore",
      country: "SG",
      daysAgo: 0,
    },
    {
      widgetId: widgetA.id,
      name: "Kenji Mori",
      email: "kenji@coast.example",
      note: "Looking for berth availability alerts",
      verdict: "ACCEPTED",
      spamScore: 0,
      city: "Tokyo",
      country: "JP",
      daysAgo: 1,
    },
    {
      widgetId: widgetA.id,
      name: "Maya Reyes",
      email: "maya@reef.example",
      note: "",
      verdict: "ACCEPTED",
      spamScore: 0,
      city: "Manila",
      country: "PH",
      daysAgo: 1,
    },
    {
      widgetId: widgetPopover.id,
      name: "Liam Chen",
      email: "liam@bay.example",
      note: "Waitlist for weekend slots",
      verdict: "ACCEPTED",
      spamScore: 0,
      city: "Hong Kong",
      country: "HK",
      daysAgo: 2,
    },
    {
      widgetId: widgetA.id,
      name: "Promo Bot",
      email: "dealz@spam.example",
      note: "BUY NOW FREE CRYPTO CLICK HERE https://spam.example",
      verdict: "FLAGGED",
      spamScore: 3,
      city: "Unknown",
      country: "XX",
      daysAgo: 2,
    },
    {
      widgetId: widgetPopover.id,
      name: "Sofia Tan",
      email: "sofia@marina.example",
      note: "Prefer morning launches",
      verdict: "ACCEPTED",
      spamScore: 0,
      city: "Singapore",
      country: "SG",
      daysAgo: 3,
    },
    {
      widgetId: widgetA.id,
      name: "Noah Park",
      email: "noah@dock.example",
      note: "Newsletter only",
      verdict: "ACCEPTED",
      spamScore: 0,
      city: "Seoul",
      country: "KR",
      daysAgo: 4,
    },
    {
      widgetId: widgetA.id,
      name: "Click Farm",
      email: "x@x.x",
      note: "viagra casino loan http://bad.example",
      verdict: "FLAGGED",
      spamScore: 4,
      city: "Unknown",
      country: "XX",
      daysAgo: 5,
    },
  ];

  for (const sample of sampleSubs) {
    const createdAt = new Date(Date.now() - sample.daysAgo * 24 * 60 * 60 * 1000);
    await prisma.submission.create({
      data: {
        widgetId: sample.widgetId,
        payload: JSON.stringify({
          name: sample.name,
          email: sample.email,
          ...(sample.note ? { note: sample.note } : {}),
        }),
        enrichment: JSON.stringify({
          enriched: sample.country !== "XX",
          city: sample.city,
          country: sample.country,
          lat: sample.country === "SG" ? 1.35 : sample.country === "JP" ? 35.68 : 14.6,
          lon: sample.country === "SG" ? 103.82 : sample.country === "JP" ? 139.69 : 120.98,
          provider: "seed",
        }),
        spamScore: sample.spamScore,
        verdict: sample.verdict,
        origin: "https://checkpoint-flyrank.vercel.app",
        ip: "203.0.113." + String(10 + sample.daysAgo),
        createdAt,
      },
    });
  }

  const fixturePath = path.join(process.cwd(), "fixtures", "customer-site.html");
  if (fs.existsSync(fixturePath)) {
    let html = fs.readFileSync(fixturePath, "utf8");
    html = html.replace(
      /var seeded = "[^"]*"/,
      `var seeded = "${widgetA.id}"`
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
  console.log("  Demo popover id:", widgetPopover.id);
  console.log("  Demo CTA id:", widgetCta.id);
  console.log("  Tenant A widgets: 3 (demo target)");
  console.log("  Sample submissions:", sampleSubs.length);
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
