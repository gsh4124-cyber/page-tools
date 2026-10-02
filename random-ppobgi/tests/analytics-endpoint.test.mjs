import assert from 'node:assert/strict';
import test from 'node:test';
import { onRequest } from '../functions/api/events.js';

const url = 'https://random-ppobgi.pages.dev/api/events';
const valid = {
  event_name: 'game_start',
  method: 'wheel',
  input_mode: 'number',
  participant_bucket: '6-10',
  result_mode: 'winner',
};

function request(body = valid, origin = 'https://random-ppobgi.pages.dev') {
  return new Request(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin },
    body: JSON.stringify(body),
  });
}

function database({ fail = false } = {}) {
  const calls = [];
  return {
    calls,
    prepare(sql) {
      return {
        bind(...values) {
          calls.push({ sql, values });
          return { run: async () => { if (fail) throw new Error('D1 unavailable'); } };
        },
      };
    },
  };
}

function post(requestValue, env) {
  return onRequest({ request: requestValue, env });
}

test('valid event increments only an aggregate row', async () => {
  const db = database();
  const response = await post(request(), { ANALYTICS_DB: db });
  assert.equal(response.status, 204);
  assert.equal(db.calls.length, 1);
  assert.deepEqual(db.calls[0].values.slice(1), ['game_start', 'wheel', 'number', '6-10', 'winner']);
});

test('unknown or sensitive-looking fields are rejected', async () => {
  const db = database();
  const response = await post(request({ ...valid, participant_name: '김철수' }), { ANALYTICS_DB: db });
  assert.equal(response.status, 400);
  assert.equal(db.calls.length, 0);
});

test('cross-origin requests are rejected', async () => {
  const response = await post(request(valid, 'https://example.com'), { ANALYTICS_DB: database() });
  assert.equal(response.status, 403);
});

test('bomb categories must use na and bomb values', async () => {
  const response = await post(request({ ...valid, method: 'bomb' }), { ANALYTICS_DB: database() });
  assert.equal(response.status, 400);
});

test('missing binding and database failure return an isolated 503', async () => {
  assert.equal((await post(request(), {})).status, 503);
  assert.equal((await post(request(), { ANALYTICS_DB: database({ fail: true }) })).status, 503);
});

test('non-POST methods are rejected', async () => {
  const response = await onRequest({ request: new Request(url), env: {} });
  assert.equal(response.status, 405);
});
