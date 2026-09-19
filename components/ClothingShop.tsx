"use client";
import {useEffect,useRef,useState} from 'react';
import {motion,useAnimationFrame,useMotionValue} from 'framer-motion';
import {outfits,useOutfit} from './OutfitContext';
import WalkingArong from './WalkingArong';
import {Dialog,DialogContent,DialogTitle,DialogDescription,DialogClose} from './ui/dialog';

const clamp=(v:number,a:number,b:number)=>Math.max(a,Math.min(b,v));
export default function ClothingShop({onExit}:{onExit:()=>void}){
 const viewport=useRef<HTMLDivElement>(null),position=useMotionValue(160);
 const target=useRef(160),held=useRef(0),lastMove=useRef(0),automatic=useRef(false),pendingTalk=useRef(false),moving=useRef(false);
 const [size,setSize]=useState({w:1200,h:700}),[walking,setWalking]=useState(false),[direction,setDirection]=useState(1);
 const [talk,setTalk]=useState(false),[answer,setAnswer]=useState('欢迎呀，阿绒！右边都是给你准备的衣服。走到镜子前，挑一套喜欢的穿出去吧。');
 const [wardrobe,setWardrobe]=useState(false);
 const {outfit,setOutfit}=useOutfit();
 const pendingWardrobe=useRef(false);
 const [spark,setSpark]=useState(0);
 const blocked=talk||wardrobe,world=Math.max(size.w,size.h*3),height=size.h;
 const actorHeight=clamp(height*.32,180,250);
 const pause=()=>{held.current=0;target.current=position.get();automatic.current=false;pendingTalk.current=false;pendingWardrobe.current=false;moving.current=false;setWalking(false);};
 useEffect(()=>{const el=viewport.current;if(!el)return;const update=()=>setSize({w:el.clientWidth,h:el.clientHeight});const observer=new ResizeObserver(update);observer.observe(el);update();return()=>observer.disconnect();},[]);
 useEffect(()=>{
  const down=(e:KeyboardEvent)=>{if(blocked||['BUTTON','INPUT'].includes((e.target as HTMLElement).tagName))return;if(['ArrowLeft','ArrowRight','a','d'].includes(e.key)){e.preventDefault();held.current=e.key==='ArrowLeft'||e.key==='a'?-1:1;automatic.current=false;pendingTalk.current=false;pendingWardrobe.current=false;}};
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
  }else{automatic.current=false;if(pendingWardrobe.current){pendingWardrobe.current=false;setWardrobe(true);}if(pendingTalk.current){pendingTalk.current=false;setTalk(true);}}
 });
 const closeOverlay=()=>{pause();lastMove.current=0;};
 const restoreFocus=(e:Event)=>{e.preventDefault();viewport.current?.focus({preventScroll:true});};
 const approach=(kind:'talk'|'wardrobe',x:number)=>{pendingTalk.current=kind==='talk';pendingWardrobe.current=kind==='wardrobe';automatic.current=true;held.current=0;target.current=world*x;};
 return <section className="photo-studio" aria-label="服装店室内">
  <div ref={viewport} tabIndex={-1} className="studio-scroll" onPointerLeave={()=>{if(!automatic.current&&!held.current)target.current=position.get();}}
   onPointerMove={e=>{if(blocked||automatic.current||e.pointerType!=='mouse'||(e.target as HTMLElement).closest('button'))return;lastMove.current=performance.now();target.current=e.clientX-e.currentTarget.getBoundingClientRect().left+e.currentTarget.scrollLeft;}}
   onClick={e=>{if(blocked||(e.target as HTMLElement).closest('button'))return;automatic.current=true;pendingTalk.current=false;pendingWardrobe.current=false;target.current=e.clientX-e.currentTarget.getBoundingClientRect().left+e.currentTarget.scrollLeft;}}>
   <div className="studio-world" style={{width:world,height}}>
    <img className="studio-backdrop" src="/images/clothing-shop.png" alt="平视像素服装店，女店主叉腰站在木柜台后，右侧是镜子、衣柜和挂衣架" draggable={false}/>
    <button className="studio-owner" style={{left:'8%',top:'20%',width:'20%',height:'51%'}} aria-label="和服装店女士对话" onClick={()=>approach('talk',.20)}><span>和店主聊聊</span></button>
    <button className="studio-owner" style={{left:'46%',top:'20%',width:'14%',height:'51%'}} aria-label="在镜子前试衣" onClick={()=>approach('wardrobe',.53)}><span>照镜子 · 试衣</span></button>
    <button className="studio-owner" style={{left:'68%',top:'23%',width:'26%',height:'48%'}} aria-label="打开衣柜换装" onClick={()=>approach('wardrobe',.77)}><span>打开衣柜</span></button>
    <motion.div className="studio-arong" style={{x:position,top:height*.86-actorHeight,height:actorHeight,width:actorHeight*120/140,marginLeft:-actorHeight*60/140}}><WalkingArong walking={walking} direction={direction}/></motion.div>
   </div>
  </div>
  <header className="studio-header"><button onClick={onExit}>← 返回商业街</button><span>绒绒衣橱</span></header>
  <p className="studio-hint">左右移动鼠标 / 方向键走动 · 点击店主对话 · 向右试衣</p>
  <Dialog open={talk} onOpenChange={v=>{setTalk(v);if(!v)closeOverlay();}}><DialogContent className="studio-conversation" onCloseAutoFocus={restoreFocus}><DialogTitle>服装店的女店主</DialogTitle><DialogDescription aria-live="polite">{answer}</DialogDescription><div className="studio-replies"><button onClick={()=>setAnswer('今天想去哪里？蓝开衫适合逛小镇，红围巾最暖和，做点心的话就试试小围裙。')}>帮我推荐一套吧</button><button onClick={()=>setAnswer('当然可以穿出去！镜子前选好就换上了。下次来，我也会记得你这身衣服。')}>可以穿着回小镇吗？</button><DialogClose>我去右边试试 →</DialogClose></div></DialogContent></Dialog>
  <Dialog open={wardrobe} onOpenChange={v=>{setWardrobe(v);if(!v)closeOverlay();}}><DialogContent className="outfit-dialog" onCloseAutoFocus={restoreFocus}><DialogTitle>阿绒的衣橱</DialogTitle><DialogDescription>选好就穿上，带着新衣服去小镇散步。</DialogDescription>
   <div className="outfit-layout"><div className="outfit-mirror"><div className="outfit-preview"><WalkingArong walking={false}/></div>{spark>0&&<motion.div key={spark} className="outfit-spark" initial={{opacity:0}} animate={{opacity:[0,.75,0]}} transition={{duration:.45}}/>}<p>{outfits.find(o=>o.id===outfit)?.name}</p></div>
   <div className="outfit-grid">{outfits.map(o=><button key={o.id} aria-pressed={outfit===o.id} className={outfit===o.id?'selected':''} onClick={()=>{setOutfit(o.id);setSpark(v=>v+1);}}><div className="outfit-thumb"><WalkingArong walking={false} outfit={o.id}/></div><span>{o.name}</span>{outfit===o.id&&<small>已穿上</small>}</button>)}</div></div>
   <DialogClose className="outfit-done">就穿这套</DialogClose>
  </DialogContent></Dialog>
 </section>;
}
