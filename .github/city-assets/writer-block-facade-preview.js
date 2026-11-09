/* MAYOR-044 — architecturally readable, unverified facade preview for 3 sourced masses.
 * This is an artistic LOD, NOT surveyed facade, windows, apartments, shopfronts
 * or storey information. Overture ring, render height and buildings stay intact.
 */
import { WRITER_BLOCK_BUILDING_SOURCE } from "./writer-block-building-data.js?v=writer-block-overture-20261109-v1";
import { writerBlockContainsLocalPoint } from "./writer-block-road-preview.js?v=writer-block-osm-preview-20261109-v1";
export const FACADE_PREVIEW_VERSION="writer-block-facade-illustration-20261109-v1";
const TYPES=Object.freeze([
  Object.freeze({id:"3d7b8239-b1e0-48bc-8868-ae4a4d392586",style:"warm-masonry-illustration",
    frame:0xa28b77,glass:0x526b71,ledge:0x766759,spacing:3.3}),
  Object.freeze({id:"3d2290d6-c533-4c11-b2c0-079f0ee2e29e",style:"pale-concrete-illustration",
    frame:0xd5c5ab,glass:0x465e63,ledge:0x888b86,spacing:3.0}),
  Object.freeze({id:"76931a07-c621-4e37-9241-c41ee59d4248",style:"modern-module-illustration",
    frame:0x7f908d,glass:0x304e57,ledge:0x646b69,spacing:3.5})
]);
function signedArea(ring){
  let sum=0;for(let i=0;i<ring.length-1;i++)
    sum+=ring[i][0]*ring[i+1][1]-ring[i+1][0]*ring[i][1];
  return sum/2;
}
function distanceToWriter(p){return Math.hypot(p.x,p.z);}
export function planIllustrativeFacades(){
  const output=[];
  for(const style of TYPES){
    const record=WRITER_BLOCK_BUILDING_SOURCE.buildings.find(b=>b.id===style.id);
    if(!record||record.ringsLocalXZ?.length!==1||
      record.heightMetersSource!==null||record.numberFloorsSource!==null)
      throw new Error("Sourced facade plan requires re-verification");
    const ring=record.ringsLocalXZ[0],orientation=Math.sign(signedArea(ring));
    if(!orientation)throw new Error("Collapsed source facade ring");
    const panels=[];
    for(let i=0;i<ring.length-1;i++){
      const a=ring[i],b=ring[i+1],dx=b[0]-a[0],dz=b[1]-a[1];
      const length=Math.hypot(dx,dz),n=Math.floor((length-.5)/style.spacing);
      if(n<1)continue;
      // XZ signed area determines which side points outside the mapped polygon.
      const outward={x:dz/length*orientation,z:-dx/length*orientation};
      const yaw=-Math.atan2(dz,dx)+(orientation>0?Math.PI:0);
      for(let k=0;k<n;k++){
        const t=(k+.5)/n,x=a[0]+dx*t+outward.x*.12,
          z=a[1]+dz*t+outward.z*.12;
        if(!writerBlockContainsLocalPoint(x,z)||distanceToWriter({x,z})<8)continue;
        panels.push({x,z,yaw,normal:outward,edgeIndex:i});
      }
    }
    output.push({
      ...style,panels,sourceId:record.id,sourceCapture:WRITER_BLOCK_BUILDING_SOURCE.capturedAt,
      license:WRITER_BLOCK_BUILDING_SOURCE.license,realWindowsKnown:false,
      realFloorsKnown:false,realMaterialsKnown:false,unitCount:null,
      realEntranceKnown:false,shopLocationKnown:false,physicalCollider:false
    });
  }
  return output;
}
export function attachIllustrativeFacades(THREE,buildings,{streetY=-3}={}){
  if(!Array.isArray(buildings)||buildings.length!==3||!Number.isFinite(streetY))
    throw new TypeError("Expected exactly three source-supported envelopes");
  const plans=planIllustrativeFacades(),results=[];
  const frameGeo=new THREE.BoxGeometry(1.60,2.04,.095);
  const paneGeo=new THREE.BoxGeometry(1.22,1.65,.10);
  const sillGeo=new THREE.BoxGeometry(1.66,.11,.27);
  for(let i=0;i<buildings.length;i++){
    const building=buildings[i],plan=plans.find(x=>x.sourceId===building?.plan?.sourceId);
    if(!plan||!building?.group?.add||!building?.mass?.isMesh)
      throw new Error("No matching Overture source builder; do not infer facade location");
    const n=plan.panels.length;if(n<4||n>200)throw new Error("Facade preview density outside LOD budget");
    const facade=new THREE.Group();
    facade.name="writer-block-building-illustrative-facade-"+(i+1);
    facade.userData.cityFacadeEvidence={
      sourceId:plan.sourceId,style:plan.style,sourceLicense:plan.license,
      sourceCapture:plan.sourceCapture,illustrativeOnly:true,
      realWindowsKnown:false,realFloorsKnown:false,realMaterialsKnown:false,
      actualShopUseKnown:false,verifiedUnitCount:null,physicalCollider:false,
      sourceRingUnchanged:true,writerRoomPreserved:true,
      instanceCount:n,drawCalls:3
    };
    const frame=new THREE.InstancedMesh(frameGeo,
      new THREE.MeshStandardMaterial({color:plan.frame,roughness:.83,metalness:.03}),n);
    const glassMaterial=new THREE.MeshStandardMaterial({
      color:plan.glass,roughness:.41,metalness:.17,emissive:0xb5a078,
      emissiveIntensity:.08
    });
    const panes=new THREE.InstancedMesh(paneGeo,glassMaterial,n);
    const sills=new THREE.InstancedMesh(sillGeo,
      new THREE.MeshStandardMaterial({color:plan.ledge,roughness:.85}),n);
    frame.name="illustrative-window-surrounds";
    panes.name="illustrative-glazing";sills.name="illustrative-ledge";
    const dummy=new THREE.Object3D();
    for(let j=0;j<n;j++){
      const p=plan.panels[j];
      const set=(mesh,lift,offset)=>{
        dummy.position.set(p.x+p.normal.x*offset,streetY+lift,
          p.z+p.normal.z*offset);
        dummy.rotation.set(0,p.yaw,0);
        dummy.scale.set(1,1,1);
        dummy.updateMatrix();mesh.setMatrixAt(j,dummy.matrix);
      };
      set(frame,3.24,0);
      set(panes,3.25,.082);
      set(sills,2.18,.095);
    }
    for(const mesh of [frame,panes,sills]){
      mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();
      mesh.userData.cityFacadeEvidence={sourceId:plan.sourceId,
        illustrativeOnly:true,physicalCollider:false};
      mesh.castShadow=false;mesh.receiveShadow=true;facade.add(mesh);
    }
    building.group.add(facade);
    results.push({group:facade,glassMaterial,plan});
  }
  return {
    facades:results,
    update(daylight=1){
      const day=Number.isFinite(daylight)?Math.max(0,Math.min(1,daylight)):1;
      for(const item of results)item.glassMaterial.emissiveIntensity=.045+(1-day)*.46;
    }
  };
}
