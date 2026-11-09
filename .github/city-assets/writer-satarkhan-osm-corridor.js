/* MAYOR-047: bounded real OSM way centerlines from writer block toward Satarkhan main.
 * Road widths and border/sidewalk aprons are illustrative, NOT measured road edges.
 * Source: city/survey/output/writer-block-survey.json ODbL captured 2026-11-09.
 */
export const SATARKHAN_CORRIDOR_SOURCE = Object.freeze({
  file:"city/survey/output/writer-block-survey.json",
  capturedAt:"2026-11-09T09:22:58.743Z",
  license:"ODbL-1.0",
  attribution:"© OpenStreetMap contributors",
  sourceWayCount:6,geometryTier:"OSM_CENTERLINE_CANDIDATE",
  realRoadWidthsMeasured:false,actualSidewalksMapped:false,
  reachedNamedMainRoad:true,parkGeometryReached:false,parkWayCandidate:448551081
});
export const SATARKHAN_CORRIDOR_WAYS = Object.freeze([
  {
    "wayId": 36697706,
    "name": "پنجم دریان‌ نو",
    "highway": "residential",
    "maxspeed": "30",
    "oneway": "yes",
    "sourceStart": 0,
    "sourceEnd": 1,
    "localXZ": [
      [
        59.703,
        53.711
      ],
      [
        167.753,
        43.171
      ]
    ]
  },
  {
    "wayId": 92200441,
    "name": "ششم دریان نو",
    "highway": "residential",
    "maxspeed": "30",
    "oneway": null,
    "sourceStart": 0,
    "sourceEnd": 1,
    "localXZ": [
      [
        47.659,
        11.427
      ],
      [
        195.134,
        -28.505
      ]
    ]
  },
  {
    "wayId": 481439240,
    "name": "نهم دریان نو",
    "highway": "residential",
    "maxspeed": "30",
    "oneway": "no",
    "sourceStart": 0,
    "sourceEnd": 2,
    "localXZ": [
      [
        17.554,
        -94.212
      ],
      [
        144.959,
        -129.018
      ],
      [
        152.823,
        -131.038
      ]
    ]
  },
  {
    "wayId": 471546873,
    "name": "علی نبی پور",
    "highway": "residential",
    "maxspeed": "30",
    "oneway": "yes",
    "sourceStart": 2,
    "sourceEnd": 5,
    "localXZ": [
      [
        167.753,
        43.171
      ],
      [
        195.134,
        -28.505
      ],
      [
        204.3,
        -51.495
      ],
      [
        207.576,
        -58.973
      ]
    ]
  },
  {
    "wayId": 207742970,
    "name": "ستارخان",
    "highway": "primary",
    "maxspeed": "50",
    "oneway": "yes",
    "sourceStart": 18,
    "sourceEnd": 22,
    "localXZ": [
      [
        145.71,
        -140.291
      ],
      [
        152.823,
        -131.038
      ],
      [
        193.596,
        -77.159
      ],
      [
        207.576,
        -58.973
      ],
      [
        224.714,
        -38.192
      ]
    ]
  },
  {
    "wayId": 36697711,
    "name": "خلیل میکائیلی",
    "highway": "residential",
    "maxspeed": "30",
    "oneway": "yes",
    "sourceStart": 0,
    "sourceEnd": 6,
    "localXZ": [
      [
        193.596,
        -77.159
      ],
      [
        193.976,
        -71.6
      ],
      [
        193.867,
        -68.937
      ],
      [
        193.252,
        -67.117
      ],
      [
        192.157,
        -65.342
      ],
      [
        189.334,
        -63.966
      ],
      [
        38.257,
        -21.571
      ]
    ]
  }
]);
export const SATARKHAN_OPPOSING_PRIMARY=Object.freeze({
  wayId:1232461345,name:"ستارخان",highway:"primary",oneway:"yes",
  lanes:4,sidewalk:"right",maxspeed:"50",surface:"asphalt",
  sourceStart:3,sourceEnd:6,localXZ:Object.freeze([[276.817,-1.588],[266.13,-15.036],[238.269,-49.942],[194.781,-100.159]]),
  sourceCapture:"2026-11-09T09:22:58.743Z",license:"ODbL-1.0",
  measuredWidthMeters:null,realLineMarkingsObserved:false
});

