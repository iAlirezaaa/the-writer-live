/* MAYOR-049: prove a machine-learning mapped roofprint is NOT one house.
 * node tests/tehran_building_orientation_source_audit_probe.mjs [site-root]
 */
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
const root=resolve(process.argv[2]||".");
const read=path=>readFileSync(resolve(root,path),"utf8");
const source=await import("data:text/javascript;base64,"+
  Buffer.from(read("web/writer-block-building-data.js")).toString("base64"));
const geometry=source.WRITER_BLOCK_BUILDING_SOURCE;
const audit=JSON.parse(read("city/buildings/writer-block-orientation-audit.json"));
assert.equal(audit.sourcePolygonCandidateCount,4);
assert.equal(geometry.buildings.length,4);
assert.equal(audit.sourceCapturedAt,geometry.capturedAt);
assert.equal(audit.license,geometry.license);
for(const key of ["verifiedDistinctPhysicalBuildings",
 "verifiedResidentialHouses","verifiedApartmentUnitCount","verifiedBuiltFloorCounts"])
  assert.equal(audit[key],null,"Do not invent numbers for actual homes/units");
assert.ok(audit.warning.includes("MUST NOT"));
for(const record of audit.polygons){
  const b=geometry.buildings.find(b=>b.id===record.sourceId);
  assert.ok(b,"Source polygon disappeared from immutable Overture mapping");
  const ring=b.ringsLocalXZ[0];
  let longest=null;
  for(let i=0;i<ring.length-1;i++){
    const dx=ring[i+1][0]-ring[i][0],dz=ring[i+1][1]-ring[i][1];
    const m=Math.hypot(dx,dz);
    if(!longest||m>longest.length)
      longest={length:m,bearing:(Math.atan2(dx,-dz)*180/Math.PI+360)%180};
  }
  assert.ok(Math.abs(record.longestMappedEdgeMeters-longest.length)<.01);
  assert.ok(Math.abs(record.outlineAxisAzimuthDegreesFromNorth-
    Math.round(longest.bearing*10)/10)<.11);
  assert.equal(record.footprintAreaSqmSource,b.areaSquareMeters);
  assert.equal(record.actualPhysicalBuildingCountKnown,false);
  assert.equal(record.entranceOrientationKnown,false);
  assert.equal(record.numberOfIndividualHomes,null);
  assert.equal(record.numberOfApartmentUnits,null);
  assert.equal(record.actualBuildingFloors,null);
  assert.equal(record.actualBuildingHeightM,null);
}
console.log("TEHRAN-BUILDING-SOURCE-ORIENTATION-AUDIT-OK",JSON.stringify({
  sourceRoofprintPolygons:4,actualHomesCountKnown:false,
  entranceDirectionKnown:false,sourceAxisAnglesDegrees:audit.polygons.map(
    p=>p.outlineAxisAzimuthDegreesFromNorth)
}));
