(() => {
const $=id=>document.getElementById(id);const inputTabs=$('inputTabs'),numberTab=$('numberTab'),nameTab=$('nameTab'),numberMode=$('numberMode'),nameMode=$('nameMode'),totalField=$('totalField'),totalPeople=$('totalPeople'),pickCount=$('pickCount'),pickField=$('pickField'),pickLabel=$('pickLabel'),pickUnit=$('pickUnit'),names=$('names'),rangeText=$('rangeText'),nameCount=$('nameCount'),nameGuide=$('nameGuide'),resultSettings=$('resultSettings'),resultModeEl=$('resultMode'),customResultBox=$('customResultBox'),customResults=$('customResults'),customResultNote=$('customResultNote'),resultKicker=$('resultKicker'),stage=$('stage'),visual=$('visual'),resultBlock=$('resultBlock'),winners=$('winners'),stageTitle=$('stageTitle'),stageStatus=$('stageStatus'),interactiveControls=$('interactiveControls'),hint=$('hint'),mainCard=$('mainCard'),toast=$('toast'),excludeBtn=$('excludeBtn'),showAllBtn=$('showAllBtn'),bombSettings=$('bombSettings'),bombModeRandom=$('bombModeRandom'),bombModeFixed=$('bombModeFixed'),bombFixedWrap=$('bombFixedWrap'),bombSeconds=$('bombSeconds'),soundToggle=$('soundToggle'),remainingCandidates=$('remainingCandidates'),remainingCount=$('remainingCount'),remainingList=$('remainingList');
let soundEnabled=false,audioCtx=null,lastTickAt=0;function ensureAudio(){if(!audioCtx){const AudioContext=window.AudioContext||window.webkitAudioContext;if(!AudioContext)return null;audioCtx=new AudioContext()}if(audioCtx.state==='suspended')audioCtx.resume();return audioCtx}function tone(freq=440,duration=.08,type='sine',gain=.035,delay=0,endFreq=freq){if(!soundEnabled)return;const ctx=ensureAudio();if(!ctx)return;const start=ctx.currentTime+delay,osc=ctx.createOscillator(),vol=ctx.createGain();osc.type=type;osc.frequency.setValueAtTime(freq,start);osc.frequency.exponentialRampToValueAtTime(Math.max(30,endFreq),start+duration);vol.gain.setValueAtTime(.0001,start);vol.gain.exponentialRampToValueAtTime(gain,start+.008);vol.gain.exponentialRampToValueAtTime(.0001,start+duration);osc.connect(vol).connect(ctx.destination);osc.start(start);osc.stop(start+duration+.02)}function noise(duration=.16,gain=.045){if(!soundEnabled)return;const ctx=ensureAudio();if(!ctx)return;const length=Math.max(1,Math.floor(ctx.sampleRate*duration)),buffer=ctx.createBuffer(1,length,ctx.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<length;i++)data[i]=(Math.random()*2-1)*(1-i/length);const src=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),vol=ctx.createGain();filter.type='lowpass';filter.frequency.value=900;vol.gain.setValueAtTime(gain,ctx.currentTime);vol.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+duration);src.buffer=buffer;src.connect(filter).connect(vol).connect(ctx.destination);src.start()}function sound(name){if(!soundEnabled)return;if(name==='tap')tone(560,.045,'sine',.022,0,680);else if(name==='spin')tone(180,.18,'sawtooth',.026,0,430);else if(name==='tick'){const now=performance.now();if(now-lastTickAt<55)return;lastTickAt=now;tone(900,.025,'square',.018)}else if(name==='drop')tone(420,.1,'triangle',.035,0,150);else if(name==='start'){tone(330,.07,'triangle',.03);tone(520,.09,'triangle',.032,.07)}else if(name==='finish'){tone(523,.1,'sine',.04);tone(659,.12,'sine',.04,.09);tone(784,.18,'sine',.045,.18)}else if(name==='bomb'){noise(.34,.08);tone(105,.42,'sawtooth',.07,0,38)}}function updateSoundButton(){soundToggle.textContent=soundEnabled?'🔊':'🔇';soundToggle.setAttribute('aria-pressed',String(soundEnabled));soundToggle.setAttribute('aria-label',soundEnabled?'효과음 끄기':'효과음 켜기');soundToggle.title=soundEnabled?'효과음 끄기':'효과음 켜기'}soundToggle.addEventListener('click',()=>{soundEnabled=!soundEnabled;if(soundEnabled){ensureAudio();tone(523,.07,'sine',.035);tone(784,.11,'sine',.035,.07)}updateSoundButton()});
const nativeSetTimeout=window.setTimeout.bind(window),nativeClearTimeout=window.clearTimeout.bind(window),nativeSetInterval=window.setInterval.bind(window),nativeClearInterval=window.clearInterval.bind(window),nativeRequestAnimationFrame=window.requestAnimationFrame.bind(window),nativeCancelAnimationFrame=window.cancelAnimationFrame.bind(window);const pendingTimeouts=new Set(),pendingIntervals=new Set(),pendingFrames=new Set();function setTimeout(fn,delay,...args){let id=nativeSetTimeout(()=>{pendingTimeouts.delete(id);fn(...args)},delay);pendingTimeouts.add(id);return id}function clearTimeout(id){pendingTimeouts.delete(id);nativeClearTimeout(id)}function setInterval(fn,delay,...args){const id=nativeSetInterval(fn,delay,...args);pendingIntervals.add(id);return id}function clearInterval(id){pendingIntervals.delete(id);nativeClearInterval(id)}function requestAnimationFrame(fn){let id=nativeRequestAnimationFrame(ts=>{pendingFrames.delete(id);fn(ts)});pendingFrames.add(id);return id}function cancelAnimationFrame(id){pendingFrames.delete(id);nativeCancelAnimationFrame(id)}function cancelAllAsync(){pendingTimeouts.forEach(nativeClearTimeout);pendingIntervals.forEach(nativeClearInterval);pendingFrames.forEach(nativeCancelAnimationFrame);pendingTimeouts.clear();pendingIntervals.clear();pendingFrames.clear()}const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;const motionTime=(normal,reduced=30)=>reducedMotion?reduced:normal;function scrollToElement(el,options={}){el.scrollIntoView({...options,behavior:reducedMotion?'auto':(options.behavior||'smooth')})}
let inputMode='number',method='ladder',resultMode='winner',bombTimerMode='random',lastWinners=[],lastResults=[],excluded=new Set(),animationToken=0,currentRunPool=[],revealAllHandler=null,showingAll=false,currentRunAnalytics=null,currentRunCompleted=false;const methodTitle={ladder:'LADDER',wheel:'ROULETTE',lot:'DRAW',pinball:'PINBALL',race:'RACE',capsule:'CAPSULE',slot:'SLOT',bomb:'BOMB'};const methodMeta={ladder:{icon:'🪜',label:'사다리',theme:'theme-ladder'},wheel:{icon:'◉',label:'룰렛',theme:'theme-wheel'},lot:{icon:'🎟️',label:'제비',theme:'theme-lot'},pinball:{icon:'🕹️',label:'핀볼',theme:'theme-pinball'},race:{icon:'🏁',label:'경주',theme:'theme-race'},capsule:{icon:'🔮',label:'캡슐',theme:'theme-capsule'},slot:{icon:'🎰',label:'슬롯',theme:'theme-slot'},bomb:{icon:'💣',label:'폭탄',theme:'theme-bomb'}};const methodProfile={ladder:{needsInput:true,showPick:true,result:'free'},wheel:{needsInput:true,showPick:false,result:'winner-one'},lot:{needsInput:true,showPick:true,result:'free',numericOnly:true},pinball:{needsInput:true,showPick:false,result:'winner-one'},race:{needsInput:true,showPick:false,result:'winner-one'},capsule:{needsInput:true,showPick:false,result:'winner-one'},slot:{needsInput:true,showPick:false,result:'winner-one'},bomb:{needsInput:false,showPick:false,result:'bomb-only'}};
const ANALYTICS_ENDPOINT='/api/events';
function participantBucket(size){if(method==='bomb')return'na';if(size<=1)return'1';if(size<=5)return'2-5';if(size<=10)return'6-10';if(size<=20)return'11-20';return'21+'}
function analyticsResultMode(){if(method==='bomb')return'bomb';return resultMode==='rank'?'rank':resultMode==='custom'?'custom':'winner'}
function analyticsContext(pool){return{method,input_mode:method==='bomb'?'na':inputMode,participant_bucket:participantBucket(pool.length),result_mode:analyticsResultMode()}}
function trackEvent(eventName,context=currentRunAnalytics){if(!context)return;const payload={event_name:eventName,method:context.method,input_mode:context.input_mode,participant_bucket:context.participant_bucket,result_mode:context.result_mode};try{fetch(ANALYTICS_ENDPOINT,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload),credentials:'omit',cache:'no-store',keepalive:true}).catch(()=>{})}catch(_){}}
function markGameComplete(){if(currentRunCompleted||!currentRunAnalytics)return;currentRunCompleted=true;trackEvent('game_complete')}function renderRemainingCandidates(pool){const visible=excluded.size>0&&method!=='bomb';remainingCandidates.classList.toggle('hidden',!visible);if(!visible){remainingCount.textContent='';remainingList.innerHTML='';return}remainingCount.textContent=`${pool.length}명`;remainingList.innerHTML=pool.map(v=>`<span class="remaining-chip">${esc(label(v))}</span>`).join('')}
const parseNames=()=>names.value.split(/[\n,]+/).map(v=>v.trim()).filter(Boolean);const parseCustomResults=()=>customResults.value.split(/[\n,]+/).map(v=>v.trim()).filter(Boolean);const maxAvailable=()=>inputMode==='name'?Math.max(1,parseNames().length):Math.max(2,Math.floor(Number(totalPeople.value)||2));function items(){const n=Math.max(2,Math.min(100,Math.floor(Number(totalPeople.value)||2)));if(inputMode==='number')return Array.from({length:n},(_,i)=>({id:`number-${i+1}`,label:String(i+1)}));return parseNames().map((name,i)=>({id:`name-${i+1}`,label:name}))}function label(v){if(!v)return'';if(method==='lot')return `${gamePack()?.dynamic.lot||'제비'} ${v.label}`;const lang=window.__RANDOM_PICKER_LANG__||document.documentElement.lang||'ko';return inputMode==='number'?(lang==='ko'?`${v.label}번`:`#${v.label}`):v.label}function sameParticipant(a,b){return !!a&&!!b&&a.id===b.id}function esc(s){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}function rand(max){if(max<=1)return 0;const limit=Math.floor(0x100000000/max)*max,a=new Uint32Array(1);let x;do{crypto.getRandomValues(a);x=a[0]}while(x>=limit);return x%max}function shuffle(arr){const a=[...arr];for(let i=a.length-1;i>0;i--){const j=rand(i+1);[a[i],a[j]]=[a[j],a[i]]}return a}function choose(source,count){return shuffle(source).slice(0,Math.min(count,source.length))}
// One settings contract for saved setups; applying a setup never starts a draw.
function validSettings(data){
  if(!data||typeof data!=='object'||Array.isArray(data)||data.version!==1||!Object.prototype.hasOwnProperty.call(methodProfile,data.method)||!['number','name'].includes(data.inputMode)||!['winner','rank','custom'].includes(data.resultMode)||!['random','fixed'].includes(data.bombTimerMode))return false;
  if(!Number.isInteger(data.totalPeople)||data.totalPeople<2||data.totalPeople>100||!Number.isInteger(data.pickCount)||data.pickCount<1||data.pickCount>100||!Number.isInteger(data.bombSeconds)||data.bombSeconds<15||data.bombSeconds>300||data.bombSeconds%15)return false;
  return typeof data.names==='string'&&typeof data.customResults==='string'&&data.names.length<=100000&&data.customResults.length<=100000;
}
window.RandomPickerSettings=Object.freeze({
 refreshLabels:refreshGameLabels,
capture(){updateUI();return {version:1,method,inputMode,totalPeople:Number(totalPeople.value),names:names.value,pickCount:Number(pickCount.value),resultMode,customResults:customResults.value,bombTimerMode,bombSeconds:Number(bombSeconds.value)};},
validate:validSettings,
apply(data){
  if(!validSettings(data))return false;
  names.value=data.names;customResults.value=data.customResults;totalPeople.value=data.totalPeople;pickCount.value=data.pickCount;
  method=data.method;inputMode=data.inputMode;resultModeEl.value=data.resultMode;bombTimerMode=data.bombTimerMode;bombSeconds.value=data.bombSeconds;
  setInputMode(inputMode);setMethod(method);return true;
}
});
function targetEntries(pool){
const profile=methodProfile[method]||methodProfile.ladder;
if(profile.result==='rank-all')return Array.from({length:pool.length},(_,i)=>({text:`${i+1}등`,id:i,active:true}));
if(profile.result==='winner-one')return [{text:'당첨',id:0,active:true}];

if(profile.result==='bomb-only')return [{text:'폭탄',id:0,active:true}];
if(resultMode==='custom'){const count=Math.min(pool.length,Math.max(1,Math.floor(Number(pickCount.value)||1)));return parseCustomResults().slice(0,count).map((text,i)=>({text,id:i,active:true}))}
const count=Math.min(pool.length,Math.max(1,Math.floor(Number(pickCount.value)||1)));
if(resultMode==='rank')return Array.from({length:count},(_,i)=>({text:`${i+1}등`,id:i,active:true}));
return Array.from({length:count},(_,i)=>({text:'당첨',id:i,active:true}))}
function endpointEntries(pool){const active=targetEntries(pool),fill=Array.from({length:Math.max(0,pool.length-active.length)},(_,i)=>({text:'꽝',id:active.length+i,active:false}));return shuffle([...active,...fill])}
function sortResults(arr){if(resultMode==='rank'||resultMode==='custom')return [...arr].sort((a,b)=>(a.entry?.id??99)-(b.entry?.id??99));return arr}
function showToast(t){toast.textContent=t;toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),1500)}function invalid(t){showToast(t);mainCard.classList.add('shake');setTimeout(()=>mainCard.classList.remove('shake'),320)}function applyStageTheme(){const meta=methodMeta[method];stage.classList.remove('theme-ladder','theme-wheel','theme-lot','theme-pinball','theme-race','theme-capsule','theme-slot','theme-bomb');if(meta){stage.classList.add(meta.theme);stageTitle.textContent=`${meta.icon} ${meta.label}`}else{stageTitle.textContent=methodTitle[method]||''}}let pickerRunSequence=0,currentPickerRunId='';
function publishPickerResult(){document.dispatchEvent(new CustomEvent('random-picker:result',{detail:{runId:currentPickerRunId,method,inputMode,resultMode,showAll:showingAll,results:lastResults.map(r=>({label:r.person.label,active:!!r.entry.active,rank:r.entry.id+1,text:r.entry.text}))}}));}
function resetStage(){animationToken++;cancelAllAsync();revealAllHandler=null;showingAll=false;visual.innerHTML='';interactiveControls.innerHTML='';hint.textContent='';stageStatus.textContent='';showAllBtn.hidden=false;remainingCandidates.classList.add('hidden');remainingCount.textContent='';remainingList.innerHTML='';resultBlock.classList.remove('show');stage.classList.remove('show');toast.classList.remove('show');mainCard.classList.remove('shake');excludeBtn.classList.remove('hidden')}function updateMethodSettings(){const p=methodProfile[method]||methodProfile.ladder;const bomb=method==='bomb',numericOnly=!!p.numericOnly;if(numericOnly){inputMode='number';numberMode.classList.add('active');nameMode.classList.remove('active');numberTab.classList.add('active');nameTab.classList.remove('active');numberTab.setAttribute('aria-selected','true');nameTab.setAttribute('aria-selected','false');}inputTabs.classList.toggle('hidden',!p.needsInput||numericOnly);totalField.classList.toggle('hidden',!p.needsInput||(!numericOnly&&inputMode==='name'));numberMode.classList.toggle('hidden',!p.needsInput||numericOnly||inputMode!=='number');nameMode.classList.toggle('hidden',!p.needsInput||numericOnly||inputMode!=='name');pickField.classList.toggle('hidden',method==='wheel'||!p.showPick);bombSettings.classList.toggle('hidden',!bomb);bombModeRandom.classList.toggle('active',bombTimerMode==='random');bombModeFixed.classList.toggle('active',bombTimerMode==='fixed');bombFixedWrap.classList.toggle('hidden',!(bomb&&bombTimerMode==='fixed'));const resultHidden=p.result!=='free';resultSettings.classList.toggle('hidden',resultHidden);if(p.result==='rank-all')resultMode='rank';else if(p.result==='winner-one'||p.result==='bomb-only')resultMode='winner';if(resultModeEl.value!==resultMode)resultModeEl.value=resultMode;}function updateUI(){const n=Math.max(2,Math.min(100,Math.floor(Number(totalPeople.value)||2)));totalPeople.value=n;rangeText.textContent=`1 ~ ${n}`;const nameN=parseNames().length;if(inputMode==='name'){nameCount.textContent=`${nameN}명`;nameGuide.textContent='이름만 입력하세요 · 입력한 수만큼 자동으로 참가';}else{nameCount.textContent='';nameGuide.textContent=`1번부터 ${n}번까지 자동 생성`;}const max=inputMode==='name'?Math.max(1,nameN):n;if(Number(pickCount.value)>max)pickCount.value=max;if(Number(pickCount.value)<1)pickCount.value=1;let bombVal=Math.floor(Number(bombSeconds.value)||60);bombVal=Math.max(15,Math.min(300,bombVal));bombVal=Math.round(bombVal/15)*15;bombSeconds.value=bombVal;resultMode=resultModeEl.value;const custom=resultMode==='custom';customResultBox.classList.toggle('show',custom);pickLabel.textContent=resultMode==='rank'?'몇 등까지':'뽑을 인원';pickUnit.textContent=resultMode==='rank'?'등':'명';if(custom){const need=Math.max(1,Math.floor(Number(pickCount.value)||1)),got=parseCustomResults().length;customResultNote.textContent=`${Math.min(got,need)} / ${need}개 입력 · 뽑을 인원 수만큼만 사용`;}updateMethodSettings();refreshGameLabels()}function setInputMode(next){inputMode=next;excluded.clear();resetStage();const num=next==='number';numberTab.classList.toggle('active',num);nameTab.classList.toggle('active',!num);numberTab.setAttribute('aria-selected',String(num));nameTab.setAttribute('aria-selected',String(!num));numberMode.classList.toggle('active',num);nameMode.classList.toggle('active',!num);updateUI()}function setMethod(next){method=next;excluded.clear();document.querySelectorAll('.method').forEach(b=>{const on=b.dataset.method===next;b.classList.toggle('active',on);b.setAttribute('aria-checked',String(on));b.tabIndex=on?0:-1});applyStageTheme();resetStage();updateUI()}function resultHTML(showAll=false){let data=showAll?[...lastResults]:sortResults(lastResults);winners.classList.toggle('result-list',showAll||resultMode!=='winner');if(showAll){winners.innerHTML=data.map(r=>`<li class="winner"><span class="result-person">${esc(label(r.person))}</span><span class="result-outcome ${resultMode==='rank'&&r.entry.active?'rank':''}">${esc(r.entry.text)}</span></li>`).join('');resultKicker.textContent='전체 결과';excludeBtn.classList.toggle('hidden',resultMode!=='winner'||method==='lot');return}if(resultMode==='winner'){winners.innerHTML=data.map(r=>`<li class="winner">${esc(label(r.person))}</li>`).join('');resultKicker.textContent='당첨 결과'}else{winners.innerHTML=data.map(r=>`<li class="winner"><span class="result-person">${esc(label(r.person))}</span><span class="result-outcome ${resultMode==='rank'?'rank':''}">${esc(r.entry.text)}</span></li>`).join('');resultKicker.textContent=resultMode==='rank'?'등수 결과':'결과'}excludeBtn.classList.toggle('hidden',resultMode!=='winner'||method==='lot')}
function revealResults(){showingAll=false;resultHTML(false);resultBlock.classList.add('show');stageStatus.textContent='완료';markGameComplete();publishPickerResult()}
function revealFullResults(results){showingAll=true;lastResults=[...results];lastWinners=lastResults.filter(r=>r.entry&&r.entry.active).map(r=>r.person);resultHTML(true);resultBlock.classList.add('show');stageStatus.textContent='전체';showAllBtn.hidden=true;markGameComplete();publishPickerResult();setTimeout(()=>scrollToElement(resultBlock,{block:'nearest'}),30)}

