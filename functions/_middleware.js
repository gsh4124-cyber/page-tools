const langs=['ko','en','ja','es','zh','fr','de','pt','id','hi','pl','it','nl','tr','vi','th','ar'];
const foreign=langs.filter(l=>l!=='ko');
const supported=new Set(langs);
const origin='https://random-ppobgi.pages.dev';

const title={
  ko:'랜덤뽑기 | 8가지 뽑기 게임',
  en:'Random Picker | 8 Picker Games & Game Tools',
  ja:'ランダム抽選 | 8種類の抽選ゲームとゲームツール',
  es:'Selector aleatorio | 8 juegos de sorteo y herramientas',
  zh:'随机抽选 | 8种抽选游戏与游戏工具',
  fr:'Sélecteur aléatoire | 8 jeux de tirage et outils',
  de:'Zufallsauswahl | 8 Auswahlspiele & Spielwerkzeuge',
  pt:'Sorteador aleatório | 8 jogos de sorteio e ferramentas',
  id:'Pemilih Acak | 8 Game Undian & Alat Game',
  hi:'रैंडम पिकर | 8 पिकर गेम और गेम टूल',
  pl:'Losowy wybór | 8 gier losujących i narzędzia',
  it:'Selettore casuale | 8 giochi di estrazione e strumenti',
  nl:'Willekeurige kiezer | 8 trekspellen & speltools',
  tr:'Rastgele Seçici | 8 seçim oyunu ve oyun aracı',
  vi:'Bộ chọn ngẫu nhiên | 8 trò chơi chọn & công cụ',
  th:'สุ่มเลือก | 8 เกมสุ่มและเครื่องมือเกม',
  ar:'اختيار عشوائي | 8 ألعاب اختيار وأدوات ألعاب'
};

const desc={
  ko:'번호·이름 뽑기 8종과 주사위, 윷놀이, 동전, 순서 정하기, 팀 나누기를 무료로 이용하세요.',
  en:'Free random picker with Ladder, Wheel, Draw, Pinball, Race, Capsule, Slot, Bomb, plus dice, coin flip, order and team tools.',
  ja:'あみだくじ、ルーレット、くじ引き、ピンボール、レース、カプセル、スロット、爆弾とゲーム用ツールを無料で使えます。',
  es:'Selector aleatorio gratuito con escalera, ruleta, sorteo, pinball, carrera, cápsula, tragamonedas, bomba y herramientas de juego.',
  zh:'免费随机抽选工具：梯子、转盘、抽签、弹珠、竞赛、胶囊、老虎机、炸弹，以及骰子、分组等游戏工具。',
  fr:'Sélecteur aléatoire gratuit avec échelle, roulette, tirage, flipper, course, capsule, machine à sous, bombe et outils de jeu.',
  de:'Kostenlose Zufallsauswahl mit Leiter, Roulette, Los, Flipper, Rennen, Kapsel, Slot, Bombe sowie Würfel- und Teamtools.',
  pt:'Sorteador aleatório grátis com escada, roleta, sorteio, pinball, corrida, cápsula, caça-níquel, bomba e ferramentas de jogo.',
  id:'Pemilih acak gratis dengan tangga, roda, undian, pinball, balapan, kapsul, slot, bom, dadu, pembagi tim, dan alat lainnya.',
  hi:'सीढ़ी, रूलेट, ड्रॉ, पिनबॉल, रेस, कैप्सूल, स्लॉट, बम, पासा और टीम जनरेटर वाला मुफ्त रैंडम पिकर।',
  pl:'Darmowy losowy wybór: drabinka, ruletka, los, pinball, wyścig, kapsuła, slot, bomba oraz kości i podział na zespoły.',
  it:'Selettore casuale gratuito con scala, roulette, estrazione, flipper, gara, capsula, slot, bomba, dadi e divisione squadre.',
  nl:'Gratis willekeurige kiezer met ladder, roulette, loting, pinball, race, capsule, slot, bom, dobbelstenen en teamverdeler.',
  tr:'Merdiven, rulet, kura, pinball, yarış, kapsül, slot, bomba, zar ve takım bölme içeren ücretsiz rastgele seçici.',
  vi:'Bộ chọn ngẫu nhiên miễn phí với thang, vòng quay, bốc thăm, pinball, đua, viên nang, slot, bom, xúc xắc và chia đội.',
  th:'เครื่องมือสุ่มฟรี พร้อมบันได รูเล็ต จับฉลาก พินบอล แข่ง แคปซูล สล็อต ระเบิด ลูกเต๋า และแบ่งทีม',
  ar:'أداة اختيار عشوائي مجانية تضم السلم والروليت والقرعة والبينبول والسباق والكبسولة والسلوت والقنبلة والنرد وتقسيم الفرق.'
};

