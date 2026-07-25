import { describe, it, expect, beforeEach } from "vitest";
import {
  setProviderADown,
  isProviderADown,
  providerA,
} from "@/lib/geo/provider-a";
import { setProviderBDown, providerB } from "@/lib/geo/provider-b";
import { enrichIp } from "@/lib/geo/fallback-chain";

describe("Geo fallback chain", () => {
  beforeEach(() => {
    setProviderADown(false);
    setProviderBDown(false);
  });

  it("enriches with provider A when up", async () => {
    const result = await enrichIp("8.8.8.8");
    expect(result.enriched).toBe(true);
    if (result.enriched) {
      expect(result.provider).toBe("provider-a");
      expect(result.city).toBeTruthy();
    }
  });

  it("falls back to provider B when A is down", async () => {
    setProviderADown(true);
    expect(isProviderADown()).toBe(true);
    const result = await enrichIp("8.8.8.8");
    expect(result.enriched).toBe(true);
    if (result.enriched) {
      expect(result.provider).toBe("provider-b");
    }
  });

  it("degrades to unenriched when both are down (does not throw)", async () => {
    setProviderADown(true);
    setProviderBDown(true);
    const result = await enrichIp("8.8.8.8");
    expect(result.enriched).toBe(false);
    if (!result.enriched) {
      expect(result.reason).toBe("all-providers-down");
    }
  });

  it("provider interfaces can throw like real HTTP clients", async () => {
    setProviderADown(true);
    await expect(providerA.lookup("1.1.1.1")).rejects.toThrow(/down/i);
    setProviderBDown(true);
    await expect(providerB.lookup("1.1.1.1")).rejects.toThrow(/down/i);
  });
});
