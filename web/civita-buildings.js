/* MAYOR-082 — Civita buildings from the Regione Lazio survey.
 * MEASURED (per volume): footprint, ground level, eave level, height.
 * INTERPRETIVE (not in any open source): roof form, where each opening falls, stone and tile finish.
 * Interpretive parts are generated from each volume's stable seed, so they never change between loads, and
 * follow documented practice: tufa blocks, stone-framed small windows, low clay-tile roofs.
 */
const FLOOR_H=3.05, WINDOW_W=.92, WINDOW_H=1.42, DOOR_W=1.12, DOOR_H=2.2, WALL_TILE=3.6;
// Stone tones seen on Civita's fronts: honey tufa, grey-brown, warm ochre, weathered dark.
const WALL_TINTS=[[1.06,.98,.84],[.92,.9,.86],[1.1,.94,.74],[.82,.76,.68],[1.0,.92,.8],[.96,.86,.72]];
const ROOF_TINTS=[[1.08,.96,.86],[.94,.9,.86],[1.16,.94,.76],[.84,.8,.76]];

function rng(seed){let s=seed>>>0||1;return ()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};}

export function roofHeightAt(roof,eave,x,z){
 const [cx,cz,dx,dz]=roof.ridge,nx=-dz,nz=dx;
 const d=Math.abs((x-cx)*nx+(z-cz)*nz);
 return eave+roof.slope*(roof.dmax-d);
}

/* A measured point on the roof fixes the ridge, when one exists; otherwise the usual pitch stands. */
export function resolveRoof(volume){
 const roof={...volume.roof};
 const rise=volume.roof_point_y==null?null:volume.roof_point_y-volume.eave_y;
 if(rise!==null&&rise>.5&&rise<5&&roof.dmax>.5)roof.slope=Math.min(.55,Math.max(.14,rise/roof.dmax));
 return roof;
}

class Batch{
 constructor(){this.p=[];this.n=[];this.uv=[];this.c=[];this.tint=[1,1,1];}
 tri(a,b,c,ua,ub,uc){
  const ux=b[0]-a[0],uy=b[1]-a[1],uz=b[2]-a[2],vx=c[0]-a[0],vy=c[1]-a[1],vz=c[2]-a[2];
  let nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx;const l=Math.hypot(nx,ny,nz)||1;nx/=l;ny/=l;nz/=l;
  this.p.push(...a,...b,...c);this.n.push(nx,ny,nz,nx,ny,nz,nx,ny,nz);this.uv.push(...ua,...ub,...uc);this.c.push(...this.tint,...this.tint,...this.tint);
 }
 quad(a,b,c,d,ua,ub,uc,ud){this.tri(a,b,c,ua,ub,uc);this.tri(a,c,d,ua,uc,ud);}
 geometry(THREE){
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(this.p,3));
  g.setAttribute('normal',new THREE.Float32BufferAttribute(this.n,3));
  g.setAttribute('uv',new THREE.Float32BufferAttribute(this.uv,2));
  g.setAttribute('color',new THREE.Float32BufferAttribute(this.c,3));
  return g;
 }
}

/* The lowest ground along a building's walls and just outside them. */
export function wallFoot(v,heightAt){
 let low=v.base_y-1.2;
 v.ring.forEach((a,i)=>{
  const b=v.ring[(i+1)%v.ring.length],len=Math.hypot(b[0]-a[0],b[1]-a[1]),[ox,oz]=v.walls[i];
  for(let t=0;t<=len;t+=1)for(const d of [0,.6,1.2]){
   const f=len?t/len:0,g=heightAt(a[0]+(b[0]-a[0])*f+ox*d,a[1]+(b[1]-a[1])*f+oz*d);
   if(Number.isFinite(g)&&g-.6<low)low=g-.6;
  }
 });
 return low;
}

