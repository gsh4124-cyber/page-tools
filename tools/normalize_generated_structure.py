from pathlib import Path
import ast
import re
import shutil

ROOT = Path('dist')
PAGES = ['index.html','checkup.html','mobile.html','keyboard.html','mouse.html','mic.html','webcam.html','speaker.html','display.html']
LOCALES = ['ja','es','de','fr','pt','it','nl','id','vi','zh-CN','ru']
BATCH2 = ['de','fr','pt','it','nl','id','vi']
CN_RU = ['zh-CN','ru']

TAG_RE = re.compile(r'<(?!/|!)([A-Za-z][\w:-]*)([^<>]*)>')
STRUCTURAL_ATTRS = ['id', 'class', 'for', 'name']


def attr_value(tag: str, name: str):
    m = re.search(rf'\s{name}="([^"]*)"', tag)
    return m.group(1) if m else None


def data_attrs(tag: str):
    return dict(re.findall(r'\s(data-[\w:-]+)="([^"]*)"', tag))


def set_attr(tag: str, name: str, value):
    pattern = re.compile(rf'(\s{name}=)"[^"]*"')
    if value is None:
        return pattern.sub('', tag)
    if pattern.search(tag):
        return pattern.sub(lambda m: f'{m.group(1)}"{value}"', tag, count=1)
    return tag[:-1] + f' {name}="{value}">' if tag.endswith('>') else tag


def restore_structure(canonical: str, localized: str, label: str) -> str:
    canon_tags = list(TAG_RE.finditer(canonical))
    local_tags = list(TAG_RE.finditer(localized))
    if len(canon_tags) != len(local_tags):
        raise RuntimeError(f'{label}: tag count diverged: canonical={len(canon_tags)} localized={len(local_tags)}')

    replacements = []
    for c, l in zip(canon_tags, local_tags):
        if c.group(1).lower() != l.group(1).lower():
            raise RuntimeError(f'{label}: tag order diverged: {c.group(1)} != {l.group(1)}')
        ctag = c.group(0)
        ltag = l.group(0)
        fixed = ltag
        for name in STRUCTURAL_ATTRS:
            fixed = set_attr(fixed, name, attr_value(ctag, name))
        cdata = data_attrs(ctag)
        ldata = data_attrs(fixed)
        for name in set(cdata) | set(ldata):
            fixed = set_attr(fixed, name, cdata.get(name))
        if fixed != ltag:
            replacements.append((l.start(), l.end(), fixed))

    for start, end, fixed in reversed(replacements):
        localized = localized[:start] + fixed + localized[end:]
    return localized


def literal_assignment(path: Path, name: str):
    tree = ast.parse(path.read_text(encoding='utf-8'), filename=str(path))
    for node in tree.body:
        if isinstance(node, ast.Assign) and any(isinstance(t, ast.Name) and t.id == name for t in node.targets):
            return ast.literal_eval(node.value)
    raise RuntimeError(f'{path}: literal assignment {name} not found')


def batch2_pairs(lang: str):
    tool = Path('tools/expand_batch2.py')
    extra = literal_assignment(tool, 'JS_EXTRA')
    gen = literal_assignment(tool, 'GEN')
    pairs = []
    for src, vals in extra.items():
        if lang in vals:
            pairs.append((src, vals[lang]))
    pairs.extend(gen.get(lang, []))
    return sorted(pairs, key=lambda x: len(x[0]), reverse=True)


def cn_ru_pairs(lang: str):
    phrases = literal_assignment(Path('tools/append_cn_ru.py'), 'JS_PHRASES')
    return sorted([(src, vals[lang]) for src, vals in phrases.items() if lang in vals], key=lambda x: len(x[0]), reverse=True)


def rebuild_js_from_canonical(lang: str, filename: str):
    canonical_path = ROOT / 'en' / filename
    target = ROOT / lang / filename
    if not canonical_path.exists() or not target.exists():
        return
    text = canonical_path.read_text(encoding='utf-8')
    pairs = batch2_pairs(lang) if lang in BATCH2 else cn_ru_pairs(lang)
    for src, translated in pairs:
        text = text.replace(src, translated)
    target.write_text(text, encoding='utf-8')


# Raw localization must never be allowed to alter DOM structure. Restore ids,
# classes, names and data attributes from the canonical English markup while
# preserving visible translated text.
for page in PAGES:
    canonical_path = ROOT / 'en' / page
    if not canonical_path.exists():
        continue
    canonical = canonical_path.read_text(encoding='utf-8')
    for locale in LOCALES:
        path = ROOT / locale / page
        if not path.exists():
            continue
        text = path.read_text(encoding='utf-8')
        text = restore_structure(canonical, text, f'{locale}/{page}')
        path.write_text(text, encoding='utf-8')

# Batch2 and zh-CN/ru generators historically translated whole JS files. Rebuild
# those scripts from the canonical English code and apply only explicit
# user-facing runtime phrases. This keeps selectors, ids and program identifiers
# byte-for-byte canonical while retaining localized status/error messages.
for locale in BATCH2 + CN_RU:
    for filename in ['app.js', 'mobile.js']:
        rebuild_js_from_canonical(locale, filename)

# The shared experience runtime is deliberately not machine-translated. It only
# exposes its enhanced UI on the Korean canonical pages, while its host redirect
# is safe for every locale. Copy the same verified runtime beside every localized
# HTML file so relative script references remain valid on both Cloudflare and the
# legacy GitHub Pages surface.
experience = Path('device-experience.js')
if not experience.exists():
    raise RuntimeError('device-experience.js missing from source')
for folder in [ROOT, ROOT/'en', *[ROOT/locale for locale in LOCALES]]:
    folder.mkdir(parents=True, exist_ok=True)
    shutil.copy2(experience, folder/'device-experience.js')

print('Restored canonical DOM structure, rebuilt localized JS safely, and shipped shared DEVICE CHECKUP experience runtime')