// MAYOR-049: ONE sourced way gets a concept-level complete street section.
// Measured right of way is UNKNOWN; this is not a claim of actual street width,
// two-way control, legal parking permission, or parcel ownership.
export const SIXTH_DARYAN_DESIGN_PROFILE=Object.freeze({
  wayId:92200441,kind:"DESIGN_HYPOTHESIS_NOT_SURVEY",
  guideline:"Iran Urban Street Design Code 1399 vol.5 Table 4-3 p.56",
  guidelineMinimums:Object.freeze({movingLane:2.5,parallelParking:1.8,clearSidewalk:1.2}),
  actualRightOfWayMeters:null,actualCarriagewayWidthMeters:null,
  onewaySourceTag:null,parkingPermissionVerified:false,actualCurbPositionKnown:false,
  movingPassingEnvelopeCount:2,eachMovingEnvelopeMeters:2.8,
  movingZoneMeters:5.6,parkingRightWidthMeters:2.1,
  footpathEachSideMeters:1.5,fullConceptSectionMeters:10.7,
  parkingSideIsObserved:false,carsParkedAreIllustrative:true,
  carLengthMeters:4.4,carWidthMeters:1.7,minimumEndSetbackMeters:15,
  candidateParkingBays:7,illustrativeParkedCars:5,physicalCollider:false
});
export function planSixthDaryanIllustrativeSection(){
  const way=SATARKHAN_CORRIDOR_WAYS.find(w=>w.wayId===SIXTH_DARYAN_DESIGN_PROFILE.wayId);
  if(!way||way.oneway!==null||way.highway!=="residential"||
     way.localXZ.length!==2)throw new Error("Sixth Daryan OSM geometry requires source review");
  const [a,b]=way.localXZ,dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz);
  const ux=dx/len,uz=dz/len,nx=-uz,nz=ux;
  if(!(len>150&&len<155))throw new Error("Source right-of-way segment drift");
  const profile=SIXTH_DARYAN_DESIGN_PROFILE;
  if(profile.eachMovingEnvelopeMeters<profile.guidelineMinimums.movingLane||
     profile.parkingRightWidthMeters<profile.guidelineMinimums.parallelParking||
     profile.footpathEachSideMeters<profile.guidelineMinimums.clearSidewalk)
    throw new Error("Design strips below sourced guideline minima");
  const travel=[-2.8,2.8],parking=[-4.9,-2.8],
    sidewalkR=[-6.4,-4.9],sidewalkL=[2.8,4.3];
  const from=([s,e])=>e-s;
  if(Math.abs(from(travel)-profile.movingZoneMeters)>1e-6||
     Math.abs(from(parking)-profile.parkingRightWidthMeters)>1e-6||
     Math.abs(from(sidewalkR)-profile.footpathEachSideMeters)>1e-6||
     Math.abs(from(sidewalkL)-profile.footpathEachSideMeters)>1e-6)
    throw new Error("Cross section width arithmetic invalid");
  const toPoint=(distance,normalOffset)=>({
    x:a[0]+ux*distance+nx*normalOffset,
    z:a[1]+uz*distance+nz*normalOffset
  });
  const slotDistances=[18,36,54,72,90,108,126];
  const bayHalfLength=3,carHalfLength=profile.carLengthMeters/2;
  const parkingOffset=(parking[0]+parking[1])/2;
  const slots=slotDistances.map((d,i)=>({
    slotIndex:i,distanceFromWayStart:d,
    center:toPoint(d,parkingOffset),parked:[0,2,3,5,6].includes(i),
    lengthMeters:bayHalfLength*2,sideOfOSMWay:"negativeNormal_unverified"
  }));
  if(slots.length!==profile.candidateParkingBays||
     slots.filter(s=>s.parked).length!==profile.illustrativeParkedCars)
    throw new Error("Parking bay inventory inconsistent");
  const parkingClearance=Math.min(
    parkingOffset-profile.carWidthMeters/2-parking[0],
    parking[1]-(parkingOffset+profile.carWidthMeters/2)
  );
  if(parkingClearance<.15)throw new Error("Illustrative cars overlap sidewalk or moving lanes");
  for(const s of slots)if(s.distanceFromWayStart-bayHalfLength<profile.minimumEndSetbackMeters ||
    s.distanceFromWayStart+bayHalfLength>len-profile.minimumEndSetbackMeters ||
    s.lengthMeters<profile.carLengthMeters+.5)
    throw new Error("Parking obstructs an intersection or access aisle");
  return {wayId:way.wayId,sourcePolyline:way.localXZ,lengthMeters:len,
    travel,parking,sidewalkR,sidewalkL,parkingOffset,
    slots,parkedCars:slots.filter(s=>s.parked),toPoint,
    longitudinal:{ux,uz,nx,nz},designOnly:true,
    directionOfRealTrafficKnown:false,actualParkingPermitted:null,
    parkingClearanceMeters:parkingClearance,
    twoMovingEnvelopesAlwaysClear:true,sidewalksContinuous:true};
}
function buildSixthDaryanIllustrativeSection(THREE,parent,{streetY=-3}={}){
  const plan=planSixthDaryanIllustrativeSection(),group=new THREE.Group();
  group.name="sixth-daryan-concept-pedestrian-parking-cross-section";
  const surfaces=[
    {name:"two-moving-envelopes",range:plan.travel,y:streetY+.165,color:0x343b40},
    {name:"parallel-parking-strip",range:plan.parking,y:streetY+.169,color:0x52595e},
    {name:"left-clear-sidewalk",range:plan.sidewalkL,y:streetY+.34,color:0xaca69b},
    {name:"right-clear-sidewalk",range:plan.sidewalkR,y:streetY+.34,color:0xaca69b},
    {name:"curb-barrier-left",range:[2.79,2.9],y:streetY+.36,color:0x77766f},
    {name:"curb-barrier-right",range:[-5,-4.88],y:streetY+.36,color:0x77766f}
  ];
  const triangles=[],ranges=[],materials=[];
  const makeStrip=(p,q,low,high,y)=>{
    const a=[p.x,y,p.z],b=[q.x,y,q.z];
    // range is given by local source-way normal; use the exact endpoint
    // direction and never rotate against the original OSM way.
    const n=plan.longitudinal,normal=[n.nx,n.nz];
    const pt=(r,o)=>[r[0]+normal[0]*o,y,r[2]+normal[1]*o];
    const A=pt(a,low),B=pt(b,low),C=pt(a,high),D=pt(b,high);
    triangles.push(...A,...B,...C,...B,...D,...C);
  };
  const fwd0=plan.toPoint(0,0),fwd1=plan.toPoint(plan.lengthMeters,0);
  surfaces.forEach((surface,i)=>{
    const first=triangles.length/3;
    makeStrip(fwd0,fwd1,surface.range[0],surface.range[1],surface.y);
    ranges.push({start:first,count:6,materialIndex:i});
    materials.push(new THREE.MeshStandardMaterial({color:surface.color,
      roughness:.96,metalness:0,side:THREE.DoubleSide}));
  });
  const g=new THREE.BufferGeometry();
  g.setAttribute("position",new THREE.Float32BufferAttribute(triangles,3));
  for(const range of ranges)g.addGroup(range.start,range.count,range.materialIndex);
  g.computeVertexNormals();g.computeBoundingBox();
  const cross=new THREE.Mesh(g,materials);
  cross.name="sixth-daryan-separated-travel-parking-sidewalks";
  cross.renderOrder=4;cross.receiveShadow=true;cross.castShadow=false;
  cross.userData.cityStreetEvidence={sourceOSMWay:plan.wayId,conceptOnly:true,
    realWidthsMeasured:false,physicalCollider:false,actualSidewalkVerified:false};
  group.add(cross);
  // Bay partitions have their own diagram geometry. They are NOT surveyed road
  // markings or parking permits. They end entirely inside parking band.
  const bayTriangles=[],n=plan.longitudinal;
  function bayLine(distance){
    const x=plan.toPoint(distance,0);
    const point=(longitudinal,offset)=>[
      x.x+n.ux*longitudinal+n.nx*offset,streetY+.18,
      x.z+n.uz*longitudinal+n.nz*offset
    ];
    const a=point(-.055,plan.parking[0]),b=point(.055,plan.parking[0]),
      c=point(-.055,plan.parking[1]),d=point(.055,plan.parking[1]);
    bayTriangles.push(...a,...b,...c,...b,...d,...c);
  }
  plan.slots.forEach(s=>{bayLine(s.distanceFromWayStart-3);bayLine(s.distanceFromWayStart+3);});
  const linesG=new THREE.BufferGeometry();
  linesG.setAttribute("position",new THREE.Float32BufferAttribute(bayTriangles,3));
  linesG.computeVertexNormals();linesG.computeBoundingBox();
  const lines=new THREE.Mesh(linesG,new THREE.MeshBasicMaterial({
    color:0xd4d1c8,side:THREE.DoubleSide,transparent:true,opacity:.75,
    depthWrite:false}));
  lines.name="illustrative-parallel-parking-bay-dividers";
  lines.renderOrder=6;lines.userData.cityStreetEvidence={
    sourceOSMWay:plan.wayId,realPaintObserved:false,physicalCollider:false};
  group.add(lines);
  const carGroup=new THREE.Group();carGroup.name="illustrative-parked-cars-only";
  const box=(name,geometry,material,instancePlaces)=>{
    const mesh=new THREE.InstancedMesh(geometry,material,instancePlaces.length);
    mesh.name=name;
    const t=new THREE.Object3D(),yaw=-Math.atan2(n.uz,n.ux);
    for(let i=0;i<instancePlaces.length;i++){
      const p=instancePlaces[i];
      t.position.set(p.x,streetY+p.y,p.z);
      t.rotation.set(0,yaw,0);t.scale.set(1,1,1);t.updateMatrix();
      mesh.setMatrixAt(i,t.matrix);
    }
    mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();
    mesh.castShadow=false;mesh.receiveShadow=true;
    mesh.userData.cityStreetEvidence={
      conceptualOnly:true,actualParkedVehiclesObserved:false,
      physicalCollider:false,vehicleRouteChanged:false
    };
    carGroup.add(mesh);
    return mesh;
  };
  const parked=plan.parkedCars.map(s=>({x:s.center.x,z:s.center.z,y:.54,t:s.distanceFromWayStart}));
  box("parked-car-bodies",new THREE.BoxGeometry(4.4,.65,1.7),
    new THREE.MeshStandardMaterial({color:0x71868e,roughness:.57,metalness:.19}),parked);
  box("parked-car-cabins",new THREE.BoxGeometry(2.10,.52,1.4),
    new THREE.MeshStandardMaterial({color:0x40565c,roughness:.43,metalness:.18}),
    parked.map(p=>({...p,y:1.09})));
  const wheels=[];
  for(const p of parked)for(const lenOfs of [-1.35,1.35])
    for(const sideOfs of [-.88,.88])
      wheels.push({...plan.toPoint(
        p.t+lenOfs,
        plan.parkingOffset+sideOfs),y:.48});
  box("parked-car-wheels-proxy",new THREE.BoxGeometry(.62,.62,.18),
    new THREE.MeshStandardMaterial({color:0x262a2e,roughness:.83}),wheels);
  group.add(carGroup);
  group.userData.cityStreetEvidence={
    sourceOSMWay:plan.wayId,kind:"ILLUSTRATIVE_FIT_REQUIRES_CADASTRAL_SURVEY",
    guideline:"Iran urban street design 1399 part5 table 4-3 page56",
    rights:"OSM centerline ODbL; all road widths and parking authored visual",
    sourceWayDirectionKnown:true,actualOnewayKnown:false,
    designedCombinedWidthMeters:SIXTH_DARYAN_DESIGN_PROFILE.fullConceptSectionMeters,
    movingZoneWidthMeters:5.6,parkingZoneWidthMeters:2.1,
    clearFootpathEachSideMeters:1.5,illustrativeParkingBays:7,
    illustrativeParkedCars:5,realParkingPermissionKnown:false,
    surveyedCurbs:false,unverifiedRightOfWay:true,
    physicalCollider:false,existingVehicleRoutesChanged:false,
    citizensRoutesChanged:false,writerRoomPreserved:true,
    clearRoadEndSetbackMeters:SIXTH_DARYAN_DESIGN_PROFILE.minimumEndSetbackMeters,
    geometricParkingToTravelSeparationMeters:plan.parkingClearanceMeters,
    trafficPassingEnvelopeCountIsDesignAssumption:true
  };
  parent.add(group);return{group,plan};
}

const dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
export function inspectSatarkhanCorridorTopology(ways=SATARKHAN_CORRIDOR_WAYS){
  const byId=new Map(ways.map(w=>[w.wayId,w]));
  if(byId.size!==6)throw new Error("Duplicated or missing source OSM road way");
  const tol=.003;
  const w=(id,i)=>byId.get(id)?.localXZ[i];
  const shared=(a,b)=>a&&b&&dist(a,b)<tol;
  const joints={
    fifthToAliNabipour:shared(w(36697706,1),w(471546873,0)),
    sixthToAliNabipour:shared(w(92200441,1),w(471546873,1)),
    ninthToMain:shared(w(481439240,2),w(207742970,1)),
    aliToMain:shared(w(471546873,3),w(207742970,3)),
    khalilToMain:shared(w(36697711,0),w(207742970,2))
  };
  if(!Object.values(joints).every(Boolean))
    throw new Error("Disconnected actual OSM alleys: "+JSON.stringify(joints));
  return {joints,streets:ways.map(w=>({wayId:w.wayId,name:w.name,
    highway:w.highway,oneway:w.oneway,maxspeed:w.maxspeed})),
    sourcedPolylineParts:ways.length,mainStreetConnected:true,parkPolygonPresent:false};
}
export function buildSatarkhanEastRoadCorridor(THREE,parent,{
 streetY=-3,canvasTex=null
}={}){
  if(!THREE?.Mesh||!parent?.add||!Number.isFinite(streetY))
    throw new TypeError("Licensed corridor preview requires existing Three.js scene");
  const proof=inspectSatarkhanCorridorTopology();
  const group=new THREE.Group();
  group.name="writer-satarkhan-east-osm-road-corridor";
  const all=[],materials=[];
  const addStrip=(list,p,q,width,y)=>{
    const dx=q[0]-p[0],dz=q[1]-p[1],len=Math.hypot(dx,dz);
    if(!(len>.01))throw new RangeError("Collapsed source road geometry");
    const nx=-dz/len*width/2,nz=dx/len*width/2;
    const a=[p[0]+nx,y,p[1]+nz],b=[q[0]+nx,y,q[1]+nz],
      c=[p[0]-nx,y,p[1]-nz],d=[q[0]-nx,y,q[1]-nz];
    list.push(...a,...c,...b,...c,...d,...b);
  };
  const ground=[],residential=[],main=[],primaryLaneSketch=[];
  // One *additional sourced carriageway* alongside existing way 207742970;
  // no invented segment endpoints and NO measured road / lane widths.
  // lanes=4 is source-tagged, whereas the 10.8m visual ribbon is illustrative.
  const opposing=SATARKHAN_OPPOSING_PRIMARY;
  const derivedWay=opposing.localXZ;
  const laneSpan=10.8,laneUnit=laneSpan/opposing.lanes;
  const addDashedLines=(start,end)=>{
    const dx=end[0]-start[0],dz=end[1]-start[1],len=Math.hypot(dx,dz);
    if(!(len>.01))throw new Error("Degenerate Sattarkhan opposing OSM edge");
    const nx=-dz/len,nz=dx/len,ux=dx/len,uz=dz/len;
    for(const laneOfs of [-laneUnit,0,laneUnit]){
      for(let t=2.4;t<len-1.2;t+=8.8){
        const run=Math.min(3.0,len-t-1.2);if(run<=.2)break;
        const a=[start[0]+ux*t+nx*laneOfs,start[1]+uz*t+nz*laneOfs];
        const b=[start[0]+ux*(t+run)+nx*laneOfs,start[1]+uz*(t+run)+nz*laneOfs];
        addStrip(primaryLaneSketch,a,b,.09,streetY+.165);
      }
    }
  };
  for(const way of SATARKHAN_CORRIDOR_WAYS){
    if(way.localXZ.length<2||!["residential","primary"].includes(way.highway))
      throw new Error("Road-way source type needs review");
    const width=way.highway==="primary"?5.3:3.0;
    for(let j=0;j<way.localXZ.length-1;j++){
      const a=way.localXZ[j],b=way.localXZ[j+1];
      addStrip(ground,a,b,width+1.75,streetY+.075);
      addStrip(way.highway==="primary"?main:residential,
        a,b,width,streetY+.125);
    }
  }
  for(let j=0;j<derivedWay.length-1;j++){
    const start=derivedWay[j],end=derivedWay[j+1];
    addStrip(ground,start,end,laneSpan+1.0,streetY+.075);
    addStrip(main,start,end,laneSpan,streetY+.125);
    addDashedLines(start,end);
  }
  const materialTriples=[
    {data:ground,materialIndex:0},{data:residential,materialIndex:1},
    {data:main,materialIndex:2}
  ];
  const geometry=new THREE.BufferGeometry();
  let cursor=0;
  for(const e of materialTriples){
    all.push(...e.data);
    geometry.addGroup(cursor,e.data.length/3,e.materialIndex);
    cursor+=e.data.length/3;
  }
  geometry.setAttribute("position",new THREE.Float32BufferAttribute(all,3));
  geometry.computeBoundingBox();geometry.computeVertexNormals();
  const mats=[
    new THREE.MeshStandardMaterial({color:0x827d70,roughness:1,
      side:THREE.DoubleSide}),
    new THREE.MeshStandardMaterial({color:0x41464b,roughness:.96,
      side:THREE.DoubleSide}),
    new THREE.MeshStandardMaterial({color:0x373e43,roughness:.95,
      side:THREE.DoubleSide})
  ];
  const mesh=new THREE.Mesh(geometry,mats);
  mesh.name="satarkhan-six-sourced-way-centerline-road-bands";
  mesh.castShadow=false;mesh.receiveShadow=false;mesh.renderOrder=3;
  mesh.userData.cityCorridorEvidence={...SATARKHAN_CORRIDOR_SOURCE,
    physicalCollider:false,vehiclePathModified:false,
    citizenRoutesModified:false,writerRoomPreserved:true,
    candidateWidthMeters:{residential:3,primary:5.3},
    widthIsActualEvidence:false,provenMainRoadConnections:proof.joints,
    sourceWayIds:SATARKHAN_CORRIDOR_WAYS.map(w=>w.wayId)};
  group.add(mesh);
  const stripeGeo=new THREE.BufferGeometry();
  stripeGeo.setAttribute("position",new THREE.Float32BufferAttribute(primaryLaneSketch,3));
  stripeGeo.computeVertexNormals();stripeGeo.computeBoundingBox();
  const laneSketch=new THREE.Mesh(stripeGeo,new THREE.MeshBasicMaterial({
    color:0xdddcd1,side:THREE.DoubleSide,transparent:true,opacity:.65,
    depthWrite:false
  }));
  laneSketch.name="satarkhan-osm-4-lanes-artistic-markings";
  laneSketch.castShadow=false;laneSketch.receiveShadow=false;laneSketch.renderOrder=5;
  laneSketch.userData.cityCorridorEvidence={
    sourceWayId:opposing.wayId,actualLaneCountTagged:opposing.lanes,
    sourceCenterlineVerified:true,laneSpacingSurveyed:false,
    laneMarkingsSurveyed:false,physicalCollider:false,citizenPathsChanged:false
  };
  group.add(laneSketch);
  const sixthSection=buildSixthDaryanIllustrativeSection(THREE,group,{streetY});
  // A few clearly graphic street-map labels, not municipal street signs.
  if(typeof canvasTex==="function"){
    for(const way of SATARKHAN_CORRIDOR_WAYS){
      if(![92200441,471546873,207742970].includes(way.wayId))continue;
      const p=way.localXZ[Math.floor((way.localXZ.length-1)/2)],q=way.localXZ[Math.floor((way.localXZ.length-1)/2)+1];
      const x=(p[0]+q[0])/2,z=(p[1]+q[1])/2;
      const texture=canvasTex(512,100,(c,W,H)=>{
        c.clearRect?.(0,0,W,H);c.fillStyle="rgba(25,34,37,.8)";
        c.fillRect(0,11,W,H-22);
        c.fillStyle="#e4dbcd";c.direction="rtl";c.textAlign="center";c.textBaseline="middle";
        c.font="500 39px Tahoma, sans-serif";c.fillText(way.name,W/2,H/2,W-30);
      });
      const label=new THREE.Mesh(new THREE.PlaneGeometry(12,2.5),
        new THREE.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false,
          side:THREE.DoubleSide,toneMapped:false}));
      label.name="sourced-street-map-name-"+way.wayId;
      label.position.set(x,streetY+.23,z);
      label.rotation.order="YXZ";
      label.rotation.y=-Math.atan2(q[1]-p[1],q[0]-p[0]);
      label.rotation.x=-Math.PI/2;
      label.castShadow=false;label.receiveShadow=false;label.renderOrder=20;
      label.userData.cityCorridorEvidence={osmWayId:way.wayId,
        graphicLabelOnly:true,physicalCollider:false};
      group.add(label);
    }
  }
  group.userData.cityCorridorEvidence={
    ...SATARKHAN_CORRIDOR_SOURCE,physicalCollider:false,
    visualWidthGeometryAuthored:true,sourceWayIds:SATARKHAN_CORRIDOR_WAYS.map(w=>w.wayId),
    streetCount:SATARKHAN_CORRIDOR_WAYS.length,junctionsVerified:proof.joints,
    oppositePrimaryWayId:opposing.wayId,oppositePrimarySourceLanes:opposing.lanes,
    totalDistinctSourcedWayIds:7,oppositeCarriagewayModeled:true,
    primaryLaneWidthSurveyed:false,actualPaintPositionsSurveyed:false,
    sixthDaryanIllustrativeSection: sixthSection.group.userData.cityStreetEvidence,
    protectedFloor3Unchanged:true,
    streetNames:SATARKHAN_CORRIDOR_WAYS.map(w=>w.name),
    userApprovedExpansion:true,roomThirdFloorPreserved:true,
    mainStreetReached:true,parkReached:false
  };
  parent.add(group);
  return {group,mesh,topology:proof};
}
