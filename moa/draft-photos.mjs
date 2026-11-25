import {validateFile} from './core.mjs';

export const PHOTO_DB='moa-writing-photos-v1';
export const PHOTO_FENCE_KEY='moa-writing-photos-epoch';
export const MAX_DRAFT_PHOTOS=48*1048576;
let connection;
const open=()=>connection??=new Promise((resolve,reject)=>{
 const request=indexedDB.open(PHOTO_DB,1);
 request.onupgradeneeded=()=>request.result.createObjectStore('photos',{keyPath:'id'});
 request.onsuccess=()=>{const db=request.result;db.onversionchange=()=>{db.close();connection=undefined;};resolve(db);};
 request.onerror=()=>{connection=undefined;reject(request.error);};
 request.onblocked=()=>{connection=undefined;reject(Error('Draft photo storage blocked'));};
});
export function validateDraftPhotos(files){
 if(!Array.isArray(files)||files.length>6)throw Error('사진 초안은 최대 6장까지 보관해요.');
 let bytes=0;
 for(const file of files){validateFile(file);if(!file.type.startsWith('image/')||typeof file.name!=='string'||file.name.length>1024)throw Error('사진 초안 형식을 확인해 주세요.');bytes+=file.size;}
 if(bytes>MAX_DRAFT_PHOTOS)throw Error('사진 초안은 합계 48MiB까지 보관해요.');
 return files;
}
export const photoFence=()=>localStorage.getItem(PHOTO_FENCE_KEY);
async function transaction(mode,operate){
 const db=await open();return new Promise((resolve,reject)=>{
  const tx=db.transaction('photos',mode);let value;
  tx.oncomplete=()=>resolve(value);tx.onabort=()=>reject(tx.error||Error('Draft photo transaction cancelled'));tx.onerror=()=>{};
  try{operate(tx.objectStore('photos'),v=>value=v,tx);}catch(error){tx.abort();reject(error);}
 });
}
export async function putDraftPhotos(owner,files,{fence,allowed}){
 validateDraftPhotos(files);if(!files.length)return null;
 const id=crypto.randomUUID();
 await transaction('readwrite',(store,_,tx)=>{
  // Check after opening IndexedDB too: a pending open must not revive photos
  // after sign-out in this or another tab.
  if(photoFence()!==fence||!allowed()){tx.abort();return;}
  store.put({id,owner,fence,created:Date.now(),files:files.map(file=>({blob:file,name:file.name,lastModified:file.lastModified}))});
 });return {id,count:files.length};
}
export async function getDraftPhotos(owner,ref){
 if(!ref)return [];
 const row=await transaction('readonly',(store,set)=>{const r=store.get(ref.id);r.onsuccess=()=>set(r.result);});
 if(!row||row.owner!==owner||row.fence!==photoFence()||!Array.isArray(row.files)||row.files.length!==ref.count)throw Error('사진 초안을 불러오지 못했어요. 다시 선택해 주세요.');
 const files=row.files.map(file=>{if(!(file.blob instanceof Blob)||typeof file.name!=='string'||!Number.isFinite(file.lastModified))throw Error('Invalid draft photo');return new File([file.blob],file.name,{type:file.blob.type,lastModified:file.lastModified});});
 return validateDraftPhotos(files);
}
export async function removeDraftPhotoSet(id){if(id)await transaction('readwrite',store=>store.delete(id));}
export async function pruneDraftPhotos(keep){
 await transaction('readwrite',store=>{const request=store.openCursor();request.onsuccess=()=>{const cursor=request.result;if(!cursor)return;if(cursor.key!==keep&&(!Number.isFinite(cursor.value.created)||Date.now()-cursor.value.created>7*24*60*60*1000))cursor.delete();cursor.continue();};});
}
export function purgeDraftPhotos(){
 // Synchronous revocation precedes asynchronous deletion. Existing transactions
 // finish before this clear; later transactions must pass the new fence.
 try{localStorage.setItem(PHOTO_FENCE_KEY,crypto.randomUUID());}catch{}
 return transaction('readwrite',store=>store.clear()).then(()=>true,()=>false);
}
