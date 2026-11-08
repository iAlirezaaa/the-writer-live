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
  const carBodies=[mat(0x729b8e),mat(0xc29485),mat(0x7c90ad),mat(0xe5bd83)];
  const cars=[];
  function car(i) {
    const g=group(root);
    g.name="city-car-"+i;
    const body=carBodies[i%carBodies.length];
    cuboid(g,1.32,.31,.70,0,.26,0,body);
    cuboid(g,.65,.34,.57,-.11,.53,0,body);
    for(const sx of [-.42,.42])for(const sz of [-.38,.38]){
      const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.16,.16,.10,10),palette.tyres);
      wheel.rotation.x=Math.PI/2;wheel.position.set(sx,.15,sz);g.add(wheel);
    }
    for(const sx of [-.50,.50]){
      cuboid(g,.07,.12,.06,.65,.31,sx*.53,palette.headlights);
    }
    return g;
  }
  for(let i=0;i<5;i++){
    const g=car(i);
    const horizontal=i<3,forward=i%2===0;
    cars.push({g,horizontal,forward,speed:.60+(i%3)*.14,phase:i*4.9});
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
    for(const c of cars){
      const lane=c.horizontal?21.8:18.8;
      const progress=(seconds*c.speed+c.phase)%lane;
      const dir=c.forward?1:-1;
      if(c.horizontal){
        c.g.position.set((c.forward?-11.0:11.0)+dir*progress,-.015,
                         c.forward?.57:1.55);
        c.g.rotation.y=c.forward?Math.PI/2:-Math.PI/2;
      }else{
        c.g.position.set(c.forward?1.26:2.12,-.015,
                         (c.forward?-9.2:9.2)+dir*progress);
        c.g.rotation.y=c.forward?0:Math.PI;
      }
    }
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
      ...TROUSER,...carBodies,...emissiveMaterials])m.dispose();
  }};
}
