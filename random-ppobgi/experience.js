(()=>{
'use strict';
const PROD='https://random-ppobgi.pages.dev';
const LEGACY='gsh4124-cyber.github.io';
const SETS_KEY='random-picker-saved-sets-v1';
const CONFIGS_KEY='random-picker-config-sets-v1';
const RESULTS_KEY='random-picker-recent-results-v1';
const MAX_SETS=12,MAX_RESULTS=12;
const LANGS=['ko','en','ja','es','zh','fr','de','pt','id','hi','pl','it','nl','tr','vi','th','ar'];
const TEXT={
ko:{save:'목록 저장',sets:'저장 목록',load:'불러오기',del:'삭제',setName:'목록 이름',copy:'결과 복사',share:'결과 공유',recent:'최근 결과',clear:'기록 지우기',record:'녹화 시작',stop:'녹화 종료',unsupported:'이 브라우저는 화면 녹화를 지원하지 않습니다.',choose:'녹화할 현재 탭 또는 화면을 선택하세요.',saved:'저장됨',copied:'복사됨',empty:'저장된 목록 없음'},
en:{save:'Save list',sets:'Saved lists',load:'Load',del:'Delete',setName:'List name',copy:'Copy result',share:'Share result',recent:'Recent results',clear:'Clear history',record:'Start recording',stop:'Stop recording',unsupported:'Screen recording is not supported in this browser.',choose:'Choose this tab or a screen to record.',saved:'Saved',copied:'Copied',empty:'No saved lists'},
ja:{save:'リスト保存',sets:'保存リスト',load:'読込',del:'削除',setName:'リスト名',copy:'結果をコピー',share:'結果を共有',recent:'最近の結果',clear:'履歴削除',record:'録画開始',stop:'録画終了',unsupported:'このブラウザは画面録画に対応していません。',choose:'録画するタブまたは画面を選択してください。',saved:'保存済み',copied:'コピー済み',empty:'保存リストなし'},
es:{save:'Guardar lista',sets:'Listas guardadas',load:'Cargar',del:'Eliminar',setName:'Nombre de lista',copy:'Copiar resultado',share:'Compartir resultado',recent:'Resultados recientes',clear:'Borrar historial',record:'Iniciar grabación',stop:'Detener grabación',unsupported:'Este navegador no admite grabación de pantalla.',choose:'Elige esta pestaña o una pantalla para grabar.',saved:'Guardado',copied:'Copiado',empty:'Sin listas guardadas'},
zh:{save:'保存名单',sets:'已保存名单',load:'载入',del:'删除',setName:'名单名称',copy:'复制结果',share:'分享结果',recent:'最近结果',clear:'清除记录',record:'开始录屏',stop:'停止录屏',unsupported:'此浏览器不支持屏幕录制。',choose:'请选择当前标签页或屏幕进行录制。',saved:'已保存',copied:'已复制',empty:'暂无保存名单'},
fr:{save:'Enregistrer',sets:'Listes enregistrées',load:'Charger',del:'Supprimer',setName:'Nom de la liste',copy:'Copier le résultat',share:'Partager',recent:'Résultats récents',clear:'Effacer',record:'Démarrer enregistrement',stop:'Arrêter',unsupported:"L’enregistrement d’écran n’est pas pris en charge.",choose:'Choisissez cet onglet ou un écran à enregistrer.',saved:'Enregistré',copied:'Copié',empty:'Aucune liste'},
de:{save:'Liste speichern',sets:'Gespeicherte Listen',load:'Laden',del:'Löschen',setName:'Listenname',copy:'Ergebnis kopieren',share:'Ergebnis teilen',recent:'Letzte Ergebnisse',clear:'Verlauf löschen',record:'Aufnahme starten',stop:'Aufnahme stoppen',unsupported:'Bildschirmaufnahme wird nicht unterstützt.',choose:'Diesen Tab oder Bildschirm zur Aufnahme auswählen.',saved:'Gespeichert',copied:'Kopiert',empty:'Keine Listen'},
pt:{save:'Salvar lista',sets:'Listas salvas',load:'Carregar',del:'Excluir',setName:'Nome da lista',copy:'Copiar resultado',share:'Compartilhar',recent:'Resultados recentes',clear:'Limpar histórico',record:'Iniciar gravação',stop:'Parar gravação',unsupported:'Este navegador não suporta gravação de tela.',choose:'Escolha esta aba ou uma tela para gravar.',saved:'Salvo',copied:'Copiado',empty:'Nenhuma lista'},
id:{save:'Simpan daftar',sets:'Daftar tersimpan',load:'Muat',del:'Hapus',setName:'Nama daftar',copy:'Salin hasil',share:'Bagikan hasil',recent:'Hasil terbaru',clear:'Hapus riwayat',record:'Mulai rekam',stop:'Hentikan rekam',unsupported:'Browser ini tidak mendukung perekaman layar.',choose:'Pilih tab ini atau layar untuk direkam.',saved:'Tersimpan',copied:'Disalin',empty:'Belum ada daftar'},
hi:{save:'सूची सहेजें',sets:'सहेजी सूचियाँ',load:'लोड',del:'हटाएँ',setName:'सूची नाम',copy:'परिणाम कॉपी',share:'परिणाम साझा',recent:'हाल के परिणाम',clear:'इतिहास साफ़',record:'रिकॉर्ड शुरू',stop:'रिकॉर्ड रोकें',unsupported:'यह ब्राउज़र स्क्रीन रिकॉर्डिंग समर्थित नहीं करता।',choose:'रिकॉर्ड करने के लिए यह टैब या स्क्रीन चुनें।',saved:'सहेजा गया',copied:'कॉपी हुआ',empty:'कोई सूची नहीं'},
pl:{save:'Zapisz listę',sets:'Zapisane listy',load:'Wczytaj',del:'Usuń',setName:'Nazwa listy',copy:'Kopiuj wynik',share:'Udostępnij',recent:'Ostatnie wyniki',clear:'Wyczyść',record:'Rozpocznij nagrywanie',stop:'Zatrzymaj',unsupported:'Ta przeglądarka nie obsługuje nagrywania ekranu.',choose:'Wybierz tę kartę lub ekran do nagrania.',saved:'Zapisano',copied:'Skopiowano',empty:'Brak list'},
it:{save:'Salva lista',sets:'Liste salvate',load:'Carica',del:'Elimina',setName:'Nome lista',copy:'Copia risultato',share:'Condividi',recent:'Risultati recenti',clear:'Cancella cronologia',record:'Avvia registrazione',stop:'Ferma registrazione',unsupported:'Il browser non supporta la registrazione schermo.',choose:'Scegli questa scheda o uno schermo da registrare.',saved:'Salvato',copied:'Copiato',empty:'Nessuna lista'},
nl:{save:'Lijst opslaan',sets:'Opgeslagen lijsten',load:'Laden',del:'Verwijderen',setName:'Lijstnaam',copy:'Resultaat kopiëren',share:'Delen',recent:'Recente resultaten',clear:'Geschiedenis wissen',record:'Opname starten',stop:'Opname stoppen',unsupported:'Deze browser ondersteunt geen schermopname.',choose:'Kies dit tabblad of een scherm om op te nemen.',saved:'Opgeslagen',copied:'Gekopieerd',empty:'Geen lijsten'},
tr:{save:'Listeyi kaydet',sets:'Kayıtlı listeler',load:'Yükle',del:'Sil',setName:'Liste adı',copy:'Sonucu kopyala',share:'Sonucu paylaş',recent:'Son sonuçlar',clear:'Geçmişi temizle',record:'Kaydı başlat',stop:'Kaydı durdur',unsupported:'Bu tarayıcı ekran kaydını desteklemiyor.',choose:'Kaydetmek için bu sekmeyi veya ekranı seçin.',saved:'Kaydedildi',copied:'Kopyalandı',empty:'Kayıtlı liste yok'},
vi:{save:'Lưu danh sách',sets:'Danh sách đã lưu',load:'Tải',del:'Xóa',setName:'Tên danh sách',copy:'Sao chép kết quả',share:'Chia sẻ',recent:'Kết quả gần đây',clear:'Xóa lịch sử',record:'Bắt đầu ghi',stop:'Dừng ghi',unsupported:'Trình duyệt này không hỗ trợ ghi màn hình.',choose:'Chọn tab này hoặc màn hình để ghi.',saved:'Đã lưu',copied:'Đã sao chép',empty:'Chưa có danh sách'},
th:{save:'บันทึกรายชื่อ',sets:'รายชื่อที่บันทึก',load:'โหลด',del:'ลบ',setName:'ชื่อรายการ',copy:'คัดลอกผล',share:'แชร์ผล',recent:'ผลล่าสุด',clear:'ล้างประวัติ',record:'เริ่มบันทึก',stop:'หยุดบันทึก',unsupported:'เบราว์เซอร์นี้ไม่รองรับการบันทึกหน้าจอ',choose:'เลือกแท็บนี้หรือหน้าจอที่จะบันทึก',saved:'บันทึกแล้ว',copied:'คัดลอกแล้ว',empty:'ไม่มีรายการ'},
ar:{save:'حفظ القائمة',sets:'القوائم المحفوظة',load:'تحميل',del:'حذف',setName:'اسم القائمة',copy:'نسخ النتيجة',share:'مشاركة النتيجة',recent:'النتائج الأخيرة',clear:'مسح السجل',record:'بدء التسجيل',stop:'إيقاف التسجيل',unsupported:'هذا المتصفح لا يدعم تسجيل الشاشة.',choose:'اختر علامة التبويب أو الشاشة للتسجيل.',saved:'تم الحفظ',copied:'تم النسخ',empty:'لا توجد قوائم'}
};
const lang=()=>{const raw=String(window.__RANDOM_PICKER_LANG__||document.documentElement.lang||'ko').toLowerCase().split('-')[0];return LANGS.includes(raw)?raw:'en'};
const t=()=>TEXT[lang()]||TEXT.en;
const read=(key,fallback=[])=>{try{const v=JSON.parse(localStorage.getItem(key)||'null');return Array.isArray(v)?v:fallback}catch{return fallback}};
const write=(key,v)=>{try{localStorage.setItem(key,JSON.stringify(v));return true}catch{return false}};
const byId=id=>document.getElementById(id);
const names=()=>byId('names');
const resultBlock=()=>byId('resultBlock');
const winners=()=>byId('winners');

function redirectLegacy(){
  if(location.hostname!==LEGACY)return false;
  let path=location.pathname;
  if(path==='/random-ppobgi'||path.startsWith('/random-ppobgi/'))path=path.slice('/random-ppobgi'.length)||'/';
  else return false;
  location.replace(`${PROD}${path}${location.search}${location.hash}`);
  return true;
}
if(redirectLegacy())return;

function css(){if(byId('pickerExperienceStyle'))return;const s=document.createElement('style');s.id='pickerExperienceStyle';s.textContent=`
.picker-experience-row{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:9px}.picker-experience-row select{flex:1;min-width:150px;height:40px;border:1px solid var(--line);border-radius:12px;background:var(--soft2);padding:0 10px}.picker-mini-btn{height:40px;border:1px solid var(--line);border-radius:12px;background:var(--card);padding:0 12px;font-weight:850}.picker-result-tools{display:flex;gap:8px;margin-top:14px;flex-wrap:wrap}.picker-result-tools button{flex:1;min-width:120px;min-height:44px;border:1px solid var(--line);border-radius:12px;background:var(--card);color:inherit;padding:10px 12px;font:inherit;font-size:13px;font-weight:850}.picker-history{margin-top:16px;border-top:1px solid rgba(100,80,60,.12);padding-top:13px}.picker-history-head{display:flex;justify-content:space-between;align-items:center;gap:10px}.picker-history h3{margin:0;font-size:14px}.picker-history-list{display:grid;gap:7px;margin-top:9px}.picker-history-item{font-size:12px;line-height:1.45;padding:9px 11px;border-radius:12px;background:rgba(255,255,255,.6);word-break:break-word}.picker-record-btn.recording{background:#8f2d2d!important;color:#fff!important;border-color:#8f2d2d!important}.picker-record-dot{display:inline-block;width:8px;height:8px;border-radius:50%;background:#e54848;margin-right:5px;vertical-align:1px}.picker-record-note{font-size:11px;color:var(--muted);margin-top:5px}@media(max-width:520px){.picker-experience-row{display:grid;grid-template-columns:1fr 1fr}.picker-experience-row select{grid-column:1/-1;width:100%}.picker-result-tools{display:grid;grid-template-columns:1fr 1fr}.picker-result-tools button{min-width:0}}`;
document.head.append(s)}
function toast(text){const el=byId('toast');if(!el)return;el.textContent=text;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),1300)}
async function copy(text){try{await navigator.clipboard.writeText(text);return true}catch{try{const x=document.createElement('textarea');x.value=text;x.style.position='fixed';x.style.opacity='0';document.body.append(x);x.select();const ok=document.execCommand('copy');x.remove();return ok}catch{return false}}}
function currentResultText(){const kick=byId('resultKicker')?.textContent?.trim();const rows=[...(winners()?.querySelectorAll('li')||[])].map(x=>x.textContent.trim()).filter(Boolean);return [kick,...rows].filter(Boolean).join('\n')}
function historyText(item){
 if(!Array.isArray(item.results))return `${item.title||'Result'} · ${String(item.text||'').replace(/\n/g,' / ')}`;
 const pack=window.RandomPickerLocales?.[lang()];
 const title=pack?.methods?.[item.method]||{ladder:'사다리',wheel:'룰렛',lot:'제비',pinball:'핀볼',race:'경주',capsule:'캡슐',slot:'슬롯',bomb:'폭탄'}[item.method]||'Result';
 const rows=item.results.map(r=>{
  const person=item.inputMode==='number'?(lang()==='ko'?`${r.label}번`:`#${r.label}`):r.label;
  const outcome=!r.active?(pack?.dynamic?.lose||'꽝'):item.resultMode==='custom'?r.text:item.resultMode==='rank'?(lang()==='ko'?`${r.rank}등`:`#${r.rank}`):(pack?.winner||'당첨');
  return item.showAll||item.resultMode!=='winner'?`${person} · ${outcome}`:person;
 });
 return `${title} · ${rows.join(' / ')}`;
}
function renderHistory(container){const items=read(RESULTS_KEY);container.innerHTML='';items.forEach(item=>{const row=document.createElement('div');row.className='picker-history-item';row.setAttribute('translate','no');row.textContent=historyText(item);container.append(row)})}
function saveResultIfNew(historyList,detail){
 if(!detail?.runId||!Array.isArray(detail.results)||!detail.results.length)return;
 const items=read(RESULTS_KEY).filter(item=>item.runId!==detail.runId);
 items.unshift({...detail,at:Date.now()});write(RESULTS_KEY,items.slice(0,MAX_RESULTS));renderHistory(historyList);
}

