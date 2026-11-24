import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
test('v7 attachment is byte-identical; derived shell retains original feature sections without inline executable handlers',async()=>{
 const bytes=await readFile(new URL('../reference/moa_diary_v7.html',import.meta.url));
 assert.equal(bytes.length,33644);assert.equal(createHash('sha256').update(bytes).digest('hex'),'2543b60bee56acdaa30f23462a5f9a003f4881771dfdc7f1eb826bfb1f42c5db');
 const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
 for(const id of ['homeSection','habitsSection','calendarSection','writeSection','feedSection','monthInsights','sticker'])assert.ok(html.includes(`id="${id}"`));
 assert.ok(!/\son(?:click|change)=/.test(html));assert.ok(!html.includes('공개 후보'));
});
