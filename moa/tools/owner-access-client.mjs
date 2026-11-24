import {createClient} from '@supabase/supabase-js';
const config=__MOA_GATE_CONFIG__,client=createClient(config.url,config.key,{auth:{storageKey:'moa-auth-v1',persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}}),$=s=>document.querySelector(s);
let busy=false;
const dialog=$('#gateDialog');
document.querySelectorAll('[data-open-account]').forEach(button=>button.onclick=()=>{dialog.showModal();$('#gateEmail').focus();});
$('#closeGate').onclick=()=>dialog.close();
const showVerification=()=>{$('#gateVerifyForm').hidden=false;$('#gateLink').focus();};
$('#gateHasLink').onclick=showVerification;
// The public demonstration is synthetic and stays in memory. It never writes
// diary data, requests media URLs, or uses the private application's store.
const views=['Record','Calendar','Photos'];
const showExample=view=>{for(const name of views){$('#show'+name+'Example').setAttribute('aria-pressed',String(name===view));$('#'+name.toLowerCase()+'Example').hidden=name!==view;}};
for(const view of views)$('#show'+view+'Example').onclick=()=>showExample(view);
const entries={
 23:{date:'2026. 11. 23 월요일',weekday:'월요일',title:'노트를 펼친 아침',text:'책상에 노트를 펴고 펜 두 자루를 꺼냈다. 오늘은 해야 할 일보다, 기억하고 싶은 일부터 적어 보기로 했다.',alt:'흰 노트 위에 놓인 파란 펜 두 자루'},
 21:{date:'2026. 11. 21 토요일',weekday:'토요일',title:'주말의 바다',text:'파도 소리를 듣고 한참을 앉아 있었다. 바다를 보러 오길 잘했다. 다음에는 조금 더 오래 머물러야지.',alt:'바다에서 파도를 타는 서퍼'}
};
for(const day of [21,23])entries[day].photo=$('#photosExample [data-demo-entry="'+day+'"] img').src;
const openEntry=day=>{document.querySelectorAll('.index-entry').forEach(button=>button.setAttribute('aria-pressed',String(Number(button.dataset.demoEntry)===day)));const entry=entries[day];if(!entry)return;selectDay(day);$('#sampleDate').textContent=entry.date;$('#sampleDate').dateTime='2026-11-'+day;$('#samplePhoto').src=entry.photo;$('#samplePhoto').alt=entry.alt;$('#sampleTitle').textContent=entry.title;$('#sampleText').textContent=entry.text;showExample('Record');$('#showRecordExample').focus();};
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
const enter=async session=>{
 if(!session?.access_token)throw Error('로그인 정보를 확인해 주세요.');
 const r=await fetch('/__moa_session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({accessToken:session.access_token}),cache:'no-store'});
 if(!r.ok){if(r.status===401){await client.auth.signOut({scope:'local'});throw Error('소유자 계정으로 확인해 주세요.');}throw Error('입장 확인에 실패했어요. 잠시 후 다시 시도해 주세요.');}
 location.replace('/');
};
const task=async fn=>{if(busy)return;busy=true;document.querySelectorAll('#gateDialog button[type="submit"]').forEach(b=>b.disabled=true);try{await fn();}catch(e){notice(e.message||'로그인을 확인해 주세요.');}finally{busy=false;document.querySelectorAll('#gateDialog button[type="submit"]').forEach(b=>b.disabled=false);}};
$('#gateEmailForm').onsubmit=e=>{e.preventDefault();task(async()=>{const {error}=await client.auth.signInWithOtp({email:$('#gateEmail').value.trim(),options:{shouldCreateUser:false}});if(error)throw Error('메일을 보내지 못했어요. 잠시 후 다시 시도해 주세요.');notice('가입된 계정이면 로그인 메일을 보내요. 메일의 링크를 아래에 붙여 넣어 주세요.');showVerification();});};
$('#gateVerifyForm').onsubmit=e=>{e.preventDefault();task(async()=>{const u=new URL($('#gateLink').value);if(u.origin!==config.url||u.pathname!=='/auth/v1/verify'||u.username||u.password||!['magiclink','email'].includes(u.searchParams.get('type')))throw Error('모아에서 받은 로그인 메일의 링크를 넣어 주세요.');const token=u.searchParams.get('token_hash')||u.searchParams.get('token');if(!token||!/^[-\w]{1,1024}$/.test(token))throw Error('로그인 링크를 확인해 주세요.');$('#gateLink').value='';const {data,error}=await client.auth.verifyOtp({token_hash:token,type:'email'});if(error)throw Error('링크가 만료되었거나 이미 사용됐어요. 새 메일을 받아 주세요.');await enter(data.session);});};
$('#gatePasswordForm').onsubmit=e=>{e.preventDefault();task(async()=>{const {data,error}=await client.auth.signInWithPassword({email:$('#gatePasswordEmail').value.trim(),password:$('#gatePassword').value});$('#gatePassword').value='';if(error)throw Error('이메일과 비밀번호를 확인해 주세요.');await enter(data.session);});};
task(async()=>{const {data}=await client.auth.getSession();if(data.session)await enter(data.session);});
