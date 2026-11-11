/* MAYOR-085: the writer's house, built the way the rest of the town is built.
 *
 * MEASURED: the building it occupies (Regione Lazio DBGT volume, wall line, height, roof, ground).
 * INTERPRETIVE: which house this is, every opening, the outside stair and the room plan.
 * Stone, tile, window frames and doors are the town's own. The form of the street front follows reference
 * photographs of Civita houses; the rooms follow published descriptions of Lo Studio and Il Nuovo.
 *
 * Local frame in both builders: upper floor at y=0, ground floor at y=-3.2, room centre at the origin, street at +z.
 * The writer, the furniture and the room's click targets are never created or changed here.
 */
import {resolveRoof,roofHeightAt,drawTufa,drawTiles,weatheredWall} from './civita-buildings.js?v=mayor085-v1';
export const WRITER_HOME_VOLUME_SUFFIX='6750-253';
export const WRITER_HOME_PLAN=Object.freeze({
 source:'https://www.civitainstitute.org/496/lo-studio.html',
 secondarySource:'https://www.civitainstitute.org/498/2024/09/il-nuovo.html',
 interpretive:true,surveyedInterior:false,
 ground:['soggiorno con camino','cucina','bagnetto','cantina nel tufo'],
 upper:['camera e studio','biblioteca','bagno con doccia'],
 outside:['profferlo','pianerottolo su arco']
});
const STOREY=3.2,FACADE_Z=3.3,HINT=[82.4,-33.5],TILE=3.6,DOOR_W=1.12,DOOR_H=2.2,LANDING_DEPTH=1.5,STAIR_DEPTH=1,DOOR_LX=-1.6;
const CHIMNEY=[-2.3,-.2],WINDOWS={upper:[1.05,.95],kitchen:[2.55,1.5]};
export const FOOTING_DEPTH=4.2;

/* Picks the street wall of the surveyed wing and returns the placement of the 6x6 room behind it. */
export function anchorWriterHome(data,heightAt){
 const volume=data?.volumes?.find(v=>String(v.id).endsWith(WRITER_HOME_VOLUME_SUFFIX));
 if(!volume)throw new Error('Surveyed writer building missing');
 let edge=null;
 volume.ring.forEach((a,i)=>{
  const b=volume.ring[(i+1)%volume.ring.length],len=Math.hypot(b[0]-a[0],b[1]-a[1]);
  if(len<5.8)return;
  const mid=[(a[0]+b[0])/2,(a[1]+b[1])/2],d=Math.hypot(mid[0]-HINT[0],mid[1]-HINT[1]);
  if(!edge||d<edge.d)edge={a,b,len,mid,d,ox:volume.walls[i][0],oz:volume.walls[i][1]};
 });
 if(!edge||edge.d>8)throw new Error('Surveyed street wall not found');
 const x=edge.mid[0]-edge.ox*FACADE_Z,z=edge.mid[1]-edge.oz*FACADE_Z,yaw=Math.atan2(edge.ox,edge.oz);
 const sin=Math.sin(yaw),cos=Math.cos(yaw),world=(lx,lz)=>[x+lx*cos+lz*sin,z-lx*sin+lz*cos];
 // The floor sits on the highest ground under the house, so the slope never comes through it.
 let floor=-Infinity,street=Infinity;
 for(let lx=-3;lx<=3;lx+=1)for(let lz=-3;lz<=3;lz+=1){const h=heightAt(...world(lx,lz));if(Number.isFinite(h))floor=Math.max(floor,h);}
 for(let lx=-3;lx<=3;lx+=1){const h=heightAt(...world(lx,FACADE_Z+.9));if(Number.isFinite(h))street=Math.min(street,h);}
 if(!Number.isFinite(floor)||!Number.isFinite(street))throw new Error('No surveyed ground under the house');
 const base=floor+.04,chimney=world(...CHIMNEY),chimneyY=roofHeightAt(resolveRoof(volume),volume.eave_y,chimney[0],chimney[1])-base-STOREY;
 return {volumeId:volume.id,x,z,yawRadians:yaw,groundRelativeM:base,streetRelativeM:street,chimneyY,
  // Ground under a local point, in the local frame (upper floor = 0).
  groundAt:(lx,lz)=>heightAt(...world(lx,lz))-base-STOREY,
  roofAt:(lx,lz)=>roofHeightAt(resolveRoof(volume),volume.eave_y,...world(lx,lz))-base-STOREY,
  facade:{a:edge.a,b:edge.b,lengthM:edge.len,ox:edge.ox,oz:edge.oz},eaveRelativeM:volume.eave_y,baseRelativeM:volume.base_y,heightM:volume.height_m,
  roof:volume.roof,world,measuredVolume:true,houseIdentityVerified:false};
}

