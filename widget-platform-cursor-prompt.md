# CURSOR PROMPT — Embeddable Widget Platform (Popover / Signup Form / CTA)

Paste everything below this line into Cursor (Agent, Auto mode) as your first message in a fresh repo.

---

## 0. Role and ground rules

You are building a production-shaped SaaS platform end-to-end, not a demo. This is the "public internet is your input" capstone: your endpoints will be hit by untrusted browsers on origins you don't control, so the hardening is the point of the project, not an afterthought.

Non-negotiables — read before writing any code:

1. **No placeholder plumbing.** Every endpoint you write must actually run against a real local database and be curl-able/testable before you move to the next phase. Mocking is allowed in exactly one place — the two geo providers (spec'd below) — and nowhere else.
2. **Don't over-build.** If a milestone can be done with a straightforward route handler + a small service function, do that. Do not introduce a queue, a microservice, a message broker, or a design pattern the milestone doesn't need. Boring and working beats clever and half-finished.
3. **Work in phases, in order.** Finish and self-verify each phase (run it, hit it with curl/a script, show the output) before starting the next. Don't jump ahead to the dashboard while the submission endpoint is still unhardened.
4. **After each phase**, write or update the relevant doc (see §5) and stop for my review before continuing to the next phase.
5. **Never fabricate a "it works" claim.** If a test fails or a route 500s, say so and fix it — don't paper over it in the README.

---

## 1. Tech stack (use exactly this unless you hit a real blocker — tell me if so)

- **Framework:** Next.js 14+, App Router, TypeScript, route handlers under `app/api/*`.
- **Database:** SQLite via Prisma (`file:./dev.db`) — zero external infra to run locally. Design the schema so swapping to Postgres later is a one-line datasource change.
- **Architecture pattern:** `repository → service → route handler`, mirroring how a mature multi-tenant SaaS app is laid out (repositories do raw data access, services hold business logic/validation/enrichment, route handlers only parse requests and call services). Keep this strict — it's what makes the security review in Phase 3 tractable.
- **Validation:** Zod at every boundary (admin API and public API both).
- **Rate limiting:** in-memory token-bucket keyed by `ip + widgetId`, with a documented, isolated interface (`RateLimiter`) so it could be swapped for Redis/Upstash later without touching callers.
- **Email/webhook side effect:** use [Resend](https://resend.com) in dev mode (or a stub transport that logs) — wrapped so a failure there can **never** throw past the submission handler.
- **Auth (admin side):** a minimal session-cookie auth (email + magic link OR a simple seeded API key per tenant — pick the simpler one and tell me which). Tenant isolation is mandatory: every query for widgets/submissions must be scoped to the authenticated tenant, no exceptions.
- **Testing:** Vitest + Supertest (or Next.js route testing utilities) for the endpoint tests in §4.
- **Package manager:** pnpm.

If Auto mode wants to substitute a piece of this stack for a good reason, that's fine — just say what and why in the phase-end summary, don't silently drift.

---

## 2. Design direction — read this before touching any UI

Two looks are both now overused and off the table, for different reasons: the purple-to-blue-gradient/glassmorphism "AI SaaS" template, **and** the warm-off-white-paper + one-earthy-accent + hairline-border + grotesk/mono pairing that's become its own template (that one's everywhere in AI-generated design right now — cream background, terracotta or sage accent, Geist + JetBrains Mono. It's tasteful, and that's exactly why it now reads as generic AI output rather than a considered choice). Don't use either.

Instead, design around what this product actually *does*: it inspects things that cross a boundary from the open internet into your system — a submission arrives from an origin you don't control, gets checked, stamped either through or rejected, tagged with where it came from, and filed. That's a **customs/inspection-checkpoint** operation, not a generic "AI tool" operation, and the visual language should say so.

Concrete direction:

- **Palette:** a near-black ink-navy shell (`#12141B`) as the base — not warm paper, not pure black. One accent used only for primary actions and brand marks: an aged brass/gold (`#B8923D`). Then two *functional* colors that are never used decoratively, only as inspection verdicts: stamp-red (`#A23B33`) for rejected/rate-limited/flagged, and stamp-green (`#3C6E4F`) for accepted/validated. If a color shows up anywhere that isn't the shell, the brass accent, or an actual verdict, that's a mistake.
- **Typography:** lead with a **typewriter/stencil display face** for headers and stamps (Special Elite, Courier Prime, or similar) — not a grotesk sans. Pair it with a plain monospace (IBM Plex Mono / Space Mono) for all data: widget IDs, timestamps, JSON, the embed snippet. No humanist sans anywhere; the typewriter-vs-clean-mono contrast is the whole typographic system, not sans-vs-mono.
- **Chrome:** no hairline borders as the default move, no shadows. Use a **double-ruled / carbon-copy outline** on panels — two offset outlines a couple pixels apart, like a duplicate form — for depth instead. Cards get a **perforated or die-cut top edge** (like a ticket stub or claim check), not a rounded corner with a shadow.
- **Status as stamps, not pills:** ACCEPTED / REJECTED / RATE-LIMITED / FLAGGED render as rotated (2–4°), slightly worn ink-stamp marks in the verdict colors above — uppercase, monospace, a hairline-thin stamp outline — instead of soft rounded badges.
- **The submissions table reads like a manifest/ledger**, not a modern data-grid: monospace row numbers, fixed-width timestamp column, verdict stamp in its own column.
- **Geo enrichment** shown as coordinates + a small dotted ping mark on a minimal line-art world outline (no photoreal globe, no country flags — flags read as clip art here).
- **The embed snippet** is presented like a manifest entry — a code block with a "TRACKING NO." style widget ID above it and a copy button styled as a small stamp/button, not a generic rounded pill.
- **Layout:** dense, tabular, form-like — think an actual inspection/manifest office, not a modern analytics dashboard. Whitespace is used to separate *sections of paperwork*, not to create airy marketing breathing room.
- **Dark mode isn't a separate mode here** — the ink-navy shell described above already *is* the only mode. Don't build a light theme.

Build a small `docs/DESIGN.md` capturing the palette (exact hex values above), the two-typeface system, the stamp/manifest motifs, and the "verdict colors are functional only" rule — write this in Phase 0 before any UI so you don't drift into a generic sans/rounded-card default halfway through. If you're ever unsure whether something fits, ask "would this look at home in a customs office's paperwork, not a modern SaaS dashboard" — if the answer is no, redo it.

---

## 3. Repo structure to create in Phase 0

```
/app
  /api
    /widgets/route.ts              # POST create, GET list (admin, tenant-scoped)
    /widgets/[id]/route.ts         # GET/PATCH/DELETE one widget (admin)
    /widgets/[id]/config/route.ts  # PUBLIC, cached, CORS-open config delivery
    /submissions/route.ts          # PUBLIC POST, CORS + validation + rate-limit + enrichment
    /dashboard/stats/route.ts      # admin, tenant-scoped aggregate stats
  /dashboard/...                   # authed admin UI
  /(marketing)/...                 # landing page
/lib
  /cdn
    embed.ts                       # the <script> the customer site loads
    widget-render.ts                # renders the actual popover/form DOM
  /rate-limit/rate-limiter.ts
  /spam/heuristics.ts
  /geo
    provider-a.ts
    provider-b.ts
    fallback-chain.ts
  /email
    notify.ts                       # safe, non-throwing side effect wrapper
/services
  widgets.service.ts
  submissions.service.ts
/repositories
  widgets.repository.ts
  submissions.repository.ts
/prisma
  schema.prisma
/docs
  DESIGN.md
  ARCHITECTURE.md
  diagram.md                        # mermaid sequence + component diagram
  skills/
    cors-and-public-endpoints.md
    rate-limit-and-spam.md
    geo-fallback-chain.md
    safe-side-effects.md
/tests
  submissions.test.ts
  config.test.ts
  rate-limit.test.ts
  geo-fallback.test.ts
/fixtures
  customer-site.html                 # plain HTML file, opened from a DIFFERENT origin/port,
                                      # embeds the one-line <script> — this is how you demo CORS for real
.cursor/rules/
  architecture.mdc
  security.mdc
  design.mdc
README.md
```

### 3.1 `.cursor/rules/*.mdc` — generate these for real, in Phase 0

These are project rules Cursor reads on every future edit in this repo, so future you (or future Auto-mode runs) doesn't drift. Write each as a short `.mdc` file:

- **`architecture.mdc`** — encodes the repository→service→route-handler rule from §1, and "no query touches the DB without going through a repository."
- **`security.mdc`** — encodes: every public route must validate with Zod before touching business logic; every public route must set explicit CORS headers (no wildcard `*` on the submissions endpoint — echo/allowlist the origin); every side effect that isn't the primary write must be wrapped so it can't throw past the handler.
- **`design.mdc`** — encodes the palette/type/border rules from §2 so generated UI doesn't drift into gradient-and-shadow defaults.

---

## 4. Build phases — do these in order, checkpoint after each

### Phase 0 — Setup & contracts (½ session)
- Scaffold the repo structure above. Init Prisma with SQLite.
- Design the schema: `Tenant`, `Widget` (type: popover/signup/cta, copy, fields as JSON, targeting rules as JSON, tenant-scoped), `Submission` (widget-scoped, raw payload, enrichment JSON, spam-score, created_at), `RateLimitBucket` if you're persisting it.
- Write `docs/ARCHITECTURE.md` with the request-flow contract (admin CRUD vs public config vs public submission) before writing route code.
- Write `docs/DESIGN.md` per §2.
- Write the `.cursor/rules/*.mdc` files per §3.1.
- **Checkpoint:** schema migrates cleanly, repo boots, `prisma studio` shows the tables.

### Phase 1 — Admin API (tenant-isolated CRUD)
- Auth (pick the simpler scheme, tell me which).
- `POST/GET /api/widgets`, `GET/PATCH/DELETE /api/widgets/:id` — every query scoped by tenant from the session, never by a client-supplied tenant id.
- On widget create, generate the embed snippet string (`<script src=".../widget.js" data-widget-id="...">`).
- **Checkpoint:** curl through full CRUD as tenant A, confirm tenant B's session can't see or touch tenant A's widgets (write this as an explicit negative test, not just an assumption).

### Phase 2 — Cached config delivery + the real embed
- `GET /api/widgets/:id/config` — public, CORS-open (config is not sensitive, it's meant to be fetched by anyone embedding it), small JSON payload, correct cache headers (`Cache-Control`, `ETag` or `Last-Modified`) — this should behave like a CDN asset, not a DB-hit-every-time endpoint.
- Build `lib/cdn/embed.ts` — the one-line `<script>` — and `lib/cdn/widget-render.ts` which fetches config and renders an actual popover/form into the host page's DOM.
- Build `fixtures/customer-site.html` — a plain HTML file with nothing but the one-line script tag. Open it via a **second local port or `file://`**, not the same origin as your app. This is the actual cross-origin proof, not a simulated one.
- **Checkpoint:** open `customer-site.html` from a different origin, watch the widget render for real. Check response headers in devtools to confirm caching is actually happening.

### Phase 3 — Public submission endpoint: the hardened core
This is the milestone the whole project is graded on — take your time.
- `POST /api/submissions` — CORS: allowlist/echo the requesting origin (don't just slap `*`), handle the `OPTIONS` preflight explicitly.
- Zod validation at the boundary: reject malformed/oversized payloads with honest 4xx status codes (400 for bad shape, 413/422 for oversized, not a blanket 500).
- Rate limiting: per-`ip+widgetId` token bucket (`lib/rate-limit/rate-limiter.ts`), returns 429 with a `Retry-After` header when tripped.
- Spam control — implement **at least one** for real: a honeytrap field the real form never fills, OR a heuristic (link-count/gibberish check on free-text fields), OR a signed timing token minted by the config endpoint and checked on submit. Pick one, implement it properly rather than half-implementing two.
- **Checkpoint:** a flood script (in `/tests` or a throwaway script) proves the rate limiter trips without taking the process down; a garbage payload is rejected with the right status; a missing/mismatched Origin header is rejected.

### Phase 4 — Enrichment: geo fallback chain
- `lib/geo/provider-a.ts`, `provider-b.ts` — both mocked, but built as if real (same interface a real HTTP client would have: `lookup(ip): Promise<GeoResult>`, can throw or time out).
- `lib/geo/fallback-chain.ts` — tries provider A, falls to provider B on failure/timeout, degrades gracefully to `{ enriched: false }` if both are down rather than failing the submission.
- Provider A should have a togglable "down" flag (env var or in-memory flag) so the fallback test in Phase 6 is deterministic, not flaky.
- **Checkpoint:** submission still gets enriched with A up; still succeeds (with fallback data) with A down and B up; still succeeds (unenriched, not failed) with both down.

### Phase 5 — Safe side effects
- `lib/email/notify.ts` — sends a confirmation email/webhook on submission. Wrap it so any failure (bad API key, network error, timeout) is caught, logged, and **does not** affect the submission's success response or its DB row.
- **Checkpoint:** kill the email provider (bad API key) and confirm the submission still returns 200/201 and is stored; email failure shows up only in logs.

### Phase 6 — Owner dashboard
- Authed, tenant-scoped: list submissions per widget, basic stats (count over time, top locations from the geo enrichment, spam-flagged count).
- Apply `docs/DESIGN.md` here for real — this is the highest-visibility UI in the project.
- **Checkpoint:** submit from `customer-site.html`, watch it land in the dashboard within a page refresh, enriched.

### Phase 7 — Tests (formalize what you checkpointed by hand)
Write these as real automated tests, not just manual curl checks:
- CORS preflight handled correctly (OPTIONS returns right headers, disallowed origins are rejected).
- Validation rejects malformed/oversized payloads.
- Rate limiter trips under a burst.
- Geo fallback engages when provider A is down, and degrades cleanly when both are down.
- **Checkpoint:** `pnpm test` green, no skipped tests standing in for unfinished features.

### Phase 8 — Docs & diagram
- Finish `README.md`: what this is, how to run it locally (including opening `customer-site.html` on a second origin), how to run the tests, how to toggle provider A "down" for the demo.
- `docs/diagram.md` — a mermaid diagram covering: admin CRUD flow, embed/config-fetch flow, and the submission pipeline (validate → rate-limit/spam → enrich w/ fallback → store → safe side effect) per the architecture sketch in the brief.
- Fill in `docs/skills/*.md` (see §5) — these are short, reusable write-ups of the four hardened patterns you built, written so they're useful on the *next* public-endpoint project, not just a changelog of this one.

---

## 5. The four "skill" docs (`docs/skills/*.md`)

Write each as a short, standalone doc — pattern, why it matters, the interface, and the one thing to double check when reusing it elsewhere. These aren't a diary of what you did; they're reusable references.

- **`cors-and-public-endpoints.md`** — allowlisting vs wildcard origins, preflight handling, what "CORS-open" should and shouldn't mean for a config endpoint vs a write endpoint.
- **`rate-limit-and-spam.md`** — the token-bucket interface, key design (`ip+widgetId`), the one spam control you implemented and why you picked it over the alternatives.
- **`geo-fallback-chain.md`** — the provider interface, ordering, timeout handling, and the graceful-degradation contract (never fail the submission because enrichment failed).
- **`safe-side-effects.md`** — the wrap-and-swallow pattern for non-critical side effects, and where the line is between "safe to swallow" and "should actually fail loudly."

---

## 6. Definition of done (copy this checklist into the PR/final summary and tick each honestly)

- [ ] Admin CRUD is tenant-isolated (proven with a negative test, not just code review)
- [ ] Config delivery is cached, small, CORS-open, and rendered on a genuinely separate origin
- [ ] Submission endpoint: correct CORS, boundary validation, honest status codes
- [ ] Geo enrichment fallback chain works and degrades gracefully with both providers down
- [ ] Rate limiting + ≥1 real spam control; a flood doesn't crash the process
- [ ] Email/webhook side effect failure never fails the submission
- [ ] Automated tests cover: CORS preflight, validation rejection, rate-limit trip, geo fallback
- [ ] `README.md`, `docs/ARCHITECTURE.md`, `docs/diagram.md`, `docs/DESIGN.md`, `docs/skills/*.md` all written and accurate
- [ ] Design passes the §2 self-check — it looks like the inspection/manifest system described there, not a gradient AI template *and* not the warm-paper/hairline-border/grotesk-mono template

---

## 7. What to do right now

Start with Phase 0. Show me the schema and the `.mdc` rule files before writing any route code. Stop after Phase 0 for my review.
