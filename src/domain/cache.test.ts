// Unit tests for the TTL cache.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TtlCache } from './cache';

test('TtlCache: stores and retrieves a live value', () => {
  const cache = new TtlCache<string>({ ttlMs: 1000, maxSize: 10 });
  cache.set('k', 'v');
  assert.equal(cache.get('k'), 'v');
});

test('TtlCache: returns undefined for a missing key', () => {
  const cache = new TtlCache<string>({ ttlMs: 1000, maxSize: 10 });
  assert.equal(cache.get('missing'), undefined);
});

test('TtlCache: expired entries are evicted on read', async () => {
  const cache = new TtlCache<string>({ ttlMs: 5, maxSize: 10 });
  cache.set('k', 'v');
  await new Promise((r) => setTimeout(r, 15));
  assert.equal(cache.get('k'), undefined);
  assert.equal(cache.size, 0);
});

test('TtlCache: evicts the oldest entry past maxSize', () => {
  const cache = new TtlCache<number>({ ttlMs: 1000, maxSize: 2 });
  cache.set('a', 1);
  cache.set('b', 2);
  cache.set('c', 3); // evicts 'a'
  assert.equal(cache.get('a'), undefined);
  assert.equal(cache.get('b'), 2);
  assert.equal(cache.get('c'), 3);
});

test('TtlCache: fires onHit / onMiss observers', () => {
  let hits = 0;
  let misses = 0;
  const cache = new TtlCache<string>({
    ttlMs: 1000,
    maxSize: 10,
    onHit: () => hits++,
    onMiss: () => misses++,
  });
  cache.get('x'); // miss
  cache.set('x', 'v');
  cache.get('x'); // hit
  assert.equal(hits, 1);
  assert.equal(misses, 1);
});
