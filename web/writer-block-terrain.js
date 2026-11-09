/* Single-block sourced SRTM topography visualization.
 * NOT collision terrain: the existing town ground, writer house, roads and
 * citizen routes remain flat, physically authoritative until a grade survey.
 * Data NASA/USGS SRTMGL1 V3 via OpenTopoData, ~30 m (EGM96 metres).
 * The OSM centerline candidate ring clips all visible features.
 */
import { writerBlockLocalRing, writerBlockContainsLocalPoint } from
  "./writer-block-road-preview.js?v=writer-block-osm-preview-20261109-v1";
import { WRITER_BLOCK_DEM_SOURCE } from "./writer-block-terrain-data.js?v=writer-block-dem-srtm30-20261109-v1";
export const WRITER_BLOCK_TERRAIN_VERSION="writer-block-dem-contours-20261109-v1";
export const TERRAIN_CONTOUR_INTERVAL_METERS=2;
const EPS=1e-7;
const source=WRITER_BLOCK_DEM_SOURCE;

export function validateWriterBlockDEM(data=source){
  const g=data?.grid;
  if(data?.providerDataset!=="srtm30m"||data?.verticalDatum!=="EGM96 geoid"||
    data?.blockBoundary?.status!=="OSM_CENTERLINE_CANDIDATE"||
    data?.homeAnchor?.lat!==35.715361987616696||
    data?.homeAnchor?.lon!==51.3642455031707||
    g?.width!==9||g?.depth!==7||g?.heightsMetersEGM96?.length!==63||
    !g.heightsMetersEGM96.every(Number.isFinite)||
    !Number.isFinite(data.homeAnchor.elevationMetersEGM96))throw new TypeError("Invalid or unlicensed writer block DEM");
  const b=g.bounds;
  if(![b.xMin,b.xMax,b.zMin,b.zMax].every(Number.isFinite)||
    b.xMin>=b.xMax||b.zMin>=b.zMax||b.xMin < -130||b.xMax > 70||
    b.zMin < -35||b.zMax > 110)throw new RangeError("DEM footprint outside approved block bounds");
  return true;
}
export function writerBlockTerrainHeight(x,z,data=source){
  validateWriterBlockDEM(data);
  if(!Number.isFinite(x)||!Number.isFinite(z))throw new TypeError("Invalid terrain coordinates");
  const g=data.grid,b=g.bounds;
  if(x < b.xMin-EPS||x > b.xMax+EPS||z < b.zMin-EPS||z > b.zMax+EPS)return null;
  const u=Math.max(0,Math.min(g.width-1,(x-b.xMin)/(b.xMax-b.xMin)*(g.width-1)));
  const v=Math.max(0,Math.min(g.depth-1,(z-b.zMin)/(b.zMax-b.zMin)*(g.depth-1)));
  const ix=Math.min(g.width-2,Math.floor(u)), iz=Math.min(g.depth-2,Math.floor(v));
  const dx=u-ix,dz=v-iz,heights=g.heightsMetersEGM96;
  const h00=heights[iz*g.width+ix],h10=heights[iz*g.width+ix+1];
  const h01=heights[(iz+1)*g.width+ix],h11=heights[(iz+1)*g.width+ix+1];
  return (h00*(1-dx)+h10*dx)*(1-dz)+(h01*(1-dx)+h11*dx)*dz;
}
const cross=(a,b,p)=>(b.x-a.x)*(p.z-a.z)-(b.z-a.z)*(p.x-a.x);
const interp=(a,b,t)=>({x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t});
function clipConvex(subject,clip) {
  const orient=cross(clip[0],clip[1],clip[2])>=0?1:-1;
  let current=subject;
  for(let i=0;i<clip.length;i++){
    const a=clip[i],b=clip[(i+1)%clip.length],next=[];
    if(current.length===0)break;
    for(let j=0;j<current.length;j++){
      const p=current[j],q=current[(j+1)%current.length];
      const dp=orient*cross(a,b,p),dq=orient*cross(a,b,q);
      const pin=dp>=-EPS,qin=dq>=-EPS;
      if(pin)next.push(p);
      if(pin!==qin){
        const t=dp/(dp-dq);
        next.push(interp(p,q,Math.max(0,Math.min(1,t))));
      }
    }
    current=next;
  }
  return current;
}
function area(p) {
  let t=0;
  for(let i=0;i<p.length;i++)
    t+=p[i].x*p[(i+1)%p.length].z-p[(i+1)%p.length].x*p[i].z;
  return Math.abs(t)*0.5;
}
// Each DEM cell is triangulated, then intersected with the fan of the exact
// sourced block candidate. The (0,0) writer-home origin is inside the ring.
export function buildClippedTerrainTriangles(data=source){
  validateWriterBlockDEM(data);
  const ring=writerBlockLocalRing(),home={x:0,z:0};
  if(!writerBlockContainsLocalPoint(0,0,ring))throw Error("Home anchor outside OSM block");
  const fan=ring.slice(0,-1).map((p,i)=>[home,p,ring[i+1]]);
  const {width,depth,bounds}=data.grid;
  const at=(ix,iz)=>({x:bounds.xMin+(bounds.xMax-bounds.xMin)*ix/(width-1),
    z:bounds.zMin+(bounds.zMax-bounds.zMin)*iz/(depth-1)});
  const tris=[];
  for(let iz=0;iz<depth-1;iz++)for(let ix=0;ix<width-1;ix++){
    const a=at(ix,iz),b=at(ix+1,iz),c=at(ix+1,iz+1),d=at(ix,iz+1);
    for(const tri of [[a,b,c],[a,c,d]])for(const f of fan){
      const clipped=clipConvex(tri,f);
      if(clipped.length<3||area(clipped)<EPS)continue;
      for(let k=1;k<clipped.length-1;k++){
        const triangle=[clipped[0],clipped[k],clipped[k+1]];
        if(area(triangle)>EPS)tris.push(triangle);
      }
    }
  }
  return tris;
}
const linearEdge=(a,b,level)=>{
  const dh=b.h-a.h;
  if(Math.abs(dh)<1e-10)return null;
  const t=(level-a.h)/dh;
  if(t < -EPS||t > 1+EPS)return null;
  return interp(a,b,Math.max(0,Math.min(1,t)));
};
function contourOfTriangle(tri,level) {
  const pts=[];
  for(let k=0;k<3;k++){
    const a=tri[k],b=tri[(k+1)%3];
    // Half-open threshold avoids doubled contour segments on shared edges.
    if((a.h<=level&&b.h>level)||(a.h>level&&b.h<=level)){
      const p=linearEdge(a,b,level);
      if(p&&!pts.some(q=>Math.hypot(q.x-p.x,q.z-p.z)<EPS))pts.push(p);
    }
  }
  return pts.length===2?pts:null;
}
function clipLineToRing(a,b,ring) {
  const breaks=[0,1];
  for(let i=0;i<ring.length-1;i++){
    const c=ring[i],d=ring[i+1],rx=b.x-a.x,rz=b.z-a.z;
    const sx=d.x-c.x,sz=d.z-c.z,den=rx*sz-rz*sx;
    if(Math.abs(den)<1e-10)continue;
    const qx=c.x-a.x,qz=c.z-a.z;
    const t=(qx*sz-qz*sx)/den,u=(qx*rz-qz*rx)/den;
    if(t>EPS&&t<1-EPS&&u>=-EPS&&u<=1+EPS)breaks.push(t);
  }
  breaks.sort((x,y)=>x-y);
  const result=[];
  for(let i=0;i<breaks.length-1;i++){
    const lo=breaks[i],hi=breaks[i+1];
    if(hi-lo<EPS)continue;
    const mid=interp(a,b,(lo+hi)*.5);
    if(writerBlockContainsLocalPoint(mid.x,mid.z,ring))
      result.push([interp(a,b,lo),interp(a,b,hi)]);
  }
  return result;
}
export function buildWriterBlockContours(data=source,interval=TERRAIN_CONTOUR_INTERVAL_METERS){
  validateWriterBlockDEM(data);
  if(!Number.isFinite(interval)||interval<=0)throw new RangeError("Contour interval must be positive");
  const ring=writerBlockLocalRing(),bounds=data.grid.bounds;
  const {width,depth,heightsMetersEGM96:hs}=data.grid;
  const vertices=[],lines=[];
  for(let iz=0;iz<depth-1;iz++)for(let ix=0;ix<width-1;ix++){
    const p=(x,z)=>({
      x:bounds.xMin+(bounds.xMax-bounds.xMin)*x/(width-1),
      z:bounds.zMin+(bounds.zMax-bounds.zMin)*z/(depth-1),
      h:hs[z*width+x]});
    const a=p(ix,iz),b=p(ix+1,iz),c=p(ix+1,iz+1),d=p(ix,iz+1);
    for(const tri of [[a,b,c],[a,c,d]]){
      const lo=Math.ceil(Math.min(...tri.map(x=>x.h))/interval)*interval;
      const hi=Math.floor(Math.max(...tri.map(x=>x.h))/interval)*interval;
      for(let level=lo;level<=hi;level+=interval){
        const segment=contourOfTriangle(tri,level);
        if(segment)for(const [q,r] of clipLineToRing(...segment,ring))
          if(Math.hypot(q.x-r.x,q.z-r.z)>EPS)lines.push({q,r,level});
      }
    }
  }
  return lines;
}
export function buildWriterBlockTerrain(THREE,parent,{streetY=-3,reliefVisible=false}={}){
  const data=source;
  validateWriterBlockDEM(data);
  const ring=writerBlockLocalRing();
  const group=new THREE.Group();
  group.name="writer-block-srtm30-topology";
  // Terrain reference triangles preserve SRTM relative height at 1:1 vertical scale.
  // Not installed as collision terrain: alignment with existing ground is unverified.
  const triangles=buildClippedTerrainTriangles(data),reliefPositions=[];
  const homeHeight=data.homeAnchor.elevationMetersEGM96;
  for(const tri of triangles) {
    const seq=cross(...tri)>=0?[tri[0],tri[2],tri[1]]:tri;
    for(const p of seq){
      const h=writerBlockTerrainHeight(p.x,p.z,data);
      if(!Number.isFinite(h))throw new Error("Terrain interpolation missing near AOI edge");
      reliefPositions.push(p.x,streetY+h-homeHeight,p.z);
    }
  }
  const reliefGeo=new THREE.BufferGeometry();
  reliefGeo.setAttribute("position",new THREE.Float32BufferAttribute(reliefPositions,3));
  reliefGeo.computeVertexNormals();reliefGeo.computeBoundingBox();
  const relief=new THREE.Mesh(reliefGeo,new THREE.MeshStandardMaterial({
    color:0x7c9c86,transparent:true,opacity:.36,depthWrite:false,side:THREE.DoubleSide,
    roughness:1,metalness:0
  }));
  relief.name="writer-block-srtm30-relief-inspection-only";
  relief.visible=reliefVisible===true;
  relief.castShadow=false;relief.receiveShadow=false;
  relief.renderOrder=15;relief.userData.physicalCollider=false;
  group.add(relief);

  // Visible on existing procedural town: 2m elevation contours drawn flat on
  // top of present pavement. They indicate topography, NOT traversable slope.
  const contourLines=buildWriterBlockContours(data);
  const stroke=.11,y=streetY+.22,contourVertices=[];
  for(const {q,r} of contourLines){
    const dx=r.x-q.x,dz=r.z-q.z,l=Math.hypot(dx,dz);
    if(l<EPS)continue;
    const nx=-dz/l*stroke*.5,nz=dx/l*stroke*.5;
    contourVertices.push(
      q.x+nx,y,q.z+nz, r.x+nx,y,r.z+nz, q.x-nx,y,q.z-nz,
      q.x-nx,y,q.z-nz, r.x+nx,y,r.z+nz, r.x-nx,y,r.z-nz
    );
  }
  const contourGeo=new THREE.BufferGeometry();
  contourGeo.setAttribute("position",new THREE.Float32BufferAttribute(contourVertices,3));
  contourGeo.computeBoundingBox();
  const contours=new THREE.Mesh(contourGeo,new THREE.MeshBasicMaterial({
    color:0x58b9b1,transparent:true,opacity:.8,depthWrite:false,
    side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-1,
    polygonOffsetUnits:-1
  }));
  contours.name="writer-block-srtm30-contours";
  contours.castShadow=false;contours.receiveShadow=false;contours.renderOrder=13;
  contours.userData.physicalCollider=false;
  group.add(contours);
  group.userData.cityTerrainEvidence={
    kind:data.kind,sourceDataset:data.sourceDataset,provider:data.provider,
    capturedAt:data.captureTime,verticalDatum:data.verticalDatum,unit:data.unit,
    nominalResolutionMeters:data.nominalRasterResolutionMeters,
    elevationMinimumMeters:data.stats.minimumMetersEGM96,
    elevationMaximumMeters:data.stats.maximumMetersEGM96,
    terrainNotSurveyGrade:true,noPhysicalCollision:true,contourIntervalMeters:TERRAIN_CONTOUR_INTERVAL_METERS,
    reliefHiddenByDefault:!reliefVisible,triangleCount:triangles.length,
    contourSegments:contourLines.length,blockLimited:true
  };
  parent.add(group);
  return {group,contours,relief,triangleCount:triangles.length,contourSegments:contourLines.length};
}
