// A tiny in-memory TTL cache with bounded size. Used to memoize successful
// short-link expansions so the same forwarded link isn't re-fetched (and
// re-retried against Yandex's bot-challenge) on every request.
//
// No external dependency, no background timers: entries expire lazily on read,
// and the oldest insertion is evicted when the size cap is hit (insertion-order
// eviction via Map iteration — good enough for this access pattern).

export interface TtlCacheOptions {
  /** Time-to-live for an entry, in milliseconds. */
  ttlMs: number;
  /** Maximum number of live entries before oldest-first eviction kicks in. */
  maxSize: number;
  /** Optional observers, fired on each get. */
  onHit?: () => void;
  onMiss?: () => void;
}

interface Entry<V> {
  value: V;
  expires: number;
}

export class TtlCache<V> {
  private readonly store = new Map<string, Entry<V>>();

  constructor(private readonly opts: TtlCacheOptions) {}

  /** Returns the live value for a key, or undefined if absent or expired. */
  get(key: string): V | undefined {
    const entry = this.store.get(key);
    if (!entry || entry.expires <= Date.now()) {
      if (entry) this.store.delete(key); // drop the stale entry
      this.opts.onMiss?.();
      return undefined;
    }
    this.opts.onHit?.();
    return entry.value;
  }

  /** Stores a value, evicting the oldest entry if the cap is exceeded. */
  set(key: string, value: V): void {
    if (!this.store.has(key) && this.store.size >= this.opts.maxSize) {
      const oldest = this.store.keys().next().value;
      if (oldest !== undefined) this.store.delete(oldest);
    }
    this.store.set(key, { value, expires: Date.now() + this.opts.ttlMs });
  }

  /** Current number of stored (possibly expired) entries — used in tests. */
  get size(): number {
    return this.store.size;
  }
}
