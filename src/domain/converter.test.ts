// Unit tests for the conversion pipeline helpers: URL extraction, short-link
// detection, coordinate-based conversion, and end-to-end convert().

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  extractFirstUrl,
  isShortLink,
  convertCoords,
  convert,
} from './converter';

// --- extractFirstUrl ---------------------------------------------------------

test('extractFirstUrl: pulls the first URL out of free text', () => {
  assert.equal(
    extractFirstUrl('Here you go: https://maps.apple.com/?ll=1,2 enjoy'),
    'https://maps.apple.com/?ll=1,2'
  );
});

test('extractFirstUrl: strips trailing punctuation', () => {
  assert.equal(
    extractFirstUrl('see (https://2gis.ru/geo/1?m=2,3/16).'),
    'https://2gis.ru/geo/1?m=2,3/16'
  );
});

test('extractFirstUrl: returns null when there is no URL', () => {
  assert.equal(extractFirstUrl('just some words'), null);
});

// --- isShortLink -------------------------------------------------------------

test('isShortLink: recognizes known shorteners', () => {
  assert.ok(isShortLink(new URL('https://maps.app.goo.gl/abc123')));
  assert.ok(isShortLink(new URL('https://goo.gl/abc123')));
  assert.ok(isShortLink(new URL('https://clck.ru/abcdef')));
  assert.ok(isShortLink(new URL('https://yandex.ru/maps/-/CODE123')));
  assert.ok(isShortLink(new URL('https://go.2gis.com/abc123')));
});

test('isShortLink: ignores full provider URLs', () => {
  assert.ok(!isShortLink(new URL('https://www.google.com/maps/search/?query=1,2')));
  assert.ok(!isShortLink(new URL('https://maps.apple.com/?ll=1,2')));
});

// --- convertCoords -----------------------------------------------------------

test('convertCoords: builds a target for every provider with no source', () => {
  const result = convertCoords(41.31, 69.28);
  assert.equal(result.source, null);
  assert.deepEqual(result.place, { lat: 41.31, lon: 69.28 });
  assert.equal(result.targets.length, 4);
  const providers = result.targets.map((t) => t.provider).sort();
  assert.deepEqual(providers, ['2gis', 'apple', 'google', 'yandex']);
});

test('convertCoords: keeps a label when provided', () => {
  const result = convertCoords(41.31, 69.28, 'Tashkent');
  assert.equal(result.place.label, 'Tashkent');
});

// --- convert (full pipeline, no network for full links) ----------------------

test('convert: parses a full Google link and targets the other three', async () => {
  const result = await convert(
    'https://www.google.com/maps/search/?api=1&query=41.31,69.28'
  );
  assert.ok(result);
  assert.equal(result.source, 'google');
  assert.deepEqual([result.place.lat, result.place.lon], [41.31, 69.28]);
  // Source excluded; the other three providers are targets.
  const providers = result.targets.map((t) => t.provider).sort();
  assert.deepEqual(providers, ['2gis', 'apple', 'yandex']);
});

test('convert: returns null when no URL is present', async () => {
  assert.equal(await convert('no link here'), null);
});

test('convert: returns null for an unrecognized host', async () => {
  assert.equal(await convert('https://example.com/foo'), null);
});

test('convert: returns null when the link carries no coordinates', async () => {
  assert.equal(await convert('https://maps.apple.com/'), null);
});
