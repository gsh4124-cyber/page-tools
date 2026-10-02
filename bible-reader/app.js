const BOOKS = [
  ["창세기","Genesis","Gen"],["출애굽기","Exodus","Exod"],["레위기","Leviticus","Lev"],["민수기","Numbers","Num"],["신명기","Deuteronomy","Deut"],
  ["여호수아","Joshua","Josh"],["사사기","Judges","Judg"],["룻기","Ruth","Ruth"],["사무엘상","1Samuel","1Sam"],["사무엘하","2Samuel","2Sam"],
  ["열왕기상","1Kings","1Kgs"],["열왕기하","2Kings","2Kgs"],["역대상","1Chronicles","1Chr"],["역대하","2Chronicles","2Chr"],["에스라","Ezra","Ezra"],
  ["느헤미야","Nehemiah","Neh"],["에스더","Esther","Esth"],["욥기","Job","Job"],["시편","Psalms","Ps"],["잠언","Proverbs","Prov"],
  ["전도서","Ecclesiastes","Eccl"],["아가","SongofSolomon","Song"],["이사야","Isaiah","Isa"],["예레미야","Jeremiah","Jer"],["예레미야애가","Lamentations","Lam"],
  ["에스겔","Ezekiel","Ezek"],["다니엘","Daniel","Dan"],["호세아","Hosea","Hos"],["요엘","Joel","Joel"],["아모스","Amos","Amos"],
  ["오바댜","Obadiah","Obad"],["요나","Jonah","Jonah"],["미가","Micah","Mic"],["나훔","Nahum","Nah"],["하박국","Habakkuk","Hab"],
  ["스바냐","Zephaniah","Zeph"],["학개","Haggai","Hag"],["스가랴","Zechariah","Zech"],["말라기","Malachi","Mal"],
  ["마태복음","Matthew","Matt"],["마가복음","Mark","Mark"],["누가복음","Luke","Luke"],["요한복음","John","John"],["사도행전","Acts","Acts"],
  ["로마서","Romans","Rom"],["고린도전서","1Corinthians","1Cor"],["고린도후서","2Corinthians","2Cor"],["갈라디아서","Galatians","Gal"],["에베소서","Ephesians","Eph"],
  ["빌립보서","Philippians","Phil"],["골로새서","Colossians","Col"],["데살로니가전서","1Thessalonians","1Thess"],["데살로니가후서","2Thessalonians","2Thess"],
  ["디모데전서","1Timothy","1Tim"],["디모데후서","2Timothy","2Tim"],["디도서","Titus","Titus"],["빌레몬서","Philemon","Phlm"],["히브리서","Hebrews","Heb"],
  ["야고보서","James","Jas"],["베드로전서","1Peter","1Pet"],["베드로후서","2Peter","2Pet"],["요한일서","1John","1John"],["요한이서","2John","2John"],
  ["요한삼서","3John","3John"],["유다서","Jude","Jude"],["요한계시록","Revelation","Rev"]
].map(([ko,file,osis],index)=>({ko,file,osis,index}));

const TRANSLATIONS = {
  krv1961:{id:"krv1961",name:"개역한글",language:"한국어",rights:"저작재산권 만료",type:"krv",attribution:"대한성서공회"},
  kjv:{id:"kjv",name:"King James Version",language:"English",rights:"Public Domain",type:"midvash",lang:"en",slug:"kjv"},
  web:{id:"web",name:"World English Bible",language:"English",rights:"Public Domain",type:"midvash",lang:"en",slug:"web"},
  asv:{id:"asv",name:"American Standard Version",language:"English",rights:"Public Domain",type:"midvash",lang:"en",slug:"asv"},
  lsg:{id:"lsg",name:"Louis Segond 1910",language:"Français",rights:"Public Domain",type:"midvash",lang:"fr",slug:"lsg"},
  luth1912:{id:"luth1912",name:"Lutherbibel 1912",language:"Deutsch",rights:"Public Domain",type:"midvash",lang:"de",slug:"luth1912"},
  cuv:{id:"cuv",name:"和合本 (CUV)",language:"中文",rights:"Public Domain",type:"midvash",lang:"zh",slug:"cuv"},
  synodal:{id:"synodal",name:"Синодальный перевод",language:"Русский",rights:"Public Domain",type:"midvash",lang:"ru",slug:"synodal"},
  vulg:{id:"vulg",name:"Biblia Sacra Vulgata",language:"Latina",rights:"Public Domain",type:"midvash",lang:"la",slug:"vulg"}
};

