(() => {
  const versesRoot = document.querySelector("#verses");
  const chapterTitle = document.querySelector("#chapterTitle");
  if (!versesRoot || !chapterTitle || !window.KRV_ANNOTATIONS) return;

  let applying = false;

  function currentKey() {
    const book = BOOKS[state.bookIndex];
    return book ? `${book.file}:${state.chapter}` : null;
  }

  function clearInjected() {
    versesRoot.querySelectorAll(".section-heading,.verse-note").forEach((node) => node.remove());
    versesRoot.querySelectorAll(".verse-note-marker").forEach((node) => node.remove());
  }

  function renderAnnotations() {
    if (applying || !versesRoot.querySelector(".verse")) return;
    applying = true;
    try {
      clearInjected();
      const book = BOOKS[state.bookIndex];
      if (!book) return;
      const chapterKey = `${book.file}:${state.chapter}`;
      const headings = window.KRV_ANNOTATIONS.headings?.[chapterKey] || [];

      headings.forEach((heading) => {
        const verse = versesRoot.querySelector(`.verse[data-verse="${Number(heading.verse)}"]`);
        if (!verse || !heading.text) return;
        const title = document.createElement("h2");
        title.className = "section-heading";
        title.textContent = heading.text;
        verse.before(title);
      });

      versesRoot.querySelectorAll(".verse").forEach((verseEl) => {
        const verseNumber = Number(verseEl.dataset.verse);
        const noteKey = `${book.file}:${state.chapter}:${verseNumber}`;
        const notes = window.KRV_ANNOTATIONS.notes?.[noteKey] || [];
        if (!notes.length) return;

        const textEl = verseEl.querySelector(".verse-text");
        if (!textEl) return;

        notes.forEach((note, index) => {
          const marker = document.createElement("button");
          marker.type = "button";
          marker.className = "verse-note-marker";
          marker.textContent = note.marker || String(index + 1);
          marker.title = "난하주 보기";
          marker.setAttribute("aria-expanded", "false");

          const noteEl = document.createElement("div");
          noteEl.className = "verse-note";
          noteEl.hidden = true;
          noteEl.textContent = note.text || "";

          marker.addEventListener("click", (event) => {
            event.stopPropagation();
            const willOpen = noteEl.hidden;
            noteEl.hidden = !willOpen;
            marker.setAttribute("aria-expanded", String(willOpen));
          });

          textEl.after(marker);
          verseEl.after(noteEl);
        });
      });
    } finally {
      applying = false;
    }
  }

  const observer = new MutationObserver(() => {
    if (!applying) requestAnimationFrame(renderAnnotations);
  });
  observer.observe(versesRoot, { childList: true, subtree: true });
  observer.observe(chapterTitle, { childList: true, subtree: true, characterData: true });

  requestAnimationFrame(renderAnnotations);
})();