function enhanceNameSets(){const foot=document.querySelector('#nameMode .namefoot');if(!foot||byId('savedSetSelect'))return;const row=document.createElement('div');row.className='picker-experience-row';row.innerHTML=`<select id="savedSetSelect" aria-label="${t().sets}"></select><button class="picker-mini-btn" id="saveSetBtn" type="button">${t().save}</button><button class="picker-mini-btn" id="loadSetBtn" type="button">${t().load}</button><button class="picker-mini-btn" id="deleteSetBtn" type="button">${t().del}</button>`;foot.after(row);
 const select=byId('savedSetSelect');
 const refresh=()=>{const sets=read(SETS_KEY);select.innerHTML=`<option value="">${sets.length?t().sets:t().empty}</option>`+sets.map((x,i)=>`<option value="${i}">${String(x.name).replace(/[&<>"']/g,'')}</option>`).join('')};
 byId('saveSetBtn').addEventListener('click',()=>{const value=names()?.value.trim();if(!value)return;const fallback=`${t().sets} ${read(SETS_KEY).length+1}`;const title=(prompt(t().setName,fallback)||'').trim();if(!title)return;const sets=read(SETS_KEY).filter(x=>x.name!==title);sets.unshift({name:title,value,at:Date.now()});write(SETS_KEY,sets.slice(0,MAX_SETS));refresh();toast(t().saved)});
 byId('loadSetBtn').addEventListener('click',()=>{const i=Number(select.value);if(!Number.isInteger(i)||select.value==='')return;const set=read(SETS_KEY)[i];if(!set)return;names().value=set.value;names().dispatchEvent(new Event('input',{bubbles:true}))});
 byId('deleteSetBtn').addEventListener('click',()=>{const i=Number(select.value);if(!Number.isInteger(i)||select.value==='')return;const sets=read(SETS_KEY);sets.splice(i,1);write(SETS_KEY,sets);refresh()});refresh();
}
const CONFIG_KEYS=['title','save','name','loaded','error','hint','empty'];
const CONFIG_TEXT={
ko:['설정 세트','설정 저장','설정 이름','불러옴','설정을 저장하거나 불러오지 못했습니다.','이 브라우저에 최대 12개 저장됩니다.','저장된 설정 없음'],
en:['Saved setups','Save setup','Setup name','Loaded','Could not save or load this setup.','Up to 12 setups are saved in this browser.','No saved setups'],
ja:['設定セット','設定を保存','設定名','読み込み済み','設定を保存または読み込めませんでした。','このブラウザーに最大12件保存します。','保存した設定なし'],
es:['Configuraciones','Guardar','Nombre de configuración','Cargada','No se pudo guardar o cargar la configuración.','Se guardan hasta 12 configuraciones en este navegador.','Sin configuraciones guardadas'],
zh:['设置组合','保存设置','设置名称','已载入','无法保存或载入此设置。','最多在此浏览器保存12组设置。','暂无已保存设置'],
fr:['Configurations','Enregistrer','Nom de la configuration','Chargée','Impossible d’enregistrer ou de charger cette configuration.','Jusqu’à 12 configurations sont conservées dans ce navigateur.','Aucune configuration enregistrée'],
de:['Gespeicherte Einstellungen','Speichern','Name der Einstellung','Geladen','Diese Einstellung konnte nicht gespeichert oder geladen werden.','Bis zu 12 Einstellungen werden in diesem Browser gespeichert.','Keine gespeicherten Einstellungen'],
pt:['Configurações','Salvar configuração','Nome da configuração','Carregada','Não foi possível salvar ou carregar esta configuração.','Até 12 configurações são salvas neste navegador.','Nenhuma configuração salva'],
id:['Setelan tersimpan','Simpan setelan','Nama setelan','Dimuat','Setelan tidak dapat disimpan atau dimuat.','Hingga 12 setelan disimpan di browser ini.','Belum ada setelan tersimpan'],
hi:['सहेजी गई सेटिंग','सेटिंग सहेजें','सेटिंग का नाम','लोड हो गई','सेटिंग सहेजी या लोड नहीं हो सकी।','इस ब्राउज़र में अधिकतम 12 सेटिंग सहेजी जाती हैं।','कोई सहेजी गई सेटिंग नहीं'],
pl:['Zapisane ustawienia','Zapisz ustawienia','Nazwa ustawień','Wczytano','Nie udało się zapisać lub wczytać ustawień.','W tej przeglądarce zapisuje się do 12 zestawów.','Brak zapisanych ustawień'],
it:['Configurazioni','Salva','Nome configurazione','Caricata','Impossibile salvare o caricare questa configurazione.','Fino a 12 configurazioni vengono salvate in questo browser.','Nessuna configurazione salvata'],
nl:['Opgeslagen instellingen','Opslaan','Naam van instellingen','Geladen','Deze instellingen konden niet worden opgeslagen of geladen.','Maximaal 12 instellingen worden in deze browser opgeslagen.','Geen opgeslagen instellingen'],
tr:['Kayıtlı ayarlar','Ayarları kaydet','Ayar adı','Yüklendi','Bu ayarlar kaydedilemedi veya yüklenemedi.','Bu tarayıcıda en fazla 12 ayar saklanır.','Kayıtlı ayar yok'],
vi:['Bộ cài đặt','Lưu cài đặt','Tên bộ cài đặt','Đã tải','Không thể lưu hoặc tải bộ cài đặt này.','Lưu tối đa 12 bộ cài đặt trong trình duyệt này.','Chưa có bộ cài đặt'],
th:['ชุดการตั้งค่า','บันทึกการตั้งค่า','ชื่อชุดการตั้งค่า','โหลดแล้ว','ไม่สามารถบันทึกหรือโหลดการตั้งค่านี้ได้','บันทึกได้สูงสุด 12 ชุดในเบราว์เซอร์นี้','ยังไม่มีชุดการตั้งค่าที่บันทึกไว้'],
ar:['الإعدادات المحفوظة','حفظ الإعدادات','اسم الإعدادات','تم التحميل','تعذر حفظ هذه الإعدادات أو تحميلها.','تُحفظ حتى 12 مجموعة إعدادات في هذا المتصفح.','لا توجد إعدادات محفوظة']
};
function enhanceConfigSets(){
 const api=window.RandomPickerSettings,anchor=byId('pickBtn')?.parentElement;if(!api||!anchor||byId('pickerConfigSets'))return;
 const c=Object.fromEntries(CONFIG_KEYS.map((key,i)=>[key,(CONFIG_TEXT[lang()]||CONFIG_TEXT.en)[i]]));
 const panel=document.createElement('details');panel.id='pickerConfigSets';panel.className='picker-config-sets';
 const summary=document.createElement('summary');summary.textContent=c.title;
 const row=document.createElement('div');row.className='picker-config-row';
 const select=document.createElement('select');select.id='pickerConfigSelect';select.setAttribute('aria-label',c.title);select.setAttribute('translate','no');
 const makeButton=(id,text)=>{const b=document.createElement('button');b.id=id;b.type='button';b.textContent=text;return b;};
 const save=makeButton('savePickerConfig',c.save),load=makeButton('loadPickerConfig',t().load),remove=makeButton('deletePickerConfig',t().del);
 const hint=document.createElement('p');hint.textContent=c.hint;const status=document.createElement('p');status.id='pickerConfigStatus';status.setAttribute('role','status');
 row.append(select,save,load,remove);panel.append(summary,row,hint,status);anchor.prepend(panel);
 const sets=()=>read(CONFIGS_KEY).filter(x=>x&&typeof x.name==='string'&&x.name&&x.settings&&typeof x.settings==='object');
 function refresh(selected=select.value){select.replaceChildren();const items=sets(),empty=document.createElement('option');empty.value='';empty.textContent=items.length?c.title:c.empty;select.append(empty);for(const item of items){const option=document.createElement('option');option.value=item.name;option.textContent=item.name;select.append(option);}select.value=items.some(x=>x.name===selected)?selected:'';load.disabled=remove.disabled=!select.value;}
 select.addEventListener('change',()=>{load.disabled=remove.disabled=!select.value;status.textContent='';});
 save.addEventListener('click',()=>{const name=(prompt(c.name,select.value||`${c.title} ${sets().length+1}`)||'').trim();if(!name)return;const settings=api.capture();if(!api.validate(settings)){status.textContent=c.error;return;}const items=sets().filter(x=>x.name!==name);items.unshift({name,settings,at:Date.now()});if(!write(CONFIGS_KEY,items.slice(0,MAX_SETS))){status.textContent=c.error;return;}refresh(name);status.textContent=t().saved;});
 load.addEventListener('click',()=>{const item=sets().find(x=>x.name===select.value);status.textContent=item&&api.apply(item.settings)?c.loaded:c.error;});
 remove.addEventListener('click',()=>{if(!select.value)return;if(!write(CONFIGS_KEY,sets().filter(x=>x.name!==select.value))){status.textContent=c.error;return;}refresh('');status.textContent='';});
 window.addEventListener('storage',event=>{if(event.key===CONFIGS_KEY)refresh();});refresh();
 const style=document.createElement('style');style.textContent='.picker-config-sets{margin:14px 0;border:1px solid var(--line);border-radius:12px;padding:0 12px}.picker-config-sets summary{cursor:pointer;min-height:44px;box-sizing:border-box;padding:12px 0;font-size:14px;font-weight:800}.picker-config-row{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;min-width:0}.picker-config-row select{grid-column:1/-1;width:100%;min-width:0;min-height:44px;border:1px solid var(--line);border-radius:10px;background:var(--soft2);font:inherit;font-size:16px;padding:8px}.picker-config-row button{min-width:0;min-height:44px;border:1px solid var(--line);border-radius:10px;background:var(--card);font:inherit;font-size:13px;font-weight:800;white-space:normal;overflow-wrap:anywhere;padding:8px}.picker-config-row button:disabled{opacity:.5;cursor:default}.picker-config-sets p{font-size:12px;color:var(--muted);line-height:1.5;margin:10px 0}.picker-config-sets p:empty{display:none}';panel.append(style);
}
function enhanceResults(){const block=resultBlock();if(!block||byId('pickerResultTools'))return;const tools=document.createElement('div');tools.id='pickerResultTools';tools.className='picker-result-tools';tools.innerHTML=`<button class="again" id="copyPickerResult" type="button">${t().copy}</button><button class="again" id="sharePickerResult" type="button">${t().share}</button>`;block.append(tools);
 const history=document.createElement('section');history.className='picker-history';history.innerHTML=`<div class="picker-history-head"><h3>${t().recent}</h3><button class="picker-mini-btn" id="clearPickerHistory" type="button">${t().clear}</button></div><div class="picker-history-list" id="pickerHistoryList"></div>`;block.after(history);const list=byId('pickerHistoryList');renderHistory(list);
 byId('copyPickerResult').addEventListener('click',async()=>{if(await copy(currentResultText()))toast(t().copied)});
 byId('sharePickerResult').addEventListener('click',async()=>{const text=currentResultText();if(!text)return;if(navigator.share){try{await navigator.share({title:document.title,text,url:location.href});return}catch(e){if(e?.name==='AbortError')return}}if(await copy(`${text}\n${location.href}`))toast(t().copied)});
 byId('clearPickerHistory').addEventListener('click',()=>{write(RESULTS_KEY,[]);renderHistory(list)});
 document.addEventListener('random-picker:result',event=>saveResultIfNew(list,event.detail));
}

