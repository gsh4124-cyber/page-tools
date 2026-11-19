import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../dist/',import.meta.url));
export async function serve(port=0){const raw=await readFile(resolve(root,'_headers'),'utf8');const headers=Object.fromEntries(raw.split('\n').slice(1).filter(s=>s.includes(':')).map(s=>{const i=s.indexOf(':');return [s.slice(0,i).trim(),s.slice(i+1).trim()];}));const server=createServer(async(req,res)=>{try{const url=new URL(req.url,'http://localhost'),path=decodeURIComponent(url.pathname),target=resolve(root,'.'+(path.endsWith('/')?path+'index.html':path));if(!target.startsWith(resolve(root)+'/')&&!target.startsWith(resolve(root)+'\\'))throw Error();const data=await readFile(target);res.writeHead(200,{...headers,'Content-Type':{'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.json':'application/json','.txt':'text/plain'}[extname(target)]||'application/octet-stream'});res.end(data);}catch{res.writeHead(404,headers);res.end('Not found');}});await new Promise(r=>server.listen(port,'127.0.0.1',r));return server;}
if(process.argv[1]===fileURLToPath(import.meta.url)){const server=await serve(Number(process.env.PORT||4175));console.log('Local: http://127.0.0.1:'+server.address().port);}
