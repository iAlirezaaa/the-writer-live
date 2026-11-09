/* MAYOR-059 — visible, reversible, NON-SURVEYED life above licensed Tehran
 * footprint and street centreline anchors. No real height/floor/facade claims.
 * No collision bodies, citizen IDs, new navigation routes or additional town roots.
 * © Overture Maps Foundation / OSM contributors, ODbL-1.0.
 */
import { WRITER_BLOCK_BUILDING_SOURCE } from "./writer-block-building-data.js?v=writer-block-overture-20261109-v1";
import { planIllustrativeFacades } from "./writer-block-facade-preview.js?v=writer-block-facade-illustration-20261109-v1";
import { buildStreetFramePlan } from "./writer-block-street-frame.js?v=writer-block-4-roads-20261109-v1";
import { writerBlockContainsLocalPoint } from "./writer-block-road-preview.js?v=writer-block-osm-preview-20261109-v1";

export const CITY_ACTIVATION_VERSION="tehran-visible-block-20261110-v1";
export const CITY_ACTIVATION_SOURCE="PROXY_DESIGN_NOT_GROUND_TRUTH";
export const PROXY_ROOFLINE_METERS=13.8; // NOT real surveyed height or floors

const lerp=(a,b,t)=>({x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t});
const dist2=(p,q)=>(p.x-q.x)**2+(p.z-q.z)**2;
function insideRing(p,ring){
  let inside=false;
  for(let i=0,j=ring.length-2;i<ring.length-1;j=i++){
    const a=ring[i],b=ring[j];
    if((a[1]>p.z)!==(b[1]>p.z)&&
       p.x<(b[0]-a[0])*(p.z-a[1])/(b[1]-a[1])+a[0])inside=!inside;
  }
  return inside;
}
function distanceToEdge(p,a,b){
  const dx=b[0]-a[0],dz=b[1]-a[1],den=dx*dx+dz*dz||1;
  const t=Math.max(0,Math.min(1,((p.x-a[0])*dx+(p.z-a[1])*dz)/den));
  return Math.hypot(p.x-a[0]-t*dx,p.z-a[1]-t*dz);
}
function safePedestrian(p){
  if(!writerBlockContainsLocalPoint(p.x,p.z)||Math.hypot(p.x,p.z)<11.5)return false;
  for(const b of WRITER_BLOCK_BUILDING_SOURCE.buildings){
    for(const r of b.ringsLocalXZ){
      if(insideRing(p,r))return false;
      for(let i=0;i<r.length-1;i++)
        if(distanceToEdge(p,r[i],r[i+1])<1.15)return false;
    }
  }
  return true;
}
export function planWriterBlockWalkers(){
  const frame=buildStreetFramePlan().rings,people=[];
  const sidewalk=(edge,t)=>{
    const j=(edge+1)%frame[2].length;
    return lerp(lerp(frame[2][edge],frame[2][j],t),
      lerp(frame[3][edge],frame[3][j],t),.51);
  };
  for(let edge=0;edge<5;edge++){
    for(let i=0;i<16;i++){
      const t=.075+(i+.5)*.85/16;
      const a=sidewalk(edge,t-.014),b=sidewalk(edge,t+.014);
      if(![a,b,sidewalk(edge,t)].every(safePedestrian))continue;
      if(people.some(p=>dist2(p.center,sidewalk(edge,t))<2.7**2))continue;
      const center=sidewalk(edge,t);
      people.push({edge,center,a,b,phase:(i*.61803398875+edge*.37)%1,
        palette:(edge*17+i)%6,height:.91+((i+edge)%5)*.065,
        sourceWayId:buildStreetFramePlan().labels.find(l=>l.edge===edge)?.wayId??null});
    }
  }
  if(people.length<12||people.length>80)
    throw new Error("No safe, bounded OSM sidewalk positions for proxy walkers");
  return people;
}
export function activateWriterBlockCity(THREE,{buildings,context,streetY=-3}={}){
  if(!Array.isArray(buildings)||buildings.length!==3||!context?.group?.add||
     !Number.isFinite(streetY))throw new TypeError("Source-only city activation requires three sourced envelopes and context");
  const sourceFacadePlans=planIllustrativeFacades(),visualBuildings=[];
  const colors=[0xb8a79a,0xc2beb1,0xabb8b4];
  const glassColors=[0x556a72,0x445d66,0x4b6870];
  const frameGeo=new THREE.BoxGeometry(1.42,1.83,.065);
  const glassGeo=new THREE.BoxGeometry(1.12,1.53,.09);
  const sillGeo=new THREE.BoxGeometry(1.55,.12,.23);
  const helper=new THREE.Object3D();
  for(let b=0;b<buildings.length;b++){
    const builder=buildings[b];
    const data=WRITER_BLOCK_BUILDING_SOURCE.buildings.find(r=>r.id===builder?.plan?.sourceId);
    const facade=sourceFacadePlans.find(p=>p.sourceId===data?.id);
    if(!data||!facade||data.heightMetersSource!==null||
       data.numberFloorsSource!==null||!builder?.group?.add)
      throw new Error("Mapped geometry or unknown building heights changed; stop activation");
    const sourceRing=data.ringsLocalXZ[0];
    if(sourceRing.some(([x,z])=>Math.hypot(x,z)<8))
      throw new Error("Cannot add silhouette near the protected writer room");
    const shape=new THREE.Shape();
    shape.moveTo(sourceRing[0][0],-sourceRing[0][1]);
    for(let j=1;j<sourceRing.length-1;j++)shape.lineTo(sourceRing[j][0],-sourceRing[j][1]);
    shape.closePath();
    const geometry=new THREE.ExtrudeGeometry(shape,{
      depth:PROXY_ROOFLINE_METERS-6,steps:1,bevelEnabled:false,curveSegments:1
    });
    geometry.rotateX(-Math.PI/2);
    geometry.translate(0,streetY+6,0);
    geometry.computeBoundingBox();
    const cap=new THREE.Mesh(geometry,[
      new THREE.MeshStandardMaterial({color:0x687079,roughness:.94}),
      new THREE.MeshStandardMaterial({color:colors[b],roughness:.92})
    ]);
    cap.name="writer-block-proxy-upper-envelope-"+(b+1);
    cap.castShadow=false;cap.receiveShadow=true;
    cap.userData.cityVisualEvidence={sourceId:data.id,kind:CITY_ACTIVATION_SOURCE,
      actualHeightKnown:false,actualFloorCountKnown:false,actualFacadeKnown:false,
      sourceLicense:WRITER_BLOCK_BUILDING_SOURCE.license,
      sourceCapture:WRITER_BLOCK_BUILDING_SOURCE.capturedAt,physicalCollider:false};
    builder.group.add(cap);
    const panels=facade.panels;
    const n=panels.length*2;
    const frame=new THREE.InstancedMesh(frameGeo,
      new THREE.MeshStandardMaterial({color:0xe4dbcc,roughness:.89}),n);
    const glass=new THREE.InstancedMesh(glassGeo,new THREE.MeshStandardMaterial({
      color:glassColors[b],roughness:.35,metalness:.1,emissive:0xc8aa75,emissiveIntensity:.06
    }),n);
    const sills=new THREE.InstancedMesh(sillGeo,
      new THREE.MeshStandardMaterial({color:0x79776f,roughness:.91}),n);
    for(let j=0;j<n;j++){
      const p=panels[j%panels.length],level=Math.floor(j/panels.length),height=8.05+level*3.05;
      for(const [mesh,yoff,front] of [[frame,0,.04],[glass,.01,.11],[sills,-.94,.13]]){
        helper.position.set(p.x+p.normal.x*front,streetY+height+yoff,p.z+p.normal.z*front);
        helper.rotation.set(0,p.yaw,0);helper.scale.set(1,1,1);
        helper.updateMatrix();mesh.setMatrixAt(j,helper.matrix);
      }
    }
    for(const [mesh,name] of [[frame,"surrounds"],[glass,"glazing"],[sills,"sills"]]){
      mesh.name="writer-block-proxy-upper-"+name+"-"+(b+1);
      mesh.userData.cityVisualEvidence={sourceId:data.id,kind:CITY_ACTIVATION_SOURCE,
        physicalCollider:false,illustrativeOnly:true};
      mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();
      mesh.castShadow=false;mesh.receiveShadow=true;builder.group.add(mesh);
    }
    visualBuildings.push({cap,frame,glass,sills,sourceId:data.id});
  }
  const people=planWriterBlockWalkers();
  const colorsCoat=[0x445b65,0x9e7865,0x596d5a,0x7c656d,0x8f8b77,0x536f81];
  const skin=[0xc29376,0x9c755f,0xe4b995,0xb58a70];
  const shirt=new THREE.InstancedMesh(new THREE.CylinderGeometry(.24,.29,.82,7),
    new THREE.MeshStandardMaterial({color:0xffffff,roughness:.91,flatShading:true}),people.length);
  const head=new THREE.InstancedMesh(new THREE.SphereGeometry(.20,8,6),
    new THREE.MeshStandardMaterial({color:0xffffff,roughness:.98}),people.length);
  const legs=new THREE.InstancedMesh(new THREE.BoxGeometry(.115,.64,.135),
    new THREE.MeshStandardMaterial({color:0x343b42,roughness:.94}),people.length*2);
  const arms=new THREE.InstancedMesh(new THREE.BoxGeometry(.11,.61,.13),
    new THREE.MeshStandardMaterial({color:0xffffff,roughness:.91}),people.length*2);
  for(let i=0;i<people.length;i++){
    shirt.setColorAt(i,new THREE.Color(colorsCoat[people[i].palette]));
    head.setColorAt(i,new THREE.Color(skin[i%skin.length]));
    for(let side=0;side<2;side++){
      arms.setColorAt(i*2+side,new THREE.Color(colorsCoat[people[i].palette]));
      legs.setColorAt(i*2+side,new THREE.Color(i%3===0?0x49494f:0x313f43));
    }
  }
  const parts=[[shirt,"torsos"],[head,"heads"],[legs,"legs"],[arms,"arms"]];
  for(const [mesh,name] of parts){
    mesh.name="writer-block-animated-proxy-"+name;
    mesh.castShadow=false;mesh.receiveShadow=false;mesh.frustumCulled=false;
    mesh.userData.physicalCollider=false;
    mesh.userData.illustrativeOnly=true;
    mesh.userData.cityLifeEvidence={kind:CITY_ACTIVATION_SOURCE,
      anonymized:true,realCitizens:false,routeChanges:false,
      positionsSurveyed:false,physicalCollider:false,source:"OSM sidewalk visual proxy",
      sourceLicense:"ODbL-1.0",instances:mesh.count};
    context.group.add(mesh);
  }
  const update=(day=1,elapsed=0)=>{
    const t=Number.isFinite(elapsed)?elapsed:0;
    const pulse=.5+.5*Math.sin(t*.55);
    for(const b of visualBuildings)b.glass.material.emissiveIntensity=.04+(1-Math.max(0,Math.min(1,day)))*.36;
    for(let i=0;i<people.length;i++){
      const p=people[i],progress=.5+.5*Math.sin(t*.53+i*1.11+p.phase);
      const pos=lerp(p.a,p.b,progress),fwd={x:p.b.x-p.a.x,z:p.b.z-p.a.z};
      const reverse=Math.cos(t*.53+i*1.11+p.phase)<0?-1:1;
      const yaw=-Math.atan2(fwd.z,fwd.x)+(reverse<0?Math.PI:0);
      const bounce=Math.abs(Math.sin(t*4.7+i))*.025;
      const stride=Math.sin(t*4.7+i)*.14;
      const set=(mesh,index,dx,h,dz,rx=0)=>{
        helper.position.set(pos.x+Math.cos(yaw)*dx-Math.sin(yaw)*dz,
          streetY+.19+h*p.height+bounce,
          pos.z+Math.sin(yaw)*dx+Math.cos(yaw)*dz);
        helper.rotation.set(rx,yaw,0);helper.scale.set(p.height,p.height,p.height);
        helper.updateMatrix();mesh.setMatrixAt(index,helper.matrix);
      };
      set(shirt,i,0,1.02,0);
      set(head,i,0,1.71,0);
      for(const side of [-1,1]){
        const index=i*2+(side===-1?0:1),swing=side*stride;
        set(legs,index,-.13+ swing*.38,.44,side*.125,swing*.5);
        set(arms,index,.02-swing*.22,1.03,side*.34,-swing*.45);
      }
    }
    for(const [mesh] of parts)mesh.instanceMatrix.needsUpdate=true;
    return {crowd:people.length,day,pulse};
  };
  update(1,0);
  return {people,parts:parts.map(([mesh])=>mesh),visualBuildings,update,
    evidence:{kind:CITY_ACTIVATION_SOURCE,visualEnvelopeCount:3,sourceHeightKnownCount:0,
      walkingProxyCount:people.length,physicalColliders:0,citizenRoutesChanged:false,
      writerRoomPreserved:true,sourceIds:visualBuildings.map(b=>b.sourceId)}};
}
