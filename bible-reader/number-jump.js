(() => {
  const chapterSelect = document.querySelector('#chapterSelect');
  const verseSelect = document.querySelector('#verseSelect');
  const chapterInput = document.querySelector('#chapterNumberInput');
  const verseInput = document.querySelector('#verseNumberInput');
  const chapterButton = document.querySelector('#chapterOptionsButton');
  const verseButton = document.querySelector('#verseOptionsButton');
  const chapterMenu = document.querySelector('#chapterOptionsMenu');
  const verseMenu = document.querySelector('#verseOptionsMenu');
  const verses = document.querySelector('#verses');
  if (!chapterSelect || !verseSelect || !chapterInput || !verseInput || !chapterButton || !verseButton || !chapterMenu || !verseMenu) return;

  const LABELS = {
    ko:{chapter:'장 번호',verse:'절 번호',chapterList:'장 목록',verseList:'절 목록'},
    en:{chapter:'Chapter number',verse:'Verse number',chapterList:'Chapter list',verseList:'Verse list'},
    fr:{chapter:'Numéro du chapitre',verse:'Numéro du verset',chapterList:'Liste des chapitres',verseList:'Liste des versets'},
    de:{chapter:'Kapitelnummer',verse:'Versnummer',chapterList:'Kapitelliste',verseList:'Versliste'},
    zh:{chapter:'章节编号',verse:'经文编号',chapterList:'章节列表',verseList:'经文列表'},
    ru:{chapter:'Номер главы',verse:'Номер стиха',chapterList:'Список глав',verseList:'Список стихов'},
    la:{chapter:'Numerus capitis',verse:'Numerus versus',chapterList:'Capita',verseList:'Versus'},
    pt:{chapter:'Número do capítulo',verse:'Número do versículo',chapterList:'Lista de capítulos',verseList:'Lista de versículos'},
    ar:{chapter:'رقم الأصحاح',verse:'رقم الآية',chapterList:'قائمة الأصحاحات',verseList:'قائمة الآيات'}
  };

  function uiLang(){ return window.BibleI18n?.lang?.() || 'ko'; }
  function setLabels(){
    const labels = LABELS[uiLang()] || LABELS.en;
    chapterInput.setAttribute('aria-label', labels.chapter);
    chapterInput.title = labels.chapter;
    verseInput.setAttribute('aria-label', labels.verse);
    verseInput.title = labels.verse;
    chapterButton.setAttribute('aria-label', labels.chapterList);
    chapterButton.title = labels.chapterList;
    verseButton.setAttribute('aria-label', labels.verseList);
    verseButton.title = labels.verseList;
  }

  function optionValues(select){
    return [...select.options].map(option => Number(option.value)).filter(Number.isFinite);
  }

  function closeMenu(menu,button){
    menu.hidden = true;
    button.setAttribute('aria-expanded','false');
  }

  function closeAll(){
    closeMenu(chapterMenu,chapterButton);
    closeMenu(verseMenu,verseButton);
  }

  function buildMenu(select,menu,input,button){
    const values = optionValues(select);
    menu.replaceChildren();
    const fragment = document.createDocumentFragment();
    values.forEach(value => {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'number-jump-option';
      item.setAttribute('role','option');
      item.dataset.value = String(value);
      item.textContent = String(value);
      if (String(value) === select.value) item.setAttribute('aria-selected','true');
      item.addEventListener('click',() => {
        input.value = String(value);
        if (select.value !== String(value)) {
          select.value = String(value);
          select.dispatchEvent(new Event('change',{bubbles:true}));
        }
        closeMenu(menu,button);
        input.focus({preventScroll:true});
      });
      fragment.append(item);
    });
    menu.append(fragment);
  }

  function syncInput(select,input,menu,button){
    const values = optionValues(select);
    const max = values.length ? Math.max(...values) : 1;
    input.dataset.max = String(max);
    const selected = Number(select.value) || 1;
    if (document.activeElement !== input) input.value = String(Math.min(max, Math.max(1, selected)));
    buildMenu(select,menu,input,button);
  }

  function syncAll(){
    syncInput(chapterSelect,chapterInput,chapterMenu,chapterButton);
    syncInput(verseSelect,verseInput,verseMenu,verseButton);
    setLabels();
  }

  function commit(input,select){
    const values = optionValues(select);
    const max = values.length ? Math.max(...values) : 1;
    let value = Number.parseInt(input.value,10);
    if (!Number.isFinite(value)) value = Number(select.value) || 1;
    value = Math.min(max,Math.max(1,value));
    input.value = String(value);
    if (select.value !== String(value)) {
      select.value = String(value);
      select.dispatchEvent(new Event('change',{bubbles:true}));
    }
  }

  [[chapterInput,chapterSelect],[verseInput,verseSelect]].forEach(([input,select]) => {
    input.addEventListener('input',() => {
      const digits = input.value.replace(/\D+/g,'');
      if (input.value !== digits) input.value = digits;
      if (!digits) return;
      const max = Math.max(1, Number(input.dataset.max) || 1);
      const value = Number.parseInt(digits,10);
      if (Number.isFinite(value) && value > max) input.value = String(max);
    });
    input.addEventListener('keydown', event => {
      if (event.key === 'Enter') {
        event.preventDefault();
        commit(input,select);
        input.blur();
      }
      if (event.key === 'Escape') {
        input.value = String(Number(select.value) || 1);
        closeAll();
        input.blur();
      }
    });
    input.addEventListener('blur',() => commit(input,select));
  });

  [[chapterButton,chapterMenu,chapterInput,chapterSelect,verseMenu,verseButton],[verseButton,verseMenu,verseInput,verseSelect,chapterMenu,chapterButton]].forEach(([button,menu,input,select,otherMenu,otherButton]) => {
    button.addEventListener('click',event => {
      event.stopPropagation();
      closeMenu(otherMenu,otherButton);
      const opening = menu.hidden;
      if (opening) {
        buildMenu(select,menu,input,button);
        menu.hidden = false;
        button.setAttribute('aria-expanded','true');
        const selected = menu.querySelector('[aria-selected="true"]');
        selected?.scrollIntoView({block:'nearest'});
      } else {
        closeMenu(menu,button);
      }
    });
  });

  document.addEventListener('click',event => {
    if (!event.target.closest('.number-jump-control')) closeAll();
  });
  document.addEventListener('keydown',event => {
    if (event.key === 'Escape') closeAll();
  });

  const observer = new MutationObserver(() => requestAnimationFrame(syncAll));
  observer.observe(chapterSelect,{childList:true,subtree:true});
  observer.observe(verseSelect,{childList:true,subtree:true});
  if (verses) observer.observe(verses,{childList:true,subtree:true});
  chapterSelect.addEventListener('change',() => requestAnimationFrame(syncAll));
  verseSelect.addEventListener('change',() => requestAnimationFrame(syncAll));
  document.querySelector('#bookSelect')?.addEventListener('change',() => setTimeout(syncAll,0));
  document.querySelector('#translationSelect')?.addEventListener('change',() => setTimeout(syncAll,0));
  window.addEventListener('pageshow',syncAll);
  [0,80,250,700].forEach(ms => setTimeout(syncAll,ms));
})();