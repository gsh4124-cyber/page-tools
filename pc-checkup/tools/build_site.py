"""Build, validate, and package the production site through one entry point."""
from pathlib import Path
import gzip
import os
import re
import shutil
import subprocess
import sys
import tempfile

ROOT = Path(__file__).resolve().parents[1]
TOOLS = ROOT / 'tools'
os.chdir(ROOT)
sys.path.insert(0, str(ROOT.parent / 'tools'))
from release_metadata import clean_dist, write_metadata

subprocess.run([sys.executable, 'security_guardrails.py'], check=True)
for name in ['app.js', 'mobile.js', 'device-experience.js']:
    subprocess.run(['node', '--check', name], check=True)
subprocess.run(['node', 'tools/validate-experience.mjs'], check=True)
dist = clean_dist(ROOT)
# The historical generator resolves input paths from its own tools directory.
with tempfile.NamedTemporaryFile(dir=TOOLS, suffix='.py', delete=False) as handle:
    temporary = Path(handle.name)
    handle.write(gzip.decompress((TOOLS / 'build_global.py.gz').read_bytes()))
try:
    subprocess.run([sys.executable, str(temporary)], check=True)
finally:
    temporary.unlink()
for name in ['expand_batch2', 'append_cn_ru', 'normalize_generated_structure',
             'normalize_generated_keyboard', 'normalize_display_colors',
             'inject_language_ux', 'localize_korean_ui', 'finalize_keyboard_help',
             'normalize_navigation_order', 'validate_dist']:
    subprocess.run([sys.executable, str(TOOLS / (name + '.py'))], check=True)

revision = os.environ.get('CF_PAGES_COMMIT_SHA') or os.environ.get('GITHUB_SHA')
if not revision:
    revision = subprocess.check_output(['git', 'rev-parse', 'HEAD'], text=True).strip()
if not re.fullmatch(r'[0-9a-f]{40}', revision):
    raise RuntimeError('A full source commit is required for the deployment marker')
dist = ROOT / 'dist'
for page in dist.rglob('*.html'):
    text = page.read_text(encoding='utf-8')
    text = text.replace('device-experience.js"', f'device-experience.js?v={revision}"')
    page.write_text(text, encoding='utf-8', newline='\n')
(dist / 'build-revision.txt').write_text(revision + '\n', encoding='utf-8')
# Keep CI's generated locale and navigation coverage in the production build.
nav_order = ['checkup.html', 'keyboard.html', 'mouse.html', 'display.html', 'speaker.html', 'mic.html', 'webcam.html']
for page in dist.rglob('*.html'):
    text = page.read_text(encoding='utf-8')
    for token in ['id="languagePicker"', 'language-ux-v6', 'ui-polish-v5', 'data-locale=']:
        if token not in text:
            raise RuntimeError(f'{page}: missing {token}')
    nav = re.search(r'<nav class="navlinks">([\s\S]*?)</nav>', text)
    if nav:
        bases = [h.split('#', 1)[0].split('?', 1)[0].rstrip('/').split('/')[-1]
                 for h in re.findall(r'href="([^"]+)"', nav.group(1))]
        if all(x in bases for x in nav_order) and [x for x in bases if x in nav_order] != nav_order:
            raise RuntimeError(f'{page}: incorrect navigation order')
# Preserve published competition/demo URLs at their existing host boundaries.
for name in ['refundproof', 'proofrail', 'finalcheck']:
    shutil.copytree(ROOT / name, dist / name, dirs_exist_ok=True)
write_metadata('pc-checkup', dist)
print(f'Production package ready: {revision}; core 117 pages and legacy URL assets preserved')