function gamePack(){const lang=window.__RANDOM_PICKER_LANG__||document.documentElement.lang||'ko';return window.RandomPickerLocales?.[lang];}
function refreshGameLabels(){
 const lang=window.__RANDOM_PICKER_LANG__||document.documentElement.lang||'ko',p=gamePack(),t=window.RandomPickerFlowText[lang]||window.RandomPickerFlowText.en,lot=method==='lot';
 $('pickBtn').textContent=method==='ladder'?t[0]:lot?t[1]:t[2];
 const total=lot?t[3]:(p?.totalPeople||'총 인원'),unit=lot?t[4]:(p?.peopleUnit||'명');
 totalField.querySelector('.label span').textContent=total;totalPeople.setAttribute('aria-label',total);totalPeople.parentElement.querySelector('.unit').textContent=unit;
 document.querySelectorAll('[data-target="totalPeople"]').forEach(b=>b.setAttribute('aria-label',`${b.dataset.delta==='-1'?'−':'+'} ${total}`));
 if(lot){pickLabel.textContent=t[5];pickUnit.textContent=t[4];pickCount.setAttribute('aria-label',t[5]);excludeBtn.classList.add('hidden');}
 const d=p?.dynamic||{},hints={ladder:d.ladderHint||'참가자를 누르면 사다리를 따라 아래 결과를 확인합니다.',wheel:d.wheelHint||'항목마다 같은 확률로 뽑고, 화살표가 가리키는 항목이 당첨됩니다.',lot:d.lotHint||'결과를 섞어 숨긴 제비를 하나씩 골라 펼칩니다.',pinball:d.pinballWinnerHint||'가운데 홀에 가장 늦게 빠진 공이 당첨됩니다.',race:d.raceHint||'입력한 참가자가 달리고, 먼저 도착한 참가자가 당첨됩니다.',capsule:d.capsuleHint||'레버를 돌려 뽑힌 캡슐 안의 항목을 확인합니다.',slot:d.slotHint||'멈춘 가운데 칸의 항목이 당첨됩니다.',bomb:d.bombPass||'기기를 차례로 넘기고, 터질 때 들고 있는 사람이 당첨됩니다.'};
 $('methodFlow').textContent=hints[method]||'';
}
// Each adjacent pair is connected at least twice; candidates are not left-biased.
function buildLadderLayout(lanes){
 const w=620,h=390,top=18,bottom=366,dx=w/lanes,pad=dx/2,levels=Math.max(10,2*(lanes-1)+2),gaps=Array.from({length:lanes-1},(_,i)=>i),required=shuffle([...gaps,...gaps]),rungs=[];
 for(let lv=0;lv<levels;lv++){
  const y=top+28+lv*((bottom-top-56)/(levels-1)),used=new Set(),mandatory=required[lv];
  if(mandatory!==undefined){rungs.push({c:mandatory,y});used.add(mandatory);used.add(mandatory+1);}
  for(const c of shuffle(gaps)){if(!used.has(c)&&!used.has(c+1)&&rand(100)<52){rungs.push({c,y});used.add(c);used.add(c+1);}}
 }
 rungs.sort((a,b)=>a.y-b.y||a.c-b.c);
 const routes=Array.from({length:lanes},(_,start)=>{let lane=start,d=`M ${pad+lane*dx} ${top}`;for(const r of rungs){if(r.c===lane||r.c===lane-1){d+=` L ${pad+lane*dx} ${r.y}`;lane+=r.c===lane?1:-1;d+=` L ${pad+lane*dx} ${r.y}`;}}return{d:d+` L ${pad+lane*dx} ${bottom}`,end:lane};});
 return{w,h,pad,top,bottom,dx,rungs,routes};
}
function wheelColorIndices(size){const colors=Array.from({length:size},(_,i)=>i%3);if(size>2&&colors[size-1]===colors[0])colors[size-1]=1;return colors;}
function wheelTargetAngle(index,size,current,turns=0){const tau=Math.PI*2;let target=-Math.PI/2-(index+.5)*tau/size;target+=Math.max(0,Math.floor((current-target)/tau)+1)*tau;return target+turns*tau;}
// Animation shortcuts commit the pending choice, never replace it with a new draw.
function createDrawSession(pool,entries){
 const remaining=[...pool],assigned=[];let pending=null;
 return{remaining,assigned,select(){if(pending)return pending;if(assigned.length>=entries.length||!remaining.length)return null;const index=rand(remaining.length);return pending={index,person:remaining[index],entry:entries[assigned.length]};},commit(){const pick=this.select();if(!pick)return null;assigned.push({person:pick.person,entry:pick.entry});remaining.splice(pick.index,1);pending=null;return pick;}};
}

