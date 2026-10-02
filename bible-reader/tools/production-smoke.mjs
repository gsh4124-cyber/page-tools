import { chromium } from 'playwright';

const base = 'https://bible-reader-1iz.pages.dev';
const browser = await chromium.launch({ headless: true });
const problems = [];
function assert(ok, message) { if (!ok) problems.push(message); }

async function open(path, viewport={ width: 390, height: 844 }) {
  const page = await browser.newPage({ viewport });
  const pageErrors = [];
  page.on('pageerror', e => pageErrors.push(String(e)));
  await page.goto(`${base}${path}`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.locator('#translationSelect').waitFor({ state: 'visible', timeout: 15000 });
  await page.locator('#bookSelect').waitFor({ state: 'attached', timeout: 15000 });
  await page.locator('#chapterTitle').waitFor({ state: 'visible', timeout: 15000 });
  return { page, pageErrors };
}

async function assertCompactTopbar(page, label) {
  const translation = await page.locator('#translationSelect').boundingBox();
  const language = await page.locator('#languageSelect').boundingBox();
  const search = await page.locator('#searchForm').boundingBox();
  assert(Boolean(translation && language && search), `${label}: compact topbar controls missing`);
  if (translation && language && search) {
    const ys = [translation.y, language.y, search.y];
    assert(Math.max(...ys)-Math.min(...ys) < 3, `${label}: translation/language/search must stay on one row`);
    assert(translation.x + translation.width <= language.x + 2, `${label}: translation overlaps language`);
    assert(language.x + language.width <= search.x + 2, `${label}: language overlaps search`);
  }
}

async function assertTitleNavigator(page, label) {
  await page.locator('#chapterTitle').click();
  const dialog = page.locator('.title-navigator');
  const bookStep = page.locator('[data-step="book"]');
  const chapterStep = page.locator('[data-step="chapter"]');
  const verseStep = page.locator('[data-step="verse"]');
  await dialog.waitFor({ state: 'visible', timeout: 5000 });

  const oldButton = page.locator('.title-navigator-testament-switch [data-switch="old"]');
  const newButton = page.locator('.title-navigator-testament-switch [data-switch="new"]');
  assert(await oldButton.count() === 1, `${label}: Old Testament switch missing`);
  assert(await newButton.count() === 1, `${label}: New Testament switch missing`);
  assert(await page.locator('.title-navigator-testament').count() === 0, `${label}: retired dual-column testament layout is still deployed`);
  assert(await bookStep.isVisible(), `${label}: book step must open first`);
  assert(await chapterStep.isHidden(), `${label}: chapter step must stay hidden before a book is chosen`);
  assert(await verseStep.isHidden(), `${label}: verse step must stay hidden before a chapter is chosen`);

  await oldButton.click();
  const oldCount = await page.locator('.title-navigator-books .title-navigator-choice').count();
  assert(oldCount === 39, `${label}: Old Testament book list is invalid (${oldCount})`);
  await newButton.click();
  const newCount = await page.locator('.title-navigator-books .title-navigator-choice').count();
  assert(newCount === 27, `${label}: New Testament book list is invalid (${newCount})`);

  await oldButton.click();
  await page.locator('.title-navigator-books .title-navigator-choice').first().click();
  await page.locator('.title-navigator-chapters .title-navigator-choice').first().waitFor({ state: 'visible', timeout: 15000 });
  assert(await bookStep.isHidden(), `${label}: book step must hide after book selection`);
  assert(await chapterStep.isVisible(), `${label}: chapter step must appear after book selection`);
  assert(await verseStep.isHidden(), `${label}: verse step must stay hidden until chapter selection`);
  assert(await page.locator('.title-navigator-back').isVisible(), `${label}: back button must be available after book selection`);

  await page.locator('.title-navigator-back').click();
  assert(await bookStep.isVisible(), `${label}: back from chapter must return to book step`);
  assert(await chapterStep.isHidden(), `${label}: chapter step must hide after returning to books`);

  await page.locator('.title-navigator-books .title-navigator-choice[aria-pressed="true"]').click();
  await page.locator('.title-navigator-chapters .title-navigator-choice').first().waitFor({ state: 'visible', timeout: 5000 });
  const chapterTwo = page.locator('.title-navigator-chapters').getByRole('button',{name:'2',exact:true});
  await chapterTwo.click();
  await page.locator('.title-navigator-verses .title-navigator-choice').first().waitFor({ state: 'visible', timeout: 5000 });
  assert(await chapterStep.isHidden(), `${label}: chapter step must hide after chapter selection`);
  assert(await verseStep.isVisible(), `${label}: verse step must appear after chapter selection`);

  const verseThree = page.locator('.title-navigator-verses').getByRole('button',{name:'3',exact:true});
  await verseThree.click();
  await dialog.waitFor({ state: 'hidden', timeout: 5000 });
  await page.locator('.verse[data-verse="3"].verse-picked').waitFor({ state: 'visible', timeout: 5000 });
  assert((await page.locator('#bookSelect').inputValue()) === '0', `${label}: selected book did not apply`);
  assert((await page.locator('#chapterSelect').inputValue()) === '2', `${label}: selected chapter did not apply`);
  assert((await page.locator('#verseSelect').inputValue()) === '3', `${label}: selected verse did not apply`);
}

async function assertMultiVerseSelection(page, label) {
  const first = page.locator('#verses .verse[data-verse="3"]');
  const second = page.locator('#verses .verse[data-verse="4"]');
  await first.click();
  await second.click();
  const bar = page.locator('.verse-multi-actionbar');
  await bar.waitFor({ state:'visible', timeout:5000 });
  assert(await first.evaluate(el=>el.classList.contains('multi-selected')), `${label}: first tapped verse was not selected`);
  assert(await second.evaluate(el=>el.classList.contains('multi-selected')), `${label}: second tapped verse was not selected`);
  assert((await page.locator('.verse-multi-count').innerText()).includes('2'), `${label}: selection count did not become 2`);

  const formatted = await page.evaluate(() => window.BibleClipboard?.buildCopyTextForElements?.([...document.querySelectorAll('#verses .verse.multi-selected')]) || '');
  assert(formatted.includes('3') && formatted.includes('4'), `${label}: multi-verse copy formatter omitted selected verses`);
  await page.locator('.verse-multi-copy').click();

  await page.locator('.verse-multi-note').click();
  const editor = page.locator('.selection-note-editor');
  await editor.waitFor({state:'visible',timeout:5000});
  await editor.locator('textarea').fill('QA multi-verse note');
  await editor.locator('.selection-note-save').click();
  await editor.waitFor({state:'hidden',timeout:5000});
  assert(await bar.isVisible(), `${label}: selection should remain after saving a note`);

  await page.locator('.verse-multi-highlight').click();
  assert(await first.evaluate(el=>el.classList.contains('user-highlight')), `${label}: multi-highlight did not apply to first verse`);
  assert(await second.evaluate(el=>el.classList.contains('user-highlight')), `${label}: multi-highlight did not apply to second verse`);
  assert(await bar.isVisible(), `${label}: selection should remain after highlight action`);

  await page.locator('.notebook-button').click();
  const panel = page.locator('.notebook-panel');
  await panel.waitFor({state:'visible',timeout:5000});
  const selectionTab = panel.locator('[data-tab="selections"]');
  await selectionTab.waitFor({state:'visible',timeout:5000});
  await selectionTab.click();
  const item = panel.locator('.selection-note-item').first();
  await item.waitFor({state:'visible',timeout:5000});
  assert((await item.locator('.record-note-text').innerText()).includes('QA multi-verse note'), `${label}: saved selection note did not appear in records`);
  await panel.locator('.notebook-close').click();

  await page.locator('.verse-multi-done').click();
  await bar.waitFor({state:'hidden',timeout:5000});
  assert(!(await first.evaluate(el=>el.classList.contains('multi-selected'))), `${label}: Done did not clear first selection`);
  assert(!(await second.evaluate(el=>el.classList.contains('multi-selected'))), `${label}: Done did not clear second selection`);
}

{
  const { page, pageErrors } = await open('/');
  const initialPlaceholder = await page.locator('#searchInput').getAttribute('placeholder');
  assert((await page.locator('html').getAttribute('lang')) === 'ko', 'root: html lang must remain ko');
  await assertCompactTopbar(page, 'root mobile');
  await assertTitleNavigator(page, 'root');
  await assertMultiVerseSelection(page, 'root multi-select');
  await page.locator('#translationSelect').selectOption('kjv');
  await page.waitForTimeout(800);
  assert((await page.locator('#translationSelect').inputValue()) === 'kjv', 'root: KJV selection failed');
  assert((await page.locator('html').getAttribute('lang')) === 'ko', 'root: translation switch changed UI language');
  assert((await page.locator('#searchInput').getAttribute('placeholder')) === initialPlaceholder, 'root: translation switch changed Korean UI placeholder');
  const title = (await page.locator('#chapterTitle').innerText()).trim();
  assert(/[A-Za-z]/.test(title), `root: KJV should control chapter heading language, got ${title}`);
  assert(pageErrors.length === 0, `root: page errors: ${pageErrors.join(' | ')}`);
  await page.close();
}

{
  const { page, pageErrors } = await open('/', { width: 720, height: 900 });
  await assertCompactTopbar(page, 'root narrow tablet');
  assert(pageErrors.length === 0, `root narrow tablet: page errors: ${pageErrors.join(' | ')}`);
  await page.close();
}

{
  const { page, pageErrors } = await open('/en/');
  const initialPlaceholder = await page.locator('#searchInput').getAttribute('placeholder');
  assert((await page.locator('html').getAttribute('lang')) === 'en', 'en: html lang must be en');
  await page.locator('#translationSelect').selectOption('cuv');
  await page.waitForTimeout(800);
  assert((await page.locator('#translationSelect').inputValue()) === 'cuv', 'en: CUV selection failed');
  assert((await page.locator('html').getAttribute('lang')) === 'en', 'en: translation switch changed UI language');
  assert((await page.locator('#searchInput').getAttribute('placeholder')) === initialPlaceholder, 'en: translation switch changed English UI placeholder');
  const title = (await page.locator('#chapterTitle').innerText()).trim();
  assert(/[\u3400-\u9fff]/.test(title), `en: CUV should control chapter heading language, got ${title}`);
  assert(pageErrors.length === 0, `en: page errors: ${pageErrors.join(' | ')}`);
  await page.close();
}

{
  const { page, pageErrors } = await open('/ar/');
  assert((await page.locator('html').getAttribute('lang')) === 'ar', 'ar: html lang must be ar');
  assert((await page.locator('html').getAttribute('dir')) === 'ltr', 'ar: UI shell direction must stay ltr');
  assert((await page.locator('#translationSelect').inputValue()) === 'svd', 'ar: default Arabic Bible version must be SVD');
  const title = (await page.locator('#chapterTitle').innerText()).trim();
  assert(/[\u0600-\u06ff]/.test(title), `ar: SVD should control Scripture heading language, got ${title}`);
  assert(pageErrors.length === 0, `ar: page errors: ${pageErrors.join(' | ')}`);
  await page.close();
}

await browser.close();
if (problems.length) {
  console.error(problems.join('\n'));
  process.exit(1);
}
console.log('Cloudflare production browser QA passed: compact topbar stayed one row, title navigation followed book -> chapter -> verse, multi-verse selection supported copy/note/highlight actions, and multilingual Scripture/UI separation remained intact.');