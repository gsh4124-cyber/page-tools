(() => {
  'use strict';
  // Keyword landing pages (/ladder/, /roulette/ ...) link here with a hash
  // so the visitor lands on the matching game or tool, ready to start.
  const TOOLS = { '#teams': 'team', '#team': 'team', '#order': 'order', '#dice': 'dice', '#coin': 'coin', '#yut': 'yut' };
  const METHODS = ['ladder', 'wheel', 'lot', 'pinball', 'race', 'capsule', 'slot', 'bomb'];
  function openLinkedTool() {
    const method = location.hash.slice(1);
    if (METHODS.includes(method)) {
      const button = document.querySelector(`.methods [data-method="${method}"]`);
      if (!button) return;
      button.click();
      requestAnimationFrame(() => {
        button.focus({preventScroll: true});
        (document.querySelector('.method-top') || button).scrollIntoView({block: 'start'});
      });
      return;
    }
    const tool = TOOLS[location.hash];
    if (!tool) return;
    const trigger = document.getElementById('showTools');
    const tab = document.querySelector(`#gameTools [data-tool="${tool}"]`);
    if (!trigger || !tab) return;
    if (trigger.getAttribute('aria-pressed') !== 'true') trigger.click();
    tab.click();
    requestAnimationFrame(() => {
      tab.focus({preventScroll: true});
      document.getElementById('gameTools')?.scrollIntoView({block: 'start'});
    });
  }
  window.addEventListener('hashchange', openLinkedTool);
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', openLinkedTool, {once: true});
  } else {
    openLinkedTool();
  }
})();
