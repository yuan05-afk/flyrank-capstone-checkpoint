import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { widgetsService } from "@/services/widgets.service";
import { isOriginAllowed } from "@/lib/cors";
import { createHash } from "crypto";

const prisma = new PrismaClient();

describe("Public config delivery", () => {
  let widgetId: string;
  let updatedAt: string;

  beforeAll(async () => {
    const tenant = await prisma.tenant.upsert({
      where: { email: "config@test.local" },
      update: {},
      create: {
        name: "Config T",
        email: "config@test.local",
        apiKey: "config_key_test",
      },
    });
    await prisma.submission.deleteMany({
      where: { widget: { tenantId: tenant.id } },
    });
    await prisma.widget.deleteMany({ where: { tenantId: tenant.id } });
    const w = await widgetsService.create(tenant.id, {
      type: "popover",
      name: "Config widget",
      copy: { headline: "Cfg", body: "small" },
      fields: [{ name: "email", label: "Email", type: "email", required: true }],
      targeting: { paths: ["/"] },
    });
    widgetId = w.id;
    updatedAt = w.updatedAt;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("returns small cached-shaped payload", async () => {
    const config = await widgetsService.publicConfig(widgetId);
    expect(config).not.toBeNull();
    expect(config!.id).toBe(widgetId);
    expect(config!.copy).toBeTruthy();
    expect(JSON.stringify(config!).length).toBeLessThan(4096);

    const body = JSON.stringify(config);
    const etag = `"${createHash("sha1").update(body).digest("hex")}"`;
    expect(etag.length).toBeGreaterThan(10);
    expect(updatedAt).toBeTruthy();
  });

  it("returns null for unknown widget", async () => {
    const config = await widgetsService.publicConfig("does-not-exist");
    expect(config).toBeNull();
  });
});

describe("Dashboard live-test origin", () => {
  it("allows the configured app origin through the same submission boundary", () => {
    const previous = process.env.NEXT_PUBLIC_APP_URL;
    process.env.NEXT_PUBLIC_APP_URL =
      "https://checkpoint-preview.example/path-is-ignored";
    expect(isOriginAllowed("https://checkpoint-preview.example")).toBe(true);
    expect(isOriginAllowed("https://attacker.example")).toBe(false);
    if (previous === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
    else process.env.NEXT_PUBLIC_APP_URL = previous;
  });
});
