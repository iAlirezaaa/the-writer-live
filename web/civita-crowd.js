/* MAYOR-084: people on the walking network built from the survey's free space (data/civita-walks.json).
 * Anonymous figures only: not claims about real residents, visitor numbers or named people.
 * Visitors do what visitors do there: come over the bridge, through the gate, to the square, stop at a few places, walk back.
 * Residents make short trips between nearby places and go indoors. Each party walks together and keeps to its side of the lane.
 */
const CLOTHES=[0x425d5a,0x7c4d40,0x5c5969,0x9d8762,0x506779,0x866655,0x76744e,0xd8d2c4,0xc9b896,0x8e3d36,0x3a5a7a,0xb4a27e,0xe6e1d6,0x2f4a66];
const TROUSERS=[0x2f3338,0x41424a,0x6b5a45,0x3a4757,0x8a8171,0xcfc6b2];
const SKINS=[0xb98a6e,0xd0a486,0x9a6c50,0xe0b89a];
const HAIRS=[0x352e2b,0x5b4332,0x8c8780,0x2a2522,0xa07a4c,0xbdb8b0];
const SHOES=[0x2a2724,0x5b4634,0xd9d5cc];
const STRIDE=1.42,TAU=Math.PI*2;

function rng(seed){let s=seed>>>0||1;return ()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};}

/* Cumulative distances, so a route can be sampled by arc length, in either direction. */
export function prepareNetwork(network){
 if(!Array.isArray(network?.hubs)||!Array.isArray(network?.routes)||!network.hubs.length)throw new TypeError('Invalid Civita walking network');
 const byPair=new Map();
 const make=(points,deck)=>{const stops=[0];for(let i=1;i<points.length;i++)stops.push(stops[i-1]+Math.hypot(points[i][0]-points[i-1][0],points[i][1]-points[i-1][1]));return {points,stops,total:stops.at(-1),deck:Boolean(deck)};};
 for(const r of network.routes){byPair.set(r.a*1000+r.b,make(r.points,r.deck));byPair.set(r.b*1000+r.a,make([...r.points].reverse(),r.deck));}
 const index=name=>network.hubs.findIndex(h=>h.name===name);
 return {hubs:network.hubs,route:(a,b)=>byPair.get(a*1000+b)||null,index};
}

export function sampleRoute(r,d){
 const t=Math.max(0,Math.min(r.total,d));let lo=0,hi=r.stops.length-1;
 while(hi-lo>1){const m=(lo+hi)>>1;if(r.stops[m]<=t)lo=m;else hi=m;}
 const a=r.points[lo],b=r.points[hi],span=r.stops[hi]-r.stops[lo]||1,f=(t-r.stops[lo])/span;
 const len=Math.hypot(b[0]-a[0],b[1]-a[1])||1;
 return {x:a[0]+(b[0]-a[0])*f,z:a[1]+(b[1]-a[1])*f,clear:a[2]+(b[2]-a[2])*f,y:a.length>3&&b.length>3?a[3]+(b[3]-a[3])*f:null,dx:(b[0]-a[0])/len,dz:(b[1]-a[1])/len};
}

