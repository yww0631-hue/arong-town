"use client";
import {useEffect,useRef,useState} from 'react';
import {motion,useAnimationFrame,useMotionValue} from 'framer-motion';
import PixelMerch from './PixelMerch';
import WalkingArong from './WalkingArong';
import {Dialog,DialogContent,DialogTitle,DialogDescription,DialogClose} from './ui/dialog';
const titles=['阿绒包袋系列','毛线时光纸胶带','随身保温杯','软绒日常系列','挂件与徽章'];
const photos=['/images/merch-bags.png','/images/merch-tape.png','/images/merch-bottles.png','/images/merch-plush.png','/images/merch-charms.jpg'];
const clamp=(v:number,a:number,b:number)=>Math.max(a,Math.min(b,v));
export default function MerchShop({onExit}:{onExit:()=>void}){
 const viewport=useRef<HTMLDivElement>(null),position=useMotionValue(160);
 const target=useRef(160),held=useRef(0),lastMove=useRef(0),automatic=useRef(false),pendingTalk=useRef(false),moving=useRef(false);
 const [size,setSize]=useState({w:1200,h:700}),[walking,setWalking]=useState(false),[direction,setDirection]=useState(1);
 const [talk,setTalk]=useState(false),[answer,setAnswer]=useState('欢迎来到阿绒周边铺！右边货架有包袋、胶带、杯子和毛绒小伙伴，点一下就能仔细看看。');
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
 return <section className="photo-studio" aria-label="周边商店室内">
  <div ref={viewport} tabIndex={-1} className="studio-scroll" onPointerLeave={()=>{if(!automatic.current&&!held.current)target.current=position.get();}}
   onPointerMove={e=>{if(blocked||automatic.current||e.pointerType!=='mouse'||(e.target as HTMLElement).closest('button'))return;lastMove.current=performance.now();target.current=e.clientX-e.currentTarget.getBoundingClientRect().left+e.currentTarget.scrollLeft;}}
   onClick={e=>{if(blocked||(e.target as HTMLElement).closest('button'))return;automatic.current=true;pendingTalk.current=false;target.current=e.clientX-e.currentTarget.getBoundingClientRect().left+e.currentTarget.scrollLeft;}}>
   <div className="studio-world" style={{width:world,height}}>
    <img className="studio-backdrop" src="/images/merch-shop.png" alt="平视像素周边商店，左侧年轻店员与柜台，右侧是周边货架" draggable={false}/>
    <button className="studio-owner" style={{left:'10%',top:'24%',width:'17%',height:'47%'}} aria-label="和年轻店员对话" onClick={()=>{automatic.current=true;pendingTalk.current=true;target.current=world*.20;}}><span>和店主聊聊</span></button>
    {titles.map((title,i)=><motion.button key={title} className="merch-item" style={{left:[34,55,76,40,70][i]+'%',top:i<3?'13%':'45%',width:'12%',height:'19%'}} whileHover={{y:-5,scale:1.05}} whileTap={{scale:.96}} aria-label={`查看周边：${title}`} onClick={()=>{pause();setPhoto(i);}}><PixelMerch index={i}/><span>{title}</span></motion.button>)}
    <motion.div className="studio-arong" style={{x:position,top:height*.86-actorHeight,height:actorHeight,width:actorHeight*120/140,marginLeft:-actorHeight*60/140}}><WalkingArong walking={walking} direction={direction}/></motion.div>
   </div>
  </div>
  <header className="studio-header"><button onClick={onExit}>← 返回商业街</button><span>阿绒周边铺</span></header>
  <p className="studio-hint">左右移动鼠标 / 方向键走动 · 点击店主对话 · 向右逛货架 · 点击周边看原图</p>
  <Dialog open={talk} onOpenChange={v=>{setTalk(v);if(!v)closeOverlay();}}><DialogContent className="studio-conversation" onCloseAutoFocus={restoreFocus}><DialogTitle>周边店的年轻店员</DialogTitle><DialogDescription aria-live="polite">{answer}</DialogDescription><div className="studio-replies"><button onClick={()=>setAnswer('都是以阿绒和毛线小镇为灵感设计的周边。蓝色包袋、软软的玩偶，每一样都藏着阿绒的小细节。')}>货架上有什么？</button><button onClick={()=>setAnswer('往右逛逛，点击货架上的像素周边就能看到完整设计图。看完关掉图片，还可以继续散步。')}>怎么查看周边？</button><DialogClose>我去逛逛货架 →</DialogClose></div></DialogContent></Dialog>
  <Dialog open={photo!==null} onOpenChange={v=>{if(!v){setPhoto(null);closeOverlay();}}}><DialogContent className="studio-lightbox" onCloseAutoFocus={restoreFocus}><DialogTitle>{photo!==null?titles[photo]:''}</DialogTitle><DialogDescription>阿绒周边设计 · {photo===null?0:photo+1} / 5</DialogDescription>{photo!==null&&<img className="studio-full-photo" src={photos[photo]} alt={titles[photo]}/>}<div className="studio-photo-nav"><button disabled={photo===0} onClick={()=>setPhoto(v=>v===null?0:Math.max(0,v-1))}>← 上一张</button><DialogClose>放回货架</DialogClose><button disabled={photo===4} onClick={()=>setPhoto(v=>v===null?0:Math.min(4,v+1))}>下一张 →</button></div></DialogContent></Dialog>
 </section>;
}
