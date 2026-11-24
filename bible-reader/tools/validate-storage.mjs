import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const source=fs.readFileSync('app.js','utf8').split('const BOOKS = [')[0];
for(const blocked of [true,false]){
 const disk=new Map([['existing','old']]);
 const context={window:{},document:{body:null},localStorage:{getItem(key){if(blocked)throw Error('SecurityError');return disk.get(key)||null;},setItem(){throw Error('QuotaExceededError');},removeItem(){throw Error('SecurityError');}}};
 vm.runInNewContext(source,context);const store=context.window.BibleStorage;
 assert.equal(store.getItem('existing'),blocked?null:'old');store.setItem('existing','new');assert.equal(store.getItem('existing'),'new');store.removeItem('existing');assert.equal(store.getItem('existing'),null);
 store.setItem('bible-reader-location','{"bookIndex":0,"chapter":2}');assert.equal(JSON.parse(store.getItem('bible-reader-location')).chapter,2);
}
console.log('Bible storage PASS: blocked access, quota failure, in-visit state, removal and existing disk values.');
