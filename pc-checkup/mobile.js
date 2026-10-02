(()=>{
const $=s=>document.querySelector(s);
let camStream=null,micStream=null,audioCtx=null,raf=0,touchMax=0;
const tests=['touch','display','camera','mic','speaker','motion'];
const resultKey='device-checkup-mobile-results-v1';
let results={};
try{results=JSON.parse(localStorage.getItem(resultKey)||'{}')||{};if(typeof results!=='object'||Array.isArray(results))results={};}catch{results={};}

const friendly=(e,k)=>{
  const n=e?.name||'';
  if(['NotAllowedError','SecurityError'].includes(n)) return `${k} 권한이 차단되었습니다. 브라우저 권한 설정을 확인하세요.`;
  if(['NotFoundError','DevicesNotFoundError'].includes(n)) return `사용 가능한 ${k} 장치를 찾지 못했습니다.`;
  if(['NotReadableError','TrackStartError'].includes(n)) return `${k} 장치를 사용할 수 없습니다. 다른 앱이 사용 중인지 확인하세요.`;
  return `${k}를 시작하지 못했습니다${n?` (${n})`:''}.`;
};

function saveResults(){try{localStorage.setItem(resultKey,JSON.stringify(results));}catch{}}
function setResult(test,state){
  if(state==='unknown') delete results[test]; else results[test]=state;
  saveResults();renderResults();
}
function renderResults(){
  let ok=0,bad=0,done=0;
  tests.forEach(test=>{
    const state=results[test];
    if(state==='ok'){ok++;done++;}
    if(state==='bad'){bad++;done++;}
    document.querySelectorAll(`.mobile-result-actions[data-test="${test}"] .pill`).forEach(b=>b.classList.toggle('active',b.dataset.result===state));
    const card=document.querySelector(`[data-test-card="${test}"]`);
    if(card){card.classList.toggle('result-ok',state==='ok');card.classList.toggle('result-bad',state==='bad');}
  });
  const unknown=tests.length-done;
  $('#mobileOkCount').textContent=ok;
  $('#mobileBadCount').textContent=bad;
  $('#mobileUnknownCount').textContent=unknown;
  $('#mobileProgressText').textContent=`${done} / ${tests.length} 완료`;
  $('#mobileProgressBar').style.width=`${done/tests.length*100}%`;
}

document.querySelectorAll('.mobile-result-actions').forEach(group=>{
  group.addEventListener('click',e=>{
    const b=e.target.closest('[data-result]');if(!b)return;
    setResult(group.dataset.test,b.dataset.result);
  });
});
$('#resetMobileResults').onclick=()=>{results={};try{localStorage.removeItem(resultKey);}catch{}renderResults();};
renderResults();

const touchLayer=$('#touchTestLayer'),touchGrid=$('#touchGrid');
let touchCells=[],visited=new Set(),touchAutoTimer=0;
function buildTouchGrid(){
  clearTimeout(touchAutoTimer);touchAutoTimer=0;
  touchGrid.innerHTML='';visited.clear();touchCells=[];touchMax=0;
  touchGrid.style.top='58px';
  const cols=8,rows=13,total=cols*rows;
  touchGrid.style.setProperty('--touch-cols',cols);touchGrid.style.setProperty('--touch-rows',rows);
  for(let i=0;i<total;i++){const c=document.createElement('div');c.className='touch-cell';c.dataset.cell=i;touchGrid.appendChild(c);touchCells.push(c);}
  $('#touchMax').textContent='0';updateTouchProgress();
}
function closeTouchTest(){
  clearTimeout(touchAutoTimer);touchAutoTimer=0;
  touchLayer.classList.remove('active');
  if(document.fullscreenElement) document.exitFullscreen?.().catch(()=>{});
}
function updateTouchProgress(){
  const total=touchCells.length||1,pct=Math.round(visited.size/total*100);
  $('#touchCoverage').textContent=`${pct}%`;$('#touchLayerProgress').textContent=`${pct}%`;
  if(pct>=100&&!touchAutoTimer){
    const autoMsg=$('#touchAutoMessage');
    if(touchMax>=2){setResult('touch','ok');if(autoMsg)autoMsg.textContent='검사 가능 전체 영역 + 멀티터치 확인 · 정상으로 자동 판정';}
    else if(autoMsg)autoMsg.textContent='검사 가능 전체 영역 완료 · 멀티터치는 별도 확인 필요';
    touchAutoTimer=setTimeout(closeTouchTest,500);
  }
}
function markPoint(x,y){
  const el=document.elementFromPoint(x,y),cell=el?.closest?.('.touch-cell');if(!cell)return;
  const id=cell.dataset.cell;if(!visited.has(id)){visited.add(id);cell.classList.add('visited');updateTouchProgress();}
}
function touchHandler(e){
  if(e.target.closest?.('#closeTouchTest'))return;
  e.preventDefault();
  const list=e.touches||[];touchMax=Math.max(touchMax,list.length);$('#touchMax').textContent=touchMax;
  for(const t of list)markPoint(t.clientX,t.clientY);
}
['touchstart','touchmove'].forEach(x=>touchLayer.addEventListener(x,touchHandler,{passive:false}));
touchLayer.addEventListener('pointerdown',e=>{if(e.pointerType==='touch'&&!e.target.closest?.('#closeTouchTest'))markPoint(e.clientX,e.clientY);});
touchLayer.addEventListener('pointermove',e=>{if(e.pointerType==='touch'&&e.buttons!==0&&!e.target.closest?.('#closeTouchTest'))markPoint(e.clientX,e.clientY);});
$('#startTouchTest').onclick=()=>{buildTouchGrid();$('#touchAutoMessage').textContent='상단 종료바를 제외한 검사 영역이 100%가 되면 자동 종료됩니다.';touchLayer.classList.add('active');document.documentElement.requestFullscreen?.().catch(()=>{});};
const closeTouchBtn=$('#closeTouchTest');
closeTouchBtn.addEventListener('click',closeTouchTest);
closeTouchBtn.addEventListener('pointerup',e=>{e.stopPropagation();closeTouchTest();});
closeTouchBtn.addEventListener('touchstart',e=>{e.preventDefault();e.stopPropagation();closeTouchTest();},{passive:false});

const layer=$('#mobileScreenLayer');
const setScreenColor=color=>{layer.style.background=color;};
document.querySelectorAll('[data-open-screen]').forEach(b=>b.onclick=()=>{setScreenColor(b.dataset.openScreen);layer.classList.add('active');document.documentElement.requestFullscreen?.().catch(()=>{});});
document.querySelectorAll('[data-set-screen]').forEach(b=>b.onclick=()=>setScreenColor(b.dataset.setScreen));
$('#closeScreen').onclick=()=>{layer.classList.remove('active');if(document.fullscreenElement)document.exitFullscreen?.().catch(()=>{});};
document.addEventListener('fullscreenchange',()=>{if(!document.fullscreenElement){layer.classList.remove('active');touchLayer.classList.remove('active');}});

let frontCameraOk=false,backCameraOk=false,frontDeviceId='',backDeviceId='';
function stopCamera(status='카메라 종료'){camStream?.getTracks().forEach(t=>t.stop());camStream=null;$('#camVideo').srcObject=null;$('#camStatus').textContent=status;}
function verifyCameraIdentity(facing,settings){
  const actual=settings.facingMode||'';
  const deviceId=settings.deviceId||'';
  if(facing==='user'){
    if(deviceId) frontDeviceId=deviceId;
    if(actual==='user') frontCameraOk=true;
  }else{
    if(deviceId) backDeviceId=deviceId;
    if(actual==='environment') backCameraOk=true;
  }
  if(frontDeviceId&&backDeviceId&&frontDeviceId!==backDeviceId){frontCameraOk=true;backCameraOk=true;}
  return actual;
}
async function camera(facing){
  stopCamera('카메라 전환 중');
  try{
    camStream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:facing}},audio:false});
    const video=$('#camVideo');video.srcObject=camStream;await video.play().catch(()=>{});
    const s=camStream.getVideoTracks()[0].getSettings();
    const actual=verifyCameraIdentity(facing,s);
    const identityKnown=actual==='user'||actual==='environment'||(frontDeviceId&&backDeviceId&&frontDeviceId!==backDeviceId);
    $('#camStatus').textContent=`카메라 입력 정상${s.width&&s.height?` · ${s.width}×${s.height}`:''}${frontCameraOk&&backCameraOk?' · 서로 다른 전/후면 입력 확인':''}`;
    if(frontCameraOk&&backCameraOk){
      setResult('camera','ok');
      $('#cameraAutoStatus').textContent='서로 구분되는 전·후면 영상 입력이 확인되어 기본 기능 정상으로 자동 판정했습니다. 렌즈 얼룩·색 이상은 직접 확인하세요.';
    }else if(!identityKnown){
      $('#cameraAutoStatus').textContent='영상 입력은 연결됐지만 이 브라우저가 전·후면 카메라 식별정보를 주지 않아 자동 정상 판정은 보류합니다.';
    }else{
      $('#cameraAutoStatus').textContent='현재 카메라 입력은 확인됐습니다. 반대쪽 카메라도 한 번 켜주세요.';
    }
  }catch(e){stopCamera(friendly(e,'카메라'));$('#cameraAutoStatus').textContent='권한 차단이나 장치 접근 실패만으로 기기 불량 판정은 하지 않습니다.';}
}
$('#frontCam').onclick=()=>camera('user');$('#backCam').onclick=()=>camera('environment');$('#stopCam').onclick=()=>stopCamera();