function addWalls(batch,v,roof,floor=null){
 const ring=v.ring,base=floor??v.foot??v.base_y-1.2;
 const [cx,cz,dx,dz]=roof.ridge,nx=-dz,nz=dx;
 let run=0;
 for(let i=0;i<ring.length;i++){
  const a=ring[i],b=ring[(i+1)%ring.length],o=v.walls[i];
  const pts=[a];
  // A wall crossing the ridge line gets a vertex there, so the gable rises to a point.
  const sa=(a[0]-cx)*nx+(a[1]-cz)*nz,sb=(b[0]-cx)*nx+(b[1]-cz)*nz;
  if(sa*sb<0){const t=sa/(sa-sb);pts.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t]);}
  pts.push(b);
  for(let k=0;k<pts.length-1;k++){
   const p=pts[k],q=pts[k+1],len=Math.hypot(q[0]-p[0],q[1]-p[1]);
   const tp=roofHeightAt(roof,v.eave_y,p[0],p[1]),tq=roofHeightAt(roof,v.eave_y,q[0],q[1]);
   const A=[p[0],base,p[1]],B=[q[0],base,q[1]],C=[q[0],tq,q[1]],D=[p[0],tp,p[1]];
   const outward=(q[0]-p[0])*o[1]-(q[1]-p[1])*o[0]>0;
   const u0=run/WALL_TILE,u1=(run+len)/WALL_TILE,w=y=>(y-base)/WALL_TILE;
   if(outward)batch.quad(A,B,C,D,[u0,w(base)],[u1,w(base)],[u1,w(tq)],[u0,w(tp)]);
   else batch.quad(B,A,D,C,[u1,w(base)],[u0,w(base)],[u0,w(tp)],[u1,w(tq)]);
   run+=len;
  }
 }
}

function addRoof(THREE,batch,v,roof){
 const [cx,cz,dx,dz]=roof.ridge,nx=-dz,nz=dx;
 for(const half of roof.halves){
  const contour=half.map(([x,z])=>new THREE.Vector2(x,z));
  for(const [a,b,c] of THREE.ShapeUtils.triangulateShape(contour,[])){
   const P=[a,b,c].map(i=>{const [x,z]=half[i];return [x,roofHeightAt(roof,v.eave_y,x,z)+.04,z];});
   const U=P.map(([x,,z])=>{const along=(x-cx)*dx+(z-cz)*dz,across=(x-cx)*nx+(z-cz)*nz;return [along/1.6,across/1.6];});
   const ux=P[1][0]-P[0][0],uz=P[1][2]-P[0][2],vx=P[2][0]-P[0][0],vz=P[2][2]-P[0][2];
   if(ux*vz-uz*vx>0)batch.tri(P[0],P[2],P[1],U[0],U[2],U[1]);else batch.tri(P[0],P[1],P[2],U[0],U[1],U[2]);
  }
 }
}

/* The lower part of a block a covered lane runs through: its footprint minus the lane, up to the soffit. */
function addPassagePieces(THREE,batch,cut,base,top){
 for(const ring of cut.pieces){
  let run=0;
  ring.forEach((a,i)=>{
   const b=ring[(i+1)%ring.length],len=Math.hypot(b[0]-a[0],b[1]-a[1]);if(len<.02)return;
   let ox=(b[1]-a[1])/len,oz=-(b[0]-a[0])/len;
   const mx=(a[0]+b[0])/2+ox*.04,mz=(a[1]+b[1])/2+oz*.04;
   let inside=false;for(let p=0,q=ring.length-1;p<ring.length;q=p++){const s=ring[p],t=ring[q];if(((s[1]>mz)!==(t[1]>mz))&&mx<(t[0]-s[0])*(mz-s[1])/(t[1]-s[1])+s[0])inside=!inside;}
   if(inside){ox=-ox;oz=-oz;}
   const A=[a[0],base,a[1]],B=[b[0],base,b[1]],C=[b[0],top,b[1]],D=[a[0],top,a[1]],u0=run/WALL_TILE,u1=(run+len)/WALL_TILE,h=(top-base)/WALL_TILE;
   if((b[0]-a[0])*oz-(b[1]-a[1])*ox>0)batch.quad(A,B,C,D,[u0,0],[u1,0],[u1,h],[u0,h]);else batch.quad(B,A,D,C,[u1,0],[u0,0],[u0,h],[u1,h]);
   run+=len;
  });
 }
 for(const ring of cut.soffit){
  const contour=ring.map(([x,z])=>new THREE.Vector2(x,z));
  for(const [a,b,c] of THREE.ShapeUtils.triangulateShape(contour,[])){const P=[a,b,c].map(i=>[ring[i][0],top,ring[i][1]]);batch.tri(P[0],P[1],P[2],[P[0][0]/2.4,P[0][2]/2.4],[P[1][0]/2.4,P[1][2]/2.4],[P[2][0]/2.4,P[2][2]/2.4]);}
 }
}

