import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
const items=JSON.parse(await readFile(new URL('./assets-manifest.json',import.meta.url),'utf8'));
const hash=b=>createHash('sha256').update(b).digest('hex');
let index=0;
async function worker(){while(index<items.length){const item=items[index++];const dest=path.join('public',item.path);try{if(hash(await readFile(dest))===item.sha256)continue;}catch{}
let done=false;for(let attempt=0;attempt<3;attempt++){try{const res=await fetch('https://arong-tv-dream-preview.yww0631.chatgpt.site/'+item.path,{signal:AbortSignal.timeout(90000)});if(!res.ok)throw new Error(String(res.status));const bytes=Buffer.from(await res.arrayBuffer());if(hash(bytes)!==item.sha256)throw new Error('Image hash mismatch');await mkdir(path.dirname(dest),{recursive:true});await writeFile(dest,bytes);console.log('Restored',item.path);done=true;break;}catch(err){if(attempt===2)throw err;}}
if(!done)throw new Error('Missing '+item.path);
}}
await Promise.all(Array.from({length:6},worker));
