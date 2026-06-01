// Process-lifetime usage counters. In-memory only (reset on restart) — PM2
// restarts the bot anyway, and this is for at-a-glance operational visibility
// via /stats, not long-term analytics. No dependency, no persistence.

import type { Provider } from './domain';

export interface MetricsSnapshot {
  startedAt: number;
  updates: number;
  conversions: number;
  bySource: Record<string, number>;
  notFound: number;
  errors: number;
  inlineQueries: number;
  cacheHit: number;
  cacheMiss: number;
}

/** Counter keys that are plain integers (everything except per-source breakdown). */
type Counter =
  | 'updates'
  | 'conversions'
  | 'notFound'
  | 'errors'
  | 'inlineQueries'
  | 'cacheHit'
  | 'cacheMiss';

const counters: Record<Counter, number> = {
  updates: 0,
  conversions: 0,
  notFound: 0,
  errors: 0,
  inlineQueries: 0,
  cacheHit: 0,
  cacheMiss: 0,
};

const bySource: Record<string, number> = {};

// Captured at module load. new Date() is fine at runtime; tests don't assert on it.
const startedAt = Date.now();

export const metrics = {
  inc(key: Counter): void {
    counters[key]++;
  },

  /** Records a successful conversion, tracking the source provider (or "location"). */
  recordConversion(source: Provider | null): void {
    counters.conversions++;
    const key = source ?? 'location';
    bySource[key] = (bySource[key] ?? 0) + 1;
  },

  snapshot(): MetricsSnapshot {
    return {
      startedAt,
      updates: counters.updates,
      conversions: counters.conversions,
      bySource: { ...bySource },
      notFound: counters.notFound,
      errors: counters.errors,
      inlineQueries: counters.inlineQueries,
      cacheHit: counters.cacheHit,
      cacheMiss: counters.cacheMiss,
    };
  },
};
