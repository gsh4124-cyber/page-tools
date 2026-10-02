import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];

test('inline JavaScript remains syntactically valid', () => {
  assert.ok(script);
  assert.doesNotThrow(() => new Function(script));
});

test('all four events are wired to validated run and completion paths', () => {
  for (const event of ['game_start', 'game_complete', 'reroll', 'exclude_reroll']) {
    assert.match(script, new RegExp(`['\"]${event}['\"]`));
  }
  assert.match(script, /run\(false,'initial'\)/);
  assert.match(script, /run\(false,'reroll'\)/);
  assert.match(script, /run\(true,'exclude_reroll'\)/);
  assert.match(script, /function markGameComplete\(\)/);
  assert.match(script, /if\(currentRunCompleted\)\{currentRunCompleted=false;trackEvent\('reroll'\);trackEvent\('game_start'\)\}/);
});

test('client payload allowlist contains no entered content or identifier fields', () => {
  const tracking = script.slice(script.indexOf("const ANALYTICS_ENDPOINT"), script.indexOf('const parseNames'));
  for (const forbidden of ['names', 'lastWinners', 'lastResults', 'email', 'user_id', 'session_id', 'cookie']) {
    assert.equal(tracking.includes(forbidden), false, `tracking code contains forbidden field: ${forbidden}`);
  }
  assert.match(tracking, /credentials:'omit'/);
  assert.match(tracking, /\.catch\(\(\)=>\{\}\)/);
});
