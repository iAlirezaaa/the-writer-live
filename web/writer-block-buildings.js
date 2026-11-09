/* MAYOR-034: Geo-referenced source building roofprint masses for ONE Tehran block.
 * Real 2D source: Overture Maps ODbL, captured 2026-11-09.
 * Heights, facades, roofs and entrances are NOT measured. All vertical shells
 * are schematic transparent inspection volumes and NEVER colliders.
 * The footprint touching the writer's room remains ground-outline-only.
 * Reuses the owning town's THREE, no second renderer or author state mutation.
 */
import { WRITER_BLOCK_BUILDING_SOURCE } from "./writer-block-building-data.js?v=writer-block-overture-20261109-v1";
import { writerBlockContainsLocalPoint } from "./writer-block-road-preview.js?v=writer-block-osm-preview-20261109-v1";

export const OVERTURE_WRITER_BUILDING_VERSION = "writer-block-sourced-buildings-20261109-v1";
export const PROXY_UNVERIFIED_HEIGHT_METERS = 6;
export const ROOM_PROTECTION_METERS = 4; // render-only exclusion; writer room unchanged

function isFiniteRing(ring){
  return Array.isArray(ring)&&ring.length>=4&&ring.length<=512&&
   ring.every(p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite))&&
   Math.abs(ring[0][0]-ring[ring.length-1][0])<.005&&
   Math.abs(ring[0][1]-ring[ring.length-1][1])<.005;
}
function contains(ring,x,z){
  let hit=false;
  for(let i=0,j=ring.length-2;i<ring.length-1;j=i++){
    const a=ring[i],b=ring[j];
    if((a[1]>z)!==(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])hit=!hit;
  }
  return hit;
}
function cross(a,b,c) {
  return (b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
}
function segmentsCross(a,b,c,d){
  const aa=cross(a,b,c),bb=cross(a,b,d),cc=cross(c,d,a),dd=cross(c,d,b);
  return aa*bb<0&&cc*dd<0;
}
export function touchesWriterRoom(ring,radius=ROOM_PROTECTION_METERS){
  const sq=[[-radius,-radius],[radius,-radius],[radius,radius],[-radius,radius]];
  if(sq.some(([x,z])=>contains(ring,x,z)))return true;
  if(ring.some(([x,z])=>Math.abs(x)<=radius&&Math.abs(z)<=radius))return true;
  for(let i=0;i<ring.length-1;i++)for(let j=0;j<4;j++)
    if(segmentsCross(ring[i],ring[i+1],sq[j],sq[(j+1)%4]))return true;
  return false;
}
export function validateWriterBuildingSurvey(data=WRITER_BLOCK_BUILDING_SOURCE){
  if(data?.kind!=="OVERTURE_REAL_BUILDING_ROOFPRINT_CANDIDATES"||
    data?.license!=="ODbL-1.0"||
    data?.blockBoundary?.status!=="OSM_CENTERLINE_CANDIDATE"||
    data?.homeAnchor?.lat!==35.715361987616696||
    data?.homeAnchor?.lon!==51.3642455031707||
    data?.counts?.inBlock!==data?.buildings?.length||
    data?.buildings?.length>800||
    !Number.isFinite(Date.parse(data?.capturedAt)))throw new TypeError("Invalid Overture writer-block survey");
  const seen=new Set();
  for(const b of data.buildings){
    if(typeof b.id!=="string"||!b.id||seen.has(b.id)||!Array.isArray(b.ringsLocalXZ))
      throw new TypeError("Missing or duplicate building source feature ID");
    seen.add(b.id);
    if(b.heightMetersSource!==null&&
      (!Number.isFinite(b.heightMetersSource)||b.heightMetersSource<1.5||b.heightMetersSource>180))
      throw new TypeError("Invalid source building height");
    for(const ring of b.ringsLocalXZ){
      if(!isFiniteRing(ring))throw new TypeError("Invalid building ring geometry");
      for(const [x,z] of ring)if(!writerBlockContainsLocalPoint(x,z))
        throw new RangeError("Building roofprint outside source block");
    }
  }
  return true;
}
export function writerBlockBuildingPlan(data=WRITER_BLOCK_BUILDING_SOURCE){
  validateWriterBuildingSurvey(data);
  return data.buildings.map(b=>{
    const protectedRoom=b.ringsLocalXZ.some(r=>touchesWriterRoom(r));
    return {
      id:b.id,
      footprintRings:b.ringsLocalXZ,
      sourceHeightMeters:b.heightMetersSource,
      proxyHeightMeters:b.heightMetersSource??PROXY_UNVERIFIED_HEIGHT_METERS,
      heightEvidence:b.heightMetersSource===null?"UNKNOWN—SYMBOLIC-VOLUME":"SOURCE_TAGGED_UNVERIFIED",
      protectedWriterRoom:protectedRoom,
      symbolicOnly:b.heightMetersSource===null,
      surfaceAreaMeters2:b.areaSquareMeters
    };
  });
}
export function buildWriterBlockBuildingMasses(THREE,parent,{streetY=-3}={}){
  if(!Number.isFinite(streetY))throw new TypeError("Invalid ground datum");
  const plan=writerBlockBuildingPlan();
  const masses=[],outlines=[],modeledIds=[],roomProtectedIds=[];
  for(const building of plan){
    if(building.protectedWriterRoom)roomProtectedIds.push(building.id);
    for(const ring of building.footprintRings){
      for(let i=0;i<ring.length-1;i++){
        outlines.push(ring[i][0],streetY+.26,ring[i][1],
          ring[i+1][0],streetY+.26,ring[i+1][1]);
      }
      if(building.protectedWriterRoom)continue; // do not cover or replace the room
      const shape=new THREE.Shape();
      shape.moveTo(ring[0][0],-ring[0][1]);
      for(let i=1;i<ring.length-1;i++)shape.lineTo(ring[i][0],-ring[i][1]);
      shape.closePath();
      let geometry=new THREE.ExtrudeGeometry(shape,{
        depth:building.proxyHeightMeters,steps:1,
        bevelEnabled:false,curveSegments:1
      });
      geometry.rotateX(-Math.PI/2);
      geometry.translate(0,streetY,0);
      if(geometry.index){
        const converted=geometry.toNonIndexed();geometry.dispose();geometry=converted;
      }
      const attr=geometry.getAttribute("position");
      for(let i=0;i<attr.count;i++){
        const x=attr.getX(i),y=attr.getY(i),z=attr.getZ(i);
        if(!Number.isFinite(x)||!Number.isFinite(y)||!Number.isFinite(z))
          throw new Error("Invalid building source mesh vertex");
        masses.push(x,y,z);
      }
      geometry.dispose();
    }
    if(!building.protectedWriterRoom)modeledIds.push(building.id);
  }
  const group=new THREE.Group();
  group.name="writer-block-overture-building-reconstruction";
  group.userData.citySurvey={
    source:"Overture Maps Foundation",license:WRITER_BLOCK_BUILDING_SOURCE.license,
    capturedAt:WRITER_BLOCK_BUILDING_SOURCE.capturedAt,
    release:WRITER_BLOCK_BUILDING_SOURCE.release,
    originalRoofprints:plan.length,
    generatedVolumeCount:modeledIds.length,
    ignoredRoomCollisionCount:roomProtectedIds.length,
    sourceHeightKnownCount:WRITER_BLOCK_BUILDING_SOURCE.counts.knownSourceHeight,
    renderedHeightUnverified:plan.some(p=>p.symbolicOnly),
    protectedWriterRoom:true,physicalCollider:false,
    facadeAuthenticity:"not documented",
    geographicFootprintsReal:true,buildingsCurrentNotCadastral:true,
    scope:"writer-block-only",origin:{lat:35.715361987616696,lon:51.3642455031707}
  };
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute("position",new THREE.Float32BufferAttribute(masses,3));
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  const volume=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({
    color:0xc3a791,transparent:true,opacity:.53,depthWrite:false,
    side:THREE.DoubleSide,metalness:.02,roughness:.88
  }));
  volume.name="writer-block-real-roofprints-unverified-height";
  volume.renderOrder=11;volume.castShadow=false;volume.receiveShadow=false;
  volume.userData.isCitySurveyOnly=true;
  volume.userData.physicalCollider=false;
  volume.userData.modeledSourceIds=modeledIds;
  group.add(volume);

  const outlineGeo=new THREE.BufferGeometry();
  outlineGeo.setAttribute("position",new THREE.Float32BufferAttribute(outlines,3));
  outlineGeo.computeBoundingBox();
  const outline=new THREE.LineSegments(outlineGeo,new THREE.LineBasicMaterial({
    color:0xecd29a,transparent:true,opacity:.85,depthWrite:false
  }));
  outline.name="writer-block-real-building-footprint-outlines";
  outline.renderOrder=17;outline.userData.physicalCollider=false;
  outline.userData.protectedSourceIds=roomProtectedIds;
  group.add(outline);
  parent.add(group);
  return {group,volume,outline,plan};
}
