"use client";
import {useEffect,useRef,useState} from 'react';
import * as THREE from 'three';
import {buildRoom3D} from '@/lib/build-room-3d';
import {createArong3D} from '@/lib/arong-3d';
import {canWalk,findRoute,type Point} from '@/lib/room-navigation';
import RoomMap from './RoomMap';

const actions=[['画一幅画','调配颜色','翻看画册'],['挑选毛线','织围巾','整理针线'],['给植物浇水','照顾新芽','点亮温室'],['吹泡泡','洗洗小手','整理浴巾'],['尝尝蛋糕','泡一杯茶','整理餐具']];
const messages=[['新的一笔，留住今天的好心情。','调出了喜欢的颜色。','又发现了一个小小的灵感。'],['这团毛线软软的。','围巾又长了一小段。','旧纽扣也收好啦。'],['植物喝饱水啦。','新叶轻轻摇了摇。','温室暖暖地亮起来。'],['泡泡飞起来了。','洗去一天的小疲惫。','浴巾叠得软软的。'],['甜甜的蛋糕，分你一口。','热茶泡好了。','喜欢的杯子都放整齐了。']];
export default function Room3D({index,onExit}:{index:number;onExit:()=>void}){
 const host=useRef<HTMLDivElement>(null),command=useRef<(action:string,n?:number)=>void>(()=>{});
 const [failed,setFailed]=useState(false),[message,setMessage]=useState('点击地板走动，点击物件走近互动'),[active,setActive]=useState<number|null>(null);
 useEffect(()=>{
  const el=host.current;if(!el)return;
  let renderer:THREE.WebGLRenderer;
  try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});}catch{setFailed(true);return;}
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;
  el.appendChild(renderer.domElement);renderer.domElement.tabIndex=0;renderer.domElement.setAttribute('aria-label','三维房间：点击行走，拖动旋转，滚轮缩放');
  const scene=new THREE.Scene();scene.background=new THREE.Color([0xd8cbb4,0xd9d0ad,0xc5d5b4,0xc0d6d4,0xe1d6b9][index]);
  const camera=new THREE.PerspectiveCamera(38,1,.1,100);
  scene.add(new THREE.HemisphereLight(0xfff2d6,0x7b8965,2.4));
  const sun=new THREE.DirectionalLight(0xffe3b2,3.4);sun.position.set(-5,12,6);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-8;sun.shadow.camera.right=8;sun.shadow.camera.top=8;sun.shadow.camera.bottom=-8;sun.shadow.normalBias=.025;sun.shadow.bias=-.0004;sun.shadow.radius=4;scene.add(sun);
  const fill=new THREE.DirectionalLight(0xd9e8ff,.8);fill.position.set(6,7,-5);scene.add(fill);
  const {props,exit}=buildRoom3D(scene,index);
  const roomGlow=new THREE.PointLight(0xffd188,0,9,2);roomGlow.position.set(2.8,2.5,-1.8);scene.add(roomGlow);
  const character=createArong3D();const actor=character.root;scene.add(actor);
  const shadow=new THREE.Mesh(new THREE.CircleGeometry(.28,32),new THREE.MeshBasicMaterial({color:0x554433,transparent:true,opacity:.20,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.position.y=.055;scene.add(shadow);
  const destinationMarker=new THREE.Mesh(new THREE.RingGeometry(.10,.14,32),new THREE.MeshBasicMaterial({color:0xffefb1,side:THREE.DoubleSide}));destinationMarker.rotation.x=-Math.PI/2;destinationMarker.position.y=.055;destinationMarker.visible=false;scene.add(destinationMarker);
  const sparkleMaterial=new THREE.MeshStandardMaterial({color:index===3?0xc6f4f4:0xf9d38b,emissive:index===3?0x86adbb:0x8b5d29,emissiveIntensity:.3,transparent:true,opacity:.8,roughness:.22});
  const particles=Array.from({length:12},()=>{const m=new THREE.Mesh(new THREE.SphereGeometry(index===3?.11:.045,10,8),sparkleMaterial);m.visible=false;scene.add(m);return m;});
  const pos:Point={x:500,y:825};let route:Point[]=[],pending:number|null=null,speed=0,effect=-1,effectUntil=0,glow=false;
  const keys=new Set<string>();let yaw=.25,targetYaw=.25,elevation=.82,targetElevation=.82,distance=18,targetDistance=18,dragging=false,downX=0,downY=0,lastX=0,lastY=0,disposed=false;
  const ray=new THREE.Raycaster(),plane=new THREE.Plane(new THREE.Vector3(0,1,0),0),hit=new THREE.Vector3();
  const act=(i:number)=>{
    pending=null;destinationMarker.visible=false;
    if(i===3){onExit();return;}
    effect=i;effectUntil=performance.now()+2200;setActive(i);setMessage(messages[index][i]);
    if(index===2&&i===2){glow=!glow;roomGlow.intensity=glow?12:0;}
  };
  const go=(goal:Point,action:number|null=null)=>{
    if(!canWalk(goal)){setMessage('这里有家具，试试旁边的空地');return;}
    const path=findRoute(pos,goal);if(!path.length){setMessage('这边走不过去，换一处空地试试');return;}
    route=path;pending=action;keys.clear();destinationMarker.position.set(goal.x/100-5,.055,goal.y/100-5);destinationMarker.visible=true;setMessage(action===3?'走到门口，回小镇看看':action!==null?'阿绒正走过去…':'慢慢走，不着急');
  };
  command.current=(action,n=0)=>{if(action==='interact')go({x:[220,500,780][n],y:500},n);if(action==='left')targetYaw-=.3;if(action==='right')targetYaw+=.3;if(action==='reset'){targetYaw=.25;targetElevation=.82;targetDistance=18;}if(action==='exit')go({x:500,y:875},3);};
  const down=(e:PointerEvent)=>{downX=lastX=e.clientX;downY=lastY=e.clientY;dragging=false;renderer.domElement.setPointerCapture(e.pointerId);renderer.domElement.focus();};
  const move=(e:PointerEvent)=>{if(!renderer.domElement.hasPointerCapture(e.pointerId))return;if(Math.hypot(e.clientX-downX,e.clientY-downY)>6)dragging=true;if(dragging){targetYaw+=(e.clientX-lastX)*.007;targetElevation=THREE.MathUtils.clamp(targetElevation+(e.clientY-lastY)*.005,.48,1.3);}lastX=e.clientX;lastY=e.clientY;};
  const up=(e:PointerEvent)=>{
    if(renderer.domElement.hasPointerCapture(e.pointerId))renderer.domElement.releasePointerCapture(e.pointerId);
    if(dragging)return;const rect=renderer.domElement.getBoundingClientRect();ray.setFromCamera(new THREE.Vector2((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1),camera);
    const objects=ray.intersectObjects([...props,exit],true);if(objects.length){const object=objects[0].object;if(object.userData.exit){go({x:500,y:875},3);return;}const i=object.userData.activity;if(typeof i==='number'){go({x:[220,500,780][i],y:500},i);return;}}
    if(ray.ray.intersectPlane(plane,hit))go({x:(hit.x+5)*100,y:(hit.z+5)*100});
  };
  const wheel=(e:WheelEvent)=>{e.preventDefault();targetDistance=THREE.MathUtils.clamp(targetDistance+e.deltaY*.009,12,26);};
  const keydown=(e:KeyboardEvent)=>{const key=e.key.toLowerCase();if(['arrowleft','arrowright','arrowup','arrowdown','w','a','s','d'].includes(key)){e.preventDefault();keys.add(key);route=[];pending=null;destinationMarker.visible=false;}if(key==='e'){const i=[220,500,780].findIndex(x=>Math.hypot(pos.x-x,pos.y-500)<100);if(i>=0)act(i);}};
  const keyup=(e:KeyboardEvent)=>keys.delete(e.key.toLowerCase());const blur=()=>keys.clear();
  renderer.domElement.addEventListener('pointerdown',down);renderer.domElement.addEventListener('pointermove',move);renderer.domElement.addEventListener('pointerup',up);renderer.domElement.addEventListener('wheel',wheel,{passive:false});renderer.domElement.addEventListener('keydown',keydown);window.addEventListener('keyup',keyup);window.addEventListener('blur',blur);
  const resize=()=>{const w=el.clientWidth,h=el.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();};const observer=new ResizeObserver(resize);observer.observe(el);resize();

  let previous=performance.now();
  renderer.setAnimationLoop(()=>{
    if(disposed)return;const now=performance.now(),dt=Math.min((now-previous)/1000,.04);previous=now;
    yaw+=(targetYaw-yaw)*Math.min(1,dt*9);elevation+=(targetElevation-elevation)*Math.min(1,dt*9);distance+=(targetDistance-distance)*Math.min(1,dt*9);
    // 开口始终朝向观察者，允许左右旋转，避免后墙遮住角色。
    targetYaw=THREE.MathUtils.clamp(targetYaw,-.95,.95);
    const responsiveDistance=distance*Math.max(1,.85/camera.aspect);
    camera.position.set(Math.sin(yaw)*Math.cos(elevation)*responsiveDistance,Math.sin(elevation)*responsiveDistance,Math.cos(yaw)*Math.cos(elevation)*responsiveDistance);camera.lookAt(0,.25,0);
    let dx=0,dy=0;
    if(keys.size){const a=Number(keys.has('d')||keys.has('arrowright'))-Number(keys.has('a')||keys.has('arrowleft')),b=Number(keys.has('s')||keys.has('arrowdown'))-Number(keys.has('w')||keys.has('arrowup'));dx=a*Math.cos(yaw)+b*Math.sin(yaw);dy=-a*Math.sin(yaw)+b*Math.cos(yaw);}
    else{while(route.length&&Math.hypot(route[0].x-pos.x,route[0].y-pos.y)<3)route.shift();if(route[0]){dx=route[0].x-pos.x;dy=route[0].y-pos.y;}}
    const length=Math.hypot(dx,dy);speed+=((length>.1?145:0)-speed)*(1-Math.exp(-10*dt));let moving=false;
    if(length>.1){const step=Math.min(speed*dt,keys.size?Infinity:length);const next={x:pos.x+dx/length*step,y:pos.y+dy/length*step};if(canWalk(next)){pos.x=next.x;pos.y=next.y;moving=true;}

    }else if(pending!==null&&!keys.size)act(pending);else destinationMarker.visible=false;
    // 真实三维关节动画：移动时朝路线方向转身，站立时朝向观察者。
    character.update(dt,moving,moving?Math.atan2(dx,dy):yaw,effect>=0);
    actor.position.set(pos.x/100-5,.06,pos.y/100-5);shadow.position.set(actor.position.x,.055,actor.position.z);
    if(keys.size&&pos.y>875&&Math.abs(pos.x-500)<60){keys.clear();onExit();}
    if(effect>=0){const progress=1-(effectUntil-now)/2200;if(progress>=1){props[effect].rotation.y=0;props[effect].scale.setScalar(1);effect=-1;setActive(null);particles.forEach(p=>p.visible=false);}
      else{props[effect].rotation.y=Math.sin(progress*Math.PI*4)*.035;props[effect].scale.setScalar(1+Math.sin(progress*Math.PI)*.018);particles.forEach((p,i)=>{p.visible=true;p.position.set([-2.8,0,2.8][effect]+Math.sin(i*2.4)*.5,1.2+((progress+i/12)%1)*1.5,-1.8+Math.cos(i*2.4)*.4);p.scale.setScalar(Math.sin(progress*Math.PI));});}}
    renderer.render(scene,camera);
  });
  return()=>{disposed=true;command.current=()=>{};renderer.setAnimationLoop(null);observer.disconnect();window.removeEventListener('keyup',keyup);window.removeEventListener('blur',blur);renderer.domElement.removeEventListener('pointerdown',down);renderer.domElement.removeEventListener('pointermove',move);renderer.domElement.removeEventListener('pointerup',up);renderer.domElement.removeEventListener('wheel',wheel);renderer.domElement.removeEventListener('keydown',keydown);scene.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();const materials=Array.isArray(o.material)?o.material:[o.material];materials.forEach(m=>m.dispose());}});renderer.dispose();renderer.domElement.remove();};
 },[index]);
 if(failed)return <RoomMap index={index} onExit={onExit}/>;
 return <div className="real-room-shell"><div className="real-room-canvas" ref={host}/><div className="room-camera-buttons"><button onClick={()=>command.current('left')} aria-label="向左旋转">↶</button><button onClick={()=>command.current('reset')}>恢复视角</button><button onClick={()=>command.current('right')} aria-label="向右旋转">↷</button></div><div className="real-room-footer"><p role="status">{message}</p><small>点击地板行走 · 拖动观察 · 滚轮缩放 · 方向键 / WASD</small><div>{actions[index].map((a,i)=><button key={a} aria-pressed={active===i} onClick={()=>command.current('interact',i)}>{a}</button>)}<button onClick={()=>command.current('exit')}>走到门口离开</button></div></div></div>;
}
