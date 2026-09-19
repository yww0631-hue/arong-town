"use client";
import { AnimatePresence, motion, useAnimationFrame, useMotionValue } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import MerchShop from "./MerchShop";
import ClothingShop from "./ClothingShop";
import PhotoStudio from "./PhotoStudio";
import RoomMap from "./RoomMap";
import WalkingArong from "./WalkingArong";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";

const homeRooms = [
  { name: "暮色画室", image: "/images/interior-art.jpg", color: "#993b43", door: .105 },
  { name: "毛线工坊", image: "/images/interior-yarn.jpg", color: "#bc7736", door: .304 },
  { name: "植物温室", image: "/images/interior-green.jpg", color: "#426544", door: .493 },
  { name: "泡泡浴室", image: "/images/interior-bath.jpg", color: "#416385", door: .689 },
  { name: "暖阳餐厅", image: "/images/interior-dining.jpg", color: "#cba569", door: .888 },
];
type Phase = "idle" | "entering" | "town" | "door" | "room" | "boarding" | "riding" | "studio" | "clothing" | "merch";
const clamp = (n:number,a:number,b:number) => Math.max(a,Math.min(b,n));

export default function YarnTown() {
  const [district,setDistrict]=useState<'home'|'shops'>('home');
  const [shop,setShop]=useState<number|null>(null);
  const rooms=district==='home'?homeRooms:[
    {name:'杂货商店',image:'',color:'#598377',door:.223},
    {name:'服装店',image:'',color:'#bb7883',door:.5},
    {name:'照相馆',image:'',color:'#596885',door:.774},
  ];
  const panorama=district==='home'?'/images/yarn-town-pixel.png':'/images/commercial-street.png';
  // 彩蛋只保存在当前浏览器，房间切换、回电视和刷新都不会清空。
  const [collection,setCollection]=useState({knits:0,button:false});
  const [collectionReady,setCollectionReady]=useState(false);
  useEffect(()=>{
    try{const saved=JSON.parse(localStorage.getItem('arong-collection-v1')||'null');
      if(saved&&typeof saved.knits==='number'&&Number.isFinite(saved.knits))setCollection({knits:Math.max(0,Math.min(3,Math.floor(saved.knits))),button:saved.button===true});
    }catch{}setCollectionReady(true);
  },[]);
  useEffect(()=>{if(collectionReady)try{localStorage.setItem('arong-collection-v1',JSON.stringify(collection));}catch{}},[collection,collectionReady]);
  const finishKnitting=()=>setCollection(v=>({...v,knits:Math.min(3,v.knits+1)}));
  const collectButton=()=>setCollection(v=>v.knits>=3?{...v,button:true}:v);
  const [phase,setPhase] = useState<Phase>("idle");
  const [noticeOpen,setNoticeOpen] = useState(false);
  const noticeButton = useRef<HTMLButtonElement>(null);
  const [room,setRoom] = useState<number|null>(null);
  const [hoverDoor,setHoverDoor] = useState<number|null>(null);
  const [selectedDoor,setSelectedDoor] = useState<number|null>(null);
  const [walking,setWalking] = useState(false);
  const [direction,setDirection] = useState(1);
  const [size,setSize] = useState({width:1200,height:800});
  const viewport = useRef<HTMLDivElement>(null);
  const position = useMotionValue(330);
  const camera = useMotionValue(0);
  const target = useRef(330);
  const destination = useRef<number|null>(null);
  const pointer = useRef<number|null>(null);
  const lastMouseMove = useRef(0);
  const pressed = useRef(0);
  const moving = useRef(false);
  const walkSpeed = useRef(0);
  const facing = useRef(1);
  // 世界坐标与镜头坐标分离：角色恒速走动，镜头柔和追随。
  const worldWidth = Math.max(size.width, size.height * 3);
  const worldHeight = worldWidth / 3;
  const ground = size.height * .58;
  const artTop = ground - worldHeight * .73;
  // 以脚底对齐黄色道路，扣除响应式角色高度，避免角色走进前景草地。
  const actorHeight = size.width <= 600 ? 112 : 140;
  const actorTop = artTop + worldHeight * .79 - actorHeight;
  // 从道路脚底走到门槛（画面高度的 68.8%），远处角色缩小到门洞内。
  const doorTravel = worldHeight * (.688 - .79);
  const doorScale = Math.min(.65, worldWidth * .028 / (actorHeight * 120 / 140));
  const stepping = walking || phase === "door" || phase === "boarding";
  // 与入口图片的 object-fit: cover 使用同一坐标，手机裁切后点击仍贴合电视。
  const tvWidth = Math.max(size.width, size.height * 2048 / 1143);
  const tvHeight = tvWidth * 1143 / 2048;
  const tvLeft = (size.width - tvWidth) / 2;
  const tvTop = (size.height - tvHeight) / 2;

  useEffect(()=>{
    const el=viewport.current;
    if(!el)return;
    const update=()=>setSize({width:el.clientWidth,height:el.clientHeight});
    const observer=new ResizeObserver(update); observer.observe(el); update();
    return ()=>observer.disconnect();
  },[]);
  useEffect(()=>{
    const all=["/images/arong-walk-pixel.png","/images/room-maps-pixel-v2.png","/images/yarn-town-pixel.png",...homeRooms.map(r=>r.image),"/images/commercial-street.png","/images/town-van.png","/images/outfit-01-autumn.png"];
    all.forEach(src=>{const image=new Image();image.src=src;});
  },[]);
  useEffect(()=>{
    if(phase!=="entering") return;
    const id=window.setTimeout(()=>setPhase("town"),1900);
    return ()=>clearTimeout(id);
  },[phase]);
  useEffect(()=>{
    if(phase!=="town"||noticeOpen||shop!==null)return;
    const down=(e:KeyboardEvent)=>{
      if(e.key==="ArrowLeft"||e.key==="ArrowRight"){e.preventDefault();pressed.current=e.key==="ArrowLeft"?-1:1;pointer.current=null;}
      if(e.key==="Enter"){
        if(Math.abs(position.get()-worldWidth*.94)<180){goVan();return;}
        const nearest=rooms.reduce((best,r,i)=>Math.abs(r.door*worldWidth-position.get())<Math.abs(rooms[best].door*worldWidth-position.get())?i:best,0);
        goRoom(nearest);
      }
    };
    const up=(e:KeyboardEvent)=>{if(e.key!=="ArrowLeft"&&e.key!=="ArrowRight")return;pressed.current=0;if(destination.current===null)target.current=position.get();};
    window.addEventListener("keydown",down);window.addEventListener("keyup",up);
    return()=>{window.removeEventListener("keydown",down);window.removeEventListener("keyup",up);};
  },[phase,worldWidth,noticeOpen,shop,district]);

  const goRoom=(index:number)=>{
    if(phase!=="town"||noticeOpen||shop!==null)return;
    setSelectedDoor(index);destination.current=index;pointer.current=null;pressed.current=0;
    target.current=rooms[index].door*worldWidth;
  };
  useAnimationFrame((_,delta)=>{
    if(phase!=="town"||noticeOpen||shop!==null)return;
    const dt=Math.min(delta,40)/1000;
    if(destination.current===null){
      // 鼠标停止后取消跟随目标，避免镜头移动让角色继续追赶静止鼠标。
      if(pointer.current!==null&&performance.now()-lastMouseMove.current>140){pointer.current=null;target.current=position.get();}
      if(pressed.current)target.current=position.get()+pressed.current*180;
      else if(pointer.current!==null)target.current=pointer.current-camera.get();
    }
    target.current=clamp(target.current,70,worldWidth-70);
    const diff=target.current-position.get();
    const isMoving=Math.abs(diff)>5;
    walkSpeed.current+=((isMoving?190:0)-walkSpeed.current)*(1-Math.exp(-9*dt));
    if(isMoving!==moving.current){moving.current=isMoving;setWalking(isMoving);}
    if(isMoving){
      const sign=Math.sign(diff);
      if(sign!==facing.current){facing.current=sign;setDirection(sign);}
      position.set(position.get()+sign*Math.min(Math.abs(diff),walkSpeed.current*dt));
    }else if(destination.current!==null){
      position.set(target.current);const arrived=destination.current;destination.current=null;setWalking(false);moving.current=false;walkSpeed.current=0;
      if(arrived===-1){setPhase('boarding');}
      else{setRoom(arrived);setPhase('door');}
    }
    const desired=clamp(size.width*.5-position.get(),size.width-worldWidth,0);
    camera.set(camera.get()+(desired-camera.get())*(1-Math.exp(-4*dt)));
  });
  const goVan=()=>{
    if(phase!=='town'||noticeOpen||shop!==null)return;
    pointer.current=null;pressed.current=0;setSelectedDoor(null);destination.current=-1;target.current=worldWidth*.94;
  };
  useEffect(()=>{
    if(phase!=='boarding')return;
    const timer=setTimeout(()=>setPhase('riding'),1100);return()=>clearTimeout(timer);
  },[phase]);
  useEffect(()=>{
    if(phase!=='riding')return;
    const swap=setTimeout(()=>{
      setDistrict(v=>v==='home'?'shops':'home');setRoom(null);setHoverDoor(null);setSelectedDoor(null);
      position.set(worldWidth*.86);target.current=worldWidth*.86;camera.set(clamp(size.width*.5-worldWidth*.86,size.width-worldWidth,0));
      pointer.current=null;pressed.current=0;destination.current=null;
    },1600);
    const finish=setTimeout(()=>setPhase('town'),2900);
    return()=>{clearTimeout(swap);clearTimeout(finish);};
  },[phase]);
  const openNotice=()=>{
    pointer.current=null;destination.current=null;pressed.current=0;target.current=position.get();
    moving.current=false;setWalking(false);setSelectedDoor(null);setNoticeOpen(true);
  };
  const start=()=>{
    walkSpeed.current=0;position.set(worldWidth*.1);target.current=worldWidth*.1;camera.set(0);
    destination.current=null;pointer.current=null;setRoom(null);setDistrict("home");setPhase("entering");
  };
  const back=()=>{setSelectedDoor(null);setHoverDoor(null);destination.current=null;pointer.current=null;target.current=position.get();setPhase("town");};
  return (
    <main ref={viewport} className="yarn-experience">
      <AnimatePresence>
        {(phase==="idle"||phase==="entering") && (
          <motion.div key="television" className="town-tv" initial={{opacity:1}} animate={{scale:phase==="entering"?3.6:1,opacity:phase==="entering"?0:1,filter:phase==="entering"?"blur(5px)":"blur(0px)"}} transition={{duration:1.9,ease:[.4,0,.15,1]}} style={{transformOrigin:`${tvLeft + tvWidth * .45}px ${tvTop + tvHeight * .47}px`}}>
            <img src="/images/town-tv-v2.png" alt="复古电视机，点击进入毛线小镇" />
            <button className="tv-enter-hit" style={{left:tvLeft+tvWidth*.255,top:tvTop+tvHeight*.135,width:tvWidth*.485,height:tvHeight*.67}} onClick={start} disabled={phase!=="idle"} aria-label="点击电视进入毛线小镇" />
            {phase==="idle"&&<p className="town-invite">点击电视，走进阿绒的小镇</p>}
          </motion.div>
        )}
      </AnimatePresence>

      {phase!=="idle"&&(
        <motion.div className="town-view" initial={{opacity:0,scale:.92}} animate={{opacity:phase==="entering"?0:1,scale:1}} transition={{duration:1.1}}
          onPointerMove={e=>{if(phase==="town"&&!noticeOpen&&shop===null&&e.pointerType==="mouse"&&destination.current===null){pointer.current=e.clientX;lastMouseMove.current=performance.now();}}}
          onPointerLeave={()=>{pointer.current=null;if(destination.current===null)target.current=position.get();}}
          onPointerDown={e=>{if(phase==="town"&&!noticeOpen&&shop===null&&e.pointerType!=="mouse"&&destination.current===null){pointer.current=e.clientX;lastMouseMove.current=Infinity;}}}>
          <motion.div className="town-world" style={{x:camera,width:worldWidth,height:worldHeight,top:artTop}}>
            <img key={district} className="town-panorama" src={panorama} alt={district==='home'?"五座毛线小屋与黄色道路":"商业街上的杂货商店、服装店和照相馆"} draggable={false}/>
            {/* 公告栏与小镇共用世界坐标，镜头移动时仍留在入口路边。 */}
            {district==='home'&&<motion.button ref={noticeButton} className="town-notice" style={{left:worldWidth*.035,top:worldHeight*.79-174}} disabled={phase!=="town"}
              onPointerMove={e=>e.stopPropagation()} onClick={e=>{e.stopPropagation();openNotice();}}
              whileHover={{rotate:-2,y:-3}} whileTap={{scale:.96}} aria-label="打开公告栏，了解阿绒">
              <span className="notice-roof" aria-hidden="true"/>
              <span className="notice-paper"><span className="notice-pin" aria-hidden="true"/><small>小镇公告栏</small><strong>认识阿绒</strong><span className="notice-sketch" aria-hidden="true">✦</span><em>点击翻阅</em></span>
              <span className="notice-post" aria-hidden="true"/>
            </motion.button>}
            <motion.button className="town-van" style={{left:worldWidth*.94,top:worldHeight*.79-Math.min(280,worldWidth*.14)*.53,width:Math.min(280,worldWidth*.14),marginLeft:-Math.min(280,worldWidth*.14)/2}} onClick={e=>{e.stopPropagation();goVan();}} onPointerMove={e=>e.stopPropagation()} disabled={phase!=="town"} aria-label={district==='home'?"乘面包车去商业街":"乘面包车返回小镇"} animate={{x:phase==='riding'?450:0,opacity:phase==='riding'?0:1}} transition={{duration:.8,ease:"easeIn"}}><img src="/images/town-van.png" alt="复古面包车" draggable={false}/><span>{district==='home'?"去商业街 →":"返回小镇 →"}</span></motion.button>
            {rooms.map((r,i)=>(
              <button key={r.name} className="house-door" onPointerEnter={()=>setHoverDoor(i)} onPointerLeave={()=>setHoverDoor(null)} onFocus={()=>setHoverDoor(i)} onBlur={()=>setHoverDoor(null)} style={{left:(r.door*100)+"%",top:"42%",height:"29%"}} onClick={e=>{e.stopPropagation();goRoom(i);}} disabled={phase!=="town"} aria-label={"走进"+r.name}>
                <div className="door-aperture" style={{width:worldWidth*.031,height:worldHeight*.176,top:worldHeight*.092}} aria-hidden="true">
                  <motion.div className="door-light" animate={{opacity:hoverDoor===i||selectedDoor===i?1:0}} transition={{duration:.35}}/>
                  <motion.div className="door-panel" style={{backgroundImage:`url(${panorama})`,backgroundSize:worldWidth+"px "+worldHeight+"px",backgroundPosition:(-worldWidth*(r.door-.0155))+"px "+(-worldHeight*.512)+"px"}} animate={{rotateY:selectedDoor===i?-100:hoverDoor===i?-65:0}} transition={{duration:.65,ease:[.22,1,.36,1]}}/>
                </div>
              </button>
            ))}
          </motion.div>
          <motion.div className="actor-camera" style={{x:camera,top:actorTop}}>
            <motion.div className="town-actor" style={{x:position}}>
              {/* 同一透明立绘拆分上身与双脚，交替迈步；到门口缩小淡入。 */}
              {/* 位移与步态分层：到门前仍交替迈步，走完进门动画才切换房间。 */}
              <motion.div style={{width:"100%",height:"100%",transformOrigin:"50% 100%"}}
                animate={phase==="boarding"?"enterVan":phase==="riding"?"hidden":phase==="door" ? "enterDoor" : phase==="room"||phase==="studio"||phase==="clothing"||phase==="merch" ? "hidden" : "onRoad"}
                variants={{
                  enterVan:{y:[0,-12,-30],scale:[1,.8,.5],opacity:[1,1,0],transition:{duration:1,ease:"easeInOut"}},
                  onRoad:{y:0,scale:1,opacity:1,clipPath:"inset(0% 0% 0% 0%)",transition:{duration:0}},
                  enterDoor:{y:[0,doorTravel*.55,doorTravel,doorTravel-8],scale:[1,.82,doorScale,doorScale*.94],opacity:[1,1,1,0],transition:{duration:1.7,times:[0,.5,.86,1],ease:"linear"}},
                  hidden:{y:doorTravel-8,scale:doorScale*.94,opacity:0,transition:{duration:0}}
                }}
                onAnimationComplete={definition=>{if(definition==="enterDoor"&&phase==="door")setPhase(district==='shops'?(room===0?"merch":room===1?"clothing":"studio"):"room");}}>
              <WalkingArong walking={stepping} direction={direction} facing={phase==="door"||phase==="room"||phase==="boarding"?"away":undefined}/>

              </motion.div>
            </motion.div>
          </motion.div>
          <header className="town-toolbar" onPointerMove={e=>e.stopPropagation()}>
            <button onClick={()=>{pointer.current=null;destination.current=null;setPhase("idle");setRoom(null);setWalking(false);}}>← 返回电视</button>
            <span>{district==='home'?"阿绒的毛线小镇":"阿绒的商业街"}</span>
          </header>
          <div className="town-guide" onPointerMove={e=>e.stopPropagation()}>
            <p>{phase==="boarding"?"阿绒正在上车…":phase==="riding"?"出发啦…":phase==="door"?"阿绒正在走进小屋…":destination.current===-1?"阿绒正在走向面包车…":destination.current!==null?"阿绒正在走向木屋…":district==='home'?"左右移动鼠标散步 · 道路右端可乘车去商业街":"左右移动鼠标逛街 · 点击店铺看看 · 右端乘车返回"}</p>
          </div>
        </motion.div>
      )}
      <AnimatePresence>
        {phase==="room"&&room!==null&&(
          <motion.section key={"room-"+room} className="town-interior" style={{background:"radial-gradient(ellipse at center,"+rooms[room].color+" 0%, #1b1512 85%)"}} initial={{opacity:0,scale:1.08,filter:"blur(9px)"}} animate={{opacity:1,scale:1,filter:"blur(0px)"}} exit={{opacity:0,scale:1.04}} transition={{duration:.8,ease:"easeOut"}}>
            <header><button onClick={back}>← 返回小镇</button></header>
            <RoomMap index={room} onExit={back} knitCount={collection.knits} buttonCollected={collection.button} onKnitted={finishKnitting} onCollectButton={collectButton}/>
          </motion.section>
        )}
      </AnimatePresence>
      <AnimatePresence>{phase==='riding'&&<motion.div className="van-journey" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:.45}} aria-live="polite">
        <motion.img src="/images/commercial-street.png" className="journey-background" alt="" animate={{x:['0%','-15%']}} transition={{duration:3,ease:'linear'}}/>
        <motion.img className="journey-van" src="/images/town-van.png" alt="面包车载着阿绒驶向另一条街道" initial={{x:'-80vw'}} animate={{x:['-80vw','0vw','80vw'],y:[0,-3,0,-3,0]}} transition={{x:{duration:2.8,times:[0,.5,1]},y:{duration:.35,repeat:7}}}/>
        <p>沿着小路，去下一条街…</p>
      </motion.div>}</AnimatePresence>
      <AnimatePresence>{phase==='merch'&&<motion.div className="studio-layer" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:.55}}><MerchShop onExit={back}/></motion.div>}</AnimatePresence>
      <AnimatePresence>{phase==='clothing'&&<motion.div className="studio-layer" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:.55}}><ClothingShop onExit={back}/></motion.div>}</AnimatePresence>
      <AnimatePresence>{phase==='studio'&&<motion.div className="studio-layer" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:.55}}><PhotoStudio onExit={back}/></motion.div>}</AnimatePresence>
      <Dialog open={shop!==null} onOpenChange={open=>{if(!open){setShop(null);pointer.current=null;pressed.current=0;target.current=position.get();}}}>
        <DialogContent className="street-shop-dialog"><DialogTitle>{shop!==null?rooms[shop]?.name:''}</DialogTitle><DialogDescription>{shop===0?'木架上摆着日用品、毛线和旧物，橱窗里藏着小镇的日常。':shop===1?'粉色遮阳篷下，橱窗陈列着针织衣服和围巾。': '深蓝色招牌下挂着相机，橱窗展示着小镇的照片。'}</DialogDescription><DialogClose>继续逛街 →</DialogClose></DialogContent>
      </Dialog>
      <Dialog open={noticeOpen} onOpenChange={open=>{setNoticeOpen(open);pointer.current=null;pressed.current=0;target.current=position.get();}}>
        <DialogContent className="arong-notice-dialog" showCloseButton={false} onCloseAutoFocus={e=>{e.preventDefault();noticeButton.current?.focus();}}>
          <DialogClose className="notice-close" aria-label="关闭公告栏">×</DialogClose>
          <div className="notice-profile">
            <img src="/images/outfit-01-autumn.png" alt="粉色头发、穿蓝色针织外套的阿绒"/>
            <div><span className="notice-eyebrow">HI ARONG · 小镇居民档案</span><DialogTitle>你好，我是阿绒</DialogTitle>
              <DialogDescription>一只在针线盒里诞生的小困鼠。</DialogDescription>
              <p>喜欢收集旧物，也害怕被遗忘。欢迎来到我的毛线小镇，陪我慢慢走一走。</p>
            </div>
          </div>
          <section className="notice-collection" aria-label="阿绒的小收藏">
            <h3>阿绒的小收藏</h3>
            {collection.button?<div className="collection-item"><figure className="collection-specimen"><img src="/images/old-button-pixel.png" alt="有四个扣眼、磨损木纹和残留粉色缝线的旧纽扣"/><figcaption>旧物 · 001</figcaption></figure><div className="collection-description"><span className="collection-origin">发现于 · 毛线工坊</span><strong>一颗旧纽扣</strong><p>边缘磨得圆圆的，四个扣眼里还牵着一截褪色的粉线。</p><p>也许它曾陪着一件旧毛衣，度过了许多个冬天。</p><small>阿绒轻轻收好它：<br/>“原来你躲在这里。”</small></div></div>:<p>还没有找到旧物。去毛线工坊坐坐吧，多织一会儿，也许会有小发现。</p>}
          </section>
          <details className="notice-story"><summary>翻阅阿绒的完整故事与作品</summary><img src="/images/arong-story-board.png" alt="阿绒角色介绍、形象设定与作品展板" loading="lazy"/></details>
          <DialogClose className="notice-return">收好档案，继续逛小镇 →</DialogClose>
        </DialogContent>
      </Dialog>
    </main>
  );
}

