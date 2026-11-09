/* MAYOR-043 — visibly populated, reversible interpretive layer for ONE sourced Tehran block.
 * NOT a measured tree/parking/lamppost survey. Keep OSM/Overture geometry authoritative.
 * 3Dviz Pro Max: instanced assemblies, distinct joins/materials, bounded silhouettes.
 * No routes, citizens, facades, building floors, colliders or writer room mutations.
 */
import { writerBlockLocalRing, writerBlockContainsLocalPoint } from "./writer-block-road-preview.js?v=writer-block-osm-preview-20261109-v1";
import { buildStreetFramePlan } from "./writer-block-street-frame.js?v=writer-block-4-roads-20261109-v1";
import { WRITER_BLOCK_BUILDING_SOURCE } from "./writer-block-building-data.js?v=writer-block-overture-20261109-v1";

export const CONTEXT_VERSION="writer-block-illustrative-context-20261109-v1";
export const CONTEXT_SCOPE="INTERPRETIVE_NOT_SURVEYED";
const MAX=Object.freeze({trees:24,shrubs:36,lamps:18,cars:9});
const dot=(a,b)=>a.x*b.x+a.z*b.z;
const lerp=(a,b,t)=>({x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t});
const area2=(a,b,c)=>(b.x-a.x)*(c.z-a.z)-(b.z-a.z)*(c.x-a.x);
function segmentDistanceSq(p,a,b){
  const ab={x:b.x-a.x,z:b.z-a.z},den=dot(ab,ab)||1;
  const t=Math.max(0,Math.min(1,dot({x:p.x-a.x,z:p.z-a.z},ab)/den));
  const x=a.x+t*ab.x,z=a.z+t*ab.z;
  return (p.x-x)**2+(p.z-z)**2;
}
function pointInRing(point,ring){
  let inside=false;
  for(let i=0,j=ring.length-2;i<ring.length-1;j=i++){
    const a=ring[i],b=ring[j];
    if((a[1]>point.z)!==(b[1]>point.z)&&
      point.x<(b[0]-a[0])*(point.z-a[1])/(b[1]-a[1])+a[0])inside=!inside;
  }
  return inside;
}
function distanceToBuildings(p){
  let minimum=Infinity;
  for(const b of WRITER_BLOCK_BUILDING_SOURCE.buildings){
    for(const ring of b.ringsLocalXZ){
      if(pointInRing(p,ring))return 0;
      for(let i=0;i<ring.length-1;i++){
        const a={x:ring[i][0],z:ring[i][1]},c={x:ring[i+1][0],z:ring[i+1][1]};
        minimum=Math.min(minimum,Math.sqrt(segmentDistanceSq(p,a,c)));
      }
    }
  }
  return minimum;
}
function roomClear(p,margin=9){return Math.hypot(p.x,p.z)>margin;}
function safe(p,buildingClear=3,roomMargin=9){
  return Number.isFinite(p.x)&&Number.isFinite(p.z)&&
    writerBlockContainsLocalPoint(p.x,p.z)&&roomClear(p,roomMargin)&&
    distanceToBuildings(p)>buildingClear;
}
function separated(p,points,minDist){
  return points.every(q=>Math.hypot(q.x-p.x,q.z-p.z)>=minDist);
}
// Schematic placement, never interpreted as actual curb, planting, or parking inventory.
export function planWriterBlockContext(){
  const frame=buildStreetFramePlan(),rings=frame.rings;
  const site=writerBlockLocalRing().slice(0,-1);
  let doubleArea=0;
  site.forEach((p,i)=>doubleArea+=p.x*site[(i+1)%site.length].z-site[(i+1)%site.length].x*p.z);
  const sign=Math.sign(doubleArea);
  if(sign===0)throw new Error("Writer block polygon collapsed");
  const trees=[],shrubs=[],lamps=[],cars=[];
  for(let i=0;i<site.length;i++){
    const next=(i+1)%site.length,a=site[i],b=site[next];
    const dx=b.x-a.x,dz=b.z-a.z,length=Math.hypot(dx,dz);
    if(length<8)continue;
    const normal={x:-dz/length*sign,z:dx/length*sign};
    for(const t of [.13,.31,.49,.67,.85]){
      const walk=lerp(lerp(rings[2][i],rings[2][next],t),
                      lerp(rings[3][i],rings[3][next],t),.42);
      if(safe(walk,1.0,8)&&separated(walk,lamps,12)&&lamps.length<MAX.lamps)
        lamps.push({...walk,sourceRoadEdge:i});
    }
    for(const t of [.20,.42,.64,.84]){
      const edge=lerp(rings[4][i],rings[4][next],t);
      const planting={x:edge.x+normal.x*1.8,z:edge.z+normal.z*1.8};
      if(safe(planting,3.2,10)&&separated(planting,trees,7)&&trees.length<MAX.trees)
        trees.push({...planting,sourceRoadEdge:i});
    }
    for(const t of [.18,.38,.59,.79]){
      if(length*t<8||length*(1-t)<8)continue;
      const inner=lerp(lerp(rings[0][i],rings[0][next],t),
                       lerp(rings[1][i],rings[1][next],t),.58);
      const heading=Math.atan2(dz,dx);
      const clearance={x:inner.x,z:inner.z};
      if(safe(clearance,2,9)&&separated(inner,cars,14)&&cars.length<MAX.cars)
        cars.push({...inner,heading,sourceRoadEdge:i});
    }
  }
  // Add trees and low shrubs where open space remains, without asserting an
  // observed park, parcel, tree species, or private courtyard layout.
  const xx=site.map(p=>p.x),zz=site.map(p=>p.z);
  const bounds={minX:Math.min(...xx),maxX:Math.max(...xx),
    minZ:Math.min(...zz),maxZ:Math.max(...zz)};
  for(let z=bounds.minZ+10;z<bounds.maxZ-7;z+=11){
    for(let x=bounds.minX+8;x<bounds.maxX-7;x+=12){
      const p={x:x+((Math.round(z*7)%3)-1)*1.1,z:z+((Math.round(x*5)%3)-1)*1.3};
      if(!safe(p,4.2,10))continue;
      if(trees.length<MAX.trees&&separated(p,trees,8.8)){
        trees.push({...p,sourceRoadEdge:null});
      } else if(shrubs.length<MAX.shrubs&&separated(p,trees,3.2)&&separated(p,shrubs,5.2)) {
        shrubs.push({...p,sourceRoadEdge:null});
      }
    }
  }
  // Small low planting rhythm along the inner sidewalk where buildings/room
  // are clear; it never creates a new traffic or pedestrian collider.
  for(let i=0;i<site.length;i++){
    const n=(i+1)%site.length;
    for(const t of [.10,.22,.34,.46,.58,.70,.82,.94]){
      if(shrubs.length>=MAX.shrubs)break;
      const p=lerp(rings[4][i],rings[4][n],t);
      if(safe(p,1.1,9)&&separated(p,trees,2.8)&&separated(p,shrubs,3.4))
        shrubs.push({...p,sourceRoadEdge:i});
    }
  }
  return {trees,shrubs,lamps,cars,bounds,
    evidence:"OSM/Overture boundary only; all object locations are illustrative",
    actualObjectPositionsVerified:false,actualRoadWidthsVerified:false,
    physicalCollider:false,routesUnchanged:true,writerRoomPreserved:true};
}
export function buildWriterBlockContext(THREE,parent,{streetY=-3}={}){
  if(!Number.isFinite(streetY))throw new TypeError("Invalid street datum");
  const plan=planWriterBlockContext();
  const group=new THREE.Group();
  group.name="writer-block-illustrative-streetscape";
  group.userData.cityContextEvidence={
    kind:CONTEXT_SCOPE,version:CONTEXT_VERSION,
    sourceAttribution:"© OpenStreetMap contributors; © Overture Maps Foundation",
    actualObjectLocationsKnown:false,realParkedCarsObserved:false,
    actualParkingAndStreetWidthsKnown:false,actualTreeSpeciesKnown:false,
    physicalCollider:false,interactive:false,
    writerRoomPreserved:true,routesUnchanged:true,
    instances:{trees:plan.trees.length,shrubs:plan.shrubs.length,
      lamps:plan.lamps.length,parkedVehicleProxies:plan.cars.length},
    localPositions:plan
  };
  const marker=new THREE.Object3D();
  const addInstances=(name,geom,mat,points,place)=>{
    if(!points.length){geom.dispose();mat.dispose();return null;}
    const mesh=new THREE.InstancedMesh(geom,mat,points.length);
    mesh.name=name;mesh.castShadow=false;mesh.receiveShadow=true;
    mesh.userData={illustrativeOnly:true,physicalCollider:false};
    points.forEach((p,i)=>{marker.position.set(0,0,0);marker.rotation.set(0,0,0);
      marker.scale.set(1,1,1);place(p,i,marker);marker.updateMatrix();mesh.setMatrixAt(i,marker.matrix);});
    mesh.instanceMatrix.needsUpdate=true;
    mesh.computeBoundingSphere();group.add(mesh);return mesh;
  };
  const bark=new THREE.MeshStandardMaterial({color:0x6e5c4b,roughness:.96});
  const leaf=new THREE.MeshStandardMaterial({color:0x496c55,roughness:.9,flatShading:true});
  const leaf2=new THREE.MeshStandardMaterial({color:0x738063,roughness:.94,flatShading:true});
  addInstances("illustrative-tree-trunks",
    new THREE.CylinderGeometry(.21,.30,2.8,6),bark,plan.trees,(p,i,m)=>{
      m.position.set(p.x,streetY+1.58,p.z);
  });
  addInstances("illustrative-tree-upper-canopies",
    new THREE.IcosahedronGeometry(1,1),leaf,plan.trees,(p,i,m)=>{
      m.position.set(p.x,streetY+4.1,p.z);m.scale.set(1.78,2.1,1.78);
  });
  addInstances("illustrative-tree-lower-canopies",
    new THREE.IcosahedronGeometry(1,0),leaf2,plan.trees,(p,i,m)=>{
      m.position.set(p.x+.24,streetY+3.36,p.z-.18);m.scale.set(1.48,1.25,1.48);
  });
  addInstances("illustrative-low-shrubs",
    new THREE.IcosahedronGeometry(1,0),
    new THREE.MeshStandardMaterial({color:0x61795c,roughness:.95,flatShading:true}),
    plan.shrubs,(p,i,m)=>{
      m.position.set(p.x,streetY+.55,p.z);m.scale.set(1.06,.58,.9);
  });
  const pole=new THREE.MeshStandardMaterial({color:0x505653,roughness:.57,metalness:.4});
  addInstances("illustrative-streetlamp-poles",
    new THREE.CylinderGeometry(.066,.10,4.6,6),pole,plan.lamps,(p,i,m)=>{
      m.position.set(p.x,streetY+2.5,p.z);
  });
  addInstances("illustrative-streetlamp-heads",
    new THREE.BoxGeometry(.82,.20,.55),
    new THREE.MeshStandardMaterial({color:0x525957,roughness:.62,metalness:.33}),
    plan.lamps,(p,i,m)=>{m.position.set(p.x,streetY+4.83,p.z);});
  const bulbs=new THREE.MeshStandardMaterial({
    color:0xffe5b3,emissive:0xffc16a,emissiveIntensity:.55,roughness:.45
  });
  addInstances("illustrative-streetlamp-bulbs",
    new THREE.SphereGeometry(.20,6,4),bulbs,plan.lamps,(p,i,m)=>{
      m.position.set(p.x,streetY+4.67,p.z);
  });
  const body=new THREE.MeshStandardMaterial({color:0x87939a,metalness:.28,roughness:.54});
  const roof=new THREE.MeshStandardMaterial({color:0x394a53,metalness:.20,roughness:.38});
  const wheel=new THREE.MeshStandardMaterial({color:0x252a2e,roughness:.86});
  const positionCar=(p,m,y,dx=0,dz=0)=>{
    const c=Math.cos(p.heading),s=Math.sin(p.heading);
    m.position.set(p.x+dx*c-dz*s,streetY+y,p.z+dx*s+dz*c);
    m.rotation.y=-p.heading;
  };
  const carMats=[];
  for(const p of plan.cars)for(const x of [-1.08,1.08])for(const z of [-.83,.83])
    carMats.push({p,x,z});
  addInstances("illustrative-parked-car-bodies",new THREE.BoxGeometry(3.55,.57,1.60),
    body,plan.cars,(p,i,m)=>positionCar(p,m,.62));
  addInstances("illustrative-parked-car-glass",new THREE.BoxGeometry(1.94,.60,1.25),
    roof,plan.cars,(p,i,m)=>positionCar(p,m,1.16,.25));
  addInstances("illustrative-parked-car-wheels",new THREE.CylinderGeometry(.30,.30,.19,8),
    wheel,carMats,(item,i,m)=>{
      positionCar(item.p,m,.31,item.x,item.z);
      m.rotation.order="YXZ";m.rotation.set(Math.PI/2,-item.p.heading,0);
    });
  addInstances("illustrative-car-lenses",new THREE.BoxGeometry(.12,.18,1.12),
    new THREE.MeshStandardMaterial({color:0xc9a59b,emissive:0x593d29,emissiveIntensity:.5}),
    plan.cars,(p,i,m)=>positionCar(p,m,.61,-1.80));
  const control={
    group,plan,update(daylight){
      const d=Number.isFinite(daylight)?Math.max(0,Math.min(1,daylight)):1;
      bulbs.emissiveIntensity=.30+(1-d)*2.1;
      const lights=group.getObjectByName("illustrative-streetlamp-bulbs");
      if(lights)lights.material.needsUpdate=true;
    }
  };
  parent.add(group);
  return control;
}