function seeded(seed){let s=seed>>>0||1;return ()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};}
function paint(THREE,draw,repeat=[1,1],size=1024){
 if(typeof document==='undefined')return null;
 const c=document.createElement('canvas');c.width=c.height=size;draw(c.getContext('2d'),size);
 const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(...repeat);
 if(THREE.SRGBColorSpace)t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;return t;
}
/* Inside walls: the town's own rubble under old limewash, worn through in places. */
function drawLimedStone(g,s){
 drawTufa(g,s,s);
 const r=seeded(37);
 for(let i=0;i<2600;i++){const R=s*(.02+r()*.06);g.fillStyle=`rgba(${228+r()*14|0},${216+r()*12|0},${192+r()*14|0},${.1+r()*.16})`;g.beginPath();g.ellipse(r()*s,r()*s,R,R*(.5+r()*.5),r()*3,0,7);g.fill();}
}
function drawCotto(g,s){
 const r=seeded(53),n=8,t=s/n;g.fillStyle='#5b3f2c';g.fillRect(0,0,s,s);
 for(let y=0;y<n;y++)for(let x=0;x<n;x++){const k=r();
  g.fillStyle=`rgb(${150+k*42|0},${86+k*30|0},${58+k*20|0})`;g.fillRect(x*t+2,y*t+2,t-4,t-4);
  for(let i=0;i<30;i++){g.fillStyle=`rgba(${r()<.5?'60,32,20':'226,170,126'},${r()*.14})`;g.fillRect(x*t+r()*t,y*t+r()*t,1+r()*7,1+r()*4);}}
}
/* Ground floor: the same grey stone as the lanes, cut larger. */
function drawFlags(g,s){
 const r=seeded(71);g.fillStyle='#4c4a44';g.fillRect(0,0,s,s);
 const rows=7,rh=s/rows;
 for(let y=0;y<rows;y++){let x=-r()*90;while(x<s){const w=90+r()*130,k=r();
  g.fillStyle=`rgb(${128+k*34|0},${122+k*32|0},${110+k*28|0})`;g.fillRect(x+2.5,y*rh+2.5,w-5,rh-5);x+=w;}}
 for(let i=0;i<6000;i++){g.fillStyle=`rgba(${r()<.5?'40,38,32':'214,208,194'},${r()*.09})`;g.fillRect(r()*s,r()*s,1+r()*3,1+r()*2);}
}
function drawWood(g,s){
 const r=seeded(89);g.fillStyle='#5b432e';g.fillRect(0,0,s,s);
 for(let i=0;i<620;i++){const y=r()*s;g.strokeStyle=`rgba(${r()<.6?'30,20,12':'130,100,70'},${r()*.22})`;g.lineWidth=.5+r()*1.8;g.beginPath();g.moveTo(0,y);g.bezierCurveTo(s*.3,y+r()*18-9,s*.6,y+r()*18-9,s,y);g.stroke();}
}
function drawTileWall(g,s){
 const r=seeded(97),n=8,t=s/n;g.fillStyle='#a79f8e';g.fillRect(0,0,s,s);
 for(let y=0;y<n;y++)for(let x=0;x<n;x++){const k=r();g.fillStyle=`rgb(${206+k*22|0},${200+k*22|0},${184+k*20|0})`;g.fillRect(x*t+1.5,y*t+1.5,t-3,t-3);}
}

const kits=new WeakMap();
/* The same stone, tile and frames as every other house in the town. */
export function writerHomeMaterials(THREE){
 if(kits.has(THREE))return kits.get(THREE);
 const std=(o)=>new THREE.MeshStandardMaterial({roughness:.95,...o});
 const kit={
  tufa:weatheredWall(std({color:0xffffff,map:paint(THREE,(g,n)=>drawTufa(g,n,n)),roughness:.96})),
  roofTile:std({color:0xffffff,map:paint(THREE,(g,n)=>drawTiles(g,n,n)),roughness:.88}),
  stucco:std({color:0xffffff,map:paint(THREE,drawLimedStone,[1.5,.9])}),
  limed:std({color:0xffffff,map:paint(THREE,drawLimedStone)}),
  cotto:std({color:0xffffff,map:paint(THREE,drawCotto,[1.5,1.5]),roughness:.72}),
  flags:std({color:0xffffff,map:paint(THREE,drawFlags,[1.4,1.4])}),
  chestnut:std({color:0xffffff,map:paint(THREE,drawWood,[1,1],512),roughness:.86}),
  tileWall:std({color:0xffffff,map:paint(THREE,drawTileWall,[1,1],512),roughness:.4}),
  peperino:std({color:0x8b8880}),
  iron:std({color:0x24231f,roughness:.6,metalness:.5}),
  copper:std({color:0xa8643c,roughness:.42,metalness:.65}),
  ceramic:std({color:0xe9e4d8,roughness:.3}),
  glass:std({color:0x2a2f33,roughness:.22,metalness:.25}),
  shutterWood:std({color:0x6d4a2f,roughness:.8}),doorWood:std({color:0x5b3a24,roughness:.8}),
  cloth:std({color:0x6e3a2c}),linen:std({color:0xcfc4ae}),soot:std({color:0x1b1815}),
  ember:new THREE.MeshStandardMaterial({color:0x2a0f06,emissive:0xff6a1e,emissiveIntensity:1.4,roughness:1}),
  leaf:std({color:0x4f6a33}),leafDark:std({color:0x3a5428}),
  clay:std({color:0xa2583c}),geranium:std({color:0xb5332e}),
 };
 kits.set(THREE,kit);return kit;
}

