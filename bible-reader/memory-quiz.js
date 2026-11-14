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
  function subsetReference(book,rows) {
    const groups=[];
    for(const row of rows){const last=groups[groups.length-1];if(last&&last[0].chapter===row.chapter)last.push(row);else groups.push([row]);}
    return groups.map((group,index)=>passageReference(index?'':book,group).trim()).join(' · ');
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
      move(delta){const next=index+delta;if(!Number.isInteger(delta)||next<0||next>=units.length)return false;index=next;correct=false;return true;},
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
  const labels = code => ({...Object.fromEntries(KEYS.map((key, i) => [key, (COPY[code] || COPY.en)[i]])),
    ...Object.fromEntries(['multi','firstChapter','lastChapter','chapterScope'].map((key,i)=>[key,(CHAPTER_COPY[code]||CHAPTER_COPY.en)[i]])),
    ...Object.fromEntries(['view','verseView','chapterView','checkAnswer','nextVerse','nextChapter','finish','correct','editRetry','enterHelp','chapterHelp','firstCheck'].map((key,i)=>[key,(VIEW_COPY[code]||VIEW_COPY.en)[i]])),
    ...Object.fromEntries(['shortChange','retryWrong','retryAll','review'].map((key,i)=>[key,(AID_COPY[code]||AID_COPY.en)[i]])),
    ...Object.fromEntries(['correct','practice','help','start','preview','editRetry'].map((key,i)=>[key,(COMPACT_COPY[code]||COMPACT_COPY.en)[i]])),
    ...Object.fromEntries(['previousVerse','previousChapter'].map((key,i)=>[key,({ko:['이전 절','이전 장'],en:['Previous verse','Previous chapter'],fr:['Verset précédent','Chapitre précédent'],de:['Vorheriger Vers','Vorheriges Kapitel'],zh:['上一节','上一章'],ru:['Предыдущий стих','Предыдущая глава'],la:['Versus prior','Capitulum prius'],pt:['Versículo anterior','Capítulo anterior'],ar:['الآية السابقة','الأصحاح السابق']}[code]||['Previous verse','Previous chapter'])[i]])),
    ...Object.fromEntries(['book','loading','loadError','reload'].map((key,i)=>[key,({ko:['성경책','본문을 불러오는 중…','본문을 불러오지 못했습니다. 다시 시도해 주세요.','다시 불러오기'],en:['Book','Loading passage…','Could not load the passage. Please try again.','Reload passage'],fr:['Livre','Chargement…','Impossible de charger le passage. Réessayez.','Recharger'],de:['Buch','Text wird geladen…','Text konnte nicht geladen werden. Bitte erneut versuchen.','Erneut laden'],zh:['书卷','正在加载经文…','无法加载经文，请重试。','重新加载'],ru:['Книга','Загрузка текста…','Не удалось загрузить текст. Повторите попытку.','Загрузить снова'],la:['Liber','Textus oneratur…','Textus onerari non potuit. Iterum tenta.','Iterum onera'],pt:['Livro','Carregando passagem…','Não foi possível carregar a passagem. Tente novamente.','Recarregar'],ar:['السفر','جارٍ تحميل النص…','تعذر تحميل النص. حاول مجدداً.','إعادة التحميل']}[code]||['Book','Loading passage…','Could not load the passage. Please try again.','Reload passage'])[i]])),
    ...(code==='ko'?{wrong:'오자',missing:'빠진 글자',extra:'더 쓴 글자'}:{})});
  window.BibleMemory = {normalize, grade, labels, passageRows, passageReference, subsetReference, createSession};
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
    const readerBookIndex=Number(state.bookIndex),selected=source.filter(row=>row.selected);
    let quizBookIndex=readerBookIndex,book=window.BibleI18n?.bookName?.(quizBookIndex)||BOOKS[quizBookIndex]?.ko||'';
    const quizTranslationId=activeTranslationId;
    const version=document.querySelector('#translationSelect')?.selectedOptions[0]?.textContent||'';
    let chapters=typeof currentBookData!=='undefined'&&currentBookData?.chapters?.length?currentBookData.chapters:[{chapter,verses:source}];
    let chapterNumbers=chapters.map(ch=>Number(ch.chapter)).sort((a,b)=>a-b),bookLoadRun=0;
    const config={view:'verse',selected:!!selected.length,fromChapter:chapter,toChapter:chapter,fromVerse:selected[0]?.verse||source[0].verse,toVerse:selected.at(-1)?.verse||source.at(-1).verse};
    let rows=[],attemptRows=[],draftAnswers=[],reviewOnly=false,started=0,session=null;
    const reference=items=>passageReference(book,items);
    const attemptReference=items=>reviewOnly?subsetReference(book,items):reference(items);
    const rowReference=row=>`${row.chapter}:${row.verse}`;
    const button=(text,handler,className='')=>{const b=el('button',className,text);b.type='button';b.addEventListener('click',handler);return b;};
    dialog=el('dialog','memory-quiz');dialog.id='memoryQuizDialog';dialog.setAttribute('aria-labelledby','memoryQuizTitle');
    const header=el('header','memory-header'),title=el('h2','',l.title);title.id='memoryQuizTitle';header.append(title,button(l.close,close,'memory-close'));
    const context=el('p','memory-context',`${book} · ${version}`),content=el('div','memory-content'),dock=el('div','memory-dock');dock.hidden=true;dock.setAttribute('role','group');dock.setAttribute('aria-label',l.title);dialog.append(header,context,content,dock);document.body.append(dialog);
    const viewport=window.visualViewport;let viewportFrame=0,lastContentWidth=0,revealFocused=false,shortNotices=null;
    function placeNotices(){
      if(dock.hidden||!shortNotices)return;
      // On very short screens keep the two actions pinned; guidance stays in the scrollable input area.
      if(dialog.classList.contains('memory-tight-height'))shortNotices.append(...[...dock.children].filter(n=>n.matches('.memory-error,.memory-feedback,.memory-dock-status')));
      else dock.prepend(...shortNotices.children);
    }
    function fitAnswer(input){input.style.height='auto';const minimum=parseFloat(getComputedStyle(input).minHeight)||0;input.style.height=`${Math.max(minimum,input.scrollHeight+2)}px`;}
    function resizeAnswers(){
      const inputs=[...content.querySelectorAll('textarea')];inputs.forEach(input=>{input.style.height='auto';});
      const heights=inputs.map(input=>Math.max(parseFloat(getComputedStyle(input).minHeight)||0,input.scrollHeight+2));
      inputs.forEach((input,index)=>{input.style.height=`${heights[index]}px`;});lastContentWidth=content.clientWidth;
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
      dialog.classList.toggle('memory-compact-height',height<500);
      dialog.classList.toggle('memory-tight-height',height<400);
      placeNotices();
      if(content.clientWidth!==lastContentWidth)resizeAnswers();
      const focused=document.activeElement;
      if(revealFocused&&content.contains(focused)&&focused.matches('.memory-answer'))focused.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'});
      revealFocused=false;
    }
    function queueViewport(event){if(event.type==='resize')revealFocused=true;if(!viewportFrame)viewportFrame=requestAnimationFrame(syncViewport);}
    window.addEventListener('resize',queueViewport);viewport?.addEventListener('resize',queueViewport);viewport?.addEventListener('scroll',queueViewport);
    dialog.addEventListener('close',()=>{window.removeEventListener('resize',queueViewport);viewport?.removeEventListener('resize',queueViewport);viewport?.removeEventListener('scroll',queueViewport);cancelAnimationFrame(viewportFrame);const old=dialog;dialog=null;old.remove();if(opener?.isConnected&&opener.getClientRects().length)opener.focus();else document.querySelector('#toolbarMoreToggle')?.focus();});
    dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)close();}});
    function preview(target,items){for(const row of items){const p=el('p');p.append(el('span','memory-verse-number',rowReference(row)),document.createTextNode(row.text));target.append(p);}}
    function errorLegend(){
      const legend=el('div','memory-legend');legend.setAttribute('role','list');
      for(const kind of ['wrong','missing','extra']){const item=el('span',`memory-legend-item memory-legend-${kind}`,l[kind]);item.setAttribute('role','listitem');legend.append(item);}
      return legend;
    }
    function gradeCard(row,answer,g){
      const card=el('section','memory-result');card.append(el('h4','',`${rowReference(row)} · ${g.score}%`));
      for(const [side,caption] of [['expected',l.expected],['entered',l.entered]]){
        card.append(el('strong','memory-comparison-label',caption));const line=el('p','memory-diff');line.setAttribute('dir','auto');
        const kinds=g.parts.flatMap(part=>Array.from(part[side]).map(()=>part.kind));let cursor=0;const runs=[];
        for(const character of Array.from(String(side==='expected'?row.text:(answer||'')).normalize('NFC'))){
          const length=Array.from(normalize(character)).length,kind=length?(kinds.slice(cursor,cursor+length).find(k=>k!=='correct')||'correct'):'correct';cursor+=length;
          const last=runs.at(-1);if(last?.kind===kind)last.text+=character;else runs.push({kind,text:character});
        }
        for(const run of runs){const span=el('span',`memory-${run.kind}`,run.text);if(run.kind!=='correct')span.title=l[run.kind];line.append(span);}
        if(!line.childNodes.length)line.textContent='—';card.append(line);
      }
      card.append(el('p','memory-counts',['wrong','missing','extra'].map(kind=>`${l[kind]} ${g.parts.filter(p=>p.kind===kind).length}`).join(' · ')));return card;
    }
    function setup(){
      ++bookLoadRun;const activeDialog=dialog;
      context.textContent=`${book} · ${version}`;dock.hidden=true;dock.replaceChildren();content.classList.remove('memory-chapter-view');content.replaceChildren();
      const views=el('fieldset','memory-views');views.append(el('legend','',l.view));
      for(const [value,text] of [['verse',l.verseView],['chapter',l.chapterView]]){
        const label=el('label'),input=el('input');input.type='radio';input.name='memoryView';input.value=value;input.id=value==='verse'?'memoryViewVerse':'memoryViewChapter';input.checked=config.view===value;
        input.addEventListener('change',()=>{config.view=value;});label.append(input,document.createTextNode(text));views.append(label);
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
        const items=passageRows(chapters,Number(chapterSelect.value),1,Number(chapterSelect.value),Number.MAX_SAFE_INTEGER);verseSelect.replaceChildren();
        for(const row of items){const option=el('option','',String(row.verse));option.value=String(row.verse);verseSelect.append(option);}
        if(items.some(r=>r.verse===Number(value)))verseSelect.value=String(value);else if(last&&items.length)verseSelect.value=String(items.at(-1).verse);
      }
      fillVerses(fromChapter,fromVerse,config.fromVerse);fillVerses(toChapter,toVerse,config.toVerse,true);
      const useSelected=el('input');useSelected.type='checkbox';useSelected.checked=config.selected;useSelected.id='memoryUseSelected';
      const selectedLabel=el('label','memory-use-selected');selectedLabel.append(useSelected,document.createTextNode(`${l.selected} (${selected.length})`));selectedLabel.hidden=!selected.length||quizBookIndex!==readerBookIndex;range.append(selectedLabel);
      for(const [text,select] of [[l.firstChapter,fromChapter],[l.from,fromVerse],[l.lastChapter,toChapter],[l.to,toVerse]]){const label=el('label','',text);label.append(select);fields.append(label);}
      const loadStatus=el('p','memory-load-status');loadStatus.hidden=true;loadStatus.setAttribute('role','status');
      const reloadButton=button(l.reload,()=>loadQuizBook());reloadButton.hidden=true;
      range.append(fields,loadStatus,reloadButton);
      const study=el('details','memory-study'),studyTitle=el('summary','',l.preview),passage=el('div','memory-preview');study.append(studyTitle,passage);
      const summary=el('p','memory-reference');
      let loading=false,loadFailed=false;
      function refresh(){
        config.selected=quizBookIndex===readerBookIndex&&!!selected.length&&useSelected.checked;config.fromChapter=Number(fromChapter.value);config.toChapter=Number(toChapter.value);config.fromVerse=Number(fromVerse.value);config.toVerse=Number(toVerse.value);
        selectedLabel.hidden=!selected.length||quizBookIndex!==readerBookIndex;useSelected.disabled=loading||loadFailed;
        for(const select of [fromChapter,fromVerse,toChapter,toVerse])select.disabled=config.selected||loading||loadFailed;
        rows=config.selected?selected:passageRows(chapters,config.fromChapter,config.fromVerse,config.toChapter,config.toVerse);
        if(loading||loadFailed)rows=[];
        summary.textContent=rows.length?`${reference(rows)} · ${rows.length} ${l.count}`:'';rangeTitle.textContent=l.range;startButton.disabled=!rows.length;passage.replaceChildren();preview(passage,rows);
      }
      const startButton=button(l.start,()=>begin(),'memory-primary');
      async function loadQuizBook(){
        const run=++bookLoadRun,index=Number(bookSelect.value);quizBookIndex=index;loading=true;loadFailed=false;useSelected.checked=false;
        book=window.BibleI18n?.bookName?.(index)||BOOKS[index]?.ko||'';context.textContent=`${book} · ${version}`;
        loadStatus.textContent=l.loading;loadStatus.hidden=false;loadStatus.setAttribute('role','status');reloadButton.hidden=true;refresh();
        try{
          const data=await fetchBook(BOOKS[index],quizTranslationId);
          if(run!==bookLoadRun||dialog!==activeDialog||!dialog?.open)return;
          if(!data?.chapters?.length)throw new Error('Empty passage');
          chapters=data.chapters;chapterNumbers=chapters.map(ch=>Number(ch.chapter)).sort((a,b)=>a-b);
          book=window.BibleI18n?.bookName?.(index)||BOOKS[index]?.ko||'';context.textContent=`${book} · ${version}`;
          fillChapters();fromChapter.value=toChapter.value=String(chapterNumbers[0]);
          fillVerses(fromChapter,fromVerse,1);fillVerses(toChapter,toVerse,null,true);loadStatus.hidden=true;
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
      const help=el('details','memory-help');help.append(el('summary','',l.help),el('p','memory-rule',l.enterHelp),el('p','memory-rule',l.rule),el('p','memory-privacy',l.privacy));
      content.append(views,summary,range,study,help,startButton);refresh();content.scrollTop=0;
    }
    function begin(items=rows,isReview=false){attemptRows=items.slice();draftAnswers=Array(items.length).fill('');reviewOnly=isReview;started=performance.now();session=createSession(attemptRows,config.view);showUnit();}
    function showUnit(){
      context.textContent=reviewOnly?`${version} · ${l.review}`:version;dock.replaceChildren();dock.hidden=false;content.classList.toggle('memory-chapter-view',config.view==='chapter');
      const items=session.current,unitHeading=el('div','memory-unit-heading');unitHeading.append(el('p','memory-reference',attemptReference(items.map(item=>item.row))),el('p','memory-progress',`${session.index+1} / ${session.unitCount}`));content.replaceChildren(unitHeading);
      shortNotices=el('div','memory-short-notices');content.append(shortNotices);
      const navigation=el('nav','memory-unit-nav');navigation.setAttribute('aria-label',l.view);
      const previous=button(config.view==='verse'?l.previousVerse:l.previousChapter,()=>{if(session.move(-1))showUnit();});
      const next=button(config.view==='verse'?l.nextVerse:l.nextChapter,()=>{if(session.move(1))showUnit();});
      previous.classList.add('memory-previous');next.classList.add('memory-next');previous.disabled=session.index===0;next.disabled=session.index===session.unitCount-1;navigation.append(previous,next);content.append(navigation);
      const form=el('div','memory-answers'),feedback=el('div','memory-feedback');feedback.setAttribute('aria-live','polite');
      const error=el('p','memory-error');error.hidden=true;error.setAttribute('role','alert');
      const primary=button(l.checkAnswer,act,'memory-primary');
      if(config.view==='verse'){primary.dataset.shortcut='↵';primary.setAttribute('aria-keyshortcuts','Enter');primary.title=l.enterHelp;}
      const entered=el('span','memory-filled'),meter=el('progress','memory-meter');meter.max=items.length;meter.value=0;meter.setAttribute('aria-label',l.progress);
      const status=el('div','memory-dock-status');status.hidden=config.view==='verse';status.append(entered,meter);
      function updateProgress(){const count=inputs.filter(input=>normalize(input.value)).length;meter.value=count;entered.textContent=`${l.progress} ${count} / ${items.length}`;}
      const rowFeedbacks=[];
      function clearFeedback(){feedback.replaceChildren();feedback.removeAttribute('data-correct');rowFeedbacks.forEach(row=>row.replaceChildren());}
      function focusAnswer(index){const input=inputs[index];input?.focus({preventScroll:true});input?.closest('.memory-answer-label').scrollIntoView({block:'start',behavior:'instant'});}
      const inputs=items.map(({row,index})=>{
        const label=el('label','memory-answer-label'),caption=el('span','memory-answer-reference',rowReference(row));caption.hidden=config.view==='verse';
        const input=el('textarea','memory-answer');input.rows=2;input.maxLength=Math.min(3000,row.text.length*2+120);input.autocomplete='off';input.spellcheck=false;
        input.value=draftAnswers[index]||'';
        input.setAttribute('aria-label',`${book} ${rowReference(row)} · ${l.answer}`);input.setAttribute('autocorrect','off');input.setAttribute('autocapitalize','off');input.setAttribute('dir','auto');input.dataset.chapter=String(row.chapter);input.dataset.verse=String(row.verse);label.append(caption,input);
        const rowFeedback=el('div','memory-row-feedback');rowFeedback.id=`memoryFeedback${row.chapter}_${row.verse}`;input.setAttribute('aria-describedby',rowFeedback.id);rowFeedbacks.push(rowFeedback);form.append(label,rowFeedback);
        let composing=false;input.addEventListener('compositionstart',()=>{composing=true;});input.addEventListener('compositionend',()=>{composing=false;});
        input.addEventListener('input',()=>{draftAnswers[index]=input.value;session.invalidate();clearFeedback();input.removeAttribute('aria-invalid');error.hidden=true;primary.textContent=l.checkAnswer;primary.dataset.action='check';fitAnswer(input);updateProgress();});
        input.addEventListener('keydown',e=>{if(config.view!=='verse'||e.key!=='Enter'||e.shiftKey||e.ctrlKey||e.altKey||e.metaKey||e.isComposing||composing||e.keyCode===229)return;e.preventDefault();if(!e.repeat)act();});return input;
      });
      primary.dataset.action='check';primary.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.repeat)e.preventDefault();});
      function act(){
        if(session.canAdvance){session.advance();if(session.done)results(session.firstAnswers);else showUnit();return;}
        const values=inputs.map(input=>input.value),checked=session.check(values);
        if(checked.empty){error.textContent=l.empty;error.hidden=false;focusAnswer(0);return;}
        clearFeedback();error.hidden=true;feedback.dataset.correct=String(checked.correct);checked.grades.forEach((g,i)=>inputs[i].setAttribute('aria-invalid',String(!g.exact)));
        if(checked.correct){
          const next=session.index===session.unitCount-1?l.finish:config.view==='verse'?l.nextVerse:l.nextChapter;
          primary.textContent=next;primary.dataset.action='next';feedback.append(el('p','memory-correct',l.correct));
        }else{
          error.textContent=l.editRetry;error.hidden=false;feedback.append(errorLegend());
          checked.grades.forEach((g,i)=>{if(!g.exact)rowFeedbacks[i].append(gradeCard(items[i].row,values[i],g));});
          focusAnswer(checked.grades.findIndex(g=>!g.exact));
        }
      }
      const aids=el('div','memory-aids');aids.append(button(l.shortChange,setup));dock.append(error,feedback,status,primary,aids);
      placeNotices();
      content.append(form);updateProgress();resizeAnswers();content.scrollTop=0;inputs[0]?.focus({preventScroll:true});
    }
    function results(answers){
      answers=attemptRows.map((row,index)=>answers[index]===undefined?(draftAnswers[index]||''):answers[index]);
      dock.hidden=true;dock.replaceChildren();content.classList.remove('memory-chapter-view');
      const grades=attemptRows.map((row,i)=>grade(row.text,answers[i])),units=grades.reduce((n,g)=>n+g.units,0),distance=grades.reduce((n,g)=>n+g.distance,0),exact=grades.every(g=>g.exact),score=units?Math.min(exact?100:99,Math.round(100*(1-distance/units))):0;
      const mistakes=attemptRows.filter((row,i)=>!grades[i].exact);
      content.replaceChildren(el('h3','',l.result),el('p','memory-reference',attemptReference(attemptRows)));
      const result=el('p','memory-score',`${score}%`);result.setAttribute('aria-label',`${l.score} ${score}%`);content.append(result,el('p','memory-rule',l.firstCheck),el('p','memory-verdict',exact?l.perfect:l.tryAgain),el('p','memory-rule',`${Math.round((performance.now()-started)/1000)} ${l.time}`));
      const actions=el('div','memory-actions'),retryAll=button(l.retryAll,()=>begin(),'memory-retry-all');
      const retry=mistakes.length?button(`${l.retryWrong} (${mistakes.length})`,()=>begin(mistakes,true),'memory-primary memory-retry-wrong'):retryAll;
      if(mistakes.length)actions.append(retry);else retryAll.classList.add('memory-primary');actions.append(retryAll,button(l.change,setup));content.append(actions);
      const list=el('div','memory-results');grades.forEach((g,i)=>list.append(gradeCard(attemptRows[i],answers[i],g)));if(mistakes.length)content.append(errorLegend());content.append(list);content.scrollTop=0;retry.focus({preventScroll:true});
    }
    setup();dialog.showModal();syncViewport();
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
