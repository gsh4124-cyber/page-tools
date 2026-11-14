"""Add task-specific, localized interpretation to the existing microphone tool."""
from html import escape
from pathlib import Path
import json


def add_mic_guide(text, locale):
    content = json.loads(Path(__file__).with_name('mic_guide.json').read_text(encoding='utf-8'))
    item = content[locale]
    if 'id="microphone-guide"' in text:
        raise RuntimeError('Microphone guide already present')
    guide = '<section id="microphone-guide" class="section" aria-labelledby="microphone-guide-title"><div class="wrap">'
    guide += '<h2 id="microphone-guide-title">' + escape(item['title']) + '</h2><div class="grid">'
    for title, paragraphs in item['sections']:
        guide += '<article class="card"><h3>' + escape(title) + '</h3>'
        guide += ''.join('<p>' + escape(paragraph) + '</p>' for paragraph in paragraphs)
        guide += '</article>'
    guide += '</div></div></section>'
    if text.count('</main>') != 1:
        raise RuntimeError('Microphone guide requires one main boundary')
    return text.replace('</main>', guide + '</main>', 1)
