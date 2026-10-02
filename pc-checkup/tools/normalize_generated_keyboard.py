from pathlib import Path
import re

ROOT = Path('dist')
LOCALES = ['ja','es','de','fr','pt','it','nl','id','vi','zh-CN','ru']


def canonical_behavior_script() -> str:
    text = (ROOT/'en'/'keyboard.html').read_text(encoding='utf-8')
    match = re.search(r'<script>\s*document\.addEventListener\([\s\S]*?</script>', text)
    if not match:
        raise RuntimeError('Canonical keyboard behavior script not found in en/keyboard.html')
    return match.group(0)


def normalize_markup(text: str) -> str:
    text = re.sub(r'<button id="[^"]+" type="button" class="fullscreen-exit">', '<button id="exitKeyboard" type="button" class="fullscreen-exit">', text, count=1)
    text = re.sub(r'(<div class="keyboard-actions">\s*<button )id="[^"]+"', r'\1id="startKeyboard"', text, count=1)
    text = re.sub(r'(<div class="controls">\s*<button )id="[^"]+"', r'\1id="resetKeyboard"', text, count=1)
    text = re.sub(r'#start[^\s\{]*\{display:none\}', '#startKeyboard{display:none}', text)
    return text


def polish_fullscreen_ui(text: str) -> str:
    override = '''
<style>
/* keyboard-fullscreen-ui-v7 */
.keyboard-test-active .fullscreen-exit{top:22px!important;right:24px!important;min-width:72px;min-height:46px;padding:11px 18px!important;border-radius:14px!important;box-shadow:0 8px 26px rgba(0,0,0,.28)}
.keyboard-test-active .tool-layout{padding-top:18px!important;padding-right:112px!important}
.keyboard-note{font-size:14px!important;line-height:1.68!important;max-width:1100px;color:#a9b8ca!important}
.keyboard-actions{align-items:center;margin-bottom:7px!important}
.keyboard-help{margin:3px 0 8px;border:1px solid var(--line);border-radius:11px;background:rgba(255,255,255,.018);overflow:hidden}
.keyboard-help summary{cursor:pointer;list-style:none;padding:9px 12px;font-size:13px;font-weight:900;color:#c8d3df;display:flex;align-items:center;gap:8px;user-select:none}
.keyboard-help summary::-webkit-details-marker{display:none}
.keyboard-help summary::before{content:'?';display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:50%;background:rgba(111,229,189,.11);color:var(--accent);font-size:12px}
.keyboard-help[open] summary{border-bottom:1px solid var(--line);background:rgba(255,255,255,.025)}
.keyboard-help-body{padding:8px 11px 10px;display:grid;gap:7px}
.keyboard-help .modifier-note,.keyboard-help .printscreen-fn-note{margin:0!important;padding:8px 10px!important;border-radius:8px;background:rgba(255,255,255,.025);font-size:13px!important;line-height:1.58!important}
.keyboard-help .printscreen-fn-note{border-left:3px solid var(--accent);background:rgba(111,229,189,.045)}
.side .notice{padding:0!important;overflow:hidden}
.side .side-help summary{cursor:pointer;list-style:none;padding:16px 17px;font-size:16px;font-weight:900;color:#edf3f8;display:flex;align-items:center;justify-content:space-between}
.side .side-help summary::-webkit-details-marker{display:none}
.side .side-help summary::after{content:'+';font-size:18px;color:var(--accent)}
.side .side-help[open] summary::after{content:'−'}
.side .side-help[open] summary{border-bottom:1px solid var(--line)}
.side-help-body{padding:14px 17px 17px;font-size:14px;line-height:1.7;color:#aebdcd}
.eventlog{font-size:13px!important;line-height:1.55!important}
.keyboard-test-active .keyboard-help{margin:2px 0 5px}.keyboard-test-active .keyboard-help summary{padding:6px 10px}.keyboard-test-active .keyboard-help[open] .keyboard-help-body{max-height:105px;overflow:auto}.keyboard-test-active .side{display:none!important}
@media(max-width:860px){.keyboard-test-active .fullscreen-exit{top:16px!important;right:16px!important}.keyboard-test-active .tool-layout{padding-right:96px!important}.keyboard-note{font-size:13px!important}.side-help-body{font-size:13px}}
</style>
'''
    text = re.sub(r'\n<style>\n/\* keyboard-fullscreen-ui-v[0-9]+ \*/[\s\S]*?</style>\n(?=</head>)', '\n', text, count=1)
    return text.replace('</head>', override + '</head>', 1)


