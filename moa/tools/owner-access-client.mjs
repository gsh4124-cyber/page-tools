import {DRAFT_KEY} from '../drafts.mjs';
import {createClient} from '@supabase/supabase-js';
import {OWNER_CALLBACK_PATH,OWNER_EMAIL_REDIRECT,OWNER_GOOGLE_STORAGE_KEY,googleProofStorage,googleAuthorizeURL,readOwnerCallback} from './owner-auth-flow.mjs';
const callback=readOwnerCallback(location.href,location.origin);
// Remove credentials/error text from the address before any verification request.
if(location.pathname===OWNER_CALLBACK_PATH||callback.kind!=='none')history.replaceState(null,'',location.pathname);
const config=__MOA_GATE_CONFIG__,client=createClient(config.url,config.key,{auth:{storageKey:'moa-auth-v1',persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}}),$=s=>document.querySelector(s);
let busy=false;
let oauthClient;
const googleClient=()=>oauthClient??=createClient(config.url,config.key,{auth:{storageKey:OWNER_GOOGLE_STORAGE_KEY,storage:googleProofStorage(sessionStorage),flowType:'pkce',persistSession:true,autoRefreshToken:false,detectSessionInUrl:false}});
const dialog=$('#gateDialog');
document.querySelectorAll('[data-open-account]').forEach(button=>button.onclick=()=>{dialog.showModal();$('#gateGoogle').focus();});
$('#closeGate').onclick=()=>dialog.close();
const showVerification=()=>{$('#gateVerifyForm').hidden=false;$('#gateLink').focus();};
$('#gateHasLink').onclick=showVerification;
// The public demonstration is synthetic and stays in memory. It never writes
// diary data, requests media URLs, or uses the private application's store.
const views=['Record','Calendar','Photos'];
const showExample=view=>{for(const name of views){$('#show'+name+'Example').setAttribute('aria-pressed',String(name===view));$('#'+name.toLowerCase()+'Example').hidden=name!==view;}};
for(const view of views)$('#show'+view+'Example').onclick=()=>showExample(view);
const entries={
 23:{date:'2026. 11. 23 월요일',weekday:'월요일',title:'월요일 메모',text:'새 노트를 꺼냈다. 이번 주에 할 일은 세 가지.\n우체국 들르기, 책 반납하기, 미뤄 둔 약속 잡기.\n일단 책부터 가방에 넣었다.',alt:'흰 노트 위에 놓인 파란 펜 두 자루'},
 21:{date:'2026. 11. 21 토요일',weekday:'토요일',title:'주말의 바다',text:'바람이 생각보다 차가웠다.\n서핑하는 사람들을 한참 구경했다. 돌아오는 길에는 따뜻한 국수를 먹었다.',alt:'바다에서 파도를 타는 서퍼'}
};
for(const day of [21,23])entries[day].photo=$('#photosExample [data-demo-entry="'+day+'"] img').src;
const openEntry=day=>{document.querySelectorAll('.index-entry').forEach(button=>button.setAttribute('aria-pressed',String(Number(button.dataset.demoEntry)===day)));const entry=entries[day];if(!entry)return;selectDay(day);$('#sampleDate').dateTime='2026-11-'+day;$('#sampleDate').setAttribute('aria-label','2026년 11월 '+day+'일 '+entry.weekday);$('#sampleDate .date-day').textContent=String(day);$('#sampleDate .date-context').textContent='2026년 11월\n'+entry.weekday;$('#samplePhoto').src=entry.photo;$('#samplePhoto').alt=entry.alt;$('#sampleTitle').textContent=entry.title;$('#sampleText').textContent=entry.text;showExample('Record');$('#showRecordExample').focus();};
document.querySelectorAll('[data-demo-entry]').forEach(button=>button.onclick=()=>openEntry(Number(button.dataset.demoEntry)));
let selectedDay=23;
const selectDay=day=>{selectedDay=day;document.querySelectorAll('[data-demo-day]').forEach(button=>button.setAttribute('aria-pressed',String(Number(button.dataset.demoDay)===day)));const entry=entries[day];$('#calendarDate').textContent='11월 '+day+'일 '+['일요일','월요일','화요일','수요일','목요일','금요일','토요일'][(day-1)%7];$('#calendarText').textContent=entry?entry.title:'이날에는 예시 기록이 없어요.';$('#openCalendarRecord').hidden=!entry;};
for(let day=1;day<=30;day++){
 const button=document.createElement('button');button.type='button';button.dataset.demoDay=String(day);button.setAttribute('aria-label','11월 '+day+'일'+(entries[day]?' · 예시 기록 있음':''));button.setAttribute('aria-pressed',String(day===selectedDay));
 if(entries[day]){const photo=document.createElement('img');photo.src=entries[day].photo;photo.alt='';button.append(photo);}
 const number=document.createElement('span');number.textContent=String(day);button.append(number);button.onclick=()=>selectDay(day);$('#sampleCalendar').append(button);
}
$('#openCalendarRecord').onclick=()=>openEntry(selectedDay);
document.querySelectorAll('[data-demo-habit]').forEach(button=>button.onclick=()=>{button.setAttribute('aria-pressed',String(button.getAttribute('aria-pressed')!=='true'));$('#habitCount').textContent=document.querySelectorAll('[data-demo-habit][aria-pressed="true"]').length+' / 2 완료';});
const notice=text=>$('#gateNotice').textContent=text;
const clearGate=async()=>{try{await fetch('/__moa_logout',{method:'POST',cache:'no-store'});}catch{}};
const authorizeGate=async(accessToken,{clearOnReject=true}={})=>{
 if(!accessToken)throw Error('로그인 정보를 확인해 주세요.');
 const r=await fetch('/__moa_session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({accessToken}),cache:'no-store'});
 if(!r.ok){if(r.status===401){if(clearOnReject){try{localStorage.removeItem(DRAFT_KEY);}catch{}await clearGate();await client.auth.signOut({scope:'local'});}throw Error('소유자 계정으로 확인해 주세요.');}throw Error('입장 확인에 실패했어요. 잠시 후 다시 시도해 주세요.');}
};
const enter=async session=>{await authorizeGate(session?.access_token);location.replace('/');};
const task=async fn=>{if(busy)return;busy=true;document.querySelectorAll('#gateDialog button[type="submit"],#gateGoogle').forEach(b=>b.disabled=true);try{await fn();}catch(e){if(!dialog.open)dialog.showModal();notice(e.message||'로그인을 확인해 주세요.');}finally{busy=false;document.querySelectorAll('#gateDialog button[type="submit"],#gateGoogle').forEach(b=>b.disabled=false);}};
$('#gateGoogle').onclick=()=>task(async()=>{
 notice('구글 계정 선택 화면으로 이동해요…');
 const {data,error}=await googleClient().auth.signInWithOAuth({provider:'google',options:{redirectTo:OWNER_EMAIL_REDIRECT,skipBrowserRedirect:true,queryParams:{prompt:'select_account'}}});
 if(error||!data.url)throw Error('구글 로그인을 시작하지 못했어요. 잠시 후 다시 시도해 주세요.');
 location.assign(googleAuthorizeURL(data.url,config.url));
});
$('#gateEmailForm').onsubmit=e=>{e.preventDefault();task(async()=>{const {error}=await client.auth.signInWithOtp({email:$('#gateEmail').value.trim(),options:{shouldCreateUser:false,emailRedirectTo:OWNER_EMAIL_REDIRECT}});if(error)throw Error('메일을 보내지 못했어요. 잠시 후 다시 시도해 주세요.');$('#gateVerifyForm').hidden=true;notice('로그인 메일을 보냈어요. 메일의 로그인 링크를 누르면 모아로 돌아와요. 메일이 없으면 가입된 주소인지 확인해 주세요.');});};
$('#gateVerifyForm').onsubmit=e=>{e.preventDefault();task(async()=>{const u=new URL($('#gateLink').value);if(u.origin!==config.url||u.pathname!=='/auth/v1/verify'||u.username||u.password||!['magiclink','email'].includes(u.searchParams.get('type')))throw Error('모아에서 받은 로그인 메일의 링크를 넣어 주세요.');const token=u.searchParams.get('token_hash')||u.searchParams.get('token');if(!token||!/^[-\w]{1,1024}$/.test(token))throw Error('로그인 링크를 확인해 주세요.');$('#gateLink').value='';const {data,error}=await client.auth.verifyOtp({token_hash:token,type:'email'});if(error)throw Error('링크가 만료되었거나 이미 사용됐어요. 새 메일을 받아 주세요.');await enter(data.session);});};
$('#gatePasswordForm').onsubmit=e=>{e.preventDefault();task(async()=>{const {data,error}=await client.auth.signInWithPassword({email:$('#gatePasswordEmail').value.trim(),password:$('#gatePassword').value});$('#gatePassword').value='';if(error)throw Error('이메일과 비밀번호를 확인해 주세요.');await enter(data.session);});};
task(async()=>{
 if(callback.kind==='error'){if(!dialog.open)dialog.showModal();notice(callback.message);$('#gateGoogle').focus();return;}
 let candidate=callback;
 if(callback.kind==='code'){
  if(!dialog.open)dialog.showModal();notice('구글 로그인을 확인하고 있어요…');
  const {data,error}=await googleClient().auth.exchangeCodeForSession(callback.code,callback.flowId?{flowId:callback.flowId}:undefined);
  if(error||!data.session?.access_token||!data.session?.refresh_token)throw Error('구글 로그인 확인이 만료되었어요. 같은 브라우저에서 Google로 계속하기를 다시 눌러 주세요.');
  candidate={kind:'session',accessToken:data.session.access_token,refreshToken:data.session.refresh_token};
 }
 if(candidate.kind==='session'){
  if(!dialog.open)dialog.showModal();notice('로그인을 확인하고 있어요…');
  // The server checks the owner, JWT and live Auth session before this browser
  // persists credentials. The private application remains behind the same gate.
  await authorizeGate(candidate.accessToken,{clearOnReject:false});
  try{
   const {data,error}=await client.auth.setSession({access_token:candidate.accessToken,refresh_token:candidate.refreshToken});
   if(error||!data.session?.access_token)throw error||Error('No session');
   if(data.session.access_token!==candidate.accessToken)await authorizeGate(data.session.access_token);
  }catch{await clearGate();await client.auth.signOut({scope:'local'});throw Error('로그인을 완료하지 못했어요. Google로 계속하기를 다시 눌러 주세요.');}
  location.replace('/');return;
 }
 const {data}=await client.auth.getSession();if(data.session)await enter(data.session);else{try{localStorage.removeItem(DRAFT_KEY);}catch{}}
});
