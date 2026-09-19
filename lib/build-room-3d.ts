import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const themes=[{wall:0x9d6353,floor:0xac754c,accent:0xb15759},{wall:0xc5a268,floor:0xbd9058,accent:0xd7a147},{wall:0x7c9c69,floor:0x9b8c59,accent:0x63854a},{wall:0x8cbbca,floor:0x719ba9,accent:0x739ead},{wall:0xd5bc82,floor:0xc19557,accent:0xd1a054}];
/** 可旋转的实体家具模型，使用圆角和高粗糙度材质表现手捏黏土。 */
export function buildRoom3D(scene:THREE.Scene,index:number){
 const theme=themes[index];
 const materials=new Map<number,THREE.MeshStandardMaterial>();
 const mat=(color:number)=>{if(!materials.has(color))materials.set(color,new THREE.MeshStandardMaterial({color,roughness:.83,metalness:0}));return materials.get(color)!;};
 const add=(parent:THREE.Object3D,geometry:THREE.BufferGeometry,color:number,x:number,y:number,z:number)=>{const m=new THREE.Mesh(geometry,mat(color));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;};
 const box=(p:THREE.Object3D,w:number,h:number,d:number,c:number,x=0,y=0,z=0,r=.08)=>add(p,new RoundedBoxGeometry(w,h,d,2,Math.min(r,w/3,h/3,d/3)),c,x,y,z);
 const ball=(p:THREE.Object3D,r:number,c:number,x=0,y=0,z=0)=>add(p,new THREE.SphereGeometry(r,16,12),c,x,y,z);
 const cylinder=(p:THREE.Object3D,rt:number,rb:number,h:number,c:number,x=0,y=0,z=0)=>add(p,new THREE.CylinderGeometry(rt,rb,h,24),c,x,y,z);
 const room=new THREE.Group();scene.add(room);
 box(room,11.3,.7,11.3,0x776645,0,-.5,0,.25);
 const floor=box(room,10,.15,10,theme.floor,0,-.075,0,.03);
 if(index===3){for(let x=0;x<10;x++)for(let z=0;z<10;z++)box(room,.96,.025,.96,(x+z)%2?0x8ebbc3:0x709eac,x-4.5,.015,z-4.5,.03);}
 else {for(let z=0;z<16;z++)for(let x=0;x<4;x++)box(room,2.45,.035,.59,[theme.floor,0xb48a57,0xc09564][(x+z)%3],x*2.5-3.75,.012,z*.625-4.69,.015);}
 box(room,10.4,2.7,.3,theme.wall,0,1.3,-5.12);
 box(room,.3,2.2,10,theme.wall,-5.12,1.05,0);
 box(room,.3,2.2,10,theme.wall,5.12,1.05,0);
 // 前侧剖切墙与中央门槛，保留视线通透。
 box(room,4.25,.4,.3,0x977149,-2.9,.17,5.1);box(room,4.25,.4,.3,0x977149,2.9,.17,5.1);
 const exit=box(room,1.5,.1,.8,0xe5c989,0,.03,4.75);exit.userData.exit=true;
 for(const x of [-5,0,5])box(room,.2,2.9,.22,0x76522f,x,1.36,-4.9);
 box(room,10.4,.22,.4,0x886235,0,2.68,-5);
 for(const x of [-3.2,0,3.2]){
  box(room,1.55,1.4,.12,0x6b522f,x,1.68,-4.88);
  const glass=box(room,1.25,1.14,.09,0xc8e3bf,x,1.7,-4.79);glass.material=new THREE.MeshStandardMaterial({color:0xc8e3bf,emissive:0xc8dca6,emissiveIntensity:.23,roughness:.35});
  box(room,.075,1.2,.12,0xa78a52,x,1.7,-4.7);box(room,1.32,.075,.12,0xa78a52,x,1.7,-4.7);
  box(room,1.75,.11,.4,0xb18b53,x,1.04,-4.7);
 }
 const table=(p:THREE.Object3D,c=0xa87943)=>{box(p,1.8,.18,1.25,c,0,.88,0);for(const x of [-.68,.68])for(const z of [-.43,.43])box(p,.15,.8,.15,0x865c36,x,.42,z);};
 const pot=(p:THREE.Object3D,x:number,y:number,z:number,scale=1)=>{
  const g=new THREE.Group();g.position.set(x,y,z);g.scale.setScalar(scale);p.add(g);
  cylinder(g,.23,.17,.42,0xb77a4a,0,.21,0);cylinder(g,.24,.24,.09,0xd19b68,0,.42,0);cylinder(g,.20,.2,.025,0x665136,0,.47,0);
  for(let n=0;n<7;n++){const a=n*Math.PI*2/7;const leaf=ball(g,.18,[0x64894c,0x8aac58,0xa2b965][n%3],Math.cos(a)*.18,.68+(n%2)*.13,Math.sin(a)*.18);leaf.scale.set(.65,1.65,.55);leaf.rotation.z=Math.cos(a)*.5;leaf.rotation.x=Math.sin(a)*.5;}
  return g;
 };
 const yarn=(p:THREE.Object3D,x:number,y:number,z:number,c:number)=>{
  ball(p,.24,c,x,y,z);
  for(let n=0;n<5;n++){const ring=add(p,new THREE.TorusGeometry(.225,.016,5,28),c,x,y,z);ring.rotation.set(n*.43,n*.69,n*.35);}
 };
 const mug=(p:THREE.Object3D,x:number,y:number,z:number,c=0xeee0b1)=>{cylinder(p,.13,.11,.24,c,x,y+.12,z);cylinder(p,.11,.11,.012,0x77523b,x,y+.245,z);const h=add(p,new THREE.TorusGeometry(.075,.025,7,16),c,x+.15,y+.13,z);return h;};
 const props:THREE.Group[]=[];
 for(let i=0;i<3;i++){const g=new THREE.Group();g.position.set([-2.8,0,2.8][i],0,-1.8);g.userData.activity=i;room.add(g);props.push(g);}
 if(index===0){
  const g=props[0];for(const x of [-.55,.55]){const leg=box(g,.13,1.8,.15,0x916138,x,.85,0);leg.rotation.z=-x*.2;}box(g,1.6,.12,.35,0x9d7545,0,.8,.05);box(g,1.4,1.25,.12,0xd8b37c,0,1.47,0);box(g,1.19,1.03,.035,0xf4e4b5,0,1.47,.09);
  for(let n=0;n<5;n++){const m=ball(g,.14,[0x799b62,0xddae57,0xb36a66][n%3],-.42+n*.21,1.29+Math.sin(n)*.17,.12);m.scale.z=.12;}
  table(props[1]);for(let n=0;n<6;n++)cylinder(props[1],.12,.12,.035,[0xb95b50,0xe4b755,0x76a673,0x729cad,0xd898a9,0xf0dcc2][n],Math.cos(n)*.42,1.0,Math.sin(n)*.3);cylinder(props[1],.13,.11,.35,0xc3aa77,.5,1.1,0);for(let n=0;n<4;n++){const brush=box(props[1],.025,.55,.025,0x81552f,.43+n*.055,1.4,0);brush.rotation.z=(n-2)*.1;}
  table(props[2]);for(let n=0;n<4;n++){const book=box(props[2],.8,.11,.6,[0xa46356,0x8b9c66,0xd2b883][n%3],0,1+n*.12,0);book.rotation.y=n*.12;}
 }else if(index===1){
  cylinder(props[0],.83,.65,.4,0xb59560,0,.2,0);for(let n=0;n<7;n++)yarn(props[0],Math.cos(n*2.4)*.45,.5+(n%2)*.22,Math.sin(n*2.4)*.4,[0xcc8ba4,0xe3be68,0x87a58b][n%3]);
  table(props[1]);box(props[1],.95,.06,.5,0xe1d0a5,0,1,0);box(props[1],.62,.36,.28,0x736453,0,1.2,0);box(props[1],.16,.25,.2,0x736453,-.25,1.04,0);box(props[1],.7,.025,.8,0xcf9caa,0,.99,.38);yarn(props[1],.6,1.15,.2,0xc585a0);
  box(props[2],1.65,1.55,.78,0xa98250,0,.78,-.1);for(let n=0;n<6;n++){const x=(n%2)*.8-.4,y=.32+Math.floor(n/2)*.43;box(props[2],.71,.34,.2,0xd6b681,x,y,.36);ball(props[2],.055,0x7d613d,x,y,.5);}
 }else if(index===2){for(const [i,g] of props.entries()){table(g,0x928157);for(let n=0;n<4;n++)pot(g,(n%2)*.72-.36,.98,Math.floor(n/2)*.5-.25,.8+(i+n)%3*.15);}}
 else if(index===3){
  const g=props[0];box(g,1.8,.6,1.7,0xf2e6c7,0,.34,0,.22);box(g,1.43,.14,1.35,0x84bdc5,0,.64,0,.2);for(let n=0;n<5;n++){const b=ball(g,.13,0xe2f6e9,Math.sin(n*2)*.5,.75,Math.cos(n*2)*.4);b.material=new THREE.MeshPhysicalMaterial({color:0xe2f6e9,transparent:true,opacity:.55,roughness:.08,metalness:0});}box(g,.09,.5,.09,0xc2a05c,-.72,.85,-.6);box(g,.3,.08,.08,0xc2a05c,-.6,1.08,-.6);
  table(props[1],0xd6c493);const basin=ball(props[1],.51,0xf8efdb,0,1.0,0);basin.scale.set(1,.32,.8);box(props[1],.07,.36,.07,0xc8a567,0,1.15,-.3);box(props[1],.07,.07,.25,0xc8a567,0,1.31,-.21);
  table(props[2],0xc5ac78);for(let n=0;n<3;n++)box(props[2],1.1,.15,.7,[0xdbe4c6,0x9fbdad,0xf1dfb9][n],0,1+n*.16,0);pot(props[2],.6,1.0,-.3,.6);
 }else{
  table(props[0]);cylinder(props[0],.54,.54,.4,0xe8c797,0,1.14,0);cylinder(props[0],.56,.56,.09,0xffeacc,0,1.38,0);for(let n=0;n<6;n++)ball(props[0],.095,0xb75e58,Math.cos(n)*.37,1.49,Math.sin(n)*.37);
  table(props[1]);const teapot=ball(props[1],.26,0xf4dfb0,0,1.21,0);cylinder(props[1],.16,.18,.05,0xc7a879,0,1.43,0);ball(props[1],.055,0xc7a879,0,1.5,0);mug(props[1],-.55,.98,.2);mug(props[1],.55,.98,.2);const spout=cylinder(props[1],.06,.1,.3,0xf4dfb0,.27,1.26,0);spout.rotation.z=-.8;
  box(props[2],1.6,1.65,.7,0xa78655,0,.82,0);for(let n=0;n<3;n++){box(props[2],1.45,.06,.72,0xc49f63,0,.3+n*.48,.03);for(let j=0;j<3;j++)cylinder(props[2],.17,.17,.055,0xf0e5c9,(j-1)*.42,.37+n*.48,.18);}
 }
 // 独立的植物、灯具与柔软地毯建立完整的微缩空间。
 for(const x of [-4.2,4.2])pot(room,x,0,3.55,1.3);
 const rug=cylinder(room,1.35,1.35,.025,theme.accent,0,.035,1.2);rug.scale.z=.7;
 for(let n=0;n<9;n++){const stitch=add(room,new THREE.TorusGeometry(1.1+n*.025,.013,5,64),0xe2c798,0,.058,1.2);stitch.rotation.x=Math.PI/2;stitch.scale.y=.7;}
 for(const x of [-4.4,4.4]){cylinder(room,.13,.13,1.9,0x8c784a,x,.94,-3.9);const shade=cylinder(room,.23,.4,.35,0xeac682,x,1.9,-3.9);shade.material=new THREE.MeshStandardMaterial({color:0xeac682,emissive:0xffcf7b,emissiveIntensity:.5});}
 props.forEach((g,i)=>g.traverse(o=>{o.userData.activity=i;}));
 return {room,floor,exit,props};
}
