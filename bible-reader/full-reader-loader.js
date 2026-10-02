(() => {
  const parts = location.pathname.split('/').filter(Boolean);
  const onProjectPages = location.hostname === 'gsh4124-cyber.github.io' && parts[0] === 'bible-reader';
  const candidate = onProjectPages ? parts[1] : parts[0];
  const lang = ['en','fr','de','zh','ru','la','pt','ar'].includes(candidate) ? candidate : 'ko';
  const defaults = {ko:'krv1961',en:'kjv',fr:'lsg',de:'luth1912',zh:'cuv',ru:'synodal',la:'vulg',pt:'almeida1819',ar:'svd'};
  const allowed = new Set(['krv1961','kjv','web','asv','lsg','luth1912','cuv','synodal','vulg','almeida1819','svd']);
  const seo = {
    en:{title:'Free Online Bible Reader · KJV and Public-Domain Translations',description:'Read and compare public-domain Bible translations in a clean, comfortable online Bible reader.'},
    fr:{title:'Bible en ligne gratuite · Louis Segond 1910',description:'Lisez et comparez gratuitement Louis Segond 1910 et d’autres traductions bibliques du domaine public.'},
    de:{title:'Kostenlose Online-Bibel · Lutherbibel 1912',description:'Lutherbibel 1912 und weitere gemeinfreie Bibelübersetzungen online lesen und vergleichen.'},
    zh:{title:'在线圣经阅读 · 和合本对照',description:'在线阅读和对照和合本及其他已确认可再分发的圣经译本。'},
    ru:{title:'Библия онлайн · Синодальный перевод',description:'Читайте и сравнивайте Синодальный перевод и другие доступные библейские переводы онлайн.'},
    la:{title:'Biblia Sacra online · Vulgata',description:'Vulgatam et alias Bibliorum editiones publici dominii lege atque compara.'},
    pt:{title:'Bíblia online grátis · Almeida 1819',description:'Leia e compare a Bíblia Almeida 1819 e outras traduções bíblicas em domínio público.'},
    ar:{title:'الكتاب المقدس على الإنترنت · ترجمة فان دايك',description:'اقرأ وقارن ترجمة فان دايك وترجمات الكتاب المقدس المتاحة لإعادة التوزيع.'}
  };
  const failure = {
    ko:['성경 읽기','불러오지 못했습니다.','메인 성경 리더 열기'],
    en:['Bible Reader','Loading failed.','Open the main reader'],
    fr:['Bible en ligne','Échec du chargement.','Ouvrir le lecteur principal'],
    de:['Online-Bibel','Laden fehlgeschlagen.','Hauptleser öffnen'],
    zh:['在线圣经','加载失败。','打开主阅读器'],
    ru:['Библия онлайн','Не удалось загрузить.','Открыть основной ридер'],
    la:['Biblia Sacra','Oneratio defecit.','Lectorem principalem aperi'],
    pt:['Bíblia online','Falha ao carregar.','Abrir o leitor principal'],
    ar:['الكتاب المقدس','تعذر التحميل.','فتح القارئ الرئيسي']
  };
  const base = onProjectPages ? '/bible-reader/' : '/';

  let selected = defaults[lang] || 'krv1961';
  try {
    const saved = localStorage.getItem('bible-reader-translation');
    if (allowed.has(saved)) selected = saved;
    else localStorage.setItem('bible-reader-translation', selected);
  } catch (_) {}

  fetch(`${base}index.html`, {cache:'no-store'})
    .then(r => { if(!r.ok) throw new Error(`HTTP ${r.status}`); return r.text(); })
    .then(html => {
      const canonical = `https://bible-reader-1iz.pages.dev/${lang === 'ko' ? '' : lang + '/'}`;
      const bootstrap = `<script>window.__BIBLE_LANG__=${JSON.stringify(lang)};window.__BIBLE_TRANSLATION__=${JSON.stringify(selected)};</`+`script>`;
      html = html
        .replace(/<html lang="[^"]*"(?: dir="[^"]*")?>/i, `<html lang="${lang}" dir="ltr">`)
        .replace('<head>', `<head><base href="${base}">${bootstrap}`)
        .replace(/<link rel="canonical"[^>]*>/i, `<link rel="canonical" href="${canonical}" />`);
      if (seo[lang]) {
        html = html
          .replace(/<title>[^<]*<\/title>/i, `<title>${seo[lang].title}</title>`)
          .replace(/<meta name="description" content="[^"]*"\s*\/?>/i, `<meta name="description" content="${seo[lang].description}" />`);
      }
      document.open(); document.write(html); document.close();
    })
    .catch(err => {
      console.error(err);
      const [title,message,link] = failure[lang] || failure.en;
      document.documentElement.dir='ltr';
      document.body.innerHTML=`<main style="font-family:system-ui;padding:32px"><h1>${title}</h1><p>${message} <a href="${base}">${link}</a></p></main>`;
    });
})();
