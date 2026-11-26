// The JWT payload is only a prefilter. Supabase verifies the token signature,
// project and live Auth session through the existing account-status RPC.
export const GATE_COOKIE='__Host-moa_gate';
const project='https://afiqaibosavbjzkffggr.supabase.co';
export function tokenClaims(token){
 if(typeof token!=='string'||token.length>3800||!/^[-\w]+\.[-\w]+\.[-\w]+$/.test(token))return null;
 try{const raw=token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/');return JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(raw),c=>c.charCodeAt(0))));}catch{return null;}
}
export function cookieToken(request){const values=(request.headers.get('cookie')||'').split(';').map(s=>s.trim()).filter(s=>s.startsWith(GATE_COOKIE+'='));return values.length===1?values[0].slice(GATE_COOKIE.length+1):'';}
export async function ownerSession(token,env,transport=fetch,now=Date.now()){
 const claims=tokenClaims(token);
 if(!claims||claims.sub!==env.MOA_GATE_OWNER_ID||claims.role!=='authenticated'||claims.is_anonymous===true||!Number.isFinite(claims.exp)||claims.exp<=now/1000)return {status:401};
 try{
  // Workers does not implement redirect:'error'. Manual mode still prevents
  // forwarding the bearer token; unexpected redirects fail closed below.
  const r=await transport(project+'/rest/v1/rpc/moa_account_status',{method:'POST',headers:{apikey:env.MOA_SUPABASE_PUBLISHABLE_KEY,Authorization:'Bearer '+token,'Content-Type':'application/json'},body:'{}',redirect:'manual',cache:'no-store',signal:AbortSignal.timeout(8000)});
  if(r.status>=300&&r.status<400)return {status:503};
  if(!r.ok)return {status:r.status>=500?503:401};
  const data=await r.json();if(!['active','deleting','withdrawn'].includes(data?.status))return {status:503};
  return {status:200,maxAge:Math.max(1,Math.min(3600,Math.floor(claims.exp-now/1000)))};
 }catch{return {status:503};}
}
export async function ownerGateway(request,env,routes,baseHeaders,transport=fetch){
 const url=new URL(request.url),path=url.pathname;
 const headers={...baseHeaders,'Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow, noarchive'};
 const reply=(body,status=200,extra={})=>new Response(request.method==='HEAD'||status===204?null:body,{status,headers:{...headers,...extra}});
 if(env.MOA_SUPABASE_URL!==project||!env.MOA_SUPABASE_PUBLISHABLE_KEY||!/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/.test(env.MOA_GATE_OWNER_ID||''))return reply('Private site setup is incomplete.',503,{'Content-Type':'text/plain; charset=utf-8'});
 const allowed=request.method==='GET'||request.method==='HEAD';
 if(path==='/__moa_session'||path==='/__moa_logout'){
  if(request.method!=='POST')return reply('Method not allowed',405,{Allow:'POST'});
  if(request.headers.get('origin')!==url.origin||(['cross-site','same-site'].includes(request.headers.get('sec-fetch-site'))))return reply('Forbidden',403);
  if(path==='/__moa_logout')return reply('',204,{'Set-Cookie':GATE_COOKIE+'=; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=0'});
  if(!/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type')||''))return reply('Unsupported content type',415);
  if(Number(request.headers.get('content-length'))>5000)return reply('Request too large',413);
  let raw='';const reader=request.body?.getReader(),decoder=new TextDecoder('utf-8',{fatal:true});let bytes=0;
  if(reader)try{for(;;){const {done,value}=await reader.read();if(done)break;bytes+=value.byteLength;if(bytes>5000){await reader.cancel();return reply('Request too large',413);}raw+=decoder.decode(value,{stream:true});}raw+=decoder.decode();}catch{return reply('Invalid request',400);}
  let token;try{token=JSON.parse(raw).accessToken;}catch{return reply('Invalid request',400);}
  const result=await ownerSession(token,env,transport);
  if(result.status!==200)return reply(result.status===401?'Owner access required':'Please retry later',result.status,{'Content-Type':'text/plain; charset=utf-8'});
  return reply('',204,{'Set-Cookie':GATE_COOKIE+'='+token+'; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age='+result.maxAge});
 }
 if(!allowed)return reply('Method not allowed',405,{Allow:'GET, HEAD'});
 if(path==='/about/'||path==='/robots.txt'||path==='/sitemap.xml'||path==='/about/sitemap.xml'||path==='/__moa_public_metrics.js'||path==='/__moa_access'||path==='/__moa_access.js'||path==='/__moa_auth_callback'){
  const item=routes[path];if(!item)return reply('Not found',404,{'Content-Type':'text/plain; charset=utf-8'});
  const extra={'Content-Type':item.type};
  if(path==='/about/')extra['X-Robots-Tag']='index, follow';
  // Allow the analytics provider only in the two public demo documents.
  // The callback and all authenticated diary responses keep the original CSP.
  if(path==='/about/'||path==='/__moa_access'){
   // Share only the public origin, never URL paths or authentication parameters.
   // The manual analytics endpoint requires a Referer header.
   extra['Referrer-Policy']='strict-origin';
   const csp=headers['Content-Security-Policy']||"default-src 'self'; script-src 'self'; connect-src 'self'";
   extra['Content-Security-Policy']=csp.replace(/script-src ([^;]*)/,"script-src $1 https://static.cloudflareinsights.com/beacon.min.js").replace(/connect-src ([^;]*)/,"connect-src $1 https://cloudflareinsights.com");
  }
  return reply(item.body,200,extra);
 }
 const result=await ownerSession(cookieToken(request),env,transport);
 if(result.status!==200){
  if(result.status===503)return reply('Please retry later',503,{'Content-Type':'text/plain; charset=utf-8'});
  const extra={'Set-Cookie':GATE_COOKIE+'=; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=0','Content-Type':'text/plain; charset=utf-8'};
  if(path==='/'||path==='/index.html'||request.headers.get('accept')?.includes('text/html'))return reply('Owner sign-in required',303,{...extra,Location:'/__moa_access'});
  return reply('Owner sign-in required',401,extra);
 }
 const item=routes[path]||routes['/404.html'];return reply(item.body,routes[path]?200:404,{'Content-Type':item.type});
}
