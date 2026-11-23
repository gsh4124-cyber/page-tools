import {createClient} from '@supabase/supabase-js';
const config=__MOA_GATE_CONFIG__,client=createClient(config.url,config.key,{auth:{storageKey:'moa-auth-v1',persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}}),$=s=>document.querySelector(s);
let busy=false;
const dialog=$('#gateDialog');
document.querySelectorAll('[data-open-account]').forEach(button=>button.onclick=()=>{dialog.showModal();$('#gateEmail').focus();});
$('#closeGate').onclick=()=>dialog.close();
const showVerification=()=>{$('#gateVerifyForm').hidden=false;$('#gateLink').focus();};
$('#gateHasLink').onclick=showVerification;
const showExample=calendar=>{for(const [id,selected] of [['showRecordExample',!calendar],['showCalendarExample',calendar]])$('#'+id).setAttribute('aria-pressed',String(selected));$('#recordExample').hidden=calendar;$('#calendarExample').hidden=!calendar;};
$('#showRecordExample').onclick=()=>showExample(false);$('#showCalendarExample').onclick=()=>showExample(true);
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
