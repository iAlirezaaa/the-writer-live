/* MAYOR-082 — what makes Civita more than boxes on a hill.
 * MEASURED (Regione Lazio DBGT): retaining and boundary walls, single trees, wood outlines, bridge deck edges and levels.
 * PUBLISHED: bridge spans and piers (ENEA study, doi:10.1007/s13349-022-00628-7).
 * INTERPRETIVE, modelled from photographs: San Donato's facade, the bell chamber, the gate, lanterns, planters.
 */
function rng(seed){let s=seed>>>0||1;return ()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};}

class Strip{
 constructor(){this.p=[];this.n=[];this.uv=[];}
 quad(a,b,c,d){
  const ux=b[0]-a[0],uy=b[1]-a[1],uz=b[2]-a[2],vx=d[0]-a[0],vy=d[1]-a[1],vz=d[2]-a[2];
  let x=uy*vz-uz*vy,y=uz*vx-ux*vz,z=ux*vy-uy*vx;const l=Math.hypot(x,y,z)||1;x/=l;y/=l;z/=l;
  this.p.push(...a,...b,...c,...a,...c,...d);for(let i=0;i<6;i++)this.n.push(x,y,z);
  // Texture runs along the face: horizontally by whichever axis it follows, flat tops by plan position.
  const flat=Math.abs(y)>.7,alongX=Math.abs(x)<Math.abs(z),uv=q=>flat?[q[0]/3.6,q[2]/3.6]:[(alongX?q[0]:q[2])/3.6,q[1]/3.6];
  this.uv.push(...uv(a),...uv(b),...uv(c),...uv(a),...uv(c),...uv(d));
 }
 geometry(THREE){const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(this.p,3));
  g.setAttribute('normal',new THREE.Float32BufferAttribute(this.n,3));
  g.setAttribute('uv',new THREE.Float32BufferAttribute(this.uv,2));return g;}
}

export function wallProfile(point,heightAt,kind){
 const ground=heightAt(point[0],point[1]);
 if(kind==='retaining'){const top=Number.isFinite(point[2])?point[2]:ground;return {top:top+.45,bottom:Math.min(ground,top)-2.4};}
 return {top:(Number.isFinite(ground)?ground:point[2]||0)+1.25,bottom:(Number.isFinite(ground)?ground:point[2]||0)-.3};
}

function addWalls(strip,lines,heightAt,kind,width,bounds){
 for(const line of lines){
  if(!line.some(p=>p[0]>bounds[0]&&p[0]<bounds[2]&&p[1]>bounds[1]&&p[1]<bounds[3]))continue;
  for(let i=0;i<line.length-1;i++){
   const a=line[i],b=line[i+1],len=Math.hypot(b[0]-a[0],b[1]-a[1]);
   if(len<.05||len>60)continue;
   const nx=-(b[1]-a[1])/len*width/2,nz=(b[0]-a[0])/len*width/2,A=wallProfile(a,heightAt,kind),B=wallProfile(b,heightAt,kind);
   if(![A.top,A.bottom,B.top,B.bottom].every(Number.isFinite))continue;
   strip.quad([a[0]+nx,A.bottom,a[1]+nz],[b[0]+nx,B.bottom,b[1]+nz],[b[0]+nx,B.top,b[1]+nz],[a[0]+nx,A.top,a[1]+nz]);
   strip.quad([b[0]-nx,B.bottom,b[1]-nz],[a[0]-nx,A.bottom,a[1]-nz],[a[0]-nx,A.top,a[1]-nz],[b[0]-nx,B.top,b[1]-nz]);
   strip.quad([a[0]+nx,A.top,a[1]+nz],[b[0]+nx,B.top,b[1]+nz],[b[0]-nx,B.top,b[1]-nz],[a[0]-nx,A.top,a[1]-nz]);
  }
 }
}