def language_of(text: str) -> str:
    m = re.search(r'<html\s+lang="([^"]+)"', text, re.I)
    return (m.group(1) if m else 'en').lower()


def localize_fn_button(text: str) -> str:
    lang = language_of(text)
    labels = {
        'ko':'Fn 조합 확인','en':'Fn combination check','ja':'Fn組み合わせ確認','es':'Comprobar combinación Fn',
        'de':'Fn-Kombination prüfen','fr':'Vérifier combinaison Fn','pt':'Verificar combinação Fn','it':'Verifica combinazione Fn',
        'nl':'Fn-combinatie controleren','id':'Periksa kombinasi Fn','vi':'Kiểm tra tổ hợp Fn','zh-cn':'Fn 组合检查','ru':'Проверка комбинации Fn'
    }
    label = labels.get(lang, labels['en'])
    return re.sub(r'(<button id="fnArm"[^>]*>)[^<]*(</button>)', rf'\1{label}\2', text, count=1)


def inject_guidance(text: str) -> str:
    text = re.sub(r'<details class="keyboard-help">[\s\S]*?</details>', '', text, count=1)
    text = re.sub(r'<p class="keyboard-note printscreen-fn-note">[\s\S]*?</p>', '', text, count=1)
    text = re.sub(r'<p class="keyboard-note modifier-note">[\s\S]*?</p>', '', text, count=1)
    lang = language_of(text)
    fn_messages = {
        'ko': 'Fn은 키 자체가 아니라 조합 결과를 확인합니다. Fn 조합 확인을 켠 뒤 같은 물리키를 Fn 없이 한 번, 이어서 Fn과 함께 한 번 눌러 비교하세요. 웹에서 차이가 보이지 않아도 키보드 고장을 의미하지 않습니다.',
        'en': 'This checks Fn combinations, not the Fn key itself. Turn on Fn combination check, press the same physical key once without Fn and once with Fn. No browser-visible difference does not mean the keyboard is faulty.',
        'ja': 'Fnキー自体ではなくFn組み合わせの結果を確認します。同じ物理キーをFnなしで1回、Fnと一緒に1回押して比較してください。ブラウザで差が見えなくても故障を意味しません。',
        'es': 'Se comprueba la combinación Fn, no la tecla Fn por sí sola. Pulsa la misma tecla una vez sin Fn y otra con Fn. Que el navegador no vea diferencia no significa que el teclado esté averiado.',
        'de': 'Geprüft wird die Fn-Kombination, nicht die Fn-Taste selbst. Drücke dieselbe Taste einmal ohne und einmal mit Fn. Kein sichtbarer Unterschied im Browser bedeutet keinen Tastaturdefekt.',
        'fr': 'Ce test vérifie la combinaison Fn, pas la touche Fn elle-même. Appuyez sur la même touche une fois sans Fn puis avec Fn. Aucune différence visible dans le navigateur ne signifie pas une panne.',
        'pt': 'O teste verifica a combinação Fn, não a tecla Fn isolada. Pressione a mesma tecla uma vez sem Fn e outra com Fn. Nenhuma diferença visível no navegador não significa defeito.',
        'it': 'Il test verifica la combinazione Fn, non il tasto Fn da solo. Premi lo stesso tasto una volta senza Fn e una volta con Fn. Nessuna differenza visibile nel browser non significa guasto.',
        'nl': 'Deze test controleert de Fn-combinatie, niet de Fn-toets zelf. Druk dezelfde toets eenmaal zonder Fn en eenmaal met Fn. Geen zichtbaar verschil in de browser betekent geen defect.',
        'id': 'Tes ini memeriksa kombinasi Fn, bukan tombol Fn itu sendiri. Tekan tombol fisik yang sama sekali tanpa Fn dan sekali dengan Fn. Tidak ada perbedaan di browser bukan berarti keyboard rusak.',
        'vi': 'Bài kiểm tra xác nhận tổ hợp Fn, không phải riêng phím Fn. Nhấn cùng một phím một lần không giữ Fn và một lần giữ Fn. Không thấy khác biệt trên trình duyệt không có nghĩa bàn phím bị lỗi.',
        'zh-cn': '这里检查的是 Fn 组合结果，不是 Fn 键本身。对同一个物理按键分别在不按 Fn 和按住 Fn 时各按一次。浏览器看不到差异并不代表键盘故障。',
        'ru': 'Проверяется результат комбинации Fn, а не сама клавиша Fn. Нажмите одну и ту же физическую клавишу один раз без Fn и один раз с Fn. Отсутствие различий в браузере не означает неисправность.'
    }
    mod_messages = {
        'ko': '좌·우 Shift/Ctrl/Alt/Win은 직접 식별과 절차상 보조 판정을 내부적으로 구분합니다. 한쪽이 바로 안 잡히면 반대쪽 같은 키를 먼저 한 번 누른 뒤 다시 확인하세요.',
        'en': 'Left/right Shift/Ctrl/Alt/Win direct identification is kept separate internally from assisted inference. If one side is not identified, press the matching opposite-side key once first and try again.',
        'ja': '左右のShift/Ctrl/Alt/Winは、直接識別と補助推定を内部で区別します。片側が識別されない場合は、反対側の同じキーを一度押してから再確認してください。'
    }
    summaries = {
        'ko':'문제가 있을 때만 보기 · 좌우 키 / Fn 안내','en':'Only if needed · modifier / Fn help','ja':'必要なときだけ表示 · 左右キー / Fn案内',
        'es':'Solo si hace falta · ayuda de teclas / Fn','de':'Nur bei Bedarf · Tasten-/Fn-Hilfe','fr':'Seulement si nécessaire · aide touches / Fn',
        'pt':'Só se precisar · ajuda de teclas / Fn','it':'Solo se serve · aiuto tasti / Fn','nl':'Alleen indien nodig · toets-/Fn-hulp',
        'id':'Hanya bila perlu · bantuan tombol / Fn','vi':'Chỉ khi cần · trợ giúp phím / Fn','zh-cn':'仅在需要时查看 · 左右键 / Fn 帮助','ru':'Только при необходимости · помощь по клавишам / Fn'
    }
    help_box = (
        f'<details class="keyboard-help"><summary>{summaries.get(lang, summaries["en"])}</summary>'
        f'<div class="keyboard-help-body"><p class="keyboard-note modifier-note">{mod_messages.get(lang, mod_messages["en"])}</p>'
        f'<p class="keyboard-note printscreen-fn-note">{fn_messages.get(lang, fn_messages["en"])}</p></div></details>'
    )
    anchor = '<div id="keyboard" class="keyboard"></div>'
    if anchor not in text:
        raise RuntimeError('keyboard anchor not found for guidance')
    return text.replace(anchor, help_box + anchor, 1)


