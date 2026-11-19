import {createClient} from '@supabase/supabase-js';
import {empty,validateDocument,validateFile} from './core.mjs';

const request = r => new Promise((resolve,reject)=>{r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
const completed = tx => new Promise((resolve,reject)=>{tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||new Error('저장 작업이 취소됐어요.'));});
export class LocalRepository {
  constructor(){this.user=null;this.version=0;this.ready=new Promise((resolve,reject)=>{const r=indexedDB.open('moa-app-v1',1);r.onupgradeneeded=()=>{r.result.createObjectStore('state');r.result.createObjectStore('media');};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
  async load(){const d=await this.ready;const row=await request(d.transaction('state').objectStore('state').get('guest'));this.version=row?.version||0;return validateDocument(row?.db||empty());}
  async commit(db){const d=await this.ready,next=validateDocument(db);const tx=d.transaction('state','readwrite'),done=completed(tx),s=tx.objectStore('state');const row=await request(s.get('guest'));if((row?.version||0)!==this.version){tx.abort();await done.catch(()=>{});throw Error('다른 창에서 기록을 변경했어요. 새로 불러온 후 다시 저장해 주세요.');}const version=this.version+1;s.put({db:next,version},'guest');await done;this.version=version;return next;}
  async put(file){validateFile(file);const id=crypto.randomUUID(),d=await this.ready,tx=d.transaction('media','readwrite'),done=completed(tx);tx.objectStore('media').put(file,id);await done;return id;}
  async get(id){const d=await this.ready;return request(d.transaction('media').objectStore('media').get(id));}
  async remove(ids){const d=await this.ready,tx=d.transaction('media','readwrite'),done=completed(tx);for(const k of ids)tx.objectStore('media').delete(k);await done;}
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
  async put(file){validateFile(file);const path=this.user.id+'/'+crypto.randomUUID();const {error}=await this.client.storage.from('moa-private').upload(path,file,{contentType:file.type,upsert:false});if(error)throw error;return path;}
  async get(path){if(!path.startsWith(this.user.id+'/'))throw Error('다른 사용자의 첨부 파일에 접근할 수 없어요.');const {data,error}=await this.client.storage.from('moa-private').download(path);if(error)throw error;return data;}
  async remove(paths){if(!paths.length)return;const {error}=await this.client.storage.from('moa-private').remove(paths);if(error)throw error;}
}
