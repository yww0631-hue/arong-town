"use client";
import {useEffect,useRef,useState} from 'react';
import {motion,useAnimationFrame,useMotionValue} from 'framer-motion';
import WalkingArong from './WalkingArong';
import {Dialog,DialogContent,DialogTitle,DialogDescription,DialogClose} from './ui/dialog';
const titles=['积木里的小时光','窗边的等候','林间阳光','抱着月亮睡着了','毛线与午后','桌边的小雏菊','阁楼里的发现'];
const clamp=(v:number,a:number,b:number)=>Math.max(a,Math.min(b,v));
export default function PhotoStudio({onExit}:{onExit:()=>void}){
 const viewport=useRef<HTMLDivElement>(null),position=useMotionValue(160);
 const target=useRef(160),held=useRef(0),lastMove=useRef(0),automatic=useRef(false),pendingTalk=useRef(false),moving=useRef(false);
 const [size,setSize]=useState({w:1200,h:700}),[walking,setWalking]=useState(false),[direction,setDirection]=useState(1);
 const [talk,setTalk]=useState(false),[answer,setAnswer]=useState('来啦？慢慢看。柜台右边挂着阿绒的照片，每一张都留着一段小日子。');
 const [photo,setPhoto]=useState<number|null>(null);
 const blocked=talk||photo!==null,world=Math.max(size.w,size.h*3),height=size.h;
 const actorHeight=clamp(height*.32,180,250);
 const pause=()=>{held.current=0;target.current=position.get();automatic.current=false;pendingTalk.current=false;moving.current=false;setWalking(false);};
 useEffect(()=>{const el=viewport.current;if(!el)return;const update=()=>setSize({w:el.clientWidth,h:el.clientHeight});const observer=new ResizeObserver(update);observer.observe(el);update();return()=>observer.disconnect();},[]);
 useEffect(()=>{
  const down=(e:KeyboardEvent)=>{if(blocked||['BUTTON','INPUT'].includes((e.target as HTMLElement).tagName))return;if(['ArrowLeft','ArrowRight','a','d'].includes(e.key)){e.preventDefault();held.current=e.key==='ArrowLeft'||e.key==='a'?-1:1;automatic.current=false;pendingTalk.current=false;}};
  const up=()=>{held.current=0;if(!automatic.current)target.current=position.get();};
  window.addEventListener('keydown',down);window.addEventListener('keyup',up);window.addEventListener('blur',up);return()=>{window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('blur',up);};
 },[blocked]);
 useAnimationFrame((_,delta)=>{
  if(blocked)return;const dt=Math.min(delta,40)/1000,el=viewport.current;if(!el)return;
  if(held.current)target.current=position.get()+held.current*100;
  else if(!automatic.current&&performance.now()-lastMove.current>150)target.current=position.get();
  target.current=clamp(target.current,65,world-65);const diff=target.current-position.get(),walk=Math.abs(diff)>3;
  if(walk!==moving.current){moving.current=walk;setWalking(walk);}
  if(walk){setDirection(Math.sign(diff));position.set(position.get()+Math.sign(diff)*Math.min(Math.abs(diff),180*dt));
   const scroll=clamp(position.get()-size.w*.45,0,world-size.w);el.scrollLeft+=(scroll-el.scrollLeft)*(1-Math.exp(-5*dt));
  }else{automatic.current=false;if(pendingTalk.current){pendingTalk.current=false;setTalk(true);}}
 });
 const closeOverlay=()=>{pause();lastMove.current=0;};
 const restoreFocus=(e:Event)=>{e.preventDefault();viewport.current?.focus({preventScroll:true});};
 return <section className="photo-studio" aria-label="照相馆室内">
  <div ref={viewport} tabIndex={-1} className="studio-scroll" onPointerLeave={()=>{if(!automatic.current&&!held.current)target.current=position.get();}}
   onPointerMove={e=>{if(blocked||automatic.current||e.pointerType!=='mouse'||(e.target as HTMLElement).closest('button'))return;lastMove.current=performance.now();target.current=e.clientX-e.currentTarget.getBoundingClientRect().left+e.currentTarget.scrollLeft;}}
   onClick={e=>{if(blocked||(e.target as HTMLElement).closest('button'))return;automatic.current=true;pendingTalk.current=false;target.current=e.clientX-e.currentTarget.getBoundingClientRect().left+e.currentTarget.scrollLeft;}}>
   <div className="studio-world" style={{width:world,height}}>
    <img className="studio-backdrop" src="/images/photo-studio.png" alt="平视的老照相馆，左边是柜台和抽烟的老店主，右边是照片墙" draggable={false}/>
    {[0,1,2].map(i=><motion.span key={i} className="studio-smoke" style={{left:'17.5%',top:'29.6%'}} animate={{y:[0,-22,-48],x:[0,5,-4],opacity:[0,.35,0],scale:[.7,1.4,2]}} transition={{duration:3,repeat:Infinity,delay:i}}/>)}
    <button className="studio-owner" style={{left:'10%',top:'24%',width:'17%',height:'47%'}} aria-label="和柜台后的老店主对话" onClick={()=>{automatic.current=true;pendingTalk.current=true;target.current=world*.20;}}><span>和店主聊聊</span></button>
    {titles.map((title,i)=>{const col=i<4?i:i-4;return <motion.button key={title} className="studio-frame" style={{left:(i<4?37+col*15:44+col*15)+'%',top:i<4?'17%':'44%',width:'12%'}} whileHover={{y:-3}} whileTap={{scale:.98}} aria-label={`放大查看：${title}`} onClick={()=>{pause();setPhoto(i);}}><img src={`/images/studio-photo-${i+1}.jpg`} alt={title} draggable={false}/></motion.button>;})}
    <motion.div className="studio-arong" style={{x:position,top:height*.86-actorHeight,height:actorHeight,width:actorHeight*120/140,marginLeft:-actorHeight*60/140}}><WalkingArong walking={walking} direction={direction}/></motion.div>
   </div>
  </div>
  <header className="studio-header"><button onClick={onExit}>← 返回商业街</button><span>旧时光照相馆</span></header>
  <p className="studio-hint">左右移动鼠标 / 方向键走动 · 点击店主对话 · 向右看照片墙</p>
  <Dialog open={talk} onOpenChange={v=>{setTalk(v);if(!v)closeOverlay();}}><DialogContent className="studio-conversation" onCloseAutoFocus={restoreFocus}><DialogTitle>照相馆的老店主</DialogTitle><DialogDescription aria-live="polite">{answer}</DialogDescription><div className="studio-replies"><button onClick={()=>setAnswer('都是阿绒留下的日常。积木、毛线、窗外的太阳……小事也值得好好留着。')}>这些照片是谁的？</button><button onClick={()=>setAnswer('人总怕忘记。照片不能留住时间，倒能帮我们记得，当时为什么笑。')}>为什么开照相馆？</button><DialogClose>我去右边看看照片 →</DialogClose></div></DialogContent></Dialog>
  <Dialog open={photo!==null} onOpenChange={v=>{if(!v){setPhoto(null);closeOverlay();}}}><DialogContent className="studio-lightbox" onCloseAutoFocus={restoreFocus}><DialogTitle>{photo!==null?titles[photo]:''}</DialogTitle><DialogDescription>阿绒的生活相册 · {photo===null?0:photo+1} / 7</DialogDescription>{photo!==null&&<img className="studio-full-photo" src={`/images/studio-photo-${photo+1}.jpg`} alt={titles[photo]}/>}<div className="studio-photo-nav"><button disabled={photo===0} onClick={()=>setPhoto(v=>v===null?0:Math.max(0,v-1))}>← 上一张</button><DialogClose>收好照片</DialogClose><button disabled={photo===6} onClick={()=>setPhoto(v=>v===null?0:Math.min(6,v+1))}>下一张 →</button></div></DialogContent></Dialog>
 </section>;
}
