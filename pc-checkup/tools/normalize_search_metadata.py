"""Restore machine-readable locale metadata after historical text translation."""
from html import escape
from html.parser import HTMLParser
from pathlib import Path
import json
import re

ROOT = Path('dist')
ORIGIN = 'https://pc-checkup.pages.dev'
LOCALES = ['ko', 'en', 'ja', 'es', 'de', 'fr', 'pt', 'it', 'nl', 'id', 'vi', 'zh-CN', 'ru']

def url(lang, page):
    return ORIGIN + '/' + ('' if lang == 'ko' else lang + '/') + ('' if page == 'index.html' else page)

class VisibleSummary(HTMLParser):
    def __init__(self):
        super().__init__()
        self.capture = None
        self.parts = {'title': [], 'p': []}
        self.done = set()
    def handle_starttag(self, tag, attrs):
        if tag in self.parts and tag not in self.done:
            self.capture = tag
    def handle_endtag(self, tag):
        if tag == self.capture:
            self.done.add(tag)
            self.capture = None
    def handle_data(self, data):
        if self.capture:
            self.parts[self.capture].append(data)

for path in sorted(ROOT.rglob('*.html')):
    rel = path.relative_to(ROOT)
    lang = rel.parts[0] if len(rel.parts) > 1 else 'ko'
    if lang not in LOCALES:
        raise RuntimeError(f'Unexpected core locale: {rel}')
    text = path.read_text(encoding='utf-8')
    summary = VisibleSummary()
    summary.feed(text)
    title = ' '.join(''.join(summary.parts['title']).split())
    description = ' '.join(''.join(summary.parts['p']).split())
    if not title or not description:
        raise RuntimeError(f'Missing visible search summary: {rel}')
    canonical = url(lang, path.name)
    text = re.sub(r'<link\b[^>]*\brel=["\'](?:canonical|alternate)["\'][^>]*>', '', text, flags=re.I)
    links = f'<link rel="canonical" href="{canonical}">'
    links += ''.join(f'<link rel="alternate" hreflang="{other}" href="{url(other, path.name)}">' for other in LOCALES)
    links += f'<link rel="alternate" hreflang="x-default" href="{url("en", path.name)}">'
    text = text.replace('</head>', links + '</head>', 1)
    for attr, name, value in [('name', 'description', description), ('property', 'og:title', title),
                              ('property', 'og:description', description), ('property', 'og:url', canonical),
                              ('name', 'twitter:title', title), ('name', 'twitter:description', description)]:
        tag = f'<meta {attr}="{name}" content="{escape(value, quote=True)}">'
        pattern = rf'<meta\b(?=[^>]*\b{attr}=["\']{re.escape(name)}["\'])[^>]*>'
        text, count = re.subn(pattern, lambda _: tag, text, flags=re.I)
        if count == 0:
            text = text.replace('</head>', tag + '</head>', 1)
    def structured(match):
        data = json.loads(match.group(2))
        if data.get('@type') != 'WebApplication':
            raise RuntimeError(f'Unexpected structured-data type: {rel}')
        # Rebuild stable schema keys; broad upstream translation also corrupts keys.
        data = {'@context': 'https://schema.org', '@type': 'WebApplication', 'name': title,
                'url': canonical, 'description': description, 'applicationCategory': 'UtilitiesApplication',
                'operatingSystem': 'Any', 'inLanguage': lang, 'isAccessibleForFree': True}
        body = json.dumps(data, ensure_ascii=False, separators=(',', ':')).replace('<', '\\u003c')
        return match.group(1) + body + match.group(3)
    text = re.sub(r'(<script\b[^>]*type="application/ld\+json"[^>]*>)([\s\S]*?)(</script>)', structured, text)
    path.write_text(text, encoding='utf-8', newline='\n')
print('Normalized canonical, reciprocal hreflang, localized summaries and structured-data keys on 117 core pages')
