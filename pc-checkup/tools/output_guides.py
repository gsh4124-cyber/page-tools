"""Render tool-specific interpretation after the existing interactive controls."""
from html import escape
from pathlib import Path
import json


def add_output_guide(text, locale, page):
    content = json.loads(Path(__file__).with_name('output_guides.json').read_text(encoding='utf-8'))
    item = content[locale][page]
    guide_id = page.removesuffix('.html') + '-interpretation'
    if f'id="{guide_id}"' in text or text.count('</main>') != 1:
        raise RuntimeError(f'Unexpected guide boundary: {locale}/{page}')
    guide = f'<section id="{guide_id}" class="section" aria-labelledby="{guide_id}-title"><div class="wrap">'
    guide += f'<h2 id="{guide_id}-title">{escape(item["title"])}</h2><div class="grid">'
    for title, paragraph in item['sections']:
        guide += f'<article class="card"><h3>{escape(title)}</h3><p>{escape(paragraph)}</p></article>'
    guide += '</div></div></section>'
    return text.replace('</main>', guide + '</main>', 1)
