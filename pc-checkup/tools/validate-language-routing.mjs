import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const python = fs.readFileSync(new URL('./inject_language_ux.py', import.meta.url), 'utf8');
const scriptTag = python.match(/SCRIPT = '''([\s\S]*?)'''/)[1].replaceAll('\\n', '\n');
const script = scriptTag.match(/<script>([\s\S]*?)<\/script>/)[1];
function exercise({ current = 'ko', saved = null, language = 'en-US' } = {}) {
  const redirects = [], stored = {}, handlers = {};
  const picker = { value: 'en', selectedIndex: 0, options: [{ dataset: { href: 'en/index.html' } }],
    addEventListener: (name, callback) => { handlers[name] = callback; } };
  const location = { replace: url => redirects.push(url), href: '' };
  const context = { navigator: { language, languages: [language] }, location,
    localStorage: { getItem: () => saved, setItem: (key, value) => { stored[key] = value; } },
    CSS: { escape: value => value }, document: {
      documentElement: { dataset: { locale: current }, lang: current },
      addEventListener: (_name, callback) => callback(), getElementById: () => picker,
      querySelector: selector => ({ dataset: { href: selector.includes('"ja"') ? 'ja/index.html' : 'en/index.html' } }),
    } };
  vm.runInNewContext(script, context);
  return { redirects, stored, handlers, location };
}
for (const language of ['en-US', 'ja-JP', 'zh-CN']) {
  assert.deepEqual(exercise({ language }).redirects, [], `Fresh ${language} crawler must retain the Korean URL`);
}
assert.deepEqual(exercise({ saved: 'ja' }).redirects, ['ja/index.html']);
assert.deepEqual(exercise({ current: 'en', saved: 'ja' }).redirects, [], 'An explicit locale URL takes precedence');
const manual = exercise();
manual.handlers.change();
assert.equal(manual.stored['device-checkup-language-v1'], 'en');
assert.equal(manual.location.href, 'en/index.html');
console.log('Language routing PASS: fresh crawler URLs remain stable; explicit picker choices and saved preference work.');
