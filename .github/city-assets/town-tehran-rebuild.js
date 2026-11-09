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
import { buildWriterBlockBuildingMasses } from "./writer-block-buildings.js?v=writer-block-sourced-buildings-20261109-v1";
import { buildWriterBlockBuilding01 } from "./writer-block-building-01.js?v=tehran-building-by-building-01-20261109-v1";

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
    authorRoomProtected:true,
    urbanLayout:"clean-source-only-from-scratch"
  };
  // Only true OSM four road centerline frame; the translucent upper ledges
  // and inward sidewalk widths are schematic, not topographic road surveys.
  const streets=buildWriterBlockStreetFrame(THREE,group,{streetY,canvasTex});
  const terrain=buildWriterBlockTerrain(THREE,group,{streetY,reliefVisible:false});
  // True aerial plan lines, as opposed to residential architecture invented
  // outside licensed footprints. Terrain contours remain a coarse DEM overlay.
  const footprintMasses=buildWriterBlockBuildingMasses(THREE,group,{streetY});
  const building01=buildWriterBlockBuilding01(THREE,group,{streetY});
  if(footprintMasses.plan.length!==4||
     footprintMasses.group.userData.citySurvey.generatedVolumeCount!==2||
     footprintMasses.group.userData.citySurvey.independentlyModeledCount!==1||
     footprintMasses.group.userData.citySurvey.ignoredRoomCollisionCount!==1||
     building01.plan.measuredHeightMeters!==null||
     !streets.group.getObjectByName("writer-block-osm-4-street-pavement"))
    throw new Error("Sourced city evidence changed; stop rather than invent replacement buildings");
  if(group.children.length!==4)
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
      // All reconstructed elements are static until street crossing and
      // elevation surveys support navigable real routes. Global Tehran
      // daylight and Open-Meteo still update independently in world.js.
      return undefined;
    }
  };
}