/* Boxes whose texture is the true size of the stones, not stretched to fit. */
function scaleBoxUV(g,w,h,d,tile,ox=0,oy=0){
 const uv=g.attributes.uv,dims=[[d,h],[d,h],[w,d],[w,d],[w,h],[w,h]];
 for(let f=0;f<6;f++)for(let i=0;i<4;i++){const k=f*4+i;uv.setXY(k,uv.getX(k)*dims[f][0]/tile+ox,uv.getY(k)*dims[f][1]/tile+oy);}
 return g;
}
function tileUV(g,tile=TILE){const uv=g.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)/tile,uv.getY(i)/tile);return g;}
function maker(THREE,group,K){
 const place=(m,x,y,z,name)=>{m.position.set(x,y,z);if(name)m.name=name;m.castShadow=true;m.receiveShadow=true;group.add(m);return m;};
 const box=(w,h,d,mat,x,y,z,name)=>place(new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat),x,y,z,name);
 return {
  box,
  stone:(w,h,d,x,y,z,name)=>place(new THREE.Mesh(scaleBoxUV(new THREE.BoxGeometry(w,h,d),w,h,d,TILE,x*.13,y*.17),K.tufa),x,y,z,name),
  limed:(w,h,d,x,y,z,name)=>place(new THREE.Mesh(scaleBoxUV(new THREE.BoxGeometry(w,h,d),w,h,d,TILE,x*.11,z*.07),K.limed),x,y,z,name),
  cyl:(r0,r1,h,mat,x,y,z,name,seg=14)=>place(new THREE.Mesh(new THREE.CylinderGeometry(r0,r1,h,seg),mat),x,y,z,name),
  ball:(r,mat,x,y,z,name)=>place(new THREE.Mesh(new THREE.SphereGeometry(r,12,9),mat),x,y,z,name),
  extrude:(shape,depth,mat,z,name)=>{const m=new THREE.Mesh(tileUV(new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:false,curveSegments:18})),mat);m.position.z=z;m.name=name;m.castShadow=m.receiveShadow=true;group.add(m);return m;},
 };
}
const archPath=(s,cx,y0,w,h)=>{s.moveTo(cx-w/2,y0);s.lineTo(cx-w/2,y0+h-w/2);s.absarc(cx,y0+h-w/2,w/2,Math.PI,0,true);s.lineTo(cx+w/2,y0);};
/* A wall with a round-headed opening. */
function archedWall(THREE,b,mat,{x0,x1,y0,y1,ax,aw,ah,z,depth=.24,name}){
 const s=new THREE.Shape();s.moveTo(x0,y0);archPath(s,ax,y0,aw,ah);s.lineTo(x1,y0);s.lineTo(x1,y1);s.lineTo(x0,y1);s.closePath();
 return b.extrude(s,depth,mat,z-depth/2,name||'arched-wall');
}
/* Wedge stones round an arch, each slightly different, as on the gate and the old stairs. */
function voussoirs(THREE,g,K,{cx,cy,r,band=.42,z,depth,count=13,name='voussoir'}){
 const rand=seeded(Math.round(cx*100+cy*10)+7);
 for(let i=0;i<count;i++){
  const a0=Math.PI*i/count+.012,a1=Math.PI*(i+1)/count-.012,k=band*(.92+rand()*.2),s=new THREE.Shape();
  s.moveTo(cx+Math.cos(a0)*r,cy+Math.sin(a0)*r);s.absarc(cx,cy,r,a0,a1,false);
  s.lineTo(cx+Math.cos(a1)*(r+k),cy+Math.sin(a1)*(r+k));s.absarc(cx,cy,r+k,a1,a0,true);s.closePath();
  const m=new THREE.Mesh(tileUV(new THREE.ExtrudeGeometry(s,{depth,bevelEnabled:false,curveSegments:4})),K.tufa);m.position.z=z;m.name=name;m.castShadow=m.receiveShadow=true;g.add(m);
 }
}
/* The town's window: broad grey frame, recessed wood or glass. */
function townWindow(b,K,x,y,w,h,z,name,{closed=false}={}){
 b.box(w,h,.04,closed?K.shutterWood:K.glass,x,y+h/2,z+.015,name+'-pane');
 if(closed)b.box(.03,h,.02,K.shutterWood,x,y+h/2,z+.04,name+'-join');
 else{b.box(.05,h,.03,K.shutterWood,x,y+h/2,z+.04,name+'-mullion');b.box(w,.05,.03,K.shutterWood,x,y+h*.62,z+.04,name+'-transom');}
 b.box(w+.5,.22,.16,K.peperino,x,y+h+.11,z+.07,'peperino-'+name+'-lintel');
 b.box(w+.56,.12,.22,K.peperino,x,y-.06,z+.09,'peperino-'+name+'-sill');
 for(const s of [-1,1])b.box(.24,h,.14,K.peperino,x+s*(w/2+.12),y+h/2,z+.06,'peperino-'+name+'-jamb');
}
/* The town's round-headed door. */
function townDoor(THREE,g,b,K,x,y,z,name,{w=DOOR_W,h=DOOR_H,fill=K.doorWood}={}){
 const leaf=new THREE.Shape();archPath(leaf,0,0,w,h);leaf.closePath();
 const door=new THREE.Mesh(new THREE.ShapeGeometry(leaf,14),fill);door.position.set(x,y,z+.05);door.name=name;door.castShadow=false;door.receiveShadow=true;g.add(door);
 const F=w+.52,frame=new THREE.Shape();archPath(frame,0,0,F,h+.26);frame.closePath();
 const hole=new THREE.Path();archPath(hole,0,0,w,h);hole.closePath();frame.holes.push(hole);
 const m=new THREE.Mesh(tileUV(new THREE.ExtrudeGeometry(frame,{depth:.16,bevelEnabled:false,curveSegments:14})),K.peperino);m.position.set(x,y,z-.01);m.name='peperino-'+name+'-frame';m.castShadow=m.receiveShadow=true;g.add(m);
 return door;
}
function leaves(THREE,g,list){
 const colors=[0x4f7a2e,0x5f8a34,0x3f6a2a,0x6f9440,0x7c9c44],mesh=new THREE.InstancedMesh(new THREE.CircleGeometry(.15,5),new THREE.MeshStandardMaterial({color:0xffffff,roughness:.75,side:THREE.DoubleSide}),Math.max(1,list.length));
 const m=new THREE.Matrix4(),q=new THREE.Quaternion(),e=new THREE.Euler(),p=new THREE.Vector3(),s=new THREE.Vector3(),c=new THREE.Color(),r=seeded(211);
 list.forEach((it,i)=>{e.set((r()-.5)*.9,(r()-.5)*.9,r()*6.3);q.setFromEuler(e);p.set(...it);s.setScalar(.8+r()*.8);m.compose(p,q,s);mesh.setMatrixAt(i,m);mesh.setColorAt(i,c.setHex(colors[Math.floor(r()*colors.length)]));});
 mesh.count=list.length;mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;mesh.frustumCulled=false;mesh.name='vine-leaves';g.add(mesh);
}

