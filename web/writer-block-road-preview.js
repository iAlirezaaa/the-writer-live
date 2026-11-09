/* Writer block: sourced road-centerline PREVIEW, not surveyed road/curb geometry.
 * OSM 2026-11-09 09:22:58Z, ODbL-1.0, © OpenStreetMap contributors.
 * Local +X east / -Z north from TEHRAN_GEO_ORIGIN.
 * Non-colliding ground decal only. Does not replace procedural traffic roads.
 */
import { geoToCityLocal } from "./urban-plan.js?v=urban-plan-20261108-v3";

export const WRITER_BLOCK_ROAD_PREVIEW_VERSION = "writer-block-osm-preview-20261109-v1";
export const WRITER_BLOCK_ROAD_EVIDENCE = Object.freeze({
  kind: "OSM_CENTERLINE_CANDIDATE",
  source: "city/survey/output/writer-block-survey.json",
  capturedAt: "2026-11-09T09:22:58.743Z",
  license: "ODbL-1.0",
  attribution: "© OpenStreetMap contributors",
  wayIds: Object.freeze([4292858, 481657106, 36697708, 36697711]),
  areaSquareMeters: 12265,
  confidence: "topology-only: not curbs, widths, parcel edges or height measurements"
});
// Clockwise or counterclockwise is immaterial. Source coordinates are [longitude, latitude]
// from blockBoundary.geometry.coordinates[0] in the licensed OSM source extract.
export const WRITER_BLOCK_ROAD_RING = Object.freeze([
  Object.freeze([51.36466829476369,35.7155564020295]),
  Object.freeze([51.36477219957999,35.71525899871979]),
  Object.freeze([51.36489520113343,35.71490699606315]),
  Object.freeze([51.363146799806835,35.71452419677916]),
  Object.freeze([51.362926502145896,35.71517719883983]),
  Object.freeze([51.36466829476369,35.7155564020295])
]);
export function writerBlockLocalRing() {
  return WRITER_BLOCK_ROAD_RING.map(([lon,lat]) => geoToCityLocal(lat,lon));
}
export function writerBlockRingArea(ring=writerBlockLocalRing()) {
  let twice=0;
  for(let i=0;i<ring.length-1;i++)
    twice+=ring[i].x*ring[i+1].z-ring[i+1].x*ring[i].z;
  return Math.abs(twice)/2;
}
export function writerBlockContainsLocalPoint(x,z,ring=writerBlockLocalRing()) {
  let inside=false;
  for(let i=0,j=ring.length-2;i<ring.length-1;j=i++){
    const a=ring[i],b=ring[j];
    if((a.z>z)!==(b.z>z) && x<(b.x-a.x)*(z-a.z)/(b.z-a.z)+a.x)
      inside=!inside;
  }
  return inside;
}

// Explicitly schematic display stroke, NEVER interpreted as real road width.
// Non-colliding, non-pickable single mesh: no edits to routes, road surfaces or buildings.
export function buildWriterBlockRoadPreview(THREE,parent,{streetY=-3}={}) {
  const ring=writerBlockLocalRing();
  const surfaceY=streetY+0.15;  // above the existing road, below any feet/physical fixtures
  const stroke=0.46;            // display-only line width, NOT a survey measurement
  const dash=2.3,gap=1.5;
  const vertices=[];
  const addQuad=(ax,az,bx,bz,width)=>{
    const dx=bx-ax,dz=bz-az,len=Math.hypot(dx,dz);
    if(len<=1e-9)return;
    const nx=-dz/len*width/2,nz=dx/len*width/2;
    vertices.push(
      ax+nx,surfaceY,az+nz, bx+nx,surfaceY,bz+nz, ax-nx,surfaceY,az-nz,
      ax-nx,surfaceY,az-nz, bx+nx,surfaceY,bz+nz, bx-nx,surfaceY,bz-nz
    );
  };
  for(let i=0;i<ring.length-1;i++){
    const a=ring[i],b=ring[i+1],dx=b.x-a.x,dz=b.z-a.z,length=Math.hypot(dx,dz);
    for(let at=0;at<length;at+=dash+gap){
      const stop=Math.min(at+dash,length);
      addQuad(a.x+dx*at/length,a.z+dz*at/length,
        a.x+dx*stop/length,a.z+dz*stop/length,stroke);
    }
  }
  // Small open-corner rings, sourced from the same OSM road junction vertices.
  // Geometry shares one material and draw call with the dashed trace.
  for(const p of ring.slice(0,-1)){
    for(let j=0;j<12;j++){
      const a=j*Math.PI/6,b=(j+1)*Math.PI/6,outer=.56,inner=.37;
      const v=(radius,theta)=>[p.x+radius*Math.cos(theta),surfaceY,p.z+radius*Math.sin(theta)];
      vertices.push(...v(inner,a),...v(inner,b),...v(outer,a),
        ...v(inner,b),...v(outer,b),...v(outer,a));
    }
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute("position",new THREE.Float32BufferAttribute(vertices,3));
  geometry.computeBoundingSphere();
  const material=new THREE.MeshBasicMaterial({
    color:0xf1c25a, transparent:true, opacity:.88, depthWrite:false,
    side:THREE.FrontSide, polygonOffset:true, polygonOffsetFactor:-1,polygonOffsetUnits:-1
  });
  const trace=new THREE.Mesh(geometry,material);
  trace.name="writer-block-osm-centerline-preview";
  trace.castShadow=false;
  trace.receiveShadow=false;
  trace.renderOrder=12;
  trace.userData.cityMapEvidence={...WRITER_BLOCK_ROAD_EVIDENCE,
    physicalRoadWidthKnown:false,physicalCollider:false,displayStrokeMeters:stroke,
    sourceVertexCount:ring.length-1,homeAnchorContained:writerBlockContainsLocalPoint(0,0)};
  // No raycast registration, collision integration, navigation replan or hidden overlays.
  parent.add(trace);
  return trace;
}
