# Rate limit & spam control

## Pattern

Key rate limits by **`ip + widgetId`**, not IP alone (one noisy site shouldn't starve others) and not widget alone (one attacker IP shouldn't be invisible across widgets).

Use an isolated interface so the algorithm can move to Redis later:

```ts
interface RateLimiter {
  take(key: string): { allowed: boolean; retryAfterSec: number };
  reset(key?: string): void;
}
```

This repo uses an in-memory token bucket (`capacity` + `refillPerSec`). On deny: HTTP **429** + `Retry-After`.

## Spam control chosen: honeytrap `_hp`

Implemented for real: a hidden `_hp` field the legitimate widget never fills. Bots that autofill every input trip it → submission is stored as **FLAGGED** (still filed for audit; not a 500).

Why this over the alternatives for this project:

- Timing tokens need clock skew handling and config coupling.
- Pure heuristics are noisier on short fields.
- Honeytrap is one field, deterministic in tests, and matches the customs "trap lane" metaphor.

A light link-density heuristic is layered on top for free-text, but the honeytrap is the primary control.

## Double-check when reusing

- Is the limiter **process-local**? Document that multi-instance deploys need Redis.
- Does a flood return 429 without throwing or allocating unbounded state?
- Is the honeytrap excluded from the stored payload and from real form UX?
