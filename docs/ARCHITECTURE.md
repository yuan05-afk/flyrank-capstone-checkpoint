# Architecture - Embeddable Widget Platform

## Layers (strict)

```
Route handler  →  Service  →  Repository  →  Prisma / SQLite
```

- **Repositories** - raw data access only. No business rules. Every query that touches widgets/submissions is tenant-scoped when the caller is admin.
- **Services** - validation orchestration, enrichment, spam scoring, embed snippet generation. Side effects that aren't the primary write are wrapped so they cannot throw past the handler.
- **Route handlers** - parse request, call one service method, map result to HTTP. No Prisma imports in routes.

## Auth (chosen scheme)

**Seeded API key per tenant** (simpler than magic-link email).

- Each `Tenant` has a unique `apiKey`.
- Admin routes expect `Authorization: Bearer <apiKey>` or cookie `wp_session=<apiKey>`.
- Tenant id is **never** taken from the client body/query for scoping - it always comes from the resolved session.

## Request flows

### A. Admin CRUD (`/api/widgets`, `/api/widgets/[id]`)

1. Resolve tenant from session/API key.
2. Zod-validate body (create/patch).
3. Service → repository with `tenantId` from session.
4. On create: generate embed snippet string pointing at `/widget.js`.

### B. Public config (`GET /api/widgets/[id]/config`)

1. No auth. CORS-open (`*` or echo Origin - config is not sensitive).
2. Load active widget; return small JSON (type, copy, fields, targeting).
3. CDN-like headers: `Cache-Control`, `ETag` based on `updatedAt`.
4. 304 when `If-None-Match` matches.

### C. Public submission (`POST /api/submissions`)

1. Handle `OPTIONS` preflight; echo/allowlist Origin (never `*` on this write endpoint).
2. Zod-validate body; reject oversized/malformed with honest 4xx.
3. Rate-limit by `ip + widgetId` token bucket → 429 + `Retry-After`.
4. Spam control (honeytrap field `_hp` must be empty) → FLAGGED or reject.
5. Geo fallback chain (A → B → `{enriched:false}`) - never fails the submission.
6. Persist submission via repository.
7. Fire-and-forget notify (email/webhook) - failures logged only.
8. Return 201 with verdict.

### D. Dashboard stats (`GET /api/dashboard/stats`)

Tenant-scoped aggregates: counts, top locations, spam-flagged count.

## Embed path

Customer site (different origin) loads `<script src="{APP}/widget.js" data-widget-id="...">`.
`widget.js` fetches config cross-origin, renders popover/form/CTA into host DOM, POSTs submissions to `/api/submissions`.

## Swap notes

- SQLite → Postgres: one-line `provider` / `url` change in `schema.prisma`.
- In-memory `RateLimiter` → Redis: same interface, new implementation file.