function initLadder(pool,count,token){if(pool.length>12){invalid('사다리는 12명까지 이용할 수 있어요');stage.classList.remove('show');return}
const p=[...pool],lanes=p.length,{w,h,pad,top,bottom,dx,rungs,routes}=buildLadderLayout(lanes),endcomes=endpointEntries(p),target=endcomes.filter(e=>e.active).length,cols=`repeat(${lanes},minmax(0,1fr))`;
let svg=`<svg class="ladder-svg" viewBox="0 0 ${w} ${h}" aria-label="사다리"><g stroke="#54473a" stroke-width="3.2">`;for(let i=0;i<lanes;i++){const x=pad+i*dx;svg+=`<line x1="${x}" y1="${top}" x2="${x}" y2="${bottom}"/>`}for(const r of rungs){svg+=`<line x1="${pad+r.c*dx}" y1="${r.y}" x2="${pad+(r.c+1)*dx}" y2="${r.y}"/>`}svg+='</g><g id="routeLayer"></g></svg>';
visual.innerHTML=`<div class="ladder-wrap"><div class="ladder-inner" style="min-width:${lanes*34}px"><div class="ladder-top" style="grid-template-columns:${cols}">${p.map((v,i)=>`<button class="ladder-pick" data-lane="${i}" title="${esc(label(v))}" type="button">${esc(label(v))}</button>`).join('')}</div>${svg}<div class="ladder-bottom" style="grid-template-columns:${cols}">${Array.from({length:lanes},(_,i)=>`<div class="ladder-end" data-end="${i}">?</div>`).join('')}</div><div class="ladder-message" id="ladderMessage"></div></div></div>`;hint.textContent='위 번호나 이름을 눌러 천천히 따라가 보세요.';stageStatus.textContent=`0/${target}`;let found=[],used=new Set();const routeLayer=visual.querySelector('#routeLayer'),msg=visual.querySelector('#ladderMessage');
revealAllHandler=()=>{cancelAllAsync();const full=p.map((person,i)=>({person,entry:endcomes[routes[i].end]}));animationToken++;visual.querySelectorAll('.ladder-end').forEach((el,i)=>{el.textContent=endcomes[i].text;el.classList.add('revealed');if(endcomes[i].active)el.classList.add('win')});revealFullResults(full)};
visual.querySelectorAll('.ladder-pick').forEach(btn=>btn.addEventListener('click',()=>{if(token!==animationToken||btn.disabled)return;const i=Number(btn.dataset.lane);if(used.has(i))return;used.add(i);visual.querySelectorAll('.ladder-pick').forEach(b=>b.disabled=true);btn.classList.add('active','used');const ns='http://www.w3.org/2000/svg';const path=document.createElementNS(ns,'path');path.setAttribute('d',routes[i].d);path.setAttribute('class','ladder-route');routeLayer.appendChild(path);const len=path.getTotalLength();path.style.strokeDasharray=String(len);path.style.strokeDashoffset=String(len);const dot=document.createElementNS(ns,'circle');dot.setAttribute('r','8');dot.setAttribute('class','runner-dot');routeLayer.appendChild(dot);const start=performance.now(),dur=motionTime(Math.max(2200,Math.min(3800,len*6)),1);function frame(now){if(token!==animationToken)return;const t=Math.min(1,(now-start)/dur),e=t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;path.style.strokeDashoffset=String(len*(1-e));const pt=path.getPointAtLength(len*e);dot.setAttribute('cx',pt.x);dot.setAttribute('cy',pt.y);if(t<1)requestAnimationFrame(frame);else{const end=routes[i].end,entry=endcomes[end],endEl=visual.querySelector(`[data-end="${end}"]`);endEl.textContent=entry.text;endEl.title=entry.text;endEl.classList.add('revealed');if(entry.active)endEl.classList.add('win');msg.textContent=`${label(p[i])} · ${entry.text}`;if(entry.active&&!found.some(r=>r.entry===entry))found.push({person:p[i],entry});stageStatus.textContent=`${found.length}/${target}`;visual.querySelectorAll('.ladder-pick').forEach(b=>{if(!used.has(Number(b.dataset.lane)))b.disabled=false});if(found.length>=target){lastResults=sortResults(found);lastWinners=lastResults.map(r=>r.person);setTimeout(()=>{if(token===animationToken)revealResults()},motionTime(500))}}}requestAnimationFrame(frame)}));
}

