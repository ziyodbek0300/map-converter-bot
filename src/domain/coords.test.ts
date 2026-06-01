// Unit tests for the shared coordinate parsing utilities.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseCoord, firstCoord, LATLON_RE } from './coords';

test('parseCoord: latlon ordering returns values as-is', () => {
  assert.deepEqual(parseCoord('41.31,69.28', 'latlon'), [41.31, 69.28]);
});

test('parseCoord: lonlat ordering swaps values', () => {
  // Input is lon,lat; result must be [lat, lon].
  assert.deepEqual(parseCoord('27.56,53.9', 'lonlat'), [53.9, 27.56]);
});

test('parseCoord: handles negative coordinates', () => {
  assert.deepEqual(parseCoord('-33.8688,151.2093', 'latlon'), [-33.8688, 151.2093]);
});

test('parseCoord: tolerates the Google "+"-as-space form', () => {
  // Google encodes the space after the comma as "+": /search/41.29,+69.21
  assert.deepEqual(parseCoord('41.29,+69.21', 'latlon'), [41.29, 69.21]);
});

test('parseCoord: extracts a pair embedded in surrounding text', () => {
  assert.deepEqual(parseCoord('/maps/place/@41.31,69.28,17z', 'latlon'), [41.31, 69.28]);
});

test('parseCoord: rejects out-of-range latitude', () => {
  assert.equal(parseCoord('91.0,10.0', 'latlon'), null);
});

test('parseCoord: rejects out-of-range longitude', () => {
  assert.equal(parseCoord('10.0,181.0', 'latlon'), null);
});

test('parseCoord: returns null when no pair is present', () => {
  assert.equal(parseCoord('no coords here', 'latlon'), null);
  assert.equal(parseCoord(null, 'latlon'), null);
  assert.equal(parseCoord(undefined, 'latlon'), null);
});

test('firstCoord: picks the first source that yields a valid pair', () => {
  const place = firstCoord([null, 'garbage', '41.31,69.28', '1,2'], 'latlon');
  assert.deepEqual(place, { lat: 41.31, lon: 69.28, label: undefined });
});

test('firstCoord: attaches the provided label', () => {
  const place = firstCoord(['41.31,69.28'], 'latlon', 'Tashkent');
  assert.deepEqual(place, { lat: 41.31, lon: 69.28, label: 'Tashkent' });
});

test('firstCoord: returns null when no source is valid', () => {
  assert.equal(firstCoord([null, undefined, 'nope'], 'latlon'), null);
});

test('LATLON_RE: matches a bare coordinate string', () => {
  assert.ok(LATLON_RE.test('41.31,69.28'));
  assert.ok(!LATLON_RE.test('Central Park'));
});
