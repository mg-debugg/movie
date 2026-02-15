type CacheEntry<T> = { value: T; expiresAtMs: number };

export class TtlCache<T> {
  private readonly store = new Map<string, CacheEntry<T>>();

  constructor(private readonly ttlMs: number) {}

  get(key: string): T | undefined {
    const hit = this.store.get(key);
    if (!hit) return undefined;
    if (Date.now() > hit.expiresAtMs) {
      this.store.delete(key);
      return undefined;
    }
    return hit.value;
  }

  set(key: string, value: T): void {
    this.store.set(key, { value, expiresAtMs: Date.now() + this.ttlMs });
  }
}

type RateState = { windowStartMs: number; count: number };

// Simple fixed-window limiter; good enough for local MVP.
export class FixedWindowRateLimiter {
  private readonly states = new Map<string, RateState>();

  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
  ) {}

  check(key: string): { ok: true; remaining: number } | { ok: false; retryAfterSec: number } {
    const now = Date.now();
    const curr = this.states.get(key);

    if (!curr || now - curr.windowStartMs >= this.windowMs) {
      this.states.set(key, { windowStartMs: now, count: 1 });
      return { ok: true, remaining: this.limit - 1 };
    }

    if (curr.count >= this.limit) {
      const retryAfterSec = Math.ceil((this.windowMs - (now - curr.windowStartMs)) / 1000);
      return { ok: false, retryAfterSec };
    }

    curr.count += 1;
    return { ok: true, remaining: this.limit - curr.count };
  }
}

