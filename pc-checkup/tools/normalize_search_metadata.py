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
    # Pages permanently redirects *.html to the extensionless route. Advertise
    # the final HTTP-200 URL consistently in canonical, alternates and sitemap.
    suffix = '' if page == 'index.html' else page.removesuffix('.html')
    return ORIGIN + '/' + ('' if lang == 'ko' else lang + '/') + suffix

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

pages = sorted(ROOT.rglob('*.html'))
canonical_urls = []
for path in pages:
    rel = path.relative_to(ROOT)
    lang = rel.parts[0] if len(rel.parts) > 1 else 'ko'
    if lang not in LOCALES:
        raise RuntimeError(f'Unexpected core locale: {rel}')
    text = path.read_text(encoding='utf-8')
    if lang == 'ko' and path.name == 'index.html':
        text = re.sub(r'<title>[\s\S]*?</title>', '<title>기기 점검 | PC·노트북·휴대폰 5분 검사 - DEVICE CHECKUP</title>', text, count=1)
        text = re.sub(r'<h1>[\s\S]*?</h1>', '<h1>기기 점검<br>PC·휴대폰 5분 검사</h1>', text, count=1)
        text = re.sub(r'(<section class="hero">[\s\S]*?<p>)[\s\S]*?(</p>)', r'\1기기 점검을 설치·가입 없이 시작하세요. PC와 휴대폰의 키보드, 마우스, 화면, 스피커, 마이크, 카메라를 현재 기기의 브라우저에서 확인할 수 있습니다.\2', text, count=1)
        guide = Path(__file__).with_name('search_home_ko.html').read_text(encoding='utf-8')
        if 'id="device-guide"' not in text:
            text = text.replace('</main>', guide + '</main>', 1)
    if lang == 'ko' and path.name in {'checkup.html', 'mobile.html'}:
        heading = {'checkup.html': 'PC·노트북 기기 점검', 'mobile.html': '휴대폰 기기 점검'}[path.name]
        text = re.sub(r'<title>[\s\S]*?</title>', f'<title>{heading} | 기본 기능 검사 - DEVICE CHECKUP</title>', text, count=1)
        text = re.sub(r'<h1>[\s\S]*?</h1>', f'<h1>{heading}</h1>', text, count=1)
        guide = Path(__file__).with_name('search_' + path.stem + '_ko.html').read_text(encoding='utf-8')
        if 'id="device-flow-guide"' not in text:
            text = text.replace('</main>', guide + '</main>', 1)
    summary = VisibleSummary()
    summary.feed(text)
    title = ' '.join(''.join(summary.parts['title']).split())
    description = ' '.join(''.join(summary.parts['p']).split())
    if not title or not description:
        raise RuntimeError(f'Missing visible search summary: {rel}')
    canonical = url(lang, path.name)
    canonical_urls.append(canonical)
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
# These dates identify the changed Korean documents, not the current build time.
(ROOT / 'sitemap.xml').write_text(
    '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    + ''.join(f'  <url><loc>{escape(address)}</loc>' + ('<lastmod>2026-11-04</lastmod>' if address in {ORIGIN+'/', ORIGIN+'/checkup', ORIGIN+'/mobile'} else '') + '</url>\n' for address in canonical_urls)
    + '</urlset>\n', encoding='utf-8', newline='\n')
print('Normalized canonical, reciprocal hreflang, localized summaries and structured-data keys on 117 core pages')