/* Openings for one volume: only on free walls, only above ground, one row per floor. */
export function planOpenings(v,heightAt){
 if(v.height_m>20)return [];   // the bell tower gets its own openings in civita-details.js
 const random=rng(v.seed),out=[];
 const small=v.height_m<3.2||v.area_m2<14;
 const floors=Math.max(1,Math.round(v.height_m/FLOOR_H));
 for(let i=0;i<v.ring.length;i++){
  const a=v.ring[i],b=v.ring[(i+1)%v.ring.length],[ox,oz,cover]=v.walls[i];
  const len=Math.hypot(b[0]-a[0],b[1]-a[1]);
  if(len<2.2)continue;
  const dirx=(b[0]-a[0])/len,dirz=(b[1]-a[1])/len;
  const bays=Math.max(1,Math.floor(len/(3.3+random()*1.4)));
  let doorBay=-1;
  const midx=(a[0]+b[0])/2+ox*1.2,midz=(a[1]+b[1])/2+oz*1.2;
  const outside=heightAt(midx,midz);
  const reachable=Number.isFinite(outside)&&Math.abs(outside-v.base_y)<1.6;
  if(reachable&&len>3&&cover==null&&random()<.72)doorBay=Math.floor(random()*bays);
  const yaw=Math.atan2(ox,oz);
  for(let bay=0;bay<bays;bay++){
   const along=len*(bay+.5)/bays,x=a[0]+dirx*along,z=a[1]+dirz*along;
   const ground=Number.isFinite(heightAt(x+ox,z+oz))?Math.max(v.base_y,heightAt(x+ox,z+oz)):v.base_y;
   for(let f=0;f<floors;f++){
    // Top floors of tall houses have the small square windows seen in photographs.
    const attic=floors>2&&f===floors-1,w=attic?.72+random()*.14:WINDOW_W+(random()-.5)*.22,wh=attic?.8+random()*.16:WINDOW_H+(f===1?.3:0)+(random()-.5)*.2;
    const sill=ground+f*FLOOR_H+(f===0?1.15:.95);
    const top=sill+wh;
    if(top>v.eave_y-.3)continue;
    if(cover!=null&&top<cover+.5)continue;
    if(f===0&&bay===doorBay){out.push({kind:'door',x,z,y:ground,yaw,arched:random()<.45});continue;}
    if(random()<(f===0?.5:.26))continue;
    out.push({kind:'window',x,z,y:sill,yaw,w,h:wh,shutter:random()<.1,closed:random()<.5,small,lit:random()<.28});
   }
  }
 }
 return out;
}

function stoneCanvas(draw,w=1024,h=1024){
 if(typeof document==='undefined')return null;
 const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);return c;
}
function seeded(seed){return rng(seed);}
export function drawTufa(g,w,h){
 const r=seeded(11),wrap=(x,y,draw)=>{for(const ox of [-w,0,w])for(const oy of [-h,0,h])if(x+ox>-90&&x+ox<w+90&&y+oy>-90&&y+oy<h+90)draw(x+ox,y+oy);};
 // Lime mortar shows between the stones, lighter than they are.
 g.fillStyle='#b5a58a';g.fillRect(0,0,w,h);
 // Rough courses of tufa of very different sizes, with a few grey peperino pieces; no two alike.
 const rows=Math.round(h/30);
 for(let row=0;row<rows;row++){
  const y0=row*h/rows;let x=r()*20;const end=x+w;
  while(x<end){
   const big=r(),bw=big<.18?62+r()*44:big<.6?34+r()*26:18+r()*16,bh=h/rows*(big<.18?1.45:.84+r()*.3),t=r(),kind=r();
   let R,G,B;
   if(kind<.62){R=150+t*48;G=124+t*42;B=84+t*34;}else if(kind<.82){R=128+t*36;G=112+t*32;B=88+t*26;}else{R=112+t*34;G=108+t*32;B=100+t*30;}
   const pts=[],n=7+Math.floor(r()*3),cx=bw/2,cy=bh/2;
   for(let k=0;k<n;k++){const a=k/n*Math.PI*2,e=.88+r()*.16,sq=1/Math.max(Math.abs(Math.cos(a)),Math.abs(Math.sin(a)));pts.push([cx+Math.cos(a)*cx*Math.min(sq,1.18)*e,cy+Math.sin(a)*cy*Math.min(sq,1.18)*e]);}
   const yj=y0+(r()-.5)*5;
   const shade=(.06+r()*.1),spot=r()<.5;
   wrap(x,yj,(X,Y)=>{
    g.fillStyle=`rgb(${R|0},${G|0},${B|0})`;g.beginPath();pts.forEach(([a,b],k)=>k?g.lineTo(X+a,Y+b):g.moveTo(X+a,Y+b));g.closePath();g.fill();
    g.strokeStyle='rgba(70,58,44,.42)';g.lineWidth=1.3;g.stroke();
    if(spot){g.fillStyle=`rgba(62,50,38,${shade})`;g.beginPath();g.ellipse(X+cx,Y+cy*1.2,cx*.7,cy*.5,0,0,7);g.fill();}
   });
   x+=bw+1.5+r()*2;
  }
 }
 for(let i=0;i<26000;i++){g.fillStyle=`rgba(${r()<.55?'44,34,24':'232,212,176'},${r()*.09})`;g.fillRect(r()*w,r()*h,1+r()*2.4,1+r()*2);}
 for(let i=0;i<260;i++){g.fillStyle=`rgba(${r()<.6?'104,110,72':'176,166,112'},${.05+r()*.1})`;g.beginPath();g.ellipse(r()*w,r()*h,2+r()*12,1+r()*7,r()*3,0,7);g.fill();}
}
export function drawTiles(g,w,h){
 const r=seeded(23);
 g.fillStyle='#4e3a2c';g.fillRect(0,0,w,h);
 // Coppi: overlapping half-round clay tiles, faded orange, grey and lichen-marked.
 const cols=12,cw=w/cols,rows=7,rh=h/rows;
 for(let y=-1;y<rows;y++)for(let x=0;x<cols;x++){
  const t=r(),px=x*cw,py=y*rh+(x%2?rh*.5:0),fade=r();
  let R=150+t*44,G=98+t*34,B=68+t*26;
  if(fade<.26){R=132+t*24;G=118+t*20;B=102+t*18;}else if(fade<.4){R=112+t*18;G=82+t*14;B=62+t*12;}
  const grad=g.createLinearGradient(px,0,px+cw,0);
  grad.addColorStop(0,`rgb(${R-62|0},${G-46|0},${B-34|0})`);grad.addColorStop(.42,`rgb(${R+12|0},${G+10|0},${B+8|0})`);grad.addColorStop(1,`rgb(${R-70|0},${G-52|0},${B-38|0})`);
  g.fillStyle=grad;g.fillRect(px+.6,py,cw-1.2,rh*1.12);
  g.fillStyle='rgba(30,22,16,.45)';g.fillRect(px,py+rh*1.08,cw,2.4);
  if(r()<.22){g.fillStyle=`rgba(${r()<.6?'196,186,150':'72,78,52'},${.16+r()*.24})`;g.beginPath();g.ellipse(px+cw/2,py+rh/2,cw*.42,rh*.34,0,0,7);g.fill();}
 }
}

