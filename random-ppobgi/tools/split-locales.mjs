// Build step: write one small catalog per language so a localized page loads only
// its own strings instead of all 16 languages from locales.js.
// Usage: node tools/split-locales.mjs <dist dir>
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const dist = process.argv[2];
if (!dist) throw new Error('usage: split-locales.mjs <dist dir>');
const context = {window: {}};
vm.runInNewContext(fs.readFileSync('locales.js', 'utf8'), context);
const catalog = context.window.RandomPickerLocales;
const langs = Object.keys(catalog || {});
if (langs.length !== 16) throw new Error(`expected 16 locales, found ${langs.length}`);
fs.mkdirSync(path.join(dist, 'locales'), {recursive: true});
for (const lang of langs) {
  const pack = JSON.stringify(catalog[lang]);
  if (JSON.stringify(JSON.parse(pack)) !== pack) throw new Error(`${lang}: catalog is not plain data`);
  const body = `(()=>{const L=window.RandomPickerLocales||(window.RandomPickerLocales={});L[${JSON.stringify(lang)}]=${pack};})();\n`;
  fs.writeFileSync(path.join(dist, 'locales', `${lang}.js`), body);
}
console.log(`Split locales.js into ${langs.length} per-language catalogs`);
