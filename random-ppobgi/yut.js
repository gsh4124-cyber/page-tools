// Standard four-stick results: https://www.nfm.go.kr/kids/elecontents/view.do?topic=46
const NAMES=['모','도','개','걸','윷'],CODES=['mo','do','gae','geol','yut'];
const TEXT={
 ko:['평평한 면','둥근 면','{n}칸 이동','한 번 더 던지세요'],
 en:['Flat side','Rounded side','Move {n} spaces','Throw again'],
 ja:['平らな面','丸い面','{n}マス進む','もう一度投げます'],
 es:['Cara plana','Cara redonda','Avanza {n} casillas','Vuelve a lanzar'],
 zh:['平面','圆面','前进 {n} 格','再掷一次'],
 fr:['Face plate','Face arrondie','Avancez de {n} cases','Relancez'],
 de:['Flache Seite','Runde Seite','{n} Felder vor','Erneut werfen'],
 pt:['Lado plano','Lado arredondado','Avance {n} casas','Lance novamente'],
 id:['Sisi datar','Sisi bulat','Maju {n} langkah','Lempar lagi'],
 hi:['सपाट भाग','गोल भाग','{n} खाने चलें','फिर से फेंकें'],
 pl:['Płaska strona','Zaokrąglona strona','Przejdź {n} pól','Rzuć ponownie'],
 it:['Lato piatto','Lato arrotondato','Avanza di {n} caselle','Lancia di nuovo'],
 nl:['Platte zijde','Ronde zijde','Ga {n} vakjes vooruit','Gooi opnieuw'],
 tr:['Düz yüz','Yuvarlak yüz','{n} kare ilerle','Tekrar at'],
 vi:['Mặt phẳng','Mặt tròn','Đi {n} ô','Tung thêm lần nữa'],
 th:['ด้านแบน','ด้านโค้ง','เดิน {n} ช่อง','โยนอีกครั้ง'],
 ar:['الوجه المسطح','الوجه المستدير','تقدم {n} خانات','ارمِ مرة أخرى']
};
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function classifyYut(faces){
 if(!Array.isArray(faces)||faces.length!==4||faces.some(face=>typeof face!=='boolean'))throw new TypeError('Four boolean faces required');
 const flat=faces.filter(Boolean).length;
 return {flat,code:CODES[flat],name:NAMES[flat],steps:flat||5,again:flat===0||flat===4};
}
export function drawYut(randomFace=()=>{const value=new Uint32Array(1);crypto.getRandomValues(value);return (value[0]&1)===1;}){
 const faces=Array.from({length:4},()=>randomFace());return{faces,...classifyYut(faces)};
}
export function yutStickSvg(flat,prefix){
 const id=escape(prefix),shape=flat?'M13 5 Q8 5 8 13 L9 134 Q10 142 24 143 Q38 142 39 134 L40 13 Q40 5 35 5 Z':'M24 3 C11 3 6 9 6 20 L8 129 C8 140 15 146 24 146 C33 146 40 140 40 129 L42 20 C42 9 37 3 24 3 Z';
 return `<svg class="yut-face-svg" viewBox="0 0 48 150" aria-hidden="true" focusable="false"><defs><linearGradient id="${id}-wood"><stop stop-color="${flat?'#b47d43':'#845027'}"/><stop offset="${flat?'.14':'.24'}" stop-color="${flat?'#e0b777':'#bc864d'}"/><stop offset=".52" stop-color="${flat?'#f2d9a3':'#deb47a'}"/><stop offset=".85" stop-color="${flat?'#e1bb7e':'#b27a42'}"/><stop offset="1" stop-color="#855027"/></linearGradient></defs><path d="${shape}" fill="url(#${id}-wood)" stroke="#865b31" stroke-width="1.3"/>${flat?'<path d="M13 13 L14 132 Q24 138 34 132 L35 13" fill="none" stroke="#fff1c7" stroke-opacity=".55" stroke-width="1.2"/><path class="yut-mark" d="M17 66 L31 84 M31 66 L17 84" fill="none" stroke="#694121" stroke-width="3.1" stroke-linecap="round"/>':'<path d="M17 12 C13 38 14 110 18 137 M29 10 C34 53 33 110 30 138" fill="none" stroke="#8a5a30" stroke-opacity=".3" stroke-width=".8"/><path d="M19 10 C15 47 16 111 20 139" fill="none" stroke="#fff0ca" stroke-opacity=".4" stroke-width="1.4"/><path d="M9 18 Q24 10 39 18 M10 132 Q24 141 38 132" fill="none" stroke="#794a28" stroke-opacity=".42" stroke-width="1"/>'}</svg>`;
}
function mountYut(){
 const button=document.getElementById('throwYut'),out=document.getElementById('yutResult');if(!button||!out)return;
 const lang=window.__RANDOM_PICKER_LANG__||document.documentElement.lang||'ko',pack=window.RandomPickerLocales?.[lang],text=TEXT[lang]||TEXT.en;
 let busy=false,rollId=0;
 const legend=()=>`<div class="yut-legend"><span>× ${escape(text[0])}</span><span>⌒ ${escape(text[1])}</span></div>`;
 out.dataset.yutReady='true';out.innerHTML=`<p class="yut-ready">${escape(pack?.tools.yutPrompt||'윷을 던져보세요')}</p>${legend()}`;
 button.dataset.yutReady='true';
 button.addEventListener('click',()=>{
  if(busy)return;busy=true;button.disabled=true;out.setAttribute('aria-busy','true');const result=drawYut(),id=++rollId;
  const pieces=`<div class="yut-pieces" aria-hidden="true">${result.faces.map((flat,i)=>`<span class="yut-piece" data-face="${flat?'flat':'round'}" style="--rest:${[-7,4,-3,8][i]}deg;--delay:${i*35}ms">${yutStickSvg(flat,`yut-${id}-${i}`)}</span>`).join('')}</div>`;
  out.className='tool-result yut-rolling';out.innerHTML=pieces;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  setTimeout(()=>{
   out.className='tool-result yut-landed';out.dataset.result=result.code;out.dataset.rollId=String(id);
   out.querySelector('.yut-pieces').removeAttribute('aria-hidden');
   out.querySelectorAll('.yut-piece').forEach((piece,i)=>{piece.setAttribute('role','img');piece.setAttribute('aria-label',`${i+1} · ${result.faces[i]?text[0]:text[1]}`);});
   out.insertAdjacentHTML('beforeend',`<div class="yut-outcome"><strong id="yutOutcome">${escape(pack?.yut[result.code]||result.name)}</strong><span id="yutSteps">${escape(text[2].replace('{n}',result.steps))}</span></div><p class="yut-count">${escape(text[0])} <b>${result.flat} / 4</b></p>${result.again?`<p class="yut-again">${escape(text[3])}</p>`:''}${legend()}`);
   out.setAttribute('aria-busy','false');window.RandomPickerToolMetrics?.record('yut');busy=false;button.disabled=false;
  },reduced?120:1000);
 });
}
if(typeof document!=='undefined')mountYut();
