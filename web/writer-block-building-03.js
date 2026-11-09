/* MAYOR-041 — third independently rendered Overture footprint, not a surveyed facade.
 * 3Dviz Pro Max: preserve silhouette, shared materials, joined walls/roof,
 * ground contact and two low-cost inspection line loops; no invented storeys.
 */
import { WRITER_BLOCK_BUILDING_SOURCE } from "./writer-block-building-data.js?v=writer-block-overture-20261109-v1";
import { validateWriterBuildingSurvey, touchesWriterRoom } from "./writer-block-buildings.js?v=writer-block-sourced-buildings-20261109-v1";
import { writerBlockContainsLocalPoint } from "./writer-block-road-preview.js?v=writer-block-osm-preview-20261109-v1";

export const BUILDING_03_ID="76931a07-c621-4e37-9241-c41ee59d4248";
export const BUILDING_03_VERSION="tehran-source-building-03-20261109-v1";
export const BUILDING_03_PROXY_HEIGHT=6;
function area(ring) {
  let sum=0;
  for(let i=0;i<ring.length-1;i++)
    sum+=ring[i][0]*ring[i+1][1]-ring[i+1][0]*ring[i][1];
  return Math.abs(sum)/2;
}
export function planWriterBlockBuilding03(source=WRITER_BLOCK_BUILDING_SOURCE){
  validateWriterBuildingSurvey(source);
  const b=source.buildings.find(item=>item.id===BUILDING_03_ID);
  if(!b||b.ringsLocalXZ?.length!==1||b.heightMetersSource!==null||
    b.numberFloorsSource!==null)
    throw new Error("Building 03 requires new evidence review");
  const ring=b.ringsLocalXZ[0];
  if(ring.length!==32||touchesWriterRoom(ring))
    throw new Error("Building 03 footprint changed or intersects protected room");
  for(const [x,z] of ring)if(!writerBlockContainsLocalPoint(x,z))
    throw new RangeError("Building 03 outside sourced writer block");
  const measuredArea=area(ring);
  if(Math.abs(measuredArea-b.areaSquareMeters)>.08)
    throw new Error("Building 03 source area drift");
  return Object.freeze({
    sourceId:b.id,areaSquareMeters:measuredArea,sourceLicense:source.license,
    sourceCapture:source.capturedAt,sourceProvider:b.sourceAttribution[0]?.dataset||source.source,
    measuredHeightMeters:null,measuredFloors:null,verifiedUnits:null,
    verifiedShopUnits:null,entrances:null,actualFacadeKnown:false,
    actualRoofKnown:false,actualStreetFrontageKnown:false,
    illustrativeEnvelopeHeightMeters:BUILDING_03_PROXY_HEIGHT,
    scaleGuideMeters:3,scaleGuideIsRealFloor:false,
    mappingLimit:"source polygon may represent multiple joined buildings",
    physicalCollider:false,writerRoomPreserved:true,routesUnchanged:true,
    perimeterXZ:ring.map(([x,z])=>Object.freeze({x,z}))
  });
}
export function buildWriterBlockBuilding03(THREE,parent,{streetY=-3}={}){
  if(!Number.isFinite(streetY))throw new TypeError("Invalid street datum");
  const plan=planWriterBlockBuilding03(),ring=plan.perimeterXZ;
  const shape=new THREE.Shape();
  shape.moveTo(ring[0].x,-ring[0].z);
  for(let i=1;i<ring.length-1;i++)shape.lineTo(ring[i].x,-ring[i].z);
  shape.closePath();
  const geo=new THREE.ExtrudeGeometry(shape,{
    depth:plan.illustrativeEnvelopeHeightMeters,steps:1,
    bevelEnabled:false,curveSegments:1,material:0,extrudeMaterial:1
  });
  geo.rotateX(-Math.PI/2);geo.translate(0,streetY,0);geo.computeBoundingBox();
  const mass=new THREE.Mesh(geo,[
    new THREE.MeshStandardMaterial({color:0x999b98,roughness:.96,metalness:0}),
    new THREE.MeshStandardMaterial({color:0xb5a99a,roughness:.97,metalness:0})
  ]);
  mass.name="writer-block-mapped-building-03-shell";
  mass.castShadow=false;mass.receiveShadow=true;
  mass.userData.cityBuildingEvidence={...plan,verifiedStoreys:0,noFakeShopfronts:true};
  const lines=[];
  for(const y of [streetY+BUILDING_03_PROXY_HEIGHT+.025,streetY+3+.027])
    for(let i=0;i<ring.length-1;i++){
      const a=ring[i],b=ring[i+1];lines.push(a.x,y,a.z,b.x,y,b.z);
    }
  const lineGeo=new THREE.BufferGeometry();
  lineGeo.setAttribute("position",new THREE.Float32BufferAttribute(lines,3));
  const guides=new THREE.LineSegments(lineGeo,new THREE.LineBasicMaterial({
    color:0xe0d1b5,transparent:true,opacity:.8,depthWrite:false
  }));
  guides.name="writer-block-building-03-illustrative-scale-guides";
  guides.userData.cityEvidence={sourceId:plan.sourceId,realFloors:null,
    realUnits:null,realShops:null,linesAreMetreRulersOnly:true,physicalCollider:false};
  const group=new THREE.Group();
  group.name="writer-block-building-03-georeferenced";
  group.userData.cityBuildingEvidence={...plan,polygonVertices:ring.length-1,
    massDraws:1,scaleGuideDraws:1};
  group.add(mass,guides);parent.add(group);
  return {group,mass,guides,plan};
}
