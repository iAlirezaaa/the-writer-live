import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { createCityLife } from "./studio-citylife.js";
import { appHref, getJSON } from "./snapshot.js";

/* Living World: additive Three.js view for the existing Python server.
   The visual world never manufactures achievements, sales, or real-world visits.
   It reads the existing public endpoints and never issues POST requests. */
const $ = id => document.getElementById(id);
const ROOM_DEFS = [
  {id:"study", name:"اتاق کار", x:-3.78, level:1, color:0xf0e1cc,
   description:"میز نوشتن، کامپیوتر، دست‌نوشته‌ها و قفسه‌های مطالعه؛ جایی که داستان‌ها شکل می‌گیرند."},
  {id:"bedroom", name:"اتاق خواب", x:0, level:1, color:0xe0e9ed,
   description:"جای خواب و استراحت. وضعیت بیداری و انرژی از زمان‌بندی واقعی نویسنده خوانده می‌شود."},
  {id:"bath", name:"حمام", x:3.78, level:1, color:0xdfefec,
   description:"فضای شخصی خانه با رنگ‌های آرام، کاشی‌های روشن و نور طبیعی."},
  {id:"living", name:"نشیمن", x:-3.78, level:0, color:0xe8e1d4,
   description:"برای فکر کردن، خواندن نامه‌ها و استراحت میان نوبت‌های نوشتن."},
  {id:"kitchen", name:"آشپزخانه", x:0, level:0, color:0xe8e6d9,
   description:"آشپزخانهٔ کوچک خانه، با میز صبحانه و کابینت‌های چوبی."},
  {id:"entry", name:"ورودی", x:3.78, level:0, color:0xf0e6d7,
   description:"درِ خروج به شهر. از اینجا می‌توانید به مکان‌های دیگر سر بزنید."}
];
const PLACE_DEFS = [
  {id:"bookstore",name:"کتابفروشی",x:-7,z:-3,paint:0xa0bcb0,description:"قفسه‌های کتاب و مسیر کشف آثار تازه. کتاب‌های ثبت‌شده در خود پروژه از کتابخانه خوانده می‌شوند."},
  {id:"cafe",name:"کافه",x:-1.7,z:-5,paint:0xd4ae99,description:"فضایی برای مطالعه و یادداشت‌برداری؛ حضور فیزیکی در این مکان فعلاً یک امکان نمایشی است."},
  {id:"publisher",name:"دفتر ناشر",x:6,z:-3.5,paint:0x9badb8,description:"مسیر ارتباط با ناشر. ملاقات فقط در صورت ثبت شدن توسط سیستم، رویداد زندگی محسوب می‌شود."},
  {id:"signing",name:"جشن امضا",x:-5.2,z:4.7,paint:0xe5b78d,description:"فضای رویداد کتاب؛ برگزاری مراسم در این نما صرفاً یک سناریوی تصویری است."},
  {id:"park",name:"پارک شهر",x:5.2,z:5,paint:0xa6bf9c,description:"محلی برای قدم زدن و شکل گرفتن ایده‌های تازه در جهان نمایشی."}
];
const detailDefault = {
  home:{kicker:"بازدید از خانه",title:"خانهٔ نویسنده",description:"شش اتاق با کارکردهای متفاوت. اتاقی را انتخاب کنید تا از نزدیک دیده شود.",action:"خواندن داستان‌ها",href:appHref("read/")},
  city:{kicker:"گشت در شهر",title:"شهر نویسنده",description:"کتابفروشی، کافه، دفتر ناشر و مکان‌های دیگر. مکان‌ها نمایشی‌اند؛ رویدادهای ثبت‌شده در تایم‌لاین مشخص می‌شوند.",action:"بازگشت به خانه",href:"#home"},
  timeline:{kicker:"زندگی‌نامه",title:"خط زمان زندگی",description:"رویدادهای این بخش مستقیماً از پروندهٔ تایم‌لاین پروژه خوانده می‌شوند و اگر رویدادی ثبت نشده باشد، چیزی ساخته نمی‌شود.",action:"داستان‌ها",href:appHref("read/")}
};
const COLORS={sage:0x84a7a0,clay:0xc58d78,blue:0x809dc2};
const faNum=v=>new Intl.NumberFormat("fa-IR").format(v);
const boxMat=(hex,opts={})=>new THREE.MeshStandardMaterial({color:hex,roughness:0.83,metalness:0.03,...opts});
const materials={
 wood:boxMat(0x98715a),darkWood:boxMat(0x5c665f),lightWood:boxMat(0xc2a283),
 stone:boxMat(0xefeee7),cream:boxMat(0xf6efe0),shadow:boxMat(0x425d65),
 ink:boxMat(0x344b54),leaf:boxMat(0x789b7d),leafLight:boxMat(0xa8c39b),
 brass:boxMat(0xc3a37e),glass:boxMat(0xb1d3d6,{metalness:0.16,roughness:0.25}),
 paper:boxMat(0xfffbf1),floor:boxMat(0xdbd4c4)
};
const roomFloorCache=new Map();
const roomFloor=(id,base)=>{
 if(roomFloorCache.has(id))return roomFloorCache.get(id);
 const c=document.createElement("canvas");c.width=512;c.height=512;const ctx=c.getContext("2d");
 const color=`#${base.toString(16).padStart(6,"0")}`;ctx.fillStyle=color;ctx.fillRect(0,0,512,512);
 if(id==="bath"||id==="kitchen"||id==="entry"){
  const n=8,cell=512/n;ctx.strokeStyle="rgba(94,122,119,.18)";ctx.lineWidth=3;
  for(let y=0;y<n;y++)for(let x=0;x<n;x++){if((x+y)%2===0){ctx.fillStyle="rgba(255,255,255,.12)";ctx.fillRect(x*cell+2,y*cell+2,cell-4,cell-4);}ctx.strokeRect(x*cell,y*cell,cell,cell);}
 }else{
  const row=64;ctx.lineWidth=2;
  for(let y=0;y<512;y+=row){ctx.fillStyle=y%128===0?"rgba(255,255,255,.06)":"rgba(81,57,39,.045)";ctx.fillRect(0,y,512,row);ctx.strokeStyle="rgba(93,65,45,.18)";ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(512,y);ctx.stroke();
   const offset=((y/row)%2)*32;for(let x=offset;x<512;x+=128){ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y+row);ctx.stroke();}
  }
 }
 const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;
 const mat=boxMat(0xffffff,{map:texture,roughness:.94});roomFloorCache.set(id,mat);return mat;
};
const fabric=boxMat(COLORS.sage);
let savedAccent="sage";try{const s=localStorage.getItem("the-writer-studio-accent");if(COLORS[s])savedAccent=s;}catch{}
fabric.color.setHex(COLORS[savedAccent]);
let currentMode="home", currentSelection=null, latestStatus=null, timeline=null, stories=[], growth=null, learning=null, achievements=null;
let renderer, scene, camera, controls, home, city, cityLife, hemi, sun, skyLight;
let cameraMove=null, pointerStart=null;
const targetHome=new THREE.Vector3(0,3.05,0),targetCity=new THREE.Vector3(0,1.4,0);
const cameraHome=new THREE.Vector3(14,11.1,17.5),cameraCity=new THREE.Vector3(17,15.5,23);
const clickables=[];
const clickableMaterial=(color)=>boxMat(color);
const solid=(parent,w,h,d,x,y,z,mat,cast=true)=>{
 const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),typeof mat==="number"?boxMat(mat):mat);
 m.position.set(x,y,z);m.castShadow=cast;m.receiveShadow=true;parent.add(m);return m;
};
const sphere=(parent,r,x,y,z,mat,segments=10)=>{
 const m=new THREE.Mesh(new THREE.SphereGeometry(r,segments,8),typeof mat==="number"?boxMat(mat):mat);
 m.position.set(x,y,z);m.castShadow=true;parent.add(m);return m;
};
const cyl=(parent,rt,rb,h,x,y,z,mat,seg=12)=>{
 const m=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,seg),typeof mat==="number"?boxMat(mat):mat);
 m.position.set(x,y,z);m.castShadow=true;parent.add(m);return m;
};
const group=(parent,x=0,y=0,z=0)=>{
 const g=new THREE.Group();g.position.set(x,y,z);parent.add(g);return g;
};
const lamp=(g,x,z,h=1.6)=>{
 cyl(g,.045,.045,h,x,h/2,z,materials.brass);
 sphere(g,.32,x,h,z,boxMat(0xf5d2a0,{emissive:0xb98a5e,emissiveIntensity:.16}));
};
const plant=(g,x,z,s=.7)=>{
 cyl(g,.28*s,.18*s,.4*s,x,.2*s,z,boxMat(0xc59c83));
 cyl(g,.07*s,.07*s,1.1*s,x,.8*s,z,materials.wood);
 for(let i=0;i<5;i++){const a=i*Math.PI*2/5;sphere(g,.32*s,x+Math.cos(a)*.25*s,1.32*s+(i%2)*.14*s,z+Math.sin(a)*.24*s,i%2?materials.leafLight:materials.leaf);}
};
const rug=(g,x,z,w,d,col)=>solid(g,w,.035,d,x,.10,z,boxMat(col),false);
const shelf=(g,x,z,w=1.5,h=2.1)=>{
 solid(g,w,h,.38,x,h/2,z,materials.darkWood);
 for(let k=0;k<3;k++){
  solid(g,w-.10,.07,.48,x,.38+k*.67,z+.1,materials.lightWood);
  for(let j=0;j<9;j++){
   const hh=.22+((j*7+k*3)%6)*.047;
   const color=[0xaec3b5,0xd1a79b,0xb7b1a5,0x8fa9bb,0xc0a17f][(j+2*k)%5];
   solid(g,.10,hh,.27,x-w/2+.18+j*(w-.27)/9,.48+k*.67+hh/2,z+.10,boxMat(color));
  }
 }
};
const windowPanel=(g,x,y,z,width=1.8,height=1.5)=>{
 // Deep-set divided windows echo the timber-and-glass townhouse reference.
 solid(g,width,height,.04,x,y,z,boxMat(0xa9cbd0,{metalness:.12,roughness:.28}));
 for(const dx of [-width/2-.035,width/2+.035])solid(g,.075,height+.12,.10,x+dx,y,z+.04,materials.cream);
 for(const dy of [-height/2-.035,height/2+.035])solid(g,width+.14,.075,.10,x,y+dy,z+.04,materials.cream);
 for(const dx of [-width/6,width/6])solid(g,.045,height,.075,x+dx,y,z+.055,materials.lightWood,false);
 solid(g,width,.045,.075,x,y,z+.055,materials.lightWood,false);
 solid(g,width+.24,.11,.18,x,y-height/2-.09,z+.08,materials.lightWood);
};
const makeWriter=(g)=>{
 const p=group(g,.10,.16,.18);p.rotation.y=Math.PI;
 const coat=boxMat(0x465e67), shirt=boxMat(0xe8ddc9), skin=boxMat(0xd5a184), hair=boxMat(0x393839);
 cyl(p,.26,.31,.70,0,.54,0,coat);
 solid(p,.26,.32,.31,0,.74,.015,shirt);
 sphere(p,.24,0,1.13,0,skin);
 sphere(p,.21,0,1.37,-.035,hair,12);
 sphere(p,.11,0,1.14,.205,skin,10);
 for(const x of [-.245,.245])sphere(p,.055,x,1.14,0,skin,8);
 for(const x of [-.082,.082]){
  solid(p,.064,.018,.02,x,1.19,.216,boxMat(0x493b37),false);
  sphere(p,.024,x,1.155,.221,boxMat(0x302d2d),8);
 }
 const leftArm=group(p,-.27,.83,0),rightArm=group(p,.27,.83,0);
 for(const [arm,dir] of [[leftArm,-1],[rightArm,1]]){
  const upper=solid(arm,.145,.39,.15,dir*.04,-.18,-.02,coat);upper.rotation.x=-.72;
  const lower=solid(arm,.13,.34,.13,dir*.045,-.31,-.28,coat);lower.rotation.x=-.20;
  sphere(arm,.07,dir*.045,-.47,-.34,skin,8);
 }
 const legs=[];
 for(const x of [-.13,.13]){
  const leg=group(p,x,.34,.02);solid(leg,.17,.48,.18,0,-.16,.12,boxMat(0x34434b));
  solid(leg,.18,.12,.35,0,-.37,-.12,boxMat(0x353331));legs.push(leg);
 }
 return {group:p,leftArm,rightArm,legs};
};
let writerRig=null;
const furnish=(g,id)=>{
 if(id==="study"){
  rug(g,0,.45,2.7,3.35,0xd6c5af);
  solid(g,2.25,.12,.95,.15,.87,-1.25,materials.wood);
  for(const xx of [-.80,.95])solid(g,.10,.78,.78,xx,.45,-1.25,materials.darkWood);
  solid(g,.68,.44,.06,.12,1.17,-1.42,materials.ink);
  solid(g,.44,.06,.2,.12,.92,-1.29,materials.ink);
  solid(g,.64,.055,.26,.12,.95,-.88,materials.cream);
  solid(g,.64,.12,.62,0,.55,.90,fabric);
  writerRig=makeWriter(g);
  shelf(g,-1.24,-2.45,1.2,2.23);
  shelf(g,1.15,-2.46,1.13,2.25);
  solid(g,.7,.06,.52,-.68,.96,-1.0,materials.paper);
  plant(g,1.29,1.7,.53);lamp(g,-1.47,1.75,1.3);
 }else if(id==="bedroom"){
  rug(g,0,.3,2.6,3.6,0xd2c7bd);
  solid(g,2.35,.35,3.0,0,.42,.22,materials.wood);
  solid(g,2.18,.31,2.82,0,.68,.25,materials.cream);
  solid(g,2.18,.09,1.95,0,.78,.55,fabric);
  for(const x of [-.6,.6])solid(g,.85,.18,.51,x,.90,-.92,materials.paper);
  solid(g,.47,.67,.53,1.48,.43,-.85,materials.lightWood);
  lamp(g,1.48,-.80,1.20);plant(g,-1.30,1.90,.57);
 }else if(id==="bath"){
  rug(g,0,.4,2.4,3.15,0xb4d5d5);
  solid(g,1.15,.7,2.2,.52,.46,-.2,materials.cream);
  solid(g,1.07,.16,2.07,.52,.83,-.2,materials.glass);
  solid(g,.73,.65,.58,-1.09,.42,-1.5,materials.cream);
  sphere(g,.30,-1.1,.79,-1.5,materials.paper);
  solid(g,.12,1.9,1.90,1.72,1.2,.0,boxMat(0xbcdbe1,{transparent:true,opacity:.35}));
  plant(g,-1.20,1.8,.55);
 }else if(id==="living"){
  rug(g,0,.20,3.1,3.5,0xdac8b3);
  solid(g,2.55,.48,.85,-.08,.52,-1.35,fabric);
  solid(g,2.56,.50,.16,-.08,.86,-1.72,fabric);
  for(const x of [-1.17,1.02])solid(g,.17,.52,.96,x,.75,-1.35,fabric);
  for(const x of [-.65,.45])solid(g,.45,.16,.35,x,.98,-1.38,materials.cream);
  solid(g,1.45,.12,.9,0,.55,.35,materials.lightWood);
  for(const x of [-.55,.55])solid(g,.12,.48,.6,x,.3,.35,materials.wood);
  shelf(g,-1.29,2.07,1.17,1.90);
  lamp(g,1.45,1.9,1.46);plant(g,1.40,-2.30,.62);
 }else if(id==="kitchen"){
  rug(g,0,.1,2.7,3.8,0xd8d8c8);
  solid(g,3.10,.86,.73,0,.46,-2.35,materials.lightWood);
  solid(g,3.25,.11,.84,0,.93,-2.38,materials.stone);
  for(const x of [-.94,0,.94])solid(g,.80,.48,.07,x,.55,-1.96,materials.wood);
  solid(g,.77,1.78,.75,1.23,1.03,-1.65,materials.cream);
  cyl(g,.80,.80,.10,-.2,.73,.70,materials.lightWood);
  cyl(g,.08,.08,.64,-.2,.36,.70,materials.wood);
  for(const [x,z] of [[-1.16,.4],[.67,1.25],[.7,.12]]){cyl(g,.35,.29,.44,x,.25,z,fabric);}
  plant(g,-1.37,2.15,.5);
 }else if(id==="entry"){
  rug(g,0,.75,2.15,3.3,0xe3d2be);
  solid(g,1.45,2.46,.12,.20,1.35,-2.82,materials.wood);
  solid(g,1.13,1.92,.05,.2,1.32,-2.70,materials.darkWood);
  sphere(g,.06,.65,1.20,-2.62,materials.brass);
  solid(g,1.00,.65,.42,-.98,.39,1.62,materials.lightWood);
  plant(g,1.31,1.63,.68);
  cyl(g,.055,.07,1.56,1.20,.85,-.70,materials.darkWood);
  for(const z of [-.96,-.42])solid(g,.57,.07,.12,1.15,1.55,z,materials.darkWood);
 }
};
const buildHome=()=>{
 const root=group(scene);
 const plinth=solid(root,12.2,.34,6.28,0,-.28,0,boxMat(0xb6c9b9));
 plinth.receiveShadow=true;
 ROOM_DEFS.forEach(r=>{
  const y=r.level*3.23;
  const g=group(root,r.x,y,0);g.userData.pick={kind:"room",id:r.id};clickables.push(g);
  solid(g,3.73,.16,5.85,0,.00,0,roomFloor(r.id,r.color));
  solid(g,3.73,2.96,.13,0,1.56,-2.89,boxMat(r.color+0x030303),false);
  solid(g,.15,2.97,5.8,-1.89,1.56,0,boxMat(0xd8d5c8),false);
  solid(g,.08,.10,5.8,1.87,0.12,0,materials.cream,false);
  solid(g,3.73,.13,.15,0,.20,2.90,materials.lightWood,false);
  windowPanel(g,.1,1.82,-2.80,1.85,1.43);
  furnish(g,r.id);
 });
 // Inner-floor separation and architectural ledges, front cutaway stays open.
 solid(root,12.4,.23,6.30,0,3.14,0,materials.cream);
 solid(root,12.4,.19,.50,0,6.43,-2.74,materials.shadow);
 solid(root,.25,6.45,6.0,-5.72,3.12,-.1,materials.cream);
 solid(root,.2,6.30,6.0,5.72,3.12,-.1,materials.cream);
 // Exposed timber frame and a slate gable roof make the cutaway read as a cottage.
 // Keep the front roof plane open so the upper rooms remain visible from the default camera.
 for(const x of [-5.95,-2.02,2.02,5.95]){
  solid(root,.20,6.42,.20,x,3.18,2.88,materials.darkWood);
  solid(root,.20,6.42,.20,x,3.18,-2.86,materials.darkWood);
 }
 for(const y of [3.26,6.42]){
  solid(root,12.35,.19,.20,0,y,2.86,materials.darkWood);
  solid(root,12.35,.19,.20,0,y,-2.84,materials.darkWood);
 }
 const slate=boxMat(0x59636a,{roughness:.92});
 const rearRoof=solid(root,12.9,.16,3.82,0,7.30,-1.61,slate);
 rearRoof.rotation.x=.42;
 solid(root,13.12,.20,.24,0,8.06,-.02,materials.darkWood);
 for(const x of [-6.30,6.30]){
  solid(root,.66,1.52,.68,x,7.05,-2.35,boxMat(0xb57860));
  solid(root,.78,.18,.80,x,7.85,-2.35,boxMat(0x684f46));
  solid(root,.28,.34,.30,x-.12,8.09,-2.35,boxMat(0x9c654f));
 }
 // Overhang and tiny planted balcony
 solid(root,12.8,.14,.55,0,6.63,2.88,materials.lightWood);
 solid(root,12.8,.14,.55,0,6.63,-2.85,materials.lightWood);
 for(const x of [-5.25,5.35])plant(root,x,2.2,.7);
 // Minimal ground around the house.
 solid(root,18,.18,10,0,-.51,0,boxMat(0xd7e3d7),false);
 for(const x of [-8.1,8.0]){cyl(root,.17,.23,1.40,x,.4,1.3,materials.wood);sphere(root,.84,x,1.40,1.3,materials.leaf,12);}
 return root;
};
const signTexture=(title)=>{
 const c=document.createElement("canvas");c.width=512;c.height=128;
 const ctx=c.getContext("2d");ctx.fillStyle="#fffaf0";ctx.fillRect(0,0,512,128);
 ctx.fillStyle="#2d5756";ctx.font="bold 56px Vazirmatn, Tahoma, sans-serif";ctx.textAlign="center";
 ctx.direction="rtl";ctx.fillText(title,256,82,460);
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
};
const cityBuilding=(root,p)=>{
 const g=group(root,p.x,0,p.z);g.userData.pick={kind:"place",id:p.id};clickables.push(g);
 if(p.id==="park"){
  solid(g,4,.14,4.3,0,0,0,boxMat(0xb4cdaa));
  for(const [x,z] of [[-1.2,-1.2],[1.2,-.8],[-1.1,1.3],[1.20,1.15]]){cyl(g,.14,.20,.7,x,.35,z,materials.wood);sphere(g,.65,x,1.12,z,materials.leaf);}
  solid(g,1.5,.15,.46,0,.56,0,materials.wood);return;
 }
 const h=p.id==="publisher"?4.8:p.id==="signing"?3.9:3.4;
 const w=p.id==="signing"?4.7:3.7;
 solid(g,w,.16,3.5,0,0,0,materials.stone,false);
 solid(g,w,h,3.3,0,h/2,0,boxMat(p.paint));
 solid(g,w+.22,.26,3.66,0,h+.11,0,materials.shadow);
 solid(g,1.1,2.05,.07,0,1.06,1.69,materials.darkWood,false);
 solid(g,.78,1.65,.08,0,.91,1.74,materials.glass,false);
 for(const x of [-w*.33,w*.33]){
  for(let level=1;level<Math.ceil(h/1.5);level++){
   const yy=.65+level*1.05;
   if(yy>=h-.32)continue;
   solid(g,.66,.60,.09,x,yy,1.69,materials.glass,false);
   solid(g,.075,.70,.10,x,yy,1.77,materials.paper,false);
  }
 }
 const awning=solid(g,2.0,.12,.78,0,2.27,1.95,p.id==="cafe"?materials.brass:fabric);
 awning.rotation.x=-.10;
 const text=new THREE.Mesh(new THREE.PlaneGeometry(w*.84,.55),
  new THREE.MeshBasicMaterial({map:signTexture(p.name),transparent:false}));
 text.position.set(0,h-.50,1.676);g.add(text);
 // pavement and greenery around each venue
 solid(g,w+.6,.08,4.2,0,-.13,0,boxMat(0xe7e3d6),false);
 for(const x of [-w/2-.3,w/2+.3]){plant(g,x,1.5,.5);}
 return g;
};
const buildCity=()=>{
 const root=group(scene);solid(root,23,.22,19,0,-.28,0,boxMat(0xdce6df),false);
 // calm pedestrian streets with distinct pavement bands
 solid(root,23,.025,2.2,0,-.13,1.05,boxMat(0xb5cbc9),false);
 solid(root,2.2,.025,19,1.7,-.12,0,boxMat(0xb5cbc9),false);
 PLACE_DEFS.forEach(p=>cityBuilding(root,p));
 for(const [x,z] of [[-10,-6],[-10,6],[10,-6],[10,6],[0,8.5]]){
  cyl(root,.16,.18,1.3,x,.58,z,materials.wood);
  sphere(root,.72,x,1.43,z,materials.leaf,12);
 }
 return root;
};
function begin3D(){
 const mount=$("scene");
 try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:"high-performance"});}
 catch{ $("scene-fallback").hidden=false;return; }
 renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.7));
 renderer.outputColorSpace=THREE.SRGBColorSpace;
 renderer.toneMapping=THREE.ACESFilmicToneMapping;
 renderer.toneMappingExposure=1.23;
 renderer.shadowMap.enabled=true;
 renderer.shadowMap.type=THREE.PCFSoftShadowMap;
 renderer.domElement.setAttribute("aria-hidden","true");mount.appendChild(renderer.domElement);
 scene=new THREE.Scene();
 scene.background=new THREE.Color(0xe5eff0);
 scene.fog=new THREE.Fog(0xe5eff0,35,86);
 camera=new THREE.PerspectiveCamera(41,1,.1,150);
 camera.position.copy(cameraHome);
 controls=new OrbitControls(camera,renderer.domElement);
 controls.target.copy(targetHome);
 controls.enableDamping=true;controls.dampingFactor=.085;controls.maxPolarAngle=1.46;
 controls.minPolarAngle=.30;controls.minDistance=5;controls.maxDistance=42;
 controls.enablePan=false;
 hemi=new THREE.HemisphereLight(0xe3f7ff,0xd0bba4,1.45);scene.add(hemi);
 sun=new THREE.DirectionalLight(0xffe5c4,2.15);sun.position.set(-8,17,12);sun.castShadow=true;
 sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-22;sun.shadow.camera.right=22;
 sun.shadow.camera.top=22;sun.shadow.camera.bottom=-22;sun.shadow.bias=-.0005;scene.add(sun);
 for(const [x,y,z,intensity] of [[-3.6,4.8,1.4,.70],[-3.7,1.9,1.7,.65],[.7,5.1,-.2,.45]]){
  const bulb=new THREE.PointLight(0xffd4a0,intensity,5);bulb.position.set(x,y,z);scene.add(bulb);
 }
 const floor=new THREE.Mesh(new THREE.PlaneGeometry(180,180),boxMat(0xe0eae4));
 floor.rotation.x=-Math.PI/2;floor.position.y=-.77;floor.receiveShadow=true;scene.add(floor);
 home=buildHome();city=buildCity();cityLife=createCityLife({THREE,city});city.visible=false;
 const updateSize=()=>{
  const w=mount.clientWidth,h=mount.clientHeight;if(!w||!h)return;
  camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h,false);
 };
 const observer=new ResizeObserver(updateSize);observer.observe(mount);updateSize();
 renderer.domElement.addEventListener("pointerdown",e=>{pointerStart={x:e.clientX,y:e.clientY};});
 renderer.domElement.addEventListener("pointerup",e=>{
  if(!pointerStart||Math.hypot(e.clientX-pointerStart.x,e.clientY-pointerStart.y)>6)return;
  pointerStart=null;
  const rect=renderer.domElement.getBoundingClientRect();
  const pointer=new THREE.Vector2(((e.clientX-rect.left)/rect.width)*2-1,-((e.clientY-rect.top)/rect.height)*2+1);
  const ray=new THREE.Raycaster();ray.setFromCamera(pointer,camera);
  const collection=currentMode==="city"?[city]:[home];
  const hits=ray.intersectObjects(collection,true);
  for(const hit of hits){
   let obj=hit.object;
   while(obj && !obj.userData.pick)obj=obj.parent;
   if(obj?.userData.pick){const pick=obj.userData.pick;
    if(pick.kind==="room")selectRoom(pick.id);else selectPlace(pick.id);return;}
  }
 });
 const motionAllowed=!window.matchMedia("(prefers-reduced-motion: reduce)").matches;
 function animate(ms){
  requestAnimationFrame(animate);
  if(cameraMove){
   const t=Math.min(1,(ms-cameraMove.start)/750);
   const ease=1-(1-t)**3;
   camera.position.lerpVectors(cameraMove.from,cameraMove.to,ease);
   controls.target.lerpVectors(cameraMove.targetFrom,cameraMove.targetTo,ease);
   if(t>=1)cameraMove=null;
  }
  if(motionAllowed && home?.visible){
   const sec=(ms||0)/1000,a=sec*2.4;home.rotation.y=Math.sin(sec/1.8)*.0015;
   if(writerRig){writerRig.group.position.y=.16+Math.sin(a)*.012;writerRig.leftArm.rotation.x=Math.sin(a)*.07;writerRig.rightArm.rotation.x=Math.sin(a+1.3)*.09;writerRig.legs[0].rotation.x=Math.sin(a*.4)*.018;writerRig.legs[1].rotation.x=-Math.sin(a*.4)*.018;}
  }
  if(motionAllowed&&currentMode==="city")cityLife?.update((ms||0)/1000);
  controls.update();renderer.render(scene,camera);
 }
 requestAnimationFrame(animate);
}
function fly(pos,target){
 if(!camera||!controls)return;
 const reduced=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
 if(reduced){camera.position.copy(pos);controls.target.copy(target);controls.update();return;}
 cameraMove={from:camera.position.clone(),targetFrom:controls.target.clone(),
             to:pos.clone(),targetTo:target.clone(),start:performance.now()};
}
function resetCamera(){
 if(currentMode==="city")fly(cameraCity,targetCity);
 else fly(cameraHome,targetHome);
}
function renderTabs(){
 const parent=$("place-tabs");parent.replaceChildren();
 const all=[{id:"all",name:currentMode==="city"?"همهٔ شهر":"تمام خانه"},
 ...(currentMode==="city"?PLACE_DEFS:ROOM_DEFS)];
 for(const r of all){
  const b=document.createElement("button");b.type="button";b.textContent=r.name;
  const selected=currentSelection?.id===r.id || (r.id==="all"&&!currentSelection);
  b.setAttribute("aria-pressed",String(selected));
  b.addEventListener("click",()=>{
   if(r.id==="all"){currentSelection=null;resetCamera();refreshDetail();renderTabs();}
   else if(currentMode==="city")selectPlace(r.id);else selectRoom(r.id);
  });parent.append(b);
 }
}
function showInfo(kicker,title,description,extra=[],action="خواندن داستان‌ها",href=appHref("read/")){
 $("detail-kicker").textContent=kicker;$("detail-title").textContent=title;
 $("detail-description").textContent=description;
 const ex=$("detail-extra");ex.replaceChildren();
 for(const line of extra){const div=document.createElement("div");div.className="detail-row";div.textContent=line;ex.append(div);}
 const link=$("detail-action");link.textContent=action+" ↗";link.href=href;
 link.onclick=href==="#home"?(e=>{e.preventDefault();setMode("home");}):null;
}
function refreshDetail(){
 if(currentMode==="timeline"){
  const items=timeline?.events||[];
  showInfo("زندگی‌نامه","ردپای زندگی",
   items.length?`تا امروز ${faNum(items.length)} رویداد با سند ثبت شده است.`:"هنوز رویدادی در پروندهٔ تایم‌لاین ثبت نشده است.",
   timeline?.next?.title?["قدم مهم بعدی: "+timeline.next.title]:[],
   "رفتن به داستان‌ها",appHref("read/"));return;
 }
 if(!currentSelection){
  const d=detailDefault[currentMode]||detailDefault.home;
  showInfo(d.kicker,d.title,d.description,[],d.action,d.href);return;
 }
 if(currentMode==="city"){
  const p=PLACE_DEFS.find(p=>p.id===currentSelection.id);
  if(p)showInfo("مکان‌های شهر",p.name,p.description,["بازدیدها در این نسخه شبیه‌سازی بصری‌اند؛ برای ثبت ملاقات واقعی در چرخهٔ نویسنده باید از API مجاز استفاده شود."],
   p.id==="bookstore"?"دیدن داستان‌ها":"بازگشت به خانه",p.id==="bookstore"?appHref("read/"):"#home");
  return;
 }
 const r=ROOM_DEFS.find(r=>r.id===currentSelection.id);
 if(!r)return;
 const extra=[];
 if(r.id==="study"&&stories.length){
  const last=stories.slice().sort((a,b)=>String(b.created||"").localeCompare(String(a.created||"")))[0];extra.push("آخرین داستان ثبت‌شده: "+last.title);
  extra.push("وضعیت: "+(last.status==="accepted"?"پذیرفته":last.status==="rejected"?"رد شده":"در جریان"));
 }
 if(r.id==="bedroom"&&latestStatus)extra.push(latestStatus.napping?"نویسنده خسته است و تا پایان چرت استراحت می‌کند.":latestStatus.asleep?"نویسنده اکنون در خواب شبانه است.":"نویسنده اکنون بیدار است.");
 showInfo("اتاق‌های خانه",r.name,r.description,extra,
   r.id==="study"?"خواندن آثار":"بازدید از شهر",r.id==="study"?appHref("read/"):"#home");
}
function selectRoom(id){
 const r=ROOM_DEFS.find(x=>x.id===id);if(!r)return;
 if(currentMode!=="home")setMode("home");
 currentSelection={id};
 $("view-kicker").textContent="خانه / "+r.name;
 $("view-title").textContent=r.name;$("view-summary").textContent="نمای نزدیک این اتاق";
 const tar=new THREE.Vector3(r.x,r.level*3.23+1.28,0);
 fly(new THREE.Vector3(r.x+5.25,r.level*3.23+5.15,7.3),tar);
 renderTabs();refreshDetail();
}
function selectPlace(id){
 const p=PLACE_DEFS.find(x=>x.id===id);if(!p)return;
 if(currentMode!=="city")setMode("city");
 currentSelection={id};$("view-kicker").textContent="شهر / "+p.name;
 $("view-title").textContent=p.name;$("view-summary").textContent="نمای نزدیک این مکان";
 const tar=new THREE.Vector3(p.x,1.5,p.z);
 fly(new THREE.Vector3(p.x+5.7,7.2,p.z+7.3),tar);
 renderTabs();refreshDetail();
}
function setMode(mode){
 if(!["home","city","timeline"].includes(mode))return;
 currentMode=mode;currentSelection=null;
 if(home){home.visible=mode!=="city";city.visible=mode==="city";}
 $("view-kicker").textContent=mode==="city"?"شهر / نمای کلی":mode==="timeline"?"زندگی‌نامه / خانه":"خانه / نمای کلی";
 $("view-title").textContent=mode==="city"?"شهر داستان‌های نانوشته":mode==="timeline"?"زندگی در گذر زمان":"زندگی پشت پنجره‌ها";
 $("view-summary").textContent=mode==="city"?"مکان مورد نظر را از شهر انتخاب کنید.":mode==="timeline"?"لحظه‌های ثبت‌شده را در ستون کناری ببینید.":"روی یک اتاق کلیک کنید یا از فهرست پایین انتخاب کنید.";
 $("timeline-tools").hidden=mode!=="timeline";
 $("events-heading").textContent=mode==="timeline"?"خط زمان زندگی":"لحظه‌های زندگی";
 if(mode==="city"&&cityLife)$("writer-status").textContent=`شهر زنده · ${faNum(cityLife.pedestrianCount)} شهروند · ${faNum(cityLife.vehicleCount)} خودرو`;
 else if(latestStatus)$("writer-status").textContent=latestStatus.napping?(latestStatus.activity||"چرت می‌زند"):latestStatus.asleep?"در خواب شبانه":latestStatus.activity||"بیدار";
 document.querySelectorAll("[data-mode]").forEach(b=>{
  const pressed=b.dataset.mode===mode;b.classList.toggle("active",pressed);b.setAttribute("aria-pressed",String(pressed));
 });
 resetCamera();renderTabs();refreshDetail();renderEvents();
}
function renderEvents(){
 const parent=$("event-list");parent.replaceChildren();
 const all=(Array.isArray(timeline?.events)?timeline.events:[]).slice().sort((a,b)=>String(a.at||"").localeCompare(String(b.at||"")));
 const kind=$("timeline-kind")?.value||"all",query=($("timeline-search")?.value||"").trim().toLocaleLowerCase("fa");
 const filtered=all.filter(e=>(kind==="all"||e.kind===kind)&&(!query||`${e.title||""} ${e.detail||""} ${e.source||""}`.toLocaleLowerCase("fa").includes(query)));
 const shown=currentMode==="timeline"?filtered:filtered.slice(-4).reverse();
 if(!shown.length){
  const li=document.createElement("li");li.className="empty";
  li.textContent=timeline?"هنوز رویدادی در زندگی‌نامه ثبت نشده است.":"دادهٔ تایم‌لاین در دسترس نیست.";
  parent.append(li);return;
 }
 let lastYear="";
 for(const item of shown){
  const date=new Date(item.at||"");
  const year=Number.isNaN(date.getTime())?"بی‌تاریخ":new Intl.DateTimeFormat("fa-IR-u-ca-persian",{year:"numeric"}).format(date);
  if(currentMode==="timeline"&&year!==lastYear){const sep=document.createElement("li");sep.className="timeline-year";sep.textContent=year;parent.append(sep);lastYear=year;}
  const li=document.createElement("li");li.className="timeline-event";li.dataset.kind=item.kind||"";const dot=document.createElement("span");dot.className="event-dot";
  const inner=document.createElement("div");inner.className="event-text";
  const title=document.createElement("span");title.className="event-title";title.textContent=item.title||"رویداد";
  const time=document.createElement("span");time.className="event-time";
  time.textContent=Number.isNaN(date.getTime())?(item.at||"تاریخ ثبت نشده"):new Intl.DateTimeFormat("fa-IR-u-ca-persian",{dateStyle:"long"}).format(date);
  inner.append(title,time);
  if(currentMode==="timeline"&&item.detail){const detail=document.createElement("span");detail.className="event-detail";detail.textContent=item.detail;inner.append(detail);}
  if(currentMode==="timeline"){const labels={first:"اولین‌بار",achievement:"دستاورد",turning_point:"نقطهٔ عطف",loss:"از دست‌دادن",release:"انتشار",ritual:"آیین",question:"پرسش",belief:"باور",habit:"عادت",chapter:"فصل"};const badge=document.createElement("span");badge.className="event-kind";badge.textContent=labels[item.kind]||item.kind||"رویداد";inner.append(badge);}
  li.append(dot,inner);parent.append(li);
 }
}
async function fetchJSON(path){
 const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),7000);
 try{return await getJSON(path,{signal:controller.signal,cache:"no-store"});}
 finally{clearTimeout(timeout);}
}
async function loadData(){
 const results=await Promise.allSettled([fetchJSON("/api/status"),fetchJSON("/api/stories"),fetchJSON("/api/timeline"),fetchJSON("/api/skillbook"),fetchJSON("/api/learning"),fetchJSON("/api/achievements")]);
 if(results[0].status==="fulfilled"){
  latestStatus=results[0].value;const st=latestStatus;
  $("writer-name").textContent=st.name||"نویسنده";
  $("writer-status").textContent=currentMode==="city"&&cityLife?`شهر زنده · ${faNum(cityLife.pedestrianCount)} شهروند · ${faNum(cityLife.vehicleCount)} خودرو`:st.napping?(st.activity||"چرت می‌زند"):st.asleep?"در خواب شبانه":st.activity||"بیدار";
  $("writer-activity").textContent=st.activity||"هنوز فعالیتی گزارش نشده است.";
  if(Number.isFinite(Number(st.energy)))$("energy-value").textContent=faNum(Math.round(Number(st.energy)*100))+"٪";
  $("accepted-count").textContent=faNum(st.accepted_count??0);
  $("story-count").textContent=faNum(st.story_count??0);
 }else{$("writer-status").textContent="اتصال به اطلاعات برقرار نیست";$("writer-activity").textContent="سرور پروژه پاسخ نداد.";}
 if(results[1].status==="fulfilled"&&Array.isArray(results[1].value)){
  stories=results[1].value;$("story-count").textContent=faNum(stories.length);
 }
 if(results[2].status==="fulfilled"&&results[2].value&&typeof results[2].value==="object")timeline=results[2].value;
 if(results[3].status==="fulfilled"&&results[3].value&&typeof results[3].value==="object")growth=results[3].value;
 if(results[4].status==="fulfilled"&&results[4].value)learning=results[4].value;
 if(results[5].status==="fulfilled"&&results[5].value&&typeof results[5].value==="object")achievements=results[5].value;
 refreshDetail();renderEvents();renderGrowth();
}
function renderGrowth(){
 if(!growth)return;
 const stats=growth.stats||{}, overall=growth.progress?.overall||{}, learnStats=learning?.stats||{}, achievementStats=achievements?.stats||{};
 const rows=(Array.isArray(growth.skills)?growth.skills:[]).filter(s=>!s.made_up).slice();
 rows.sort((a,b)=>(Number(a.level)||0)-(Number(b.level)||0));
 const active=(Array.isArray(learning?.skills)?learning.skills:[]).filter(s=>s.status!=="adopted");
 $("growth-skills").textContent=faNum(stats.skills??rows.length);
 $("growth-levelups").textContent=faNum(overall.level_ups_7??0);
 $("growth-learning").textContent=faNum(learnStats.sessions_total??active.reduce((n,s)=>n+(Number(s.sessions)||0),0));
 $("growth-achievements").textContent=`${faNum(achievementStats.done??learning?.achievements?.done??0)}/${faNum(achievementStats.total??learning?.achievements?.total??0)}`;
 $("growth-updated").textContent=overall.fresh_evidence_7?`${faNum(overall.fresh_evidence_7)} شاهد تازه در این هفته`:"بر پایهٔ کارهای ثبت‌شده";
 const focus=rows.find(s=>s.goal&&s.goal!=="مهارت به بالاترین سطح رسیده.")||rows[0];
 $("growth-focus-title").textContent=focus?.label_fa||active[0]?.label_fa||"قدم بعدی هنوز ثبت نشده است";
 $("growth-focus-goal").textContent=focus?.goal||active[0]?.next||"هر فعالیت تازه در دفتر رشد ثبت می‌شود.";
 const list=$("growth-skill-list");list.replaceChildren();
 for(const skill of rows.slice(0,3)){
  const item=document.createElement("li"),name=document.createElement("span"),meter=document.createElement("progress");
  name.textContent=skill.label_fa||"مهارت";meter.max=5;meter.value=Math.max(0,Math.min(5,Number(skill.level)||0));meter.setAttribute("aria-label",`${name.textContent}، سطح ${faNum(meter.value)} از ۵`);
  item.append(name,meter);list.append(item);
 }
}
document.querySelectorAll("[data-mode]").forEach(b=>b.addEventListener("click",()=>setMode(b.dataset.mode)));
$("open-timeline").addEventListener("click",()=>setMode("timeline"));
$("timeline-kind")?.addEventListener("change",renderEvents);
$("timeline-search")?.addEventListener("input",renderEvents);
$("reset-camera").addEventListener("click",()=>{currentSelection=null;resetCamera();renderTabs();refreshDetail();});
$("zoom-in").addEventListener("click",()=>{if(!camera||!controls)return;const dif=camera.position.clone().sub(controls.target).multiplyScalar(.82);camera.position.copy(controls.target).add(dif);controls.update();});
$("zoom-out").addEventListener("click",()=>{if(!camera||!controls)return;const dif=camera.position.clone().sub(controls.target).multiplyScalar(1.22);camera.position.copy(controls.target).add(dif);controls.update();});
let daylight=true;
$("light-mode").addEventListener("click",()=>{
 daylight=!daylight;
 const b=$("light-mode");b.textContent=daylight?"نور روز":"نور عصر";
 b.setAttribute("aria-pressed",String(daylight));
 if(!scene||!sun||!hemi)return;
 cityLife?.setDusk(!daylight);
 scene.background.setHex(daylight?0xe5eff0:0x748a9a);
 scene.fog.color.setHex(daylight?0xe5eff0:0x748a9a);
 sun.color.setHex(daylight?0xffe5c4:0xf4b995);
 sun.intensity=daylight?2.15:1.25;
 hemi.intensity=daylight?1.45:0.80;
 renderer.toneMappingExposure=daylight?1.23:1.06;
});
document.querySelectorAll(".swatch").forEach(b=>{
 b.setAttribute("aria-pressed",String(b.dataset.accent===savedAccent));
 b.addEventListener("click",()=>{
  savedAccent=b.dataset.accent;fabric.color.setHex(COLORS[savedAccent]);
  document.querySelectorAll(".swatch").forEach(x=>x.setAttribute("aria-pressed",String(x===b)));
  try{localStorage.setItem("the-writer-studio-accent",savedAccent);}catch{}
 });
});
try{begin3D();}catch(err){console.error("3D studio:",err);$("scene-fallback").hidden=false;}
renderTabs();refreshDetail();loadData();
setInterval(loadData,30000);
