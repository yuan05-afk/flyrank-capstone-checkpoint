import type { GeoProvider, GeoResult } from "./types";

/**
 * Mock provider B - fallback when A fails/times out.
 */

const MOCK_B: Omit<GeoResult, "enriched" | "provider"> = {
  country: "US",
  region: "NY",
  city: "New York",
  lat: 40.7128,
  lon: -74.006,
};

let forceDown = process.env.GEO_PROVIDER_B_DOWN === "true";

export function setProviderBDown(down: boolean) {
  forceDown = down;
}

export function isProviderBDown() {
  return forceDown;
}

export const providerB: GeoProvider = {
  name: "provider-b",
  async lookup(_ip: string): Promise<GeoResult> {
    if (forceDown) {
      throw new Error("Provider B is down");
    }
    await new Promise((r) => setTimeout(r, 10));
    return { enriched: true, provider: "provider-b", ...MOCK_B };
  },
};
