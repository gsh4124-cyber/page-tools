from pathlib import Path
import re

ROOT = Path('dist')

LABELS = {
    'ko': {'white':'흰색','black':'검정','red':'빨강','green':'초록','blue':'파랑','gray':'회색','yellow':'노랑','cyan':'청록'},
    'en': {'white':'White','black':'Black','red':'Red','green':'Green','blue':'Blue','gray':'Gray','yellow':'Yellow','cyan':'Cyan'},
    'ja': {'white':'白','black':'黒','red':'赤','green':'緑','blue':'青','gray':'グレー','yellow':'黄色','cyan':'シアン'},
    'es': {'white':'Blanco','black':'Negro','red':'Rojo','green':'Verde','blue':'Azul','gray':'Gris','yellow':'Amarillo','cyan':'Cian'},
    'de': {'white':'Weiß','black':'Schwarz','red':'Rot','green':'Grün','blue':'Blau','gray':'Grau','yellow':'Gelb','cyan':'Cyan'},
    'fr': {'white':'Blanc','black':'Noir','red':'Rouge','green':'Vert','blue':'Bleu','gray':'Gris','yellow':'Jaune','cyan':'Cyan'},
    'pt': {'white':'Branco','black':'Preto','red':'Vermelho','green':'Verde','blue':'Azul','gray':'Cinza','yellow':'Amarelo','cyan':'Ciano'},
    'it': {'white':'Bianco','black':'Nero','red':'Rosso','green':'Verde','blue':'Blu','gray':'Grigio','yellow':'Giallo','cyan':'Ciano'},
    'nl': {'white':'Wit','black':'Zwart','red':'Rood','green':'Groen','blue':'Blauw','gray':'Grijs','yellow':'Geel','cyan':'Cyaan'},
    'id': {'white':'Putih','black':'Hitam','red':'Merah','green':'Hijau','blue':'Biru','gray':'Abu-abu','yellow':'Kuning','cyan':'Sian'},
    'vi': {'white':'Trắng','black':'Đen','red':'Đỏ','green':'Xanh lá','blue':'Xanh dương','gray':'Xám','yellow':'Vàng','cyan':'Xanh lơ'},
    'zh-cn': {'white':'白色','black':'黑色','red':'红色','green':'绿色','blue':'蓝色','gray':'灰色','yellow':'黄色','cyan':'青色'},
    'ru': {'white':'Белый','black':'Чёрный','red':'Красный','green':'Зелёный','blue':'Синий','gray':'Серый','yellow':'Жёлтый','cyan':'Бирюзовый'},
}

COLORS = {
    '#ffffff': 'white', '#fff': 'white',
    '#000000': 'black', '#000': 'black',
    '#ff0000': 'red', '#f00': 'red',
    '#00ff00': 'green', '#0f0': 'green',
    '#0000ff': 'blue', '#00f': 'blue',
    '#808080': 'gray',
    '#ffff00': 'yellow', '#ff0': 'yellow',
    '#00ffff': 'cyan', '#0ff': 'cyan',
}

STYLE = '''\n<style>\n/* display-color-labels-v1 */\n.color-btn{font-weight:900;font-size:14px;color:#fff;text-shadow:0 1px 2px rgba(0,0,0,.45)}\n.color-btn[data-color="#ffffff"],.color-btn[data-color="#00ff00"],.color-btn[data-color="#ffff00"],.color-btn[data-color="#00ffff"]{color:#071019;text-shadow:0 1px 1px rgba(255,255,255,.28)}\n@media(max-width:600px){.color-btn{font-size:12px}}\n</style>\n'''


def lang_of(text: str) -> str:
    m = re.search(r'<html[^>]*\blang="([^"]+)"', text, re.I)
    return (m.group(1) if m else 'en').lower()


def replace_button_text(text: str, attr: str, color: str, label: str) -> str:
    pattern = re.compile(rf'(<button\b[^>]*\b{re.escape(attr)}="{re.escape(color)}"[^>]*>)[^<]*(</button>)', re.I)
    return pattern.sub(lambda m: m.group(1) + label + m.group(2), text)


changed = 0
for path in [*ROOT.rglob('display.html'), *ROOT.rglob('mobile.html')]:
    text = path.read_text(encoding='utf-8')
    lang = lang_of(text)
    labels = LABELS.get(lang, LABELS['en'])
    before = text

    # Remove a prior copy so the build is idempotent.
    text = re.sub(r'\n<style>\n/\* display-color-labels-v[0-9]+ \*/[\s\S]*?</style>\n(?=</head>)', '\n', text, count=1)

    for color, key in COLORS.items():
        label = labels[key]
        text = replace_button_text(text, 'data-color', color, label)
        text = replace_button_text(text, 'data-open-screen', color, label)
        text = replace_button_text(text, 'data-set-screen', color, label)

    if path.name == 'display.html':
        text = text.replace('</head>', STYLE + '</head>', 1)

    if text != before:
        path.write_text(text, encoding='utf-8')
        changed += 1

print(f'Normalized all eight display color labels on {changed} localized pages')
