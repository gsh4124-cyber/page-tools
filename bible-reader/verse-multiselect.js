(() => {
  const versesRoot = document.querySelector('#verses');
  if (!versesRoot || typeof state === 'undefined') return;

  const STORE_KEY = 'bible-reader-verse-marks-v1';
  const LABELS = {
    ko:{selected:'절 선택',copy:'복사',note:'메모',highlight:'하이라이트',removeHighlight:'강조 해제',done:'완료',noteTitle:'선택 구절 메모',save:'저장',delete:'메모 삭제',cancel:'취소',selectionNotes:'선택 메모',empty:'선택 구절에 저장한 메모가 없습니다.',go:'구절로 이동'},
    en:{selected:'verses selected',copy:'Copy',note:'Note',highlight:'Highlight',removeHighlight:'Remove highlight',done:'Done',noteTitle:'Selection note',save:'Save',delete:'Delete note',cancel:'Cancel',selectionNotes:'Selection notes',empty:'No notes saved for verse selections.',go:'Go to verses'},
    fr:{selected:'versets sélectionnés',copy:'Copier',note:'Note',highlight:'Surligner',removeHighlight:'Retirer',done:'Terminé',noteTitle:'Note de sélection',save:'Enregistrer',delete:'Supprimer',cancel:'Annuler',selectionNotes:'Notes de sélection',empty:'Aucune note de sélection.',go:'Aller aux versets'},
    de:{selected:'Verse ausgewählt',copy:'Kopieren',note:'Notiz',highlight:'Markieren',removeHighlight:'Markierung entfernen',done:'Fertig',noteTitle:'Auswahlnotiz',save:'Speichern',delete:'Notiz löschen',cancel:'Abbrechen',selectionNotes:'Auswahlnotizen',empty:'Keine Auswahlnotizen.',go:'Zu den Versen'},
    zh:{selected:'节已选择',copy:'复制',note:'笔记',highlight:'高亮',removeHighlight:'取消高亮',done:'完成',noteTitle:'选中经文笔记',save:'保存',delete:'删除笔记',cancel:'取消',selectionNotes:'选中经文笔记',empty:'暂无选中经文笔记。',go:'前往经文'},
    ru:{selected:'стихов выбрано',copy:'Копировать',note:'Заметка',highlight:'Выделить',removeHighlight:'Убрать выделение',done:'Готово',noteTitle:'Заметка к выбору',save:'Сохранить',delete:'Удалить',cancel:'Отмена',selectionNotes:'Заметки к выбору',empty:'Нет заметок к выбранным стихам.',go:'К стихам'},
    la:{selected:'versus selecti',copy:'Copia',note:'Commentarium',highlight:'Nota',removeHighlight:'Notam remove',done:'Factum',noteTitle:'Commentarium selectorum',save:'Serva',delete:'Remove',cancel:'Claude',selectionNotes:'Commentaria selectorum',empty:'Nulla commentaria selectorum.',go:'Ad versus'},
    pt:{selected:'versículos selecionados',copy:'Copiar',note:'Nota',highlight:'Destacar',removeHighlight:'Remover destaque',done:'Concluir',noteTitle:'Nota da seleção',save:'Salvar',delete:'Excluir nota',cancel:'Cancelar',selectionNotes:'Notas de seleção',empty:'Nenhuma nota de seleção.',go:'Ir aos versículos'},
    ar:{selected:'آيات محددة',copy:'نسخ',note:'ملاحظة',highlight:'تمييز',removeHighlight:'إزالة التمييز',done:'تم',noteTitle:'ملاحظة على التحديد',save:'حفظ',delete:'حذف الملاحظة',cancel:'إلغاء',selectionNotes:'ملاحظات التحديد',empty:'لا توجد ملاحظات للتحديد.',go:'الانتقال إلى الآيات'}
  };

  let selected = new Set();
  let actionBar = null;
  let noteBackdrop = null;

  const lang = () => String(window.BibleI18n?.lang?.() || document.documentElement.lang || 'ko').toLowerCase().split('-')[0];
  const labels = () => LABELS[lang()] || LABELS.en;
  const translation = () => document.querySelector('#translationSelect')?.value || 'krv1961';
  const currentBookIndex = () => Number(state.bookIndex) || 0;
  const currentChapter = () => Number(state.chapter) || 1;
  const currentBookName = (index = currentBookIndex()) => {
    try { return window.BibleI18n?.bookName?.(index) || BOOKS[index]?.ko || ''; }
    catch (_) { return BOOKS[index]?.ko || ''; }
  };
  const readMarks = () => { try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; } catch (_) { return {}; } };
  const writeMarks = marks => {
    localStorage.setItem(STORE_KEY, JSON.stringify(marks));
    window.dispatchEvent(new CustomEvent('bible-reader-records-changed'));
  };
  const rowText = row => row?.querySelector('.verse-text')?.textContent?.trim() || '';
  const currentKey = verse => `${translation()}:${currentBookIndex()}:${currentChapter()}:${verse}`;
  const chapterMetaKey = (tr = translation(), book = currentBookIndex(), chapter = currentChapter()) => `${tr}:${book}:${chapter}:0`;

  function selectedRows() {
    return [...selected]
      .map(verse => versesRoot.querySelector(`.verse[data-verse="${CSS.escape(String(verse))}"]`))
      .filter(Boolean)
      .sort((a,b)=>Number(a.dataset.verse)-Number(b.dataset.verse));
  }

  function selectedNumbers() { return selectedRows().map(row => Number(row.dataset.verse)).filter(Boolean); }

  function selectedReference(rows = selectedRows()) {
    const numbers = rows.map(row => Number(row.dataset.verse)).filter(Boolean);
    return window.BibleClipboard?.referenceForVerseNumbers?.(numbers) || `${currentBookName()} ${currentChapter()}:${numbers.join(',')}`;
  }

  function setSelected(row, on) {
    const verse = Number(row?.dataset.verse);
    if (!verse) return;
    if (on) selected.add(verse); else selected.delete(verse);
    row.classList.toggle('multi-selected', on);
    row.setAttribute('aria-selected', String(on));
    updateActionBar();
  }

  function clearSelection() {
    versesRoot.querySelectorAll('.verse.multi-selected').forEach(row => {
      row.classList.remove('multi-selected');
      row.setAttribute('aria-selected','false');
    });
    selected.clear();
    updateActionBar();
  }

  function actionButton(className, text, handler) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = className;
    button.textContent = text;
    button.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      handler();
    });
    return button;
  }

  function ensureActionBar() {
    if (actionBar) return actionBar;
    const bar = document.createElement('div');
    bar.className = 'verse-multi-actionbar';
    bar.hidden = true;
    bar.setAttribute('role','toolbar');
    bar.setAttribute('aria-label','Selected verse actions');
    const count = document.createElement('strong'); count.className = 'verse-multi-count';
    const actions = document.createElement('div'); actions.className = 'verse-multi-actions';
    actions.append(
      actionButton('verse-multi-copy','',copySelection),
      actionButton('verse-multi-note','',()=>openSelectionNoteEditor()),
      actionButton('verse-multi-highlight','',toggleHighlightSelection),
      actionButton('verse-multi-done','',clearSelection)
    );
    bar.append(count,actions);
    document.body.append(bar);
    actionBar = bar;
    return bar;
  }

  function allSelectedHighlighted() {
    const marks = readMarks();
    const numbers = selectedNumbers();
    return numbers.length > 0 && numbers.every(verse => !!marks[currentKey(verse)]?.highlight);
  }

  function updateActionBar() {
    const bar = ensureActionBar();
    const count = selected.size;
    bar.hidden = count === 0;
    document.body.classList.toggle('verse-multi-selecting', count > 0);
    if (!count) return;
    const l = labels();
    bar.querySelector('.verse-multi-count').textContent = `${count} ${l.selected}`;
    bar.querySelector('.verse-multi-copy').textContent = l.copy;
    bar.querySelector('.verse-multi-note').textContent = l.note;
    bar.querySelector('.verse-multi-highlight').textContent = allSelectedHighlighted() ? l.removeHighlight : l.highlight;
    bar.querySelector('.verse-multi-done').textContent = l.done;
  }

  async function copySelection() {
    const rows = selectedRows();
    if (!rows.length) return;
    const text = window.BibleClipboard?.buildCopyTextForElements?.(rows) || rows.map(row => `${row.dataset.verse} ${rowText(row)}`).join('\n');
    const ok = await (window.BibleClipboard?.copyText?.(text) ?? Promise.resolve(false));
    if (ok && actionBar) {
      actionBar.classList.add('copied');
      setTimeout(()=>actionBar?.classList.remove('copied'),700);
    }
  }

  function toggleHighlightSelection() {
    const rows = selectedRows();
    if (!rows.length) return;
    const marks = readMarks();
    const remove = rows.every(row => !!marks[currentKey(Number(row.dataset.verse))]?.highlight);
    rows.forEach(row => {
      const verse = Number(row.dataset.verse);
      const key = currentKey(verse);
      const mark = marks[key] || {highlight:false,bookmark:false,note:''};
      mark.highlight = !remove;
      if (mark.highlight) mark.savedText = rowText(row) || mark.savedText || '';
      if (!mark.highlight && !mark.bookmark && !String(mark.note || '').trim() && !Array.isArray(mark.selectionNotes)) delete marks[key];
      else marks[key] = mark;
      row.classList.toggle('user-highlight', !remove);
    });
    writeMarks(marks);
    updateActionBar();
  }

  function selectionSignature(verses) { return [...verses].map(Number).filter(Boolean).sort((a,b)=>a-b).join(','); }

  function findSelectionNote(marks, tr, book, chapter, verses) {
    const meta = marks[chapterMetaKey(tr,book,chapter)];
    const signature = selectionSignature(verses);
    const notes = Array.isArray(meta?.selectionNotes) ? meta.selectionNotes : [];
    return notes.find(note => selectionSignature(note.verses || []) === signature) || null;
  }

  function saveSelectionNote({tr,book,chapter,verses,reference,note,savedText}) {
    const marks = readMarks();
    const key = chapterMetaKey(tr,book,chapter);
    const meta = marks[key] || {highlight:false,bookmark:false,note:''};
    const notes = Array.isArray(meta.selectionNotes) ? [...meta.selectionNotes] : [];
    const signature = selectionSignature(verses);
    const index = notes.findIndex(item => selectionSignature(item.verses || []) === signature);
    const record = {verses:[...verses],reference,note:String(note||'').trim(),savedText:String(savedText||''),updatedAt:Date.now()};
    if (record.note) {
      if (index >= 0) notes[index] = record; else notes.push(record);
    } else if (index >= 0) notes.splice(index,1);
    meta.selectionNotes = notes;
    if (!notes.length && !meta.highlight && !meta.bookmark && !String(meta.note||'').trim()) delete marks[key];
    else marks[key] = meta;
    writeMarks(marks);
    rerenderSelectionNotebook();
  }

  function closeNoteEditor() {
    noteBackdrop?.remove();
    noteBackdrop = null;
  }

  function openNoteEditorForRecord({tr,book,chapter,verses,reference,savedText,currentNote,onSaved}) {
    closeNoteEditor();
    const l = labels();
    const backdrop = document.createElement('div'); backdrop.className = 'selection-note-backdrop';
    const editor = document.createElement('section'); editor.className = 'selection-note-editor'; editor.setAttribute('role','dialog'); editor.setAttribute('aria-modal','true');
    const title = document.createElement('strong'); title.textContent = `${l.noteTitle} · ${reference}`;
    const preview = document.createElement('p'); preview.className = 'selection-note-preview'; preview.textContent = savedText;
    const textarea = document.createElement('textarea'); textarea.value = currentNote || ''; textarea.placeholder = l.note;
    const actions = document.createElement('div'); actions.className = 'selection-note-actions';
    actions.append(
      actionButton('selection-note-save',l.save,()=>{saveSelectionNote({tr,book,chapter,verses,reference,note:textarea.value,savedText});closeNoteEditor();onSaved?.();}),
      actionButton('selection-note-delete',l.delete,()=>{saveSelectionNote({tr,book,chapter,verses,reference,note:'',savedText});closeNoteEditor();onSaved?.();}),
      actionButton('selection-note-cancel',l.cancel,closeNoteEditor)
    );
    editor.append(title,preview,textarea,actions);
    backdrop.append(editor);
    backdrop.addEventListener('pointerdown',event=>{if(event.target===backdrop)closeNoteEditor();});
    editor.addEventListener('pointerdown',event=>event.stopPropagation());
    document.body.append(backdrop);
    noteBackdrop = backdrop;
    requestAnimationFrame(()=>textarea.focus());
  }

  function openSelectionNoteEditor() {
    const rows = selectedRows();
    if (!rows.length) return;
    const verses = rows.map(row=>Number(row.dataset.verse));
    const tr = translation(), book = currentBookIndex(), chapter = currentChapter();
    const marks = readMarks();
    const existing = findSelectionNote(marks,tr,book,chapter,verses);
    const reference = selectedReference(rows);
    const savedText = rows.map(row=>`${row.dataset.verse} ${rowText(row)}`).join('\n');
    openNoteEditorForRecord({tr,book,chapter,verses,reference,savedText,currentNote:existing?.note||''});
  }

  function selectionNoteEntries() {
    const marks = readMarks();
    const entries = [];
    Object.entries(marks).forEach(([key,mark]) => {
      if (!Array.isArray(mark?.selectionNotes) || !mark.selectionNotes.length) return;
      const [tr,book,chapter,verse] = key.split(':');
      if (Number(verse) !== 0) return;
      mark.selectionNotes.forEach(note => {
        if (!String(note?.note || '').trim()) return;
        entries.push({key,tr,bookIndex:Number(book),chapter:Number(chapter),verses:(note.verses||[]).map(Number).filter(Boolean),reference:note.reference||'',note:note.note,savedText:note.savedText||'',updatedAt:Number(note.updatedAt)||0});
      });
    });
    return entries.sort((a,b)=>a.bookIndex-b.bookIndex||a.chapter-b.chapter||(a.verses[0]||0)-(b.verses[0]||0));
  }

  async function goToSelection(entry) {
    if (typeof TRANSLATIONS !== 'undefined' && TRANSLATIONS[entry.tr]) {
      activeTranslationId = entry.tr;
      const select = document.querySelector('#translationSelect'); if (select) select.value = entry.tr;
      localStorage.setItem('bible-reader-translation',entry.tr);
    }
    state.bookIndex = entry.bookIndex;
    state.chapter = entry.chapter;
    document.querySelector('.notebook-close')?.click();
    document.querySelector('.notebook-backdrop')?.remove();
    if (typeof loadCurrent === 'function') await loadCurrent({scrollTop:false});
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      clearSelection();
      entry.verses.forEach(verse=>{
        const row=versesRoot.querySelector(`.verse[data-verse="${CSS.escape(String(verse))}"]`);
        if(row)setSelected(row,true);
      });
      selectedRows()[0]?.scrollIntoView({behavior:'smooth',block:'center'});
    }));
  }

  function deleteSelectionEntry(entry) {
    saveSelectionNote({tr:entry.tr,book:entry.bookIndex,chapter:entry.chapter,verses:entry.verses,reference:entry.reference,note:'',savedText:entry.savedText});
  }

  function renderSelectionNotebook(panel) {
    const list = panel?.querySelector('.notebook-list');
    if (!list) return;
    const l = labels();
    list.innerHTML = '';
    const entries = selectionNoteEntries();
    if (!entries.length) {
      const empty = document.createElement('p'); empty.className = 'notebook-empty'; empty.textContent = l.empty; list.append(empty); return;
    }
    entries.forEach(entry => {
      const card = document.createElement('article'); card.className = 'notebook-item selection-note-item';
      const ref = document.createElement('strong'); ref.textContent = entry.reference || `${currentBookName(entry.bookIndex)} ${entry.chapter}:${entry.verses.join(',')}`;
      const scripture = document.createElement('p'); scripture.className = 'saved-verse-text selection-note-scripture'; scripture.textContent = entry.savedText;
      const note = document.createElement('p'); note.className = 'record-note-text'; note.textContent = entry.note;
      const actions = document.createElement('div'); actions.className = 'notebook-item-actions';
      actions.append(
        actionButton('selection-note-go',l.go,()=>goToSelection(entry)),
        actionButton('selection-note-edit',l.note,()=>openNoteEditorForRecord({tr:entry.tr,book:entry.bookIndex,chapter:entry.chapter,verses:entry.verses,reference:ref.textContent,savedText:entry.savedText,currentNote:entry.note,onSaved:()=>renderSelectionNotebook(panel)})),
        actionButton('selection-note-remove',l.delete,()=>{deleteSelectionEntry(entry);renderSelectionNotebook(panel);})
      );
      card.append(ref,scripture,note,actions);
      list.append(card);
    });
  }

  function enhanceNotebook(panel) {
    if (!panel) return;
    const tabs = panel.querySelector('.notebook-tabs');
    if (!tabs) return;
    let tab = tabs.querySelector('[data-tab="selections"]');
    if (!tab) {
      tab = document.createElement('button');
      tab.type = 'button';
      tab.dataset.tab = 'selections';
      tab.setAttribute('role','tab');
      tabs.append(tab);
      tab.addEventListener('click',()=>{
        tabs.querySelectorAll('button:not([hidden])').forEach(button=>{
          const active = button === tab;
          button.classList.toggle('active',active);
          button.setAttribute('aria-selected',String(active));
        });
        renderSelectionNotebook(panel);
      });
    }
    tab.textContent = labels().selectionNotes;
  }

  function rerenderSelectionNotebook() {
    const panel = document.querySelector('.notebook-panel');
    if (!panel) return;
    enhanceNotebook(panel);
    if (panel.querySelector('[data-tab="selections"]')?.classList.contains('active')) renderSelectionNotebook(panel);
  }

  versesRoot.addEventListener('click', event => {
    if (event.target.closest('button,a,input,textarea,select,.verse-actions-trigger')) return;
    const row = event.target.closest('.verse[data-verse]');
    if (!row || !versesRoot.contains(row)) return;
    const nativeSelection = window.getSelection?.();
    if (nativeSelection && !nativeSelection.isCollapsed && nativeSelection.toString().trim()) return;
    setSelected(row,!selected.has(Number(row.dataset.verse)));
  });

  const contentObserver = new MutationObserver(() => {
    if (selected.size) clearSelection();
  });
  contentObserver.observe(versesRoot,{childList:true});

  const panelObserver = new MutationObserver(()=>setTimeout(()=>enhanceNotebook(document.querySelector('.notebook-panel')),0));
  panelObserver.observe(document.body,{childList:true,subtree:true});
  window.addEventListener('bible-reader-records-changed',()=>{updateActionBar();rerenderSelectionNotebook();});
  document.querySelector('#translationSelect')?.addEventListener('change',clearSelection);
  document.querySelector('#bookSelect')?.addEventListener('change',clearSelection);
  document.querySelector('#chapterSelect')?.addEventListener('change',clearSelection);
  ensureActionBar();
})();