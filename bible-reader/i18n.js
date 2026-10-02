(() => {
  if (typeof BOOKS === 'undefined' || typeof TRANSLATIONS === 'undefined') return;

  const LANGS = ['ko','en','fr','de','zh','ru','la','pt','ar'];
  const DEFAULT_TRANSLATION = {ko:'krv1961',en:'kjv',fr:'lsg',de:'luth1912',zh:'cuv',ru:'synodal',la:'vulg',pt:'almeida1819',ar:'svd'};
  const LANGUAGE_LABEL = {ko:'한국어',en:'English',fr:'Français',de:'Deutsch',zh:'中文',ru:'Русский',la:'Latina',pt:'Português',ar:'العربية'};

  const BOOK_NAMES = {
    ko:['창세기','출애굽기','레위기','민수기','신명기','여호수아','사사기','룻기','사무엘상','사무엘하','열왕기상','열왕기하','역대상','역대하','에스라','느헤미야','에스더','욥기','시편','잠언','전도서','아가','이사야','예레미야','예레미야애가','에스겔','다니엘','호세아','요엘','아모스','오바댜','요나','미가','나훔','하박국','스바냐','학개','스가랴','말라기','마태복음','마가복음','누가복음','요한복음','사도행전','로마서','고린도전서','고린도후서','갈라디아서','에베소서','빌립보서','골로새서','데살로니가전서','데살로니가후서','디모데전서','디모데후서','디도서','빌레몬서','히브리서','야고보서','베드로전서','베드로후서','요한일서','요한이서','요한삼서','유다서','요한계시록'],
    en:['Genesis','Exodus','Leviticus','Numbers','Deuteronomy','Joshua','Judges','Ruth','1 Samuel','2 Samuel','1 Kings','2 Kings','1 Chronicles','2 Chronicles','Ezra','Nehemiah','Esther','Job','Psalms','Proverbs','Ecclesiastes','Song of Solomon','Isaiah','Jeremiah','Lamentations','Ezekiel','Daniel','Hosea','Joel','Amos','Obadiah','Jonah','Micah','Nahum','Habakkuk','Zephaniah','Haggai','Zechariah','Malachi','Matthew','Mark','Luke','John','Acts','Romans','1 Corinthians','2 Corinthians','Galatians','Ephesians','Philippians','Colossians','1 Thessalonians','2 Thessalonians','1 Timothy','2 Timothy','Titus','Philemon','Hebrews','James','1 Peter','2 Peter','1 John','2 John','3 John','Jude','Revelation'],
    fr:['Genèse','Exode','Lévitique','Nombres','Deutéronome','Josué','Juges','Ruth','1 Samuel','2 Samuel','1 Rois','2 Rois','1 Chroniques','2 Chroniques','Esdras','Néhémie','Esther','Job','Psaumes','Proverbes','Ecclésiaste','Cantique des cantiques','Ésaïe','Jérémie','Lamentations','Ézéchiel','Daniel','Osée','Joël','Amos','Abdias','Jonas','Michée','Nahum','Habacuc','Sophonie','Aggée','Zacharie','Malachie','Matthieu','Marc','Luc','Jean','Actes','Romains','1 Corinthiens','2 Corinthiens','Galates','Éphésiens','Philippiens','Colossiens','1 Thessaloniciens','2 Thessaloniciens','1 Timothée','2 Timothée','Tite','Philémon','Hébreux','Jacques','1 Pierre','2 Pierre','1 Jean','2 Jean','3 Jean','Jude','Apocalypse'],
    de:['1. Mose','2. Mose','3. Mose','4. Mose','5. Mose','Josua','Richter','Rut','1. Samuel','2. Samuel','1. Könige','2. Könige','1. Chronik','2. Chronik','Esra','Nehemia','Ester','Hiob','Psalmen','Sprüche','Prediger','Hohelied','Jesaja','Jeremia','Klagelieder','Hesekiel','Daniel','Hosea','Joel','Amos','Obadja','Jona','Micha','Nahum','Habakuk','Zefanja','Haggai','Sacharja','Maleachi','Matthäus','Markus','Lukas','Johannes','Apostelgeschichte','Römer','1. Korinther','2. Korinther','Galater','Epheser','Philipper','Kolosser','1. Thessalonicher','2. Thessalonicher','1. Timotheus','2. Timotheus','Titus','Philemon','Hebräer','Jakobus','1. Petrus','2. Petrus','1. Johannes','2. Johannes','3. Johannes','Judas','Offenbarung'],
    zh:['创世记','出埃及记','利未记','民数记','申命记','约书亚记','士师记','路得记','撒母耳记上','撒母耳记下','列王纪上','列王纪下','历代志上','历代志下','以斯拉记','尼希米记','以斯帖记','约伯记','诗篇','箴言','传道书','雅歌','以赛亚书','耶利米书','耶利米哀歌','以西结书','但以理书','何西阿书','约珥书','阿摩司书','俄巴底亚书','约拿书','弥迦书','那鸿书','哈巴谷书','西番雅书','哈该书','撒迦利亚书','玛拉基书','马太福音','马可福音','路加福音','约翰福音','使徒行传','罗马书','哥林多前书','哥林多后书','加拉太书','以弗所书','腓立比书','歌罗西书','帖撒罗尼迦前书','帖撒罗尼迦后书','提摩太前书','提摩太后书','提多书','腓利门书','希伯来书','雅各书','彼得前书','彼得后书','约翰一书','约翰二书','约翰三书','犹大书','启示录'],
    ru:['Бытие','Исход','Левит','Числа','Второзаконие','Иисус Навин','Судьи','Руфь','1 Царств','2 Царств','3 Царств','4 Царств','1 Паралипоменон','2 Паралипоменон','Ездра','Неемия','Есфирь','Иов','Псалтирь','Притчи','Екклесиаст','Песнь Песней','Исаия','Иеремия','Плач Иеремии','Иезекииль','Даниил','Осия','Иоиль','Амос','Авдий','Иона','Михей','Наум','Аввакум','Софония','Аггей','Захария','Малахия','Матфей','Марк','Лука','Иоанн','Деяния','Римлянам','1 Коринфянам','2 Коринфянам','Галатам','Ефесянам','Филиппийцам','Колоссянам','1 Фессалоникийцам','2 Фессалоникийцам','1 Тимофею','2 Тимофею','Титу','Филимону','Евреям','Иаков','1 Петра','2 Петра','1 Иоанна','2 Иоанна','3 Иоанна','Иуда','Откровение'],
    la:['Genesis','Exodus','Leviticus','Numeri','Deuteronomium','Iosue','Iudicum','Ruth','I Samuelis','II Samuelis','I Regum','II Regum','I Paralipomenon','II Paralipomenon','Esdras','Nehemias','Esther','Iob','Psalmi','Proverbia','Ecclesiastes','Canticum Canticorum','Isaias','Ieremias','Lamentationes','Ezechiel','Daniel','Osee','Ioel','Amos','Abdias','Ionas','Michaeas','Nahum','Habacuc','Sophonias','Aggaeus','Zacharias','Malachias','Matthaeus','Marcus','Lucas','Ioannes','Actus Apostolorum','Romani','I Corinthii','II Corinthii','Galatae','Ephesii','Philippenses','Colossenses','I Thessalonicenses','II Thessalonicenses','I Timotheus','II Timotheus','Titus','Philemon','Hebraei','Iacobus','I Petrus','II Petrus','I Ioannes','II Ioannes','III Ioannes','Iudas','Apocalypsis'],
    pt:['Gênesis','Êxodo','Levítico','Números','Deuteronômio','Josué','Juízes','Rute','1 Samuel','2 Samuel','1 Reis','2 Reis','1 Crônicas','2 Crônicas','Esdras','Neemias','Ester','Jó','Salmos','Provérbios','Eclesiastes','Cantares','Isaías','Jeremias','Lamentações','Ezequiel','Daniel','Oseias','Joel','Amós','Obadias','Jonas','Miqueias','Naum','Habacuque','Sofonias','Ageu','Zacarias','Malaquias','Mateus','Marcos','Lucas','João','Atos','Romanos','1 Coríntios','2 Coríntios','Gálatas','Efésios','Filipenses','Colossenses','1 Tessalonicenses','2 Tessalonicenses','1 Timóteo','2 Timóteo','Tito','Filemom','Hebreus','Tiago','1 Pedro','2 Pedro','1 João','2 João','3 João','Judas','Apocalipse'],
    ar:['التكوين','الخروج','اللاويين','العدد','التثنية','يشوع','القضاة','راعوث','صموئيل الأول','صموئيل الثاني','الملوك الأول','الملوك الثاني','أخبار الأيام الأول','أخبار الأيام الثاني','عزرا','نحميا','أستير','أيوب','المزامير','الأمثال','الجامعة','نشيد الأنشاد','إشعياء','إرميا','مراثي إرميا','حزقيال','دانيال','هوشع','يوئيل','عاموس','عوبديا','يونان','ميخا','ناحوم','حبقوق','صفنيا','حجي','زكريا','ملاخي','متى','مرقس','لوقا','يوحنا','أعمال الرسل','رومية','كورنثوس الأولى','كورنثوس الثانية','غلاطية','أفسس','فيلبي','كولوسي','تسالونيكي الأولى','تسالونيكي الثانية','تيموثاوس الأولى','تيموثاوس الثانية','تيطس','فليمون','العبرانيين','يعقوب','بطرس الأولى','بطرس الثانية','يوحنا الأولى','يوحنا الثانية','يوحنا الثالثة','يهوذا','الرؤيا']
  };

  const UI = {
    ko:{all:'전체',old:'구약',new:'신약',chapter:n=>`${n}장`,verse:n=>`${n}절`,title:(b,c)=>`${b} ${c}장`,search:'검색',compare:'비교',prev:'← 이전 장',next:'다음 장 →',single:'한 면 보기',dual:'양면 보기',notes:'메모장',fontDown:'가−',fontUp:'가+',fontDownTitle:'글자 작게',fontUpTitle:'글자 크게',widthTitle:'읽기 폭 조절',close:'닫기',ad:'광고',loading:'본문을 불러오는 중…',loadError:'본문을 불러오지 못했습니다. 인터넷 연결을 확인한 뒤 다시 시도해 주세요.',recordsTitle:'나의 기록',highlights:'하이라이트',savedVerses:'저장한 성구',savedChapters:'저장한 장',backup:'기록 백업',restore:'백업 복원',goVerse:'구절로 이동',goChapter:'장으로 이동',addNote:'메모 추가',editNote:'메모 수정',deleteHighlight:'하이라이트 삭제',deleteSaved:'저장 삭제',save:'저장',deleteNote:'메모 삭제',cancel:'취소',notePlaceholder:'메모를 입력하세요',emptyHighlights:'하이라이트한 성구가 없습니다.',emptySaved:'저장한 성구가 없습니다.',emptyChapters:'저장한 장이 없습니다.',backupConfirm:'현재 기록을 백업 파일의 기록으로 바꿀까요?',backupInvalid:'올바른 성경 읽기 백업 파일이 아닙니다.',source:'외국어 역본은 공개 도메인 또는 자유 재배포가 확인된 데이터만 제공합니다.',description:'개역한글과 여러 공개 역본을 편하게 읽고 비교할 수 있는 PC 중심 성경 읽기 웹서비스입니다.',pageTitle:'성경 읽기 · 개역한글 및 다국어 역본 비교'},
    en:{all:'All',old:'Old Testament',new:'New Testament',chapter:n=>`Chapter ${n}`,verse:n=>`Verse ${n}`,title:(b,c)=>`${b} ${c}`,search:'Search',compare:'Compare',prev:'← Previous',next:'Next →',single:'Single view',dual:'Two-page view',notes:'Notes',fontDown:'A−',fontUp:'A+',fontDownTitle:'Decrease font size',fontUpTitle:'Increase font size',widthTitle:'Reading width',close:'Close',ad:'Ad',loading:'Loading Scripture…',loadError:'Could not load Scripture. Check your connection and try again.',recordsTitle:'My records',highlights:'Highlights',savedVerses:'Saved verses',savedChapters:'Saved chapters',backup:'Back up records',restore:'Restore backup',goVerse:'Go to verse',goChapter:'Go to chapter',addNote:'Add note',editNote:'Edit note',deleteHighlight:'Delete highlight',deleteSaved:'Delete saved item',save:'Save',deleteNote:'Delete note',cancel:'Cancel',notePlaceholder:'Write a note',emptyHighlights:'No highlighted verses.',emptySaved:'No saved verses.',emptyChapters:'No saved chapters.',backupConfirm:'Replace current records with the backup file?',backupInvalid:'This is not a valid Bible Reader backup file.',source:'Foreign-language editions are provided only when public-domain or redistribution rights are verified.',description:'Read and compare public-domain Bible translations in a clean, comfortable online Bible reader.',pageTitle:'Free Online Bible Reader · KJV and Public-Domain Translations'},
    fr:{all:'Tout',old:'Ancien Testament',new:'Nouveau Testament',chapter:n=>`Chapitre ${n}`,verse:n=>`Verset ${n}`,title:(b,c)=>`${b} ${c}`,search:'Rechercher',compare:'Comparer',prev:'← Précédent',next:'Suivant →',single:'Vue simple',dual:'Double page',notes:'Notes',fontDown:'A−',fontUp:'A+',fontDownTitle:'Réduire la taille du texte',fontUpTitle:'Augmenter la taille du texte',widthTitle:'Largeur de lecture',close:'Fermer',ad:'Publicité',loading:'Chargement de la Bible…',loadError:'Impossible de charger le texte biblique. Vérifiez votre connexion puis réessayez.',recordsTitle:'Mes notes',highlights:'Surlignages',savedVerses:'Versets enregistrés',savedChapters:'Chapitres enregistrés',backup:'Sauvegarder',restore:'Restaurer',goVerse:'Aller au verset',goChapter:'Aller au chapitre',addNote:'Ajouter une note',editNote:'Modifier la note',deleteHighlight:'Supprimer le surlignage',deleteSaved:'Supprimer',save:'Enregistrer',deleteNote:'Supprimer la note',cancel:'Annuler',notePlaceholder:'Écrivez une note',emptyHighlights:'Aucun verset surligné.',emptySaved:'Aucun verset enregistré.',emptyChapters:'Aucun chapitre enregistré.',backupConfirm:'Remplacer les notes actuelles par celles de la sauvegarde ?',backupInvalid:'Ce fichier de sauvegarde Bible Reader est invalide.',source:'Les versions étrangères sont proposées uniquement lorsque le domaine public ou les droits de redistribution sont vérifiés.',description:'Lisez et comparez gratuitement Louis Segond 1910 et d’autres traductions bibliques du domaine public.',pageTitle:'Bible en ligne gratuite · Louis Segond 1910'},
    de:{all:'Alle',old:'Altes Testament',new:'Neues Testament',chapter:n=>`Kapitel ${n}`,verse:n=>`Vers ${n}`,title:(b,c)=>`${b} ${c}`,search:'Suchen',compare:'Vergleichen',prev:'← Zurück',next:'Weiter →',single:'Einzelseite',dual:'Doppelseite',notes:'Notizen',fontDown:'A−',fontUp:'A+',fontDownTitle:'Schrift verkleinern',fontUpTitle:'Schrift vergrößern',widthTitle:'Lesebreite',close:'Schließen',ad:'Anzeige',loading:'Bibeltext wird geladen…',loadError:'Bibeltext konnte nicht geladen werden. Verbindung prüfen und erneut versuchen.',recordsTitle:'Meine Einträge',highlights:'Markierungen',savedVerses:'Gespeicherte Verse',savedChapters:'Gespeicherte Kapitel',backup:'Sichern',restore:'Wiederherstellen',goVerse:'Zum Vers',goChapter:'Zum Kapitel',addNote:'Notiz hinzufügen',editNote:'Notiz bearbeiten',deleteHighlight:'Markierung löschen',deleteSaved:'Speicherung löschen',save:'Speichern',deleteNote:'Notiz löschen',cancel:'Abbrechen',notePlaceholder:'Notiz eingeben',emptyHighlights:'Keine markierten Verse.',emptySaved:'Keine gespeicherten Verse.',emptyChapters:'Keine gespeicherten Kapitel.',backupConfirm:'Aktuelle Einträge durch die Sicherung ersetzen?',backupInvalid:'Keine gültige Bible-Reader-Sicherungsdatei.',source:'Fremdsprachige Ausgaben werden nur angeboten, wenn Gemeinfreiheit oder Weiterverbreitungsrechte bestätigt sind.',description:'Lutherbibel 1912 und weitere gemeinfreie Bibelübersetzungen online lesen und vergleichen.',pageTitle:'Kostenlose Online-Bibel · Lutherbibel 1912'},
    zh:{all:'全部',old:'旧约',new:'新约',chapter:n=>`第${n}章`,verse:n=>`第${n}节`,title:(b,c)=>`${b} 第${c}章`,search:'搜索',compare:'对照',prev:'← 上一章',next:'下一章 →',single:'单页',dual:'双页',notes:'记录',fontDown:'字−',fontUp:'字+',fontDownTitle:'缩小字号',fontUpTitle:'放大字号',widthTitle:'阅读宽度',close:'关闭',ad:'广告',loading:'正在载入经文…',loadError:'无法载入经文。请检查网络连接后重试。',recordsTitle:'我的记录',highlights:'高亮',savedVerses:'已保存经文',savedChapters:'已保存章节',backup:'备份记录',restore:'恢复备份',goVerse:'前往经文',goChapter:'前往章节',addNote:'添加笔记',editNote:'修改笔记',deleteHighlight:'删除高亮',deleteSaved:'删除保存',save:'保存',deleteNote:'删除笔记',cancel:'取消',notePlaceholder:'请输入笔记',emptyHighlights:'暂无高亮经文。',emptySaved:'暂无保存的经文。',emptyChapters:'暂无保存的章节。',backupConfirm:'要用备份文件替换当前记录吗？',backupInvalid:'这不是有效的 Bible Reader 备份文件。',source:'仅提供已确认属于公有领域或允许再分发的外语版本。',description:'在线阅读和对照和合本及其他已确认可再分发的圣经译本。',pageTitle:'在线圣经阅读 · 和合本对照'},
    ru:{all:'Все',old:'Ветхий Завет',new:'Новый Завет',chapter:n=>`Глава ${n}`,verse:n=>`Стих ${n}`,title:(b,c)=>`${b} ${c}`,search:'Поиск',compare:'Сравнить',prev:'← Назад',next:'Далее →',single:'Одна страница',dual:'Две страницы',notes:'Записи',fontDown:'А−',fontUp:'А+',fontDownTitle:'Уменьшить шрифт',fontUpTitle:'Увеличить шрифт',widthTitle:'Ширина чтения',close:'Закрыть',ad:'Реклама',loading:'Загрузка текста…',loadError:'Не удалось загрузить текст Библии. Проверьте соединение и повторите попытку.',recordsTitle:'Мои записи',highlights:'Выделения',savedVerses:'Сохранённые стихи',savedChapters:'Сохранённые главы',backup:'Резервная копия',restore:'Восстановить',goVerse:'К стиху',goChapter:'К главе',addNote:'Добавить заметку',editNote:'Изменить заметку',deleteHighlight:'Удалить выделение',deleteSaved:'Удалить сохранение',save:'Сохранить',deleteNote:'Удалить заметку',cancel:'Отмена',notePlaceholder:'Введите заметку',emptyHighlights:'Нет выделенных стихов.',emptySaved:'Нет сохранённых стихов.',emptyChapters:'Нет сохранённых глав.',backupConfirm:'Заменить текущие записи данными из резервной копии?',backupInvalid:'Это недопустимый файл резервной копии Bible Reader.',source:'Иноязычные издания предоставляются только при подтверждённом общественном достоянии или праве на распространение.',description:'Читайте и сравнивайте Синодальный перевод и другие доступные библейские переводы онлайн.',pageTitle:'Библия онлайн · Синодальный перевод'},
    la:{all:'Omnia',old:'Vetus Testamentum',new:'Novum Testamentum',chapter:n=>`Caput ${n}`,verse:n=>`Versus ${n}`,title:(b,c)=>`${b} ${c}`,search:'Quaere',compare:'Compara',prev:'← Prior',next:'Proximus →',single:'Una pagina',dual:'Duae paginae',notes:'Notae',fontDown:'A−',fontUp:'A+',fontDownTitle:'Litteras minue',fontUpTitle:'Litteras auge',widthTitle:'Latitudo lectionis',close:'Claude',ad:'Nuntium',loading:'Textus oneratur…',loadError:'Textus sacer onerari non potuit. Conexionem inspice et iterum tenta.',recordsTitle:'Acta mea',highlights:'Notata',savedVerses:'Versus servati',savedChapters:'Capita servata',backup:'Serva acta',restore:'Restaura',goVerse:'Ad versum',goChapter:'Ad caput',addNote:'Adde notam',editNote:'Muta notam',deleteHighlight:'Dele notam',deleteSaved:'Dele servatum',save:'Serva',deleteNote:'Dele commentarium',cancel:'Claude',notePlaceholder:'Scribe notam',emptyHighlights:'Nulli versus notati.',emptySaved:'Nulli versus servati.',emptyChapters:'Nulla capita servata.',backupConfirm:'Acta praesentia actis ex archivo substituere?',backupInvalid:'Hoc archivum Bible Reader validum non est.',source:'Editiones externae tantum praebentur ubi iura publici dominii vel redistributionis comprobata sunt.',description:'Vulgatam et alias Bibliorum editiones publici dominii lege atque compara.',pageTitle:'Biblia Sacra online · Vulgata'},
    pt:{all:'Todos',old:'Antigo Testamento',new:'Novo Testamento',chapter:n=>`Capítulo ${n}`,verse:n=>`Versículo ${n}`,title:(b,c)=>`${b} ${c}`,search:'Buscar',compare:'Comparar',prev:'← Anterior',next:'Próximo →',single:'Uma página',dual:'Duas páginas',notes:'Notas',fontDown:'A−',fontUp:'A+',fontDownTitle:'Diminuir fonte',fontUpTitle:'Aumentar fonte',widthTitle:'Largura de leitura',close:'Fechar',ad:'Anúncio',loading:'Carregando a Bíblia…',loadError:'Não foi possível carregar o texto bíblico. Verifique a conexão e tente novamente.',recordsTitle:'Meus registros',highlights:'Destaques',savedVerses:'Versículos salvos',savedChapters:'Capítulos salvos',backup:'Fazer backup',restore:'Restaurar backup',goVerse:'Ir para o versículo',goChapter:'Ir para o capítulo',addNote:'Adicionar nota',editNote:'Editar nota',deleteHighlight:'Excluir destaque',deleteSaved:'Excluir salvo',save:'Salvar',deleteNote:'Excluir nota',cancel:'Cancelar',notePlaceholder:'Digite uma nota',emptyHighlights:'Nenhum versículo destacado.',emptySaved:'Nenhum versículo salvo.',emptyChapters:'Nenhum capítulo salvo.',backupConfirm:'Substituir os registros atuais pelos do backup?',backupInvalid:'Este não é um arquivo de backup válido do Bible Reader.',source:'Edições em outros idiomas são fornecidas apenas quando o domínio público ou os direitos de redistribuição são verificados.',description:'Leia e compare a Bíblia Almeida 1819 e outras traduções bíblicas em domínio público.',pageTitle:'Bíblia online grátis · Almeida 1819'},
    ar:{all:'الكل',old:'العهد القديم',new:'العهد الجديد',chapter:n=>`الأصحاح ${n}`,verse:n=>`الآية ${n}`,title:(b,c)=>`${b} ${c}`,search:'بحث',compare:'مقارنة',prev:'→ السابق',next:'التالي ←',single:'صفحة واحدة',dual:'صفحتان',notes:'السجلات',fontDown:'ع−',fontUp:'ع+',fontDownTitle:'تصغير الخط',fontUpTitle:'تكبير الخط',widthTitle:'عرض القراءة',close:'إغلاق',ad:'إعلان',loading:'جارٍ تحميل النص…',loadError:'تعذر تحميل نص الكتاب المقدس. تحقق من الاتصال وحاول مرة أخرى.',recordsTitle:'سجلاتي',highlights:'تمييزات',savedVerses:'آيات محفوظة',savedChapters:'أصحاحات محفوظة',backup:'نسخ احتياطي',restore:'استعادة النسخة',goVerse:'انتقل إلى الآية',goChapter:'انتقل إلى الأصحاح',addNote:'إضافة ملاحظة',editNote:'تعديل الملاحظة',deleteHighlight:'حذف التمييز',deleteSaved:'حذف المحفوظ',save:'حفظ',deleteNote:'حذف الملاحظة',cancel:'إلغاء',notePlaceholder:'اكتب ملاحظة',emptyHighlights:'لا توجد آيات مميزة.',emptySaved:'لا توجد آيات محفوظة.',emptyChapters:'لا توجد أصحاحات محفوظة.',backupConfirm:'هل تريد استبدال السجلات الحالية بملف النسخة الاحتياطية؟',backupInvalid:'هذا ليس ملف نسخة احتياطية صالحًا لـ Bible Reader.',source:'تُعرض الترجمات الأجنبية فقط عند التحقق من الملكية العامة أو حقوق إعادة التوزيع.',description:'اقرأ وقارن ترجمة فان دايك وترجمات الكتاب المقدس المتاحة لإعادة التوزيع.',pageTitle:'الكتاب المقدس على الإنترنت · ترجمة فان دايك'}
  };

  function pathLang(){
    if (window.__BIBLE_LANG__ && LANGS.includes(window.__BIBLE_LANG__)) return window.__BIBLE_LANG__;
    const parts=location.pathname.split('/').filter(Boolean);
    const code=parts[parts.indexOf('bible-reader')+1];
    return LANGS.includes(code) ? code : 'ko';
  }
  const uiLang = pathLang();
  const text = key => UI[uiLang]?.[key] ?? UI.en[key] ?? key;
  function scriptureLang(){
    const id=document.querySelector('#translationSelect')?.value || (typeof activeTranslationId!=='undefined' ? activeTranslationId : 'krv1961');
    const tr=TRANSLATIONS[id] || TRANSLATIONS.krv1961;
    if(tr?.id==='krv1961' || tr?.type==='krv') return 'ko';
    return LANGS.includes(tr?.lang) ? tr.lang : 'en';
  }
  const scriptureText = key => UI[scriptureLang()]?.[key] ?? UI.en[key] ?? key;
  const bookName = index => BOOK_NAMES[scriptureLang()]?.[index] || BOOK_NAMES.en[index] || BOOKS[index]?.ko || '';

  function createLanguageSelector(){
    const translation=document.querySelector('#translationSelect');
    if(!translation || document.querySelector('#languageSelect')) return;
    const wrap=document.createElement('span'); wrap.className='language-selector-wrap';
    const select=document.createElement('select'); select.id='languageSelect'; select.className='language-select'; select.setAttribute('aria-label','Language');
    LANGS.forEach(code=>{const o=document.createElement('option');o.value=code;o.textContent=LANGUAGE_LABEL[code];select.append(o)});
    select.value=uiLang;
    wrap.append(select); translation.insertAdjacentElement('afterend',wrap);
  }

  function localizeReference(raw){
    let out=String(raw||'');
    for(const names of Object.values(BOOK_NAMES)){
      for(let i=0;i<names.length;i++){
        const n=names[i]; if(out===n || out.startsWith(n+' ')){out=bookName(i)+out.slice(n.length); return out;}
      }
    }
    return out;
  }

  const EXACT = {
    '닫기':'close','광고':'ad','본문을 불러오는 중…':'loading','본문을 불러오지 못했습니다. 인터넷 연결을 확인한 뒤 다시 시도해 주세요.':'loadError','나의 기록':'recordsTitle','내 기록':'recordsTitle','하이라이트':'highlights','저장한 성구':'savedVerses','저장한 장':'savedChapters','기록 백업':'backup','백업 복원':'restore','구절로 이동':'goVerse','장으로 이동':'goChapter','메모 추가':'addNote','메모 수정':'editNote','하이라이트 삭제':'deleteHighlight','저장 삭제':'deleteSaved','저장':'save','메모 삭제':'deleteNote','취소':'cancel','하이라이트한 성구가 없습니다.':'emptyHighlights','저장한 성구가 없습니다.':'emptySaved','저장한 장이 없습니다.':'emptyChapters','외국어 역본은 공개 도메인 또는 자유 재배포가 확인된 데이터만 제공합니다.':'source'
  };

  function translateDynamic(raw){
    const s=String(raw||'').trim(); if(!s)return raw;
    if(EXACT[s]) return text(EXACT[s]);
    if(s.startsWith('메모 · ')) return `${text('notes')} · ${localizeReference(s.slice(5))}`;
    const ref=localizeReference(s); if(ref!==s)return ref;
    let m=s.match(/^“(.+)” 검색 준비 중…$/); if(m)return uiLang==='ko'?s:`“${m[1]}” ${text('search')}…`;
    m=s.match(/^“(.+)” 검색 중… (\d+)\/(\d+)권$/); if(m)return uiLang==='ko'?s:`“${m[1]}” ${text('search')}… ${m[2]}/${m[3]}`;
    m=s.match(/^“(.+)” 검색 결과가 없습니다\.(?: \((\d+)권 로딩 실패\))?$/);
    if(m){const base={en:`No results for “${m[1]}”.`,fr:`Aucun résultat pour « ${m[1]} ».`,de:`Keine Ergebnisse für „${m[1]}“.`,zh:`“${m[1]}”没有搜索结果。`,ru:`По запросу «${m[1]}» ничего не найдено.`,la:`Nihil inventum est pro “${m[1]}”.`,pt:`Nenhum resultado para “${m[1]}”.`,ar:`لا توجد نتائج لـ «${m[1]}».`}[uiLang];return base||s;}
    return raw;
  }

  function applyStatic(){
    document.documentElement.lang=uiLang;
    const map={'#searchButton':'search','#compareToggle':'compare','#prevChapterTitle':'prev','#nextChapterTitle':'next','#prevChapterBottom':'prev','#nextChapterBottom':'next','#singlePageView':'single','#dualPageView':'dual','#fontDown':'fontDown','#fontUp':'fontUp','#widthToggle':null,'#notebookToggle':'notes','#closeSearch':'close'};
    Object.entries(map).forEach(([sel,key])=>{const el=document.querySelector(sel);if(el&&key)el.textContent=text(key)});
    const input=document.querySelector('#searchInput'); if(input){input.placeholder=text('search');input.setAttribute('aria-label',text('search'));}
    const fd=document.querySelector('#fontDown'); if(fd){fd.title=text('fontDownTitle');fd.setAttribute('aria-label',text('fontDownTitle'));}
    const fu=document.querySelector('#fontUp'); if(fu){fu.title=text('fontUpTitle');fu.setAttribute('aria-label',text('fontUpTitle'));}
    const wt=document.querySelector('#widthToggle'); if(wt){wt.textContent='↔';wt.title=text('widthTitle');wt.setAttribute('aria-label',text('widthTitle'));}
    const note=document.querySelector('.source-note');if(note)note.textContent=text('source');
    document.querySelectorAll('.ad-slot span').forEach(el=>el.textContent=text('ad'));
    document.querySelectorAll('.ad-slot').forEach(el=>el.setAttribute('aria-label',text('ad')));
  }

  function applySelects(){
    const books=document.querySelector('#bookSelect');if(books)[...books.options].forEach(o=>{const next=bookName(Number(o.value));if(o.textContent!==next)o.textContent=next});
    const chapters=document.querySelector('#chapterSelect');if(chapters)[...chapters.options].forEach(o=>{const next=scriptureText('chapter')(Number(o.value));if(o.textContent!==next)o.textContent=next});
    const verses=document.querySelector('#verseSelect');if(verses)[...verses.options].forEach(o=>{const next=scriptureText('verse')(Number(o.value)||1);if(o.textContent!==next)o.textContent=next});
  }

  function applyScriptureTitle(){
    if(typeof state==='undefined')return;
    const label=scriptureText('title')(bookName(state.bookIndex),state.chapter);
    const h=document.querySelector('#chapterTitle');if(h&&h.textContent!==label)h.textContent=label;
    const meta=document.querySelector('meta[name="description"]');if(meta)meta.content=text('description');
  }

  function applyReadingDirection(){
    const tr=TRANSLATIONS[document.querySelector('#translationSelect')?.value];
    const reader=document.querySelector('#singleReader');if(reader)reader.dir=tr?.lang==='ar'?'rtl':'ltr';
    const left=TRANSLATIONS[document.querySelector('#leftTranslation')?.value]; const right=TRANSLATIONS[document.querySelector('#rightTranslation')?.value];
    document.querySelectorAll('.compare-row').forEach(row=>{const cells=row.querySelectorAll('.compare-cell');if(cells[0])cells[0].dir=left?.lang==='ar'?'rtl':'ltr';if(cells[1])cells[1].dir=right?.lang==='ar'?'rtl':'ltr';});
  }

  function localizeDynamicTree(root=document.body){
    if(!root)return;
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
    nodes.forEach(n=>{if(['SCRIPT','STYLE','SELECT','OPTION'].includes(n.parentElement?.tagName))return;const next=translateDynamic(n.nodeValue);if(next!==n.nodeValue)n.nodeValue=next;});
    root.querySelectorAll?.('textarea[placeholder="메모를 입력하세요"]').forEach(el=>el.placeholder=text('notePlaceholder'));
  }

  function selectPickerOpen(){return document.activeElement?.tagName==='SELECT';}
  function applyAll(){applyStatic();if(!selectPickerOpen()){applySelects();applyScriptureTitle();}applyReadingDirection();localizeDynamicTree();}
  window.BibleI18n={lang:()=>uiLang,scriptureLang,text:()=>UI[uiLang]||UI.en,ui:text,bookName,bookNames:BOOK_NAMES,localizeReference,apply:applyAll,defaultTranslation:code=>DEFAULT_TRANSLATION[code]};

  const nativeConfirm=window.confirm.bind(window),nativeAlert=window.alert.bind(window);
  window.confirm=(message)=>nativeConfirm(message==='현재 기록을 백업 파일의 기록으로 바꿀까요?'?text('backupConfirm'):message);
  window.alert=(message)=>nativeAlert(message==='올바른 성경 읽기 백업 파일이 아닙니다.'?text('backupInvalid'):message);

  createLanguageSelector();
  let timer;
  const schedule=()=>{
    clearTimeout(timer);
    timer=setTimeout(()=>{
      if(selectPickerOpen()){timer=setTimeout(schedule,120);return;}
      applyAll();
    },30);
  };
  new MutationObserver(schedule).observe(document.body,{subtree:true,childList:true});
  ['translationSelect','bookSelect','chapterSelect','verseSelect','leftTranslation','rightTranslation'].forEach(id=>document.querySelector('#'+id)?.addEventListener('change',schedule));
  document.addEventListener('focusout',event=>{if(event.target?.tagName==='SELECT')schedule();});
  [0,100,350,800,1600].forEach(ms=>setTimeout(applyAll,ms));
})();
