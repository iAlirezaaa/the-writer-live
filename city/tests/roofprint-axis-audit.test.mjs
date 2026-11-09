import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  auditRoofprints, SOURCE_PATH, REPORT_PATH
} from "../survey/audit-writer-block-roofprint-axes.mjs";

const source=JSON.parse(readFileSync(SOURCE_PATH,"utf8"));

test("licensed snapshot yields four source roofprints, not an asserted house count",()=>{
  const result=auditRoofprints(source);
  assert.equal(result.numberOfSourceRoofprintCandidates,4);
  assert.equal(result.verifiedIndependentRealBuildingCount,null);
  assert.equal(result.actualStreetWidthMeters,null);
  assert.equal(result.surveyedParkingBays,null);
  assert.equal(new Set(result.footprints.map(p=>p.sourceId)).size,4);
  for(const p of result.footprints){
    assert.ok(p.roofprintEdgeAxisDegrees>=0 && p.roofprintEdgeAxisDegrees<180);
    assert.ok(p.longestBoundaryEdgeLengthMeters>0);
    assert.ok(Math.abs(p.calculatedAreaSquareMeters-p.roofprintAreaSquareMeters)<=0.1);
    assert.equal(p.entranceDirectionDegrees,null);
    assert.equal(p.actualRealBuildingCountRepresented,null);
  }
});

test("committed audit matches actual source geometry",()=>{
  const report=JSON.parse(readFileSync(REPORT_PATH,"utf8"));
  assert.deepEqual(report,auditRoofprints(source));
});

test("rejects duplicated source IDs",()=>{
  const broken=structuredClone(source);
  broken.buildings[1].id=broken.buildings[0].id;
  assert.throws(()=>auditRoofprints(broken),/repeated source feature id/);
});

test("rejects unclosed, nonfinite and degenerate roofprints",()=>{
  const unclosed=structuredClone(source);
  unclosed.buildings[0].ringsLocalXZ[0][0][0]+=3;
  assert.throws(()=>auditRoofprints(unclosed),/not closed/);
  const nonfinite=structuredClone(source);
  nonfinite.buildings[0].ringsLocalXZ[0][1][0]=null;
  assert.throws(()=>auditRoofprints(nonfinite),/Nonfinite/);
  const flat=structuredClone(source);
  flat.buildings[0].ringsLocalXZ[0]=[[0,0],[1,0],[2,0],[0,0]];
  assert.throws(()=>auditRoofprints(flat),/Degenerate/);
});