function initWheel(pool,count,token){
 const queue=targetEntries(pool),draw=createDrawSession(pool,queue),active=draw.remaining,assigned=draw.assigned;let angle=0,spinning=false,raf=0,autoTimer=0,lastTs=0;
 visual.innerHTML='<div class="wheel-game"><div class="wheel-wrap"><canvas id="wheelCanvas" width="720" height="720" role="img" aria-label="참가자 이름이 적힌 회전 룰렛"></canvas><div class="wheel-pointer"></div></div><div class="round-result" id="wheelRound"></div></div>';
 interactiveControls.innerHTML='<div class="game-controls"><button class="control-main" id="wheelStart" type="button">룰렛 시작</button><button class="control-alt" id="wheelStop" type="button" disabled>멈춤</button></div>';
 hint.textContent=gamePack()?.dynamic.wheelHint||'멈춤을 누르지 않아도 잠시 후 자동으로 멈춰요.';stageStatus.textContent=`0/${queue.length}`;
 const canvas=$('wheelCanvas'),ctx=canvas.getContext('2d'),round=$('wheelRound'),startBtn=$('wheelStart'),stopBtn=$('wheelStop');
function paint(){const n=active.length,step=Math.PI*2/n,cx=360,cy=360,r=326,cols=['#dc3b3b','#f8f6f1','#18181a'],txt=['#fff','#111','#fff'],colorIndices=wheelColorIndices(n);ctx.clearRect(0,0,720,720);ctx.save();ctx.translate(cx,cy);ctx.rotate(angle);for(let i=0;i<n;i++){ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,r,i*step,(i+1)*step);ctx.closePath();ctx.fillStyle=cols[colorIndices[i]];ctx.fill();const mid=i*step+step/2;const tx=Math.cos(mid)*(r*.66),ty=Math.sin(mid)*(r*.66);ctx.save();ctx.translate(tx,ty);ctx.rotate(-angle);ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=txt[colorIndices[i]];let t=label(active[i]);if(t.length>8)t=t.slice(0,7)+'…';const size=n>16?16:n>10?18:24;ctx.font=`900 ${size}px sans-serif`;const maxW=Math.max(70,Math.min(170,r*step*.72));if(ctx.measureText(t).width>maxW){let s=t;while(s.length>2&&ctx.measureText(s+'…').width>maxW)s=s.slice(0,-1);t=s+'…'}ctx.fillText(t,0,0,maxW);ctx.restore()}ctx.beginPath();ctx.arc(0,0,68,0,Math.PI*2);ctx.fillStyle='#151515';ctx.fill();ctx.restore()}

 function commitRound(target){const pick=draw.select();if(!pick)return;angle=target??wheelTargetAngle(pick.index,active.length,angle);paint();draw.commit();round.textContent=`${label(pick.person)} · ${pick.entry.text}`;canvas.setAttribute('aria-label',`${label(pick.person)} · ${pick.entry.text}`);stageStatus.textContent=`${assigned.length}/${queue.length}`;}
 function publish(){lastResults=sortResults(assigned);lastWinners=lastResults.map(r=>r.person);revealResults();}
 function spinFrame(ts){if(token!==animationToken||!spinning)return;if(!lastTs)lastTs=ts;angle+=(ts-lastTs)*.012;lastTs=ts;paint();raf=requestAnimationFrame(spinFrame);}
 function stopWheel(){if(!spinning||token!==animationToken)return;spinning=false;cancelAnimationFrame(raf);clearTimeout(autoTimer);startBtn.disabled=true;stopBtn.disabled=true;const pick=draw.select(),from=angle,target=wheelTargetAngle(pick.index,active.length,angle,4+rand(3)),start=performance.now(),dur=motionTime(2300,1);
  function decel(now){if(token!==animationToken)return;const t=Math.min(1,(now-start)/dur);angle=from+(target-from)*(1-Math.pow(1-t,4));paint();if(t<1)raf=requestAnimationFrame(decel);else{commitRound(target);if(assigned.length>=queue.length)setTimeout(()=>{if(token===animationToken)publish();},motionTime(500));else{startBtn.disabled=false;startBtn.textContent=gamePack()?.dynamic.nextWheel||'다음 룰렛';}}}
  raf=requestAnimationFrame(decel);
 }
 revealAllHandler=()=>{cancelAllAsync();spinning=false;startBtn.disabled=true;stopBtn.disabled=true;while(draw.select())commitRound();animationToken++;publish();};
 startBtn.addEventListener('click',()=>{if(spinning||assigned.length>=queue.length||!active.length)return;spinning=true;lastTs=0;round.textContent='';startBtn.disabled=true;stopBtn.disabled=false;raf=requestAnimationFrame(spinFrame);autoTimer=setTimeout(stopWheel,motionTime(3600+rand(1800),1));});stopBtn.addEventListener('click',stopWheel);paint();
}

function initLots(pool,count,token){const outcomes=endpointEntries(pool),opened=new Set(),found=[];visual.innerHTML=`<div class="lot-scene"><div class="lot-bundle">${pool.map((v,i)=>`<button class="paper-lot" type="button" data-i="${i}" aria-label="${esc(label(v))} 제비"><span class="paper"><span class="tag">${esc(label(v))}</span><span class="fold"></span><span class="seal">제비</span><span class="inside"></span></span></button>`).join('')}</div></div>`;hint.textContent='원하는 제비를 눌러 하나씩 펼쳐보세요.';const target=outcomes.filter(e=>e.active).length;stageStatus.textContent=`0/${target}`;
revealAllHandler=()=>{cancelAllAsync();animationToken++;visual.querySelectorAll('.paper-lot').forEach((btn,i)=>{btn.querySelector('.inside').textContent=outcomes[i].text;btn.classList.add('used','open');if(outcomes[i].active)btn.classList.add('win')});revealFullResults(pool.map((person,i)=>({person,entry:outcomes[i]})))};
visual.querySelectorAll('.paper-lot').forEach(btn=>btn.addEventListener('click',()=>{if(token!==animationToken)return;const i=Number(btn.dataset.i),v=pool[i];if(opened.has(i))return;opened.add(i);btn.classList.add('used','pulling');setTimeout(()=>{if(token!==animationToken)return;const entry=outcomes[i];btn.querySelector('.inside').textContent=entry.text;btn.classList.add('open');if(entry.active){btn.classList.add('win');found.push({person:v,entry})}stageStatus.textContent=`${found.length}/${target}`;if(found.length>=target){lastResults=sortResults(found);lastWinners=lastResults.map(r=>r.person);setTimeout(()=>{if(token===animationToken)revealResults()},motionTime(600))}},motionTime(430))}));} 




function buildFullFromSelected(pool,selected,queue){const selectedSet=new Set(selected.map(r=>r.person.id)),losers=pool.filter(p=>!selectedSet.has(p.id)).map((person,i)=>({person,entry:{text:'꽝',id:queue.length+i,active:false}}));return[...selected,...losers]}

function initRace(pool,count,token){
  if(pool.length>16){invalid('경주는 16명까지 이용할 수 있어요');stage.classList.remove('show');return}
  const queue=targetEntries(pool);
  const themes={horse:['🐎','🏇','🦄','🐴'],char:['🐰','🐻','🐱','🦊','🐼','🐯','🐸','🐵']};
  let theme='horse';
  const racers=pool.map((person,i)=>({person,target:(6200+rand(2600))*(reducedMotion?.012:1),order:i,done:false,progress:0,avatar:''}));
  let finish=[],running=false,startAt=0,raf=0;
  function setAvatars(){racers.forEach((r,i)=>{const arr=theme==='horse'?themes.horse:themes.char;r.avatar=arr[i%arr.length]})}
  setAvatars();
  visual.innerHTML=`<div class="race-game"><div class="race-topbar"><div class="theme-pills"><button type="button" class="theme-pill active" data-theme="horse">말 경주</button><button type="button" class="theme-pill" data-theme="char">캐릭터</button></div><div class="stage-status" id="raceMiniStatus">준비</div></div><div class="race-board">${racers.map((r,i)=>`<div class="race-lane"><div class="race-name">${esc(label(r.person))}</div><div class="race-track"><div class="racer" data-racer="${i}">${r.avatar}</div></div></div>`).join('')}</div><div class="race-ranks" id="raceRanks"></div><div class="race-result" id="raceResult"></div></div>`;
  interactiveControls.innerHTML='<div class="game-controls"><button class="control-main" id="raceStart" type="button">경주 시작</button></div>';
  hint.textContent='번호 순서는 그대로 두고, 도착만 랜덤으로 정해져요.';stageStatus.textContent=`0/${queue.length}`;
  const startBtn=$('raceStart'),result=$('raceResult'),mini=$('raceMiniStatus'),rankEl=$('raceRanks');
  function renderAvatars(){visual.querySelectorAll('[data-racer]').forEach((el,i)=>el.textContent=racers[i].avatar);visual.querySelectorAll('[data-theme]').forEach(btn=>btn.classList.toggle('active',btn.dataset.theme===theme))}
  function renderRanks(){const ordered=[...racers].sort((a,b)=>{if(a.done&&b.done)return ((a.target-b.target)||(a.order-b.order));if(a.done)return-1;if(b.done)return 1;return b.progress-a.progress});rankEl.innerHTML=ordered.slice(0,Math.min(6,ordered.length)).map((r,idx)=>`<span class="race-rank-chip ${r.done?'done':''}">${idx+1}위 · ${esc(label(r.person))}</span>`).join('')}
  function finishRace(){const order=[...finish].sort((a,b)=>(a.target-b.target)||(a.order-b.order));const selected=order.slice(0,queue.length).map((r,i)=>({person:r.person,entry:queue[i]}));lastResults=sortResults(selected);lastWinners=lastResults.map(r=>r.person);result.textContent=`${label(order[0].person)} · 우승!`;mini.textContent='완주';stageStatus.textContent='완료';setTimeout(()=>{if(token===animationToken)revealResults()},motionTime(550))}
  function frame(now){if(token!==animationToken||!running)return;const elapsed=now-startAt;racers.forEach((r,i)=>{if(r.done)return;const base=Math.min(1,elapsed/r.target),wiggle=Math.sin(elapsed/115+i*1.7)*1.8;const pct=Math.min(100,Math.max(0,base*96+wiggle));r.progress=pct;visual.querySelector(`[data-racer="${i}"]`).style.left=`calc(${pct}% - ${pct*.32}px + 5px)`;if(elapsed>=r.target){r.done=true;r.progress=100;finish.push(r);const el=visual.querySelector(`[data-racer="${i}"]`);el.style.left='calc(100% - 40px)';el.classList.add('finished');if(finish.length<=queue.length){stageStatus.textContent=`${finish.length}/${queue.length}`;mini.textContent=`${finish.length}명 도착`;result.textContent=`${finish.length}위 · ${label(r.person)}`}if(finish.length===racers.length){running=false;finishRace()}}});renderRanks();if(running)raf=requestAnimationFrame(frame)}
  revealAllHandler=()=>{cancelAllAsync();if(running){running=false;cancelAnimationFrame(raf)}const order=[...racers].sort((a,b)=>((a.target-b.target)||(a.order-b.order)));racers.forEach((r,i)=>{r.done=true;r.progress=100;const el=visual.querySelector(`[data-racer="${i}"]`);el.style.left='calc(100% - 40px)';el.classList.add('finished');});renderRanks();result.textContent=`${label(order[0].person)} · 우승!`;startBtn.disabled=true;const selected=order.slice(0,queue.length).map((r,i)=>({person:r.person,entry:queue[i]}));animationToken++;revealFullResults(buildFullFromSelected(pool,selected,queue))};
  visual.querySelectorAll('[data-theme]').forEach(btn=>btn.addEventListener('click',()=>{if(running)return;theme=btn.dataset.theme;setAvatars();renderAvatars();renderRanks()}));
  startBtn.addEventListener('click',()=>{if(running)return;running=true;startBtn.disabled=true;mini.textContent='출발!';startAt=performance.now();raf=requestAnimationFrame(frame)});
  renderRanks();
}

