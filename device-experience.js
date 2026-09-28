(()=>{
'use strict';
const PROD='https://pc-checkup.pages.dev';
const LEGACY_HOST='gsh4124-cyber.github.io';
const ENDPOINT='https://afiqaibosavbjzkffggr.supabase.co/functions/v1/device-checkup-event';
const PC_TESTS=['keyboard','mouse','display','speaker','mic','webcam'];
const MOBILE_TESTS=['touch','display','camera','mic','speaker','motion'];

function redirectLegacy(){
  if(location.hostname!==LEGACY_HOST||!location.pathname.startsWith('/pc-checkup/')) return false;
  const relative=location.pathname.slice('/pc-checkup'.length)||'/';
  if(/^\/(?:refundproof|proofrail|finalcheck)(?:\/|$)/.test(relative)) return false;
  location.replace(`${PROD}${relative}${location.search}${location.hash}`);
  return true;
}
if(redirectLegacy()) return;

const basename=()=>location.pathname.split('/').filter(Boolean).pop()||'index.html';
const isProd=()=>location.hostname==='pc-checkup.pages.dev';
const isKo=()=>String(document.documentElement.lang||'ko').toLowerCase().startsWith('ko');
const parse=(key)=>{try{const v=JSON.parse(localStorage.getItem(key)||'{}');return v&&typeof v==='object'&&!Array.isArray(v)?v:{};}catch{return {};}};
const count=(state,tests)=>{
  let ok=0,bad=0;
  for(const id of tests){if(state[id]==='ok')ok++;else if(state[id]==='bad')bad++;}
  return {ok,bad,done:ok+bad,unknown:tests.length-ok-bad,total:tests.length};
};
function track(event){
  if(!isProd()||navigator.webdriver) return;
  const once=`device-checkup-event:${event}`;
  try{if(sessionStorage.getItem(once))return;sessionStorage.setItem(once,'1');}catch{}
  fetch(ENDPOINT,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({event}),keepalive:true}).catch(()=>{});
}
function copyText(text){
  if(navigator.clipboard?.writeText) return navigator.clipboard.writeText(text).then(()=>true).catch(()=>false);
  try{const t=document.createElement('textarea');t.value=text;t.style.position='fixed';t.style.opacity='0';document.body.append(t);t.select();const ok=document.execCommand('copy');t.remove();return Promise.resolve(ok);}catch{return Promise.resolve(false);}
}
function style(){
  if(document.getElementById('deviceExperienceStyle'))return;
  const s=document.createElement('style');s.id='deviceExperienceStyle';s.textContent=`
.device-experience-card{margin:18px 0;padding:16px;border:1px solid var(--line,#34445a);border-radius:16px;background:#0d141d;color:#e8eef7}.device-experience-card h3{margin:0 0 7px;font-size:16px}.device-experience-card p{margin:0;color:#aebdce;font-size:13px;line-height:1.55}.device-experience-counts{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:14px 0}.device-experience-count{padding:10px;border-radius:12px;background:#121d29;text-align:center}.device-experience-count b{display:block;font-size:21px}.device-experience-count span{font-size:11px;color:#9fb0c2}.device-experience-actions{display:flex;gap:8px;flex-wrap:wrap}.device-experience-actions .btn{flex:1;min-width:140px}.device-manual{margin-top:14px;padding-top:13px;border-top:1px solid rgba(255,255,255,.1)}.device-manual summary{cursor:pointer;font-weight:800}.device-manual-list{display:grid;gap:8px;margin-top:11px}.device-manual-list label{display:flex;gap:9px;align-items:flex-start;padding:8px 10px;border-radius:10px;background:#121d29;font-size:12px;line-height:1.45}.device-manual-list input{margin-top:2px}.device-next-mobile{width:100%;margin-bottom:8px}@media(max-width:600px){.device-experience-actions{display:grid;grid-template-columns:1fr 1fr}.device-experience-actions .btn{min-width:0}.device-experience-counts{gap:6px}}`;
  document.head.append(s);
}
const MANUAL={
  pc:['외관·힌지·나사·파손 흔적','전원·충전기·배터리 상태','USB·HDMI·오디오 등 물리 포트','Wi‑Fi·Bluetooth 연결','발열·팬 소음·비정상 냄새','저장장치·메모리는 OS/진단도구로 별도 확인'],
  mobile:['액정·프레임·카메라 렌즈 외관','충전 단자·케이블·무선충전','배터리 상태와 비정상 발열','지문·얼굴인식 등 생체인증','통화·셀룰러·Wi‑Fi·Bluetooth','GPS·NFC·침수/수리 이력은 별도 확인']
};
function manualState(kind){return parse(`device-checkup-manual-${kind}-v1`);}
function saveManual(kind,state){try{localStorage.setItem(`device-checkup-manual-${kind}-v1`,JSON.stringify(state));}catch{}}
function summaryText(kind,stats,manual){
  const title=kind==='pc'?'DEVICE CHECKUP · PC 전체 점검':'DEVICE CHECKUP · 휴대폰 전체 점검';
  const checked=Object.values(manual).filter(Boolean).length;
  return `${title}\n정상 ${stats.ok} · 문제 ${stats.bad} · 미확인 ${stats.unknown}\n브라우저 밖 수동 점검 ${checked}/${MANUAL[kind].length}\n${new Date().toLocaleString('ko-KR')}`;
}
function buildCard(kind,getState,tests,anchor){
  if(!isKo()||document.querySelector(`[data-device-experience="${kind}"]`))return ()=>{};
  style();
  const card=document.createElement('section');card.className='device-experience-card';card.dataset.deviceExperience=kind;
  card.innerHTML=`<h3>점검 결과 요약</h3><p>브라우저 검사 결과를 한 번에 복사하거나 공유하고, 웹에서 판정할 수 없는 항목은 아래에서 직접 체크하세요.</p><div class="device-experience-counts"><div class="device-experience-count"><b data-x="ok">0</b><span>정상</span></div><div class="device-experience-count"><b data-x="bad">0</b><span>문제</span></div><div class="device-experience-count"><b data-x="unknown">0</b><span>미확인</span></div></div><div class="device-experience-actions"><button class="btn" type="button" data-copy>결과 복사</button><button class="btn primary" type="button" data-share>결과 공유</button></div><details class="device-manual"><summary>브라우저 밖 수동 점검</summary><div class="device-manual-list"></div></details>`;
  const list=card.querySelector('.device-manual-list'),manual=manualState(kind);
  MANUAL[kind].forEach((label,i)=>{const row=document.createElement('label');row.innerHTML=`<input type="checkbox" data-manual="${i}"><span>${label}</span>`;const input=row.querySelector('input');input.checked=!!manual[i];input.addEventListener('change',()=>{manual[i]=input.checked;saveManual(kind,manual);});list.append(row);});
  const render=()=>{const stats=count(getState(),tests);card.querySelector('[data-x="ok"]').textContent=stats.ok;card.querySelector('[data-x="bad"]').textContent=stats.bad;card.querySelector('[data-x="unknown"]').textContent=stats.unknown;if(stats.done===stats.total)track(kind==='pc'?'pc_complete':'mobile_complete');return stats;};
  card.querySelector('[data-copy]').addEventListener('click',async e=>{const ok=await copyText(summaryText(kind,render(),manual));if(ok){const old=e.currentTarget.textContent;e.currentTarget.textContent='복사됨';setTimeout(()=>e.currentTarget.textContent=old,900);}});
  card.querySelector('[data-share]').addEventListener('click',async()=>{const text=summaryText(kind,render(),manual);if(navigator.share){try{await navigator.share({title:'DEVICE CHECKUP 결과',text,url:location.href});return;}catch(e){if(e?.name==='AbortError')return;}}await copyText(`${text}\n${location.href}`);});
  anchor.parentNode.insertBefore(card,anchor);
  document.addEventListener('click',e=>{if(e.target.closest('.pill,[data-result]'))setTimeout(render,0);});
  render();
  return render;
}
function watchText(target,callback){
  if(!target||typeof MutationObserver==='undefined')return;
  const observer=new MutationObserver(()=>callback());observer.observe(target,{childList:true,characterData:true,subtree:true});
}
function enhanceMobile(){
  const reset=document.getElementById('resetMobileResults');if(!reset)return;
  const getState=()=>parse('device-checkup-mobile-results-v1');
  const controls=reset.closest('.mobile-finish-controls')||reset.parentElement;
  let renderNext=()=>{};
  if(isKo()&&!document.getElementById('nextMobileCheck')){
    const next=document.createElement('button');next.id='nextMobileCheck';next.type='button';next.className='btn primary device-next-mobile';controls.insertBefore(next,reset);
    renderNext=()=>{const state=getState();const id=MOBILE_TESTS.find(x=>state[x]!=='ok'&&state[x]!=='bad');next.disabled=!id;next.textContent=id?'다음 미확인 검사로 이동':'전체 점검 완료';next.dataset.target=id||'';};
    next.addEventListener('click',()=>{const id=next.dataset.target;document.querySelector(`[data-test-card="${id}"]`)?.scrollIntoView({behavior:'smooth',block:'start'});});
    document.addEventListener('click',e=>{if(e.target.closest('[data-result]'))setTimeout(renderNext,0);});renderNext();
  }
  const renderCard=buildCard('mobile',getState,MOBILE_TESTS,controls);
  watchText(document.getElementById('mobileProgressText'),()=>{renderNext();renderCard();});
  track('mobile_start');
}
function enhancePc(){
  const reset=document.getElementById('resetCheckup');if(!reset)return;
  const controls=reset.closest('.controls')||reset.parentElement;
  const renderCard=buildCard('pc',()=>parse('pc-checkup-results-v1'),PC_TESTS,controls);
  watchText(document.getElementById('checkProgress'),renderCard);
  track('pc_start');
}
function init(){
  const page=basename();
  if(page==='checkup.html')enhancePc();
  if(page==='mobile.html')enhanceMobile();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();