/**
 * Isolated RateLimiter interface - swap for Redis/Upstash later without
 * touching callers. In-memory token bucket keyed by arbitrary string
 * (callers use `ip + widgetId`).
 */

export interface RateLimiter {
  /** Returns true if the request is allowed; false if limited. */
  take(key: string): { allowed: boolean; retryAfterSec: number };
  reset(key?: string): void;
}

export type TokenBucketOptions = {
  capacity: number;
  refillPerSec: number;
};

type Bucket = { tokens: number; updatedAt: number };

export class InMemoryTokenBucket implements RateLimiter {
  private buckets = new Map<string, Bucket>();

  constructor(private opts: TokenBucketOptions) {}

  take(key: string): { allowed: boolean; retryAfterSec: number } {
    const now = Date.now();
    let bucket = this.buckets.get(key);
    if (!bucket) {
      bucket = { tokens: this.opts.capacity, updatedAt: now };
      this.buckets.set(key, bucket);
    }

    const elapsedSec = (now - bucket.updatedAt) / 1000;
    bucket.tokens = Math.min(
      this.opts.capacity,
      bucket.tokens + elapsedSec * this.opts.refillPerSec
    );
    bucket.updatedAt = now;

    if (bucket.tokens < 1) {
      const need = 1 - bucket.tokens;
      const retryAfterSec = Math.max(1, Math.ceil(need / this.opts.refillPerSec));
      return { allowed: false, retryAfterSec };
    }

    bucket.tokens -= 1;
    return { allowed: true, retryAfterSec: 0 };
  }

  reset(key?: string): void {
    if (key) this.buckets.delete(key);
    else this.buckets.clear();
  }
}

/** Default: 10 burst, ~1/sec refill - tight enough to trip a flood script. */
export const submissionRateLimiter: RateLimiter = new InMemoryTokenBucket({
  capacity: 10,
  refillPerSec: 1,
});