const $=s=>document.querySelector(s);
const bookSelect=$("#bookSelect"),chapterSelect=$("#chapterSelect"),translationSelect=$("#translationSelect"),chapterTitle=$("#chapterTitle"),versesEl=$("#verses"),statusEl=$("#status");
const prevButtons=[$("#prevChapterBottom")].filter(Boolean),nextButtons=[$("#nextChapterBottom")].filter(Boolean);
const searchForm=$("#searchForm"),searchInput=$("#searchInput"),searchButton=$("#searchButton"),searchPanel=$("#searchPanel"),searchSummary=$("#searchSummary"),searchResults=$("#searchResults");
const cache=new Map(); const SEARCH_LIMIT=100,SEARCH_BATCH_SIZE=6;
let state=restoreLocation(),currentBookData=null,activeTranslationId=restoreTranslation(),searchRun=0;

function restoreLocation(){try{const s=JSON.parse(localStorage.getItem("bible-reader-location"));if(s&&Number.isInteger(s.bookIndex)&&Number.isInteger(s.chapter))return{bookIndex:Math.max(0,Math.min(BOOKS.length-1,s.bookIndex)),chapter:Math.max(1,s.chapter)}}catch(_){}return{bookIndex:BOOKS.findIndex(b=>b.file==="John"),chapter:3}}
function saveLocation(){localStorage.setItem("bible-reader-location",JSON.stringify(state))}
function restoreTranslation(){const saved=localStorage.getItem("bible-reader-translation");return TRANSLATIONS[saved]?saved:"krv1961"}
function saveTranslation(){localStorage.setItem("bible-reader-translation",activeTranslationId)}
function setupBookSelect(){bookSelect.innerHTML="";BOOKS.forEach(book=>{const o=document.createElement("option");o.value=book.index;o.textContent=book.ko;bookSelect.append(o)});bookSelect.value=String(state.bookIndex)}

function normalizeMidvash(raw){return{chapters:(raw.chapters||[]).map((ch,i)=>({chapter:Number(ch.chapter||i+1),verses:(ch.verses||[]).map((v,j)=>({verse:Number(v.number||v.verse||j+1),text:String(v.text||"")}))}))}}
async function fetchBook(book,translationId=activeTranslationId){
  const tr=TRANSLATIONS[translationId]||TRANSLATIONS.krv1961;
  const key=`${tr.id}:${book.osis}`;
  if(cache.has(key))return cache.get(key);
  let data;
  if(tr.type==="krv"){
    const url=`https://raw.githubusercontent.com/bluesaurel/Korean-Bible-1961-KRV/main/data/${book.file}.json`;
    const r=await fetch(url,{cache:"force-cache"}); if(!r.ok)throw new Error(`${tr.name} ${book.ko} 본문을 불러오지 못했습니다.`); data=await r.json();
  }else{
    const url=`https://raw.githubusercontent.com/midvash/bible-data/main/versions/${tr.lang}/${tr.slug}/books/${book.osis}.json`;
    const r=await fetch(url,{cache:"force-cache"}); if(!r.ok)throw new Error(`${tr.name} ${book.ko} 본문을 불러오지 못했습니다.`); data=normalizeMidvash(await r.json());
  }
  cache.set(key,data); return data;
}

