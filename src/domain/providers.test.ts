// Unit tests for the provider registry: host detection, URL parsing, and link
// building for each registered provider.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PROVIDERS } from './providers';
import { detectProvider, buildUrl } from './converter';

const { google, yandex, apple } = PROVIDERS;
const twogis = PROVIDERS['2gis'];

// --- Host detection ----------------------------------------------------------

test('detectProvider: recognizes each provider by hostname', () => {
  assert.equal(detectProvider('www.google.com'), 'google');
  assert.equal(detectProvider('maps.app.goo.gl'), 'google');
  assert.equal(detectProvider('yandex.com'), 'yandex');
  assert.equal(detectProvider('maps.yandex.ru'), 'yandex');
  assert.equal(detectProvider('maps.apple.com'), 'apple');
  assert.equal(detectProvider('2gis.ru'), '2gis');
});

test('detectProvider: returns null for unknown hosts', () => {
  assert.equal(detectProvider('example.com'), null);
  assert.equal(detectProvider('openstreetmap.org'), null);
});

// --- Parsing -----------------------------------------------------------------

test('google.parse: prefers the !3d/!4d pin over the @center', () => {
  const url = new URL(
    'https://www.google.com/maps/place/Test/@41.0,69.0,17z/data=!3d41.311081!4d69.279729'
  );
  assert.deepEqual(google.parse(url), { lat: 41.311081, lon: 69.279729, label: 'Test' });
});

test('google.parse: reads the q= query param', () => {
  const url = new URL('https://www.google.com/maps/search/?api=1&query=41.31,69.28');
  const place = google.parse(url);
  assert.ok(place);
  assert.deepEqual([place.lat, place.lon], [41.31, 69.28]);
});

test('google.parse: drops a label that is really just coordinates', () => {
  const url = new URL('https://www.google.com/maps/search/41.29,+69.21');
  const place = google.parse(url);
  assert.ok(place);
  assert.equal(place.label, undefined);
  assert.deepEqual([place.lat, place.lon], [41.29, 69.21]);
});

test('yandex.parse: reads lon,lat from whatshere[point]', () => {
  const url = new URL('https://yandex.com/maps/?whatshere[point]=27.56,53.9');
  // Stored as lon,lat → result is [lat, lon].
  assert.deepEqual(yandex.parse(url), { lat: 53.9, lon: 27.56, label: undefined });
});

test('apple.parse: reads lat,lon from ll', () => {
  const url = new URL('https://maps.apple.com/?ll=41.31,69.28');
  assert.deepEqual(apple.parse(url), { lat: 41.31, lon: 69.28, label: undefined });
});

test('2gis.parse: reads lon,lat from the m param', () => {
  const url = new URL('https://2gis.ru/geo/70000001006559158?m=69.28,41.31/16');
  // Stored as lon,lat → result is [lat, lon].
  assert.deepEqual(twogis.parse(url), { lat: 41.31, lon: 69.28, label: undefined });
});

test('parse: returns null when a URL carries no coordinates', () => {
  assert.equal(google.parse(new URL('https://www.google.com/maps')), null);
  assert.equal(apple.parse(new URL('https://maps.apple.com/')), null);
});

// --- Building ----------------------------------------------------------------

test('build: each provider emits a URL containing the coordinates', () => {
  const place = { lat: 41.31, lon: 69.28 };
  for (const provider of ['google', 'yandex', 'apple', '2gis'] as const) {
    const url = buildUrl(provider, place);
    assert.match(url, /^https:\/\//, `${provider} builds an https URL`);
    assert.ok(url.includes('41.31'), `${provider} URL includes the latitude`);
    assert.ok(url.includes('69.28'), `${provider} URL includes the longitude`);
  }
});

test('build round-trips through the same provider parser', () => {
  const place = { lat: 41.31, lon: 69.28 };
  for (const key of ['google', 'yandex', 'apple', '2gis'] as const) {
    const def = key === '2gis' ? twogis : PROVIDERS[key];
    const parsed = def.parse(new URL(buildUrl(key, place)));
    assert.ok(parsed, `${key} re-parses its own built URL`);
    assert.equal(parsed.lat, place.lat, `${key} preserves latitude`);
    assert.equal(parsed.lon, place.lon, `${key} preserves longitude`);
  }
});
