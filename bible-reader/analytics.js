(() => {
  const PROD_ORIGIN = 'https://bible-reader-1iz.pages.dev';
  const PROD_PATH = '/';
  const ENDPOINT = 'https://afiqaibosavbjzkffggr.supabase.co/functions/v1/bible-page-view';
  const AUTOMATION_UA = /HeadlessChrome|Playwright/i;

  if (location.origin !== PROD_ORIGIN || !location.pathname.startsWith(PROD_PATH)) return;
  if (new URLSearchParams(location.search).get('qa') === '1') return;
  if (navigator.webdriver === true || AUTOMATION_UA.test(navigator.userAgent || '')) return;

  fetch(ENDPOINT, {
    method: 'POST',
    cache: 'no-store',
    credentials: 'omit',
    keepalive: true,
  }).catch(() => {
    // Analytics must never interrupt Bible reading.
  });
})();