function setupChapterSelect(data){chapterSelect.innerHTML="";const count=data.chapters.length;for(let c=1;c<=count;c++){const o=document.createElement("option");o.value=c;o.textContent=`${c}장`;chapterSelect.append(o)}state.chapter=Math.max(1,Math.min(count,state.chapter));chapterSelect.value=String(state.chapter)}
function setLoading(m="본문을 불러오는 중…"){statusEl.hidden=false;statusEl.classList.remove("error");statusEl.textContent=m;versesEl.innerHTML=""}
function setError(m){statusEl.hidden=false;statusEl.classList.add("error");statusEl.textContent=m}
function updateNavigationState(data=currentBookData){if(!data)return;const count=data.chapters.length,atStart=state.bookIndex===0&&state.chapter===1,atEnd=state.bookIndex===BOOKS.length-1&&state.chapter===count;prevButtons.forEach(b=>{b.disabled=atStart;b.setAttribute("aria-disabled",String(atStart))});nextButtons.forEach(b=>{b.disabled=atEnd;b.setAttribute("aria-disabled",String(atEnd))})}
function updateTranslationMeta(){const tr=TRANSLATIONS[activeTranslationId];const meta=$("#translationAttribution");if(meta)meta.textContent=tr.id==="krv1961"?"개역한글 · 대한성서공회":`${tr.name} · ${tr.language} · ${tr.rights}`}
function renderVerses(data){const book=BOOKS[state.bookIndex],chapter=data.chapters.find(i=>Number(i.chapter)===state.chapter);chapterTitle.textContent=`${book.ko} ${state.chapter}장`;document.title=`${book.ko} ${state.chapter}장 · ${TRANSLATIONS[activeTranslationId].name}`;if(!chapter){setError("해당 장을 찾지 못했습니다.");return}const f=document.createDocumentFragment();chapter.verses.forEach(v=>{const p=document.createElement("p");p.className="verse";p.dataset.verse=v.verse;const n=document.createElement("span");n.className="verse-number";n.textContent=v.verse;const t=document.createElement("span");t.className="verse-text";t.textContent=v.text;t.title="클릭하면 이 절을 복사합니다";p.append(n,t);f.append(p)});statusEl.hidden=true;versesEl.replaceChildren(f);updateNavigationState(data);updateTranslationMeta()}
async function loadCurrent({scrollTop=true}={}){const book=BOOKS[state.bookIndex];bookSelect.value=String(state.bookIndex);if(translationSelect)translationSelect.value=activeTranslationId;setLoading();try{currentBookData=await fetchBook(book,activeTranslationId);setupChapterSelect(currentBookData);renderVerses(currentBookData);saveLocation();if(scrollTop)window.scrollTo({top:0,behavior:"auto"})}catch(e){console.error(e);setError("본문을 불러오지 못했습니다. 인터넷 연결을 확인한 뒤 다시 시도해 주세요.")}}
async function moveChapter(delta){if(!currentBookData)return;const count=currentBookData.chapters.length,next=state.chapter+delta;if(next>=1&&next<=count){state.chapter=next;chapterSelect.value=String(next);renderVerses(currentBookData);saveLocation();window.scrollTo({top:0,behavior:"smooth"});return}const ni=state.bookIndex+(delta>0?1:-1);if(ni<0||ni>=BOOKS.length)return;state.bookIndex=ni;state.chapter=delta>0?1:999;await loadCurrent()}

function renderSearchResults(results,q,failed){searchResults.innerHTML="";searchPanel.hidden=false;if(!results.length){searchSummary.textContent=`“${q}” 검색 결과가 없습니다.${failed?` (${failed}권 로딩 실패)`:""}`;return}const limited=results.length>=SEARCH_LIMIT;searchSummary.textContent=`“${q}” ${results.length}${limited?"+":""}개 결과 · ${TRANSLATIONS[activeTranslationId].name}${failed?` · ${failed}권 로딩 실패`:""}`;const f=document.createDocumentFragment();results.slice(0,SEARCH_LIMIT).forEach(r=>{const b=document.createElement("button");b.type="button";b.className="search-result";const ref=document.createElement("strong");ref.textContent=`${r.book.ko} ${r.chapter}:${r.verse}`;const t=document.createElement("span");t.textContent=r.text;b.append(ref,t);b.addEventListener("click",()=>goToSearchResult(r));f.append(b)});searchResults.append(f)}
async function searchBible(q){const normalized=q.trim().toLocaleLowerCase();if(!normalized)return;const run=++searchRun;searchPanel.hidden=false;searchResults.innerHTML="";searchSummary.textContent=`“${q.trim()}” 검색 준비 중…`;searchButton.disabled=true;searchInput.disabled=true;const results=[];let failed=0;try{for(let start=0;start<BOOKS.length&&results.length<SEARCH_LIMIT;start+=SEARCH_BATCH_SIZE){if(run!==searchRun)return;const batch=BOOKS.slice(start,start+SEARCH_BATCH_SIZE);searchSummary.textContent=`“${q.trim()}” 검색 중… ${Math.min(start+batch.length,BOOKS.length)}/${BOOKS.length}권`;const loaded=await Promise.all(batch.map(async book=>{try{return{book,data:await fetchBook(book,activeTranslationId)}}catch(e){console.error(e);failed++;return null}}));loaded.filter(Boolean).forEach(({book,data})=>{if(results.length>=SEARCH_LIMIT)return;data.chapters.forEach(ch=>{if(results.length>=SEARCH_LIMIT)return;ch.verses.forEach(v=>{if(results.length>=SEARCH_LIMIT)return;if(String(v.text).toLocaleLowerCase().includes(normalized))results.push({book,chapter:Number(ch.chapter),verse:Number(v.verse),text:v.text})})})})}if(run===searchRun)renderSearchResults(results,q.trim(),failed)}finally{if(run===searchRun){searchButton.disabled=false;searchInput.disabled=false;searchInput.focus()}}}
async function goToSearchResult(r){state.bookIndex=r.book.index;state.chapter=r.chapter;await loadCurrent();searchPanel.hidden=true;requestAnimationFrame(()=>{const t=versesEl.querySelector(`[data-verse="${r.verse}"]`);if(!t)return;t.classList.add("searched");t.scrollIntoView({behavior:"smooth",block:"center"});setTimeout(()=>t.classList.remove("searched"),1800)})}

