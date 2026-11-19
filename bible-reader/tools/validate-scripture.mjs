import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const source=fs.readFileSync('app.js','utf8');
const books=vm.runInNewContext(source.slice(0,source.indexOf('const TRANSLATIONS'))+';BOOKS');
const structureContext={window:{}};
vm.runInNewContext(fs.readFileSync('scripture-index.js','utf8'),structureContext);
const index=structureContext.window.BibleChapterIndex.krv1961;
assert.equal(index.length,books.length);
assert(fs.readFileSync('index.html','utf8').includes('src="scripture-index.js"'));
let chapters=0,verses=0;
for(const book of books){
 const data=JSON.parse(fs.readFileSync(`scripture/krv1961/${book.file}.json`,'utf8'));
 assert.equal(JSON.stringify(index[book.index]),JSON.stringify(data.chapters.map(ch=>ch.verses.length)),`${book.file}: instant number grids must match the exact bundled text`);
 assert(data.chapters.length>0);
 data.chapters.forEach((chapter,i)=>{
  assert.equal(Number(chapter.chapter),i+1);chapters++;
  chapter.verses.forEach((verse,j)=>{assert.equal(Number(verse.verse),j+1);assert.equal(typeof verse.text,'string');assert(verse.text.trim());verses++;});
 });
 if(book.file==='John'){
  const html=fs.readFileSync('index.html','utf8');
  const seed=JSON.parse(html.match(/<script[^>]+id="initial-scripture-data"[^>]*>([\s\S]*?)<\/script>/)[1]);
  assert.deepEqual(data.chapters,seed.chapters,'Bundled John must exactly match the existing embedded text');
 }
}
assert.equal(books.length,66);assert.equal(chapters,1189);assert.equal(verses,31102);
const provenance=JSON.parse(fs.readFileSync('tools/scripture-index-sources.json','utf8'));
const runtime=vm.createContext({window:structureContext.window,document:{querySelector:()=>null}});
vm.runInContext(source.slice(0,source.indexOf('const $=')),runtime);
vm.runInContext(fs.readFileSync('extra-translations.js','utf8'),runtime);
vm.runInContext("const cache=new Map();let activeTranslationId='krv1961';"+source.slice(source.indexOf('function getBookStructure('),source.indexOf('async function fetchBook(')),runtime);
const ids=vm.runInContext('Object.keys(TRANSLATIONS)',runtime);
assert.deepEqual(Object.keys(structureContext.window.BibleChapterIndex).sort(),Array.from(ids).sort());
assert.equal(vm.runInContext('MIDVASH_REVISION',runtime),provenance.provider_revision);
for(const id of ids){
 const entries=structureContext.window.BibleChapterIndex[id],proof=provenance.translations[id];
 assert.equal(entries.length,66,`${id}: all books need immediate grids`);
 assert.equal(createHash('sha256').update(JSON.stringify(entries)).digest('hex'),proof.structure_sha256,`${id}: generated structure changed without source verification`);
 let totalChapters=0,totalVerses=0;
 for(const book of books){
  const actual=runtime.getBookStructure(book.index,id);
  const expected=entries[book.index].map((entry,i)=>typeof entry==='number'?{chapter:i+1,verses:Array.from({length:entry},(_,n)=>n+1)}:entry);
  assert.equal(JSON.stringify(actual),JSON.stringify(expected));
  for(const ch of actual){
   assert(Number.isInteger(ch.chapter)&&ch.chapter>0);
   assert(ch.verses.length>0&&ch.verses.every((n,i)=>Number.isInteger(n)&&n>0&&(i===0||n>ch.verses[i-1])));
   totalChapters++;totalVerses+=ch.verses.length;
  }
 }
 assert.equal(totalChapters,proof.chapters);assert.equal(totalVerses,proof.verses);
}
// Sparse numbering must not become a count-based, renumbered 1..N list.
assert(!runtime.getBookStructure(43,'asv')[7].verses.includes(37));
assert(runtime.getBookStructure(43,'asv')[7].verses.includes(40));
vm.runInContext("cache.set('asv:Acts',{chapters:[{chapter:8,verses:[{verse:3},{verse:7}]}]})",runtime);
assert.equal(JSON.stringify(runtime.getBookStructure(43,'asv')),'[{"chapter":8,"verses":[3,7]}]','Fetched passage numbering takes precedence');
console.log(`Scripture PASS: KRV 66 books, 1189 chapters, 31102 verses; John matches existing text exactly. Instant grids validated for all ${ids.length} translations (726 books).`);
