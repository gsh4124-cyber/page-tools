// Restore a separately saved encrypted file into an explicitly empty QA account.
// No operator/admin key, scheduling, or external backup provider is created.
import {createInterface} from 'node:readline';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createClient} from '@supabase/supabase-js';
import {decodeBackup} from '../core.mjs';
import {CloudRepository} from '../repository.mjs';
if(process.stdin.isTTY)process.stdin.setRawMode(true);console.log('READY_FOR_RECOVERY_CONFIG');
const input=createInterface({input:process.stdin,terminal:false}),cfg=await new Promise(r=>input.once('line',s=>{input.close();process.stdin.pause();r(JSON.parse(s));}));if(process.stdin.isTTY)process.stdin.setRawMode(false);
const raw=await readFile(cfg.backupPath,'utf8'),incoming=await decodeBackup(raw,cfg.backupPassword),sha=b=>createHash('sha256').update(b).digest('hex');
const report={checkedAt:new Date().toISOString(),mode:cfg.restore?'restore':'verify-file',backupSha256:sha(raw),entries:incoming.db.entries.length,files:incoming.files.size,mediaBytes:[...incoming.files.values()].reduce((n,f)=>n+f.size,0),status:'DONE'};
if(cfg.restore){
 if(cfg.confirmEmptyTarget!==true)throw Error('An explicitly empty QA target is required');
 const c=createClient(cfg.url,cfg.key,{auth:{persistSession:false,autoRefreshToken:false}});const signed=await c.auth.signInWithPassword({email:cfg.email,password:cfg.password});if(signed.error)throw Error(signed.error.code||'LOGIN_FAILED');if(signed.data.user.id!==cfg.expectedUserId)throw Error('Unexpected recovery target');
 const repo=new CloudRepository(c,signed.data.user),before=await repo.load(),usage=await repo.usage();if(repo.status!=='active'||before.entries.length||before.habits.length||Object.keys(before.checks).length||usage.reserved)throw Error('Recovery target is not empty');
 const map=new Map();for(const [key,file] of incoming.files)map.set(key,await repo.put(file));const hashes=new Map();for(const [key,file] of incoming.files)hashes.set(map.get(key),sha(Buffer.from(await file.arrayBuffer())));for(const e of incoming.db.entries)e.mediaKeys=e.mediaKeys.map(k=>map.get(k));await repo.commit(incoming.db);const restored=await repo.load();if(JSON.stringify(restored)!==JSON.stringify(incoming.db))throw Error('Restored document mismatch');for(const [key,hash] of hashes)if(sha(Buffer.from(await (await repo.get(key)).arrayBuffer()))!==hash)throw Error('Restored media mismatch');await c.auth.signOut({scope:'local'});report.verifiedHashes=hashes.size;
}
await mkdir(new URL('../qa-evidence/',import.meta.url),{recursive:true});await writeFile(new URL('../qa-evidence/recovery-drill.json',import.meta.url),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
