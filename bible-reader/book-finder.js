(() => {
  const input = document.querySelector('#searchInput');
  const list = document.querySelector('#bookList');
  const select = document.querySelector('#bookSelect');
  const form = document.querySelector('#searchForm');
  if (!input || !list || !select || !form || typeof BOOKS === 'undefined') return;

  const normalized = value => String(value || '').trim().toLocaleLowerCase();

  function localizedNames() {
    const names = window.BibleI18n?.bookNames;
    const current = window.BibleI18n?.scriptureLang?.() || 'ko';
    return names?.[current] || names?.en || BOOKS.map(book => book.ko);
  }

  function allNamesForIndex(index) {
    const groups = window.BibleI18n?.bookNames;
    const values = new Set([BOOKS[index]?.ko, BOOKS[index]?.file, BOOKS[index]?.osis]);
    if (groups) Object.values(groups).forEach(names => values.add(names?.[index]));
    return [...values].filter(Boolean);
  }

  function refreshDatalist() {
    const names = localizedNames();
    list.replaceChildren();
    names.forEach(name => {
      const option = document.createElement('option');
      option.value = name;
      list.append(option);
    });
  }

  function findBookIndex(query) {
    const q = normalized(query);
    if (!q) return -1;

    for (let index = 0; index < BOOKS.length; index += 1) {
      if (allNamesForIndex(index).some(name => normalized(name) === q)) return index;
    }

    const matches = [];
    for (let index = 0; index < BOOKS.length; index += 1) {
      if (allNamesForIndex(index).some(name => normalized(name).includes(q))) matches.push(index);
    }
    return matches.length === 1 ? matches[0] : -1;
  }

  async function chooseBook(query) {
    const index = findBookIndex(query);
    if (index < 0) return false;

    select.value = String(index);
    select.dispatchEvent(new Event('change', { bubbles: true }));
    input.value = '';
    input.blur();
    return true;
  }

  document.addEventListener('submit', async event => {
    if (event.target !== form) return;
    const query = input.value.trim();
    if (!query || findBookIndex(query) < 0) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    await chooseBook(query);
  }, true);

  const refresh = () => setTimeout(refreshDatalist, 0);
  refreshDatalist();
  document.querySelector('#translationSelect')?.addEventListener('change', refresh);
  [100, 500, 1200].forEach(ms => setTimeout(refreshDatalist, ms));
})();
