/* MAYOR-046 — user-authored floor-3 writer apartment scaffold.
 * Evidence tier: OWNER_AUTHORED_SCENARIO, not an actual Tehran floor record.
 * The protected, already-furnished room is NOT rebuilt by this module.
 * Existing room is preserved intact by its own world.js parent.
 */
export const WRITER_APARTMENT_FLOOR_INDEX=3;
export const WRITER_APARTMENT_STOREY_HEIGHT=3.2;
export const WRITER_APARTMENT_LEVEL_OFFSET=
  WRITER_APARTMENT_FLOOR_INDEX*WRITER_APARTMENT_STOREY_HEIGHT;
export const WRITER_APARTMENT_EVIDENCE=Object.freeze({
  type:"OWNER_AUTHORED_SCENARIO",
  anchorWGS84:Object.freeze({lat:35.715361987616696,lon:51.3642455031707}),
  simulatedFloorIndex:3,
  sourceBuildingFloorsVerified:false,
  apartmentUnitCountVerified:false,
  realElevatorOrStairsSurveyed:false,
  representativeBuilding: "writer-origin-protected-room",
  floorHeightIsSurveyed:false,
  physicalCollider:false,
  citizenPathsChanged:false,
  roomRebuiltOrDeleted:false
});
export function apartmentFloorElevation(streetY=-3){
  if(!Number.isFinite(streetY))throw new TypeError("Street elevation is invalid");
  return streetY+WRITER_APARTMENT_LEVEL_OFFSET;
}
export function buildWriterApartmentLowerStoreys(THREE,parent,{
  streetY=-3,roomWidth=6,roomDepth=6,storeyHeight=WRITER_APARTMENT_STOREY_HEIGHT,
  upperFloorIndex=WRITER_APARTMENT_FLOOR_INDEX
}={}){
  if(!THREE?.Group||!parent?.add||!Number.isFinite(streetY)||
    !Number.isFinite(roomWidth)||!Number.isFinite(roomDepth)||
    roomWidth<5.7||roomDepth<5.7||storeyHeight!==3.2||upperFloorIndex!==3)
    throw new TypeError("Apartment ground-to-third-floor contract changed");
  const group=new THREE.Group();group.name="writer-apartment-below-third-floor-proxy";
  group.userData.cityApartmentEvidence={
    ...WRITER_APARTMENT_EVIDENCE,simulatedLevels:Object.freeze([0,1,2,3]),
    parentRoomElevation:apartmentFloorElevation(streetY),baseWorldY:streetY,
    structuralProxy: true, roomRootNotModifiedHere:true,
    accessVisualOnly:true, physicalCollider:false
  };
  const width=Math.max(roomWidth+1.45,7.75),
    depth=Math.max(roomDepth+1.0,7.0),
    front=depth/2;
  const wall=new THREE.MeshStandardMaterial({color:0xbab4a9,roughness:.91}),
    edge=new THREE.MeshStandardMaterial({color:0x8a8277,roughness:.86}),
    frame=new THREE.MeshStandardMaterial({color:0x5b625f,roughness:.70,metalness:.12}),
    glass=new THREE.MeshStandardMaterial({color:0x617e86,roughness:.37,metalness:.13}),
    doors=new THREE.MeshStandardMaterial({color:0x424a4e,roughness:.55,metalness:.10});
  const box=(name,w,h,d,mat,x,y,z)=>{
    const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);
    m.name=name;m.position.set(x,y,z);
    m.castShadow=false;m.receiveShadow=true;
    m.userData.cityApartmentEvidence={illustrativeOnly:true,physicalCollider:false,
      realConstructionVerified:false};
    group.add(m);return m;
  };
  // parent (writerExterior) is shifted up by FLOOR_INDEX * height.
  // Place the illustrative lower levels below its third-floor local datum.
  const localGround=streetY-upperFloorIndex*storeyHeight;
  for(let floor=0;floor<upperFloorIndex;floor++){
    const y=localGround+floor*storeyHeight;
    box("writer-apartment-level-"+floor+"-floor",width,.18,depth,edge,
      0,y+.055,0);
    // Balancing frame + setback is representative, not a verified building part.
    box("writer-apartment-level-"+floor+"-rear",width,storeyHeight-.19,.14,wall,
      0,y+storeyHeight/2,-depth/2);
    for(const sign of [-1,1])
      box("writer-apartment-level-"+floor+"-side-"+sign,.16,storeyHeight-.19,depth,
        wall,sign*width/2,y+storeyHeight/2,0);
    box("writer-apartment-level-"+floor+"-front-wall",width,storeyHeight-.15,.14,wall,
      0,y+storeyHeight/2,front);
    box("writer-apartment-level-"+floor+"-front-band",width,.36,.17,edge,
      0,y+storeyHeight-.20,front);
    box("writer-apartment-level-"+floor+"-front-plinth",width,.42,.18,wall,
      0,y+.26,front);
    const bayX=[-width*.28,0,width*.28];
    for(let q=0;q<bayX.length;q++){
      const x=bayX[q];
      box("writer-apartment-level-"+floor+"-window-"+q,1.35,1.37,.045,glass,
        x,y+1.67,front+.09);
      box("writer-apartment-level-"+floor+"-window-frame-top-"+q,1.5,.11,.22,frame,
        x,y+2.41,front+.12);
      box("writer-apartment-level-"+floor+"-window-frame-bottom-"+q,1.5,.11,.22,frame,
        x,y+.95,front+.12);
      for(const v of [-1,1])box("writer-apartment-level-"+floor+"-frame-"+q+"-"+v,
        .10,1.46,.22,frame,x+v*.74,y+1.67,front+.12);
    }
  }
  // Concrete/stone lower lobby: only this has street contact.
  box("writer-apartment-street-lobby",1.48,2.25,.13,doors,
    -1.2,localGround+1.15,front+.14);
  box("writer-apartment-street-step",1.76,.12,1.20,edge,
    -1.2,localGround+.065,front+.77);
  // A non-navigable generic vertical access volume connects the third-floor
  // entrance to the street lobby. It must NOT be added to traffic/citizen paths.
  const shaftX=width/2-.59;
  box("writer-apartment-stair-shaft",1.15,storeyHeight*3-.32,1.25,wall,
    shaftX,localGround+storeyHeight*1.5,front+.73);
  for(let f=0;f<upperFloorIndex;f++){
    const y=localGround+f*storeyHeight;
    box("writer-apartment-stair-landing-"+f,1.25,.12,1.35,edge,
      shaftX,y+storeyHeight-.08,front+.73);
  }
  // Room's front door at x=-1.2 remains reachable as an interactive camera
  // action, not through fabricated citizen stairway routing.
  box("writer-apartment-third-floor-access-landing",
    width-.9,.15,1.45,edge,0,localGround+upperFloorIndex*storeyHeight-.08,front+.65);
  const bottom=new THREE.Box3().setFromObject(group);
  if(![...bottom.min,...bottom.max].every(Number.isFinite))
    throw new Error("Apartment proxy has invalid geometry");
  parent.add(group);
  return {group,storeyHeight,simulatedStoreys:4,planWidth:width,
    floorWorldY:apartmentFloorElevation(streetY)};
}
