import * as THREE from 'three';

/** 三视图特征的程序化立体重建：独立头部、躯干、四肢和围巾关节。 */
export function createArong3D(){
 const root=new THREE.Group();root.name='Arong-3D';
 const rig=new THREE.Group();root.add(rig);
 const skin=new THREE.MeshStandardMaterial({color:0xffe1ce,roughness:.72});
 const pink=new THREE.MeshStandardMaterial({color:0xeaa0ad,roughness:.66});
 const cream=new THREE.MeshStandardMaterial({color:0xffdace,roughness:.72});
 const brown=new THREE.MeshStandardMaterial({color:0x796657,roughness:.95});
 const eyes=new THREE.MeshStandardMaterial({color:0x48312e,roughness:.53});
 const white=new THREE.MeshStandardMaterial({color:0xfff6e8,roughness:.64});
 const mesh=(parent:THREE.Object3D,geometry:THREE.BufferGeometry,material:THREE.Material,x=0,y=0,z=0)=>{const m=new THREE.Mesh(geometry,material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;};
 const ellipsoid=(p:THREE.Object3D,material:THREE.Material,x:number,y:number,z:number,sx:number,sy:number,sz:number)=>{const m=mesh(p,new THREE.SphereGeometry(1,48,32),material,x,y,z);m.scale.set(sx,sy,sz);return m;};
 ellipsoid(rig,skin,0,.47,0,.265,.29,.225);
 const head=new THREE.Group();head.position.set(0,1.10,0);rig.add(head);
 // 厚实的圆角挤出发型：双顶瓣、右侧缺口与两侧大卷保留同一固定几何。
 const hair=new THREE.Shape();hair.moveTo(0,.43);
 hair.bezierCurveTo(-.2,.75,-.64,.63,-.58,.28);
 hair.bezierCurveTo(-.67,.22,-.85,-.08,-.73,-.30);
 hair.bezierCurveTo(-.63,-.48,-.39,-.43,-.32,-.31);
 hair.bezierCurveTo(-.14,-.44,.14,-.44,.32,-.31);
 hair.bezierCurveTo(.45,-.46,.73,-.43,.77,-.22);
 hair.bezierCurveTo(.82,-.02,.65,.23,.59,.28);
 hair.bezierCurveTo(.69,.29,.72,.37,.62,.38);
 hair.bezierCurveTo(.53,.39,.56,.48,.65,.48);
 hair.bezierCurveTo(.59,.69,.20,.73,0,.43);
 // 将固定轮廓包成连续的圆润体积；前后共用同一轮廓，转身不会换发型。
 const outline=hair.getSpacedPoints(192);outline.pop();
 const positions:number[]=[],indices:number[]=[];
 const count=outline.length, rings=48;
 for(let j=0;j<=rings;j++){
  const angle=Math.PI*j/rings,r=Math.sin(angle);
  for(const p of outline)positions.push(p.x*r,.08+(p.y-.08)*r,-.02+Math.cos(angle)*.43);
 }
 for(let j=0;j<rings;j++)for(let i=0;i<count;i++){
  const a=j*count+i,b=j*count+(i+1)%count,c=a+count,d=b+count;
  indices.push(a,b,c,b,d,c);
 }
 const hairGeometry=new THREE.BufferGeometry();
 hairGeometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
 hairGeometry.setIndex(indices);hairGeometry.computeVertexNormals();
 // Shape 的轮廓方向决定三角面朝向，统一保证法线向外。
 const normal=hairGeometry.getAttribute('normal');
 if(normal.getZ(count)<0){for(let i=0;i<indices.length;i+=3)[indices[i+1],indices[i+2]]=[indices[i+2],indices[i+1]];hairGeometry.setIndex(indices);hairGeometry.computeVertexNormals();}
 mesh(head,hairGeometry,pink).name='连续圆润发型';
 ellipsoid(head,skin,0,-.15,.285,.465,.345,.29);
 // 前额刘海连接顶部与脸缘，保留中央下垂的双小瓣。
 const fringe=new THREE.Shape();fringe.moveTo(-.30,.29);
 fringe.bezierCurveTo(-.18,.39,.18,.39,.30,.29);
 fringe.bezierCurveTo(.22,.25,.16,.16,.14,.075);
 fringe.bezierCurveTo(.13,.015,.075,.02,.06,.045);
 fringe.bezierCurveTo(.02,.002,-.075,.015,-.085,.06);
 fringe.bezierCurveTo(-.09,.17,-.16,.22,-.30,.29);
 const fringeGeometry=new THREE.ExtrudeGeometry(fringe,{depth:.035,bevelEnabled:true,bevelThickness:.045,bevelSize:.025,bevelSegments:8,curveSegments:32});
 mesh(head,fringeGeometry,pink,0,0,.465);
 // 所有面部细节沿面部曲面放置，避免眼睛与雀斑悬空。
 const faceZ=(x:number,y:number)=>.285+.29*Math.sqrt(Math.max(0,1-(x/.465)**2-((y+.15)/.345)**2));
 for(const sign of [-1,1]){
  ellipsoid(head,skin,sign*.445,-.205,.31,.112,.102,.115);
  const eyeX=sign*.17,eyeY=-.185,z=faceZ(eyeX,eyeY);
  const eye=ellipsoid(head,white,eyeX,eyeY,z,.105,.109,.022);eye.rotation.y=sign*.23;
  const iris=ellipsoid(head,eyes,eyeX+sign*.007,eyeY,z+.019,.096,.101,.016);iris.rotation.y=sign*.23;
  for(const angle of [-Math.PI/4,Math.PI/4]){
   const stroke=mesh(head,new THREE.CapsuleGeometry(.009,.042,8,16),white,eyeX+sign*.007,eyeY,z+.037);stroke.rotation.z=angle;
  }
  for(const [dx,dy] of [[0,0],[.045,.01],[.024,-.028]]){
   const x=sign*(.17+dx),y=-.315+dy;
   ellipsoid(head,eyes,x,y,faceZ(x,y)+.003,.0075,.009,.006);
  }
  // 发夹是饱满的浅粉色软雕交叉条，而不是细线；贴合顶部弧面。
  for(const angle of [-.78,.78]){
   const clip=ellipsoid(head,cream,sign*.275,.335,.335,.043,.135,.035);
   clip.rotation.z=angle;clip.rotation.x=-.25;
  }
 }
 ellipsoid(head,eyes,0,-.325,faceZ(0,-.325)+.004,.013,.010,.009);
 const scarf=new THREE.Group();scarf.position.set(0,.75,0);rig.add(scarf);
 const collar=mesh(scarf,new THREE.TorusGeometry(.205,.045,12,40),brown);collar.rotation.x=Math.PI/2;collar.scale.z=.85;
 const fold=new THREE.Shape();fold.moveTo(-.20,.035);fold.quadraticCurveTo(0,-.055,.20,.035);fold.quadraticCurveTo(.12,-.16,0,-.21);fold.quadraticCurveTo(-.13,-.17,-.20,.035);
 const bib=mesh(scarf,new THREE.ExtrudeGeometry(fold,{depth:.035,bevelEnabled:true,bevelThickness:.012,bevelSize:.012,bevelSegments:3,steps:1,curveSegments:16}),brown,0,0,.20);bib.rotation.x=-.18;
 const knot=ellipsoid(scarf,brown,0,-.025,-.20,.075,.055,.06);knot.rotation.z=.2;
 const limb=(x:number,y:number,isLeg:boolean)=>{
  const joint=new THREE.Group();joint.position.set(x,y,0);rig.add(joint);
  if(isLeg){ellipsoid(joint,skin,0,-.12,0,.105,.15,.105);ellipsoid(joint,skin,0,-.235,.045,.12,.075,.145);}
  else{ellipsoid(joint,skin,0,-.13,0,.09,.18,.095);ellipsoid(joint,skin,0,-.265,.015,.085,.08,.08);}
  return joint;
 };
 const leftLeg=limb(-.13,.31,true),rightLeg=limb(.13,.31,true);
 const leftArm=limb(-.295,.68,false),rightArm=limb(.295,.68,false);
 leftArm.rotation.z=-.13;rightArm.rotation.z=.13;
 root.scale.setScalar(.86);
 let phase=0,weight=0;
 return {root,update(dt:number,moving:boolean,heading:number,interacting=false){
  weight+=(Number(moving)-weight)*(1-Math.exp(-10*dt));phase+=dt*9*weight;
  const step=Math.sin(phase);
  leftLeg.rotation.x=step*.4*weight;rightLeg.rotation.x=-step*.4*weight;
  leftLeg.position.y=.31+Math.max(0,-step)*.03*weight;rightLeg.position.y=.31+Math.max(0,step)*.03*weight;
  leftArm.rotation.x=-step*.31*weight;rightArm.rotation.x=step*.31*weight;
  rightArm.rotation.z=interacting?-.65:.13;
  rig.position.y=Math.abs(step)*.018*weight;rig.rotation.z=step*.016*weight;
  head.rotation.y=step*.015*weight;scarf.rotation.x=step*.035*weight;
  const difference=Math.atan2(Math.sin(heading-root.rotation.y),Math.cos(heading-root.rotation.y));
  root.rotation.y+=difference*(1-Math.exp(-11*dt));
 }};
}
