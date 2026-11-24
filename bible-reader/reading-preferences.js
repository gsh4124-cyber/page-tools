// Apply saved typography before the first render, instead of resizing visible Scripture later.
(() => {
  function apply() {
    try {
      const root=document.documentElement;
      const size=Math.max(16,Math.min(32,Number(localStorage.getItem('bible-reader-font-size'))||21));
      const savedWidth=localStorage.getItem('bible-reader-width'),width=['720','860','1080'].includes(savedWidth)?savedWidth:'860';
      root.style.setProperty('--font-size',`${size}px`);root.style.setProperty('--reader-width',`${width}px`);
      const theme=localStorage.getItem('bible-reader-theme');
      root.dataset.theme=['dark','light'].includes(theme)?theme:(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');
    } catch { /* Reading still works when browser storage is unavailable. */ }
  }
  window.BibleReadingPreferences={apply};apply();
})();
