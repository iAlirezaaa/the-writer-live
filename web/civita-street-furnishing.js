/* MAYOR-083: the small things in reference photographs of Civita.
 * Positions of named cafes and the well come from OSM; everything else is INTERPRETIVE dressing,
 * placed only on open ground and never recorded as surveyed.
 */
function rng(seed){let s=seed>>>0||1;return ()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};}
function pointIn(x,z,ring){let c=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const a=ring[i],b=ring[j];if((a[1]>z)!==(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])c=!c;}return c;}

/* Instances of one mesh from {x,y,z,yaw,sx,sy,sz}. */
function batch(THREE,geometry,material,items,name,{shadow=true,color=null}={}){
 const mesh=new THREE.InstancedMesh(geometry,material,Math.max(1,items.length));
 const m=new THREE.Matrix4(),q=new THREE.Quaternion(),e=new THREE.Euler(),p=new THREE.Vector3(),s=new THREE.Vector3(),c=new THREE.Color();
 items.forEach((it,i)=>{e.set(it.rx||0,it.yaw||0,it.rz||0);q.setFromEuler(e);p.set(it.x,it.y,it.z);s.set(it.sx??1,it.sy??it.sx??1,it.sz??it.sx??1);m.compose(p,q,s);mesh.setMatrixAt(i,m);if(color){c.setHex(color(it,i));mesh.setColorAt(i,c);}});
 mesh.count=items.length;mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;
 mesh.frustumCulled=false;mesh.castShadow=shadow;mesh.receiveShadow=true;mesh.name=name;return mesh;
}

