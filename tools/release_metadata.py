"""Record a deployable artifact's source commit and public file digests."""
from pathlib import Path
import hashlib
import json
import os
import re
import subprocess

def write_metadata(product, dist):
    revision = os.environ.get('CF_PAGES_COMMIT_SHA') or os.environ.get('GITHUB_SHA')
    if not revision:
        revision = subprocess.check_output(['git', 'rev-parse', 'HEAD'], text=True).strip()
    if not re.fullmatch(r'[0-9a-f]{40}', revision):
        raise RuntimeError('A full source commit is required')
    # Stable bytes across Windows development, GitHub CI, and Cloudflare Linux.
    for path in dist.rglob('*'):
        if path.is_file() and path.suffix in {'.html', '.js', '.css', '.txt', '.xml', '.svg'}:
            path.write_text(path.read_text(encoding='utf-8'), encoding='utf-8', newline='\n')
    (dist / 'build-revision.txt').write_text(revision + '\n', encoding='utf-8', newline='\n')
    files = {p.relative_to(dist).as_posix(): hashlib.sha256(p.read_bytes()).hexdigest()
             for p in sorted(dist.rglob('*')) if p.is_file() and p.name != 'build-manifest.json'}
    manifest = {'product': product, 'source_revision': revision, 'files': files}
    (dist / 'build-manifest.json').write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8', newline='\n')
    print(f'Production artifact: {product}, {revision}, {len(files)} files')

def clean_dist(root):
    import shutil
    dist = root / 'dist'
    if dist.is_symlink() or dist.resolve() != root.resolve() / 'dist':
        raise RuntimeError('Refusing to clean a dist path outside the product')
    if dist.exists():
        shutil.rmtree(dist)
    dist.mkdir()
    return dist