/* The chimney over the fireplace. It starts well inside the roof, so it is carried by it from every side. */
export function buildWriterChimney(THREE,parent,{chimneyY,roofAt=null}){
 const K=writerHomeMaterials(THREE),g=new THREE.Group();g.name='civita-writer-chimney';parent.add(g);
 const b=maker(THREE,g,K),x=CHIMNEY[0],z=CHIMNEY[1],base=chimneyY-1.1,top=chimneyY+1.25;
 b.stone(.74,top-base,.86,x,(base+top)/2,z,'chimney-stack');
 b.box(.98,.09,1.1,K.peperino,x,top+.04,z,'chimney-cap');
 for(const s of [-1,1])b.box(.16,.26,.8,K.peperino,x+s*.26,top+.21,z,'chimney-pier');
 const cap=b.box(1.02,.09,1.16,K.roofTile,x,top+.38,z,'chimney-tile');cap.rotation.z=.05;
 // The gable behind the opened rooms: closes the space under the roof, following its real slope.
 if(roofAt){const s=new THREE.Shape();s.moveTo(-3.4,STOREY-.1);for(let lx=-3.4;lx<=3.401;lx+=.2)s.lineTo(lx,roofAt(lx,-3.4)-.04);s.lineTo(3.4,STOREY-.1);s.closePath();b.extrude(s,.3,K.tufa,-3.5,'rear-gable');}
 return g;
}

/* What a passer-by sees on the surveyed street wall; the wall and roof behind it are the town's own.
 * Modelled on the houses in reference photographs: a stone stair against the wall, a landing carried on a
 * voussoir arch over the ground door, broad grey window frames, creeper. */
