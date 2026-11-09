(() => {
  'use strict';
  // Compare Unicode characters, not UTF-16 units. Korean IME input is never rewritten.
  const normalize = value => String(value || '').normalize('NFC').toLowerCase().replace(/[\s\p{P}\p{Cf}]/gu, '').normalize('NFC');
  function grade(expected, entered) {
    const a = Array.from(normalize(expected)), b = Array.from(normalize(entered));
    if (a.join('') === b.join('')) return {distance:0, units:a.length, exact:true, score:a.length?100:0,
      parts:a.map(character=>({kind:'correct',expected:character,entered:character}))};
    if (!b.length) return {distance:a.length, units:a.length, exact:false, score:0,
      parts:a.map(character=>({kind:'missing',expected:character,entered:''}))};
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
  function passageRows(chapters,fromChapter,fromVerse,toChapter,toVerse) {
    if (![fromChapter,fromVerse,toChapter,toVerse].every(n=>Number.isInteger(n)&&n>0) ||
        fromChapter>toChapter || (fromChapter===toChapter&&fromVerse>toVerse)) return [];
    return chapters.filter(ch=>Number(ch.chapter)>=fromChapter&&Number(ch.chapter)<=toChapter)
      .slice().sort((a,b)=>Number(a.chapter)-Number(b.chapter)).flatMap(ch=>
        (ch.verses||[]).map(v=>({chapter:Number(ch.chapter),verse:Number(v.verse),text:String(v.text||'').trim()}))
          .filter(v=>v.verse&&v.text&&(v.chapter!==fromChapter||v.verse>=fromVerse)&&(v.chapter!==toChapter||v.verse<=toVerse))
          .sort((a,b)=>a.verse-b.verse));
  }
  function passageReference(book,rows) {
    if(!rows.length)return '';
    const first=rows[0],last=rows[rows.length-1];
    if(first.chapter!==last.chapter)return `${book} ${first.chapter}:${first.verse}–${last.chapter}:${last.verse}`;
    const ranges=[];
    for(const n of [...new Set(rows.map(r=>r.verse))].sort((a,b)=>a-b)){
      const previous=ranges[ranges.length-1];if(previous&&n===previous[1]+1)previous[1]=n;else ranges.push([n,n]);
    }
    return `${book} ${first.chapter}:${ranges.map(([a,b])=>a===b?String(a):`${a}–${b}`).join(', ')}`;
  }
  function createSession(rows,view='verse') {
    const units=[];rows.forEach((row,index)=>{
      const last=units[units.length-1];
      if(view==='chapter'&&last&&last[0].row.chapter===row.chapter)last.push({row,index});else units.push([{row,index}]);
    });
    let index=0,correct=false;const firstAnswers=Array(rows.length);
    return {
      get current(){return units[index]||[];},get index(){return index;},get unitCount(){return units.length;},
      get done(){return index>=units.length;},get canAdvance(){return correct;},get firstAnswers(){return firstAnswers.slice();},
      invalidate(){correct=false;},
      check(values){
        const current=units[index]||[];
        if(!current.length||!values.some(value=>normalize(value))){correct=false;return {empty:true,correct:false,grades:[]};}
        const grades=current.map((item,i)=>{if(firstAnswers[item.index]===undefined)firstAnswers[item.index]=String(values[i]||'');return grade(item.row.text,values[i]||'');});
        correct=grades.every(g=>g.exact);return {empty:false,correct,grades};
      },
      advance(){if(!correct||index>=units.length)return false;index++;correct=false;return true;}
    };
  }
  const KEYS = 'title close intro range selected from to preview start answer check peek hide practice result retry change rule reference expected entered perfect tryAgain progress empty whole unavailable count time wrong missing extra score privacy'.split(' ');
  const COPY = {
    ko:['타이핑 암기 시험','닫기','구절을 읽고 기억한 뒤, 본문을 가리고 직접 써 보세요.','시험 범위','선택한 구절','시작 절','마지막 절','먼저 읽고 기억하세요','본문 가리고 시험 시작','기억나는 본문을 입력하세요','채점하기','본문 보기 · 연습으로 전환','본문 가리기','본문을 확인한 연습','시험 결과','다시 시험','범위 바꾸기','띄어쓰기·줄바꿈·문장부호·대소문자는 채점에서 제외합니다.','시험 구절','정답','내 답','모두 정확합니다!','틀린 부분을 확인하고 다시 도전해 보세요.','입력한 절','한 절 이상 입력한 뒤 채점해 주세요.','현재 장·편 전체','본문을 불러온 뒤 다시 열어 주세요.','절','초','다른 글자','빠진 글자','추가한 글자','정확도','입력한 답은 저장하거나 서버로 전송하지 않습니다.'],
    en:['Typing memory test','Close','Read the verses, then hide the text and type from memory.','Test passage','Selected verses','First verse','Last verse','Read and remember','Hide text and start','Type the passage from memory','Check answers','Show text · switch to practice','Hide text','Practice with text revealed','Your results','Try again','Change passage','Spaces, line breaks, punctuation and letter case are ignored.','Passage','Expected','Your answer','All correct!','Review the differences and try again.','Verses entered','Enter at least one answer first.','Whole current chapter','Wait for the passage to load, then try again.','verses','s','Different','Missing','Extra','Accuracy','Your answers are neither stored nor sent to a server.'],
    fr:['Test de mémorisation','Fermer','Lisez les versets, masquez le texte, puis écrivez de mémoire.','Passage','Versets sélectionnés','Premier verset','Dernier verset','Lisez et mémorisez','Masquer et commencer','Écrivez le passage de mémoire','Corriger','Afficher le texte · entraînement','Masquer le texte','Entraînement avec le texte','Résultats','Réessayer','Changer le passage','Espaces, sauts de ligne, ponctuation et casse sont ignorés.','Passage','Texte attendu','Votre réponse','Tout est correct !','Revoyez les différences et réessayez.','Versets saisis','Saisissez au moins une réponse.','Tout le chapitre actuel','Attendez le chargement du passage.','versets','s','Différent','Manquant','En trop','Exactitude','Vos réponses ne sont ni enregistrées ni envoyées à un serveur.'],
    de:['Bibel auswendig tippen','Schließen','Verse lesen, Text ausblenden und aus dem Gedächtnis schreiben.','Textstelle','Ausgewählte Verse','Erster Vers','Letzter Vers','Lesen und merken','Text ausblenden und starten','Text aus dem Gedächtnis eingeben','Prüfen','Text zeigen · Übung','Text ausblenden','Übung mit eingeblendetem Text','Ergebnis','Erneut versuchen','Textstelle ändern','Leerzeichen, Zeilenumbrüche, Satzzeichen und Großschreibung werden ignoriert.','Textstelle','Erwartet','Deine Antwort','Alles richtig!','Unterschiede prüfen und erneut versuchen.','Eingegebene Verse','Gib zuerst mindestens eine Antwort ein.','Ganzes aktuelles Kapitel','Warte, bis der Text geladen ist.','Verse','s','Anders','Fehlend','Zusätzlich','Genauigkeit','Deine Antworten werden weder gespeichert noch an einen Server gesendet.'],
    zh:['圣经默写测验','关闭','先阅读经文，再隐藏原文，凭记忆输入。','测验范围','已选经节','起始节','结束节','先阅读并记住经文','隐藏原文并开始','凭记忆输入经文','批改','查看原文 · 转为练习','隐藏原文','已查看原文的练习','测验结果','再测一次','更改范围','忽略空格、换行、标点和字母大小写。','经文','正确原文','我的答案','全部正确！','查看差异后再试一次。','已输入经节','请先输入至少一节答案。','当前整章','请等待经文加载完成。','节','秒','不同','缺少','多写','准确率','答案不会保存或发送到服务器。'],
    ru:['Проверка запоминания','Закрыть','Прочитайте стихи, скройте текст и напечатайте по памяти.','Отрывок','Выбранные стихи','Первый стих','Последний стих','Прочитайте и запомните','Скрыть текст и начать','Введите текст по памяти','Проверить','Показать текст · тренировка','Скрыть текст','Тренировка с подсказкой','Результат','Повторить','Изменить отрывок','Пробелы, переносы строк, пунктуация и регистр не учитываются.','Отрывок','Верный текст','Ваш ответ','Всё верно!','Проверьте различия и повторите.','Введено стихов','Сначала введите хотя бы один ответ.','Вся текущая глава','Дождитесь загрузки текста.','стихов','с','Отличается','Пропущено','Лишнее','Точность','Ответы не сохраняются и не отправляются на сервер.'],
    la:['Probatio memoriae','Claude','Versus lege, textum cela, deinde ex memoria scribe.','Locus','Versus selecti','Primus versus','Ultimus versus','Lege et memento','Cela et incipe','Ex memoria scribe','Respostas examina','Monstra textum · exercitatio','Cela textum','Exercitatio textu monstrato','Eventus','Iterum tenta','Locum muta','Spatia, lineae novae, interpunctio et litterarum magnitudo non numerantur.','Locus','Textus rectus','Responsum tuum','Omnia recta!','Differentias vide et iterum tenta.','Versus scripti','Saltem unum responsum scribe.','Totum capitulum praesens','Exspecta dum textus oneratur.','versus','s','Diversum','Deest','Superest','Accuratio','Responsa nec servantur nec ad servitorem mittuntur.'],
    pt:['Teste de memorização','Fechar','Leia os versículos, oculte o texto e digite de memória.','Passagem','Versículos selecionados','Primeiro versículo','Último versículo','Leia e memorize','Ocultar e começar','Digite a passagem de memória','Corrigir','Mostrar texto · praticar','Ocultar texto','Prática com texto revelado','Resultado','Tentar novamente','Mudar passagem','Espaços, quebras de linha, pontuação e maiúsculas são ignorados.','Passagem','Texto esperado','Sua resposta','Tudo certo!','Revise as diferenças e tente novamente.','Versículos digitados','Digite pelo menos uma resposta.','Todo o capítulo atual','Aguarde o carregamento do texto.','versículos','s','Diferente','Ausente','Extra','Precisão','Suas respostas não são salvas nem enviadas a um servidor.'],
    ar:['اختبار الحفظ بالكتابة','إغلاق','اقرأ الآيات ثم أخف النص واكتب من الذاكرة.','نطاق الاختبار','الآيات المحددة','الآية الأولى','الآية الأخيرة','اقرأ واحفظ','إخفاء النص والبدء','اكتب النص من الذاكرة','تصحيح الإجابات','عرض النص · تدريب','إخفاء النص','تدريب مع عرض النص','النتيجة','حاول مجدداً','تغيير النطاق','لا تُحتسب المسافات والأسطر وعلامات الترقيم وحالة الأحرف.','النص','النص الصحيح','إجابتك','كل الإجابات صحيحة!','راجع الفروق وحاول مجدداً.','الآيات المكتوبة','اكتب إجابة واحدة على الأقل أولاً.','الأصحاح الحالي بالكامل','انتظر تحميل النص ثم حاول مجدداً.','آيات','ث','مختلف','ناقص','زائد','الدقة','لا تُحفظ الإجابات ولا تُرسل إلى خادم.']
  };
  const CHAPTER_COPY={
    ko:['여러 장·편 묶기','시작 장·편','마지막 장·편','현재 성경책 안에서 시작과 마지막 장·절을 정하세요.'],
    en:['Multiple chapters','First chapter','Last chapter','Choose the first and last chapter and verse within the current book.'],
    fr:['Plusieurs chapitres','Premier chapitre','Dernier chapitre','Choisissez les chapitres et versets de début et de fin dans le livre actuel.'],
    de:['Mehrere Kapitel','Erstes Kapitel','Letztes Kapitel','Wähle Anfang und Ende nach Kapitel und Vers im aktuellen Buch.'],
    zh:['多个章节','起始章','结束章','在当前书卷内选择起始和结束的章、节。'],
    ru:['Несколько глав','Первая глава','Последняя глава','Выберите начальную и конечную главу и стих в текущей книге.'],
    la:['Plura capitula','Primum capitulum','Ultimum capitulum','Elige primum et ultimum capitulum atque versum in libro praesenti.'],
    pt:['Vários capítulos','Primeiro capítulo','Último capítulo','Escolha o capítulo e versículo inicial e final no livro atual.'],
    ar:['عدة أصحاحات','الأصحاح الأول','الأصحاح الأخير','اختر الأصحاح والآية الأولى والأخيرة ضمن السفر الحالي.']
  };
  const VIEW_COPY={
    ko:['보기 방식','절 하나씩 보기','장 한 번에 보기','답 확인','다음 절','다음 장','결과 보기','정답입니다.','고친 뒤 다시 답을 확인해 주세요.','Enter: 답 확인 → 정답이면 Enter: 다음 절. Shift+Enter: 줄바꿈.','각 절을 입력하고 답을 확인하세요. 모두 맞으면 다음 장으로 넘어갑니다.','첫 답 확인 기준'],
    en:['View','One verse at a time','One chapter at a time','Check answer','Next verse','Next chapter','View results','Correct.','Edit your answer and check again.','Enter checks; after a correct answer, Enter moves on. Shift+Enter adds a line break.','Enter the verses and check. Continue to the next chapter when all answers are correct.','Based on first checks'],
    fr:['Affichage','Un verset à la fois','Un chapitre à la fois','Vérifier','Verset suivant','Chapitre suivant','Voir les résultats','Correct.','Corrigez puis vérifiez à nouveau.','Entrée vérifie ; après une réponse correcte, Entrée continue. Maj+Entrée insère une ligne.','Saisissez les versets et vérifiez. Passez au chapitre suivant quand tout est correct.','Selon les premières vérifications'],
    de:['Ansicht','Ein Vers nach dem anderen','Ein Kapitel auf einmal','Antwort prüfen','Nächster Vers','Nächstes Kapitel','Ergebnis ansehen','Richtig.','Korrigiere und prüfe erneut.','Enter prüft; bei richtiger Antwort geht Enter weiter. Umschalt+Enter fügt eine neue Zeile ein.','Gib die Verse ein und prüfe sie. Wenn alles richtig ist, geht es zum nächsten Kapitel.','Erste Antworten gewertet'],
    zh:['显示方式','逐节显示','整章显示','核对答案','下一节','下一章','查看结果','回答正确。','修改后再次核对。','按 Enter 核对；答对后再按 Enter 进入下一节。Shift+Enter 换行。','输入各节后核对，全部正确即可进入下一章。','按首次核对计分'],
    ru:['Вид','По одному стиху','По одной главе','Проверить ответ','Следующий стих','Следующая глава','Результаты','Верно.','Исправьте ответ и проверьте снова.','Enter проверяет; после верного ответа Enter продолжает. Shift+Enter — новая строка.','Введите стихи и проверьте. Когда всё верно, переходите к следующей главе.','По первым проверкам'],
    la:['Modus','Singuli versus','Singula capitula','Responsum examina','Versus sequens','Capitulum sequens','Eventus vide','Recte.','Corrige et iterum examina.','Enter examinat; responso recto, Enter pergit. Shift+Enter novam lineam addit.','Versus scribe et examina. Omnibus rectis ad capitulum sequens procede.','Prima responsa numerantur'],
    pt:['Visualização','Um versículo por vez','Um capítulo por vez','Conferir resposta','Próximo versículo','Próximo capítulo','Ver resultado','Correto.','Corrija e confira novamente.','Enter confere; após acertar, Enter avança. Shift+Enter insere uma nova linha.','Digite os versículos e confira. Avance ao próximo capítulo quando tudo estiver correto.','Baseado nas primeiras respostas'],
    ar:['طريقة العرض','آية واحدة في كل مرة','أصحاح كامل في كل مرة','تحقق من الإجابة','الآية التالية','الأصحاح التالي','عرض النتيجة','صحيح.','صحح الإجابة وتحقق مجدداً.','Enter للتحقق؛ وبعد الإجابة الصحيحة اضغط Enter للمتابعة. Shift+Enter لسطر جديد.','اكتب الآيات وتحقق منها. انتقل إلى الأصحاح التالي عندما تكون جميع الإجابات صحيحة.','بحسب أول تحقق']
  };
  const labels = code => ({...Object.fromEntries(KEYS.map((key, i) => [key, (COPY[code] || COPY.en)[i]])),
    ...Object.fromEntries(['multi','firstChapter','lastChapter','chapterScope'].map((key,i)=>[key,(CHAPTER_COPY[code]||CHAPTER_COPY.en)[i]])),
    ...Object.fromEntries(['view','verseView','chapterView','checkAnswer','nextVerse','nextChapter','finish','correct','editRetry','enterHelp','chapterHelp','firstCheck'].map((key,i)=>[key,(VIEW_COPY[code]||VIEW_COPY.en)[i]]))});
  window.BibleMemory = {normalize, grade, labels, passageRows, passageReference, createSession};
  if (typeof document === 'undefined') return;
  const root = document.querySelector('#verses'), menu = document.querySelector('#toolbarMoreMenu');
  if (!root || !menu) return;
  const lang = () => String(window.BibleI18n?.lang?.() || document.documentElement.lang || 'ko').split('-')[0];
  const el = (tag, className, text) => { const node = document.createElement(tag); if (className) node.className = className; if (text !== undefined) node.textContent = text; return node; };
  let dialog = null, opener = null;
  function close() { if (dialog?.open) dialog.close(); }
  function open(event) {
    if(dialog?.open)return;
    opener=event?.currentTarget||document.activeElement;
    const l=labels(lang()),chapter=Number(state.chapter);
    const source=[...root.querySelectorAll('.verse[data-verse]')].map(row=>({chapter,verse:Number(row.dataset.verse),text:row.querySelector('.verse-text')?.textContent?.trim()||'',selected:row.classList.contains('multi-selected')})).filter(row=>row.verse&&row.text);
    if(!source.length||!document.querySelector('#status')?.hidden)return;
    const selected=source.filter(row=>row.selected),book=window.BibleI18n?.bookName?.(Number(state.bookIndex))||BOOKS[state.bookIndex]?.ko||'';
    const version=document.querySelector('#translationSelect')?.selectedOptions[0]?.textContent||'';
    const chapters=typeof currentBookData!=='undefined'&&currentBookData?.chapters?.length?currentBookData.chapters:[{chapter,verses:source}];
    const chapterNumbers=chapters.map(ch=>Number(ch.chapter)).sort((a,b)=>a-b);
    const config={view:'verse',selected:!!selected.length,fromChapter:chapter,toChapter:chapter,fromVerse:selected[0]?.verse||source[0].verse,toVerse:selected.at(-1)?.verse||source.at(-1).verse};
    let rows=[],practice=false,started=0,session=null;
    const reference=items=>passageReference(book,items);
    const rowReference=row=>`${row.chapter}:${row.verse}`;
    const button=(text,handler,className='')=>{const b=el('button',className,text);b.type='button';b.addEventListener('click',handler);return b;};
    dialog=el('dialog','memory-quiz');dialog.id='memoryQuizDialog';dialog.setAttribute('aria-labelledby','memoryQuizTitle');
    const header=el('header','memory-header'),title=el('h2','',l.title);title.id='memoryQuizTitle';header.append(title,button(l.close,close,'memory-close'));
    const content=el('div','memory-content');dialog.append(header,el('p','memory-context',`${book} · ${version}`),content);document.body.append(dialog);
    dialog.addEventListener('close',()=>{const old=dialog;dialog=null;old.remove();if(opener?.isConnected&&opener.getClientRects().length)opener.focus();else document.querySelector('#toolbarMoreToggle')?.focus();});
    dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)close();}});
    function preview(target,items){for(const row of items){const p=el('p');p.append(el('span','memory-verse-number',rowReference(row)),document.createTextNode(row.text));target.append(p);}}
    function gradeCard(row,answer,g){
      const card=el('section','memory-result');card.append(el('h4','',`${rowReference(row)} · ${g.score}%`));
      for(const [side,caption] of [['expected',l.expected],['entered',l.entered]]){
        card.append(el('strong','memory-comparison-label',caption));const line=el('p','memory-diff');line.setAttribute('dir','auto');
        const kinds=g.parts.flatMap(part=>Array.from(part[side]).map(()=>part.kind));let cursor=0;const runs=[];
        for(const character of Array.from(String(side==='expected'?row.text:answer).normalize('NFC'))){
          const length=Array.from(normalize(character)).length,kind=length?(kinds.slice(cursor,cursor+length).find(k=>k!=='correct')||'correct'):'correct';cursor+=length;
          const last=runs.at(-1);if(last?.kind===kind)last.text+=character;else runs.push({kind,text:character});
        }
        for(const run of runs){const span=el('span',`memory-${run.kind}`,run.text);if(run.kind!=='correct')span.title=l[run.kind];line.append(span);}
        if(!line.childNodes.length)line.textContent='—';card.append(line);
      }
      card.append(el('p','memory-counts',['wrong','missing','extra'].map(kind=>`${l[kind]} ${g.parts.filter(p=>p.kind===kind).length}`).join(' · ')));return card;
    }
    function setup(){
      content.replaceChildren();
      const views=el('fieldset','memory-views');views.append(el('legend','',l.view));
      for(const [value,text] of [['verse',l.verseView],['chapter',l.chapterView]]){
        const label=el('label'),input=el('input');input.type='radio';input.name='memoryView';input.value=value;input.id=value==='verse'?'memoryViewVerse':'memoryViewChapter';input.checked=config.view===value;
        input.addEventListener('change',()=>{config.view=value;});label.append(input,document.createTextNode(text));views.append(label);
      }
      const range=el('details','memory-range'),rangeTitle=el('summary'),fields=el('div','memory-fields memory-chapter-fields');range.append(rangeTitle);
      const fromChapter=el('select'),toChapter=el('select'),fromVerse=el('select'),toVerse=el('select');
      fromChapter.id='memoryFromChapter';toChapter.id='memoryToChapter';fromVerse.id='memoryFromVerse';toVerse.id='memoryToVerse';
      for(const n of chapterNumbers)for(const select of [fromChapter,toChapter]){const option=el('option','',String(n));option.value=String(n);select.append(option);}
      fromChapter.value=String(config.fromChapter);toChapter.value=String(config.toChapter);
      function fillVerses(chapterSelect,verseSelect,value,last=false){
        const items=passageRows(chapters,Number(chapterSelect.value),1,Number(chapterSelect.value),Number.MAX_SAFE_INTEGER);verseSelect.replaceChildren();
        for(const row of items){const option=el('option','',String(row.verse));option.value=String(row.verse);verseSelect.append(option);}
        if(items.some(r=>r.verse===Number(value)))verseSelect.value=String(value);else if(last&&items.length)verseSelect.value=String(items.at(-1).verse);
      }
      fillVerses(fromChapter,fromVerse,config.fromVerse);fillVerses(toChapter,toVerse,config.toVerse,true);
      const useSelected=el('input');useSelected.type='checkbox';useSelected.checked=config.selected;useSelected.id='memoryUseSelected';
      if(selected.length){const label=el('label','memory-use-selected');label.append(useSelected,document.createTextNode(`${l.selected} (${selected.length})`));range.append(label);}
      for(const [text,select] of [[l.firstChapter,fromChapter],[l.from,fromVerse],[l.lastChapter,toChapter],[l.to,toVerse]]){const label=el('label','',text);label.append(select);fields.append(label);}
      range.append(fields,el('p','memory-rule',l.chapterScope));
      const study=el('details','memory-study'),studyTitle=el('summary','',l.preview),passage=el('div','memory-preview');study.append(studyTitle,passage);
      const summary=el('p','memory-reference');
      function refresh(){
        config.selected=!!selected.length&&useSelected.checked;config.fromChapter=Number(fromChapter.value);config.toChapter=Number(toChapter.value);config.fromVerse=Number(fromVerse.value);config.toVerse=Number(toVerse.value);
        for(const select of [fromChapter,fromVerse,toChapter,toVerse])select.disabled=config.selected;
        rows=config.selected?selected:passageRows(chapters,config.fromChapter,config.fromVerse,config.toChapter,config.toVerse);
        summary.textContent=`${reference(rows)} · ${rows.length} ${l.count}`;rangeTitle.textContent=`${l.range} · ${reference(rows)}`;startButton.disabled=!rows.length;passage.replaceChildren();preview(passage,rows);
      }
      const startButton=button(l.start,begin,'memory-primary');
      fromChapter.addEventListener('change',()=>{fillVerses(fromChapter,fromVerse,1);if(Number(toChapter.value)<Number(fromChapter.value)){toChapter.value=fromChapter.value;fillVerses(toChapter,toVerse,null,true);}if(fromChapter.value===toChapter.value&&Number(fromVerse.value)>Number(toVerse.value))toVerse.value=fromVerse.value;refresh();});
      toChapter.addEventListener('change',()=>{fillVerses(toChapter,toVerse,null,true);if(Number(fromChapter.value)>Number(toChapter.value)){fromChapter.value=toChapter.value;fillVerses(fromChapter,fromVerse,1);}if(fromChapter.value===toChapter.value&&Number(fromVerse.value)>Number(toVerse.value))fromVerse.value=toVerse.value;refresh();});
      fromVerse.addEventListener('change',()=>{if(fromChapter.value===toChapter.value&&Number(fromVerse.value)>Number(toVerse.value))toVerse.value=fromVerse.value;refresh();});
      toVerse.addEventListener('change',()=>{if(fromChapter.value===toChapter.value&&Number(fromVerse.value)>Number(toVerse.value))fromVerse.value=toVerse.value;refresh();});useSelected.addEventListener('change',refresh);
      content.append(views,summary,range,study,el('p','memory-rule',l.rule),startButton,el('p','memory-privacy',l.privacy));refresh();dialog.scrollTop=0;
    }
    function begin(){practice=false;started=performance.now();session=createSession(rows,config.view);showUnit();}
    function showUnit(){
      const items=session.current;content.replaceChildren(el('p','memory-reference',reference(items.map(item=>item.row))));
      content.append(el('p','memory-progress',`${session.index+1} / ${session.unitCount}`),el('p','memory-key-help',config.view==='verse'?l.enterHelp:l.chapterHelp));
      const practiceLabel=el('p','memory-practice',l.practice);practiceLabel.hidden=!practice;
      const form=el('div','memory-answers'),feedback=el('div','memory-feedback');feedback.setAttribute('aria-live','polite');
      const error=el('p','memory-error');error.hidden=true;error.setAttribute('role','alert');
      const revealed=el('div','memory-preview');revealed.hidden=true;
      const primary=button(l.checkAnswer,act,'memory-primary');
      const inputs=items.map(({row})=>{
        const label=el('label','memory-answer-label',`${rowReference(row)} · ${l.answer}`),input=el('textarea','memory-answer');input.rows=config.view==='verse'?5:3;input.maxLength=Math.min(3000,row.text.length*2+120);input.autocomplete='off';input.spellcheck=false;
        input.setAttribute('autocorrect','off');input.setAttribute('autocapitalize','off');input.setAttribute('dir','auto');input.dataset.chapter=String(row.chapter);input.dataset.verse=String(row.verse);label.append(input);form.append(label);
        let composing=false;input.addEventListener('compositionstart',()=>{composing=true;});input.addEventListener('compositionend',()=>{composing=false;});
        input.addEventListener('input',()=>{session.invalidate();feedback.replaceChildren();feedback.removeAttribute('data-correct');error.hidden=true;primary.textContent=l.checkAnswer;primary.dataset.action='check';});
        input.addEventListener('keydown',e=>{if(config.view!=='verse'||e.key!=='Enter'||e.shiftKey||e.ctrlKey||e.altKey||e.metaKey||e.isComposing||composing||e.keyCode===229)return;e.preventDefault();if(!e.repeat)act();});return input;
      });
      primary.dataset.action='check';primary.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.repeat)e.preventDefault();});
      function act(){
        if(session.canAdvance){session.advance();if(session.done)results(session.firstAnswers);else showUnit();return;}
        const values=inputs.map(input=>input.value),checked=session.check(values);
        if(checked.empty){error.textContent=l.empty;error.hidden=false;inputs[0]?.focus();return;}
        feedback.replaceChildren();feedback.dataset.correct=String(checked.correct);
        if(checked.correct){
          const next=session.index===session.unitCount-1?l.finish:config.view==='verse'?l.nextVerse:l.nextChapter;
          primary.textContent=next;primary.dataset.action='next';feedback.append(el('p','memory-correct',`${l.correct} ${next}${config.view==='verse'?' · Enter':''}`));
        }else{feedback.append(el('p','memory-error',l.editRetry));checked.grades.forEach((g,i)=>{if(!g.exact)feedback.append(gradeCard(items[i].row,values[i],g));});}
      }
      const peek=button(l.peek,()=>{practice=true;practiceLabel.hidden=false;revealed.hidden=!revealed.hidden;revealed.replaceChildren();if(!revealed.hidden)preview(revealed,items.map(item=>item.row));peek.textContent=revealed.hidden?l.peek:l.hide;},'memory-peek');
      const actions=el('div','memory-actions');actions.append(primary,peek,button(l.change,setup));
      content.append(practiceLabel,form,error,feedback,actions,revealed,el('p','memory-rule',l.rule),el('p','memory-privacy',l.privacy));dialog.scrollTop=0;inputs[0]?.focus({preventScroll:true});
    }
    function results(answers){
      const grades=rows.map((row,i)=>grade(row.text,answers[i])),units=grades.reduce((n,g)=>n+g.units,0),distance=grades.reduce((n,g)=>n+g.distance,0),exact=grades.every(g=>g.exact),score=units?Math.min(exact?100:99,Math.round(100*(1-distance/units))):0;
      content.replaceChildren(el('h3','',practice?l.practice:l.result),el('p','memory-reference',reference(rows)));
      const result=el('p','memory-score',`${score}%`);result.setAttribute('aria-label',`${l.score} ${score}%`);content.append(result,el('p','memory-rule',l.firstCheck),el('p','memory-verdict',exact?l.perfect:l.tryAgain),el('p','memory-rule',`${Math.round((performance.now()-started)/1000)} ${l.time}`));
      const actions=el('div','memory-actions'),retry=button(l.retry,begin,'memory-primary');actions.append(retry,button(l.change,setup));content.append(actions);
      const list=el('div','memory-results');grades.forEach((g,i)=>list.append(gradeCard(rows[i],answers[i],g)));content.append(list);dialog.scrollTop=0;retry.focus({preventScroll:true});
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