function setupControls(){
  translationSelect?.addEventListener("change",async()=>{if(!TRANSLATIONS[translationSelect.value])return;activeTranslationId=translationSelect.value;saveTranslation();searchRun++;searchPanel.hidden=true;await loadCurrent({scrollTop:false})});
  bookSelect.addEventListener("change",async()=>{state.bookIndex=Number(bookSelect.value);state.chapter=1;await loadCurrent()});
  chapterSelect.addEventListener("change",()=>{state.chapter=Number(chapterSelect.value);renderVerses(currentBookData);saveLocation();window.scrollTo({top:0,behavior:"smooth"})});
  prevButtons.forEach(b=>b.addEventListener("click",()=>moveChapter(-1)));nextButtons.forEach(b=>b.addEventListener("click",()=>moveChapter(1)));
  $("#fontDown")?.addEventListener("click",()=>changeFont(-1));$("#fontUp")?.addEventListener("click",()=>changeFont(1));$("#widthToggle")?.addEventListener("click",toggleWidth);$("#themeToggle")?.addEventListener("click",toggleTheme);
  searchForm.addEventListener("submit",e=>{e.preventDefault();searchBible(searchInput.value)});$("#closeSearch")?.addEventListener("click",()=>{searchRun++;searchPanel.hidden=true;searchButton.disabled=false;searchInput.disabled=false});
  document.addEventListener("keydown",e=>{const tag=document.activeElement?.tagName;if(["INPUT","TEXTAREA","SELECT"].includes(tag))return;if(e.key==="ArrowLeft"){e.preventDefault();moveChapter(-1)}if(e.key==="ArrowRight"){e.preventDefault();moveChapter(1)}if(e.key==="/"){e.preventDefault();searchInput.focus()}})
}
function restoreReadingPreferences(){const fs=Number(localStorage.getItem("bible-reader-font-size"))||21;document.documentElement.style.setProperty("--font-size",`${fs}px`);const w=localStorage.getItem("bible-reader-width")||"860";document.documentElement.style.setProperty("--reader-width",`${w}px`);const saved=localStorage.getItem("bible-reader-theme"),dark=window.matchMedia("(prefers-color-scheme: dark)").matches;document.documentElement.dataset.theme=saved||(dark?"dark":"light")}
function changeFont(d){const raw=getComputedStyle(document.documentElement).getPropertyValue("--font-size"),cur=parseFloat(raw)||21,next=Math.max(16,Math.min(32,cur+d));document.documentElement.style.setProperty("--font-size",`${next}px`);localStorage.setItem("bible-reader-font-size",String(next))}
function toggleWidth(){const cur=localStorage.getItem("bible-reader-width")||"860",next=cur==="860"?"1080":cur==="1080"?"720":"860";document.documentElement.style.setProperty("--reader-width",`${next}px`);localStorage.setItem("bible-reader-width",next)}
function toggleTheme(){const next=document.documentElement.dataset.theme==="dark"?"light":"dark";document.documentElement.dataset.theme=next;localStorage.setItem("bible-reader-theme",next)}

restoreReadingPreferences();if(translationSelect)translationSelect.value=activeTranslationId;setupBookSelect();setupControls();loadCurrent({scrollTop:false});