export function buildWriterFacade(THREE,parent,{storey=STOREY,groundAt=null,drop=0}={}){
 const K=writerHomeMaterials(THREE),g=new THREE.Group();g.name='civita-writer-facade';parent.add(g);
 g.userData.cityArchitectureEvidence={...WRITER_HOME_PLAN,measuredWalls:true,openingsInterpretive:true,physicalCollider:false};
 const b=maker(THREE,g,K),z=FACADE_Z,y0=-storey,ground=(x,zz=z+1)=>{const h=groundAt?.(x,zz);return Number.isFinite(h)?h:y0-drop;};
 const deep=Math.min(ground(-3,z+1),ground(0,z+1),ground(3,z+1),ground(4.5,z+1),y0)-1.2;
 // Landing on an arch, at the upper floor. The ground door sits in the arch.
 const lx0=-3.05,lx1=-.15,lw=lx1-lx0,lc=(lx0+lx1)/2,ld=LANDING_DEPTH;
 const aw=1.9,archTop=-.62,ah=archTop-deep;
 archedWall(THREE,b,K.tufa,{x0:lx0,x1:lx1,y0:deep,y1:-.14,ax:lc,aw,ah,z:z+ld-.21,depth:.42,name:'landing-arch'});
 voussoirs(THREE,g,K,{cx:lc,cy:archTop-aw/2,r:aw/2,band:.46,z:z+ld+.0,depth:.06,name:'landing-voussoir'});
 b.stone(.3,-.14-deep,ld-.42,lx0+.15,(deep-.14)/2,z+(ld-.42)/2,'landing-side-wall');
 b.box(lw+.12,.16,ld+.12,K.peperino,lc,-.08,z+ld/2,'landing-slab');
 // Parapet in stone with a grey coping, as in the photographs; no ironwork.
 b.stone(lw,.92,.24,lc,.46,z+ld-.12,'landing-parapet');b.stone(.24,.92,ld-.24,lx0+.12,.46,z+(ld-.24)/2,'landing-parapet-side');
 b.box(lw+.1,.09,.34,K.peperino,lc,.96,z+ld-.12,'landing-coping');b.box(.34,.09,ld,K.peperino,lx0+.12,.96,z+ld/2,'landing-coping-side');
 // Doors.
 const doorX=lc,entrance=townDoor(THREE,g,b,K,doorX,y0,z,'civita-writer-front-door');
 const up=townDoor(THREE,g,b,K,lc,0,z,'writer-upper-door',{w:.98,h:2.2});
 for(let i=-1;i<=1;i+=2)for(let j=0;j<5;j++)b.ball(.018,K.iron,doorX+i*.34,y0+.35+j*.34,z+.08,'door-stud');
 b.cyl(.05,.05,.02,K.iron,doorX+.36,y0+1.05,z+.09,'door-ring');
 // Short flight from the lane up to the ground door, under the arch.
 const landAt=ground(doorX,z+1),gap=Math.max(0,y0-landAt),n=Math.ceil(gap/.19);
 for(let i=0;i<n;i++){const top=y0-i*(gap/n),bottom=deep;b.box(aw-.12,top-bottom,.25,K.peperino,doorX,(top+bottom)/2,z+.2+i*.24,'peperino-door-step');}
 // Stair against the wall, one straight flight from the lane to the landing.
 const footX=4.45,footY=ground(footX,z+.5),steps=Math.ceil((0-footY)/.19),rise=-footY/steps,run=(footX-lx1)/steps,sd=STAIR_DEPTH;
 const wedge=new THREE.Shape();wedge.moveTo(lx1,deep);wedge.lineTo(footX,deep);wedge.lineTo(footX,footY);wedge.lineTo(lx1,0);wedge.closePath();
 b.extrude(wedge,sd,K.tufa,z,'profferlo-masonry');
 for(let i=0;i<steps;i++){const x=footX-(i+.5)*run,y=footY+(i+1)*rise;b.box(run+.04,.07,sd+.06,K.peperino,x,y-.03,z+sd/2,'profferlo-tread');b.stone(run,rise,sd,x,y-.07-rise/2,z+sd/2,'profferlo-riser');}
 const wall=new THREE.Shape(),ph=.92;wall.moveTo(lx1,0);wall.lineTo(footX,footY);wall.lineTo(footX,footY+ph);wall.lineTo(lx1,ph);wall.closePath();
 b.extrude(wall,.2,K.tufa,z+sd-.2,'profferlo-parapet');
 const len=Math.hypot(footX-lx1,footY),coping=b.box(len,.08,.3,K.peperino,(footX+lx1)/2,footY/2+ph+.04,z+sd-.1,'profferlo-coping');coping.rotation.z=Math.atan2(footY,footX-lx1);
 // Windows: the same as the neighbours', and where the rooms inside have them.
 townWindow(b,K,WINDOWS.upper[0],WINDOWS.upper[1],.92,1.5,z,'bath-window',{closed:true});
 townWindow(b,K,WINDOWS.kitchen[0],y0+WINDOWS.kitchen[1],.62,.86,z,'kitchen-window');
 // Lantern, house tile, pots on the coping and the steps.
 b.box(.05,.05,.42,K.iron,lc+1.25,y0+2.3,z+.2,'lantern-arm');b.box(.15,.26,.15,K.iron,lc+1.25,y0+2.14,z+.38,'lantern');
 b.box(.26,.18,.02,K.ceramic,lc+1.15,y0+1.55,z+.02,'house-number-tile');
 for(const [x,flower] of [[lx0+.5,true],[lc,false],[lx1-.5,true]]){b.cyl(.14,.1,.2,K.clay,x,1.1,z+ld-.12,'landing-pot');b.ball(.17,flower?K.geranium:K.leaf,x,1.28,z+ld-.12,'landing-plant');}
 b.cyl(.2,.15,.36,K.clay,lx1+.5,ground(lx1+.5,z+1.3)+.18,z+1.3,'door-pot');b.ball(.27,K.leafDark,lx1+.5,ground(lx1+.5,z+1.3)+.54,z+1.3,'door-plant');
 // Creeper over the far end of the wall.
 const r=seeded(431),list=[];
 for(let i=0;i<1500;i++){const x=1.95+r()*1.15,h=r();const top=storey*(.72+.28*Math.sin(x*5))*1.95;const y=y0+h*top;if(y<y0+.4+Math.max(0,(footX-x)*0)&&false)continue;list.push([x,y,z+.06+r()*.1]);}
 leaves(THREE,g,list);
 const clickArea=b.box(6.4,6.4,.05,new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}),0,0,z+1.7,'civita-writer-house-interactive-front');
 clickArea.castShadow=false;
 entrance.userData.writerExterior=true;up.userData.writerExterior=true;clickArea.userData.writerExterior=true;
 return {group:g,entrance,clickArea};
}