function buildTrees(THREE,layer,data){
 const all=[...data.trees_measured.map(t=>[...t,1]),...data.trees_scattered.map(t=>[...t,0])];
 const random=rng(82),count=all.length;
 const trunk=new THREE.InstancedMesh(new THREE.CylinderGeometry(.12,.2,1,5),new THREE.MeshStandardMaterial({color:0x4a3a2a,roughness:1}),count);
 const crown=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,1),new THREE.MeshStandardMaterial({color:0xffffff,roughness:1,flatShading:true}),count);
 const side=new THREE.InstancedMesh(crown.geometry,crown.material,count);
 const m=new THREE.Matrix4(),q=new THREE.Quaternion(),e=new THREE.Euler(),s=new THREE.Vector3(),p=new THREE.Vector3(),c=new THREE.Color();
 all.forEach(([x,z,y],i)=>{
  // Surveyed trees in and beside the village are often cypresses; the rest are low, broad oaks and scrub.
  const measured=all[i][3]===1,village=x>-135&&x<175&&z>-115&&z<75,cypress=measured&&village&&random()<.4;
  const h=cypress?8+random()*5:3.6+random()*4.6,r=cypress?.62+random()*.3:1.9+random()*2.1;
  e.set(0,random()*6.28,0);q.setFromEuler(e);
  p.set(x,y+h*(cypress?.2:.2),z);s.set(cypress?.7:1+r*.12,h*(cypress?.4:.42),cypress?.7:1+r*.12);m.compose(p,q,s);trunk.setMatrixAt(i,m);
  p.set(x,y+h*(cypress?.56:.62),z);s.set(r,h*(cypress?.56:.42),r);m.compose(p,q,s);crown.setMatrixAt(i,m);
  if(cypress)c.setRGB(.05+random()*.03,.1+random()*.04,.05+random()*.02);else c.setRGB(.1+random()*.08,.17+random()*.1,.06+random()*.04);crown.setColorAt(i,c);
  // A second, offset mass breaks the lollipop outline.
  const a=random()*6.28,k=r*.62;p.set(x+Math.cos(a)*k,y+h*(cypress?.3:.5),z+Math.sin(a)*k);s.set(cypress?.01:r*.68,cypress?.01:h*.3,cypress?.01:r*.68);m.compose(p,q,s);side.setMatrixAt(i,m);
  c.multiplyScalar(.8+random()*.3);side.setColorAt(i,c);
 });
 for(const mesh of [trunk,crown,side]){mesh.instanceMatrix.needsUpdate=true;mesh.castShadow=true;mesh.frustumCulled=false;}
 crown.instanceColor.needsUpdate=true;side.instanceColor.needsUpdate=true;trunk.name='civita-tree-trunks';crown.name='civita-tree-crowns';side.name='civita-tree-side-crowns';
 layer.add(trunk,crown,side);
 return count;
}

function arcResample(line,n){
 const d=[0];for(let i=1;i<line.length;i++)d.push(d[i-1]+Math.hypot(line[i][0]-line[i-1][0],line[i][1]-line[i-1][1]));
 const total=d.at(-1),out=[];
 for(let k=0;k<=n;k++){
  const t=total*k/n;let j=1;while(j<line.length-1&&d[j]<t)j++;
  const f=(t-d[j-1])/((d[j]-d[j-1])||1),a=line[j-1],b=line[j];
  out.push([a[0]+(b[0]-a[0])*f,a[1]+(b[1]-a[1])*f,a[2]+(b[2]-a[2])*f]);
 }
 return out;
}

/* The two long surveyed deck edges, ordered from the Civita end. */
export function bridgeEdges(data){
 // The sheet also holds other bridges; Civita's is the pair between the village and Bagnoregio.
 const long=data.bridge_edges.filter(e=>e.length>8&&e.every(p=>p[0]>-400&&p[0]<-100&&p[1]>0&&p[1]<220));
 if(long.length!==2)throw new Error('Expected two surveyed bridge edges');
 const fromCivita=e=>e[0][0]>e.at(-1)[0]?e:[...e].reverse();
 return long.map(fromCivita);
}

