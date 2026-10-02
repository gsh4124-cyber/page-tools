(() => {
  const MARKS_KEY = 'bible-reader-verse-marks-v1';
  const CHAPTERS_KEY = 'bible-reader-chapter-bookmarks-v1';
  const RECORD_NOTES_KEY = 'bible-reader-record-notes-v1';
  const BACKUP_VERSION = 2;
  const readJson = key => { try { return JSON.parse(localStorage.getItem(key)) || {}; } catch (_) { return {}; } };
  const writeJson = (key, value) => localStorage.setItem(key, JSON.stringify(value));
  const notifyRecordsChanged = () => window.dispatchEvent(new CustomEvent('bible-reader-records-changed'));

  function recordNote(id){ return String(readJson(RECORD_NOTES_KEY)[id] || '').trim(); }
  function saveRecordNote(id, text){ const notes=readJson(RECORD_NOTES_KEY); const value=String(text||'').trim(); if(value) notes[id]=value; else delete notes[id]; writeJson(RECORD_NOTES_KEY,notes); }
  function removeRecordNote(id){ const notes=readJson(RECORD_NOTES_KEY); delete notes[id]; writeJson(RECORD_NOTES_KEY,notes); }
  function button(text, handler){ const b=document.createElement('button'); b.type='button'; b.textContent=text; b.addEventListener('click',handler); return b; }
  function currentTranslation(fallback='krv1961'){
    const select=document.querySelector('#translationSelect');
    const id=select?.value || (typeof activeTranslationId!=='undefined'?activeTranslationId:null) || fallback;
    return (typeof TRANSLATIONS!=='undefined' && TRANSLATIONS[id]) ? id : fallback;
  }
  function currentBookName(index){
    try{return window.BibleI18n?.bookName?.(index) || BOOKS[index]?.ko || '';}catch(_){return BOOKS[index]?.ko || '';}
  }

  async function goToVerse(item){
    const tr=currentTranslation(item.tr || 'krv1961');
    if(typeof TRANSLATIONS!=='undefined' && TRANSLATIONS[tr]){
      activeTranslationId=tr;
      const select=document.querySelector('#translationSelect'); if(select) select.value=tr;
      localStorage.setItem('bible-reader-translation',tr);
    }
    if(typeof state!=='undefined'){ state.bookIndex=item.bookIndex; state.chapter=item.chapter; }
    document.querySelector('.notebook-close')?.click();
    if(typeof loadCurrent==='function') await loadCurrent({scrollTop:false});
    requestAnimationFrame(()=>{
      const row=document.querySelector(`#verses [data-verse="${item.verse}"]`);
      if(!row) return;
      row.classList.add('searched'); row.scrollIntoView({behavior:'smooth',block:'center'});
      setTimeout(()=>row.classList.remove('searched'),1800);
    });
  }

  async function goToChapter(item){
    const tr=currentTranslation(item.translation || item.tr || 'krv1961');
    if(typeof TRANSLATIONS!=='undefined' && TRANSLATIONS[tr]){
      activeTranslationId=tr;
      const select=document.querySelector('#translationSelect'); if(select) select.value=tr;
      localStorage.setItem('bible-reader-translation',tr);
    }
    if(typeof state!=='undefined'){ state.bookIndex=Number(item.bookIndex)||0; state.chapter=Number(item.chapter)||1; }
    document.querySelector('.notebook-close')?.click();
    if(typeof loadCurrent==='function') await loadCurrent({scrollTop:true});
  }

  function openRecordNoteEditor({id,title,onSaved}){
    document.querySelector('.record-note-backdrop')?.remove();
    document.querySelector('.record-note-editor')?.remove();
    const backdrop=document.createElement('div'); backdrop.className='record-note-backdrop';
    const editor=document.createElement('div'); editor.className='verse-note-editor record-note-editor';
    const heading=document.createElement('strong'); heading.textContent=`메모 · ${title}`;
    const textarea=document.createElement('textarea'); textarea.value=recordNote(id); textarea.placeholder='메모를 입력하세요';
    const actions=document.createElement('div'); actions.className='verse-note-actions';
    const close=()=>{editor.remove();backdrop.remove();};
    actions.append(
      button('저장',()=>{saveRecordNote(id,textarea.value);close();onSaved?.();}),
      button('메모 삭제',()=>{saveRecordNote(id,'');close();onSaved?.();}),
      button('취소',close)
    );
    backdrop.addEventListener('pointerdown',event=>{ if(event.target===backdrop) close(); });
    editor.addEventListener('pointerdown',event=>event.stopPropagation());
    editor.append(heading,textarea,actions); backdrop.append(editor); document.body.append(backdrop); requestAnimationFrame(()=>textarea.focus());
  }

  function noteBlock(id){
    const note=recordNote(id); if(!note) return null;
    const p=document.createElement('p'); p.className='record-note-text'; p.textContent=note; return p;
  }

  async function fillVerseText(item,target){
    try{
      const tr=currentTranslation(item.tr || 'krv1961');
      const data=await fetchBook(BOOKS[item.bookIndex],tr);
      const chapter=data.chapters.find(c=>Number(c.chapter)===item.chapter);
      const verse=chapter?.verses.find(v=>Number(v.verse)===item.verse);
      target.textContent=verse?.text || '';
    }catch(_){target.textContent='본문을 불러오지 못했습니다.';}
  }

  function verseEntries(filter){
    return Object.entries(readJson(MARKS_KEY)).map(([key,mark])=>{
      const [tr,book,chapter,verse]=key.split(':');
      return {key,mark,tr,bookIndex:Number(book),chapter:Number(chapter),verse:Number(verse)};
    }).filter(filter).sort((a,b)=>a.bookIndex-b.bookIndex||a.chapter-b.chapter||a.verse-b.verse);
  }
  function savedEntries(){ return verseEntries(item=>item.mark?.bookmark); }
  function highlightEntries(){ return verseEntries(item=>item.mark?.highlight); }

  function deleteVerseRecord(item, mode, panel){
    const marks=readJson(MARKS_KEY);
    const mark=marks[item.key] || {};
    if(mode==='highlight') mark.highlight=false;
    else mark.bookmark=false;
    if(!mark.highlight && !mark.bookmark && !String(mark.note||'').trim()) delete marks[item.key];
    else marks[item.key]=mark;
    writeJson(MARKS_KEY,marks);
    removeRecordNote(`${mode==='highlight'?'highlight':'verse'}:${item.key}`);
    notifyRecordsChanged();
    renderVerseRecords(panel,mode);
  }

  function renderVerseRecords(panel, mode){
    const list=panel.querySelector('.notebook-list'); if(!list) return;
    const entries=mode==='highlight' ? highlightEntries() : savedEntries(); list.innerHTML='';
    const empty=mode==='highlight'?'하이라이트한 성구가 없습니다.':'저장한 성구가 없습니다.';
    if(!entries.length){list.innerHTML=`<p class="notebook-empty">${empty}</p>`;return;}
    entries.forEach(item=>{
      const id=`${mode==='highlight'?'highlight':'verse'}:${item.key}`;
      const card=document.createElement('article'); card.className=`notebook-item ${mode==='highlight'?'highlight-record-item':'saved-record-item'}`;
      const ref=document.createElement('strong'); ref.textContent=`${currentBookName(item.bookIndex)} ${item.chapter}:${item.verse}`;
      const body=document.createElement('p'); body.className='saved-verse-text'; body.textContent='본문을 불러오는 중…'; fillVerseText(item,body);
      const note=noteBlock(id);
      const actions=document.createElement('div'); actions.className='notebook-item-actions';
      actions.append(
        button('구절로 이동',()=>goToVerse(item)),
        button(recordNote(id)?'메모 수정':'메모 추가',()=>openRecordNoteEditor({id,title:ref.textContent,onSaved:()=>renderVerseRecords(panel,mode)})),
        button(mode==='highlight'?'하이라이트 삭제':'저장 삭제',()=>deleteVerseRecord(item,mode,panel))
      );
      card.append(ref,body); if(note) card.append(note); card.append(actions); list.append(card);
    });
  }

  function renderSaved(panel){ renderVerseRecords(panel,'saved'); }
  function renderHighlights(panel){ renderVerseRecords(panel,'highlight'); }

  function chapterEntries(){
    return Object.entries(readJson(CHAPTERS_KEY)).map(([key,item])=>({key,...item})).sort((a,b)=>(a.bookIndex-b.bookIndex)||(a.chapter-b.chapter));
  }

  function deleteChapterRecord(item,panel){
    const chapters=readJson(CHAPTERS_KEY); delete chapters[item.key]; writeJson(CHAPTERS_KEY,chapters);
    removeRecordNote(`chapter:${item.key}`);
    notifyRecordsChanged();
    renderChapters(panel);
  }

  function renderChapters(panel){
    const list=panel.querySelector('.notebook-list'); if(!list) return;
    const items=chapterEntries(); list.innerHTML='';
    if(!items.length){list.innerHTML='<p class="notebook-empty">저장한 장이 없습니다.</p>';return;}
    items.forEach(item=>{
      const id=`chapter:${item.key}`;
      const card=document.createElement('article'); card.className='notebook-item chapter-record-item';
      const title=document.createElement('strong'); title.textContent=`${currentBookName(Number(item.bookIndex)||0)} ${Number(item.chapter)||1}`;
      const note=noteBlock(id);
      const actions=document.createElement('div'); actions.className='notebook-item-actions';
      actions.append(
        button('장으로 이동',()=>goToChapter(item)),
        button(recordNote(id)?'메모 수정':'메모 추가',()=>openRecordNoteEditor({id,title:title.textContent,onSaved:()=>renderChapters(panel)})),
        button('저장 삭제',()=>deleteChapterRecord(item,panel))
      );
      card.append(title); if(note) card.append(note); card.append(actions); list.append(card);
    });
  }

  function rerenderOpenPanel(){
    const panel=document.querySelector('.notebook-panel'); if(!panel)return;
    const active=panel.querySelector('.notebook-tabs button.active:not([hidden])')?.dataset.tab;
    if(active==='saved')renderSaved(panel); else if(active==='chapters')renderChapters(panel); else renderHighlights(panel);
  }

  function exportData(){
    const payload={app:'bible-reader',version:BACKUP_VERSION,exportedAt:new Date().toISOString(),verseMarks:readJson(MARKS_KEY),chapterBookmarks:readJson(CHAPTERS_KEY),recordNotes:readJson(RECORD_NOTES_KEY)};
    const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}); const url=URL.createObjectURL(blob);
    const a=document.createElement('a'); a.href=url; a.download=`bible-reader-backup-${new Date().toISOString().slice(0,10)}.json`;
    document.body.append(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  }

  function importData(file){
    const reader=new FileReader();
    reader.onload=()=>{
      try{
        const data=JSON.parse(reader.result);
        if(data?.app!=='bible-reader'||typeof data.verseMarks!=='object'||typeof data.chapterBookmarks!=='object') throw new Error('invalid');
        if(!confirm('현재 기록을 백업 파일의 기록으로 바꿀까요?')) return;
        writeJson(MARKS_KEY,data.verseMarks||{}); writeJson(CHAPTERS_KEY,data.chapterBookmarks||{}); writeJson(RECORD_NOTES_KEY,data.recordNotes||{}); location.reload();
      }catch(_){alert('올바른 성경 읽기 백업 파일이 아닙니다.');}
    };
    reader.readAsText(file);
  }

  function removeStandaloneMemoAction(){
    document.querySelectorAll('.verse-action-popover button').forEach(b=>{
      const text=b.textContent.trim();
      if(['메모','Note','Notiz','笔记','Заметка','Commentarium'].includes(text)) b.remove();
    });
  }

  function ensureNotebookBackdrop(panel){
    let backdrop=document.querySelector('.notebook-backdrop');
    if(!backdrop){
      backdrop=document.createElement('div'); backdrop.className='notebook-backdrop';
      backdrop.addEventListener('pointerdown',event=>{
        if(event.target!==backdrop) return;
        panel.querySelector('.notebook-close')?.click();
        backdrop.remove();
      });
      document.body.append(backdrop);
    }
    panel.addEventListener('pointerdown',event=>event.stopPropagation());
    const close=panel.querySelector('.notebook-close');
    if(close&&!close.dataset.backdropCleanup){
      close.dataset.backdropCleanup='true';
      close.addEventListener('click',()=>document.querySelector('.notebook-backdrop')?.remove());
    }
  }

  function enhance(panel){
    if(!panel||panel.dataset.recordsEnhanced) return;
    panel.dataset.recordsEnhanced='true';
    ensureNotebookBackdrop(panel);
    const tabs=panel.querySelector('.notebook-tabs'); if(!tabs) return;
    const notesTab=tabs.querySelector('[data-tab="notes"]'); if(notesTab) notesTab.hidden=true;
    const savedTab=tabs.querySelector('[data-tab="saved"]');
    const highlightTab=tabs.querySelector('[data-tab="highlights"]');
    const chapterTab=document.createElement('button'); chapterTab.type='button'; chapterTab.dataset.tab='chapters'; chapterTab.textContent='저장한 장'; chapterTab.setAttribute('role','tab');
    if(highlightTab) tabs.append(highlightTab);
    if(savedTab) tabs.append(savedTab);
    tabs.append(chapterTab);

    function select(tab){
      tabs.querySelectorAll('button:not([hidden])').forEach(b=>{const active=b===tab;b.classList.toggle('active',active);b.setAttribute('aria-selected',String(active));});
      if(notesTab){notesTab.classList.remove('active');notesTab.setAttribute('aria-selected','false');}
    }
    highlightTab?.addEventListener('click',()=>setTimeout(()=>{select(highlightTab);renderHighlights(panel);},0));
    savedTab?.addEventListener('click',()=>setTimeout(()=>{select(savedTab);renderSaved(panel);},0));
    chapterTab.addEventListener('click',()=>{select(chapterTab);renderChapters(panel);});

    const tools=document.createElement('div'); tools.className='notebook-data-tools';
    const out=button('기록 백업',exportData);
    const input=document.createElement('input'); input.type='file'; input.accept='application/json,.json'; input.hidden=true;
    input.addEventListener('change',()=>{if(input.files?.[0]) importData(input.files[0]);input.value='';});
    const into=button('백업 복원',()=>input.click()); tools.append(out,into,input); tabs.insertAdjacentElement('afterend',tools);

    setTimeout(()=>highlightTab?.click(),0);
  }

  const observer=new MutationObserver(()=>{enhance(document.querySelector('.notebook-panel'));removeStandaloneMemoAction();});
  observer.observe(document.body,{childList:true,subtree:true}); enhance(document.querySelector('.notebook-panel')); removeStandaloneMemoAction();
  document.querySelector('#translationSelect')?.addEventListener('change',()=>setTimeout(rerenderOpenPanel,0));
})();