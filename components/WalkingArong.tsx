"use client";
import { useAnimationFrame } from "framer-motion";
import { useEffect, useRef } from "react";
import {useOutfit,outfits} from "./OutfitContext";
export type ArongFacing = "right" | "left" | "away" | "front";
const rows:Record<ArongFacing,number>={right:0,left:1,away:2,front:3};

const decoded=new Map<string,HTMLCanvasElement[]>();

/** 纯 Canvas 2D 像素动作帧；逐帧计算脚底锚点，走路不漂移。 */
export default function WalkingArong({walking,direction=1,facing,frameDuration=135,outfit:override}:{outfit?:string;walking:boolean;direction?:number;facing?:ArongFacing;frameDuration?:number}){
 const {outfit}=useOutfit();
 const spriteSource=outfits.find(o=>o.id===(override??outfit))?.src??outfits[0].src;
 const canvas=useRef<HTMLCanvasElement>(null),frames=useRef<HTMLCanvasElement[]>([]);
 const clock=useRef(0),frame=useRef(0);
 useEffect(()=>{
  const cached=decoded.get(spriteSource);if(cached){frames.current=cached;return;}
  let disposed=false;const image=new Image();
  image.onload=()=>{
   if(disposed)return;
   const atlas=document.createElement('canvas');atlas.width=image.width;atlas.height=image.height;
   const ctx=atlas.getContext('2d');if(!ctx)return;ctx.drawImage(image,0,0);
   const cw=image.width/6,ch=image.height/4,result:HTMLCanvasElement[]=[];
   for(let row=0;row<4;row++)for(let col=0;col<6;col++){
    const pixels=ctx.getImageData(col*cw,row*ch,cw,ch);
    // 衣服动作图外围是平滑底色，沿格子边缘泛洪到深色像素轮廓即停止。
    // 只在显示时透明化背景，保留原始素材和角色内部的肤色、衣服。
    if(spriteSource===outfits[1].src||spriteSource===outfits[2].src){
     const visited=new Uint8Array(cw*ch),queue:number[]=[];
     const offer=(at:number,from?:number)=>{if(at<0||at>=visited.length||visited[at])return;const k=at*4,d=pixels.data;if(from!==undefined){const f=from*4;if(Math.max(Math.abs(d[k]-d[f]),Math.abs(d[k+1]-d[f+1]),Math.abs(d[k+2]-d[f+2]))>14)return;}if(d[k]<100&&d[k+1]<80&&d[k+2]<80)return;visited[at]=1;queue.push(at);};
     for(let x=0;x<cw;x++){offer(x);offer((ch-1)*cw+x);}for(let y=0;y<ch;y++){offer(y*cw);offer(y*cw+cw-1);}
     for(let n=0;n<queue.length;n++){const at=queue[n],x=at%cw,y=Math.floor(at/cw);pixels.data[at*4+3]=0;if(x>0)offer(at-1,at);if(x<cw-1)offer(at+1,at);if(y>0)offer(at-cw,at);if(y<ch-1)offer(at+cw,at);}
    }
    let minX=cw,maxX=0,minY=ch,maxY=0;
    for(let y=0;y<ch;y++)for(let x=0;x<cw;x++){
     const k=(y*cw+x)*4,d=pixels.data;
     // 在渲染阶段去除色键，不把绿色或棋盘背景带进游戏。
     if(d[k+1]-Math.max(d[k],d[k+2])>35){d[k+3]=0;continue;}
     if(d[k+3]>128){minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);}
    }
    // 清掉相邻行伸入当前格子的零碎像素，只保留主体连通区域。
    const seen=new Uint8Array(cw*ch);let largest:number[]=[];
    for(let seed=0;seed<seen.length;seed++){
     if(seen[seed]||pixels.data[seed*4+3]===0)continue;
     const part=[seed];seen[seed]=1;
     for(let n=0;n<part.length;n++){
      const at=part[n],x=at%cw,y=Math.floor(at/cw);
      for(const next of [x>0?at-1:-1,x<cw-1?at+1:-1,y>0?at-cw:-1,y<ch-1?at+cw:-1]){
       if(next>=0&&!seen[next]&&pixels.data[next*4+3]>0){seen[next]=1;part.push(next);}
      }
     }
     if(part.length>largest.length)largest=part;
    }
    const keep=new Uint8Array(cw*ch);minX=cw;maxX=0;maxY=0;
    for(const at of largest){keep[at]=1;minX=Math.min(minX,at%cw);maxX=Math.max(maxX,at%cw);maxY=Math.max(maxY,Math.floor(at/cw));}
    for(let at=0;at<keep.length;at++)if(!keep[at])pixels.data[at*4+3]=0;
    const source=document.createElement('canvas');source.width=cw;source.height=ch;
    source.getContext('2d')!.putImageData(pixels,0,0);
    const tile=document.createElement('canvas');tile.width=256;tile.height=256;
    const paint=tile.getContext('2d')!;paint.imageSmoothingEnabled=false;
    // 同一比例，只移动对齐，不按帧缩放，保持头部大小稳定。
    const scale=.86*256/cw;
    paint.drawImage(source,Math.round(128-(minX+maxX)/2*scale),Math.round(238-maxY*scale),cw*scale,ch*scale);result.push(tile);
   }
   decoded.set(spriteSource,result);frames.current=result;
  };
  image.src=spriteSource;
  return()=>{disposed=true;frames.current=[];};
 },[spriteSource]);
 useAnimationFrame((_,delta)=>{
  if(walking||frame.current%3!==0){clock.current+=Math.min(delta,50);if(clock.current>=frameDuration){clock.current-=frameDuration;frame.current=(frame.current+1)%6;}}
  else clock.current=0;
  const standing=!walking&&frame.current%3===0;
  const row=standing?rows.front:rows[facing??(direction<0?'left':'right')];
  const sprite=frames.current[row*6+(standing?0:frame.current)];
  const ctx=canvas.current?.getContext('2d');if(!ctx||!sprite)return;
  ctx.imageSmoothingEnabled=false;ctx.clearRect(0,0,256,256);ctx.drawImage(sprite,0,0);
 });
 return <div className="natural-arong" role="img" aria-label={walking?'阿绒正在走动':'阿绒'}><span className="arong-ground-shadow"/><canvas className="arong-walk-canvas" ref={canvas} width={256} height={256} aria-hidden="true"/></div>;
}