function buildBridge(THREE,layer,data,heightAt){
 const [L,R]=bridgeEdges(data).map(e=>arcResample(e,84));
 const deck=new Strip(),under=new Strip();
 for(let i=0;i<84;i++){
  const a=L[i],b=L[i+1],c=R[i+1],d=R[i],y=p=>[p[0],p[2],p[1]],dn=p=>[p[0],p[2]-.8,p[1]];
  deck.quad(y(a),y(d),y(c),y(b));
  under.quad(dn(a),dn(b),dn(c),dn(d));
  under.quad(dn(b),dn(a),y(a),y(b));
  under.quad(dn(d),dn(c),y(c),y(d));
 }
 const concrete=new THREE.MeshStandardMaterial({color:0xdcd9cf,roughness:.92,side:THREE.DoubleSide});
 const paving=new THREE.MeshStandardMaterial({color:0xb0aba0,roughness:.95,side:THREE.DoubleSide});
 const deckMesh=new THREE.Mesh(deck.geometry(THREE),paving);deckMesh.name='civita-bridge-deck';deckMesh.receiveShadow=true;
 const underMesh=new THREE.Mesh(under.geometry(THREE),concrete);underMesh.name='civita-bridge-beams';underMesh.castShadow=true;
 layer.add(deckMesh,underMesh);
 // 14 spans, 13 piers: four columns on the first nine from the Civita end, two on the last four (ENEA).
 const columns=[];
 for(let k=1;k<=13;k++){
  const i=Math.round(k*84/14),a=L[i],b=R[i],n=k<=9?4:2;
  for(let c=0;c<n;c++){
   const t=n===2?(c?.72:.28):(c+.5)/n,x=a[0]+(b[0]-a[0])*t,z=a[1]+(b[1]-a[1])*t,top=a[2]+(b[2]-a[2])*t-.75,g=heightAt(x,z);
   if(Number.isFinite(g)&&g<top-.3)columns.push({x,z,top,bottom:g-1});
  }
 }
 const col=new THREE.InstancedMesh(new THREE.CylinderGeometry(.25,.25,1,10),concrete,columns.length);
 const m=new THREE.Matrix4(),q=new THREE.Quaternion(),p=new THREE.Vector3(),s=new THREE.Vector3();
 columns.forEach((c,i)=>{p.set(c.x,(c.top+c.bottom)/2,c.z);s.set(1,c.top-c.bottom,1);m.compose(p,q,s);col.setMatrixAt(i,m);});
 col.instanceMatrix.needsUpdate=true;col.castShadow=true;col.frustumCulled=false;col.name='civita-bridge-columns';layer.add(col);
 // Railings on both edges
 const rail=new Strip();
 for(const e of [L,R])for(let i=0;i<84;i++){
  const a=e[i],b=e[i+1];
  for(const h of [1.05,.55])rail.quad([a[0],a[2]+h,a[1]],[b[0],b[2]+h,b[1]],[b[0],b[2]+h+.05,b[1]],[a[0],a[2]+h+.05,a[1]]);
  if(i%2===0)rail.quad([a[0]-.03,a[2],a[1]],[a[0]+.03,a[2],a[1]],[a[0]+.03,a[2]+1.1,a[1]],[a[0]-.03,a[2]+1.1,a[1]]);
 }
 const railMesh=new THREE.Mesh(rail.geometry(THREE),new THREE.MeshStandardMaterial({color:0x4b4c4a,metalness:.4,roughness:.6,side:THREE.DoubleSide}));
 railMesh.name='civita-bridge-railings';layer.add(railMesh);
 return columns.length;
}

function centroid(ring){return [ring.reduce((a,p)=>a+p[0],0)/ring.length,ring.reduce((a,p)=>a+p[1],0)/ring.length];}
function facing(v,dir){
 let best=null;
 v.ring.forEach((a,i)=>{
  const b=v.ring[(i+1)%v.ring.length],len=Math.hypot(b[0]-a[0],b[1]-a[1]),[ox,oz]=v.walls[i],score=(ox*dir[0]+oz*dir[1])*Math.min(len,12);
  if(!best||score>best.score)best={score,a,b,len,ox,oz};
 });
 return best;
}
const box=(THREE,g,mat,w,h,d,x,y,z)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;g.add(m);return m;};

