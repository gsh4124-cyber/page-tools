import fs from 'node:fs';

const langs=['en','fr','de','zh','ru','la','pt','ar'];
const requiredFiles=['index.html','app.js','full-reader-loader.js','ui-language-sync.js','local-file-language.js','clipboard.js','exact-search.js','i18n-layout.css','title-navigator.js','title-navigator.css'];
for(const file of requiredFiles){if(!fs.existsSync(file))throw new Error(`missing required file: ${file}`);}
for(const lang of langs){if(!fs.existsSync(`${lang}/index.html`))throw new Error(`missing localized entry: ${lang}/index.html`);}

const root=fs.readFileSync('index.html','utf8');
if(!root.includes('<html lang="ko"')) throw new Error('root html lang must remain ko');
if(root.includes('lang="ar" dir="rtl"')) throw new Error('root must not become globally RTL');
for(const required of ['id="translationSelect"','id="bookSelect"','id="chapterSelect"','id="verseSelect"','id="chapterTitle"','src="title-navigator.js"','href="title-navigator.css"']){
  if(!root.includes(required)) throw new Error(`root reader contract missing: ${required}`);
}
if(!root.includes('id="bookSelect" aria-label="성경책" hidden')||!root.includes('id="chapterSelect" aria-label="장" hidden')||!root.includes('id="verseSelect" aria-label="절" hidden')){
  throw new Error('book/chapter/verse native state controls must remain hidden and available to the title navigator');
}

for(const lang of langs){
  const html=fs.readFileSync(`${lang}/index.html`,'utf8');
  if(!html.includes(`lang="${lang}"`))throw new Error(`${lang} html lang mismatch`);
  if(!html.includes('src="/full-reader-loader.js"'))throw new Error(`${lang} shared reader loader missing`);
  if(html.includes('src="ui-language-sync.js"')||html.includes('src="exact-search.js"')||html.includes('src="clipboard.js"')){
    throw new Error(`${lang} entry should stay lightweight and let full-reader-loader inject the shared root runtime`);
  }
}

const app=fs.readFileSync('app.js','utf8');
if(!app.includes('bookSelect.addEventListener("change"')||!app.includes('chapterSelect.addEventListener("change"')) throw new Error('shared native book/chapter state handlers missing');

const uiSync=fs.readFileSync('ui-language-sync.js','utf8');
if(!uiSync.includes("Object.defineProperty(document, 'title'")) throw new Error('UI title owner guard missing');
if(!uiSync.includes('enforceStableUiDirection')) throw new Error('stable UI direction guard missing');
if(!uiSync.includes("location.protocol !== 'file:'")||!uiSync.includes('location.assign(target)')) throw new Error('public UI language change must route to its localized reader URL');
for(const pair of ["ko: 'krv1961'","en: 'kjv'","fr: 'lsg'","de: 'luth1912'","zh: 'cuv'","ru: 'synodal'","la: 'vulg'","pt: 'almeida1819'","ar: 'svd'"]){if(!uiSync.includes(pair))throw new Error(`default translation mapping missing: ${pair}`);}
const localRoute=fs.readFileSync('local-file-language.js','utf8');
if(!localRoute.includes("url.searchParams.set('translation', translation)")) throw new Error('local language switch must update translation query');
const loader=fs.readFileSync('full-reader-loader.js','utf8');
if(loader.includes("lang==='ar'?' dir=\"rtl\"'")) throw new Error('localized entry loader must not force global RTL');
if(!loader.includes('const failure =')) throw new Error('localized loader failure messages missing');
if(!loader.includes("fetch(`${base}index.html`, {cache:'no-store'})")) throw new Error('localized entries must load the current root reader without stale caching');

const layout=fs.readFileSync('i18n-layout.css','utf8');
if(!layout.includes('.centered-nav .location-controls{display:grid!important')||!layout.includes('grid-template-rows:42px!important')||!layout.includes('@media(min-width:761px)')||!layout.includes('@media(max-width:760px)')) throw new Error('responsive multilingual header single-row contract missing');
if(!layout.includes('.location-controls .top-search{display:grid!important')) throw new Error('search input and action must render as one grouped control');
if(!layout.includes('word-spacing:normal!important')) throw new Error('chapter heading must preserve visible spacing between book name and chapter');

const navigator=fs.readFileSync('title-navigator.js','utf8');
for(const fragment of [
  'title-navigator-testament-switch',
  'data-switch="old"',
  'data-switch="new"',
  'activeTestament',
  'data-step="book"',
  'data-step="chapter"',
  'data-step="verse"',
  "currentStep = 'book'",
  'renderBooks()',
  "renderNumberGrid(chapterSelect,chapters,'chapter')",
  "renderNumberGrid(verseSelect,verses,'verse')",
  "backButton.addEventListener('click',goBack)",
]){
  if(!navigator.includes(fragment)) throw new Error(`title navigator contract missing: ${fragment}`);
}
const navCss=fs.readFileSync('title-navigator.css','utf8');
if(!navCss.includes('.title-navigator-testament-switch')||navCss.includes('.title-navigator-testaments{display:grid;grid-template-columns:minmax(0,1.45fr)')) throw new Error('title navigator must use Old/New switch buttons instead of simultaneous dual columns');

const clipboard=fs.readFileSync('clipboard.js','utf8');
if(!clipboard.includes('BibleI18n?.scriptureLang')) throw new Error('copied scripture references must follow translation language, not UI language');
if(!clipboard.includes('`[${translationName()}] ${refParts(startVerse, endVerse)}')) throw new Error('copied scripture must include the selected translation before the reference');
if(!clipboard.includes('${localizedPageName()} · ${SITE_URL}')) throw new Error('copied scripture must keep localized page name and site URL on one attribution line');
for(const lang of langs){if(!clipboard.includes(`${lang}:`)&&lang!=='ko')throw new Error(`clipboard localized page name missing for ${lang}`);}
const exactSearch=fs.readFileSync('exact-search.js','utf8');
if(!exactSearch.includes('BibleI18n?.bookName')) throw new Error('search result references must follow translation language');
for(const lang of langs){if(!exactSearch.includes(`${lang}:{prepare:`))throw new Error(`search runtime messages missing for ${lang}`);}

console.log('i18n validation passed for the current shared reader, sequential title navigator, and loader-based localized entries');
