const beaconHost = 'cloudflareinsights.com';
const advertisingHosts = ['googlesyndication.com', 'doubleclick.net', 'adtrafficquality.google'];
const pickerHost = 'random-ppobgi.pages.dev';
const eventsHost = 'afiqaibosavbjzkffggr.supabase.co';
const pickerEvents = new Set(['/api/events', '/api/tool-uses']);
const hostedEvents = new Set([
  '/functions/v1/bible-page-view',
  '/functions/v1/device-checkup-event',
  '/functions/v1/random-picker-event',
]);

export const productionHosts = [
  pickerHost,
  'bible-reader-1iz.pages.dev',
  'pc-checkup.pages.dev',
  'gsh4124-cyber.github.io',
];

export function isAnalyticsRequest({ hostname, pathname }) {
  const path = pathname.replace(/\/+$/, '');
  return path === '/cdn-cgi/rum'
    || hostname === beaconHost || hostname.endsWith(`.${beaconHost}`)
    || advertisingHosts.some(host => hostname === host || hostname.endsWith(`.${host}`))
    || ((hostname === pickerHost || hostname.endsWith(`.${pickerHost}`)) && pickerEvents.has(path))
    || (hostname === eventsHost && hostedEvents.has(path));
}

async function protect(context) {
  await context.route(isAnalyticsRequest, route => route.abort('blockedbyclient'));
}

export async function newQaContext(browser, options = {}) {
  const context = await browser.newContext({ ...options, serviceWorkers: 'block' });
  try {
    await protect(context);
    return context;
  } catch (error) {
    await context.close();
    throw error;
  }
}

export async function newQaPage(browser, options = {}) {
  // Playwright owns this new context and closes it when the page closes.
  const page = await browser.newPage({ ...options, serviceWorkers: 'block' });
  try {
    await protect(page.context());
    return page;
  } catch (error) {
    await page.close();
    throw error;
  }
}
