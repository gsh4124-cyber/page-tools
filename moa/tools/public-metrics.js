// Anonymous page and performance counts; never read form fields or storage.
(() => {
  'use strict';
  const url = new URL(location.href);
  if (url.hostname !== "moa-diary-web.pages.dev" || navigator.webdriver || /Headless|Playwright/i.test(navigator.userAgent)
      || url.searchParams.has('qa') || url.searchParams.has('code') || url.searchParams.has('access_token')
      || /(?:access_token|refresh_token|type=recovery)=/i.test(url.hash) || !["/about/", "/__moa_access"].includes(url.pathname)
      || document.querySelector('script[data-cf-beacon]')) return;
  const script = document.createElement('script');
  script.type = 'module';
  script.src = 'https://static.cloudflareinsights.com/beacon.min.js';
  script.dataset.cfBeacon = JSON.stringify({token: "507fd1502f634cc79b980692fbff32b2", spa: false});
  document.head.append(script);
})();
