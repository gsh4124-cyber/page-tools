"""Record a deployable artifact's source commit and public file digests."""
from pathlib import Path
import hashlib
import json
import os
import re
import shutil
import struct
import subprocess

def publish_favicon(product, dist):
    """Keep the conventional crawler URL and HTML icon declaration available."""
    source = Path(__file__).resolve().parents[1] / product / 'favicon.ico'
    data = source.read_bytes()
    # The ICO wraps the existing product logo PNG without changing its pixels.
    if len(data) < 46 or struct.unpack_from('<HHH', data) != (0, 1, 1):
        raise RuntimeError(f'{product}: invalid favicon ICO directory')
    width, height, colors, reserved, planes, bits, size, offset = struct.unpack_from('<BBBBHHII', data, 6)
    width, height = width or 256, height or 256
    png = data[offset:offset + size]
    if (colors != 0 or reserved != 0 or planes != 1 or bits != 32 or offset != 22
            or len(png) != size or len(data) != offset + size
            or png[:8] != b'\x89PNG\r\n\x1a\n'
            or struct.unpack_from('>II', png, 16) != (width, height)
            or width != height or width < 48):
        raise RuntimeError(f'{product}: invalid favicon PNG payload')
    shutil.copyfile(source, dist / 'favicon.ico')
    link = f'<link rel="icon" href="/favicon.ico" type="image/x-icon" sizes="{width}x{height}">'
    for page in dist.rglob('*.html'):
        # Separate demo products retain their own branding.
        if page.relative_to(dist).parts[0] in {'refundproof', 'proofrail', 'finalcheck'}:
            continue
        text = page.read_text(encoding='utf-8')
        if re.search(r'<head(?:\s[^>]*)?>', text, flags=re.I):
            if 'href="/favicon.ico"' not in text:
                # Keep an existing SVG icon later in the head as the browser's
                # preferred vector icon, while exposing the ICO to other clients.
                text = re.sub(r'(<head(?:\s[^>]*)?>)', lambda m: m[1] + '\n' + link,
                              text, count=1, flags=re.I)
                page.write_text(text, encoding='utf-8', newline='\n')

def write_metadata(product, dist):
    revision = os.environ.get('CF_PAGES_COMMIT_SHA') or os.environ.get('GITHUB_SHA')
    if not revision:
        revision = subprocess.check_output(['git', 'rev-parse', 'HEAD'], text=True).strip()
    if not re.fullmatch(r'[0-9a-f]{40}', revision):
        raise RuntimeError('A full source commit is required')
    publish_favicon(product, dist)
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
