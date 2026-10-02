import fs from 'node:fs';

const index=fs.readFileSync('index.html','utf8');
const nav=fs.readFileSync('title-navigator.js','utf8');
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
if(!css.includes('.title-navigator-testament-switch')) throw new Error('Old/New testament switch styling missing');
if(css.includes('.title-navigator-testaments{display:grid;grid-template-columns:minmax(0,1.45fr)')) throw new Error('old dual-column testament layout returned');

if(!layout.includes('grid-template-rows:42px!important')) throw new Error('top translation/language/search row must remain single-row');
if(!layout.includes('grid-column:3!important;grid-row:1!important')) throw new Error('search must stay in row 1');

console.log('Navigation validation passed: title navigation is sequential book -> chapter -> verse with back navigation, Old/New switch buttons, and the compact topbar stays one row.');
