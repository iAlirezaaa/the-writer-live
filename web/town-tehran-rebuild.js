/* MAYOR-038 — SOURCE-ONLY TEHRAN WRITER BLOCK.
 *
 * Replaces the OLD VISUAL town at the root: no fictional shopfronts,
 * housing blocks, 432-person proxy estate, invented gardens, mountains,
 * orthogonal road network, vehicle models, decorative filler or vendor props.
 *
 * Source geometry: 2026-11-09 OSM road centerline candidate boundary,
 * Overture ODbL roofprints and NASA/USGS SRTM30 (EGM96, coarse).
 * Paving widths and roof heights are NOT measured and stay flagged as proxies.
 *
 * The writer's actual room and its exterior are assembled separately by
 * web/world.js; NEVER remove or parent them under this disposable city root.
 * Reuse the same THREE instance and view clock; do not edit citizens' core
 * identities, routes, memories, publishing, story data or real snapshots.
 */
import { buildWriterBlockStreetFrame } from "./writer-block-street-frame.js?v=writer-block-4-roads-20261109-v1";
import { buildWriterBlockTerrain } from "./writer-block-terrain.js?v=writer-block-dem-contours-20261109-v1";
import { buildWriterBlockBuildingMasses } from "./writer-block-buildings.js?v=writer-block-sourced-buildings-20261109-v3";
import { buildWriterBlockBuilding01 } from "./writer-block-building-01.js?v=tehran-building-by-building-01-20261109-v1";
import { buildWriterBlockBuilding02 } from "./writer-block-building-02.js?v=tehran-source-building-02-20261109-v1";

import { buildWriterBlockBuilding03 } from "./writer-block-building-03.js?v=tehran-source-building-03-20261109-v1";
import { buildWriterBlockContext } from "./writer-block-illustrative-context.js?v=writer-block-illustrative-context-20261110-v3";
import { attachIllustrativeFacades } from "./writer-block-facade-preview.js?v=writer-block-facade-illustration-20261109-v1";
import { buildWriterBlockRoadRegulations } from "./writer-block-road-regulations.js?v=writer-block-osm-regulations-20261109-v1";
import { buildSatarkhanEastRoadCorridor } from "./writer-satarkhan-osm-corridor.js?v=writer-satarkhan-east-osm-20261109-v3";

export const WRITER_BLOCK_REBUILD_VERSION="writer-block-source-only-20261109-v1";
export const WRITER_BLOCK_REBUILD_RULES=Object.freeze({
  scope:"one documented writer block containing WGS84 35.715361987616696,51.3642455031707",
  defaultTownMode:"source-only",
  sourceRoadWays:4,
  mapRoofprints:4,
  sourcedBuildingHeights:0,
  inferredLegacyBuildings:0,
  retainedLegacyCityMeshes:0,
  imaginaryMountainOrForestMeshes:0,
  physicalCollisionRoadsAdded:0,
  addedCars:0,
  writerRoomOwnedBy:"web/world.js:writerInteriorWorldRoot",
  writerExteriorOwnedBy:"web/world.js:writerExterior",
  legacyDiagnosticOnly:true
});
export function buildTehranReconstructionTown({
  THREE,scene,canvasTex,streetY=-3
}){
  if(!THREE?.Group||!scene?.add||!Number.isFinite(streetY))
    throw new TypeError("Rebuild requires existing Three.js scene and street datum");
  const group=new THREE.Group();
  group.name="town"; // retains old entry-point contract, but all old meshes removed
  group.userData.cityBuild={
    ...WRITER_BLOCK_REBUILD_RULES,
    actualCopyOneToOne:false,
    realStreetCenterlines:true,
    roadWidthsAndCurbsMeasured:false,
    roofprintsMayMergeSeveralBuildings:true,
    realBuildingHeightsMeasured:false,
    sourceSnapshotDate:"2026-11-09",
    sourceLicenses:["ODbL-1.0","NASA/USGS SRTM"],
    noPhysicsOrCitizenPathMigration:true,
    sourcedSpeedLimitWayCount:4,
    adjacentLicensedOSMWayFragments:6,
    parkSatarkhanPolygonMapped:false,
    connectsRealSattarkhanPrimaryWay:true,
    realRoadSignLocationsKnown:false,
    authorRoomProtected:true,
    urbanLayout:"clean-source-only-from-scratch"
  };
  // Only true OSM four road centerline frame; the translucent upper ledges
  // and inward sidewalk widths are schematic, not topographic road surveys.
  const streets=buildWriterBlockStreetFrame(THREE,group,{streetY,canvasTex});
  // OSM 30 km/h and oneway TAG evidence; glyph locations are map annotations, not surveyed signs.
  const roadRegulations=buildWriterBlockRoadRegulations(THREE,group,{streetY,canvasTex});
  // First user-approved expansion: exact OSM way strips along real alleys to
  // Sattarkhan primary street, with all width/sidewalks still visual proxies.
  const eastCorridor=buildSatarkhanEastRoadCorridor(THREE,group,{streetY,canvasTex});
  const terrain=buildWriterBlockTerrain(THREE,group,{streetY,reliefVisible:false});
  // True aerial plan lines, as opposed to residential architecture invented
  // outside licensed footprints. Terrain contours remain a coarse DEM overlay.
  const footprintMasses=buildWriterBlockBuildingMasses(THREE,group,{streetY,independentBuilding03:true});
  const building01=buildWriterBlockBuilding01(THREE,group,{streetY});
  const building02=buildWriterBlockBuilding02(THREE,group,{streetY});
  const building03=buildWriterBlockBuilding03(THREE,group,{streetY});
  // Optional-to-replace, always labeled interpretive context: no surveyed tree/parking/lamps.
  const context=buildWriterBlockContext(THREE,group,{streetY});
  const facadePreview=attachIllustrativeFacades(THREE,[building01,building02,building03],{streetY});
  if(footprintMasses.plan.length!==4||
     footprintMasses.group.userData.citySurvey.generatedVolumeCount!==0||
     footprintMasses.group.userData.citySurvey.independentlyModeledCount!==3||
     footprintMasses.group.userData.citySurvey.ignoredRoomCollisionCount!==1||
     building01.plan.measuredHeightMeters!==null||
     building02.plan.measuredHeightMeters!==null||
     building03.plan.measuredHeightMeters!==null||
     roadRegulations.plan.facts.length!==4||
     eastCorridor.topology.mainStreetConnected!==true||
     eastCorridor.group.userData.cityCorridorEvidence.parkReached!==false||
     roadRegulations.group.userData.cityRoadEvidence.physicalCollider!==false||
     !streets.group.getObjectByName("writer-block-osm-4-street-pavement"))
    throw new Error("Sourced city evidence changed; stop rather than invent replacement buildings");
  if(group.children.length!==9||context.group.userData.cityContextEvidence.physicalCollider!==false)
    throw new Error("Unexpected old fictional objects attached to source-only map");
  scene.add(group);
  return {
    group,
    // Older publisher/bookstore/house city meshes are intentionally gone.
    // Existing author UI panels and citizen data live outside this town root.
    districts:null,
    growth:null,
    trafficState(){return [];}, // no obsolete car bodies on the new OSM map
    update(day, elapsed, crossingDemand=false,weather=null){
      // Interpretive lamp emission follows the existing daylight input, not a separate clock.
      // No traffic, route, citizen, building or writer state is updated here.
      context.update(day);
      facadePreview.update(day);
      return undefined;
    }
  };
}
