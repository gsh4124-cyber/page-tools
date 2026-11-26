// Apply saved typography before the first render, instead of resizing visible Scripture later.
(() => {
  const read=key=>{if(window.BibleStorage)return window.BibleStorage.getItem(key);try{return localStorage.getItem(key);}catch{return null;}};
  function apply() {
    try {
      const root=document.documentElement;
      const size=Math.max(16,Math.min(32,Number(read('bible-reader-font-size'))||21));
      const savedWidth=read('bible-reader-width'),width=['720','860','1080'].includes(savedWidth)?savedWidth:'1080';
      root.style.setProperty('--font-size',`${size}px`);root.style.setProperty('--reader-width',`${width}px`);
      const theme=read('bible-reader-theme');
      root.dataset.theme=['dark','light'].includes(theme)?theme:(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');
    } catch { /* Reading still works when browser storage is unavailable. */ }
  }
  window.BibleReadingPreferences={apply};apply();
})();
