/* Civita-author room plan: retain existing writer's 6x6 interior footprint and
 * camera/contact geometry exactly. The earlier Tehran street/parcels do NOT
 * belong in this module. Exterior is independently built and provisional.
 */
export const WRITER_HOME_BLUEPRINT=Object.freeze({
 room:{width:6,depth:6,height:3.2},
 facade:{door:{x:-1.2,width:.86,height:2.10,zSide:'front'},
  frontWindow:{x:1.45,width:1.08,height:1.04,sill:1.05},
  rearWindow:{x0:-1.6,x1:.4,y0:1.0,y1:2.5},
  roof:{rise:.96,color:0xa75f48}},
 colors:{plaster:0xd8c8b0,timber:0x563b29,slate:0x56616a,glass:0xbfd4e6},
 floorStages:Object.freeze([[6,6],[6.2,6.05],[6.4,6.1],[6.7,6.15],[7,6.2]])
});
export function writerHouseLevel(accepted=0){
 const n=Math.max(0,Number(accepted)||0);
 return n>=40?4:n>=20?3:n>=10?2:n>=4?1:0;
}
export function writerHouseDimensions(level=0){
 const sizes=WRITER_HOME_BLUEPRINT.floorStages;
 return sizes[Math.max(0,Math.min(4,Math.floor(level)))]||sizes[0];
}
