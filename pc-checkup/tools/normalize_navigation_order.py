from pathlib import Path
import re

ROOT = Path('dist')
LEGACY_ORIGIN = 'https://gsh4124-cyber.github.io/pc-checkup/'
PRODUCTION_ORIGIN = 'https://pc-checkup.pages.dev/'
ORDER = [
    'checkup.html',
    'keyboard.html',
    'mouse.html',
    'display.html',
    'speaker.html',
    'mic.html',
    'webcam.html',
]
NAV_RE = re.compile(r'(<nav class="navlinks">)([\s\S]*?)(</nav>)', re.I)
LINK_RE = re.compile(r'<a\s+href="([^"]+)"[^>]*>[\s\S]*?</a>', re.I)


def basename(href: str) -> str:
    return href.split('#', 1)[0].split('?', 1)[0].rstrip('/').split('/')[-1]


def reorder_nav(text: str, path: Path) -> str:
    m = NAV_RE.search(text)
    if not m:
        return text

    body = m.group(2)
    links = list(LINK_RE.finditer(body))
    if not links:
        return text

    by_base = {basename(x.group(1)): x.group(0) for x in links}
    if not all(name in by_base for name in ORDER):
        return text

    ordered = ''.join(by_base[name] for name in ORDER)
    extras = [x.group(0) for x in links if basename(x.group(1)) not in ORDER]
    ordered += ''.join(extras)
    return text[:m.start(2)] + ordered + text[m.end(2):]


changed = 0
full_nav_pages = 0
for path in sorted(ROOT.rglob('*.html')):
    text = path.read_text(encoding='utf-8')
    before = text
    if '<nav class="navlinks">' in text:
        m = NAV_RE.search(text)
        if m:
            found = {basename(x.group(1)) for x in LINK_RE.finditer(m.group(2))}
            if all(name in found for name in ORDER):
                full_nav_pages += 1
    text = reorder_nav(text, path)
    if text != before:
        path.write_text(text, encoding='utf-8')
        changed += 1

if full_nav_pages == 0:
    raise RuntimeError('No full PC navigation blocks found')

# Cloudflare Pages is the production origin. Earlier generators still emit the
# GitHub Pages origin, so normalize every deployable text asset at the final
# post-processing stage. This keeps canonical/hreflang/OG/JSON-LD/robots/
# sitemap consistent even when upstream locale generators differ.
origin_rewrites = 0
text_suffixes = {'.html', '.js', '.xml', '.txt', '.css', '.json'}
for path in sorted(ROOT.rglob('*')):
    if not path.is_file() or path.suffix.lower() not in text_suffixes:
        continue
    text = path.read_text(encoding='utf-8')
    if LEGACY_ORIGIN in text:
        new_text = text.replace(LEGACY_ORIGIN, PRODUCTION_ORIGIN)
        path.write_text(new_text, encoding='utf-8')
        origin_rewrites += 1

remaining = []
for path in sorted(ROOT.rglob('*')):
    if not path.is_file() or path.suffix.lower() not in text_suffixes:
        continue
    if LEGACY_ORIGIN in path.read_text(encoding='utf-8'):
        remaining.append(str(path))
if remaining:
    raise RuntimeError(f'Legacy GitHub Pages origin remains in deploy artifact: {remaining[:10]}')

print(f'Normalized canonical PC navigation order on {full_nav_pages} pages; rewrote {changed} pages; production-origin rewrites {origin_rewrites}')
