"""Give HTML-referenced JS/CSS content-addressed URLs that browsers may cache for a year.

Each local script/stylesheet referenced from a built HTML page is copied to
/static/<content hash>/<name> and the page is pointed at that copy. A change in
content always produces a new URL, so a long immutable cache can never mix an old
script with a new page. The original files stay at their usual paths (still
revalidated on every visit) for anything that loads them by name at runtime,
such as request-time HTML rewriting or loader scripts.
"""
from pathlib import Path, PurePosixPath
import hashlib
import re

STATIC_DIR = 'static'
HEADERS = f"""/{STATIC_DIR}/*
  Cache-Control: public, max-age=31536000, immutable
"""
# src="..." / href="..." pointing at a local .js/.css file with no query or fragment.
REF = re.compile(r'(\s(?:src|href)=")(?![a-z][a-z0-9+.-]*:|//)([^"?#]+\.(?:js|css))(")', re.I)


def _normalized_bytes(path):
    # release_metadata.write_metadata later rewrites text files with LF endings;
    # hash and copy the same bytes so the URL matches what is actually served.
    return path.read_text(encoding='utf-8').replace('\r\n', '\n').encode('utf-8')


def fingerprint_assets(dist):
    dist = Path(dist)
    if (dist / STATIC_DIR).exists():
        raise RuntimeError(f'{dist}: {STATIC_DIR}/ is reserved for fingerprinted assets')
    published = {}

    def publish(source):
        rel = source.relative_to(dist).as_posix()
        if rel not in published:
            data = _normalized_bytes(source)
            digest = hashlib.sha256(data).hexdigest()[:12]
            target = dist / STATIC_DIR / digest / source.name
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(data)
            published[rel] = f'/{STATIC_DIR}/{digest}/{source.name}'
        return published[rel]

    rewritten = 0
    for page in sorted(dist.rglob('*.html')):
        if STATIC_DIR in page.relative_to(dist).parts:
            continue
        text = page.read_text(encoding='utf-8')
        page_dir = PurePosixPath('/' + page.relative_to(dist).as_posix()).parent

        def replace(match):
            nonlocal rewritten
            url = match[2]
            resolved = PurePosixPath(url if url.startswith('/') else str(page_dir / url))
            parts = []
            for part in resolved.parts[1:]:
                if part == '..':
                    if not parts:
                        raise RuntimeError(f'{page}: {url} points outside the site')
                    parts.pop()
                elif part != '.':
                    parts.append(part)
            source = dist.joinpath(*parts)
            if not source.is_file():
                raise RuntimeError(f'{page.relative_to(dist)}: referenced asset {url} is not in the build')
            rewritten += 1
            return match[1] + publish(source) + match[3]

        updated = REF.sub(replace, text)
        leftover = [m[2] for m in REF.finditer(updated) if not m[2].startswith(f'/{STATIC_DIR}/')]
        if leftover:
            raise RuntimeError(f'{page.relative_to(dist)}: unfingerprinted assets {leftover}')
        if updated != text:
            page.write_text(updated, encoding='utf-8', newline='\n')

    (dist / '_headers').write_text(HEADERS, encoding='utf-8', newline='\n')
    print(f'Fingerprinted {len(published)} assets across {rewritten} HTML references')