function instanced(THREE,geometry,material,items,name){
 const mesh=new THREE.InstancedMesh(geometry,material,Math.max(1,items.length));
 const m=new THREE.Matrix4(),q=new THREE.Quaternion(),e=new THREE.Euler(),one=new THREE.Vector3(1,1,1),p=new THREE.Vector3();
 items.forEach((it,i)=>{e.set(0,it.yaw,0);q.setFromEuler(e);p.set(it.x,it.y,it.z);m.compose(p,q,it.scale?new THREE.Vector3(...it.scale):one);mesh.setMatrixAt(i,m);});
 mesh.count=items.length;mesh.instanceMatrix.needsUpdate=true;mesh.name=name;mesh.castShadow=false;mesh.receiveShadow=true;mesh.frustumCulled=false;
 return mesh;
}

/* Keeps generated volumes out of the protected writer house. */
export function overlapsSite(v,site,radius=6.2){
 if(!site)return false;
 const [x0,z0]=[site.x,site.z];
 let inside=false;const ring=v.ring;
 for(let i=0,j=ring.length-1;i<ring.length;j=i++){
  const a=ring[i],b=ring[j];
  if(((a[1]>z0)!==(b[1]>z0))&&x0<(b[0]-a[0])*(z0-a[1])/(b[1]-a[1])+a[0])inside=!inside;
 }
 return inside||ring.some(p=>Math.hypot(p[0]-x0,p[1]-z0)<radius);
}

function tintFor(walls,roofs,v){
 const r=rng(v.seed^0x51ed),a=WALL_TINTS[Math.floor(r()*WALL_TINTS.length)],b=ROOF_TINTS[Math.floor(r()*ROOF_TINTS.length)],k=.94+r()*.12;
 walls.tint=a.map(c=>c*k);roofs.tint=b.map(c=>c*(.92+r()*.16));
}

