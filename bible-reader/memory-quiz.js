(() => {
  'use strict';
  // Compare Unicode characters, not UTF-16 units. Korean IME input is never rewritten.
  const normalize = value => String(value || '').normalize('NFC').toLowerCase().replace(/[\s\p{P}\p{Cf}]/gu, '').normalize('NFC');
  function grade(expected, entered) {
    const a = Array.from(normalize(expected)), b = Array.from(normalize(entered));
    const width = b.length + 1, table = new Uint16Array((a.length + 1) * width);
    for (let i = 0; i <= a.length; i++) table[i * width] = i;
    for (let j = 0; j <= b.length; j++) table[j] = j;
    for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) {
      table[i * width + j] = Math.min(table[(i - 1) * width + j] + 1,
        table[i * width + j - 1] + 1, table[(i - 1) * width + j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    let i = a.length, j = b.length;
    const parts = [];
    while (i || j) {
      const cost = table[i * width + j];
      if (i && j && cost === table[(i - 1) * width + j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)) {
        parts.push({kind:a[i - 1] === b[j - 1] ? 'correct' : 'wrong', expected:a[--i], entered:b[--j]});
      } else if (i && cost === table[(i - 1) * width + j] + 1) {
        parts.push({kind:'missing', expected:a[--i], entered:''});
      } else {
        parts.push({kind:'extra', expected:'', entered:b[--j]});
      }
    }
    const distance = table[a.length * width + b.length], units = Math.max(a.length, b.length);
    return {distance, units, exact:distance === 0, score:units ? Math.min(distance ? 99 : 100, Math.round(100 * (1 - distance / units))) : 0, parts:parts.reverse()};
  }
  const KEYS = 'title close intro range selected from to preview start answer check peek hide practice result retry change rule reference expected entered perfect tryAgain progress empty limit unavailable count time wrong missing extra score privacy'.split(' ');
  const COPY = {
    ko:['타이핑 암기 시험','닫기','구절을 읽고 기억한 뒤, 본문을 가리고 직접 써 보세요.','시험 범위','선택한 구절','시작 절','마지막 절','먼저 읽고 기억하세요','본문 가리고 시험 시작','기억나는 본문을 입력하세요','채점하기','본문 보기 · 연습으로 전환','본문 가리기','본문을 확인한 연습','시험 결과','다시 시험','범위 바꾸기','띄어쓰기·줄바꿈·문장부호·대소문자는 채점에서 제외합니다.','시험 구절','정답','내 답','모두 정확합니다!','틀린 부분을 확인하고 다시 도전해 보세요.','입력한 절','한 절 이상 입력한 뒤 채점해 주세요.','한 번에 40절, 본문 8,000자까지 선택할 수 있습니다.','본문을 불러온 뒤 다시 열어 주세요.','절','초','다른 글자','빠진 글자','추가한 글자','정확도','입력한 답은 저장하거나 서버로 전송하지 않습니다.'],
    en:['Typing memory test','Close','Read the verses, then hide the text and type from memory.','Test passage','Selected verses','First verse','Last verse','Read and remember','Hide text and start','Type the passage from memory','Check answers','Show text · switch to practice','Hide text','Practice with text revealed','Your results','Try again','Change passage','Spaces, line breaks, punctuation and letter case are ignored.','Passage','Expected','Your answer','All correct!','Review the differences and try again.','Verses entered','Enter at least one answer first.','Choose up to 40 verses and 8,000 characters at a time.','Wait for the passage to load, then try again.','verses','s','Different','Missing','Extra','Accuracy','Your answers are neither stored nor sent to a server.'],
    fr:['Test de mémorisation','Fermer','Lisez les versets, masquez le texte, puis écrivez de mémoire.','Passage','Versets sélectionnés','Premier verset','Dernier verset','Lisez et mémorisez','Masquer et commencer','Écrivez le passage de mémoire','Corriger','Afficher le texte · entraînement','Masquer le texte','Entraînement avec le texte','Résultats','Réessayer','Changer le passage','Espaces, sauts de ligne, ponctuation et casse sont ignorés.','Passage','Texte attendu','Votre réponse','Tout est correct !','Revoyez les différences et réessayez.','Versets saisis','Saisissez au moins une réponse.','Choisissez au maximum 40 versets et 8 000 caractères.','Attendez le chargement du passage.','versets','s','Différent','Manquant','En trop','Exactitude','Vos réponses ne sont ni enregistrées ni envoyées à un serveur.'],
    de:['Bibel auswendig tippen','Schließen','Verse lesen, Text ausblenden und aus dem Gedächtnis schreiben.','Textstelle','Ausgewählte Verse','Erster Vers','Letzter Vers','Lesen und merken','Text ausblenden und starten','Text aus dem Gedächtnis eingeben','Prüfen','Text zeigen · Übung','Text ausblenden','Übung mit eingeblendetem Text','Ergebnis','Erneut versuchen','Textstelle ändern','Leerzeichen, Zeilenumbrüche, Satzzeichen und Großschreibung werden ignoriert.','Textstelle','Erwartet','Deine Antwort','Alles richtig!','Unterschiede prüfen und erneut versuchen.','Eingegebene Verse','Gib zuerst mindestens eine Antwort ein.','Wähle höchstens 40 Verse und 8.000 Zeichen.','Warte, bis der Text geladen ist.','Verse','s','Anders','Fehlend','Zusätzlich','Genauigkeit','Deine Antworten werden weder gespeichert noch an einen Server gesendet.'],
    zh:['圣经默写测验','关闭','先阅读经文，再隐藏原文，凭记忆输入。','测验范围','已选经节','起始节','结束节','先阅读并记住经文','隐藏原文并开始','凭记忆输入经文','批改','查看原文 · 转为练习','隐藏原文','已查看原文的练习','测验结果','再测一次','更改范围','忽略空格、换行、标点和字母大小写。','经文','正确原文','我的答案','全部正确！','查看差异后再试一次。','已输入经节','请先输入至少一节答案。','每次最多选择40节、8,000字。','请等待经文加载完成。','节','秒','不同','缺少','多写','准确率','答案不会保存或发送到服务器。'],
    ru:['Проверка запоминания','Закрыть','Прочитайте стихи, скройте текст и напечатайте по памяти.','Отрывок','Выбранные стихи','Первый стих','Последний стих','Прочитайте и запомните','Скрыть текст и начать','Введите текст по памяти','Проверить','Показать текст · тренировка','Скрыть текст','Тренировка с подсказкой','Результат','Повторить','Изменить отрывок','Пробелы, переносы строк, пунктуация и регистр не учитываются.','Отрывок','Верный текст','Ваш ответ','Всё верно!','Проверьте различия и повторите.','Введено стихов','Сначала введите хотя бы один ответ.','Выберите не более 40 стихов и 8 000 символов.','Дождитесь загрузки текста.','стихов','с','Отличается','Пропущено','Лишнее','Точность','Ответы не сохраняются и не отправляются на сервер.'],
    la:['Probatio memoriae','Claude','Versus lege, textum cela, deinde ex memoria scribe.','Locus','Versus selecti','Primus versus','Ultimus versus','Lege et memento','Cela et incipe','Ex memoria scribe','Respostas examina','Monstra textum · exercitatio','Cela textum','Exercitatio textu monstrato','Eventus','Iterum tenta','Locum muta','Spatia, lineae novae, interpunctio et litterarum magnitudo non numerantur.','Locus','Textus rectus','Responsum tuum','Omnia recta!','Differentias vide et iterum tenta.','Versus scripti','Saltem unum responsum scribe.','Elige usque ad 40 versus et 8 000 litteras.','Exspecta dum textus oneratur.','versus','s','Diversum','Deest','Superest','Accuratio','Responsa nec servantur nec ad servitorem mittuntur.'],
    pt:['Teste de memorização','Fechar','Leia os versículos, oculte o texto e digite de memória.','Passagem','Versículos selecionados','Primeiro versículo','Último versículo','Leia e memorize','Ocultar e começar','Digite a passagem de memória','Corrigir','Mostrar texto · praticar','Ocultar texto','Prática com texto revelado','Resultado','Tentar novamente','Mudar passagem','Espaços, quebras de linha, pontuação e maiúsculas são ignorados.','Passagem','Texto esperado','Sua resposta','Tudo certo!','Revise as diferenças e tente novamente.','Versículos digitados','Digite pelo menos uma resposta.','Escolha até 40 versículos e 8.000 caracteres.','Aguarde o carregamento do texto.','versículos','s','Diferente','Ausente','Extra','Precisão','Suas respostas não são salvas nem enviadas a um servidor.'],
    ar:['اختبار الحفظ بالكتابة','إغلاق','اقرأ الآيات ثم أخف النص واكتب من الذاكرة.','نطاق الاختبار','الآيات المحددة','الآية الأولى','الآية الأخيرة','اقرأ واحفظ','إخفاء النص والبدء','اكتب النص من الذاكرة','تصحيح الإجابات','عرض النص · تدريب','إخفاء النص','تدريب مع عرض النص','النتيجة','حاول مجدداً','تغيير النطاق','لا تُحتسب المسافات والأسطر وعلامات الترقيم وحالة الأحرف.','النص','النص الصحيح','إجابتك','كل الإجابات صحيحة!','راجع الفروق وحاول مجدداً.','الآيات المكتوبة','اكتب إجابة واحدة على الأقل أولاً.','اختر حتى 40 آية و8000 حرف في كل مرة.','انتظر تحميل النص ثم حاول مجدداً.','آيات','ث','مختلف','ناقص','زائد','الدقة','لا تُحفظ الإجابات ولا تُرسل إلى خادم.']
  };
  const labels = code => Object.fromEntries(KEYS.map((key, i) => [key, (COPY[code] || COPY.en)[i]]));
  window.BibleMemory = {normalize, grade, labels};
  if (typeof document === 'undefined') return;
  const root = document.querySelector('#verses'), menu = document.querySelector('#toolbarMoreMenu');
  if (!root || !menu) return;
  const lang = () => String(window.BibleI18n?.lang?.() || document.documentElement.lang || 'ko').split('-')[0];
  const el = (tag, className, text) => { const node = document.createElement(tag); if (className) node.className = className; if (text !== undefined) node.textContent = text; return node; };
  let dialog = null, opener = null;
  function close() { if (dialog?.open) dialog.close(); }
  function open(event) {
    if (dialog?.open) return;
    opener = event?.currentTarget || document.activeElement;
    const l = labels(lang());
    const source = [...root.querySelectorAll('.verse[data-verse]')].map(row => ({
      verse:Number(row.dataset.verse), text:row.querySelector('.verse-text')?.textContent?.trim() || '', selected:row.classList.contains('multi-selected')
    })).filter(row => row.verse && row.text);
    if (!source.length || !document.querySelector('#status')?.hidden) return;
    const selected = source.filter(row => row.selected);
    const book = window.BibleI18n?.bookName?.(Number(state.bookIndex)) || BOOKS[state.bookIndex]?.ko || '';
    const chapter = state.chapter, version = document.querySelector('#translationSelect')?.selectedOptions[0]?.textContent || '';
    const reference = rows => `${book} ${chapter}:${rows.map(row => row.verse).join(', ')}`;
    dialog = el('dialog', 'memory-quiz'); dialog.id = 'memoryQuizDialog'; dialog.setAttribute('aria-labelledby','memoryQuizTitle');
    const header = el('header','memory-header');
    const title = el('h2','',l.title); title.id = 'memoryQuizTitle';
    const closeButton = button(l.close,close,'memory-close'); header.append(title,closeButton);
    const context = el('p','memory-context',`${book} ${chapter} · ${version}`);
    const content = el('div','memory-content');
    dialog.append(header,context,content);
    document.body.append(dialog);
    dialog.addEventListener('close',() => { const old = dialog; dialog = null; old.remove(); if (opener?.isConnected && opener.getClientRects().length) opener.focus(); else document.querySelector('#toolbarMoreToggle')?.focus(); });
    dialog.addEventListener('click',e => { if(e.target === dialog) { const box=dialog.getBoundingClientRect(); if(e.clientX<box.left||e.clientX>box.right||e.clientY<box.top||e.clientY>box.bottom)close(); } });
    let rows = [], practice = false, started = 0;
    function button(text,handler,className='') { const b=el('button',className,text);b.type='button';b.addEventListener('click',handler);return b; }
    function preview(target, items) { for(const row of items) { const p=el('p');p.append(el('span','memory-verse-number',String(row.verse)),document.createTextNode(row.text));target.append(p); } }
    function setup() {
      content.replaceChildren(el('p','memory-intro',l.intro));
      const fields=el('div','memory-fields');
      const mode=el('select');mode.id='memoryMode';mode.setAttribute('aria-label',l.range);
      if(selected.length) { const option=el('option','',`${l.selected} (${selected.length})`);option.value='selected';mode.append(option); }
      const range=el('option','',l.range);range.value='range';mode.append(range);
      const modeLabel=el('label','',l.range);modeLabel.append(mode);fields.append(modeLabel);
      const start=el('select'),end=el('select');start.id='memoryFrom';end.id='memoryTo';
      for(const row of source)for(const select of [start,end]){const option=el('option','',String(row.verse));option.value=String(row.verse);select.append(option);}
      end.value=String(source[0].verse);
      const firstLabel=el('label','',l.from),lastLabel=el('label','',l.to);firstLabel.append(start);lastLabel.append(end);fields.append(firstLabel,lastLabel);
      const error=el('p','memory-error');error.setAttribute('role','alert');error.hidden=true;
      const previewTitle=el('h3','',l.preview), passage=el('div','memory-preview');
      const startButton=button(l.start,begin,'memory-primary');
      function refresh() {
        const useSelected=mode.value==='selected';firstLabel.hidden=lastLabel.hidden=useSelected;
        rows=useSelected?selected:source.filter(row=>row.verse>=Number(start.value)&&row.verse<=Number(end.value));
        const tooLong=rows.length>40||rows.reduce((n,row)=>n+row.text.length,0)>8000||rows.some(row=>normalize(row.text).length>2000);
        error.hidden=!tooLong;error.textContent=tooLong?l.limit:'';startButton.disabled=!rows.length||tooLong;
        passage.replaceChildren();preview(passage,tooLong?rows.slice(0,2):rows);
      }
      start.addEventListener('change',()=>{if(Number(end.value)<Number(start.value))end.value=start.value;refresh();});
      end.addEventListener('change',()=>{if(Number(start.value)>Number(end.value))start.value=end.value;refresh();});
      mode.addEventListener('change',refresh);
      content.append(fields,error,previewTitle,passage,el('p','memory-rule',l.rule),startButton,el('p','memory-privacy',l.privacy));refresh();
    }
    function begin() {
      practice=false;started=performance.now();
      content.replaceChildren(el('p','memory-reference',`${l.reference} · ${reference(rows)}`),el('p','memory-rule',l.rule));
      const progress=el('p','memory-progress',`${l.progress} 0 / ${rows.length}`);
      const form=el('div','memory-answers');
      const inputs=rows.map(row=>{
        const label=el('label','memory-answer-label',`${row.verse} · ${l.answer}`),input=el('textarea','memory-answer');
        input.rows=3;input.maxLength=Math.min(3000,row.text.length*2+120);input.autocomplete='off';input.spellcheck=false;
        input.setAttribute('autocorrect','off');input.setAttribute('autocapitalize','off');input.setAttribute('dir','auto');
        input.dataset.verse=String(row.verse);label.append(input);form.append(label);
        input.addEventListener('input',()=>{progress.textContent=`${l.progress} ${inputs.filter(node=>normalize(node.value)).length} / ${rows.length}`;error.hidden=true;});
        return input;
      });
      const error=el('p','memory-error');error.hidden=true;error.setAttribute('role','alert');
      const revealed=el('div','memory-preview');revealed.hidden=true;
      const practiceLabel=el('p','memory-practice');practiceLabel.hidden=true;
      const peek=button(l.peek,()=>{
        practice=true;practiceLabel.hidden=false;practiceLabel.textContent=l.practice;
        revealed.hidden=!revealed.hidden;revealed.replaceChildren();
        if(!revealed.hidden)preview(revealed,rows);peek.textContent=revealed.hidden?l.peek:l.hide;
      },'memory-peek');
      const actions=el('div','memory-actions');
      actions.append(button(l.check,()=>{
        if(!inputs.some(input=>normalize(input.value))){error.textContent=l.empty;error.hidden=false;inputs[0]?.focus();return;}
        results(inputs.map(input=>input.value));
      },'memory-primary'),peek,button(l.change,setup));
      content.append(progress,practiceLabel,form,error,actions,revealed,el('p','memory-privacy',l.privacy));
      dialog.scrollTop=0;inputs[0]?.focus({preventScroll:true});
    }
    function results(answers) {
      const grades=rows.map((row,i)=>grade(row.text,answers[i]));
      const units=grades.reduce((n,g)=>n+g.units,0),distance=grades.reduce((n,g)=>n+g.distance,0);
      const exact=grades.every(g=>g.exact),score=units?Math.min(exact?100:99,Math.round(100*(1-distance/units))):0;
      content.replaceChildren(el('h3','',practice?l.practice:l.result),el('p','memory-reference',reference(rows)));
      const result=el('p','memory-score',`${score}%`);result.setAttribute('aria-label',`${l.score} ${score}%`);content.append(result);
      content.append(el('p','memory-verdict',exact?l.perfect:l.tryAgain),el('p','memory-rule',`${Math.round((performance.now()-started)/1000)} ${l.time} · ${l.rule}`));
      const list=el('div','memory-results');
      grades.forEach((g,i)=>{
        const card=el('section','memory-result');card.append(el('h4','',`${rows[i].verse} · ${g.score}%`));
        for(const [side,caption] of [['expected',l.expected],['entered',l.entered]]){
          card.append(el('strong','memory-comparison-label',caption));
          const line=el('p','memory-diff');line.setAttribute('dir','auto');
          // Grade normalized characters but show the original readable spacing/punctuation.
          const kinds=g.parts.flatMap(part=>Array.from(part[side]).map(()=>part.kind));
          let cursor=0;
          for(const character of Array.from(String(side==='expected'?rows[i].text:answers[i]).normalize('NFC'))){
            const length=Array.from(normalize(character)).length;
            if(!length){line.append(document.createTextNode(character));continue;}
            const kind=kinds.slice(cursor,cursor+length).find(value=>value!=='correct')||'correct';cursor+=length;
            const span=el('span',`memory-${kind}`,character);if(kind!=='correct')span.title=l[kind];line.append(span);
          }
          if(!line.childNodes.length)line.textContent='—';card.append(line);
        }
        const counts=['wrong','missing','extra'].map(kind=>`${l[kind]} ${g.parts.filter(p=>p.kind===kind).length}`);
        card.append(el('p','memory-counts',counts.join(' · ')));list.append(card);
      });
      content.append(list);const actions=el('div','memory-actions');const retry=button(l.retry,begin,'memory-primary');actions.append(retry,button(l.change,setup));content.append(actions);dialog.scrollTop=0;retry.focus({preventScroll:true});
    }
    setup();dialog.showModal();
  }
  function entry(className) {const b=el('button',className,labels(lang()).title);b.type='button';b.addEventListener('click',open);return b;}
  const menuButton=entry('memory-menu-button');menu.append(menuButton);
  const bar=document.querySelector('.verse-multi-actions');if(bar)bar.insertBefore(entry('verse-multi-memory'),bar.querySelector('.verse-multi-done'));
  if(bar&&typeof ResizeObserver!=='undefined')new ResizeObserver(()=>{
    const height=bar.parentElement.getBoundingClientRect().height;
    if(height)document.body.style.setProperty('--memory-actionbar-space',`${Math.ceil(height)+32}px`);
  }).observe(bar.parentElement);
  function updateAvailability(){const ready=!!root.querySelector('.verse-text')&&!!document.querySelector('#status')?.hidden;menuButton.disabled=!ready;menuButton.title=ready?labels(lang()).title:labels(lang()).unavailable;}
  new MutationObserver(updateAvailability).observe(root,{childList:true});updateAvailability();
  new MutationObserver(()=>{document.querySelectorAll('.memory-menu-button,.verse-multi-memory').forEach(b=>b.textContent=labels(lang()).title);}).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
})();
