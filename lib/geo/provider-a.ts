import type { GeoProvider, GeoResult } from "./types";

/**
 * Mock provider A - built like a real HTTP client (can throw / time out).
 * Toggle "down" via GEO_PROVIDER_A_DOWN=true or setProviderADown(true).
 */

let forceDown = process.env.GEO_PROVIDER_A_DOWN === "true";

export function setProviderADown(down: boolean) {
  forceDown = down;
}

export function isProviderADown() {
  return forceDown;
}

const MOCK_A: Record<string, Omit<GeoResult, "enriched" | "provider">> = {
  default: {
    country: "US",
    region: "CA",
    city: "San Francisco",
    lat: 37.7749,
    lon: -122.4194,
  },
};

export const providerA: GeoProvider = {
  name: "provider-a",
  async lookup(ip: string): Promise<GeoResult> {
    if (forceDown) {
      throw new Error("Provider A is down (GEO_PROVIDER_A_DOWN)");
    }
    // Simulate network latency
    await new Promise((r) => setTimeout(r, 15));
    if (ip === "timeout-test") {
      await new Promise((r) => setTimeout(r, 5000));
    }
    const data = MOCK_A[ip] ?? MOCK_A.default;
    return { enriched: true, provider: "provider-a", ...data };
  },
};
