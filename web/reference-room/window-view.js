import * as THREE from '../vendor/three.module.js';

// A local-clock landscape. No location permission or weather claim is involved.
export function installWindowView(mesh,render){
 const canvas=document.createElement('canvas');canvas.width=768;canvas.height=1024;
 const ctx=canvas.getContext('2d'),texture=new THREE.CanvasTexture(canvas);
 texture.colorSpace=THREE.SRGBColorSpace;texture.flipY=mesh.material.map?.flipY??true;
 mesh.material=mesh.material.clone();mesh.material.map=texture;mesh.material.needsUpdate=true;
 const stops=[[0,'#101c36','#37445d'],[5,'#263653','#c78f86'],[7,'#719bb5','#f0cba6'],[12,'#5e97bd','#bed6db'],[17,'#8e91b4','#efb18a'],[19,'#293652','#a87b86'],[21,'#101c36','#37445d'],[24,'#101c36','#37445d']];
 function update(){
  const date=new Date(),hour=date.getHours()+date.getMinutes()/60;
  const i=stops.findIndex((s,index)=>index<stops.length-1&&hour>=s[0]&&hour<stops[index+1][0]);
  const a=stops[Math.max(0,i)],b=stops[Math.max(0,i)+1],t=(hour-a[0])/(b[0]-a[0]);
  const mix=(x,y)=>'#'+new THREE.Color(x).lerp(new THREE.Color(y),t).getHexString();
  const sky=ctx.createLinearGradient(0,0,0,1024);sky.addColorStop(0,mix(a[1],b[1]));sky.addColorStop(1,mix(a[2],b[2]));ctx.fillStyle=sky;ctx.fillRect(0,0,768,1024);
  const night=hour<6||hour>=19;
  if(night){ctx.fillStyle='#fff4d9';for(let star=0;star<55;star++){const x=(star*137.51)%768,y=(star*79.17)%600;ctx.globalAlpha=.25+(star%5)*.12;ctx.fillRect(x,y,1.5,1.5);}ctx.globalAlpha=1;}
  ctx.fillStyle=night?'#f5ecd5':'#fff1bd';ctx.beginPath();ctx.arc(540,240,night?30:44,0,Math.PI*2);ctx.fill();
  for(let layer=0;layer<4;layer++){
   ctx.fillStyle=(night?['#35435b','#29394d','#202f40','#172433']:['#90a4ad','#738e98','#526f79','#354f59'])[layer];
   ctx.beginPath();ctx.moveTo(0,1024);
   for(let x=0;x<=768;x+=8){const y=660+layer*78+Math.sin(x*.009+layer*1.7)*45+Math.sin(x*.023+layer)*18;ctx.lineTo(x,y);}
   ctx.lineTo(768,1024);ctx.closePath();ctx.fill();
  }
  texture.needsUpdate=true;render();
 }
 update();setInterval(update,60000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)update();});
}
