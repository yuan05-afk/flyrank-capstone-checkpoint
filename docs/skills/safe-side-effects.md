# Safe side effects

## Pattern

Anything that is **not** the primary durable write (email, Slack webhook, analytics fan-out) gets wrapped:

```ts
export async function notifySubmission(input): Promise<void> {
  try {
    await sendViaResend(input); // may throw
  } catch (err) {
    console.error("[notify] failed (swallowed)", err);
    // do not rethrow
  }
}
```

Call with `void notifySubmission(...)` after the DB insert succeeds. The HTTP response and the row must already be decided.

## Why it matters

A bad Resend API key, DNS blip, or timeout must not roll back a successfully inspected submission or flip a 201 into a 500. Operators see the failure in logs; customers see the stamp.

## Safe to swallow vs fail loudly

| Kind | Guidance |
|------|----------|
| Confirmation email / owner webhook | Swallow + log |
| Primary DB write | Fail loudly |
| Auth / tenant isolation miss | Fail loudly (401/404) |
| Validation / rate limit | Fail with honest 4xx |

## Double-check when reusing

- Is the side effect invoked **after** the commit you care about?
- Can the wrapper ever reject? (It shouldn't.)
- Demo path: set `RESEND_API_KEY=re_bad` and confirm submissions still 201.
