// Unit tests for the conversion pipeline helpers: URL extraction, short-link
// detection, coordinate-based conversion, and end-to-end convert().

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  extractFirstUrl,
  isShortLink,
  convertCoords,
  convert,
  coordUrlFromBody,
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

// --- coordUrlFromBody --------------------------------------------------------

test('coordUrlFromBody: recovers ll from a Yandex org page body', () => {
  // Yandex embeds its canonical share link with a double-encoded comma (%252C).
  const body =
    '<a href="https://yandex.uz/maps/org/x/39349291460/%3Fll%3D69.230909%252C41.321215%26z%3D16">share</a>';
  // Returns lon,lat in the order the Yandex provider expects (?ll=lon,lat).
  assert.equal(
    coordUrlFromBody(body),
    'https://yandex.com/maps/?ll=69.230909,41.321215'
  );
});

test('coordUrlFromBody: returns null when no embedded ll is present', () => {
  assert.equal(coordUrlFromBody('<html>no coordinates here</html>'), null);
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
  assert.ok(result.ok);
  assert.equal(result.value.source, 'google');
  assert.deepEqual([result.value.place.lat, result.value.place.lon], [41.31, 69.28]);
  // Source excluded; the other three providers are targets.
  const providers = result.value.targets.map((t) => t.provider).sort();
  assert.deepEqual(providers, ['2gis', 'apple', 'yandex']);
});

test('convert: reports no-url when no URL is present', async () => {
  assert.deepEqual(await convert('no link here'), { ok: false, reason: 'no-url' });
});

test('convert: reports unsupported for an unrecognized host', async () => {
  assert.deepEqual(await convert('https://example.com/foo'), {
    ok: false,
    reason: 'unsupported',
  });
});

test('convert: reports no-coords when the link carries no coordinates', async () => {
  assert.deepEqual(await convert('https://maps.apple.com/'), {
    ok: false,
    reason: 'no-coords',
  });
});
