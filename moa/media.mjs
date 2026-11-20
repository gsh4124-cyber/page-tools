import {validateFile,MAX_FILE} from './core.mjs';
export const mib=n=>(n/1048576).toFixed(1)+'MiB';
export async function prepareMedia(files,optimize=false){
 const out=[];
 for(const file of files){
  if(file.size>MAX_FILE&&file.type.startsWith('video/'))throw Error(`${file.name}: 영상은 25MiB까지 첨부할 수 있어요. 기기에서 짧게 편집한 후 선택해 주세요.`);
  if(!optimize||!['image/jpeg','image/png','image/webp'].includes(file.type)){validateFile(file);out.push(file);continue;}
  if(file.size>50*1048576)throw Error('용량 줄이기용 사진 원본은 50MiB까지 선택해 주세요.');
  let bitmap;try{bitmap=await createImageBitmap(file);const ratio=Math.min(1,1920/Math.max(bitmap.width,bitmap.height)),canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*ratio));canvas.height=Math.max(1,Math.round(bitmap.height*ratio));canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/webp',.85));const result=blob&&(blob.size<file.size||ratio<1)?new File([blob],file.name.replace(/\.[^.]+$/,'')+(blob.type==='image/png'?'.png':'.webp'),{type:blob.type}):file;validateFile(result);out.push(result);}catch(e){if(file.size<=MAX_FILE){validateFile(file);out.push(file);}else throw Error('사진 용량을 줄이지 못했어요. 기기에서 크기를 줄인 후 다시 선택해 주세요.');}finally{bitmap?.close();}
 }
 return out;
}
export function verificationToken(link,origin,type){const u=new URL(link);if(u.origin!==origin||u.pathname!=='/auth/v1/verify'||u.searchParams.get('type')!==type||u.username||u.password)throw Error('모아에서 받은 '+(type==='recovery'?'비밀번호 복구':'가입 인증')+' 메일의 링크를 넣어 주세요.');const token=u.searchParams.get('token')||u.searchParams.get('token_hash');if(!token||token.length>1024||!/^[a-zA-Z0-9_-]+$/.test(token))throw Error('인증 링크를 확인해 주세요.');return token;}
