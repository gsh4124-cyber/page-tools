(() => {
  const versesRoot = document.querySelector('#verses');
  if (!versesRoot || typeof BOOKS === 'undefined' || typeof state === 'undefined') return;

  const SITE_URL = 'https://bible-reader-1iz.pages.dev/';

  function currentBookName() {
    try { return window.BibleI18n?.bookName?.(state.bookIndex) || BOOKS[state.bookIndex]?.ko || 'Bible'; }
    catch (_) { return BOOKS[state.bookIndex]?.ko || 'Bible'; }
  }

  function scriptureLang() {
    return window.BibleI18n?.scriptureLang?.() || 'ko';
  }

  function uiLang() {
    return window.BibleI18n?.currentLang?.() || document.documentElement.lang || 'ko';
  }

  function translationName() {
    const id = typeof activeTranslationId !== 'undefined' ? activeTranslationId : document.querySelector('#translationSelect')?.value;
    return (typeof TRANSLATIONS !== 'undefined' && TRANSLATIONS[id]?.name) || id || 'Bible';
  }

  function localizedPageName() {
    const names = {
      ko:'성경 읽기 웹서비스', en:'Bible Reader', fr:'Lecteur de la Bible', de:'Bibel-Leser', zh:'圣经阅读器',
      ru:'Чтение Библии', la:'Lector Bibliae', pt:'Leitor da Bíblia', ar:'قارئ الكتاب المقدس'
    };
    const lang = String(uiLang()).toLowerCase().split('-')[0];
    return names[lang] || names.en;
  }

  function refParts(startVerse, endVerse = startVerse) {
    const lang = scriptureLang();
    const book = currentBookName();
    const chapter = state.chapter;
    if (lang === 'ko') return startVerse === endVerse ? `${book} ${chapter}장 ${startVerse}절` : `${book} ${chapter}장 ${startVerse}–${endVerse}절`;
    if (lang === 'zh') return startVerse === endVerse ? `${book} 第${chapter}章 第${startVerse}节` : `${book} 第${chapter}章 第${startVerse}–${endVerse}节`;
    if (lang === 'ru') return startVerse === endVerse ? `${book}, глава ${chapter}, стих ${startVerse}` : `${book}, глава ${chapter}, стихи ${startVerse}–${endVerse}`;
    if (lang === 'de') return startVerse === endVerse ? `${book} ${chapter},${startVerse}` : `${book} ${chapter},${startVerse}–${endVerse}`;
    return startVerse === endVerse ? `${book} ${chapter}:${startVerse}` : `${book} ${chapter}:${startVerse}–${endVerse}`;
  }

  function selectedVerseElements(selection) {
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return [];
    const range = selection.getRangeAt(0);
    return [...versesRoot.querySelectorAll('.verse')].filter((verse) => {
      try { return range.intersectsNode(verse); } catch (_) { return false; }
    });
  }

  function verseLine(verseEl, overrideText = null) {
    const verseNumber = Number(verseEl?.dataset.verse);
    const text = (overrideText ?? verseEl?.querySelector('.verse-text')?.textContent ?? '').trim();
    if (!verseNumber || !text) return '';
    return `${verseNumber} ${text}`;
  }

  function buildCopyText(startVerse, endVerse, lines) {
    return `[${translationName()}] ${refParts(startVerse, endVerse)}\n\n${lines.join('\n')}\n\n${localizedPageName()} · ${SITE_URL}`;
  }

  function compressRanges(numbers) {
    const sorted = [...new Set(numbers.map(Number).filter(Boolean))].sort((a,b)=>a-b);
    const ranges = [];
    for (const n of sorted) {
      const last = ranges[ranges.length - 1];
      if (last && n === last[1] + 1) last[1] = n;
      else ranges.push([n,n]);
    }
    return ranges;
  }

  function referenceForVerseNumbers(numbers) {
    const ranges = compressRanges(numbers);
    if (!ranges.length) return '';
    if (ranges.length === 1) return refParts(ranges[0][0], ranges[0][1]);
    const lang = scriptureLang();
    const book = currentBookName();
    const chapter = state.chapter;
    const body = ranges.map(([a,b]) => a === b ? String(a) : `${a}–${b}`).join(', ');
    if (lang === 'ko') return `${book} ${chapter}장 ${body}절`;
    if (lang === 'zh') return `${book} 第${chapter}章 第${body}节`;
    if (lang === 'ru') return `${book}, глава ${chapter}, стихи ${body}`;
    if (lang === 'de') return `${book} ${chapter},${body}`;
    return `${book} ${chapter}:${body}`;
  }

  function normalizeVerseElements(elements) {
    return [...new Set(elements || [])]
      .filter(el => el?.matches?.('.verse[data-verse]'))
      .sort((a,b) => Number(a.dataset.verse) - Number(b.dataset.verse));
  }

  function buildCopyTextForElements(elements) {
    const rows = normalizeVerseElements(elements);
    const numbers = rows.map(row => Number(row.dataset.verse)).filter(Boolean);
    const lines = rows.map(row => verseLine(row)).filter(Boolean);
    if (!numbers.length || !lines.length) return '';
    return `[${translationName()}] ${referenceForVerseNumbers(numbers)}\n\n${lines.join('\n')}\n\n${localizedPageName()} · ${SITE_URL}`;
  }

  async function copyText(text) {
    if (!text) return false;
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (_) {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.append(textarea);
        textarea.select();
        const ok = document.execCommand('copy');
        textarea.remove();
        return ok;
      } catch (_) { return false; }
    }
  }

  versesRoot.addEventListener('copy', (event) => {
    const selection = window.getSelection();
    const verseElements = selectedVerseElements(selection);
    if (!verseElements.length) return;
    const startVerse = Number(verseElements[0].dataset.verse);
    const endVerse = Number(verseElements[verseElements.length - 1].dataset.verse);
    if (!startVerse || !endVerse) return;
    let lines = [];
    if (verseElements.length === 1) {
      const selectedText = selection.toString().replace(/\s+/g, ' ').trim();
      const line = verseLine(verseElements[0], selectedText);
      if (line) lines.push(line);
    } else {
      lines = verseElements.map((verseEl) => verseLine(verseEl)).filter(Boolean);
    }
    if (!lines.length) return;
    event.preventDefault();
    event.clipboardData.setData('text/plain', buildCopyText(startVerse, endVerse, lines));
  });

  window.BibleClipboard = {
    copyText,
    buildCopyTextForElements,
    referenceForVerseNumbers,
    verseLine
  };
})();