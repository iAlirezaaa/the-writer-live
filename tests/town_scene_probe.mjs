/* Offline geometry/wiring gate. All geometry, materials, raycasts and lights are real Three.js.
   Only canvas drawing, the renderer, controls and browser scheduling are stubbed. Modules are
   loaded in memory; the extra exports expose bindings, never rewrite production files.
   Usage: node --experimental-vm-modules town_scene_probe.mjs <root> <check> [corruption]
   stdin: a fresh writer.town.view() payload. Negative controls corrupt measured data only. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { createContext, SourceTextModule, SyntheticModule } from "node:vm";

const root = resolve(process.argv[2]), mode = process.argv[3] || "layout";
const corruption = process.argv[4];
const roster = JSON.parse(readFileSync(0, "utf8"));
const web = resolve(root, "web");
const THREE = await import(`data:text/javascript;base64,${readFileSync(resolve(web, "vendor/three.module.js")).toString("base64")}`);
const close = (a, b, tolerance = 1e-5) => Math.abs(a - b) <= tolerance;
const failNetwork = () => { throw new Error("Network is forbidden in the town scene probe"); };
const context = createContext({ console, Date, performance, fetch: failNetwork, WebSocket: failNetwork });
const modules = new Map();
function synthetic(name, exports) {
  const module = new SyntheticModule(Object.keys(exports), function () {
    for (const [key, value] of Object.entries(exports)) this.setExport(key, value);
  }, { context, identifier: name });
  modules.set(name, module);
  return module;
}
function load(path) {
  if (modules.has(path)) return modules.get(path);
  let source = readFileSync(path, "utf8");
  if (path === resolve(web, "objects.js")) source += "\nexport { SOURCES as probeSources };\n";
  if (path === resolve(web, "world.js")) source += `
    export { scene as probeScene, clickables as probeClickables, citizens as probeCitizens };
    export function probeFrame(hour, asleep) {
      previewHour = hour;
      state = { ...state, asleep, status: asleep ? "sleeping" : "idle" };
      animate();
    }
  `;
  const module = new SourceTextModule(source, { context, identifier: path });
  modules.set(path, module);
  return module;
}
const linker = (specifier, referencing) => {
  if (modules.has(specifier)) return modules.get(specifier);
  assert.ok(specifier.startsWith("./"), `Unexpected module dependency: ${specifier}`);
  return load(resolve(dirname(referencing.identifier), specifier.split("?")[0]));
};
async function evaluate(name) {
  const module = load(resolve(web, name));
  if (module.status === "unlinked") await module.link(linker);
  if (module.status === "linked") await module.evaluate();
  return module.namespace;
}
function drawingContext() {
  const g = { measureText: (text) => ({ width: String(text).length * 12 }),
    createLinearGradient: () => ({ addColorStop() {} }),
    createRadialGradient: () => ({ addColorStop() {} }) };
  for (const name of ["fillRect", "strokeRect", "clearRect", "fillText", "strokeText", "save", "restore",
    "beginPath", "closePath", "moveTo", "lineTo", "arc", "arcTo", "ellipse", "rect", "roundRect",
    "fill", "stroke", "translate", "rotate", "scale", "setTransform", "setLineDash", "clip", "drawImage",
    "bezierCurveTo", "quadraticCurveTo"]) g[name] = () => {};
  return g;
}
function canvasTex(width, height, draw) {
  draw(drawingContext(), width, height);
  const texture = new THREE.Texture({ width, height });
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
const bounds = (mesh) => new THREE.Box3().setFromObject(mesh);
const size = (box) => box.getSize(new THREE.Vector3());
const center = (box) => box.getCenter(new THREE.Vector3());
function insideXZ(box, p, margin = 0) {
  return p.x >= box.min.x - margin && p.x <= box.max.x + margin
    && p.z >= box.min.z - margin && p.z <= box.max.z + margin;
}
function overlapsXZ(a, b) {
  return Math.min(a.max.x, b.max.x) > Math.max(a.min.x, b.min.x)
    && Math.min(a.max.z, b.max.z) > Math.max(a.min.z, b.min.z);
}
function descendants(group, predicate) {
  const out = [];
  group.traverse((object) => { if (predicate(object)) out.push(object); });
  return out;
}
function attached(object, scene) {
  for (let at = object; at; at = at.parent) if (at === scene) return true;
  return false;
}
function visible(object) {
  for (let at = object; at; at = at.parent) if (!at.visible) return false;
  return object.material?.visible !== false;
}
function assertWiring(data) {
  assert.ok(data.sources.length > 10, "SOURCES was not evaluated");
  assert.ok(data.clickables.some((m) => m.citizenId), "No citizen clickables were registered");
  for (const key of ["publisher", "bookstore", "town"]) {
    assert.ok(data.clickables.some((m) => m.view === key), `No real clickable for ${key}`);
  }
  const missing = [...new Set(data.clickables.map((m) => m.view).filter((key) => !data.sources.includes(key)))];
  assert.deepEqual(missing, [], `Missing SOURCES for executed town/citizen views: ${missing.join(", ")}`);
  for (const mesh of data.clickables) {
    assert.ok(mesh.attached && mesh.panel && mesh.label, `Detached or unregistered clickable: ${mesh.view}`);
  }
}
function assertLampData(data) {
  assert.ok(data.lamps.length >= 4, "No distributed street PointLights were built");
  for (const lamp of data.lamps) {
    assert.ok(Number.isFinite(lamp.night) && lamp.night > 0, "Street lamp has zero/nonfinite night intensity");
    assert.ok(close(lamp.night, data.night.street), "Street lamp is not driven by nightLighting(day)");
    assert.ok(close(lamp.day, data.day.street) && lamp.day < lamp.night, "Street lamp ignores daylight");
    assert.ok(close(lamp.repeat, lamp.night), "Street lamp depends on elapsed time rather than daylight");
    assert.ok(lamp.visible && lamp.distance >= 5 && lamp.y > -1, "Street light cannot illuminate the walkway");
  }
}

try {
  const townModule = await evaluate("town.js");
  const citizensModule = await evaluate("citizens.js");
  const { buildTown, nightLighting, STREET_Y, TOWN_BUILDINGS } = townModule;
  const { createCitizens, DEFAULT_PLACES, ROUTE_SEGMENTS, FEET_Y, buildRoute, stationPoint } = citizensModule;
  const scene = new THREE.Scene(), clickables = [];
  // Same registration contract as world.js. Keep mesh references: b.key is assigned AFTER this call.
  const clickable = (mesh, panel, label) => {
    mesh.userData.panel = panel; mesh.userData.label = label; clickables.push(mesh); return mesh;
  };
  const town = buildTown({ THREE, scene, clickable, canvasTex });
  const townClickables = [...clickables];
  const citizens = createCitizens({ THREE, scene, clickable });
  citizens.setRoster(roster);
  scene.updateMatrixWorld(true);
  const meshes = descendants(town.group, (o) => o.isMesh).map((mesh) => ({ mesh, box: bounds(mesh) }));
  const footprints = TOWN_BUILDINGS.map((b) => ({ ...b,
    box: new THREE.Box3(new THREE.Vector3(b.x - b.w / 2, STREET_Y, b.z - b.d / 2),
      new THREE.Vector3(b.x + b.w / 2, STREET_Y + 4.5, b.z + b.d / 2)) }));

  if (mode === "wiring" || mode === "views") {
    const { probeSources } = await evaluate("objects.js");
    const data = { sources: Object.keys(probeSources), clickables: clickables.map((mesh) => ({
      view: mesh.userData.view, panel: mesh.userData.panel, label: mesh.userData.label,
      citizenId: mesh.userData.citizenId, attached: attached(mesh, scene),
    })) };
    if (corruption === "missing-source") data.sources = data.sources.filter((key) => key !== "bookstore");
    if (corruption === "citizen-view") data.clickables.find((m) => m.citizenId).view = "missing_citizen_card";
    if (mode === "views") console.log(JSON.stringify(data));
    else assertWiring(data);
  } else if (mode === "layout") {
    assert.ok(close(STREET_Y, -3), "Town ground must be one storey below the room");
    assert.ok(close(FEET_Y, STREET_Y + 0.06), "Citizen feet do not match street height");
    assert.ok(attached(town.group, scene) && meshes.length > 100, "Town is not built into the scene");
    for (const { box } of meshes) assert.ok([...box.min, ...box.max].every(Number.isFinite), "Nonfinite mesh bounds");
    const ground = meshes.filter(({ box }) => size(box).x >= 80 && size(box).z >= 80 && size(box).y < 0.3);
    assert.ok(ground.length, "Missing real town ground");
    for (const { box } of ground) assert.ok(close(box.max.y, STREET_Y, 0.25), "Town ground is at room zero");
    const buildingBounds = [];
    for (const key of ["publisher", "bookstore"]) {
      const b = footprints.find((b) => b.key === key);
      assert.ok(b && b.w >= 4 && b.w <= 9 && b.d >= 4 && b.d <= 9, `Invalid ${key} footprint`);
      const floors = meshes.filter(({ mesh, box }) => visible(mesh) && size(box).y <= 0.3
        && close(center(box).x, b.x, 0.15) && close(center(box).z, b.z, 0.15)
        && close(size(box).x, b.w, 0.4) && close(size(box).z, b.d, 0.4)
        && close(box.max.y, STREET_Y, 0.15));
      assert.ok(floors.length, `${key} has metadata/signs but no street-level floor slab`);
      const walls = meshes.filter(({ mesh, box }) => visible(mesh) && size(box).y >= 2.5
        && Math.min(size(box).x, size(box).z) < 0.3 && Math.max(size(box).x, size(box).z) >= b.w - 0.5
        && insideXZ(b.box, center(box), 0.2) && close(box.min.y, STREET_Y, 0.15));
      assert.ok(walls.length >= 3, `${key} lacks actual full-height back/side walls`);
      const actual = floors[0].box.clone();
      walls.forEach(({ box }) => actual.union(box));
      const room = new THREE.Box3(new THREE.Vector3(-3.2, -3, -3.2), new THREE.Vector3(3.2, 3.2, 3.2));
      assert.ok(!overlapsXZ(actual, room), `${key} overlaps the writer's house`);
      buildingBounds.push(actual);
      const picks = townClickables.filter((mesh) => mesh.userData.view === key);
      assert.ok(picks.some(visible), `${key} lacks a visible clickable sign`);
      assert.ok(picks.some((mesh) => mesh.geometry.type === "BoxGeometry" && size(bounds(mesh)).y >= 2),
        `${key} lacks a building-sized clickable frontage`);
      for (const mesh of picks) {
        const box = bounds(mesh), target = center(box);
        assert.ok(insideXZ(b.box, target, 0.5) && close(target.z, b.box.max.z, 0.5), `${key} click target is not on its building`);
        const ray = new THREE.Raycaster(target.clone().add(new THREE.Vector3(0, 0, 5)), new THREE.Vector3(0, 0, -1));
        const hits = ray.intersectObjects(clickables, false);
        // A *visible shop sign* must be the nearest click target. A hidden
        // full-width frontage may legitimately sit behind a clickable passing
        // citizen (the closest object should be that citizen). The facade
        // still has to appear further down the same ray: do not accept an
        // unrelated building or fake click metadata.
        assert.ok(hits.some(hit=>hit.object.userData.view===key),
          `${key} has no physical raycast target at ${target.toArray()}`);
        const first=hits[0].object;
        const valid=first.userData.view===key ||
          (!visible(mesh) && first.userData.citizenId && first.userData.view==="town");
        assert.ok(valid,
          `${key} is occluded by a non-citizen object: ${hits.slice(0,3).map(h=>
            JSON.stringify({view:h.object.userData.view,citizen:h.object.userData.citizenId,
              distance:h.distance})).join("|")}`);
        if(visible(mesh))
          assert.equal(first.userData.view,key,`${key} visible sign must remain pickable`);
      }
    }
    assert.ok(!overlapsXZ(...buildingBounds), "Publisher and bookstore actual structures overlap");
    assert.ok(buildingBounds[0].max.x < -4 && buildingBounds[1].min.x > 4, "Shops do not flank the house");
  } else if (mode === "paths") {
    // Infer walking surfaces from actual boxes, not colors, names, or a second hard-coded route map.
    const surfaces = meshes.filter(({ mesh, box }) => visible(mesh) && size(box).y <= 0.25
      && size(box).x >= 0.5 && size(box).z >= 0.5 && close(box.max.y, STREET_Y, 0.16));
    const roads = surfaces.filter(({ box }) => size(box).x >= 30 && size(box).z >= 3 && size(box).z <= 5);
    assert.ok(roads.length >= 2, "Missing actual road strips");
    const stripes = meshes.filter(({ mesh, box }) => visible(mesh) && size(box).x >= 1.5 && size(box).x <= 3
      && size(box).z <= 0.5 && size(box).y <= 0.05 && close(box.max.y, STREET_Y, 0.1)
      && roads.some((road) => insideXZ(road.box, center(box))));
    assert.ok(stripes.length >= 4, "No real zebra crossing connects the sidewalks");
    const crossingX = center(stripes[0].box).x;
    for (const { box } of stripes) assert.ok(close(center(box).x, crossingX, 0.05), "Crosswalk stripes are misaligned");
    const blockers = meshes.filter(({ mesh, box }) => visible(mesh) && mesh.geometry.type === "BoxGeometry"
      && size(box).y >= 0.35 && box.min.y < FEET_Y + 1.6 && box.max.y > FEET_Y + 0.2);
    let samples = 0;
    function checkPoint(p) {
      samples++;
      const building = footprints.find((b) => insideXZ(b.box, p, 0.25));
      if (building) return; // Entrance spurs end indoors; home shells intentionally conceal sleepers.
      const road = roads.find(({ box }) => insideXZ(box, p));
      if (road) assert.ok(Math.abs(p.x - crossingX) <= 0.65, `Route crosses asphalt away from zebra crossing: ${JSON.stringify(p)}`);
      assert.ok(surfaces.some(({ box }) => insideXZ(box, p, 0.08)), `Route has no physical paving beneath it: ${JSON.stringify(p)}`);
      for (const { box } of blockers) assert.ok(!insideXZ(box, p, 0.15), `Route walks through furniture/wall at ${JSON.stringify(p)}`);
      assert.ok(!(Math.abs(p.x) < 3.2 && Math.abs(p.z) < 3.2), "Town route enters the writer's house");
    }
    function segment(a, b) {
      assert.ok(close(a.x, b.x) || close(a.z, b.z), "Diagonal route shortcut");
      const steps = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.z - a.z) / 0.2));
      for (let i = 0; i <= steps; i++) checkPoint({ x: a.x + (b.x - a.x) * i / steps, z: a.z + (b.z - a.z) * i / steps });
    }
    for (const [a, b] of ROUTE_SEGMENTS) segment(a, b);
    for (const [key, p] of Object.entries(DEFAULT_PLACES)) {
      assert.ok(close(roster.places[key].x, p.x) && close(roster.places[key].z, p.z), `Server place drifts: ${key}`);
      const building = footprints.find((b) => b.key === key);
      if(building){
        if(key==="publisher"||key==="bookstore"){
          // The public front door leads onto an actual 2m-wide stone apron.
          // The destination is the *outdoor approach*, not a point inside
          // the building's wall or ground-floor door volume.
          const approach=p.z>=building.box.max.z-0.1 &&
            p.z<=building.box.max.z+1.5 &&
            Math.abs(p.x-building.x)<=1.0;
          assert.ok(approach, `${key} destination misses its built entrance apron`);
          assert.ok(surfaces.some(({box})=>insideXZ(box,p,0.08)),
            `${key} approach is not physically paved`);
        }else{
          assert.ok(insideXZ(building.box,p),`${key} home destination misses its shell`);
        }
      }
      for (const to of Object.keys(DEFAULT_PLACES)) {
        let from = stationPoint(key, roster.citizens[0].id);
        for (const next of buildRoute(from, stationPoint(to, roster.citizens[0].id))) { segment(from, next); from = next; }
      }
    }
    assert.ok(samples > 1000, "Route sampling did not run");
  } else if (mode === "lighting") {
    const night = nightLighting(0), day = nightLighting(1);
    for (const field of ["hemisphere", "celestial", "fill"]) {
      assert.ok(Number.isFinite(night[field]) && night[field] >= 0.25, `Night ${field} is too dark`);
    }
    assert.deepEqual(nightLighting(-1), night, "Negative daylight must clamp to night");
    assert.deepEqual(nightLighting(2), day, "Excess daylight must clamp to day");
    const lamps = descendants(town.group, (o) => o.isPointLight && Math.abs(o.position.z) >= 4.5 && Math.abs(o.position.z) <= 12);
    assert.ok(lamps.some((l) => l.position.z < 0) && lamps.some((l) => l.position.z > 0), "Street lamps missing on one road");
    assert.ok(Math.max(...lamps.map((l) => l.position.x)) - Math.min(...lamps.map((l) => l.position.x)) >= 20,
      "Street lamps are clustered instead of covering the town");
    town.update(1, 0); const daytime = lamps.map((l) => l.intensity);
    town.update(0, 5); const nighttime = lamps.map((l) => l.intensity);
    town.update(0.5, 8);
    lamps.forEach((lamp, i) => assert.ok(lamp.intensity > daytime[i] && lamp.intensity < nighttime[i], "Lamp does not respond to dusk"));
    town.update(1, 12); town.update(0, 1000);
    const data = { night, day, lamps: lamps.map((lamp, i) => ({ day: daytime[i], night: nighttime[i],
      repeat: lamp.intensity, visible: visible(lamp), distance: lamp.distance, y: lamp.getWorldPosition(new THREE.Vector3()).y })) };
    if (corruption === "broken-light") data.lamps[0].night = 0;
    assertLampData(data);
  } else if (mode === "world") {
    // Execute the whole world so a leftover ground outside buildTown, or sleep-dimmed town lights,
    // cannot hide behind otherwise-correct isolated town geometry. No browser/network is needed.
    function element() {
      return { style: {}, dataset: {}, classList: { add() {}, remove() {}, toggle() {} },
        clientWidth: 1000, clientHeight: 700, value: "", children: [],
        append(...children) { this.children.push(...children); }, appendChild(child) { this.children.push(child); return child; },
        prepend() {}, replaceChildren() {}, setAttribute() {}, addEventListener() {}, removeEventListener() {},
        getContext: drawingContext, getBoundingClientRect: () => ({ left: 0, top: 0, width: 1000, height: 700 }) };
    }
    const elements = new Map();
    context.document = { createElement: element, querySelectorAll: () => [], addEventListener() {},
      getElementById(id) { if (!elements.has(id)) elements.set(id, element()); return elements.get(id); } };
    context.window = { innerWidth: 1280, devicePixelRatio: 1, addEventListener() {} };
    context.requestAnimationFrame = () => 0;
    context.setInterval = context.setTimeout = () => 0;
    context.clearInterval = context.clearTimeout = () => {};
    context.ResizeObserver = class { observe() {} };
    context.fetch = () => new Promise(() => {}); // Deliberately leave HTTP pending, never call the host network.
    class Renderer {
      constructor() { this.domElement = element(); this.shadowMap = {}; }
      setPixelRatio() {} setSize() {} render() {}
    }
    class Controls {
      constructor() { this.target = new THREE.Vector3(); }
      addEventListener() {} update() {}
    }
    synthetic("three", { ...THREE, WebGLRenderer: Renderer });
    synthetic("three/addons/controls/OrbitControls.js", { OrbitControls: Controls });
    const world = await evaluate("world.js");
    world.probeCitizens.setRoster(roster);
    world.probeScene.updateMatrixWorld(true);
    const flat = descendants(world.probeScene, (o) => o.isMesh).map(bounds)
      .filter((box) => size(box).y < 0.4 && size(box).x > 40 && size(box).z > 40);
    assert.ok(flat.length, "World never attached the town ground");
    for (const box of flat) assert.ok(close(box.max.y, STREET_Y, 0.25), "Old town ground survives at room zero in world.js");
    const realTown = world.probeScene.getObjectByName("town");
    assert.ok(realTown, "world.js did not buildTown");
    const writerRoot=world.probeScene.getObjectByName("writer-interior-street-level");
    const roomWalls=world.probeScene.getObjectByName("writer-room-shell");
    const expansionWalls=world.probeScene.getObjectByName("writer-room-shell-expanded");
    assert.ok(writerRoot && roomWalls && expansionWalls,"Writer room or wall assembly missing");
    assert.ok(close(writerRoot.position.y, STREET_Y),"Writer interior root still floats");
    assert.equal(roomWalls.parent,writerRoot,
      "Base room walls did not follow writer floor down to STREET_Y");
    assert.equal(expansionWalls.parent,writerRoot,
      "Future room walls did not follow writer floor down to STREET_Y");
    const solidWalls=roomWalls.children.filter(mesh=>mesh.isMesh&&
      mesh.geometry?.type==="BoxGeometry"&&
      close(mesh.geometry.parameters.height,3.2,.01)&&
      (close(mesh.geometry.parameters.width,.12,.01)||close(mesh.geometry.parameters.depth,.12,.01)));
    assert.ok(solidWalls.length>=4,"Actual writer room walls missing from grounded shell");
    for(const wall of solidWalls){
      const wb=bounds(wall);
      assert.ok(close(wb.min.y,STREET_Y,.02),"Writer wall has visible gap below at "+wb.min.y);
      assert.ok(close(wb.max.y,STREET_Y+3.2,.02),"Writer wall height shifted above room");
    }
    const roomFloor=roomWalls.children.find(mesh=>mesh.isMesh&&
      mesh.geometry?.type==="PlaneGeometry"&&
      close(mesh.geometry.parameters.width,6,.01));
    assert.ok(roomFloor,"Writer room floor was not linked to its walls");
    assert.ok(close(roomFloor.getWorldPosition(new THREE.Vector3()).y,STREET_Y,.02),
      "Writer floor and walls use different elevations");
    assert.ok(!roomWalls.visible||writerRoot.visible,
      "Writer room visible outside its own transformed root");
    const outside = descendants(world.probeScene, (o) => o.isHemisphereLight || o.isDirectionalLight
      || (o.isPointLight && attached(o, realTown)));
    assert.ok(outside.length >= 7, "World outdoor lighting was not attached");
    const frame = (hour, asleep) => {
      for (let i = 0; i < 4; i++) world.probeFrame(hour, asleep);
      return outside.map((light) => light.intensity);
    };
    const awake = frame(0, false), asleep = frame(0, true);
    assert.ok(awake.every((n) => Number.isFinite(n) && n > 0), "Actual world night lights are dark");
    assert.deepEqual(asleep, awake, "Writer sleep changes outdoor night lighting");
    assert.notDeepEqual(frame(12, true), asleep, "World never drives town lighting with daylight");
    assert.deepEqual(frame(0, true), asleep, "World night lighting is not repeatable");
    const { probeSources } = await evaluate("objects.js");
    assertWiring({ sources: Object.keys(probeSources), clickables: world.probeClickables
      .filter((mesh) => attached(mesh, realTown) || mesh.userData.citizenId)
      .map((mesh) => ({ ...mesh.userData, attached: attached(mesh, world.probeScene) })) });
  } else throw new Error(`Unknown check: ${mode}`);
  if (mode !== "views") console.log(`TOWN-SCENE-OK ${mode} (Three.js ${THREE.REVISION}; ${townClickables.length} town + ${clickables.length - townClickables.length} citizen clickables)`);
} catch (error) {
  console.error(`TOWN-SCENE-FAIL ${mode}: ${error.message}`);
  process.exitCode = 1;
}
