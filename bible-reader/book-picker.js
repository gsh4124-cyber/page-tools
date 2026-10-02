(() => {
  const bookSelect = document.querySelector('#bookSelect');
  const control = document.querySelector('#bookPickerControl');
  const button = document.querySelector('#bookPickerButton');
  const buttonLabel = document.querySelector('#bookPickerLabel');
  const panel = document.querySelector('#bookPickerPanel');
  const tabs = document.querySelector('#bookPickerTabs');
  const list = document.querySelector('#bookPickerList');
  if (!bookSelect || !control || !button || !buttonLabel || !panel || !tabs || !list) return;

  const OT_END_INDEX = 38;
  const LABELS = {
    ko:{books:'성경책',old:'구약',new:'신약',oldBooks:'구약 성경책',newBooks:'신약 성경책'},
    en:{books:'Book',old:'Old Testament',new:'New Testament',oldBooks:'Old Testament books',newBooks:'New Testament books'},
    fr:{books:'Livre',old:'Ancien Testament',new:'Nouveau Testament',oldBooks:'Livres de l’Ancien Testament',newBooks:'Livres du Nouveau Testament'},
    de:{books:'Buch',old:'Altes Testament',new:'Neues Testament',oldBooks:'Bücher des Alten Testaments',newBooks:'Bücher des Neuen Testaments'},
    zh:{books:'书卷',old:'旧约',new:'新约',oldBooks:'旧约书卷',newBooks:'新约书卷'},
    ru:{books:'Книга',old:'Ветхий Завет',new:'Новый Завет',oldBooks:'Книги Ветхого Завета',newBooks:'Книги Нового Завета'},
    la:{books:'Liber',old:'Vetus Testamentum',new:'Novum Testamentum',oldBooks:'Libri Veteris Testamenti',newBooks:'Libri Novi Testamenti'},
    pt:{books:'Livro',old:'Antigo Testamento',new:'Novo Testamento',oldBooks:'Livros do Antigo Testamento',newBooks:'Livros do Novo Testamento'},
    ar:{books:'السفر',old:'العهد القديم',new:'العهد الجديد',oldBooks:'أسفار العهد القديم',newBooks:'أسفار العهد الجديد'}
  };

  function uiLang(){ return window.BibleI18n?.lang?.() || window.__BIBLE_LANG__ || document.documentElement.lang || 'ko'; }
  function labels(){ return LABELS[uiLang()] || LABELS.en; }
  function options(){ return [...bookSelect.options]; }
  function selectedOption(){ return bookSelect.selectedOptions?.[0] || options().find(o => o.value === bookSelect.value); }

  function setOpen(open){
    panel.hidden = !open;
    button.setAttribute('aria-expanded', String(open));
    control.classList.toggle('open', open);
    if (open) {
      render();
      requestAnimationFrame(() => list.querySelector('[aria-selected="true"]')?.scrollIntoView({block:'nearest'}));
    }
  }

  function syncButton(){
    const current = selectedOption();
    if (current) buttonLabel.textContent = current.textContent.trim();
    const l = labels();
    button.setAttribute('aria-label', l.books);
    button.title = l.books;
  }

  function makeGroup(name, ariaLabel){
    const group = document.createElement('section');
    group.className = 'book-picker-group';
    group.setAttribute('aria-label', ariaLabel);
    const heading = document.createElement('div');
    heading.className = 'book-picker-group-title';
    heading.textContent = name;
    const grid = document.createElement('div');
    grid.className = 'book-picker-group-grid';
    group.append(heading,grid);
    return {group,grid};
  }

  function makeBookItem(option){
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'book-picker-item';
    item.setAttribute('role','option');
    item.dataset.value = option.value;
    item.textContent = option.textContent.trim();
    item.setAttribute('aria-selected', String(option.value === bookSelect.value));
    item.addEventListener('click', () => {
      if (bookSelect.value !== option.value) {
        bookSelect.value = option.value;
        bookSelect.dispatchEvent(new Event('change',{bubbles:true}));
      }
      syncButton();
      setOpen(false);
    });
    return item;
  }

  function renderList(){
    const l = labels();
    tabs.replaceChildren();
    tabs.hidden = true;
    list.replaceChildren();
    list.setAttribute('aria-label', l.books);
    const old = makeGroup(l.old,l.oldBooks);
    const fresh = makeGroup(l.new,l.newBooks);
    options().forEach((option,index) => (index <= OT_END_INDEX ? old.grid : fresh.grid).append(makeBookItem(option)));
    list.append(old.group,fresh.group);
  }

  function render(){
    renderList();
    syncButton();
  }

  button.addEventListener('click', event => {
    event.stopPropagation();
    setOpen(panel.hidden);
  });

  document.addEventListener('click', event => {
    if (!event.target.closest('#bookPickerControl')) setOpen(false);
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !panel.hidden) {
      setOpen(false);
      button.focus({preventScroll:true});
    }
  });

  bookSelect.addEventListener('change', render);
  const observer = new MutationObserver(() => requestAnimationFrame(render));
  observer.observe(bookSelect,{childList:true,subtree:true,attributes:true});
  window.addEventListener('pageshow',render);
  [0,80,250,700].forEach(ms => setTimeout(render,ms));
})();