/* A group whose +Z faces out of a wall, centred at the wall's foot. */
function wallFrame(THREE,parent,wall,y,name){
 const g=new THREE.Group();g.name=name;
 g.position.set((wall.a[0]+wall.b[0])/2,y,(wall.a[1]+wall.b[1])/2);
 g.rotation.y=Math.atan2(wall.ox,wall.oz);parent.add(g);return g;
}
function arch(THREE,g,mat,dark,width,height,x,y,z,pointed=false){
 const shape=new THREE.Shape(),w=width/2,spring=height-w*(pointed?1.2:1);
 shape.moveTo(-w,0);shape.lineTo(-w,spring);
 if(pointed)shape.quadraticCurveTo(-w*.9,spring+w*.8,0,height);else shape.absarc(0,spring,w,Math.PI,0,true);
 if(pointed)shape.quadraticCurveTo(w*.9,spring+w*.8,w,spring);
 shape.lineTo(w,0);shape.closePath();
 // No fill means an open arch you can walk through.
 if(dark){const opening=new THREE.Mesh(new THREE.ShapeGeometry(shape),dark);opening.position.set(x,y,z+.02);g.add(opening);}
 const frame=new THREE.Shape();const fw=w+.34;
 frame.moveTo(-fw,0);frame.lineTo(-fw,spring);
 if(pointed)frame.quadraticCurveTo(-fw*.9,spring+fw*.85,0,height+.42);else frame.absarc(0,spring,fw,Math.PI,0,true);
 if(pointed)frame.quadraticCurveTo(fw*.9,spring+fw*.85,fw,spring);
 frame.lineTo(fw,0);frame.closePath();frame.holes.push(shape);
 const f=new THREE.Mesh(new THREE.ExtrudeGeometry(frame,{depth:.22,bevelEnabled:false}),mat);f.position.set(x,y,z-.04);f.castShadow=true;g.add(f);
}

function buildSanDonato(THREE,layer,data){
 const v=data.volumes.find(b=>b.id.endsWith('-484')&&b.edifice.endsWith('040709'));
 if(!v)return false;
 const wall=facing(v,[-.95,.25]),W=wall.len+1.2,H=v.eave_y-v.base_y+1.2;
 const g=wallFrame(THREE,layer,wall,v.base_y,'civita-san-donato-facade');
 g.userData={identity:'Chiesa di San Donato (OSM)',interpretive:'facade modelled from photographs',heightMeasured:true};
 const plaster=new THREE.MeshStandardMaterial({color:0xd4a584,roughness:.9});
 const trim=new THREE.MeshStandardMaterial({color:0xcbbfa8,roughness:.85});
 const stone=new THREE.MeshStandardMaterial({color:0x8d8676,roughness:.95});
 const wood=new THREE.MeshStandardMaterial({color:0x6a3f28,roughness:.8});
 const dark=new THREE.MeshStandardMaterial({color:0x14171a,roughness:.5});
 box(THREE,g,plaster,W,H,.5,0,H/2,.2);
 const tri=new THREE.Shape();tri.moveTo(-W*.3,0);tri.lineTo(W*.3,0);tri.lineTo(0,W*.13);tri.closePath();
 const pediment=new THREE.Mesh(new THREE.ExtrudeGeometry(tri,{depth:.5,bevelEnabled:false}),plaster);pediment.position.set(0,H+.3,-.05);pediment.castShadow=true;g.add(pediment);
 const upper=new THREE.Mesh(new THREE.BoxGeometry(W*.6,.9,.5),plaster);upper.position.set(0,H+.1,.2);g.add(upper);
 box(THREE,g,trim,W+.2,.28,.66,0,H*.52,.22);box(THREE,g,trim,W+.2,.3,.66,0,H,.22);
 for(const x of [-W/2+.2,-W/6,W/6,W/2-.2])box(THREE,g,trim,.34,H,.62,x,H/2,.22);
 // Three doors, the central one tallest; round windows over the sides; one window above the portal.
 for(const [x,w,h] of [[0,1.9,3.6],[-W/3,1.3,2.6],[W/3,1.3,2.6]]){
  // Round-headed portals, as in the photographs; the leaf fills the arch.
  arch(THREE,g,stone,wood,w,h,x,.68,.46);
 }
 for(const x of [-W/3,W/3]){
  const ring=new THREE.Mesh(new THREE.TorusGeometry(.62,.13,10,28),stone);ring.position.set(x,H*.74,.5);g.add(ring);
  const pane=new THREE.Mesh(new THREE.CircleGeometry(.6,24),dark);pane.position.set(x,H*.74,.46);g.add(pane);
 }
 box(THREE,g,stone,1.5,2.1,.2,0,H*.78,.5);box(THREE,g,dark,1.05,1.65,.08,0,H*.78,.58);
 const cross=new THREE.Group();cross.position.set(0,H+.3+W*.13+.5,.2);g.add(cross);box(THREE,cross,stone,.1,1,.1,0,0,0);box(THREE,cross,stone,.55,.1,.1,0,.14,0);
 for(let s=0;s<4;s++)box(THREE,g,stone,W*.86-s*.3,.17,.5,0,.09+s*.17,1.9-s*.46);
 return true;
}

