// One-shot operator check. No schedule or monitoring subscription is created.
import {createInterface} from 'node:readline';
if(process.stdin.isTTY)process.stdin.setRawMode(true);console.log('READY_FOR_HEALTH_CONFIG');
const input=createInterface({input:process.stdin,terminal:false}),cfg=await new Promise(r=>input.once('line',s=>{input.close();process.stdin.pause();r(JSON.parse(s));}));if(process.stdin.isTTY)process.stdin.setRawMode(false);
if(!/^https:\/\/[a-z0-9]+\.supabase\.co$/.test(cfg.url))throw Error('Approved project origin required');
const results=[];
for(const [name,url,headers] of [['auth',cfg.url+'/auth/v1/health',{apikey:cfg.key}],['database',cfg.url+'/rest/v1/rpc/moa_health',{apikey:cfg.key,Authorization:'Bearer '+cfg.key}]]){try{const r=await fetch(url,{headers,cache:'no-store',signal:AbortSignal.timeout(10000)}),data=await r.json();results.push({name,status:r.ok&&(name!=='database'||data.ready)?'DONE':'PARTIAL',http:r.status});}catch{results.push({name,status:'BLOCKED'});}}
console.log(JSON.stringify({checkedAt:new Date().toISOString(),results}));if(results.some(r=>r.status!=='DONE'))process.exitCode=1;