let micPeak=0,micStart=0,micAutoDone=false;
function stopMic(status='마이크 종료'){
  if(raf)cancelAnimationFrame(raf);raf=0;micStream?.getTracks().forEach(t=>t.stop());micStream=null;if(audioCtx){audioCtx.close().catch(()=>{});audioCtx=null;}$('#mobileMicMeter').style.width='0';$('#micStatus').textContent=status;
}
$('#startMic').onclick=async()=>{
  stopMic('마이크 시작 중');micPeak=0;micStart=Date.now();micAutoDone=false;$('#micAutoStatus').textContent='말하거나 손뼉을 쳐주세요. 입력 반응이 확인되면 자동 판정합니다.';
  try{
    micStream=await navigator.mediaDevices.getUserMedia({audio:true});const C=window.AudioContext||window.webkitAudioContext;if(!C)throw new Error('AudioContext');audioCtx=new C();await audioCtx.resume?.();
    const src=audioCtx.createMediaStreamSource(micStream),an=audioCtx.createAnalyser();an.fftSize=512;src.connect(an);const data=new Uint8Array(an.fftSize);
    const draw=()=>{
      an.getByteTimeDomainData(data);let sum=0;for(const v of data){const x=(v-128)/128;sum+=x*x;}const rms=Math.sqrt(sum/data.length);micPeak=Math.max(micPeak,rms);$('#mobileMicMeter').style.width=`${Math.min(100,rms*350)}%`;
      if(!micAutoDone&&Date.now()-micStart>500&&micPeak>0.025){micAutoDone=true;setResult('mic','ok');$('#micStatus').textContent='마이크 입력 반응 확인됨';$('#micAutoStatus').textContent='실제 입력 신호가 감지되어 기본 입력 기능 정상으로 자동 판정했습니다.';}
      raf=requestAnimationFrame(draw);
    };draw();$('#micStatus').textContent='마이크 입력 확인 중';
  }catch(e){stopMic(friendly(e,'마이크'));$('#micAutoStatus').textContent='권한 차단이나 장치 접근 실패만으로 기기 불량 판정은 하지 않습니다.';}
};
$('#stopMic').onclick=()=>stopMic();

