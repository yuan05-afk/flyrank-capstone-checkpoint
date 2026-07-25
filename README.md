# Checkpoint

### One embed script. Any origin. Nothing trusted blindly.

Marketing teams want a popover, signup form, or CTA live on a customer site today. Engineers know what that actually means: a public write endpoint, reachable by anyone on the internet, that has to survive malformed payloads, floods, bots, dead third-party services, and one tenant trying to read another tenant's data.

Checkpoint is the whole platform for that job. A customer pastes a single `<script>` tag on their own domain, the widget renders from a cached config, and every submission crosses a hardened boundary (CORS allowlist, Zod validation, size limit, token-bucket rate limit, honeytrap spam check, geo enrichment with provider fallback, and side effects that can never sink the primary write) before it lands in a tenant-isolated dashboard.

**Run locally:** [Quick start](#quick-start) | [See the boundary](#the-hardened-boundary) | [Prove it yourself](#prove-it-yourself) | [Architecture](docs/ARCHITECTURE.md)

![Checkpoint landing page showing the embeddable lead capture pitch](docs/images/checkpoint-landing.png)

## Why Checkpoint

- **One-line embed:** `<script src=".../widget.js" data-widget-id="..." async></script>` renders a popover, signup form, or CTA on any foreign origin.
- **Tenant isolation is structural:** every admin query is scoped from the session key. A tenant id is never read from client input, so tenant B asking for tenant A's widget gets a `404`, not a leak.
- **Honest 4xx before business logic:** Zod parses the payload and rejects oversized bodies at the boundary, so malformed input never reaches a service or the database.
- **Floods cost nothing:** an in-memory token bucket keyed on `ip + widgetId` returns `429` with `Retry-After` and is swappable for Redis without touching callers.
- **Third-party outages degrade, they do not fail:** geo enrichment tries provider A, falls back to provider B, and stores `{ enriched: false }` when both are down. The lead is still captured.
- **Side effects cannot break the write:** email and webhook notifications are wrapped so a bad API key produces a log line, not a lost submission. The response stays `201`.
- **Config is cached, not recomputed:** widget config is served CORS-open with `ETag` and `Cache-Control`, so a popular customer site does not hammer the database.
- **Postgres-ready:** Prisma uses PostgreSQL (Neon on Vercel; local Neon free tier or Docker Postgres). See [VERCEL.md](VERCEL.md) for deploy steps.

## The embed, on someone else's site

The fixture is a full fictional storefront, Acme Outfitters, served from `http://localhost:5555` while the widget script, config, and submission endpoint all live on `http://localhost:3000`. Building it as a real-looking site is the point: the widget has to sit inside someone else's design language without inheriting any of it.

![Checkpoint widget rendered on the Acme Outfitters foreign origin storefront](docs/images/checkpoint-embed.png)

Submitting returns `201` and the widget stamps the result inline. The row appears in the owner dashboard with its geo enrichment and verdict.

![Checkpoint widget showing an accepted submission response on the customer storefront](docs/images/checkpoint-embed-accepted.png)

### The embed reports itself

A widget that fails silently is the worst kind to debug, so the script is explicit about its own state.

| Signal | Purpose |
| --- | --- |
| `checkpoint:ready` event | Fired on `window` after a successful mount, with the widget id and type. |
| `checkpoint:error` event | Fired with a readable reason, for example a stale widget id returning `404`. |
| `data-debug="true"` | Opt-in. Renders a visible failure card instead of only logging. Customer sites that omit it still fail quietly. |

The fixture uses all three to drive its **cross-origin embed probe**, the strip that reports the widget id in use and whether the mount succeeded.

Because `pnpm db:seed` mints a new widget id, a cached copy of the page can point at an id that no longer exists. The probe names that failure instead of rendering nothing, and `?w=<widgetId>` overrides the baked-in id without editing the file:

```
http://localhost:5555/customer-site?w=<widgetId>
```

Use the clean URL for the override. `serve` redirects `/customer-site.html` to `/customer-site` and drops the query string.

## The hardened boundary

Every public submission passes these checks in order. Any of them can reject; none of them can be skipped by the caller.

| # | Check | Behavior |
| --- | --- | --- |
| 1 | Origin allowlist | The `Origin` header is matched against the tenant's allowlist. Allowed origins are echoed back, never `*`. Denied origins get no CORS headers. |
| 2 | Body size limit | Payloads over the configured ceiling are refused with `413` before parsing work happens. |
| 3 | Zod validation | Shape, field types, and required fields are validated at the boundary. Failures return `400` with a readable error. |
| 4 | Rate limit | Token bucket keyed on `ip + widgetId`, 10 burst with ~1/sec refill. Over the limit returns `429` plus `Retry-After`. |
| 5 | Honeytrap spam | A hidden `_hp` field that a human never fills. A filled value is stored as `flagged` rather than silently dropped, so the owner can audit. |
| 6 | Geo enrichment | Provider A, then provider B, then graceful `{ enriched: false }`. A dead provider never blocks the write. |
| 7 | Safe notify | Email and webhook calls are wrapped. Failures are logged and swallowed; the submission still returns `201`. |
| 8 | Tenant-scoped write | The submission is filed against the widget's owning tenant, resolved server side. |

![Checkpoint platform guarantees section on the landing page](docs/images/checkpoint-guarantees.png)

## Owner dashboard

Sign in with a tenant API key and the dashboard shows only that tenant's widgets, stats, and submissions. Snippets are copy-ready, and each row carries a verdict stamp plus a geo location.

![Checkpoint dashboard showing submission stats and widget embed snippets](docs/images/checkpoint-dashboard.png)

![Checkpoint submission ledger showing accepted and flagged rows with geo locations](docs/images/checkpoint-ledger.png)

## Auth choice

**Seeded API key per tenant**, chosen over magic-link because it keeps the demo runnable with zero mail setup while still exercising real session handling. Admin routes accept `Authorization: Bearer <apiKey>` or the HTTP-only `wp_session` cookie set by `/login`.

| Tenant | API key |
| --- | --- |
| North Pier Customs | `tenant_a_key_demo_001` |
| South Gate Manifest | `tenant_b_key_demo_002` |

Tenant B exists specifically so isolation can be tested from the outside, not just asserted in prose.

## Quick start

### Prerequisites

- Node.js 18.18 or newer
- pnpm 9 or newer
- Git

### Clone, install, seed, and run

Clone the repository first, then install and start the app. Copy `.env.example` to `.env` and set `DATABASE_URL` to a PostgreSQL connection string (Neon free tier or Docker Postgres with `sslmode=require` where needed):

```bash
git clone https://github.com/yuan05-afk/flyrank-capstone-checkpoint.git
cd flyrank-capstone-checkpoint
cp .env.example .env   # Windows: copy .env.example .env
pnpm install
pnpm db:push
pnpm db:seed
pnpm dev
```

For Vercel hosting, use PostgreSQL (Neon) and follow [VERCEL.md](VERCEL.md).

Open `http://localhost:3000` and sign in with `tenant_a_key_demo_001`.

The development server defaults to port `3000`. Override it only when needed:

```bash
# POSIX
PORT=3001 pnpm dev

# PowerShell
$env:PORT = '3001'
pnpm dev
```

The seed prints the demo widget id and the exact embed snippet, and rewrites the widget id inside `fixtures/customer-site.html` so the cross-origin demo works immediately.

### Serve the foreign origin

In a second terminal (from the same repo root):

```bash
pnpm dev:fixture
# http://localhost:5555/customer-site
```

Submit the form there, then refresh `/dashboard`. The row appears with a location and a verdict.

If the widget does not appear, read the embed probe on the page rather than the console. A stale widget id after a reseed is the usual cause, and a hard refresh (`Ctrl+Shift+R`) or `?w=<widgetId>` fixes it.

## Prove it yourself

Each guarantee has a way to check it without reading the source.

**Tenant isolation**

```bash
# tenant B asking for tenant A's widget
curl -s -o /dev/null -w "%{http_code}\n" \
  -H "Authorization: Bearer tenant_b_key_demo_002" \
  http://localhost:3000/api/widgets/<A_WIDGET_ID>
# 404
```

**Config caching and CORS**

Open DevTools on the fixture page. `GET /api/widgets/:id/config` returns `ETag` and `Cache-Control`; the submission response echoes `Access-Control-Allow-Origin: http://localhost:5555` rather than a wildcard.

**The embed fails loudly, not silently**

```
http://localhost:5555/customer-site?w=stale_id_does_not_exist
```

The probe turns red with `could not load widget config - unknown or stale widget id [HTTP 404]`, a debug card appears, and no widget mounts. Swap in a real id and the same probe reports `mounted cross-origin, type=signup`.

**Rate limiting**

```bash
node scripts/smoke-submit.mjs
# floods the endpoint from one IP and prints the 429s
```

**Geo provider A down**

```bash
# .env
GEO_PROVIDER_A_DOWN=true
```

Submit again. The row still lands, enriched by provider B. With both providers down the submission succeeds as `{ enriched: false }`.

**Notify failure cannot break the write**

Set `RESEND_API_KEY=re_bad_key` and submit. The response is still `201`, the row is still stored, and the only trace of the failure is `[notify] failed (swallowed)` in the server log. With an empty key a stub transport logs instead of calling Resend.

## API

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| `POST` `GET` | `/api/widgets` | tenant | Create and list widgets |
| `GET` `PATCH` `DELETE` | `/api/widgets/:id` | tenant | Scoped to the session tenant |
| `GET` | `/api/widgets/:id/config` | public | CORS-open, `ETag` cached |
| `POST` | `/api/submissions` | public | The hardened boundary |
| `GET` | `/api/dashboard/stats` | tenant | Aggregates, `?include=list` for rows |
| `POST` `DELETE` | `/api/auth/login` | none | Session cookie in and out |

```bash
# create a widget as tenant A
curl -s -X POST http://localhost:3000/api/widgets \
  -H "Authorization: Bearer tenant_a_key_demo_001" \
  -H "Content-Type: application/json" \
  -d '{"type":"signup","name":"Desk","copy":{"headline":"Hi"},"fields":[{"name":"email","label":"Email","type":"email","required":true}]}'

# submit from an allowlisted origin
curl -s -X POST http://localhost:3000/api/submissions \
  -H "Origin: http://localhost:5555" \
  -H "Content-Type: application/json" \
  -d '{"widgetId":"<ID>","payload":{"email":"lead@ex.com"},"_hp":""}'
```

## Tests

```bash
pnpm test
```

Covers CORS allow and deny helpers, Zod validation plus the `413` size path, rate-limit burst behavior, geo fallback with provider A down and with both down, tenant isolation negatives, and the full submission pipeline.

## Architecture

`repository -> service -> route handler`, enforced by project rules in `.cursor/rules/`. Repositories are the only code that touches Prisma, services hold validation and enrichment, and route handlers parse a request and call a service. Nothing else.

```
app/api/*            route handlers (parse, delegate, respond)
services/*           business logic, validation, enrichment, verdicts
repositories/*       the only Prisma access
lib/cors             origin allowlist helpers
lib/rate-limit       swappable RateLimiter interface + token bucket
lib/geo              provider A, provider B, fallback chain
lib/email            notify wrapper that cannot throw past the handler
lib/cdn              widget config rendering and cache headers
public/widget.js     the embeddable script, with ready/error events
fixtures/            Acme Outfitters storefront on a foreign origin
```

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) - request-flow contracts
- [`docs/DESIGN.md`](docs/DESIGN.md) - the Clear Signal visual system
- [`docs/diagram.md`](docs/diagram.md) - mermaid sequences
- [`docs/skills/`](docs/skills/) - reusable hardening patterns

