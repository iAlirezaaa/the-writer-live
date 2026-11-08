/* The Writer — city-only living layer.
 *
 * Opt-in, purely visual people, shopfronts, street details, and vehicles.
 * No API, memory, gameplay, house model, or simulated biography writes.
 * Deterministic animation, shared geometries, and capped light count.
 */
export function createCityLife({ THREE, city }) {
  const root = new THREE.Group();
  root.name = "city-life-only";
  city.add(root);

  const sharedBox = new THREE.BoxGeometry(1, 1, 1);
  const sharedSphere = new THREE.SphereGeometry(1, 10, 8);
  const sharedCylinder = new THREE.CylinderGeometry(1, 1, 1, 10);
  const mat = (color, extras={}) => new THREE.MeshStandardMaterial({
    color, roughness: 0.88, metalness: 0.015, ...extras
  });
  const palette = {
    pavement:mat(0xe9e5dc), curb:mat(0xb6c9bf), stripe:mat(0xf7f1dd),
    metal:mat(0x4e686a), dark:mat(0x34535c),
    wood:mat(0x9e775c), leaf:mat(0x6a947c),
    leafLight:mat(0x9fbb99), cafe:mat(0xc88e73),
    terracotta:mat(0xbf836d), cafeTop:mat(0xf6e6ce),
    book:mat(0xefd9bc), brass:mat(0xc29c6d),
    bike:mat(0x507c78),
    glass:mat(0xb2d2d3,{roughness:0.30,metalness:0.1}),
    tyres:mat(0x303c45), headlights:mat(0xffebba,{emissive:0xffc269,emissiveIntensity:0.28})
  };
  function cuboid(parent, w, h, d, x, y, z, material, shadow=false) {
    const o=new THREE.Mesh(sharedBox, material);
    o.scale.set(w,h,d);o.position.set(x,y,z);
    o.castShadow=shadow;o.receiveShadow=shadow;parent.add(o);return o;
  }
  function orb(parent,r,x,y,z,material) {
    const o=new THREE.Mesh(sharedSphere,material);
    o.position.set(x,y,z);o.scale.setScalar(r);
    o.castShadow=true;parent.add(o);return o;
  }
  function cylinder(parent,r,h,x,y,z,material) {
    const o=new THREE.Mesh(sharedCylinder,material);
    o.scale.set(r,h/2,r);o.position.set(x,y,z);o.castShadow=true;parent.add(o);return o;
  }
  function group(parent,x=0,y=0,z=0) {
    const g=new THREE.Group();g.position.set(x,y,z);parent.add(g);return g;
  }
  function route(points) {
    const seg=[], d=[];
    let total=0;
    for(let i=0;i<points.length;i++){
      const a=points[i],b=points[(i+1)%points.length];
      const length=Math.hypot(b[0]-a[0],b[1]-a[1]);
      seg.push([a,b,length]);total+=length;d.push(total);
    }
    return {seg, total, cumulative:d};
  }
  function positionAlong(path, distance, target) {
    const n=((distance%path.total)+path.total)%path.total;
    let from=0;
    for(let i=0;i<path.seg.length;i++){
      const [a,b,len]=path.seg[i],end=path.cumulative[i];
      if(n<=end||i===path.seg.length-1){
        const t=len?Math.min(1,(n-from)/len):0;
        target.position.set(a[0]+(b[0]-a[0])*t,-0.045,a[1]+(b[1]-a[1])*t);
        target.rotation.y=Math.atan2(b[0]-a[0],b[1]-a[1]);
        return;
      }
      from=end;
    }
  }

  // Pavement edges, road markings and one raised crosswalk at the existing
  // orthogonal street junction (road x=1.7, road z=1.05 in buildCity).
  for(const z of [-0.22,2.24]) {
    cuboid(root,22,.045,.10,0,-0.070,z,palette.curb);
  }
  for(const x of [0.48,2.94]) {
    cuboid(root,.10,.045,18,x,-0.069,0,palette.curb);
  }
  for(let x=-10.5;x<=10.5;x+=1.75) {
    cuboid(root,.74,.024,.055,x,-.092,1.05,palette.stripe);
  }
  for(let z=-8;z<=8;z+=1.6) {
    cuboid(root,.052,.023,.7,1.7,-.092,z,palette.stripe);
  }
  for(let i=0;i<6;i++){
    cuboid(root,.15,.025,1.42,.80+i*.31,-.080,1.05,palette.stripe);
  }

  // City props. Every item is kept in the city group; no apartment meshes
  // and no character/writer agent state are touched.
  const lightFixtures=[];
  const emissiveMaterials=[];
  const lamps=[[-9.6,-.66],[-5.3,-.66],[5.4,-.66],[9.7,-.66],
               [-8.9,2.62],[8.9,2.62]];
  const fixtureMaterial=mat(0xffe7b5,{emissive:0xffbc66,emissiveIntensity:.10});
  emissiveMaterials.push(fixtureMaterial);
  for(const [x,z] of lamps) {
    const g=group(root,x,0,z);
    cylinder(g,.065,2.85,0,1.42,0,palette.metal);
    cuboid(g,.82,.075,.075,.36,2.87,0,palette.metal);
    orb(g,.19,.72,2.72,0,fixtureMaterial);
    const light=new THREE.PointLight(0xffc887,0,4.2,2.2);
    light.position.set(.72,2.68,0);g.add(light);lightFixtures.push(light);
    // Bin below the light adds some street-scale landmarks.
    cylinder(g,.17,.48,-.43,.23,.05,palette.dark);
  }
  // A bicycle rack near the bookshop, all procedural meshes.
  function bicycle(x,z) {
    const g=group(root,x,-.02,z);
    for(const xx of [-.45,.45]){
      const wheel=new THREE.Mesh(new THREE.TorusGeometry(.31,.048,6,12),palette.tyres);
      wheel.rotation.y=Math.PI/2;wheel.position.set(xx,.37,0);g.add(wheel);
    }
    const a=cuboid(g,.72,.06,.06,0,.55,0,palette.bike);
    a.rotation.z=-.29;
    cuboid(g,.07,.43,.07,.26,.77,0,palette.bike);
    cuboid(g,.43,.07,.08,.25,1.0,0,palette.dark);
    return g;
  }
  bicycle(-9.35,-.62);
  bicycle(-8.38,-.62);

  // Outdoor café: clustered tables with shades, handrails, planted pots.
  for(const [x,z] of [[-3.1,-1.85],[-1.85,-1.85]]) {
    cylinder(root,.32,.06,x,.72,z,palette.cafeTop);
    cylinder(root,.052,.72,x,.36,z,palette.metal);
    cylinder(root,.045,1.85,x,1.38,z,palette.metal);
    const canopy=new THREE.Mesh(
      new THREE.ConeGeometry(.77,.31,8),palette.cafe);
    canopy.position.set(x,2.31,z);canopy.castShadow=true;root.add(canopy);
    for(const [dx,dz] of [[-.57,0],[.57,0]]){
      cuboid(root,.30,.07,.28,x+dx,.46,z+dz,palette.wood);
    }
  }
  const parkBenches=[[4.1,7.12],[6.1,7.12]];
  for(const [x,z] of parkBenches){
    cuboid(root,1.15,.10,.42,x,.49,z,palette.wood);
    cuboid(root,1.15,.43,.09,x,.75,z-.20,palette.wood);
    for(const dx of [-.42,.42]){
      cuboid(root,.10,.44,.1,x+dx,.22,z,palette.dark);
    }
  }

  // Two local markets make the city readable and active without adding
  // story events. The geometric kiosks are decoration only.
  for(const [x,z,color] of [[-8.7,7.7,palette.terracotta],[8.45,7.7,palette.leaf]]) {
    cuboid(root,1.6,.12,.9,x,.79,z,palette.wood);
    cuboid(root,.07,.78,.07,x-.66,.4,z-.32,palette.dark);
    cuboid(root,.07,.78,.07,x+.66,.4,z+.32,palette.dark);
    const awning=cuboid(root,1.95,.12,1.23,x,2.17,z,color);
    awning.rotation.z=.035;
    for(let t=0;t<7;t++){
      orb(root,.105,x-.63+(t%4)*.43,.96,z-.18+Math.floor(t/4)*.38,
        t%2?palette.leafLight:palette.terracotta);
    }
  }

  // Soft interior shop glows: only visual; does not imply that shops are open.
  const storefronts=[[-7,-1.16],[-1.7,-3.20],[6,-1.76],[-5.2,6.43]];
  const glowMat=mat(0xffe2af,{emissive:0xf9b66c,emissiveIntensity:.06,roughness:.25});
  emissiveMaterials.push(glowMat);
  for(const [x,z] of storefronts){
    cuboid(root,.75,.65,.012,x-.85,1.02,z,glowMat);
    cuboid(root,.75,.65,.012,x+.85,1.02,z,glowMat);
  }

  // People: articulated stylized proxy citizens rather than featureless pins.
  // Route motion is independent of camera, frame rate and LLM state.
  const SKIN=[0xdca786,0xb98469,0xf1c7ad,0x916b58,0xd2b29b];
  const COATS=[0x56787e,0xb78374,0x82956f,0x6f7d98,0xad8d66,0x9c7e8a,0x42706e,0xc3a68d];
  const HAIR=[0x3d3636,0x6f4f3e,0x342f30,0x896d53,0x51483f];
  const SKIN_M=SKIN.map(x=>mat(x));
  const COAT_M=COATS.map(x=>mat(x));
  const HAIR_M=HAIR.map(x=>mat(x));
  const TROUSER=[mat(0x435c68),mat(0x786d63),mat(0x555b59)];
  const pedestrians=[];
  function citizen(i,x,z,scale=1) {
    const g=group(root,x,-.045,z);
    g.name="city-citizen-"+i;g.scale.setScalar(scale);
    const skin=SKIN_M[i%SKIN_M.length];
    const coat=COAT_M[(i*3)%COAT_M.length];
    const hair=HAIR_M[(i*5+Math.floor(i/3))%HAIR_M.length];
    const trouser=TROUSER[i%TROUSER.length];
    // Torso and head kept separate from rotation joints.
    cuboid(g,.43,.64,.27,0,1.06,0,coat);
    orb(g,.19,0,1.56,0,skin);
    orb(g,.195,0,1.67,-.025,hair);
    // Clear face direction: nose protrudes toward the front (+z).
    orb(g,.047,0,1.51,.174,skin);
    const leftArm=group(g,-.29,1.27,0);
    const rightArm=group(g,.29,1.27,0);
    for(const [arm,dir] of [[leftArm,-1],[rightArm,1]]){
      cuboid(arm,.15,.53,.16,dir*.017,-.24,0,coat);
      orb(arm,.077,dir*.017,-.53,.018,skin);
    }
    const leftLeg=group(g,-.135,.79,0),rightLeg=group(g,.135,.79,0);
    for(const leg of [leftLeg,rightLeg]){
      cuboid(leg,.17,.60,.18,0,-.32,0,trouser);
      cuboid(leg,.21,.10,.28,0,-.63,.075,palette.dark);
    }
    // Scarves, bags, hats and coats vary per citizen.
    if(i%4===0){
      cuboid(g,.48,.10,.31,0,1.37,0,COAT_M[(i+4)%COAT_M.length]);
    }else if(i%4===1){
      const bag=cuboid(g,.25,.34,.12,.35,.87,.07,palette.wood);
      bag.rotation.z=-.2;
    }else if(i%4===2){
      cuboid(g,.40,.13,.33,0,1.78,0,COAT_M[(i+3)%COAT_M.length]);
    }
    return {g,leftArm,rightArm,leftLeg,rightLeg};
  }
  const walkRoutes=[
    route([[-10,-.78],[-8,-.79],[-5,-.77],[-1,-.78],[.22,-.78]]),
    route([[3.14,-.80],[5.15,-.80],[8.45,-.80],[10.4,-.80]]),
    route([[-10,2.55],[-7.75,2.54],[-3.8,2.56],[.18,2.56]]),
    route([[3.12,2.57],[5.70,2.58],[8.70,2.58],[10.55,2.57]]),
    route([[3.21,-8.0],[3.21,-5.5],[3.21,-2.3],[3.21,.0],[3.21,3.1],[3.21,7.85]]),
    route([[-9.7,-7.95],[-9.70,-4.35],[-9.7,-.5],[-9.7,3.1],[-9.7,7.8]])
  ];
  // Turn open-ended routes into closed, back-and-forth walks by mirroring
  // intermediate points; no route endpoint teleports.
  for(const r of walkRoutes) {
    const start=r.seg.map(s=>s[0]);
    const mirrored=start.concat(start.slice(1,-1).reverse());
    Object.assign(r,route(mirrored));
  }
  for(let i=0;i<24;i++){
    const routeIndex=i%walkRoutes.length;
    const path=walkRoutes[routeIndex];
    const p=citizen(i,0,0,.86+(i%4)*.07);
    const dir=i%2?-1:1;
    const speed=(.19+(i%6)*.055)*dir;
    const offset=path.total*((i*13%29)/29);
    pedestrians.push({path,model:p,speed,offset,phase:i*.83,
      idleStop:(i%7===0)?2:0});
    positionAlong(path,offset,p.g);
  }
  // Small stationary social interactions outside shops and around benches.
  const stationary=[];
  for(const [i,x,z,turn] of [[25,-8.5,-.55,-.9],[26,-8.05,-.55,.7],
                             [27,-2.7,-1.62,1.0],[28,-2.30,-1.66,-1.1],
                             [29,4.3,7.38,.3],[30,5.0,7.38,-.3]]){
    const p=citizen(i,x,z,.91);
    p.g.rotation.y=turn;stationary.push({model:p,phase:i*.37});
  }

  // Light traffic, moving on the two pre-existing streets only.

  // Vehicle local +X always faces forward; local +Z is a side. All parts,
  // including wheels, lights and mirrors, stay parented to their car root.
  const vehicleMaterials=[
    mat(0x729b8e),mat(0xc99486),mat(0x8299b8),
    mat(0xe5bd83),mat(0x9f817e),mat(0x8fa58f),
    mat(0x253f49),mat(0x344956),mat(0x52616b),
    mat(0xffefc0,{emissive:0xffdb89,emissiveIntensity:.45}),
    mat(0xe56c5d,{emissive:0xd64135,emissiveIntensity:.18}),
    mat(0xd5dedd,{metalness:.26,roughness:.34}),
    mat(0x99bdc2,{metalness:.09,roughness:.25}),
    mat(0xede1ce),mat(0xf2d7a0)
  ];
  const carPaints=vehicleMaterials.slice(0,6);
  const [windowTrim,windowDark,tyre,headlamp,taillamp,rim,vehicleGlass,numberPlate,taxiSign]=vehicleMaterials.slice(6);
  const carSpecs=[
    {kind:"compact",length:1.56,width:.72,radius:.17,speed:.74},
    {kind:"sedan",length:1.91,width:.77,radius:.18,speed:.80},
    {kind:"taxi",length:1.85,width:.76,radius:.18,speed:.73},
    {kind:"delivery-van",length:2.06,width:.76,radius:.18,speed:.58},
    {kind:"hatchback",length:1.69,width:.73,radius:.17,speed:.78},
    {kind:"pickup",length:2.08,width:.77,radius:.19,speed:.62}
  ];
  const cars=[],wheelGeometryCache=new Map(),hubGeometryCache=new Map();
  function wheelGeometry(radius,hub=false){
    const key=radius.toFixed(3),map=hub?hubGeometryCache:wheelGeometryCache;
    if(!map.has(key))map.set(key,new THREE.CylinderGeometry(
      hub?radius*.52:radius,hub?radius*.52:radius,hub?.118:.12,12
    ));
    return map.get(key);
  }
  function makeCar(i,spec){
    const g=group(root);
    g.name="city-car-"+i+"-"+spec.kind;
    g.userData.vehicleType=spec.kind;
    const L=spec.length,W=spec.width,paint=carPaints[i%carPaints.length];
    const half=L*.5,wheels=[];
    // Chassis with wheels clearing the pavement.
    cuboid(g,L,.24,W,0,.36,0,paint);
    cuboid(g,L*.91,.075,W*.90,0,.235,0,windowTrim);
    cuboid(g,L*.46,.13,W*.94,L*.01,.46,0,paint);
    const van=spec.kind==="delivery-van",pickup=spec.kind==="pickup";
    const cabinCenter=van?L*.23:pickup?L*.19:-L*.09;
    const cabinLength=van?L*.31:pickup?L*.34:L*.49;
    const roofHeight=van?1.03:pickup?.77:.79;
    const cabinHeight=roofHeight-.53;
    cuboid(g,cabinLength,cabinHeight,W*.82,cabinCenter,.53+cabinHeight/2,0,paint);
    cuboid(g,cabinLength*.89,.055,W*.84,cabinCenter,roofHeight+.027,0,paint);
    cuboid(g,.032,Math.max(.19,cabinHeight*.75),W*.74,
      cabinCenter+cabinLength/2+.016,.53+cabinHeight*.52,0,vehicleGlass);
    cuboid(g,.032,Math.max(.19,cabinHeight*.75),W*.74,
      cabinCenter-cabinLength/2-.016,.53+cabinHeight*.52,0,vehicleGlass);
    for(const side of [-1,1]){
      cuboid(g,cabinLength*.77,cabinHeight*.66,.032,
        cabinCenter,.57+cabinHeight*.51,side*(W*.41+.012),vehicleGlass);
      cuboid(g,.042,cabinHeight*.77,.05,
        cabinCenter+.035,.58+cabinHeight*.52,side*(W*.41+.028),windowTrim);
      cuboid(g,.18,.036,.06,cabinCenter+.045,.53,side*(W*.50+.015),rim);
      cuboid(g,.16,.07,.12,
        cabinCenter+cabinLength*.43,.68,side*(W*.50+.06),windowTrim);
    }
    if(van){
      const boxX=-L*.20;
      cuboid(g,L*.57,.55,W*.93,boxX,.70,0,paint);
      cuboid(g,.055,.45,W*.76,-half+.015,.70,0,windowTrim);
      cuboid(g,.03,.40,.03,-half-.022,.71,0,rim);
      cuboid(g,L*.50,.045,W*.96,boxX,.98,0,paint);
    }
    if(pickup){
      const bedCenter=-L*.30,bedL=L*.42;
      cuboid(g,bedL,.08,W*.94,bedCenter,.48,0,windowTrim);
      for(const side of [-1,1])
        cuboid(g,bedL,.22,.07,bedCenter,.59,side*W*.46,paint);
      cuboid(g,.075,.24,W*.94,-half+.025,.59,0,paint);
    }
    if(spec.kind==="taxi"){
      cuboid(g,.43,.10,.26,cabinCenter,.91,0,taxiSign);
      cuboid(g,.28,.04,.28,cabinCenter,.99,0,windowTrim);
    }
    if(spec.kind==="hatchback")
      cuboid(g,.34,.06,W*.79,-half+.18,roofHeight+.08,paint);
    // Front (+X) lamps and grille; rear (-X) red lamps and plates.
    for(const side of [-1,1]){
      cuboid(g,.055,.135,.17,half+.025,.40,side*W*.32,headlamp);
      cuboid(g,.055,.135,.17,-half-.025,.40,side*W*.32,taillamp);
    }
    cuboid(g,.058,.17,W*.38,half+.029,.33,0,windowDark);
    cuboid(g,.058,.065,W*.48,half+.04,.56,0,numberPlate);
    cuboid(g,.052,.07,W*.43,-half-.038,.55,0,numberPlate);
    for(const axleSide of [-1,1]){
      const x=axleSide*L*.295;
      for(const zside of [-1,1]){
        // Cylinder axis starts at local Y, rotate to the Z wheel axle. Spin
        // the wheel pivot around Z; never rotate or move a child in world space.
        const pivot=group(g,x,spec.radius,zside*(W*.5+.028));
        const tread=new THREE.Mesh(wheelGeometry(spec.radius),tyre);
        tread.rotation.x=Math.PI/2;pivot.add(tread);
        const hub=new THREE.Mesh(wheelGeometry(spec.radius,true),rim);
        hub.rotation.x=Math.PI/2;
        hub.position.z=zside*.012;pivot.add(hub);
        wheels.push(pivot);
      }
    }
    return {g,wheels,length:L,width:W,radius:spec.radius,kind:spec.kind};
  }
  // One direction per lane, with enough space between opposite lanes.
  const carLanes=[
    {id:"east",axis:"h",forward:1,start:-12.8,end:12.8,fixed:.55},
    {id:"west",axis:"h",forward:-1,start:12.8,end:-12.8,fixed:1.55},
    {id:"north",axis:"v",forward:1,start:-10.65,end:10.65,fixed:1.19},
    {id:"south",axis:"v",forward:-1,start:10.65,end:-10.65,fixed:2.22}
  ].map(lane=>({...lane,length:Math.abs(lane.end-lane.start)}));
  const slots={h:[.8,8.4,18.1],v:[.8,6.4,15.8]};
  const laneMembers=new Map(carLanes.map(l=>[l.id,[]]));
  // Bounding zone covers the actual intersection AND the long van body;
  // a perpendicular vehicle cannot enter until crossing traffic clears.
  const CONFLICT_RADIUS=2.32;
  function criticalRange(car){
    const middle=car.lane.axis==="h"?1.7:1.05;
    const along=car.lane.forward*(middle-car.lane.start);
    return {entry:along-CONFLICT_RADIUS,exit:along+CONFLICT_RADIUS};
  }
  function syncCar(car){
    const lane=car.lane,pos=lane.start+lane.forward*car.progress;
    if(lane.axis==="h"){
      car.model.g.position.set(pos,-.113,lane.fixed);
      car.model.g.rotation.y=lane.forward===1?0:Math.PI;
    }else{
      car.model.g.position.set(lane.fixed,-.113,pos);
      car.model.g.rotation.y=lane.forward===1?-Math.PI/2:Math.PI/2;
    }
    for(const wheel of car.model.wheels)
      wheel.rotation.z=-car.distance/car.model.radius;
  }
  for(let i=0;i<12;i++){
    const lane=carLanes[i%4],slot=Math.floor(i/4);
    const spec=carSpecs[(i+slot)%carSpecs.length],model=makeCar(i,spec);
    const car={model,lane,progress:slots[lane.axis][slot],
      distance:slots[lane.axis][slot],speed:spec.speed*(.93+(i%3)*.055)};
    Object.assign(car,criticalRange(car));
    cars.push(car);laneMembers.get(lane.id).push(car);syncCar(car);
  }
  const inConflict=car=>car.progress>=car.entry-.0001&&car.progress<=car.exit+.0001;
  function stepCars(dt){
    for(const car of cars){
      let step=car.speed*dt;
      // Following gap is computed circularly: works even while vehicles wrap.
      for(const ahead of laneMembers.get(car.lane.id)){
        if(ahead===car)continue;
        const gap=(ahead.progress-car.progress+car.lane.length)%car.lane.length;
        const minSeparation=(car.model.length+ahead.model.length)/2+.46;
        step=Math.min(step,Math.max(0,gap-minSeparation));
      }
      // Mutex for the central intersection. Vehicles already across the
      // entry line keep priority, so perpendicular traffic never clips.
      if(car.progress<car.entry && car.progress+step>=car.entry){
        if(cars.some(other=>other.lane.axis!==car.lane.axis&&inConflict(other)))
          step=Math.max(0,car.entry-car.progress-.045);
      }
      if(step<=0)continue;
      car.progress=(car.progress+step)%car.lane.length;
      car.distance+=step;syncCar(car);
    }
  }
  let lastCarSeconds=null;
  function updateCars(seconds){
    if(!Number.isFinite(seconds))return;
    if(lastCarSeconds===null){lastCarSeconds=seconds;return;}
    let remaining=Math.min(Math.max(0,seconds-lastCarSeconds),.18);
    lastCarSeconds=seconds;
    while(remaining>1e-6){
      const dt=Math.min(.035,remaining);stepCars(dt);remaining-=dt;
    }
  }

  const animatedLeaves=[];
  for(const [x,z] of [[-10.8,-7.7],[-10.85,6.4],[10.9,-7.2],[10.8,6.7]]){
    const tr=group(root,x,0,z);
    cylinder(tr,.13,1.1,0,.54,0,palette.wood);
    const crown=group(tr,0,1.45,0);
    for(const [dx,dy,dz] of [[0,0,0],[-.35,-.1,.1],[.35,-.08,-.16],[0,.33,0]]){
      orb(crown,.52,dx,dy,dz,(dx<0||dy>.1)?palette.leafLight:palette.leaf);
    }
    animatedLeaves.push(crown);
  }

  function update(seconds) {
    if(!Number.isFinite(seconds))return;
    for(let i=0;i<pedestrians.length;i++){
      const v=pedestrians[i],m=v.model;
      const distance=v.offset+v.speed*seconds;
      positionAlong(v.path,distance,m.g);
      const cadence=seconds*(1.8+Math.abs(v.speed)*3)+v.phase;
      const stride=Math.sin(cadence)*.49;
      m.leftLeg.rotation.x=stride;m.rightLeg.rotation.x=-stride;
      m.leftArm.rotation.x=-stride*.8;m.rightArm.rotation.x=stride*.8;
      // Subtle idle sway, not screen-space bobbing.
      m.g.position.y=-.04+Math.abs(Math.sin(cadence))*.025;
    }
    for(const v of stationary){
      const s=Math.sin(seconds*.8+v.phase)*.065;
      v.model.leftArm.rotation.x=s;v.model.rightArm.rotation.x=-s;
    }
    updateCars(seconds);
    for(let i=0;i<animatedLeaves.length;i++)
      animatedLeaves[i].rotation.z=Math.sin(seconds*.63+i)*.035;
  }
  function setDusk(enabled) {
    for(const light of lightFixtures)light.intensity=enabled?1.05:0;
    fixtureMaterial.emissiveIntensity=enabled?1.9:.10;
    glowMat.emissiveIntensity=enabled?1.28:.06;
  }

  setDusk(false);
  return {update,setDusk,pedestrianCount:pedestrians.length+stationary.length,
          vehicleCount:cars.length,dispose(){
    city.remove(root);root.traverse(o=>{if(o.isMesh && o.geometry !== sharedBox &&
      o.geometry!==sharedSphere&&o.geometry!==sharedCylinder)o.geometry?.dispose();});
    sharedBox.dispose();sharedSphere.dispose();sharedCylinder.dispose();
    for(const m of [...Object.values(palette),...SKIN_M,...COAT_M,...HAIR_M,
      ...TROUSER,...vehicleMaterials,...emissiveMaterials])m.dispose();
  }};
}
