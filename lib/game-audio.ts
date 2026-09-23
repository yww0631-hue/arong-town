/** 本地合成轻柔音效：无外部音频请求；只有用户操作后才启动声音。 */
export type Sound = 'step'|'door'|'enter'|'van'|'click'|'outfit'|'water'|'knit'|'paper'|'spark';
let ctx:AudioContext|null=null,master:GainNode|null=null;
let volume=.35,muted=false,lastStep=0;
export function setAudioSettings(v:number,m:boolean){volume=v;muted=m;if(ctx&&master)master.gain.setTargetAtTime(m?0:v,ctx.currentTime,.025);}
export function unlockAudio(){
 try{if(!ctx){ctx=new AudioContext();master=ctx.createGain();master.gain.value=muted?0:volume;master.connect(ctx.destination);}if(ctx.state==='suspended')void ctx.resume().catch(()=>{});}catch{}
}
export function pauseAudio(){if(ctx?.state==='running')void ctx.suspend().catch(()=>{});}
export function sound(kind:Sound){
 if(!ctx||!master||ctx.state!=='running'||muted||volume===0||document.hidden||!document.hasFocus())return;
 const c=ctx,out=master,t=c.currentTime;
 if(kind==='step'){if(t-lastStep<.26)return;lastStep=t;}
 const tone=(hz:number,duration:number,level:number,delay=0,end=hz,type:OscillatorType='sine')=>{
  const o=c.createOscillator(),g=c.createGain(),start=t+delay;o.type=type;o.frequency.setValueAtTime(hz,start);o.frequency.exponentialRampToValueAtTime(Math.max(20,end),start+duration);
  g.gain.setValueAtTime(.0001,start);g.gain.exponentialRampToValueAtTime(level,start+.012);g.gain.exponentialRampToValueAtTime(.0001,start+duration);
  o.connect(g);g.connect(out);o.start(start);o.stop(start+duration+.02);o.onended=()=>{o.disconnect();g.disconnect();};
 };
 const noise=(duration:number,level:number,hz:number,delay=0)=>{
  const b=c.createBuffer(1,Math.ceil(c.sampleRate*duration),c.sampleRate),a=b.getChannelData(0);for(let i=0;i<a.length;i++)a[i]=Math.random()*2-1;
  const s=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();s.buffer=b;f.type='lowpass';f.frequency.value=hz;
  g.gain.setValueAtTime(.0001,t+delay);g.gain.linearRampToValueAtTime(level,t+delay+.01);g.gain.exponentialRampToValueAtTime(.0001,t+delay+duration);
  s.connect(f);f.connect(g);g.connect(out);s.start(t+delay);s.onended=()=>{s.disconnect();f.disconnect();g.disconnect();};
 };
 switch(kind){
  case 'step':tone(115,.10,.12,0,70);noise(.065,.09,650);break;
  case 'door':tone(220,.35,.07,0,105,'triangle');noise(.09,.12,1000,.28);break;
  case 'enter':tone(170,.65,.10,0,480);tone(520,.6,.045,.3,780);break;
  case 'van':tone(65,1.2,.12,0,140,'triangle');noise(.9,.065,350);break;
  case 'outfit':case 'spark':[440,554,660].forEach((n,i)=>tone(n,.28,.065,i*.09));break;
  case 'water':for(let i=0;i<5;i++)tone(650+i*95,.14,.045,i*.13,280);noise(.7,.055,1800);break;
  case 'knit':for(let i=0;i<4;i++)noise(.05,.12,1600,i*.16);break;
  case 'paper':noise(.22,.10,1300);break;
  default:tone(560,.065,.065,0,420);
 }
}
