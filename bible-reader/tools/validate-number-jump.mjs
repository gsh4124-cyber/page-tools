import fs from 'node:fs';

const index = fs.readFileSync('index.html','utf8');
const runtime = fs.readFileSync('number-jump.js','utf8');

for (const id of ['chapterNumberInput','verseNumberInput']) {
  const inputTag = index.match(new RegExp(`<input[^>]*id="${id}"[^>]*>`))?.[0] || '';
  if (!inputTag) throw new Error(`${id} missing`);
  if (!/type="text"/.test(inputTag)) throw new Error(`${id} must remain type=text so the field can be cleared while editing`);
  if (!/inputmode="numeric"/.test(inputTag)) throw new Error(`${id} must keep numeric inputmode`);
  if (!/pattern="\[0-9\]\*"/.test(inputTag)) throw new Error(`${id} must remain numeric-only at the UI level`);
}

const requiredFragments = [
  "input.value.replace(/\\D+/g,'')",
  'if (!digits) return;',
  'input.dataset.max = String(max)',
  'Number(input.dataset.max)',
  'value > max',
  'input.value = String(max)',
  "event.key === 'Enter'",
  "input.addEventListener('blur',() => commit(input,select))",
  'document.activeElement !== input',
];

for (const fragment of requiredFragments) {
  if (!runtime.includes(fragment)) throw new Error(`number-jump regression guard missing: ${fragment}`);
}

if (!runtime.includes('Math.min(max,Math.max(1,value))')) {
  throw new Error('confirmed chapter/verse values must still clamp to 1..max');
}

console.log('Chapter/verse input guards OK: editable blank state, numeric filtering, live maximum clamp, Enter/blur commit, and selected-value synchronization are present.');