def collapse_side_help(text: str) -> str:
    if 'side-help' in text:
        return text
    pattern = r'<div class="notice"><strong>([^<]+)</strong><br>([\s\S]*?)</div>'
    def repl(m):
        title = m.group(1).strip()
        body = m.group(2).strip()
        return f'<details class="notice side-help"><summary>{title}</summary><div class="side-help-body">{body}</div></details>'
    return re.sub(pattern, repl, text, count=1)


def inject_runtime_helper(text: str) -> str:
    text = re.sub(r'\n<style>\n/\* keyboard-(?:raw-diagnostics|runtime-helper)-v[0-9]+ \*/[\s\S]*?</style>\n(?=</head>)', '\n', text, count=1)
    text = re.sub(r'\n<script>\n/\* keyboard-(?:raw-diagnostics|runtime-helper)-v[0-9]+ \*/[\s\S]*?</script>\n(?=</body>)', '\n', text, count=1)
    text = re.sub(r'<div id="rawKeyEvents" class="raw-key-events">[\s\S]*?</div>', '', text, count=1)
    text = re.sub(r'<div id="fnEvidenceStatus" class="fn-evidence(?: [a-z-]+)*">[\s\S]*?</div>', '', text, count=1)
    text = re.sub(r'<span id="fnVirtualKey" class="fn-virtual-key(?: [a-z-]+)*">[\s\S]*?</span>', '', text, count=1)

    style = '''
<style>
/* keyboard-runtime-helper-v6 */
.fn-evidence{margin-top:8px;padding:10px 13px;border:1px solid var(--line);border-radius:11px;background:#0c141e;line-height:1.45}
.fn-evidence:empty{display:none}
.fn-evidence strong{display:block;font-size:14px;font-weight:950;margin-bottom:2px;color:#dce6ef}
.fn-evidence small{display:block;font-size:12px;font-weight:750;color:#9fb0c3}
.fn-evidence.detected{border-color:var(--accent);background:rgba(111,229,189,.06)}
.fn-evidence.detected strong{color:var(--accent)}
.fn-evidence.unavailable{border-color:#4c91d9;background:rgba(76,145,217,.07)}
.fn-evidence.unavailable strong{color:#8fc5ff}
.fn-evidence.recheck{border-color:#d88a3d;background:rgba(216,138,61,.07)}
.fn-evidence.recheck strong{color:#f0ae68}
.fn-evidence.progress{border-color:#596a7d;background:rgba(89,106,125,.06)}
.keyboard-test-active .fn-evidence{flex:0 0 auto;margin-top:5px;padding:8px 11px}
</style>
'''
    text = text.replace('</head>', style + '</head>', 1)
    if '<button id="fnArm"' not in text or '<div id="keyLog"' not in text:
        raise RuntimeError('Fn/keyLog anchor not found')
    panel = '<div id="fnEvidenceStatus" class="fn-evidence"></div>'
    text = text.replace('<div id="keyLog"', panel + '<div id="keyLog"', 1)

    script = '''
<script>
/* keyboard-runtime-helper-v6 */
(()=>{
  const lang=(document.documentElement.lang||'en').toLowerCase();
  const ko=lang.startsWith('ko');
  const t={
    step1:ko?'1단계 · 같은 키를 Fn 없이 한 번 누르세요.':'Step 1 · Press the target key once without Fn.',
    step2:ko?'2단계 · 이제 Fn과 함께 같은 물리키를 누르세요.':'Step 2 · Now hold Fn and press the same physical key.',
    progressTitle:ko?'Fn 조합 확인 중':'Checking Fn combination',
    verifiedTitle:ko?'Fn 조합이 확인됐습니다':'Fn combination confirmed',
    verifiedDirect:ko?'Fn 신호가 브라우저에서 직접 관찰됐습니다.':'A direct Fn signal was observed by the browser.',
    verifiedIndirect:ko?'Fn 전후 브라우저 입력이 달라졌습니다.':'The browser-visible input changed with Fn.',
    unavailableTitle:ko?'이 키보드는 Fn 여부를 웹에서 구분할 수 없습니다':'This keyboard cannot expose Fn separately on the web',
    unavailableBody:ko?'키보드 고장을 의미하지 않습니다.':'This does not mean the keyboard is faulty.',
    recheckTitle:ko?'Fn 조합 결과를 다시 확인해 주세요':'Please check the Fn combination again',
    recheckBody:ko?'같은 물리키로 다시 비교해 주세요.':'Repeat the comparison with the same physical key.',
    buttonSuffix:ko?' ON':' ON'
  };
  const families=['Shift','Control','Alt','Meta'];
  const verifiedSides=new Map(families.map(f=>[f,new Set()]));
  const inferredDown=new Map();
  const modifierEvidence={Shift:{},Control:{},Alt:{},Meta:{}};
  const fnEvidence={state:'idle',method:'',baseline:null,result:null};
  window.__pcKeyboardEvidence={modifier:modifierEvidence,fn:fnEvidence};
  let fnBaseline=null;

  const familyFrom=e=>{const key=e.key||'',code=e.code||'';if(key==='Shift'||code.startsWith('Shift'))return'Shift';if(key==='Control'||code.startsWith('Control'))return'Control';if(key==='Alt'||key==='AltGraph'||code.startsWith('Alt'))return'Alt';if(key==='Meta'||key==='OS'||code.startsWith('Meta')||code.startsWith('OS'))return'Meta';return''};
  const sideFrom=(family,e)=>{const code=(e.code||'').replace('OSLeft','MetaLeft').replace('OSRight','MetaRight');const loc=Number(e.location)||Number(e.keyLocation)||0;if(code===family+'Left'||loc===1)return family+'Left';if(code===family+'Right'||loc===2)return family+'Right';if(family==='Meta'){const kc=Number(e.keyCode)||0;if(kc===91)return'MetaLeft';if(kc===92)return'MetaRight'}return''};
  const inferOpposite=family=>{const sides=verifiedSides.get(family);if(!sides||sides.size!==1)return'';return sides.has(family+'Left')?family+'Right':family+'Left'};
  const patchEventSide=(e,code)=>{const loc=code.endsWith('Left')?1:2;try{Object.defineProperty(e,'code',{configurable:true,value:code})}catch{}try{Object.defineProperty(e,'location',{configurable:true,value:loc})}catch{}try{Object.defineProperty(e,'keyLocation',{configurable:true,value:loc})}catch{}};
  const fnModeOn=()=>document.getElementById('fnArm')?.classList.contains('active')===true;
  const statusEl=()=>document.getElementById('fnEvidenceStatus');
  const setStatus=(kind,title,body)=>{const s=statusEl();if(!s)return;s.className='fn-evidence'+(kind?' '+kind:'');s.innerHTML=`<strong>${title}</strong>${body?`<small>${body}</small>`:''}`};
  const clearStatus=()=>{const s=statusEl();if(s){s.className='fn-evidence';s.textContent=''}};
  const sig=e=>({key:e.key||'',code:e.code||'',location:Number(e.location)||0});
  const sameSig=(a,b)=>a&&b&&a.key===b.key&&a.code===b.code&&a.location===b.location;
  const directFn=e=>(e.key||'')==='Fn'||(e.code||'')==='Fn';
  const isPrintScreen=e=>(e.key||'')==='PrintScreen'||(e.code||'')==='PrintScreen'||(e.code||'')==='Snapshot';

  const markVerified=(method,body,now=null)=>{fnEvidence.state='confirmed';fnEvidence.method=method;fnEvidence.result=now;setStatus('detected',t.verifiedTitle,body)};
  const handleFn=e=>{
    if(e.type!=='keydown'||e.repeat||!fnModeOn())return;
    if(directFn(e)){fnBaseline=null;markVerified('direct',t.verifiedDirect,sig(e));return}
    if(familyFrom(e))return;
    if(isPrintScreen(e)){fnBaseline=null;markVerified('indirect-printscreen',t.verifiedIndirect,sig(e));return}
    const now=sig(e);
    if(!fnBaseline){fnBaseline=now;fnEvidence.state='baseline';fnEvidence.baseline=now;setStatus('progress',t.progressTitle,t.step2);return}
    if(sameSig(fnBaseline,now)){
      fnEvidence.state='unavailable';fnEvidence.method='same-browser-event';fnEvidence.result=now;
      setStatus('unavailable',t.unavailableTitle,t.unavailableBody);
    }else{
      markVerified('indirect-difference',t.verifiedIndirect,now);
    }
    fnBaseline=null;
  };

  const onRaw=e=>{
    const family=familyFrom(e);
    if(family){
      const verified=sideFrom(family,e);
      if(verified){
        verifiedSides.get(family).add(verified);
        modifierEvidence[family][verified]='direct';
      }else if(e.type==='keydown'&&!e.repeat){
        const inferred=inferOpposite(family);
        if(inferred){inferredDown.set(family,inferred);modifierEvidence[family][inferred]='assisted';patchEventSide(e,inferred)}
      }else if(e.type==='keyup'&&inferredDown.has(family)){
        const inferred=inferredDown.get(family);inferredDown.delete(family);patchEventSide(e,inferred)
      }
    }
    handleFn(e);
  };

  window.addEventListener('keydown',onRaw,true);window.addEventListener('keyup',onRaw,true);
  window.addEventListener('blur',()=>{inferredDown.clear();fnBaseline=null});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){inferredDown.clear();fnBaseline=null}});
  document.addEventListener('DOMContentLoaded',()=>{
    const button=document.getElementById('fnArm');
    const base=(button?.textContent||'Fn combination check').trim();
    clearStatus();
    button?.addEventListener('click',()=>setTimeout(()=>{
      fnBaseline=null;fnEvidence.baseline=null;fnEvidence.result=null;fnEvidence.method='';
      const on=fnModeOn();
      button.textContent=on?base+t.buttonSuffix:base;
      if(on){fnEvidence.state='waiting';setStatus('progress',t.progressTitle,t.step1)}else{fnEvidence.state='idle';clearStatus()}
    },0));
  });
})();
</script>
'''
    return text.replace('</body>', script + '</body>', 1)


canonical = canonical_behavior_script()
all_paths = [ROOT/'keyboard.html', ROOT/'en'/'keyboard.html'] + [ROOT/l/'keyboard.html' for l in LOCALES]
for path in all_paths:
    if not path.exists():
        continue
    text = normalize_markup(path.read_text(encoding='utf-8'))
    text, count = re.subn(r'<script>\s*document\.addEventListener\([\s\S]*?</script>', lambda _: canonical, text, count=1)
    if count != 1:
        raise RuntimeError(f'Keyboard behavior script not found: {path}')
    text = polish_fullscreen_ui(text)
    text = localize_fn_button(text)
    text = inject_guidance(text)
    text = collapse_side_help(text)
    text = inject_runtime_helper(text)
    path.write_text(text, encoding='utf-8')

print('Finalized Fn combination-check semantics, blue unavailable state, and direct-vs-assisted modifier evidence')
