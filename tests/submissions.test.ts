import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { widgetsService } from "@/services/widgets.service";
import { submissionsService } from "@/services/submissions.service";
import { submissionRateLimiter } from "@/lib/rate-limit/rate-limiter";
import { setProviderADown } from "@/lib/geo/provider-a";
import { setProviderBDown } from "@/lib/geo/provider-b";

const prisma = new PrismaClient();

describe("Tenant isolation (negative)", () => {
  let tenantAId: string;
  let tenantBId: string;
  let widgetAId: string;

  beforeAll(async () => {
    await prisma.submission.deleteMany();
    await prisma.widget.deleteMany();
    await prisma.tenant.deleteMany();

    const a = await prisma.tenant.create({
      data: {
        name: "Iso A",
        email: "iso-a@test.local",
        apiKey: "iso_a_key",
      },
    });
    const b = await prisma.tenant.create({
      data: {
        name: "Iso B",
        email: "iso-b@test.local",
        apiKey: "iso_b_key",
      },
    });
    tenantAId = a.id;
    tenantBId = b.id;

    const w = await widgetsService.create(tenantAId, {
      type: "signup",
      name: "A only",
      copy: { headline: "A" },
      fields: [{ name: "email", label: "Email", type: "email", required: true }],
      targeting: {},
    });
    widgetAId = w.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("tenant B cannot get tenant A's widget", async () => {
    const found = await widgetsService.get(tenantBId, widgetAId);
    expect(found).toBeNull();
  });

  it("tenant B cannot patch tenant A's widget", async () => {
    const updated = await widgetsService.update(tenantBId, widgetAId, {
      name: "hijack",
    });
    expect(updated).toBeNull();
  });

  it("tenant B cannot delete tenant A's widget", async () => {
    const ok = await widgetsService.remove(tenantBId, widgetAId);
    expect(ok).toBe(false);
    const still = await widgetsService.get(tenantAId, widgetAId);
    expect(still).not.toBeNull();
  });

  it("tenant A list does not include B widgets", async () => {
    await widgetsService.create(tenantBId, {
      type: "cta",
      name: "B widget",
      copy: {},
      fields: [],
      targeting: {},
    });
    const listA = await widgetsService.list(tenantAId);
    expect(listA.every((w) => w.id === widgetAId || w.name !== "B widget")).toBe(
      true
    );
    expect(listA.some((w) => w.name === "B widget")).toBe(false);
  });
});

describe("Submission pipeline", () => {
  let widgetId: string;

  beforeAll(async () => {
    submissionRateLimiter.reset();
    setProviderADown(false);
    setProviderBDown(false);

    let tenant = await prisma.tenant.findFirst({
      where: { apiKey: "iso_a_key" },
    });
    if (!tenant) {
      tenant = await prisma.tenant.create({
        data: {
          name: "Sub A",
          email: "sub-a@test.local",
          apiKey: "iso_a_key",
        },
      });
    }
    const w = await widgetsService.create(tenant.id, {
      type: "signup",
      name: "Submit target",
      copy: { headline: "Hi" },
      fields: [],
      targeting: {},
    });
    widgetId = w.id;
  });

  it("accepts a valid submission and enriches", async () => {
    const result = await submissionsService.submit({
      rawBody: JSON.stringify({
        widgetId,
        payload: { email: "ok@example.com" },
        _hp: "",
      }),
      origin: "http://localhost:5555",
      ip: "203.0.113.10",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.status).toBe(201);
      expect(result.body.verdict).toBe("ACCEPTED");
      expect(result.body.enrichment).toBeTruthy();
    }
  });

  it("rejects garbage JSON with 400", async () => {
    const result = await submissionsService.submit({
      rawBody: "{not-json",
      origin: "http://localhost:5555",
      ip: "203.0.113.11",
    });
    expect(result.ok).toBe(false);
    expect(result.status).toBe(400);
  });

  it("rejects oversized payload with 413", async () => {
    const result = await submissionsService.submit({
      rawBody: JSON.stringify({
        widgetId,
        payload: { note: "x".repeat(20_000) },
      }),
      origin: "http://localhost:5555",
      ip: "203.0.113.12",
    });
    expect(result.ok).toBe(false);
    expect(result.status).toBe(413);
  });

  it("flags honeytrap fills", async () => {
    submissionRateLimiter.reset();
    const result = await submissionsService.submit({
      rawBody: JSON.stringify({
        widgetId,
        payload: { email: "bot@x.com", _hp: "filled" },
      }),
      origin: "http://localhost:5555",
      ip: "203.0.113.13",
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.body.verdict).toBe("FLAGGED");
  });

  it("rate-limits a flood for same ip+widget", async () => {
    submissionRateLimiter.reset();
    const ip = "198.51.100.50";
    let got429 = false;
    for (let i = 0; i < 20; i++) {
      const result = await submissionsService.submit({
        rawBody: JSON.stringify({
          widgetId,
          payload: { email: `u${i}@ex.com` },
          _hp: "",
        }),
        origin: "http://localhost:5555",
        ip,
      });
      if (!result.ok && result.status === 429) {
        got429 = true;
        expect(result.headers?.["Retry-After"]).toBeTruthy();
        break;
      }
    }
    expect(got429).toBe(true);
  });

  it("still succeeds when both geo providers are down", async () => {
    submissionRateLimiter.reset();
    setProviderADown(true);
    setProviderBDown(true);
    const result = await submissionsService.submit({
      rawBody: JSON.stringify({
        widgetId,
        payload: { email: "geo-down@ex.com" },
        _hp: "",
      }),
      origin: "http://localhost:5555",
      ip: "203.0.113.99",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.body.enrichment).toEqual({
        enriched: false,
        reason: "all-providers-down",
      });
    }
    setProviderADown(false);
    setProviderBDown(false);
  });
});
