// Sites static hosting does not apply _headers. Embed the compiled public assets
// in a minimal Worker so the same explicit headers govern every response.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
const dist=new URL('../dist/',import.meta.url),routes={};
for(const [name,type] of [['index.html','text/html; charset=utf-8'],['app.js','text/javascript; charset=utf-8'],['service.css','text/css; charset=utf-8'],['build-manifest.json','application/json'],['404.html','text/html; charset=utf-8'],['robots.txt','text/plain']])routes['/'+name]={body:await readFile(new URL(name,dist),'utf8'),type};
routes['/']=routes['/index.html'];
const headers=Object.fromEntries((await readFile(new URL('_headers',dist),'utf8')).split('\n').slice(1).filter(s=>s.includes(':')).map(s=>{const i=s.indexOf(':');return [s.slice(0,i).trim(),s.slice(i+1).trim()];}));
const source=`const routes=${JSON.stringify(routes)},baseHeaders=${JSON.stringify(headers)};
export default {async fetch(request){const path=new URL(request.url).pathname;const item=routes[path]||routes['/404.html'];const allowed=request.method==='GET'||request.method==='HEAD';const headers={...baseHeaders,'Content-Type':item.type};if(!allowed)headers.Allow='GET, HEAD';return new Response(request.method==='HEAD'?null:allowed?item.body:'Method not allowed',{status:allowed?(routes[path]?200:404):405,headers});}};\n`;
await mkdir(new URL('server/',dist),{recursive:true});await writeFile(new URL('server/index.js',dist),source);
const manifest=JSON.parse(await readFile(new URL('../.openai/hosting.json',import.meta.url),'utf8'));if(manifest.static)throw Error('Worker hosting manifest must omit static');
await mkdir(new URL('.openai/',dist),{recursive:true});await writeFile(new URL('.openai/hosting.json',dist),JSON.stringify(manifest,null,2));
console.log('Moa response-header Worker built:',Buffer.byteLength(source),'bytes');
