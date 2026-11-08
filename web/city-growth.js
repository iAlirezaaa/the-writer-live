/* Civic growth kit — purely environmental, no author/publisher/citizen state.
 * Geometry and motion use one shared low-poly library and deterministic transforms.
 */
export const CITY_GROWTH_VERSION="civic-growth-20261108-v1";
export const CITY_GROWTH_HOMES=Object.freeze(
  [-16,-33].flatMap((z,row)=>Array.from({length:6},(_,i)=>({
    id:`residence-${row+1}-${i+1}`,x:42+i*8.8,z,w:6.2,d:6.2,
    floors:4,flatsPerFloor:3,peoplePerFlat:3,
    entry:{x:42+i*8.8,z:z+(row===0?-3.5:3.5)}
  })))
);
export const CITY_GROWTH_CIVIC=Object.freeze([
  {id:"city-school",x:-52,z:-16,w:9,d:7.5,kind:"school",label:"دبستان شهر",entry:{x:-52,z:-20.2}},
  {id:"police-station",x:-65,z:-16,w:7.5,d:7.5,kind:"police",label:"کلانتری شهر",entry:{x:-65,z:-20.2}},
  {id:"screenplay-office",x:-52,z:-33,w:9,d:7.5,kind:"screenplay",label:"دفتر فیلم‌نامه و دکوپاژ",entry:{x:-52,z:-28.7}},
  {id:"film-studio",x:99,z:-54,w:14,d:12,kind:"film",label:"استودیوی فیلم‌سازی",entry:{x:92,z:-54}}
]);
export const CITY_HOUSING_CAPACITY=CITY_GROWTH_HOMES.reduce(
 (sum,b)=>sum+b.floors*b.flatsPerFloor*b.peoplePerFlat,0);
const intersects=(a,b,padding=1)=>Math.abs(a.x-b.x)<(a.w+b.w)/2+padding &&
 Math.abs(a.z-b.z)<(a.d+b.d)/2+padding;