export function buildCivitaStreetFurnishing(THREE,parent,data,heightAt,{doors=[],windows=[],passages=[]}={}){
 const layer=new THREE.Group();layer.name='civita-street-furnishing';
 layer.userData={interpretive:true,physicalCollider:false,namedPlacesSource:'OpenStreetMap ODbL'};
 const random=rng(7741);
 const village=data.volumes.filter(v=>{const [x,z]=v.ring[0];return x>-130&&x<200&&z>-120&&z<90;});
 const blocked=(x,z,m=.8)=>village.some(v=>[[0,0],[m,0],[-m,0],[0,m],[0,-m]].some(([dx,dz])=>pointIn(x+dx,z+dz,v.ring)));
 const open=(x,z,reach=10)=>{for(let r=0;r<=reach;r+=.8)for(let a=0;a<12;a++){const px=x+Math.cos(a*.5236)*r,pz=z+Math.sin(a*.5236)*r;if(!blocked(px,pz,1.3))return [px,pz];}return null;};
 const stone=new THREE.MeshStandardMaterial({color:0x9c958a,roughness:.95});
 const darkStone=new THREE.MeshStandardMaterial({color:0x7c766c,roughness:.97});
 const iron=new THREE.MeshStandardMaterial({color:0x24231f,roughness:.6,metalness:.45});
 const wood=new THREE.MeshStandardMaterial({color:0x5a4331,roughness:.86});
 const cream=new THREE.MeshStandardMaterial({color:0xe6dcc6,roughness:.9,side:THREE.DoubleSide});
 const terracotta=new THREE.MeshStandardMaterial({color:0xa25b3f,roughness:.9});
 const white=new THREE.MeshStandardMaterial({color:0xffffff,roughness:1,flatShading:true});
 const counts={};

 // Stone bollards around the piazza and along the main lane.
 const bollards=[];
 for(const path of data.paths.filter(p=>p.kind==='pedestrian')){
  let run=2;
  for(let i=0;i<path.points.length-1;i++){
   const a=path.points[i],b=path.points[i+1],len=Math.hypot(b[0]-a[0],b[1]-a[1]);if(!len)continue;
   const nx=-(b[1]-a[1])/len,nz=(b[0]-a[0])/len;
   while(run<len){
    const t=run/len,side=bollards.length%2?1:-1,x=a[0]+(b[0]-a[0])*t+nx*side*3.2,z=a[1]+(b[1]-a[1])*t+nz*side*3.2,g=heightAt(x,z);
    if(Number.isFinite(g)&&x>-75&&x<170&&!blocked(x,z,.6))bollards.push({x,y:g+.5,z});
    run+=7.5;
   }
   run-=len;
  }
 }
 layer.add(batch(THREE,new THREE.CylinderGeometry(.17,.2,1,10),stone,bollards,'civita-piazza-bollards'),
  batch(THREE,new THREE.SphereGeometry(.17,10,6,0,Math.PI*2,0,Math.PI/2),stone,bollards.map(b=>({...b,y:b.y+.5})),'civita-piazza-bollard-caps'));
 counts.bollards=bollards.length;

 // Flag poles at the church end of the piazza, with the town's coloured banners.
 const flagBase=[[-5,-6.5],[2,-3]],flagColors=[0x2f8f4e,0xc4322b,0xe7c94c,0x2f6ea8];
 const poles=[],flags=[];
 flagBase.forEach(([x,z],i)=>{
  const spot=open(x,z,5);if(!spot)return;const g=heightAt(...spot);if(!Number.isFinite(g))return;
  poles.push({x:spot[0],y:g+4.2,z:spot[1],sy:8.4});
  flags.push({x:spot[0]+.42,y:g+7.4,z:spot[1],yaw:.2,color:flagColors[i%4]});
 });
 const flagGeo=new THREE.PlaneGeometry(.8,1.9,8,6);{const p=flagGeo.attributes.position;for(let i=0;i<p.count;i++)p.setZ(i,Math.sin(p.getX(i)*4+p.getY(i)*1.5)*.09);flagGeo.computeVertexNormals();}
 const cloth=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.85,side:THREE.DoubleSide});
 layer.add(batch(THREE,new THREE.CylinderGeometry(.035,.05,1,8),iron,poles,'civita-flag-poles'),
  batch(THREE,flagGeo,cloth,flags,'civita-flags',{color:it=>it.color}));
 counts.flags=flags.length;

 // Hanging banners on palace fronts, as at the gate and the piazza.
 const near=(o,x,z,r)=>Math.hypot(o.x-x,o.z-z)<r;
 const banners=doors.filter(d=>near(d,-3,6,34)&&d.y>-9).filter((_,i)=>i%4===0).slice(0,8).map((d,i)=>({x:d.x+Math.sin(d.yaw)*.1+Math.cos(d.yaw)*1.7,y:d.y+4.3,z:d.z+Math.cos(d.yaw)*.1-Math.sin(d.yaw)*1.7,yaw:d.yaw,color:[0x9c2a2a,0x2d6a42,0x9c2a2a,0xb08a3a][i%4]}));
 layer.add(batch(THREE,new THREE.PlaneGeometry(.75,1.8),cloth,banners,'civita-wall-banners',{color:it=>it.color}));
 counts.banners=banners.length;

 // Terraces of the named cafes and trattorias: parasol, tables, chairs.
 const terraces=[];
 for(const place of data.places){
  if(!/Bar |Osteria|Arco del Gusto|Wine bar|Trattoria|Cantina|forno di Agnese|bottega/i.test(place.name))continue;
  if(place.x<-130||place.x>200)continue;
  const spot=open(place.x,place.z,9);if(spot)terraces.push({name:place.name,x:spot[0],z:spot[1],y:heightAt(...spot)});
 }
 const parasols=[],parasolPoles=[],tables=[],tableLegs=[],chairs=[];
 terraces.forEach(t=>{
  if(!Number.isFinite(t.y))return;
  parasols.push({x:t.x,y:t.y+2.45,z:t.z});parasolPoles.push({x:t.x,y:t.y+1.2,z:t.z,sy:2.4});
  for(const [dx,dz] of [[-.8,0],[.8,.2]]){
   tables.push({x:t.x+dx,y:t.y+.74,z:t.z+dz});tableLegs.push({x:t.x+dx,y:t.y+.37,z:t.z+dz,sy:.74});
   for(const a of [0,Math.PI]){chairs.push({x:t.x+dx+Math.sin(a)*.55+.02,y:t.y+.45,z:t.z+dz+Math.cos(a)*.55,yaw:a});}
  }
 });
 layer.add(batch(THREE,new THREE.ConeGeometry(1.7,.6,8,1,true),cream,parasols,'civita-parasols'),
  batch(THREE,new THREE.CylinderGeometry(.03,.03,1,6),iron,parasolPoles,'civita-parasol-poles'),
  batch(THREE,new THREE.CylinderGeometry(.36,.36,.04,14),wood,tables,'civita-cafe-tables'),
  batch(THREE,new THREE.CylinderGeometry(.04,.06,1,6),iron,tableLegs,'civita-cafe-table-legs'),
  batch(THREE,new THREE.BoxGeometry(.38,.05,.38),wood,chairs,'civita-cafe-chair-seats'),
  batch(THREE,new THREE.BoxGeometry(.38,.42,.04),wood,chairs.map(c=>({...c,x:c.x+Math.sin(c.yaw)*.18,y:c.y+.22,z:c.z+Math.cos(c.yaw)*.18})),'civita-cafe-chair-backs'));
 counts.terraces=terraces.length;

 // The well named on the map.
 const wellPlace=data.places.find(p=>/pozzo/i.test(p.name));
 if(wellPlace){
  const spot=open(wellPlace.x,wellPlace.z,6);
  if(spot){const g=heightAt(...spot),well=new THREE.Group();well.name='civita-well';well.position.set(spot[0],g,spot[1]);layer.add(well);
   const add=(geo,mat,x,y,z,rz=0)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.rotation.z=rz;m.castShadow=m.receiveShadow=true;well.add(m);return m;};
   add(new THREE.CylinderGeometry(.82,.9,.9,16,1,true),stone,0,.45,0);add(new THREE.TorusGeometry(.82,.09,8,20),darkStone,0,.92,0).rotation.x=Math.PI/2;
   add(new THREE.CircleGeometry(.76,16),new THREE.MeshStandardMaterial({color:0x101412,roughness:.3}),0,.42,0).rotation.x=-Math.PI/2;
   for(const s of [-1,1])add(new THREE.BoxGeometry(.06,1.9,.06),iron,s*.78,1.8,0);
   add(new THREE.TorusGeometry(.78,.03,6,18,Math.PI),iron,0,2.74,0);add(new THREE.CylinderGeometry(.09,.09,.22,10),iron,0,3.3,0);counts.well=true;}
 }

 // Stone stoops at some doors, and pots along them.
 const stoopDoors=doors.filter(d=>{const ox=d.x+Math.sin(d.yaw)*1.2,oz=d.z+Math.cos(d.yaw)*1.2;return random()<.32&&!blocked(ox,oz,.3);});
 const treads=[];
 stoopDoors.forEach(d=>{for(let i=0;i<3;i++){const out=.5+i*.32;treads.push({x:d.x+Math.sin(d.yaw)*out,y:d.y-.08-i*.13,z:d.z+Math.cos(d.yaw)*out,yaw:d.yaw,sx:1.5+i*.2,sy:.14,sz:.34});}});
 layer.add(batch(THREE,new THREE.BoxGeometry(1,1,1),darkStone,treads,'civita-door-stoops'));
 counts.stoops=stoopDoors.length;

 // Window boxes and small iron balconies on upper floors.
 const upper=windows.filter(w=>w.y-heightAt(w.x,w.z)>2.4);
 const boxes=upper.filter(()=>random()<.14),balconies=upper.filter(()=>random()<.05);
 const out=(w,d,dy=0)=>({x:w.x+Math.sin(w.yaw)*d,y:w.y+dy,z:w.z+Math.cos(w.yaw)*d,yaw:w.yaw});
 const flowers=boxes.flatMap(w=>[-.3,0,.3].map(k=>{const p=out(w,.3,.1);return {...p,x:p.x+Math.cos(w.yaw)*k,z:p.z-Math.sin(w.yaw)*k,sx:.9+random()*.5,kind:random()};}));
 layer.add(batch(THREE,new THREE.BoxGeometry(1.05,.2,.24),terracotta,boxes.map(w=>out(w,.28,-.1)),'civita-window-boxes'),
  batch(THREE,new THREE.IcosahedronGeometry(.17,0),white,flowers,'civita-window-flowers',{color:it=>it.kind<.55?0xb5332e:it.kind<.75?0xd86a8a:0x48683a}));
 const rails=balconies.flatMap(w=>{const base=out(w,.62,.0),items=[];for(let k=-3;k<=3;k++)items.push({x:base.x+Math.cos(w.yaw)*k*.2,y:base.y+.42,z:base.z-Math.sin(w.yaw)*k*.2,yaw:w.yaw,sx:.025,sy:.84,sz:.025});return items;});
 const slabs=balconies.map(w=>({...out(w,.36,-.04),sx:1.5,sy:.09,sz:.74}));
 const topRails=balconies.map(w=>({...out(w,.64,.84),sx:1.4,sy:.035,sz:.035}));
 layer.add(batch(THREE,new THREE.BoxGeometry(1,1,1),stone,slabs,'civita-balcony-slabs'),
  batch(THREE,new THREE.BoxGeometry(1,1,1),iron,[...rails,...topRails],'civita-balcony-rails'));
 counts.windowBoxes=boxes.length;counts.balconies=balconies.length;

 // Virginia creeper and ivy in whole sheets over parts of a front, as in the photographs.
 const leaves=[],leafColors=[0x4f7a2e,0x5f8a34,0x3f6a2a,0x6f9440,0x7c9c44];
 const candidates=[];
 for(const v of village){
  // A block with an open passage has no wall where the lane runs through it.
  if(v.height_m<4||passages.some(p=>p.volumes.some(c=>c.volume===v.id)))continue;
  v.ring.forEach((a,i)=>{const b=v.ring[(i+1)%v.ring.length],len=Math.hypot(b[0]-a[0],b[1]-a[1]),[ox,oz,cover]=v.walls[i];if(len<4||cover!=null)return;const mx=(a[0]+b[0])/2+ox*1.6,mz=(a[1]+b[1])/2+oz*1.6;if(blocked(mx,mz,.2)||!Number.isFinite(heightAt(mx,mz)))return;candidates.push({v,a,b,len,ox,oz});});
 }
 const sheets=candidates.filter(()=>random()<.13);
 for(const {v,a,b,len,ox,oz} of sheets){
  const tx=(b[0]-a[0])/len,tz=(b[1]-a[1])/len,width=Math.min(len,3+random()*6),start=random()*(len-width),top=Math.min(v.height_m,3+random()*v.height_m),seed=random()*50,yaw=Math.atan2(ox,oz);
  const edge=u=>top*(.62+.38*Math.sin(u*1.3+seed)*Math.sin(u*.47+seed*2));
  const n=Math.round(width*top*30);
  for(let k=0;k<n;k++){
   const u=random()*width,h=random()*top;if(h>edge(u))continue;
   const along=start+u,x=a[0]+tx*along,z=a[1]+tz*along,g=heightAt(x+ox,z+oz);if(!Number.isFinite(g))continue;
   const out=.07+random()*.1;leaves.push({x:x+ox*out,y:Math.max(g,v.base_y)+h,z:z+oz*out,rx:(random()-.5)*.9,yaw:yaw+(random()-.5)*.9,rz:random()*6.3,sx:.8+random()*.8,tone:Math.floor(random()*leafColors.length)});
  }
 }
 const leafMat=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.75,side:THREE.DoubleSide});
 layer.add(batch(THREE,new THREE.CircleGeometry(.15,5),leafMat,leaves,'civita-ivy',{shadow:false,color:it=>leafColors[it.tone]}));
 counts.ivy=leaves.length;counts.ivySheets=sheets.length;

 // Civita's cats, on doorsteps and ledges.
 const cats=doors.filter(()=>random()<.03).map(d=>({x:d.x+Math.sin(d.yaw)*1.05+Math.cos(d.yaw)*.8,y:d.y,z:d.z+Math.cos(d.yaw)*1.05-Math.sin(d.yaw)*.8,yaw:random()*6.3,tone:random()})).filter(c=>!blocked(c.x,c.z,.1));
 const catColor=it=>it.tone<.33?0x2a2622:it.tone<.66?0xa8763e:0x8d8a84;
 const fwd=(c,k,dy)=>({...c,x:c.x+Math.sin(c.yaw)*k,y:c.y+dy,z:c.z+Math.cos(c.yaw)*k});
 layer.add(batch(THREE,new THREE.SphereGeometry(.14,10,8),white,cats.map(c=>({...fwd(c,0,.16),sx:.9,sy:1.15,sz:1.3})),'civita-cat-bodies',{color:catColor}),
  batch(THREE,new THREE.SphereGeometry(.09,10,8),white,cats.map(c=>fwd(c,.13,.36)),'civita-cat-heads',{color:catColor}),
  batch(THREE,new THREE.ConeGeometry(.035,.08,4),white,cats.flatMap(c=>[-1,1].map(s=>{const h=fwd(c,.13,.45);return {...c,x:h.x+Math.cos(c.yaw)*s*.05,y:h.y,z:h.z-Math.sin(c.yaw)*s*.05,tone:c.tone};})),'civita-cat-ears',{color:catColor}));
 counts.cats=cats.length;

 parent.add(layer);
 // What a walker has to step around.
 const obstacles=[...terraces.filter(t=>Number.isFinite(t.y)).map(t=>({x:t.x,z:t.z,r:1.9})),...bollards.map(b=>({x:b.x,z:b.z,r:.3})),...poles.map(b=>({x:b.x,z:b.z,r:.2}))];
 const well=layer.getObjectByName('civita-well');if(well)obstacles.push({x:well.position.x,z:well.position.z,r:1.1});
 return {layer,counts,terraces,obstacles};
}
