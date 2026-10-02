from pathlib import Path
import re
import subprocess
import tempfile
import sys
import os

ROOT = Path('dist')
PROD_ORIGIN = 'https://pc-checkup.pages.dev'
OLD_ORIGIN = 'https://gsh4124-cyber.github.io/pc-checkup'
PAGES = ['index.html','checkup.html','mobile.html','keyboard.html','mouse.html','mic.html','webcam.html','speaker.html','display.html']
LOCALES = ['ko','en','ja','es','de','fr','pt','it','nl','id','vi','zh-CN','ru']
DIRS = {'ko': ROOT, **{x: ROOT/x for x in LOCALES if x != 'ko'}}
errors = []


def err(path, kind, detail=''):
    errors.append(f'{path}: {kind}{": " + detail if detail else ""}')

# Cloudflare Pages exposes the source revision in CF_PAGES_COMMIT_SHA. Persist it
# into the deployed artifact so production QA can prove it is testing the exact
# commit that Cloudflare published. GitHub Pages writes its own marker later in
# its workflow, so this is safe in both environments.
cf_revision = os.environ.get('CF_PAGES_COMMIT_SHA', '').strip()
if cf_revision:
    if not re.fullmatch(r'[0-9a-f]{40}', cf_revision):
        err('build-revision.txt', 'invalid CF_PAGES_COMMIT_SHA', cf_revision)
    else:
        (ROOT/'build-revision.txt').write_text(cf_revision + '\n', encoding='utf-8')

# Required 13 languages × 9 HTML pages.
for lang, folder in DIRS.items():
    for page in PAGES:
        if not (folder/page).exists():
            err(f'{lang}/{page}', 'missing page')

html_files = sorted(ROOT.rglob('*.html'))
if len(html_files) != 117:
    err('dist', 'HTML count', f'expected 117, got {len(html_files)}')

# Sitemap must contain exactly one URL per indexable HTML page and use the
# Cloudflare production origin only.
sitemap = (ROOT/'sitemap.xml').read_text(encoding='utf-8') if (ROOT/'sitemap.xml').exists() else ''
loc_count = sitemap.count('<loc>')
if loc_count != 117:
    err('sitemap.xml', 'URL count', f'expected 117, got {loc_count}')
if OLD_ORIGIN in sitemap:
    err('sitemap.xml', 'old GitHub Pages origin present')
for loc in re.findall(r'<loc>([^<]+)</loc>', sitemap):
    if not loc.startswith(PROD_ORIGIN + '/'):
        err('sitemap.xml', 'non-production URL', loc)

robots = (ROOT/'robots.txt').read_text(encoding='utf-8') if (ROOT/'robots.txt').exists() else ''
if f'Sitemap: {PROD_ORIGIN}/sitemap.xml' not in robots:
    err('robots.txt', 'production sitemap reference missing')
if OLD_ORIGIN in robots:
    err('robots.txt', 'old GitHub Pages origin present')

for path in html_files:
    rel = path.relative_to(ROOT)
    text = path.read_text(encoding='utf-8')

    ids = re.findall(r'\bid="([^"]+)"', text)
    dup = sorted({x for x in ids if ids.count(x) > 1})
    if dup:
        err(str(rel), 'duplicate IDs', ', '.join(dup))

    for attr, value in re.findall(r'\b(href|src)="([^"]+)"', text):
        if not value or value.startswith(('http://','https://','#','mailto:','tel:','data:','javascript:')):
            continue
        clean = value.split('#',1)[0].split('?',1)[0]
        if not clean:
            continue
        target = (path.parent/clean).resolve()
        try:
            target.relative_to(ROOT.resolve())
        except ValueError:
            continue
        if not target.exists():
            err(str(rel), 'missing internal reference', value)

    if 'rel="canonical"' not in text:
        err(str(rel), 'missing canonical')
    if 'hreflang="x-default"' not in text:
        err(str(rel), 'missing x-default hreflang')
    if OLD_ORIGIN in text:
        err(str(rel), 'old GitHub Pages origin present')

    canon = re.search(r'<link[^>]+rel="canonical"[^>]+href="([^"]+)"', text, re.I)
    if canon and not canon.group(1).startswith(PROD_ORIGIN + '/'):
        err(str(rel), 'canonical not on production origin', canon.group(1))

    if rel.parts and rel.parts[0] in {x for x in LOCALES if x != 'ko'}:
        clean = text.replace('한국어','')
        if re.search(r'[가-힣]', clean):
            err(str(rel), 'KOREAN_LEAK')

    scripts = []
    for m in re.finditer(r'<script([^>]*)>(.*?)</script>', text, re.S|re.I):
        attrs, body = m.group(1), m.group(2)
        if re.search(r'\bsrc=', attrs, re.I):
            continue
        if re.search(r'type=["\']application/ld\+json["\']', attrs, re.I):
            continue
        if body.strip():
            scripts.append(body)
    if scripts:
        with tempfile.NamedTemporaryFile('w', suffix='.js', encoding='utf-8', delete=False) as f:
            f.write('\n'.join(scripts))
            tmp = f.name
        result = subprocess.run(['node','--check',tmp],capture_output=True,text=True)
        Path(tmp).unlink(missing_ok=True)
        if result.returncode:
            err(str(rel), 'inline JS syntax', result.stderr.splitlines()[0] if result.stderr else 'node --check failed')

