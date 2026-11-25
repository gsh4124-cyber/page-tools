import {CATEGORIES,DECOR,validDate} from './core.mjs';

// A separate, bounded browser-local draft. Never part of the diary/backup schema.
export const DRAFT_KEY='moa-writing-draft-v1';
export const DRAFT_TTL=7*24*60*60*1000;
const meaningful=f=>Boolean(f.title.trim()||f.content.trim()||f.sticker||f.decoration!=='none'||f.category!==CATEGORIES[0]||f.attachments);
function fields(input){
 if(!input||typeof input!=='object')throw Error('Invalid draft');
 const out={};
 for(const [key,max] of [['title',100],['content',20000],['sticker',12]]){
  if(typeof input[key]!=='string'||input[key].length>max)throw Error('Invalid draft');out[key]=input[key];
 }
 if(!validDate(input.recordDate)||!CATEGORIES.includes(input.category)||!DECOR.includes(input.decoration)||typeof input.optimizePhotos!=='boolean'||!Number.isInteger(input.attachments)||input.attachments<0||input.attachments>1000)throw Error('Invalid draft');
 return {...out,recordDate:input.recordDate,category:input.category,decoration:input.decoration,optimizePhotos:input.optimizePhotos,attachments:input.attachments};
}
export function writingDrafts({storage,now=Date.now,revision=()=>crypto.randomUUID(),status=()=>{}}){
 let owner,expected=null,blocked=false;
 const read=()=>storage.getItem(DRAFT_KEY);
 const report=state=>{status(state);return state;};
 const conflict=()=>{blocked='conflict';return report('conflict');};
 return {
  begin(identity){
   const changed=owner!==undefined&&owner!==identity;owner=identity;blocked=false;expected=null;
   try{
    if(changed)storage.removeItem(DRAFT_KEY);
    const raw=read();if(!raw){report('empty');return null;}
    let draft;
    try{draft=JSON.parse(raw);if(raw.length>50000||draft.version!==1||draft.owner!==owner||typeof draft.revision!=='string'||draft.revision.length>100||!Number.isFinite(draft.updated)||draft.updated>now()+60000||now()-draft.updated>DRAFT_TTL)throw Error();draft.fields=fields(draft.fields);if(!meaningful(draft.fields))throw Error();}
    catch{storage.removeItem(DRAFT_KEY);report('empty');return null;}
    expected=raw;report('restored');return draft.fields;
   }catch{blocked='unavailable';report('unavailable');return null;}
  },
  save(input){
   if(owner===undefined)return;if(blocked)return report(blocked);
   try{
    if(read()!==expected)return conflict();
    const value=fields(input);
    if(!meaningful(value)){storage.removeItem(DRAFT_KEY);expected=null;return report('empty');}
    const raw=JSON.stringify({version:1,owner,revision:revision(),updated:now(),fields:value});
    storage.setItem(DRAFT_KEY,raw);expected=raw;return report('saved');
   }catch{return report('unavailable');}
  },
  clear(){
   if(owner===undefined)return;
   try{if(read()!==expected)return conflict();storage.removeItem(DRAFT_KEY);expected=null;report('empty');}
   catch{report('unavailable');}
  },
  purge(){
   blocked='unavailable';expected=null;
   try{storage.removeItem(DRAFT_KEY);report('empty');}catch{report('unavailable');}
  },
  changed(){try{if(owner!==undefined&&read()!==expected)conflict();}catch{report('unavailable');}}
 };
}