function initCapsule(pool,count,token){
  const queue=targetEntries(pool),draw=createDrawSession(pool,queue),active=draw.remaining,assigned=draw.assigned;let busy=false,spinTimer=0;
  const colors=['#ef7f74','#7ed1d7','#ffd267','#97d46d','#a897ff','#ff91b5','#d99a67','#b69574'];
  visual.innerHTML=`<div class="capsule-game"><div class="capsule-machine" id="capsuleMachine"><div class="capsule-top">CAPSULE PICK</div><div class="capsule-globe" id="capsuleGlobe"></div><div class="capsule-neck"></div><div class="capsule-handle"></div><div class="capsule-coin"></div><div class="capsule-base"></div><div class="capsule-chute"></div><div class="capsule-tray" id="capsuleTray">READY</div></div><div class="capsule-result" id="capsuleResult"></div></div>`;
  interactiveControls.innerHTML='<div class="game-controls"><button class="control-main" id="capsuleStart" type="button">레버 돌리기</button></div>';
  hint.textContent='레버를 돌리면 캡슐이 섞이고, 한 알이 내려와 열립니다.';stageStatus.textContent=`0/${queue.length}`;
  const machine=$('capsuleMachine'),globe=$('capsuleGlobe'),tray=$('capsuleTray'),result=$('capsuleResult'),btn=$('capsuleStart');
  function renderCapsules(){const cols=Math.max(2,Math.ceil(Math.sqrt(active.length))),rows=Math.max(2,Math.ceil(active.length/cols)),size=Math.min(32,78/cols);globe.innerHTML=active.map((p,i)=>{const x=12+(i%cols+.5)*76/cols,y=14+(Math.floor(i/cols)+.5)*72/rows,rot=rand(20)-10;return `<div class="capsule-ball" aria-hidden="true" data-x="${x}" data-y="${y}" data-rot="${rot}" style="left:${x}%;top:${y}%;width:${size}%;height:auto;aspect-ratio:1;background:${colors[i%colors.length]};transform:translate(-50%,-50%) rotate(${rot}deg)"><span class="capsule-label">${esc(label(p))}</span></div>`;}).join('');}
  function startSpin(){globe.classList.add('spin');const started=performance.now();spinTimer=setInterval(()=>{if(token!==animationToken)return;const t=(performance.now()-started)/155;globe.querySelectorAll('.capsule-ball').forEach((el,i)=>{const bx=Number(el.dataset.x),by=Number(el.dataset.y),br=Number(el.dataset.rot),wave=Math.sin(t+i*1.73),hop=Math.abs(Math.sin(t*1.18+i*1.11)),x=bx+wave*(2.4+(i%3)),y=by-hop*(7+(i%4)*1.7);el.style.left=`${x}%`;el.style.top=`${y}%`;el.style.transform=`translate(-50%,-50%) rotate(${br+wave*18}deg)`})},50)}
  function stopSpin(){globe.classList.remove('spin');clearInterval(spinTimer);spinTimer=0}
  function showOpenedCapsule(person,color){tray.innerHTML=`<div style="position:relative;width:126px;height:28px"><div class="capsule-half left" style="background:${color}"></div><div class="capsule-half right" style="background:${color}"></div><div class="capsule-paper">${esc(label(person))}</div></div>`}
  function finishOne(){if(token!==animationToken||!active.length)return;const pick=draw.select(),{index:idx,person,entry}=pick,color=colors[idx%colors.length];tray.textContent='돌리는 중…';btn.disabled=true;machine.classList.add('shake','turning');startSpin();setTimeout(()=>{if(token!==animationToken)return;machine.classList.remove('shake','turning');stopSpin();machine.classList.add('dispense');tray.textContent='나오는 중…';const drop=document.createElement('div');drop.className='capsule-drop';drop.style.background=color;machine.appendChild(drop);requestAnimationFrame(()=>drop.classList.add('fall'));setTimeout(()=>{if(token!==animationToken)return;drop.remove();machine.classList.remove('dispense');draw.commit();showOpenedCapsule(person,color);result.textContent=`${label(person)} · ${entry.text}`;stageStatus.textContent=`${assigned.length}/${queue.length}`;renderCapsules();busy=false;if(assigned.length>=queue.length){lastResults=sortResults(assigned);lastWinners=lastResults.map(r=>r.person);setTimeout(()=>{if(token===animationToken)revealResults()},motionTime(850))}else{btn.disabled=false;btn.textContent='다음 캡슐'}},motionTime(760))},motionTime(1450+rand(250)))}
  btn.addEventListener('click',()=>{if(busy||assigned.length>=queue.length)return;busy=true;finishOne()});
  revealAllHandler=()=>{cancelAllAsync();stopSpin();machine.classList.remove('shake','turning','dispense');machine.querySelectorAll('.capsule-drop').forEach(el=>el.remove());while(draw.select()){const pick=draw.select();showOpenedCapsule(pick.person,colors[pick.index%colors.length]);result.textContent=`${label(pick.person)} · ${pick.entry.text}`;draw.commit();}renderCapsules();busy=false;btn.disabled=true;lastResults=sortResults(assigned);lastWinners=lastResults.map(r=>r.person);animationToken++;revealResults()};renderCapsules();
}

function initSlot(pool,count,token){
  const queue=targetEntries(pool),draw=createDrawSession(pool,queue),active=draw.remaining,assigned=draw.assigned;let spinning=false,timer=0,autoTimer=0,stopping=false;
  visual.innerHTML='<div class="slot-game"><div class="slot-machine" id="slotMachine"><div class="slot-top">LUCKY SLOT</div><div class="slot-lights"><span class="slot-light"></span><span class="slot-light"></span><span class="slot-light"></span><span class="slot-light"></span><span class="slot-light"></span></div><div class="slot-window"><div class="slot-reels"><div class="slot-reel" id="slotReel1"><div class="slot-item" id="slotItem1">READY</div></div><div class="slot-reel center winline" id="slotCenterReel"><div class="slot-item" id="slotItem2">READY</div></div><div class="slot-reel" id="slotReel3"><div class="slot-item" id="slotItem3">READY</div></div></div></div><div class="slot-lever"></div></div><div class="slot-result" id="slotResult"></div></div>';
  interactiveControls.innerHTML='<div class="game-controls"><button class="control-main" id="slotStart" type="button">슬롯 시작</button><button class="control-alt" id="slotStop" type="button" disabled>멈춤</button></div>';
  hint.textContent='릴이 하나씩 멈추고 가운데 결과가 당첨됩니다.';stageStatus.textContent=`0/${queue.length}`;
  const items=[$('slotItem1'),$('slotItem2'),$('slotItem3')],reels=[$('slotReel1'),$('slotCenterReel'),$('slotReel3')],result=$('slotResult'),startBtn=$('slotStart'),stopBtn=$('slotStop'),centerReel=$('slotCenterReel'),slotMachine=$('slotMachine');
  function sample(){return label(active[rand(active.length)])}
  function stopReel(i,value,delay){setTimeout(()=>{if(token!==animationToken)return;items[i].textContent=value;items[i].classList.remove('spinning');reels[i].classList.remove('reel-stop');void reels[i].offsetWidth;reels[i].classList.add('reel-stop')},delay)}
  function completeStop(){if(!spinning||stopping||token!==animationToken)return;stopping=true;clearInterval(timer);clearTimeout(autoTimer);stopBtn.disabled=true;const pick=draw.select(),{index:idx,person,entry}=pick,left=sample(),right=sample();stopReel(0,left,motionTime(120,5));stopReel(2,right,motionTime(430,10));stopReel(1,label(person),motionTime(760,15));setTimeout(()=>{if(token!==animationToken)return;spinning=false;stopping=false;slotMachine.classList.remove('spinning');slotMachine.classList.add('jackpot');centerReel.classList.add('win');draw.commit();result.textContent=`${label(person)} · ${entry.text}`;stageStatus.textContent=`${assigned.length}/${queue.length}`;setTimeout(()=>slotMachine.classList.remove('jackpot'),motionTime(620));if(assigned.length>=queue.length){startBtn.disabled=true;lastResults=sortResults(assigned);lastWinners=lastResults.map(r=>r.person);setTimeout(()=>{if(token===animationToken)revealResults()},motionTime(900))}else{startBtn.disabled=false;startBtn.textContent='다음 슬롯'}},motionTime(1020,20))}
  startBtn.addEventListener('click',()=>{if(spinning||!active.length)return;spinning=true;stopping=false;slotMachine.classList.add('spinning');slotMachine.classList.remove('jackpot');centerReel.classList.remove('win');reels.forEach(r=>r.classList.remove('reel-stop'));startBtn.disabled=true;stopBtn.disabled=false;items.forEach(el=>el.classList.add('spinning'));let speed=105;clearInterval(timer);function beginTick(){timer=setInterval(()=>{items[0].textContent=sample();items[1].textContent=sample();items[2].textContent=sample()},speed)}beginTick();setTimeout(()=>{if(!spinning||stopping||token!==animationToken)return;clearInterval(timer);speed=62;beginTick()},motionTime(260,5));autoTimer=setTimeout(completeStop,motionTime(2500+rand(700),10))});
  stopBtn.addEventListener('click',completeStop);
  revealAllHandler=()=>{cancelAllAsync();spinning=false;stopping=false;slotMachine.classList.remove('spinning');items.forEach(el=>el.classList.remove('spinning'));while(draw.select()){const pick=draw.select();items[1].textContent=label(pick.person);result.textContent=`${label(pick.person)} · ${pick.entry.text}`;draw.commit();}centerReel.classList.add('win');startBtn.disabled=true;stopBtn.disabled=true;lastResults=sortResults(assigned);lastWinners=lastResults.map(r=>r.person);animationToken++;revealResults()};
}

