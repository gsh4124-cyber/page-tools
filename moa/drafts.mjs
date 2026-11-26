import {CATEGORIES,DECOR,validDate} from './core.mjs';

// A separate, bounded browser-local draft. Never part of the diary/backup schema.
export const DRAFT_KEY='moa-writing-draft-v1';
export const DRAFT_TTL=7*24*60*60*1000;
const meaningful=f=>Boolean(f.tagInput?.trim()||f.title.trim()||f.content.trim()||f.sticker||f.decoration!=='none'||f.category!==CATEGORIES[0]||f.attachments);
function fields(input){
 if(!input||typeof input!=='object')throw Error('Invalid draft');
 const out={};
 for(const [key,max] of [['title',100],['content',20000],['sticker',12]]){
  if(typeof input[key]!=='string'||input[key].length>max)throw Error('Invalid draft');out[key]=input[key];
 }
 if(input.tagInput!==undefined){
  if(typeof input.tagInput!=='string'||input.tagInput.length>512)throw Error('Invalid draft tags');
  if(input.tagInput)out.tagInput=input.tagInput;
 }
 if(!validDate(input.recordDate)||!CATEGORIES.includes(input.category)||!DECOR.includes(input.decoration)||typeof input.optimizePhotos!=='boolean'||!Number.isInteger(input.attachments)||input.attachments<0||input.attachments>1000)throw Error('Invalid draft');
 if(input.photos!==undefined){if(!input.photos||!/^[-a-f0-9]{36}$/.test(input.photos.id)||!Number.isInteger(input.photos.count)||input.photos.count<1||input.photos.count>6||input.photos.count>input.attachments)throw Error('Invalid draft photos');out.photos={id:input.photos.id,count:input.photos.count};}
 return {...out,recordDate:input.recordDate,category:input.category,decoration:input.decoration,optimizePhotos:input.optimizePhotos,attachments:input.attachments};
}
export function writingDrafts({storage,now=Date.now,revision=()=>crypto.randomUUID(),status=()=>{},removeMedia=()=>{},generation=()=>null}){
 let owner,expected=null,blocked=false,expectedGeneration;
 const read=()=>storage.getItem(DRAFT_KEY);
 const report=state=>{status(state);return state;};
 const conflict=()=>{blocked='conflict';return report('conflict');};
 return {
  begin(identity){
   const changed=owner!==undefined&&owner!==identity;owner=identity;blocked=false;expected=null;
   try{
    if(changed){removeMedia();storage.removeItem(DRAFT_KEY);}expectedGeneration=generation();
    const raw=read();if(!raw){report('empty');return null;}
    let draft;
    try{draft=JSON.parse(raw);if(raw.length>50000||draft.version!==1||draft.owner!==owner||typeof draft.revision!=='string'||draft.revision.length>100||!Number.isFinite(draft.updated)||draft.updated>now()+60000||now()-draft.updated>DRAFT_TTL)throw Error();draft.fields=fields(draft.fields);if(!meaningful(draft.fields))throw Error();}
    catch{removeMedia();storage.removeItem(DRAFT_KEY);expectedGeneration=generation();report('empty');return null;}
    expected=raw;report('restored');return draft.fields;
   }catch{blocked='unavailable';report('unavailable');return null;}
  },
  save(input){
   if(owner===undefined)return;if(blocked)return report(blocked);
   try{
    if(generation()!==expectedGeneration||read()!==expected)return conflict();
    const value=fields(input);
    if(!meaningful(value)){if(expected!==null){removeMedia();storage.removeItem(DRAFT_KEY);expected=null;expectedGeneration=generation();}return report('empty');}
    if(expected&&JSON.stringify(JSON.parse(expected).fields)===JSON.stringify(value))return report('saved');
    const raw=JSON.stringify({version:1,owner,revision:revision(),updated:now(),fields:value});
    storage.setItem(DRAFT_KEY,raw);if(generation()!==expectedGeneration){if(read()===raw)storage.removeItem(DRAFT_KEY);return conflict();}expected=raw;return report('saved');
   }catch{return report('unavailable');}
  },
  clear(){
   if(owner===undefined)return;
   try{if(generation()!==expectedGeneration||read()!==expected)return conflict();removeMedia();storage.removeItem(DRAFT_KEY);expected=null;expectedGeneration=generation();report('empty');}
   catch{report('unavailable');}
  },
  purge(){
   blocked='unavailable';expected=null;
   try{removeMedia();storage.removeItem(DRAFT_KEY);report('empty');}catch{report('unavailable');}
  },
  current(){try{return owner!==undefined&&!blocked&&generation()===expectedGeneration&&read()===expected;}catch{return false;}},
  changed(){try{if(owner!==undefined&&(generation()!==expectedGeneration||read()!==expected))conflict();}catch{report('unavailable');}}
 };
}
