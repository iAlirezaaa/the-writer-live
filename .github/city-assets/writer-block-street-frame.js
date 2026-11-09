/* MAYOR-036: visibly dominant, SOURCE-ALIGNED writer-block street surface.
 * Geographic authority: licensed OSM road-centerline loop, captured 2026-11-09,
 * supplied by writer-block-road-preview.js. These are NOT surveyed curbs/widths.
 * Only the inward half of four real road centerlines is displayed; every generated
 * vertex remains in the single writer-block polygon. Flat non-colliding scenery:
 * resident/vehicle paths, actual physical road surfaces and writer room unchanged.
 * 3Dviz: contiguous slab sockets / continuous edge / simple UV-free LOD geometry.
 */
import {
  writerBlockLocalRing, writerBlockRingArea, writerBlockContainsLocalPoint,
  WRITER_BLOCK_ROAD_EVIDENCE
} from "./writer-block-road-preview.js?v=writer-block-osm-preview-20261109-v1";

export const WRITER_BLOCK_STREET_FRAME_VERSION="writer-block-4-roads-20261109-v1";
export const WRITER_BLOCK_STREET_SPEC=Object.freeze({
  roadHalfWidthProxyMeters:3.05,  // source has NO measured roadway width
  curbProxyMeters:.26,           // visual-only depth: NOT surveyed Tehran curb
  sidewalkProxyMeters:2.02,      // visual-only width: NOT surveyed sidewalk
  innerEdgeProxyMeters:.20,      // schematic frontage break
  tileSeamIntervalMeters:4.8,    // graphic regularity, not surveyed paving
  homeWGS84:Object.freeze([35.715361987616696,51.3642455031707]),
  sourceKind:"OSM_CENTERLINE_CANDIDATE",
  physicalRoadWidthKnown:false,physicalCollider:false,physicalNavigationChanged:false,
  alignment:"X east; Z south; inward half of sourced centerline ring"
});
export const WRITER_BLOCK_REAL_STREETS=Object.freeze([
  Object.freeze({wayId:4292858,name:"فلاحت پور",segments:Object.freeze([0,1])}),
  Object.freeze({wayId:481657106,name:"پنجم دریان‌ نو",segments:Object.freeze([2])}),
  Object.freeze({wayId:36697708,name:"هشتم دریان‌ نو",segments:Object.freeze([3])}),
  Object.freeze({wayId:36697711,name:"خلیل میکائیلی",segments:Object.freeze([4])})
]);
const dot=(a,b)=>a.x*b.x+a.z*b.z;
const mid=(a,b)=>({x:(a.x+b.x)/2,z:(a.z+b.z)/2});
const lerp=(a,b,t)=>({x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t});
const area2=(a,b,c)=>(b.x-a.x)*(c.z-a.z)-(b.z-a.z)*(c.x-a.x);
const EPS=1e-6;

