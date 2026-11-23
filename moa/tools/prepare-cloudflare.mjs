// Direct Upload package for a separate Cloudflare Pages project, without shared builds.
import {readFile,writeFile,mkdir,copyFile,rm,readdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
const root=fileURLToPath(new URL('../',import.meta.url)),source=resolve(root,'dist'),output=resolve(root,'dist-cloudflare');
if(output!==resolve(root,'dist-cloudflare')||output===source)throw Error('Invalid output directory');
const manifest=JSON.parse(await readFile(resolve(source,'build-manifest.json'),'utf8'));
if(manifest.product!=='moa'||manifest.cloudConfigured!==true||!/^[a-f0-9]{64}$/.test(manifest.sourceSha256))throw Error('A verified cloud-configured Moa build is required');
const files=['index.html','app.js','service.css','build-manifest.json','404.html','robots.txt','_headers'];
await rm(output,{recursive:true,force:true});await mkdir(output);
const sha=b=>createHash('sha256').update(b).digest('hex'),hashes={};
for(const name of files){await copyFile(resolve(source,name),resolve(output,name));hashes[name]=sha(await readFile(resolve(output,name)));}
await writeFile(resolve(output,'healthz.json'),JSON.stringify({status:'ready',product:'moa',revision:manifest.revision,build:manifest.sourceSha256,cloudConfigured:true}));
await writeFile(resolve(output,'_redirects'),'/healthz /healthz.json 200\n');
if((await readdir(output)).length!==9)throw Error('Unexpected public output');
await mkdir(resolve(root,'qa-evidence'),{recursive:true});
await writeFile(resolve(root,'qa-evidence','cloudflare-package.json'),JSON.stringify({preparedAt:new Date().toISOString(),manifest,files:9,hashes,published:false},null,2));
console.log(JSON.stringify({output:'dist-cloudflare',files:9,sourceSha256:manifest.sourceSha256,published:false}));
