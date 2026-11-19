import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
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
console.log('Scripture PASS: 66 books, 1189 chapters, 31102 verses; John matches existing text exactly.');