## Design

The interface uses **Clear Signal**: a cool mist canvas (`#F4F7FB`), deep teal accent (`#0F766E`), Sora for display and Figtree for body, with IBM Plex Mono reserved for ids, snippets, and micro-labels. Marketing and dashboard share one system, one brand mark, and one motion stack (Lenis smooth scroll plus Framer Motion), so the product does not change personality after sign-in.

The brand mark reads as the product's job: a lead signal crossing two scanner posts on a dark instrument plate, with a live status light. `components/BrandMark.tsx` and `public/favicon.svg` are the same geometry, checked at 16px so the tab icon stays legible.

The fixture storefront deliberately does **not** use this system. It runs its own forest-green outdoor palette and serif display type, which is what makes the embed a fair test: the widget keeps its own styling on a site that shares none of it. Full rules live in [`docs/DESIGN.md`](docs/DESIGN.md) and the shared Capstones skill `capstone-signal-design`.

## Limitations

- The in-memory rate limiter is per server instance (fine for the Capstone demo on Vercel; Redis is the production swap behind the same interface).
- Geo providers are deterministic mocks shaped like real HTTP clients, so the fallback chain is testable offline.
- Email uses Resend in dev mode or a logging stub. No mail is sent without a real key.
- Hosted deploy is manual: see [VERCEL.md](VERCEL.md) for Neon Postgres and env setup.

## Technology

- Next.js 14 App Router and TypeScript
- Prisma with PostgreSQL (Neon for Vercel)
- Zod
- Tailwind CSS
- Framer Motion and Lenis
- Vitest
- pnpm

## Definition of done

- [x] Admin CRUD is tenant-isolated, with negative tests
- [x] Widget config is cached and CORS-open, embedded from a separate origin
- [x] Submissions validate, rate limit, and return honest 4xx
- [x] Geo enrichment falls back and degrades gracefully
- [x] Honeytrap spam is flagged, floods return `429`
- [x] Notify failures never fail a submission
- [x] Automated tests pass
- [x] README, architecture, diagram, design, and skills documented
- [x] One visual system across landing and dashboard

<sub>Built by Yuan Mariano for the FlyRankAI capstone track.</sub>
