from pathlib import Path
import re

ROOT = Path('dist')
LOCALES = ['ko','en','ja','es','de','fr','pt','it','nl','id','vi','zh-CN','ru']
LABELS = {
    'ko':'한국어','en':'English','ja':'日本語','es':'Español','de':'Deutsch','fr':'Français',
    'pt':'Português','it':'Italiano','nl':'Nederlands','id':'Bahasa Indonesia','vi':'Tiếng Việt',
    'zh-CN':'简体中文','ru':'Русский'
}

STYLE = '''\n<style>\n/* language-ux-v6 */\n.language-picker{margin-left:auto;display:flex;align-items:center;min-width:0}\n.language-picker select{max-width:156px;border:1px solid var(--line);background:#121c28;color:var(--text);border-radius:10px;padding:8px 30px 8px 10px;font:inherit;font-size:12px;font-weight:800;cursor:pointer}\n/* ui-polish-v5: shared readability and narrow-screen guardrails */\nimg,video,canvas,svg{max-width:100%}\n.tool-layout,.toolbox,.side,.card,.notice,.stat,.checkitem,.checkitem>div,.progress-card,.mobile-result-actions,.mobile-controls,.channel-grid,.channel{min-width:0}\np,.notice,.section-intro,.quick-rule,.pass-rule,.checkitem,.card,.eventlog{overflow-wrap:break-word}\n.notice,.section-intro,.card p,.checkitem p,.quick-rule span,.pass-rule span{text-wrap:pretty}\nh1,h2,h3,.channel b,.channel small{max-width:100%;overflow-wrap:anywhere}\n.btn,.pill,.check-actions button{max-width:100%;white-space:normal;text-align:center;line-height:1.3}\nselect,input,textarea{max-width:100%}\n/* Desktop header: every locale keeps one stable row. */\n@media(min-width:981px){.nav.wrap{width:min(1320px,calc(100% - 32px));max-width:none;min-height:64px;flex-wrap:nowrap;gap:12px}.nav .language-picker{margin-left:0;flex:0 0 144px}.nav .language-picker select{width:100%;max-width:100%}.nav .brand{flex:0 0 auto;white-space:nowrap;font-size:15px;line-height:1.15}.nav .navlinks{display:flex;flex:1 1 auto;min-width:0;flex-wrap:nowrap;justify-content:flex-end;gap:3px}.nav .navlinks a{flex:0 0 auto;white-space:nowrap;padding:8px 7px;font-size:13px}}\n@media(min-width:981px) and (max-width:1320px){.nav.wrap{width:calc(100% - 24px);gap:8px}.nav .language-picker{flex-basis:132px}.nav .brand{font-size:14px}.nav .navlinks{gap:1px}.nav .navlinks a{padding:7px 5px;font-size:12px}}\n@media(min-width:601px) and (max-width:980px){.navlinks{display:none!important}.nav.wrap{justify-content:flex-start;flex-wrap:nowrap}.language-picker{margin-left:0}.brand{white-space:nowrap}}\n/* Keep the same visible help-card pattern on every test page. */\n.side .notice{padding:15px 16px!important;overflow:visible!important;font-size:13px;line-height:1.72;letter-spacing:-.005em}\n.side .notice strong{display:block;margin:0 0 6px;color:var(--text);font-size:14px;line-height:1.35;font-weight:900}\n.side .notice br{display:none}\nhtml:lang(ko) :is(p,.notice,.section-intro,.quick-rule span,.pass-rule span,.checkitem p,.card p,.side-help-body){word-break:keep-all;line-break:strict;overflow-wrap:break-word}\nhtml:lang(ja) :is(p,.notice,.section-intro,.quick-rule span,.pass-rule span,.checkitem p,.card p,.side-help-body),html:lang(zh-CN) :is(p,.notice,.section-intro,.quick-rule span,.pass-rule span,.checkitem p,.card p,.side-help-body){line-break:strict}\n@media(max-width:860px){.tool-layout{grid-template-columns:minmax(0,1fr)!important}.side{grid-row:auto!important}.side .notice{font-size:13px;line-height:1.7}.tool-layout{gap:14px}}\n@media(max-width:600px){.language-picker{order:3;width:100%;margin:8px 0 0}.language-picker select{width:100%;max-width:none}.toolbox{padding:16px!important;border-radius:18px!important}.tool-layout{padding-bottom:36px!important}.side .notice{padding:13px 14px!important;font-size:13px;line-height:1.68}.side .notice strong{font-size:13px;margin-bottom:5px}.controls,.actions,.check-actions,.mobile-controls{width:100%;max-width:100%}.check-actions{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:6px!important}.check-actions .btn,.check-actions .pill{min-width:0!important;width:100%!important;white-space:normal!important;overflow-wrap:anywhere;line-height:1.2}.toolbox>.summary{grid-template-columns:repeat(2,minmax(0,1fr))!important}.toolbox>.summary .stat{min-width:0!important}.toolbox>.summary .stat span{white-space:normal!important;overflow-wrap:anywhere;line-height:1.25}.toolbox>.summary .stat:last-child{grid-column:1/-1}.channel-grid{width:100%;max-width:100%;grid-template-columns:minmax(0,1fr)!important}.channel{width:100%;max-width:100%;padding-left:8px;padding-right:8px}.channel b,.channel small{white-space:normal;text-align:center;overflow-wrap:anywhere}.mobile-check-card .mobile-controls .btn{flex:1 1 auto!important;min-width:0!important;white-space:normal!important;overflow-wrap:anywhere}.mobile-result-actions{width:100%;max-width:100%}.mobile-result-actions .pill{min-width:0!important;white-space:normal!important;overflow-wrap:anywhere;line-height:1.2}.stat b{font-size:20px}.eventlog{font-size:12px;overflow-wrap:anywhere}.screen-toolbar,.mobile-screen-toolbar{max-width:calc(100vw - 20px)}}\n</style>\n'''

