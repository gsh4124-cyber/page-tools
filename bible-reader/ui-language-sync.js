(() => {
  const DEFAULT_TRANSLATION = {
    ko: 'krv1961',
    en: 'kjv',
    fr: 'lsg',
    de: 'luth1912',
    zh: 'cuv',
    ru: 'synodal',
    la: 'vulg',
    pt: 'almeida1819',
    ar: 'svd',
  };

  const languageSelect = document.querySelector('#languageSelect');
  if (languageSelect) {
    languageSelect.addEventListener('change', () => {
      const code = languageSelect.value;
      const translation = DEFAULT_TRANSLATION[code];
      if (!translation) return;
      try { localStorage.setItem('bible-reader-translation', translation); } catch (_) {}
      window.__BIBLE_TRANSLATION__ = translation;

      if (location.protocol !== 'file:') {
        const projectBase = location.hostname === 'gsh4124-cyber.github.io' ? '/bible-reader/' : '/';
        const target = code === 'ko' ? projectBase : `${projectBase}${code}/`;
        if (location.pathname !== target) location.assign(target);
      }
    }, true);
  }

  const titleDescriptor = Object.getOwnPropertyDescriptor(Document.prototype, 'title');
  const titleElement = document.querySelector('title');

  function uiPageTitle() {
    return window.BibleI18n?.text?.()?.pageTitle || titleElement?.textContent || '';
  }

  function writeUiTitle() {
    const desired = uiPageTitle();
    if (!desired || !titleDescriptor?.set) return;
    if (titleDescriptor.get.call(document) !== desired) {
      titleDescriptor.set.call(document, desired);
    }
  }

  function enforceStableUiDirection() {
    if (document.documentElement.dir !== 'ltr') document.documentElement.dir = 'ltr';
  }

  function syncAfterSelection(select) {
    /*
     * i18n.js intentionally avoids rewriting native select options while a picker
     * is open. After a real change, the selection is complete, so release focus
     * before applying localization. This prevents the old "click somewhere else
     * before labels update" behavior without mutating an open mobile picker.
     */
    if (document.activeElement === select) select.blur();

    const sync = () => {
      window.BibleI18n?.apply?.();
      enforceStableUiDirection();
      writeUiTitle();
    };

    requestAnimationFrame(sync);
    setTimeout(sync, 60);
    setTimeout(sync, 180);
  }

  /* Scripture direction is handled on reader/compare content itself. */
  const dirObserver = new MutationObserver(enforceStableUiDirection);
  dirObserver.observe(document.documentElement, {attributes:true, attributeFilter:['dir']});
  enforceStableUiDirection();

  /* Browser title has one effective owner: the current UI language. */
  if (titleDescriptor?.get && titleDescriptor?.set) {
    Object.defineProperty(document, 'title', {
      configurable: true,
      get() {
        return titleDescriptor.get.call(document);
      },
      set() {
        const desired = uiPageTitle();
        if (desired && titleDescriptor.get.call(document) !== desired) {
          titleDescriptor.set.call(document, desired);
        }
      },
    });
  }

  ['translationSelect','bookSelect','chapterSelect','verseSelect','languageSelect'].forEach(id => {
    document.querySelector(`#${id}`)?.addEventListener('change', event => {
      syncAfterSelection(event.currentTarget);
    });
  });

  [0, 80, 250, 700, 1500].forEach(ms => setTimeout(() => {
    enforceStableUiDirection();
    writeUiTitle();
  }, ms));
})();