# Geo enrichment fallback chain

## Pattern

```ts
interface GeoProvider {
  name: string;
  lookup(ip: string): Promise<GeoResult>; // may throw or hang
}

enrichIp(ip): Promise<GeoResult | { enriched: false }>
```

Ordering:

1. Try provider A with a hard timeout.
2. On throw/timeout → provider B with the same timeout.
3. If both fail → `{ enriched: false, reason: "all-providers-down" }`.

**Contract:** enrichment failure must never fail the primary write (submission). The pipeline stores the miss and returns 201.

## Why mock both providers

The only intentional mocks in this project. Same interface a real HTTP client would have, so swapping in ipinfo/maxmind later is a file change, not a redesign. Provider A exposes `GEO_PROVIDER_A_DOWN=true` / `setProviderADown(true)` so fallback demos and tests are deterministic.

## Double-check when reusing

- Timeouts must wrap the promise - a hung TCP connect should not stall the request forever.
- Log provider failures; do not surface them as 5xx to the embed.
- Never let `enrichIp` throw past the submission service.
