(() => {
  const toggle=document.querySelector("#compareToggle"),panel=document.querySelector("#comparePanel"),rows=document.querySelector("#compareRows"),compareStatus=document.querySelector("#compareStatus"),singleReader=document.querySelector("#singleReader"),bookSelect=document.querySelector("#bookSelect"),chapterSelect=document.querySelector("#chapterSelect"),chapterTitle=document.querySelector("#chapterTitle"),translationSelect=document.querySelector("#translationSelect"),leftSelect=document.querySelector("#leftTranslation"),rightSelect=document.querySelector("#rightTranslation"),swapButton=document.querySelector("#swapTranslations"),pageViewToggle=document.querySelector("#pageViewToggle");
  if(!toggle||!panel||!rows||!singleReader||!leftSelect||!rightSelect||typeof TRANSLATIONS==="undefined"||typeof fetchBook!=="function")return;
  let enabled=localStorage.getItem("bible-reader-compare")==="true";
  let pageView=localStorage.getItem("bible-reader-page-view")==="dual"?"dual":"single";
  let renderToken=0;
  const MESSAGES={
    ko:{loading:'비교 역본을 불러오는 중…',missing:'비교할 장을 찾지 못했습니다.',error:'비교 역본을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.'},
    en:{loading:'Loading translations…',missing:'Could not find this chapter for comparison.',error:'Could not load the comparison translations. Please try again.'},
    fr:{loading:'Chargement des versions…',missing:'Chapitre introuvable pour la comparaison.',error:'Impossible de charger les versions à comparer. Réessayez.'},
    de:{loading:'Übersetzungen werden geladen…',missing:'Kapitel für den Vergleich nicht gefunden.',error:'Vergleichsübersetzungen konnten nicht geladen werden. Bitte erneut versuchen.'},
    zh:{loading:'正在加载对照译本…',missing:'找不到可对照的章节。',error:'无法加载对照译本，请稍后重试。'},
    ru:{loading:'Загрузка переводов для сравнения…',missing:'Глава для сравнения не найдена.',error:'Не удалось загрузить переводы для сравнения. Повторите попытку.'},
    la:{loading:'Versiones ad comparandum onerantur…',missing:'Caput ad comparandum non inventum est.',error:'Versiones comparandae onerari non potuerunt. Iterum tenta.'},
    pt:{loading:'Carregando versões para comparação…',missing:'Capítulo não encontrado para comparação.',error:'Não foi possível carregar as versões para comparação. Tente novamente.'},
    ar:{loading:'جارٍ تحميل الترجمات للمقارنة…',missing:'تعذر العثور على الأصحاح للمقارنة.',error:'تعذر تحميل الترجمات للمقارنة. حاول مرة أخرى.'}
  };
  function msg(key){const lang=window.BibleI18n?.lang?.()||'ko';return (MESSAGES[lang]||MESSAGES.en)[key];}
  function viewLabel(key){return window.BibleI18n?.ui?.(key)||(key==='single'?'한 면 보기':'양면 보기');}
  function currentMainTranslation(){
    if(typeof activeTranslationId!=="undefined"&&TRANSLATIONS[activeTranslationId])return activeTranslationId;
    if(translationSelect&&TRANSLATIONS[translationSelect.value])return translationSelect.value;
    return "krv1961";
  }
  function fillOptions(){
    [leftSelect,rightSelect].forEach(select=>{select.innerHTML="";Object.values(TRANSLATIONS).forEach(tr=>{const o=document.createElement("option");o.value=tr.id;o.textContent=tr.name;select.append(o)})});
    const main=currentMainTranslation(),savedRight=localStorage.getItem("bible-reader-compare-right");
    leftSelect.value=main;
    rightSelect.value=TRANSLATIONS[savedRight]?savedRight:(main==="kjv"?"web":"kjv");
    if(leftSelect.value===rightSelect.value)rightSelect.value=Object.keys(TRANSLATIONS).find(id=>id!==leftSelect.value)||leftSelect.value;
  }
  function syncLeftToMain(){
    const main=currentMainTranslation();
    if(leftSelect.value!==main)leftSelect.value=main;
    if(leftSelect.value===rightSelect.value)rightSelect.value=Object.keys(TRANSLATIONS).find(id=>id!==leftSelect.value)||leftSelect.value;
  }
  function saveSelections(){localStorage.setItem("bible-reader-compare-left",leftSelect.value);localStorage.setItem("bible-reader-compare-right",rightSelect.value)}
  function applyPageView(){
    const dual=pageView==="dual";
    singleReader.classList.toggle("dual-page",dual&&!enabled);
    panel.classList.toggle("stacked",!dual&&enabled);
    if(pageViewToggle){
      pageViewToggle.textContent=dual?'▯▯':'▯';
      pageViewToggle.classList.toggle('active',dual);
      pageViewToggle.setAttribute('aria-pressed',String(dual));
      const nextLabel=dual?viewLabel('single'):viewLabel('dual');
      pageViewToggle.title=nextLabel;
      pageViewToggle.setAttribute('aria-label',nextLabel);
    }
    localStorage.setItem("bible-reader-page-view",pageView);
  }
  async function getVerses(id,bookIndex,chapter){const book=BOOKS[bookIndex];if(!book)return[];const data=await fetchBook(book,id);const ch=data.chapters.find(x=>Number(x.chapter)===chapter);return(ch?.verses||[]).map(v=>({verse:Number(v.verse),text:v.text}))}
  function cellClass(id){const lang=TRANSLATIONS[id]?.language||"";return /^English|Français|Deutsch|Latina|Русский/.test(lang)?" compare-english":""}
  async function renderCompare(){if(!enabled)return;const token=++renderToken,bookIndex=Number(bookSelect.value),chapter=Number(chapterSelect.value);if(!Number.isInteger(bookIndex)||!chapter)return;saveSelections();compareStatus.textContent=msg('loading');compareStatus.hidden=false;rows.replaceChildren();try{const[leftVerses,rightVerses]=await Promise.all([getVerses(leftSelect.value,bookIndex,chapter),getVerses(rightSelect.value,bookIndex,chapter)]);if(token!==renderToken||!enabled)return;if(!leftVerses.length||!rightVerses.length)throw new Error(msg('missing'));const lm=new Map(leftVerses.map(v=>[v.verse,v.text])),rm=new Map(rightVerses.map(v=>[v.verse,v.text])),nums=[...new Set([...lm.keys(),...rm.keys()])].sort((a,b)=>a-b),f=document.createDocumentFragment();nums.forEach(n=>{const row=document.createElement("div");row.className="compare-row";row.dataset.verse=n;const lc=document.createElement("div"),rc=document.createElement("div");lc.className=`compare-cell${cellClass(leftSelect.value)}`;rc.className=`compare-cell${cellClass(rightSelect.value)}`;[lc,rc].forEach((cell,i)=>{const no=document.createElement("span"),txt=document.createElement("span");no.className="compare-verse-number";no.textContent=n;txt.textContent=(i?rm:lm).get(n)||"—";cell.append(no,txt)});row.append(lc,rc);f.append(row)});rows.replaceChildren(f);compareStatus.hidden=true}catch(error){console.error(error);compareStatus.textContent=msg('error')}}
  function keepDifferent(changed){if(leftSelect.value!==rightSelect.value)return;const other=Object.keys(TRANSLATIONS).find(id=>id!==leftSelect.value);if(changed==="left")rightSelect.value=other;else leftSelect.value=other}
  function applyMode(){toggle.classList.toggle("active",enabled);toggle.setAttribute("aria-pressed",String(enabled));panel.hidden=!enabled;singleReader.hidden=enabled;localStorage.setItem("bible-reader-compare",String(enabled));applyPageView();if(enabled){syncLeftToMain();renderCompare()}}
  fillOptions();
  toggle.addEventListener("click",()=>{enabled=!enabled;applyMode()});
  leftSelect.addEventListener("change",()=>{keepDifferent("left");renderCompare()});
  rightSelect.addEventListener("change",()=>{keepDifferent("right");renderCompare()});
  translationSelect?.addEventListener("change",()=>{if(!enabled)return;requestAnimationFrame(()=>{syncLeftToMain();renderCompare()})});
  swapButton?.addEventListener("click",()=>{const l=leftSelect.value;leftSelect.value=rightSelect.value;rightSelect.value=l;renderCompare()});
  pageViewToggle?.addEventListener("click",()=>{pageView=pageView==="dual"?"single":"dual";applyPageView()});
  const observer=new MutationObserver(()=>{if(enabled)requestAnimationFrame(renderCompare)});observer.observe(chapterTitle,{childList:true,subtree:true,characterData:true});applyMode();
})();