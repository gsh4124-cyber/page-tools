export const MAX_FILE = 25 * 1024 * 1024;
export const MAX_BACKUP = 100 * 1024 * 1024;
export const MAX_BACKUP_MEDIA = 48 * 1024 * 1024;
export const MIME = ['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/webm','video/quicktime'];
export const DECOR = ['none','pink','lavender','mint','sunny','night','paper'];
export const CATEGORIES = ['일상','독서·생각','운동·수련','공부','창작','기타'];
export const empty = () => ({habits:[],checks:{},entries:[]});
export const today = () => {const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
export function validDate(s){if(!/^\d{4}-\d{2}-\d{2}$/.test(s)||s<'1900-01-01'||s>'2200-12-31')return false;const d=new Date(s+'T12:00:00Z');return Number.isFinite(+d)&&d.toISOString().slice(0,10)===s;}
const text = (s,n) => typeof s==='string' && s.length<=n;
const fail = s => {throw new Error(s);};
export function validateFile(f){if(!MIME.includes(f.type))fail('JPEG·PNG·WebP·GIF 사진 또는 MP4·WebM·MOV 영상만 첨부할 수 있어요.');if(!f.size||f.size>MAX_FILE)fail('첨부 파일은 각각 25MB 이하여야 해요.');}
export function validateDocument(input, owner){
  if(!input||!Array.isArray(input.entries)||input.entries.length>2000||!Array.isArray(input.habits)||input.habits.length>100||!input.checks||Array.isArray(input.checks)||typeof input.checks!=='object')fail('기록 형식이 올바르지 않아요.');
  const out=empty();
  for(const h of input.habits){if(!text(h,80)||!h.trim()||out.habits.includes(h))fail('습관 이름이 잘못되었거나 중복돼요.');out.habits.push(h);}
  if(Object.keys(input.checks).length>10000)fail('습관 기록이 너무 많아요.');
  for(const [d,hs] of Object.entries(input.checks)){if(!validDate(d)||!Array.isArray(hs)||hs.length>100||hs.some(h=>!text(h,80)||!h.trim())||new Set(hs).size!==hs.length)fail('습관 체크 형식이 올바르지 않아요.');out.checks[d]=[...hs];}
  const ids=new Set();
  for(const e of input.entries){
    const date=e.recordDate||e.created?.slice(0,10);
    if(!text(e.id,100)||!e.id||ids.has(e.id)||!text(e.title,100)||!e.title.trim()||!text(e.content??'',20000)||!validDate(date)||!text(e.created,40)||!Number.isFinite(Date.parse(e.created))||!CATEGORIES.includes(e.category)||!DECOR.includes(e.decoration||'none')||!text(e.sticker||'',24))fail('일기 내용·날짜·꾸미기 형식을 확인해 주세요.');
    ids.add(e.id);
    const keys=e.mediaKeys||[];
    if(!Array.isArray(keys)||keys.length>6||new Set(keys).size!==keys.length||keys.some(k=>!text(k,200)||!/^[a-zA-Z0-9/_-]+$/.test(k)||(owner&&!new RegExp('^'+owner+'/[0-9a-f-]{36}$').test(k))))fail('첨부 파일 경로가 올바르지 않아요.');
    const coords=['stickerX','stickerY'].map(k=>e[k]??0);
    if(coords.some(x=>!Number.isFinite(x))||coords[0]<-30||coords[0]>230||coords[1]<-15||coords[1]>200)fail('스티커 위치가 올바르지 않아요.');
    out.entries.push({id:e.id,title:e.title.trim(),content:e.content||'',category:e.category,recordDate:date,created:e.created,decoration:e.decoration||'none',sticker:e.sticker||'',stickerX:coords[0],stickerY:coords[1],visibility:'private',mediaKeys:[...keys]});
  }
  if(new TextEncoder().encode(JSON.stringify(out)).length>2*1024*1024)fail('글 저장 한도(2MB)를 초과했어요. 전체 백업 후 기록을 정리해 주세요.');
  return out;
}
const b64 = bytes => {let s='';for(let i=0;i<bytes.length;i+=32768)s+=String.fromCharCode(...bytes.subarray(i,i+32768));return btoa(s);};
const un64 = s => {if(typeof s!=='string'||!s.length||s.length>MAX_BACKUP*1.4||!/^[A-Za-z0-9+/]*={0,2}$/.test(s))fail('백업 인코딩이 잘못되었어요.');return Uint8Array.from(atob(s),c=>c.charCodeAt(0));};
const hash = async bytes => [...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(x=>x.toString(16).padStart(2,'0')).join('');
async function key(password,salt,usage){if(!password||password.length<12)fail('백업 암호는 12자 이상 입력해 주세요.');const base=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveKey']);return crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:310000,hash:'SHA-256'},base,{name:'AES-GCM',length:256},false,[usage]);}
export async function encodeBackup(db,getMedia,password){
  const files={};let total=0;
  for(const k of new Set(db.entries.flatMap(e=>e.mediaKeys))){const f=await getMedia(k);if(!f)fail('첨부 파일이 누락되어 전체 백업을 중단했어요.');validateFile(f);total+=f.size;if(total>MAX_BACKUP_MEDIA)fail('전체 미디어가 48MB를 초과해요. 기록을 나누어 보관해 주세요.');const bytes=new Uint8Array(await f.arrayBuffer());files[k]={name:f.name||'media',type:f.type,data:`data:${f.type};base64,${b64(bytes)}`,sha256:await hash(bytes)};}
  const payload={format:'moa-full-backup-v4',savedAt:new Date().toISOString(),db:validateDocument(db),files};
  const salt=crypto.getRandomValues(new Uint8Array(16)),iv=crypto.getRandomValues(new Uint8Array(12));
  const encrypted=await crypto.subtle.encrypt({name:'AES-GCM',iv},await key(password,salt,'encrypt'),new TextEncoder().encode(JSON.stringify(payload)));
  const raw=JSON.stringify({format:'moa-encrypted-backup-v1',salt:b64(salt),iv:b64(iv),data:b64(new Uint8Array(encrypted))});
  if(raw.length>MAX_BACKUP)fail('암호화 백업이 100MB를 초과해요. 기록을 나누어 보관해 주세요.');return raw;
}
export async function decodeBackup(raw,password){
  if(new TextEncoder().encode(raw).length>MAX_BACKUP)fail('백업 파일은 100MB 이하여야 해요.');
  let p=JSON.parse(raw);
  if(p.format==='moa-encrypted-backup-v1'){
    const salt=un64(p.salt),iv=un64(p.iv);if(salt.length!==16||iv.length!==12)fail('백업 암호화 형식이 잘못되었어요.');
    try {p=JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({name:'AES-GCM',iv},await key(password,salt,'decrypt'),un64(p.data))));}catch{fail('암호가 틀렸거나 백업 파일이 손상되었어요.');}
  }
  if(p.format && p.format!=='moa-full-backup-v4')fail('지원하지 않는 백업 형식이에요.');
  const db=validateDocument(p.format?p.db:p),files=new Map();let total=0;
  for(const k of new Set(db.entries.flatMap(e=>e.mediaKeys))){
    const f=p.files?.[k];if(!f||!MIME.includes(f.type)||typeof f.data!=='string'||!f.data.startsWith(`data:${f.type};base64,`))fail('백업에 첨부 파일이 없거나 안전하지 않은 형식이에요.');
    const bytes=un64(f.data.slice(f.data.indexOf(',')+1));total+=bytes.length;if(total>MAX_BACKUP_MEDIA)fail('백업 미디어가 48MiB를 초과해요.');
    if(f.sha256 && await hash(bytes)!==f.sha256)fail('첨부 파일 검증에 실패했어요.');
    const file=new File([bytes],text(f.name,200)?f.name:'media',{type:f.type});validateFile(file);files.set(k,file);
  }
  return {db,files};
}
