"use client";
import {useState} from "react";
import WalkingArong,{type ArongFacing} from "@/components/WalkingArong";
export default function MotionPreview(){
 const [playing,setPlaying]=useState(true),[speed,setSpeed]=useState(135),[backdrop,setBackdrop]=useState("#466440");
 const directions:[ArongFacing,string][]=[["right","向右走"],["left","向左走"],["away","走向屋内"],["front","走向门口"]];
 return <main className="motion-review"><a href="/">← 返回小镇</a><h1>阿绒 · 立体动作预览</h1><p>四个方向，陪你走进毛线小镇。</p>
 <div className="motion-review-controls"><button onClick={()=>setPlaying(v=>!v)}>{playing?"暂停":"播放"}</button><label>速度 <select value={speed} onChange={e=>setSpeed(Number(e.target.value))}><option value={180}>慢速</option><option value={135}>适中</option><option value={100}>快速</option></select></label><label>背景 <select value={backdrop} onChange={e=>setBackdrop(e.target.value)}><option value="#466440">草地绿</option><option value="#a1764e">暖木色</option><option value="#211b24">深色</option><option value="#f8e9d5">浅色</option></select></label></div>
 <div className="motion-review-grid">{directions.map(([facing,label])=><section key={facing} style={{background:backdrop}}><div className="motion-review-actor"><WalkingArong walking={playing} facing={facing} frameDuration={speed}/></div><h2>{label}</h2></section>)}</div>
 </main>;
}
