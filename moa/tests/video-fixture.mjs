// Valid synthetic VP8 fixture. Flush MediaRecorder before stopping capture tracks.
// Immediate track.stop() after recorder.stop() can truncate the WebM container.
export async function syntheticWebm(page){
 return Buffer.from(await page.evaluate(async()=>{
  const canvas=document.createElement('canvas');canvas.width=160;canvas.height=120;
  const g=canvas.getContext('2d');g.fillStyle='#355b4a';g.fillRect(0,0,160,120);const stream=canvas.captureStream(0),track=stream.getVideoTracks()[0];
  const recorder=new MediaRecorder(stream,{mimeType:'video/webm;codecs=vp8'}),chunks=[];
  recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
  const started=new Promise((resolve,reject)=>{const timeout=setTimeout(()=>reject(Error('Synthetic recorder start timeout')),10000);recorder.onstart=()=>{clearTimeout(timeout);resolve();};});
  const stopped=new Promise((resolve,reject)=>{recorder.onstop=resolve;recorder.onerror=reject;});
  recorder.start(100);track.requestFrame();await started;
  for(let i=0;i<14;i++){g.fillStyle=i%2?'#355b4a':'#f8e8e6';g.fillRect(0,0,160,120);track.requestFrame();await new Promise(r=>setTimeout(r,120));}
  recorder.stop();await stopped;stream.getTracks().forEach(t=>t.stop());
  const blob=new Blob(chunks,{type:'video/webm'});if(blob.size<500)throw Error('Synthetic video contains no encoded frames');
  const url=URL.createObjectURL(blob),video=document.createElement('video');video.muted=true;video.preload='metadata';
  try{await new Promise((resolve,reject)=>{const timeout=setTimeout(()=>reject(Error('Synthetic video metadata timeout')),10000);video.onloadedmetadata=()=>{clearTimeout(timeout);resolve();};video.onerror=()=>{clearTimeout(timeout);reject(Error('Synthetic WebM is not decodable: '+video.error?.message));};video.src=url;video.load();});return Array.from(new Uint8Array(await blob.arrayBuffer()));}
  finally{video.removeAttribute('src');video.load();URL.revokeObjectURL(url);}
 }));
}
