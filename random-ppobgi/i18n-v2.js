(() => {
  const lang=window.__RANDOM_PICKER_LANG__||location.pathname.split('/').filter(Boolean)[0]||'ko';
  const pack=window.RandomPickerLocales?.[lang];
  if(!pack||lang==='ko')return;
  const q=(s,r=document)=>r.querySelector(s), qa=(s,r=document)=>[...r.querySelectorAll(s)];
  document.documentElement.lang=pack.htmlLang||lang;
  document.documentElement.dir=pack.dir||'ltr';

  const set=(sel,text,r=document)=>{const el=q(sel,r);if(el&&text!=null)el.textContent=text};
  const attr=(sel,name,text,r=document)=>{const el=q(sel,r);if(el&&text!=null&&el.getAttribute(name)!==String(text))el.setAttribute(name,text)};
  const textAfterIcon=(el,text)=>{if(!el)return;const icon=el.querySelector('span');if(icon){[...el.childNodes].filter(n=>n!==icon).forEach(n=>n.remove());el.append(document.createTextNode(text));}else el.textContent=text};

  function localizeStatic(){
    set('.logo',pack.brand);set('#resetBtn',pack.reset);set('.hero h1',pack.hero);set('.hero p',pack.tagline);
    set('#showPicker',pack.pickerGames);set('#showTools',pack.gameTools);set('.method-label',pack.pickMethod);
    qa('.method').forEach(b=>{const e=q('.name',b);if(e)e.textContent=pack.methods[b.dataset.method]||b.dataset.method;});
    set('#numberTab',pack.number);set('#nameTab',pack.name);
    const bombLabel=q('#bombSettings .label span');if(bombLabel)bombLabel.textContent=pack.bombTime;
    set('#bombModeRandom',pack.random);set('#bombModeFixed',pack.setTime);const bombUnit=q('#bombSeconds')?.parentElement?.querySelector('.unit');if(bombUnit)bombUnit.textContent='s';
    const bombNote=q('#bombFixedWrap .result-note');if(bombNote)bombNote.textContent=pack.bombStep;
    const totalLabel=q('#totalField .label span');if(totalLabel)totalLabel.textContent=pack.totalPeople;
    const totalUnit=q('#totalPeople')?.parentElement?.querySelector('.unit');if(totalUnit)totalUnit.textContent=pack.peopleUnit;
    set('#numberMode .result-note',pack.participantAuto);
    const nameLabel=q('label[for="names"]');if(nameLabel)nameLabel.textContent=pack.participantName;
    attr('#names','placeholder',pack.tools.participantPlaceholder);set('#nameGuide',pack.nameGuide);set('#sampleBtn',pack.sample);
    set('#pickLabel',pack.pickCount);set('#pickUnit',pack.peopleUnit);
    const resultLabel=q('#resultSettings .label-text');if(resultLabel)resultLabel.textContent=pack.result;
    const opts=qa('#resultMode option');if(opts[0])opts[0].textContent=pack.winner;if(opts[1])opts[1].textContent=pack.rank;if(opts[2])opts[2].textContent=pack.custom;
    attr('#resultMode','aria-label',pack.result);attr('#customResults','placeholder',pack.customPlaceholder);set('label[for="customResults"]',pack.custom);set('#customResultNote',pack.customNote);
    set('#pickBtn',pack.start);set('#remainingCandidates .remaining-head span',pack.remaining);set('#showAllBtn',pack.showNow);set('#resultKicker',pack.resultTitle);set('#repickBtn',pack.rerollAll);set('#excludeBtn',pack.rerollExclude);
    attr('#soundToggle','aria-label',pack.dynamic.soundOn);attr('#soundToggle','title',pack.dynamic.soundOn);
    attr('#numberTab','aria-label',pack.number);attr('#nameTab','aria-label',pack.name);
    attr('.section-switch','aria-label',`${pack.pickerGames} / ${pack.gameTools}`);
    attr('.methods','aria-label',pack.pickMethod);
    attr('#inputTabs','aria-label',`${pack.number} / ${pack.name}`);
    const bombMinus=q('[data-target="bombSeconds"][data-delta="-1"]'),bombPlus=q('[data-target="bombSeconds"][data-delta="1"]');
    if(bombMinus)bombMinus.setAttribute('aria-label',`− ${pack.bombTime}`);if(bombPlus)bombPlus.setAttribute('aria-label',`+ ${pack.bombTime}`);
    attr('#bombSeconds','aria-label',pack.bombTime);
    const totalMinus=q('[data-target="totalPeople"][data-delta="-1"]'),totalPlus=q('[data-target="totalPeople"][data-delta="1"]');
    if(totalMinus)totalMinus.setAttribute('aria-label',`− ${pack.totalPeople}`);if(totalPlus)totalPlus.setAttribute('aria-label',`+ ${pack.totalPeople}`);
    attr('#totalPeople','aria-label',pack.totalPeople);
    const pickMinus=q('[data-target="pickCount"][data-delta="-1"]'),pickPlus=q('[data-target="pickCount"][data-delta="1"]');
    if(pickMinus)pickMinus.setAttribute('aria-label',`− ${pack.pickCount}`);if(pickPlus)pickPlus.setAttribute('aria-label',`+ ${pack.pickCount}`);
    attr('#pickCount','aria-label',pack.pickCount);
    attr('.tool-tabs','aria-label',pack.gameTools);
    attr('.service-info','aria-label',pack.service.faqQ);

    set('#gameToolsTitle',pack.gameTools.replace(/^🎲\s*/,''));set('#gameTools .tool-head p',pack.tools.intro);
    const toolNames={dice:pack.tools.dice,yut:pack.tools.yut,coin:pack.tools.coin,order:pack.tools.order,team:pack.tools.team};
    qa('.tool-tab').forEach(b=>textAfterIcon(b,toolNames[b.dataset.tool]));
    const dice=q('[data-panel="dice"]');if(dice){set('h3',pack.tools.diceTitle,dice);set('.tool-desc',pack.tools.diceDesc,dice);const l=q('label',dice);if(l)l.textContent=pack.tools.count;set('#rollDice',pack.tools.roll);set('#diceResult',pack.tools.rollPrompt);}
    const yut=q('[data-panel="yut"]');if(yut){set('h3',pack.tools.yutTitle,yut);set('.tool-desc',pack.tools.yutDesc,yut);set('#throwYut',pack.tools.throwYut);set('#yutResult',pack.tools.yutPrompt);}
    const coin=q('[data-panel="coin"]');if(coin){set('h3',pack.tools.coinTitle,coin);set('.tool-desc',pack.tools.coinDesc,coin);set('#flipCoin',pack.tools.flipCoin);}
    const order=q('[data-panel="order"]');if(order){set('h3',pack.tools.orderTitle,order);set('.tool-desc',pack.tools.orderDesc,order);attr('#orderNames','placeholder',pack.tools.participantPlaceholder);set('#makeOrder',pack.tools.shuffleOrder);set('#orderResult',pack.tools.orderPrompt);}
    const team=q('[data-panel="team"]');if(team){set('h3',pack.tools.teamTitle,team);set('.tool-desc',pack.tools.teamDesc,team);attr('#teamNames','placeholder',pack.tools.participantPlaceholder);const l=q('label',team);if(l)l.textContent=pack.tools.teamCount;set('#makeTeams',pack.tools.makeTeams);set('#teamResult',pack.tools.teamPrompt);}

    const info=q('.service-info');
    if(info&&!info.dataset.localized){info.dataset.localized='1';info.innerHTML=`<div class="service-copy" data-copy="picker"><h2>${esc(pack.service.pickerHeading)}</h2><p>${esc(pack.service.pickerP)}</p><div class="game-tool-note"><strong>${esc(pack.service.pickerNoteH)}</strong><p>${esc(pack.service.pickerNoteP)}</p></div></div><div class="service-copy" data-copy="tools" hidden><h2>${esc(pack.service.toolsHeading)}</h2><p>${esc(pack.service.toolsP)}</p><div class="game-tool-note"><strong>${esc(pack.service.toolsNoteH)}</strong><p>${esc(pack.service.toolsNoteP)}</p></div></div><details><summary>${esc(pack.service.gamesQ)}</summary><p>${Object.values(pack.methods).map(esc).join(' · ')}</p></details><details><summary>${esc(pack.service.toolsQ)}</summary><p>${[pack.tools.dice,pack.tools.yut,pack.tools.coin,pack.tools.order,pack.tools.team].map(esc).join(' · ')}</p></details><details><summary>${esc(pack.service.modesQ)}</summary><p>${esc(pack.service.modesA)}</p></details><details><summary>${esc(pack.service.savedQ)}</summary><p>${esc(pack.service.savedA)}</p></details><details><summary>${esc(pack.service.fairQ)}</summary><p>${esc(pack.service.fairA)}</p></details><details><summary>${esc(pack.service.faqQ)}</summary><p>${esc(pack.service.faqA)}</p></details>`;}
    const footer=q('.site-footer');if(footer){const links=qa('a',footer),labels=[pack.footer.about,pack.footer.guide,pack.footer.privacy,pack.footer.terms,pack.footer.contact],paths=['about','guide','privacy','terms','contact'];links.forEach((a,i)=>{if(labels[i])a.textContent=labels[i];if(paths[i])a.href=`/${lang}/${paths[i]}/`;});const p=q('p',footer);if(p)p.textContent=pack.footer.browserOnly;const nav=q('nav',footer);if(nav)nav.setAttribute('aria-label',pack.service.faqQ);}

    const sample=q('#sampleBtn');if(sample&&!sample.dataset.i18nOverride){sample.dataset.i18nOverride='1';sample.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();const names=q('#names');if(!names)return;const n=Math.max(2,Math.floor(Number(q('#totalPeople')?.value)||8));names.value=Array.from({length:n},(_,i)=>pack.dynamic.sampleNames[i%pack.dynamic.sampleNames.length]+(i>=pack.dynamic.sampleNames.length?` ${Math.floor(i/pack.dynamic.sampleNames.length)+1}`:'')).join('\n');names.dispatchEvent(new Event('input',{bubbles:true}));},{capture:true});}
  }

  function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  const exact=new Map([
    ['효과음 켜기',pack.dynamic.soundOn],['효과음 끄기',pack.dynamic.soundOff],['당첨',pack.winner],['꽝',pack.dynamic.lose],['폭탄',pack.dynamic.bomb],['제비',pack.dynamic.lot],['결과',pack.result],['참가자 이름이 적힌 회전 룰렛',pack.methods.wheel],
    ['위 번호나 이름을 눌러 천천히 따라가 보세요.',pack.dynamic.ladderHint],['룰렛 시작',pack.dynamic.wheelStart],['멈춤',pack.dynamic.stop],['멈춤을 누르지 않아도 잠시 후 자동으로 멈춰요.',pack.dynamic.wheelHint],['다음 룰렛',pack.dynamic.nextWheel],['원하는 제비를 눌러 하나씩 펼쳐보세요.',pack.dynamic.lotHint],
    ['말 경주',pack.dynamic.horseRace],['캐릭터',pack.dynamic.character],['준비',pack.dynamic.ready],['경주 시작',pack.dynamic.raceStart],['번호 순서는 그대로 두고, 도착만 랜덤으로 정해져요.',pack.dynamic.raceHint],['완주',pack.dynamic.finished],['완료',pack.dynamic.complete],['출발!',pack.dynamic.depart],['우승!',pack.dynamic.champion],
    ['레버 돌리기',pack.dynamic.capsuleLever],['레버를 돌리면 캡슐이 섞이고, 한 알이 내려와 열립니다.',pack.dynamic.capsuleHint],['돌리는 중…',pack.dynamic.spinning],['나오는 중…',pack.dynamic.dispensing],['다음 캡슐',pack.dynamic.nextCapsule],
    ['슬롯 시작',pack.dynamic.slotStart],['릴이 하나씩 멈추고 가운데 결과가 당첨됩니다.',pack.dynamic.slotHint],['다음 슬롯',pack.dynamic.nextSlot],
    ['화면을 켜 둔 채로 휴대폰을 돌리세요',pack.dynamic.bombPass],['준비되면 시작',pack.dynamic.bombReady],['폭탄 시작',pack.dynamic.bombStart],['바로 터뜨리기',pack.dynamic.explodeNow],['15초~5분 사이에서 매번 랜덤으로 터져요.',pack.dynamic.bombRandomHint],['설정한 시간 뒤에 터집니다.',pack.dynamic.bombFixedHint],['걸렸습니다!',pack.dynamic.caught],['💥 지금 들고 있는 사람이 당첨!',pack.dynamic.bombWinner],['다시 시작',pack.dynamic.restart],['넘기는 중…',pack.dynamic.passing],
    ['넘기세요',pack.dynamic.holders[0]],['다음 사람',pack.dynamic.holders[1]],['돌리세요',pack.dynamic.holders[2]],['조심하세요',pack.dynamic.holders[3]],['빨리 넘기세요',pack.dynamic.holders[4]],['아직 안 터졌어요',pack.dynamic.holders[5]],
    ['참가자 공이 장애물을 지나 중앙 홀로 떨어지는 핀볼 경기',pack.dynamic.pinballAria],['공들이 맨 위 좌우에서 떨어져요',pack.dynamic.pinballLive],['공들이 맨 위 좌우에서 떨어집니다',pack.dynamic.ballsFalling],['핀볼 시작',pack.dynamic.pinballStart],['동작 줄이기 설정으로 결과를 빠르게 표시합니다',pack.dynamic.reducedMotion],['진행 중',pack.dynamic.inProgress],
    ['미디어 음량을 확인해주세요',pack.dynamic.mediaVolume],['앞면',pack.dynamic.heads],['뒷면',pack.dynamic.tails],['모',pack.yut.mo],['도',pack.yut.do],['개',pack.yut.gae],['걸',pack.yut.geol],['윷',pack.yut.yut],
    ['이름은 최대 100명까지 입력할 수 있어요',pack.dynamic.maxName],['이름을 2명 이상 입력하세요',pack.dynamic.minName],['사다리는 12명까지 이용할 수 있어요',pack.dynamic.ladderLimit],['핀볼은 16명까지 이용할 수 있어요',pack.dynamic.pinballLimit],['경주는 16명까지 이용할 수 있어요',pack.dynamic.raceLimit],['등수를 확인하세요',pack.dynamic.checkRank],['뽑을 인원을 확인하세요',pack.dynamic.checkPick]
  ]);
  function compactCount(n){return ['ja','zh'].includes(lang)?`${n}${pack.peopleUnit}`:`${n} ${pack.peopleUnit}`;}
  function trText(raw){
    if(raw==null)return raw;const leading=raw.match(/^\s*/)?.[0]||'',trailing=raw.match(/\s*$/)?.[0]||'',s=raw.trim();if(!s)return raw;
    if(exact.has(s))return leading+exact.get(s)+trailing;
    let x=s;
    const methodWords={사다리:pack.methods.ladder,룰렛:pack.methods.wheel,제비:pack.methods.lot,핀볼:pack.methods.pinball,경주:pack.methods.race,캡슐:pack.methods.capsule,슬롯:pack.methods.slot,폭탄:pack.methods.bomb};
    for(const [ko,value] of Object.entries(methodWords))x=x.split(ko).join(value);
    x=x.replace(/(\d+)명\s*도착/g,(_,n)=>`${compactCount(n)} ${pack.dynamic.arrived}`);
    x=x.replace(/(\d+)명/g,(_,n)=>compactCount(n));
    x=x.replace(/(\d+)번/g,(_,n)=>`#${n}`);
    x=x.replace(/(\d+)(등|위)/g,(_,n)=>`#${n}`);
    x=x.replace(/(\d+)초/g,(_,n)=>`${n}s`).replace(/(\d+)분/g,(_,n)=>`${n}min`);
    x=x.replace(/합계\s*(\d+)/g,(_,n)=>`${pack.dynamic.total} ${n}`);
    x=x.replace(/(\d+)팀/g,(_,n)=>`${pack.dynamic.team} ${n}`);
    x=x.replace(/우승!/g,pack.dynamic.champion).replace(/당첨/g,pack.winner).replace(/꽝/g,pack.dynamic.lose).replace(/결과/g,pack.result);
    x=x.replace(/결과를\s*(\d+)개\s*입력하세요/g,pack.customNote);
    x=x.replace(/남은 참가자는\s*(\d+)\s*[^ ]*라\s*(\d+)명을 뽑을 수 없어요/g,(_,a,b)=>`${pack.remaining}: ${a}. ${pack.dynamic.checkPick} (${b})`);
    x=x.replace(/최대\s*(\d+)\s*(명|등)/g,(_,n)=>`${n} ${pack.peopleUnit} max`);
    return leading+x+trailing;
  }
  function translateNode(node){
    if(node.nodeType===Node.TEXT_NODE){const p=node.parentElement;if(!p||['SCRIPT','STYLE','TEXTAREA','OPTION'].includes(p.tagName))return;const v=trText(node.nodeValue);if(v!==node.nodeValue)node.nodeValue=v;return;}
    if(node.nodeType!==Node.ELEMENT_NODE)return;
    const el=node;
    for(const name of ['aria-label','title','placeholder']){const v=el.getAttribute(name);if(v){const nv=trText(v);if(nv!==v)el.setAttribute(name,nv);}}
    [...el.childNodes].forEach(translateNode);
  }
  function translateAll(){translateNode(document.body);}
  localizeStatic();translateAll();

  const observer=new MutationObserver(records=>{for(const r of records){if(r.type==='childList')r.addedNodes.forEach(translateNode);else if(r.type==='characterData')translateNode(r.target);else if(r.type==='attributes')translateNode(r.target);}});
  observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['aria-label','title','placeholder']});
  [80,300,900].forEach(ms=>setTimeout(()=>{localizeStatic();translateAll();},ms));
  window.__RANDOM_PICKER_I18N_READY__=true;
})();
