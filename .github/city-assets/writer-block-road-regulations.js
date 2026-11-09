/* MAYOR-045: Dated OSM ROAD TAG evidence rendered as reversible map annotations.
 * Not a reconstruction of real traffic signs or lane markings. Nothing collides.
 * Source: city/survey/output/writer-block-survey.json 2026-11-09 ODbL.
 */
import { buildStreetFramePlan } from "./writer-block-street-frame.js?v=writer-block-4-roads-20261109-v1";
import { writerBlockContainsLocalPoint } from "./writer-block-road-preview.js?v=writer-block-osm-preview-20261109-v1";

export const WRITER_BLOCK_REGULATION_VERSION="writer-block-osm-regulations-20261109-v1";
export const WRITER_BLOCK_REGULATION_SOURCE=Object.freeze({
  source:"city/survey/output/writer-block-survey.json",
  capturedAt:"2026-11-09T09:22:58.743Z",
  license:"ODbL-1.0",
  attribution:"© OpenStreetMap contributors",
  geometryStatus:"OSM_CENTERLINE_CANDIDATE",
  trafficSurveyVerified:false,
  paintedSignLocationsSurveyed:false
});
export const WRITER_BLOCK_OSM_REGULATIONS=Object.freeze([
  Object.freeze({wayId:4292858,name:"فلاحت پور",segments:Object.freeze([0,1]),
    maxspeed:"30",oneway:null,surface:"asphalt",
    wayStart:Object.freeze([-29.662,-259.91]),wayEnd:Object.freeze([92.767,169.713])}),
  Object.freeze({wayId:481657106,name:"پنجم دریان‌ نو",segments:Object.freeze([2]),
    maxspeed:"30",oneway:"yes",surface:null,
    wayStart:Object.freeze([-333.715,155.944]),wayEnd:Object.freeze([58.789,50.483])}),
  Object.freeze({wayId:36697708,name:"هشتم دریان‌ نو",segments:Object.freeze([3]),
    maxspeed:"30",oneway:"no",surface:null,
    wayStart:Object.freeze([-155.393,-110.478]),wayEnd:Object.freeze([-66.608,212.231])}),
  Object.freeze({wayId:36697711,name:"خلیل میکائیلی",segments:Object.freeze([4]),
    maxspeed:"30",oneway:"yes",surface:null,
    wayStart:Object.freeze([193.596,-77.159]),wayEnd:Object.freeze([-366.679,87.286])})
]);
const lerp=(a,b,t)=>({x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t});
function roadPoint(rings,i,t,interiorFraction){
  const n=rings[0].length,j=(i+1)%n;
  return lerp(lerp(rings[0][i],rings[0][j],t),
    lerp(rings[1][i],rings[1][j],t),interiorFraction);
}
function inWriterBlock(x,z){
  return writerBlockContainsLocalPoint(x,z) && Math.hypot(x,z)>7.9;
}
// Show way geometry orientation only when oneway=yes. Explicit oneway=no may
// show two directions. Omitted oneway is UNKNOWN, not automatically two-way.
export function planWriterBlockRoadRegulations(){
  const rings=buildStreetFramePlan().rings;
  const speeds=[],arrows=[],facts=[];
  for(const rec of WRITER_BLOCK_OSM_REGULATIONS){
    if(!rec.segments.length||!rec.segments.every(e=>e>=0&&e<rings[0].length))
      throw new Error("OSM road-to-scene source edge mapping drifted");
    if(rec.maxspeed!=="30")throw new Error("Revalidate recorded source speed");
    const i=rec.segments[Math.floor(rec.segments.length/2)];
    const a=rings[0][i],b=rings[0][(i+1)%rings[0].length];
    const e={x:b.x-a.x,z:b.z-a.z},len=Math.hypot(e.x,e.z);
    if(!(len>10))throw new Error("OSM road edge degenerate");
    const way={x:rec.wayEnd[0]-rec.wayStart[0],z:rec.wayEnd[1]-rec.wayStart[1]};
    const orientation=Math.sign(e.x*way.x+e.z*way.z);
    if(!orientation)throw new Error("Ambiguous sourced way orientation");
    const speed=roadPoint(rings,i,.26,.63);
    if(!inWriterBlock(speed.x,speed.z))throw new RangeError("Speed diagram outside block or room");
    speeds.push({wayId:rec.wayId,...speed,displayKmh:30,actualSignLocation:false,
      realSpeedTag:"30",sourceEdge:i});
    if(rec.oneway==="yes"||rec.oneway==="no"){
      const directions=rec.oneway==="yes"?[orientation]:[1,-1];
      directions.forEach((direction,k)=>{
        const p=roadPoint(rings,i,.60+k*.16,.66);
        const unit={x:e.x/len*direction,z:e.z/len*direction};
        if(!inWriterBlock(p.x,p.z))throw new RangeError("OSM diagram arrow outside block");
        arrows.push({wayId:rec.wayId,x:p.x,z:p.z,
          direction:unit,sourceEdge:i,sourceWayDirection:orientation,
          taggedOneway:rec.oneway,actualRoadArrowKnown:false});
      });
    }
    facts.push({wayId:rec.wayId,name:rec.name,maxspeedKmh:30,
      onewayTag:rec.oneway,wayDirectionSign:orientation,sourceEdge:i,
      streetGeometryOfficiallySurveyed:false,
      actualSpeedSignLocationsKnown:false});
  }
  if(speeds.length!==4||arrows.length!==4||facts.length!==4)
    throw new Error("Expected four tagged ways, four speed diagrams, four directional arrows");
  return {speeds,arrows,facts,source:WRITER_BLOCK_REGULATION_SOURCE};
}
export function buildWriterBlockRoadRegulations(THREE,parent,{
  streetY=-3,canvasTex=null
}={}){
  if(!THREE?.Group||!parent?.add||!Number.isFinite(streetY))
    throw new TypeError("Road evidence requires existing Three.js scene and datum");
  const plan=planWriterBlockRoadRegulations();
  const group=new THREE.Group();
  group.name="writer-block-osm-road-regulation-overlay";
  group.userData.cityRoadEvidence={
    kind:"SOURCE_TAGS_DISPLAY_AS_MAP_ANNOTATIONS",
    ...WRITER_BLOCK_REGULATION_SOURCE,
    sourcedSpeedTagCount:plan.speeds.length,
    taggedOneWay:plan.facts.filter(f=>f.onewayTag==="yes").length,
    taggedBidirectional:plan.facts.filter(f=>f.onewayTag==="no").length,
    unknownOneWay:plan.facts.filter(f=>f.onewayTag===null).length,
    arrowGlyphCount:plan.arrows.length,
    speedGlyphCount:plan.speeds.length,
    physicalCollider:false,roadSurfacesChanged:false,citizenPathsChanged:false,
    writerRoomPreserved:true,noNewCarRoutes:true
  };
  const vertices=[],y=streetY+.231;
  // An authored map glyph, not a claim that any pavement actually contains
  // these arrow markings. Geometry stays inside the documented OSM road loop.
  function face(a,b,c){
    vertices.push(a.x,y,a.z,b.x,y,b.z,c.x,y,c.z);
  }
  for(const arrow of plan.arrows){
    const {x,z}=arrow,d=arrow.direction,n={x:-d.z,z:d.x};
    const at=(f,s)=>({x:x+d.x*f+n.x*s,z:z+d.z*f+n.z*s});
    const a=at(-1.08,-.12),b=at(-1.08,.12),
      c=at(.18,.12),e=at(.18,.48),f=at(1.27,0),
      g=at(.18,-.48),h=at(.18,-.12);
    const tri=[[a,b,c],[a,c,h],[g,h,f],[h,c,f],[c,e,f]];
    for(const [t1,t2,t3] of tri){
      for(const p of [t1,t2,t3])
        if(!inWriterBlock(p.x,p.z))throw new RangeError("Directional diagram escaped source block");
      face(t1,t2,t3);
    }
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute("position",new THREE.Float32BufferAttribute(vertices,3));
  geometry.computeVertexNormals();geometry.computeBoundingBox();
  const arrowsMesh=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({
    color:0xcee2da,transparent:true,opacity:.93,depthWrite:false,
    side:THREE.DoubleSide
  }));
  arrowsMesh.name="writer-block-osm-source-direction-diagram-arrows";
  arrowsMesh.renderOrder=22;
  arrowsMesh.userData.cityEvidence={
    physicalCollider:false,mapAnnotationOnly:true,
    speedLimitObservedFromOfficialTrafficAuthority:false,
    sourcedWayIds:plan.arrows.map(a=>a.wayId)
  };
  group.add(arrowsMesh);
  if(typeof canvasTex==="function"){
    const map=canvasTex(256,256,(g,w,h)=>{
      g.clearRect?.(0,0,w,h);
      g.beginPath?.();
      g.arc?.(w/2,h/2,100,0,Math.PI*2);
      g.fillStyle="#f5f1e7";g.fill?.();
      g.lineWidth=13;g.strokeStyle="#c14a43";g.stroke?.();
      g.fillStyle="#272e32";g.textAlign="center";g.textBaseline="middle";
      g.font="bold 111px Tahoma, sans-serif";g.fillText("30",w/2,h/2+8);
    });
    const labels=new THREE.InstancedMesh(
      new THREE.PlaneGeometry(2.00,2.00),
      new THREE.MeshBasicMaterial({map,transparent:true,depthWrite:false,
        side:THREE.DoubleSide,toneMapped:false}),plan.speeds.length);
    labels.name="writer-block-osm-30-kmh-map-labels";
    labels.renderOrder=23;
    labels.userData.cityEvidence={
      physicalCollider:false,mapAnnotationOnly:true,
      sourceTag:"maxspeed=30",realSpeedSignsSurveyed:false,
      sourcedWayIds:plan.speeds.map(x=>x.wayId)
    };
    const proxy=new THREE.Object3D();
    plan.speeds.forEach((p,i)=>{
      proxy.position.set(p.x,streetY+.245,p.z);
      proxy.rotation.set(-Math.PI/2,0,0);
      proxy.scale.set(1,1,1);proxy.updateMatrix();
      labels.setMatrixAt(i,proxy.matrix);
    });
    labels.instanceMatrix.needsUpdate=true;
    labels.computeBoundingSphere();group.add(labels);
  }
  parent.add(group);
  return {group,plan,arrowsMesh};
}
