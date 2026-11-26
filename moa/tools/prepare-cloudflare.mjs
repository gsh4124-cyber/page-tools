// All application assets are embedded in a fail-closed Pages Worker. Static
// fallback contains only a setup notice, so a failed/disabled function cannot
// accidentally publish the diary application or its files.
import {readFile,writeFile,mkdir,rm,readdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';
const root=fileURLToPath(new URL('../',import.meta.url)),source=resolve(root,'dist'),output=resolve(root,'dist-cloudflare');
if(output!==resolve(root,'dist-cloudflare')||output===source)throw Error('Invalid output directory');
const manifest=JSON.parse(await readFile(resolve(source,'build-manifest.json'),'utf8'));
const config={url:process.env.MOA_SUPABASE_URL||'',key:process.env.MOA_SUPABASE_PUBLISHABLE_KEY||''};
if(manifest.product!=='moa'||manifest.cloudConfigured!==true||!/^[a-f0-9]{64}$/.test(manifest.sourceSha256)||config.url!=='https://afiqaibosavbjzkffggr.supabase.co'||!config.key)throw Error('A verified cloud-configured Moa build and matching public configuration are required');
const sha=b=>createHash('sha256').update(b).digest('hex'),routes={},hashes={};
for(const [name,type] of [['index.html','text/html; charset=utf-8'],['app.js','text/javascript; charset=utf-8'],['service.css','text/css; charset=utf-8'],['build-manifest.json','application/json'],['404.html','text/html; charset=utf-8'],['robots.txt','text/plain']]){
 const bytes=await readFile(resolve(source,name));hashes[name]=sha(bytes);routes['/'+name]={body:bytes.toString('utf8'),type};
}
routes['/index.html'].body=routes['/index.html'].body.replace('</head>','<script type="module" src="/__moa_session_sync.js"></script></head>');routes['/']=routes['/index.html'];
routes['/healthz']={body:JSON.stringify({status:'ready',product:'moa',revision:manifest.revision,build:manifest.sourceSha256,cloudConfigured:true,access:'owner-only'}),type:'application/json'};
const demoMedia=JSON.parse(await readFile(resolve(root,'ui/demo-media.json'),'utf8'));
let introduction=await readFile(resolve(root,'ui/owner-access.html'),'utf8');
for(const name of ['notebook','surf']){
 if(!/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(demoMedia[name]))throw Error('Invalid embedded demo photo');
 introduction=introduction.replaceAll(`__MOA_SAMPLE_${name.toUpperCase()}__`,demoMedia[name]);
}
routes['/__moa_access']={body:introduction,type:'text/html; charset=utf-8'};
routes['/__moa_auth_callback']=routes['/__moa_access'];
routes['/about/']=routes['/__moa_access'];
routes['/__moa_public_metrics.js']={body:await readFile(resolve(root,'tools/public-metrics.js'),'utf8'),type:'text/javascript; charset=utf-8'};
routes['/robots.txt']={body:'User-agent: *\nDisallow: /\nAllow: /about/\nAllow: /sitemap.xml$\nAllow: /__moa_access.js\nAllow: /__moa_public_metrics.js\nSitemap: https://moa-diary-web.pages.dev/about/sitemap.xml\n',type:'text/plain; charset=utf-8'};
routes['/sitemap.xml']={body:'<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://moa-diary-web.pages.dev/about/</loc></url></urlset>',type:'application/xml; charset=utf-8'};
routes['/about/sitemap.xml']=routes['/sitemap.xml'];
for(const [name,path] of [['owner-access-client.mjs','/__moa_access.js'],['owner-session-client.mjs','/__moa_session_sync.js']]){
 const result=await build({entryPoints:[resolve(root,'tools',name)],bundle:true,write:false,format:'esm',minify:true,target:['safari15','chrome100'],define:{__MOA_GATE_CONFIG__:JSON.stringify(config)}});routes[path]={body:result.outputFiles[0].text,type:'text/javascript; charset=utf-8'};
}
const headers=Object.fromEntries((await readFile(resolve(source,'_headers'),'utf8')).split('\n').slice(1).filter(s=>s.includes(':')).map(s=>{const i=s.indexOf(':');return [s.slice(0,i).trim(),s.slice(i+1).trim()];}));
await rm(output,{recursive:true,force:true});await mkdir(output);
await build({stdin:{contents:`import {ownerGateway} from './tools/owner-gateway.mjs';const routes=${JSON.stringify(routes)},headers=${JSON.stringify(headers)};export default {fetch(request,env){return ownerGateway(request,env,routes,headers)}};`,resolveDir:root,sourcefile:'moa-owner-worker.mjs'},outfile:resolve(output,'_worker.js'),bundle:true,format:'esm',minify:true,target:'es2022'});
await writeFile(resolve(output,'_routes.json'),JSON.stringify({version:1,include:['/*'],exclude:[]}));
await writeFile(resolve(output,'index.html'),'<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="robots" content="noindex,nofollow"><title>모아 · 비공개</title><p>비공개 사이트 연결을 확인하고 있어요. 잠시 후 다시 방문해 주세요.</p></html>');
if((await readdir(output)).length!==3)throw Error('Unexpected deployment output');
await mkdir(resolve(root,'qa-evidence'),{recursive:true});
const workerSha256=sha(await readFile(resolve(output,'_worker.js')));
await writeFile(resolve(root,'qa-evidence','cloudflare-package.json'),JSON.stringify({preparedAt:new Date().toISOString(),manifest,files:3,hashes,workerSha256,access:'owner-only',staticFallback:'setup notice only',published:false},null,2));
console.log(JSON.stringify({output:'dist-cloudflare',files:3,sourceSha256:manifest.sourceSha256,workerSha256,published:false}));