for path in sorted(list(ROOT.rglob('app.js')) + list(ROOT.rglob('mobile.js'))):
    result = subprocess.run(['node','--check',str(path)],capture_output=True,text=True)
    if result.returncode:
        err(str(path.relative_to(ROOT)), 'JS syntax', result.stderr.splitlines()[0] if result.stderr else 'node --check failed')

for lang, folder in DIRS.items():
    path = folder/'keyboard.html'
    if not path.exists():
        continue
    text = path.read_text(encoding='utf-8')
    rel = str(path.relative_to(ROOT))
    for required in [
        'id="startKeyboard"','id="exitKeyboard"','id="resetKeyboard"','id="fnArm"',
        'id="fnEvidenceStatus"','fitKeyboard','fnArmed','MetaLeft','MetaRight',
        'keyboard-runtime-helper-v6','window.__pcKeyboardEvidence',
        "modifierEvidence[family][verified]='direct'",
        "modifierEvidence[family][inferred]='assisted'",
        "fnEvidence.state='unavailable'",
        "fnEvidence.state='confirmed'",
        "class=\"keyboard-help\"",
    ]:
        if required not in text:
            err(rel, 'keyboard invariant missing', required)
    for forbidden in ['ShiftUnknown','shiftArm','initKeyboard','fn-evidence faulty','fn-evidence failed']:
        if re.search(rf'\b{re.escape(forbidden)}\b', text):
            err(rel, 'obsolete or unsafe keyboard path present', forbidden)
    if 'fn-evidence.unavailable' not in text or 'fn-evidence.recheck' not in text or 'fn-evidence.detected' not in text:
        err(rel, 'Fn result-state palette incomplete')
    if lang == 'ko':
        for phrase in ['Fn 조합 확인','키보드 고장을 의미하지 않습니다','문제가 있을 때만 보기']:
            if phrase not in text:
                err(rel, 'Korean keyboard UX invariant missing', phrase)

for lang, folder in DIRS.items():
    for page in ['index.html','checkup.html','mobile.html']:
        text = (folder/page).read_text(encoding='utf-8')
        if text.count('data-ad-slot=') != 1:
            err(str((folder/page).relative_to(ROOT)), 'ad slot count', f'expected 1, got {text.count("data-ad-slot=")}')
    for page in ['keyboard.html','mouse.html','mic.html','webcam.html','speaker.html','display.html']:
        text = (folder/page).read_text(encoding='utf-8')
        if 'data-ad-slot=' in text:
            err(str((folder/page).relative_to(ROOT)), 'ad slot inside individual test')

for path in list(ROOT.rglob('*.js')) + html_files:
    text = path.read_text(encoding='utf-8')
    for token in ['XMLHttpRequest','WebSocket','sendBeacon','googletagmanager','google-analytics']:
        if token in text:
            err(str(path.relative_to(ROOT)), 'unexpected runtime network/analytics token', token)

if errors:
    print('\n'.join('ERROR ' + x for x in errors))
    print(f'Validation failed: {len(errors)} issue(s)')
    sys.exit(2)

print(f'Validation PASS: {len(html_files)} HTML, {loc_count} sitemap URLs, {len(LOCALES)} locales, Cloudflare production origin and keyboard Fn/modifier evidence invariants PASS')
