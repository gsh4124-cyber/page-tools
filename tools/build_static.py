"""Validated production entry point for the two unbundled static products."""
from pathlib import Path
import os
import shutil
import subprocess
import sys
from release_metadata import clean_dist, write_metadata

product = sys.argv[1] if len(sys.argv) == 2 else ''
if product not in {'random-ppobgi', 'bible-reader'}:
    raise SystemExit('Usage: python3 tools/build_static.py random-ppobgi|bible-reader')
root = Path(__file__).resolve().parents[1] / product
os.chdir(root)
def run(*args):
    subprocess.run(args, check=True)
def require(path, *tokens):
    text = (root / path).read_text(encoding='utf-8')
    for token in tokens:
        if token not in text:
            raise RuntimeError(f'{path}: missing {token}')

run(sys.executable, 'security_guardrails.py')
for path in sorted(root.rglob('*.js')):
    rel = path.relative_to(root)
    if not any(p.startswith('.') or p in {'dist', 'node_modules', 'qa_evidence'} for p in rel.parts):
        run('node', '--check', str(path))
if product == 'random-ppobgi':
    run('node', '--test', *[str(p) for p in sorted((root / 'tests').glob('*.test.mjs'))])
    for lang in 'en ja es zh fr de pt id hi pl it nl tr vi th ar'.split():
        require('locales.js', f'{lang}:{{')
        require(f'{lang}/index.html', 'rel="canonical"', '/full-app-loader.js')
        require('sitemap.xml', f'<loc>https://random-ppobgi.pages.dev/{lang}/</loc>')
    require('locales.js', 'window.RandomPickerLocales=P')
    require('functions/_middleware.js', 'hreflang', 'x-default', 'canonical')
else:
    for name in ['validate-i18n', 'validate-navigation', 'validate-search-progress', 'validate-scripture']:
        run('node', f'tools/{name}.mjs')
    for lang in 'en fr de zh ru la pt ar'.split():
        require(f'{lang}/index.html', f'hreflang="{lang}"',
                f'rel="canonical" href="https://bible-reader-1iz.pages.dev/{lang}/"',
                '<main id="entry-fallback"', '<h1>', '<p class="entry-summary"', 'href="/?translation=')
        require('sitemap.xml', f'<loc>https://bible-reader-1iz.pages.dev/{lang}/</loc>')
origin = 'https://' + ('random-ppobgi' if product == 'random-ppobgi' else 'bible-reader-1iz') + '.pages.dev'
require('sitemap.xml', f'<loc>{origin}/</loc>')
require('robots.txt', f'Sitemap: {origin}/sitemap.xml')
dist = clean_dist(root)
for path in root.rglob('*'):
    rel = path.relative_to(root)
    if any(p.startswith('.') or p in {'dist', 'tests', 'tools', 'functions', 'migrations', 'node_modules', 'qa_evidence'} for p in rel.parts):
        continue
    if path.is_file() and (path.suffix in {'.html', '.js', '.css', '.svg', '.png', '.txt', '.xml'} or
                          (product == 'bible-reader' and rel.parts[0] == 'scripture' and path.suffix == '.json')):
        target = dist / rel
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(path, target)
write_metadata(product, dist)