let recorder=null,recordStream=null,chunks=[];
function recordingSupported(){return !!(navigator.mediaDevices?.getDisplayMedia&&window.MediaRecorder)}
function preferredMime(){for(const x of ['video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm'])if(MediaRecorder.isTypeSupported?.(x))return x;return ''}
function finishRecording(button){if(!chunks.length){cleanupRecording(button);return}const type=recorder?.mimeType||'video/webm';const blob=new Blob(chunks,{type});const url=URL.createObjectURL(blob);const a=document.createElement('a');const d=new Date(),stamp=d.toISOString().replace(/[:T]/g,'-').slice(0,19);a.href=url;a.download=`random-picker-${stamp}.webm`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);cleanupRecording(button)}
function cleanupRecording(button){recordStream?.getTracks().forEach(x=>x.stop());recordStream=null;recorder=null;chunks=[];button.classList.remove('recording');button.innerHTML=t().record}
async function startRecording(button){if(!recordingSupported()){toast(t().unsupported);return}try{recordStream=await navigator.mediaDevices.getDisplayMedia({video:{frameRate:{ideal:30,max:60}},audio:false});chunks=[];const mime=preferredMime();recorder=new MediaRecorder(recordStream,mime?{mimeType:mime}:undefined);recorder.ondataavailable=e=>{if(e.data?.size)chunks.push(e.data)};recorder.onstop=()=>finishRecording(button);recordStream.getVideoTracks()[0]?.addEventListener('ended',()=>{if(recorder?.state==='recording')recorder.stop()});recorder.start(500);button.classList.add('recording');button.innerHTML=`<span class="picker-record-dot"></span>${t().stop}`}catch(e){cleanupRecording(button);if(e?.name!=='NotAllowedError'&&e?.name!=='AbortError')toast(t().unsupported)}}
function enhanceRecording(){
 const card=byId('mainCard');
 if(!card||byId('recordPickerBtn')||!recordingSupported())return;
 const row=document.createElement('div');row.className='picker-record-tools';
 const button=document.createElement('button');button.id='recordPickerBtn';button.type='button';
 button.className='picker-mini-btn picker-record-btn';button.textContent=t().record;button.title=t().choose;
 button.addEventListener('click',()=>{if(recorder?.state==='recording')recorder.stop();else startRecording(button)});
 row.append(button);card.after(row);
}
function init(){css();enhanceNameSets();enhanceConfigSets();enhanceResults();enhanceRecording()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