SCRIPT = '''\n<script>\n/* language-ux-v6 */\n(()=>{\n  const supported=['ko','en','ja','es','de','fr','pt','it','nl','id','vi','zh-CN','ru'];\n  const key='device-checkup-language-v1';\n  const normalize=raw=>{\n    const v=String(raw||'').replace('_','-').toLowerCase();\n    if(v.startsWith('zh'))return 'zh-CN';\n    const base=v.split('-')[0];\n    return supported.find(x=>x.toLowerCase()===v)||supported.find(x=>x.toLowerCase()===base)||'';\n  };\n  const saved=(()=>{try{return normalize(localStorage.getItem(key))}catch{return ''}})();\n  const detected=()=>{\n    const langs=(navigator.languages&&navigator.languages.length?navigator.languages:[navigator.language]);\n    for(const lang of langs){const hit=normalize(lang);if(hit)return hit}\n    return 'en';\n  };\n  document.addEventListener('DOMContentLoaded',()=>{\n    const picker=document.getElementById('languagePicker');\n    picker?.addEventListener('change',()=>{\n      try{localStorage.setItem(key,picker.value)}catch{}\n      const option=picker.options[picker.selectedIndex];\n      if(option?.dataset.href)location.href=option.dataset.href;\n    });\n  });\n  const current=document.documentElement.dataset.locale||document.documentElement.lang||'ko';\n  const isRootLocale=current.toLowerCase()==='ko';\n  if(isRootLocale){\n    const wanted=saved||detected();\n    if(wanted&&wanted!=='ko'){\n      const target=document.querySelector(`#languagePicker option[value="${CSS.escape(wanted)}"]`)?.dataset.href;\n      if(target)location.replace(target);\n    }\n  }\n})();\n</script>\n'''


def locale_for(path: Path) -> str:
    rel = path.relative_to(ROOT)
    if len(rel.parts) == 1:
        return 'ko'
    return rel.parts[0] if rel.parts[0] in LOCALES else 'ko'


def href_for(current_locale: str, target_locale: str, filename: str) -> str:
    if current_locale == 'ko':
        return filename if target_locale == 'ko' else f'{target_locale}/{filename}'
    return f'../{filename}' if target_locale == 'ko' else f'../{target_locale}/{filename}'


def restore_visible_side_help(text: str) -> str:
    # Keyboard used to convert its sidebar notice into a collapsible <details>.
    # Product-wide rule: ordinary right-side help cards stay visible on every test page.
    pattern = re.compile(
        r'<details class="notice side-help">\s*<summary>([\s\S]*?)</summary>\s*<div class="side-help-body">([\s\S]*?)</div>\s*</details>'
    )
    return pattern.sub(lambda m: f'<div class="notice"><strong>{m.group(1).strip()}</strong><br>{m.group(2).strip()}</div>', text)


def inject(path: Path):
    text = path.read_text(encoding='utf-8')
    text = restore_visible_side_help(text)
    text = re.sub(r'\n<style>\n/\* language-ux-v[0-9]+ \*/[\s\S]*?</style>\n(?=</head>)', '\n', text, count=1)
    text = re.sub(r'\n<script>\n/\* language-ux-v[0-9]+ \*/[\s\S]*?</script>\n(?=</body>)', '\n', text, count=1)
    text = re.sub(r'<div class="language-picker">[\s\S]*?</div>', '', text, count=1)
    text = re.sub(r'<style>\s*\.lang-switch\{[\s\S]*?</style>', '', text, count=1)
    text = re.sub(r'<div class="lang-switch">[\s\S]*?</div>', '', text, count=1)

    locale = locale_for(path)
    filename = path.name
    options=[]
    for code in LOCALES:
        selected=' selected' if code==locale else ''
        href=href_for(locale, code, filename)
        options.append(f'<option value="{code}" data-href="{href}"{selected}>{LABELS[code]}</option>')
    picker='<div class="language-picker"><select id="languagePicker" aria-label="Language">'+''.join(options)+'</select></div>'
    text = re.sub(r'<html([^>]*)>', lambda m: '<html'+re.sub(r'\sdata-locale="[^"]*"','',m.group(1))+f' data-locale="{locale}">', text, count=1)
    if '<div class="wrap nav">' not in text:
        raise RuntimeError(f'Navigation anchor missing: {path}')
    text = text.replace('<div class="wrap nav">', '<div class="wrap nav">'+picker, 1)
    text = text.replace('</head>', STYLE+'</head>', 1)
    text = text.replace('</body>', SCRIPT+'</body>', 1)
    path.write_text(text, encoding='utf-8')


paths = sorted(ROOT.rglob('*.html'))
for path in paths:
    inject(path)
print(f'Injected language UX and consistent visible sidebar help/readability guardrails into {len(paths)} HTML pages')