export function buildStreetFramePlan(spec=WRITER_BLOCK_STREET_SPEC){
  const sourceRing=writerBlockLocalRing(),ring=sourceRing.slice(0,-1);
  if(ring.length!==5||Math.abs(writerBlockRingArea(sourceRing)-12265)>5||
    !writerBlockContainsLocalPoint(0,0,sourceRing))
    throw new TypeError("Writer-block street source changed; refuse fictitious fallback");
  if(WRITER_BLOCK_REAL_STREETS.flatMap(x=>x.segments).join(",")!=="0,1,2,3,4")
    throw new Error("Street names no longer cover all five source edges");
  if(WRITER_BLOCK_REAL_STREETS.some(x=>!WRITER_BLOCK_ROAD_EVIDENCE.wayIds.includes(x.wayId)))
    throw new Error("Street label not in permitted OSM road source");
  const offsets=[
    0,spec.roadHalfWidthProxyMeters,
    spec.roadHalfWidthProxyMeters+spec.curbProxyMeters,
    spec.roadHalfWidthProxyMeters+spec.curbProxyMeters+spec.sidewalkProxyMeters,
    spec.roadHalfWidthProxyMeters+spec.curbProxyMeters+spec.sidewalkProxyMeters+spec.innerEdgeProxyMeters
  ];
  if(offsets.some((x,i)=>!Number.isFinite(x)||(i>0&&x<=offsets[i-1]))||
    offsets[4]>6.2)throw new RangeError("Unmeasured street frame excessively wide");
  let doubleArea=0;
  for(let i=0;i<ring.length;i++)doubleArea+=ring[i].x*ring[(i+1)%ring.length].z-ring[(i+1)%ring.length].x*ring[i].z;
  const side=Math.sign(doubleArea);
  if(side===0)throw new Error("Zero-area street ring");
  const segmentUnit=(a,b)=>{
    const dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz);
    if(!(len>.01))throw new RangeError("Collapsed OSM road segment");
    return {x:dx/len,z:dz/len};
  };
  // Mitered inward joins produce a continuous asphalt/curb/sidewalk band,
  // with no doubled crossing segments at road corners.
  const bisectors=ring.map((p,i)=>{
    const a=segmentUnit(ring[(i+ring.length-1)%ring.length],p);
    const b=segmentUnit(p,ring[(i+1)%ring.length]);
    const n1={x:-a.z*side,z:a.x*side},n2={x:-b.z*side,z:b.x*side};
    const denom=1+dot(n1,n2);
    if(denom<.35)throw new RangeError("Road corner miter unstable");
    return {x:(n1.x+n2.x)/denom,z:(n1.z+n2.z)/denom};
  });
  const rings=offsets.map(d=>ring.map((p,i)=>({
    x:p.x+bisectors[i].x*d,z:p.z+bisectors[i].z*d
  })));
  for(const interior of rings.slice(1))
    for(const p of interior)
      if(!writerBlockContainsLocalPoint(p.x,p.z,sourceRing))
        throw new RangeError("Street sidewalk escaped the approved OSM block");
  return {rings,offsets,sourceRing,
    labels:WRITER_BLOCK_REAL_STREETS.map(s=>{
      const edge=s.segments[Math.floor(s.segments.length/2)];
      const a=rings[0][edge],b=rings[0][(edge+1)%5];
      const ia=rings[1][edge],ib=rings[1][(edge+1)%5];
      return {...s,edge,point:mid(mid(a,b),mid(ia,ib)),azimuth:Math.atan2(b.z-a.z,b.x-a.x)};
    })
  };
}

