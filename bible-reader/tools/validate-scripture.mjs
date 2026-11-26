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
  assert(!html.includes('initial-scripture-data'),'The full John seed must not be inlined again; the HTML carries only chapter 3');
  const block=html.slice(html.indexOf('<!-- initial-scripture:start -->'),html.indexOf('<!-- initial-scripture:end -->'));
  const unescape=t=>t.replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&');
  const shown=[...block.matchAll(/<p class="verse" data-verse="(\d+)"><span class="verse-number">\d+<\/span><span class="verse-text">([^<]*)<\/span><\/p>/g)].map(m=>({verse:Number(m[1]),text:unescape(m[2])}));
  assert.deepEqual(shown,data.chapters[2].verses.map(v=>({verse:Number(v.verse),text:v.text})),'Server-rendered John 3 must exactly match the bundled text');
  assert(block.includes('<link rel="preload" href="/scripture/krv1961/John.json" as="fetch" crossorigin>'),'Default book must be preloaded for the first read');
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

const topicHub=fs.readFileSync('topics/index.html','utf8');
const siteMap=fs.readFileSync('sitemap.xml','utf8');
const topicPaths=[...topicHub.matchAll(/href="(\/topics\/[a-z-]+\/)"/g)].map(match=>match[1]);
assert(topicPaths.length>=12,'Topic directory should expose at least twelve subjects');
assert.equal(new Set(topicPaths).size,topicPaths.length,'Topic links must be unique');
assert(fs.readFileSync('index.html','utf8').includes('href="/topics/"'));
const topicOrigin='https://bible-reader-1iz.pages.dev';
assert(siteMap.includes('<loc>'+topicOrigin+'/topics/</loc>'));
const topicUnescape=value=>value.replace(/&quot;/g,'"').replace(/&#39;|&#x27;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&');
const topicBooks=new Map();
for(const path of topicPaths){
 const page=fs.readFileSync('.'+path+'index.html','utf8');
 const canonical=topicOrigin+path;
 assert(page.includes('rel="canonical" href="'+canonical+'"'),path);
 assert(siteMap.includes('<loc>'+canonical+'</loc>'),path);
 const selections=[...page.matchAll(/<section class="topic-passage" data-ref="([^"]+)">([\s\S]*?)<\/section>/g)];
 assert(selections.length>=3,path+' should offer at least three readings');
 for(const [,reference,section] of selections){
  const parsed=reference.match(/^([A-Za-z0-9]+)\.(\d+)\.(\d+)(?:-(\d+))?$/);
  assert(parsed,reference);
  const [,osis,chapter,start,end=start]=parsed;
  const book=books.find(item=>item.osis===osis);
  assert(book,reference);
  if(!topicBooks.has(osis)){
   topicBooks.set(osis,JSON.parse(fs.readFileSync('scripture/krv1961/'+book.file+'.json','utf8')));
  }
  const selected=topicBooks.get(osis).chapters[Number(chapter)-1].verses
   .filter(verse=>Number(verse.verse)>=Number(start)&&Number(verse.verse)<=Number(end))
   .map(verse=>[Number(verse.verse),verse.text]);
  const rendered=[...section.matchAll(/<p><sup>(\d+)<\/sup> <span class="topic-verse">([^<]+)<\/span><\/p>/g)]
   .map(match=>[Number(match[1]),topicUnescape(match[2])]);
  assert.equal(selected.length,Number(end)-Number(start)+1,reference);
  assert.deepEqual(rendered,selected,reference+' must match the bundled KRV verses exactly');
  assert(section.includes('href="/?v=krv1961&amp;ref='+reference+'"'),reference);
  const anchor=section.match(/href="(\/passage\/[a-z0-9-]+\/)#v(\d+)"/);
  assert(anchor,reference);
  assert.equal(anchor[2],start,reference);
  const sourceChapter=fs.readFileSync('.'+anchor[1]+'index.html','utf8');
  assert(sourceChapter.includes('id="v'+start+'"'),reference);
  assert(sourceChapter.includes('ref='+osis+'.'+chapter+'.'),reference);
 }
}
console.log('Topic Scripture PASS: '+topicPaths.length+' linked topics with exact bundled KRV text and working passage anchors.');
