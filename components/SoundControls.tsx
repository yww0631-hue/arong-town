"use client";
import {useEffect,useState} from 'react';
import {pauseAudio,setAudioSettings,sound,unlockAudio} from '../lib/game-audio';
export default function SoundControls(){
 const [volume,setVolume]=useState(.35),[muted,setMuted]=useState(false),[ready,setReady]=useState(false);
 useEffect(()=>{try{const v=JSON.parse(localStorage.getItem('arong-audio-v1')||'null');if(v){if(typeof v.volume==='number'&&Number.isFinite(v.volume))setVolume(Math.min(1,Math.max(0,v.volume)));setMuted(v.muted===true);}}catch{}setReady(true);},[]);
 useEffect(()=>{if(!ready)return;setAudioSettings(volume,muted);try{localStorage.setItem('arong-audio-v1',JSON.stringify({volume,muted}));}catch{}},[volume,muted,ready]);
 useEffect(()=>{
  const unlock=()=>unlockAudio();
  const click=(e:MouseEvent)=>{const b=(e.target as HTMLElement).closest?.('button');if(b&&!b.disabled&&!b.closest('[data-sound-controls]'))sound(b.closest('.outfit-grid')?'outfit':b.closest('.studio-frame')?'paper':'click');};
  const hide=()=>{if(document.hidden)pauseAudio();};
  window.addEventListener('pointerdown',unlock,true);window.addEventListener('keydown',unlock,true);window.addEventListener('click',click);window.addEventListener('blur',pauseAudio);document.addEventListener('visibilitychange',hide);
  return()=>{window.removeEventListener('pointerdown',unlock,true);window.removeEventListener('keydown',unlock,true);window.removeEventListener('click',click);window.removeEventListener('blur',pauseAudio);document.removeEventListener('visibilitychange',hide);pauseAudio();};
 },[]);
 return <aside data-sound-controls aria-label="音效设置" style={{position:'fixed',right:12,top:64,zIndex:90,display:'flex',alignItems:'center',gap:8,padding:'7px 10px',border:'1px solid #dcbf8e80',borderRadius:20,background:'#302318e8',color:'#fff0d6'}} onPointerMove={e=>e.stopPropagation()} onPointerDown={e=>e.stopPropagation()}>
  <button aria-label={muted?'开启音效':'静音'} aria-pressed={muted} onClick={()=>setMuted(v=>!v)} style={{background:'none',border:0,color:'inherit',cursor:'pointer',fontSize:13}}>{muted?'音效：关':'音效：开'}</button>
  <input aria-label="音效音量" type="range" min="0" max="1" step=".05" value={volume} onChange={e=>setVolume(Number(e.target.value))} style={{width:70,accentColor:'#e9b6a6'}}/>
 </aside>;
}
