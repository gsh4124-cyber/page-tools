(() => {
  const form = document.querySelector("#searchForm");
  const input = document.querySelector("#searchInput");
  const button = document.querySelector("#searchButton");
  const panel = document.querySelector("#searchPanel");
  const summary = document.querySelector("#searchSummary");
  const resultsEl = document.querySelector("#searchResults");
  const translationSelect = document.querySelector("#translationSelect");
  if (!form || !input || !button || !panel || !summary || !resultsEl) return;

  let runId = 0;
  const UI = {
    ko:{prepare:q=>`“${q}” 전체 성경 검색 준비 중…`,progress:(q,n,t)=>`“${q}” 전체 검색 중… ${n}/${t}권`,none:(q,tr,failed)=>failed?`“${q}” 확인된 검색 결과 0개 · ${failed}권 로딩 실패`:`“${q}” 검색 결과 0개 · ${tr}`,done:(q,n,tr,failed)=>failed?`“${q}” 확인된 ${n}개 결과 · ${tr} · ${failed}권 로딩 실패`:`“${q}” 총 ${n}개 결과 · ${tr}`},
    en:{prepare:q=>`Preparing full Bible search for “${q}”…`,progress:(q,n,t)=>`Searching “${q}”… ${n}/${t} books`,none:(q,tr,failed)=>failed?`No confirmed results for “${q}” · ${failed} books failed to load`:`No results for “${q}” · ${tr}`,done:(q,n,tr,failed)=>failed?`${n} confirmed results for “${q}” · ${tr} · ${failed} books failed to load`:`${n} results for “${q}” · ${tr}`},
    fr:{prepare:q=>`Préparation de la recherche biblique « ${q} »…`,progress:(q,n,t)=>`Recherche « ${q} »… ${n}/${t} livres`,none:(q,tr,failed)=>failed?`Aucun résultat confirmé pour « ${q} » · ${failed} livres non chargés`:`Aucun résultat pour « ${q} » · ${tr}`,done:(q,n,tr,failed)=>`${n} résultats pour « ${q} » · ${tr}${failed?` · ${failed} livres non chargés`:''}`},
    de:{prepare:q=>`Bibelsuche nach „${q}“ wird vorbereitet…`,progress:(q,n,t)=>`Suche nach „${q}“… ${n}/${t} Bücher`,none:(q,tr,failed)=>failed?`Keine bestätigten Ergebnisse für „${q}“ · ${failed} Bücher nicht geladen`:`Keine Ergebnisse für „${q}“ · ${tr}`,done:(q,n,tr,failed)=>`${n} Ergebnisse für „${q}“ · ${tr}${failed?` · ${failed} Bücher nicht geladen`:''}`},
    zh:{prepare:q=>`正在准备全本圣经搜索“${q}”…`,progress:(q,n,t)=>`正在搜索“${q}”… ${n}/${t}卷`,none:(q,tr,failed)=>failed?`“${q}”暂无确认结果 · ${failed}卷加载失败`:`“${q}”没有搜索结果 · ${tr}`,done:(q,n,tr,failed)=>`“${q}”共${n}个结果 · ${tr}${failed?` · ${failed}卷加载失败`:''}`},
    ru:{prepare:q=>`Подготовка поиска по Библии: «${q}»…`,progress:(q,n,t)=>`Поиск «${q}»… ${n}/${t} книг`,none:(q,tr,failed)=>failed?`Нет подтверждённых результатов для «${q}» · не загружено книг: ${failed}`:`Нет результатов для «${q}» · ${tr}`,done:(q,n,tr,failed)=>`${n} результатов для «${q}» · ${tr}${failed?` · не загружено книг: ${failed}`:''}`},
    la:{prepare:q=>`Quaestio totius Bibliae “${q}” paratur…`,progress:(q,n,t)=>`Quaeritur “${q}”… ${n}/${t} libri`,none:(q,tr,failed)=>failed?`Nulli eventus confirmati pro “${q}” · ${failed} libri non onerati`:`Nihil inventum pro “${q}” · ${tr}`,done:(q,n,tr,failed)=>`${n} eventus pro “${q}” · ${tr}${failed?` · ${failed} libri non onerati`:''}`},
    pt:{prepare:q=>`Preparando pesquisa completa por “${q}”…`,progress:(q,n,t)=>`Pesquisando “${q}”… ${n}/${t} livros`,none:(q,tr,failed)=>failed?`Nenhum resultado confirmado para “${q}” · ${failed} livros não carregados`:`Nenhum resultado para “${q}” · ${tr}`,done:(q,n,tr,failed)=>`${n} resultados para “${q}” · ${tr}${failed?` · ${failed} livros não carregados`:''}`},
    ar:{prepare:q=>`جارٍ تجهيز البحث في الكتاب المقدس عن «${q}»…`,progress:(q,n,t)=>`جارٍ البحث عن «${q}»… ${n}/${t} سفرًا`,none:(q,tr,failed)=>failed?`لا توجد نتائج مؤكدة لـ «${q}» · تعذر تحميل ${failed} سفرًا`:`لا توجد نتائج لـ «${q}» · ${tr}`,done:(q,n,tr,failed)=>`${n} نتيجة لـ «${q}» · ${tr}${failed?` · تعذر تحميل ${failed} سفرًا`:''}`}
  };
  function ui(){const lang=window.BibleI18n?.lang?.()||'ko';return UI[lang]||UI.en;}
  function bookName(index){return window.BibleI18n?.bookName?.(index)||BOOKS[index]?.ko||'';}

  function renderExactResults(results, query, failed) {
    resultsEl.replaceChildren();
    panel.hidden = false;
    const tr=TRANSLATIONS[activeTranslationId].name;
    if (!results.length) { summary.textContent=ui().none(query,tr,failed); return; }
    summary.textContent=ui().done(query,results.length,tr,failed);

    const fragment = document.createDocumentFragment();
    results.forEach((result) => {
      const item = document.createElement("button");
      item.type = "button";
      item.className = "search-result";
      const ref = document.createElement("strong");
      ref.textContent = `${bookName(result.book.index)} ${result.chapter}:${result.verse}`;
      const text = document.createElement("span");
      text.textContent = result.text;
      item.append(ref, text);
      item.addEventListener("click", () => goToSearchResult(result));
      fragment.append(item);
    });
    resultsEl.append(fragment);
  }

  async function searchAll(query) {
    const normalized = query.trim().toLocaleLowerCase();
    if (!normalized) return;
    const currentRun = ++runId;
    const results = [];
    let failed = 0;
    panel.hidden = false;
    resultsEl.replaceChildren();
    button.disabled = true;
    input.disabled = true;
    summary.textContent = ui().prepare(query);

    try {
      const batchSize = 6;
      for (let start = 0; start < BOOKS.length; start += batchSize) {
        if (currentRun !== runId) return;
        const batch = BOOKS.slice(start, start + batchSize);
        summary.textContent = ui().progress(query,Math.min(start + batch.length,BOOKS.length),BOOKS.length);
        const loaded = await Promise.all(batch.map(async (book) => {
          try { return { book, data: await fetchBook(book, activeTranslationId) }; }
          catch (error) { console.error(error); failed += 1; return null; }
        }));
        loaded.filter(Boolean).forEach(({ book, data }) => {
          data.chapters.forEach((chapter) => {
            chapter.verses.forEach((verse) => {
              if (String(verse.text).toLocaleLowerCase().includes(normalized)) {
                results.push({book,chapter:Number(chapter.chapter),verse:Number(verse.verse),text:verse.text});
              }
            });
          });
        });
      }
      if (currentRun === runId) renderExactResults(results, query, failed);
    } finally {
      if (currentRun === runId) { button.disabled = false; input.disabled = false; input.focus(); }
    }
  }

  document.addEventListener("submit", (event) => {
    if (event.target !== form) return;
    const query = input.value.trim();
    if (!query) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    searchAll(query);
  }, true);

  translationSelect?.addEventListener("change", () => { runId += 1; });
})();