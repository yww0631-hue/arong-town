"use client";
import { AnimatePresence, motion, useAnimationFrame, useMotionValue, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import {useOutfit} from "./OutfitContext";
import {sound} from "../lib/game-audio";
import InteractionArong from "./InteractionArong";
import WalkingArong, { type ArongFacing } from "./WalkingArong";
import { canWalk, findRoute, roomLayouts, type Point } from "@/lib/room-navigation";

const activities = [
  ["在画架前画画","调一盘颜色","翻看画册"],
  ["挑选毛线","织一小段围巾","整理针线盒"],
  ["给植物浇水","照顾新芽","点亮温室灯"],
  ["吹一串泡泡","洗洗小手","叠好浴巾"],
  ["品尝小蛋糕","泡一杯茶","整理餐具"],
];
const feedback = [
  ["画布上留下了新的一笔。","调好了今天喜欢的颜色。","又收藏了一个小小的灵感。"],
  ["挑中了一团柔软的毛线。","围巾又长了一点点。","旧纽扣也有自己的小格子。"],
  ["植物喝饱水啦。","发现了一片新叶！","给温室留一盏暖暖的小灯。"],
  ["让泡泡带着烦恼飞走吧。","洗去一天的小疲惫。","浴巾叠得软软的。"],
  ["甜甜的蛋糕，分你一口。","热茶泡好了。","把喜欢的杯子放整齐。"],
];
export default function RoomMap({index,onExit,knitCount=0,buttonCollected=false,onKnitted,onCollectButton}:{index:number;onExit:()=>void;knitCount?:number;buttonCollected?:boolean;onKnitted?:()=>void;onCollectButton?:()=>void}) {
  const {outfit}=useOutfit();
  // 回调用 ref 保持最新，避免收藏更新导致正在播放的动作计时重启。
  const onKnittedRef=useRef(onKnitted);onKnittedRef.current=onKnitted;
  const knitCountRef=useRef(knitCount);knitCountRef.current=knitCount;

  const {obstacles,spots}=roomLayouts[index];
  const furniture=obstacles.slice(0,3);
  const map=useRef<HTMLDivElement>(null);
  const pos=useRef<Point>({x:500,y:825});
  const route=useRef<Point[]>([]), pending=useRef<number|null>(null), keys=useRef(new Set<string>());
  const velocity=useRef(0), wasWalking=useRef(false), lastDirection=useRef<ArongFacing>("front");
  const px=useMotionValue(50),py=useMotionValue(82.5);
  const left=useTransform(px,v=>`${v}%`),top=useTransform(py,v=>`${v}%`);
  const [walking,setWalking]=useState(false),[direction,setDirection]=useState<ArongFacing>("front");
  const [target,setTarget]=useState<Point|null>(null),[active,setActive]=useState<number|null>(null);
  const [cycle,setCycle]=useState(0),[done,setDone]=useState<number[]>([]),[lit,setLit]=useState(false);
  const [message,setMessage]=useState("点击地板走动，点击物件走近互动");
  const busy=useRef(false);
  const act=(i:number)=>{
    if(busy.current)return;
    pending.current=null;setTarget(null);
    if(i===3){onExit();return;}
    if(i===4){onCollectButton?.();setMessage('原来你躲在这里。旧纽扣已收进公告栏的小收藏。');return;}
    busy.current=true;keys.current.clear();route.current=[];velocity.current=0;wasWalking.current=false;setWalking(false);
    setActive(i);setCycle(n=>n+1);
    setMessage(["正在挥动画笔…","正在交替编织…","正在给绿植浇水…","正在搓手洗泡泡…","正在慢慢喝茶…"][index]);
  };
  useEffect(()=>{
    if(active===null)return;
    const cue=index===1?"knit":index===2||index===3||index===4&&active===1?"water":"paper";
    sound(cue);const audioTimer=setInterval(()=>sound(cue),850);
    const timer=setTimeout(()=>{
      setDone(v=>v.includes(active)?v:[...v,active]);
      if(index===2&&active===2)setLit(v=>!v);
      if(index===1&&active===1){
        onKnittedRef.current?.();
        setMessage(knitCountRef.current===2?'叮！一颗旧纽扣滚到了地上，点它捡起来吧。':feedback[index][active]);
      }else setMessage(feedback[index][active]);
      setActive(null);busy.current=false;
    },2800);
    return()=>{clearTimeout(timer);clearInterval(audioTimer);};
  },[active,cycle,index]);
  const walkTo=(goal:Point,action:number|null=null)=>{
    if(busy.current)return;
    if(!canWalk(goal,obstacles)){setMessage("这里有家具，试试旁边的空地");return;}
    const path=findRoute(pos.current,goal,obstacles);
    if(!path.length){setMessage("这边走不过去，换一处空地试试");return;}
    keys.current.clear();route.current=path;pending.current=action;setTarget(goal);
    setMessage(action===4?"阿绒正走去捡起旧纽扣…":action===3?"走到门口，回小镇看看":action!==null?"阿绒正走过去…":"慢慢走，不着急");
  };
  useEffect(()=>{
    const movement=["arrowleft","arrowright","arrowup","arrowdown","w","a","s","d"];
    const down=(e:KeyboardEvent)=>{
      if(busy.current){if(movement.includes(e.key.toLowerCase()))e.preventDefault();return;}
      if((e.target as HTMLElement).closest("button"))return;
      const key=e.key.toLowerCase();
      if(movement.includes(key)){e.preventDefault();keys.current.add(key);route.current=[];pending.current=null;setTarget(null);}
      if(key==="e"){
        const near=spots.findIndex(p=>Math.hypot(pos.current.x-p.x,pos.current.y-p.y)<100);
        if(near>=0)act(near);
      }
    };
    const up=(e:KeyboardEvent)=>keys.current.delete(e.key.toLowerCase());
    const clear=()=>keys.current.clear();
    window.addEventListener("keydown",down);window.addEventListener("keyup",up);window.addEventListener("blur",clear);
    return()=>{window.removeEventListener("keydown",down);window.removeEventListener("keyup",up);window.removeEventListener("blur",clear);};
  },[index]);
  useAnimationFrame((_,delta)=>{
    if(busy.current)return;
    const dt=Math.min(delta,40)/1000;
    let dx=0,dy=0;
    const k=keys.current;
    if(k.size){dx=Number(k.has("d")||k.has("arrowright"))-Number(k.has("a")||k.has("arrowleft"));dy=Number(k.has("s")||k.has("arrowdown"))-Number(k.has("w")||k.has("arrowup"));}
    else {
      while(route.current.length&&Math.hypot(route.current[0].x-pos.current.x,route.current[0].y-pos.current.y)<3)route.current.shift();
      const next=route.current[0];if(next){dx=next.x-pos.current.x;dy=next.y-pos.current.y;}
    }
    const distance=Math.hypot(dx,dy), moving=distance>.1;
    velocity.current+=( (moving?145:0)-velocity.current)* (1-Math.exp(-10*dt));
    const stride=Math.min(velocity.current*dt,k.size?Infinity:distance);
    let moved=false;
    if(moving){
      const next={x:pos.current.x+dx/distance*stride,y:pos.current.y+dy/distance*stride};
      if(canWalk(next,obstacles)){pos.current=next;moved=true;}
      const heading:ArongFacing=Math.abs(dy)>Math.abs(dx)?(dy<0?"away":"front"):(dx<0?"left":"right");
      if(heading!==lastDirection.current){lastDirection.current=heading;setDirection(heading);}
      px.set(pos.current.x/10);py.set(pos.current.y/10);
    }
    if(moved!==wasWalking.current){wasWalking.current=moved;setWalking(moved);}
    if(!moving&&!k.size&&pending.current!==null)act(pending.current);
    else if(!moving&&!k.size&&route.current.length===0&&target)setTarget(null);
    if(k.size&&pos.current.y>875&&Math.abs(pos.current.x-500)<60)onExit();
  });
  return <div className="room-map-shell">
    <div className="room-map" ref={map} tabIndex={0} aria-label="俯视房间地图，可点击地板行走，也可使用方向键"
      style={{backgroundImage:"url(/images/room-maps-pixel-v2.png)",backgroundPosition:`${(index%3)*50}% ${index<3?0:100}%`}}
      onClick={e=>{map.current?.focus();const rect=e.currentTarget.getBoundingClientRect();walkTo({x:(e.clientX-rect.left)/rect.width*1000,y:(e.clientY-rect.top)/rect.height*1000});}}>
      <motion.div className="map-light" animate={{opacity:lit?.35:0}}/>
      {furniture.map((r,i)=><button key={i} className="map-furniture" style={{left:r.x/10+"%",top:r.y/10+"%",width:r.w/10+"%",height:r.h/10+"%"}}
        onClick={e=>{e.stopPropagation();map.current?.focus();walkTo(spots[i],i);}} aria-label={activities[index][i]}>
        <span className="map-object-dot">{done.includes(i)?"✦":"＋"}</span><span className="map-object-name">{activities[index][i]}</span>
      </button>)}
      <AnimatePresence>{target&&<motion.span className="map-destination" key={`${target.x}-${target.y}`} style={{left:target.x/10+"%",top:target.y/10+"%"}} initial={{opacity:0,scale:.5}} animate={{opacity:.7,scale:1}} exit={{opacity:0}}/>}</AnimatePresence>
      <motion.div className="map-arong" style={{left,top}}>
        <motion.div style={{width:"100%",height:"100%",opacity:active===null||outfit!=="original"?1:0}} animate={active!==null&&outfit!=="original"?{y:[0,-3,0],rotate:[0,-3,3,0]}:{y:0,rotate:0}} transition={{duration:.7,repeat:active!==null?Infinity:0}}><WalkingArong walking={walking} facing={direction}/></motion.div>
        <InteractionArong room={index} playing={active!==null&&outfit==="original"} cycle={cycle} leftward={active!==null&&furniture[active].x+furniture[active].w/2<spots[active].x}/>
        {active!==null&&<span className="interaction-label">互动中…<motion.i key={cycle} initial={{scaleX:0}} animate={{scaleX:1}} transition={{duration:2.8,ease:"linear"}}/></span>}
      </motion.div>
      <AnimatePresence>{active!==null&&<motion.div className="map-magic" key={cycle} style={{left:spots[active].x/10+"%",top:(spots[active].y/10-10)+"%"}} initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
        {[0,1,2,3,4].map(n=><motion.span key={n} initial={{y:0,opacity:0}} animate={{y:[0,-35-n*6],x:(n-2)*15,opacity:[0,1,0],rotate:[0,15,-15]}} transition={{duration:1.8,delay:n*.08}}>{index===3?"○":index===2?"❧":index===1?"◎":"✦"}</motion.span>)}
      </motion.div>}</AnimatePresence>
      <AnimatePresence>{index===1&&knitCount>=3&&!buttonCollected&&<motion.button key="old-button" className="map-old-button" aria-label="拾起地上的旧纽扣" title="一颗旧纽扣"
        style={{left:'57.5%',top:'70%'}} initial={{opacity:0,y:-35,rotate:-120}} animate={{opacity:1,y:0,rotate:0}} exit={{opacity:0,y:-20,scale:.5}} transition={{type:'spring',stiffness:150,damping:12}}
        onClick={e=>{e.stopPropagation();map.current?.focus();walkTo({x:575,y:725},4);}}>
        <img src="/images/old-button-pixel.png" alt="" draggable={false}/>
      </motion.button>}</AnimatePresence>
      <button className="map-exit" onClick={e=>{e.stopPropagation();walkTo({x:500,y:875},3);}}>回到小镇 ↓</button>
    </div>
    <p className="map-instructions" role="status">{message}<small>方向键 / WASD 行走 · 靠近物件按 E · 门口离开</small></p>
  </div>;
}
