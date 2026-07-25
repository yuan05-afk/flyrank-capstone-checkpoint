/**
 * Spam control: honeytrap field `_hp`.
 * Real forms never render/fill this field; bots that auto-fill every input trip it.
 * Also applies a light heuristic on free-text values (link density).
 */

const URL_RE = /https?:\/\/|www\./gi;

export function honeytrapTripped(payload: Record<string, unknown>): boolean {
  const hp = payload._hp;
  return typeof hp === "string" ? hp.trim().length > 0 : hp != null && hp !== "";
}

export function linkDensityScore(payload: Record<string, unknown>): number {
  let score = 0;
  for (const [key, value] of Object.entries(payload)) {
    if (key === "_hp" || key === "widgetId") continue;
    if (typeof value !== "string") continue;
    const matches = value.match(URL_RE);
    if (matches && matches.length >= 2) score += 0.5 * matches.length;
    if (matches && matches.length >= 3) score += 1;
  }
  return score;
}

export function scoreSpam(payload: Record<string, unknown>): {
  score: number;
  flagged: boolean;
  reason?: string;
} {
  if (honeytrapTripped(payload)) {
    return { score: 10, flagged: true, reason: "honeytrap" };
  }
  const links = linkDensityScore(payload);
  if (links >= 2) {
    return { score: links, flagged: true, reason: "link-density" };
  }
  return { score: links, flagged: false };
}
