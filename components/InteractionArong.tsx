"use client";
import {useEffect,useRef} from 'react';
import {useAnimationFrame} from 'framer-motion';

/** 五组道具动作。整张图预载，播放时不请求新图片；保留水滴和泡泡。 */
export default function InteractionArong({room,playing,cycle,leftward}:{room:number;playing:boolean;cycle:number;leftward:boolean}){
 const canvas=useRef<HTMLCanvasElement>(null),tiles=useRef<HTMLCanvasElement[]>([]),elapsed=useRef(0);
 useEffect(()=>{elapsed.current=0;},[cycle]);
 useEffect(()=>{
  let cancelled=false;const image=new Image();
  image.onload=()=>{
   if(cancelled)return;
   const source=document.createElement('canvas');source.width=image.width;source.height=image.height;
   const ctx=source.getContext('2d')!;ctx.drawImage(image,0,0);
   const cw=Math.floor(image.width/4),ch=Math.floor(image.height/5),result:HTMLCanvasElement[]=[];
   for(let row=0;row<5;row++)for(let col=0;col<4;col++){
    const data=ctx.getImageData(col*cw,row*ch,cw,ch);let minHair=cw,maxHair=0,feet=0;
    for(let y=0;y<ch;y++)for(let x=0;x<cw;x++){
     const k=(y*cw+x)*4,d=data.data;
     if(d[k+1]-Math.max(d[k],d[k+2])>35){d[k+3]=0;continue;}
     if(y<ch*.58&&d[k]>180&&d[k+1]<170&&d[k+2]>85){minHair=Math.min(minHair,x);maxHair=Math.max(maxHair,x);}
     if(d[k]>190&&d[k+1]>155&&d[k+2]>110&&d[k]>d[k+1]&&d[k+1]>d[k+2])feet=Math.max(feet,y);
    }
    const raw=document.createElement('canvas');raw.width=cw;raw.height=ch;raw.getContext('2d')!.putImageData(data,0,0);
    const tile=document.createElement('canvas');tile.width=256;tile.height=256;
    const paint=tile.getContext('2d')!;paint.imageSmoothingEnabled=false;
    const scale=210/ch;paint.drawImage(raw,128-(minHair+maxHair)/2*scale,238-feet*scale,cw*scale,ch*scale);result.push(tile);
   }
   tiles.current=result;
  };image.src='/images/arong-interactions.png';return()=>{cancelled=true;tiles.current=[];};
 },[]);
 useAnimationFrame((_,delta)=>{
  if(!playing)return;elapsed.current+=Math.min(delta,50);
  // 来回完成两轮动作，最后停在收手帧；总时长由房间状态统一管理。
  const order=[0,1,2,1,2,3,0,1,2,1,2,3];
  const frame=order[Math.min(order.length-1,Math.floor(elapsed.current/220))];
  const tile=tiles.current[room*4+frame],ctx=canvas.current?.getContext('2d');if(!ctx||!tile)return;
  ctx.clearRect(0,0,256,256);ctx.imageSmoothingEnabled=false;ctx.drawImage(tile,0,0);
 });
 return <canvas ref={canvas} width={256} height={256} className="arong-walk-canvas" style={{opacity:playing?1:0,transform:`translateX(-50%) scaleX(${leftward?-1:1})`}} aria-hidden="true"/>;
}