function initBomb(pool,count,token){
  let running=false,hopTimer=0,autoTimer=0;
  visual.innerHTML=`<div class="bomb-game"><div class="bomb-pass">화면을 켜 둔 채로 휴대폰을 돌리세요</div><div class="bomb-stage"><div class="bomb-core" id="bombCore">💣</div><div class="bomb-flash" id="bombFlash"></div><div class="bomb-holder" id="bombHolder">준비되면 시작</div></div><div class="bomb-result" id="bombResult"></div></div>`;
  interactiveControls.innerHTML='<div class="game-controls"><button class="control-main" id="bombStart" type="button">폭탄 시작</button><button class="control-alt" id="bombNow" type="button" disabled>바로 터뜨리기</button></div>';
  hint.textContent=bombTimerMode==='fixed'?`설정한 ${bombSeconds.value}초 후에 터져요.`:'15초~5분 사이에서 매번 랜덤으로 터져요.';
  stageStatus.textContent=bombTimerMode==='fixed'?`${bombSeconds.value}초 설정`:'RANDOM';
  showAllBtn.hidden=true;
  const core=$('bombCore'),flash=$('bombFlash'),holder=$('bombHolder'),result=$('bombResult'),btn=$('bombStart'),nowBtn=$('bombNow');
  const holderTexts=['넘기세요','다음 사람','돌리세요','조심하세요','빨리 넘기세요','아직 안 터졌어요'];
  function getDelay(){if(bombTimerMode==='fixed')return Math.max(15000,Math.min(300000,Math.floor(Number(bombSeconds.value)||60)*1000));return 15000+rand(285001)}
  function explode(){if(!running||token!==animationToken)return;running=false;clearInterval(hopTimer);clearTimeout(autoTimer);core.classList.remove('tick');if(!reducedMotion){core.classList.add('explode');flash.classList.add('on');}holder.textContent='걸렸습니다!';holder.classList.add('hot');nowBtn.disabled=true;result.textContent='💥 지금 들고 있는 사람이 당첨!';lastResults=[];lastWinners=[];resultBlock.classList.remove('show');stageStatus.textContent='BOOM';markGameComplete();setTimeout(()=>{if(token!==animationToken)return;btn.disabled=false;btn.textContent='다시 시작';core.classList.remove('explode');flash.classList.remove('on');},motionTime(520))}
  btn.addEventListener('click',()=>{if(running)return;if(currentRunCompleted){currentRunCompleted=false;trackEvent('reroll');trackEvent('game_start')}running=true;const delay=getDelay();btn.disabled=true;nowBtn.disabled=false;if(!reducedMotion)core.classList.add('tick');holder.classList.remove('hot');holder.textContent='넘기는 중…';result.textContent='';stageStatus.textContent=bombTimerMode==='fixed'?`${bombSeconds.value}초 설정`:'RANDOM';hopTimer=setInterval(()=>{holder.textContent=holderTexts[rand(holderTexts.length)]},420);autoTimer=setTimeout(explode,delay)});
  nowBtn.addEventListener('click',()=>{if(!running)return;explode()});
  revealAllHandler=null;
}

