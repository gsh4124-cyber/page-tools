import fs from 'node:fs';

const index=fs.readFileSync('index.html','utf8');
const nav=fs.readFileSync('title-navigator.js','utf8');
const picker=fs.readFileSync('verse-picker.js','utf8');
const css=fs.readFileSync('title-navigator.css','utf8');
const layout=fs.readFileSync('i18n-layout.css','utf8');

for(const id of ['bookSelect','chapterSelect','verseSelect']){
  const tag=index.match(new RegExp(`<select[^>]*id="${id}"[^>]*>`))?.[0]||'';
  if(!tag) throw new Error(`${id} missing`);
  if(!/\shidden(?:\s|>)/.test(tag+'>')) throw new Error(`${id} must stay hidden; title navigator is the visible navigation surface`);
}
if(!index.includes('id="chapterTitle"')) throw new Error('chapterTitle trigger missing');
if(!index.includes('src="title-navigator.js"')) throw new Error('title navigator runtime missing from index');
if(index.includes('src="number-jump.js"')||index.includes('src="book-picker.js"')) throw new Error('retired topbar book/chapter/verse picker runtime must not be loaded');

for(const fragment of [
  "title.setAttribute('role','button')",
  "title.setAttribute('aria-haspopup','dialog')",
  "data-switch=\"old\"",
  "data-switch=\"new\"",
  "data-step=\"book\"",
  "data-step=\"chapter\"",
  "data-step=\"verse\"",
  "currentStep = 'book'",
  "setStep('chapter'",
  "setStep('verse'",
  "backButton.addEventListener('click',goBack)",
  "close({restoreFocus:false})",
  "renderNumberGrid(chapterSelect,chapters,'chapter')",
  "renderNumberGrid(verseSelect,verses,'verse')",
  "bookSelect.dispatchEvent(new Event('change',{bubbles:true}))",
]){
  if(!nav.includes(fragment)) throw new Error(`title navigator regression guard missing: ${fragment}`);
}
// Chapter and verse grids must update within the same selection turn.
for(const fragment of [
  'window.BibleVersePicker?.sync?.()',
  'awaitingBookIndex = Number(option.value)',
  'showLoading(chapters)',
]){
  if(!nav.includes(fragment)) throw new Error(`stale title navigation grid regression: ${fragment}`);
}
if(nav.includes('requestAnimationFrame(() => requestAnimationFrame(() => {')) throw new Error('delayed repaint of stale verse options returned');
for(const fragment of [
  'window.BibleVersePicker={sync:populateVerseSelect}',
  'referenceChanged',
  'verseSelect.value="1"',
]){
  if(!picker.includes(fragment)) throw new Error(`verse picker sync/reset regression: ${fragment}`);
}

if(!css.includes('.title-navigator-testament-switch')) throw new Error('Old/New testament switch styling missing');
if(css.includes('.title-navigator-testaments{display:grid;grid-template-columns:minmax(0,1.45fr)')) throw new Error('old dual-column testament layout returned');

if(!layout.includes('grid-template-rows:42px!important')) throw new Error('top translation/language/search row must remain single-row');
if(!layout.includes('grid-column:3!important;grid-row:1!important')) throw new Error('search must stay in row 1');

console.log('Navigation validation passed: title navigation updates chapter/verse choices synchronously without showing previous selection, with back navigation and the compact topbar.');
