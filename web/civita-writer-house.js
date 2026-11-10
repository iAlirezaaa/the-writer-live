/* MAYOR-069: reversible two-storey Civita-inspired writer exterior.
 * Architecture REFERENCE (not measured): golden volcanic tufa, gray peperino
 * lintels, timber, terracotta roof. Exact Lo Studio parcel and plan unknown.
 * The authored writer character/room are never created or modified here.
 */
/* MAYOR-076: Source-backed historical identity is distinct from an accurately
 * surveyed 3D mesh. The published shell remains an illustrative study and is
 * NOT a surveyed Lo Studio reconstruction or traversable Il Nuovo doorway.
 * This evidence record travels with the actual Three.js shell userData.
 */
export const CIVITA_WRITER_HOUSE_EVIDENCE=Object.freeze({
 styleSource:'The Civita Institute — Lo Studio, Il Nuovo and 2014 property plan',
 url:'https://www.civitainstitute.org/496/lo-studio.html',
 propertyPlanUrl:'https://www.civitainstitute.org/files/1128.pdf',
 independentConnectionSource:'https://www.civitainstitute.org/498/2024/09/il-nuovo.html',
 reconstructionStudySource:'https://www.civitainstitute.org/files/1156.pdf',
 officialPlanLotKey:'D',neighborPropertyPlanKey:'E',officialPlanNotToScale:true,
 candidateOsmWayId:464102189,cadastralParcelVerified:false,
 secondFloorConnectionToIlNuovoDocumented:true,
 secondFloorConnectionModeled:false,secondFloorConnectingDoorCoordinatesM:null,
 storyCountReference:2,sourceHouseFootprintKnown:false,
 matchedToActualLoStudio:false,facadeMeasuredWidthM:null,
 entranceMeasuredWidthM:null,entranceMeasuredHeightM:null,
 entranceThresholdSurveyedElevationM:null,thresholdVerticalDatum:null,
 heightMeasured:false,terrainElevationsMeasured:false,
 architecturalAccuracy:'interpretive-study',
 protectedWriterAppearance:true,physicalCollider:false
});

/* MAYOR-077: one original, deterministic, painted facade surface — not a
 * photograph, a surveyed masonry course, or a reconstruction of terrace
 * geometry. The official Institute photographs establish material/ivy presence.
 * No part of the original writer room, doors or collider is edited here.
 */
