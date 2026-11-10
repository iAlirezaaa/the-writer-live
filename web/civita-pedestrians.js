/* Civita footpath-attached ambient population, 3Dviz silhouette/LOD study.
 * These figures are anonymous proxy walkers, NOT claims about real residents,
 * population, cultural identity, named people, or verified access conditions.
 * Route points come exclusively from OSM footway/pedestrian/path/steps ways.
 */
const palette=[0x425d5a,0x7c4d40,0x5c5969,0x9d8762,0x506779,0x866655,0x76744e,0x534b43];
export function createCivitaPedestrians(THREE,parent,sourcePaths,{maxPeople=18}={}){
 if(!THREE?.Group||!parent?.add||!Array.isArray(sourcePaths))throw new TypeError('Invalid Civita pedestrian context');
 const layer=new THREE.Group();layer.name='civita-osm-footpath-visual-pedestrians';
 layer.userData={illustrativePeople:true,actualPopulationVerified:false,source:'OpenStreetMap pedestrian way centerlines',licenses:['ODbL-1.0'],physicalCollider:false,citizenIdentityChanges:false};
 parent.add(layer);
 const headGeometry=new THREE.SphereGeometry(.15,10,7);
 const hairGeometry=new THREE.SphereGeometry(.155,8,6,0,Math.PI*2,0,Math.PI*.50);
 const coatGeometry=new THREE.CylinderGeometry(.23,.24,.65,7);
 const legGeometry=new THREE.CylinderGeometry(.067,.065,.68,6);
 const armGeometry=new THREE.CylinderGeometry(.063,.060,.54,6);
 const skin=new THREE.MeshStandardMaterial({color:0xb98a6e,roughness:.95});
 const hair=new THREE.MeshStandardMaterial({color:0x352e2b,roughness:1});
 const shoes=new THREE.MeshStandardMaterial({color:0x332e2c,roughness:1});
 const cloth=palette.map(color=>new THREE.MeshStandardMaterial({color,roughness:.94}));
 const locals=[];
 const eligible=sourcePaths.filter(p=>p?.points?.length>=2&&p.points.every(q=>Number.isFinite(q.x)&&Number.isFinite(q.z)));
 function pointDistance(a,b){return Math.hypot(a.x-b.x,a.z-b.z);}
 for(let k=0;k<eligible.length&&locals.length<maxPeople;k++){
  const path=eligible[k],segments=[];
  for(let j=1;j<path.points.length;j++){
    const a=path.points[j-1],b=path.points[j],length=pointDistance(a,b);
    if(length>=7 && length<150 && Math.hypot((a.x+b.x)/2,(a.z+b.z)/2)>14)segments.push({a,b,length});
  }
  if(!segments.length)continue;
  const segment=segments[(k*7)%segments.length],root=new THREE.Group();
  root.name='anonymous-footpath-visitor-'+locals.length;
  const person=new THREE.Group();root.add(person);
  const garment=cloth[(k*5)%cloth.length];
  const coat=new THREE.Mesh(coatGeometry,garment);coat.position.y=1.04;person.add(coat);
  const head=new THREE.Mesh(headGeometry,skin);head.position.y=1.63;person.add(head);
  const scalp=new THREE.Mesh(hairGeometry,hair);scalp.position.y=1.65;person.add(scalp);
  const arms=[];
  for(const side of [-1,1]){
    const armPivot=new THREE.Group();armPivot.position.set(side*.26,1.31,0);person.add(armPivot);
    const arm=new THREE.Mesh(armGeometry,garment);arm.position.y=-.25;armPivot.add(arm);arms.push(armPivot);
  }
  const legs=[];
  for(const side of [-1,1]){
    const legPivot=new THREE.Group();legPivot.position.set(side*.1,.76,0);person.add(legPivot);
    const leg=new THREE.Mesh(legGeometry,shoes);leg.position.y=-.31;legPivot.add(leg);legs.push(legPivot);
  }
  root.userData={sourceWay:path.id,sourceUrl:path.provenance?.source_url,source:'OpenStreetMap ODbL',identity:'anonymous visual proxy',physicalCollider:false};
  layer.add(root);
  locals.push({root,arms,legs,path:segment,phase:k*.337,speed:.55+(k%5)*.1});
 }
 layer.userData.renderedVisualPedestrians=locals.length;
 function update(day=1,time=0){
  const daylight=Math.max(0,Math.min(1,Number(day)||0));
  const activeCount=Math.min(locals.length,Math.max(2,Math.round(locals.length*(.25+.75*daylight))));
  for(let i=0;i<locals.length;i++){
   const p=locals[i];p.root.visible=i<activeCount;
   if(!p.root.visible)continue;
   const {a,b,length}=p.path;
   const linear=(time*p.speed/length+p.phase)%2;
   const v=linear<=1?linear:2-linear,forward=linear<=1;
   p.root.position.set(a.x+(b.x-a.x)*v,.13,a.z+(b.z-a.z)*v);
   p.root.rotation.y=Math.atan2((b.x-a.x)*(forward?1:-1),(b.z-a.z)*(forward?1:-1));
   const walk=Math.sin(time*p.speed*7+i);
   p.legs[0].rotation.x=walk*.45;p.legs[1].rotation.x=-walk*.45;
   p.arms[0].rotation.x=-walk*.35;p.arms[1].rotation.x=walk*.35;
  }
 }
 update(1,0);
 return {group:layer,update,count:locals.length};
}
