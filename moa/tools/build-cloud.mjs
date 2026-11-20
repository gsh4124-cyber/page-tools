// Public configuration only; never place credentials in shell arguments or .env.
import {createInterface} from 'node:readline';
if(process.stdin.isTTY)process.stdin.setRawMode(true);
console.log('READY_FOR_PUBLIC_CONFIG');
const input=createInterface({input:process.stdin,terminal:false});
const cfg=await new Promise(resolve=>input.once('line',line=>{input.close();process.stdin.pause();resolve(JSON.parse(line));}));
if(process.stdin.isTTY)process.stdin.setRawMode(false);
if(!cfg.url||!cfg.key)throw Error('Both public configuration values required');
process.env.MOA_SUPABASE_URL=cfg.url;
process.env.MOA_SUPABASE_PUBLISHABLE_KEY=cfg.key;
await import('./build.mjs');