function buildBellTower(THREE,layer,data){
 const v=data.volumes.find(b=>b.id.endsWith('-003')&&b.edifice.endsWith('034072'));
 if(!v)return false;
 const stone=new THREE.MeshStandardMaterial({color:0x8d8676,roughness:.95}),dark=new THREE.MeshStandardMaterial({color:0x0f1113,roughness:.6}),face=new THREE.MeshStandardMaterial({color:0xd8d0bf,roughness:.8});
 for(const wall of v.walls.map((_,i)=>{const a=v.ring[i],b=v.ring[(i+1)%v.ring.length];return {a,b,len:Math.hypot(b[0]-a[0],b[1]-a[1]),ox:v.walls[i][0],oz:v.walls[i][1]};}).filter(w=>w.len>3)){
  const g=wallFrame(THREE,layer,wall,v.eave_y-6.6,'civita-bell-chamber');
  arch(THREE,g,stone,dark,1.7,4.6,0,0,.1);
  box(THREE,g,stone,wall.len+.3,.22,.3,0,-.5,.08);
  const dial=new THREE.Mesh(new THREE.CircleGeometry(.8,24),face);dial.position.set(0,-2.6,.14);g.add(dial);
 }
 return true;
}

function buildGate(THREE,layer,data,heightAt,passage=null,wallMap=null){
 const place=data.places.find(p=>p.name==='Porta Santa Maria');
 if(!place)return false;
 if(passage)return buildOpenGate(THREE,layer,heightAt,passage,wallMap);
 // The gate is a passage through the outermost building; set it on that building's wall nearest the mapped point.
 let wall=null;
 for(const v of data.volumes){
  v.ring.forEach((a,i)=>{
   const b=v.ring[(i+1)%v.ring.length],len=Math.hypot(b[0]-a[0],b[1]-a[1]);
   if(len<4||v.walls[i][0]>-.3)return;   // only long walls facing the bridge side
   const d=Math.hypot((a[0]+b[0])/2-place.x,(a[1]+b[1])/2-place.z);
   if(!wall||d<wall.d)wall={a,b,len,ox:v.walls[i][0],oz:v.walls[i][1],d};
  });
 }
 if(!wall||wall.d>25)return false;
 const mx=(wall.a[0]+wall.b[0])/2,mz=(wall.a[1]+wall.b[1])/2,base=heightAt(mx+wall.ox*2,mz+wall.oz*2);
 if(!Number.isFinite(base))return false;
 const g=wallFrame(THREE,layer,wall,base,'civita-porta-santa-maria');g.position.x+=wall.ox*1.5;g.position.z+=wall.oz*1.5;
 g.userData={identity:'Porta Santa Maria (OSM node 1079071522)',interpretive:'form modelled from photographs; dimensions not surveyed'};
 const tufa=new THREE.MeshStandardMaterial({color:0x7d6a4e,roughness:.97}),stone=new THREE.MeshStandardMaterial({color:0x7f796c,roughness:.95}),dark=new THREE.MeshStandardMaterial({color:0x0e0f10,roughness:.7});
 const roof=new THREE.MeshStandardMaterial({color:0x7a5c46,roughness:.9});
 const W=6.4,H=11.5,D=3.2;
 for(const sx of [-1,1])box(THREE,g,tufa,(W-3.2)/2,H,D,sx*(W/2-(W-3.2)/4),H/2,0);
 box(THREE,g,tufa,3.3,H-5.6,D,0,5.6+(H-5.6)/2,0);
 arch(THREE,g,stone,dark,3.1,5.7,0,0,D/2);
 box(THREE,g,dark,3.1,5.6,.05,0,2.8,-D/2+.1);
 // Three small arches near the top, and the two lions over the gate
 for(const ax of [-1.5,0,1.5])arch(THREE,g,stone,dark,.8,1.6,ax,H-2.5,D/2);
 for(const sx of [-1.15,1.15]){
  box(THREE,g,stone,.95,.55,.5,sx,6.8,D/2+.2);
  const head=new THREE.Mesh(new THREE.SphereGeometry(.26,10,8),stone);head.position.set(sx,7.2,D/2+.4);g.add(head);
 }
 box(THREE,g,roof,W+.5,.28,D+.5,0,H+.14,0);
 return true;
}

