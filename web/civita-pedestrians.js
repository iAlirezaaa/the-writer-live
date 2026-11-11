/* Civita footpath population. Anonymous figures only: NOT claims about real residents, population or named people.
 * Routes come from mapped lanes; the bridge route is the surveyed deck.
 * Each figure walks a whole route, pauses to look around, and turns back at its end.
 */
const palette=[0x425d5a,0x7c4d40,0x5c5969,0x9d8762,0x506779,0x866655,0x76744e,0x534b43,0xc9b896,0x8e3d36,0x3a5a7a,0xb4a27e];
const trousers=[0x2f3338,0x41424a,0x6b5a45,0x3a4757,0x8a8171];
const skins=[0xb98a6e,0xd0a486,0x9a6c50,0xe0b89a];
const hairs=[0x352e2b,0x5b4332,0x8c8780,0x2a2522,0xa07a4c];
export function createCivitaPedestrians(THREE,parent,sourcePaths,{maxPeople=18,heightAt=null,seated=[]}={}){
 if(!THREE?.Group||!parent?.add||!Array.isArray(sourcePaths))throw new TypeError('Invalid Civita pedestrian context');
 const layer=new THREE.Group();layer.name='civita-osm-footpath-visual-pedestrians';
 layer.userData={illustrativePeople:true,actualPopulationVerified:false,source:'Mapped lane centrelines',licenses:['ODbL-1.0'],physicalCollider:false,citizenIdentityChanges:false};
 parent.add(layer);
 const headGeometry=new THREE.SphereGeometry(.15,10,7);
 const hairGeometry=new THREE.SphereGeometry(.155,8,6,0,Math.PI*2,0,Math.PI*.5);
 const coatGeometry=new THREE.CylinderGeometry(.2,.24,.65,8);
 const skirtGeometry=new THREE.CylinderGeometry(.22,.34,.6,8);
 const legGeometry=new THREE.CylinderGeometry(.067,.058,.72,6);
 const armGeometry=new THREE.CylinderGeometry(.058,.05,.54,6);
 const hatGeometry=new THREE.CylinderGeometry(.24,.26,.05,12);
 const crownGeometry=new THREE.CylinderGeometry(.13,.15,.13,10);
 const packGeometry=new THREE.BoxGeometry(.3,.42,.16);
 const std=color=>new THREE.MeshStandardMaterial({color,roughness:.94});
 const skin=skins.map(std),hair=hairs.map(std),cloth=palette.map(std),legs=trousers.map(std);
 const straw=std(0xd6c08e),pack=std(0x3f5a4a);
 const eligible=sourcePaths.filter(p=>p?.points?.length>=2&&p.points.every(q=>Number.isFinite(q.x)&&Number.isFinite(q.z)));
 function route(path){
  const stops=[];let total=0;
  for(let j=0;j<path.points.length;j++){if(j)total+=Math.hypot(path.points[j].x-path.points[j-1].x,path.points[j].z-path.points[j-1].z);stops.push(total);}
  return {points:path.points,stops,total,id:path.id};
 }
 const routes=eligible.map(route).filter(r=>r.total>=7);
 const weight=routes.reduce((a,r)=>a+r.total,0);
 function person(i,way){
  const root=new THREE.Group();root.name='anonymous-footpath-visitor-'+i;
  const body=new THREE.Group();root.add(body);
  const pick=(a,k)=>a[(i*k+k)%a.length],garment=pick(cloth,5),s=pick(skin,3),isChild=i%11===7,hasSkirt=i%4===1;
  const mesh=(g,m,x,y,z)=>{const n=new THREE.Mesh(g,m);n.position.set(x,y,z);body.add(n);return n;};
  mesh(coatGeometry,garment,0,1.06,0);mesh(headGeometry,s,0,1.63,0);mesh(hairGeometry,pick(hair,7),0,1.65,0);
  if(hasSkirt)mesh(skirtGeometry,pick(cloth,3),0,.72,0);
  if(i%3===0){mesh(hatGeometry,straw,0,1.76,0);mesh(crownGeometry,straw,0,1.83,0);}
  if(i%5===2)mesh(packGeometry,pack,0,1.1,-.26);
  const arms=[],legPivots=[];
  for(const side of [-1,1]){
   const a=new THREE.Group();a.position.set(side*.26,1.33,0);body.add(a);const am=new THREE.Mesh(armGeometry,garment);am.position.y=-.25;a.add(am);arms.push(a);
   const l=new THREE.Group();l.position.set(side*.1,.76,0);body.add(l);const lm=new THREE.Mesh(legGeometry,hasSkirt?s:pick(legs,2));lm.position.y=-.34;l.add(lm);legPivots.push(l);
  }
  root.scale.setScalar(isChild?.68:.92+((i*37)%17)/100);
  root.userData={sourceWay:way?.id,identity:'anonymous visual proxy',physicalCollider:false};
  layer.add(root);return {root,arms,legs:legPivots};
 }
 const locals=[];
 const population=heightAt?maxPeople:Math.min(maxPeople,routes.length);
 if(routes.length)for(let i=0;i<population;i++){
  // Longer lanes get proportionally more walkers.
  let pickAt=((i*.618034)%1)*weight,r=heightAt?routes[0]:routes[i];
  if(heightAt)for(const candidate of routes){pickAt-=candidate.total;if(pickAt<=0){r=candidate;break;}}
  const p=person(i,r);
  locals.push({...p,route:r,at:((i*.381966)%1)*r.total,dir:i%2?1:-1,speed:.75+(i%5)*.12,pause:0,nextPause:6+(i%7)*5,side:((i%5)-2)*.45});
 }
 seated.forEach((seat,i)=>{
  const p=person(maxPeople+i,null);p.root.position.set(seat.x,seat.y-.74,seat.z);p.root.rotation.y=seat.yaw+Math.PI;
  for(const l of p.legs)l.rotation.x=-1.35;for(const a of p.arms)a.rotation.x=-.75;
 });
 layer.userData.renderedVisualPedestrians=locals.length;layer.userData.seated=seated.length;
 function pointAt(r,d){
  let j=1;while(j<r.stops.length-1&&r.stops[j]<d)j++;
  const a=r.points[j-1],b=r.points[j],span=r.stops[j]-r.stops[j-1]||1,t=Math.max(0,Math.min(1,(d-r.stops[j-1])/span));
  return {x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t,y:Number.isFinite(a.y)&&Number.isFinite(b.y)?a.y+(b.y-a.y)*t:null,dx:b.x-a.x,dz:b.z-a.z};
 }
 let last=0;
 function update(day=1,time=0){
  const dt=Math.min(.1,Math.max(0,time-last));last=time;
  const daylight=Math.max(0,Math.min(1,Number(day)||0));
  const activeCount=Math.min(locals.length,Math.max(2,Math.round(locals.length*(.18+.82*daylight))));
  for(let i=0;i<locals.length;i++){
   const p=locals[i];p.root.visible=i<activeCount;if(!p.root.visible)continue;
   let walking=true;
   if(p.pause>0){p.pause-=dt;walking=false;}
   else{p.at+=p.dir*p.speed*dt;p.nextPause-=dt;
    if(p.at<=0){p.at=0;p.dir=1;}else if(p.at>=p.route.total){p.at=p.route.total;p.dir=-1;}
    if(p.nextPause<=0){p.pause=2+(i%4)*1.5;p.nextPause=9+(i%9)*4;}}
   const q=pointAt(p.route,p.at),len=Math.hypot(q.dx,q.dz)||1,nx=-q.dz/len,nz=q.dx/len;
   const x=q.x+nx*p.side,z=q.z+nz*p.side,h=q.y??heightAt?.(x,z);
   p.root.position.set(x,Number.isFinite(h)?h+.03:.13,z);
   p.root.rotation.y=Math.atan2(q.dx*p.dir,q.dz*p.dir)+(walking?0:Math.sin(time*.5+i)*.6);
   const swing=walking?Math.sin(time*p.speed*6.5+i):0;
   p.legs[0].rotation.x=swing*.5;p.legs[1].rotation.x=-swing*.5;
   p.arms[0].rotation.x=-swing*.38;p.arms[1].rotation.x=swing*.38;
  }
 }
 update(1,0);
 return {group:layer,update,count:locals.length,selfGrounded:Boolean(heightAt)};
}
