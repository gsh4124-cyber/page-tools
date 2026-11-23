// Keep the HttpOnly site gate aligned with the existing SDK session, without
// creating another Auth client or changing the diary's persistence behavior.
const storageKey='sb-afiqaibosavbjzkffggr-auth-token';let lastToken,working=false;
async function synchronize(){
 if(working||document.hidden)return;working=true;
 try{
  let session;try{session=JSON.parse(localStorage.getItem(storageKey)||'null');}catch{}
  const token=session?.access_token;
  if(!token){await fetch('/__moa_logout',{method:'POST',cache:'no-store'});location.replace('/__moa_access');return;}
  if(token===lastToken)return;
  const r=await fetch('/__moa_session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({accessToken:token}),cache:'no-store'});
  if(r.ok)lastToken=token;else if(r.status===401)location.replace('/__moa_access');
 }catch{}finally{working=false;}
}
window.addEventListener('storage',synchronize);document.addEventListener('visibilitychange',synchronize);setInterval(synchronize,15000);synchronize();
