/* MAYOR-037: FIRST INDIVIDUAL GEOLOCATED TEHRAN MAP BUILDING.
 *
 * This model reproduces ONE licensed Overture/Microsoft-ML aerial polygon
 * without splitting a potentially compound roofprint into invented parcels.
 * Roof outline is geographic evidence (T1); 6m height/material/flat roof
 * appearance are clearly symbolic, NOT observations. No windows/entrances
 * are invented, no traffic/collider or writer-room assets are touched.
 * Uses the existing Three.js instance; no shaders/network or extra renderer.
 */
import { WRITER_BLOCK_BUILDING_SOURCE } from "./writer-block-building-data.js?v=writer-block-overture-20261109-v1";
import {
  validateWriterBuildingSurvey, touchesWriterRoom
} from "./writer-block-buildings.js?v=writer-block-sourced-buildings-20261109-v1";
import { writerBlockContainsLocalPoint } from "./writer-block-road-preview.js?v=writer-block-osm-preview-20261109-v1";

export const BUILDING_01_SOURCE_ID="3d7b8239-b1e0-48bc-8868-ae4a4d392586";
export const BUILDING_01_VERSION="tehran-building-by-building-01-20261109-v1";
export const BUILDING_01_VISUAL_HEIGHT_METERS=6; // no sourced height exists

function polygonAreaXZ(ring){
  let sum=0;
  for(let i=0;i<ring.length-1;i++)
    sum+=ring[i][0]*ring[i+1][1]-ring[i+1][0]*ring[i][1];
  return Math.abs(sum)/2;
}
export function planWriterBlockBuilding01(source=WRITER_BLOCK_BUILDING_SOURCE){
  validateWriterBuildingSurvey(source);
  const item=source.buildings.find(b=>b.id===BUILDING_01_SOURCE_ID);
  if(!item||item.ringsLocalXZ.length!==1)
    throw new Error("Missing individual, verifiable Overture roofprint");
  const ring=item.ringsLocalXZ[0];
  if(touchesWriterRoom(ring))throw new Error("Building 01 overlaps the protected writer room");
  if(item.heightMetersSource!==null||item.numberFloorsSource!==null)
    throw new Error("Source 3D claims changed: stop and recheck actual measured elevations");
  if(ring.some(([x,z])=>!writerBlockContainsLocalPoint(x,z)))
    throw new Error("Building 01 roofprint has left the single writer block");
  const area=polygonAreaXZ(ring);
  if(Math.abs(area-item.areaSquareMeters)>0.1)
    throw new Error("Roofprint area differs from evidence: no artistic rescaling");
  return Object.freeze({
    sourceId:item.id,
    polygon:ring.map(([x,z])=>Object.freeze({x,z})),
    footprintAreaSqm:area,
    sourceFootprintAreaSqm:item.areaSquareMeters,
    sourceLicense:source.license,
    sourceCaptureTime:source.capturedAt,
    sourceProvider:item.sourceAttribution[0]?.dataset||source.source,
    quality:"T1-PLAN-EVIDENCED; T2/T3-UNKNOWN",
    measuredHeightMeters:null,
    visualHeightMeters:BUILDING_01_VISUAL_HEIGHT_METERS,
    roofTypeProven:false,facadeTypeProven:false,
    roomPreserved:true,physicalCollider:false,sourceMayMergeRealBuildings:true
  });
}

export function buildWriterBlockBuilding01(THREE,parent,{streetY=-3}={}){
  if(!Number.isFinite(streetY))throw new TypeError("Street datum not finite");
  const plan=planWriterBlockBuilding01();
  const ring=plan.polygon;
  const shape=new THREE.Shape();
  shape.moveTo(ring[0].x,-ring[0].z);
  for(let i=1;i<ring.length-1;i++)shape.lineTo(ring[i].x,-ring[i].z);
  shape.closePath();
  const geometry=new THREE.ExtrudeGeometry(shape,{
    depth:plan.visualHeightMeters,
    steps:1,bevelEnabled:false,curveSegments:1,
    material:0,extrudeMaterial:1
  });
  geometry.rotateX(-Math.PI/2);
  geometry.translate(0,streetY,0);
  geometry.computeBoundingBox();
  const wall=new THREE.MeshStandardMaterial({
    color:0xb9aca0,roughness:.96,metalness:0,side:THREE.FrontSide
  });
  const roof=new THREE.MeshStandardMaterial({
    color:0x8c8176,roughness:.96,metalness:0,side:THREE.FrontSide
  });
  // ExtrudeGeometry group 0 is cap, group 1 is wall.
  const mass=new THREE.Mesh(geometry,[roof,wall]);
  mass.name="writer-block-actual-footprint-building-01";
  mass.castShadow=false;mass.receiveShadow=true;
  mass.renderOrder=12;
  mass.userData.cityBuildingEvidence={
    ...plan,
    buildingOrdinal:1,
    actualFootprintFromMap:true,
    actualBuildingHeightKnown:false,
    actualRoofTypeKnown:false,
    geometryRepresentation:"individual-opaque-source-polygon-with-illustrative-height",
    noWindowsOrEntrancesInferred:true,
    noNavigationOrCollisionChanges:true,
    sourceFeaturePreserved:true
  };
  const roofVertices=[],top=streetY+plan.visualHeightMeters+.02;
  for(let i=0;i<ring.length-1;i++){
    const a=ring[i],b=ring[i+1];
    roofVertices.push(a.x,top,a.z,b.x,top,b.z);
  }
  const roofGeo=new THREE.BufferGeometry();
  roofGeo.setAttribute("position",new THREE.Float32BufferAttribute(roofVertices,3));
  const roofOutline=new THREE.LineSegments(roofGeo,new THREE.LineBasicMaterial({
    color:0xd7c0a5,transparent:true,opacity:.88,depthWrite:false
  }));
  roofOutline.name="writer-block-building-01-map-roof-outline";
  roofOutline.userData.cityBuildingEvidence={sourceId:plan.sourceId,
    aerialPolygonOnly:true,actualRoofElevationKnown:false,physicalCollider:false};
  const group=new THREE.Group();
  group.name="writer-block-building-01-georeferenced";
  group.userData.cityBuildingEvidence={...mass.userData.cityBuildingEvidence,
    sourceVertices:ring.length-1,
    renderMeshCount:1,renderOutlineCount:1,
    planCompareAreaSquareMeters:plan.footprintAreaSqm};
  group.add(mass,roofOutline);
  parent.add(group);
  return {group,mass,roofOutline,plan};
}
