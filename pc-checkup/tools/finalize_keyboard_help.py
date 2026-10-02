from pathlib import Path
import re

ROOT = Path('dist')
KEYBOARDS = sorted(ROOT.glob('keyboard.html')) + sorted(ROOT.glob('*/keyboard.html'))

SIDE_DETAILS_RE = re.compile(
    r'<details class="notice side-help">\s*<summary>([\s\S]*?)</summary>\s*<div class="side-help-body">([\s\S]*?)</div>\s*</details>',
    re.I,
)
LEGACY_FN_RE = re.compile(
    r'(<div class="keyboard-actions">[\s\S]*?<button id="fnArm"[\s\S]*?</div>)\s*<p class="keyboard-note">[\s\S]*?</p>',
    re.I,
)

changed = []
for path in KEYBOARDS:
    text = path.read_text(encoding='utf-8')

    # Remove retired finalizer CSS if present.
    text = re.sub(
        r'\n<style>\n/\* keyboard-help-final-v[0-9]+ \*/[\s\S]*?</style>\n(?=</head>)',
        '\n',
        text,
        count=1,
    )

    # Product-wide consistency rule: sidebar help stays visible on every test page.
    text = SIDE_DETAILS_RE.sub(
        lambda m: '<div class="notice"><strong>' + m.group(1).strip() + '</strong><br>' + m.group(2).strip() + '</div>',
        text,
        count=1,
    )

    # Keep only the newer contextual modifier/Fn help; remove the old duplicate Fn paragraph.
    text, legacy_count = LEGACY_FN_RE.subn(r'\1', text, count=1)
    if legacy_count != 1:
        raise RuntimeError(f'Could not remove legacy Fn paragraph: {path}')

    if '<details class="keyboard-help">' not in text:
        raise RuntimeError(f'Contextual modifier/Fn help missing: {path}')
    if '<details class="notice side-help">' in text:
        raise RuntimeError(f'Sidebar help must remain visible, not collapsible: {path}')
    if '<aside class="side">' not in text or '<div class="notice"><strong>' not in text:
        raise RuntimeError(f'Visible sidebar notice missing: {path}')

    path.write_text(text, encoding='utf-8')
    changed.append(path)

if len(changed) != 13:
    raise RuntimeError(f'Expected 13 keyboard pages, finalized {len(changed)}')

print(f'Kept keyboard sidebar help visible on {len(changed)} locale pages; removed duplicate always-visible Fn paragraph')
