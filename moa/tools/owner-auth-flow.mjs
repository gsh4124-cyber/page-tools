// Only Moa's production callback is requested in authentication emails.
// Preview URLs and arbitrary return URLs must never become login destinations.
export const OWNER_CALLBACK_PATH='/__moa_auth_callback';
export const OWNER_EMAIL_REDIRECT='https://moa-diary-web.pages.dev'+OWNER_CALLBACK_PATH;

const invalid=()=>({kind:'error',message:'로그인 링크를 확인할 수 없어요. 새 로그인 메일을 받아 주세요.'});

export function readOwnerCallback(href,expectedOrigin){
 let url;try{url=new URL(href);}catch{return invalid();}
 if(url.origin!==expectedOrigin||url.username||url.password||![OWNER_CALLBACK_PATH,'/__moa_access'].includes(url.pathname))return {kind:'none'};
 const params=new URLSearchParams(url.hash.slice(1));
 if(params.has('error')||params.has('error_code'))return {kind:'error',message:params.get('error_code')==='otp_expired'?'로그인 링크가 만료되었거나 이미 사용됐어요. 새 로그인 메일을 받아 주세요.':'로그인을 완료하지 못했어요. 새 로그인 메일을 받아 주세요.'};
 if(!params.has('access_token')&&!params.has('refresh_token'))return {kind:'none'};
 for(const key of ['access_token','refresh_token','token_type','type'])if(params.getAll(key).length>1)return invalid();
 const accessToken=params.get('access_token')||'',refreshToken=params.get('refresh_token')||'';
 if(accessToken.length>3800||!/^[-\w]+\.[-\w]+\.[-\w]+$/.test(accessToken)||refreshToken.length>2048||!/^[-\w]+$/.test(refreshToken))return invalid();
 if(params.get('token_type')!=='bearer'||(params.has('type')&&!['magiclink','email'].includes(params.get('type'))))return invalid();
 return {kind:'session',accessToken,refreshToken};
}
