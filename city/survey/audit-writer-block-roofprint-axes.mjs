/* MAYOR-053: Read-only orientation evidence from existing Overture roofprints.
 * Do not equate one ML polygon to one real house, nor roof-edge axis to entrance direction.
 * Local +X east and +Z south; undirected orientation modulo 180 degrees.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here=dirname(fileURLToPath(import.meta.url));
export const SOURCE_PATH=resolve(here,"output/writer-block-overture-buildings.json");
export const REPORT_PATH=resolve(here,"../buildings/roofprint-axis-audit.json");
const round=(n,digits=3)=>Number(n.toFixed(digits));

export function auditRoofprints(input) {
  if (!Array.isArray(input?.buildings) || !input.buildings.length)
    throw new TypeError("Missing source Overture roofprint candidates");
  if (input.license!=="ODbL-1.0") throw new Error("Source license changed");
  const unique=new Set();
  const footprints=input.buildings.map(b=>{
    if (typeof b.id!=="string"||!b.id||unique.has(b.id))
      throw new Error("Missing or repeated source feature id");
    unique.add(b.id);
    const ring=b.ringsLocalXZ?.[0];
    if (!Array.isArray(ring)||ring.length<4)
      throw new Error("Incomplete source ring: "+b.id);
    for(const p of ring)
      if(!Array.isArray(p)||p.length!==2||p.some(v=>!Number.isFinite(v)))
        throw new TypeError("Nonfinite source coordinate: "+b.id);
    const start=ring[0],end=ring[ring.length-1];
    if(Math.hypot(start[0]-end[0],start[1]-end[1])>1e-6)
      throw new Error("Source ring not closed: "+b.id);
    let twiceArea=0,longest=null;
    for(let i=0;i<ring.length-1;i++){
      const a=ring[i],c=ring[i+1];
      twiceArea+=a[0]*c[1]-c[0]*a[1];
      const dx=c[0]-a[0],dz=c[1]-a[1],length=Math.hypot(dx,dz);
      if(!(length>1e-6))continue;
      if(!longest||length>longest.length)longest={
        index:i,length,
        angle:((Math.atan2(dz,dx)*180/Math.PI)%180+180)%180
      };
    }
    const area=Math.abs(twiceArea)/2;
    if(!longest||!(area>0)||!Number.isFinite(area))
      throw new Error("Degenerate roofprint: "+b.id);
    if(!Number.isFinite(b.areaSquareMeters)||Math.abs(area-b.areaSquareMeters)>0.1)
      throw new Error("Recorded area no longer matches polygon: "+b.id);
    return {
      sourceId:b.id,
      sourceFeatureType:b.sourceFeatureType,
      roofprintAreaSquareMeters:b.areaSquareMeters,
      calculatedAreaSquareMeters:round(area),
      ringVertexCount:ring.length-1,
      longestBoundaryEdgeIndex:longest.index,
      longestBoundaryEdgeLengthMeters:round(longest.length),
      roofprintEdgeAxisDegrees:round(longest.angle),
      entranceDirectionDegrees:null,
      floorCount:null,
      actualRealBuildingCountRepresented:null,
      measurementTier:"T1-sourced-roofprint-plan-only"
    };
  });
  return {
    schemaVersion:1,
    source:"city/survey/output/writer-block-overture-buildings.json",
    sourceCapturedAt:input.capturedAt,
    sourceLicense:input.license,
    sourceRelease:input.release,
    homeAnchorWGS84:input.homeAnchor,
    localAxisConvention:"+X east, +Z south; axis angle clockwise from east, modulo 180 degrees",
    method:"longest straight polygon boundary edge, derived from sourced planar vertices",
    limits:"Polygon edge orientation is not facade/entrance facing; ML roofprints may merge multiple real buildings.",
    numberOfSourceRoofprintCandidates:footprints.length,
    verifiedIndependentRealBuildingCount:null,
    actualStreetWidthMeters:null,
    surveyedParkingBays:null,
    footprints
  };
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const report=auditRoofprints(JSON.parse(readFileSync(SOURCE_PATH,"utf8")));
  writeFileSync(REPORT_PATH,JSON.stringify(report,null,2)+"\n");
  process.stdout.write(`Audited ${report.numberOfSourceRoofprintCandidates} source roofprints; real house count unknown.\n`);
}
