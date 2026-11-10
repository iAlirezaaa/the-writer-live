/* MAYOR-069: reversible two-storey Civita-inspired writer exterior.
 * Architecture REFERENCE (not measured): golden volcanic tufa, gray peperino
 * lintels, timber, terracotta roof. Exact Lo Studio parcel and plan unknown.
 * The authored writer character/room are never created or modified here.
 */
export const CIVITA_WRITER_HOUSE_EVIDENCE=Object.freeze({
 styleSource:'Civita Institute – Lo Studio architectural description',
 url:'https://www.civitainstitute.org/496/lo-studio.html',
 storyCountReference:2,sourceHouseFootprintKnown:false,
 matchedToActualLoStudio:false,heightMeasured:false,
 terrainElevationsMeasured:false,architecturalAccuracy:'interpretive-study',
 protectedWriterAppearance:true,physicalCollider:false
});
export function buildCivitaWriterExterior(THREE,parent,{
 roomWidth=6,roomDepth=6,streetY=-3,parentOffsetY=3.2,storeyHeight=3.2
}={}){
 if(!THREE?.Group||!parent?.add||![roomWidth,roomDepth,streetY,parentOffsetY,storeyHeight].every(Number.isFinite))throw new TypeError('Invalid writer exterior');
 if(roomWidth<5.7||roomDepth<5.7||storeyHeight<2.8)throw new RangeError('Writer interior clearance insufficient');
 const shell=new THREE.Group();
 shell.name='civita-writer-house-tufa-exterior-study';
 shell.userData.cityArchitectureEvidence={...CIVITA_WRITER_HOUSE_EVIDENCE,roomWidth,roomDepth,unit:'meters'};
 parent.add(shell);
 // The sourced candidate parcel is narrow. Keep the entire exterior, eaves,
 // plinth and threshold within its validated OSM way/464102189 outline at stage 0.
 // These are adaptive study dimensions, not surveyed historical facade widths.
 const w=roomWidth+.32,d=roomDepth+.28,h=storeyHeight*2,y0=streetY-parentOffsetY;
 const tufa=new THREE.MeshStandardMaterial({color:0xbca17d,roughness:1}),
       tufaEdge=new THREE.MeshStandardMaterial({color:0x9a7a5c,roughness:1}),
       stone=new THREE.MeshStandardMaterial({color:0x8a8a82,roughness:.92}),
       timber=new THREE.MeshStandardMaterial({color:0x594132,roughness:.93}),
       glass=new THREE.MeshStandardMaterial({color:0x60747a,roughness:.28,metalness:.03}),
       terra=new THREE.MeshStandardMaterial({color:0xa75f48,roughness:.94});
 function box(name,bw,bh,bd,mat,x,y,z){
  const m=new THREE.Mesh(new THREE.BoxGeometry(bw,bh,bd),mat);
  m.name=name;m.position.set(x,y,z);m.castShadow=false;m.receiveShadow=true;
  m.userData.architectureStudy=true;shell.add(m);return m;
 }
 // Continuous foundation and stone side/rear walls (single shared material).
 box('tufa-ground-plinth',w+.06,.23,d+.06,tufaEdge,0,y0+.10,0);
 for(const x of [-w/2,w/2])box('tufa-side-wall',.23,h,d,tufa,x,y0+h/2,0);
 box('tufa-rear-wall',w,h,.23,tufa,0,y0+h/2,-d/2);
 const front=d/2+.04;
 // Two-storey historic front has real openings in the wall masonry.
 const doorX=-1.22,doorW=1.10,doorH=2.24;
 const groundWindowX=1.55,groundWindowW=1.12,groundSill=.88,groundWindowH=1.22;
 const spans=[[-w/2,doorX-doorW/2],[doorX+doorW/2,groundWindowX-groundWindowW/2],
  [groundWindowX+groundWindowW/2,w/2]];
 for(const [a,b] of spans)if(b>a)box('tufa-ground-wall',b-a,storeyHeight,.23,tufa,(a+b)/2,y0+storeyHeight/2,front);
 box('tufa-door-architrave',doorW,storeyHeight-doorH,.23,tufa,doorX,y0+(doorH+storeyHeight)/2,front);
 box('tufa-ground-window-sill-wall',groundWindowW,groundSill,.23,tufa,groundWindowX,y0+groundSill/2,front);
 box('tufa-ground-window-spandrel',groundWindowW,storeyHeight-groundSill-groundWindowH,.23,tufa,groundWindowX,y0+(storeyHeight+groundSill+groundWindowH)/2,front);
 // Upper storey at the exact authored writer-room floor plane.
 const upperSill=1.0,upperWindowH=1.4,upperX=.85,upperW=1.35;
 for(const [a,b] of [[-w/2,upperX-upperW/2],[upperX+upperW/2,w/2]])
  box('tufa-upper-wall',b-a,storeyHeight,.23,tufa,(a+b)/2,y0+storeyHeight*1.5,front);
 box('tufa-upper-window-sill',upperW,upperSill,.23,tufa,upperX,y0+storeyHeight+upperSill/2,front);
 box('tufa-upper-window-head',upperW,storeyHeight-upperSill-upperWindowH,.23,tufa,upperX,y0+storeyHeight+(upperSill+upperWindowH+storeyHeight)/2,front);
 const frame=(prefix,x,y,width,height)=>{
  box(prefix+'-sill',width+.24,.15,.28,stone,x,y,front+.14);
  box(prefix+'-lintel',width+.30,.20,.3,stone,x,y+height,front+.14);
  for(const s of [-1,1])box(prefix+'-jamb',.14,height,.28,stone,x+s*(width/2+.08),y+height/2,front+.14);
  box(prefix+'-glass',width-.10,height-.15,.065,glass,x,y+height/2,front+.16);
  box(prefix+'-timber-mullion',.07,height,.10,timber,x,y+height/2,front+.22);
 };
 frame('peperino-ground',groundWindowX,y0+groundSill,groundWindowW,groundWindowH);
 frame('peperino-upper',upperX,y0+storeyHeight+upperSill,upperW,upperWindowH);
 // Old crafted chestnut entrance, functional clickable portal and ground step.
 const entrance=box('civita-writer-front-door',doorW-.12,doorH,.10,timber,doorX,y0+doorH/2,front+.17);
 box('peperino-door-lintel',doorW+.28,.20,.40,stone,doorX,y0+doorH+.07,front+.14);
 for(const side of [-1,1])box('peperino-door-jamb',.15,doorH,.34,stone,doorX+side*(doorW/2+.03),y0+doorH/2,front+.14);
 box('tufa-entry-step',doorW+.26,.14,.18,stone,doorX,y0+.07,front+.06);
 // Clay roof has two connected planes, proper eaves and readable silhouette.
 const overhang=.08,halfSpan=w/2+overhang,rise=1.12,sloped=Math.hypot(halfSpan,rise),theta=Math.atan2(rise,halfSpan);
 const eaveY=y0+h+.12;
 for(const dir of [-1,1]){
  const r=box('terracotta-sloped-roof-'+dir,sloped,.20,d+.20,terra,dir*halfSpan/2,eaveY+rise/2,0);
  r.rotation.z=-dir*theta;
  // A timber eave line makes the structural join visually legible.
  box('chestnut-eave-'+dir,.13,.17,d+.22,timber,dir*halfSpan,eaveY-.10,0);
 }
 box('terracotta-ridge',.24,.26,d+.25,tufaEdge,0,eaveY+rise+.02,0);
 // True one-floor stair access has not been surveyed, so only an interaction marker.
 const clickArea=box('civita-writer-house-interactive-front',w,h,.05,
   new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}),0,y0+h/2,front+.37);
 entrance.userData.writerExterior=true;clickArea.userData.writerExterior=true;
 return {group:shell,entrance,clickArea,groundStepY:y0+.14,roomFloorY:y0+storeyHeight,roofRidgeY:eaveY+rise};
}
