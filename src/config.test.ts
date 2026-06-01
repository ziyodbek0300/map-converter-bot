// Unit tests for config parsing helpers.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseAdminIds } from './config';

test('parseAdminIds: parses a comma-separated list', () => {
  assert.deepEqual(parseAdminIds('111, 222,333'), [111, 222, 333]);
});

test('parseAdminIds: returns empty array for undefined or empty', () => {
  assert.deepEqual(parseAdminIds(undefined), []);
  assert.deepEqual(parseAdminIds(''), []);
});

test('parseAdminIds: drops non-numeric and non-positive entries', () => {
  assert.deepEqual(parseAdminIds('111,abc,-5,0,222'), [111, 222]);
});
