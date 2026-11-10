import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { openBook, setTurnSpeed } from "./book.js?v=reader-20261109-v7";
import { openExplorer } from "./explorer.js?v=graph-structure-v1";
import { initObjects, inspect, closeInspect, setTHREE } from "./objects.js?v=city-districts-20261108-v1";
import { buildNotebook } from "./nb3d.js";
import { initPanels } from "./panels.js";
import { buildTown, nightLighting, STREET_Y } from "./town.js?v=city-civita-main-20261110-v3";
import {clampCivitaTarget} from "./civita-geo.mjs?v=civita-main-20261110-v1";
import {buildCivitaWriterExterior} from "./civita-writer-house.js?v=civita-house-20261110-v1";
import { createCivitaWeatherService, civitaWeatherLabel } from "./civita-environment.js?v=civita-environment-20261110-v1";
import { writerHouseLevel, writerHouseDimensions, WRITER_HOME_BLUEPRINT } from "./civita-room-plan.js?v=civita-room-plan-20261110-v1";
// Retired Tehran apartment support: the original room is now housed on a Civita second floor.
import { CITY_PLACE_CATALOG, auditCityPlan } from "./civita-place-catalog.js?v=civita-catalog-20261110-v1";
import { createCitizens, ROLE_LABELS, ACTIVITY_LABELS, PLACE_LABELS } from "./citizens.js?v=citizens-20261109-v1";
import * as motionArchive from "./citizen-motion-library.js?v=citizens-20261109-v1";
import { initObserverUI } from "./observer-ui.js?v=observatory-20261109-first-paint-v1";
import { solarDate, persianDigits, displayText } from "./persian-display.js?v=observatory-20261108-v2";

/* The writer's world: one room in a quiet town, seen as a dollhouse. Everything on the dashboard
   also lives in the room. Click an object: the camera moves into it and its contents open inside it.
   All user text goes through textContent. */
setTHREE(THREE);

// ============ helpers ============
const $ = (id) => document.getElementById(id);
let observerUI=null;
const STATIC_PUBLIC = location.hostname.endsWith("github.io");
let publicSnapshotAt = null;
function item(text, sub, onClick) {
  const li = document.createElement("li");
  const main = document.createElement("div");
  main.textContent = text;
  li.appendChild(main);
  if (sub) {
    const s = document.createElement("div");
    s.className = "time";
    s.textContent = sub;
    li.appendChild(s);
  }
  if (onClick) { li.classList.add("clickable"); li.addEventListener("click", onClick); }
  return li;
}
async function getJSON(url, opts) {
  if (STATIC_PUBLIC) {
    const pathname = new URL(url, location.href).pathname;
    const base = `/${location.pathname.split("/").filter(Boolean)[0] || ""}/snapshot/`;
    const snapshotFetch = (file) => fetch(`${base}${file}?_=${Date.now()}`, { cache: "no-store" }).then((r) => {
      if (!r.ok) throw new Error(`${file} -> ${r.status}`);
      return r.json();
    });
    if (pathname === "/api/town") return snapshotFetch("town.json");
    if (pathname === "/api/stories") return snapshotFetch("stories.json");
    if (pathname === "/api/status") return snapshotFetch("status.json");
    if (pathname === "/api/planner") return snapshotFetch("planner.json");
    if (pathname === "/api/timeline") return snapshotFetch("timeline.json");
    const story = pathname.match(/^\/api\/stories\/([^/]+)$/);
    if (story) return snapshotFetch(`stories/${encodeURIComponent(decodeURIComponent(story[1]))}.json`);
    throw new Error("این بخش در نسخهٔ عمومی در دسترس نیست.");
  }
  const r = await fetch(url, opts);
  if (!r.ok) throw new Error(`${url} -> ${r.status}`);
  return r.json();
}
const STATUS_TEXT = {
  idle: "آماده", sleeping: "در خواب", working: "در حال نوشتن", criticizing: "منتقد می‌خواند",
  writing: "در حال نوشتن دفترچه", researching: "در حال تحقیق", resting: "در حال استراحت", learning: "در حال درس گرفتن",
  napping: "چرت می‌زند",
};
const TASK_FA = { write: "نوشتن داستان", research: "تحقیق", diary: "دفترچه", notebook: "دفترچه‌ی ایده‌ها", rest: "استراحت", nap: "چرت" };
Object.assign(TASK_FA,{learn:"یادگیری مهارت",weave:"بافت ایده‌ها",question:"پرسش از خودم",brand:"رساندن خودم",letter:"پاسخ به نامه‌ها",wish:"آرزو و باور",polish:"چرخش اتاق",library:"کتابخانه",masterpiece:"پرده‌ای از شاهکار",computer:"کار با کامپیوتر",margins:"سنجش حاشیه‌ها",skills:"دفترچه‌ی مهارت‌ها",bookstore:"خرید از کتابفروشی"});
const BLOCK_FA = { planned: "در انتظار", done: "انجام شد", skipped: "از دست رفت" };
const TASK_HEX = { write: "#b7791f", research: "#4d7f80", diary: "#8a5c7a", notebook: "#6e8f6b", rest: "#5c6f8a", nap: "#3f4a66", learn:"#5f8b69",question:"#6e8d9a",weave:"#a47746",skills:"#698451",margins:"#846b96" };
// the wall canvases are painted from the scene block, before these functions' own section, so their
// palette has to be initialised here; a const further down would still be in its dead zone at that point.
const ACH_FONT = "500 22px Vazirmatn, Tahoma, sans-serif";
const TL_KIND_COLOR = { first: "#b7791f", achievement: "#3f6b45", turning_point: "#8a5c7a", loss: "#9a3412",
                        release: "#2f5f63", ritual: "#6b4a2e", question: "#4d7f80", belief: "#7a5c2f",
                        habit: "#5b6b3a", chapter: "#4a3322" };
const hm = (iso) => (iso ? iso.slice(11, 16) : "—");
const pct = (v) => (v == null ? "—" : `${Math.round(v)}٪`);
const clamp01 = (v) => Math.max(0, Math.min(1, v));
const rand = (() => { let s = 7; return () => ((s = (s * 16807) % 2147483647) / 2147483647); })();

// ============ renderer, scene, camera ============
const stage = $("stage");
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
stage.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x0c0d12, 38, 115);
const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 200);
camera.position.set(0.2, 8.0, 26.0);
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0.05, 0);
controls.enableDamping = true;
controls.maxPolarAngle = Math.PI * 0.49;
controls.minDistance = 1.5;
controls.maxDistance = 140;

// ============ sky, sun, moon, stars, clouds ============
const skyUniforms = { top: { value: new THREE.Color(0x050814) }, bottom: { value: new THREE.Color(0x1a2238) } };
const sky = new THREE.Mesh(
  new THREE.SphereGeometry(120, 32, 16),
  new THREE.ShaderMaterial({
    uniforms: skyUniforms, side: THREE.BackSide, depthWrite: false, fog: false,
    vertexShader: "varying vec3 vPos; void main(){ vPos = (modelMatrix * vec4(position,1.0)).xyz; gl_Position = projectionMatrix * viewMatrix * vec4(vPos,1.0); }",
    fragmentShader: "uniform vec3 top; uniform vec3 bottom; varying vec3 vPos; void main(){ float h = clamp(normalize(vPos).y * 1.6 + 0.12, 0.0, 1.0); gl_FragColor = vec4(mix(bottom, top, h), 1.0); }",
  }),
);
scene.add(sky);

const sun = new THREE.Mesh(new THREE.SphereGeometry(3.2, 24, 24), new THREE.MeshBasicMaterial({ color: 0xfff0c8, fog: false }));
const moon = new THREE.Mesh(new THREE.SphereGeometry(2.0, 24, 24), new THREE.MeshBasicMaterial({ color: 0xf3ecd6, fog: false }));
scene.add(sun, moon);

const starGeo = new THREE.BufferGeometry();
const starPos = [];
for (let i = 0; i < 700; i++) {
  const th = rand() * Math.PI * 2, ph = rand() * Math.PI * 0.45;
  starPos.push(100 * Math.sin(ph) * Math.cos(th), 100 * Math.cos(ph) + 4, 100 * Math.sin(ph) * Math.sin(th));
}
starGeo.setAttribute("position", new THREE.Float32BufferAttribute(starPos, 3));
const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.5, transparent: true, opacity: 0.8, fog: false });
scene.add(new THREE.Points(starGeo, starMat));

function softTexture(inner, outer) {
  const c = document.createElement("canvas"); c.width = c.height = 128;
  const g = c.getContext("2d");
  const grad = g.createRadialGradient(64, 64, 4, 64, 64, 64);
  grad.addColorStop(0, inner); grad.addColorStop(1, outer);
  g.fillStyle = grad; g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
const cloudTex = softTexture("rgba(255,255,255,0.85)", "rgba(255,255,255,0)");
const clouds = [];
for (let i = 0; i < 9; i++) {
  const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: cloudTex, transparent: true, opacity: 0.5, depthWrite: false, fog: false }));
  m.scale.set(18 + rand() * 14, 6 + rand() * 4, 1);
  m.position.set(-60 + rand() * 120, 22 + rand() * 10, -50 - rand() * 30);
  scene.add(m); clouds.push(m);
}

// ============ lights ============
const hemi = new THREE.HemisphereLight(0xb4c8e0, 0x71624d, 0.85);
scene.add(hemi);
const viewFill = new THREE.DirectionalLight(0xc3d6ed, 0.65);
scene.add(viewFill, viewFill.target);
const celestial = new THREE.DirectionalLight(0xfff1d6, 1.0);
celestial.castShadow = true;
celestial.shadow.mapSize.set(1024, 1024);
celestial.shadow.camera.left = -6; celestial.shadow.camera.right = 6;
celestial.shadow.camera.top = 6; celestial.shadow.camera.bottom = -6;
celestial.shadow.camera.near = 1; celestial.shadow.camera.far = 80;
celestial.shadow.bias = -0.0008;
scene.add(celestial, celestial.target);
const deskLight = new THREE.PointLight(0xffc98a, 1.4, 6, 1.7);
deskLight.position.set(2.0, 1.45, -2.25);
scene.add(deskLight);
const floorLampLight = new THREE.PointLight(0xffd6a0, 0.0, 6, 1.8);
floorLampLight.position.set(2.6, 1.55, 2.75);
scene.add(floorLampLight);
// the main room light: a pendant over the middle of the room, plus a small wall light over the bed
const ceilingLight = new THREE.PointLight(0xffe4c0, 0.0, 11, 1.4);
ceilingLight.position.set(0.1, 2.75, 0.0);
ceilingLight.castShadow = true;
ceilingLight.shadow.mapSize.set(512, 512);
ceilingLight.shadow.bias = -0.002;
scene.add(ceilingLight);
const bedLight = new THREE.PointLight(0xffd6a0, 0.0, 4, 1.8);
bedLight.position.set(-2.6, 1.6, 1.9);
scene.add(bedLight);
// a faint, cool night light so viewers can still see the writer sleep
const nightLight = new THREE.PointLight(0x8fa8e0, 0.0, 5, 1.6);
nightLight.position.set(-1.2, 1.9, 1.4);
scene.add(nightLight);
let lightLevel = 1;
// the writer's own polish levers scale these bases; animate() multiplies by the awake/dim factor
let lampBase = 0.25;
let floorLampBase = 0.6;