export function auditCityGrowth(roads=[]){
 const collisions=[],unreachable=[];
 const sites=[...CITY_GROWTH_HOMES,...CITY_GROWTH_CIVIC];
 for(let i=0;i<sites.length;i++)for(let j=i+1;j<sites.length;j++)
   if(intersects(sites[i],sites[j],.45)) collisions.push([sites[i].id,sites[j].id]);
 for(const p of sites){
   const reaches=roads.some(r=>r.axis==="x"?
     Math.abs(p.entry.z-r.at)<=6 && p.entry.x>=r.min-1 && p.entry.x<=r.max+1:
     Math.abs(p.entry.x-r.at)<=6 && p.entry.z>=r.min-1 && p.entry.z<=r.max+1);
   if(!reaches)unreachable.push(p.id);
 }
 return {ok:!collisions.length&&!unreachable.length&&CITY_HOUSING_CAPACITY>=400,
  housingCapacity:CITY_HOUSING_CAPACITY,homes:CITY_GROWTH_HOMES.length,
  civic:CITY_GROWTH_CIVIC.length,collisions,unreachable};
}
export function buildCityGrowth({THREE,group,clickable,canvasTex,places=[],streetY=-3}){
 const root=new THREE.Group();root.name="city-growth";group.add(root);
 const material=new Map(),geo=new Map();
 const mat=(key,color,more={})=>{
   if(!material.has(key))material.set(key,new THREE.MeshStandardMaterial({color,roughness:.86,...more}));
   return material.get(key);
 };
 const shape=(kind,...dims)=>{
   const key=kind+":"+dims.join(":");
   if(!geo.has(key)){
     const ctor={box:THREE.BoxGeometry,cone:THREE.ConeGeometry,
       cylinder:THREE.CylinderGeometry,icosa:THREE.IcosahedronGeometry,
       plane:THREE.PlaneGeometry}[kind];
     geo.set(key,new ctor(...dims));
   }
   return geo.get(key);
 };
 const add=(g,m,x,y,z,parent=root)=>{
   const o=new THREE.Mesh(g,m);o.position.set(x,y,z);o.receiveShadow=true;parent.add(o);return o;
 };
 const box=(w,h,d,m,x,y,z,parent)=>add(shape("box",w,h,d),m,x,y,z,parent);
 const Y=(v)=>streetY+v;
 const stone=mat("stone",0xc5baa5),timber=mat("timber",0x62564a);
 const roof=mat("roof",0x5d676b),glass=mat("glass",0x8ca7ad,{
   metalness:.12,roughness:.3,emissive:0xffdcaa,emissiveIntensity:.12});
 const entryMat=mat("door",0x52656a);
 const moss=mat("ground-sage",0x65876b),dark=mat("metal",0x4b555a);
 const paper=mat("cream",0xe0d7c6),windows=mat("windows",0x96aaa7,{
   emissive:0xffdfa5,emissiveIntensity:.16});
 const register=(node,id,title)=>{
   const item=places.find(p=>p.id===id);
   if(!item)throw new Error("Unknown new city destination: "+id);
   node.userData.placeId=id;node.userData.placeDetails=item;node.userData.view="town";
   clickable(node,"p-town",title);
 };
 const sign=(title,x,y,z,w=3.1)=>{
   const texture=canvasTex(512,128,(ctx,W,H)=>{
     ctx.fillStyle="#304a4c";ctx.fillRect(0,0,W,H);
     ctx.strokeStyle="#d8c9a6";ctx.lineWidth=5;ctx.strokeRect(7,7,W-14,H-14);
     ctx.fillStyle="#fff0d1";ctx.direction="rtl";ctx.textAlign="center";
     ctx.textBaseline="middle";ctx.font="600 40px Tahoma, sans-serif";
     ctx.fillText(title,W/2,H/2,W-36);
   });
   return add(shape("plane",w,w*.25),new THREE.MeshBasicMaterial({
     map:texture,side:THREE.DoubleSide,toneMapped:false}),x,Y(y),z);
 };
 // Twelve 4-storey blocks: 12 x 4 x 3 flats x 3 residents = 432
 // capacity only; do not spawn 432 active residents or claim they currently live here.
 const wall=mat("housing-stucco",0xa9a48e),trim=mat("housing-trim",0x766c5b);
 const windowGeo=shape("box",.78,.93,.09),wallFloor=3;
 const windowsCount=CITY_GROWTH_HOMES.length*4*4;
 const batch=new THREE.InstancedMesh(windowGeo,windows,windowsCount);
 batch.name="shared-residential-window-library";root.add(batch);
 const dummy=new THREE.Object3D();let index=0;
 for(const b of CITY_GROWTH_HOMES){
   const parent=new THREE.Group();parent.name="growth-"+b.id;
   parent.position.set(b.x,streetY,b.z);root.add(parent);
   box(b.w,12.05,b.d,wall,0,6.025,0,parent);
   box(b.w+.34,.32,b.d+.34,roof,0,12.18,0,parent);
   box(b.w+.18,.19,b.d+.18,stone,0,.10,0,parent);
   box(1.15,2.22,.15,entryMat,0,1.11,b.z===-16?-b.d/2-.10:b.d/2+.10,parent);
   box(2.0,.10,2.4,stone,b.x, Y(.06),b.z===-16?b.z-4.24:b.z+4.24);
   for(let f=0;f<4;f++)for(let k=0;k<4;k++){
     const x=b.x+(-2.1+k*1.4),y=Y(.95+f*wallFloor+1.02);
     const z=b.z+(b.z===-16?-b.d/2-.10:b.d/2+.10);
     dummy.position.set(x,y,z);dummy.rotation.set(0,0,0);dummy.scale.set(1,1,1);
     dummy.updateMatrix();batch.setMatrixAt(index++,dummy.matrix);
   }
   // Exterior balconies only; interiors are reserved for a later lightweight LOD stage.
   for(let floor=1;floor<4;floor++)
     box(b.w-.7,.13,.65,trim,0,floor*3+.36,b.z===-16?-3.2:3.2,parent);
 }
 batch.instanceMatrix.needsUpdate=true;
 // Separate school, police, screenplay/storyboard office and out-of-town film stage.
 const colorByKind={
   school:mat("school",0xc7b18c),police:mat("police",0x839aaa),
   screenplay:mat("screenplay",0xb8a68d),film:mat("filmstudio",0x697981)
 };
 for(const p of CITY_GROWTH_CIVIC){
   const parent=new THREE.Group();parent.name="civic-"+p.id;
   parent.position.set(p.x,streetY,p.z);root.add(parent);
   const h=p.kind==="film"?7.6:p.kind==="school"?6.5:5.4;
   box(p.w,h,p.d,colorByKind[p.kind],0,h/2,0,parent);
   box(p.w+.36,.32,p.d+.34,roof,0,h+.06,0,parent);
   const isFilm=p.kind==="film",back=p.id==="screenplay-office";
   if(isFilm){
     box(.13,3.2,3.3,entryMat,-p.w/2-.08,1.6,0,parent);
     box(3,.09,2.7,stone,90.7,Y(.09),-54);
     // Outdoor camera crane and film reel: visual props, not active production agents.
     box(.18,5,.18,dark,3,2.5,-1.4,parent);
     const boom=box(5,.15,.16,dark,4.2,5.1,-1.4,parent);boom.rotation.z=.18;
     add(shape("cylinder",.58,.58,.20,12),roof,5.3,4.38,-1.4,parent).rotation.x=Math.PI/2;
   }else{
     box(1.25,2.3,.16,entryMat,0,1.15,back?-p.d/2-.08:-p.d/2-.08,parent);
     for(let f=0;f<2;f++)for(const dx of [-p.w*.29,p.w*.29])
       box(1.45,1.30,.10,glass,dx,1.9+f*2.65,-p.d/2-.09,parent);
     if(p.kind==="school"){
       box(3.2,1.75,.14,paper,0,3.9,-p.d/2-.16,parent);
     }
     if(p.kind==="police"){
       box(.8,.26,.25,mat("police-blue",0x567fb3),0,h+.32,0,parent);
     }
   }
   const marker=sign(p.label,p.x,h-.65,p.z-p.d/2-.25,p.kind==="screenplay"?5.3:3.65);
   register(marker,p.id,p.label);
   // Pedestrian accessibility apron toward the existing asphalt network.
   if(!isFilm){
     const front=p.id==="screenplay-office"?-28.7:-20.2;
     box(1.8,.11,Math.max(.8,Math.abs(front-(-24.5))+.5),
       stone,p.x,Y(.08),(front-24.5)/2);
   }
 }
 // Single shared mesh pair for an evergreen eastern forest, with a clear traffic corridor.
 const forestLocations=[];
 for(let ix=0;ix<5;ix++)for(let iz=0;iz<9;iz++){
   const x=94+ix*5.5,z=-7-iz*8.5;
   if(Math.abs(z+40)<5 || (Math.abs(x-99)<13 && Math.abs(z+54)<13))continue;
   forestLocations.push([x,z,1+(ix+iz)%4*.18]);
 }
 const trunkBatch=new THREE.InstancedMesh(shape("cylinder",.12,.19,1.9,6),timber,forestLocations.length);
 const canopyBatch=new THREE.InstancedMesh(shape("icosa",1,1),moss,forestLocations.length);
 trunkBatch.name="shared-forest-trunks";canopyBatch.name="shared-forest-canopies";
 forestLocations.forEach(([x,z,s],i)=>{
   dummy.position.set(x,Y(.95*s),z);dummy.scale.set(s,s,s);dummy.updateMatrix();
   trunkBatch.setMatrixAt(i,dummy.matrix);
   dummy.position.set(x,Y(2.35*s),z);dummy.scale.set(.88*s,1.02*s,.82*s);
   dummy.updateMatrix();canopyBatch.setMatrixAt(i,dummy.matrix);
 });
 trunkBatch.instanceMatrix.needsUpdate=true;canopyBatch.instanceMatrix.needsUpdate=true;
 root.add(trunkBatch,canopyBatch);
 // Mountains north of the settlement; the existing mountain line remains as foreground.
 const mountain=mat("mountain-distant",0x73818b),snow=mat("mountain-snow",0xd9dfe1);
 for(let i=0;i<9;i++){
   const x=-92+i*22, z=-89-(i%3)*6, h=17+(i*7)%18;
   add(shape("cone",11,h,6),mountain,x,Y(h/2-.3),z);
   add(shape("cone",4.6,4.7,6),snow,x,Y(h-2.0),z);
 }
 // Signs remind visitors of speed limits, crossings and yielding; no change to car AI.
 for(const [x,z,label] of [[-31,-24.5,"ایست"],[33,-24.5,"حق تقدم"],[86,-24.5,"۳۰"],[91,-40,"جادهٔ جنگل"]]){
   box(.10,2.5,.10,dark,x,Y(1.25),z+3.5);
   sign(label,x,2.35,z+3.5,2.0);
 }
 const forestGate=sign("راه جنگل",111,2.7,-37.2,3.5);
 register(forestGate,"forest-gate","راه جنگل");
 const housingSign=sign("محلهٔ شرقی",64,2.5,-22,4);
 register(housingSign,"eastern-neighborhood","محلهٔ شرقی");
 // Ambient animal micro-animation; no new NPC or story/citizen state.
 const birds=[],birdBody=shape("icosa",.22,0),wingGeo=shape("box",.45,.045,.16);
 const birdMaterial=mat("bird",0x384e55);
 for(let i=0;i<5;i++){
   const g=new THREE.Group();g.name="ambient-bird-"+i;root.add(g);
   add(birdBody,birdMaterial,0,0,0,g);
   const wings=[];
   for(const side of [-1,1]){
     const pivot=new THREE.Group();pivot.position.x=side*.16;g.add(pivot);
     add(wingGeo,birdMaterial,side*.21,0,0,pivot);wings.push({pivot,side});
   }
   birds.push({g,wings,phase:i*1.31});
 }
 const animal=mat("street-animal",0x9e8b76);
 const cats=[];
 for(const [x,z] of [[-44,10],[60,-9]]){
   const g=new THREE.Group();g.name="ambient-cat";g.position.set(x,streetY,z);root.add(g);
   add(shape("icosa",.38,1),animal,0,.41,0,g);
   add(shape("icosa",.23,1),animal,0,.75,.31,g);
   const tail=add(shape("cylinder",.06,.08,.65,6),animal,-.31,.65,-.19,g);
   tail.rotation.z=-.4;cats.push({g,tail});
 }
 // Light precipitation is preallocated; animation modifies only one small buffer.
 const snowCount=96;
 const particles=new Float32Array(snowCount*3);
 for(let i=0;i<snowCount;i++){
   particles[i*3]=((i*37)%165)-75;
   particles[i*3+1]=Y(3+(i*17)%30);
   particles[i*3+2]=((i*41)%115)-67;
 }
 const precipitationGeo=new THREE.BufferGeometry();
 precipitationGeo.setAttribute("position",new THREE.BufferAttribute(particles,3));
 const weatherMat=new THREE.PointsMaterial({
   color:0xe9edf1,size:.19,transparent:true,opacity:.35,depthWrite:false
 });
 const precipitation=new THREE.Points(precipitationGeo,weatherMat);
 precipitation.name="lightweight-weather-particles";root.add(precipitation);
 function update(day=1,elapsed=0){
   const night=1-Math.max(0,Math.min(1,day));
   windows.emissiveIntensity=.04+night*.85;
   glass.emissiveIntensity=.03+night*.2;
   for(const b of birds){
     b.g.position.set(18+Math.cos(elapsed*.11+b.phase)*36,
       Y(13+Math.sin(elapsed*.39+b.phase)*2),
       9+Math.sin(elapsed*.11+b.phase)*18);
     b.g.rotation.y=-elapsed*.11-b.phase;
     for(const {pivot,side} of b.wings)pivot.rotation.z=side*Math.sin(elapsed*6+b.phase)*.5;
   }
   for(let i=0;i<cats.length;i++)cats[i].tail.rotation.z=-.4+
     Math.sin(elapsed*1.6+i)*.12;
   // Weather cycle remains illustrative; it does not alter the actual local forecast.
   precipitation.visible=(Math.floor(elapsed/90)%4===2);
   if(precipitation.visible){
     const a=precipitationGeo.attributes.position;
     for(let i=0;i<snowCount;i++){
       a.setY(i,Y(2+(i*17+900-elapsed*.7)%30));
     }
     a.needsUpdate=true;
   }
 }
 return {group:root,update,stats:Object.freeze({capacity:CITY_HOUSING_CAPACITY,
   homes:CITY_GROWTH_HOMES.length,civic:CITY_GROWTH_CIVIC.length,
   forestTrees:forestLocations.length,birds:birds.length})};
}