function initPinball(pool,count,token){
  if(pool.length>16){invalid('핀볼은 16명까지 이용할 수 있어요');stage.classList.remove('show');return}
  const queue=targetEntries(pool);
  let running=false,finished=false,finishOrder=[],raf=0,raceStartedAt=0,lastFrame=0,flipperPhase=0,launchPhase=0,reducedOrder=null;
  visual.innerHTML='<div class="pinball-wrap"><canvas id="pinCanvas" width="600" height="780" role="img" aria-label="참가자 공이 장애물을 지나 중앙 홀로 떨어지는 핀볼 경기"></canvas><div class="pinball-live"><span class="dot"></span><span id="pinLiveText">공들이 맨 위 좌우에서 떨어져요</span></div><div class="pinball-result" id="pinResult"></div><div class="finish-strip" id="finishStrip"></div></div>';
  interactiveControls.innerHTML='<div class="game-controls"><button class="control-main" data-action="launch" type="button">핀볼 시작</button></div>';
  hint.textContent=resultMode==='rank'?'가운데 홀에 가장 늦게 빠진 공부터 1등이 됩니다.':resultMode==='custom'?'가운데 홀에 가장 늦게 빠진 공부터 입력한 결과를 받습니다.':`가운데 홀에 가장 늦게 빠진 ${queue.length}개의 공이 당첨.`;
  stageStatus.textContent='READY';

  const canvas=visual.querySelector('#pinCanvas'),ctx=canvas.getContext('2d'),btn=interactiveControls.querySelector('[data-action="launch"]'),res=visual.querySelector('#pinResult'),strip=visual.querySelector('#finishStrip'),live=visual.querySelector('#pinLiveText');
  const W=600,H=780,fieldL=40,fieldR=560,fieldT=38,fieldB=748,holeX=300,holeY=714,holeR=29;
  const palette=['#ff6db8','#ff9650','#ffd84f','#7ed36f','#ab74ff','#f0f0f0','#ff7f97','#8ce082','#ffe57e','#d295ff','#ffbe5f','#ff92de','#d86f6f','#9e8b62','#c8a7d8','#efc56f'];
  const radius=Math.max(9,Math.min(14,16-pool.length*.22));

  // 넓은 간격의 핀: 서로 포켓을 만들지 않게 배치
  const pins=[
    {x:146,y:220,r:7},{x:224,y:218,r:7},{x:376,y:220,r:7},{x:454,y:220,r:7},
    {x:116,y:310,r:7},{x:194,y:302,r:7},{x:296,y:326,r:7},{x:404,y:304,r:7},{x:486,y:316,r:7},
    {x:154,y:400,r:7},{x:252,y:398,r:7},{x:346,y:396,r:7},{x:444,y:404,r:7},
    {x:134,y:482,r:7},{x:234,y:476,r:7},{x:366,y:478,r:7},{x:466,y:484,r:7},
    {x:176,y:548,r:7},{x:252,y:580,r:7},{x:348,y:580,r:7},{x:424,y:548,r:7}
  ];
  const bumpers=[
    {x:192,y:164,r:28,big:true},
    {x:410,y:174,r:29,big:true},
    {x:300,y:270,r:31,big:true},
    {x:178,y:448,r:27,big:true},
    {x:422,y:450,r:27,big:true}
  ];

  // 짧고 독립적인 디플렉터만 사용. 서로 맞물려 공을 가두지 않음.
  const deflectors=[
    {x1:98,y1:122,x2:172,y2:122},{x1:172,y1:122,x2:220,y2:166},
    {x1:502,y1:122,x2:428,y2:122},{x1:428,y1:122,x2:380,y2:166},
    {x1:142,y1:262,x2:204,y2:298},
    {x1:458,y1:264,x2:396,y2:300},
    {x1:212,y1:356,x2:260,y2:380},
    {x1:388,y1:356,x2:340,y2:380}
  ];

  // 하단은 양옆을 완전히 닫고 중앙 홀로만 유도하는 V자 가이드
  const funnelRails=[
    {x1:fieldL+22,y1:640,x2:holeX-78,y2:700},
    {x1:fieldR-22,y1:640,x2:holeX+78,y2:700}
  ];
  const lowerWallLeft={x1:fieldL+8,y1:fieldB-8,x2:holeX-holeR-9,y2:fieldB-8};
  const lowerWallRight={x1:holeX+holeR+9,y1:fieldB-8,x2:fieldR-8,y2:fieldB-8};

  const balls=pool.map((person,i)=>({person,color:palette[i%palette.length],x:0,y:0,vx:0,vy:0,r:radius,done:false,released:false,finishIndex:-1,stuckTime:0,lastX:0,lastY:0}));

  // 플리퍼는 중앙 입구를 막지 않도록 바깥쪽/짧게 배치
  const leftFlip={px:184,py:661,len:70,rest:.16,fire:-.46,angle:.16};
  const rightFlip={px:416,py:661,len:70,rest:Math.PI-.16,fire:Math.PI+.46,angle:Math.PI-.16};

  function rr(x,y,w,h,r,fill,stroke,lw=1){ctx.beginPath();ctx.roundRect(x,y,w,h,r);if(fill){ctx.fillStyle=fill;ctx.fill()}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=lw;ctx.stroke()}}
  function segEnd(f){return{x2:f.px+Math.cos(f.angle)*f.len,y2:f.py+Math.sin(f.angle)*f.len}}
  function glowCircle(x,y,r,fill,glow,stroke){ctx.save();ctx.shadowColor=glow;ctx.shadowBlur=16;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.lineWidth=2;ctx.strokeStyle=stroke;ctx.stroke()}ctx.restore()}
  function drawSegment(seg,width,color,shadow){ctx.save();ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle=color;ctx.lineWidth=width;ctx.shadowColor=shadow||color;ctx.shadowBlur=10;ctx.beginPath();ctx.moveTo(seg.x1,seg.y1);ctx.lineTo(seg.x2,seg.y2);ctx.stroke();ctx.restore()}
  function drawFlipper(f){const e=segEnd(f);ctx.save();ctx.lineCap='round';ctx.shadowColor='#f2bf69';ctx.shadowBlur=14;ctx.strokeStyle='#ffd792';ctx.lineWidth=22;ctx.beginPath();ctx.moveTo(f.px,f.py);ctx.lineTo(e.x2,e.y2);ctx.stroke();ctx.strokeStyle='rgba(49,31,15,.46)';ctx.lineWidth=9;ctx.stroke();ctx.restore();glowCircle(f.px,f.py,12,'#3b2715','#f2bf69','#ffe2ad')}
  function labelText(person){return inputMode==='number'?person.label:person.label.slice(0,2)}
  function drawBall(b){ctx.save();ctx.shadowColor=b.color;ctx.shadowBlur=17;ctx.beginPath();ctx.arc(b.x,b.y,b.r+1,0,Math.PI*2);ctx.fillStyle=b.color;ctx.fill();ctx.beginPath();ctx.arc(b.x-b.r*.34,b.y-b.r*.36,b.r*.24,0,Math.PI*2);ctx.fillStyle='rgba(255,255,255,.6)';ctx.fill();ctx.fillStyle='#fff';ctx.textAlign='center';ctx.font=`900 ${pool.length>12?9:11}px sans-serif`;ctx.fillText(labelText(b.person),b.x,b.y+4);ctx.restore()}

  function drawBoard(){
    const bg=ctx.createLinearGradient(0,0,0,H);bg.addColorStop(0,'#0d0a08');bg.addColorStop(.55,'#16110d');bg.addColorStop(1,'#0a0806');ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
    rr(18,16,564,748,26,'#090806','#8a6a3a',3);rr(fieldL,34,fieldR-fieldL,714,20,'rgba(13,10,8,.92)','rgba(255,211,133,.58)',2);

    ctx.save();ctx.shadowColor='#ffcf7a';ctx.shadowBlur=18;ctx.strokeStyle='rgba(255,214,142,.88)';ctx.lineWidth=3;
    ctx.beginPath();ctx.moveTo(fieldL+8,118);ctx.lineTo(fieldL+8,606);ctx.stroke();
    ctx.beginPath();ctx.moveTo(fieldR-8,118);ctx.lineTo(fieldR-8,606);ctx.stroke();
    ctx.restore();

    ctx.save();ctx.shadowColor='#ffcf7a';ctx.shadowBlur=18;ctx.fillStyle='#ffe0ad';ctx.textAlign='center';ctx.font='900 17px sans-serif';ctx.fillText('PINBALL RANDOM PICKER',300,62);ctx.restore();

    for(const p of pins) glowCircle(p.x,p.y,p.r+2,'#3a2614','#f1bf69','rgba(255,225,168,.95)');
    for(const p of bumpers){glowCircle(p.x,p.y,p.r+6,'rgba(58,34,16,.95)','#f1c86b','rgba(255,225,168,.95)');glowCircle(p.x,p.y,p.r*.46,'#ffe0a0','#ffe0a0')}
    for(const s of deflectors) drawSegment(s,5,'rgba(255,225,168,.95)','#efbe68');
    for(const s of funnelRails) drawSegment(s,7,'rgba(255,225,168,.95)','#efbe68');
    drawSegment(lowerWallLeft,7,'rgba(255,225,168,.88)','#efbe68');
    drawSegment(lowerWallRight,7,'rgba(255,225,168,.88)','#efbe68');

    drawFlipper(leftFlip);drawFlipper(rightFlip);

    // 중앙 홀 - 유일한 출구
    ctx.save();ctx.shadowColor='#ffd27a';ctx.shadowBlur=24;ctx.strokeStyle='rgba(255,222,160,.98)';ctx.lineWidth=4;ctx.beginPath();ctx.arc(holeX,holeY,holeR+8,0,Math.PI*2);ctx.stroke();ctx.restore();
    ctx.beginPath();ctx.arc(holeX,holeY,holeR,0,Math.PI*2);ctx.fillStyle='#010304';ctx.fill();
    ctx.save();ctx.fillStyle='#ffe2ad';ctx.shadowColor='#ffc96b';ctx.shadowBlur=15;ctx.font='900 13px sans-serif';ctx.textAlign='center';ctx.fillText('OUT',holeX,holeY+48);ctx.restore();
    ctx.save();ctx.beginPath();ctx.roundRect(fieldL+2,36,fieldR-fieldL-4,708,18);ctx.clip();
    for(const b of balls){if(b.done||!b.released)continue;drawBall(b)}
    ctx.restore()
  }

  function collideCircle(b,p){const dx=b.x-p.x,dy=b.y-p.y,min=b.r+p.r,d2=dx*dx+dy*dy;if(d2>=min*min||d2===0)return;const d=Math.sqrt(d2),nx=dx/d,ny=dy/d,over=min-d;b.x+=nx*over;b.y+=ny*over;const dot=b.vx*nx+b.vy*ny;if(dot<0){const rest=p.big?.98:.84;b.vx-=(1+rest)*dot*nx;b.vy-=(1+rest)*dot*ny;if(p.big){b.vx+=nx*118;b.vy+=ny*118}else b.vx+=(Math.random()-.5)*60}}
  function collideSegment(b,s,kick=0,pad=8){const vx=s.x2-s.x1,vy=s.y2-s.y1,l2=vx*vx+vy*vy;if(!l2)return false;let t=((b.x-s.x1)*vx+(b.y-s.y1)*vy)/l2;t=Math.max(0,Math.min(1,t));const px=s.x1+t*vx,py=s.y1+t*vy,dx=b.x-px,dy=b.y-py,d2=dx*dx+dy*dy,min=b.r+pad;if(d2>=min*min||d2===0)return false;const d=Math.sqrt(d2),nx=dx/d,ny=dy/d;b.x+=nx*(min-d);b.y+=ny*(min-d);const dot=b.vx*nx+b.vy*ny;if(dot<0){b.vx-=1.86*dot*nx;b.vy-=1.86*dot*ny}if(kick>0){b.vx+=nx*kick*.18;b.vy-=kick}return true}
  function collideBalls(){for(let i=0;i<balls.length;i++){const a=balls[i];if(a.done||!a.released)continue;for(let j=i+1;j<balls.length;j++){const b=balls[j];if(b.done||!b.released)continue;const dx=b.x-a.x,dy=b.y-a.y,min=a.r+b.r,d2=dx*dx+dy*dy;if(d2>=min*min||d2===0)continue;const d=Math.sqrt(d2),nx=dx/d,ny=dy/d,over=(min-d)/2;a.x-=nx*over;a.y-=ny*over;b.x+=nx*over;b.y+=ny*over;const rvx=b.vx-a.vx,rvy=b.vy-a.vy,sep=rvx*nx+rvy*ny;if(sep<0){const imp=-sep*.84;a.vx-=imp*nx;a.vy-=imp*ny;b.vx+=imp*nx;b.vy+=imp*ny}}}}

  function markFinish(b){if(b.done)return;b.done=true;b.released=false;b.finishIndex=finishOrder.length;finishOrder.push(b);updateFinishStrip();live.textContent=`${finishOrder.length}/${balls.length} 아웃`;if(finishOrder.length===balls.length)finishRace()}
  function updateFinishStrip(){strip.innerHTML=finishOrder.map((b,i)=>`<span class="finish-chip">${i+1}번째 · ${esc(label(b.person))}</span>`).join('')}
  function assignFromFinish(order){const reverse=[...order].reverse(),selected=reverse.slice(0,queue.length),selectedSet=new Set(selected.map(b=>b.person.id)),activeResults=selected.map((b,i)=>({person:b.person,entry:queue[i]})),losers=pool.filter(p=>!selectedSet.has(p.id)).map((person,i)=>({person,entry:{text:'꽝',id:queue.length+i,active:false}}));return{activeResults,full:[...activeResults,...losers]}}
  function finishRace(){if(finished)return;finished=true;running=false;cancelAnimationFrame(raf);btn.disabled=true;const mapped=assignFromFinish(finishOrder),last=finishOrder[finishOrder.length-1];lastResults=mapped.activeResults;lastWinners=lastResults.map(r=>r.person);res.textContent=resultMode==='winner'?`${label(last.person)} · 마지막까지 생존!`:`${label(last.person)} · ${queue[0]?.text||''}`;stageStatus.textContent='완료';live.textContent='핀볼 종료';setTimeout(()=>{if(token===animationToken)revealResults()},motionTime(650))}
  function updateFlippers(now){const pulse=Math.sin((now-raceStartedAt)/560*Math.PI);const firing=pulse>.20;const t=firing?Math.min(1,(pulse-.20)/.80):0;leftFlip.angle=leftFlip.rest+(leftFlip.fire-leftFlip.rest)*t;rightFlip.angle=rightFlip.rest+(rightFlip.fire-rightFlip.rest)*t;flipperPhase=t}
  function releaseBalls(now){const elapsed=now-raceStartedAt;if(launchPhase>=balls.length)return;while(launchPhase<balls.length&&elapsed>launchPhase*140){const b=balls[launchPhase],fromLeft=launchPhase%2===0;b.released=true;b.x=fromLeft?(fieldL+74+rand(26)):(fieldR-74-rand(26));b.y=70+rand(14);b.vx=fromLeft?(46+rand(48)):(-46-rand(48));b.vy=58+rand(64);b.lastX=b.x;b.lastY=b.y;launchPhase++}}

  function step(dt,elapsed){
    const emergency=elapsed>18000;
    const leftEnd=segEnd(leftFlip),rightEnd=segEnd(rightFlip);
    const leftSeg={x1:leftFlip.px,y1:leftFlip.py,x2:leftEnd.x2,y2:leftEnd.y2},rightSeg={x1:rightFlip.px,y1:rightFlip.py,x2:rightEnd.x2,y2:rightEnd.y2};

    for(const b of balls){if(b.done||!b.released)continue;
      b.vy+=610*dt;b.vx*=Math.pow(.996,dt*60);b.vy*=Math.pow(.9985,dt*60);
      if(emergency){b.vy+=240*dt;b.vx+=(holeX-b.x)*.62*dt}
      b.x+=b.vx*dt;b.y+=b.vy*dt;
      if(b.x-b.r<fieldL+18){b.x=fieldL+18+b.r;b.vx=Math.abs(b.vx)*.84+14}
      if(b.x+b.r>fieldR-18){b.x=fieldR-18-b.r;b.vx=-Math.abs(b.vx)*.84-14}
      if(b.y-b.r<fieldT+8){b.y=fieldT+8+b.r;b.vy=Math.abs(b.vy)*.72}

      for(const p of pins) collideCircle(b,p);
      for(const p of bumpers) collideCircle(b,p);
      for(const s of deflectors) collideSegment(b,s,0,7);
      for(const s of funnelRails) collideSegment(b,s,0,8);
      collideSegment(b,lowerWallLeft,0,8);
      collideSegment(b,lowerWallRight,0,8);

      if(b.y>590){
        collideSegment(b,leftSeg,flipperPhase>.18?290+flipperPhase*260:55,7);
        collideSegment(b,rightSeg,flipperPhase>.18?290+flipperPhase*260:55,7);
      }

      // 하단 양 옆은 완전 폐쇄. 중앙 홀 쪽으로만 유도.
      if(b.y>620){
        if(b.x<holeX-70)b.vx+=40*dt*60;
        else if(b.x>holeX+70)b.vx-=40*dt*60;
      }

      // 정체 방지: 같은 위치에서 오래 머물면 아래/가운데로 밀어줌
      const moved=Math.hypot(b.x-b.lastX,b.y-b.lastY);
      const speed=Math.hypot(b.vx,b.vy);
      const nearWall=(b.x<190||b.x>478);
      if((moved<0.75||speed<36) && b.y<610){
        b.stuckTime+=dt;
      } else {
        b.stuckTime=0;
      }
      if(b.stuckTime>.42){
        const dir=b.x<holeX?1:-1;
        b.vx += dir*(70+Math.random()*60);
        b.vy += 90+Math.random()*80;
        if(nearWall) b.vx += dir*70;
        b.x += dir*(8+Math.random()*8);
        b.y += 8+Math.random()*10;
        b.stuckTime=0;
      }
      b.lastX=b.x;
      b.lastY=b.y;

      // 유일한 출구: 중앙 홀 안으로 충분히 진입해야 아웃
      const dx=b.x-holeX,dy=b.y-holeY;
      if(dy>-12 && dx*dx+dy*dy<Math.pow(holeR-b.r*.15,2)){markFinish(b);continue}

      // 바닥은 중앙 홀 이외에는 절대 통과 불가
      if(b.y+b.r>fieldB-7){
        const gap=Math.abs(b.x-holeX)<holeR+7;
        if(!gap){b.y=fieldB-7-b.r;b.vy=-Math.abs(b.vy)*.72;b.vx+=(holeX-b.x)*.07}
      }
    }
    collideBalls();
  }

  function simulateFrame(now,dt){const elapsed=now-raceStartedAt;releaseBalls(now);updateFlippers(now);for(let s=0;s<2;s++)step(dt/2,elapsed);if(elapsed>28000&&running){const remaining=balls.filter(b=>!b.done).sort((a,b)=>(b.y-a.y)||Math.abs(a.x-holeX)-Math.abs(b.x-holeX));remaining.forEach(b=>{if(!running)return;b.x=holeX;b.y=holeY;markFinish(b);});}}
  function frame(now){if(token!==animationToken||!running)return;const dt=Math.min(.025,Math.max(.006,(now-lastFrame)/1000||.016));lastFrame=now;simulateFrame(now,dt);drawBoard();if(running)raf=requestAnimationFrame(frame);}
  function startRace(){if(running||finished)return;running=true;btn.disabled=true;btn.textContent='진행 중';stageStatus.textContent='PLAY';live.textContent=reducedMotion?'동작 줄이기 설정으로 결과를 빠르게 표시합니다':'공들이 맨 위 좌우에서 떨어집니다';raceStartedAt=performance.now();lastFrame=raceStartedAt;if(reducedMotion){reducedOrder=shuffle(balls);reducedOrder.forEach((b,i)=>setTimeout(()=>{if(token!==animationToken||finished)return;b.released=true;b.x=holeX;b.y=holeY;markFinish(b)},i*5));return}raf=requestAnimationFrame(frame)}
  revealAllHandler=()=>{if(!running&&!finished)startRace();cancelAllAsync();if(!finished){if(reducedMotion){reducedOrder.forEach(b=>{if(!b.done){b.x=holeX;b.y=holeY;markFinish(b);}});}else{let simulated=lastFrame;while(running&&simulated-raceStartedAt<=28100){simulated+=1000/60;simulateFrame(simulated,1/60);}}}drawBoard();cancelAllAsync();btn.disabled=true;const mapped=assignFromFinish(finishOrder);animationToken++;revealFullResults(mapped.full)};
  btn.addEventListener('click',startRace);drawBoard();
}
function run(useExclusions=false,trigger='initial'){cancelAllAsync();animationToken++;const profile=methodProfile[method]||methodProfile.ladder,nameN=parseNames().length;if(profile.needsInput&&inputMode==='name'&&(nameN<2||nameN>100)){invalid(nameN>100?'이름은 최대 100명까지 입력할 수 있어요':'이름을 2명 이상 입력하세요');return}let pool=profile.needsInput?items():[];if(useExclusions)pool=pool.filter(v=>!excluded.has(v.id));renderRemainingCandidates(pool);resultMode=resultModeEl.value;if(method==='ladder'&&pool.length>12){invalid('사다리는 12명까지 이용할 수 있어요');return}if(method==='pinball'&&pool.length>16){invalid('핀볼은 16명까지 이용할 수 있어요');return}if(method==='race'&&pool.length>16){invalid('경주는 16명까지 이용할 수 있어요');return}if(profile.result==='free'&&resultMode==='custom'){const need=Math.max(1,Math.floor(Number(pickCount.value)||1));if(parseCustomResults().length!==need){invalid(`결과를 ${need}개 입력하세요`);return}}let count;if(profile.result==='rank-all')count=pool.length;else if(profile.result==='winner-one'||profile.result==='bomb-only')count=1;else count=resultMode==='custom'?Math.min(pool.length,parseCustomResults().length):Math.floor(Number(pickCount.value));if(profile.needsInput&&(!Number.isFinite(count)||count<1)){invalid(resultMode==='rank'?'등수를 확인하세요':'뽑을 인원을 확인하세요');return}if(profile.needsInput&&count>pool.length){invalid(useExclusions?`남은 참가자는 ${pool.length}명이라 ${count}명을 뽑을 수 없어요`:`최대 ${pool.length}${resultMode==='rank'?'등':'명'}`);return}currentPickerRunId=`${Date.now()}-${++pickerRunSequence}`;currentRunAnalytics=analyticsContext(pool);currentRunCompleted=false;if(trigger==='reroll')trackEvent('reroll');else if(trigger==='exclude_reroll')trackEvent('exclude_reroll');trackEvent('game_start');currentRunPool=[...pool];lastWinners=[];lastResults=[];revealAllHandler=null;showingAll=false;showAllBtn.hidden=method==='bomb';const token=animationToken;applyStageTheme();stage.classList.add('show');resultBlock.classList.remove('show');visual.innerHTML='';interactiveControls.innerHTML='';hint.textContent='';stageStatus.textContent='';setTimeout(()=>scrollToElement(stage,{block:'nearest'}),motionTime(60,0));if(method==='wheel')initWheel(pool,count,token);else if(method==='lot')initLots(pool,count,token);else if(method==='pinball')initPinball(pool,count,token);else if(method==='race')initRace(pool,count,token);else if(method==='capsule')initCapsule(pool,count,token);else if(method==='slot')initSlot(pool,count,token);else if(method==='bomb')initBomb([],1,token);else initLadder(pool,count,token)}

