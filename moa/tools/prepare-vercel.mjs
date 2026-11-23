// Prepare only the public compiled frontend for a separate Vercel project.
// Project ownership, billing and Vercel Authentication must be verified before deployment.
import {readFile,writeFile,mkdir,copyFile,rm} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url));
const source=resolve(root,'dist'),output=resolve(root,'dist-vercel');
if(output!==resolve(root,'dist-vercel')||output===source)throw Error('Invalid output directory');
const manifest=JSON.parse(await readFile(resolve(source,'build-manifest.json'),'utf8'));
if(manifest.product!=='moa'||manifest.cloudConfigured!==true||!/^[a-f0-9]{64}$/.test(manifest.sourceSha256))throw Error('A verified cloud-configured Moa build is required');
const config=JSON.parse(await readFile(resolve(root,'vercel.json'),'utf8'));
const intended=Object.fromEntries((await readFile(resolve(source,'_headers'),'utf8')).split('\n').slice(1).filter(s=>s.includes(':')).map(s=>{const i=s.indexOf(':');return [s.slice(0,i).trim().toLowerCase(),s.slice(i+1).trim()];}));
const actual=Object.fromEntries(config.headers.find(r=>r.source==='/(.*)').headers.map(h=>[h.key.toLowerCase(),h.value]));
for(const [key,value] of Object.entries(intended))if(actual[key]!==value)throw Error('Vercel security header mismatch: '+key);
await rm(output,{recursive:true,force:true});await mkdir(output);
const files=['index.html','app.js','service.css','build-manifest.json','404.html','robots.txt'];
for(const file of files)await copyFile(resolve(source,file),resolve(output,file));
await writeFile(resolve(output,'healthz.json'),JSON.stringify({status:'ready',product:'moa',revision:manifest.revision,build:manifest.sourceSha256,cloudConfigured:true}));
console.log(JSON.stringify({output:'dist-vercel',files:files.length+1,revision:manifest.revision,sourceSha256:manifest.sourceSha256,securityHeadersMatch:true,published:false}));