/* The gate stands on the outer end of the passage the walkers use, with the same axis, so its arch really leads through. */
function buildOpenGate(THREE,layer,heightAt,passage,wallMap=null){
 const [ox,oz]=passage.outward,[ax,az]=passage.axis[0],base=heightAt(ax,az);
 if(!Number.isFinite(base))return false;
 const g=new THREE.Group();g.name='civita-porta-santa-maria';
 // The axis starts 1.5 m outside the block; the gate sits on the block's face, set slightly into it.
 const D=3.2,W=6.6,H=11.5,cx=ax-ox*(1.5-D/2+.5),cz=az-oz*(1.5-D/2+.5);
 g.position.set(cx,base,cz);g.rotation.y=Math.atan2(ox,oz);layer.add(g);
 g.userData={identity:'Porta Santa Maria (OSM node 1079071522)',interpretive:'form modelled from photographs; dimensions not surveyed',openPassage:true};
 const gateMap=wallMap?wallMap.clone():null;if(gateMap){gateMap.repeat.set(1.6,3.2);gateMap.needsUpdate=true;}
 const tufa=new THREE.MeshStandardMaterial({color:gateMap?0xffffff:0x8e7a5a,map:gateMap,roughness:.97}),stone=new THREE.MeshStandardMaterial({color:0x8a8476,roughness:.95}),dark=new THREE.MeshStandardMaterial({color:0x17161a,roughness:.7});
 const roof=new THREE.MeshStandardMaterial({color:0x7a5c46,roughness:.9}),open=passage.width_m;
 for(const sx of [-1,1])box(THREE,g,tufa,(W-open)/2,H,D,sx*(W/2-(W-open)/4),H/2,0);
 box(THREE,g,tufa,open+.05,H-5.6,D,0,5.6+(H-5.6)/2,0);
 arch(THREE,g,stone,null,open-.1,5.7,0,0,D/2);
 for(const ax2 of [-1.5,0,1.5])arch(THREE,g,stone,dark,.8,1.6,ax2,H-2.5,D/2);
 for(const sx of [-1.15,1.15]){
  box(THREE,g,stone,.95,.55,.5,sx,6.8,D/2+.2);
  const head=new THREE.Mesh(new THREE.SphereGeometry(.26,10,8),stone);head.position.set(sx,7.2,D/2+.4);g.add(head);
 }
 box(THREE,g,roof,W+.5,.28,D+.5,0,H+.14,0);
 return true;
}

