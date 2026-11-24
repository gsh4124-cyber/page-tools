(() => {
  const MARKS_KEY = 'bible-reader-verse-marks-v1';
  const CHAPTERS_KEY = 'bible-reader-chapter-bookmarks-v1';
  const RECORD_NOTES_KEY = 'bible-reader-record-notes-v1';
  const BACKUP_VERSION = 3;
  const COLLECTION_KEY = 'bible-reader-memory-passages-v1';
  const readJson = key => { try { return JSON.parse(window.BibleStorage.getItem(key)) || {}; } catch (_) { return {}; } };
  const writeJson = (key, value) => window.BibleStorage.setItem(key, JSON.stringify(value));
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
      window.BibleStorage.setItem('bible-reader-translation',tr);
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
      window.BibleStorage.setItem('bible-reader-translation',tr);
    }
    if(typeof state!=='undefined'){ state.bookIndex=Number(item.bookIndex)||0; state.chapter=Number(item.chapter)||1; }
    document.querySelector('.notebook-close')?.click();
    if(typeof loadCurrent==='function') await loadCurrent({scrollTop:true});
  }

  function modalKeys(container,event,close){
    if(event.key==='Escape'){event.preventDefault();event.stopPropagation();close();return;}
    if(event.key!=='Tab')return;
    const controls=[...container.querySelectorAll('button:not(:disabled),textarea,input:not(:disabled),select:not(:disabled),[tabindex="0"]')].filter(n=>n.getClientRects().length);
    const first=controls[0],last=controls.at(-1);
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
  }

  function openRecordNoteEditor({id,title,onSaved}){
    const opener=document.activeElement;
    document.querySelector('.record-note-backdrop')?.remove();
    document.querySelector('.record-note-editor')?.remove();
    const backdrop=document.createElement('div'); backdrop.className='record-note-backdrop';
    const editor=document.createElement('div'); editor.className='verse-note-editor record-note-editor';editor.setAttribute('role','dialog');editor.setAttribute('aria-modal','true');editor.setAttribute('aria-labelledby','record-note-title');
    const heading=document.createElement('strong'); heading.textContent=`메모 · ${title}`;
    heading.id='record-note-title';
    const textarea=document.createElement('textarea'); textarea.value=recordNote(id); textarea.placeholder='메모를 입력하세요';textarea.setAttribute('aria-label',heading.textContent);
    const actions=document.createElement('div'); actions.className='verse-note-actions';
    const close=(refresh=false)=>{editor.remove();backdrop.remove();if(refresh)onSaved?.();const target=opener?.isConnected?opener:document.querySelector('.notebook-tabs button.active:not([hidden])');target?.focus({preventScroll:true});};
    actions.append(
      button('저장',()=>{saveRecordNote(id,textarea.value);close(true);}),
      button('메모 삭제',()=>{saveRecordNote(id,'');close(true);}),
      button('취소',()=>close())
    );
    backdrop.addEventListener('pointerdown',event=>{ if(event.target===backdrop) close(); });
    editor.addEventListener('pointerdown',event=>event.stopPropagation());
    backdrop.addEventListener('keydown',event=>modalKeys(editor,event,()=>close()));
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

  const BACKUP_COPY={
    ko:['백업 복원 미리보기','강조·저장 구절','저장한 장','기록 메모','암기용 성구 모음','기존 기록과 합치기','중복된 기록은 현재 내용을 유지합니다.','백업 내용으로 바꾸기','현재 기록을 바꿉니다. 예전 백업에 없는 성구 모음은 유지합니다.','복원하기','취소','백업을 복원했습니다.','이 백업에는 성구 모음이 없습니다. 현재 모음은 유지합니다.'],
    en:['Restore backup preview','Highlighted / saved verses','Saved chapters','Record notes','Memory verse collection','Merge with current records','Current records win when an item exists in both.','Replace with backup','Replaces records. Collections absent from older backups are kept.','Restore','Cancel','Backup restored.','This backup has no verse collection. Your collection will be kept.'],
    fr:['Aperçu de restauration','Versets marqués / enregistrés','Chapitres enregistrés','Notes','Versets à mémoriser','Fusionner avec les notes actuelles','Les éléments actuels sont conservés en cas de doublon.','Remplacer par la sauvegarde','Remplace les notes. Les collections absentes des anciennes sauvegardes sont conservées.','Restaurer','Annuler','Sauvegarde restaurée.','Cette sauvegarde ne contient pas de collection. La vôtre sera conservée.'],
    de:['Wiederherstellung prüfen','Markierte / gespeicherte Verse','Gespeicherte Kapitel','Notizen','Lernverssammlung','Mit aktuellen Einträgen verbinden','Bei Duplikaten bleiben aktuelle Einträge erhalten.','Durch Sicherung ersetzen','Ersetzt Einträge. In alten Sicherungen fehlende Sammlungen bleiben erhalten.','Wiederherstellen','Abbrechen','Sicherung wiederhergestellt.','Diese Sicherung enthält keine Sammlung. Ihre Sammlung bleibt erhalten.'],
    zh:['备份恢复预览','标记／保存的经文','保存的章节','笔记','背诵经文集','与现有记录合并','重复项目保留当前内容。','替换为备份内容','替换记录。旧备份不含经文集时保留当前经文集。','恢复','取消','备份已恢复。','此备份不含经文集，将保留当前经文集。'],
    ru:['Предпросмотр восстановления','Отмеченные / сохранённые стихи','Сохранённые главы','Заметки','Стихи для запоминания','Объединить с текущими записями','При совпадении сохраняются текущие записи.','Заменить резервной копией','Заменяет записи. Коллекции, отсутствующие в старой копии, сохраняются.','Восстановить','Отмена','Копия восстановлена.','В копии нет коллекции стихов. Текущая коллекция сохранится.'],
    la:['Restitutionem inspice','Versus notati / servati','Capita servata','Commentaria','Versus memoriae','Cum scriptis praesentibus coniunge','In duplicatis scripta praesentia servantur.','Ex exemplo restitue','Scripta mutantur. Collectiones in antiquis exemplis absentes servantur.','Restitue','Claude','Exemplum restitutum est.','Collectio versuum abest. Collectio praesens servatur.'],
    pt:['Prévia da restauração','Versículos marcados / salvos','Capítulos salvos','Notas','Versículos para memorizar','Mesclar com registros atuais','Em duplicatas, o conteúdo atual é mantido.','Substituir pelo backup','Substitui registros. Coleções ausentes em backups antigos são mantidas.','Restaurar','Cancelar','Backup restaurado.','Este backup não contém coleção. A coleção atual será mantida.'],
    ar:['معاينة الاستعادة','آيات مميزة / محفوظة','أصحاحات محفوظة','ملاحظات','آيات للحفظ','دمج مع السجلات الحالية','تُحفظ السجلات الحالية عند التكرار.','استبدال بالنسخة الاحتياطية','يستبدل السجلات ويحفظ المجموعات الغائبة عن النسخ القديمة.','استعادة','إلغاء','تمت استعادة النسخة.','لا تحتوي النسخة على مجموعة آيات. ستُحفظ المجموعة الحالية.']
  };
  const backupCopy=()=>BACKUP_COPY[(window.BibleI18n?.lang?.()||'ko').split('-')[0]]||BACKUP_COPY.en;
  function backupSnapshot(){return {app:'bible-reader',version:BACKUP_VERSION,exportedAt:new Date().toISOString(),verseMarks:readJson(MARKS_KEY),chapterBookmarks:readJson(CHAPTERS_KEY),recordNotes:readJson(RECORD_NOTES_KEY),memoryPassages:(()=>{try{return JSON.parse(window.BibleStorage.getItem(COLLECTION_KEY)||'[]');}catch{return [];}})()};}
  function exportData(){
    const payload=backupSnapshot();
    const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}); const url=URL.createObjectURL(blob);
    const a=document.createElement('a'); a.href=url; a.download=`bible-reader-backup-${new Date().toISOString().slice(0,10)}.json`;
    document.body.append(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  }
  function previewBackup(data){
    document.querySelector('.backup-preview')?.remove();
    const l=backupCopy(),opener=document.activeElement,dialog=document.createElement('dialog');dialog.className='backup-preview';dialog.setAttribute('aria-labelledby','backupPreviewTitle');
    const heading=document.createElement('h2');heading.id='backupPreviewTitle';heading.textContent=l[0];dialog.append(heading);
    const counts=document.createElement('dl');counts.className='backup-counts';
    ['verseMarks','chapterBookmarks','recordNotes','memoryPassages'].forEach((key,i)=>{const row=document.createElement('div'),term=document.createElement('dt'),count=document.createElement('dd');term.textContent=l[i+1];count.textContent=key==='memoryPassages'?String(data[key]?.length||0):String(Object.keys(data[key]).length);row.append(term,count);counts.append(row);});dialog.append(counts);
    if(data.memoryPassages===undefined){const note=document.createElement('p');note.textContent=l[12];dialog.append(note);}
    for(const [value,title,description] of [['merge',l[5],l[6]],['replace',l[7],l[8]]]){const label=document.createElement('label'),radio=document.createElement('input'),text=document.createElement('span'),hint=document.createElement('small');radio.type='radio';radio.name='backupRestoreMode';radio.value=value;radio.checked=value==='merge';text.textContent=title;hint.textContent=description;text.append(hint);label.append(radio,text);dialog.append(label);}
    const close=()=>{dialog.close();dialog.remove();if(opener?.isConnected)opener.focus({preventScroll:true});};
    const actions=document.createElement('div');actions.className='backup-preview-actions';
    actions.append(button(l[10],close),button(l[9],()=>{try{const mode=dialog.querySelector('input:checked').value,result=window.BibleRecordBackup.combine(backupSnapshot(),data,mode);writeJson(MARKS_KEY,result.verseMarks);writeJson(CHAPTERS_KEY,result.chapterBookmarks);writeJson(RECORD_NOTES_KEY,result.recordNotes);writeJson(COLLECTION_KEY,result.memoryPassages);notifyRecordsChanged();rerenderOpenPanel();close();const notice=document.querySelector('.notebook-backup-status');if(notice)notice.textContent=l[11];}catch{alert('올바른 성경 읽기 백업 파일이 아닙니다.');}}));dialog.append(actions);
    dialog.addEventListener('cancel',event=>{event.preventDefault();close();});document.body.append(dialog);dialog.showModal();actions.firstElementChild.focus();
  }
  function importData(file){
    if(file.size>20*1024*1024){alert('올바른 성경 읽기 백업 파일이 아닙니다.');return;}
    const reader=new FileReader();reader.onload=()=>{try{previewBackup(window.BibleRecordBackup.normalize(JSON.parse(reader.result)));}catch{alert('올바른 성경 읽기 백업 파일이 아닙니다.');}};reader.onerror=()=>alert('올바른 성경 읽기 백업 파일이 아닙니다.');reader.readAsText(file);
  }

  function removeStandaloneMemoAction(){
    document.querySelectorAll('.verse-action-popover button').forEach(b=>{
      const text=b.textContent.trim();
      if(['메모','Note','Notiz','笔记','Заметка','Commentarium'].includes(text)) b.remove();
    });
  }

  function ensureNotebookBackdrop(panel){
    const opener=document.activeElement;
    const overlay=()=>!window.matchMedia('(min-width:1000px)').matches;
    const syncMode=()=>panel.setAttribute('aria-modal',String(overlay()));
    panel.setAttribute('role','dialog');syncMode();window.addEventListener('resize',syncMode);
    panel.addEventListener('keydown',event=>{if(event.key==='Escape'||overlay())modalKeys(panel,event,()=>panel.querySelector('.notebook-close')?.click());});
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
      panel.addEventListener('bible-reader-notebook-close',()=>{window.removeEventListener('resize',syncMode);document.querySelector('.notebook-backdrop')?.remove();if(opener?.isConnected)opener.focus({preventScroll:true});},{once:true});
    }
    close?.focus({preventScroll:true});
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
    const into=button('백업 복원',()=>input.click()); const status=document.createElement('p');status.className='notebook-backup-status';status.setAttribute('role','status');tools.append(out,into,input,status); tabs.insertAdjacentElement('afterend',tools);

    setTimeout(()=>highlightTab?.click(),0);
  }

  const observer=new MutationObserver(()=>{enhance(document.querySelector('.notebook-panel'));removeStandaloneMemoAction();});
  observer.observe(document.body,{childList:true,subtree:true}); enhance(document.querySelector('.notebook-panel')); removeStandaloneMemoAction();
  document.querySelector('#translationSelect')?.addEventListener('change',()=>setTimeout(rerenderOpenPanel,0));
})();