const facadesByThree=new WeakMap();
function makeLoStudioFacadeTexture(THREE,{w,h,storeyHeight,cutOpenings=true}){
 if(typeof document==='undefined'||!THREE?.CanvasTexture)return null;
 const key=[w,h,storeyHeight].map(n=>n.toFixed(3)).join(':')+':'+String(cutOpenings);
 let cache=facadesByThree.get(THREE);
 if(!cache){cache=new Map();facadesByThree.set(THREE,cache);}
 if(cache.has(key))return cache.get(key);
 const canvas=document.createElement('canvas');
 canvas.width=768;canvas.height=768;
 const ctx=canvas.getContext('2d');
 if(!ctx)return null;
 const W=canvas.width,H=canvas.height;
 let seed=0x51c17a;
 const rnd=()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296;};
 ctx.clearRect(0,0,W,H);
 // Irregular, quiet mortar and golden-tufa weathering: one continuous atlas
 // across separately modelled facade wall segments, never pasted photography.
 for(let row=0;row<18;row++){
  const y=row*H/18,step=51;
  ctx.strokeStyle='rgba(53,45,32,.32)';ctx.lineWidth=1.7;
  ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y+1);ctx.stroke();
  for(let x=-(row%2)*step/2;x<W;x+=step*(.78+rnd()*.4)){
   const width=step*(.8+rnd()*.38),height=H/18-3;
   ctx.fillStyle=['rgba(243,202,137,.09)','rgba(75,54,38,.075)','rgba(255,226,172,.07)'][Math.floor(rnd()*3)];
   ctx.fillRect(x+2,y+2,width-3,height-2);
   ctx.strokeStyle='rgba(62,54,42,.28)';
   ctx.beginPath();ctx.moveTo(x,y+1);ctx.lineTo(x+1+rnd()*2,y+height+2);ctx.stroke();
  }
 }
 for(let n=0;n<500;n++){
  ctx.fillStyle=rnd()>.52?'rgba(78,64,47,.095)':'rgba(255,231,173,.10)';
  const x=rnd()*W,y=rnd()*H,r=1+rnd()*2;
  ctx.fillRect(x,y,r,1+rnd()*2);
 }
 // Hanging ivy is a visibly documented feature of Lo Studio. This atlas
 // shows an original stylisation with bounded leaves; no copied image pixels.
 const leafColors=['#344d2c','#4e6732','#5e743a','#748342','#3c5f31','#82904d'];
 function leaf(x,y,angle,size){
  ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.fillStyle=leafColors[Math.floor(rnd()*leafColors.length)];
  ctx.beginPath();ctx.moveTo(0,0);ctx.quadraticCurveTo(-size*.78,-size*.58,0,-size*1.18);
  ctx.quadraticCurveTo(size*.85,-size*.60,0,0);ctx.fill();
  ctx.strokeStyle='rgba(13,38,16,.27)';ctx.lineWidth=.65;
  ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(0,-size*.88);ctx.stroke();ctx.restore();
 }
 // Dense crown along the roof line and a right-hand ivy mass: lower masonry
 // and the historic window/door silhouettes remain readable.
 for(let i=0;i<420;i++){
  const x=rnd()*W,y=Math.pow(rnd(),1.65)*H*.29;
  leaf(x,y,(rnd()-.5)*2.7,8+rnd()*12);
 }
 for(let s=0;s<21;s++){
  let x=(s+.25+rnd()*.5)*W/21,y=rnd()*H*.05;
  const length=H*(.16+rnd()*.48)*(s%4===0?1.16:.75);
  const links=15+Math.floor(rnd()*13),turn=(rnd()-.5)*.7;
  ctx.strokeStyle='#45532b';ctx.lineWidth=2+rnd()*1.8;
  ctx.beginPath();ctx.moveTo(x,y);
  for(let k=0;k<links;k++){
   y+=length/links;x+=Math.sin(k*.62+s)*4+turn;
   ctx.lineTo(x,y);
   leaf(x-4-rnd()*12,y,(rnd()-.5)*1.6,6+rnd()*10);
   leaf(x+4+rnd()*12,y,(rnd()-.5)*1.6,6+rnd()*10);
  }
  ctx.stroke();
 }
 for(let i=0;i<235;i++){
  const x=W*(.77+rnd()*.22),y=H*(.15+rnd()*.76);
  leaf(x,y,(rnd()-.5)*3,6+rnd()*10);
 }
 // The builder's illustrative openings MUST remain clear in the atlas;
 // these positions follow existing proxy code, not a measured facade survey.
 const panelW=w-.38,panelH=h-.20;
 function clearOpening(x,bottom,width,height){
  const left=(x-width/2+panelW/2)/panelW*W;
  const top=(h-.10-bottom-height)/panelH*H;
  const ww=width/panelW*W,hh=height/panelH*H;
  ctx.clearRect(left-8,top-9,ww+16,hh+18);
 }
 if(cutOpenings){
  clearOpening(-1.22,0,1.10,2.24);
  clearOpening(1.55,.88,1.12,1.22);
  clearOpening(.85,storeyHeight+1.0,1.35,1.40);
 }
 const texture=new THREE.CanvasTexture(canvas);
 if(THREE.SRGBColorSpace)texture.colorSpace=THREE.SRGBColorSpace;
 texture.anisotropy=4;
 cache.set(key,texture);
 return texture;
}

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

 // One bounded, non-colliding painted masonry/ivy surface. No protruding
 // pergola, new terrace, structural infill or speculative historical doors.
 const atlas=makeLoStudioFacadeTexture(THREE,{w,h,storeyHeight});
 const ivyOverlay=new THREE.Mesh(
  new THREE.PlaneGeometry(w-.38,h-.20),
  new THREE.MeshBasicMaterial({
   map:atlas,transparent:true,opacity:atlas?1:0,depthWrite:false,
   alphaTest:.05,polygonOffset:true,polygonOffsetFactor:-1
  })
 );
 ivyOverlay.name='lo-studio-tufa-ivy-facade-study';
 ivyOverlay.position.set(0,y0+h/2,front+.145);
 ivyOverlay.userData={
  architectureStudy:true,surfaceOnly:true,physicalCollider:false,
  reference:'https://www.civitainstitute.org/496/lo-studio.html',
  originalProceduralAtlas:true,measuredStoneCourse:false,actualIvyExtentVerified:false
 };
 ivyOverlay.castShadow=false;ivyOverlay.receiveShadow=false;
 shell.add(ivyOverlay);
 // The public starting camera views the opposite side of this rotated house.
 // Give that wall the same interpretive tufa/ivy finish without inventing a
 // second actual door. Its vegetation distribution is not survey-confirmed.
 const rearAtlas=makeLoStudioFacadeTexture(THREE,{w,h,storeyHeight,cutOpenings:false});
 const rearOverlay=new THREE.Mesh(
  new THREE.PlaneGeometry(w-.42,h-.22),
  new THREE.MeshBasicMaterial({
   map:rearAtlas,transparent:true,opacity:rearAtlas?1:0,depthWrite:false,
   alphaTest:.05,polygonOffset:true,polygonOffsetFactor:-1
  })
 );
 rearOverlay.name='lo-studio-tufa-ivy-rear-study';
 rearOverlay.position.set(0,y0+h/2,-d/2-.135);
 rearOverlay.rotation.y=Math.PI;
 rearOverlay.userData={
  architectureStudy:true,surfaceOnly:true,physicalCollider:false,
  originalProceduralAtlas:true,backWallVegetationExtentVerified:false,
  reference:'https://www.civitainstitute.org/496/lo-studio.html'
 };
 rearOverlay.castShadow=false;rearOverlay.receiveShadow=false;
 shell.add(rearOverlay);

 // True one-floor stair access has not been surveyed, so only an interaction marker.
 const clickArea=box('civita-writer-house-interactive-front',w,h,.05,
   new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}),0,y0+h/2,front+.37);
 entrance.userData.writerExterior=true;clickArea.userData.writerExterior=true;
 return {group:shell,entrance,clickArea,groundStepY:y0+.14,roomFloorY:y0+storeyHeight,roofRidgeY:eaveY+rise};
}
