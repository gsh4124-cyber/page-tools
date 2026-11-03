// These are public ownership files, not account credentials.
import { mkdir, writeFile } from 'node:fs/promises';
const sites = {
  'random-ppobgi': { host: 'random-ppobgi.pages.dev', key: '5e2e0b34361f1bec6589eecf94582b9f', count: 22 },
  'bible-reader': { host: 'bible-reader-1iz.pages.dev', key: '193977ee04feba4a99f471a555a2aa54', count: 9 },
  'pc-checkup': { host: 'pc-checkup.pages.dev', key: 'b3399cb87eb74ba9bb8315bfbeda117f', count: 117 },
};
const projects = (process.env.PROJECTS || '').split(/\s+/).filter(Boolean);
if (!projects.length || projects.some(name => !sites[name])) throw new Error('Known PROJECTS required');
const revision = process.env.GITHUB_SHA;
if (!/^[0-9a-f]{40}$/.test(revision || '')) throw new Error('Full GITHUB_SHA required');
async function getText(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(25000), headers: { 'Cache-Control': 'no-cache' } });
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  return response.text();
}
const reports = [];
for (const project of projects) {
  const { host, key, count } = sites[project];
  const origin = `https://${host}`;
  const marker = (await getText(`${origin}/build-revision.txt?indexnow=${revision}`)).trim();
  if (marker !== revision) throw new Error(`${project}: production revision changed before URL notification`);
  const keyLocation = `${origin}/${key}.txt`;
  if ((await getText(keyLocation)).trim() !== key) throw new Error(`${project}: ownership file mismatch`);
  const sitemap = await getText(`${origin}/sitemap.xml`);
  const urlList = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1].replace(/&amp;/g, '&'));
  if (urlList.length !== count || new Set(urlList).size !== count || urlList.some(url => {
    const parsed = new URL(url);
    return parsed.origin !== origin || parsed.username || parsed.password || parsed.hash;
  })) throw new Error(`${project}: unexpected sitemap URL list`);
  const response = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST', headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host, key, keyLocation, urlList }), signal: AbortSignal.timeout(30000),
  });
  const report = { project, source_revision: revision, endpoint: 'https://api.indexnow.org/indexnow',
    checked_at: new Date().toISOString(), status: response.status, url_count: urlList.length,
    state: response.status === 200 ? 'RECEIVED' : response.status === 202 ? 'RECEIVED_KEY_VALIDATION_PENDING' : 'FAILED',
    indexing_confirmed: false };
  reports.push(report);
  console.log(JSON.stringify(report));
  await mkdir('qa_evidence/search-discovery', { recursive: true });
  await writeFile('qa_evidence/search-discovery/indexnow.json', JSON.stringify(reports, null, 2) + '\n');
  if (![200, 202].includes(response.status)) throw new Error(`${project}: IndexNow HTTP ${response.status}: ${(await response.text()).slice(0, 300)}`);
}
