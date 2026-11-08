/* Road surface V3: a single topological mesh for all orthogonal street strips.
 * Geometry is a disjoint tessellation of their UNION, never overlapping plates.
 * A common street elevation and asphalt shader eliminate road patch seams.
 */
export const ROAD_SURFACE_VERSION="road-surface-20261108-v3";

export function roadRect(segment) {
  if (!segment || !Number.isFinite(segment.width) || segment.width <= 0 ||
      !Number.isFinite(segment.min) || !Number.isFinite(segment.max) ||
      segment.max <= segment.min || !Number.isFinite(segment.at)) {
    throw new TypeError("Invalid road axis, extents or width");
  }
  if (segment.axis === "x") return {
    x0:segment.min,x1:segment.max,
    z0:segment.at-segment.width/2,z1:segment.at+segment.width/2
  };
  if (segment.axis === "z") return {
    x0:segment.at-segment.width/2,x1:segment.at+segment.width/2,
    z0:segment.min,z1:segment.max
  };
  throw new TypeError("Unknown road axis: "+segment.axis);
}
const uniq=values=>[...new Set(values)].sort((a,b)=>a-b);
const inside=(x,z,r)=>x>=r.x0&&x<=r.x1&&z>=r.z0&&z<=r.z1;

export function calculateRoadUnion(segments) {
  const rectangles=segments.map(roadRect);
  const xs=uniq(rectangles.flatMap(r=>[r.x0,r.x1]));
  const zs=uniq(rectangles.flatMap(r=>[r.z0,r.z1]));
  const cells=[];
  let area=0;
  for(let i=0;i<xs.length-1;i++){
    const a=xs[i],b=xs[i+1];
    if(b-a<1e-7)continue;
    for(let j=0;j<zs.length-1;j++){
      const c=zs[j],d=zs[j+1];
      if(d-c<1e-7)continue;
      if(!rectangles.some(r=>inside((a+b)/2,(c+d)/2,r)))continue;
      cells.push([a,b,c,d]);area+=(b-a)*(d-c);
    }
  }
  return {cells,area,segments:rectangles.length,rectangles};
}

export function buildSeamlessRoadSurface(THREE,segments,{
  streetY=-3,color=0x39464e
}={}) {
  const plan=calculateRoadUnion(segments);
  const surfaceY=streetY-.020;
  const vertices=[];
  for(const [x0,x1,z0,z1] of plan.cells){
    // Counterclockwise winding viewed from above; no coplanar overlapping
    // sections, even where three or four streets meet.
    vertices.push(
      x0,surfaceY,z0, x0,surfaceY,z1, x1,surfaceY,z0,
      x0,surfaceY,z1, x1,surfaceY,z1, x1,surfaceY,z0
    );
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute("position",new THREE.Float32BufferAttribute(vertices,3));
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  const material=new THREE.MeshStandardMaterial({
    color,roughness:.88,metalness:0,
    polygonOffset:false
  });
  const mesh=new THREE.Mesh(geometry,material);
  mesh.name="city-road-union";
  mesh.receiveShadow=true;
  mesh.castShadow=false;
  mesh.renderOrder=2;
  mesh.userData.urbanSurface={
    area:plan.area,
    pieces:plan.cells.length,
    segments:plan.segments,
    elevation:surfaceY,
    winding:"up"
  };
  return mesh;
}