export function createCivitaCrowd(THREE,parent,rawNetwork,{maxPeople=110,heightAt,seated=[],obstacles=[],seed=8401}={}){
 if(!THREE?.Group||!parent?.add||typeof heightAt!=='function')throw new TypeError('Invalid Civita crowd context');
 const net=prepareNetwork(rawNetwork),random=rng(seed);
 const layer=new THREE.Group();layer.name='civita-survey-footpath-crowd';
 layer.userData={illustrativePeople:true,actualPopulationVerified:false,source:'Survey free space and mapped lanes',licenses:['CC-BY-4.0','ODbL-1.0'],physicalCollider:false,citizenIdentityChanges:false};
 parent.add(layer);
 const pick=a=>a[Math.floor(random()*a.length)];
 const far=net.index('Bridge far end'),head=net.index('Bridge head'),gate=net.index('Porta Santa Maria'),square=net.index('Piazza San Donato');
 const stops=net.hubs.map((h,i)=>({...h,i})).filter(h=>h.weight>0);
 const homes=stops.filter(h=>/stay|food|shop/.test(h.kind));
 const weighted=exclude=>{const list=stops.filter(h=>h.i!==exclude),sum=list.reduce((a,h)=>a+h.weight,0);let t=random()*sum;for(const h of list){t-=h.weight;if(t<=0)return h.i;}return list[0].i;};

 // Parties: mostly couples and small groups, some alone; a few residents on their own.
 const people=[],parties=[];
 const residents=Math.round(maxPeople*.14);
 const makePerson=(party,slot,size,isChild)=>{
  const skirt=!isChild&&random()<.28;
  const p={party,slot,child:isChild,skirt,scale:isChild?.62+random()*.1:.94+random()*.14,build:.92+random()*.2,
   cloth:pick(CLOTHES),legs:pick(TROUSERS),skin:pick(SKINS),hair:pick(HAIRS),shoe:pick(SHOES),hat:random()<.22,pack:random()<.22,longHair:random()<.4,
   x:0,y:0,z:0,yaw:random()*TAU,phase:random()*TAU,lat:0,push:0,back:slot===0?0:(.2+Math.floor((slot+1)/2)*.75),form:size===1?0:(slot%2?1:-1)*.42*(slot?1:.6),moving:false,visible:false,photo:false};
  people.push(p);return p;};
 const makeParty=(kind,size)=>{
  const party={kind,members:[],route:null,at:0,from:-1,to:-1,plan:[],dwell:0,indoors:false,wait:0,speed:.82+random()*.5,wander:random()*TAU,reach:.25+random()*.75,home:-1};
  const withChild=size>=3&&random()<.5;
  for(let k=0;k<size;k++)party.members.push(makePerson(party,k,size,withChild&&k===size-1));
  if(withChild)party.speed*=.86;
  parties.push(party);return party;};
 let count=0;
 for(let i=0;i<residents;i++){const q=makeParty('resident',1);q.home=pick(homes).i;q.speed=.7+random()*.3;count++;}
 while(count<maxPeople){const roll=random(),size=Math.min(maxPeople-count,roll<.24?1:roll<.68?2:roll<.88?3:4);makeParty('visitor',size);count+=size;}

 function visitorPlan(){
  const plan=[head,gate,square];let last=square;
  const n=1+Math.floor(random()*4);
  for(let k=0;k<n;k++){const next=weighted(last);plan.push(next);last=next;}
  plan.push(gate,head,far);
  return plan;
 }
 function dwellFor(party,hub){
  const h=net.hubs[hub],r=random();
  if(party.kind==='resident')return {time:20+r*90,indoors:/stay|food|shop/.test(h.kind)&&random()<.6};
  if(h.kind==='view')return {time:25+r*50,indoors:false};
  if(h.kind==='square')return {time:12+r*35,indoors:false};
  if(h.kind==='food')return {time:15+r*70,indoors:random()<.55};
  if(h.kind==='visit'||h.kind==='shop')return {time:15+r*50,indoors:random()<.5};
  return {time:0,indoors:false};
 }
 function setLeg(party,from,to){party.from=from;party.to=to;party.route=net.route(from,to);party.at=0;return Boolean(party.route);}
 function hide(party){for(const m of party.members)m.visible=false;}
 function spawn(party){
  party.plan=visitorPlan();party.from=far;party.indoors=false;party.dwell=0;
  if(!setLeg(party,far,party.plan.shift())){party.wait=20;return;}
  for(const m of party.members){m.lat=0;m.visible=true;}
 }
 function next(party,day){
  const here=party.to;
  if(party.kind==='visitor'){
   if(here===far){party.route=null;party.wait=8+random()*90;hide(party);return;}
   // Towards evening everybody starts back.
   if(day<.3&&party.plan.at(-1)===far&&party.plan.length>3)party.plan=[gate,head,far];
   if(!party.plan.length)party.plan=[gate,head,far];
   const stay=dwellFor(party,here);party.dwell=stay.time;party.indoors=stay.indoors;party.from=here;party.route=null;
   // The gate and the bridge head are passed through, not visited.
   if(stay.time<=0)depart(party,day);
   return;
  }
  const stay=dwellFor(party,here);party.dwell=stay.time*(day<.3?3:1);party.indoors=stay.indoors||day<.2;party.from=here;party.route=null;
 }
 function depart(party,day){
  party.indoors=false;
  for(const m of party.members)m.visible=true;
  if(party.kind==='visitor'){let to=party.plan.shift();if(to===party.from)to=party.plan.shift();if(to===undefined||!setLeg(party,party.from,to)){party.wait=10;party.route=null;hide(party);}return;}
  // Residents mostly go somewhere nearby, then home.
  const atHome=party.from===party.home;
  const here=net.hubs[party.from];
  let to=party.home;
  if(atHome){const near=stops.filter(h=>h.i!==party.from).sort((a,b)=>Math.hypot(a.x-here.x,a.z-here.z)-Math.hypot(b.x-here.x,b.z-here.z)).slice(0,6);to=pick(near).i;}
  if(!setLeg(party,party.from,to)){party.dwell=30;}
 }
 function stepParty(party,dt,day){
  if(party.kind==='visitor'&&!party.route&&party.dwell<=0&&party.wait>0){party.wait-=dt;if(party.wait<=0&&day>=.3)spawn(party);else if(party.wait<=0)party.wait=30;return;}
  if(party.route){
   const q=sampleRoute(party.route,party.at),step=party.speed*dt;
   // Uphill is slower; the sampler gives a direction only, so slope comes from a metre ahead.
   const ahead=sampleRoute(party.route,party.at+1),h0=q.y??heightAt(q.x,q.z),h1=ahead.y??heightAt(ahead.x,ahead.z),rise=Number.isFinite(h0)&&Number.isFinite(h1)?h1-h0:0;
   party.at+=step*Math.max(.55,1-Math.max(0,rise)*1.1);
   // In a square people stop wherever suits them, not all on one spot.
   const open=net.hubs[party.to].kind==='square'?Math.min(14,party.route.total*.3)*party.reach:0;
   if(party.at>=party.route.total-open)next(party,day);
   return;
  }
  if(party.dwell>0){party.dwell-=dt;if(party.dwell<=0)depart(party,day);}
 }
 function placeMember(m,dt){
  const party=m.party;
  if(!party.route){m.moving=false;if(party.indoors)m.visible=false;else if(party.members[0]!==m){const lead=party.members[0],turn=Math.atan2(lead.x-m.x,lead.z-m.z);m.yaw+=(((turn-m.yaw+Math.PI)%TAU+TAU)%TAU-Math.PI)*Math.min(1,dt*2);}return;}
  const q=sampleRoute(party.route,party.at-m.back),room=Math.max(0,q.clear-.8);
  // Keep right, drift in open squares, step aside for whoever is coming.
  const wander=Math.sin(party.at*.09+party.wander)*Math.min(4.5,Math.max(0,room-.7))*party.reach;
  const keep=Math.min(.75,room)*.7;
  const want=Math.max(-room,Math.min(room,keep+wander+m.form+m.push));
  m.lat+=(want-m.lat)*Math.min(1,dt*2.4);m.lat=Math.max(-room,Math.min(room,m.lat));
  // Right of travel is (dz,-dx) in this frame.
  const x=q.x+q.dz*m.lat,z=q.z-q.dx*m.lat,h=q.y??heightAt(x,z);
  m.x=x;m.z=z;if(Number.isFinite(h))m.y=h;
  const wantYaw=Math.atan2(q.dx,q.dz);let turn=((wantYaw-m.yaw+Math.PI)%TAU+TAU)%TAU-Math.PI;m.yaw+=turn*Math.min(1,dt*5);
  m.moving=true;m.phase+=party.speed*dt/STRIDE*TAU;
 }
 function separate(){
  for(const m of people)m.push*=.9;
  for(let i=0;i<people.length;i++){
   const a=people[i];if(!a.visible||!a.moving)continue;
   const ny=Math.cos(a.yaw),nx=Math.sin(a.yaw); // forward
   for(let j=0;j<people.length;j++){
    if(i===j)continue;const b=people[j];if(!b.visible||b.party===a.party)continue;
    const ox=b.x-a.x,oz=b.z-a.z,d=Math.hypot(ox,oz);if(d>2.2||d<1e-3)continue;
    const ahead=ox*nx+oz*ny;if(ahead<-.4)continue;
    const side=ox*ny-oz*nx; // >0: the other is to the right
    a.push+=(side>0?-1:1)*(2.2-d)*.12;
   }
   for(const o of obstacles){
    const ox=o.x-a.x,oz=o.z-a.z,d=Math.hypot(ox,oz),r=o.r+1.2;if(d>r)continue;
    const ahead=ox*nx+oz*ny;if(ahead<-1)continue;
    const side=ox*ny-oz*nx;a.push+=(side>0?-1:1)*(r-d)*.3;
   }
   a.push=Math.max(-3,Math.min(3,a.push));
  }
 }
 // Start mid-day: run the town forward so the first frame is not an empty bridge.
 function warm(day){
  parties.forEach((party,i)=>{
   if(party.kind==='resident'){party.from=party.home;party.dwell=random()*60;party.indoors=random()<.5;return;}
   party.wait=.1+random()*420;
  });
  for(let t=0;t<620;t+=.5){for(const party of parties)stepParty(party,.5,Math.max(day,.6));}
  // Everybody on a route needs a position before the first frame.
  for(const m of people){if(m.party.route){m.visible=true;const q=sampleRoute(m.party.route,m.party.at-m.back);m.lat=0;m.yaw=Math.atan2(q.dx,q.dz);}}
  for(let k=0;k<20;k++)for(const m of people)if(m.visible)placeMember(m,.1);
  for(const m of people)if(m.party.dwell>0&&!m.party.indoors&&!m.party.route){const h=net.hubs[m.party.from],a=random()*TAU,r=Math.min(1.8,Math.max(.2,h.clearance-.6))*random();m.x=h.x+Math.cos(a)*r;m.z=h.z+Math.sin(a)*r;const g=heightAt(m.x,m.z);if(Number.isFinite(g))m.y=g;m.visible=true;}
 }

 // One instanced mesh per body part: a crowd costs a dozen draw calls, not a thousand.
 const white=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.92});
 const down=(g,l)=>{g.translate(0,-l/2,0);return g;};
 const seatedCount=seated.length,total=people.length+seatedCount;
 const part=(name,geometry,n,shadow=true)=>{const m=new THREE.InstancedMesh(geometry,white,Math.max(1,n));m.name='civita-crowd-'+name;m.frustumCulled=false;m.castShadow=shadow;m.receiveShadow=false;m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);layer.add(m);return m;};
 const torsoG=new THREE.CylinderGeometry(.185,.15,.56,10);torsoG.translate(0,.28,0);
 const P={
  torso:part('torso',torsoG,total),
  chest:part('shoulders',new THREE.SphereGeometry(.19,10,7),total),
  hips:part('hips',new THREE.CylinderGeometry(.155,.165,.18,10),total),
  skirt:part('skirts',down(new THREE.CylinderGeometry(.16,.3,.56,10),.56),total),
  neck:part('necks',new THREE.CylinderGeometry(.05,.06,.1,6),total,false),
  head:part('heads',new THREE.SphereGeometry(.115,12,9),total),
  hair:part('hair',new THREE.SphereGeometry(.122,10,7,0,TAU,0,Math.PI*.58),total,false),
  long:part('long-hair',down(new THREE.CylinderGeometry(.1,.085,.24,8),.24),total,false),
  arm:part('upper-arms',down(new THREE.CylinderGeometry(.052,.045,.3,7),.3),total*2),
  fore:part('forearms',down(new THREE.CylinderGeometry(.045,.036,.27,7),.27),total*2),
  hand:part('hands',new THREE.SphereGeometry(.045,7,5),total*2,false),
  thigh:part('thighs',down(new THREE.CylinderGeometry(.078,.06,.44,7),.44),total*2),
  shin:part('shins',down(new THREE.CylinderGeometry(.058,.042,.42,7),.42),total*2),
  shoe:part('shoes',new THREE.BoxGeometry(.09,.07,.24),total*2),
  brim:part('hat-brims',new THREE.CylinderGeometry(.2,.21,.02,12),total,false),
  crown:part('hat-crowns',new THREE.CylinderGeometry(.1,.115,.09,10),total,false),
  pack:part('packs',new THREE.BoxGeometry(.26,.36,.13),total),
 };
 const color=new THREE.Color(),zero=new THREE.Matrix4().makeScale(0,0,0);
 const paint=(mesh,i,hex)=>{mesh.setColorAt(i,color.setHex(hex));};
 const STRAW=0xd6c08e,PACK=0x3f5a4a,everyone=[...people,...seated.map(()=>{const p={child:false,skirt:random()<.3,scale:.96+random()*.1,build:1,cloth:pick(CLOTHES),legs:pick(TROUSERS),skin:pick(SKINS),hair:pick(HAIRS),shoe:pick(SHOES),hat:random()<.15,pack:false,longHair:random()<.4};return p;})];
 everyone.forEach((p,i)=>{
  paint(P.torso,i,p.cloth);paint(P.chest,i,p.cloth);paint(P.hips,i,p.skirt?p.cloth:p.legs);paint(P.skirt,i,p.legs);paint(P.neck,i,p.skin);paint(P.head,i,p.skin);paint(P.hair,i,p.hair);paint(P.long,i,p.hair);paint(P.brim,i,STRAW);paint(P.crown,i,STRAW);paint(P.pack,i,PACK);
  for(const s of [0,1]){const k=i*2+s;paint(P.arm,k,p.cloth);paint(P.fore,k,p.cloth);paint(P.hand,k,p.skin);paint(P.thigh,k,p.skirt?p.skin:p.legs);paint(P.shin,k,p.skirt?p.skin:p.legs);paint(P.shoe,k,p.shoe);}
 });
 for(const m of Object.values(P))if(m.instanceColor)m.instanceColor.needsUpdate=true;
 const root=new THREE.Matrix4(),L=new THREE.Matrix4(),A=new THREE.Matrix4(),B=new THREE.Matrix4(),C=new THREE.Matrix4(),pos=new THREE.Vector3(),quat=new THREE.Quaternion(),scl=new THREE.Vector3(),up=new THREE.Vector3(0,1,0);
 const local=(out,base,x,y,z,rx=0)=>{L.makeRotationX(rx);L.setPosition(x,y,z);return out.multiplyMatrices(base,L);};
 function pose(i,p,x,y,z,yaw,{thighs=[0,0],knees=[0,0],arms=[0,0],elbows=[-.12,-.12],bob=0}){
  pos.set(x,y+bob,z);quat.setFromAxisAngle(up,yaw);scl.setScalar(p.scale);root.compose(pos,quat,scl);
  const w=p.build;
  P.torso.setMatrixAt(i,local(A,root,0,.92,0));
  P.chest.setMatrixAt(i,local(A,root,0,1.42,0).scale(new THREE.Vector3(1.1*w,.55,.72)));
  P.hips.setMatrixAt(i,local(A,root,0,.93,0));
  P.skirt.setMatrixAt(i,p.skirt?local(A,root,0,.98,0):zero);
  P.neck.setMatrixAt(i,local(A,root,0,1.52,0));
  P.head.setMatrixAt(i,local(A,root,0,1.64,.01));
  P.hair.setMatrixAt(i,local(A,root,0,1.655,-.012));
  P.long.setMatrixAt(i,p.longHair&&!p.child?local(A,root,0,1.66,-.09):zero);
  P.brim.setMatrixAt(i,p.hat?local(A,root,0,1.745,0):zero);P.crown.setMatrixAt(i,p.hat?local(A,root,0,1.8,0):zero);
  P.pack.setMatrixAt(i,p.pack?local(A,root,0,1.2,-.2):zero);
  for(const s of [0,1]){
   const k=i*2+s,side=s?1:-1;
   local(A,root,side*.215*w,1.43,0,arms[s]);P.arm.setMatrixAt(k,A);
   local(B,A,0,-.3,0,elbows[s]);P.fore.setMatrixAt(k,B);
   P.hand.setMatrixAt(k,local(C,B,0,-.3,0));
   local(A,root,side*.09,.9,0,thighs[s]);P.thigh.setMatrixAt(k,A);
   local(B,A,0,-.44,0,knees[s]);P.shin.setMatrixAt(k,B);
   local(C,B,0,-.41,.05,-knees[s]-thighs[s]);P.shoe.setMatrixAt(k,C);
  }
 }
 function erase(i){for(const key of ['torso','chest','hips','skirt','neck','head','hair','long','brim','crown','pack'])P[key].setMatrixAt(i,zero);for(const s of [0,1])for(const key of ['arm','fore','hand','thigh','shin','shoe'])P[key].setMatrixAt(i*2+s,zero);}
 seated.forEach((seat,n)=>{const i=people.length+n;pose(i,everyone[i],seat.x,seat.y-.9,seat.z,seat.yaw+Math.PI,{thighs:[-1.5,-1.5],knees:[1.5,1.5],arms:[-.55,-.55],elbows:[-.8,-.8]});});

 let last=null,warmed=false,tick=0;
 function update(day=1,time=0){
  const light=Math.max(0,Math.min(1,Number(day)||0));
  if(!warmed){warm(light);warmed=true;}
  const dt=last===null?0:Math.min(.1,Math.max(0,time-last));last=time;
  for(const party of parties)stepParty(party,dt,light);
  if((tick++&1)===0)separate();
  for(let i=0;i<people.length;i++){
   const p=people[i];
   if(p.visible)placeMember(p,dt);
   if(!p.visible){erase(i);continue;}
   if(p.moving){
    const s=Math.sin(p.phase),c=Math.cos(p.phase),amp=p.child?.5:.42;
    pose(i,p,p.x,p.y+.02,p.z,p.yaw,{thighs:[-s*amp,s*amp],knees:[.12+.75*Math.max(0,c),.12+.75*Math.max(0,-c)],arms:[s*.34,-s*.34],elbows:[-.28,-.28],bob:Math.abs(c)*.028});
   }else{
    // Standing: shifting weight; one of a group may be taking a photograph.
    const taking=p.slot===0&&p.party.kind==='visitor'&&p.party.members.length>1&&Math.sin(time*.13+p.phase)>.55;
    const look=Math.sin(time*.21+p.phase)*.5;
    pose(i,p,p.x,p.y+.02,p.z,p.yaw+look*Math.min(1,dt*20+.2),taking?{arms:[-1.35,-1.35],elbows:[-1.15,-1.15]}:{arms:[.04,-.04],elbows:[-.1,-.1]});
   }
  }
  for(const m of Object.values(P))m.instanceMatrix.needsUpdate=true;
 }
 layer.userData.renderedVisualPedestrians=people.length;layer.userData.seated=seatedCount;layer.userData.parties=parties.length;
 return {group:layer,update,count:people.length,selfGrounded:true,people,parties};
}
