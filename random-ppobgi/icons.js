// Replace emoji icons with consistent line icons (every language).
// The i18n layer rewrites tab labels (with their emoji) on load and on
// language change, so this watches those buttons and re-applies the icons.
(() => {
  'use strict';
  const svg = body => `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${body}</svg>`;
  const I = {
    ladder: svg('<path d="M7 3v18M17 3v18M7 7.5h10M7 12h10M7 16.5h10"/>'),
    wheel: svg('<circle cx="12" cy="13" r="8"/><path d="M12 5v16M4 13h16M6.3 7.3l11.4 11.4M17.7 7.3 6.3 18.7"/><path d="M10.5 2h3L12 5z" fill="currentColor"/>'),
    lot: svg('<path d="M3.5 7h17v3a2 2 0 0 0 0 4v3h-17v-3a2 2 0 0 0 0-4z"/><path d="M14.5 7.5v9" stroke-dasharray="1.6 2"/>'),
    pinball: svg('<circle cx="12" cy="7" r="3.2"/><path d="M12 10.2V16M7 20h10M8.5 16h7"/>'),
    race: svg('<path d="M5 21V3.5"/><path d="M5 4h12l-2.5 3.8L17 11.6H5"/>'),
    capsule: svg('<rect x="8" y="2.5" width="8" height="19" rx="4" transform="rotate(45 12 12)"/><path d="M9.2 14.8l5.6-5.6"/>'),
    slot: svg('<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M9 5v14M15 5v14M5.7 12h.6M11.7 12h.6M17.7 12h.6"/>'),
    bomb: svg('<circle cx="10.5" cy="14" r="6.5"/><path d="M15 9.5l2.2-2.2M18.5 3.5v1.8M21 6h-1.8M20.3 3.7l-1.2 1.2"/>'),
    dice: svg('<rect x="4" y="4" width="16" height="16" rx="3.5"/><path d="M8.7 8.7h.01M15.3 15.3h.01M12 12h.01M15.3 8.7h.01M8.7 15.3h.01" stroke-width="2.6"/>'),
    yut: svg('<rect x="3.5" y="3" width="3.2" height="18" rx="1.6"/><rect x="8.3" y="3" width="3.2" height="18" rx="1.6"/><rect x="13.1" y="3" width="3.2" height="18" rx="1.6"/><rect x="17.9" y="3" width="3.2" height="18" rx="1.6"/>'),
    coin: svg('<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="5"/>'),
    order: svg('<path d="M10 6h10M10 12h10M10 18h10M4 4.5l1.5-1v5M3.5 14.6a1.6 1.6 0 1 1 2.6 1.3L3.6 19.5h3"/>'),
    team: svg('<circle cx="9" cy="8" r="3.2"/><path d="M3 20a6 6 0 0 1 12 0"/><circle cx="17" cy="9" r="2.6"/><path d="M16.2 14.2A5 5 0 0 1 21 19.5"/>'),
    target: svg('<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><path d="M12 12h.01" stroke-width="2.8"/>')
  };
  // Each game/tool keeps its own color (like the old emoji), on a soft tint.
  const C = {ladder: '#b5651d', wheel: '#e0457b', lot: '#d97706', pinball: '#7c3aed', race: '#2563eb', capsule: '#0d9488', slot: '#dc2626', bomb: '#475569',
    dice: '#e0457b', yut: '#a16207', coin: '#ca8a04', order: '#2563eb', team: '#16a34a'};
  const tint = c => `color:${c};background:color-mix(in srgb,${c} 14%,transparent)`;
  const css = `.method .icon{display:grid!important;place-items:center;width:2.3em;height:2.3em;margin:0 auto 4px;border-radius:999px}
.method .icon svg{width:1.3em;height:1.3em;display:block}
${Object.entries(C).filter(([k]) => !['dice', 'yut', 'coin', 'order', 'team'].includes(k)).map(([k, c]) => `.method[data-method="${k}"] .icon{${tint(c)}}`).join('\n')}
.tool-tab>span:first-child{display:inline-grid;place-items:center;width:1.9em;height:1.9em;border-radius:999px;vertical-align:middle}
.tool-tab>span:first-child svg{width:1.1em;height:1.1em;display:block}
${['dice', 'yut', 'coin', 'order', 'team'].map(k => `.tool-tab[data-tool="${k}"]>span:first-child{${tint(C[k])}}`).join('\n')}
.tool-tab.active>span:first-child{background:rgba(255,255,255,.92)}
#showPicker .tab-ico svg,#showTools .tab-ico svg{width:1.15em;height:1.15em;display:inline-block;vertical-align:-.2em;margin-inline-end:.35em}
#showPicker .tab-ico{color:#e0457b}#showTools .tab-ico{color:#7c3aed}
#showPicker.active .tab-ico,#showTools.active .tab-ico{color:inherit}`;
  const style = document.createElement('style');
  style.textContent = css;
  document.head.append(style);

  const STRIP = /^[^\p{L}\p{N}]+/u;
  let busy = false;
  function apply() {
    if (busy) return;
    busy = true;
    try {
      document.querySelectorAll('.methods .method').forEach(b => {
        const icon = b.querySelector('.icon'), key = b.dataset.method;
        if (icon && I[key] && !icon.querySelector('svg')) icon.innerHTML = I[key];
      });
      document.querySelectorAll('.tool-tab').forEach(b => {
        const icon = b.querySelector('span'), key = b.dataset.tool;
        if (icon && I[key] && !icon.querySelector('svg')) icon.innerHTML = I[key];
      });
      [['showPicker', 'target'], ['showTools', 'dice']].forEach(([id, key]) => {
        const b = document.getElementById(id);
        if (!b || b.querySelector('.tab-ico')) return;
        const text = b.textContent.replace(STRIP, '').trim();
        b.innerHTML = `<span class="tab-ico">${I[key]}</span><span class="tab-label"></span>`;
        b.querySelector('.tab-label').textContent = text;
      });
    } finally {
      busy = false;
    }
  }
  function watch() {
    apply();
    const targets = ['showPicker', 'showTools'].map(id => document.getElementById(id)).filter(Boolean);
    const box = document.querySelector('.tool-tabs');
    if (box) targets.push(box);
    const methods = document.querySelector('.methods');
    if (methods) targets.push(methods);
    const mo = new MutationObserver(() => { if (!busy) apply(); });
    targets.forEach(t => mo.observe(t, {childList: true, subtree: true, characterData: true}));
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', watch, {once: true});
  else watch();
})();
