import test from 'node:test';
import assert from 'node:assert/strict';

import { shouldRespondInGroup } from '../dist/src/group-filter.js';

test('group-filter: responds to question mark', () => {
  assert.equal(shouldRespondInGroup('怎么用？', [], undefined), true);
});

test('group-filter: responds when mentioned', () => {
  assert.equal(shouldRespondInGroup('hello', [{}], undefined), true);
});

test('group-filter: does not respond to casual chat', () => {
  assert.equal(shouldRespondInGroup('随便聊聊', [], undefined), false);
});
