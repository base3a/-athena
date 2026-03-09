// ── In-memory cache utility ────────────────────────────────────────────────────
// Module-level store: survives across requests within the same server process.
// This sits in front of the HTTP-level `next: { revalidate }` fetch cache —
// giving sub-millisecond responses for hot tickers without any network round-trip.
//
// TTL: 5 minutes — short enough to stay fresh, long enough to absorb bursts
// of concurrent requests (e.g. watchlist loading, page re-renders) that would
// otherwise each count against Alpha Vantage's rate limit.

const TTL_MS = 5 * 60 * 1000; // 5 minutes

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export class InMemoryCache<T> {
  private readonly store = new Map<string, CacheEntry<T>>();

  /** Returns cached data if present and not expired, otherwise null. */
  get(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > TTL_MS) {
      this.store.delete(key); // evict stale entry
      return null;
    }
    return entry.data;
  }

  /** Stores data with the current timestamp. */
  set(key: string, data: T): void {
    this.store.set(key, { data, timestamp: Date.now() });
  }

  /** Returns the age of a cache entry in milliseconds, or -1 if not found. */
  age(key: string): number {
    const entry = this.store.get(key);
    return entry ? Date.now() - entry.timestamp : -1;
  }
}
