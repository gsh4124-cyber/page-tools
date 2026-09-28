(() => {
  const KO_ALIASES = {
    창:'창세기',출:'출애굽기',레:'레위기',민:'민수기',신:'신명기',수:'여호수아',삿:'사사기',룻:'룻기',삼상:'사무엘상',삼하:'사무엘하',
    왕상:'열왕기상',왕하:'열왕기하',대상:'역대상',대하:'역대하',스:'에스라',느:'느헤미야',에:'에스더',욥:'욥기',시:'시편',잠:'잠언',전:'전도서',아:'아가',
    사:'이사야',렘:'예레미야',애:'예레미야애가',겔:'에스겔',단:'다니엘',호:'호세아',욜:'요엘',암:'아모스',옵:'오바댜',욘:'요나',미:'미가',나:'나훔',합:'하박국',
    습:'스바냐',학:'학개',슥:'스가랴',말:'말라기',마:'마태복음',막:'마가복음',눅:'누가복음',요:'요한복음',행:'사도행전',롬:'로마서',고전:'고린도전서',고후:'고린도후서',
    갈:'갈라디아서',엡:'에베소서',빌:'빌립보서',골:'골로새서',살전:'데살로니가전서',살후:'데살로니가후서',딤전:'디모데전서',딤후:'디모데후서',딛:'디도서',몬:'빌레몬서',
    히:'히브리서',약:'야고보서',벧전:'베드로전서',벧후:'베드로후서',요일:'요한일서',요이:'요한이서',요삼:'요한삼서',유:'유다서',계:'요한계시록'
  };

  const compact = value => String(value || '').toLocaleLowerCase().replace(/[\s._·'’]/g,'');
  const normalizeDash = value => String(value || '').replace(/[–—~〜]/g,'-');

  function namesForIndex(index){
    const values=new Set([BOOKS[index]?.ko,BOOKS[index]?.file,BOOKS[index]?.osis]);
    const groups=window.BibleI18n?.bookNames;
    if(groups) Object.values(groups).forEach(names=>values.add(names?.[index]));
    Object.entries(KO_ALIASES).forEach(([alias,name])=>{if(name===BOOKS[index]?.ko)values.add(alias)});
    return [...values].filter(Boolean);
  }

  function resolveBook(raw){
    const q=compact(KO_ALIASES[raw] || raw);
    if(!q)return null;
    for(let i=0;i<BOOKS.length;i+=1){if(namesForIndex(i).some(name=>compact(name)===q))return BOOKS[i];}
    return null;
  }

  function normalizedReferenceInput(raw){
    return normalizeDash(String(raw||'').trim())
      .replace(/第\s*(\d+)\s*章/gu,'$1:')
      .replace(/第\s*(\d+)\s*节/gu,'$1')
      .replace(/الأصحاح\s*(\d+)/gu,'$1:')
      .replace(/الآية\s*(\d+)/gu,'$1')
      .replace(/(\d+)\s*장/gu,'$1:')
      .replace(/(\d+)\s*절/gu,'$1')
      .replace(/\b(?:chapter|chapitre|kapitel|глава|caput|capítulo)\s*(\d+)/gi,'$1:')
      .replace(/\b(?:verse|verset|vers|стих|versus|versículo)\s*(\d+)/gi,'$1')
      .replace(/：/g,':')
      .replace(/\s+/g,' ')
      .trim();
  }

  function parseReference(raw){
    const prepared=normalizedReferenceInput(raw);
    if(!prepared)return null;
    const whole=compact(prepared);
    const candidates=[];
    BOOKS.forEach(book=>namesForIndex(book.index).forEach(name=>candidates.push({book,name,token:compact(name)})));
    candidates.sort((a,b)=>b.token.length-a.token.length);
    for(const candidate of candidates){
      if(!candidate.token||!whole.startsWith(candidate.token))continue;
      let rest=whole.slice(candidate.token.length);
      rest=rest.replace(/^[:;,]+/,'');
      const match=rest.match(/^(\d+)(?:(?::|,)(\d+)(?:-(\d+))?)?$/u);
      if(!match)continue;
      const chapter=Number(match[1]);
      const verseStart=match[2]?Number(match[2]):null;
      const verseEnd=match[3]?Number(match[3]):verseStart;
      if(!chapter||chapter<1)return null;
      if(verseStart&&(!verseEnd||verseStart<1||verseEnd<verseStart))return null;
      return {book:candidate.book,chapter,verse:verseStart,verseStart,verseEnd};
    }
    return null;
  }

  function uiText(key,fallback){return window.BibleI18n?.ui?.(key) || fallback;}
  function bookLabel(book){return window.BibleI18n?.bookName?.(book.index) || book.ko;}

  function showReferenceError(message){
    if(typeof searchPanel==='undefined'||!searchPanel)return;
    searchPanel.hidden=false;
    searchResults.innerHTML='';
    searchSummary.textContent=message;
  }

  async function goToReference(reference,{scroll=true}={}){
    let data;
    try{data=await fetchBook(reference.book,typeof activeTranslationId!=='undefined'?activeTranslationId:undefined);}
    catch(error){console.error(error);showReferenceError(uiText('loadError','본문을 불러오지 못했습니다. 인터넷 연결을 확인해 주세요.'));return false;}

    const chapter=data.chapters.find(item=>Number(item.chapter)===reference.chapter);
    if(!chapter){showReferenceError(`${bookLabel(reference.book)} ${reference.chapter}`);return false;}
    const start=reference.verseStart ?? reference.verse ?? null;
    const end=reference.verseEnd ?? start;
    if(start){
      const numbers=new Set(chapter.verses.map(item=>Number(item.verse)));
      if(!numbers.has(start)||!numbers.has(end)){showReferenceError(`${bookLabel(reference.book)} ${reference.chapter}:${start}${end!==start?`-${end}`:''}`);return false;}
    }

    state.bookIndex=reference.book.index;
    state.chapter=reference.chapter;
    await loadCurrent({scrollTop:!start});
    if(typeof searchPanel!=='undefined'&&searchPanel)searchPanel.hidden=true;
    if(!start){window.ReaderExperience?.recordLocation?.(1);return true;}
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      const rows=[];
      for(let verse=start;verse<=end;verse+=1){const row=versesEl.querySelector(`[data-verse="${CSS.escape(String(verse))}"]`);if(row){row.classList.add('searched');rows.push(row)}}
      if(scroll)rows[0]?.scrollIntoView({behavior:'smooth',block:'center'});
      setTimeout(()=>rows.forEach(row=>row.classList.remove('searched')),2400);
      window.ReaderExperience?.recordLocation?.(start);
    }));
    return true;
  }

  document.addEventListener('submit',event=>{
    if(event.target?.id!=='searchForm')return;
    const input=document.querySelector('#searchInput');
    const reference=parseReference(input?.value);
    if(!reference)return;
    event.preventDefault();
    event.stopImmediatePropagation();
    goToReference(reference);
  },true);

  window.BibleReference={parseReference,resolveBook,goToReference};
})();
