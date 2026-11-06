import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const origins = {
  'random-ppobgi': 'https://random-ppobgi.pages.dev',
  'bible-reader': 'https://bible-reader-1iz.pages.dev',
  'pc-checkup': 'https://pc-checkup.pages.dev',
};
const assets = {
  // Pages Functions intentionally rewrite Random Picker HTML at request time.
  'random-ppobgi': ['full-app-loader.js', 'experience.js', 'i18n-v2.js'],
  'bible-reader': ['index.html', 'reader-experience.js', 'topbar-polish.css'],
  'pc-checkup': ['device-experience.js', 'app.js', 'mobile.js'],
};
const projects = (process.env.PROJECTS || '').split(/\s+/).filter(Boolean);
if (!projects.length || projects.some(p => !origins[p])) throw new Error('Known PROJECTS required');
const revision = process.env.GITHUB_SHA;
if (!/^[0-9a-f]{40}$/.test(revision || '')) throw new Error('Full GITHUB_SHA required');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
async function fetchBytes(project, path) {
  const response = await fetch(`${origins[project]}/${path}?verify=${revision}`, {
    headers: { 'Cache-Control': 'no-cache' }, signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) throw new Error(`${project}/${path}: HTTP ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
}
async function verify(project) {
  const marker = (await fetchBytes(project, 'build-revision.txt')).toString().trim();
  if (marker !== revision) throw new Error(`${project}: revision ${marker.slice(0, 40)} != ${revision}`);
  const manifest = JSON.parse((await fetchBytes(project, 'build-manifest.json')).toString());
  if (manifest.product !== project || manifest.source_revision !== revision) throw new Error(`${project}: manifest identity mismatch`);
  const expected = JSON.parse(await readFile(`${project}/dist/build-manifest.json`, 'utf8'));
  const entries = files => JSON.stringify(Object.entries(files || {}).sort(([a], [b]) => a.localeCompare(b)));
  if (expected.source_revision !== revision || entries(expected.files) !== entries(manifest.files)) {
    throw new Error(`${project}: production artifact manifest differs from CI build`);
  }
  for (const asset of assets[project]) {
    const live = await fetchBytes(project, asset);
    const source = await readFile(`${project}/dist/${asset}`);
    if (hash(live) !== hash(source) || manifest.files?.[asset] !== hash(live)) {
      throw new Error(`${project}/${asset}: served bytes differ from source/manifest`);
    }
  }
  // A missing route must not silently return the home page (Pages SPA fallback).
  // Check both document and nested asset misses; neither may request ads.
  for (const path of ['__not-found-check__/page', 'en/__not-found-check__/missing.js']) {
    const response = await fetch(`${origins[project]}/${path}`, {
      headers: { 'Cache-Control': 'no-cache' }, signal: AbortSignal.timeout(20000),
    });
    const body = Buffer.from(await response.arrayBuffer());
    if (response.status !== 404 || hash(body) !== manifest.files?.['404.html'] ||
        !body.toString().includes('id="not-found-page"') || body.toString().includes('adsbygoogle')) {
      throw new Error(`${project}/${path}: expected exact, ad-free HTTP 404 page; got ${response.status}`);
    }
  }
  console.log(`Verified ${project}: production revision ${revision}, manifest and runtime bytes`);
}
const pending = new Set(projects);
const attempts = Number(process.env.DEPLOY_WAIT_ATTEMPTS || 60);
for (let attempt = 1; attempt <= attempts && pending.size; attempt++) {
  await Promise.all([...pending].map(async project => {
    try { await verify(project); pending.delete(project); }
    catch (error) { console.log(`Waiting (${attempt}/${attempts}): ${error.message}`); }
  }));
  if (pending.size && attempt < attempts) await new Promise(resolve => setTimeout(resolve, 10000));
}
if (pending.size) throw new Error(`Production deployment not verified: ${[...pending].join(', ')}`);
