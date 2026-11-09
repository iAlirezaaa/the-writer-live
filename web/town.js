import { buildTownCars } from "./town-cars.js?v=fleet-20261109-roadgraph-1";
import { buildCityDistricts } from "./town-districts.js?v=city-districts-20261108-v3";
import { buildCityGrowth } from "./city-growth.js?v=civic-growth-20261108-v1";
import { ROAD_SEGMENTS } from "./urban-plan.js?v=urban-plan-20261108-v3";
import { buildSeamlessRoadSurface, ROAD_PAINT_CENTER_OFFSET } from "./road-surface.js?v=road-surface-20261108-v4";

export const STREET_Y = -3;
export const TOWN_BUILDINGS = [
  { key: "publisher", label: "دفتر ناشر", x: -10, z: 0, w: 6, d: 6 },
  { key: "bookstore", label: "کتاب‌فروشی", x: 10, z: 0, w: 6, d: 6 },
  { key: "home-west", label: "خانه‌های غربی", x: -19, z: 0, w: 5, d: 5 },
  { key: "home-east", label: "خانه‌های شرقی", x: 19, z: 0, w: 5, d: 5 },
];

export function nightLighting(day) {
  const daylight = Math.max(0, Math.min(1, day));
  return { hemisphere: 0.85 + daylight * 0.5, celestial: 0.65 + daylight * 1.2,
    fill: 0.45 + (1 - daylight) * 0.25, street: (1 - daylight) * 7 };
}

