/* MAYOR-039 — SECOND INDEPENDENT OVERTURE ROOFPRINT, NOT AN ASSUMED HOUSE.
 * Map footprint / orientation from exact dated ODbL source; source ML polygon
 * can include more than one actual structure. Height (6 m), wall material and
 * 3 m horizontal guide are SCHEMATIC, not observed number of floors or shops.
 * 3Dviz Pro Max: single low-poly silhouette, joined cap/walls, physically
 * grounded volume preview, rooftop / metric scale evidence separated.
 * No signage, inventible doors/windows, colliders, cars or citizen routes.
 */
import { WRITER_BLOCK_BUILDING_SOURCE } from "./writer-block-building-data.js?v=writer-block-overture-20261109-v1";
import { validateWriterBuildingSurvey, touchesWriterRoom } from "./writer-block-buildings.js?v=writer-block-sourced-buildings-20261109-v1";
import { writerBlockContainsLocalPoint } from "./writer-block-road-preview.js?v=writer-block-osm-preview-20261109-v1";

export const BUILDING_02_ID="3d2290d6-c533-4c11-b2c0-079f0ee2e29e";
export const BUILDING_02_VERSION="tehran-source-building-02-20261109-v1";
export const BUILDING_02_VISUAL_HEIGHT=6; // This is NOT the real-world roof height
export const BUILDING_02_SCALE_GUIDE_HEIGHT=3; // This is NOT a floor count

function ringArea(ring){
  let sum=0;
  for(let i=0;i<ring.length-1;i++)
    sum+=ring[i][0]*ring[i+1][1]-ring[i+1][0]*ring[i][1];
  return Math.abs(sum)/2;
}
export function planWriterBlockBuilding02(source=WRITER_BLOCK_BUILDING_SOURCE){
  validateWriterBuildingSurvey(source);
  const item=source.buildings.find(b=>b.id===BUILDING_02_ID);
  if(!item||item.ringsLocalXZ?.length!==1)
    throw new Error("Second Overture building roofprint is unavailable");
  if(item.heightMetersSource!==null||item.numberFloorsSource!==null)
    throw new Error("New source height/levels need a fresh, evidence-based building plan");
  const ring=item.ringsLocalXZ[0];
  if(ring.length!==16||touchesWriterRoom(ring))
    throw new Error("Source geometry shape changed or writer room at risk");
  for(const [x,z] of ring){
    if(!Number.isFinite(x)||!Number.isFinite(z)||
      !writerBlockContainsLocalPoint(x,z))
      throw new RangeError("Building 02 footprint escaped the approved writer block");
  }
  const measuredPlanArea=ringArea(ring);
  if(Math.abs(measuredPlanArea-item.areaSquareMeters)>0.08)
    throw new Error("Source polygon area has drifted");
  return Object.freeze({
    sourceId:item.id,
    areaSquareMeters:measuredPlanArea,
    measuredHeightMeters:null,
    measuredFloors:null,
    verifiedShopUnits:null,
    shopNames:null,
    sourcedEntranceLocations:null,
    illustratedEnvelopeHeightMeters:BUILDING_02_VISUAL_HEIGHT,
    horizontalScaleGuideMeters:BUILDING_02_SCALE_GUIDE_HEIGHT,
    guideRepresentsRealFloorCount:false,
    licensedFootprint:true,
    sourceLicense:source.license,
    sourceCapture:source.capturedAt,
    sourceProvider:item.sourceAttribution[0]?.dataset||source.source,
    mappingLimit:"possibly multiple joined real buildings; not surveyed",
    physicalCollider:false,
    routesUnchanged:true,
    writerRoomPreserved:true,
    perimeterXZ:ring.map(([x,z])=>Object.freeze({x,z}))
  });
}
export function buildWriterBlockBuilding02(THREE,parent,{streetY=-3}={}){
  if(!Number.isFinite(streetY))throw new TypeError("Invalid street reference level");
  const plan=planWriterBlockBuilding02();
  const ring=plan.perimeterXZ;
  const shape=new THREE.Shape();
  shape.moveTo(ring[0].x,-ring[0].z);
  for(let i=1;i<ring.length-1;i++)shape.lineTo(ring[i].x,-ring[i].z);
  shape.closePath();
  const geometry=new THREE.ExtrudeGeometry(shape,{
    depth:plan.illustratedEnvelopeHeightMeters,
    steps:1,bevelEnabled:false,curveSegments:1,
    material:0,extrudeMaterial:1
  });
  geometry.rotateX(-Math.PI/2);
  geometry.translate(0,streetY,0);
  geometry.computeBoundingBox();
  const mass=new THREE.Mesh(geometry,[
    new THREE.MeshStandardMaterial({
      color:0x92948f,metalness:0,roughness:.95,side:THREE.FrontSide
    }),
    new THREE.MeshStandardMaterial({
      color:0xbbb1a2,metalness:0,roughness:.96,side:THREE.FrontSide
    })
  ]);
  mass.name="writer-block-mapped-building-02-shell";
  mass.castShadow=false;mass.receiveShadow=true;
  mass.userData.cityBuildingEvidence={
    ...plan,
    actualFacadeKnown:false,
    roofKnown:false,
    verifiedStoreys:0,
    visuallyRepresentedAsUnverifiedEnvelope:true,
    actualStreetFrontageKnown:false,
    noFakeShopfronts:true
  };
  // One combined line buffer: real geographic roof boundary at an UNKNOWN
  // illustrative elevation, plus a 3m STORY SCALE line, not an asserted storey.
  // The lines share one material/draw call and align exactly to source vertices.
  const lines=[];
  for(const y of [streetY+BUILDING_02_VISUAL_HEIGHT+.022,
                  streetY+BUILDING_02_SCALE_GUIDE_HEIGHT+.024]){
    for(let i=0;i<ring.length-1;i++){
      const a=ring[i],b=ring[i+1];
      lines.push(a.x,y,a.z,b.x,y,b.z);
    }
  }
  const guidesGeo=new THREE.BufferGeometry();
  guidesGeo.setAttribute("position",new THREE.Float32BufferAttribute(lines,3));
  const guides=new THREE.LineSegments(guidesGeo,new THREE.LineBasicMaterial({
    color:0xd9c9b0,transparent:true,opacity:.73,depthWrite:false
  }));
  guides.name="writer-block-building-02-unknown-floor-guides";
  guides.userData.cityEvidence={
    sourceId:plan.sourceId,
    actuallyMeasuredFloors:null,
    actualShops:null,
    linesAreMetreRulersOnly:true,
    noMeasuredRoofElevation:true,
    physicalCollider:false
  };
  const group=new THREE.Group();
  group.name="writer-block-building-02-georeferenced";
  group.userData.cityBuildingEvidence={
    ...mass.userData.cityBuildingEvidence,
    polygonVertices:ring.length-1,
    massDraws:1,
    scaleGuideDraws:1
  };
  group.add(mass,guides);
  parent.add(group);
  return {group,mass,guides,plan};
}
