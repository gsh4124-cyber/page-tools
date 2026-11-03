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
# Preserve published competition/demo URLs at their existing host boundaries.
for name in ['refundproof', 'proofrail', 'finalcheck']:
    shutil.copytree(ROOT / name, dist / name, dirs_exist_ok=True)
print(f'Production package ready: {revision}; core 117 pages and legacy URL assets preserved')