export function buildTown({ THREE, scene, clickable, canvasTex }) {
  const group = new THREE.Group(); group.name = "town"; scene.add(group);
  const legacyShopLayer = new THREE.Group(); legacyShopLayer.name = "legacy-shopfront-interiors"; group.add(legacyShopLayer);
  let meshParent = group;
  const materials = {};
  const material = (name, color, extra = {}) => materials[name] ||= new THREE.MeshStandardMaterial({ color, roughness: 0.85, ...extra });
  const stone = material("stone", 0xa5a292), curb = material("curb", 0xd0c5ae);
  const asphalt = material("asphalt", 0x39464e), grass = material("grass", 0x536c55);
  const wood = material("wood", 0x79583d), darkWood = material("darkWood", 0x483f36);
  const metal = material("metal", 0x414e54, { metalness: 0.35, roughness: 0.5 });
  const paper = material("paper", 0xf6e8c9), brick = material("brick", 0xa97560);
  const teal = material("teal", 0x597a77), leaf = material("leaf", 0x59784e);
  const glass = material("glass", 0x748f99, { emissive: 0xffca87, emissiveIntensity: 0.2 });
  const bookMats = [0x9d584e, 0x5a747f, 0xd4ad67, 0x7d8464].map((c, i) => material(`book${i}`, c));
  function mesh(geometry, mat, x, y, z) {
    const m = new THREE.Mesh(geometry, mat); m.position.set(x, y, z);
    m.castShadow = false; m.receiveShadow = true; meshParent.add(m); return m;
  }
  const box = (w, h, d, mat, x, y, z) => mesh(new THREE.BoxGeometry(w, h, d), mat, x, y, z);
  function sign(text, x, y, z, width, background = "#30494b") {
    const tex = canvasTex(512, 128, (g, w, h) => {
      g.fillStyle = background; g.fillRect(0, 0, w, h);
      g.strokeStyle = "#d9c79c"; g.lineWidth = 4; g.strokeRect(8, 8, w - 16, h - 16);
      g.direction = "rtl"; g.textAlign = "center"; g.textBaseline = "middle";
      g.fillStyle = "#fff0d1"; g.font = "500 42px Tahoma, sans-serif";
      g.fillText(text, w / 2, h / 2, w - 36);
    });
    return mesh(new THREE.PlaneGeometry(width, width / 4), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }), x, y, z);
  }
  const ground = mesh(new THREE.PlaneGeometry(240, 240), grass, 0, STREET_Y - 0.14, 0);
  ground.rotation.x = -Math.PI / 2;
  for (const z of [8.5, -8.5]) {
    box(54, 0.08, 4, asphalt, 0, STREET_Y - 0.08, z);
    for (const side of [-1, 1]) {
      box(54, 0.1, 1.8, stone, 0, STREET_Y - 0.02, z + side * 2.8);
      box(54, 0.16, 0.14, curb, 0, STREET_Y + 0.01, z + side * 2.02);
    }
    for (let x = -23; x <= 23; x += 3) box(1.25, 0.012, 0.07, curb, x, STREET_Y + ROAD_PAINT_CENTER_OFFSET, z);
  }
  for (const x of [-25, 25]) box(4, 0.08, 21, asphalt, x, STREET_Y - 0.08, 0);
  for (let z = 6.65; z < 10.5; z += 0.55) box(1.9, 0.014, 0.28, paper, 0, STREET_Y + ROAD_PAINT_CENTER_OFFSET, z);
  box(46, 0.1, 5.2, stone, 0, STREET_Y - 0.025, 13.7);
  for (const b of TOWN_BUILDINGS) box(2, 0.08, 3, stone, b.x, STREET_Y - 0.015, 4.2);

  const lamps = [];
  const bulbMat = material("bulb", 0xffdea4, { emissive: 0xffca75, emissiveIntensity: 2 });
  for (const [x, z] of [[-20, 6.3], [-10, 6.3], [2.4, 6.3], [12, 6.3], [22, 6.3], [-10, -6.3], [10, -6.3]]) {
    box(0.12, 3.4, 0.12, metal, x, STREET_Y + 1.7, z);
    box(0.7, 0.12, 0.44, metal, x, STREET_Y + 3.43, z);
    box(0.48, 0.06, 0.3, bulbMat, x, STREET_Y + 3.35, z);
    const light = new THREE.PointLight(0xffd49a, 7, 10, 1.4);
    light.position.set(x, STREET_Y + 3.2, z); light.userData.cityStreetLamp = true; group.add(light); lamps.push(light);
    const pool = mesh(new THREE.CircleGeometry(2, 24), new THREE.MeshBasicMaterial({ color: 0xffd49a, transparent: true, opacity: 0.06, depthWrite: false }), x, STREET_Y + 0.04, z);
    pool.rotation.x = -Math.PI / 2;
  }

  function shelf(x, z, width = 1.7) {
    box(width, 1.7, 0.3, darkWood, x, STREET_Y + 0.9, z);
    for (let row = 0; row < 3; row++) {
      box(width, 0.06, 0.4, wood, x, STREET_Y + 0.3 + row * 0.52, z + 0.04);
      for (let j = 0; j < 8; j++) box(0.12, 0.27 + (j % 3) * 0.035, 0.2, bookMats[(row + j) % 4], x - width / 2 + 0.18 + j * (width - 0.3) / 8, STREET_Y + 0.48 + row * 0.52, z + 0.17);
    }
  }
  function table(x, z, width = 1.5) {
    box(width, 0.12, 0.75, wood, x, STREET_Y + 0.82, z);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(0.07, 0.75, 0.07, darkWood, x + sx * (width / 2 - 0.12), STREET_Y + 0.38, z + sz * 0.25);
  }
  function bench(x, z) {
    box(1.65, 0.12, 0.55, wood, x, STREET_Y + 0.48, z);
    box(1.65, 0.5, 0.1, wood, x, STREET_Y + 0.83, z - 0.25);
    for (const sx of [-0.6, 0.6]) box(0.1, 0.42, 0.42, metal, x + sx, STREET_Y + 0.2, z);
  }
  function tree(x, z) {
    mesh(new THREE.CylinderGeometry(0.09, 0.15, 1.7, 7), wood, x, STREET_Y + 0.85, z);
    mesh(new THREE.IcosahedronGeometry(0.85, 1), leaf, x, STREET_Y + 2.15, z);
    box(1.3, 0.12, 1.3, curb, x, STREET_Y + 0.02, z);
  }

  const office = TOWN_BUILDINGS[0], store = TOWN_BUILDINGS[1];
  meshParent = legacyShopLayer;
  for (const b of [office, store]) {
    const wall = b.key === "publisher" ? brick : teal;
    box(b.w, 0.16, b.d, curb, b.x, STREET_Y - 0.02, b.z);
    box(b.w, 3.25, 0.15, wall, b.x, STREET_Y + 1.6, -3);
    for (const side of [-1, 1]) {
      box(0.15, 3.25, b.d, wall, b.x + side * 3, STREET_Y + 1.6, 0);
      box(0.14, 3, 0.14, darkWood, b.x + side * 2.86, STREET_Y + 1.5, 2.9);
    }
    box(6.3, 0.22, 0.7, wall, b.x, STREET_Y + 3.25, 2.85);
    box(6.3, 0.22, 0.4, wall, b.x, STREET_Y + 3.25, -2.85);
    // Shopfront glazing, timber mullions, entrance surround and a shallow canopy.
    for (const x of [b.x - 2.05, b.x + 2.05]) {
      box(1.55, 1.52, 0.055, glass, x, STREET_Y + 1.65, 3.10);
      for (const dx of [-0.83, 0.83]) box(0.09, 1.72, 0.12, darkWood, x + dx, STREET_Y + 1.65, 3.14);
      box(1.78, 0.10, 0.12, darkWood, x, STREET_Y + 2.50, 3.14);
      box(0.07, 1.52, 0.12, wood, x, STREET_Y + 1.65, 3.17);
      box(1.8, 0.08, 0.68, wood, x, STREET_Y + 2.63, 3.30);
    }
    box(1.05, 2.20, 0.07, darkWood, b.x, STREET_Y + 1.10, 3.10);
    box(1.28, 0.12, 0.16, wood, b.x, STREET_Y + 2.27, 3.13);
    for (const y of [STREET_Y + 1.5, STREET_Y + 2.2]) box(0.88, 0.045, 0.025, metal, b.x, y, 3.15);
    const board = sign(b.label, b.x, STREET_Y + 2.9, 3.25, 3.7, b.key === "publisher" ? "#6f4940" : "#304f4e");
    clickable(board, b.key === "publisher" ? "p-publish" : "p-books", b.label).userData.view = b.key;
    const hit = box(6, 2.5, 0.04, new THREE.MeshBasicMaterial({ visible: false }), b.x, STREET_Y + 1.25, 3.12);
    clickable(hit, b.key === "publisher" ? "p-publish" : "p-books", b.label).userData.view = b.key;
    sign("نمای برش‌خورده", b.x, STREET_Y + 0.1, 3.2, 1.9);
    const glow = new THREE.PointLight(0xffe2b7, 4, 7, 1.3);
    glow.position.set(b.x, STREET_Y + 2.8, 0.5); legacyShopLayer.add(glow);
  }
  table(-10, -0.5, 2.1);
  box(0.7, 0.12, 0.5, paper, -10.35, STREET_Y + 0.93, -0.5);
  box(0.55, 0.5, 0.08, darkWood, -9.4, STREET_Y + 1.15, -0.62);
  bench(-10, 1.1); shelf(-11.55, -2.65); shelf(-8.55, -2.65);
  sign("خواندن · گفتگو · تصمیم", -10, STREET_Y + 2.35, -2.85, 3.6, "#55463a");
  for (const x of [8.2, 10, 11.8]) shelf(x, -2.65, 1.55);
  table(10, -0.3, 2.2);
  for (let j = 0; j < 6; j++) box(0.25, 0.07, 0.35, bookMats[j % 4], 9.15 + j * 0.33, STREET_Y + 0.91, -0.3);
  table(12, 1.3, 1.2);
  sign("کتاب · تجربه · ایده", 10, STREET_Y + 2.4, -2.85, 3.2);
  meshParent = group;

  for (const b of TOWN_BUILDINGS.slice(2)) {
    const wall = b.x < 0 ? material("home1", 0xb79b7c) : material("home2", 0x8b9b91);
    box(b.w, 4.1, b.d, wall, b.x, STREET_Y + 2.05, b.z);
    // Pitched two-storey roof, eaves, chimney and a clearly framed front door.
    for (const side of [-1, 1]) {
      const roof = box(b.w + 0.55, 0.20, 2.95, side < 0 ? brick : wood, b.x, STREET_Y + 5.05, b.z + side * 0.72);
      roof.rotation.x = side * 0.48;
    }
    box(0.55, 1.35, 0.62, brick, b.x + 1.55, STREET_Y + 4.7, b.z - 1.25);
    box(b.w + 0.35, 0.16, 0.18, wood, b.x, STREET_Y + 4.04, b.z + 2.40);
    box(1.0, 2.1, 0.13, darkWood, b.x, STREET_Y + 1.05, b.z + 2.40);
    box(1.22, 0.12, 0.22, wood, b.x, STREET_Y + 2.16, b.z + 2.39);
    for (const dx of [-1.58, 1.58]) for (const floor of [0, 1]) {
      const y = STREET_Y + (floor ? 3.05 : 1.55), x = b.x + dx;
      box(0.96, 1.05, 0.07, glass, x, y, b.z + 2.57);
      for (const sx of [-0.53, 0.53]) box(0.10, 1.22, 0.14, darkWood, x + sx, y, b.z + 2.62);
      box(1.16, 0.10, 0.16, wood, x, y - 0.62, b.z + 2.62);
      box(0.08, 1.02, 0.13, wood, x, y, b.z + 2.64);
      for (const sx of [-0.72, 0.72]) box(0.30, 0.92, 0.10, teal, x + sx, y, b.z + 2.56);
      if (floor) {
        box(1.18, 0.10, 0.55, wood, x, y - 0.66, b.z + 2.84);
        box(1.22, 0.08, 0.06, metal, x, y - 0.50, b.z + 3.08);
      }
    }
    // Private lots: side parking is off the continuous pavement, and each front door
    // has a walkable approach rather than opening straight onto a road.
    box(1.85,0.08,2.7,stone,b.x+2.0,STREET_Y+0.04,-4.15);
    box(1.85,0.055,1.8,asphalt,b.x+2.0,STREET_Y-0.04,-6.2);
    for(const dx of [-0.86,0.86])
      box(0.065,0.015,2.5,paper,b.x+2.0+dx,STREET_Y+0.09,-4.15);
    for(const dx of [-2.1,2.1]){
      box(0.6,0.16,1.6,grass,b.x+dx,STREET_Y+0.10,3.75);
      box(0.7,0.1,1.7,curb,b.x+dx,STREET_Y+0.015,3.75);
    }
    sign(b.label, b.x, STREET_Y + 4.3, b.z + 2.75, 3);
  }
  bench(-3, 13); bench(3, 13); bench(9, 13);
  for (const [x, z] of [[-22, 4.2], [-15, 4.2], [15, 4.2], [22, 4.2], [-12, 14], [13, 14], [-18, -5], [18, -5]]) tree(x, z);
  box(4, 0.18, 2.2, curb, 7, STREET_Y + 0.03, 14.4);
  box(3.7, 0.2, 1.9, grass, 7, STREET_Y + 0.16, 14.4);
  for (let i = 0; i < 8; i++) mesh(new THREE.IcosahedronGeometry(0.16, 0), bookMats[i % 4], 5.6 + i * 0.4, STREET_Y + 0.42, 14.4);
  table(-6, 13, 1.25);
  const umbrella = mesh(new THREE.ConeGeometry(1.3, 0.5, 8), teal, -6, STREET_Y + 2.7, 13);
  box(0.06, 2.6, 0.06, metal, -6, STREET_Y + 1.3, 13);
  sign("کافه و میدان", -6, STREET_Y + 2, 14.2, 2.4);
  const townSign = sign("محلهٔ نویسنده", 0, STREET_Y + 1.1, 14.8, 3.5);
  clickable(townSign, "p-town", "زندگی شهر").userData.view = "town";
  // Replaces the flat twelve backdrop blocks with authored architecture,
  // public spaces and a publisher office on an upper floor. The author's
  // original home and the tested traffic/pedestrian routes are untouched.
  const districts = buildCityDistricts({ THREE, group, clickable, canvasTex, streetY: STREET_Y });
  const growth = buildCityGrowth({ THREE, group, clickable, canvasTex, places:districts.catalog, streetY:STREET_Y });
  // A single union mesh covers the old main streets and every district extension.
  // It is ONE asphalt surface, not coplanar road patches glued together.
  // Keep the original underneath as a collision/path reference for resident routes.
  const cityRoadSurface=buildSeamlessRoadSurface(THREE,ROAD_SEGMENTS,{streetY:STREET_Y});
  group.add(cityRoadSurface);
    const mountainMat = material("mountain", 0x65727c);
  for (let i = 0; i < 8; i++) mesh(new THREE.ConeGeometry(12, 13 + (i % 3) * 4, 7), mountainMat, -70 + i * 20, 3, -65);
  const carLayer = buildTownCars({ THREE, city: group, streetY: STREET_Y });
  return {
    group,
    districts,
    growth,
    trafficState(){return carLayer.trafficState();},
    update(day, elapsed, crossingDemand=false, weather=null) {
      const lighting = nightLighting(day);
      lamps.forEach((light) => { light.intensity = lighting.street; });
      glass.emissiveIntensity = 0.05 + (1 - day) * 0.8;
      bulbMat.emissiveIntensity = 0.3 + (1 - day) * 1.7;
      umbrella.rotation.y = Math.sin(elapsed * 0.15) * 0.012;
      districts.update(day,elapsed);
      growth.update(day,elapsed,weather);
      carLayer.setCrossingDemand(crossingDemand===true);
      carLayer.update(day, elapsed);
    },
  };
}