$('#playTone').onclick=async()=>{
  try{const C=window.AudioContext||window.webkitAudioContext;if(!C)throw new Error('AudioContext');const c=new C();await c.resume();const o=c.createOscillator(),g=c.createGain();o.frequency.value=440;g.gain.value=.12;o.connect(g).connect(c.destination);o.start();o.stop(c.currentTime+.8);o.onended=()=>c.close();$('#toneStatus').textContent='테스트 톤 재생됨 · 실제로 들렸는지는 직접 확인하세요.';}
  catch(e){$('#toneStatus').textContent='이 브라우저에서 테스트 톤을 재생하지 못했습니다.';}
};

let initialOrientation=matchMedia('(orientation: portrait)').matches?'세로':'가로',orientationChanged=false;
const orient=()=>{const now=matchMedia('(orientation: portrait)').matches?'세로':'가로';$('#orientationText').textContent=now;if(now!==initialOrientation){orientationChanged=true;$('#motionAutoStatus').textContent='화면 회전 감지 완료. 진동은 실제로 느껴졌는지 직접 확인하세요.';}};
orient();addEventListener('orientationchange',orient);addEventListener('resize',orient);
const vib='vibrate' in navigator;$('#vibrateSupport').textContent=vib?'이 브라우저는 진동 API를 지원합니다.':'이 브라우저는 진동 API를 지원하지 않습니다. 미지원은 기기 불량 판정이 아닙니다.';$('#vibrateBtn').disabled=!vib;$('#vibrateBtn').onclick=()=>{navigator.vibrate?.([180,80,180]);if(orientationChanged)$('#motionAutoStatus').textContent='화면 회전은 자동 확인됨. 진동이 실제로 느껴졌다면 정상 버튼을 눌러주세요.';};

addEventListener('pagehide',()=>{closeTouchTest();stopCamera('카메라 종료');stopMic('마이크 종료');navigator.vibrate?.(0);});
})();