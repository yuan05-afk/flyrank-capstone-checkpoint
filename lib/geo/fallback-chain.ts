import { providerA } from "./provider-a";
import { providerB } from "./provider-b";
import type { GeoLookup, GeoProvider } from "./types";

const DEFAULT_TIMEOUT_MS = 800;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`timeout after ${ms}ms`)), ms);
    promise.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      }
    );
  });
}

/**
 * Tries A, falls to B on failure/timeout, degrades to {enriched:false}
 * if both are down - never throws to the submission pipeline.
 */
export async function enrichIp(
  ip: string,
  opts?: {
    timeoutMs?: number;
    primary?: GeoProvider;
    secondary?: GeoProvider;
  }
): Promise<GeoLookup> {
  const timeoutMs = opts?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const primary = opts?.primary ?? providerA;
  const secondary = opts?.secondary ?? providerB;

  try {
    return await withTimeout(primary.lookup(ip), timeoutMs);
  } catch (errA) {
    console.warn(`[geo] ${primary.name} failed:`, (errA as Error).message);
    try {
      return await withTimeout(secondary.lookup(ip), timeoutMs);
    } catch (errB) {
      console.warn(`[geo] ${secondary.name} failed:`, (errB as Error).message);
      return { enriched: false, reason: "all-providers-down" };
    }
  }
}