document.querySelector('.methods').addEventListener('keydown',event=>{const radios=[...document.querySelectorAll('.method')],current=radios.indexOf(document.activeElement);if(current<0)return;let next=current;if(event.key==='ArrowRight'||event.key==='ArrowDown')next=(current+1)%radios.length;else if(event.key==='ArrowLeft'||event.key==='ArrowUp')next=(current-1+radios.length)%radios.length;else if(event.key==='Home')next=0;else if(event.key==='End')next=radios.length-1;else return;event.preventDefault();setMethod(radios[next].dataset.method);radios[next].focus()});

document.querySelectorAll('[data-target]').forEach(btn=>btn.addEventListener('click',()=>{const el=$(btn.dataset.target);const step=Number(btn.dataset.step)||1;let v=Math.floor(Number(el.value)||1)+Number(btn.dataset.delta)*step;const min=Number(el.min)||1;let max=Number(el.max)||Infinity;if(el.id==='pickCount')max=maxAvailable();el.value=Math.max(min,Math.min(max,v));excluded.clear();resetStage();updateUI()}));document.querySelectorAll('.method').forEach(btn=>btn.addEventListener('click',()=>setMethod(btn.dataset.method)));numberTab.addEventListener('click',()=>setInputMode('number'));nameTab.addEventListener('click',()=>{setInputMode('name');if(!nameMode.classList.contains('hidden'))names.focus({preventScroll:true})});bombModeRandom.addEventListener('click',()=>{bombTimerMode='random';resetStage();updateUI()});bombModeFixed.addEventListener('click',()=>{bombTimerMode='fixed';resetStage();updateUI()});bombSeconds.addEventListener('input',()=>{resetStage();updateUI()});document.querySelectorAll('.bomb-preset').forEach(btn=>btn.addEventListener('click',()=>{bombTimerMode='fixed';bombSeconds.value=btn.dataset.seconds;resetStage();updateUI()}));totalPeople.addEventListener('input',()=>{excluded.clear();resetStage();updateUI()});pickCount.addEventListener('input',()=>{resetStage();updateUI()});names.addEventListener('input',()=>{excluded.clear();resetStage();updateUI()});resultModeEl.addEventListener('change',()=>{resultMode=resultModeEl.value;excluded.clear();resetStage();updateUI()});customResults.addEventListener('input',()=>{resetStage();updateUI()});$('sampleBtn').addEventListener('click',()=>{const sample=['김철수','박영희','최민수','정우성','김민지','한도윤','서지우','윤하린','박서준','최유진'];const n=Math.max(2,Math.floor(Number(totalPeople.value)||2));names.value=Array.from({length:n},(_,i)=>sample[i%sample.length]+(i>=sample.length?`${Math.floor(i/sample.length)+1}`:'')).join('\n');excluded.clear();resetStage();updateUI()});$('pickBtn').addEventListener('click',()=>{excluded.clear();run(false,'initial')});$('repickBtn').addEventListener('click',()=>{excluded.clear();run(false,'reroll')});excludeBtn.addEventListener('click',()=>{if(resultMode!=='winner')return;lastWinners.forEach(v=>excluded.add(v.id));run(true,'exclude_reroll')});showAllBtn.addEventListener('click',()=>{if(typeof revealAllHandler==='function')revealAllHandler()});$('resetBtn').addEventListener('click',()=>{cancelAllAsync();totalPeople.value=8;pickCount.value=1;names.value='';customResults.value='';resultModeEl.value='winner';resultMode='winner';bombTimerMode='random';bombSeconds.value=60;excluded.clear();lastWinners=[];lastResults=[];currentRunPool=[];currentRunAnalytics=null;currentRunCompleted=false;setInputMode('number');setMethod('ladder');updateUI()});updateUI();
})();