function hrefFor(lang){return `${origin}/${lang==='ko'?'':lang+'/'}`;}
function alternates(){
  return langs.map(l=>`<link rel="alternate" hreflang="${l}" href="${hrefFor(l)}">`).join('')+
    `<link rel="alternate" hreflang="x-default" href="${origin}/en/">`;
}

function localizedApp(response,lang){
  const canonical=hrefFor(lang);
  const locale=lang==='zh'?'zh_CN':lang==='pt'?'pt_BR':lang==='ar'?'ar_AR':lang;
  const init=`<script>window.__RANDOM_PICKER_LANG__=${JSON.stringify(lang)};<\/script><script src="/locales.js"><\/script>`;
  const runtime='<script src="/i18n-v2.js"><\/script><script src="/language-switch.js"><\/script><script src="/experience.js"><\/script>';
  return new HTMLRewriter()
    .on('html',{element(el){el.setAttribute('lang',lang);if(lang==='ar')el.setAttribute('dir','rtl');else el.removeAttribute('dir');}})
    .on('title',{element(el){el.setInnerContent(title[lang]);}})
    .on('meta[name="description"]',{element(el){el.setAttribute('content',desc[lang]);}})
    .on('link[rel="canonical"]',{element(el){el.setAttribute('href',canonical);}})
    .on('meta[property="og:locale"]',{element(el){el.setAttribute('content',locale);}})
    .on('meta[property="og:title"]',{element(el){el.setAttribute('content',title[lang]);}})
    .on('meta[property="og:description"]',{element(el){el.setAttribute('content',desc[lang]);}})
    .on('meta[property="og:url"]',{element(el){el.setAttribute('content',canonical);}})
    .on('meta[name="twitter:title"]',{element(el){el.setAttribute('content',title[lang]);}})
    .on('meta[name="twitter:description"]',{element(el){el.setAttribute('content',desc[lang]);}})
    .on('head',{element(el){el.append(alternates()+init,{html:true});}})
    .on('body',{element(el){el.append(runtime,{html:true});}})
    .transform(response);
}

export async function onRequest(context) {
  const url=new URL(context.request.url);
  const rootPage=url.pathname==='/';
  const infoPage=/^\/(about|guide|privacy|terms|contact)\/$/.test(url.pathname);
  const languageMatch=url.pathname.match(new RegExp(`^/(${foreign.join('|')})/$`));

  if(languageMatch && (context.request.method==='GET'||context.request.method==='HEAD')){
    const lang=languageMatch[1];
    const assetUrl=new URL('/',url.origin);
    const assetRequest=new Request(assetUrl.toString(),{method:'GET',headers:context.request.headers});
    let response=await context.env.ASSETS.fetch(assetRequest);
    if(!response.headers.get('content-type')?.includes('text/html')) return response;
    response=localizedApp(response,lang);
    if(context.request.method==='HEAD'){
      return new Response(null,{status:response.status,statusText:response.statusText,headers:response.headers});
    }
    return response;
  }

  const response=await context.next();
  if(!response.headers.get('content-type')?.includes('text/html')) return response;

  if(rootPage){
    return new HTMLRewriter()
      .on('head',{element(el){el.append(alternates(),{html:true});}})
      .on('body',{element(el){el.append('<script src="/language-switch.js"><\/script><script src="/experience.js"><\/script>',{html:true});}})
      .transform(response);
  }

  if(!infoPage)return response;
  let lang=url.searchParams.get('lang')||'ko';
  if(!supported.has(lang))lang='ko';
  if(lang==='ko')return response;
  const init=`<script>window.__RANDOM_PICKER_LANG__=${JSON.stringify(lang)};<\/script><script src="/info-i18n.js"><\/script>`;
  return new HTMLRewriter()
    .on('html',{element(el){el.setAttribute('lang',lang);if(lang==='ar')el.setAttribute('dir','rtl');}})
    .on('body',{element(el){el.append(init,{html:true});}})
    .transform(response);
}