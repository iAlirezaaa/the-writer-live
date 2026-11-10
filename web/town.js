/* The Writer — active Civita-only city entry, MAYOR-069.
 * The prior Tehran/procedural city has been RETIRED from main.
 * Its complete recoverable source is preserved solely in historical Git backups.
 * This town module never edits the author figure, publisher data or stories.
 */
import {buildCivitaTown} from './town-civita.js?v=civita-main-20261110-v3';
export const STREET_Y=-3;
export const ACTIVE_CITY='Civita di Bagnoregio';
export function nightLighting(day){
 const daylight=Math.max(0,Math.min(1,Number(day)||0));
 return {hemisphere:.85+daylight*.5,celestial:.65+daylight*1.2,
  fill:.45+(1-daylight)*.25,street:(1-daylight)*7};
}
export function buildTown({THREE,scene,clickable,canvasTex,mapMode='civita'}={}){
 if(mapMode!=='civita')throw new TypeError('Retired Tehran map mode is not available in the active Civita build; use the frozen historical backup for rollback');
 return buildCivitaTown({THREE,scene,streetY:STREET_Y,clickable,canvasTex});
}