/* Plaster remains, rain marks and darkening, at the scale of a whole front: what keeps walls from looking tiled. */
export function weatheredWall(material){
 material.onBeforeCompile=shader=>{
  shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vWallPos;').replace('#include <fog_vertex>','#include <fog_vertex>\nvWallPos=(modelMatrix*vec4(transformed,1.0)).xyz;');
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>',`#include <common>
varying vec3 vWallPos;
float wHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float wNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(wHash(i),wHash(i+vec2(1,0)),f.x),mix(wHash(i+vec2(0,1)),wHash(i+vec2(1,1)),f.x),f.y);}`)
  .replace('#include <color_fragment>',`#include <color_fragment>
{
 vec2 q=vec2(vWallPos.x+vWallPos.z*.83,vWallPos.y);
 float big=wNoise(q*.22)*.6+wNoise(q*.7)*.4;
 float plaster=smoothstep(.7,.8,big)*smoothstep(.35,.6,wNoise(q*1.9+7.0));
 diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.46,.39,.29)*(.85+wNoise(q*5.0)*.3),plaster*.62);
 float streak=wNoise(vec2(q.x*1.4,q.y*.08));
 diffuseColor.rgb*=1.0-smoothstep(.62,.9,streak)*.3;
 diffuseColor.rgb*=.86+wNoise(q*.11+3.0)*.28;
}`);
 };
 return material;
}

/* Tile overhang, ridge, cornice, chimneys and downpipes. Forms from photographs; none of this is surveyed. */
function addRoofDetail(roofs,trim,v,roof,extras){
 if(v.height_m<2.2)return;
 const r=rng(v.seed^0x77a1),[cx,cz,dx,dz]=roof.ridge,nx=-dz,nz=dx,ring=v.ring,big=v.height_m>=8&&v.area_m2>=110;
 trim.tint=[1,1,1];
 ring.forEach((a,i)=>{
  const b=ring[(i+1)%ring.length],len=Math.hypot(b[0]-a[0],b[1]-a[1]),[ox,oz,cover]=v.walls[i];
  if(len<.4||cover!=null)return;
  const ha=roofHeightAt(roof,v.eave_y,a[0],a[1]),hb=roofHeightAt(roof,v.eave_y,b[0],b[1]),o=.42,drop=.07,u=len/1.6;
  const A=[a[0],ha+.05,a[1]],B=[b[0],hb+.05,b[1]],C=[b[0]+ox*o,hb-drop,b[1]+oz*o],D=[a[0]+ox*o,ha-drop,a[1]+oz*o];
  roofs.quad(A,B,C,D,[0,0],[u,0],[u,.26],[0,.26]);
  // A moulded course under the eave, and string courses on the big palaces.
  if(Math.abs(ha-hb)<.05&&len>2){
   const band=(y,h,out)=>{const P=[a[0]+ox*out,y,a[1]+oz*out],Q=[b[0]+ox*out,y,b[1]+oz*out],R=[b[0]+ox*out,y+h,b[1]+oz*out],S=[a[0]+ox*out,y+h,a[1]+oz*out];trim.quad(P,Q,R,S,[0,0],[1,0],[1,1],[0,1]);trim.quad([a[0],y+h,a[1]],[b[0],y+h,b[1]],R,S,[0,0],[1,0],[1,1],[0,1]);trim.quad([a[0],y,a[1]],[b[0],y,b[1]],Q,P,[0,0],[1,0],[1,1],[0,1]);};
   band(v.eave_y-.34,.3,.14);
   if(big)for(let f=1;f*FLOOR_H<v.height_m-2;f++)band(v.base_y+f*FLOOR_H+.08,.14,.07);
  }
  if(len>5&&v.height_m>=5&&r()<.3){const t=r()<.5?.04:.96,x=a[0]+(b[0]-a[0])*t+ox*.09,z=a[1]+(b[1]-a[1])*t+oz*.09,h=v.eave_y-v.base_y;extras.pipes.push({x,y:v.base_y+h/2,z,yaw:0,scale:[1,h,1]});}
 });
 // Ridge cap along the part of the ridge over this footprint.
 const along=ring.map(p=>(p[0]-cx)*dx+(p[1]-cz)*dz),t0=Math.min(...along),t1=Math.max(...along),top=v.eave_y+roof.slope*roof.dmax+.04;
 if(t1-t0>1){
  const P=t=>[cx+dx*t,cz+dz*t],a=P(t0),b=P(t1),w=.13,u=(t1-t0)/1.6;
  roofs.quad([a[0]+nx*w,top-.05,a[1]+nz*w],[b[0]+nx*w,top-.05,b[1]+nz*w],[b[0],top+.09,b[1]],[a[0],top+.09,a[1]],[0,.3],[u,.3],[u,.42],[0,.42]);
  roofs.quad([a[0],top+.09,a[1]],[b[0],top+.09,b[1]],[b[0]-nx*w,top-.05,b[1]-nz*w],[a[0]-nx*w,top-.05,a[1]-nz*w],[0,.42],[u,.42],[u,.3],[0,.3]);
 }
 // Chimneys, near the ridge, more on larger houses.
 if(v.area_m2>30&&v.height_m>=4.5){
  const n=v.area_m2>160?3:v.area_m2>70?2:1;
  for(let k=0;k<n;k++){
   const t=t0+(t1-t0)*(.15+r()*.7),off=(r()-.5)*Math.min(2.2,roof.dmax),x=cx+dx*t+nx*off,z=cz+dz*t+nz*off;
   let inside=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const a=ring[i],b=ring[j];if((a[1]>z)!==(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])inside=!inside;}
   if(!inside||r()<.2)continue;
   const y=roofHeightAt(roof,v.eave_y,x,z),h=1.1+r()*.8,w=.5+r()*.25,yaw=Math.atan2(dx,dz);
   const sunk=.7;extras.chimneys.push({x,y:y+(h-sunk)/2,z,yaw,scale:[w,h+sunk,w*1.2]});
   extras.caps.push({x,y:y+h+.03,z,yaw,scale:[w+.26,.1,w*1.2+.26]});
  }
 }
}

function nearSegment(x,z,a,b){const dx=b[0]-a[0],dz=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz||1)));return Math.hypot(x-a[0]-dx*t,z-a[1]-dz*t);}

export function buildCivitaBuildings(THREE,parent,data,heightAt,{site=null,home=null,passages=[]}={}){
 const layer=new THREE.Group();layer.name='civita-measured-buildings';
 // With a surveyed home the town stays whole: that one volume is built separately so the cutaway can lift it off.
 const volumes=data.volumes.filter(v=>home?v.id!==home.volumeId:!overlapsSite(v,site));
 const homeVolume=home?data.volumes.find(v=>v.id===home.volumeId):null;
 const walls=new Batch(),roofs=new Batch(),trim=new Batch(),openings=[],extras={chimneys:[],caps:[],pipes:[]};
 for(const v of volumes){
  const roof=resolveRoof(v);
  // Every wall goes down to the ground, however far the slope falls away from its surveyed base.
  v.foot=wallFoot(v,heightAt);
  tintFor(walls,roofs,v);addRoofDetail(roofs,trim,v,roof,extras);
  const passage=passages.find(p=>p.volumes.some(c=>c.volume===v.id));
  if(passage){
   const levels=passage.axis.map(([x,z])=>heightAt(x,z)).filter(Number.isFinite),top=Math.max(...levels)+passage.arch_top_above_ground_m;
   addWalls(walls,v,roof,top);
   addPassagePieces(THREE,walls,passage.volumes.find(c=>c.volume===v.id),v.base_y-1.2,top);
   addRoof(THREE,roofs,v,roof);
   const clear=passage.width_m/2+1.1,[a,b]=[passage.axis[0],passage.axis.at(-1)];
   if(v.height_m>=2.2)openings.push(...planOpenings(v,heightAt).filter(o=>o.y>top+.4||nearSegment(o.x,o.z,a,b)>clear));
   continue;
  }
  addWalls(walls,v,roof);addRoof(THREE,roofs,v,roof);
  if(v.height_m>=2.2)openings.push(...planOpenings(v,heightAt));
 }
 const texture=(canvas,repeat)=>{
  if(!canvas)return null;
  const t=new THREE.CanvasTexture(canvas);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;t.repeat.set(repeat,repeat);return t;
 };
 const wallMat=weatheredWall(new THREE.MeshStandardMaterial({color:0xffffff,map:texture(stoneCanvas(drawTufa),1),roughness:.96,side:THREE.DoubleSide,vertexColors:true}));
 const roofMat=new THREE.MeshStandardMaterial({color:0xffffff,map:texture(stoneCanvas(drawTiles),1),roughness:.88,side:THREE.DoubleSide,vertexColors:true});
 const wallMesh=new THREE.Mesh(walls.geometry(THREE),wallMat);wallMesh.name='civita-building-walls';wallMesh.castShadow=true;wallMesh.receiveShadow=true;
 const roofMesh=new THREE.Mesh(roofs.geometry(THREE),roofMat);roofMesh.name='civita-building-roofs';roofMesh.castShadow=true;roofMesh.receiveShadow=true;
 layer.add(wallMesh,roofMesh);
 let homeLayer=null,homeCounts={windows:[],doors:[]};
 // What belongs to the home volume lives in its own layer, so nothing is left in mid-air when the house is cut open.
 const homeTrim=new Batch(),homeExtras={chimneys:[],caps:[],pipes:[]};let homeOpenings=[],homeShells=[];
 // Far away while the house is whole; see cutHome.
 const homeClip=[new THREE.Plane(new THREE.Vector3(1,0,0),1e6),new THREE.Plane(new THREE.Vector3(-1,0,0),1e6)];
 if(homeVolume){
  homeLayer=new THREE.Group();homeLayer.name='civita-writer-home-volume';
  const hw=new Batch(),hr=new Batch(),roof=resolveRoof(homeVolume);
  homeVolume.foot=wallFoot(homeVolume,heightAt);
  tintFor(hw,hr,homeVolume);addRoofDetail(hr,homeTrim,homeVolume,roof,homeExtras);
  addWalls(hw,homeVolume,roof);addRoof(THREE,hr,homeVolume,roof);
  // The house has its own copies of the town's materials, so it alone can be opened along the street wall.
  const own=m=>{const c=m.clone();c.onBeforeCompile=m.onBeforeCompile;c.customProgramCacheKey=()=>m===wallMat?'home-wall':'home-roof';c.clippingPlanes=homeClip;return c;};
  const hwMesh=new THREE.Mesh(hw.geometry(THREE),own(wallMat)),hrMesh=new THREE.Mesh(hr.geometry(THREE),own(roofMat));
  hwMesh.castShadow=hwMesh.receiveShadow=hrMesh.castShadow=hrMesh.receiveShadow=true;
  homeShells=[hwMesh,hrMesh];
  homeLayer.add(hwMesh,hrMesh);layer.add(homeLayer);
  // The street wall carries the writer's own facade; the volume's other walls keep ordinary openings.
  const {a,ox,oz}=home.facade;
  homeOpenings=planOpenings(homeVolume,heightAt).filter(o=>Math.abs((o.x-a[0])*ox+(o.z-a[1])*oz)>.6);
 }

 // Window and door frames are grey peperino in the photographs, broad and flat.
 const stone=new THREE.MeshStandardMaterial({color:0x8b8880,roughness:.95});
 const glass=new THREE.MeshStandardMaterial({color:0x2a2f33,roughness:.22,metalness:.25});
 const wood=new THREE.MeshStandardMaterial({color:0x6d4a2f,roughness:.8});
 const litGlass=new THREE.MeshStandardMaterial({color:0x1a1f24,roughness:.25,metalness:.2,emissive:0xffb868,emissiveIntensity:0});
 const shutter=new THREE.MeshStandardMaterial({color:0x6b4a31,roughness:.9});
 const door=new THREE.MeshStandardMaterial({color:0x5b3a24,roughness:.8});
 const dress=(target,list,ex,tr)=>{
 const windows=list.filter(o=>o.kind==='window'),doors=list.filter(o=>o.kind==='door');
 const B=(w,h,d)=>new THREE.BoxGeometry(w,h,d),one=B(1,1,1);
 const at=(o,out,dy,side=0,scale)=>({yaw:o.yaw,x:o.x+Math.sin(o.yaw)*out+Math.cos(o.yaw)*side,y:o.y+dy,z:o.z+Math.cos(o.yaw)*out-Math.sin(o.yaw)*side,scale});
 const closed=windows.filter(o=>o.closed),clear=windows.filter(o=>!o.closed);
 const pane=o=>at(o,.015,o.h/2,0,[o.w,o.h,.04]);
 // Plain square doors have a lintel; the rest take a round stone arch and an arched leaf.
 const square=doors.filter(o=>!o.arched),arched=doors.filter(o=>o.arched);
 const R=DOOR_W/2,spring=DOOR_H-R;
 const leafShape=new THREE.Shape();leafShape.moveTo(-R,0);leafShape.lineTo(-R,spring);leafShape.absarc(0,spring,R,Math.PI,0,true);leafShape.lineTo(R,0);leafShape.closePath();
 const frameShape=new THREE.Shape(),F=R+.26;frameShape.moveTo(-F,0);frameShape.lineTo(-F,spring);frameShape.absarc(0,spring,F,Math.PI,0,true);frameShape.lineTo(F,0);frameShape.lineTo(R,0);frameShape.lineTo(R,spring);frameShape.absarc(0,spring,R,0,Math.PI,false);frameShape.lineTo(-R,0);frameShape.closePath();
 const frameGeo=new THREE.ExtrudeGeometry(frameShape,{depth:.16,bevelEnabled:false,curveSegments:10});
 target.add(
  instanced(THREE,one,glass,clear.filter(o=>!o.lit).map(pane),'civita-window-panes'),
  instanced(THREE,one,litGlass,clear.filter(o=>o.lit).map(pane),'civita-window-panes-lit'),
  instanced(THREE,one,wood,closed.map(pane),'civita-window-inner-shutters'),
  instanced(THREE,one,wood,clear.map(o=>at(o,.04,o.h/2,0,[.05,o.h,.03])),'civita-window-mullions'),
  instanced(THREE,one,wood,clear.map(o=>at(o,.04,o.h*.62,0,[o.w,.05,.03])),'civita-window-transoms'),
  instanced(THREE,one,wood,closed.map(o=>at(o,.04,o.h/2,0,[.03,o.h,.02])),'civita-window-shutter-joins'),
  instanced(THREE,one,stone,windows.map(o=>at(o,.07,o.h+.11,0,[o.w+.5,.22,.16])),'civita-window-lintels'),
  instanced(THREE,one,stone,windows.map(o=>at(o,.09,-.06,0,[o.w+.56,.12,.22])),'civita-window-sills'),
  instanced(THREE,one,stone,windows.flatMap(o=>[-1,1].map(s=>at(o,.06,o.h/2,s*(o.w/2+.12),[.24,o.h,.14]))),'civita-window-jambs'),
  instanced(THREE,one,shutter,windows.filter(o=>o.shutter).flatMap(o=>[-1,1].map(s=>at(o,.1,o.h/2,s*(o.w*.82+.2),[o.w/2,o.h,.04]))),'civita-window-shutters'),
  instanced(THREE,one,door,square.map(o=>at(o,.03,DOOR_H/2,0,[DOOR_W,DOOR_H,.06])),'civita-door-leaves'),
  instanced(THREE,one,stone,square.map(o=>at(o,.07,DOOR_H+.15,0,[DOOR_W+.6,.3,.2])),'civita-door-lintels'),
  instanced(THREE,one,stone,square.flatMap(o=>[-1,1].map(s=>at(o,.06,DOOR_H/2,s*(DOOR_W/2+.13),[.26,DOOR_H,.18]))),'civita-door-jambs'),
  instanced(THREE,new THREE.ShapeGeometry(leafShape,10),door,arched.map(o=>at(o,.05,0)),'civita-door-arched-leaves'),
  instanced(THREE,frameGeo,stone,arched.map(o=>at(o,-.01,0)),'civita-door-arches'),
  instanced(THREE,one,stone,doors.map(o=>at(o,.26,.05,0,[DOOR_W+.5,.16,.5])),'civita-door-steps'),
  instanced(THREE,one,new THREE.MeshStandardMaterial({color:0x8c7654,roughness:.96}),ex.chimneys,'civita-chimneys'),
  instanced(THREE,one,new THREE.MeshStandardMaterial({color:0x8b5a40,roughness:.9}),ex.caps,'civita-chimney-caps'),
  instanced(THREE,new THREE.CylinderGeometry(.05,.05,1,6),new THREE.MeshStandardMaterial({color:0x5c4a3e,roughness:.7,metalness:.2}),ex.pipes,'civita-downpipes'),
 );
 const trimMesh=new THREE.Mesh(tr.geometry(THREE),new THREE.MeshStandardMaterial({color:0xa79c88,roughness:.95,side:THREE.DoubleSide,vertexColors:true}));trimMesh.name='civita-cornices';trimMesh.castShadow=true;trimMesh.receiveShadow=true;target.add(trimMesh);
 return {windows,doors};
 };
 const {windows,doors}=dress(layer,openings,extras,trim);
 if(homeLayer){
  // The chimney over the fireplace is added with the house; a second, random one would sit in the cut part.
  const own=dress(homeLayer,homeOpenings,{chimneys:[],caps:[],pipes:homeExtras.pipes},homeTrim);homeCounts=own;
  homeLayer.traverse(o=>{if(!o.material||homeShells.includes(o))return;const c=o.material.clone();c.clippingPlanes=homeClip;o.material=c;});
 }
 /* Opens the house along its street wall: only the slab between the two planes stays. */
 const cutHome=(active,site)=>{
  if(!homeLayer)return;
  const [front,back]=homeClip;
  if(active&&site){const s=Math.sin(site.yawRadians),c=Math.cos(site.yawRadians),o=site.x*s+site.z*c;front.normal.set(-s,0,-c);front.constant=o+3.26;back.normal.set(s,0,c);back.constant=-o+3.5;}
  else{front.constant=1e6;back.constant=1e6;}
  for(const m of homeShells)m.castShadow=!active;
 };
 layer.userData={source:data.source.attribution,buildingCount:volumes.length,windows:windows.length,doors:doors.length,
  heightsMeasured:true,roofsAndOpeningsInterpretive:true,physicalCollider:false};
 parent.add(layer);
 return {layer,homeLayer,litGlass,doors,windows,cutHome,wallMap:wallMat.map,counts:{volumes:volumes.length+(homeVolume?1:0),windows:windows.length+homeCounts.windows.length,doors:doors.length+homeCounts.doors.length}};
}
