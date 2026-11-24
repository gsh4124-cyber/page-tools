// Both Google and backup email sign-in use the one allowed Moa callback.
// Preview URLs and arbitrary return URLs must never become login destinations.
export const OWNER_CALLBACK_PATH='/__moa_auth_callback';
export const OWNER_EMAIL_REDIRECT='https://moa-diary-web.pages.dev'+OWNER_CALLBACK_PATH;
export const OWNER_GOOGLE_STORAGE_KEY='moa-google-auth-v1';

// The temporary OAuth client persists only PKCE proof in this tab. Candidate
// sessions (including Google provider tokens) never enter durable app storage.
export function googleProofStorage(storage){
 const allowed=key=>key===OWNER_GOOGLE_STORAGE_KEY+'-code-verifier'||key===OWNER_GOOGLE_STORAGE_KEY+'-flows-code-verifier'||new RegExp('^'+OWNER_GOOGLE_STORAGE_KEY+'-flow-[A-Za-z0-9_-]{8,64}-code-verifier$').test(key);
 return {getItem:key=>allowed(key)?storage.getItem(key):null,setItem:(key,value)=>{if(allowed(key))storage.setItem(key,value);},removeItem:key=>{if(allowed(key))storage.removeItem(key);}};
}

export function googleAuthorizeURL(href,projectURL){
 const url=new URL(href);
 if(url.origin!==projectURL||url.pathname!=='/auth/v1/authorize'||url.username||url.password||url.hash||url.searchParams.get('provider')!=='google'||url.searchParams.get('redirect_to')!==OWNER_EMAIL_REDIRECT||!/^[-\w]{43}$/.test(url.searchParams.get('code_challenge')||'')||url.searchParams.get('code_challenge_method')!=='s256')throw Error('구글 로그인 연결을 확인할 수 없어요. 잠시 후 다시 시도해 주세요.');
 return url.href;
}

const invalid=()=>({kind:'error',message:'로그인 정보를 확인할 수 없어요. 다시 로그인해 주세요.'});

export function readOwnerCallback(href,expectedOrigin){
 let url;try{url=new URL(href);}catch{return invalid();}
 if(url.origin!==expectedOrigin||url.username||url.password||![OWNER_CALLBACK_PATH,'/__moa_access'].includes(url.pathname))return {kind:'none'};
 const params=new URLSearchParams(url.hash.slice(1));
 if(url.searchParams.has('error')||url.searchParams.has('error_code'))return {kind:'error',message:'구글 로그인을 완료하지 못했어요. Google로 계속하기를 다시 눌러 주세요.'};
 if(url.searchParams.has('code')){
  const code=url.searchParams.get('code')||'',flowId=url.searchParams.get('sb_flow_id');
  if(url.pathname!==OWNER_CALLBACK_PATH||url.searchParams.getAll('code').length!==1||url.searchParams.getAll('sb_flow_id').length>1||!/^[-\w]{1,2048}$/.test(code)||(flowId!==null&&!/^[-\w]{8,64}$/.test(flowId))||['access_token','refresh_token','error','error_code','type'].some(key=>params.has(key)))return invalid();
  return {kind:'code',code,...(flowId===null?{}:{flowId})};
 }
 if(params.has('error')||params.has('error_code'))return {kind:'error',message:params.get('error_code')==='otp_expired'?'로그인 링크가 만료되었거나 이미 사용됐어요. 새 로그인 메일을 받아 주세요.':'로그인을 완료하지 못했어요. 새 로그인 메일을 받아 주세요.'};
 if(!params.has('access_token')&&!params.has('refresh_token'))return {kind:'none'};
 for(const key of ['access_token','refresh_token','token_type','type'])if(params.getAll(key).length>1)return invalid();
 const accessToken=params.get('access_token')||'',refreshToken=params.get('refresh_token')||'';
 if(accessToken.length>3800||!/^[-\w]+\.[-\w]+\.[-\w]+$/.test(accessToken)||refreshToken.length>2048||!/^[-\w]+$/.test(refreshToken))return invalid();
 if(params.get('token_type')!=='bearer'||(params.has('type')&&!['magiclink','email'].includes(params.get('type'))))return invalid();
 return {kind:'session',accessToken,refreshToken};
}
