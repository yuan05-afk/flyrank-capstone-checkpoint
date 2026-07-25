/**
 * Source of truth for the one-line customer embed.
 * Browser delivery: /widget.js (public/widget.js mirrors this bootstrap).
 */

export function embedScriptTag(appUrl: string, widgetId: string): string {
  const base = appUrl.replace(/\/$/, "");
  return `<script src="${base}/widget.js" data-widget-id="${widgetId}" async></script>`;
}

export const EMBED_BOOTSTRAP_COMMENT = `
Loads /widget.js which fetches GET /api/widgets/:id/config (CORS-open, cached)
and renders via widget-render into the host page DOM, then POSTs submissions
to /api/submissions with allowlisted Origin.
`.trim();