/* Wall lanterns along the mapped lanes, planters by some doors. */
function buildStreetLife(THREE,layer,data,heightAt,doors){
 // Iron lanterns on brackets beside doors, as in the photographs; no free-standing lamp posts in the lanes.
 const random=rng(1309),lamps=[];
 (doors||[]).filter(d=>d.x>-130&&d.x<170&&d.z>-110&&d.z<70).forEach((d,i)=>{if(i%6)return;lamps.push({x:d.x+Math.sin(d.yaw)*.42+Math.cos(d.yaw)*1.2,z:d.z+Math.cos(d.yaw)*.42-Math.sin(d.yaw)*1.2,y:d.y+3.2,yaw:d.yaw});});
 const bulbMaterial=new THREE.MeshBasicMaterial({color:0x4a4436});
 const bulbs=new THREE.InstancedMesh(new THREE.SphereGeometry(.13,8,6),bulbMaterial,Math.max(1,lamps.length));
 const poles=new THREE.InstancedMesh(new THREE.BoxGeometry(.05,.05,.5),new THREE.MeshStandardMaterial({color:0x26282a,metalness:.4,roughness:.6}),Math.max(1,lamps.length));
 const m=new THREE.Matrix4(),q=new THREE.Quaternion(),p=new THREE.Vector3(),s=new THREE.Vector3(1,1,1);
 const lampTurn=new THREE.Quaternion(),lampAxis=new THREE.Vector3(0,1,0);
 lamps.forEach((l,i)=>{p.set(l.x,l.y,l.z);s.set(1,1,1);m.compose(p,q,s);bulbs.setMatrixAt(i,m);lampTurn.setFromAxisAngle(lampAxis,l.yaw);p.set(l.x-Math.sin(l.yaw)*.2,l.y+.16,l.z-Math.cos(l.yaw)*.2);m.compose(p,lampTurn,s);poles.setMatrixAt(i,m);});
 bulbs.count=poles.count=lamps.length;bulbs.instanceMatrix.needsUpdate=poles.instanceMatrix.needsUpdate=true;bulbs.frustumCulled=poles.frustumCulled=false;
 bulbs.name='civita-lane-lanterns';poles.name='civita-lane-lantern-posts';poles.castShadow=true;layer.add(bulbs,poles);

 // Nothing stands in front of the church portals.
 const church=data.volumes.find(b=>b.id.endsWith('-484')&&b.edifice.endsWith('040709'));
 const front=church?facing(church,[-.95,.25]):null,fx=front?(front.a[0]+front.b[0])/2:0,fz=front?(front.a[1]+front.b[1])/2:0;
 const chosen=(doors||[]).filter(d=>random()<.22&&(!front||Math.hypot(d.x-fx,d.z-fz)>13));
 const pots=new THREE.InstancedMesh(new THREE.CylinderGeometry(.24,.17,.42,10),new THREE.MeshStandardMaterial({color:0x9a5a3c,roughness:.9}),Math.max(1,chosen.length));
 const bush=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.42,1),new THREE.MeshStandardMaterial({color:0xffffff,roughness:1,flatShading:true}),Math.max(1,chosen.length));
 const c=new THREE.Color();
 chosen.forEach((d,i)=>{
  const side=random()<.5?-1:1,x=d.x+Math.sin(d.yaw)*.55+Math.cos(d.yaw)*side*1.1,z=d.z+Math.cos(d.yaw)*.55-Math.sin(d.yaw)*side*1.1;
  p.set(x,d.y+.21,z);s.set(1,1,1);m.compose(p,q,s);pots.setMatrixAt(i,m);
  p.set(x,d.y+.72,z);s.setScalar(.8+random()*.5);m.compose(p,q,s);bush.setMatrixAt(i,m);
  if(random()<.35)c.setRGB(.62,.16,.22);else c.setRGB(.2+random()*.1,.34+random()*.12,.16);bush.setColorAt(i,c);
 });
 pots.count=bush.count=chosen.length;pots.instanceMatrix.needsUpdate=bush.instanceMatrix.needsUpdate=true;if(bush.instanceColor)bush.instanceColor.needsUpdate=true;
 pots.frustumCulled=bush.frustumCulled=false;pots.castShadow=bush.castShadow=true;pots.name='civita-door-planters';bush.name='civita-door-plants';layer.add(pots,bush);
 return {lamps:lamps.length,planters:chosen.length,bulbMaterial};
}

export function buildCivitaDetails(THREE,parent,data,heightAt,{doors=[],passages=[],wallMap=null}={}){
 const layer=new THREE.Group();layer.name='civita-measured-details';
 const strip=new Strip(),bounds=[-520,-300,330,330];
 addWalls(strip,data.retaining_walls,heightAt,'retaining',.45,bounds);
 addWalls(strip,data.boundary_walls,heightAt,'boundary',.35,bounds);
 const walls=new THREE.Mesh(strip.geometry(THREE),new THREE.MeshStandardMaterial({color:wallMap?0xe6dccb:0x927c5c,map:wallMap,roughness:.97,side:THREE.DoubleSide}));
 walls.name='civita-survey-walls';walls.castShadow=true;walls.receiveShadow=true;layer.add(walls);
 const trees=buildTrees(THREE,layer,data);
 const columns=buildBridge(THREE,layer,data,heightAt);
 const landmarks={sanDonato:buildSanDonato(THREE,layer,data),bellTower:buildBellTower(THREE,layer,data),gate:buildGate(THREE,layer,data,heightAt,passages[0]||null,wallMap)};
 const street=buildStreetLife(THREE,layer,data,heightAt,doors);
 layer.userData={source:data.source.attribution,measuredWalls:true,landmarksInterpretive:true,physicalCollider:false};
 parent.add(layer);
 return {layer,street,counts:{trees,columns,lamps:street.lamps,planters:street.planters,...landmarks}};
}
