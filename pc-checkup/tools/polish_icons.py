"""Replace emoji card icons in generated pages with consistent inline SVG line icons.

Emoji render differently on every OS and look out of place on the dark UI.
The icon is chosen by the card's link target first, then by the emoji itself,
so the PC check and the display test (both 🖥️ in the source) get distinct icons.
Legacy contest folders are left untouched (see LEGACY_HOST_BOUNDARY.md).
"""
from pathlib import Path
import re

DIST = Path(__file__).resolve().parents[1] / 'dist'
LEGACY = {'refundproof', 'proofrail', 'finalcheck'}

def svg(body):
    return ('<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" '
            'stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" focusable="false">' + body + '</svg>')

ICONS = {
    'pc': svg('<rect x="2.5" y="3.5" width="19" height="13" rx="2"/><path d="M8 20.5h8M12 16.5v4"/>'),
    'mobile': svg('<rect x="6.5" y="2.5" width="11" height="19" rx="2.5"/><path d="M11 18h2"/>'),
    'keyboard': svg('<rect x="2.5" y="6" width="19" height="12" rx="2"/><path d="M6.5 10h.01M10 10h.01M14 10h.01M17.5 10h.01M7.5 14h9"/>'),
    'mouse': svg('<rect x="6" y="2.5" width="12" height="19" rx="6"/><path d="M12 6.5v4"/>'),
    'mic': svg('<rect x="9" y="2.5" width="6" height="11.5" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5v3.5M8.5 21h7"/>'),
    'webcam': svg('<path d="M3 8.5a2 2 0 0 1 2-2h2.2l1.6-2.5h6.4l1.6 2.5H19a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><circle cx="12" cy="13" r="3.6"/>'),
    'speaker': svg('<path d="M11 5 6.5 9H3.5v6h3L11 19z"/><path d="M15.5 9a4.5 4.5 0 0 1 0 6M18.5 6a8.5 8.5 0 0 1 0 12"/>'),
    'display': svg('<rect x="2.5" y="3.5" width="19" height="13" rx="2"/><path d="M8 20.5h8M12 16.5v4"/><path d="M6.5 7.5h3v3h-3zM11 7.5h3v3h-3z" fill="currentColor" stroke="none" opacity=".55"/>'),
}
BY_PAGE = {'checkup.html': 'pc', 'mobile.html': 'mobile', 'keyboard.html': 'keyboard', 'mouse.html': 'mouse',
           'mic.html': 'mic', 'webcam.html': 'webcam', 'speaker.html': 'speaker', 'display.html': 'display'}
BY_EMOJI = {'🖥️': 'pc', '🖥': 'pc', '📱': 'mobile', '⌨️': 'keyboard', '⌨': 'keyboard', '🖱️': 'mouse', '🖱': 'mouse',
            '🎙️': 'mic', '🎙': 'mic', '📷': 'webcam', '🔊': 'speaker'}

CARD = re.compile(r'(<a\b[^>]*\bhref="([^"]*)"[^>]*>\s*)<div class="icon">([^<]{1,4})</div>')
BARE = re.compile(r'<div class="icon">([^<]{1,4})</div>')

def icon_for(href, emoji):
    page = href.split('#', 1)[0].split('?', 1)[0].rstrip('/').split('/')[-1]
    return BY_PAGE.get(page) or BY_EMOJI.get(emoji.strip())

changed = 0
for path in DIST.rglob('*.html'):
    if LEGACY & set(path.relative_to(DIST).parts):
        continue
    text = path.read_text(encoding='utf-8')
    def card(m):
        key = icon_for(m.group(2), m.group(3))
        return m.group(0) if not key else f'{m.group(1)}<div class="icon" aria-hidden="true">{ICONS[key]}</div>'
    new = CARD.sub(card, text)
    new = BARE.sub(lambda m: f'<div class="icon" aria-hidden="true">{ICONS[BY_EMOJI[m.group(1).strip()]]}</div>'
                   if m.group(1).strip() in BY_EMOJI else m.group(0), new)
    if new != text:
        path.write_text(new, encoding='utf-8')
        changed += 1
left = [p for p in DIST.rglob('*.html') if not (LEGACY & set(p.relative_to(DIST).parts))
        and BARE.search(p.read_text(encoding='utf-8'))]
if left:
    raise RuntimeError(f'emoji icons remain in {len(left)} pages, e.g. {left[0]}')
print(f'Icons polished: {changed} pages now use inline SVG icons')
