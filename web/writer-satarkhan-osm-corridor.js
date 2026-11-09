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
  const ground=[],residential=[],main=[];
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
    streetNames:SATARKHAN_CORRIDOR_WAYS.map(w=>w.name),
    userApprovedExpansion:true,roomThirdFloorPreserved:true,
    mainStreetReached:true,parkReached:false
  };
  parent.add(group);
  return {group,mesh,topology:proof};
}
