# CORS & public endpoints

## Pattern

Treat **read** and **write** public endpoints differently:

| Endpoint | CORS posture | Why |
|----------|--------------|-----|
| Config `GET /api/widgets/:id/config` | CORS-open (`Access-Control-Allow-Origin: *`) | Non-sensitive; meant to be fetched by any embed host |
| Submissions `POST /api/submissions` | Echo / allowlist Origin only - **never `*`** | Write surface; browsers send `Origin`; you decide who may call |

Always handle `OPTIONS` preflight explicitly on the write path. Return `204` with allow headers when the Origin is permitted; `403` when it is not.

## Interface sketch

```ts
isOriginAllowed(origin: string | null): boolean
corsHeadersForSubmission(origin): HeadersInit  // echoes origin or omits ACAO
corsHeadersOpen(): HeadersInit                 // *
```

## Why it matters

Wildcard on a credentialed or write endpoint teaches browsers (and attackers) that any site may invoke your mutation. Allowlisting keeps the embed demo honest: `fixtures/customer-site.html` on port 5555 works; a random origin does not.

## Double-check when reusing

- Does the write route reject **missing** Origin as well as unknown ones?
- Are preflight `Allow-Methods` / `Allow-Headers` complete for your client?
- Did someone "fix CORS" by pasting `*` onto the submissions route?
