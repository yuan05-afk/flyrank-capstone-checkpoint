import { describe, it, expect, beforeEach } from "vitest";
import {
  InMemoryTokenBucket,
  submissionRateLimiter,
} from "@/lib/rate-limit/rate-limiter";
import { scoreSpam } from "@/lib/spam/heuristics";
import {
  assertPayloadSize,
  submissionBodySchema,
  MAX_PAYLOAD_BYTES,
} from "@/lib/validation";
import {
  corsHeadersForSubmission,
  corsHeadersOpen,
  isOriginAllowed,
} from "@/lib/cors";

describe("CORS helpers", () => {
  it("allows configured origins and rejects others", () => {
    expect(isOriginAllowed("http://localhost:5555")).toBe(true);
    expect(isOriginAllowed("https://evil.example")).toBe(false);
    expect(isOriginAllowed(null)).toBe(false);
  });

  it("submission CORS echoes origin, never *", () => {
    const headers = corsHeadersForSubmission("http://localhost:5555") as Record<
      string,
      string
    >;
    expect(headers["Access-Control-Allow-Origin"]).toBe(
      "http://localhost:5555"
    );
    expect(headers["Access-Control-Allow-Origin"]).not.toBe("*");

    const denied = corsHeadersForSubmission("https://evil.example") as Record<
      string,
      string
    >;
    expect(denied["Access-Control-Allow-Origin"]).toBeUndefined();
  });

  it("config CORS is open with *", () => {
    const headers = corsHeadersOpen() as Record<string, string>;
    expect(headers["Access-Control-Allow-Origin"]).toBe("*");
  });
});

describe("Validation", () => {
  it("rejects malformed submission bodies", () => {
    const bad = submissionBodySchema.safeParse({ payload: {} });
    expect(bad.success).toBe(false);

    const good = submissionBodySchema.safeParse({
      widgetId: "abc",
      payload: { email: "a@b.co" },
      _hp: "",
    });
    expect(good.success).toBe(true);
  });

  it("rejects oversized payloads with 413 semantics", () => {
    const big = "x".repeat(MAX_PAYLOAD_BYTES + 10);
    expect(() => assertPayloadSize(big)).toThrow(/too large/i);
    try {
      assertPayloadSize(big);
    } catch (e) {
      expect((e as { status?: number }).status).toBe(413);
    }
  });
});

describe("Rate limiter", () => {
  beforeEach(() => {
    submissionRateLimiter.reset();
  });

  it("trips under a burst without throwing", () => {
    const limiter = new InMemoryTokenBucket({
      capacity: 5,
      refillPerSec: 0.01,
    });
    const key = "1.2.3.4:widgetX";
    let limited = 0;
    for (let i = 0; i < 20; i++) {
      const r = limiter.take(key);
      if (!r.allowed) {
        limited++;
        expect(r.retryAfterSec).toBeGreaterThan(0);
      }
    }
    expect(limited).toBeGreaterThan(0);
  });

  it("shared submission limiter trips after capacity", () => {
    const key = "flood-ip:w1";
    let lastAllowed = true;
    for (let i = 0; i < 15; i++) {
      lastAllowed = submissionRateLimiter.take(key).allowed;
    }
    expect(lastAllowed).toBe(false);
  });
});

describe("Spam honeytrap", () => {
  it("flags filled honeytrap", () => {
    const r = scoreSpam({ email: "a@b.co", _hp: "http://spam" });
    expect(r.flagged).toBe(true);
    expect(r.reason).toBe("honeytrap");
  });

  it("allows empty honeytrap", () => {
    const r = scoreSpam({ email: "a@b.co", _hp: "" });
    expect(r.flagged).toBe(false);
  });
});
