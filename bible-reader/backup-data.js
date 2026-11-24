// Shared, validated backup format. Older backups do not erase a newer verse collection.
(() => {
 const object=v=>!!v&&typeof v==='object'&&!Array.isArray(v);
 const safeKey=k=>!['__proto__','constructor','prototype'].includes(k);
 function map(input,kind){
  if(!object(input))throw Error('invalid backup map');
  const result={};
  for(const [key,value] of Object.entries(input)){
   if(!safeKey(key))throw Error('invalid backup key');
   if(kind==='notes'){if(typeof value!=='string')throw Error('invalid note');result[key]=value;continue;}
   const pattern=kind==='marks'?/^[a-z0-9]+:\d{1,2}:\d{1,3}:\d{1,3}$/:/^[a-z0-9]+:\d{1,2}:\d{1,3}$/;
   if(!pattern.test(key)||!object(value))throw Error('invalid record');
   const [,book,chapter,verse]=key.split(':');if(+book>65||+chapter<1||+chapter>150||(verse!==undefined&&(+verse<1||+verse>176)))throw Error('invalid reference');
   if(Object.values(value).some(v=>!['string','number','boolean'].includes(typeof v)&&v!==null)||Object.keys(value).some(k=>!safeKey(k)))throw Error('invalid record value');
   if(kind==='marks'&&((value.note!==undefined&&typeof value.note!=='string')||['highlight','bookmark'].some(k=>value[k]!==undefined&&typeof value[k]!=='boolean')))throw Error('invalid mark');
   if(kind==='chapters'&&(!Number.isInteger(value.bookIndex)||value.bookIndex!==+book||!Number.isInteger(value.chapter)||value.chapter!==+chapter))throw Error('invalid chapter');
   result[key]={...value};
  }
  return result;
 }
 function passages(value){
  if(!Array.isArray(value))throw Error('invalid collection');
  const unique=new Map();for(const r of value){if(!object(r)||!Number.isInteger(r.bookIndex)||r.bookIndex<0||r.bookIndex>65||!Number.isInteger(r.chapter)||r.chapter<1||r.chapter>150||!Number.isInteger(r.verse)||r.verse<1||r.verse>176)throw Error('invalid collection reference');unique.set(`${r.bookIndex}:${r.chapter}:${r.verse}`,{bookIndex:r.bookIndex,chapter:r.chapter,verse:r.verse});}return [...unique.values()];
 }
 function normalize(data){
  if(!object(data)||data.app!=='bible-reader'||(data.version!==undefined&&![1,2,3].includes(data.version)))throw Error('unsupported backup');
  const result={app:'bible-reader',version:3,verseMarks:map(data.verseMarks,'marks'),chapterBookmarks:map(data.chapterBookmarks,'chapters'),recordNotes:map(data.recordNotes===undefined?{}:data.recordNotes,'notes')};
  if(data.memoryPassages!==undefined)result.memoryPassages=passages(data.memoryPassages);
  return result;
 }
 function combine(current,incoming,mode='merge'){
  const saved=normalize(current),backup=normalize(incoming);if(!['merge','replace'].includes(mode))throw Error('invalid restore mode');
  const result={...backup};
  for(const key of ['verseMarks','chapterBookmarks','recordNotes'])result[key]=mode==='merge'?{...backup[key],...saved[key]}:backup[key];
  result.memoryPassages=backup.memoryPassages===undefined?(saved.memoryPassages||[]):mode==='merge'?passages([...(saved.memoryPassages||[]),...backup.memoryPassages]):backup.memoryPassages;
  return result;
 }
 globalThis.BibleRecordBackup={normalize,combine};
})();
