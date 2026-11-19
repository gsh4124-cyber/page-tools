(() => {
  'use strict';
  function openLinkedTool() {
    const tool = { '#teams': 'team', '#order': 'order' }[location.hash];
    if (!tool) return;
    const trigger = document.getElementById('showTools');
    const tab = document.querySelector(`#gameTools [data-tool="${tool}"]`);
    if (!trigger || !tab) return;
    trigger.click();
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
