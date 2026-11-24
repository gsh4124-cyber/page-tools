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
    let prefix=0;while(prefix<Math.min(a.length,b.length)&&a[prefix]===b[prefix])prefix++;
    if(prefix===Math.min(a.length,b.length)){
      const distance=Math.abs(a.length-b.length),units=Math.max(a.length,b.length);
      return {distance,units,exact:false,score:Math.min(99,Math.round(100*(1-distance/units))),parts:[...a.slice(0,prefix).map(character=>({kind:'correct',expected:character,entered:character})),...a.slice(prefix).map(character=>({kind:'missing',expected:character,entered:''})),...b.slice(prefix).map(character=>({kind:'extra',expected:'',entered:character}))]};
    }
    // Keep the most correct characters among equally small edits, then trace from the start.
    // End-first backtracking can attach a short answer to repeated words far later in a verse.
    const width=b.length+1,size=(a.length+1)*width,table=new Uint32Array(size),matches=new Uint32Array(size);
    for(let i=a.length;i>=0;i--)for(let j=b.length;j>=0;j--){
      const at=i*width+j;
      if(i===a.length){table[at]=b.length-j;continue;}
      if(j===b.length){table[at]=a.length-i;continue;}
      const same=a[i]===b[j],diagonal=(i+1)*width+j+1,down=(i+1)*width+j,right=at+1;
      const cost=Math.min(table[diagonal]+(same?0:1),table[down]+1,table[right]+1);
      table[at]=cost;matches[at]=Math.max(
        table[diagonal]+(same?0:1)===cost?matches[diagonal]+(same?1:0):0,
        table[down]+1===cost?matches[down]:0,
        table[right]+1===cost?matches[right]:0);
    }
    let i=0,j=0;const parts=[];
    while(i<a.length||j<b.length){
      const at=i*width+j,cost=table[at],kept=matches[at],same=a[i]===b[j],diagonal=(i+1)*width+j+1;
      if(i<a.length&&j<b.length&&cost===table[diagonal]+(same?0:1)&&kept===matches[diagonal]+(same?1:0)){
        parts.push({kind:same?'correct':'wrong',expected:a[i++],entered:b[j++]});
      }else if(j<b.length&&cost===table[at+1]+1&&kept===matches[at+1]){
        parts.push({kind:'extra',expected:'',entered:b[j++]});
      }else{parts.push({kind:'missing',expected:a[i++],entered:''});}
    }
    const distance=table[0],units=Math.max(a.length,b.length);
    return {distance,units,exact:distance===0,score:units?Math.min(distance?99:100,Math.round(100*(1-distance/units))):0,parts};
  }
  function comparisonRuns(expected,entered,parts=grade(expected,entered).parts){
    function tokens(value){
      const items=[];let prefix='';
      for(const character of Array.from(String(value||'').normalize('NFC'))){
        const units=Array.from(normalize(character));
        if(!units.length){prefix+=character;continue;}
        units.forEach((unit,index)=>items.push({prefix:index?'':prefix,text:index?'':character}));prefix='';
      }
      return {items,tail:prefix};
    }
    const a=tokens(expected),b=tokens(entered),runs=[];let i=0,j=0,afterExtra=false;
    const add=(kind,text,expected='')=>{if(!text&&!expected)return;const last=runs.at(-1);if(last?.kind===kind){last.text+=text;if(kind==='wrong')last.expected+=expected;}else runs.push(kind==='wrong'?{kind,text,expected}:{kind,text});};
    for(const part of parts){
      const e=part.expected?a.items[i++]:null,u=part.entered?b.items[j++]:null;
      if(e){add('correct',e.prefix);if(afterExtra&&!e.prefix&&u?.prefix)add('extra',u.prefix);}
      if(part.kind==='extra'){add('extra',(u?.prefix||'')+(u?.text||''));afterExtra=true;continue;}
      if(part.kind==='wrong')add('wrong',u?.text||'',e?.text||'');
      else add(part.kind,e?.text||'');
      afterExtra=false;
    }
    add('correct',a.tail);return runs;
  }
  function comparisonWords(runs){
    const words=[];let current=[];
    const flush=()=>{if(!current.length)return;words.push({runs:current,wrong:current.some(r=>r.kind==='wrong'),expected:current.map(r=>r.kind==='wrong'?r.expected:r.kind==='extra'?'':r.text).join('')});current=[];};
    for(const run of runs){
      if(run.kind!=='correct'){current.push(run);continue;}
      for(const text of run.text.split(/(\s+)/u)){
        if(!text)continue;
        if(/^\s+$/u.test(text)){flush();words.push({runs:[{kind:'correct',text}],wrong:false,expected:text});}
        else current.push({kind:'correct',text});
      }
    }
    flush();return words;
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
  function subsetReference(book,rows) {
    const groups=[];
    for(const row of rows){const last=groups[groups.length-1];if(last&&last[0].chapter===row.chapter)last.push(row);else groups.push([row]);}
    return groups.map((group,index)=>passageReference(index?'':book,group).trim()).join(' · ');
  }
  function createSession(rows,view='verse') {
    const units=[];rows.forEach((row,index)=>{
      const last=units[units.length-1];
      if(view==='chapter'&&last&&last[0].row.chapter===row.chapter&&last[0].row.bookIndex===row.bookIndex)last.push({row,index});else units.push([{row,index}]);
    });
    let index=0,correct=false;const firstAnswers=Array(rows.length);
    return {
      get current(){return units[index]||[];},get index(){return index;},get unitCount(){return units.length;},
      get done(){return index>=units.length;},get canAdvance(){return correct;},get firstAnswers(){return firstAnswers.slice();},
      invalidate(){correct=false;},
      move(delta){const next=index+delta;if(!Number.isInteger(delta)||next<0||next>=units.length)return false;index=next;correct=false;return true;},
      check(values){
        const current=units[index]||[];
        if(!current.length){correct=false;return {empty:true,correct:false,grades:[]};}
        const grades=current.map((item,i)=>{if(firstAnswers[item.index]===undefined)firstAnswers[item.index]=String(values[i]||'');return grade(item.row.text,values[i]||'');});
        correct=grades.every(g=>g.exact);return {empty:false,correct,grades};
      },
      advance(){if(!correct||index>=units.length)return false;index++;correct=false;return true;}
    };
  }
  const passageKey=row=>`${row.bookIndex}:${row.chapter}:${row.verse}`;
  function bookPassageReference(rows,nameFor,sparse=false){
    const groups=[];for(const row of rows){const last=groups.at(-1);if(last&&last[0].bookIndex===row.bookIndex)last.push(row);else groups.push([row]);}
    return groups.map(group=>(sparse?subsetReference:passageReference)(nameFor(group[0].bookIndex),group)).join(' · ');
  }
  const COLLECTION_COPY={
    ko:['성구 모음','선택 범위를 모음에 추가','모은 성구만 시험','모음 비우기','제거','성구 주소만 이 브라우저에 저장됩니다. 답안은 저장하지 않습니다.','모음의 본문을 불러오지 못했습니다. 다시 불러와 주세요.'],
    en:['Passage collection','Add selected range to collection','Test only collected verses','Clear collection','Remove','Only verse references are saved in this browser. Answers are not saved.','Could not load the collected passages. Please reload.'],
    fr:['Collection de versets','Ajouter la sélection','Tester les versets collectés','Vider la collection','Retirer','Seules les références sont conservées dans ce navigateur, pas les réponses.','Impossible de charger la collection. Réessayez.'],
    de:['Verssammlung','Auswahl hinzufügen','Nur gesammelte Verse testen','Sammlung leeren','Entfernen','Nur Versangaben werden in diesem Browser gespeichert, keine Antworten.','Die Sammlung konnte nicht geladen werden. Bitte erneut laden.'],
    zh:['经文集合','将所选范围加入集合','仅测试集合中的经节','清空集合','移除','仅在此浏览器保存经文位置，不保存答案。','无法加载集合中的经文，请重试。'],
    ru:['Сборник стихов','Добавить выбранный отрывок','Проверить только собранные стихи','Очистить сборник','Убрать','В браузере сохраняются только ссылки на стихи, не ответы.','Не удалось загрузить сборник. Повторите попытку.'],
    la:['Collectio versuum','Adde locum electum','Versus collectos tantum proba','Collectionem dele','Remove','Loci tantum in hoc navigatro servantur, non responsa.','Collectio onerari non potuit. Iterum onera.'],
    pt:['Coleção de versículos','Adicionar trecho à coleção','Testar apenas os versículos reunidos','Limpar coleção','Remover','Somente referências são salvas neste navegador, não as respostas.','Não foi possível carregar a coleção. Tente novamente.'],
    ar:['مجموعة الآيات','إضافة النطاق إلى المجموعة','اختبار الآيات المجمعة فقط','مسح المجموعة','إزالة','تُحفظ مراجع الآيات فقط في هذا المتصفح، ولا تُحفظ الإجابات.','تعذر تحميل المجموعة. أعد المحاولة.']
  };
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
  const AID_COPY={
    ko:['범위 변경','틀린 절만 재시험','전체 다시 시험','오답 재시험'],
    en:['Passage','Retry incorrect verses','Retry full passage','Incorrect verses'],
    fr:['Passage','Reprendre les erreurs','Reprendre tout','Versets incorrects'],
    de:['Bereich','Falsche Verse wiederholen','Alle Verse wiederholen','Falsche Verse'],
    zh:['更改范围','重测错节','全部重测','错节重测'],
    ru:['Отрывок','Повторить ошибочные стихи','Повторить весь отрывок','Ошибочные стихи'],
    la:['Locus','Versus erratos repete','Totum locum repete','Versus errati'],
    pt:['Passagem','Repetir versículos errados','Repetir passagem inteira','Versículos errados'],
    ar:['النطاق','أعد الآيات الخاطئة','أعد المقطع كاملاً','الآيات الخاطئة']
  };
  const COMPACT_COPY={
    ko:['정답','연습','도움말','시작','본문 미리 보기','다시 입력해 주세요.'],
    en:['Correct','Practice','Help','Start','Preview text','Edit and check again.'],
    fr:['Correct','Entraînement','Aide','Commencer','Aperçu du texte','Corrigez puis vérifiez.'],
    de:['Richtig','Übung','Hilfe','Starten','Textvorschau','Korrigieren und prüfen.'],
    zh:['正确','练习','帮助','开始','预览原文','修改后再核对。'],
    ru:['Верно','Тренировка','Помощь','Начать','Просмотр текста','Исправьте и проверьте.'],
    la:['Recte','Exercitatio','Auxilium','Incipe','Textum praevide','Corrige et examina.'],
    pt:['Correto','Prática','Ajuda','Começar','Prévia do texto','Corrija e confira.'],
    ar:['صحيح','تدريب','مساعدة','ابدأ','معاينة النص','صحح وتحقق مجدداً.']
  };
  const TRAINING_KEYS='mode practiceTitle examMode practiceIntro examIntro practiceStart examStart practiceRange practiceUseCollection practiceAnswer showPracticeText hidePracticeText repeatPractice practiceResult practiceResultNote manageCollection deleteCollection confirmCollectionDelete confirmDelete cancel collectionDeleted undo'.split(' ');
  const TRAINING_COPY={
    ko:['연습 방식','타이핑 암기','암기시험','본문을 보며 따라 쓰세요. 익숙해지면 본문을 가려 연습할 수 있습니다.','본문을 가리고 기억나는 말씀을 입력합니다.','타이핑 암기 시작','암기시험 시작','암기 범위','모은 성구만 연습','본문을 따라 입력하세요','본문 보기','본문 가리기','다시 쓰기','암기 연습 결과','마지막으로 입력한 답안을 기준으로 표시합니다.','모음 관리','저장한 성구 전체 삭제','모음에 저장한 {count}절을 모두 삭제할까요?','전체 삭제','취소','모음에서 {count}절을 삭제했습니다.','되돌리기'],
    en:['Practice mode','Typing practice','Memory test','Copy the passage while reading. Hide it when you are ready to practise from memory.','Type from memory with the passage hidden.','Start typing practice','Start memory test','Practice passage','Practise only collected verses','Type the passage shown above','Show passage','Hide passage','Type again','Practice results','Based on your most recent answers.','Manage collection','Delete all saved verses','Delete all {count} saved verse references?','Delete all','Cancel','Deleted {count} verses from the collection.','Undo'],
    fr:['Mode','Mémorisation par saisie','Test de mémoire','Recopiez le texte, puis masquez-le pour vous entraîner de mémoire.','Écrivez de mémoire avec le texte masqué.','Commencer la pratique','Commencer le test','Passage à pratiquer','Pratiquer les versets collectés','Recopiez le texte affiché','Afficher le texte','Masquer le texte','Écrire à nouveau','Résultats de la pratique','Selon vos dernières réponses.','Gérer la collection','Supprimer tous les versets enregistrés','Supprimer les {count} références enregistrées ?','Tout supprimer','Annuler','{count} versets supprimés de la collection.','Annuler la suppression'],
    de:['Modus','Tippen und merken','Gedächtnistest','Schreibe den sichtbaren Text ab. Blende ihn zum Üben aus dem Gedächtnis aus.','Schreibe aus dem Gedächtnis bei ausgeblendetem Text.','Tippübung starten','Gedächtnistest starten','Übungstext','Gesammelte Verse üben','Sichtbaren Text eingeben','Text zeigen','Text ausblenden','Erneut schreiben','Übungsergebnis','Basierend auf deinen letzten Antworten.','Sammlung verwalten','Alle gespeicherten Verse löschen','Alle {count} gespeicherten Versangaben löschen?','Alle löschen','Abbrechen','{count} Verse aus der Sammlung gelöscht.','Rückgängig'],
    zh:['练习方式','打字背诵','默写测验','先看原文跟打，熟悉后可隐藏原文练习。','隐藏原文，凭记忆输入经文。','开始打字背诵','开始默写测验','练习范围','仅练习集合中的经节','输入上方显示的经文','显示原文','隐藏原文','重新输入','背诵练习结果','按最后输入的答案显示。','管理集合','删除全部已保存经节','删除集合中保存的全部 {count} 节经文位置吗？','全部删除','取消','已从集合删除 {count} 节。','撤销'],
    ru:['Режим','Заучивание набором','Проверка памяти','Перепишите видимый текст, затем скройте его для тренировки памяти.','Введите текст по памяти без подсказки.','Начать тренировку','Начать проверку','Отрывок для практики','Тренировать собранные стихи','Перепишите показанный текст','Показать текст','Скрыть текст','Написать снова','Результаты тренировки','По последним введённым ответам.','Управление сборником','Удалить все сохранённые стихи','Удалить все сохранённые ссылки: {count}?','Удалить все','Отмена','Из сборника удалено стихов: {count}.','Восстановить'],
    la:['Modus','Memoria scribendo','Probatio memoriae','Textum visibilem transcribe, deinde cela ut ex memoria exerceas.','Textu celato ex memoria scribe.','Exercitationem incipe','Probationem incipe','Locus exercendus','Versus collectos exerce','Textum monstratum transcribe','Monstra textum','Cela textum','Iterum scribe','Eventus exercitationis','Secundum responsa novissima.','Collectionem administra','Omnes versus servatos dele','Omnes {count} locos servatos delere?','Omnes dele','Revoca','{count} versus ex collectione deleti.','Restitue'],
    pt:['Modo','Memorizar digitando','Teste de memória','Copie o texto visível e depois oculte-o para praticar de memória.','Digite de memória com o texto oculto.','Começar a prática','Começar o teste','Trecho para prática','Praticar os versículos reunidos','Digite o texto mostrado acima','Mostrar texto','Ocultar texto','Digitar novamente','Resultado da prática','Com base nas respostas mais recentes.','Gerenciar coleção','Excluir todos os versículos salvos','Excluir todas as {count} referências salvas?','Excluir tudo','Cancelar','{count} versículos excluídos da coleção.','Desfazer'],
    ar:['وضع التدريب','الحفظ بالكتابة','اختبار الحفظ','انسخ النص الظاهر ثم أخفه للتدرب من الذاكرة.','اكتب من الذاكرة والنص مخفي.','بدء تدريب الكتابة','بدء اختبار الحفظ','نطاق التدريب','تدريب الآيات المجمعة فقط','اكتب النص المعروض أعلاه','عرض النص','إخفاء النص','الكتابة مجدداً','نتائج التدريب','حسب آخر الإجابات المدخلة.','إدارة المجموعة','حذف جميع الآيات المحفوظة','حذف جميع المراجع المحفوظة وعددها {count}؟','حذف الكل','إلغاء','تم حذف {count} آيات من المجموعة.','تراجع']
  };
  const FOCUS_COPY={
    ko:['입력 전','입력 중','장별로 연습','위 말씀을 보며 입력해 보세요','본문을 떠올리며 입력해 보세요','현재 절을 입력하고 답 확인을 누르세요. 정답이면 다음 절로 이동할 수 있습니다. Enter는 줄바꿈입니다.'],
    en:['Not started','In progress','Practise by chapter','Type the passage shown above','Type the passage from memory','Check the current verse, then move to the next when correct. Enter adds a line break.'],
    fr:['À écrire','En cours','Pratiquer par chapitre','Recopiez le passage ci-dessus','Écrivez le passage de mémoire','Vérifiez le verset actuel, puis passez au suivant si la réponse est correcte. Entrée ajoute une nouvelle ligne.'],
    de:['Noch leer','In Bearbeitung','Kapitelweise üben','Schreiben Sie den obigen Text ab','Schreiben Sie den Text aus dem Gedächtnis','Prüfen Sie den aktuellen Vers und gehen Sie bei richtiger Antwort zum nächsten. Enter fügt einen Zeilenumbruch ein.'],
    zh:['待输入','输入中','按章练习','请参照上方经文输入','请凭记忆输入经文','核对当前经节，答对后可进入下一节。Enter 用于换行。'],
    ru:['Не начато','В процессе','Практика по главам','Перепишите текст выше','Введите текст по памяти','Проверьте текущий стих. После верного ответа переходите к следующему. Enter добавляет новую строку.'],
    la:['Nondum scriptum','In cursu','Per capitula exerce','Textum supra monstratum transcribe','Textum ex memoria scribe','Versum praesentem examina; responso recto ad sequentem procede. Enter novam lineam addit.'],
    pt:['Não iniciado','Em andamento','Praticar por capítulo','Digite o trecho mostrado acima','Digite o trecho de memória','Confira o versículo atual e avance ao próximo quando estiver correto. Enter insere uma nova linha.'],
    ar:['لم يبدأ','قيد الكتابة','التدريب حسب الأصحاح','اكتب النص المعروض أعلاه','اكتب النص من الذاكرة','تحقق من الآية الحالية ثم انتقل إلى التالية عند صحة الإجابة. Enter يضيف سطراً جديداً.']
  };
  const DRAFT_KEYS=['resumeDraft','draftAvailable','protectDraftTitle','closeDraftPrompt','restartDraftPrompt','keepDraft','discardClose','discardStart'];
  const DRAFT_COPY={
    ko:['작성하던 답안으로 돌아가기','작성 중인 답안을 유지하고 있습니다.','작성 중인 답안','지금 닫으면 작성 중인 답안이 사라집니다.','새로 시작하면 작성 중인 답안이 사라집니다.','계속 연습하기','답안을 비우고 닫기','답안을 비우고 새로 시작'],
    en:['Return to your answers','Your unfinished answers are still available.','Unfinished answers','Closing now will discard your unfinished answers.','Starting again will discard your unfinished answers.','Keep writing','Discard answers and close','Discard answers and start again'],
    fr:['Revenir aux réponses','Vos réponses en cours sont conservées.','Réponses en cours','Fermer effacera vos réponses en cours.','Recommencer effacera vos réponses en cours.','Continuer à écrire','Effacer et fermer','Effacer et recommencer'],
    de:['Zu den Antworten zurück','Ihre bisherigen Antworten bleiben erhalten.','Unfertige Antworten','Beim Schließen gehen Ihre bisherigen Antworten verloren.','Beim Neustart gehen Ihre bisherigen Antworten verloren.','Weiterschreiben','Antworten verwerfen und schließen','Antworten verwerfen und neu starten'],
    zh:['返回正在填写的答案','正在填写的答案仍然保留。','未完成的答案','现在关闭将丢弃正在填写的答案。','重新开始将丢弃正在填写的答案。','继续练习','清空答案并关闭','清空答案并重新开始'],
    ru:['Вернуться к ответам','Незавершённые ответы сохранены в этом окне.','Незавершённые ответы','При закрытии незавершённые ответы будут потеряны.','При новом запуске незавершённые ответы будут потеряны.','Продолжить ввод','Удалить ответы и закрыть','Удалить ответы и начать заново'],
    la:['Ad responsa redi','Responsa nondum perfecta in hac fenestra manent.','Responsa nondum perfecta','Si claudis, responsa nondum perfecta amittentur.','Si denuo incipis, responsa nondum perfecta amittentur.','Perge scribere','Responsa dele et claude','Responsa dele et denuo incipe'],
    pt:['Voltar às respostas','Suas respostas em andamento continuam disponíveis.','Respostas em andamento','Fechar agora descartará suas respostas em andamento.','Recomeçar descartará suas respostas em andamento.','Continuar escrevendo','Descartar respostas e fechar','Descartar respostas e recomeçar'],
    ar:['العودة إلى الإجابات','إجاباتك غير المكتملة ما زالت متاحة.','إجابات غير مكتملة','سيؤدي الإغلاق الآن إلى فقدان إجاباتك غير المكتملة.','ستؤدي البداية من جديد إلى فقدان إجاباتك غير المكتملة.','متابعة الكتابة','حذف الإجابات والإغلاق','حذف الإجابات والبدء من جديد']
  };
  const labels = code => ({...Object.fromEntries(KEYS.map((key, i) => [key, (COPY[code] || COPY.en)[i]])),
    ...Object.fromEntries(['practicePending','practiceDraft','practiceChapterView','practiceHint','practiceMemoryHint','practiceChapterHelp'].map((key,i)=>[key,(FOCUS_COPY[code]||FOCUS_COPY.en)[i]])),
    ...Object.fromEntries(DRAFT_KEYS.map((key,i)=>[key,(DRAFT_COPY[code]||DRAFT_COPY.en)[i]])),
    ...Object.fromEntries(TRAINING_KEYS.map((key,i)=>[key,(TRAINING_COPY[code]||TRAINING_COPY.en)[i]])),
    ...Object.fromEntries(['collection','addCollection','useCollection','clearCollection','removeCollection','savedCollection','collectionError'].map((key,i)=>[key,(COLLECTION_COPY[code]||COLLECTION_COPY.en)[i]])),
    ...Object.fromEntries(['multi','firstChapter','lastChapter','chapterScope'].map((key,i)=>[key,(CHAPTER_COPY[code]||CHAPTER_COPY.en)[i]])),
    ...Object.fromEntries(['view','verseView','chapterView','checkAnswer','nextVerse','nextChapter','finish','correct','editRetry','enterHelp','chapterHelp','firstCheck'].map((key,i)=>[key,(VIEW_COPY[code]||VIEW_COPY.en)[i]])),
    ...Object.fromEntries(['shortChange','retryWrong','retryAll','review'].map((key,i)=>[key,(AID_COPY[code]||AID_COPY.en)[i]])),
    ...Object.fromEntries(['correct','practice','help','start','preview','editRetry'].map((key,i)=>[key,(COMPACT_COPY[code]||COMPACT_COPY.en)[i]])),
    ...Object.fromEntries(['previousVerse','previousChapter'].map((key,i)=>[key,({ko:['이전 절','이전 장'],en:['Previous verse','Previous chapter'],fr:['Verset précédent','Chapitre précédent'],de:['Vorheriger Vers','Vorheriges Kapitel'],zh:['上一节','上一章'],ru:['Предыдущий стих','Предыдущая глава'],la:['Versus prior','Capitulum prius'],pt:['Versículo anterior','Capítulo anterior'],ar:['الآية السابقة','الأصحاح السابق']}[code]||['Previous verse','Previous chapter'])[i]])),
    ...Object.fromEntries(['book','loading','loadError','reload'].map((key,i)=>[key,({ko:['성경책','본문을 불러오는 중…','본문을 불러오지 못했습니다. 다시 시도해 주세요.','다시 불러오기'],en:['Book','Loading passage…','Could not load the passage. Please try again.','Reload passage'],fr:['Livre','Chargement…','Impossible de charger le passage. Réessayez.','Recharger'],de:['Buch','Text wird geladen…','Text konnte nicht geladen werden. Bitte erneut versuchen.','Erneut laden'],zh:['书卷','正在加载经文…','无法加载经文，请重试。','重新加载'],ru:['Книга','Загрузка текста…','Не удалось загрузить текст. Повторите попытку.','Загрузить снова'],la:['Liber','Textus oneratur…','Textus onerari non potuit. Iterum tenta.','Iterum onera'],pt:['Livro','Carregando passagem…','Não foi possível carregar a passagem. Tente novamente.','Recarregar'],ar:['السفر','جارٍ تحميل النص…','تعذر تحميل النص. حاول مجدداً.','إعادة التحميل']}[code]||['Book','Loading passage…','Could not load the passage. Please try again.','Reload passage'])[i]])),
    ...(code==='ko'?{wrong:'오자',missing:'빠진 글자',extra:'더 쓴 글자'}:{})});
  window.BibleMemory = {normalize, grade, comparisonRuns, comparisonWords, labels, passageRows, passageReference, subsetReference, createSession,passageKey,bookPassageReference};
  if (typeof document === 'undefined') return;
  const root = document.querySelector('#verses'), menu = document.querySelector('#toolbarMoreMenu');
  if (!root || !menu) return;
  const lang = () => String(window.BibleI18n?.lang?.() || document.documentElement.lang || 'ko').split('-')[0];
  const el = (tag, className, text) => { const node = document.createElement(tag); if (className) node.className = className; if (text !== undefined) node.textContent = text; return node; };
  let dialog = null, opener = null;
  function close() { if (dialog?.open) dialog.close(); }
  function open(event,mode='exam') {
    if(dialog?.open)return;
    opener=event?.currentTarget||document.activeElement;
    const l=labels(lang()),chapter=Number(state.chapter);
    const source=[...root.querySelectorAll('.verse[data-verse]')].map(row=>({bookIndex:Number(state.bookIndex),chapter,verse:Number(row.dataset.verse),text:row.querySelector('.verse-text')?.textContent?.trim()||'',selected:row.classList.contains('multi-selected')})).filter(row=>row.verse&&row.text);
    if(!source.length||!document.querySelector('#status')?.hidden)return;
    const readerBookIndex=Number(state.bookIndex),selected=source.filter(row=>row.selected);
    let quizBookIndex=readerBookIndex,book=window.BibleI18n?.bookName?.(quizBookIndex)||BOOKS[quizBookIndex]?.ko||'';
    const quizTranslationId=activeTranslationId;
    const version=document.querySelector('#translationSelect')?.selectedOptions[0]?.textContent||'';
    let chapters=typeof currentBookData!=='undefined'&&currentBookData?.chapters?.length?currentBookData.chapters:[{chapter,verses:source}];
    let quizStructure=chapters.map(ch=>({chapter:Number(ch.chapter),verses:ch.verses.map(v=>Number(v.verse))}));
    let chapterNumbers=chapters.map(ch=>Number(ch.chapter)).sort((a,b)=>a-b),bookLoadRun=0;
    const collectionKey='bible-reader-memory-passages-v1';
    let collectionRefs=[];try{const saved=JSON.parse(window.BibleStorage.getItem(collectionKey)||'[]');if(Array.isArray(saved))collectionRefs=[...new Map(saved.filter(r=>r&&Number.isInteger(r.bookIndex)&&r.bookIndex>=0&&r.bookIndex<BOOKS.length&&Number.isInteger(r.chapter)&&r.chapter>0&&Number.isInteger(r.verse)&&r.verse>0).map(r=>[passageKey(r),{bookIndex:r.bookIndex,chapter:r.chapter,verse:r.verse}])).values()];}catch{}
    let collectionRows=[],collectionRun=0,collectionLoading=false,collectionFailed=false,setupRun=0;
    const collectionTexts=new Map(),nameFor=index=>window.BibleI18n?.bookName?.(index)||BOOKS[index]?.ko||book;
    const config={mode,view:'verse',selected:!!selected.length,collection:!!collectionRefs.length,fromChapter:chapter,toChapter:chapter,fromVerse:selected[0]?.verse||source[0].verse,toVerse:selected.at(-1)?.verse||source.at(-1).verse};
    let lastDeletedCollection=null,practiceShown=true,practiceConfirmed=new Set();
    let rows=[],attemptRows=[],draftAnswers=[],reviewOnly=false,started=0,session=null;
    let phase='setup',attemptActive=false,suspendedAttempt=null,leaveDialog=null,lastAnswerFocus=null;
    const reference=items=>bookPassageReference(items,index=>nameFor(index??quizBookIndex),config.collection);
    const attemptReference=items=>reviewOnly?bookPassageReference(items,index=>nameFor(index??quizBookIndex),true):reference(items);
    const rowReference=row=>`${config.collection?nameFor(row.bookIndex)+' ':''}${row.chapter}:${row.verse}`;
    const activeRows=()=>config.collection?collectionRows:rows;
    const button=(text,handler,className='')=>{const b=el('button',className,text);b.type='button';b.addEventListener('click',handler);return b;};
    dialog=el('dialog','memory-quiz');dialog.id='memoryQuizDialog';dialog.setAttribute('aria-labelledby','memoryQuizTitle');
    const header=el('header','memory-header'),title=el('h2','',l.title),closeButton=button(l.close,requestClose,'memory-close');
    title.id='memoryQuizTitle';closeButton.setAttribute('aria-label',l.close);
    const closeIcon=el('span','memory-close-icon','×');closeIcon.setAttribute('aria-hidden','true');closeButton.replaceChildren(el('span','memory-close-label',l.close),closeIcon);header.append(title,closeButton);
    const context=el('p','memory-context',`${book} · ${version}`),content=el('div','memory-content'),dock=el('div','memory-dock');dock.hidden=true;dock.setAttribute('role','group');dock.setAttribute('aria-label',l.title);dialog.append(header,context,content,dock);document.body.append(dialog);
    const viewport=window.visualViewport;let viewportFrame=0,lastContentWidth=0,revealFocused=false,shortNotices=null;
    content.addEventListener('focusin',event=>{if(event.target.matches('.memory-answer'))lastAnswerFocus=event.target;});
    dialog.addEventListener('cancel',event=>{event.preventDefault();requestClose();});
    const hasDraftWork=()=>attemptActive&&draftAnswers.some(value=>String(value||'').trim());
    function requestClose(){if(hasDraftWork())confirmLeave('close',close);else close();}
    function confirmLeave(kind,accept){
      if(leaveDialog?.open)return;
      const returnFocus=document.activeElement,guard=el('dialog','memory-leave-confirm');leaveDialog=guard;
      guard.setAttribute('role','alertdialog');guard.setAttribute('aria-labelledby','memoryLeaveTitle');guard.setAttribute('aria-describedby','memoryLeavePrompt');
      const heading=el('h3','',l.protectDraftTitle);heading.id='memoryLeaveTitle';
      const body=el('div','memory-leave-body'),message=el('p','',kind==='close'?l.closeDraftPrompt:l.restartDraftPrompt);message.id='memoryLeavePrompt';body.append(message);
      const actions=el('div','memory-leave-actions');
      function finish(discard){
        if(leaveDialog!==guard)return;
        guard.close();guard.remove();leaveDialog=null;
        if(discard)accept();else if(suspendedAttempt)resumeAttempt();else{const focus=lastAnswerFocus?.isConnected&&lastAnswerFocus.getClientRects().length?lastAnswerFocus:returnFocus;if(focus?.isConnected)focus.focus({preventScroll:true});}
      }
      const keep=button(l.keepDraft,()=>finish(false),'memory-leave-keep'),discard=button(kind==='close'?l.discardClose:l.discardStart,()=>finish(true),'memory-leave-discard');
      actions.append(keep,discard);guard.append(heading,body,actions);document.body.append(guard);
      guard.addEventListener('cancel',event=>{event.preventDefault();finish(false);});
      syncViewport();guard.showModal();keep.focus({preventScroll:true});
    }
    function resumeAttempt(){
      if(!suspendedAttempt)return;
      const saved=suspendedAttempt;suspendedAttempt=null;++bookLoadRun;++collectionRun;++setupRun;
      Object.assign(config,saved.config);quizBookIndex=saved.quizBookIndex;book=saved.book;chapters=saved.chapters;quizStructure=saved.quizStructure;chapterNumbers=saved.chapterNumbers;rows=saved.rows;collectionRows=saved.collectionRows;collectionLoading=false;collectionFailed=false;
      phase='attempt';title.textContent=saved.title;context.textContent=saved.context;dock.setAttribute('aria-label',saved.dockLabel);
      content.classList.toggle('memory-chapter-view',config.view==='chapter');content.replaceChildren(...saved.content);dock.replaceChildren(...saved.dock);dock.hidden=false;
      resizeAnswers();syncViewport();content.scrollTop=saved.scroll;
      const focus=saved.focus?.isConnected&&saved.focus.getClientRects().length?saved.focus:content.querySelector('.memory-practice-row[open] textarea')||content.querySelector('textarea');focus?.focus({preventScroll:true});
    }

    function moveClose(target,before=null){if(closeButton.parentElement===target&&(before?closeButton.nextElementSibling===before:target.lastElementChild===closeButton))return;const focused=document.activeElement===closeButton;target.insertBefore(closeButton,before);if(focused)closeButton.focus({preventScroll:true});}
    function placeNotices(){
      if(dock.hidden||!shortNotices)return;
      // On very short screens keep the two actions pinned; guidance stays in the scrollable input area.
      if(dialog.classList.contains('memory-tight-height')||dialog.classList.contains('memory-practice-wide'))shortNotices.append(...[...dock.children].filter(n=>n.matches('.memory-error,.memory-feedback,.memory-dock-status')));
      else dock.prepend(...shortNotices.children);
    }
    // Measure outside layout: collapsing the focused field resets scrolling and
    // an auto-sized centered dialog moves on every wrapped line.
    const measure=el('div');measure.setAttribute('aria-hidden','true');
    measure.style.cssText='position:fixed;left:-100000px;top:0;visibility:hidden;pointer-events:none;white-space:pre-wrap;overflow-wrap:anywhere;min-height:0;height:auto;margin:0;';dialog.append(measure);
    function fitAnswer(input){
      if(!input.getClientRects().length)return;
      const style=getComputedStyle(input);
      for(const property of ['boxSizing','font','lineHeight','letterSpacing','wordSpacing','textIndent','textTransform','tabSize','padding','border','wordBreak','direction'])measure.style[property]=style[property];
      measure.style.width=`${input.getBoundingClientRect().width}px`;
      measure.textContent=input.value+'\u200b';
      const height=`${Math.ceil(Math.max(parseFloat(style.minHeight)||0,measure.getBoundingClientRect().height))}px`;
      if(input.style.height!==height)input.style.height=height;
    }
    function resizeAnswers(){
      content.querySelectorAll('textarea').forEach(fitAnswer);lastContentWidth=content.clientWidth;
    }
    function syncViewport(){
      viewportFrame=0;if(!dialog?.open)return;
      // Keep native pinch zoom/panning; only fit the keyboard-sized viewport at normal zoom.
      if(Math.abs((viewport?.scale||1)-1)>.05){revealFocused=false;return;}
      const height=viewport?.height||window.innerHeight,width=viewport?.width||window.innerWidth;
      dialog.style.setProperty('--memory-view-height',`${height}px`);
      dialog.style.setProperty('--memory-view-width',`${width}px`);
      dialog.style.setProperty('--memory-center-x',`${(viewport?.offsetLeft||0)+width/2}px`);
      dialog.style.setProperty('--memory-center-y',`${(viewport?.offsetTop||0)+height/2}px`);
      if(leaveDialog)for(const property of ['--memory-view-height','--memory-view-width','--memory-center-x','--memory-center-y'])leaveDialog.style.setProperty(property,dialog.style.getPropertyValue(property));
      dialog.classList.toggle('memory-compact-height',height<500);
      dialog.classList.toggle('memory-tight-height',height<400);
      dialog.classList.toggle('memory-practice-wide',phase==='attempt'&&config.mode==='practice'&&width>=900);
      dialog.classList.toggle('memory-minimal-header',height<320&&width<500);
      const ultraShort=height<320&&!dock.hidden,stacked=ultraShort&&width<500&&parseFloat(getComputedStyle(dock.querySelector('.memory-primary')).fontSize)>20;
      dialog.classList.toggle('memory-ultra-short',ultraShort);dialog.classList.toggle('memory-stacked-controls',stacked);moveClose(ultraShort?dock:header,stacked?dock.querySelector('.memory-aids'):null);
      placeNotices();
      if(content.clientWidth!==lastContentWidth)resizeAnswers();
      const focused=document.activeElement;
      if(revealFocused&&content.contains(focused)&&focused.matches('.memory-answer'))focused.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'});
      revealFocused=false;
    }
    function queueViewport(event){if(event.type==='resize')revealFocused=true;if(!viewportFrame)viewportFrame=requestAnimationFrame(syncViewport);}
    window.addEventListener('resize',queueViewport);viewport?.addEventListener('resize',queueViewport);viewport?.addEventListener('scroll',queueViewport);
    dialog.addEventListener('close',()=>{leaveDialog?.close();leaveDialog?.remove();leaveDialog=null;suspendedAttempt=null;window.removeEventListener('resize',queueViewport);viewport?.removeEventListener('resize',queueViewport);viewport?.removeEventListener('scroll',queueViewport);cancelAnimationFrame(viewportFrame);const old=dialog;dialog=null;old.remove();if(opener?.isConnected&&opener.getClientRects().length)opener.focus();else document.querySelector('#toolbarMoreToggle')?.focus();});
    function preview(target,items){for(const row of items){const p=el('p');p.append(el('span','memory-verse-number',rowReference(row)),document.createTextNode(row.text));target.append(p);}}
    function errorLegend(){
      const legend=el('div','memory-legend');legend.setAttribute('role','list');
      for(const kind of ['wrong','missing','extra']){const item=el('span',`memory-legend-item memory-legend-${kind}`,l[kind]);item.setAttribute('role','listitem');legend.append(item);}
      return legend;
    }
    function gradeCard(row,answer,g){
      const card=el('section','memory-result');card.append(el('h4','',`${rowReference(row)} · ${g.score}%`));
      const line=el('p','memory-diff');line.setAttribute('dir','auto');
      const appendRuns=(target,runs)=>{for(const run of runs){const span=el('span',`memory-${run.kind}`,run.text);if(run.kind!=='correct')span.title=l[run.kind];target.append(span);}};
      for(const word of comparisonWords(comparisonRuns(row.text,answer,g.parts))){
        if(!word.wrong){appendRuns(line,word.runs);continue;}
        const correction=el('span','memory-correction'),correct=el('span','memory-correction-text',word.expected),entered=el('span','memory-correction-base');
        correct.title=l.expected;appendRuns(entered,word.runs);correction.append(correct,entered);line.append(correction);
      }
      if(!line.childNodes.length)line.textContent='—';card.append(line);
      if(!g.exact)card.append(el('p','memory-counts',['wrong','missing','extra'].map(kind=>`${l[kind]} ${g.parts.filter(p=>p.kind===kind).length}`).join(' · ')));return card;
    }
    function setup(){
      moveClose(header);
      if(phase==='attempt')suspendedAttempt={config:{...config},quizBookIndex,book,chapters,quizStructure,chapterNumbers,rows,collectionRows,title:title.textContent,context:context.textContent,dockLabel:dock.getAttribute('aria-label'),content:[...content.childNodes],dock:[...dock.childNodes],scroll:content.scrollTop,focus:lastAnswerFocus};
      phase='setup';
      if(!collectionRefs.length){config.collection=false;collectionLoading=false;collectionFailed=false;}

      ++bookLoadRun;const activeDialog=dialog,currentSetup=++setupRun;
      context.textContent=`${book} · ${version}`;dock.hidden=true;dock.replaceChildren();content.classList.remove('memory-chapter-view');content.replaceChildren();
      const modes=el('fieldset','memory-modes');modes.append(el('legend','',l.mode));modes.setAttribute('aria-describedby','memoryModeDescription');
      const modeDescription=el('p','memory-mode-description');modeDescription.id='memoryModeDescription';
      for(const [value,text] of [['practice',l.practiceTitle],['exam',l.examMode]]){
        const label=el('label'),input=el('input');input.type='radio';input.name='memoryMode';input.value=value;input.id=value==='practice'?'memoryModePractice':'memoryModeExam';input.checked=config.mode===value;
        input.addEventListener('change',()=>{config.mode=value;syncMode();refresh();});label.append(input,document.createTextNode(text));modes.append(label);
      }
      const views=el('fieldset','memory-views');views.append(el('legend','',l.view));let chapterViewText;
      for(const [value,text] of [['verse',l.verseView],['chapter',l.chapterView]]){
        const label=el('label'),input=el('input');input.type='radio';input.name='memoryView';input.value=value;input.id=value==='verse'?'memoryViewVerse':'memoryViewChapter';input.checked=config.view===value;
        const copy=document.createTextNode(text);if(value==='chapter')chapterViewText=copy;
        input.addEventListener('change',()=>{config.view=value;syncHelp();});label.append(input,copy);views.append(label);
      }
      const range=el('details','memory-range'),rangeTitle=el('summary'),fields=el('div','memory-fields memory-chapter-fields');range.open=true;range.append(rangeTitle);
      const bookField=el('label','memory-book-field',l.book),bookSelect=el('select');bookSelect.id='memoryBook';
      for(const item of BOOKS){const option=el('option','',window.BibleI18n?.bookName?.(item.index)||item.ko);option.value=String(item.index);bookSelect.append(option);}
      bookSelect.value=String(quizBookIndex);bookField.append(bookSelect);range.append(bookField);
      const fromChapter=el('select'),toChapter=el('select'),fromVerse=el('select'),toVerse=el('select');
      fromChapter.id='memoryFromChapter';toChapter.id='memoryToChapter';fromVerse.id='memoryFromVerse';toVerse.id='memoryToVerse';
      function fillChapters(){for(const select of [fromChapter,toChapter]){select.replaceChildren();for(const n of chapterNumbers){const option=el('option','',String(n));option.value=String(n);select.append(option);}}}
      fillChapters();
      fromChapter.value=String(config.fromChapter);toChapter.value=String(config.toChapter);
      function fillVerses(chapterSelect,verseSelect,value,last=false){
        const numbers=quizStructure?.find(ch=>ch.chapter===Number(chapterSelect.value))?.verses||[];verseSelect.replaceChildren();
        for(const n of numbers){const option=el('option','',String(n));option.value=String(n);verseSelect.append(option);}
        if(numbers.includes(Number(value)))verseSelect.value=String(value);else if(last&&numbers.length)verseSelect.value=String(numbers.at(-1));
      }
      fillVerses(fromChapter,fromVerse,config.fromVerse);fillVerses(toChapter,toVerse,config.toVerse,true);
      const useSelected=el('input');useSelected.type='checkbox';useSelected.checked=config.selected;useSelected.id='memoryUseSelected';
      const selectedLabel=el('label','memory-use-selected');selectedLabel.append(useSelected,document.createTextNode(`${l.selected} (${selected.length})`));selectedLabel.hidden=!selected.length||quizBookIndex!==readerBookIndex;range.append(selectedLabel);
      for(const [text,select] of [[l.firstChapter,fromChapter],[l.from,fromVerse],[l.lastChapter,toChapter],[l.to,toVerse]]){const label=el('label','',text);label.append(select);fields.append(label);}
      const rangePickers=[[bookSelect,l.book,true],[fromChapter,l.firstChapter],[fromVerse,l.from],[toChapter,l.lastChapter],[toVerse,l.to]]
        .map(([select,label,isBook])=>window.BibleTitleNavigator.enhanceSelect(select,{label,isBook,owner:dialog}));
      const loadStatus=el('p','memory-load-status');loadStatus.hidden=true;loadStatus.setAttribute('role','status');
      const reloadButton=button(l.reload,()=>loadQuizBook());reloadButton.hidden=true;
      range.append(fields,loadStatus,reloadButton);
      const study=el('details','memory-study'),studyTitle=el('summary','',l.preview),passage=el('div','memory-preview');study.append(studyTitle,passage);
      const summary=el('p','memory-reference');
      let loading=false,loadFailed=false;
      const collection=el('details','memory-collection'),collectionTitle=el('summary'),collectionToggleLabel=el('label','memory-use-selected'),collectionToggle=el('input'),collectionToggleText=document.createTextNode(l.useCollection);collectionToggle.type='checkbox';collectionToggle.id='memoryUseCollection';collectionToggleLabel.append(collectionToggle,collectionToggleText);
      const collectionList=el('ul','memory-collection-list'),collectionStatus=el('p','memory-load-status');collectionStatus.setAttribute('role','status');
      const persistCollection=()=>{try{window.BibleStorage.setItem(collectionKey,JSON.stringify(collectionRefs));}catch{}};
      const management=el('details','memory-collection-management');management.append(el('summary','',l.manageCollection));
      const clearPrompt=el('div','memory-collection-confirm');clearPrompt.hidden=true;clearPrompt.setAttribute('role','group');clearPrompt.setAttribute('aria-labelledby','memoryCollectionDeleteQuestion');
      const clearQuestion=el('p');clearQuestion.id='memoryCollectionDeleteQuestion';
      const clearCollection=button(l.deleteCollection,()=>{clearPrompt.hidden=false;clearCollection.hidden=true;renderCollection();cancelClear.focus({preventScroll:true});},'memory-collection-clear');
      const cancelClear=button(l.cancel,()=>{clearPrompt.hidden=true;clearCollection.hidden=false;clearCollection.focus({preventScroll:true});},'memory-collection-cancel');
      const confirmClear=button(l.confirmDelete,()=>{
        if(!collectionRefs.length)return;
        lastDeletedCollection={refs:collectionRefs.map(ref=>({...ref})),useCollection:config.collection};collectionRefs=[];config.collection=false;
        clearPrompt.hidden=true;clearCollection.hidden=false;persistCollection();loadCollection();undoClear.focus({preventScroll:true});
      },'memory-collection-confirm-delete');
      const clearActions=el('div','memory-collection-delete-actions');clearActions.append(cancelClear,confirmClear);clearPrompt.append(clearQuestion,clearActions);management.append(clearCollection,clearPrompt);
      const undoNotice=el('div','memory-collection-undo');undoNotice.setAttribute('role','status');
      const undoMessage=el('span'),undoClear=button(l.undo,()=>{
        if(!lastDeletedCollection)return;
        collectionRefs=[...new Map([...lastDeletedCollection.refs,...collectionRefs].map(ref=>[passageKey(ref),ref])).values()];config.collection=config.collection||lastDeletedCollection.useCollection;lastDeletedCollection=null;
        persistCollection();loadCollection();management.open=false;collectionToggle.focus({preventScroll:true});
      },'memory-collection-restore');undoNotice.append(undoMessage,undoClear);
      const collectionRetry=button(l.reload,()=>loadCollection(),'memory-collection-reload');
      collection.append(collectionTitle,collectionToggleLabel,el('p','memory-privacy',l.savedCollection),collectionStatus,collectionRetry,collectionList,management,undoNotice);
      collection.open=!!collectionRefs.length;
      function renderCollection(){
        collectionTitle.textContent=`${l.collection} · ${collectionRefs.length} ${l.count}`;collectionToggle.checked=config.collection;collectionToggle.disabled=!collectionRefs.length;clearCollection.disabled=!collectionRefs.length;collectionRetry.hidden=!collectionFailed;
        confirmClear.disabled=!collectionRefs.length;clearQuestion.textContent=l.confirmCollectionDelete.replace('{count}',collectionRefs.length);
        undoNotice.hidden=!lastDeletedCollection;undoMessage.textContent=lastDeletedCollection?l.collectionDeleted.replace('{count}',lastDeletedCollection.refs.length):'';
        collectionStatus.hidden=!collectionLoading&&!collectionFailed;collectionStatus.textContent=collectionFailed?l.collectionError:l.loading;collectionStatus.setAttribute('role',collectionFailed?'alert':'status');
        collectionList.replaceChildren();for(const ref of collectionRefs){const text=`${nameFor(ref.bookIndex)} ${ref.chapter}:${ref.verse}`,item=el('li'),remove=button('×',()=>{collectionRefs=collectionRefs.filter(r=>passageKey(r)!==passageKey(ref));if(!collectionRefs.length)config.collection=false;persistCollection();loadCollection();});remove.setAttribute('aria-label',`${l.removeCollection} ${text}`);item.append(el('span','',text),remove);collectionList.append(item);}
      }
      async function loadCollection(){
        const run=++collectionRun,refs=collectionRefs.slice();collectionLoading=true;collectionFailed=false;collectionRows=[];refresh();
        try{
          const needed=[...new Set(refs.filter(ref=>!collectionTexts.has(passageKey(ref))).map(ref=>ref.bookIndex))];
          const data=new Map(await Promise.all(needed.map(async index=>[index,await fetchBook(BOOKS[index],quizTranslationId)])));
          const resolved=refs.map(ref=>{const cached=collectionTexts.get(passageKey(ref));if(cached)return cached;const text=data.get(ref.bookIndex)?.chapters?.find(ch=>Number(ch.chapter)===ref.chapter)?.verses?.find(v=>Number(v.verse)===ref.verse)?.text;if(!text)throw new Error('Missing collection verse');return {...ref,text:String(text).trim()};});
          if(run!==collectionRun||currentSetup!==setupRun||dialog!==activeDialog||!dialog?.open)return;
          resolved.forEach(row=>collectionTexts.set(passageKey(row),row));collectionRows=resolved;
        }catch{if(run!==collectionRun||currentSetup!==setupRun||dialog!==activeDialog||!dialog?.open)return;collectionFailed=true;}
        collectionLoading=false;refresh();
      }
      function refresh(){
        config.selected=quizBookIndex===readerBookIndex&&!!selected.length&&useSelected.checked;config.fromChapter=Number(fromChapter.value);config.toChapter=Number(toChapter.value);config.fromVerse=Number(fromVerse.value);config.toVerse=Number(toVerse.value);
        selectedLabel.hidden=!selected.length||quizBookIndex!==readerBookIndex;useSelected.disabled=loading||loadFailed;
        for(const select of [fromChapter,fromVerse,toChapter,toVerse])select.disabled=config.selected||(loading&&!quizStructure)||loadFailed;
        rangePickers.forEach(picker=>picker.sync());
        rows=config.selected?selected:passageRows(chapters,config.fromChapter,config.fromVerse,config.toChapter,config.toVerse);
        if(loading||loadFailed)rows=[];
        const target=activeRows();summary.textContent=target.length?`${reference(target)} · ${target.length} ${l.count}`:'';rangeTitle.textContent=config.mode==='practice'?l.practiceRange:l.range;startButton.disabled=!target.length||(config.collection&&(collectionLoading||collectionFailed));passage.replaceChildren();preview(passage,target);addCollection.disabled=!rows.length||loading||loadFailed;renderCollection();
      }
      const startButton=button('',()=>{
        const target=activeRows().slice();if(hasDraftWork())confirmLeave('restart',()=>begin(target));else begin(target);
      },'memory-primary memory-setup-start');
      function syncMode(){
        const practice=config.mode==='practice';title.textContent=practice?l.practiceTitle:l.title;dock.setAttribute('aria-label',title.textContent);
        modeDescription.textContent=practice?l.practiceIntro:l.examIntro;startButton.textContent=practice?l.practiceStart:l.examStart;collectionToggleText.nodeValue=practice?l.practiceUseCollection:l.useCollection;
        chapterViewText.nodeValue=practice?l.practiceChapterView:l.chapterView;syncHelp();
      }
      const addCollection=button(l.addCollection,()=>{for(const row of rows){const ref={bookIndex:quizBookIndex,chapter:row.chapter,verse:row.verse};if(!collectionRefs.some(r=>passageKey(r)===passageKey(ref)))collectionRefs.push(ref);collectionTexts.set(passageKey(ref),{...ref,text:row.text});}config.collection=true;collection.open=true;persistCollection();loadCollection();},'memory-collection-add');range.append(addCollection);
      collectionToggle.addEventListener('change',()=>{config.collection=collectionToggle.checked;refresh();});
      async function loadQuizBook(){
        const run=++bookLoadRun,index=Number(bookSelect.value);quizBookIndex=index;loading=true;loadFailed=false;useSelected.checked=false;
        quizStructure=getBookStructure(index,quizTranslationId);
        chapterNumbers=quizStructure?.map(ch=>ch.chapter)||[];
        fillChapters();fromChapter.value=toChapter.value=String(chapterNumbers[0]||'');
        fillVerses(fromChapter,fromVerse,1);fillVerses(toChapter,toVerse,null,true);
        book=window.BibleI18n?.bookName?.(index)||BOOKS[index]?.ko||'';context.textContent=`${book} · ${version}`;
        loadStatus.textContent=l.loading;loadStatus.hidden=false;loadStatus.setAttribute('role','status');reloadButton.hidden=true;refresh();
        try{
          const data=await fetchBook(BOOKS[index],quizTranslationId);
          if(run!==bookLoadRun||dialog!==activeDialog||!dialog?.open)return;
          if(!data?.chapters?.length)throw new Error('Empty passage');
          const chosen={fromChapter:fromChapter.value,toChapter:toChapter.value,fromVerse:fromVerse.value,toVerse:toVerse.value};
          chapters=data.chapters;chapterNumbers=chapters.map(ch=>Number(ch.chapter)).sort((a,b)=>a-b);
          quizStructure=chapters.map(ch=>({chapter:Number(ch.chapter),verses:ch.verses.map(v=>Number(v.verse))}));
          book=window.BibleI18n?.bookName?.(index)||BOOKS[index]?.ko||'';context.textContent=`${book} · ${version}`;
          fillChapters();
          fromChapter.value=chapterNumbers.includes(Number(chosen.fromChapter))?chosen.fromChapter:String(chapterNumbers[0]);
          toChapter.value=chapterNumbers.includes(Number(chosen.toChapter))?chosen.toChapter:fromChapter.value;
          fillVerses(fromChapter,fromVerse,chosen.fromVerse||1);fillVerses(toChapter,toVerse,chosen.toVerse||null,true);loadStatus.hidden=true;
        }catch(_){
          if(run!==bookLoadRun||dialog!==activeDialog||!dialog?.open)return;
          loadFailed=true;loadStatus.textContent=l.loadError;loadStatus.setAttribute('role','alert');reloadButton.hidden=false;
        }
        loading=false;refresh();
      }
      bookSelect.addEventListener('change',loadQuizBook);
      fromChapter.addEventListener('change',()=>{fillVerses(fromChapter,fromVerse,1);if(Number(toChapter.value)<Number(fromChapter.value)){toChapter.value=fromChapter.value;fillVerses(toChapter,toVerse,null,true);}if(fromChapter.value===toChapter.value&&Number(fromVerse.value)>Number(toVerse.value))toVerse.value=fromVerse.value;refresh();});
      toChapter.addEventListener('change',()=>{fillVerses(toChapter,toVerse,null,true);if(Number(fromChapter.value)>Number(toChapter.value)){fromChapter.value=toChapter.value;fillVerses(fromChapter,fromVerse,1);}if(fromChapter.value===toChapter.value&&Number(fromVerse.value)>Number(toVerse.value))fromVerse.value=toVerse.value;refresh();});
      fromVerse.addEventListener('change',()=>{if(fromChapter.value===toChapter.value&&Number(fromVerse.value)>Number(toVerse.value))toVerse.value=fromVerse.value;refresh();});
      toVerse.addEventListener('change',()=>{if(fromChapter.value===toChapter.value&&Number(fromVerse.value)>Number(toVerse.value))fromVerse.value=toVerse.value;refresh();});useSelected.addEventListener('change',refresh);
      const interactionHelp=el('p','memory-rule'),help=el('details','memory-help');help.append(el('summary','',l.help),interactionHelp,el('p','memory-rule',l.rule),el('p','memory-privacy',l.privacy));
      function syncHelp(){interactionHelp.textContent=config.view==='chapter'?(config.mode==='practice'?l.practiceChapterHelp:l.chapterHelp):l.enterHelp;}
      if(suspendedAttempt){const resume=el('section','memory-resume-panel');resume.append(el('p','',l.draftAvailable),button(l.resumeDraft,resumeAttempt,'memory-setup-resume'));content.append(resume);}
      content.append(modes,modeDescription,views,summary,range,collection,study,help,startButton);syncMode();refresh();if(collectionRefs.length)loadCollection();content.scrollTop=0;syncViewport();
      if(dialog.open){if(suspendedAttempt){content.scrollTop=0;content.querySelector('.memory-setup-resume')?.focus({preventScroll:true});}else{rangePickers[0].trigger.focus({preventScroll:true});bookField.scrollIntoView({block:'nearest',behavior:'instant'});}}
    }
    function begin(items=activeRows(),isReview=false){suspendedAttempt=null;attemptActive=true;++bookLoadRun;attemptRows=items.slice();draftAnswers=Array(items.length).fill('');reviewOnly=isReview;practiceShown=true;practiceConfirmed=new Set();started=performance.now();session=createSession(attemptRows,config.view);showUnit();}
    function showUnit(){
      phase='attempt';moveClose(header);
      context.textContent=config.mode==='practice'?`${version} · ${l.practiceTitle}`:reviewOnly?`${version} · ${l.review}`:version;dock.replaceChildren();dock.hidden=false;content.classList.toggle('memory-chapter-view',config.view==='chapter');
      const practice=config.mode==='practice',items=session.current,unitHeading=el('div','memory-unit-heading'),unitProgress=el('p','memory-progress',`${session.index+1} / ${session.unitCount}`);
      unitHeading.append(el('p','memory-reference',attemptReference(items.map(item=>item.row))),unitProgress);content.replaceChildren(unitHeading);
      shortNotices=el('div','memory-short-notices');content.append(shortNotices);
      const navigation=el('nav','memory-unit-nav');navigation.setAttribute('aria-label',l.view);
      const previous=button(config.view==='verse'?l.previousVerse:l.previousChapter,()=>{if(session.move(-1))showUnit();});
      const next=button(config.view==='verse'?l.nextVerse:l.nextChapter,()=>{if(session.move(1))showUnit();});
      previous.classList.add('memory-previous');next.classList.add('memory-next');previous.disabled=session.index===0;next.disabled=session.index===session.unitCount-1;navigation.append(previous,next);navigation.hidden=practice&&session.unitCount===1;content.append(navigation);
      const form=el('div','memory-answers'),feedback=el('div','memory-feedback');feedback.setAttribute('aria-live','polite');
      const error=el('p','memory-error');error.hidden=true;error.setAttribute('role','alert');
      const primary=button(l.checkAnswer,act,'memory-primary');
      if(config.view==='verse'){primary.dataset.shortcut='↵';primary.setAttribute('aria-keyshortcuts','Enter');primary.title=l.enterHelp;}
      const entered=el('span','memory-filled'),meter=el('progress','memory-meter');meter.max=items.length;meter.value=0;meter.setAttribute('aria-label',l.progress);
      const status=el('div','memory-dock-status');status.hidden=config.view==='verse';status.append(entered,meter);
      function updateProgress(){const count=inputs.filter(input=>normalize(input.value)).length;meter.value=count;entered.textContent=`${l.progress} ${count} / ${items.length}`;}
      const rowFeedbacks=[];
      const practiceSources=[],practiceCards=[],practiceStates=[],practiceChecked=items.map(({index})=>practiceConfirmed.has(index));let practiceIndex=0,practiceControls;
      function clearFeedback(position){
        feedback.replaceChildren();feedback.removeAttribute('data-correct');
        rowFeedbacks.forEach((row,i)=>{if(practice&&Number.isInteger(position)&&i!==position)return;row.replaceChildren();inputs[i].removeAttribute('aria-invalid');if(practice)practiceSources[i].hidden=!practiceShown;});
      }
      function syncPracticeRows(){
        practiceStates.forEach((node,i)=>{
          const text=practiceChecked[i]?l.correct:normalize(inputs[i].value)?l.practiceDraft:l.practicePending,complete=String(practiceChecked[i]);
          if(node.textContent!==text)node.textContent=text;if(node.dataset.complete!==complete)node.dataset.complete=complete;
        });
      }
      function syncPracticePrimary(){
        let text,action;
        if(practiceChecked.every(Boolean)){
          if(!session.canAdvance)session.check(inputs.map(input=>input.value));
          text=session.index===session.unitCount-1?l.finish:config.view==='verse'?l.nextVerse:l.nextChapter;action='next';
        }else{text=practiceChecked[practiceIndex]?l.nextVerse:l.checkAnswer;action=practiceChecked[practiceIndex]?'practice-next':'check';}
        if(primary.textContent!==text)primary.textContent=text;if(primary.dataset.action!==action)primary.dataset.action=action;
      }
      function revealPracticePair(index){
        const body=practiceSources[index]?.parentElement;
        if(dialog.classList.contains('memory-practice-wide')&&body&&body.getBoundingClientRect().height<=content.clientHeight)body.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'});
      }
      function activatePractice(index,{scroll=true}={}){
        const changed=practiceIndex!==index;practiceIndex=index;practiceCards.forEach((card,i)=>{if(card.open!==(i===index))card.open=i===index;});
        if(practiceControls&&practiceControls.parentElement!==practiceCards[index])practiceCards[index].insertBefore(practiceControls,practiceSources[index].parentElement);
        if(changed){feedback.replaceChildren();feedback.removeAttribute('data-correct');error.hidden=true;}
        if(config.view==='chapter'){const text=`${index+1} / ${items.length}`;if(unitProgress.textContent!==text)unitProgress.textContent=text;}
        fitAnswer(inputs[index]);syncPracticePrimary();
        if(scroll)practiceCards[index].scrollIntoView({block:'nearest',behavior:'instant'});
      }
      function focusAnswer(index){if(practice)activatePractice(index,{scroll:false});const input=inputs[index];input?.focus({preventScroll:true});input?.closest('.memory-answer-label').scrollIntoView({block:practice?'nearest':'start',behavior:'instant'});if(practice)revealPracticePair(index);}
      const answerLabel=row=>`${config.collection?'':nameFor(row.bookIndex??quizBookIndex)+' '}${rowReference(row)} · ${practice&&practiceShown?l.practiceAnswer:l.answer}`;
      const inputs=items.map(({row,index},position)=>{
        const label=el('label','memory-answer-label'),caption=el('span','memory-answer-reference',rowReference(row));caption.hidden=config.view==='verse';
        const input=el('textarea','memory-answer');input.rows=2;input.maxLength=Math.min(3000,row.text.length*2+120);input.autocomplete='off';input.spellcheck=false;
        input.value=draftAnswers[index]||'';
        if(practice)input.placeholder=practiceShown?l.practiceHint:l.practiceMemoryHint;
        input.setAttribute('aria-label',answerLabel(row));input.setAttribute('autocorrect','off');input.setAttribute('autocapitalize','off');input.setAttribute('dir','auto');input.dataset.book=String(row.bookIndex??quizBookIndex);input.dataset.chapter=String(row.chapter);input.dataset.verse=String(row.verse);label.append(caption,input);
        const rowFeedback=el('div','memory-row-feedback');rowFeedback.id=`memoryFeedback${row.bookIndex??quizBookIndex}_${row.chapter}_${row.verse}`;input.setAttribute('aria-describedby',rowFeedback.id);rowFeedbacks.push(rowFeedback);
        if(practice){
          const card=el('details','memory-practice-row'),summary=el('summary'),stateLabel=el('span','memory-practice-state');summary.hidden=items.length===1;
          summary.append(el('span','',rowReference(row)),stateLabel);summary.addEventListener('click',event=>{event.preventDefault();activatePractice(position);});
          const text=el('p','memory-practice-text',row.text);text.id=`memoryPracticeText${index}`;text.setAttribute('dir','auto');text.hidden=!practiceShown;
          const body=el('div','memory-practice-body');body.append(text,rowFeedback,label);
          caption.hidden=true;practiceSources.push(text);practiceCards.push(card);practiceStates.push(stateLabel);card.append(summary,body);form.append(card);
          input.addEventListener('focus',()=>activatePractice(position,{scroll:false}));
        }else form.append(label,rowFeedback);
        let composing=false;input.addEventListener('compositionstart',()=>{composing=true;});input.addEventListener('compositionend',()=>{composing=false;});
        input.addEventListener('input',()=>{draftAnswers[index]=input.value;session.invalidate();if(practice){practiceChecked[position]=false;practiceConfirmed.delete(index);}clearFeedback(practice?position:undefined);error.hidden=true;primary.textContent=l.checkAnswer;primary.dataset.action='check';if(practice){syncPracticeRows();syncPracticePrimary();}fitAnswer(input);updateProgress();if(practice)revealPracticePair(position);});
        input.addEventListener('keydown',e=>{if(config.view!=='verse'||e.key!=='Enter'||e.shiftKey||e.ctrlKey||e.altKey||e.metaKey||e.isComposing||composing||e.keyCode===229)return;e.preventDefault();if(!e.repeat)act();});return input;
      });
      primary.dataset.action='check';primary.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.repeat)e.preventDefault();});
      function act(){
        if(session.canAdvance){session.advance();if(session.done)results(config.mode==='practice'?draftAnswers:session.firstAnswers);else showUnit();return;}
        if(practice){
          if(practiceChecked[practiceIndex]){
            const next=items.map((_,offset)=>(practiceIndex+offset+1)%items.length).find(index=>!practiceChecked[index]);focusAnswer(next);return;
          }
          const index=practiceIndex,value=inputs[index].value,g=grade(items[index].row.text,value);clearFeedback(index);error.hidden=true;
          feedback.dataset.correct=String(g.exact);inputs[index].setAttribute('aria-invalid',String(!g.exact));practiceChecked[index]=g.exact;
          if(g.exact)practiceConfirmed.add(items[index].index);else practiceConfirmed.delete(items[index].index);
          if(g.exact)feedback.append(el('p','memory-correct',l.correct));
          else{practiceSources[index].hidden=true;rowFeedbacks[index].append(gradeCard(items[index].row,value,g));feedback.append(errorLegend());error.textContent=l.editRetry;error.hidden=false;focusAnswer(index);}
          syncPracticeRows();syncPracticePrimary();return;
        }
        const values=inputs.map(input=>input.value),checked=session.check(values);
        if(checked.empty){error.textContent=l.empty;error.hidden=false;focusAnswer(0);return;}
        clearFeedback();error.hidden=true;feedback.dataset.correct=String(checked.correct);checked.grades.forEach((g,i)=>inputs[i].setAttribute('aria-invalid',String(!g.exact)));
        if(checked.correct){
          checked.grades.forEach((g,i)=>rowFeedbacks[i].append(gradeCard(items[i].row,values[i],g)));
          const next=session.index===session.unitCount-1?l.finish:config.view==='verse'?l.nextVerse:l.nextChapter;
          primary.textContent=next;primary.dataset.action='next';feedback.append(el('p','memory-correct',l.correct));
        }else{
          error.textContent=l.editRetry;error.hidden=false;feedback.append(errorLegend());
          checked.grades.forEach((g,i)=>{if(!g.exact)rowFeedbacks[i].append(gradeCard(items[i].row,values[i],g));});
          focusAnswer(checked.grades.findIndex(g=>!g.exact));
          if(!values.some(value=>normalize(value)))rowFeedbacks[0]?.scrollIntoView({block:'nearest',behavior:'instant'});
        }
      }
      const aids=el('div','memory-aids');aids.append(button(l.shortChange,setup));dock.append(error,feedback,status,primary,aids);
      placeNotices();
      if(practice){
        const controls=el('div','memory-practice-controls');practiceControls=controls;
        const reveal=button('',()=>{
          practiceShown=!practiceShown;clearFeedback();error.hidden=true;syncPracticePrimary();
          syncReveal();
        },'memory-practice-reveal');
        function syncReveal(){
          reveal.textContent=practiceShown?l.hidePracticeText:l.showPracticeText;reveal.setAttribute('aria-pressed',String(practiceShown));
          const hint=practiceShown?l.practiceHint:l.practiceMemoryHint;
          inputs.forEach((input,i)=>{if(input.placeholder!==hint)input.placeholder=hint;const label=answerLabel(items[i].row);if(input.getAttribute('aria-label')!==label)input.setAttribute('aria-label',label);});
        }
        reveal.setAttribute('aria-controls',practiceSources.map(text=>text.id).join(' '));syncReveal();
        controls.append(reveal,button(l.repeatPractice,()=>{
          const index=practiceIndex,input=inputs[index];input.value='';draftAnswers[items[index].index]='';practiceChecked[index]=false;practiceConfirmed.delete(items[index].index);session.invalidate();clearFeedback(index);error.hidden=true;syncPracticeRows();syncPracticePrimary();fitAnswer(input);updateProgress();focusAnswer(index);
        },'memory-practice-repeat'));
      }
      content.append(form);if(practice){syncPracticeRows();activatePractice(0,{scroll:false});}updateProgress();resizeAnswers();content.scrollTop=0;inputs[0]?.focus({preventScroll:true});syncViewport();if(practice)revealPracticePair(0);
    }
    function results(answers){
      phase='results';attemptActive=false;suspendedAttempt=null;moveClose(header);
      answers=attemptRows.map((row,index)=>answers[index]===undefined?(draftAnswers[index]||''):answers[index]);
      dock.hidden=true;dock.replaceChildren();content.classList.remove('memory-chapter-view');
      const grades=attemptRows.map((row,i)=>grade(row.text,answers[i])),units=grades.reduce((n,g)=>n+g.units,0),distance=grades.reduce((n,g)=>n+g.distance,0),exact=grades.every(g=>g.exact),score=units?Math.min(exact?100:99,Math.round(100*(1-distance/units))):0;
      const mistakes=attemptRows.filter((row,i)=>!grades[i].exact);
      content.replaceChildren(el('h3','',config.mode==='practice'?l.practiceResult:l.result),el('p','memory-reference',attemptReference(attemptRows)));
      const result=el('p','memory-score',`${score}%`);result.setAttribute('aria-label',`${l.score} ${score}%`);content.append(result,el('p','memory-rule',config.mode==='practice'?l.practiceResultNote:l.firstCheck),el('p','memory-verdict',exact?l.perfect:l.tryAgain),el('p','memory-rule',`${Math.round((performance.now()-started)/1000)} ${l.time}`));
      const actions=el('div','memory-actions'),retryAll=button(l.retryAll,()=>begin(),'memory-retry-all');
      const retry=mistakes.length?button(`${l.retryWrong} (${mistakes.length})`,()=>begin(mistakes,true),'memory-primary memory-retry-wrong'):retryAll;
      if(mistakes.length)actions.append(retry);else retryAll.classList.add('memory-primary');actions.append(retryAll,button(l.change,setup));content.append(actions);
      const list=el('div','memory-results');grades.forEach((g,i)=>{
        const card=gradeCard(attemptRows[i],answers[i],g);
        if(config.mode==='practice'){const review=el('details','memory-practice-review');review.append(el('summary','',`${rowReference(attemptRows[i])} · ${g.score}%`),card);review.open=!g.exact&&mistakes[0]===attemptRows[i];list.append(review);}
        else list.append(card);
      });if(mistakes.length)content.append(errorLegend());content.append(list);content.scrollTop=0;retry.focus({preventScroll:true});syncViewport();
    }
    setup();dialog.showModal();syncViewport();
  }

  function entry(className,mode='exam') {const l=labels(lang()),b=el('button',className,mode==='practice'?l.practiceTitle:l.title);b.type='button';b.addEventListener('click',event=>open(event,mode));return b;}
  // Practice comes before the test, grouped under their own divider in the overflow menu.
  const practiceMenuButton=entry('memory-practice-menu-button','practice');
  const menuButton=entry('memory-menu-button');
  const memoryDivider=el('div','toolbar-more-sep toolbar-more-sep-memory');memoryDivider.setAttribute('role','separator');
  menu.append(memoryDivider,practiceMenuButton,menuButton);
  // The memory test is the site's headline feature, so it also gets a first-row entry.
  const TOOLBAR_LABEL={ko:'암송 시험',en:'Memory test',fr:'Mémoriser',de:'Auswendig',zh:'背诵测验',ru:'Заучить',la:'Memoria',pt:'Memorizar',ar:'اختبار الحفظ'};
  const toolbarButton=entry('memory-toolbar-button');
  function labelToolbarButton(){const code=lang();toolbarButton.textContent=TOOLBAR_LABEL[code]||TOOLBAR_LABEL.en;toolbarButton.setAttribute('aria-label',labels(code).title);}
  labelToolbarButton();document.querySelector('#translationSelect')?.insertAdjacentElement('afterend',toolbarButton);
  const bar=document.querySelector('.verse-multi-actions');if(bar)bar.insertBefore(entry('verse-multi-memory'),bar.querySelector('.verse-multi-done'));
  if(bar&&typeof ResizeObserver!=='undefined')new ResizeObserver(()=>{
    const height=bar.parentElement.getBoundingClientRect().height;
    if(height)document.body.style.setProperty('--memory-actionbar-space',`${Math.ceil(height)+32}px`);
  }).observe(bar.parentElement);
  function updateAvailability(){const ready=!!root.querySelector('.verse-text')&&!!document.querySelector('#status')?.hidden,l=labels(lang());for(const [button,label] of [[menuButton,l.title],[practiceMenuButton,l.practiceTitle],[toolbarButton,l.title]]){button.disabled=!ready;button.title=ready?label:l.unavailable;}}
  new MutationObserver(updateAvailability).observe(root,{childList:true});updateAvailability();
  new MutationObserver(()=>{const l=labels(lang());document.querySelectorAll('.memory-menu-button,.verse-multi-memory').forEach(b=>b.textContent=l.title);practiceMenuButton.textContent=l.practiceTitle;labelToolbarButton();}).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
})();
