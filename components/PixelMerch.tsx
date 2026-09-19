"use client";
import {useEffect,useRef} from 'react';
/** 货架仅显示像素物件；点击后的详情使用未经修改的用户原图。 */
export default function PixelMerch({index}:{index:number}){
 const ref=useRef<HTMLCanvasElement>(null);
 useEffect(()=>{let cancelled=false;const img=new Image();img.onload=()=>{if(cancelled)return;const canvas=ref.current;if(!canvas)return;const ctx=canvas.getContext('2d');if(!ctx)return;
 const bounds=[[20,175,400,520],[420,235,390,480],[870,135,320,580],[1190,235,415,480],[1660,100,285,625]][index];const [x,y,w,h]=bounds;
 ctx.imageSmoothingEnabled=false;ctx.clearRect(0,0,256,256);const scale=Math.min(256/w,256/h);ctx.drawImage(img,x,y,w,h,(256-w*scale)/2,256-h*scale,w*scale,h*scale);};img.src='/images/merch-pixels.png';return()=>{cancelled=true;};},[index]);
 return <canvas ref={ref} width={256} height={256} aria-hidden="true"/>;
}