/* The house opened along its street wall, inside its own surveyed walls and under its own roof. */
export function buildWriterHomeSection(THREE,parent,{storey=STOREY}={}){
 const K=writerHomeMaterials(THREE),g=new THREE.Group();g.name='civita-writer-home-section';parent.add(g);
 g.userData.plan=WRITER_HOME_PLAN;
 const b=maker(THREE,g,K),y0=-storey,H=storey,targets=[];
 const floor=(w,d,mat,x,z,y=y0)=>{const f=new THREE.Mesh(new THREE.PlaneGeometry(w,d),mat);f.rotation.x=-Math.PI/2;f.position.set(x,y+.012,z);f.receiveShadow=true;g.add(f);return f;};
 // Footing in the rock; the lane falls away in front, so it shows there as a plinth.
 b.stone(6.8,FOOTING_DEPTH,6.8,0,y0-.02-FOOTING_DEPTH/2,0,'house-footing');
 b.box(7,.18,.26,K.peperino,0,y0-.09,3.42,'footing-course-front');
 for(const s of [-1,1])b.box(.26,.18,7,K.peperino,s*3.42,y0-.09,0,'footing-course-side');
 for(let i=0;i<9;i++){const top=y0-.02-i*.19,h=top-(y0-FOOTING_DEPTH);b.box(1.4,h,.3,K.peperino,DOOR_LX,top-h/2,3.55+.15+i*.26,'footing-step');}
 // Thick masonry; its cut ends are what shows at the section.
 b.stone(.34,H*2,6.68,-3.23,0,0,'tufa-section-left');b.stone(.34,H*2,6.68,3.23,0,0,'tufa-section-right');
 const WIN={x0:-1.6,x1:.4,y0:1,y1:2.5},cz=-3.23;
 b.stone(WIN.x0+3.4,H*2,.34,(-3.4+WIN.x0)/2,0,cz,'tufa-section-rear');b.stone(3.4-WIN.x1,H*2,.34,(WIN.x1+3.4)/2,0,cz,'tufa-section-rear');
 b.stone(WIN.x1-WIN.x0,H+WIN.y0,.34,(WIN.x0+WIN.x1)/2,(y0+WIN.y0)/2,cz,'tufa-section-rear');b.stone(WIN.x1-WIN.x0,H-WIN.y1,.34,(WIN.x0+WIN.x1)/2,(H+WIN.y1)/2,cz,'tufa-section-rear');
 // The rear opening as a stone two-light window, like the openings in the bell tower and gate.
 b.box(.36,WIN.y1-WIN.y0,.5,K.peperino,(WIN.x0+WIN.x1)/2,(WIN.y0+WIN.y1)/2,-3.08,'rear-window-pier');
 b.box(WIN.x1-WIN.x0+.5,.14,.56,K.peperino,(WIN.x0+WIN.x1)/2,WIN.y0-.07,-3.08,'peperino-rear-sill');
 b.box(WIN.x1-WIN.x0+.5,.24,.56,K.peperino,(WIN.x0+WIN.x1)/2,WIN.y1+.12,-3.08,'peperino-rear-lintel');
 for(const x of [WIN.x0-.12,WIN.x1+.12])b.box(.24,WIN.y1-WIN.y0,.5,K.peperino,x,(WIN.y0+WIN.y1)/2,-3.08,'peperino-rear-jamb');
 // Chestnut joists with terracotta between them: how floors are carried here.
 b.box(6.4,.2,6.4,K.chestnut,0,-.16,0,'upper-floor-boards');
 const pianelle=floor(6.4,6.4,K.cotto,0,0,-.285);pianelle.rotation.x=Math.PI/2;pianelle.name='ground-ceiling-tiles';
 for(let i=0;i<8;i++)b.box(.17,.24,6.1,K.chestnut,-2.7+i*.77,-.4,0,'ground-ceiling-joist');
 b.box(6.04,.3,.3,K.chestnut,0,-.42,-.6,'ground-ceiling-girder');
 const roofTiles=floor(6.4,6.4,K.cotto,0,0,H+.08);roofTiles.rotation.x=Math.PI/2;roofTiles.name='upper-ceiling-tiles';
 for(let i=0;i<7;i++)b.box(.15,.2,6.1,K.chestnut,-2.7+i*.9,H-.03,0,'upper-ceiling-rafter');
 for(let i=0;i<3;i++)b.box(6.04,.26,.26,K.chestnut,0,H-.2,-2.2+i*2.2,'upper-ceiling-beam');
 floor(5.9,6,K.flags,0,0);
 // Ground floor: bare stone below, limewash worn thin; rooms open into each other through stone arches.
 b.stone(.1,H-.3,6,-2.95,y0+(H-.3)/2,0,'ground-wall-left');b.stone(.1,H-.3,6,2.95,y0+(H-.3)/2,0,'ground-wall-right');
 b.stone(5.9,H-.3,.1,0,y0+(H-.3)/2,-2.95,'ground-wall-rock');
 const top=y0+H-.3;
 const cross=(x,z0,z1,az,aw,name)=>{const w=new THREE.Group();w.position.set(x,0,(z0+z1)/2);w.rotation.y=Math.PI/2;g.add(w);const m=maker(THREE,w,K);const half=(z1-z0)/2;archedWall(THREE,m,K.limed,{x0:-half,x1:half,y0,y1:top,ax:-(az-(z0+z1)/2),aw,ah:2.3,z:0,depth:.26,name});voussoirs(THREE,w,K,{cx:-(az-(z0+z1)/2),cy:y0+2.3-aw/2,r:aw/2,band:.2,z:.13,depth:.03,count:9,name:name+'-voussoir'});};
 cross(.05,-2.9,3,.8,1.2,'partition-living-kitchen');
 cross(1.9,-2.9,3,1.95,.9,'partition-kitchen-bath');
 floor(1.8,5.8,K.cotto,1,.05);
 // Cellar cut in the rock behind the living room.
 archedWall(THREE,b,K.tufa,{x0:-2.9,x1:-.08,y0,y1:top,ax:-1.5,aw:1.45,ah:2.15,z:-1.35,depth:.32,name:'cantina-arch'});
 voussoirs(THREE,g,K,{cx:-1.5,cy:y0+2.15-.725,r:.725,band:.26,z:-1.19,depth:.04,count:11,name:'cantina-voussoir'});
 for(const [x,z] of [[-2.3,-2.3],[-1.5,-2.45],[-.7,-2.3]]){
  const barrel=b.cyl(.34,.34,.72,K.chestnut,x,y0+.46,z,'cantina-barrel',18);barrel.rotation.x=Math.PI/2;
  for(const k of [-.24,.24]){const hoop=b.cyl(.355,.355,.05,K.iron,x,y0+.46,z+k,'cantina-hoop',18);hoop.rotation.x=Math.PI/2;}
  b.box(.62,.1,.16,K.chestnut,x,y0+.05,z,'cantina-chock');
 }
 for(let i=0;i<3;i++){b.cyl(.13,.17,.32,K.leafDark,-2.55+i*.34,y0+.18,-1.72,'cantina-demijohn');b.cyl(.03,.05,.14,K.leafDark,-2.55+i*.34,y0+.41,-1.72,'cantina-demijohn-neck');}
 const cantinaHit=b.box(1.45,2.1,.1,new THREE.MeshBasicMaterial({visible:false}),-1.5,y0+1.05,-1.14,'cantina-target');cantinaHit.castShadow=false;
 targets.push([cantinaHit,'p-care','سردابِ سنگی: بایگانی خانه']);
 // Living room: peperino fireplace under the chimney, chairs before it.
 const fz=CHIMNEY[1]+1.1,fx=-2.72;
 for(const s of [-1,1])b.box(.42,1.3,.22,K.peperino,fx,y0+.65,fz+s*.75,'fireplace-jamb');
 b.box(.52,.22,1.86,K.peperino,fx-.02,y0+1.41,fz,'fireplace-mantel');
 b.box(.1,1.3,1.3,K.soot,fx-.16,y0+.65,fz,'fireplace-back');
 b.box(.5,.08,1.5,K.peperino,fx+.05,y0+.04,fz,'fireplace-hearth');
 b.limed(.44,1.32,1.44,fx-.05,y0+2.18,fz,'fireplace-hood');
 for(let i=0;i<3;i++){const log=b.cyl(.06,.07,.74,K.chestnut,fx+.02+(i%2)*.05,y0+.15+(i>1?.1:0),fz+(i-1)*.12,'fireplace-log',8);log.rotation.x=Math.PI/2;}
 const ember=b.box(.28,.05,.7,K.ember,fx+.02,y0+.1,fz,'fireplace-ember');ember.castShadow=false;
 const hearthHit=b.box(.5,1.6,1.7,new THREE.MeshBasicMaterial({visible:false}),fx,y0+.8,fz,'fireplace-target');hearthHit.castShadow=false;
 targets.push([hearthHit,'p-inner','کنار شومینه: پرسش‌ها و عادت‌ها']);
 for(const [x,z,rot] of [[-1.55,.1,.9],[-1.5,1.75,2.2]]){
  const chair=new THREE.Group();chair.position.set(x,y0,z);chair.rotation.y=rot;g.add(chair);const c=maker(THREE,chair,K);
  c.box(.66,.14,.62,K.cloth,0,.36,0,'chair-seat');c.box(.66,.62,.12,K.cloth,0,.68,-.27,'chair-back');
  for(const s of [-1,1]){c.box(.1,.28,.62,K.chestnut,s*.34,.5,0,'chair-arm');for(const t of [-1,1])c.box(.06,.3,.06,K.chestnut,s*.28,.15,t*.24,'chair-leg');}
 }
 b.cyl(.3,.3,.05,K.chestnut,-.98,y0+.48,.9,'side-table');b.cyl(.04,.08,.45,K.chestnut,-.98,y0+.23,.9,'side-table-leg');
 const rug=b.box(1.8,.015,2.3,K.cloth,-1.6,y0+.02,.95,'living-rug');rug.castShadow=false;
 // Kitchen: stone counter against the rock, stove, table, copper on a rail.
 const cx=.98;
 b.stone(1.7,.9,.6,cx,y0+.45,-2.55,'kitchen-counter');
 b.box(1.76,.07,.66,K.peperino,cx,y0+.93,-2.55,'kitchen-counter-top');
 b.box(.5,.05,.38,K.ceramic,cx-.42,y0+.96,-2.55,'kitchen-sink');
 b.cyl(.02,.02,.26,K.copper,cx-.42,y0+1.1,-2.72,'kitchen-tap');
 b.box(.56,.9,.56,K.iron,cx+.52,y0+.46,-2.55,'kitchen-stove');
 for(const [dx,dz] of [[-.14,-.12],[.14,-.12],[-.14,.12],[.14,.12]])b.cyl(.08,.08,.02,K.soot,cx+.52+dx,y0+.93,-2.55+dz,'kitchen-burner');
 b.cyl(.14,.12,.17,K.copper,cx+.38,y0+1.03,-2.67,'kitchen-pot');
 b.box(1.5,.03,.03,K.iron,cx,y0+2.05,-2.78,'kitchen-rail');
 for(let i=0;i<5;i++){b.box(.012,.2,.012,K.iron,cx-.56+i*.28,y0+1.94,-2.78,'pan-hook');b.cyl(.12-i*.012,.1-i*.012,.05,K.copper,cx-.56+i*.28,y0+1.8,-2.76,'hanging-pan').rotation.x=Math.PI/2;}
 b.box(1.6,.05,.22,K.chestnut,cx,y0+2.4,-2.78,'kitchen-shelf');
 for(let i=0;i<6;i++)b.cyl(.09,.09,.12,i%2?K.clay:K.ceramic,cx-.65+i*.26,y0+2.49,-2.78,'kitchen-jar');
 b.box(1,.06,1.5,K.chestnut,cx,y0+.76,-.5,'kitchen-table');
 for(const sx of [-1,1])for(const sz of [-1,1])b.box(.07,.74,.07,K.chestnut,cx+sx*.42,y0+.37,-.5+sz*.66,'kitchen-table-leg');
 b.cyl(.14,.1,.08,K.clay,cx+.1,y0+.83,-.7,'kitchen-bowl');for(let i=0;i<4;i++)b.ball(.05,i%2?K.geranium:K.leaf,cx+.05+(i%2)*.1,y0+.9,-.75+(i>>1)*.1,'kitchen-fruit');
 b.box(.34,.08,.2,K.linen,cx-.1,y0+.83,-.15,'kitchen-bread');
 const kitchenHit=b.box(1.6,1.3,.8,new THREE.MeshBasicMaterial({visible:false}),cx,y0+1.3,-2.5,'kitchen-target');kitchenHit.castShadow=false;
 targets.push([kitchenHit,'p-planner','آشپزخانه: برنامهٔ روز']);
 // Half bath at the street end of the right-hand band.
 floor(1,2.2,K.tileWall,2.45,1.9);
 b.box(.02,1.2,2.2,K.tileWall,2.89,y0+.6,1.9,'bath-tiles');
 b.cyl(.2,.16,.4,K.ceramic,2.55,y0+.2,1.48,'wc-bowl');b.box(.4,.42,.16,K.ceramic,2.75,y0+.56,1.48,'wc-tank');
 b.cyl(.2,.08,.14,K.ceramic,2.62,y0+.78,2.45,'basin');b.cyl(.05,.08,.72,K.ceramic,2.62,y0+.36,2.45,'basin-pedestal');
 b.box(.02,.55,.42,K.glass,2.88,y0+1.45,2.45,'basin-mirror');
 // Upper bath: a low stone screen under the street window.
 const bz=2.35,bx=1.05,bw=1.6,bd=1.2;
 b.limed(bw,1.05,.1,bx,.525,bz-bd/2,'upper-bath-screen');
 for(const s of [-1,1])b.limed(.1,1.05,bd,bx+s*bw/2,.525,bz,'upper-bath-screen');
 b.box(bw-.06,.02,bd-.06,K.tileWall,bx,.02,bz,'upper-bath-floor');
 b.box(.76,.1,.76,K.ceramic,bx+.36,.06,bz+.1,'upper-shower-tray');
 b.cyl(.015,.015,1.9,K.copper,bx+.7,.98,bz+.45,'upper-shower-riser');b.box(.26,.02,.02,K.copper,bx+.58,1.92,bz+.45,'upper-shower-arm');b.cyl(.08,.1,.03,K.copper,bx+.46,1.9,bz+.45,'upper-shower-head');
 b.cyl(.18,.08,.12,K.ceramic,bx-.45,.8,bz+.2,'upper-basin');b.cyl(.05,.08,.72,K.ceramic,bx-.45,.37,bz+.2,'upper-basin-pedestal');
 for(const [x,y,z,i] of [[-1.5,y0+2.5,.8,6],[1,y0+2.4,-.3,5],[2.45,y0+2.3,1.9,2],[-1.5,y0+1.7,-2.2,2.5]]){
  const l=new THREE.PointLight(0xffc48a,i,7,1.8);l.position.set(x,y,z);l.castShadow=false;g.add(l);
 }
 const fire=new THREE.PointLight(0xff7a2e,3,4.5,1.8);fire.position.set(fx+.45,y0+.5,fz);g.add(fire);
 return {group:g,targets,K};
}