// ============ materials ============
function canvasTex(w, h, draw, repeat) {
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
  return t;
}
const plankTex = canvasTex(256, 256, (g, w, h) => {
  for (let i = 0; i < 8; i++) {
    const shade = 92 + Math.floor(rand() * 22);
    g.fillStyle = `rgb(${shade + 20},${shade - 8},${shade - 38})`;
    g.fillRect(0, i * 32, w, 32);
    g.fillStyle = "rgba(0,0,0,0.25)"; g.fillRect(0, i * 32, w, 1.5);
    g.fillRect(Math.floor(rand() * w), i * 32, 1.5, 32);
  }
}, [3, 3]);
const wallTex = canvasTex(128, 128, (g, w, h) => {
  g.fillStyle = "#d3c5ae"; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(72,52,34,${rand() * 0.055})`; g.fillRect(rand() * w, rand() * h, 2, 2); }
}, [4, 2]);
const M = {
  wall: new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.95 }),
  floor: new THREE.MeshStandardMaterial({ map: plankTex, roughness: 0.75 }),
  wood: new THREE.MeshStandardMaterial({ color: 0x80553a, roughness: 0.78 }),
  darkWood: new THREE.MeshStandardMaterial({ color: 0x503620, roughness: 0.82 }),
  fabric: new THREE.MeshStandardMaterial({ color: 0x718775, roughness: 0.95 }),
  sofa: new THREE.MeshStandardMaterial({ color: 0x80614a, roughness: 0.95 }),
  linen: new THREE.MeshStandardMaterial({ color: 0xe9e2d6, roughness: 0.95 }),
  paper: new THREE.MeshStandardMaterial({ color: 0xf1ead8, roughness: 0.9 }),
  metal: new THREE.MeshStandardMaterial({ color: 0x2a2a2c, roughness: 0.5, metalness: 0.6 }),
  brass: new THREE.MeshStandardMaterial({ color: 0x9a7640, metalness: 0.7, roughness: 0.35 }),
  cork: new THREE.MeshStandardMaterial({ color: 0x8a6a48, roughness: 1 }),
  board: new THREE.MeshStandardMaterial({ color: 0x2f2a25, roughness: 0.9 }),
  leaf: new THREE.MeshStandardMaterial({ color: 0x3f6b45, roughness: 0.8 }),
  pot: new THREE.MeshStandardMaterial({ color: 0xa0613f, roughness: 0.9 }),
};

const clickables = [];
// Keep the original author's lived-in room. Obsolete four-wing architecture is archived
// in a disabled scene group, not allowed to masquerade as the one-room interior.
const legacyWriterArchitecture = new THREE.Group();
legacyWriterArchitecture.name="legacy-writer-mansion-disabled";
legacyWriterArchitecture.visible=false;scene.add(legacyWriterArchitecture);
const baseWriterRoomShell = new THREE.Group();
baseWriterRoomShell.name="writer-room-shell";scene.add(baseWriterRoomShell);
const expandedWriterRoomShell = new THREE.Group();
expandedWriterRoomShell.name="writer-room-shell-expanded";scene.add(expandedWriterRoomShell);
let writerMeshParent=scene;
function mesh(geo, mat, x, y, z, { cast = true, receive = true, parent = writerMeshParent } = {}) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.castShadow = cast; m.receiveShadow = receive;
  parent.add(m);
  return m;
}
const box = (w, h, d, mat, x, y, z, opt) => mesh(new THREE.BoxGeometry(w, h, d), mat, x, y, z, opt);
function clickable(m, panel, label) { m.userData.panel = panel; m.userData.label = label; clickables.push(m); return m; }

const town = buildTown({ THREE, scene, clickable, canvasTex });
// New district tower/lofts replace duplicated legacy shop volumes at identical lots.
// Keep them in authoring source for navigation regression and compatibility.
const obsoleteShops=town.group.getObjectByName("legacy-shopfront-interiors");
if(obsoleteShops)obsoleteShops.visible=false;
const citizens = createCitizens({ THREE, scene, clickable, motionArchive });
// The original detailed dollhouse remains intact but is not the exterior facade.
const citySceneBaseline = new Set(scene.children);
let serverClockOffset = 0;
let serverUtcOffset = -new Date().getTimezoneOffset();
let previewHour = null;
function worldNow() {
  const now = new Date(Date.now() + serverClockOffset);
  if (previewHour === null) return now;
  const wall = new Date(now.getTime() + serverUtcOffset * 60000);
  wall.setUTCHours(previewHour, 0, 0, 0);
  return new Date(wall.getTime() - serverUtcOffset * 60000);
}
function wallTime(now) {
  return new Date(now.getTime() + (serverUtcOffset + now.getTimezoneOffset()) * 60000);
}

// ============ the house shell (open front, window in the back wall) ============
writerMeshParent=baseWriterRoomShell;
const floor = mesh(new THREE.PlaneGeometry(6, 6), M.floor, 0, 0, 0, { cast: false });
floor.rotation.x = -Math.PI / 2;
box(6.2, 0.12, 6.2, M.darkWood, 0, -0.07, 0, { cast: false });
const WIN = WRITER_HOME_BLUEPRINT.facade.rearWindow;
box(WIN.x0 + 3, 3.2, 0.12, M.wall, (-3 + WIN.x0) / 2, 1.6, -3);
box(3 - WIN.x1, 3.2, 0.12, M.wall, (WIN.x1 + 3) / 2, 1.6, -3);
box(WIN.x1 - WIN.x0, WIN.y0, 0.12, M.wall, (WIN.x0 + WIN.x1) / 2, WIN.y0 / 2, -3);
box(WIN.x1 - WIN.x0, 3.2 - WIN.y1, 0.12, M.wall, (WIN.x0 + WIN.x1) / 2, (3.2 + WIN.y1) / 2, -3);
for (const side of [-1, 1]) {
  // Stage zero is a real SINGLE room: no open doors into non-existent side wings.
  box(0.12, WRITER_HOME_BLUEPRINT.room.height, WRITER_HOME_BLUEPRINT.room.depth,
    M.wall, side*3, WRITER_HOME_BLUEPRINT.room.height/2, 0);
}
// window frame, mullions, sill, glass
const frameMat = new THREE.MeshStandardMaterial({ color: 0xe8e1d3, roughness: 0.6 });
const wx = (WIN.x0 + WIN.x1) / 2, wy = (WIN.y0 + WIN.y1) / 2, ww = WIN.x1 - WIN.x0, wh = WIN.y1 - WIN.y0;
box(ww + 0.12, 0.07, 0.16, frameMat, wx, WIN.y1, -2.98);
box(ww + 0.2, 0.07, 0.3, frameMat, wx, WIN.y0, -2.9);
box(0.07, wh, 0.16, frameMat, WIN.x0, wy, -2.98);
box(0.07, wh, 0.16, frameMat, WIN.x1, wy, -2.98);
box(0.04, wh, 0.06, frameMat, wx, wy, -3);
box(ww, 0.04, 0.06, frameMat, wx, wy + 0.1, -3);
const glass = mesh(new THREE.PlaneGeometry(ww, wh), new THREE.MeshPhysicalMaterial({ color: 0xbfd4e6, transparent: true, opacity: 0.08, roughness: 0.05 }), wx, wy, -3.01, { cast: false });
// curtains
const curtainMat = new THREE.MeshStandardMaterial({ color: 0x7a3e2e, roughness: 1, side: THREE.DoubleSide });
function curtain(x) {
  const g = new THREE.PlaneGeometry(0.45, 2.2, 12, 1);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(p.getX(i) * 28) * 0.04);
  g.computeVertexNormals();
  return mesh(g, curtainMat, x, 1.65, -2.86);
}
const curtains = [curtain(WIN.x0 - 0.2), curtain(WIN.x1 + 0.2)];
box(ww + 1.1, 0.03, 0.03, M.brass, wx, 2.78, -2.86);
// radiator under the window
for (let i = 0; i < 9; i++) box(0.1, 0.5, 0.1, new THREE.MeshStandardMaterial({ color: 0xd9d2c4, roughness: 0.5 }), WIN.x0 + 0.25 + i * 0.19, 0.45, -2.88);
// skirting
box(6, 0.1, 0.03, M.darkWood, 0, 0.05, -2.93, { cast: false });
box(0.03, 0.1, 6, M.darkWood, -2.93, 0.05, 0, { cast: false });
box(0.03, 0.1, 6, M.darkWood, 2.93, 0.05, 0, { cast: false });
// a crown line high on the walls, tying the room together under the beam
box(6, 0.03, 0.03, M.darkWood, 0, 2.98, -2.92, { cast: false });
box(0.03, 0.03, 6, M.darkWood, -2.92, 2.98, 0, { cast: false });
box(0.03, 0.03, 6, M.darkWood, 2.92, 2.98, 0, { cast: false });

// The interior shares the actual front-door anchor with the exterior. Its other
// front-wall polygons are removed only for the reader's dollhouse cutaway camera.
const doorSpec=WRITER_HOME_BLUEPRINT.facade.door;
const roomEntry=clickable(box(doorSpec.width,doorSpec.height,.075,M.darkWood,
  doorSpec.x,doorSpec.height/2,WRITER_HOME_BLUEPRINT.room.depth/2+.035),
  "p-town","درِ خروجی — بازگشت به شهر");
roomEntry.userData.returnToTown=true;
box(doorSpec.width+.24,.12,.18,M.wood,doorSpec.x,doorSpec.height+.05,
  WRITER_HOME_BLUEPRINT.room.depth/2+.03);
// ============ retired four-wing house — preserved solely for backwards compatibility ============
writerMeshParent=legacyWriterArchitecture;
// the room is the upper floor; below live the stairwell, the hallway and the street door
box(6.4, 0.12, 6.4, M.darkWood, 0, -3.06, 0, { cast: false });
for (const side of [-1, 1]) {
  box(0.12, 2.18, 3.35, M.wall, side * 3, -1.91, -1.325);
  box(0.12, 2.18, 1.55, M.wall, side * 3, -1.91, 2.225);
  box(0.12, 0.82, 1.10, M.wall, side * 3, -0.41, 0.70);
}
box(6.12, 3, 0.12, M.wall, 0, -1.5, -3);
// street facade with the door hole at x=-1.2 (the front wall of the room stays off, dollhouse-style)
box(1.35, 3, 0.12, M.wall, -2.325, -1.5, 3);
box(2.25, 3, 0.12, M.wall, 1.125, -1.5, 3);
box(0.9, 0.9, 0.12, M.wall, -1.2, -0.45, 3);
const streetDoor = clickable(box(0.86, 2.1, 0.07, M.darkWood, -1.2, -1.95, 3.0), "p-care", "درِ خیابان — ورودی ساختمان");
streetDoor.userData.view = "building";
mesh(new THREE.SphereGeometry(0.024, 12, 12), new THREE.MeshStandardMaterial({ color: 0xb08d4a, roughness: 0.35, metalness: 0.8 }), -0.86, -1.95, 3.06);
for (const fwx of [0.9, 2.1]) {
  box(0.7, 0.9, 0.05, frameMat, fwx, -1.6, 3.05);
  mesh(new THREE.PlaneGeometry(0.6, 0.8), new THREE.MeshPhysicalMaterial({ color: 0xbfd4e6, transparent: true, opacity: 0.12, roughness: 0.05 }), fwx, -1.6, 3.08, { cast: false });
}
// stairs from the street door up to the room floor, along the west side of the stairwell
for (let i = 0; i < 10; i++) box(0.85, 0.3, 0.34, M.wood, -2.55, -2.85 + i * 0.3, 2.3 - i * 0.33);
box(0.85, 0.06, 3.1, M.darkWood, -2.55, -1.62, 0.6);                 // stair rail slab
function addRoomDoor(side, floorY, z, panel, label) {
  const x = side * 2.96, width = 1.0, height = 2.18;
  for (const dz of [-width / 2 - 0.07, width / 2 + 0.07]) box(0.14, height + 0.16, 0.12, M.darkWood, x, floorY + height / 2, z + dz);
  box(0.14, 0.14, width + 0.26, M.darkWood, x, floorY + height + 0.03, z);
  const hinge = new THREE.Group(); hinge.position.set(x, floorY, z - width / 2); hinge.rotation.y = side * 0.58; legacyWriterArchitecture.add(hinge);
  const leaf = new THREE.Mesh(new THREE.BoxGeometry(0.075, height, width), M.wood);
  leaf.position.set(0, height / 2, width / 2); leaf.castShadow = true; hinge.add(leaf);
  const inset = new THREE.Mesh(new THREE.BoxGeometry(0.025, 1.53, 0.62), M.darkWood);
  inset.position.set(side * 0.05, 1.09, width / 2); hinge.add(inset);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 8), M.brass);
  knob.position.set(side * 0.075, 1.02, width * 0.78); hinge.add(knob);
  clickable(leaf, panel, label);
}
for (const side of [-1, 1]) {
  addRoomDoor(side, 0, 0.70, side < 0 ? "p-planner" : "p-status", side < 0 ? "درِ اتاق کار" : "درِ اتاق خواب");
  addRoomDoor(side, -3.06, 0.70, side < 0 ? "p-status" : "p-status", side < 0 ? "درِ نشیمن" : "درِ آشپزخانه");
}
// hallway: a couple of crates and its own warm light
box(0.4, 0.4, 0.4, M.wood, 2.4, -2.8, -2.4);
box(0.34, 0.34, 0.34, M.wood, 2.4, -2.43, -2.44);
const groundLight = new THREE.PointLight(0xffd6a0, 0.55, 6, 1.8);
groundLight.position.set(-0.5, -1.5, 1.2);
legacyWriterArchitecture.add(groundLight);
// The main dashboard's house: an open-front, two-storey cottage. The existing
// writer room stays live in the centre; real-time home scenes flank it.
const cottagePlaster = new THREE.MeshStandardMaterial({ color: 0xd8c8b0, roughness: 0.96 });
const cottageBeam = new THREE.MeshStandardMaterial({ color: 0x563b29, roughness: 0.88 });
const slateMats = [0x4d5961, 0x58636a, 0x626b70, 0x46545d].map((color) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.94 }));
const warmTile = new THREE.MeshStandardMaterial({ color: 0x9b604c, roughness: 0.92 });

function buildCottageWing(cx, floorY, side, room) {
  const width = 6.1, depth = 6.0, wallH = 3.02;
  const outsideX = cx + side * width / 2;
  const floorMat = room === "kitchen"
    ? new THREE.MeshStandardMaterial({ color: 0xb8a884, roughness: 0.95 }) : M.floor;
  box(width, 0.14, depth, floorMat, cx, floorY - 0.04, 0, { cast: false });
  box(width, wallH, 0.14, cottagePlaster, cx, floorY + wallH / 2, -2.96);
  box(0.14, wallH, depth, cottagePlaster, outsideX, floorY + wallH / 2, 0);
  // Deep wooden lintel and two posts frame the open cutaway, like the reference.
  box(width + 0.12, 0.18, 0.22, cottageBeam, cx, floorY + wallH - 0.08, 2.96);
  for (const x of [cx - width / 2 + 0.10, cx + width / 2 - 0.10])
    box(0.18, wallH, 0.20, cottageBeam, x, floorY + wallH / 2, 2.96);
  // A broad divided window on the garden wall.
  const wy = floorY + 1.78, wx = cx - side * 0.35;
  box(2.25, 1.48, 0.05, new THREE.MeshStandardMaterial({
    color: 0xb8d2d0, roughness: 0.28, emissive: 0x8c6842, emissiveIntensity: 0.12,
  }), wx, wy, -2.86, { cast: false });
  for (const x of [wx - 1.18, wx, wx + 1.18]) box(0.09, 1.62, 0.14, M.lightWood, x, wy, -2.80);
  for (const y of [wy - 0.82, wy + 0.82]) box(2.48, 0.10, 0.14, M.lightWood, wx, y, -2.80);
  box(2.65, 0.13, 0.34, M.lightWood, wx, wy - 0.84, -2.68);
  const hit = clickable(box(width, wallH, depth, new THREE.MeshBasicMaterial({ visible: false }),
    cx, floorY + wallH / 2, 0, { cast: false }), room === "bedroom" ? "p-status" : "p-stories",
    room === "study" ? "اتاق کار در خانهٔ نویسنده" : room === "bedroom" ? "اتاق خواب" : room === "living" ? "نشیمن و شومینه" : "آشپزخانهٔ خانه");
  hit.userData.view = room === "bedroom" ? "bedroom" : "building";

  if (room === "study") {
    // Writer's second writing nook: books, a timber desk, a chair and a green lamp.
    box(2.25, 0.10, 0.88, M.wood, cx, floorY + 0.89, -1.42);
    for (const x of [cx - 0.92, cx + 0.92]) box(0.12, 0.82, 0.78, M.darkWood, x, floorY + 0.43, -1.42);
    box(1.2, 0.56, 0.06, M.darkWood, cx, floorY + 1.47, -1.90);
    for (let i = 0; i < 11; i++) {
      const h = 0.25 + (i % 4) * 0.08;
      box(0.11, h, 0.23, new THREE.MeshStandardMaterial({ color: [0x9d584e,0x58747a,0xc5a66c,0x778565][i%4], roughness: 0.95 }),
        cx - 0.50 + i * 0.10, floorY + 1.20 + h / 2, -1.82);
    }
    box(0.58, 0.08, 0.60, M.wood, cx, floorY + 0.58, 0.05);
    box(0.58, 0.70, 0.07, M.wood, cx, floorY + 0.88, 0.34);
    box(0.13, 0.54, 0.13, M.brass, cx - 0.74, floorY + 1.26, -1.08);
    mesh(new THREE.ConeGeometry(0.23, 0.22, 20, 1, true),
      new THREE.MeshStandardMaterial({ color: 0x788b55, side: THREE.DoubleSide }), cx - 0.74, floorY + 1.60, -1.08, { cast: false });
  } else if (room === "bedroom") {
    // Upstairs bedroom with layered linen, a walnut headboard and bedside lights.
    box(2.75, 0.36, 3.20, M.darkWood, cx, floorY + 0.43, 0.30);
    box(2.62, 0.24, 3.03, M.linen, cx, floorY + 0.72, 0.30);
    box(1.58, 0.12, 1.72, M.fabric, cx, floorY + 0.89, 0.80);
    for (const x of [cx - 0.69, cx + 0.69]) box(0.68, 0.18, 0.48, M.paper, x, floorY + 0.98, -0.83);
    box(2.88, 1.12, 0.16, M.wood, cx, floorY + 0.95, -1.38);
    for (const x of [cx - 1.88, cx + 1.88]) {
      box(0.70, 0.72, 0.60, M.lightWood, x, floorY + 0.38, -0.76);
      mesh(new THREE.SphereGeometry(0.19, 14, 10), new THREE.MeshStandardMaterial({ color: 0xf1d39a, emissive: 0xe1a852, emissiveIntensity: 0.65 }), x, floorY + 0.89, -0.76, { cast: false });
    }
    box(3.8, 0.035, 4.2, warmTile, cx, floorY + 0.05, 0.28, { cast: false });
  } else if (room === "living") {
    // Ground-floor parlour: a stone fireplace, log fire, sofa, rug and coffee table.
    box(2.18, 2.26, 0.45, new THREE.MeshStandardMaterial({ color: 0x958978, roughness: 1 }), cx, floorY + 1.15, -2.63);
    box(1.32, 1.28, 0.10, new THREE.MeshStandardMaterial({ color: 0x29221e, roughness: 1 }), cx, floorY + 0.79, -2.35);
    box(1.52, 0.17, 0.48, M.darkWood, cx, floorY + 0.18, -2.25);
    const fireMat = new THREE.MeshStandardMaterial({ color: 0xf17b31, emissive: 0xff5b20, emissiveIntensity: 1.6, roughness: 0.4 });
    mesh(new THREE.ConeGeometry(0.30, 0.85, 7), fireMat, cx - 0.22, floorY + 0.75, -2.13, { cast: false });
    mesh(new THREE.ConeGeometry(0.28, 0.70, 7), new THREE.MeshStandardMaterial({ color: 0xf6c05f, emissive: 0xff942e, emissiveIntensity: 1.1 }), cx + 0.22, floorY + 0.66, -2.12, { cast: false });
    const fireLight = new THREE.PointLight(0xff9b4a, 1.9, 6, 1.7); fireLight.position.set(cx, floorY + 1.15, -1.65); legacyWriterArchitecture.add(fireLight);
    box(2.88, 0.58, 0.96, M.sofa, cx, floorY + 0.53, 0.26);
    box(2.92, 0.56, 0.16, M.sofa, cx, floorY + 0.91, -0.24);
    for (const x of [cx - 1.25, cx + 1.25]) box(0.36, 0.70, 0.96, M.sofa, x, floorY + 0.63, 0.26);
    box(1.65, 0.09, 0.90, M.lightWood, cx, floorY + 0.45, 1.72);
    for (const x of [cx - 0.63, cx + 0.63]) box(0.10, 0.40, 0.10, M.wood, x, floorY + 0.22, 1.72);
    box(3.7, 0.035, 4.5, new THREE.MeshStandardMaterial({ color: 0x98584c, roughness: 1 }), cx, floorY + 0.06, 0.55, { cast: false });
    box(3.5, 0.02, 4.3, new THREE.MeshStandardMaterial({ color: 0xd6bb8b, roughness: 1 }), cx, floorY + 0.085, 0.55, { cast: false });
    for (const x of [cx - 2.15, cx + 2.15]) {
      mesh(new THREE.CylinderGeometry(0.25, 0.30, 0.46, 14), M.pot, x, floorY + 0.24, 1.82);
      for (let i = 0; i < 5; i++) mesh(new THREE.SphereGeometry(0.21, 9, 8), M.leaf,
        x + Math.cos(i * 1.25) * 0.18, floorY + 0.74 + (i % 2) * 0.14, 1.82 + Math.sin(i * 1.25) * 0.16);
    }
  } else if (room === "kitchen") {
    // Country kitchen with sage cupboards, a stone worktop and a family table.
    const sage = new THREE.MeshStandardMaterial({ color: 0x718575, roughness: 0.88 });
    box(5.15, 0.95, 0.76, sage, cx, floorY + 0.51, -2.25);
    box(5.35, 0.16, 0.91, new THREE.MeshStandardMaterial({ color: 0xd9d0ba, roughness: 0.75 }), cx, floorY + 1.05, -2.22);
    for (let i = 0; i < 6; i++) {
      const x = cx - 2.13 + i * 0.85;
      box(0.03, 0.65, 0.025, M.brass, x, floorY + 0.50, -1.85, { cast: false });
      mesh(new THREE.SphereGeometry(0.035, 10, 8), M.brass, x + 0.24, floorY + 0.51, -1.83, { cast: false });
    }
    box(0.95, 0.035, 0.62, new THREE.MeshStandardMaterial({ color: 0x4f5652, roughness: 0.38, metalness: 0.24 }), cx - 0.8, floorY + 1.15, -2.18, { cast: false });
    box(2.0, 0.13, 1.25, M.wood, cx + 0.3, floorY + 0.83, 0.80);
    for (const x of [cx - 0.45, cx + 1.05]) for (const z of [0.34, 1.25])
      box(0.08, 0.76, 0.08, M.darkWood, x, floorY + 0.39, z);
    for (const x of [cx - 0.84, cx + 1.45]) for (const z of [0.42, 1.24]) {
      box(0.52, 0.10, 0.50, M.wood, x, floorY + 0.47, z);
      box(0.50, 0.56, 0.07, M.wood, x, floorY + 0.76, z + 0.20);
    }
    box(5.0, 0.035, 5.0, new THREE.MeshStandardMaterial({ color: 0xbcb7a4, roughness: 0.98 }), cx, floorY + 0.05, 0, { cast: false });
    for (let x = cx - 2.1; x <= cx + 2.1; x += 0.7) box(0.018, 0.012, 5.0, M.paper, x, floorY + 0.08, 0, { cast: false });
    for (let z = -2.1; z <= 2.1; z += 0.7) box(5.0, 0.012, 0.018, M.paper, cx, floorY + 0.08, z, { cast: false });
  }
}

buildCottageWing(-6.42, 0, -1, "study");
buildCottageWing(6.42, 0, 1, "bedroom");
buildCottageWing(-6.42, -3.06, -1, "living");
buildCottageWing(6.42, -3.06, 1, "kitchen");

// Timber posts, stone base and an open gable join the four rooms to the writer's centre.
for (const x of [-9.48, -3.25, 3.25, 9.48]) {
  box(0.22, 6.36, 0.24, cottageBeam, x, 0.10, 3.08);
  box(0.17, 6.36, 0.18, cottageBeam, x, 0.10, -2.98);
}
box(19.1, 0.24, 0.28, cottageBeam, 0, 0.13, 3.08);
box(19.1, 0.22, 0.25, cottageBeam, 0, 0.13, -2.98);
const gableGeo = new THREE.BufferGeometry();
gableGeo.setAttribute("position", new THREE.Float32BufferAttribute([
  -9.45,3.28,3.13, 9.45,3.28,3.13, 0,5.28,3.13,
],3));
gableGeo.setIndex([0,1,2]); gableGeo.computeVertexNormals();
legacyWriterArchitecture.add(new THREE.Mesh(gableGeo, new THREE.MeshStandardMaterial({ color: 0xc9b89f, roughness: 0.96, side: THREE.DoubleSide })));
const backRoof = box(19.35, 0.18, 4.00, slateMats[1], 0, 4.33, -1.64);
backRoof.rotation.x = -0.48;
box(19.60, 0.20, 0.24, cottageBeam, 0, 5.22, 0.02);
// Hand-laid slate rows on the rear roof slope, staggered like the shingled reference.
for (let row = 0; row < 5; row++) {
  const z = -0.42 - row * 0.59;
  const y = 5.22 + Math.tan(0.48) * z + 0.05;
  const offset = row % 2 ? 0.46 : 0;
  for (let col = 0; col < 19; col++) {
    const x = -8.96 + col * 1.00 + offset;
    if (x > 9.35) continue;
    const tile = box(0.96, 0.035, 0.62, slateMats[(row + col) % slateMats.length], x, y, z, { cast: false });
    tile.rotation.x = -0.48;
  }
}
// Two dormer windows, a pair of terracotta chimneys, and warm garden details.
for (const x of [-3.35, 3.35]) {
  box(1.38, 1.15, 0.30, cottagePlaster, x, 4.63, -2.78);
  box(1.12, 0.82, 0.04, frameMat, x, 4.64, -2.59);
  box(0.06, 0.82, 0.09, M.wood, x, 4.64, -2.55);
  box(1.20, 0.06, 0.09, M.wood, x, 4.64, -2.55);
  box(1.68, 0.14, 0.95, slateMats[0], x, 5.25, -2.53).rotation.x = -0.38;
}
for (const x of [-7.65, 7.65]) {
  box(0.72, 1.85, 0.70, new THREE.MeshStandardMaterial({ color: 0xa87962, roughness: 0.96 }), x, 4.35, -2.44);
  box(0.84, 0.16, 0.82, M.darkWood, x, 5.33, -2.44);
  mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.25, 10), new THREE.MeshStandardMaterial({ color: 0x8e5945, roughness: 0.9 }), x, 5.52, -2.44);
}
// Broaden the front path, add garden steps and a flower border around the cottage.
box(21.5, 0.12, 6.8, new THREE.MeshStandardMaterial({ color: 0x9b9687, roughness: 1 }), 0, -3.12, 5.05, { cast: false });
box(1.75, 0.10, 4.25, new THREE.MeshStandardMaterial({ color: 0xc1b59f, roughness: 1 }), -1.2, -3.02, 4.05, { cast: false });
for (let i = 0; i < 5; i++) {
  box(0.72, 0.06, 0.55, M.paper, -1.2 + (i%2)*0.05, -2.91 + i*0.13, 2.65 + i*0.48, { cast: false });
}
for (const x of [-8.7,-7.7,-6.7,6.7,7.7,8.7]) {
  mesh(new THREE.CylinderGeometry(0.19,0.24,0.45,14), M.pot, x,-2.72,4.10);
  for(let i=0;i<6;i++) mesh(new THREE.SphereGeometry(0.22,9,8), i%2?M.leaf:M.leaf,
    x+Math.cos(i*Math.PI/3)*0.20,-2.22+(i%2)*0.13,4.10+Math.sin(i*Math.PI/3)*0.18);
}
const streetLampMat = new THREE.MeshStandardMaterial({ color: 0xffdf9f, emissive: 0xffac46, emissiveIntensity: 0.65 });
for(const x of [-10.2,10.2]){
  box(0.12,2.25,0.12,M.metal,x,-1.90,5.6);
  box(0.72,0.10,0.10,M.metal,x+0.30,-0.85,5.6);
  mesh(new THREE.SphereGeometry(0.16,12,10),streetLampMat,x+0.60,-0.97,5.6,{cast:false});
}
// the facade answers clicks: the building's floor plan opens inside it
const facade = clickable(box(19.0, 6.4, 0.24, new THREE.MeshBasicMaterial({ visible: false }), 0, 0.10, 3.12, { cast: false }), "p-care", "خانهٔ نویسنده");
facade.userData.view = "building";

// The old 2-storey shell and four wings remain disabled. The working room starts here.
writerMeshParent=scene;
// rug
const rugTex = canvasTex(256, 200, (g, w, h) => {
  g.fillStyle = "#6a2f2a"; g.fillRect(0, 0, w, h);
  g.strokeStyle = "#c9a46a"; g.lineWidth = 6; g.strokeRect(14, 14, w - 28, h - 28);
  g.strokeStyle = "#2f3e4f"; g.lineWidth = 3; g.strokeRect(30, 30, w - 60, h - 60);
  g.fillStyle = "#c9a46a";
  for (let i = 0; i < 5; i++) { g.beginPath(); g.arc(w / 2, h / 2, 12 + i * 14, 0, Math.PI * 2); g.globalAlpha = 0.12; g.fill(); }
  g.globalAlpha = 1;
});
const rug = mesh(new THREE.PlaneGeometry(2.8, 2.1), new THREE.MeshStandardMaterial({ map: rugTex, roughness: 1 }), 0.2, 0.006, 0.35, { cast: false });
rug.rotation.x = -Math.PI / 2;

// ============ the desk corner ============
box(1.8, 0.06, 0.8, M.wood, 1.4, 0.75, -2.25);
for (const [x, z] of [[0.55, -2.6], [2.25, -2.6], [0.55, -1.9], [2.25, -1.9]]) box(0.06, 0.72, 0.06, M.wood, x, 0.36, z);
box(0.45, 0.5, 0.7, M.darkWood, 2.0, 0.42, -2.25);
// A working folio makes the desk feel used: leather blotter, loose manuscript,
// ruled notes, a brass clip and a small ink bottle beside the writer's hand.
const deskBlotter = box(0.72, 0.025, 0.56, new THREE.MeshStandardMaterial({ color: 0x594236, roughness: 0.92 }), 1.48, 0.795, -2.15);
deskBlotter.rotation.y = -0.035;
const writingPage = new THREE.Group(); writingPage.position.set(1.48, 0.814, -2.15); writingPage.rotation.y = -0.035; scene.add(writingPage);
const manuscriptSheet = new THREE.Mesh(new THREE.BoxGeometry(0.43, 0.012, 0.52), M.paper);
manuscriptSheet.receiveShadow = true; writingPage.add(manuscriptSheet);
const manuscriptLines = [];
for (let i = 0; i < 9; i++) {
  const line = new THREE.Mesh(new THREE.BoxGeometry(0.29 - (i % 3) * 0.018, 0.002, 0.004),
    new THREE.MeshStandardMaterial({ color: 0x80684e, roughness: 1 }));
  line.position.set(-0.018 + (i % 3) * 0.009, 0.008, -0.17 + i * 0.035);
  line.visible = false; writingPage.add(line); manuscriptLines.push(line);
}
// Keep the pen and page together visually as a writing station, without making
// the little props obstacles in the walking grid.
const folioClip = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.018, 0.035), M.brass);
folioClip.position.set(0.155, 0.01, -0.23); writingPage.add(folioClip);
const inkBottle = mesh(new THREE.CylinderGeometry(0.032, 0.036, 0.075, 12),
  new THREE.MeshStandardMaterial({ color: 0x253c4b, roughness: 0.35, metalness: 0.08 }), 1.73, 0.84, -2.45);
mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.018, 12), M.brass, 1.73, 0.887, -2.45);
// A compact keyboard and a worn mouse pad make the research/writing station
// read as a lived-in tool rather than a bare monitor on a table.
const keyboardKeys = [];
box(0.56, 0.025, 0.19, new THREE.MeshStandardMaterial({ color: 0x393633, roughness: 0.7 }), 1.36, 0.80, -2.50);
for (let row = 0; row < 3; row++) for (let col = 0; col < 12; col++) {
  const key = box(0.032, 0.014, 0.034, new THREE.MeshStandardMaterial({ color: (row + col) % 5 ? 0x80796e : 0x9a7345, roughness: 0.68 }),
    1.105 + col * 0.046, 0.819, -2.555 + row * 0.05, { cast: false });
  keyboardKeys.push(key);
}
box(0.20, 0.012, 0.15, new THREE.MeshStandardMaterial({ color: 0x6c5542, roughness: 0.98 }), 1.84, 0.788, -2.50, { cast: false });
const mouse = mesh(new THREE.SphereGeometry(0.055, 16, 12), new THREE.MeshStandardMaterial({ color: 0x544d43, roughness: 0.62 }), 1.84, 0.83, -2.50);
mouse.scale.set(0.75, 0.48, 1.15);
// monitor with a live screen
const screenCanvas = document.createElement("canvas");
screenCanvas.width = 512; screenCanvas.height = 300;
const screenCtx = screenCanvas.getContext("2d");
const screenTex = new THREE.CanvasTexture(screenCanvas);
screenTex.colorSpace = THREE.SRGBColorSpace;
box(0.12, 0.3, 0.12, M.metal, 1.4, 0.92, -2.5);
box(0.3, 0.02, 0.2, M.metal, 1.4, 0.79, -2.5);
clickable(box(0.92, 0.56, 0.04, M.metal, 1.4, 1.3, -2.52), "p-stories", "داستان‌ها");
const screen = clickable(mesh(new THREE.PlaneGeometry(0.85, 0.5), new THREE.MeshBasicMaterial({ map: screenTex, toneMapped: false }), 1.4, 1.3, -2.497, { cast: false }), "p-stories", "داستان‌ها");
box(0.5, 0.025, 0.16, new THREE.MeshStandardMaterial({ color: 0x2d2b29, roughness: 0.6 }), 1.4, 0.79, -2.05);
const kb = clickable(box(0.5, 0.03, 0.16, new THREE.MeshStandardMaterial({ color: 0x2d2b29, roughness: 0.6 }), 1.4, 0.79, -2.02), "p-status", "ترمینالِ خودش");
kb.userData.view = "cli";
// manuscripts: one sheet per accepted story, a stack that grows
const stackGroup = new THREE.Group(); stackGroup.position.set(0.82, 0.785, -2.4); scene.add(stackGroup);
// the notes that stayed on those sheets — the reader's and the editor's margins, with their checking
const sheets = clickable(box(0.36, 0.03, 0.46, M.paper, 0.82, 0.79, -2.4), "p-stories", "دست‌نوشته‌ها");
sheets.userData.view = "margins";
// the rework ledger: the old pages it took back and wrote over, kept apart from the fresh sheets
const reworkLedger = clickable(box(0.3, 0.05, 0.4, new THREE.MeshStandardMaterial({ color: 0x6b4a2f, roughness: 0.8 }), 0.42, 0.79, -2.42), "p-stories", "دفترچه‌ی بازنویسی");
reworkLedger.userData.view = "revisions";
// the notebook on the desk: its handwriting lives on these pages and they turn around the spine
const nb = buildNotebook({ THREE, canvasTex, clickable, onTurn: () => { nbTurned = true; } });
nb.group.position.set(0.95, 0.785, -1.98);
nb.group.rotation.y = 0.2;
scene.add(nb.group);
nb.registerPickables();
let nbTurned = false;
clickable(box(0.22, 0.04, 0.3, new THREE.MeshStandardMaterial({ color: 0x2f4a5a, roughness: 0.8 }), 0.62, 0.8, -1.98), "p-diary", "دفترچه‌ی شخصی");
// mug with steam
const mug = mesh(new THREE.CylinderGeometry(0.045, 0.04, 0.1, 16), new THREE.MeshStandardMaterial({ color: 0xe8e1d3, roughness: 0.4 }), 1.92, 0.83, -2.0);
// pen cup: three pens leaning in a brass cup
mesh(new THREE.CylinderGeometry(0.035, 0.03, 0.08, 12), M.brass, 1.72, 0.82, -1.95);
for (let i = 0; i < 3; i++) box(0.008, 0.11, 0.008, new THREE.MeshStandardMaterial({ color: [0x1e1b18, 0x2f4a5a, 0x6b3a2c][i], roughness: 0.6 }), 1.712 + i * 0.012, 0.87, -1.95 + (i - 1) * 0.011).rotation.z = (i - 1) * 0.08;
const steam = [];
const steamTex = softTexture("rgba(255,255,255,0.5)", "rgba(255,255,255,0)");
for (let i = 0; i < 5; i++) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: steamTex, transparent: true, depthWrite: false, opacity: 0.3 }));
  s.scale.set(0.08, 0.08, 1); scene.add(s); steam.push({ s, t: i / 5 });
}
// desk lamp
box(0.22, 0.03, 0.22, M.brass, 2.15, 0.79, -2.5);
const armA = box(0.025, 0.5, 0.025, M.brass, 2.15, 1.04, -2.5); armA.rotation.z = 0.25;
const armB = box(0.025, 0.45, 0.025, M.brass, 2.02, 1.42, -2.42); armB.rotation.z = -0.6;
const shadeMat = new THREE.MeshStandardMaterial({ color: 0x2f4a3a, roughness: 0.5, side: THREE.DoubleSide, emissive: 0xffb860, emissiveIntensity: 0.0 });
const shade = mesh(new THREE.ConeGeometry(0.16, 0.2, 24, 1, true), shadeMat, 1.88, 1.52, -2.3, { cast: false });
shade.rotation.z = 0.5;
const bulbMat = new THREE.MeshBasicMaterial({ color: 0xffe2b0 });
mesh(new THREE.SphereGeometry(0.04, 12, 12), bulbMat, 1.86, 1.45, -2.3, { cast: false });
// chair
box(0.55, 0.06, 0.55, M.wood, 1.4, 0.5, -1.45);
box(0.55, 0.6, 0.05, M.wood, 1.4, 0.85, -1.17);
for (const [x, z] of [[1.17, -1.68], [1.63, -1.68], [1.17, -1.22], [1.63, -1.22]]) box(0.04, 0.48, 0.04, M.wood, x, 0.24, z);
// waste basket: one crumpled page per rejected story
mesh(new THREE.CylinderGeometry(0.16, 0.13, 0.34, 18, 1, true), new THREE.MeshStandardMaterial({ color: 0x3a3836, roughness: 0.7, side: THREE.DoubleSide }), 2.6, 0.17, -1.6);
const crumpleGroup = new THREE.Group(); crumpleGroup.position.set(2.6, 0, -1.6); scene.add(crumpleGroup);
clickable(box(0.34, 0.36, 0.34, new THREE.MeshBasicMaterial({ visible: false }), 2.6, 0.18, -1.6, { cast: false }), "p-stories", "پیش‌نویس‌های رد شده");

// ============ library wall ============
const shelfX = -2.75;
for (let i = 0; i < 5; i++) box(0.36, 0.035, 2.2, M.darkWood, shelfX, 0.1 + i * 0.52, -0.9);
box(0.36, 2.25, 0.04, M.darkWood, shelfX, 1.13, -2.0);
box(0.36, 2.25, 0.04, M.darkWood, shelfX, 1.13, 0.2);
clickable(box(0.38, 2.2, 2.2, new THREE.MeshBasicMaterial({ visible: false }), shelfX, 1.12, -0.9, { cast: false }), "p-books", "کتابخانه");
const bookPalette = [0x8b3a3a, 0x3a6b4a, 0x3a4a8b, 0x8b7a3a, 0x5a3a6b, 0x2f5f63, 0x9a6a3a];
const bookMeshes = [];
for (let i = 0; i < 48; i++) {
  const h = 0.26 + rand() * 0.14;
  const b = box(0.2, h, 0.045 + rand() * 0.03, new THREE.MeshStandardMaterial({ color: bookPalette[i % bookPalette.length], roughness: 0.85 }),
    shelfX + 0.02, 0.12 + Math.floor(i / 12) * 0.52 + h / 2 + 0.02, -1.9 + (i % 12) * 0.17);
  b.visible = false; bookMeshes.push(b);
}
const emptyShelfLabel = makeLabel("کتابخانه — فعلاً خالی", 0.9);
emptyShelfLabel.position.set(-2.55, 2.55, -0.9);
scene.add(emptyShelfLabel);
// a glass case for the one book it is trying to write
box(0.3, 0.22, 0.3, new THREE.MeshStandardMaterial({ color: 0x2b241b, roughness: 0.9 }), -2.6, 2.29, -0.4);
const msCase = clickable(mesh(new THREE.BoxGeometry(0.34, 0.26, 0.34),
  new THREE.MeshStandardMaterial({ color: 0xbfd3d6, roughness: 0.1, transparent: true, opacity: 0.3, side: THREE.DoubleSide }),
  -2.6, 2.31, -0.4, { cast: false }), "p-stories", "قفص شاهکار");
msCase.userData.view = "masterpiece";

// ============ inner life and career corners (every object has a reason to be here) ============
// the core: a drawer under the desk pedestal, the pages it writes about itself
const coreDrawer = clickable(box(0.42, 0.14, 0.02, M.wood, 2.0, 0.5, -1.89), "p-stories", "کشوی هسته");
coreDrawer.userData.view = "core";
coreDrawer.userData.drawer = true;
// the safe: the checkpoints it keeps of itself
const safe = clickable(box(0.3, 0.28, 0.3, M.metal, 2.72, 0.14, -2.15), "p-status", "گاوصندوقِ حافظه");
safe.userData.view = "backups";
// wish jar on the world table
const jar = clickable(mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.15, 18, 1, true),
  new THREE.MeshStandardMaterial({ color: 0xdfe9e6, roughness: 0.12, transparent: true, opacity: 0.5, side: THREE.DoubleSide }),
  -0.16, 0.6, 0.5, { cast: false }), "p-status", "شیشه‌ی آرزوها");
jar.userData.view = "wishes";
const jarLid = mesh(new THREE.CylinderGeometry(0.072, 0.072, 0.014, 18), M.brass, -0.16, 0.685, 0.5, { cast: false });
// three glass layers: mind, knowledge, works — the same writer, three different things
const layerMats = [0x8a5c7a, 0x4d7f80, 0xb7791f].map((c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.2, transparent: true, opacity: 0.55 }));
const layerGeo = new THREE.SphereGeometry(0.05, 18, 14);
const mindSpheres = layerMats.map((m, i) => {
  const s = new THREE.Mesh(layerGeo, m);
  s.position.set(0.52, 0.58 + i * 0.075, 0.16);
  scene.add(s);
  return s;
});
clickable(mindSpheres[1], "p-graph", "ذهن / دانش / آثار").userData.view = "mind";
// the only way out of the room: the publisher's office is elsewhere in town and the writer has no
// key to it — the door stands for that distance. Clicking it opens what the visits are allowed to know.
box(0.1, 2.2, 0.08, M.darkWood, 2.96, 1.1, 1.47);
box(0.1, 2.2, 0.08, M.darkWood, 2.96, 1.1, 2.43);
box(0.1, 0.09, 1.04, M.darkWood, 2.96, 2.24, 1.95);
const outDoor = clickable(box(0.05, 2.1, 0.9, M.wood, 2.965, 1.05, 1.95), "p-books", "درِ بیرون — دفتر ناشر");
outDoor.userData.view = "publisher";
mesh(new THREE.SphereGeometry(0.035, 12, 12), M.brass, 2.93, 1.05, 2.27, { cast: false });
const doorMat = mesh(new THREE.PlaneGeometry(0.72, 0.8), new THREE.MeshStandardMaterial({ color: 0x3a3128, roughness: 1 }), 2.5, 0.008, 1.95, { cast: false });
doorMat.rotation.x = -Math.PI / 2;
const doorLabel = makeLabel("بیرون: دفترِ ناشر در شهر است", 1.0);
doorLabel.position.set(2.4, 2.62, 1.95);
scene.add(doorLabel);
// the four kinds of what it writes, shelved beside the library where the works live
const kindCab = clickable(box(0.44, 0.6, 0.36, M.darkWood, -2.7, 0.3, 0.85), "p-books", "کابینت جور‌ها");
kindCab.userData.view = "kinds";
for (let i = 0; i < 4; i++) box(0.38, 0.1, 0.015, M.brass, -2.7, 0.13 + i * 0.15, 0.67);
// the questions it has not answered — the north end of the east wall, clear of the planner below it
const qBoard = clickable(box(0.03, 0.6, 0.9, new THREE.MeshStandardMaterial({ color: 0x24302b, roughness: 0.95 }), 2.93, 1.6, -2.5), "p-status", "تخته‌ی سوال‌ها");
qBoard.userData.view = "questions";
// the mirror: where it looks for its own persona — on the west wall, away from the window
const mirrorTex = canvasTex(128, 220, (g, w, h) => {
  const grad = g.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, "#cfd8dd"); grad.addColorStop(0.5, "#8f9ba3"); grad.addColorStop(1, "#e6ecef");
  g.fillStyle = grad; g.fillRect(0, 0, w, h);
  g.fillStyle = "rgba(255,255,255,0.35)"; g.fillRect(18, 0, 10, h);
});
const mirror = clickable(mesh(new THREE.CircleGeometry(0.24, 32), new THREE.MeshStandardMaterial({ map: mirrorTex, roughness: 0.12, metalness: 0.7 }), -2.935, 1.7, -0.9, { cast: false }), "p-status", "آینه");
mirror.rotation.y = Math.PI / 2;
mirror.userData.view = "persona";
box(0.03, 0.52, 0.52, M.brass, -2.955, 1.7, -0.9);
// the wall of what it actually reached, painted from evidence — above the desk, clear of the window
const achCanvas = document.createElement("canvas"); achCanvas.width = 512; achCanvas.height = 384;
const achCtx = achCanvas.getContext("2d");
const achTex = new THREE.CanvasTexture(achCanvas); achTex.colorSpace = THREE.SRGBColorSpace;
const achBacking = box(0.98, 0.76, 0.02, M.darkWood, 0.95, 1.95, -2.97);
const achWall = clickable(mesh(new THREE.PlaneGeometry(0.92, 0.7), new THREE.MeshBasicMaterial({ map: achTex, toneMapped: false }), 0.95, 1.95, -2.955, { cast: false }), "p-stories", "دیوار دست‌آوردها");
achWall.userData.view = "achievements";
paintAchievements([]);
// its habits, on the rug it sits on
clickable(rug, "p-status", "عادت‌ها و ریتم روز").userData.view = "habits";
// the life line: every first and milestone it can prove, drawn above the achievements wall
const tlCanvas = document.createElement("canvas"); tlCanvas.width = 1024; tlCanvas.height = 240;
const tlCtx = tlCanvas.getContext("2d");
const tlTex = new THREE.CanvasTexture(tlCanvas); tlTex.colorSpace = THREE.SRGBColorSpace;
box(1.68, 0.46, 0.02, M.darkWood, 1.55, 2.6, -2.97);
const lifeLine = clickable(mesh(new THREE.PlaneGeometry(1.6, 0.38), new THREE.MeshBasicMaterial({ map: tlTex, toneMapped: false }), 1.55, 2.6, -2.955, { cast: false }), "p-stories", "خط زمان زندگی");
lifeLine.userData.view = "timeline";
paintTimeline([]);
// the past it keeps on the shelf: an album of what it can prove and what it invented
const album = clickable(box(0.035, 0.24, 0.19, new THREE.MeshStandardMaterial({ color: 0x6b3a2c, roughness: 0.85 }), -2.66, 1.8, 0.06), "p-stories", "آلبوم گذشته");
album.userData.view = "backstory";
box(0.008, 0.05, 0.03, M.brass, -2.635, 1.86, 0.06);
// the sales ledger: a clipboard by the door — its own record of what it tried to sell, read on the way out
clickable(box(0.04, 0.5, 0.34, M.cork, 2.94, 1.5, 1.15), "p-books", "دفتر فروش").userData.view = "sales";
const ledgerPaper = mesh(new THREE.PlaneGeometry(0.26, 0.4), new THREE.MeshStandardMaterial({ color: 0xf1ead8, roughness: 0.9 }), 2.915, 1.5, 1.15, { cast: false });
ledgerPaper.rotation.y = -Math.PI / 2;
clickable(ledgerPaper, "p-books", "دفتر فروش").userData.view = "sales";
const ledgerClip = mesh(new THREE.TorusGeometry(0.02, 0.005, 6, 14), M.brass, 2.91, 1.77, 1.15, { cast: false });
ledgerClip.rotation.y = Math.PI / 2;
// the life-game plaque: the level, the writing streak and the current chapter, painted from /api/life —
// the visitor's hook into the life story; it hangs on the east wall between the planner and the ledger
const lifeCanvas = document.createElement("canvas"); lifeCanvas.width = 256; lifeCanvas.height = 320;
const lifeCtx = lifeCanvas.getContext("2d");
const lifeTex = new THREE.CanvasTexture(lifeCanvas); lifeTex.colorSpace = THREE.SRGBColorSpace;
box(0.02, 0.56, 0.44, M.darkWood, 2.93, 1.75, 0.35);
const lifeBoard = clickable(mesh(new THREE.PlaneGeometry(0.4, 0.5), new THREE.MeshBasicMaterial({ map: lifeTex, toneMapped: false }), 2.915, 1.75, 0.35, { cast: false }), "p-stories", "تابلوی داستان زندگی");
lifeBoard.rotation.y = -Math.PI / 2;
lifeBoard.userData.view = "life";
function paintLife(life) {
  const g = lifeCtx, W = lifeCanvas.width, H = lifeCanvas.height;
  g.fillStyle = "#191c22"; g.fillRect(0, 0, W, H);
  g.strokeStyle = "#8a6f3f"; g.lineWidth = 6; g.strokeRect(6, 6, W - 12, H - 12);
  g.textAlign = "center";
  g.fillStyle = "#e8d9a8"; g.font = "500 30px Vazirmatn, Tahoma, sans-serif";
  g.fillText("داستان زندگی", W / 2, 52);
  const lv = (life && life.level) || {};
  g.fillStyle = "#f4e9c8"; g.font = "700 64px Vazirmatn, Tahoma, sans-serif";
  g.fillText(life && lv.n != null ? faNum(lv.n) : "—", W / 2, 128);
  g.fillStyle = "#9aa3b2"; g.font = "400 20px Vazirmatn, Tahoma, sans-serif";
  g.fillText("سطح", W / 2, 156);
  if (life && lv.label) { g.fillStyle = "#c8bfa0"; g.font = "400 21px Vazirmatn, Tahoma, sans-serif"; g.fillText(lv.label, W / 2, 194); }
  const pct = Math.max(0, Math.min(1, (life && lv.pct) || 0));
  g.fillStyle = "#2a2f3a"; g.fillRect(36, 218, W - 72, 14);
  g.fillStyle = "#b08d4a"; g.fillRect(36, 218, (W - 72) * pct, 14);
  const st = (life && life.streak) || {};
  if (life) {
    g.fillStyle = "#9aa3b2"; g.font = "400 20px Vazirmatn, Tahoma, sans-serif";
    g.fillText(`زنجیره: ${st.current != null ? faNum(st.current) : "—"} روز`, W / 2, 266);
    const cur = ((life && life.episodes) || []).find((e) => e.current);
    if (cur) { g.fillStyle = "#8a9679"; g.font = "400 18px Vazirmatn, Tahoma, sans-serif"; g.fillText(`فصل ${faNum(cur.n)}: ${cur.label}`, W / 2, 298); }
  }
  lifeTex.needsUpdate = true;
}
paintLife(null);
// the writer's own purse: modelled units earned from sales, spent at the allow-listed bookshop (rung ۵)
// it lives on the world table now — the money is for the world outside this room
const purseBag = clickable(box(0.15, 0.11, 0.13, new THREE.MeshStandardMaterial({ color: 0x7a5230, roughness: 0.92 }), 0.55, 0.6, 0.55), "p-books", "کیسه");
purseBag.userData.view = "purse";
box(0.15, 0.02, 0.02, M.brass, 0.55, 0.66, 0.55);
// its own computer: the tower under the desk it works on for itself
const tower = clickable(box(0.2, 0.42, 0.3, new THREE.MeshStandardMaterial({ color: 0x2a2a2c, roughness: 0.6, metalness: 0.25 }), 2.35, 0.21, -2.62), "p-status", "رایانه‌ی میزش");
tower.userData.view = "sandbox";
const towerLed = mesh(new THREE.PlaneGeometry(0.14, 0.02), new THREE.MeshBasicMaterial({ color: 0x4d7f80, toneMapped: false }), 2.35, 0.36, -2.465, { cast: false });
const towerFan = mesh(new THREE.TorusGeometry(0.05, 0.006, 8, 20), M.metal, 2.35, 0.12, -2.465, { cast: false });
// skills outside writing get their own corner; the bag holds the whole book, evidence included
const skillBag = clickable(box(0.2, 0.18, 0.14, new THREE.MeshStandardMaterial({ color: 0x5b4a36, roughness: 0.95 }), -0.5, 0.09, 0.62), "p-graph", "کیف مهارت‌ها");
skillBag.userData.view = "skillbook";

// ============ walls: pinboard, planner, clock, painting, comment board ============
clickable(box(0.9, 0.72, 0.04, M.cork, -2.35, 1.75, -2.94), "p-flaws", "ایرادها و حدس‌ها");
const noteGroup = new THREE.Group(); noteGroup.position.set(-2.35, 1.75, -2.91); scene.add(noteGroup);

clickable(box(0.04, 1.0, 1.5, M.board, 2.94, 1.7, -1.1), "p-planner", "پلنر امروز");
const tileGroup = new THREE.Group(); tileGroup.position.set(2.91, 1.7, -1.1); scene.add(tileGroup);
const plannerTitle = makeLabel("برنامه‌ی امروز", 0.6);
plannerTitle.position.set(2.85, 2.32, -1.1); scene.add(plannerTitle);

const clockCanvas = document.createElement("canvas"); clockCanvas.width = clockCanvas.height = 256;
const clockTex = new THREE.CanvasTexture(clockCanvas); clockTex.colorSpace = THREE.SRGBColorSpace;
const clockFace = mesh(new THREE.CircleGeometry(0.24, 40), new THREE.MeshStandardMaterial({ map: clockTex, roughness: 0.6 }), 2.935, 2.35, 0.5, { cast: false });
clockFace.rotation.y = -Math.PI / 2;
mesh(new THREE.TorusGeometry(0.245, 0.02, 8, 40), M.darkWood, 2.94, 2.35, 0.5).rotation.y = -Math.PI / 2;
clickable(clockFace, "p-planner", "ساعت و برنامه");

const paintingTex = canvasTex(320, 220, (g, w, h) => {
  const sky = g.createLinearGradient(0, 0, 0, h); sky.addColorStop(0, "#2d3b55"); sky.addColorStop(0.6, "#c98b5a"); sky.addColorStop(1, "#33424f");
  g.fillStyle = sky; g.fillRect(0, 0, w, h);
  g.fillStyle = "#1e2a35"; g.beginPath(); g.moveTo(0, h * 0.7);
  for (let x = 0; x <= w; x += 20) g.lineTo(x, h * 0.7 - Math.sin(x / 40) * 14 - rand() * 8);
  g.lineTo(w, h); g.lineTo(0, h); g.fill();
  g.fillStyle = "rgba(255,226,170,0.85)"; g.beginPath(); g.arc(w * 0.7, h * 0.45, 18, 0, Math.PI * 2); g.fill();
});
const painting = mesh(new THREE.PlaneGeometry(1.1, 0.75), new THREE.MeshStandardMaterial({ map: paintingTex, roughness: 0.8 }), -2.935, 1.95, 1.9, { cast: false });
painting.rotation.y = Math.PI / 2;
// the room itself is a work in progress: the painting of it is where that view opens
clickable(painting, "p-world", "اتاق و نور").userData.view = "room";
box(0.03, 0.82, 1.18, M.darkWood, -2.95, 1.95, 1.9);

// readers' notes live on the west wall, between the mirror and the painting
clickable(box(0.04, 0.8, 1.0, M.cork, -2.94, 1.55, 0.4), "p-comments", "نظرها");
const cardGroup = new THREE.Group(); cardGroup.position.set(-2.91, 1.55, 0.4); scene.add(cardGroup);

// ============ world table: a map with a pin for every place it has found ============
box(1.35, 0.05, 0.8, M.wood, 0.2, 0.5, 0.3);
for (const [x, z] of [[-0.42, -0.05], [0.82, -0.05], [-0.42, 0.65], [0.82, 0.65]]) box(0.05, 0.48, 0.05, M.wood, x, 0.24, z);
const mapTex = canvasTex(256, 160, (g, w, h) => {
  g.fillStyle = "#d9c9a3"; g.fillRect(0, 0, w, h);
  g.strokeStyle = "rgba(90,70,40,0.35)"; g.lineWidth = 1;
  for (let i = 0; i < 9; i++) { g.beginPath(); g.moveTo(0, rand() * h); g.bezierCurveTo(w / 3, rand() * h, w * 2 / 3, rand() * h, w, rand() * h); g.stroke(); }
  g.fillStyle = "rgba(70,110,130,0.35)"; g.beginPath(); g.ellipse(w * 0.3, h * 0.6, 40, 22, 0.3, 0, Math.PI * 2); g.fill();
});
clickable(box(1.2, 0.01, 0.7, new THREE.MeshStandardMaterial({ map: mapTex, roughness: 1 }), 0.2, 0.53, 0.3, { cast: false }), "p-graph", "جهان داستانی");
const pinGroup = new THREE.Group(); pinGroup.position.set(0.2, 0.54, 0.3); scene.add(pinGroup);

// ============ bed, sofa, floor lamp, plant ============
box(2.1, 0.35, 1.4, M.darkWood, -1.85, 0.2, 1.9);
box(2.0, 0.14, 1.32, M.linen, -1.85, 0.43, 1.9);
box(0.06, 0.9, 1.45, M.darkWood, -2.92, 0.45, 1.9);
box(0.42, 0.13, 0.9, M.linen, -2.55, 0.56, 1.9);
clickable(box(2.1, 0.8, 1.4, new THREE.MeshBasicMaterial({ visible: false }), -1.85, 0.4, 1.9, { cast: false }), "p-status", "حال نویسنده");
const blanket = box(1.3, 0.08, 1.36, M.fabric, -1.35, 0.54, 1.9);

box(0.7, 0.42, 1.6, M.sofa, 2.55, 0.21, 0.5);
box(0.22, 0.62, 1.6, M.sofa, 2.85, 0.55, 0.5);
box(0.7, 0.55, 0.16, M.sofa, 2.55, 0.33, -0.3);
box(0.7, 0.55, 0.16, M.sofa, 2.55, 0.33, 1.3);
const cushionMats = [0xb0563f, 0x4f7a5c].map((c) => new THREE.MeshStandardMaterial({ color: c, roughness: 1 }));
for (const [x, z, ry, mi] of [[2.45, 0.08, 0.3, 0], [2.6, 1.0, -0.25, 1]]) box(0.3, 0.09, 0.3, cushionMats[mi], x, 0.47, z).rotation.y = ry;
box(0.36, 0.3, 0.36, new THREE.MeshStandardMaterial({ color: 0xb48a4a, roughness: 1 }), 2.6, 0.55, 0.85).rotation.y = 0.4;
clickable(box(0.75, 0.8, 1.7, new THREE.MeshBasicMaterial({ visible: false }), 2.55, 0.4, 0.5, { cast: false }), "p-status", "حال نویسنده");

box(0.3, 0.03, 0.3, M.metal, 2.6, 0.02, 2.75);
box(0.03, 1.5, 0.03, M.metal, 2.6, 0.77, 2.75);
const floorShadeMat = new THREE.MeshStandardMaterial({ color: 0xe9dcc0, roughness: 0.9, side: THREE.DoubleSide, emissive: 0xffc070, emissiveIntensity: 0 });
mesh(new THREE.CylinderGeometry(0.16, 0.24, 0.3, 24, 1, true), floorShadeMat, 2.6, 1.6, 2.75, { cast: false });

// pendant lamp over the room, hung from a beam across the top of the walls
box(6.0, 0.12, 0.14, M.darkWood, 0, 3.14, 0.0, { cast: false });
box(0.012, 0.32, 0.012, M.metal, 0.1, 2.98, 0.0, { cast: false });
const pendantShadeMat = new THREE.MeshStandardMaterial({ color: 0xe9dcc0, roughness: 0.8, side: THREE.DoubleSide, emissive: 0xffd9a0, emissiveIntensity: 0 });
mesh(new THREE.ConeGeometry(0.28, 0.24, 28, 1, true), pendantShadeMat, 0.1, 2.72, 0.0, { cast: false });
// wall light over the bed
box(0.1, 0.18, 0.12, M.brass, -2.93, 1.6, 1.9, { cast: false });

mesh(new THREE.CylinderGeometry(0.2, 0.15, 0.38, 16), M.pot, 2.45, 0.19, -0.9);
for (let i = 0; i < 9; i++) {
  const leaf = mesh(new THREE.SphereGeometry(0.16, 8, 8), M.leaf, 2.45 + Math.cos(i) * 0.12, 0.5 + (i % 3) * 0.17, -0.9 + Math.sin(i) * 0.12);
  leaf.scale.set(1, 1.6, 0.6); leaf.rotation.set(rand(), rand() * 3, rand());
}

// ============ the wardrobe: locked until the achievements menu opens it ============
const wardrobeWood = new THREE.MeshStandardMaterial({ color: 0x3a2c20, roughness: 0.82 });
const wardrobeDoorMat = new THREE.MeshStandardMaterial({ color: 0x45352a, roughness: 0.85 });
box(0.55, 2.1, 0.62, wardrobeWood, -2.71, 1.05, -2.55);
box(0.62, 0.07, 0.7, wardrobeWood, -2.69, 2.13, -2.55);          // cornice
box(0.58, 0.06, 0.66, wardrobeWood, -2.70, 0.05, -2.55);         // plinth
const wardrobeSeam = box(0.02, 1.92, 0.016, new THREE.MeshStandardMaterial({ color: 0x171009, roughness: 0.9 }), -2.43, 1.03, -2.55);
const knobMat = new THREE.MeshStandardMaterial({ color: 0xb08d4a, roughness: 0.35, metalness: 0.8 });
mesh(new THREE.SphereGeometry(0.024, 12, 12), knobMat, -2.415, 1.06, -2.71);
mesh(new THREE.SphereGeometry(0.024, 12, 12), knobMat, -2.415, 1.06, -2.39);
const lockGroup = new THREE.Group();
const lockRing = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.015, 10, 22), new THREE.MeshStandardMaterial({ color: 0x9a7b3f, roughness: 0.4, metalness: 0.7 }));
lockRing.rotation.y = Math.PI / 2; lockRing.position.y = 0.055; lockGroup.add(lockRing);
lockGroup.add(new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.085, 0.07), new THREE.MeshStandardMaterial({ color: 0x9a7b3f, roughness: 0.45, metalness: 0.65 })));
lockGroup.position.set(-2.41, 1.38, -2.55);
scene.add(lockGroup);
const wardrobe = clickable(box(0.62, 2.1, 0.68, new THREE.MeshBasicMaterial({ visible: false }), -2.71, 1.05, -2.55, { cast: false }), "p-publish", "کمد لباس");
wardrobe.userData.view = "wardrobe";

// dust in the lamp light
const dustGeo = new THREE.BufferGeometry();
const dustPos = new Float32Array(60 * 3);
for (let i = 0; i < 60; i++) { dustPos[i * 3] = 1.2 + rand() * 1.2; dustPos[i * 3 + 1] = 0.9 + rand() * 1.0; dustPos[i * 3 + 2] = -2.4 + rand() * 1.0; }
dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
const dustMat = new THREE.PointsMaterial({ color: 0xffe2b0, size: 0.015, transparent: true, opacity: 0.6, depthWrite: false });
scene.add(new THREE.Points(dustGeo, dustMat));

// ============ text labels (canvas sprites, RTL) ============
function makeLabel(text, width) {
  const c = document.createElement("canvas"); c.width = 512; c.height = 96;
  const g = c.getContext("2d");
  g.direction = "rtl"; g.textAlign = "center"; g.font = "500 40px Vazirmatn, Tahoma, sans-serif";
  g.fillStyle = "rgba(236,230,218,0.85)"; g.fillText(text, 256, 60);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false }));
  s.scale.set(width, width * 96 / 512, 1);
  return s;
}

// ============ the writer: a jointed figure ============
const MAT = {
  skin: new THREE.MeshStandardMaterial({ color: 0xd9b89c, roughness: 0.65 }),
  hair: new THREE.MeshStandardMaterial({ color: 0x2b211c, roughness: 0.8 }),
  shirt: new THREE.MeshStandardMaterial({ color: 0x5b4a6e, roughness: 0.9 }),
  sweater: new THREE.MeshStandardMaterial({ color: 0x8a7a60, roughness: 0.95 }),
  pants: new THREE.MeshStandardMaterial({ color: 0x2f3440, roughness: 0.9 }),
  shoe: new THREE.MeshStandardMaterial({ color: 0x1e1b18, roughness: 0.7 }),
};
const character = new THREE.Group();
scene.add(character);
const pelvis = new THREE.Group(); pelvis.position.y = 0.92; character.add(pelvis);
function capsule(r, len, mat) { const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 6, 12), mat); m.castShadow = true; return m; }
function segment(parent, x, y, len, r, mat) {
  const pivot = new THREE.Group(); pivot.position.set(x, y, 0); parent.add(pivot);
  const m = capsule(r, len - r * 2, mat); m.position.y = -len / 2; pivot.add(m);
  return pivot;
}
const hips = capsule(0.13, 0.12, MAT.pants); hips.rotation.z = Math.PI / 2; hips.position.y = 0.02; pelvis.add(hips);
const thighL = segment(pelvis, -0.1, 0, 0.46, 0.075, MAT.pants);
const thighR = segment(pelvis, 0.1, 0, 0.46, 0.075, MAT.pants);
const shinL = segment(thighL, 0, -0.46, 0.44, 0.06, MAT.pants);
const shinR = segment(thighR, 0, -0.46, 0.44, 0.06, MAT.pants);
for (const shin of [shinL, shinR]) {
  const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.07, 0.22), MAT.shoe);
  shoe.position.set(0, -0.45, 0.05); shoe.castShadow = true; shin.add(shoe);
}
const torso = new THREE.Group(); torso.position.y = 0.06; pelvis.add(torso);
const chest = capsule(0.19, 0.3, MAT.sweater); chest.position.y = 0.3; chest.scale.set(1.15, 1, 0.75); torso.add(chest);
const neck = capsule(0.05, 0.06, MAT.skin); neck.position.y = 0.6; torso.add(neck);
const head = new THREE.Group(); head.position.y = 0.66; torso.add(head);
const skull = new THREE.Mesh(new THREE.SphereGeometry(0.14, 24, 24), MAT.skin); skull.position.y = 0.13; skull.scale.set(0.92, 1.05, 0.98); skull.castShadow = true; head.add(skull);
const hair = new THREE.Mesh(new THREE.SphereGeometry(0.15, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.55), MAT.hair); hair.position.set(0, 0.15, -0.01); head.add(hair);
const hairBack = new THREE.Mesh(new THREE.SphereGeometry(0.145, 20, 16), MAT.hair); hairBack.position.set(0, 0.1, -0.045); hairBack.scale.set(1, 0.9, 0.8); head.add(hairBack);
const glassesMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.4, metalness: 0.5 });
for (const x of [-0.05, 0.05]) { const g = new THREE.Mesh(new THREE.TorusGeometry(0.032, 0.006, 6, 16), glassesMat); g.position.set(x, 0.14, 0.13); head.add(g); }
const writerEyes = [-0.05,0.05].map((x) => {
  const eye = new THREE.Mesh(new THREE.SphereGeometry(0.012,8,6), glassesMat);
  eye.position.set(x,0.14,0.139); head.add(eye); return eye;
});
const upperArmL = segment(torso, -0.27, 0.5, 0.32, 0.055, MAT.sweater);
const upperArmR = segment(torso, 0.27, 0.5, 0.32, 0.055, MAT.sweater);
const foreArmL = segment(upperArmL, 0, -0.32, 0.3, 0.048, MAT.sweater);
const foreArmR = segment(upperArmR, 0, -0.32, 0.3, 0.048, MAT.sweater);
for (const fa of [foreArmL, foreArmR]) { const hand = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 12), MAT.skin); hand.position.y = -0.32; hand.castShadow = true; fa.add(hand); }
const handPaper = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.01, 0.28), M.paper);
handPaper.position.set(-0.05, -0.33, 0.06); foreArmR.add(handPaper);
const handPen = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.14, 8), new THREE.MeshStandardMaterial({ color: 0x1e1b18, roughness: 0.5 }));
handPen.rotation.x = Math.PI / 2;
handPen.position.set(0.02, -0.33, 0.09);
foreArmR.add(handPen);

// thought bubble above the head
const bubbleCanvas = document.createElement("canvas"); bubbleCanvas.width = 640; bubbleCanvas.height = 120;
const bubbleCtx = bubbleCanvas.getContext("2d");
const bubbleTex = new THREE.CanvasTexture(bubbleCanvas); bubbleTex.colorSpace = THREE.SRGBColorSpace;
const bubble = new THREE.Sprite(new THREE.SpriteMaterial({ map: bubbleTex, transparent: true, depthTest: false }));
bubble.scale.set(2.0, 0.375, 1); bubble.renderOrder = 10; scene.add(bubble);
let bubbleText = null;
function drawBubble(text) {
  if (text === bubbleText) return;
  bubbleText = text;
  const g = bubbleCtx; g.clearRect(0, 0, 640, 120);
  g.fillStyle = "rgba(251,249,244,0.94)";
  g.beginPath(); g.roundRect(8, 10, 624, 80, 40); g.fill();
  g.beginPath(); g.arc(320, 102, 9, 0, Math.PI * 2); g.fill();
  g.fillStyle = "#26221d"; g.direction = "rtl"; g.textAlign = "center"; g.font = "30px Vazirmatn, Tahoma, sans-serif";
  const t = text.length > 40 ? text.slice(0, 39) + "…" : text;
  g.fillText(t, 320, 62);
  bubbleTex.needsUpdate = true;
}
const zzz = [0, 1, 2].map((i) => { const s = makeLabel("z", 0.35); s.material.opacity = 0; scene.add(s); return { s, t: i / 3 }; });

// ============ poses ============
const P = (o) => ({ py: 0.92, hip: 0, knee: 0, sh: 0, el: 0, shR: null, elR: null, torso: 0, head: 0, lie: false, ...o });
const POSES = {
  stand:     P({}),
  gaze:      P({ head: -0.12, sh: 0.12, el: -0.25 }),
  stretch:   P({ sh: -2.9, el: -0.2, head: -0.3, torso: -0.08 }),
  type:      P({ py: 0.56, hip: -1.55, knee: 1.55, sh: -0.5, el: -1.05, torso: 0.14, head: 0.28 }),
  read:      P({ py: 0.56, hip: -1.55, knee: 1.55, sh: -0.75, el: -1.25, torso: 0.02, head: 0.45 }),
  write:     P({ py: 0.56, hip: -1.55, knee: 1.55, sh: -0.3, el: -0.7, shR: -0.55, elR: -1.0, torso: 0.18, head: 0.45 }),
  think:     P({ py: 0.56, hip: -1.55, knee: 1.55, sh: -0.25, el: -0.5, shR: -0.85, elR: -2.3, torso: 0.0, head: 0.18 }),
  screenread: P({ py: 0.56, hip: -1.55, knee: 1.55, sh: -0.45, el: -1.0, shR: -0.35, elR: -1.25, torso: 0.06, head: -0.02 }),
  lounge:    P({ py: 0.5, hip: -1.35, knee: 1.25, sh: -0.1, el: -0.5, torso: -0.38, head: -0.18 }),
  standread: P({ sh: -0.75, el: -1.25, head: 0.42 }),
  sleep:     P({ py: 0.14, hip: -1.57, knee: 0.05, torso: -1.57, sh: 0.05, el: -0.1, head: 0.05, lie: true }),
  sitbed:    P({ py: 0.5, hip: -1.5, knee: 1.5, sh: -0.2, el: -0.6, torso: 0.12, head: 0.3 }),
};

// ============ navigation: a grid with A* so the writer walks around furniture ============
const NAV = { min: -2.75, max: 2.75, cell: 0.12 };
const N = Math.round((NAV.max - NAV.min) / NAV.cell) + 1;
const blocked = new Uint8Array(N * N);
const OBSTACLES = [
  [0.45, 2.35, -2.7, -1.8],   // desk
  [1.1, 1.72, -1.75, -1.1],   // chair
  [-2.95, -0.75, 1.15, 2.65], // bed
  [2.15, 2.95, -0.45, 1.45],  // sofa
  [-0.5, 0.9, -0.1, 0.7],     // world table
  [-2.95, -2.52, -2.05, 0.25],// shelves
  [-2.95, -2.4, -2.85, -2.25],// wardrobe (locked until the achievements menu opens it)
  [2.2, 2.7, -1.15, -0.65],   // plant
  [2.4, 2.8, -1.8, -1.4],     // basket
  [2.45, 2.75, 2.6, 2.9],     // floor lamp
  [-1.6, 0.4, -3, -2.75],     // radiator
  [-2.95, -2.45, 0.62, 1.08], // kinds cabinet by the shelves
  [2.45, 2.95, 1.45, 2.45],   // the door out — the writer cannot leave, only stand before it
];
const INFLATE = 0.2;
const toCell = (v) => Math.max(0, Math.min(N - 1, Math.round((v - NAV.min) / NAV.cell)));
const toWorld = (i) => NAV.min + i * NAV.cell;
for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
  const x = toWorld(i), z = toWorld(j);
  for (const [x0, x1, z0, z1] of OBSTACLES) {
    if (x > x0 - INFLATE && x < x1 + INFLATE && z > z0 - INFLATE && z < z1 + INFLATE) { blocked[i * N + j] = 1; break; }
  }
}
const isFree = (i, j) => i >= 0 && j >= 0 && i < N && j < N && !blocked[i * N + j];
function nearestFree(i, j) {
  if (isFree(i, j)) return [i, j];
  for (let r = 1; r < N; r++) for (let di = -r; di <= r; di++) for (let dj = -r; dj <= r; dj++) {
    if (Math.max(Math.abs(di), Math.abs(dj)) === r && isFree(i + di, j + dj)) return [i + di, j + dj];
  }
  return [i, j];
}
function lineFree(a, b) {
  const d = Math.hypot(b.x - a.x, b.z - a.z), steps = Math.ceil(d / (NAV.cell * 0.5));
  for (let s = 0; s <= steps; s++) {
    const x = a.x + (b.x - a.x) * s / steps, z = a.z + (b.z - a.z) * s / steps;
    if (!isFree(toCell(x), toCell(z))) return false;
  }
  return true;
}
function findPath(from, to) {
  const [si, sj] = nearestFree(toCell(from.x), toCell(from.z));
  const [gi, gj] = nearestFree(toCell(to.x), toCell(to.z));
  const key = (i, j) => i * N + j;
  const g = new Float32Array(N * N).fill(Infinity), came = new Int32Array(N * N).fill(-1);
  const open = [[0, si, sj]]; g[key(si, sj)] = 0;
  const h = (i, j) => { const dx = Math.abs(i - gi), dz = Math.abs(j - gj); return Math.max(dx, dz) + 0.41 * Math.min(dx, dz); };
  while (open.length) {
    let best = 0; for (let k = 1; k < open.length; k++) if (open[k][0] < open[best][0]) best = k;
    const [, ci, cj] = open.splice(best, 1)[0];
    if (ci === gi && cj === gj) break;
    for (let di = -1; di <= 1; di++) for (let dj = -1; dj <= 1; dj++) {
      if (!di && !dj) continue;
      const ni = ci + di, nj = cj + dj;
      if (!isFree(ni, nj) || (di && dj && (!isFree(ci + di, cj) || !isFree(ci, cj + dj)))) continue;
      const cost = g[key(ci, cj)] + (di && dj ? 1.414 : 1);
      if (cost < g[key(ni, nj)]) { g[key(ni, nj)] = cost; came[key(ni, nj)] = key(ci, cj); open.push([cost + h(ni, nj), ni, nj]); }
    }
  }
  const pts = [];
  let k = key(gi, gj);
  if (came[k] === -1 && k !== key(si, sj)) return [new THREE.Vector3(to.x, 0, to.z)];
  while (k !== -1) { pts.push(new THREE.Vector3(toWorld(Math.floor(k / N)), 0, toWorld(k % N))); k = came[k]; }
  pts.reverse();
  const out = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    if (i === pts.length - 1 || !lineFree(out[out.length - 1], pts[i + 1])) out.push(pts[i]);
  }
  return out.slice(1);
}

// places in the room; approach is where it stands before sitting or lying down
const SPOTS = {
  desk:     { pos: new THREE.Vector3(1.4, 0, -1.45), approach: new THREE.Vector3(0.72, 0, -1.35), rotY: Math.PI, pose: "type" },
  notes:    { pos: new THREE.Vector3(1.4, 0, -1.45), approach: new THREE.Vector3(0.72, 0, -1.35), rotY: Math.PI, pose: "write" },
  think:    { pos: new THREE.Vector3(1.4, 0, -1.45), approach: new THREE.Vector3(0.72, 0, -1.35), rotY: Math.PI, pose: "think" },
  deskread: { pos: new THREE.Vector3(1.4, 0, -1.45), approach: new THREE.Vector3(0.72, 0, -1.35), rotY: Math.PI, pose: "screenread" },
  library:  { pos: new THREE.Vector3(-2.15, 0, -0.9), rotY: -Math.PI / 2, pose: "standread" },
  window:   { pos: new THREE.Vector3(-0.6, 0, -2.3), rotY: Math.PI, pose: "gaze" },
  table:    { pos: new THREE.Vector3(0.2, 0, -0.42), rotY: 0, pose: "stand" },
  sofa:     { pos: new THREE.Vector3(2.45, 0, 0.5), approach: new THREE.Vector3(1.85, 0, 0.5), rotY: -Math.PI / 2, pose: "lounge" },
  // going to bed: sit on the edge first, then lie down under the blanket
  bed:      { pos: new THREE.Vector3(-1.5, 0, 1.32), approach: new THREE.Vector3(-1.5, 0, 0.85), rotY: Math.PI, pose: "sitbed",
              then: { pos: new THREE.Vector3(-1.5, 0.44, 1.9), rotY: Math.PI / 2, pose: "sleep", after: 2.4 } },
  // standing before the closed door: the office it cannot enter yet
  door:     { pos: new THREE.Vector3(2.2, 0, 1.6), rotY: -Math.PI / 2, pose: "gaze" },
  // before the wardrobe: only an idle stop once the owner has unlocked it
  wardrobe: { pos: new THREE.Vector3(-2.0, 0, -2.55), rotY: -Math.PI / 2, pose: "gaze" },
};
const IDLE_SPOTS = ["window", "table", "library", "door", "wardrobe"];

const walker = { spotName: "window", spot: SPOTS.window, path: [], phase: "settled", pose: POSES.gaze, idleSince: 0,
  stretchUntil: 0, settledAt: 0, stage: "main", risingUntil: 0, pending: null, wakeStretch: false };
character.position.copy(SPOTS.window.pos);
character.rotation.y = SPOTS.window.rotY;

function goTo(name) {
  if (walker.spotName === name && walker.phase !== "leaving") return;
  if (walker.phase === "rising") { walker.pending = name; return; }
  if (walker.phase === "settled" && walker.stage === "then") {
    // lying down: sit up on the edge of the bed first, then get up
    walker.phase = "rising"; walker.risingUntil = clock.elapsedTime + 1.8; walker.pending = name; walker.stage = "main";
    return;
  }
  const from = walker.spot;
  const to = SPOTS[name];
  const path = [];
  if (walker.phase === "settled" && from.approach) path.push(from.approach.clone());
  const start = path.length ? path[0] : character.position;
  path.push(...findPath(start, to.approach || to.pos));
  if (to.approach) path.push(to.pos.clone());
  walker.path = path;
  walker.spot = to; walker.spotName = name;
  walker.phase = "walking";
}

function spotFor(s) {
  if (s.asleep || s.napping || s.status === "sleeping") return "bed";
  if (s.status === "resting") return "sofa";
  if (s.status === "researching") return s.computer && s.computer.mode === "read" ? "deskread" : "desk";
  if (s.status === "working") return "desk";
  if (s.status === "criticizing" || s.status === "learning") return "think";
  if (s.status === "writing") return "notes";
  return null; // idle: it wanders
}

// ============ time of day ============
function dayInfo(now) {
  const h = now.getHours() + now.getMinutes() / 60;
  const sunAngle = ((h - 6) / 12) * Math.PI;           // 0 at 6:00, PI at 18:00
  const sunHeight = Math.sin(sunAngle);
  const day = clamp01(sunHeight * 2.2 + 0.25);
  const dusk = clamp01(1 - Math.abs(sunHeight) * 4) * (h > 4 && h < 21 ? 1 : 0);
  return { h, sunAngle, day, dusk };
}

// ============ boards rebuilt from the API ============
function clearGroup(group) {
  for (const c of [...group.children]) { const i = clickables.indexOf(c); if (i >= 0) clickables.splice(i, 1); group.remove(c); }
}
function rebuildPlannerTiles(plan) {
  clearGroup(tileGroup);
  plan.blocks.slice(0, 24).forEach((b, i) => {
    const col = i % 6, row = Math.floor(i / 6);
    const color = new THREE.Color(TASK_HEX[b.task] || "#888");
    if (b.status === "done") color.multiplyScalar(0.55);
    if (b.status === "skipped") color.setHex(0x3a3a3a);
    const isNow = plan.current && plan.current.id === b.id;
    const t = mesh(new THREE.BoxGeometry(0.01, 0.16, 0.2), new THREE.MeshStandardMaterial({ color, emissive: isNow ? color : 0x000000, emissiveIntensity: 0.9 }),
      0, 0.33 - row * 0.21, 0.6 - col * 0.24, { cast: false, parent: tileGroup });
    clickable(t, "p-planner", `${hm(b.start)} ${TASK_FA[b.task] || b.task} — ${BLOCK_FA[b.status]}`);
  });
}
function rebuildPinboard(flaws) {
  clearGroup(noteGroup);
  const COLORS = { open: 0xe0c060, stuck: 0xd2704a, resolved: 0x8fb58f, retired: 0x9a9a9a };
  flaws.slice(0, 10).forEach((f, i) => {
    const n = mesh(new THREE.BoxGeometry(0.15, 0.13, 0.005), new THREE.MeshStandardMaterial({ color: COLORS[f.status] || 0xe0c060, roughness: 1 }),
      -0.34 + (i % 5) * 0.17, 0.18 - Math.floor(i / 5) * 0.22, 0.01, { cast: false, parent: noteGroup });
    n.rotation.z = (rand() - 0.5) * 0.2;
    clickable(n, "p-flaws", f.problem);
  });
}
function rebuildCommentCards(list) {
  clearGroup(cardGroup);
  list.slice(0, 8).forEach((c, i) => {
    const card = mesh(new THREE.BoxGeometry(0.005, 0.15, 0.2), new THREE.MeshStandardMaterial({ color: i % 2 ? 0xf1ead8 : 0xe2d6bb, roughness: 1 }),
      0, 0.25 - Math.floor(i / 4) * 0.22, 0.34 - (i % 4) * 0.23, { cast: false, parent: cardGroup });
    card.rotation.x = (rand() - 0.5) * 0.2;
    clickable(card, "p-comments", c.text.slice(0, 40));
  });
}
function rebuildWorldPins(locations) {
  clearGroup(pinGroup);
  locations.slice(0, 16).forEach((loc, i) => {
    const pin = mesh(new THREE.ConeGeometry(0.02, 0.07, 8), new THREE.MeshStandardMaterial({ color: 0xa8342a, roughness: 0.5 }),
      -0.5 + ((i * 37) % 100) / 100, 0.035, -0.28 + ((i * 53) % 100) / 180, { parent: pinGroup });
    pin.rotation.x = Math.PI;
    clickable(pin, "p-graph", loc.name);
  });
}
function rebuildStacks(accepted, rejected) {
  clearGroup(stackGroup);
  for (let i = 0; i < Math.min(accepted, 30); i++) {
    const s = mesh(new THREE.BoxGeometry(0.34, 0.006, 0.44), M.paper, (rand() - 0.5) * 0.02, 0.02 + i * 0.008, (rand() - 0.5) * 0.02, { parent: stackGroup });
    s.rotation.y = (rand() - 0.5) * 0.08;
  }
  clearGroup(crumpleGroup);
  for (let i = 0; i < Math.min(rejected, 9); i++) {
    const c = mesh(new THREE.IcosahedronGeometry(0.055, 0), M.paper, (rand() - 0.5) * 0.14, 0.08 + i * 0.03, (rand() - 0.5) * 0.14, { parent: crumpleGroup });
    c.rotation.set(rand() * 3, rand() * 3, rand() * 3);
  }
}
function rebuildBooks(count) {
  bookMeshes.forEach((b, i) => { b.visible = i < Math.min(count, bookMeshes.length); });
  emptyShelfLabel.visible = count === 0;
}

// ============ the screen and the clock ============
let latestTitle = "";
function paintScreen(s) {
  const g = screenCtx;
  g.fillStyle = s.asleep ? "#050506" : "#f4efe4"; g.fillRect(0, 0, 512, 300);
  if (s.asleep) { screenTex.needsUpdate = true; return; }
  if (s.computer) { paintBrowser(g, s.computer); screenTex.needsUpdate = true; return; }
  g.fillStyle = "#e7dfcf"; g.fillRect(0, 0, 512, 34);
  g.direction = "rtl"; g.textAlign = "right";
  g.fillStyle = "#6e665c"; g.font = "18px Vazirmatn, Tahoma, sans-serif";
  g.fillText(STATUS_TEXT[s.status] || "آماده", 496, 23);
  g.fillStyle = "#26221d"; g.font = "500 30px Vazirmatn, Tahoma, sans-serif";
  g.fillText((latestTitle || "داستان تازه").slice(0, 26), 496, 90);
  g.fillStyle = "#c9bfa9";
  for (let i = 0; i < 7; i++) g.fillRect(40 + (i % 3) * 20, 120 + i * 22, 430 - (i % 3) * 40, 8);
  g.fillStyle = "#a8691a"; g.fillRect(40, 120 + 7 * 22, 4, 16);
  screenTex.needsUpdate = true;
}
// the writer's browser on the room computer: thinking, a search with its results, or a page being read
function paintBrowser(g, c) {
  g.fillStyle = "#ffffff"; g.fillRect(0, 0, 512, 300);
  g.fillStyle = "#e9e6e1"; g.fillRect(0, 0, 512, 40);
  g.fillStyle = "#ffffff"; g.beginPath(); g.roundRect(14, 8, 484, 24, 12); g.fill();
  g.direction = "ltr"; g.textAlign = "left"; g.fillStyle = "#555"; g.font = "15px Tahoma, sans-serif";
  const host = c.lang === "fa" ? "fa.wikipedia.org" : "en.wikipedia.org";
  g.fillText(c.mode === "read" ? (c.url || host).replace("https://", "").slice(0, 52) : `${host}/w/index.php?search=…`, 28, 25);
  g.direction = "rtl"; g.textAlign = "right";
  if (c.mode === "think") {
    g.fillStyle = "#6e665c"; g.font = "22px Vazirmatn, Tahoma, sans-serif";
    g.fillText("چه چیزی را جست‌وجو کنم؟", 490, 150);
    g.fillStyle = "#a8691a"; g.fillRect(250, 168, 3, 26);
    return;
  }
  if (c.mode === "search") {
    g.strokeStyle = "#a2a9b1"; g.lineWidth = 2; g.strokeRect(24, 56, 464, 36);
    g.fillStyle = "#202122"; g.font = "500 20px Vazirmatn, Tahoma, sans-serif";
    g.direction = c.lang === "fa" ? "rtl" : "ltr"; g.textAlign = c.lang === "fa" ? "right" : "left";
    g.fillText((c.query || "").slice(0, 36), c.lang === "fa" ? 478 : 34, 81);
    g.font = "17px Vazirmatn, Tahoma, sans-serif";
    (c.results || []).slice(0, 5).forEach((t, i) => {
      g.fillStyle = "#3366cc"; g.fillText(t.slice(0, 40), c.lang === "fa" ? 488 : 24, 124 + i * 34);
      g.fillStyle = "#c8ccd1"; g.fillRect(24, 132 + i * 34, 464, 1);
    });
    if (!(c.results || []).length) { g.fillStyle = "#72777d"; g.fillText("در حال جست‌وجو…", c.lang === "fa" ? 488 : 24, 130); }
    return;
  }
  g.fillStyle = "#202122"; g.font = "500 24px Vazirmatn, Tahoma, sans-serif";
  g.fillText((c.title || "").slice(0, 30), 490, 80);
  g.fillStyle = "#a2a9b1"; g.fillRect(24, 92, 464, 1);
  g.fillStyle = "#c8ccd1";
  for (let i = 0; i < 8; i++) g.fillRect(24 + (i % 4) * 12, 110 + i * 22, 464 - (i % 4) * 30, 7);
}
function paintClock(now) {
  const g = clockCanvas.getContext("2d");
  g.fillStyle = "#efe8da"; g.fillRect(0, 0, 256, 256);
  g.save(); g.translate(128, 128);
  g.fillStyle = "#26221d";
  for (let i = 0; i < 12; i++) { g.save(); g.rotate((i / 12) * Math.PI * 2); g.fillRect(-2, -112, 4, i % 3 ? 10 : 18); g.restore(); }
  const hand = (angle, len, w) => { g.save(); g.rotate(angle); g.fillRect(-w / 2, -len, w, len + 12); g.restore(); };
  const h = now.getHours() % 12, m = now.getMinutes(), s = now.getSeconds();
  hand(((h + m / 60) / 12) * Math.PI * 2, 60, 7);
  hand(((m + s / 60) / 60) * Math.PI * 2, 92, 5);
  g.fillStyle = "#a8691a"; hand((s / 60) * Math.PI * 2, 100, 2);
  g.restore();
  clockTex.needsUpdate = true;
}

// ============ small exterior writer house (independent from private interior) ============
const interiorSceneObjects = scene.children.filter(node => !citySceneBaseline.has(node));
// The original room was authored with floor Y=0, three units ABOVE the town.
// Parent the entire authored room (including its animated writer and props) to
// the actual street-level origin instead of supporting it with a fake lower floor.
const writerInteriorWorldRoot = new THREE.Group();
writerInteriorWorldRoot.name = "writer-interior-street-level";
writerInteriorWorldRoot.position.y = STREET_Y + 3.2; // Civita: furnished room is unchanged, on an interpretive second floor
scene.add(writerInteriorWorldRoot);
for (const node of interiorSceneObjects) writerInteriorWorldRoot.add(node);
// The two architectural shell groups were created BEFORE citySceneBaseline,
// so they are deliberately absent from interiorSceneObjects. Reparent BOTH
// shells explicitly, or their walls remain at world Y=0 while the floor and
// character are lowered to STREET_Y.
writerInteriorWorldRoot.add(baseWriterRoomShell);
writerInteriorWorldRoot.add(expandedWriterRoomShell);
writerInteriorWorldRoot.updateMatrixWorld(true);
// Dynamic room props created later must use the same grounded coordinate frame.
writerMeshParent = writerInteriorWorldRoot;
const writerExterior = new THREE.Group();
writerExterior.name = "writer-home-exterior-v2";
writerExterior.position.y = 3.2; // historic reference shell upper floor, source height unverified
writerExterior.userData.cityApartmentEvidence={kind:"CIVITA_INTERPRETIVE_ARCHITECTURE",floorIndex:1,actualFloorsVerified:false,realLoStudioParcelMatched:false,sourceRoomPreserved:true};
scene.add(writerExterior);
let currentWriterHouseLevel = -1;
let currentWriterSceneMode = "town";
function exteriorPart(geo, material, x, y, z) {
  const m = new THREE.Mesh(geo, material);m.position.set(x,y,z);
  m.castShadow=true;m.receiveShadow=true;writerExterior.add(m);return m;
}
const exteriorWall = new THREE.MeshStandardMaterial({color:0xc7b39a,roughness:.92});
const exteriorRoof = new THREE.MeshStandardMaterial({color:0x56616a,roughness:.9});
const exteriorWood = new THREE.MeshStandardMaterial({color:0x594739,roughness:.84});
const exteriorGlass = new THREE.MeshStandardMaterial({color:0x8daeb4,roughness:.38,metalness:.12});
const exteriorPath = new THREE.MeshStandardMaterial({color:0xb6ac97,roughness:1});
const exteriorGreen = new THREE.MeshStandardMaterial({color:0x5b7956,roughness:1});
// Both facades are drawn from WRITER_HOME_BLUEPRINT. All coordinates below are
// local to the floor, with only the city view offset down to STREET_Y.
function rebuildWriterExterior(level=0){
  // Only the exterior gets replaced; never rebuild/delete the writer rig,
  // authored interior walls, furniture, memory, identity or authored scene.
  for (const child of [...writerExterior.children]) {
    child.traverse?.(part=>{
      const hit=clickables.indexOf(part);if(hit>=0)clickables.splice(hit,1);
      part.geometry?.dispose?.();
    });
    writerExterior.remove(child);
  }
  const [w,d]=writerHouseDimensions(level);
  const exterior=buildCivitaWriterExterior(THREE,writerExterior,{
    roomWidth:w,roomDepth:d,streetY:STREET_Y,parentOffsetY:writerExterior.position.y
  });
  for(const [mesh,description] of [
    [exterior.entrance,"درِ سنگی خانهٔ نویسنده — بازدید از اتاق"],
    [exterior.clickArea,"نمای تاریخی الهام‌گرفته از Civita — خانهٔ نویسنده"]
  ]){
    mesh.userData.writerExterior=true;
    clickable(mesh,"p-status",description);
  }
  writerExterior.userData.plan=WRITER_HOME_BLUEPRINT;
  writerExterior.userData.exteriorStyle="Civita tufa and terracotta, interpretive Lo Studio study";
  writerExterior.userData.actualLoStudioParcelMatched=false;
  currentWriterHouseLevel=level;
}
function rebuildWriterInteriorShell(level=0){
  baseWriterRoomShell.visible=level===0;
  for(const child of [...expandedWriterRoomShell.children]){
    // Stage upgrades must not leave detached click targets in the raycaster.
    // A stale invisible door otherwise steals clicks after a house resize.
    const staleIndex=clickables.indexOf(child);
    if(staleIndex>=0)clickables.splice(staleIndex,1);
    child.visible=false;
    expandedWriterRoomShell.remove(child);child.geometry?.dispose?.();
  }
  if(level===0){expandedWriterRoomShell.visible=false;return;}
  const [w,d]=writerHouseDimensions(level),h=WRITER_HOME_BLUEPRINT.room.height;
  const rear=WRITER_HOME_BLUEPRINT.facade.rearWindow;
  const roomPart=(bw,bh,bd,mat,x,y,z)=>{
    const part=new THREE.Mesh(new THREE.BoxGeometry(bw,bh,bd),mat);
    part.position.set(x,y,z);part.receiveShadow=true;expandedWriterRoomShell.add(part);return part;
  };
  roomPart(w,.12,d,M.darkWood,0,-.06,0);
  roomPart(w,.025,d,M.floor,0,.012,0);
  for(const side of [-1,1])roomPart(.12,h,d,M.wall,side*w/2,h/2,0);
  roomPart(rear.x0+w/2,h,.12,M.wall,(rear.x0-w/2)/2,h/2,-d/2);
  roomPart(w/2-rear.x1,h,.12,M.wall,(rear.x1+w/2)/2,h/2,-d/2);
  roomPart(rear.x1-rear.x0,rear.y0,.12,M.wall,(rear.x0+rear.x1)/2,rear.y0/2,-d/2);
  roomPart(rear.x1-rear.x0,h-rear.y1,.12,M.wall,(rear.x0+rear.x1)/2,(rear.y1+h)/2,-d/2);
  const rim=new THREE.MeshStandardMaterial({color:0xe8e1d3,roughness:.6});
  roomPart(rear.x1-rear.x0,rear.y1-rear.y0,.04,exteriorGlass,
    (rear.x0+rear.x1)/2,(rear.y0+rear.y1)/2,-d/2+.05);
  for(const x of [rear.x0,rear.x1,(rear.x0+rear.x1)/2])
    roomPart(.07,rear.y1-rear.y0,.14,rim,x,(rear.y0+rear.y1)/2,-d/2+.12);
  // Same entrance in the expanded single-storey floor plan.
  const doorSpec=WRITER_HOME_BLUEPRINT.facade.door;
  const entry=roomPart(doorSpec.width,doorSpec.height,.075,M.darkWood,
    doorSpec.x,doorSpec.height/2,d/2+.035);
  entry.userData.returnToTown=true;
  clickable(entry,"p-town","درِ خروجی — بازگشت به شهر");
  // Like the original room, the frontal wall is cut away for the reader.
  expandedWriterRoomShell.visible=true;
}
function updateWriterHouse(acceptedCount){
  const next=writerHouseLevel(acceptedCount);
  if(next!==currentWriterHouseLevel){rebuildWriterExterior(next);rebuildWriterInteriorShell(next);setWriterSceneMode(currentWriterSceneMode);}
}
function setWriterSceneMode(mode){
  currentWriterSceneMode=mode;
  const outdoors=["town","civita","cars","publisher","bookstore"].includes(mode);
  writerExterior.visible=outdoors;
  writerInteriorWorldRoot.visible=!outdoors;
  for(const obj of interiorSceneObjects)obj.visible=!outdoors;
  legacyWriterArchitecture.visible=false;
  baseWriterRoomShell.visible=!outdoors && currentWriterHouseLevel===0;
  expandedWriterRoomShell.visible=!outdoors && currentWriterHouseLevel>0;
}
updateWriterHouse(0);

// ============ camera views ============
function paintAchievements(rowsList) {
  const g = achCtx;
  g.fillStyle = "#efe6d2"; g.fillRect(0, 0, 512, 384);
  g.strokeStyle = "rgba(90,70,40,0.35)"; g.lineWidth = 3; g.strokeRect(8, 8, 496, 368);
  g.direction = "rtl"; g.textAlign = "right";
  g.fillStyle = "#5a3a16"; g.font = "600 26px Vazirmatn, Tahoma, sans-serif";
  g.fillText("دیوار دست‌آوردها", 488, 48);
  g.font = ACH_FONT;
  const rows = (rowsList || []).slice(0, 11);
  rows.forEach((r, i) => {
    g.fillStyle = r.done ? "#3f6b45" : "#a4977f";
    const prog = r.done ? "" : ` — ${Math.round((r.progress || 0) * 100)}٪`;
    g.fillText(`${r.done ? "✓" : "·"} ${r.label}${prog}`, 488, 84 + i * 27);
  });
  if (!rows.length) { g.fillStyle = "#8b7d63"; g.fillText("هنوز چیزی با شاهد ثبت نشده", 488, 100); }
  achTex.needsUpdate = true;
}

// ---------- the life line: a strip of the moments it can prove ----------
function paintTimeline(rowsList, chapters) {
  const g = tlCtx, W = 1024, H = 240;
  g.fillStyle = "#e9dfc8"; g.fillRect(0, 0, W, H);
  g.strokeStyle = "rgba(90,70,40,0.3)"; g.lineWidth = 3; g.strokeRect(8, 8, W - 16, H - 16);
  g.direction = "rtl"; g.textAlign = "right";
  g.fillStyle = "#5a3a16"; g.font = "600 30px Vazirmatn, Tahoma, sans-serif";
  g.fillText("خط زمان زندگی", W - 26, 46);
  const rows = (rowsList || []).filter((e) => e && e.at).sort((a, b) => String(b.at).localeCompare(String(a.at))).slice(0, 14);
  const spineY = 132;
  g.strokeStyle = "rgba(90,70,40,0.45)"; g.lineWidth = 4;
  g.beginPath(); g.moveTo(W - 40, spineY); g.lineTo(40, spineY); g.stroke();
  if (!rows.length) {
    g.fillStyle = "#8b7d63"; g.font = "500 26px Vazirmatn, Tahoma, sans-serif";
    g.fillText("هنوز هیچ لحظه‌ای روی این خط ننشسته است", W - 60, spineY - 18);
  }
  const step = rows.length > 1 ? Math.min(74, (W - 110) / rows.length) : 0;
  rows.forEach((e, i) => {
    const x = W - 62 - i * step;
    g.fillStyle = TL_KIND_COLOR[e.kind] || "#6b4a2e";
    g.beginPath(); g.arc(x, spineY, e.importance >= 3 ? 10 : 6, 0, Math.PI * 2); g.fill();
    if (i % 2 === 0) g.strokeStyle = "rgba(90,70,40,0.35)";
    g.lineWidth = 2; g.beginPath(); g.moveTo(x, spineY - 14); g.lineTo(x, spineY - (i % 2 ? 52 : 34)); g.stroke();
    g.fillStyle = "#3a2f22"; g.font = "500 19px Vazirmatn, Tahoma, sans-serif";
    g.save();
    g.translate(x, spineY - (i % 2 ? 58 : 40));
    g.fillText(String(e.title || "").slice(0, 26), 0, 0);
    g.restore();
    g.fillStyle = "#7a6b52"; g.font = "400 16px Vazirmatn, Tahoma, sans-serif";
    g.fillText(solarDate(String(e.at).slice(0, 10)), x, spineY + 26);
    if (e.label) { g.fillStyle = TL_KIND_COLOR[e.kind] || "#6b4a2e"; g.fillText(e.label, x, spineY + 50); }
  });
  if (rows.length) {
    g.fillStyle = "#6b5a3f"; g.font = "500 20px Vazirmatn, Tahoma, sans-serif"; g.textAlign = "right";
    g.fillText(`${faNum(rows.length)} لحظه‌ی مدارک‌دار · ${faNum(chapters || 0)} دوره`, W - 26, H - 22);
  }
  tlTex.needsUpdate = true;
}
const faNum = (v) => String(v).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[d]);
const residentSummaries = new Map();
function updateTownSummary() {
  const rows = citizens.status();
  if (!rows.length) return;
  const visible = rows.filter((row) => row.visible).length;
  $("town-summary").textContent = `${faNum(rows.length)} شهروند داستان‌دار · ${faNum(visible)} نفر بیدار · شغل ثابت، روتین روزانهٔ متغیر${previewHour === null ? "" : " · پیش‌نمایش ساعت"}`;
  for (const row of rows) {
    const summary = residentSummaries.get(row.id);
    if (summary) summary.textContent = `${row.label} · ${ROLE_LABELS[row.role]||row.role} · ${ACTIVITY_LABELS[row.activity]||row.activity} · ${PLACE_LABELS[row.destination]||row.destination}`;
  }
}
// Pure environment metadata. A venue existing in the 3D city is not proof
// the writer visited it, and no fictional event is inserted into the API.
function renderCityPlaces(){
  const host=$("town-places");if(!host)return;
  const byZone=new Map();
  for(const place of CITY_PLACE_CATALOG){
    if(!byZone.has(place.zone))byZone.set(place.zone,[]);
    byZone.get(place.zone).push(place);
  }
  const rendered=[];
  for(const [zone,places] of byZone){
    const heading=document.createElement("h4");
    heading.className="observer-city-zone";heading.textContent=zone;
    heading.setAttribute("role","listitem");
    rendered.push(heading);
    for(const place of places){
      const article=document.createElement("article");
      article.className="observer-city-place";article.dataset.placeId=place.id;
      article.setAttribute("role","listitem");
      const top=document.createElement("div");
      const title=document.createElement("strong");title.textContent=place.name;
      const label=document.createElement("span");label.textContent=place.kind;
      top.className="observer-city-place-head";top.append(title,label);
      const summary=document.createElement("p");
      summary.textContent=place.description;
      const actions=document.createElement("div");actions.className="observer-city-place-actions";
      const watch=document.createElement("button");
      watch.type="button";watch.textContent="تماشای مکان";
      watch.addEventListener("click",()=>{
        setSide(false);
        setView("town");
        const point=new THREE.Vector3(place.x,place.y+STREET_Y,place.z);
        const tall=place.id==="publishing-tower";
        const offset=tall?new THREE.Vector3(11,12,20):new THREE.Vector3(11,9,19);
        camGoal={target:point,pos:point.clone().add(offset)};
        camMoving=true;
        $("location-label").textContent=place.name;
        $("observer-scene-context").textContent=place.zone;
      });
      const detail=document.createElement("button");
      detail.type="button";detail.textContent="شناخت مکان";
      detail.addEventListener("click",()=>{
        const mesh=clickables.find(m=>m.userData.placeId===place.id);
        if(mesh)inspect(mesh);
        else toast("مدل این مکان هنوز در صحنه بارگذاری نشده است.");
      });
      actions.append(watch,detail);
      article.append(top,summary,actions);rendered.push(article);
    }
  }
  host.replaceChildren(...rendered);
  $("city-places-count").textContent=String(CITY_PLACE_CATALOG.length)+" مکان";
}
// Public Pages exposes a deliberately limited fiction snapshot. Connect its
// safe information to existing journal destinations, without displaying a
// generic dead-end for the reader, city atlas or publisher profile.
function renderPublicObserverPanels(payload){
  if(!STATIC_PUBLIC)return;
  const make=(tag,text,cls)=>{const node=document.createElement(tag);
    node.textContent=text;if(cls)node.className=cls;return node;};
  const action=(label,fn)=>{const button=make("button",label,"observer-safe-action");
    button.type="button";button.addEventListener("click",fn);return button;};
  const target=(id)=>$(id);
  const library=target("p-books");
  if(library){
    const base="/"+(location.pathname.split("/").filter(Boolean)[0]||"");
    const link=make("a","ورود به کتابخانهٔ عمومی","observer-safe-action");
    link.href=base+"/read/";
    const note=make("p","کتاب‌های منتشرشده و داستان‌های قابل مطالعه را در کتابخانه می‌بینید. پیشرفت خواندن در مرورگر خودتان ذخیره می‌شود.","muted small");
    library.replaceChildren(make("h3","کتابخانهٔ نویسنده"),note,link);
  }
  const world=target("p-world");
  if(world){
    const intro=make("p","این فهرست نقشهٔ جهان نمایشی است، نه ثبت سفرهای واقعی نویسنده. بارگذاری فایل و تنظیم قواعد جهان فقط در نسخهٔ خصوصی امکان‌پذیر است.","muted small");
    const count=make("p",`مکان‌های ساخته‌شده: ${CITY_PLACE_CATALOG.length}`,"observer-public-count");
    const list=document.createElement("ul");list.className="list";
    for(const place of CITY_PLACE_CATALOG){
      const item=document.createElement("li");
      const main=make("strong",place.name||place.title||place.id);
      const region=make("span"," · "+(place.zone||"شهر"),"time");
      item.append(main,region);list.append(item);
    }
    world.replaceChildren(make("h3","نقشهٔ محله و مکان‌ها"),intro,count,list,
      action("تماشای شهر",()=>setView("town")),
      action("فهرست شهروندان و مکان‌ها",()=>{selectTab("p-town");setSide(false);}));
  }
  const publishing=target("p-publish");
  if(publishing){
    const details=payload?.publisher?.publisher_core?.core||{};
    const name=payload?.publisher?.name||"مدیر انتشارات محله";
    const data=document.createElement("dl");data.className="facts";
    for(const [label,value] of [
      ["نام",name],["ارزش محوری",details.value||"کیفیت آثار ادبی"],
      ["هدف",details.desire||"پیداکردن و پرورش آثار ارزشمند"],
      ["تعارض درونی",details.inner_conflict||"سختگیری و حمایت از نویسنده"]
    ]){
      const dt=make("dt",label),dd=make("dd",value);data.append(dt,dd);
    }
    const summary=make("p","این نمای عمومی فقط هویت داستانی ناشر را نشان می‌دهد. تصمیم‌های واقعی چاپ، تجربه‌های خصوصی و یادداشت‌های تحریریه منتشر نمی‌شوند.","muted small");
    publishing.replaceChildren(make("h3","پروندهٔ ناشر در جهان داستانی"),summary,data,
      action("دیدن دفتر ناشر در صحنه",()=>setView("publisher")),
      action("پیدا کردن ناشر در شهر",()=>{
        selectTab("p-town");setSide(false);
        const directory=$("town-residents");
        const entry=directory?.querySelector('[data-id="publisher-character"]');
        if(entry){entry.hidden=false;entry.open=true;entry.scrollIntoView({block:"nearest",behavior:"smooth"});}
      }));
  }
}

async function loadTown() {
  try {
    const payload = await getJSON("/api/town");
    citizens.setRoster(payload);
    // Private owner view may reveal the publisher's genuine persistent persona;
    // Pages gets only the explicitly safe fictional proxy from /api/town.
    const publicPublisher={name:"مدیر انتشارات محله",role:"publisher",public_proxy:true};
    const publisherProfile=STATIC_PUBLIC
      ? (payload.publisher||publicPublisher)
      : (await getJSON("/api/publisher").catch(()=>null)) || payload.publisher || publicPublisher;
    const publisherRow=citizens.setPublisherProfile(publisherProfile);
    const identities = new Map(citizens.status().map((resident) => [resident.id, resident]));
    serverClockOffset = Date.parse(payload.clock) - Date.now();
    const zone = payload.clock.match(/([+-])(\d{2}):(\d{2})$/);
    serverUtcOffset = zone ? (zone[1] === "-" ? -1 : 1) * (Number(zone[2]) * 60 + Number(zone[3])) : 0;
    const expanded = new Set([...$("town-residents").children].filter((el) => el.open).map((el) => el.dataset.id));
    residentSummaries.clear();
    const livingRows=[...payload.citizens,
      ...(publisherRow?[{...publisherRow,agent:{id:"publisher-character",enabled:true,mode:"publisher-only",tools:[]}}]:[])];
    const rows = livingRows.map((resident) => {
      const detail = document.createElement("details");
      detail.className = "resident-row"; detail.dataset.id = resident.id; detail.open = expanded.has(resident.id);
      const core=identities.get(resident.id)?.core?.core||resident.core?.core||{};
      detail.dataset.search=[resident.label,ROLE_LABELS[resident.role]||resident.role,
        core.value,core.desire,core.flaw].join(" ").toLocaleLowerCase("fa-IR");
      const filter=$("town-search")?.value.trim().toLocaleLowerCase("fa-IR")||"";
      detail.hidden=Boolean(filter)&&!detail.dataset.search.includes(filter);
      const summary = document.createElement("summary");
      residentSummaries.set(resident.id, summary);
      const meta=identities.get(resident.id)?.core?.core||resident.core?.core||{};
      const essence=document.createElement("p");essence.className="small";
      essence.textContent=`ارزش: ${meta.value||"—"} · نقص: ${meta.flaw||"—"} · هدف: ${meta.desire||"—"}`;
      const social=document.createElement("p");social.className="time";
      social.textContent=resident.role==="publisher"
        ?"ناشر: پروندهٔ گفت‌وگو و تجربه‌های تحریریه در نسخهٔ خصوصی فعال است"
        :"مکالمه و حافظه: طراحی‌شده، هنوز غیرفعال";
      const agent = document.createElement("p");
      agent.className = "time"; agent.textContent = resident.role==="publisher" ? "ناشر مستقل: گفت‌وگوهای واقعی و پروندهٔ بازنویسی فعال؛ ایجنت شهریِ خودکار غیرفعال" : `ایجنت ${resident.agent.id} · غیرفعال · بدون ابزار`;
      const biography = document.createElement("p"); biography.className = "small"; biography.textContent = identities.get(resident.id)?.story || resident.story || "";
      const occupation = document.createElement("p"); occupation.className = "time"; occupation.textContent = resident.role==="publisher" ? `ناشر مستقل · ${publisherProfile?.house||"دفتر نشر محله"}` : `پیشهٔ ثابت: ${ROLE_LABELS[resident.role]} · خانه: ${PLACE_LABELS[resident.home]}`;
      const schedule = document.createElement("ol");
      for (const entry of resident.routine) {
        const time = `${String(Math.floor(entry.start / 60)).padStart(2, "0")}:${String(entry.start % 60).padStart(2, "0")}`;
        schedule.append(item(`${faNum(time)} · ${ACTIVITY_LABELS[entry.activity]} · ${PLACE_LABELS[entry.place]}`));
      }
      const jump=document.createElement("button");
      jump.type="button";jump.className="resident-go-to";
      jump.textContent="دیدن شخصیت در صحنه";
      jump.addEventListener("click",()=>{
        setView(resident.role==="publisher"?"publisher":"town");
        const actor=clickables.find(mesh=>mesh.userData.citizenId===resident.id);
        if(actor)inspect(actor);
        else toast("این شخصیت هنوز در صحنه بارگذاری نشده است.");
      });
      const direct=document.createElement("div");
      direct.className="resident-actions";direct.append(jump);
      detail.append(summary, biography, essence, occupation, social, agent, schedule, direct);
      return detail;
    });
    $("town-residents").replaceChildren(...rows);
    renderPublicObserverPanels(payload);
    updateTownSummary();
  } catch {
    $("town-summary").textContent = "برنامهٔ شهروندان دریافت نشد؛ در به‌روزرسانی بعد دوباره تلاش می‌شود.";
  }
}
async function loadLife() {
  const t = await getJSON("/api/timeline").catch(() => null);
  if (t) paintTimeline(t.spine, (t.chapters || []).length);
  const l = await getJSON("/api/life").catch(() => null);
  if (l) paintLife(l);
  const b = await getJSON("/api/backstory").catch(() => null);
  if (b && !b.no_backstory && album) album.rotation.z = 0.06 + Math.min(0.5, (b.stats?.canon || 0) * 0.02);
}
async function loadPublicTimeline() {
  const timeline = await getJSON("/api/timeline").catch(() => null);
  if (timeline) paintTimeline(timeline.events || [], 0);
}

// ---------- what the writer keeps inside the desk notebook ----------
let nbInk = "#2a2118";
let nbSource = "";
async function loadNotebookPages() {
  const list = await getJSON("/api/stories").catch(() => []);
  const ideas = await getJSON("/api/notebook").catch(() => []);
  const diary = await getJSON("/api/diary").catch(() => []);
  const picked = list.find((s) => s.status === "accepted") || list[0];
  const pages = [];
  if (picked) {
    const full = await getJSON(`/api/stories/${encodeURIComponent(picked.id)}`).catch(() => null);
    const body = String(full?.body || "").replace(/^# .*\n+/, "");
    const chunks = body.match(new RegExp("[\\s\\S]{1,700}", "g")) || [];
    chunks.slice(0, 8).forEach((c, i) => pages.push({ title: i === 0 ? picked.title : "", body: c, ink: nbInk }));
  }
  ideas.slice(0, 4).forEach((r) => pages.push({ title: "ایده", body: r.text, ink: nbInk, stamp: r.status === "new" ? "تازه" : "" }));
  diary.slice(0, 4).forEach((r) => pages.push({ title: "دفترچه", body: r.text, ink: nbInk }));
  nbSource = `${list.length}:${ideas.length}:${diary.length}`;
  nb.setPages(pages, true);
}

// ---------- the room improves itself: these overrides arrive from the writer ----------
let cameraDrift = false;
const roomState = { version: -1 };
function applyRoom(o) {
  if (!o) return;
  const num = (v) => (typeof v === "number" ? v : Number(String(v).replace(/[^\d.\-]/g, "")) || 0);
  if (o.lamp_level != null) {
    const lv = Math.max(0, Math.min(1.6, num(o.lamp_level)));
    lampBase = 0.25 * lv;
    floorLampBase = 0.6 * lv;
  }
  if (o.light_warmth != null) {
    const w = Math.max(0, Math.min(1, num(o.light_warmth)));
    shadeMat.emissive = new THREE.Color().setHSL(0.09 - w * 0.04, 0.75, 0.62);
  }
  if (o.ink_color) { nbInk = String(o.ink_color).slice(0, 9); loadNotebookPages(); }
  if (o.page_turn_speed != null) {
    const mult = num(o.page_turn_speed) || 1;
    nb.setSpeed(mult);
    setTurnSpeed(Math.round(460 / Math.max(0.35, Math.min(3, mult))));   // the same preference drives the book reader
  }
  if (o.camera_drift != null) cameraDrift = !!num(o.camera_drift) || String(o.camera_drift) === "true";
  if (o.wall_poster != null) {
    const on = String(o.wall_poster) !== "off" && num(o.wall_poster) > 0.2;
    achWall.visible = on;
    achBacking.visible = on;
  }
  if (o.book_spine_hue != null) {
    const hue = Math.max(0, Math.min(1, num(o.book_spine_hue)));
    bookMeshes.forEach((b, i) => { b.material.color.setHSL(hue, 0.42, 0.32 + (i % 5) * 0.04); });
  }
}
async function pollRoom() {
  try {
    const r = await getJSON(`/api/room${roomState.version >= 0 ? `?since=${roomState.version}` : ""}`);
    if (r.changed === false && roomState.version === r.version) return;
    roomState.version = r.version;
    applyRoom(r.overrides);
    if (r.queue?.length) toast("پیشنهاد تازه برای اتاق: " + (r.queue[0].lever || ""));
  } catch { /* the room can wait */ }
}
async function loadAchievements() {
  const a = await getJSON("/api/achievements").catch(() => null);
  if (a) paintAchievements(a.rows);
}

// ---------- the wardrobe: colors apply to the character once the owner unlocks it ----------
let wardrobeUnlocked = false;
function applyWardrobe(w) {
  if (!w || w.locked) return;
  const o = w.outfit || {};
  if (o.shirt && /^#[0-9a-fA-F]{6}$/.test(o.shirt)) MAT.shirt.color.set(o.shirt);
  if (o.sweater && /^#[0-9a-fA-F]{6}$/.test(o.sweater)) MAT.sweater.color.set(o.sweater);
  if (o.pants && /^#[0-9a-fA-F]{6}$/.test(o.pants)) MAT.pants.color.set(o.pants);
}
async function loadWardrobe() {
  const w = await getJSON("/api/wardrobe").catch(() => null);
  if (!w) return;
  wardrobeUnlocked = !w.locked;
  applyWardrobe(w);
}
const VIEWS = {
  town:     { pos: [-145, 220, 265], target: [-150, -1, 75] }, // aerial city and sourced Ponte Fellini-Sordi bridge
  civita:   { pos: [-155, 300, 185], target: [-150, -1, 70] }, // both sourced medieval town and bridge route
  cars:     { pos: [11.5, 4.2, 18.4], target: [1.6, -2.35, 8.5] },
  publisher:{ pos: [-5, 17.5, 21.5], target: [-10, 9.6, 0] },
  bookstore:{ pos: [14, 4.6, 11.5], target: [10, -1.3, 0] },
  // The old view framed a 19-unit mansion; stage zero is only one 6x6 room.
  overview: { pos: [1.4, 5.4, 14.5], target: [0, 1.3, 0] },
  building: { pos: [1.6, 4.6, 11.5], target: [0, 1.5, 0] },
  desk:     { pos: [2.7, 2.0, 0.3], target: [1.35, 1.0, -2.0] },
  window:   { pos: [0.6, 1.75, 1.6], target: [-0.6, 1.9, -8] },
  library:  { pos: [0.6, 1.9, 0.8], target: [-2.6, 1.2, -0.9] },
};
let view = "town";
let camGoal = { pos: new THREE.Vector3(...VIEWS.town.pos), target: new THREE.Vector3(...VIEWS.town.target) };
camera.position.copy(camGoal.pos);controls.target.copy(camGoal.target);setWriterSceneMode("town");
scene.fog.near=80;scene.fog.far=520;camera.far=900;camera.updateProjectionMatrix();
controls.maxDistance=370;controls.update();
let camMoving = false;
function setView(name) {
  if (name !== "follow" && !VIEWS[name]) return;
  focus = null;
  closeInspect(false);
  view = name;
  setWriterSceneMode(name);
  // Aerial geographic inspection only; other cameras retain their original contract.
  controls.maxDistance = name === "civita" ? 370 : name === "town" ? 370 : 140;
  controls.maxPolarAngle = (name==="town" || name==="civita") ? 1.08 : Math.PI*0.49;
  camera.far = name === "civita" ? 950 : name === "town" ? 950 : 200;
  // Only outdoor geographic views need city-scale visibility. Restore the
  // original interior fog without touching author-room geometry or content.
  scene.fog.near = name === "civita" ? 95 : name === "town" ? 56 : 38;
  scene.fog.far = name === "civita" ? 680 : name === "town" ? 270 : 115;
  camera.updateProjectionMatrix();
  sky.scale.setScalar(name === "civita" ? 5 : 1);
  document.querySelectorAll(".stage-tools button[data-view]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.view === name)));
  document.getElementById("writer-block-map-view")?.setAttribute("aria-pressed",String(name==="civita"));
  if (name !== "follow") {
    camGoal = { pos: new THREE.Vector3(...VIEWS[name].pos), target: new THREE.Vector3(...VIEWS[name].target) };
    // Room view coordinates describe the writer's local 6x6 floor.
    // The entire live room is now grounded at STREET_Y, not above the city.
    if (!["town","civita","cars","publisher","bookstore"].includes(name)) {
      camGoal.pos.y += writerInteriorWorldRoot.position.y;
      camGoal.target.y += writerInteriorWorldRoot.position.y;
    }
    if (["town", "building", "publisher", "bookstore"].includes(name)) camGoal.pos.sub(camGoal.target).multiplyScalar(Math.max(1, Math.min(1.8, 1.2 / camera.aspect))).add(camGoal.target);
    if (name === "civita") camGoal.pos.sub(camGoal.target).multiplyScalar(Math.max(1,1.45/Math.max(.68,camera.aspect))).add(camGoal.target);
  }
  const names = { cars: "ماشین‌های شهر", town: "سیویتا دی بانیورجو (نقشهٔ OSM)", civita: "سیویتا از بالا — داده‌های OSM", publisher: "دفتر ناشر", bookstore: "کتاب‌فروشی", building: "ساختمان نویسنده", overview: "اتاق نویسنده", follow: "همراه نویسنده", desk: "میز کار", window: "پنجره", library: "کتابخانهٔ خانه" };
  $("location-label").textContent = names[name] || "اتاق نویسنده";
  observerUI?.syncView(name);
  camMoving = true;
}
document.querySelectorAll(".stage-tools button[data-view]").forEach((b) => b.addEventListener("click", () => setView(b.dataset.view)));
document.getElementById("writer-block-map-view")?.addEventListener("click",()=>setView("civita"));
document.querySelectorAll("[data-inspect]").forEach((b) => b.addEventListener("click", () => {
  const object = clickables.find((c) => c.userData.view === b.dataset.inspect);
  if (object) inspect(object);
}));
$("scene-time").addEventListener("change", (e) => {
  previewHour = e.target.value === "live" ? null : Number(e.target.value);
  $("time-preview-note").hidden = previewHour === null;
});
$("scene-exposure").addEventListener("input", (e) => {
  renderer.toneMappingExposure = Number(e.target.value);
});
controls.addEventListener("start", () => { camMoving = false; if (focus) { closeInspect(false); } if (view !== "follow") { view = "free"; document.querySelectorAll(".stage-tools button").forEach((b) => b.setAttribute("aria-pressed", "false")); } });

// ============ zooming into a thing, and the drawer it opens ============
let focus = null;
let drawerOpen = false;
let drawerSlide = 0;
function setFocus(f) {
  focus = f;
  if (f) {
    view = "focus";
    document.querySelectorAll(".stage-tools button").forEach((b) => b.setAttribute("aria-pressed", "false"));
    camMoving = true;
  } else {
    setView("overview");
    drawerOpen = false;
  }
}

// ============ the loop ============
// City weather is independent of author/citizen simulation time and previewHour.
const cityWeatherService=createCivitaWeatherService();
let cityAtmosphere=cityWeatherService.snapshot();
let lastCityWeatherTick=-2;
const cityWeatherNotice=document.createElement("p");
cityWeatherNotice.id="civita-weather-status";
cityWeatherNotice.className="small muted";
cityWeatherNotice.setAttribute("role","status");
const cityWeatherText=document.createElement("span");
const cityWeatherCredit=document.createElement("a");
cityWeatherCredit.href="https://open-meteo.com/en/docs";
cityWeatherCredit.target="_blank";
cityWeatherCredit.rel="noopener noreferrer";
cityWeatherCredit.textContent=" · مدل آب‌وهوا: Open-Meteo";
cityWeatherNotice.append(cityWeatherText,cityWeatherCredit);
document.getElementById("town-summary")?.insertAdjacentElement("afterend",cityWeatherNotice);
cityWeatherText.textContent=civitaWeatherLabel(cityAtmosphere);
const clock = new THREE.Clock();
let state = { asleep: false, status: "idle", library_books: 0, accepted_count: 0, rejected_count: 0 };
let lastClock = 0;
const cur = { ...POSES.gaze, shR: POSES.gaze.sh, elR: POSES.gaze.el };
let lastCounts = "";
let lastReached = -1;
const tmpV = new THREE.Vector3();

function animate() {
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;
  const now = worldNow();
  citizens.update(dt, t, now, town.trafficState());
  // Retire the former Tehran-layout citizen VISUALS without mutating roster,
  // identities, stories, publisher state, simulation routes or writer figure.
  // The active Civita town supplies independent OSM-footway ambient walkers.
  const showingCivitaOutdoors=["town","civita","cars","publisher","bookstore"].includes(view);
  if(showingCivitaOutdoors){
    for(const node of scene.children)
      if(node.userData?.citizenId)node.visible=false;
  }

  // the notebook turns its own pages; the core drawer slides when it is opened
  nb.update(dt);
  if (nbTurned) { nbTurned = false; loadNotebookPages(); }
  const drawerGoal = drawerOpen ? 0.24 : 0;
  drawerSlide += (drawerGoal - drawerSlide) * Math.min(1, dt * 7);
  coreDrawer.position.z = -1.89 + drawerSlide;
  jarLid.position.y = 0.685 + Math.sin(t * 0.7) * 0.004;
  mindSpheres.forEach((s, i) => { s.position.y = 0.58 + i * 0.075 + Math.sin(t * 0.8 + i) * 0.008; });
  lockGroup.visible = !wardrobeUnlocked;

  // --- getting up from bed: once it has sat up, walk to where it wants to go and stretch when it arrives
  if (walker.phase === "rising" && t >= walker.risingUntil) {
    const next = walker.pending; walker.pending = null;
    walker.phase = "settled"; walker.stage = "main";
    if (next) { goTo(next); walker.wakeStretch = true; }
  }

  // --- behaviour: the server decides the activity; when idle the writer wanders and stretches
  const wanted = spotFor(state);
  if (wanted) goTo(wanted);
  else if (walker.phase === "settled" && t - walker.idleSince > 22) {
    const options = IDLE_SPOTS.filter((n) => n !== walker.spotName && (n !== "wardrobe" || wardrobeUnlocked));
    goTo(options[Math.floor(rand() * options.length)]);
  }

  // --- walking along the path
  let walking = false;
  if (walker.phase === "walking") {
    const next = walker.path[0];
    if (!next) {
      walker.phase = "settled"; walker.idleSince = t; walker.settledAt = t;
      if (walker.wakeStretch || (!wanted && rand() < 0.35)) walker.stretchUntil = t + 3;
      walker.wakeStretch = false;
    } else {
      const dx = next.x - character.position.x, dz = next.z - character.position.z;
      const dist = Math.hypot(dx, dz);
      const isLast = walker.path.length === 1 && walker.spot.approach;
      if (dist < 0.04) walker.path.shift();
      else {
        const step = Math.min(dist, dt * (isLast ? 0.6 : 1.0));
        character.position.x += (dx / dist) * step;
        character.position.z += (dz / dist) * step;
        if (!isLast) {
          const face = Math.atan2(dx, dz);
          let d = face - character.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d));
          character.rotation.y += d * Math.min(1, dt * 8);
          walking = true;
        }
      }
    }
  }
  const settled = walker.phase === "settled";
  const rising = walker.phase === "rising";
  // a spot can have a second stage (sit on the bed, then lie down); "tgt" is the stage it is in now
  const inThen = settled && walker.spot.then && t - walker.settledAt > walker.spot.then.after;
  walker.stage = inThen ? "then" : "main";
  const tgt = inThen ? walker.spot.then : walker.spot;
  const lying = inThen && tgt.pose === "sleep";
  if (settled || rising) {
    character.position.lerp(tgt.pos, Math.min(1, dt * 1.6));
  } else {
    const ySpot = walker.path.length <= 1 && walker.spot.approach ? walker.spot.pos.y : 0;
    character.position.y += (ySpot - character.position.y) * Math.min(1, dt * 4);
  }
  if (!walking) {
    let d = tgt.rotY - character.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d));
    character.rotation.y += d * Math.min(1, dt * (lying || rising ? 1.8 : 4));
  }

  // --- pose blending
  let pose = POSES[tgt.pose] || POSES.stand;
  if (walking || (!settled && !rising && !(walker.path.length <= 1 && walker.spot.approach))) pose = POSES.stand;
  if (settled && t < walker.stretchUntil) pose = POSES.stretch;
  const k = Math.min(1, dt * 4.5);
  for (const key of ["py", "hip", "knee", "sh", "el", "torso", "head"]) cur[key] += (pose[key] - cur[key]) * k;
  cur.shR += ((pose.shR ?? pose.sh) - (cur.shR ?? cur.sh)) * k;
  cur.elR += ((pose.elR ?? pose.el) - (cur.elR ?? cur.el)) * k;

  const stride = walking ? Math.sin(t * 7.5) : 0;
  const breathe = walking ? 0 : Math.sin(t * 1.5) * 0.015;
  pelvis.position.y = cur.py + (walking ? Math.abs(Math.cos(t * 7.5)) * 0.03 : 0);
  thighL.rotation.x = cur.hip + stride * 0.5;
  thighR.rotation.x = cur.hip - stride * 0.5;
  shinL.rotation.x = cur.knee + (walking ? Math.max(0, -stride) * 0.9 : 0);
  shinR.rotation.x = cur.knee + (walking ? Math.max(0, stride) * 0.9 : 0);
  torso.rotation.x = cur.torso + breathe;
  // standing idle: a slow weight shift, like someone thinking on their feet
  const sway = settled && !walking && (pose === POSES.stand || pose === POSES.gaze) ? Math.sin(t * 0.5) * 0.025 : 0;
  torso.rotation.z += (sway - torso.rotation.z) * Math.min(1, dt * 3);
  upperArmL.rotation.x = cur.sh - stride * 0.4;
  upperArmR.rotation.x = cur.shR + stride * 0.4;
  foreArmL.rotation.x = cur.el - (walking ? 0.25 : 0);
  foreArmR.rotation.x = cur.elR - (walking ? 0.25 : 0);
  upperArmL.rotation.z = -0.06; upperArmR.rotation.z = 0.06;
  if (settled && pose === POSES.type) {
    // Short alternating key presses with a breathing pause, instead of a
    // constant mechanical oscillation.
    const typing = Math.sin(t * 8.4);
    foreArmL.rotation.x += Math.sin(t * 15.5) * 0.045 * (typing > -0.35 ? 1 : 0.22);
    foreArmR.rotation.x += Math.cos(t * 14.2) * 0.05 * (typing < 0.35 ? 1 : 0.22);
    foreArmL.rotation.z += Math.sin(t * 4.2 + 1.1) * 0.018;
    keyboardKeys.forEach((key, i) => {
      const press = Math.max(0, Math.sin(t * 12 + i * 2.1));
      key.position.y = 0.819 - press * 0.004;
    });
  } else {
    keyboardKeys.forEach((key) => { key.position.y += (0.819 - key.position.y) * Math.min(1, dt * 8); });
  }
  if (settled && pose === POSES.write) {
    const stroke = Math.sin(t * 8.5);
    foreArmR.rotation.z = stroke * 0.095;
    foreArmR.rotation.x += Math.sin(t * 5.2) * 0.035;
    foreArmL.rotation.z += Math.sin(t * 0.8) * 0.025;
    // The page fills with ink as the writing session advances, then turns and
    // starts fresh. The cycle is visual only; actual work remains server-led.
    const pagePhase = (t % 72) / 72;
    manuscriptLines.forEach((line, i) => { line.visible = pagePhase > i / manuscriptLines.length * 0.72; });
    writingPage.rotation.z += (Math.sin(t * 0.17) * 0.018 - writingPage.rotation.z) * Math.min(1, dt * 1.2);
  } else {
    manuscriptLines.forEach((line) => { line.visible = false; });
    writingPage.rotation.z += (0 - writingPage.rotation.z) * Math.min(1, dt * 1.5);
    foreArmR.rotation.z = 0;
  }
  head.rotation.x = cur.head + (settled && pose === POSES.write ? Math.max(0, Math.sin(t * 0.8)) * 0.035 : 0);
  // at the desk the eyes stay near the page; standing at the window they wander
  const deskFocus = settled && (pose === POSES.type || pose === POSES.write || pose === POSES.screenread);
  head.rotation.y = lying ? Math.sin(t * 0.12) * 0.35 : deskFocus ? Math.sin(t * 0.6) * 0.05
    : pose === POSES.gaze ? Math.sin(t * 0.3) * 0.3 : Math.sin(t * 0.4) * 0.12;
  const blink = Math.max(0,1-Math.abs((t%5.2)-.15)/.13);
  for (const eye of writerEyes) eye.scale.y=1-blink*.94;
  if (settled && pose === POSES.read) {
    foreArmR.rotation.z += Math.max(0,1-Math.abs((t%6.8)-5.1)/.45)*.13;
  }
  if (settled && pose === POSES.think) {
    head.rotation.z=Math.sin(t*.7)*.055;
  } else head.rotation.z=0;
  handPaper.visible = settled && (pose === POSES.read || pose === POSES.standread);
  handPen.visible = settled && pose === POSES.write;
  curtains.forEach((c, i) => { c.rotation.z = Math.sin(t * 0.4 + i * 1.7) * 0.015; });
  // slow, deep breathing while asleep
  chest.scale.z = 0.75 + (lying ? Math.sin(t * 1.1) * 0.05 : 0);
  chest.scale.x = 1.15 + (lying ? Math.sin(t * 1.1) * 0.02 : 0);
  if (lying) { upperArmL.rotation.z = -0.25; upperArmR.rotation.z = 0.25; }
  // the blanket is pulled up once it lies down, folded at the foot of the bed otherwise
  const sleepiness = lying ? clamp01((t - walker.settledAt - walker.spot.then.after) / 1.5) : 0;
  blanket.position.x += ((sleepiness > 0.5 ? -1.45 : -0.95) - blanket.position.x) * Math.min(1, dt * 2);
  blanket.scale.x += ((sleepiness > 0.5 ? 1.4 : 0.5) - blanket.scale.x) * Math.min(1, dt * 2);
  blanket.position.y += ((sleepiness > 0.5 ? 0.66 : 0.54) - blanket.position.y) * Math.min(1, dt * 2);

  tmpV.set(0, 0, 0); skull.getWorldPosition(tmpV);
  // Speech and sleeping sprites are children of the grounded room; convert
  // the skull's world elevation back into its local coordinate frame.
  tmpV.y -= STREET_Y;
  bubble.position.set(tmpV.x, tmpV.y + 0.55 + Math.sin(t * 2) * 0.015, tmpV.z);
  bubble.visible = !state.asleep && !lying && !rising;
  zzz.forEach((z) => {
    z.t = (z.t + dt * 0.25) % 1;
    z.s.position.set(tmpV.x + z.t * 0.3, tmpV.y + 0.2 + z.t * 0.6, tmpV.z);
    z.s.material.opacity = sleepiness > 0.9 ? Math.sin(z.t * Math.PI) : 0;
  });

  // --- Outdoors follow Europe/Rome city time and model weather, independently of author core.
  if(t-lastCityWeatherTick>=1){
    lastCityWeatherTick=t;
    cityAtmosphere=cityWeatherService.snapshot();
    cityWeatherText.textContent=civitaWeatherLabel(cityAtmosphere);
    void cityWeatherService.refreshIfDue();
  }
  const { sunAngle, day, dusk } = cityAtmosphere.sky;
  const sunDir = new THREE.Vector3(Math.cos(sunAngle) * 0.6, Math.sin(sunAngle), -0.8).normalize();
  const moonDir = new THREE.Vector3(-sunDir.x, -sunDir.y, sunDir.z).normalize();
  sun.position.copy(sunDir).multiplyScalar(95);
  moon.position.copy(moonDir).multiplyScalar(95);
  sun.visible = sunDir.y > -0.05;
  moon.visible = day < 0.6;
  const dayTop = new THREE.Color(0x5a8fc8), nightTop = new THREE.Color(0x04060f);
  const dayBottom = new THREE.Color(0xcfe0ee), nightBottom = new THREE.Color(0x141b2e), duskBottom = new THREE.Color(0xe39a64);
  skyUniforms.top.value.copy(nightTop).lerp(dayTop, day).multiplyScalar(1-(cityAtmosphere.weather?.cloudCover??0)*.0025);
  skyUniforms.bottom.value.copy(nightBottom).lerp(dayBottom, day).lerp(duskBottom, dusk * 0.7);
  scene.fog.color.copy(skyUniforms.bottom.value).multiplyScalar(0.8);
  starMat.opacity = clamp01(1 - day * 1.6) * 0.85;
  const lightDir = day > 0.2 ? sunDir : moonDir;
  celestial.position.copy(lightDir).multiplyScalar(30);
  celestial.color.setHex(day > 0.2 ? 0xfff1d6 : 0x9fb6e0);
  const lighting = nightLighting(day);
  celestial.intensity = lighting.celestial;
  hemi.intensity = lighting.hemisphere;
  viewFill.intensity = lighting.fill;
  viewFill.position.copy(camera.position);
  viewFill.target.position.copy(controls.target);
  town.update(day, t, citizens.crossingDemand(), cityAtmosphere.weather);
  clouds.forEach((c, i) => { c.position.x += dt * (0.4 + i * 0.05); if (c.position.x > 70) c.position.x = -70; c.material.opacity = cityAtmosphere.weather ? (0.08+cityAtmosphere.weather.cloudCover*.006) : (0.15+day*.45); });

  // --- room lights: the whole home is lit while the writer is awake, dark when it sleeps
  const awake = !state.asleep;
  const lightsOn = lightLevel += ((awake ? 1 : 0) - lightLevel) * Math.min(1, dt * 1.5);
  deskLight.intensity = 1.5 * lightsOn;
  shadeMat.emissiveIntensity = lampBase * lightsOn;
  bulbMat.color.setHex(awake ? 0xffe2b0 : 0x444444);
  ceilingLight.intensity = 2.2 * lightsOn;
  pendantShadeMat.emissiveIntensity = 0.9 * lightsOn;
  floorLampLight.intensity = 1.1 * lightsOn;
  floorShadeMat.emissiveIntensity = floorLampBase * lightsOn;
  bedLight.intensity = 0.6 * lightsOn;
  nightLight.intensity = 0.9 * (1 - lightsOn);
  dustMat.opacity = awake ? 0.55 : 0;
  for (let i = 0; i < 60; i++) {
    dustPos[i * 3 + 1] += Math.sin(t * 0.3 + i) * 0.0006;
    dustPos[i * 3] += Math.cos(t * 0.2 + i) * 0.0004;
  }
  dustGeo.attributes.position.needsUpdate = true;
  steam.forEach((p) => {
    p.t = (p.t + dt * 0.35) % 1;
    p.s.position.set(1.92 + Math.sin(p.t * 6 + t) * 0.02, 0.9 + p.t * 0.35, -2.0);
    p.s.material.opacity = awake ? (1 - p.t) * 0.35 : 0;
    p.s.scale.setScalar(0.05 + p.t * 0.12);
  });

  if (t - lastClock > 1) { paintClock(wallTime(now)); updateTownSummary(); lastClock = t; }

  // --- camera
  if (view === "follow") {
    camGoal.target.set(character.position.x, 1.1 + writerInteriorWorldRoot.position.y, character.position.z);
    camGoal.pos.set(character.position.x + 1.8, 2.4 + writerInteriorWorldRoot.position.y, character.position.z + 3.2);
    camMoving = true;
  }
  if (camMoving) {
  if (focus) {
    if (performance.now() > focus.until) setFocus(null);
    else { camGoal.pos.copy(focus.pos); camGoal.target.copy(focus.center); }
  }
  if (cameraDrift) camera.position.y += Math.sin(t * 0.6) * 0.0009;
  camera.position.lerp(camGoal.pos, Math.min(1, dt * 2.2));
  controls.target.lerp(camGoal.target, Math.min(1, dt * 2.2));
  if (view !== "follow" && !focus && camera.position.distanceTo(camGoal.pos) < 0.02) camMoving = false;
  }
  controls.update();
  // Main city camera must not pan beyond the small mapped plateau's safe viewing area.
  // Move camera and orbit target together to avoid springing or showing an empty tile edge.
  if (view === "town" || view === "civita") {
    const clamped=clampCivitaTarget(controls.target.x,controls.target.z);
    const dx=clamped.x-controls.target.x, dz=clamped.z-controls.target.z;
    if(dx||dz){controls.target.x=clamped.x;controls.target.z=clamped.z;camera.position.x+=dx;camera.position.z+=dz;}
  }
  scene.fog.near = (view === "town" || view === "civita") ? camera.position.distanceTo(controls.target) + 8 : 38;
  scene.fog.far = scene.fog.near + 85;
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

// ============ resize, hover, click ============
function resize() {
  const w = stage.clientWidth, h = stage.clientHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / Math.max(1, h);
  camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(stage);
resize();

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const tooltip = $("tooltip");
function pickAt(ev) {
  const r = renderer.domElement.getBoundingClientRect();
  pointer.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
  raycaster.setFromCamera(pointer, camera);
  return raycaster.intersectObjects(clickables.filter(mesh=>{let parent=mesh;while(parent){if(!parent.visible)return false;parent=parent.parent;}return true;}), false)[0];
}
renderer.domElement.addEventListener("pointermove", (ev) => {
  const hit = pickAt(ev);
  renderer.domElement.style.cursor = hit ? "pointer" : "grab";
  if (hit && hit.object.userData.label) {
    const r = stage.getBoundingClientRect();
    tooltip.hidden = false;
    tooltip.textContent = hit.object.userData.label;
    tooltip.style.left = `${ev.clientX - r.left}px`;
    tooltip.style.top = `${ev.clientY - r.top}px`;
  } else tooltip.hidden = true;
});
renderer.domElement.addEventListener("pointerleave", () => { tooltip.hidden = true; });
let downAt = null;
renderer.domElement.addEventListener("pointerdown", (ev) => { downAt = [ev.clientX, ev.clientY]; });
renderer.domElement.addEventListener("pointerup", (ev) => {
  if (!downAt || Math.hypot(ev.clientX - downAt[0], ev.clientY - downAt[1]) > 6) return;
  const hit = pickAt(ev);
  if (!hit) { closeInspect(true); return; }
  const o = hit.object;
  if(o.userData.writerExterior){setView("building");return;}
  if(o.userData.returnToTown){setView("town");return;}
  if (o.userData.notebook && nb.isOpen) { nb.turnFromPointer(hit.point.x - nb.group.position.x); return; }
  if (o.userData.drawer) drawerOpen = true;
  inspect(o, hit.point);
  if (o.userData.notebook) nb.setOpen(true);
});

// ============ dashboard ============
function selectTab(id, fromRoom) {
  if (!id) return;
  document.querySelectorAll(".panel").forEach((p) => p.classList.toggle("active", p.id === id));
  document.querySelectorAll(".tabbar button").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.panel === id)));
  observerUI?.syncTab(id);
  if (id === "p-graph") requestAnimationFrame(drawGraph);
  if (fromRoom && window.innerWidth <= 1000) $(id).scrollIntoView({ behavior: "smooth", block: "start" });
}
document.querySelectorAll(".tabbar button").forEach((b) => b.addEventListener("click", () => selectTab(b.dataset.panel)));

function toast(text) {
  const el = $("toast");
  el.textContent = text; el.hidden = false;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => { el.hidden = true; }, 4500);
}

function tickClock() {
  const now = new Date();
  $("clock").textContent = now.toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" });
  observerUI?.updateTime(worldNow());
}
setInterval(tickClock, 1000); tickClock();

function renderStatus(s) {
  state = s;
  updateWriterHouse(s.accepted_count || 0);
  $("name").textContent = s.name;
  const status = s.napping ? "چرت می‌زند" : s.asleep ? "در خواب" : (STATUS_TEXT[s.status] || "آماده");
  const wakeAt = s.napping ? hm(s.nap_until) : s.sleep.end;
  $("presence-text").textContent = status;
  $("presence").classList.toggle("awake", !s.asleep);
  $("activity").textContent = s.napping ? `خسته بود؛ چرت می‌زند تا ${wakeAt}` : s.asleep ? `خواب است تا ${wakeAt}` : s.activity;
  observerUI?.updateStatus(s);
  drawBubble(s.activity || status);
  paintScreen(s);
  const counts = `${s.accepted_count}/${s.rejected_count}/${s.library_books || 0}`;
  if (counts !== lastCounts) {
    lastCounts = counts;
    rebuildStacks(s.accepted_count, s.rejected_count);
    rebuildBooks((s.shelf_books || 0) + (s.library_books || 0));
    loadNotebookPages();
  }
  if (s.asleep) nb.setOpen(false);
  const ach = (s.achievements && s.achievements.reached) || 0;
  if (ach !== lastReached) { lastReached = ach; loadAchievements(); }

  $("k-stories").textContent = `${s.accepted_count} / ${s.story_count ?? s.accepted_count + s.rejected_count}`;
  $("k-stories-sub").textContent = `پذیرفته / همه · رد شده ${s.rejected_count}`;
  $("k-threshold").textContent = s.threshold;
  $("k-threshold-sub").textContent = `${s.active_gates} گیت فعال · هشدار، نه رد`;
  $("k-energy").textContent = `${Math.round(s.energy * 100)}٪`;
  $("k-energy-sub").textContent = s.energy < 0.3 ? "خسته است" : s.energy < 0.6 ? "متوسط" : "سرحال";
  $("k-stage").textContent = s.stage;
  $("k-stage-sub").textContent = `مرحله‌ی ${s.stage_index + 1} از ${s.stages.length}`;
  const c = s.codex || {};
  $("k-codex").textContent = c.known ? pct(c.primary.used_percent) : "—";
  $("k-codex-sub").textContent = c.known ? `هفتگی ${pct(c.secondary.used_percent)} · تازه ${hm(c.primary.resets_at)}${c.stale ? " · قدیمی" : ""}` : "داده‌ای نیست";
  $("k-flaws").textContent = s.flaws_open ?? "—";
  $("k-flaws-sub").textContent = `ایده‌های تازه ${s.notebook_new ?? 0}`;

  const curB = s.current_block, nextB = s.next_block;
  $("now-line").textContent = s.asleep ? `${s.napping ? "انرژی‌اش تمام شد و چرت می‌زند" : "خواب است"}. بیدار می‌شود ساعت ${wakeAt}.`
    : `${curB ? `${hm(curB.start)}–${hm(curB.end)} · ${TASK_FA[curB.task] || curB.task}` : "بیرون از برنامه"} — ${s.activity}`;
  $("next-line").textContent = nextB ? `بعدی: ${hm(nextB.start)} · ${TASK_FA[nextB.task] || nextB.task}` : "برنامه‌ی بعدی پس از بیداری ساخته می‌شود";

  $("energy").value = s.energy;
  $("m-confidence").value = s.mood.confidence;
  $("m-restlessness").value = s.mood.restlessness;
  $("m-pride").value = s.mood.pride;
  const facts = [
    ["مرحله", s.stage], ["داستان‌های پذیرفته‌شده", s.accepted_count], ["رد شده", s.rejected_count],
    ["حد امتیاز فعلی", s.threshold], ["گیت‌های فعال منتقد", s.active_gates], ["ایده‌های تازه", s.notebook_new ?? s.ideas],
    ["کار قبلی", TASK_FA[s.last_task] || s.last_task || "—"], ["ساعت خواب", `${s.sleep.start} تا ${s.sleep.end}`],
  ];
  const dl = $("facts"); dl.replaceChildren();
  for (const [kk, v] of facts) {
    const dt = document.createElement("dt"); dt.textContent = kk;
    const dd = document.createElement("dd"); dd.textContent = String(v);
    dl.append(dt, dd);
  }
  $("research-budget").textContent = s.research_in_window
    ? `ساعت تحقیق امروز: ${s.research_minutes_left} دقیقه مانده`
    : `پنجره‌ی تحقیق ${s.research_window[0]} تا ${s.research_window[1]} · امروز ${s.research_minutes_left} دقیقه مانده`;
  const err = $("error");
  err.hidden = !s.last_error;
  err.textContent = s.last_error ? "خطای آخر: " + s.last_error : "";
}

async function loadStatus() {
  try { renderStatus(await getJSON("/api/status")); }
  catch (e) { $("activity").textContent = "اتصال به نویسنده قطع است"; }
}

let knownStories = null;
async function loadStories() {
  const list = await getJSON("/api/stories");
  const accepted = list.find((s) => s.status === "accepted");
  latestTitle = accepted ? accepted.title : (list[0] ? list[0].title : "");
  if (knownStories !== null && list.length > knownStories) toast(`داستان تازه: ${list[0].title} (${list[0].status === "accepted" ? "پذیرفته" : "رد شده"})`);
  knownStories = list.length;
  const ul = $("stories"); ul.replaceChildren();
  for (const s of list.slice(0, 60)) {
    ul.appendChild(item(`${s.title} — ${s.status === "accepted" ? "پذیرفته" : "رد شده"}`,
      `${s.created.replace("T", " ")} · ${s.stage} · امتیاز ${s.score} از ${s.threshold} · ${s.words} کلمه`, () => openStory(s.id)));
  }
  if (!list.length) ul.appendChild(item("هنوز داستانی نیست."));
}
function openStory(id) { openBook(id).catch(() => toast("داستان باز نشد")); }

let knownDiary = null;
async function loadDiary() {
  const list = await getJSON("/api/diary");
  if (list[0]) {
    $("thought-text").textContent = list[0].text.length > 220 ? list[0].text.slice(0, 219) + "…" : list[0].text;
    $("thought-time").textContent = list[0].time.slice(11, 16);
    if (knownDiary !== null && list[0].time !== knownDiary) toast("یادداشت تازه در دفترچه");
    knownDiary = list[0].time;
  }
  const ol = $("diary"); ol.replaceChildren();
  const KIND = { after_story: "بعد از داستان", after_rejection: "بعد از رد شدن", research: "تحقیق", wake: "بیداری", daily: "روزانه" };
  for (const d of list) ol.appendChild(item(d.text, `${d.time.replace("T", " ")} · ${KIND[d.kind] || d.kind}`));
  if (!list.length) ol.appendChild(item("دفترچه هنوز خالی است."));
}
async function loadResearchAndLessons() {
  const lib = await getJSON("/api/research");
  const ul = $("library"); ul.replaceChildren();
  for (const b of lib.slice(0, 30)) ul.appendChild(item(b.title, b.date));
  if (!lib.length) ul.appendChild(item("هنوز تحقیقی نشده."));
  const searches = await getJSON("/api/searches");
  const sl = $("searches"); sl.replaceChildren();
  for (const q of searches.slice(0, 15)) {
    sl.appendChild(item(`«${q.query}» (${q.lang === "fa" ? "فارسی" : "انگلیسی"})`,
      [q.time.replace("T", " ").slice(0, 16), q.why, q.opened ? `خواند: ${q.opened}` : "چیزی باز نکرد"].filter(Boolean).join(" · ")));
  }
  if (!searches.length) sl.appendChild(item("هنوز با کامپیوترش جست‌وجو نکرده."));
  const g = await getJSON("/api/graph?domain=craft");
  const nl = $("notes"); nl.replaceChildren();
  const lessons = g.nodes.filter((n) => n.kind === "lesson").slice(0, 10);
  for (const n of lessons) nl.appendChild(item(n.label));
  if (!lessons.length) nl.appendChild(item("هنوز درسی ثبت نشده."));
}
async function loadWorld() {
  const [w, sources] = await Promise.all([getJSON("/api/world"), getJSON("/api/world/sources")]);
  const ul = $("world-list"); ul.replaceChildren();
  for (const loc of w.locations.slice(-30).reverse()) ul.appendChild(item(loc.name, loc.desc));
  if (!w.locations.length) ul.appendChild(item("جهان هنوز مکانی ندارد."));
  const rl = $("rules"); rl.replaceChildren();
  for (const r of (w.rules || []).slice(-30).reverse()) rl.appendChild(item(r));
  if (!(w.rules || []).length) rl.appendChild(item("هنوز قانونی برای جهان نوشته نشده."));
  const sl = $("sources"); sl.replaceChildren();
  const ST = { reading: "در حال خواندن", done: "خوانده شد", error: "خطا" };
  for (const s of sources) {
    const res = s.result ? `${s.result.characters} شخصیت · ${s.result.places} مکان · ${s.result.rules} قانون · ${s.result.ideas} ایده` : (s.error || "");
    sl.appendChild(item(`${s.name} — ${ST[s.status] || s.status}`, [s.added.replace("T", " "), res].filter(Boolean).join(" · ")));
  }
  if (!sources.length) sl.appendChild(item("هنوز فایلی اضافه نشده."));
  rebuildWorldPins(w.locations);
  return sources;
}

// ---------- world files: drop anywhere, or pick in the world tab ----------
let pendingFiles = [];
let tokenKey = "the-writer-owner-token";
try { $("world-token").value = sessionStorage.getItem(tokenKey) || ""; } catch { /* storage may be blocked */ }
async function uploadFiles(files) {
  const token = $("world-token").value.trim() || $("idea-token").value.trim();
  selectTab("p-world");
  if (!token) {
    pendingFiles = files;
    $("upload-status").textContent = `${files.length} فایل آماده است. نامه‌ی صاحب انتشارات را وارد کنید تا برود.`;
    $("world-token").focus();
    return;
  }
  try { sessionStorage.setItem(tokenKey, token); } catch { /* ignore */ }
  for (const f of files) {
    $("upload-status").textContent = `در حال ارسال ${f.name}…`;
    if (f.size > 400_000) { $("upload-status").textContent = `${f.name} بزرگ‌تر از ۴۰۰ کیلوبایت است.`; continue; }
    const content = await f.text();
    const r = await fetch("/api/world/upload", {
      method: "POST", headers: { "Content-Type": "application/json", "X-Admin-Token": token },
      body: JSON.stringify({ name: f.name, content }),
    });
    const data = await r.json().catch(() => ({}));
    $("upload-status").textContent = r.ok ? `${f.name} رسید. نویسنده دارد آن را می‌خواند.`
      : r.status === 403 ? "مهرِ نامه‌ی صاحب انتشارات درست نیست." : `${f.name}: ${data.error || "ارسال نشد"}`;
  }
  pendingFiles = [];
  pollSources();
}
function pollSources(n = 0) {
  loadWorld().then((sources) => {
    if (sources.some((s) => s.status === "reading") && n < 40) setTimeout(() => pollSources(n + 1), 5000);
    else if (n > 0) { toast("فایل‌های جهان خوانده شد"); loadGraph(); loadNotebook(); }
  }).catch(() => {});
}
$("world-file").addEventListener("change", (e) => { if (e.target.files.length) uploadFiles([...e.target.files]); e.target.value = ""; });
$("world-token").addEventListener("change", () => { if (pendingFiles.length) uploadFiles(pendingFiles); });
const dropzone = $("dropzone");
dropzone.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") $("world-file").click(); });
let dragDepth = 0;
window.addEventListener("dragenter", (e) => {
  if (![...(e.dataTransfer?.types || [])].includes("Files")) return;
  dragDepth++; $("drop-overlay").hidden = false;
});
window.addEventListener("dragleave", () => { dragDepth = Math.max(0, dragDepth - 1); if (!dragDepth) $("drop-overlay").hidden = true; });
window.addEventListener("dragover", (e) => { if ([...(e.dataTransfer?.types || [])].includes("Files")) e.preventDefault(); });
window.addEventListener("drop", (e) => {
  if (!e.dataTransfer?.files?.length) return;
  e.preventDefault(); dragDepth = 0; $("drop-overlay").hidden = true;
  uploadFiles([...e.dataTransfer.files]);
});

async function loadExperiments() {
  const x = await getJSON("/api/experiments");
  const policy = x.reward_policy;
  const rewardSummary = $("reward-policy");
  if (policy && rewardSummary) {
    const arms = Object.entries(policy.arms || {}).filter(([name]) => name !== "بدون تمرین");
    arms.sort((a, b) => b[1].mean_reward - a[1].mean_reward);
    const leader = arms.find(([, stats]) => stats.tries >= 2);
    const leaderText = leader
      ? `تمرین برتر فعلی: ${leader[0]} · پاداش ${Math.round(leader[1].mean_reward * 100)}٪ · پذیرش ${Math.round(leader[1].acceptance_rate * 100)}٪`
      : "هنوز برای رتبه‌بندی تمرین‌ها نمونه‌ی کافی نیست.";
    rewardSummary.textContent = `${policy.algorithm} · ${policy.total_observations} نتیجه · مهارتِ نیازمند تمرین: ${policy.weakest_skill || "در حال سنجش"}. ${leaderText}`;
  }
  const ul = $("experiments"); ul.replaceChildren();
  for (const r of x.recent.slice(0, 12)) {
    const verdict = r.delta == null ? "بدون مقایسه" : `${r.delta > 0 ? "+" : ""}${r.delta} نسبت به میانگین ${r.baseline}`;
    ul.appendChild(item(`${r.name} — امتیاز ${r.score}`, `داستان ${r.story_id} · ${verdict}`, () => openStory(r.story_id)));
  }
  if (!x.recent.length) ul.appendChild(item("هنوز آزمایشی نکرده."));
}

// ---------- collapsible side panel ----------
const sideKey = "the-writer-side-collapsed";
function setSide(collapsed) {
  document.body.classList.toggle("side-collapsed", collapsed);
  $("toggle-side").textContent = collapsed ? "باز کردن دفتر مشاهده" : "بستن دفتر مشاهده";
  $("observer-watch").textContent = collapsed ? "باز کردن دفتر" : "نمای تماشا";
  $("observer-watch").setAttribute("aria-pressed", String(collapsed));
  $("toggle-side").setAttribute("aria-expanded", String(!collapsed));
  try { localStorage.setItem(sideKey, collapsed ? "1" : "0"); } catch { /* ignore */ }
  requestAnimationFrame(() => { resize(); drawGraph(); });
}
$("toggle-side").addEventListener("click", () => setSide(!document.body.classList.contains("side-collapsed")));
try { if (localStorage.getItem(sideKey) === "1") setSide(true); } catch { /* ignore */ }

$("open-explorer").addEventListener("click", () => openExplorer());
$("graph").addEventListener("click", () => openExplorer());
async function loadComments() {
  const list = await getJSON("/api/comments");
  const ul = $("comments"); ul.replaceChildren();
  for (const c of list.slice(0, 30)) ul.appendChild(item(`${c.name}: ${c.text}`, c.time.replace("T", " ")));
  if (!list.length) ul.appendChild(item("هنوز نظری نیست."));
  rebuildCommentCards(list);
}
async function loadFlaws() {
  const rows = await getJSON("/api/flaws");
  const ul = $("flaws"); ul.replaceChildren();
  const ST = { open: "باز", resolved: "حل شد", stuck: "گیر کرده", retired: "کنار گذاشته شد" };
  for (const f of rows) {
    const li = item(`${f.problem} (${ST[f.status] || f.status})`);
    const guess = document.createElement("div"); guess.className = "time"; guess.textContent = `حدس دلیل: ${f.guess || "—"}`;
    const plan = document.createElement("div"); plan.className = "time"; plan.textContent = `کار بعدی: ${f.plan || "—"}`;
    li.append(guess, plan); ul.appendChild(li);
  }
  if (!rows.length) ul.appendChild(item("هنوز ایرادی ثبت نشده."));
  rebuildPinboard(rows);
}
let lastPlanner = null;
function renderPlannerList(p) {
  const filter = $("planner-filter")?.value || "all";
  const list = $("plan"); list.replaceChildren();
  const blocks = p.blocks || [];
  const currentId = p.current?.id;
  const completed = blocks.filter(b => b.status === "done").length;
  const skipped = blocks.filter(b => b.status === "skipped").length;
  const current = blocks.find(b => b.id === currentId);
  const growthKinds = new Set(["learn","weave","question","wish","skills","margins","diary","notebook","library","research"]);
  const nextGrowth = blocks.find(b => growthKinds.has(b.task) && b.status === "planned");
  const overview = $("plan-progress"); overview.replaceChildren();
  const heading = document.createElement("div"); heading.className = "planner-progress-head";
  const total = document.createElement("strong"); total.textContent = `${faNum(completed)} از ${faNum(blocks.length)} کار انجام‌شده`;
  const percent = document.createElement("span"); percent.textContent = `${blocks.length ? Math.round(completed / blocks.length * 100) : 0}٪`;
  heading.append(total,percent);
  const track = document.createElement("div"); track.className="planner-progress-track";track.setAttribute("role","progressbar");track.setAttribute("aria-valuemin","0");track.setAttribute("aria-valuemax",String(blocks.length));track.setAttribute("aria-valuenow",String(completed));
  const fill=document.createElement("span");fill.style.width=`${blocks.length?completed/blocks.length*100:0}%`;track.append(fill);
  overview.append(heading,track);
  const focus = document.createElement("p");focus.className="planner-focus";
  focus.textContent=current?`الان: ${hm(current.start)} · ${current.label||TASK_FA[current.task]||current.task}`:nextGrowth?`گام رشد بعدی: ${hm(nextGrowth.start)} · ${nextGrowth.label||TASK_FA[nextGrowth.task]||nextGrowth.task}`:"کار جاری و گام رشد بعدی در برنامه ثبت نشده است.";
  overview.append(focus);
  const visible = blocks.filter(b=>filter==="all"||(filter==="open"&&(b.status==="planned"||b.id===currentId))||b.status===filter);
  for(const b of visible){
    const li=document.createElement("li");li.className="task-card";li.dataset.status=b.id===currentId?"current":b.status;li.dataset.task=b.task;
    if(b.id===currentId)li.setAttribute("aria-current","step");
    const time=document.createElement("time");time.className="task-time";time.dateTime=b.start||"";time.textContent=`${hm(b.start)}–${hm(b.end)}`;
    const body=document.createElement("div");body.className="task-body";
    const title=document.createElement("strong");title.textContent=b.label||TASK_FA[b.task]||b.task;
    const meta=document.createElement("div");meta.className="task-meta";
    const state=document.createElement("span");state.className="task-state";state.textContent=b.status==="planned"&&b.attempts
      ? `در حال ادامه${b.next_retry_at ? ` · تلاش بعدی ${hm(b.next_retry_at)}` : ""}`
      : b.id===currentId?"در حال انجام":BLOCK_FA[b.status]||b.status;
    const growth=document.createElement("span");growth.className="task-growth";growth.textContent=growthKinds.has(b.task)?"رشد شخصی":"برنامهٔ روز";
    meta.append(state,growth);body.append(title,meta);
    if(b.note||b.result){const note=document.createElement("span");note.className="task-note";note.textContent=[b.result,b.note].filter(Boolean).join(" · ");body.append(note);}
    li.append(time,body);list.append(li);
  }
  if(!visible.length)list.append(item(blocks.length?"کاری با این وضعیت در برنامه نیست.":"برنامه‌ی امروز هنوز ساخته نشده است."));
}
async function loadPlanner() {
  const p = await getJSON("/api/planner");
  lastPlanner=p;
  const c = p.codex;
  $("codex-info").textContent = c.known
    ? `Codex ۵ ساعته: ${pct(c.primary.used_percent)} (تازه شدن ${hm(c.primary.resets_at)}) · هفتگی: ${pct(c.secondary.used_percent)}${c.stale ? " · داده قدیمی است" : ""}`
    : `Codex: ${c.reason}`;
  renderPlannerList(p);
  rebuildPlannerTiles(p);
  renderTimeline(p);
}
$("planner-filter")?.addEventListener("change",()=>{if(lastPlanner)renderPlannerList(lastPlanner);});
function renderTimeline(p) {
  const el = $("timeline"); el.replaceChildren();
  $("day-label").textContent = p.day || "";
  if (!p.blocks.length) return;
  const sleep = state.sleep || { start: "00:30", end: "07:00" };
  const day = new Date(`${p.day}T${sleep.end}:00`);
  const end = new Date(day); const [sh, sm] = sleep.start.split(":").map(Number);
  end.setHours(sh, sm, 0, 0); if (end <= day) end.setDate(end.getDate() + 1);
  const span = end - day;
  $("axis-start").textContent = sleep.end; $("axis-end").textContent = sleep.start;
  for (const b of p.blocks) {
    const s = new Date(b.start), e = new Date(b.end);
    const blk = document.createElement("div");
    blk.className = `blk ${b.status}`;
    blk.style.right = `${((s - day) / span) * 100}%`;
    blk.style.width = `${Math.max(0.6, ((e - s) / span) * 100 - 0.3)}%`;
    blk.style.background = TASK_HEX[b.task] || "#888";
    blk.title = `${hm(b.start)} ${TASK_FA[b.task] || b.task} — ${BLOCK_FA[b.status]}`;
    el.appendChild(blk);
  }
  const now = new Date();
  if (now >= day && now <= end) {
    const m = document.createElement("div"); m.className = "now"; m.style.right = `${((now - day) / span) * 100}%`; el.appendChild(m);
  }
}
async function loadNotebook() {
  const rows = await getJSON("/api/notebook");
  const ul = $("notebook"); ul.replaceChildren();
  const SRC = { owner: "از شما", self: "از خودش" };
  const ST = { new: "تازه", planned: "در نوبت", used: "استفاده شد" };
  for (const r of rows) ul.appendChild(item(r.text, `${SRC[r.source] || r.source} · ${ST[r.status] || r.status} · ${r.time.replace("T", " ")}`));
  if (!rows.length) ul.appendChild(item("دفترچه خالی است."));
}
async function loadBooks() {
  const books = await getJSON("/api/library");
  $("books-count").textContent = books.length ? `${books.length} کتاب` : "کتابخانه فعلاً خالی است.";
  const ul = $("books"); ul.replaceChildren();
  for (const b of books) ul.appendChild(item(b.title, [b.author, b.lang, b.added.replace("T", " ")].filter(Boolean).join(" · ")));
}
async function loadSkills() {
  const rows = await getJSON("/api/skills");
  const boxEl = $("skills"); boxEl.replaceChildren();
  for (const r of rows) {
    const row = document.createElement("div"); row.className = "skill-row";
    const name = document.createElement("span"); name.textContent = r.label;
    const val = document.createElement("span"); val.textContent = `${Math.round(r.strength * 100)}`;
    row.append(name, val);
    const bar = document.createElement("div"); bar.className = "bar";
    const fill = document.createElement("span"); fill.style.width = `${Math.round(r.strength * 100)}%`;
    bar.appendChild(fill);
    boxEl.append(row, bar);
  }
  if (!rows.length) boxEl.appendChild(item("هنوز مهارتی سنجیده نشده."));
}

// graph canvas inside the memory tab
const gCanvas = $("graph");
const gCtx = gCanvas.getContext("2d");
const DOMAIN_COLOR = { craft: "#b7791f", flaw: "#9a3412", world: "#8a6e5c", research: "#4d7f80", audience: "#8a5c7a", self: "#6e8f6b" };
const DOMAIN_LABEL = { all: "همه", craft: "داستان و مهارت", flaw: "ایرادها", world: "جهان", research: "تحقیق", audience: "مخاطب", self: "درون" };
const DOMAIN_ORDER = ["craft", "flaw", "world", "research", "audience", "self"];
const GRAPH_SYMMETRIC = new Set(["related", "co_occurs"]);
const graphDomainLabel = (key) => DOMAIN_LABEL[key] || (key.startsWith("skill:")
  ? `مهارت · ${graphData.domain_labels?.[key] || key.slice(6).replaceAll("-", " ")}` : key);
const graphDomainColor = (key) => DOMAIN_COLOR[key] || (key.startsWith("skill:") ? DOMAIN_COLOR.craft : "#888");
const graphNodeShape = (kind) => kind === "idea" || kind === "thread" ? "diamond" :
  kind === "skill" || kind === "skillnode" ? "hexagon" : kind === "flaw" ? "triangle" : "circle";
let graphData = { nodes: [], edges: [] };
let layout = new Map();
let currentDomain = "craft";
function layoutGraph(data) {
  const pos = new Map();
  const groups = new Map();
  for (const node of data.nodes) { if (!groups.has(node.domain)) groups.set(node.domain, []); groups.get(node.domain).push(node); }
  const custom = [...groups.keys()].filter((key) => !DOMAIN_ORDER.includes(key)).sort();
  const order = [...DOMAIN_ORDER.filter((key) => groups.has(key)), ...custom];
  for (const [domainIndex, key] of order.entries()) {
    const members = groups.get(key).slice().sort((a, b) => a.id.localeCompare(b.id));
    const span = order.length === 1 ? Math.PI * 2 : Math.PI * 2 / order.length * .82;
    const center = (domainIndex + .5) * Math.PI * 2 / order.length;
    const rings = Math.max(1, Math.ceil(Math.sqrt(members.length / 5)));
    members.forEach((node, i) => {
      const angle = center + (i / Math.max(1, members.length) - .5) * span;
      const ring = Math.floor(i / 5) % rings;
      const r = .28 + (ring / Math.max(1, rings - 1)) * .36;
      pos.set(node.id, { x: Math.cos(angle) * r, y: Math.sin(angle) * r });
    });
  }
  return pos;
}
function paintGraphNode(node, x, y, r, color) {
  gCtx.fillStyle = color;
  if (graphNodeShape(node.kind) === "diamond") {
    gCtx.beginPath();gCtx.moveTo(x,y-r);gCtx.lineTo(x+r,y);gCtx.lineTo(x,y+r);gCtx.lineTo(x-r,y);gCtx.closePath();gCtx.fill();
  } else if (graphNodeShape(node.kind) === "hexagon") {
    gCtx.beginPath();for(let i=0;i<6;i++){const a=Math.PI/3*i-Math.PI/6,px=x+Math.cos(a)*r,py=y+Math.sin(a)*r;i?gCtx.lineTo(px,py):gCtx.moveTo(px,py);}gCtx.closePath();gCtx.fill();
  } else if (graphNodeShape(node.kind) === "triangle") {
    gCtx.beginPath();gCtx.moveTo(x,y-r);gCtx.lineTo(x+r,y+r);gCtx.lineTo(x-r,y+r);gCtx.closePath();gCtx.fill();
  } else {gCtx.beginPath();gCtx.arc(x,y,r,0,Math.PI*2);gCtx.fill();}
}
function drawGraph() {
  const dpr = window.devicePixelRatio || 1;
  const w = gCanvas.clientWidth, h = gCanvas.clientHeight;
  if (!w) return;
  gCanvas.width = w * dpr; gCanvas.height = h * dpr;
  gCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  gCtx.clearRect(0, 0, w, h);
  const ink = getComputedStyle(gCanvas).color || "#444";
  const toXY = (p) => [w / 2 + p.x * w * 0.8, h / 2 + p.y * h * 0.8];
  for (const e of graphData.edges) {
    const pa = layout.get(e.a), pb = layout.get(e.b);
    if (!pa || !pb) continue;
    const [x1, y1] = toXY(pa), [x2, y2] = toXY(pb);
    gCtx.strokeStyle = "rgba(140,128,110,0.34)";gCtx.lineWidth=Math.min(2,0.8+Number(e.w||1)*.25);
    gCtx.beginPath(); gCtx.moveTo(x1, y1); gCtx.lineTo(x2, y2); gCtx.stroke();
    if(graphData.nodes.length<=60&&!GRAPH_SYMMETRIC.has(e.rel)){
      const angle=Math.atan2(y2-y1,x2-x1),size=4.5,mx=x1+(x2-x1)*.7,my=y1+(y2-y1)*.7;
      gCtx.fillStyle="rgba(110,98,80,.68)";gCtx.beginPath();gCtx.moveTo(mx+Math.cos(angle)*size,my+Math.sin(angle)*size);
      gCtx.lineTo(mx-size*.65*Math.cos(angle-.55),my-size*.65*Math.sin(angle-.55));
      gCtx.lineTo(mx-size*.65*Math.cos(angle+.55),my-size*.65*Math.sin(angle+.55));gCtx.closePath();gCtx.fill();
    }
  }
  gCtx.direction = "rtl";
  for (const node of graphData.nodes) {
    const p = layout.get(node.id); if (!p) continue;
    const [x, y] = toXY(p), r = 3 + Math.min(6, node.strength * 6);
    paintGraphNode(node,x,y,r,graphDomainColor(node.domain));
    if (graphData.nodes.length <= 24 || ["episode", "skill", "flaw", "source"].includes(node.kind)) {
      gCtx.fillStyle = ink; gCtx.font = "11px Vazirmatn, Tahoma, sans-serif";
      gCtx.fillText(node.label.slice(0, 22), x - r - 4, y + 4);
    }
  }
  if (!graphData.nodes.length) {
    gCtx.fillStyle = ink; gCtx.textAlign = "center"; gCtx.font = "13px Vazirmatn, Tahoma, sans-serif";
    gCtx.fillText("حافظه هنوز خالی است؛ با داستان بعدی پر می‌شود.", w / 2, h / 2);
    gCtx.textAlign = "start";
  }
}
function renderDomainTabs(counts) {
  const boxEl = $("domains"); boxEl.replaceChildren();
  const present=Object.keys(counts).filter((key)=>counts[key]>0);
  const extra=present.filter((key)=>!DOMAIN_ORDER.includes(key)).sort();
  for (const key of ["all",...DOMAIN_ORDER.filter((key)=>counts[key]>0),...extra]) {
    const b = document.createElement("button");
    const n = key === "all" ? Object.values(counts).reduce((a, c) => a + c, 0) : counts[key] || 0;
    b.textContent = `${graphDomainLabel(key)} (${n})`;
    b.setAttribute("aria-pressed", String(currentDomain === key));
    b.addEventListener("click", () => { currentDomain = key; loadGraph(); });
    boxEl.appendChild(b);
  }
}
async function loadGraph() {
  try {
    const g = await getJSON(`/api/graph${currentDomain === "all" ? "" : `?domain=${encodeURIComponent(currentDomain)}`}`);
    graphData = g; layout = layoutGraph(g);
    renderDomainTabs(g.counts);
    $("graph-counts").textContent = `${faNum(g.nodes.length)} از ${faNum(g.node_count ?? g.nodes.length)} نود · ${faNum(g.visible_edge_count ?? g.edges.length)} پیوند در این نما`;
    drawGraph();
  } catch {
    graphData = { nodes: [], edges: [] };layout.clear();
    $("graph-counts").textContent = "دریافت گراف ناموفق بود؛ اتصال را بررسی کنید.";
    drawGraph();
  }
}
window.addEventListener("resize", () => drawGraph());

// forms
$("comment-form").addEventListener("submit", async (ev) => {
  ev.preventDefault();
  const r = await fetch("/api/comments", { method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: $("c-name").value, text: $("c-text").value }) });
  const data = await r.json().catch(() => ({}));
  $("c-status").textContent = r.ok ? "نظرتان ثبت شد" : (data.error === "slow down" ? "کمی صبر کنید و دوباره بفرستید" : data.error || "ثبت نشد");
  if (r.ok) { $("c-text").value = ""; loadComments(); }
});
$("idea-form").addEventListener("submit", async (ev) => {
  ev.preventDefault();
  const r = await fetch("/api/ideas", { method: "POST", headers: { "Content-Type": "application/json", "X-Admin-Token": $("idea-token").value },
    body: JSON.stringify({ text: $("idea-text").value }) });
  const data = await r.json().catch(() => ({}));
  $("idea-status").textContent = r.ok ? "ایده به دفترچه اضافه شد" : (r.status === 403 ? "مهرِ نامه‌ی صاحب انتشارات درست نیست" : data.error || "ثبت نشد");
  if (r.ok) { $("idea-text").value = ""; loadNotebook(); }
});

// start
initObjects({
  THREE, camera, controls, stage, state: () => state, toast, selectTab, openStory, openExplorer,
  setFocus, citizenStatus: () => citizens.status(), citizenSelect: (id) => citizens.select(id), findMesh: (key) => clickables.find((c) => (c.userData.view || PANEL_TO_VIEW[c.userData.panel]) === key),
});
const PANEL_TO_VIEW = { "p-stories": "stories", "p-notebook": "notebook", "p-diary": "diary", "p-planner": "planner", "p-graph": "mind", "p-world": "world", "p-flaws": "flaws", "p-books": "library", "p-comments": "letters", "p-status": "status" };
const panels = initPanels({
  $, getJSON, item, selectTab,
  post: (url, body) => fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Admin-Token": ($("world-token").value || $("idea-token").value || "").trim() },
    body: JSON.stringify(body || {}),
  }).then((r) => r.json().then((d) => ({ ok: r.ok, d }))),
  toast,
});
async function loadPublicRoutine() {
  const [writer, plan] = await Promise.all([getJSON("/api/status"), getJSON("/api/planner")]);
  $("name").textContent = writer.name;
  $("presence-text").textContent = writer.asleep ? "در خواب" : "بیدار";
  $("presence").classList.toggle("awake", !writer.asleep);
  $("activity").textContent = writer.activity;
  const syncedAt = writer.snapshot_at ? new Date(writer.snapshot_at) : null;
  const syncLabel = $("sync-time");
  if (syncLabel && syncedAt && !Number.isNaN(syncedAt.getTime())) {
    publicSnapshotAt = syncedAt;
    syncLabel.hidden = false;
    updatePublicFreshness();
    syncLabel.title = `آخرین snapshot: ${syncedAt.toLocaleString("fa-IR")}`;
  }
  observerUI?.updateStatus(writer);
  $("k-stories").textContent = String(writer.accepted_count);
  $("k-stories-sub").textContent = "داستان پذیرفته‌شده";
  $("k-energy").textContent = `${Math.round(writer.energy * 100)}٪`;
  // The public snapshot does not contain the writer's private mind state.
  // Display real public facts rather than misleading default mental meters.
  const energy=$("energy");
  if(energy)energy.value=Number(writer.energy)||0;
  for(const id of ["m-confidence","m-restlessness","m-pride"]){
    const m=$(id);if(!m)continue;
    m.hidden=true;
    if(m.previousElementSibling)m.previousElementSibling.hidden=true;
  }
  const facts=$("facts");
  if(facts){
    facts.replaceChildren();
    for(const [key,value] of [
      ["مشاهدهٔ فعلی",writer.activity||"—"],
      ["وضعیت",writer.asleep?"در خواب":"بیدار"],
      ["انرژی ثبت‌شده",Math.round((Number(writer.energy)||0)*100)+"٪"]
    ]){
      const label=document.createElement("dt"),detail=document.createElement("dd");
      label.textContent=key;detail.textContent=value;facts.append(label,detail);
    }
  }
  $("k-stage").textContent = writer.stage;
  const done = plan.blocks.filter((block) => block.status === "done").length;
  $("day-label").textContent = plan.day || "";
  $("now-line").textContent = plan.current
    ? `${plan.current.attempts ? "در حال ادامه" : "اکنون"}: ${hm(plan.current.start)}–${hm(plan.current.end)} · ${plan.current.label}`
    : writer.activity;
  $("next-line").textContent = plan.next ? `بعدی: ${hm(plan.next.start)} · ${plan.next.label}` : "کار بعدی ثبت نشده است";
  $("plan-progress").textContent = `${faNum(done)} از ${faNum(plan.blocks.length)} کار امروز انجام‌شده`;
  $("plan").replaceChildren(...plan.blocks.map((block) => item(
    `${hm(block.start)}–${hm(block.end)} · ${block.label}`,
    block.status === "planned" && block.attempts
      ? `در حال ادامه${block.next_retry_at ? ` · تلاش بعدی ${hm(block.next_retry_at)}` : ""}`
      : BLOCK_FA[block.status] || block.status)));
}
function updatePublicFreshness() {
  const label = $("sync-time");
  if (!label || !publicSnapshotAt) return;
  const age = Math.max(0, Math.floor((Date.now() - publicSnapshotAt.getTime()) / 1000));
  const relative = age < 60 ? `${faNum(age)} ثانیه پیش` : `${faNum(Math.floor(age / 60))} دقیقه پیش`;
  label.textContent = `دادهٔ نویسنده: ${relative}`;
  label.classList.toggle("is-stale", age > 600);
}
async function refreshAll() {
  if (STATIC_PUBLIC) {
    document.body.classList.add("public-view");
    // All fifteen sections remain accessible in the PUBLIC interface.
    // For sections without a safe exported snapshot, explain why the source
    // cannot be read instead of silently deleting the menu destination.
    const withPublicData=new Set(["p-stories","p-town","p-planner","p-status","p-books","p-world","p-publish"]);
    for(const panel of document.querySelectorAll(".panel")){
      panel.hidden=false;
      if(withPublicData.has(panel.id))continue;
      if(panel.dataset.publicPrepared==="true")continue;
      const note=document.createElement("div");
      note.className="observer-public-notice";
      const heading=document.createElement("strong");
      heading.textContent="این پرونده در نسخهٔ عمومی خلاصه شده است";
      const description=document.createElement("p");
      description.textContent="این بخش به اطلاعات داخلی نویسنده یا ناشر نیاز دارد. دادهٔ خصوصی در خروجی عمومی منتشر نمی‌شود؛ برای تماشای محله و خواندن داستان‌ها از مسیرهای مرتبط استفاده کنید.";
      const action=document.createElement("a");
      const base=STATIC_PUBLIC?"/"+(location.pathname.split("/").filter(Boolean)[0]||""):"";
      action.href=panel.id==="p-books"?base+"/read/":base+"/";
      action.textContent=panel.id==="p-books"?"رفتن به کتابخانهٔ عمومی":"بازگشت به مشاهدهٔ شهر";
      note.append(heading,description,action);
      panel.replaceChildren(note);
      panel.dataset.publicPrepared="true";
    }
    // Replace owner-only upload/meeting controls immediately, even if the
    // static town fetch is slow or offline. Everything shown here comes from
    // the allow-listed public catalog and optional safe town projection.
    renderPublicObserverPanels(null);
    // Static Pages has no owner/admin POST API.
    const comments = $("comment-form");if(comments)comments.hidden=true;
    await Promise.allSettled([loadStories(),loadTown(),loadPublicRoutine(),loadPublicTimeline()]);
    return;
  }
  await loadStatus();
  await Promise.allSettled([
    loadStories(), loadDiary(), loadResearchAndLessons(), loadWorld(), loadComments(),
    loadSkills(), loadGraph(), loadFlaws(), loadPlanner(), loadNotebook(), loadBooks(), loadExperiments(),
    panels.loadAll(), pollRoom(), loadAchievements(), loadLife(), loadWardrobe(), loadTown(),
  ]);
  await loadNotebookPages();
}
$("town-search")?.addEventListener("input",()=>{
  const needle=$("town-search").value.trim().toLocaleLowerCase("fa-IR");
  for(const entry of $("town-residents").querySelectorAll(".resident-row"))
    entry.hidden=Boolean(needle)&&!entry.dataset.search.includes(needle);
});
renderCityPlaces();
observerUI=initObserverUI({
  selectTab,setView,
  onShowPanel:(id)=>{
    if(id)selectTab(id);
    setSide(id?false:true);
  },
  getSceneHour:()=>wallTime(worldNow()).getHours()
});
refreshAll();
if (STATIC_PUBLIC) {
  setInterval(() => Promise.allSettled([loadStories(), loadTown(), loadPublicRoutine(), loadPublicTimeline()]), 10000);
  setInterval(updatePublicFreshness, 1000);
}
else { setInterval(loadStatus, 5000); setInterval(refreshAll, 30000); setInterval(pollRoom, 20000); }
animate();
