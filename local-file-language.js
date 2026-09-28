(() => {
  const LANGS = ['ko','en','fr','de','zh','ru','la','pt','ar'];
  const DEFAULT_TRANSLATION = {ko:'krv1961',en:'kjv',fr:'lsg',de:'luth1912',zh:'cuv',ru:'synodal',la:'vulg',pt:'almeida1819',ar:'svd'};

  if (location.hostname === 'gsh4124-cyber.github.io' && /^\/bible-reader(?:\/|$)/.test(location.pathname)) {
    const target = new URL(location.href);
    target.protocol = 'https:';
    target.host = 'bible-reader-1iz.pages.dev';
    target.pathname = location.pathname.replace(/^\/bible-reader(?=\/|$)/, '') || '/';
    location.replace(target.href);
    return;
  }

  const params = new URLSearchParams(location.search);
  const queryLang = params.get('lang');
  if (location.protocol === 'file:' && LANGS.includes(queryLang)) {
    window.__BIBLE_LANG__ = queryLang;
  }

  document.addEventListener('change', event => {
    if (location.protocol !== 'file:' || event.target?.id !== 'languageSelect') return;
    const code = event.target.value;
    if (!LANGS.includes(code)) return;

    event.preventDefault();
    event.stopImmediatePropagation();

    const translation = DEFAULT_TRANSLATION[code];
    if (translation) {
      try { localStorage.setItem('bible-reader-translation', translation); } catch (_) {}
      window.__BIBLE_TRANSLATION__ = translation;
    }

    const url = new URL(location.href);
    url.pathname = url.pathname.replace(/(?:\/(?:en|fr|de|zh|ru|la|pt|ar))?\/?(?:index\.html)?$/i, '/index.html');
    if (code === 'ko') url.searchParams.delete('lang');
    else url.searchParams.set('lang', code);
    if (translation) url.searchParams.set('translation', translation);
    location.href = url.href;
  }, true);
})();
