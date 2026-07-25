import {
  assertPayloadSize,
  submissionBodySchema,
  MAX_PAYLOAD_BYTES,
} from "@/lib/validation";
import { submissionRateLimiter } from "@/lib/rate-limit/rate-limiter";
import { scoreSpam } from "@/lib/spam/heuristics";
import { enrichIp } from "@/lib/geo/fallback-chain";
import { notifySubmission } from "@/lib/email/notify";
import { widgetsRepository } from "@/repositories/widgets.repository";
import { submissionsRepository } from "@/repositories/submissions.repository";

export type SubmissionResult =
  | {
      ok: true;
      status: 201;
      body: {
        id: string;
        verdict: string;
        spamScore: number;
        enrichment: unknown;
      };
    }
  | {
      ok: false;
      status: number;
      body: { error: string; details?: unknown };
      headers?: Record<string, string>;
    };

export const submissionsService = {
  async submit(opts: {
    rawBody: string;
    origin: string | null;
    ip: string;
  }): Promise<SubmissionResult> {
    try {
      assertPayloadSize(opts.rawBody);
    } catch {
      return {
        ok: false,
        status: 413,
        body: {
          error: `Payload exceeds ${MAX_PAYLOAD_BYTES} bytes`,
        },
      };
    }

    let json: unknown;
    try {
      json = JSON.parse(opts.rawBody);
    } catch {
      return { ok: false, status: 400, body: { error: "Invalid JSON" } };
    }

    const parsed = submissionBodySchema.safeParse(json);
    if (!parsed.success) {
      return {
        ok: false,
        status: 400,
        body: { error: "Validation failed", details: parsed.error.flatten() },
      };
    }

    const { widgetId, payload: bodyPayload } = parsed.data;
    // Merge top-level _hp into payload for spam check
    const payload: Record<string, unknown> = {
      ...bodyPayload,
      ...(parsed.data._hp !== undefined ? { _hp: parsed.data._hp } : {}),
    };
    // Also accept _hp nested in payload
    if (
      typeof (json as { payload?: { _hp?: unknown } }).payload?._hp !==
      "undefined"
    ) {
      payload._hp = (json as { payload: { _hp: unknown } }).payload._hp;
    }

    const widget = await widgetsRepository.findByIdPublic(widgetId);
    if (!widget) {
      return { ok: false, status: 404, body: { error: "Widget not found" } };
    }

    const rateKey = `${opts.ip}:${widgetId}`;
    const rate = submissionRateLimiter.take(rateKey);
    if (!rate.allowed) {
      return {
        ok: false,
        status: 429,
        body: { error: "Rate limit exceeded" },
        headers: { "Retry-After": String(rate.retryAfterSec) },
      };
    }

    const spam = scoreSpam(payload);
    let verdict = "ACCEPTED";
    if (spam.flagged) verdict = "FLAGGED";

    const enrichment = await enrichIp(opts.ip);

    // Strip honeytrap from stored payload
    const storedPayload = { ...payload };
    delete storedPayload._hp;

    const row = await submissionsRepository.create({
      widgetId,
      payload: JSON.stringify(storedPayload),
      enrichment: JSON.stringify(enrichment),
      spamScore: spam.score,
      verdict,
      origin: opts.origin,
      ip: opts.ip,
    });

    // Safe side effect - never affects response
    void notifySubmission({
      widgetId,
      submissionId: row.id,
      verdict,
      payload: storedPayload,
    });

    return {
      ok: true,
      status: 201,
      body: {
        id: row.id,
        verdict,
        spamScore: spam.score,
        enrichment,
      },
    };
  },

  async listForTenant(tenantId: string, widgetId?: string) {
    const rows = await submissionsRepository.listForTenantWidget(
      tenantId,
      widgetId
    );
    return rows.map((r) => ({
      id: r.id,
      widgetId: r.widgetId,
      widget: "widget" in r ? (r as { widget: unknown }).widget : undefined,
      payload: JSON.parse(r.payload),
      enrichment: JSON.parse(r.enrichment),
      spamScore: r.spamScore,
      verdict: r.verdict,
      origin: r.origin,
      ip: r.ip,
      createdAt: r.createdAt.toISOString(),
    }));
  },

  async stats(tenantId: string) {
    const rows = await submissionsRepository.statsForTenant(tenantId);
    const total = rows.length;
    const flagged = rows.filter(
      (r) => r.verdict === "FLAGGED" || r.spamScore >= 2
    ).length;
    const accepted = rows.filter((r) => r.verdict === "ACCEPTED").length;

    const byDay = new Map<string, number>();
    const locations = new Map<string, number>();

    for (const r of rows) {
      const day = r.createdAt.toISOString().slice(0, 10);
      byDay.set(day, (byDay.get(day) ?? 0) + 1);
      try {
        const enr = JSON.parse(r.enrichment) as {
          enriched?: boolean;
          city?: string;
          country?: string;
          lat?: number;
          lon?: number;
        };
        if (enr.enriched) {
          const label = [enr.city, enr.country].filter(Boolean).join(", ");
          if (label) locations.set(label, (locations.get(label) ?? 0) + 1);
        }
      } catch {
        /* ignore */
      }
    }

    const topLocations = Array.from(locations.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([label, count]) => ({ label, count }));

    const countsOverTime = Array.from(byDay.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, count]) => ({ date, count }));

    return { total, accepted, flagged, countsOverTime, topLocations };
  },
};
