import {createClient} from '@supabase/supabase-js';
import {empty,validateDocument,validateFile,MAX_BACKUP_MEDIA} from './core.mjs';

const keys=db=>new Set(db.entries.flatMap(e=>e.mediaKeys));
const unwrap=row=>row?.file||row;
export async function preflight(repo,db,files,removed=[]){
 const usage=await repo.usage();let active=usage.active;
 for(const k of new Set(removed))if(!keys(db).has(k))active-=(await repo.get(k))?.size||0;
 const bytes=files.reduce((n,f)=>n+f.size,0);
 if(active+bytes>MAX_BACKUP_MEDIA)throw Error('기록에 연결된 사진·영상은 합계 48MiB까지 보관할 수 있어요. 먼저 백업하고 첨부를 정리해 주세요.');
 if(usage.reserved+bytes>96*1024*1024||usage.count+files.length>500)throw Error('임시 첨부 저장 한도에 도달했어요. 하루 지난 미사용 첨부를 정리한 후 다시 시도해 주세요.');
}

const request = r => new Promise((resolve,reject)=>{r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
const completed = tx => new Promise((resolve,reject)=>{tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||new Error('저장 작업이 취소됐어요.'));});
export class LocalRepository {
  constructor(){this.user=null;this.version=0;this.ready=new Promise((resolve,reject)=>{const r=indexedDB.open('moa-app-v1',1);r.onupgradeneeded=()=>{r.result.createObjectStore('state');r.result.createObjectStore('media');};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
  async load(){const d=await this.ready;const row=await request(d.transaction('state').objectStore('state').get('guest'));this.version=row?.version||0;return validateDocument(row?.db||empty());}
  async commit(db){const d=await this.ready,next=validateDocument(db);const tx=d.transaction(['state','media'],'readwrite'),done=completed(tx),s=tx.objectStore('state');try{const row=await request(s.get('guest'));if((row?.version||0)!==this.version)throw Error('다른 창에서 기록을 변경했어요. 새로 불러온 후 다시 저장해 주세요.');let total=0;for(const k of keys(next)){const f=unwrap(await request(tx.objectStore('media').get(k)));if(!f)throw Error('첨부 파일이 누락됐어요.');total+=f.size;}if(total>MAX_BACKUP_MEDIA)throw Error('기록에 연결된 미디어 한도는 48MiB예요.');const version=this.version+1;s.put({db:next,version},'guest');await done;this.version=version;return next;}catch(e){try{tx.abort();}catch{}await done.catch(()=>{});throw e;}}
  async put(file){validateFile(file);const id=crypto.randomUUID(),d=await this.ready,tx=d.transaction('media','readwrite'),done=completed(tx),s=tx.objectStore('media');const all=await request(s.getAll());if(all.length>=500||all.reduce((n,r)=>n+unwrap(r).size,0)+file.size>96*1024*1024){tx.abort();await done.catch(()=>{});throw Error('임시 첨부 저장 한도에 도달했어요.');}s.put({file,created:Date.now()},id);await done;return id;}
  async get(id){const d=await this.ready;return unwrap(await request(d.transaction('media').objectStore('media').get(id)));}
  async remove(ids){const d=await this.ready,tx=d.transaction(['media','state'],'readwrite'),done=completed(tx);const row=await request(tx.objectStore('state').get('guest')),used=keys(row?.db||empty());for(const k of ids)if(!used.has(k))tx.objectStore('media').delete(k);await done;}
  async usage(){const d=await this.ready,tx=d.transaction(['state','media']),rows=await request(tx.objectStore('media').getAll()),ids=await request(tx.objectStore('media').getAllKeys()),row=await request(tx.objectStore('state').get('guest')),used=keys(row?.db||empty());return {reserved:rows.reduce((n,r)=>n+unwrap(r).size,0),count:rows.length,active:rows.reduce((n,r,i)=>n+(used.has(ids[i])?unwrap(r).size:0),0)};}
  async unused(){const d=await this.ready,tx=d.transaction(['state','media']),rows=await request(tx.objectStore('media').getAll()),ids=await request(tx.objectStore('media').getAllKeys()),row=await request(tx.objectStore('state').get('guest')),used=keys(row?.db||empty());return rows.flatMap((r,i)=>!used.has(ids[i])&&(r.created||0)<Date.now()-86400000?[{path:ids[i],bytes:unwrap(r).size}]:[]);}
}
export function makeClient(config){
  if(!config.url||!config.key)return null;
  const url=new URL(config.url);if(url.protocol!=='https:'||!url.hostname.endsWith('.supabase.co'))throw Error('승인된 Supabase HTTPS 주소가 필요해요.');
  if(!config.key.startsWith('sb_publishable_')){try{const p=JSON.parse(atob(config.key.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')));if(p.role!=='anon')throw Error();}catch{throw Error('공개용 Supabase 키만 사용할 수 있어요.');}}
  return createClient(config.url,config.key,{auth:{storageKey:'moa-auth-v1',persistSession:true,autoRefreshToken:true,detectSessionInUrl:false,flowType:'pkce'}});
}
export class CloudRepository {
  constructor(client,user){this.client=client;this.user=user;this.version=0;}
  async load(){const {data,error}=await this.client.from('moa_documents').select('document,version').eq('user_id',this.user.id).maybeSingle();if(error)throw error;this.version=data?.version||0;return validateDocument(data?.document||empty(),this.user.id);}
  async commit(db){const next=validateDocument(db,this.user.id);const {data,error}=await this.client.rpc('moa_commit',{p_expected_version:this.version,p_document:next});if(error)throw error;if(!Number.isInteger(data))throw Error('저장 결과를 확인할 수 없어요. 다시 불러와 주세요.');this.version=data;return next;}
  async put(file){validateFile(file);const {data:path,error:reservationError}=await this.client.rpc('moa_reserve_media',{p_bytes:file.size,p_mime:file.type});if(reservationError)throw reservationError;const {error}=await this.client.storage.from('moa-private').upload(path,file,{contentType:file.type,cacheControl:'0',upsert:false});if(error){/* An uncertain upload can have committed: retain its reservation until safe cleanup. */throw error;}return path;}
  async get(path){if(!path.startsWith(this.user.id+'/'))throw Error('다른 사용자의 첨부 파일에 접근할 수 없어요.');const {data,error}=await this.client.storage.from('moa-private').download(path,{cacheNonce:crypto.randomUUID()},{cache:'no-store'});if(error)throw error;return data;}
  async remove(paths){if(!paths.length)return;const {error}=await this.client.storage.from('moa-private').remove(paths);if(error)throw error;const {error:releaseError}=await this.client.from('moa_media').delete().in('path',paths);if(releaseError)throw releaseError;}
  async usage(){const {data,error}=await this.client.rpc('moa_storage_usage');if(error)throw error;return data;}
  async unused(){const {data,error}=await this.client.rpc('moa_unused_media');if(error)throw error;return data;}
}
