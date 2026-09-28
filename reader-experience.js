(() => {
  const versesRoot = document.querySelector('#verses');
  const toolbar = document.querySelector('.toolbar');
  const searchInputEl = document.querySelector('#searchInput');
  if (!versesRoot || !toolbar || typeof state === 'undefined' || typeof BOOKS === 'undefined') return;

  const MARKS_KEY = 'bible-reader-verse-marks-v1';
  const HISTORY_KEY = 'bible-reader-navigation-history-v1';
  const FOCUS_KEY = 'bible-reader-focus-mode-v1';
  const COLORS = ['yellow','pink','green','blue','purple'];
  const LABELS = {
    ko:{back:'이전 위치',forward:'다음 위치',focus:'집중 읽기',exitFocus:'집중 읽기 종료',color:'색상',share:'공유',undo:'실행취소',shared:'링크 복사됨',colorTitle:'하이라이트 색상'},
    en:{back:'Previous location',forward:'Next location',focus:'Focus reading',exitFocus:'Exit focus',color:'Color',share:'Share',undo:'Undo',shared:'Link copied',colorTitle:'Highlight color'},
    fr:{back:'Position précédente',forward:'Position suivante',focus:'Lecture concentrée',exitFocus:'Quitter le mode lecture',color:'Couleur',share:'Partager',undo:'Annuler',shared:'Lien copié',colorTitle:'Couleur du surlignage'},
    de:{back:'Vorherige Stelle',forward:'Nächste Stelle',focus:'Lesemodus',exitFocus:'Lesemodus beenden',color:'Farbe',share:'Teilen',undo:'Rückgängig',shared:'Link kopiert',colorTitle:'Markierungsfarbe'},
    zh:{back:'上一位置',forward:'下一位置',focus:'专注阅读',exitFocus:'退出专注阅读',color:'颜色',share:'分享',undo:'撤销',shared:'链接已复制',colorTitle:'高亮颜色'},
    ru:{back:'Предыдущее место',forward:'Следующее место',focus:'Режим чтения',exitFocus:'Выйти из режима',color:'Цвет',share:'Поделиться',undo:'Отменить',shared:'Ссылка скопирована',colorTitle:'Цвет выделения'},
    la:{back:'Locus prior',forward:'Locus proximus',focus:'Modus legendi',exitFocus:'Exi e modo',color:'Color',share:'Communica',undo:'Revoca',shared:'Nexus copiatum',colorTitle:'Color notationis'},
    pt:{back:'Local anterior',forward:'Próximo local',focus:'Leitura focada',exitFocus:'Sair do foco',color:'Cor',share:'Compartilhar',undo:'Desfazer',shared:'Link copiado',colorTitle:'Cor do destaque'},
    ar:{back:'الموضع السابق',forward:'الموضع التالي',focus:'قراءة مركزة',exitFocus:'إنهاء وضع التركيز',color:'اللون',share:'مشاركة',undo:'تراجع',shared:'تم نسخ الرابط',colorTitle:'لون التمييز'}
  };

  const lang = () => String(window.BibleI18n?.lang?.() || document.documentElement.lang || 'ko').toLowerCase().split('-')[0];
  const labels = () => LABELS[lang()] || LABELS.en;
  const translation = () => document.querySelector('#translationSelect')?.value || (typeof activeTranslationId !== 'undefined' ? activeTranslationId : 'krv1961');
  const readMarks = () => { try { return JSON.parse(localStorage.getItem(MARKS_KEY)) || {}; } catch (_) { return {}; } };
  const writeMarks = marks => { localStorage.setItem(MARKS_KEY, JSON.stringify(marks)); window.dispatchEvent(new CustomEvent('bible-reader-records-changed')); };
  const selectedRows = () => [...versesRoot.querySelectorAll('.verse.multi-selected[data-verse]')].sort((a,b)=>Number(a.dataset.verse)-Number(b.dataset.verse));
  const rowText = row => row?.querySelector('.verse-text')?.textContent?.trim() || '';
  const markKey = verse => `${translation()}:${state.bookIndex}:${state.chapter}:${verse}`;

  let historyState = loadHistory();
  let restoringHistory = false;
  let colorPopover = null;
  let undoSnapshot = null;
  let undoTimer = null;
  let toast = null;

  function loadHistory() {
    try {
      const value = JSON.parse(sessionStorage.getItem(HISTORY_KEY));
      if (value && Array.isArray(value.items) && Number.isInteger(value.index)) return value;
    } catch (_) {}
    return {items:[],index:-1};
  }
  function saveHistory(){ try { sessionStorage.setItem(HISTORY_KEY, JSON.stringify(historyState)); } catch (_) {} }
  function nearestVerse(){
    const rows=[...versesRoot.querySelectorAll('.verse[data-verse]')];
    if(!rows.length) return 1;
    const targetY=Math.max(0,window.innerHeight*.28);
    let best=rows[0],distance=Infinity;
    rows.forEach(row=>{const d=Math.abs(row.getBoundingClientRect().top-targetY);if(d<distance){distance=d;best=row;}});
    return Number(best.dataset.verse)||1;
  }
  function snapshot(verse=null){ return {tr:translation(),bookIndex:Number(state.bookIndex)||0,chapter:Number(state.chapter)||1,verse:Number(verse)||nearestVerse()}; }
  function sameLocation(a,b){ return a&&b&&a.tr===b.tr&&a.bookIndex===b.bookIndex&&a.chapter===b.chapter&&a.verse===b.verse; }
  function recordLocation(verse=null){
    if(restoringHistory) return;
    const next=snapshot(verse);
    const current=historyState.items[historyState.index];
    if(sameLocation(current,next)){updateHistoryButtons();return;}
    if(historyState.index < historyState.items.length-1) historyState.items=historyState.items.slice(0,historyState.index+1);
    historyState.items.push(next);
    if(historyState.items.length>60) historyState.items.shift();
    historyState.index=historyState.items.length-1;
    saveHistory(); updateHistoryButtons();
  }
  async function navigateSnapshot(item){
    if(!item) return;
    restoringHistory=true;
    try{
      if(typeof TRANSLATIONS!=='undefined'&&TRANSLATIONS[item.tr]){
        activeTranslationId=item.tr;
        const select=document.querySelector('#translationSelect'); if(select)select.value=item.tr;
        localStorage.setItem('bible-reader-translation',item.tr);
      }
      state.bookIndex=item.bookIndex; state.chapter=item.chapter;
      await loadCurrent({scrollTop:false});
      requestAnimationFrame(()=>requestAnimationFrame(()=>{
        const row=versesRoot.querySelector(`.verse[data-verse="${CSS.escape(String(item.verse||1))}"]`);
        row?.scrollIntoView({behavior:'smooth',block:'center'});
      }));
    }finally{setTimeout(()=>{restoringHistory=false;updateHistoryButtons();},0)}
  }
  async function moveHistory(delta){
    const next=historyState.index+delta;
    if(next<0||next>=historyState.items.length) return;
    historyState.index=next; saveHistory(); updateHistoryButtons();
    await navigateSnapshot(historyState.items[next]);
  }

  function toolButton(className,text,title,handler){
    const b=document.createElement('button');b.type='button';b.className=`quick-tool reader-extra-tool ${className}`;b.textContent=text;b.title=title;b.setAttribute('aria-label',title);b.addEventListener('click',handler);return b;
  }
  function ensureReaderTools(){
    if(toolbar.querySelector('.reader-history-back')) return;
    const l=labels();
    toolbar.append(
      toolButton('reader-history-back','↶',l.back,()=>moveHistory(-1)),
      toolButton('reader-history-forward','↷',l.forward,()=>moveHistory(1)),
      toolButton('reader-focus-toggle','◎',l.focus,toggleFocus)
    );
    const exit=document.createElement('button');exit.type='button';exit.className='reader-focus-exit';exit.textContent=l.exitFocus;exit.addEventListener('click',()=>setFocus(false));document.body.append(exit);
    updateHistoryButtons();
  }
  function updateHistoryButtons(){
    const back=toolbar.querySelector('.reader-history-back'),forward=toolbar.querySelector('.reader-history-forward');
    if(back) back.disabled=historyState.index<=0;
    if(forward) forward.disabled=historyState.index<0||historyState.index>=historyState.items.length-1;
  }
  function setFocus(on){
    document.body.classList.toggle('reader-focus',!!on);
    try{localStorage.setItem(FOCUS_KEY,on?'1':'0')}catch(_){}
    const b=toolbar.querySelector('.reader-focus-toggle');if(b)b.setAttribute('aria-pressed',String(!!on));
  }
  function toggleFocus(){setFocus(!document.body.classList.contains('reader-focus'));}
  function restoreFocus(){try{setFocus(localStorage.getItem(FOCUS_KEY)==='1')}catch(_){setFocus(false)}}

  function syncHighlightColors(){
    const marks=readMarks();
    versesRoot.querySelectorAll('.verse[data-verse]').forEach(row=>{
      const mark=marks[markKey(Number(row.dataset.verse))];
      if(mark?.highlight){row.dataset.highlightColor=COLORS.includes(mark.highlightColor)?mark.highlightColor:'yellow';}
      else delete row.dataset.highlightColor;
    });
  }
  function saveUndoSnapshot(){undoSnapshot=JSON.stringify(readMarks());clearTimeout(undoTimer);}
  function offerUndo(){
    if(!undoSnapshot)return;
    if(!toast){toast=document.createElement('div');toast.className='reader-undo-toast';const span=document.createElement('span');span.className='reader-undo-message';const button=document.createElement('button');button.type='button';button.className='reader-undo-button';button.addEventListener('click',undoLast);toast.append(span,button);document.body.append(toast);}
    toast.querySelector('.reader-undo-message').textContent=labels().colorTitle;
    toast.querySelector('.reader-undo-button').textContent=labels().undo;
    toast.hidden=false;clearTimeout(undoTimer);undoTimer=setTimeout(()=>{if(toast)toast.hidden=true;undoSnapshot=null;},6500);
  }
  function undoLast(){
    if(!undoSnapshot)return;
    try{localStorage.setItem(MARKS_KEY,undoSnapshot);window.dispatchEvent(new CustomEvent('bible-reader-records-changed'));}catch(_){}
    undoSnapshot=null;if(toast)toast.hidden=true;syncHighlightColors();
  }
  function applyHighlightColor(color){
    const rows=selectedRows();if(!rows.length)return;
    saveUndoSnapshot();
    const marks=readMarks();
    rows.forEach(row=>{const key=markKey(Number(row.dataset.verse));const mark=marks[key]||{highlight:false,bookmark:false,note:''};mark.highlight=true;mark.highlightColor=color;mark.savedText=rowText(row)||mark.savedText||'';marks[key]=mark;});
    writeMarks(marks);syncHighlightColors();closeColorPopover();offerUndo();
  }
  function closeColorPopover(){colorPopover?.remove();colorPopover=null;}
  function openColorPopover(anchor){
    closeColorPopover();
    const box=document.createElement('div');box.className='reader-color-popover';box.setAttribute('role','menu');box.setAttribute('aria-label',labels().colorTitle);
    COLORS.forEach(color=>{const b=document.createElement('button');b.type='button';b.className=`reader-color-swatch reader-color-${color}`;b.dataset.color=color;b.title=color;b.setAttribute('aria-label',color);b.addEventListener('click',e=>{e.stopPropagation();applyHighlightColor(color)});box.append(b)});
    const rect=anchor.getBoundingClientRect();box.style.left=`${Math.max(10,Math.min(rect.left,window.innerWidth-230))}px`;box.style.bottom=`${Math.max(68,window.innerHeight-rect.top+8)}px`;document.body.append(box);colorPopover=box;
  }

  function compressVerses(numbers){
    const sorted=[...new Set(numbers.map(Number).filter(Boolean))].sort((a,b)=>a-b);const parts=[];let start=null,prev=null;
    sorted.forEach(n=>{if(start===null){start=prev=n;return;}if(n===prev+1){prev=n;return;}parts.push(start===prev?String(start):`${start}-${prev}`);start=prev=n;});
    if(start!==null)parts.push(start===prev?String(start):`${start}-${prev}`);return parts.join(',');
  }
  function buildShareUrl(rows=selectedRows()){
    const numbers=rows.map(row=>Number(row.dataset.verse)).filter(Boolean);if(!numbers.length)return location.href;
    const url=new URL(location.href);url.searchParams.set('v',translation());url.searchParams.set('ref',`${BOOKS[state.bookIndex].osis}.${state.chapter}.${compressVerses(numbers)}`);url.hash='';return url.toString();
  }
  async function shareSelection(){
    const rows=selectedRows();if(!rows.length)return;
    const url=buildShareUrl(rows);const text=window.BibleClipboard?.buildCopyTextForElements?.(rows)||'';const title=`${window.BibleClipboard?.referenceForVerseNumbers?.(rows.map(r=>Number(r.dataset.verse)))||''}`.trim();
    if(navigator.share){try{await navigator.share({title,text,url});return}catch(error){if(error?.name==='AbortError')return;}}
    const ok=await (window.BibleClipboard?.copyText?.(url)??Promise.resolve(false));
    if(ok){const bar=document.querySelector('.verse-multi-actionbar');bar?.classList.add('shared');setTimeout(()=>bar?.classList.remove('shared'),900);}
  }
  function ensureMultiSelectEnhancements(){
    const actions=document.querySelector('.verse-multi-actions');if(!actions)return;
    if(!actions.querySelector('.verse-multi-color')){const color=document.createElement('button');color.type='button';color.className='verse-multi-color';color.textContent=labels().color;color.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();colorPopover?closeColorPopover():openColorPopover(color)});actions.insertBefore(color,actions.querySelector('.verse-multi-done'))}
    if(!actions.querySelector('.verse-multi-share')){const share=document.createElement('button');share.type='button';share.className='verse-multi-share';share.textContent=labels().share;share.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();shareSelection()});actions.insertBefore(share,actions.querySelector('.verse-multi-done'))}
  }

  function parseDeepLink(value){
    const match=String(value||'').match(/^([A-Za-z0-9]+)\.(\d+)\.(\d+(?:-\d+)?(?:,\d+(?:-\d+)?)*)$/);if(!match)return null;
    const book=BOOKS.find(item=>item.osis.toLowerCase()===match[1].toLowerCase()||item.file.toLowerCase()===match[1].toLowerCase());if(!book)return null;
    const verses=[];match[3].split(',').forEach(part=>{const [a,b]=part.split('-').map(Number);if(!a)return;if(b&&b>=a){for(let n=a;n<=b;n++)verses.push(n)}else verses.push(a)});
    return {book,chapter:Number(match[2]),verses:[...new Set(verses)]};
  }
  async function applyDeepLink(){
    const params=new URLSearchParams(location.search);const parsed=parseDeepLink(params.get('ref'));if(!parsed)return;
    const tr=params.get('v');if(tr&&typeof TRANSLATIONS!=='undefined'&&TRANSLATIONS[tr]){activeTranslationId=tr;document.querySelector('#translationSelect').value=tr;localStorage.setItem('bible-reader-translation',tr)}
    restoringHistory=true;state.bookIndex=parsed.book.index;state.chapter=parsed.chapter;await loadCurrent({scrollTop:false});restoringHistory=false;
    requestAnimationFrame(()=>requestAnimationFrame(()=>{versesRoot.querySelectorAll('.deep-linked').forEach(row=>row.classList.remove('deep-linked'));parsed.verses.forEach(v=>versesRoot.querySelector(`.verse[data-verse="${CSS.escape(String(v))}"]`)?.classList.add('deep-linked'));const first=versesRoot.querySelector(`.verse[data-verse="${CSS.escape(String(parsed.verses[0]||1))}"]`);first?.scrollIntoView({behavior:'smooth',block:'center'});recordLocation(parsed.verses[0]||1)}));
  }

  function noTypingTarget(event){const tag=event.target?.tagName;return !['INPUT','TEXTAREA','SELECT'].includes(tag)&&!event.target?.isContentEditable;}
  document.addEventListener('keydown',event=>{
    if(!noTypingTarget(event)||event.metaKey||event.ctrlKey||event.altKey)return;
    const key=event.key.toLowerCase();
    if(event.key==='/'){event.preventDefault();searchInputEl?.focus();searchInputEl?.select();return;}
    if(event.key==='ArrowLeft'){event.preventDefault();if(typeof moveChapter==='function')moveChapter(-1);return;}
    if(event.key==='ArrowRight'){event.preventDefault();if(typeof moveChapter==='function')moveChapter(1);return;}
    if(key==='f'){event.preventDefault();toggleFocus();return;}
    if(key==='c'&&selectedRows().length){event.preventDefault();document.querySelector('.verse-multi-copy')?.click();return;}
    if(key==='h'&&selectedRows().length){event.preventDefault();document.querySelector('.verse-multi-highlight')?.click();return;}
    if(key==='n'&&selectedRows().length){event.preventDefault();document.querySelector('.verse-multi-note')?.click();return;}
    if(key==='s'&&selectedRows().length){event.preventDefault();shareSelection();return;}
    if(event.key==='Escape'){
      if(colorPopover){closeColorPopover();return;}
      if(selectedRows().length){document.querySelector('.verse-multi-done')?.click();return;}
      if(document.body.classList.contains('reader-focus'))setFocus(false);
    }
  },true);

  document.addEventListener('pointerdown',event=>{
    if(colorPopover&&!colorPopover.contains(event.target)&&!event.target.closest('.verse-multi-color'))closeColorPopover();
    if(event.target.closest('.verse-multi-highlight'))saveUndoSnapshot();
  },true);
  document.addEventListener('click',event=>{if(event.target.closest('.verse-multi-highlight'))setTimeout(()=>{syncHighlightColors();offerUndo();},0)},true);
  window.addEventListener('bible-reader-records-changed',syncHighlightColors);

  const contentObserver=new MutationObserver(()=>{syncHighlightColors();ensureMultiSelectEnhancements();if(!restoringHistory)setTimeout(()=>recordLocation(),0)});
  contentObserver.observe(versesRoot,{childList:true});
  const bodyObserver=new MutationObserver(()=>ensureMultiSelectEnhancements());bodyObserver.observe(document.body,{childList:true,subtree:true});

  ensureReaderTools();restoreFocus();syncHighlightColors();ensureMultiSelectEnhancements();
  if(historyState.index<0)recordLocation(1);else updateHistoryButtons();
  window.ReaderExperience={recordLocation,moveHistory,setFocus,toggleFocus,shareSelection,buildShareUrl,applyHighlightColor};
  window.addEventListener('load',()=>setTimeout(applyDeepLink,120));
})();
