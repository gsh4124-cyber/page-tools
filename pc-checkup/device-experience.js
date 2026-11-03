(()=>{
'use strict';
const PROD='https://pc-checkup.pages.dev';
const LEGACY_HOST='gsh4124-cyber.github.io';
const ENDPOINT='https://afiqaibosavbjzkffggr.supabase.co/functions/v1/device-checkup-event';
const PC_TESTS=['keyboard','mouse','display','speaker','mic','webcam'];
const MOBILE_TESTS=['touch','display','camera','mic','speaker','motion'];
// Keep one behavior runtime for all thirteen locales. Only display strings vary.
const TEXT_KEYS=['summary','intro','ok','bad','unknown','manual','copy','share','copied','copyFailed','next','complete','pcTitle','mobileTitle','issueHint','unknownHint','doneHint','resultTitle'];
const TEXT={
ko:['점검 결과 요약','결과를 복사하거나 공유하고, 브라우저에서 판정할 수 없는 항목은 직접 확인하세요.','정상','문제','미확인','브라우저 밖 수동 점검','결과 복사','결과 공유','복사됨','복사 실패 · 다시 시도','다음 미확인 검사로 이동','전체 점검 완료','PC 전체 점검','휴대폰 전체 점검','문제로 표시한 항목을 다시 확인하세요. 브라우저 결과만으로 고장을 확정하지 않습니다.','미확인은 검사 미완료 또는 브라우저 판정 불가이며 고장이 아닙니다.','브라우저 검사 결과입니다. 배터리·외관·포트는 별도로 확인하세요.','DEVICE CHECKUP 결과'],
en:['Check results','Copy or share results, then check items the browser cannot assess yourself.','OK','Issue','Unchecked','Manual checks outside the browser','Copy results','Share results','Copied','Copy failed · retry','Go to next unchecked test','All checks complete','Full PC check','Full phone check','Recheck flagged items. Browser results alone do not confirm a hardware fault.','Unchecked means incomplete or unavailable in this browser, not a hardware fault.','Browser checks complete. Check the battery, exterior and ports separately.','DEVICE CHECKUP results'],
ja:['検査結果','結果をコピー・共有し、ブラウザーで判断できない項目は直接確認してください。','正常','問題','未確認','ブラウザー外の手動確認','結果をコピー','結果を共有','コピー済み','コピー失敗・再試行','次の未確認項目へ','全項目確認済み','PC全体検査','スマートフォン全体検査','問題のある項目を再確認してください。ブラウザーの結果だけでは故障と断定できません。','未確認は未実施またはブラウザーで判断できない状態で、故障ではありません。','ブラウザー検査の結果です。バッテリー・外観・端子は別途確認してください。','DEVICE CHECKUP 検査結果'],
es:['Resultados','Copia o comparte los resultados y revisa por tu cuenta lo que el navegador no puede evaluar.','Correcto','Problema','Sin revisar','Revisión manual fuera del navegador','Copiar resultados','Compartir resultados','Copiado','Error al copiar · reintentar','Ir a la siguiente prueba pendiente','Revisión completada','Revisión completa del PC','Revisión completa del teléfono','Revisa los problemas indicados. El navegador por sí solo no confirma una avería.','Sin revisar significa pendiente o no evaluable en este navegador, no una avería.','Resultados del navegador. Revisa la batería, el exterior y los puertos por separado.','Resultados de DEVICE CHECKUP'],
de:['Prüfergebnisse','Ergebnisse kopieren oder teilen; vom Browser nicht prüfbare Punkte selbst kontrollieren.','OK','Problem','Ungeprüft','Manuelle Prüfung außerhalb des Browsers','Ergebnisse kopieren','Ergebnisse teilen','Kopiert','Kopieren fehlgeschlagen · erneut versuchen','Zur nächsten offenen Prüfung','Alle Prüfungen abgeschlossen','Vollständiger PC-Check','Vollständiger Smartphone-Check','Markierte Probleme erneut prüfen. Browserergebnisse allein bestätigen keinen Hardwaredefekt.','Ungeprüft bedeutet ausstehend oder im Browser nicht prüfbar, keinen Hardwaredefekt.','Browserprüfung abgeschlossen. Akku, Gehäuse und Anschlüsse separat prüfen.','DEVICE CHECKUP Ergebnisse'],
fr:['Résultats','Copiez ou partagez les résultats et vérifiez vous-même les éléments non évaluables par le navigateur.','Normal','Problème','Non vérifié','Vérifications manuelles hors navigateur','Copier les résultats','Partager les résultats','Copié','Échec de copie · réessayer','Prochaine vérification en attente','Toutes les vérifications sont terminées','Vérification complète du PC','Vérification complète du téléphone','Revérifiez les problèmes signalés. Le navigateur seul ne confirme pas une panne matérielle.','Non vérifié signifie en attente ou non évaluable ici, et non une panne.','Résultats du navigateur. Vérifiez séparément la batterie, le boîtier et les ports.','Résultats DEVICE CHECKUP'],
pt:['Resultados','Copie ou compartilhe os resultados e confira os itens que o navegador não consegue avaliar.','Normal','Problema','Não verificado','Verificações manuais fora do navegador','Copiar resultados','Compartilhar resultados','Copiado','Falha ao copiar · tentar novamente','Ir ao próximo teste pendente','Todas as verificações concluídas','Verificação completa do PC','Verificação completa do celular','Confira os problemas indicados. O navegador sozinho não confirma defeitos de hardware.','Não verificado significa pendente ou não avaliável neste navegador, não um defeito.','Resultados do navegador. Verifique bateria, carcaça e portas separadamente.','Resultados DEVICE CHECKUP'],
it:['Risultati','Copia o condividi i risultati e controlla gli elementi che il browser non può valutare.','OK','Problema','Da verificare','Controlli manuali fuori dal browser','Copia risultati','Condividi risultati','Copiato','Copia non riuscita · riprova','Vai al prossimo test da verificare','Tutti i controlli completati','Controllo completo del PC','Controllo completo del telefono','Ricontrolla i problemi segnalati. Il browser da solo non conferma un guasto hardware.','Da verificare significa non eseguito o non valutabile qui, non un guasto.','Risultati del browser. Controlla separatamente batteria, scocca e porte.','Risultati DEVICE CHECKUP'],
nl:['Testresultaten','Kopieer of deel resultaten en controleer zelf wat de browser niet kan beoordelen.','OK','Probleem','Niet getest','Handmatige controles buiten de browser','Resultaten kopiëren','Resultaten delen','Gekopieerd','Kopiëren mislukt · opnieuw proberen','Naar de volgende ongeteste test','Alle controles voltooid','Volledige pc-controle','Volledige telefooncontrole','Controleer gemarkeerde problemen opnieuw. De browser alleen bevestigt geen hardwaredefect.','Niet getest betekent nog niet uitgevoerd of hier niet te beoordelen, geen defect.','Browserresultaten. Controleer accu, behuizing en aansluitingen afzonderlijk.','DEVICE CHECKUP resultaten'],
id:['Hasil pemeriksaan','Salin atau bagikan hasil, lalu periksa sendiri hal yang tidak dapat dinilai browser.','Normal','Masalah','Belum diperiksa','Pemeriksaan manual di luar browser','Salin hasil','Bagikan hasil','Disalin','Gagal menyalin · coba lagi','Ke tes berikutnya yang belum diperiksa','Semua pemeriksaan selesai','Pemeriksaan PC lengkap','Pemeriksaan ponsel lengkap','Periksa kembali masalah yang ditandai. Hasil browser saja tidak memastikan kerusakan perangkat keras.','Belum diperiksa berarti belum selesai atau tidak dapat dinilai browser, bukan kerusakan.','Hasil pemeriksaan browser. Periksa baterai, fisik perangkat, dan port secara terpisah.','Hasil DEVICE CHECKUP'],
vi:['Kết quả kiểm tra','Sao chép hoặc chia sẻ kết quả, rồi tự kiểm tra những mục trình duyệt không thể đánh giá.','Bình thường','Có vấn đề','Chưa kiểm tra','Kiểm tra thủ công ngoài trình duyệt','Sao chép kết quả','Chia sẻ kết quả','Đã sao chép','Sao chép thất bại · thử lại','Đến mục tiếp theo chưa kiểm tra','Đã hoàn tất mọi kiểm tra','Kiểm tra toàn bộ PC','Kiểm tra toàn bộ điện thoại','Kiểm tra lại các mục có vấn đề. Kết quả trình duyệt không đủ để kết luận hỏng phần cứng.','Chưa kiểm tra nghĩa là chưa hoàn tất hoặc trình duyệt không đánh giá được, không phải hỏng.','Kết quả từ trình duyệt. Kiểm tra riêng pin, vỏ máy và các cổng.','Kết quả DEVICE CHECKUP'],
'zh-CN':['检测结果','复制或分享结果，并自行检查浏览器无法判断的项目。','正常','问题','未检查','浏览器外的手动检查','复制结果','分享结果','已复制','复制失败 · 重试','前往下一个未检查项目','全部检查完成','电脑全面检测','手机全面检测','请复查标有问题的项目。仅凭浏览器结果无法确认硬件故障。','未检查表示尚未完成或浏览器无法判断，并不表示故障。','以上为浏览器检测结果。请另行检查电池、外观及接口。','DEVICE CHECKUP 检测结果'],
ru:['Результаты проверки','Скопируйте или отправьте результаты и самостоятельно проверьте то, что браузер оценить не может.','Норма','Проблема','Не проверено','Ручная проверка вне браузера','Копировать результаты','Поделиться результатами','Скопировано','Не удалось скопировать · повторить','К следующей непроверенной функции','Все проверки завершены','Полная проверка ПК','Полная проверка телефона','Перепроверьте отмеченные проблемы. Результаты браузера сами по себе не подтверждают поломку.','Не проверено означает незавершённую или недоступную браузеру проверку, а не поломку.','Результаты браузера. Отдельно проверьте аккумулятор, корпус и разъёмы.','Результаты DEVICE CHECKUP']
};
const MANUAL_TEXT={
ko:{pc:['외관·힌지·나사·파손 흔적','전원·충전기·배터리 상태','USB·HDMI·오디오 등 물리 포트','Wi-Fi·Bluetooth 연결','발열·팬 소음·비정상 냄새','저장장치·메모리는 별도 진단'],mobile:['액정·프레임·카메라 렌즈','충전 단자·케이블·무선충전','배터리 상태·비정상 발열','지문·얼굴인식','통화·셀룰러·Wi-Fi·Bluetooth','GPS·NFC·침수·수리 이력']},
en:{pc:['Exterior, hinges, screws and damage','Power, charger and battery','USB, HDMI and audio ports','Wi-Fi and Bluetooth','Heat, fan noise and unusual smells','Separate storage and memory diagnostics'],mobile:['Screen, frame and camera lenses','Charging port, cable and wireless charging','Battery condition and unusual heat','Fingerprint and face recognition','Calls, cellular, Wi-Fi and Bluetooth','GPS, NFC, water damage and repair history']},
ja:{pc:['外観・ヒンジ・ねじ・破損','電源・充電器・バッテリー','USB・HDMI・音声端子','Wi-Fi・Bluetooth','発熱・ファン音・異臭','ストレージ・メモリーの別途診断'],mobile:['画面・フレーム・カメラレンズ','充電端子・ケーブル・無線充電','バッテリー状態・異常発熱','指紋認証・顔認証','通話・携帯回線・Wi-Fi・Bluetooth','GPS・NFC・水没・修理履歴']},
es:{pc:['Exterior, bisagras, tornillos y daños','Alimentación, cargador y batería','Puertos USB, HDMI y audio','Wi-Fi y Bluetooth','Calor, ruido del ventilador y olores','Diagnóstico separado de almacenamiento y memoria'],mobile:['Pantalla, marco y lentes','Puerto, cable y carga inalámbrica','Batería y calor anormal','Reconocimiento facial y huella','Llamadas, red móvil, Wi-Fi y Bluetooth','GPS, NFC, daños por agua y reparaciones']},
de:{pc:['Gehäuse, Scharniere, Schrauben und Schäden','Stromversorgung, Ladegerät und Akku','USB-, HDMI- und Audioanschlüsse','WLAN und Bluetooth','Wärme, Lüftergeräusche und Geruch','Separate Speicher- und RAM-Diagnose'],mobile:['Display, Rahmen und Kameralinsen','Ladebuchse, Kabel und kabelloses Laden','Akku und ungewöhnliche Wärme','Fingerabdruck- und Gesichtserkennung','Anrufe, Mobilfunk, WLAN und Bluetooth','GPS, NFC, Wasser- und Reparaturschäden']},
fr:{pc:['Boîtier, charnières, vis et dommages','Alimentation, chargeur et batterie','Ports USB, HDMI et audio','Wi-Fi et Bluetooth','Chaleur, bruit du ventilateur et odeurs','Diagnostic séparé du stockage et de la mémoire'],mobile:['Écran, châssis et objectifs','Port, câble et recharge sans fil','Batterie et chaleur anormale','Empreinte digitale et reconnaissance faciale','Appels, réseau mobile, Wi-Fi et Bluetooth','GPS, NFC, dégâts des eaux et réparations']},
pt:{pc:['Carcaça, dobradiças, parafusos e danos','Alimentação, carregador e bateria','Portas USB, HDMI e áudio','Wi-Fi e Bluetooth','Calor, ruído da ventoinha e odores','Diagnóstico separado de armazenamento e memória'],mobile:['Tela, estrutura e lentes','Porta, cabo e carregamento sem fio','Bateria e calor anormal','Impressão digital e reconhecimento facial','Chamadas, rede móvel, Wi-Fi e Bluetooth','GPS, NFC, danos por água e reparos']},
it:{pc:['Scocca, cerniere, viti e danni','Alimentazione, caricatore e batteria','Porte USB, HDMI e audio','Wi-Fi e Bluetooth','Calore, rumore della ventola e odori','Diagnosi separata di memoria e archiviazione'],mobile:['Schermo, telaio e lenti','Porta, cavo e ricarica wireless','Batteria e calore anomalo','Impronta digitale e riconoscimento facciale','Chiamate, rete mobile, Wi-Fi e Bluetooth','GPS, NFC, danni da acqua e riparazioni']},
nl:{pc:['Behuizing, scharnieren, schroeven en schade','Voeding, oplader en accu','USB-, HDMI- en audiopoorten','Wifi en Bluetooth','Warmte, ventilatorgeluid en geuren','Afzonderlijke opslag- en geheugendiagnose'],mobile:['Scherm, frame en cameralenzen','Laadpoort, kabel en draadloos laden','Accuconditie en abnormale warmte','Vingerafdruk- en gezichtsherkenning','Bellen, mobiel netwerk, wifi en Bluetooth','GPS, NFC, water- en reparatiegeschiedenis']},
id:{pc:['Fisik, engsel, sekrup, dan kerusakan','Daya, pengisi daya, dan baterai','Port USB, HDMI, dan audio','Wi-Fi dan Bluetooth','Panas, suara kipas, dan bau','Diagnostik penyimpanan dan memori terpisah'],mobile:['Layar, rangka, dan lensa kamera','Port, kabel, dan pengisian nirkabel','Kondisi baterai dan panas berlebih','Sidik jari dan pengenalan wajah','Telepon, seluler, Wi-Fi, dan Bluetooth','GPS, NFC, kerusakan air, dan riwayat perbaikan']},
vi:{pc:['Vỏ máy, bản lề, ốc vít và hư hỏng','Nguồn, bộ sạc và pin','Cổng USB, HDMI và âm thanh','Wi-Fi và Bluetooth','Nhiệt, tiếng quạt và mùi lạ','Chẩn đoán riêng bộ nhớ và ổ lưu trữ'],mobile:['Màn hình, khung và ống kính','Cổng, cáp và sạc không dây','Tình trạng pin và nhiệt bất thường','Vân tay và nhận diện khuôn mặt','Cuộc gọi, mạng di động, Wi-Fi và Bluetooth','GPS, NFC, vào nước và lịch sử sửa chữa']},
'zh-CN':{pc:['外观、铰链、螺丝及损坏痕迹','电源、充电器及电池','USB、HDMI及音频接口','Wi-Fi及蓝牙','发热、风扇噪声及异味','另行诊断存储设备及内存'],mobile:['屏幕、边框及相机镜头','充电接口、线缆及无线充电','电池状态及异常发热','指纹及面部识别','通话、移动网络、Wi-Fi及蓝牙','GPS、NFC、进水及维修记录']},
ru:{pc:['Корпус, петли, винты и повреждения','Питание, зарядное устройство и аккумулятор','Разъёмы USB, HDMI и аудио','Wi-Fi и Bluetooth','Нагрев, шум вентилятора и запах','Отдельная диагностика накопителя и памяти'],mobile:['Экран, рамка и объективы камер','Разъём, кабель и беспроводная зарядка','Аккумулятор и необычный нагрев','Отпечаток пальца и распознавание лица','Звонки, мобильная сеть, Wi-Fi и Bluetooth','GPS, NFC, следы воды и история ремонта']}
};
const language=document.documentElement.lang||'ko';
const t=Object.fromEntries(TEXT_KEYS.map((key,i)=>[key,(TEXT[language]||TEXT.en)[i]]));
const manualLabels=MANUAL_TEXT[language]||MANUAL_TEXT.en;

function redirectLegacy(){
  if(location.hostname!==LEGACY_HOST||!location.pathname.startsWith('/pc-checkup/')) return false;
  const relative=location.pathname.slice('/pc-checkup'.length)||'/';
  if(/^\/(?:refundproof|proofrail|finalcheck)(?:\/|$)/.test(relative)) return false;
  location.replace(`${PROD}${relative}${location.search}${location.hash}`);
  return true;
}
if(redirectLegacy()) return;

const basename=()=>location.pathname.split('/').filter(Boolean).pop()||'index.html';
const isProd=()=>location.hostname==='pc-checkup.pages.dev';
const parse=(key)=>{try{const v=JSON.parse(localStorage.getItem(key)||'{}');return v&&typeof v==='object'&&!Array.isArray(v)?v:{};}catch{return {};}};
const count=(state,tests)=>{
  let ok=0,bad=0;
  for(const id of tests){if(state[id]==='ok')ok++;else if(state[id]==='bad')bad++;}
  return {ok,bad,done:ok+bad,unknown:tests.length-ok-bad,total:tests.length};
};
function track(event){
  if(!isProd()||navigator.webdriver||new URLSearchParams(location.search).get('qa')==='1') return;
  const once=`device-checkup-event:${event}`;
  try{if(sessionStorage.getItem(once))return;sessionStorage.setItem(once,'1');}catch{}
  fetch(ENDPOINT,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({event}),keepalive:true}).catch(()=>{});
}
function copyText(text){
  if(navigator.clipboard?.writeText) return navigator.clipboard.writeText(text).then(()=>true).catch(()=>false);
  try{const t=document.createElement('textarea');t.value=text;t.style.position='fixed';t.style.opacity='0';document.body.append(t);t.select();const ok=document.execCommand('copy');t.remove();return Promise.resolve(ok);}catch{return Promise.resolve(false);}
}
function style(){
  if(document.getElementById('deviceExperienceStyle'))return;
  const s=document.createElement('style');s.id='deviceExperienceStyle';s.textContent=`
.device-experience-card{margin:18px 0;padding:16px;border:1px solid var(--line,#34445a);border-radius:16px;background:#0d141d;color:#e8eef7}.device-experience-card h3{margin:0 0 7px;font-size:16px}.device-experience-card p{margin:0;color:#aebdce;font-size:13px;line-height:1.55}.device-experience-counts{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:14px 0}.device-experience-count{padding:10px;border-radius:12px;background:#121d29;text-align:center}.device-experience-count b{display:block;font-size:21px}.device-experience-count span{font-size:11px;color:#9fb0c2}.device-experience-actions{display:flex;gap:8px;flex-wrap:wrap}.device-experience-actions .btn{flex:1;min-width:140px}.device-manual{margin-top:14px;padding-top:13px;border-top:1px solid rgba(255,255,255,.1)}.device-manual summary{cursor:pointer;font-weight:800}.device-manual-list{display:grid;gap:8px;margin-top:11px}.device-manual-list label{display:flex;gap:9px;align-items:flex-start;padding:8px 10px;border-radius:10px;background:#121d29;font-size:12px;line-height:1.45}.device-manual-list input{margin-top:2px}.device-next-mobile{width:100%;margin-bottom:8px}@media(max-width:600px){.device-experience-actions{display:grid;grid-template-columns:1fr 1fr}.device-experience-actions .btn{min-width:0}.device-experience-counts{gap:6px}}`;
  document.head.append(s);
}
function manualState(kind){return parse(`device-checkup-manual-${kind}-v1`);}
function saveManual(kind,state){try{localStorage.setItem(`device-checkup-manual-${kind}-v1`,JSON.stringify(state));}catch{}}
function statusGuidance(stats){
  const hints=[];
  if(stats.bad)hints.push(t.issueHint);
  if(stats.unknown)hints.push(t.unknownHint);
  return hints.join(' ')||t.doneHint;
}
function summaryText(kind,stats,manual){
  const title=`DEVICE CHECKUP · ${kind==='pc'?t.pcTitle:t.mobileTitle}`;
  const checked=Object.values(manual).filter(Boolean).length;
  return `${title}\n${t.ok} ${stats.ok} · ${t.bad} ${stats.bad} · ${t.unknown} ${stats.unknown}\n${statusGuidance(stats)}\n${t.manual} ${checked}/${manualLabels[kind].length}\n${new Date().toLocaleString(language)}`;
}
function buildCard(kind,getState,tests,anchor){
  if(document.querySelector(`[data-device-experience="${kind}"]`))return ()=>{};
  style();
  const card=document.createElement('section');card.className='device-experience-card';card.dataset.deviceExperience=kind;
  card.innerHTML=`<h3>${t.summary}</h3><p>${t.intro}</p><div class="device-experience-counts"><div class="device-experience-count"><b data-x="ok">0</b><span>${t.ok}</span></div><div class="device-experience-count"><b data-x="bad">0</b><span>${t.bad}</span></div><div class="device-experience-count"><b data-x="unknown">0</b><span>${t.unknown}</span></div></div><p data-x="guidance" aria-live="polite"></p><div class="device-experience-actions"><button class="btn" type="button" data-copy>${t.copy}</button><button class="btn primary" type="button" data-share>${t.share}</button></div><p data-copy-status role="status"></p><details class="device-manual"><summary>${t.manual}</summary><div class="device-manual-list"></div></details>`;
  const list=card.querySelector('.device-manual-list'),manual=manualState(kind);
  manualLabels[kind].forEach((label,i)=>{const row=document.createElement('label');row.innerHTML=`<input type="checkbox" data-manual="${i}"><span>${label}</span>`;const input=row.querySelector('input');input.checked=!!manual[i];input.addEventListener('change',()=>{manual[i]=input.checked;saveManual(kind,manual);});list.append(row);});
  const render=()=>{const stats=count(getState(),tests);card.querySelector('[data-x="ok"]').textContent=stats.ok;card.querySelector('[data-x="bad"]').textContent=stats.bad;card.querySelector('[data-x="unknown"]').textContent=stats.unknown;card.querySelector('[data-x="guidance"]').textContent=statusGuidance(stats);return stats;};
  const copyButton=card.querySelector('[data-copy]');
  async function copyWithFeedback(text){
    copyButton.disabled=true;
    try{const ok=await copyText(text);card.querySelector('[data-copy-status]').textContent=ok?t.copied:t.copyFailed;}
    finally{copyButton.disabled=false;}
  }
  copyButton.addEventListener('click',()=>copyWithFeedback(summaryText(kind,render(),manual)));
  card.querySelector('[data-share]').addEventListener('click',async()=>{const text=summaryText(kind,render(),manual);if(navigator.share){try{await navigator.share({title:t.resultTitle,text,url:location.href});return;}catch(e){if(e?.name==='AbortError')return;}}await copyWithFeedback(`${text}\n${location.href}`);});
  anchor.parentNode.insertBefore(card,anchor);
  document.addEventListener('click',e=>{if(e.target.closest('.pill,[data-result]'))setTimeout(render,0);});
  render();
  return render;
}
function watchText(target,callback){
  if(!target||typeof MutationObserver==='undefined')return;
  const observer=new MutationObserver(()=>callback());observer.observe(target,{childList:true,characterData:true,subtree:true});
}
function watchCompletion(kind,getState,tests,target){
  const check=()=>{const stats=count(getState(),tests);if(stats.done===stats.total)track(kind==='pc'?'pc_complete':'mobile_complete');};
  watchText(target,check);
  document.addEventListener('click',e=>{if(e.target.closest('.pill,[data-result]'))setTimeout(check,0);});
  check();
}
function enhanceMobile(){
  const reset=document.getElementById('resetMobileResults');if(!reset)return;
  const getState=()=>parse('device-checkup-mobile-results-v1');
  const controls=reset.closest('.mobile-finish-controls')||reset.parentElement;
  let renderNext=()=>{};
  if(!document.getElementById('nextMobileCheck')){
    const next=document.createElement('button');next.id='nextMobileCheck';next.type='button';next.className='btn primary device-next-mobile';controls.insertBefore(next,reset);
    renderNext=()=>{const state=getState();const id=MOBILE_TESTS.find(x=>state[x]!=='ok'&&state[x]!=='bad');next.disabled=!id;next.textContent=id?t.next:t.complete;next.dataset.target=id||'';};
    next.addEventListener('click',()=>{const id=next.dataset.target;document.querySelector(`[data-test-card="${id}"]`)?.scrollIntoView({behavior:'smooth',block:'start'});});
    document.addEventListener('click',e=>{if(e.target.closest('[data-result]'))setTimeout(renderNext,0);});renderNext();
  }
  const renderCard=buildCard('mobile',getState,MOBILE_TESTS,controls);
  watchText(document.getElementById('mobileProgressText'),()=>{renderNext();renderCard();});
  track('mobile_start');
  watchCompletion('mobile',getState,MOBILE_TESTS,document.getElementById('mobileProgressText'));
}
function enhancePc(){
  const reset=document.getElementById('resetCheckup');if(!reset)return;
  const controls=reset.closest('.controls')||reset.parentElement;
  const renderCard=buildCard('pc',()=>parse('pc-checkup-results-v1'),PC_TESTS,controls);
  watchText(document.getElementById('checkProgress'),renderCard);
  track('pc_start');
  watchCompletion('pc',()=>parse('pc-checkup-results-v1'),PC_TESTS,document.getElementById('checkProgress'));
}
function init(){
  const page=basename().replace(/\.html$/,'');
  if(page==='checkup')enhancePc();
  if(page==='mobile')enhanceMobile();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
