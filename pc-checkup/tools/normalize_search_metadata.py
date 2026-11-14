"""Restore machine-readable locale metadata after historical text translation."""
from html import escape
from html.parser import HTMLParser
from pathlib import Path
import json
import re
from mic_guide import add_mic_guide

ROOT = Path('dist')
ORIGIN = 'https://pc-checkup.pages.dev'
LOCALES = ['ko', 'en', 'ja', 'es', 'de', 'fr', 'pt', 'it', 'nl', 'id', 'vi', 'zh-CN', 'ru']
LANGUAGE_NAMES = {'ko':'한국어','en':'English','ja':'日本語','es':'Español','de':'Deutsch','fr':'Français',
                  'pt':'Português','it':'Italiano','nl':'Nederlands','id':'Bahasa Indonesia','vi':'Tiếng Việt',
                  'zh-CN':'简体中文','ru':'Русский'}
DIRECTORY_STYLE = '''<style id="language-directory-style">
.language-directory{margin-top:12px;text-align:start}.language-directory summary{width:fit-content;min-height:44px;padding:12px 0;cursor:pointer;font-size:13px}.language-directory nav{display:flex;flex-wrap:wrap;gap:4px}.language-directory a{display:inline-flex;align-items:center;min-height:44px;padding:8px 10px;border-radius:10px;color:inherit;font-size:12px;text-decoration:none}.language-directory a:hover,.language-directory a:focus-visible{background:var(--line)}.language-directory a[aria-current]{font-weight:800;text-decoration:underline}
</style>'''
PRIVACY_LABELS = {'ko':'개인정보처리방침','en':'Privacy Policy','ja':'プライバシーポリシー',
                  'es':'Privacidad','de':'Datenschutz','fr':'Confidentialité','pt':'Privacidade',
                  'it':'Privacy','nl':'Privacybeleid','id':'Privasi','vi':'Quyền riêng tư',
                  'zh-CN':'隐私政策','ru':'Конфиденциальность'}

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
    if path.name == 'mic.html':
        text = add_mic_guide(text, lang)
    privacy = (f'<p class="privacy-policy-link"><a href="/privacy/#{"ko" if lang == "ko" else "en"}" '
               f'style="display:inline-block;min-height:44px;padding:10px 0;color:inherit">{PRIVACY_LABELS[lang]}</a></p>')
    if text.count('</footer>') != 1:
        raise RuntimeError(f'Missing or duplicated footer: {rel}')
    # Select options are not crawlable links. Keep ordinary same-page locale
    # links in the initial HTML so discovery does not depend on sitemap processing.
    directory = '<details class="language-directory"><summary>🌐 ' + LANGUAGE_NAMES[lang] + '</summary>'
    directory += '<nav aria-label="' + LANGUAGE_NAMES[lang] + '">'
    for other in LOCALES:
        current = ' aria-current="page"' if other == lang else ''
        directory += (f'<a href="{url(other, path.name)}" hreflang="{other}" lang="{other}" dir="auto"{current}>'
                      f'{LANGUAGE_NAMES[other]}</a>')
    directory += '</nav></details>'
    text = text.replace('</footer>', privacy + directory + '</footer>', 1)
    text = text.replace('</head>', DIRECTORY_STYLE + '</head>', 1)
    if lang == 'ko' and path.name == 'index.html':
        text = re.sub(r'<title>[\s\S]*?</title>', '<title>기기 점검 | PC·노트북·휴대폰 5분 검사 - DEVICE CHECKUP</title>', text, count=1)
        text = re.sub(r'<h1>[\s\S]*?</h1>', '<h1>기기 점검<br>PC·휴대폰 5분 검사</h1>', text, count=1)
        text = re.sub(r'(<section class="hero">[\s\S]*?<p>)[\s\S]*?(</p>)', r'\1설치·가입 없이 PC·휴대폰의 화면, 터치, 소리, 카메라 등 기본 기능을 확인하세요.\2', text, count=1)
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
# The home gained static language links and clearer entry content on November 5.
last_modified = {ORIGIN+'/': '2026-11-05', ORIGIN+'/checkup': '2026-11-04', ORIGIN+'/mobile': '2026-11-04'}
last_modified.update({url(lang, 'mic.html'): '2026-11-14' for lang in LOCALES})
(ROOT / 'sitemap.xml').write_text(
    '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    + ''.join(f'  <url><loc>{escape(address)}</loc>' + (f'<lastmod>{last_modified[address]}</lastmod>' if address in last_modified else '') + '</url>\n' for address in canonical_urls)
    + '</urlset>\n', encoding='utf-8', newline='\n')
print('Normalized canonical, reciprocal hreflang, localized summaries and structured-data keys on 117 core pages')
