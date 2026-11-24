const ENDPOINT='https://afiqaibosavbjzkffggr.supabase.co/functions/v1/random-picker-event';
const reply=status=>new Response(null,{status,headers:{'cache-control':'no-store','x-content-type-options':'nosniff'}});
export async function onRequest({request}){
 if(request.method!=='POST')return reply(405);
 const origin=new URL(request.url).origin;if(request.headers.get('origin')!==origin)return reply(403);
 if(/HeadlessChrome|Playwright/i.test(request.headers.get('user-agent')||''))return reply(204);
 try{if(new URL(request.headers.get('referer')||'').searchParams.has('qa'))return reply(204);}catch{}
 if(!request.headers.get('content-type')?.toLowerCase().startsWith('application/json'))return reply(415);
 if(Number(request.headers.get('content-length')||0)>128)return reply(413);
 let payload;try{const raw=await request.text();if(new TextEncoder().encode(raw).length>128)return reply(413);payload=JSON.parse(raw);}catch{return reply(400);}
 if(!payload||typeof payload!=='object'||Array.isArray(payload)||Object.keys(payload).length!==1||!['yut','dice'].includes(payload.tool))return reply(400);
 try{const result=await fetch(ENDPOINT,{method:'POST',headers:{'content-type':'application/json',origin},body:JSON.stringify(payload),signal:AbortSignal.timeout(5000)});return reply(result.status===204?204:503);}catch{return reply(503);}
}