export function buildWriterBlockStreetFrame(THREE,parent,{
  streetY=-3,canvasTex=null
}={}){
  if(!Number.isFinite(streetY))throw new TypeError("Invalid street vertical datum");
  const plan=buildStreetFramePlan(),rings=plan.rings;
  const geometry=new THREE.BufferGeometry(),verts=[],groups=[];
  function face(a,b,c,y){
    // Face winding is upward for front-face culling (XZ determinant < 0).
    const triangle=area2(a,b,c)<0?[a,b,c]:[a,c,b];
    for(const p of triangle)verts.push(p.x,y,p.z);
  }
  function strip(a,b,c,d,y){face(a,c,b,y);face(c,d,b,y);}
  function startGroup(mat,fn){
    const first=verts.length/3;
    fn();
    const count=verts.length/3-first;
    if(count>0)groups.push({start:first,count,materialIndex:mat});
  }
  const num=rings[0].length;
  // The interior's visual ground plane is sourced polygonal, never a guessed
  // rectangular/circular Tehran plot; no cadastral status is implied.
  startGroup(0,()=>{
    const home={x:0,z:0};
    for(let i=0;i<num;i++)face(home,rings[0][(i+1)%num],rings[0][i],streetY+.043);
  });
  const heights=[streetY+.12,streetY+.17,streetY+.19,streetY+.092];
  for(let band=0;band<4;band++){
    startGroup(band+1,()=>{
      for(let i=0;i<num;i++){
        const j=(i+1)%num;
        strip(rings[band][i],rings[band][j],rings[band+1][i],rings[band+1][j],heights[band]);
      }
    });
  }
  // A single light seam layer communicates paving scale without pretending
  // it is an observed Tehran tile pattern or adding 100 separate objects.
  startGroup(5,()=>{
    for(let i=0;i<num;i++){
      const a=rings[2][i],b=rings[2][(i+1)%num];
      const c=rings[3][i],d=rings[3][(i+1)%num];
      const length=Math.hypot(b.x-a.x,b.z-a.z);
      for(let at=plan.offsets[4];at<length-1;at+=WRITER_BLOCK_STREET_SPEC.tileSeamIntervalMeters){
        const t=at/length;
        const l=lerp(a,b,t),r=lerp(c,d,t);
        const dx=r.x-l.x,dz=r.z-l.z,mag=Math.hypot(dx,dz);
        if(mag<.01)continue;
        const nx=-dz/mag*.025,nz=dx/mag*.025;
        const u={x:l.x+nx,z:l.z+nz},v={x:r.x+nx,z:r.z+nz};
        const w={x:l.x-nx,z:l.z-nz},q={x:r.x-nx,z:r.z-nz};
        strip(u,v,w,q,streetY+.196);
      }
    }
  });
  geometry.setAttribute("position",new THREE.Float32BufferAttribute(verts,3));
  for(const g of groups)geometry.addGroup(g.start,g.count,g.materialIndex);
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  const mk=(color,roughness=1)=>new THREE.MeshStandardMaterial({
    color,roughness,metalness:0,side:THREE.FrontSide,depthWrite:true
  });
  const materials=[
    mk(0x9c9486), // muted enclosed ground rather than fictional green lawn
    mk(0x41464a,.92), // full-scale apparent asphalt ring from actual OSM centers
    mk(0xc2b7a7), // curb
    mk(0xa79d8e), // paved sidewalk
    mk(0x746d62), // frontage edge
    mk(0x888072)  // tile seams
  ];
  const mesh=new THREE.Mesh(geometry,materials);
  mesh.name="writer-block-osm-4-street-pavement";
  mesh.castShadow=false;
  mesh.receiveShadow=false;
  mesh.renderOrder=5;
  mesh.userData.cityStreetEvidence={
    source:"city/survey/output/writer-block-survey.json",
    capturedAt:WRITER_BLOCK_ROAD_EVIDENCE.capturedAt,
    attribution:WRITER_BLOCK_ROAD_EVIDENCE.attribution,
    license:WRITER_BLOCK_ROAD_EVIDENCE.license,
    roadCenterlinesReal:true,actualPavementWidthKnown:false,
    actualCurbElevationKnown:false,visualWidthAssumptions:plan.offsets,
    buildingOrRoadCollidersChanged:false,
    writerRoomPreserved:true,physicalCollider:false,
    roadWayIds:WRITER_BLOCK_REAL_STREETS.map(s=>s.wayId),
    roadLabels:WRITER_BLOCK_REAL_STREETS.map(s=>s.name),
    sourceCenterlineAreaMeters2:writerBlockRingArea(plan.sourceRing),
    triangleCount:verts.length/9,drawGroups:groups.length
  };
  const group=new THREE.Group();
  group.name="writer-block-source-aligned-streets";
  group.add(mesh);
  const labels=[];
  if(typeof canvasTex==="function") {
    for(const label of plan.labels){
      const tex=canvasTex(512,128,(g,w,h)=>{
        g.clearRect?.(0,0,w,h);
        g.fillStyle="rgba(37,43,45,0.75)";g.fillRect(4,16,w-8,h-32);
        g.direction="rtl";g.textAlign="center";g.textBaseline="middle";
        g.fillStyle="#f1e8d8";g.font="500 47px Tahoma, sans-serif";
        g.fillText(label.name,w/2,h/2,w-48);
      });
      const material=new THREE.MeshBasicMaterial({
        map:tex,transparent:true,opacity:.84,depthWrite:false,
        side:THREE.DoubleSide,toneMapped:false
      });
      const plate=new THREE.Mesh(new THREE.PlaneGeometry(12,3),material);
      plate.name="writer-block-osm-street-label-"+label.wayId;
      plate.position.set(label.point.x,streetY+.237,label.point.z);
      plate.rotation.order="YXZ";plate.rotation.y=-label.azimuth;
      plate.rotation.x=-Math.PI/2;
      plate.castShadow=false;plate.receiveShadow=false;
      plate.userData.cityStreetSource={wayId:label.wayId,
        name:label.name,license:WRITER_BLOCK_ROAD_EVIDENCE.license,
        actualStreetSign:false,graphicMapLabel:true,physicalCollider:false};
      group.add(plate);labels.push(plate);
    }
  }
  parent.add(group);
  return {group,mesh,labels,plan};
}
