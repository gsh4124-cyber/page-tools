(() => {
  const prev = document.querySelector("#prevChapterTitle");
  const next = document.querySelector("#nextChapterTitle");
  const prevBottom = document.querySelector("#prevChapterBottom");
  const nextBottom = document.querySelector("#nextChapterBottom");
  if (!prev || !next || !prevBottom || !nextBottom) return;

  prev.addEventListener("click", () => prevBottom.click());
  next.addEventListener("click", () => nextBottom.click());

  const syncDisabled = () => {
    prev.disabled = prevBottom.disabled;
    next.disabled = nextBottom.disabled;
    prev.setAttribute("aria-disabled", String(prev.disabled));
    next.setAttribute("aria-disabled", String(next.disabled));
  };

  const observer = new MutationObserver(syncDisabled);
  observer.observe(prevBottom, { attributes: true, attributeFilter: ["disabled", "aria-disabled"] });
  observer.observe(nextBottom, { attributes: true, attributeFilter: ["disabled", "aria-disabled"] });
  syncDisabled();
})();
