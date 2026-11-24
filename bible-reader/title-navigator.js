(() => {
  const title = document.querySelector('#chapterTitle');
  const bookSelect = document.querySelector('#bookSelect');
  const chapterSelect = document.querySelector('#chapterSelect');
  const verseSelect = document.querySelector('#verseSelect');
  if (!title || !bookSelect || !chapterSelect || !verseSelect) return;

  const OT_END_INDEX = 38;
  const HINT_KEY = 'bible-reader-title-nav-hint-seen-v1';
  const LABELS = {
    ko:{title:'성경 빠른 이동',old:'구약',new:'신약',book:'성경책',chapter:'장',verse:'절',close:'닫기',back:'이전',hint:'성경 제목을 눌러 책 · 장 · 절을 바꿀 수 있어요'},
    en:{title:'Quick Bible navigation',old:'Old Testament',new:'New Testament',book:'Book',chapter:'Chapter',verse:'Verse',close:'Close',back:'Back',hint:'Tap the Bible title to change book, chapter, or verse'},
    fr:{title:'Navigation rapide',old:'Ancien Testament',new:'Nouveau Testament',book:'Livre',chapter:'Chapitre',verse:'Verset',close:'Fermer',back:'Retour',hint:'Touchez le titre pour changer de livre, chapitre ou verset'},
    de:{title:'Schnellnavigation',old:'Altes Testament',new:'Neues Testament',book:'Buch',chapter:'Kapitel',verse:'Vers',close:'Schließen',back:'Zurück',hint:'Tippe auf den Bibeltitel, um Buch, Kapitel oder Vers zu wechseln'},
    zh:{title:'快速导航',old:'旧约',new:'新约',book:'书卷',chapter:'章',verse:'节',close:'关闭',back:'返回',hint:'点击圣经标题即可切换书卷、章节和经节'},
    ru:{title:'Быстрый переход',old:'Ветхий Завет',new:'Новый Завет',book:'Книга',chapter:'Глава',verse:'Стих',close:'Закрыть',back:'Назад',hint:'Нажмите на название Библии, чтобы выбрать книгу, главу или стих'},
    la:{title:'Navigatio celeris',old:'Vetus Testamentum',new:'Novum Testamentum',book:'Liber',chapter:'Caput',verse:'Versus',close:'Claude',back:'Retro',hint:'Titulum Bibliae preme ut librum, caput vel versum mutes'},
    pt:{title:'Navegação rápida',old:'Antigo Testamento',new:'Novo Testamento',book:'Livro',chapter:'Capítulo',verse:'Versículo',close:'Fechar',back:'Voltar',hint:'Toque no título da Bíblia para trocar livro, capítulo ou versículo'},
    ar:{title:'تنقل سريع',old:'العهد القديم',new:'العهد الجديد',book:'السفر',chapter:'الأصحاح',verse:'الآية',close:'إغلاق',back:'رجوع',hint:'اضغط على عنوان الكتاب المقدس لتغيير السفر أو الأصحاح أو الآية'}
  };

  let activeTestament = Number(bookSelect.selectedIndex) > OT_END_INDEX ? 'new' : 'old';
  let currentStep = 'book';
  let awaitingBookIndex = null;
  let draftBookIndex = Number(bookSelect.value), draftChapter = Number(chapterSelect.value)||1;
  let draftVerse = Number(verseSelect.value)||1;
  let draftStructure = null, structureRequest = 0;

  const overlay = document.createElement('div');
  overlay.className = 'title-navigator-overlay';
  overlay.hidden = true;
  overlay.innerHTML = `
    <section id="titleNavigatorDialog" class="title-navigator" role="dialog" aria-modal="true" aria-labelledby="titleNavigatorHeading" tabindex="-1">
      <div class="title-navigator-head">
        <button type="button" class="title-navigator-close title-navigator-back" aria-label="이전" hidden>←</button>
        <strong id="titleNavigatorHeading"></strong>
        <button type="button" class="title-navigator-close title-navigator-dismiss" aria-label="닫기">×</button>
      </div>
      <section class="title-navigator-section title-navigator-book-section" data-step="book">
        <div class="title-navigator-section-label" data-label="book"></div>
        <div class="title-navigator-testament-switch" role="tablist">
          <button type="button" data-switch="old" role="tab"></button>
          <button type="button" data-switch="new" role="tab"></button>
        </div>
        <div class="title-navigator-grid title-navigator-books"></div>
      </section>
      <section class="title-navigator-section" data-step="chapter">
        <div class="title-navigator-section-label" data-label="chapter"></div>
        <div class="title-navigator-grid title-navigator-chapters"></div>
      </section>
      <section class="title-navigator-section" data-step="verse">
        <div class="title-navigator-section-label" data-label="verse"></div>
        <div class="title-navigator-grid title-navigator-verses"></div>
      </section>
    </section>`;
  document.body.append(overlay);

  const hint = document.createElement('div');
  hint.className = 'title-navigator-hint';
  hint.hidden = true;
  hint.setAttribute('role','status');
  hint.setAttribute('aria-live','polite');
  title.parentElement?.append(hint);

  const dialog = overlay.querySelector('.title-navigator');
  const heading = overlay.querySelector('#titleNavigatorHeading');
  const backButton = overlay.querySelector('.title-navigator-back');
  const closeButton = overlay.querySelector('.title-navigator-dismiss');
  const switchOld = overlay.querySelector('[data-switch="old"]');
  const switchNew = overlay.querySelector('[data-switch="new"]');
  const books = overlay.querySelector('.title-navigator-books');
  const chapters = overlay.querySelector('.title-navigator-chapters');
  const verses = overlay.querySelector('.title-navigator-verses');
  const sections = {
    book: overlay.querySelector('[data-step="book"]'),
    chapter: overlay.querySelector('[data-step="chapter"]'),
    verse: overlay.querySelector('[data-step="verse"]')
  };

  function lang(){ return window.BibleI18n?.lang?.() || window.__BIBLE_LANG__ || document.documentElement.lang || 'ko'; }
  function labels(){ return LABELS[lang()] || LABELS.en; }
  function selectOptions(select){ return [...select.options]; }

  function markHintSeen(){
    hint.hidden = true;
    try { window.BibleStorage.setItem(HINT_KEY,'1'); } catch (_) {}
  }

  function maybeShowHint(){
    let seen = false;
    try { seen = window.BibleStorage.getItem(HINT_KEY) === '1'; } catch (_) {}
    if (seen) return;
    hint.textContent = labels().hint;
    hint.hidden = false;
    setTimeout(() => { if (!hint.hidden) markHintSeen(); }, 9000);
  }

  function makeChoice(text, selected, onClick){
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'title-navigator-choice';
    b.textContent = text;
    b.setAttribute('aria-pressed', String(selected));
    b.addEventListener('click', onClick);
    return b;
  }

  function showLoading(target){
    const loading = document.createElement('div');
    loading.textContent = '…';
    loading.setAttribute('aria-live','polite');
    target.replaceChildren(loading);
  }

  function currentGrid(){
    if (currentStep === 'chapter') return chapters;
    if (currentStep === 'verse') return verses;
    return books;
  }

  function setStep(step,{focusChoice=true}={}){
    currentStep = step;
    Object.entries(sections).forEach(([key,section]) => { section.hidden = key !== step; });
    backButton.hidden = step === 'book';
    backButton.setAttribute('aria-label',labels().back);
    if (!focusChoice) return;
    requestAnimationFrame(() => {
      const grid = currentGrid();
      const choice = grid.querySelector('[aria-pressed="true"]') || grid.querySelector('button');
      choice?.focus?.({preventScroll:true});
      choice?.scrollIntoView?.({block:'nearest'});
    });
  }

  function renderSwitch(){
    const l = labels();
    switchOld.textContent = l.old;
    switchNew.textContent = l.new;
    [switchOld,switchNew].forEach((button,index) => {
      const key = index === 0 ? 'old' : 'new';
      const selected = activeTestament === key;
      button.setAttribute('aria-selected', String(selected));
      button.classList.toggle('active', selected);
    });
  }

  function renderBooks(){
    books.replaceChildren();
    selectOptions(bookSelect).forEach((option,index) => {
      const belongs = activeTestament === 'old' ? index <= OT_END_INDEX : index > OT_END_INDEX;
      if (!belongs) return;
      books.append(makeChoice(option.textContent.trim(), Number(option.value) === draftBookIndex, () => {
        const changed = draftBookIndex !== Number(option.value);
        draftBookIndex = Number(option.value);
        if (changed) { draftChapter = 1; draftVerse = 1; }
        currentStep = 'chapter';
        const run = ++structureRequest, translationId = activeTranslationId;
        draftStructure = getBookStructure(draftBookIndex,translationId);
        // The per-translation index supplies every number grid synchronously. Start the
        // passage request in parallel; browsing the index never waits for it.
        awaitingBookIndex = draftStructure ? null : Number(option.value);
        setStep('chapter',{focusChoice:false});
        renderAll();
        fetchBook(BOOKS[draftBookIndex],translationId).then(() => {
          if (run !== structureRequest || overlay.hidden) return;
          if (!draftStructure) {
            draftStructure = getBookStructure(draftBookIndex,translationId);
            awaitingBookIndex = null;
            renderAll();
          }
        }).catch(() => {
          if (run !== structureRequest || overlay.hidden || draftStructure) return;
          const error = document.createElement('p');
          error.setAttribute('role','alert');
          error.textContent = window.BibleMemory?.labels?.(lang())?.loadError || 'Could not load the passage. Please try again.';
          chapters.replaceChildren(error);
        });
      }));
    });
  }

  function renderNumberGrid(select,target,step){
    target.replaceChildren();
    const numbers = step === 'chapter' ? draftStructure.map(ch=>ch.chapter)
      : draftStructure.find(ch=>ch.chapter===draftChapter)?.verses || [];
    numbers.forEach(number => {
      const value = String(number);
      const selected = step === 'chapter' ? number === draftChapter : number === draftVerse;
      target.append(makeChoice(value, selected, async () => {
        if (step === 'verse') {
          const bookIndex = draftBookIndex, chapter = draftChapter;
          close({restoreFocus:false});
          if (Number(bookSelect.value) !== bookIndex || Number(chapterSelect.value) !== chapter || !currentBookData) {
            state.bookIndex = bookIndex; state.chapter = chapter;
            const expectedLoad = loadRun + 1;
            if (!await loadCurrent({scrollTop:false}) || loadRun !== expectedLoad) return;
          }
          window.BibleVersePicker?.sync?.();
          select.value = value;
          select.dispatchEvent(new Event('change',{bubbles:true}));
          window.ReaderExperience?.recordLocation?.(number);
          title.focus({preventScroll:true});
          return;
        }
        draftChapter = number;
        draftVerse = 1;
        currentStep = 'verse';
        setStep('verse',{focusChoice:false});
        renderAll();
      }));
    });
  }

  function renderAll(){
    const l = labels();
    const bookName = bookSelect.options[draftBookIndex]?.textContent?.trim() || l.book;
    const chapterName = String(draftChapter);
    heading.textContent = l.title;
    closeButton.setAttribute('aria-label',l.close);
    backButton.setAttribute('aria-label',l.back);
    overlay.querySelector('[data-label="book"]').textContent = l.book;
    overlay.querySelector('[data-label="chapter"]').textContent = `${bookName} · ${l.chapter}`;
    overlay.querySelector('[data-label="verse"]').textContent = `${bookName} · ${chapterName} · ${l.verse}`;
    if (!hint.hidden) hint.textContent = l.hint;
    if (currentStep === 'book') { renderSwitch(); renderBooks(); }
    if (!draftStructure) {
      showLoading(chapters);
      showLoading(verses);
      setStep(currentStep,{focusChoice:false});
      return;
    }
    awaitingBookIndex = null;
    if (currentStep === 'chapter') renderNumberGrid(chapterSelect,chapters,'chapter');
    if (currentStep === 'verse') renderNumberGrid(verseSelect,verses,'verse');
    setStep(currentStep);
  }

  function open(){
    markHintSeen();
    activeTestament = Number(bookSelect.selectedIndex) > OT_END_INDEX ? 'new' : 'old';
    currentStep = 'book';
    awaitingBookIndex = null;
    ++structureRequest;
    draftBookIndex = Number(bookSelect.value);
    draftChapter = Number(chapterSelect.value)||1;
    draftVerse = Number(verseSelect.value)||1;
    draftStructure = getBookStructure(draftBookIndex);
    overlay.hidden = false;
    title.setAttribute('aria-expanded','true');
    document.body.classList.add('title-navigator-open');
    dialog.focus({preventScroll:true});
    renderAll();
  }

  function close({restoreFocus=true}={}){
    ++structureRequest;
    overlay.hidden = true;
    title.setAttribute('aria-expanded','false');
    document.body.classList.remove('title-navigator-open');
    if (restoreFocus) title.focus?.({preventScroll:true});
  }

  function goBack(){
    if (currentStep === 'verse') {
      currentStep = 'chapter';
      renderAll();
      return;
    }
    if (currentStep === 'chapter') {
      currentStep = 'book';
      activeTestament = draftBookIndex > OT_END_INDEX ? 'new' : 'old';
      renderAll();
    }
  }

  switchOld.addEventListener('click',()=>{activeTestament='old';renderSwitch();renderBooks();});
  switchNew.addEventListener('click',()=>{activeTestament='new';renderSwitch();renderBooks();});
  backButton.addEventListener('click',goBack);

  title.setAttribute('role','button');
  title.setAttribute('tabindex','0');
  title.setAttribute('aria-haspopup','dialog');
  title.setAttribute('aria-expanded','false');
  title.setAttribute('aria-controls','titleNavigatorDialog');
  title.classList.add('chapter-title-navigator-trigger');
  title.addEventListener('click',open);
  title.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open();}});
  closeButton.addEventListener('click',()=>close());
  overlay.addEventListener('click',e=>{if(e.target===overlay)close();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!overlay.hidden)close();});

  dialog.addEventListener('keydown',event=>{
    event.stopPropagation();
    if(event.key==='Escape'){event.preventDefault();close();return;}
    if(event.key!=='Tab')return;
    const targets=[...dialog.querySelectorAll('button')].filter(node=>!node.hidden&&node.getClientRects().length);
    const first=targets[0],last=targets.at(-1);
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
  });

  // Exam range controls share the reader's choice buttons, number grids and
  // testament tabs instead of invoking an unrelated Android native select UI.
  function enhanceSelect(select,{label,isBook=false,owner}={}){
    select.hidden=true;select.tabIndex=-1;
    const trigger=makeChoice('',false,openChoices);
    trigger.className='memory-choice-trigger';trigger.dataset.memorySelect=select.id;
    trigger.setAttribute('aria-haspopup','dialog');trigger.setAttribute('aria-expanded','false');
    select.after(trigger);
    let picker=null;
    function sync(){
      const next=select.selectedOptions[0]?.textContent||'…';
      if(trigger.textContent!==next)trigger.textContent=next;
      trigger.disabled=select.disabled;
      trigger.setAttribute('aria-label',`${label}: ${next}`);
    }
    function openChoices(){
      if(select.disabled||picker)return;
      picker=document.createElement('dialog');picker.id='memoryChoiceDialog';
      picker.className='title-navigator memory-choice-dialog';picker.dataset.select=select.id;
      picker.setAttribute('aria-labelledby','memoryChoiceHeading');
      const head=document.createElement('div');head.className='title-navigator-head';
      const name=document.createElement('strong');name.id='memoryChoiceHeading';name.textContent=label;
      const dismiss=document.createElement('button');dismiss.type='button';dismiss.className='title-navigator-close';
      dismiss.textContent='×';dismiss.setAttribute('aria-label',labels().close);dismiss.addEventListener('click',()=>picker.close());
      head.append(name,dismiss);
      const section=document.createElement('section');section.className='title-navigator-section';
      const grid=document.createElement('div');grid.className=`title-navigator-grid title-navigator-${isBook?'books':'verses'}`;
      let testament=Number(select.value)>OT_END_INDEX?'new':'old',tabs;
      function render(){
        grid.replaceChildren();
        if(tabs)[...tabs.children].forEach((tab,index)=>{const active=(index===0?'old':'new')===testament;tab.setAttribute('aria-selected',String(active));tab.classList.toggle('active',active);});
        selectOptions(select).forEach(option=>{
          if(isBook&&((Number(option.value)>OT_END_INDEX?'new':'old')!==testament))return;
          const choice=makeChoice(option.textContent,select.value===option.value,()=>{
            select.value=option.value;
            picker.close();
            select.dispatchEvent(new Event('change',{bubbles:true}));
            sync();
          });
          choice.dataset.value=option.value;grid.append(choice);
        });
      }
      if(isBook){
        tabs=document.createElement('div');tabs.className='title-navigator-testament-switch';tabs.setAttribute('role','tablist');
        for(const [key,text] of [['old',labels().old],['new',labels().new]]){
          const tab=document.createElement('button');tab.type='button';tab.textContent=text;tab.dataset.switch=key;tab.setAttribute('role','tab');
          tab.addEventListener('click',()=>{testament=key;render();});tabs.append(tab);
        }
        section.append(tabs);
      }
      section.append(grid);picker.append(head,section);document.body.append(picker);
      const current=picker;
      const ownerClosed=()=>{if(current.open)current.close();};
      owner?.addEventListener('close',ownerClosed,{once:true});
      current.addEventListener('close',()=>{
        owner?.removeEventListener('close',ownerClosed);current.remove();picker=null;
        trigger.setAttribute('aria-expanded','false');
        if(trigger.isConnected)trigger.focus({preventScroll:true});
      },{once:true});
      current.addEventListener('click',event=>{
        if(event.target!==current)return;
        const rect=current.getBoundingClientRect();
        if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)current.close();
      });
      render();current.showModal();trigger.setAttribute('aria-expanded','true');
      const selected=grid.querySelector('[aria-pressed="true"]')||grid.querySelector('button');
      selected?.focus({preventScroll:true});selected?.scrollIntoView({block:'nearest'});
    }
    select.addEventListener('change',sync);sync();
    return {trigger,sync};
  }
  window.BibleTitleNavigator={enhanceSelect};

  const observer = new MutationObserver(() => { if (!overlay.hidden) requestAnimationFrame(renderAll); });
  observer.observe(bookSelect,{childList:true,subtree:true,attributes:true});
  observer.observe(chapterSelect,{childList:true,subtree:true,attributes:true});
  observer.observe(verseSelect,{childList:true,subtree:true,attributes:true});
  window.addEventListener('pageshow',()=>{ if(!overlay.hidden) renderAll(); });
  setTimeout(maybeShowHint,700);
})();
