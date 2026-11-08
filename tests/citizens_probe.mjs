import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(process.argv[2]);
const payload = JSON.parse(readFileSync(0, "utf8"));
globalThis.fetch = () => { throw new Error("Network is forbidden"); };
globalThis.WebSocket = class { constructor() { throw new Error("Network is forbidden"); } };
const importSource = async (path) => import(`data:text/javascript;base64,${Buffer.from(await readFile(path)).toString("base64")}`);
const THREE = await importSource(resolve(root, "web/vendor/three.module.js"));
const { createCitizens, buildRoute, routineAt, minuteOfDay, stationPoint, seededVariation, DEFAULT_PLACES, FEET_Y } =
  await importSource(resolve(root, "web/citizens.js"));

let passed = 0;
const failures = [];
const test = (name, fn) => {
  try { fn(); passed++; }
  catch (error) { failures.push(`${name}: ${error.message}`); }
};
const clone = (value) => structuredClone(value);
const close = (a, b, message = "values differ") => assert.ok(Math.abs(a - b) < 1e-6, `${message}: ${a} != ${b}`);
const point = (object) => ({ x: object.position.x, z: object.position.z });
const distance = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
const at = (time) => new Date(`2026-11-08T${time}+03:30`);
function freeze(value) {
  Object.freeze(value);
  for (const child of Object.values(value)) if (child && typeof child === "object") freeze(child);
  return value;
}
function make(data = payload, useArray = false) {
  const scene = new THREE.Scene(), meshes = [];
  const clickable = useArray ? meshes : (mesh, panel, label) => {
    mesh.userData.panel = panel; mesh.userData.label = label; meshes.push(mesh); return mesh;
  };
  const citizens = createCitizens({ THREE, scene, clickable });
  citizens.setRoster(data);
  return { scene, meshes, citizens, body: (id) => scene.getObjectByName(id) };
}
function single(clock = "2026-11-08T00:59:59+03:30") {
  const data = clone(payload);
  data.clock = clock;
  data.citizens = [data.citizens[0]];
  data.citizens[0].routine = [
    { start: 0, place: "home-west", activity: "sleep" },
    { start: 60, place: "publisher", activity: "work" },
    { start: 120, place: "bookstore", activity: "read" },
    { start: 180, place: "garden", activity: "idle" },
    { start: 240, place: "home-west", activity: "sleep" },
  ];
  return data;
}
function safePoint(p) {
  const main = Math.abs(p.z - 5.7) < 1e-6 && Math.abs(p.x) <= 23;
  const opposite = Math.abs(p.z - 11.3) < 1e-6 && Math.abs(p.x) <= 23;
  const crossing = Math.abs(p.x) < 1e-6 && p.z >= 5.7 && p.z <= 11.3;
  const spur = [-19, -10, 10, 19].some((x) => Math.abs(p.x - x) < 1e-6) && p.z >= 2 && p.z <= 5.7;
  assert.ok(main || opposite || crossing || spur, `Off walkway: ${JSON.stringify(p)}`);
  if (p.z > 7 && p.z < 10) close(p.x, 0, "Road crossed away from x=0");
  assert.ok(!(p.x > -3 && p.x < 3 && p.z > -3 && p.z < 3), "Route enters writer house");
}
function safeRoute(start, route) {
  let from = start;
  for (const to of route) {
    assert.ok(Math.abs(from.x - to.x) < 1e-6 || Math.abs(from.z - to.z) < 1e-6, "Diagonal shortcut");
    for (let n = 0; n <= 20; n++) safePoint({ x: from.x + (to.x - from.x) * n / 20, z: from.z + (to.z - from.z) * n / 20 });
    from = to;
  }
}

try {
  test("pure imports and server clock boundaries", () => {
    assert.equal(typeof document, "undefined");
    close(minuteOfDay(at("00:00:00"), 210), 0);
    close(minuteOfDay(at("23:59:00"), 210), 1439);
    close(minuteOfDay(new Date("2026-11-09T03:00:00Z"), -180), 0);
    assert.throws(() => minuteOfDay(new Date("invalid")), TypeError);
    assert.throws(() => minuteOfDay("12:00"), TypeError);
    for (const row of payload.citizens) {
      const routine = freeze(clone(row.routine));
      assert.deepEqual(routineAt(routine, 0), routine[0]);
      assert.deepEqual(routineAt(routine, 1440), routine[0]);
      assert.deepEqual(routineAt(routine, -1), routine.at(-1));
      assert.deepEqual(routineAt(routine, 1439.999), routine.at(-1));
      for (let i = 1; i < routine.length; i++) {
        assert.deepEqual(routineAt(routine, routine[i].start), routine[i]);
        assert.deepEqual(routineAt(routine, routine[i].start - 0.001), routine[i - 1]);
      }
      for (let minute = 0; minute < 1440; minute++) {
        assert.deepEqual(routineAt(routine, minute), [...routine].reverse().find((entry) => entry.start <= minute));
      }
    }
  });

  test("all place pairs and seeded stations follow safe routes", () => {
    const places = freeze(clone(payload.places));
    for (const [key, p] of Object.entries(DEFAULT_PLACES)) {
      assert.equal(places[key].x, p.x); assert.equal(places[key].z, p.z);
      assert.equal(places[key].indoor, p.indoor);
    }
    for (const row of payload.citizens) {
      for (const a of Object.keys(places)) for (const b of Object.keys(places)) {
        const from = stationPoint(a, row.id, places), to = stationPoint(b, row.id, places);
        const route = buildRoute(freeze(from), freeze(to), places);
        safeRoute(from, route);
        assert.deepEqual(route, buildRoute(from, to, places));
        if (a === b) assert.deepEqual(route, []);
        else assert.deepEqual(route.at(-1), to);
        for (const p of route) {
          if (p.z < 3) assert.ok(p.x === from.x || p.x === to.x, "Enters an unrelated building");
        }
      }
    }
    const route = buildRoute("publisher", "bookstore");
    assert.ok(route.some((p) => p.z === 5.7));
    assert.ok(route.every((p) => p.z <= 5.7));
    for (const from of [{ x: 0, z: 8.5 }, { x: -10, z: 4 }, { x: -4.2, z: 5.7 }, { x: 6.2, z: 11.3 }]) {
      for (const to of Object.keys(places)) safeRoute(from, buildRoute(from, to, places));
    }
    assert.throws(() => buildRoute({ x: 2, z: 0 }, "square"), RangeError);
    assert.throws(() => buildRoute({ x: 5, z: 8 }, "square"), RangeError);
    assert.throws(() => buildRoute("missing", "square"), RangeError);
  });

  test("first spawn uses server-local routine and correct feet", () => {
    for (const time of ["00:00:00", "05:00:00", "12:00:00", "19:00:00", "23:59:00"]) {
      const data = clone(payload); data.clock = `2026-11-08T${time}+03:30`;
      const world = make(freeze(data), true), statuses = world.citizens.status();
      assert.equal(world.scene.children.length, data.citizens.length);
      assert.equal(world.meshes.length, data.citizens.length * 2);
      for (const row of data.citizens) {
        const status = statuses.find((entry) => entry.id === row.id);
        const expected = routineAt(row.routine, minuteOfDay(at(time), 210));
        assert.equal(status.place, expected.place); assert.equal(status.activity, expected.activity);
        assert.equal(status.visible, expected.activity !== "sleep" && expected.place !== row.home);
        const body = world.body(row.id);
        assert.deepEqual(point(body), stationPoint(expected.place, row.id, data.places));
        close(body.position.y, FEET_Y); close(FEET_Y, -2.94);
        if (expected.activity === "sleep") assert.ok(body.position.z < 2.5, "Sleeper is outside the home footprint");
        for (const mesh of world.meshes.filter((m) => m.userData.citizenId === row.id)) {
          assert.equal(mesh.userData.view, "town"); assert.equal(mesh.userData.label, row.label);
          if (!status.visible) {
            const hits = []; mesh.raycast(new THREE.Raycaster(), hits); assert.deepEqual(hits, []);
          }
        }
      }
    }
  });

  test("polling preserves meshes, routes, poses and physical speed", () => {
    const data = single(), world = make(data), control = make(clone(data));
    const body = world.body("citizen-01"), initial = point(body);
    world.citizens.update(1, 1, at("01:00:00"));
    control.citizens.update(1, 1, at("01:00:00"));
    close(distance(initial, point(body)), seededVariation("citizen-01").speed);
    assert.equal(world.citizens.status()[0].activity, "walk");
    assert.ok(body.visible);
    const originalMeshes = [...world.meshes], originalAgent = body.userData.agent;
    const materials = world.meshes.map((mesh) => mesh.material), geometries = world.meshes.map((mesh) => mesh.geometry);
    const snapshot = point(body), pose = body.getObjectByName("left-leg").rotation.x;
    for (let poll = 0; poll < 100; poll++) {
      const refresh = clone(data); refresh.clock = "2026-11-08T01:00:30+03:30";
      refresh.citizens[0].agent = { id: "other", enabled: true, mode: "active", tools: ["network"] };
      world.citizens.setRoster(refresh);
      assert.equal(world.body("citizen-01"), body);
      assert.equal(body.userData.agent, originalAgent);
      assert.deepEqual(point(body), snapshot);
      assert.equal(body.getObjectByName("left-leg").rotation.x, pose);
    }
    assert.deepEqual(world.meshes, originalMeshes);
    world.meshes.forEach((mesh, i) => { assert.equal(mesh.material, materials[i]); assert.equal(mesh.geometry, geometries[i]); });
    for (let frame = 0; frame < 800; frame++) {
      const before = point(body);
      world.citizens.update(0.05, frame / 20, at("01:00:30"));
      control.citizens.update(0.05, frame / 20, at("01:00:30"));
      assert.deepEqual(point(body), point(control.body("citizen-01")));
      safePoint(point(body));
      assert.ok(distance(before, point(body)) <= 0.05 * seededVariation("citizen-01").speed + 1e-6);
    }
    assert.equal(world.citizens.status()[0].place, "publisher");
    assert.equal(world.citizens.status()[0].activity, "work");
  });

  test("rerouting on the crossing and sleep only after arrival", () => {
    const world = make(single("2026-11-08T02:30:00+03:30")), body = world.body("citizen-01");
    for (let i = 0; i < 800 && !(body.position.z > 7 && body.position.z < 10); i++) {
      world.citizens.update(0.05, i / 20, at("03:00:00"));
    }
    assert.ok(body.position.z > 7 && body.position.z < 10, "Citizen never used crossing");
    const before = point(body);
    world.citizens.update(0, 0, at("04:00:00"));
    assert.deepEqual(point(body), before);
    assert.equal(world.citizens.status()[0].activity, "walk");
    assert.ok(body.visible, "Sleep hid a citizen in the street");
    for (let frame = 0; frame < 1200; frame++) {
      world.citizens.update(0.05, frame / 20, at("04:00:00")); safePoint(point(body));
    }
    assert.equal(world.citizens.status()[0].place, "home-west");
    assert.equal(world.citizens.status()[0].activity, "sleep");
    assert.equal(body.visible, false);
    assert.deepEqual(point(body), stationPoint("home-west", "citizen-01"));
  });

  test("independent dormant controllers and defensive snapshots", () => {
    const data = clone(payload), world = make(data);
    const agents = world.scene.children.map((body) => body.userData.agent);
    assert.equal(new Set(agents).size, data.citizens.length);
    assert.equal(new Set(agents.map((agent) => agent.tools)).size, data.citizens.length);
    for (const agent of agents) { assert.ok(Object.isFrozen(agent)); assert.ok(Object.isFrozen(agent.tools)); }
    data.citizens[0].routine[0].activity = "work";
    data.citizens[0].agent.enabled = true; data.citizens[0].agent.tools.push("network");
    const leaked = world.citizens.status();
    leaked[0].agent.enabled = true; leaked[0].agent.tools.push("network"); leaked[0].role = "changed";
    for (const status of world.citizens.status()) {
      assert.deepEqual(status.agent, { id: status.id, enabled: false, mode: "dormant", tools: [] });
      assert.notEqual(status.role, "changed");
    }
    for (let i = 0; i < 100; i++) world.citizens.update(1, i, at("00:00:00"));
    assert.equal(world.citizens.status()[0].activity, "sleep", "Input routine mutation leaked into controller");
    assert.equal(world.citizens.status()[0].visible, false);
    const pair = single();
    pair.citizens.push(clone(payload.citizens[1]));
    pair.citizens[1].routine = [{ start: 0, place: "bookstore", activity: "read" }];
    const independent = make(pair);
    const fixed = independent.body("citizen-02").position.clone();
    const moving = independent.body("citizen-01").position.clone();
    for (let i = 0; i < 40; i++) {
      independent.citizens.update(0.1, i / 10, at("01:00:00"));
      assert.deepEqual(independent.body("citizen-02").position, fixed);
      assert.equal(independent.citizens.status()[1].activity, "read");
    }
    assert.notDeepEqual(independent.body("citizen-01").position, moving);
    assert.equal(independent.citizens.status()[0].activity, "walk");
  });

  test("visible activity poses are distinct and animated", () => {
    const poses = new Set();
    for (const activity of ["work", "read", "carry", "sweep", "idle"]) {
      const data = single("2026-11-08T10:00:00+03:30");
      data.citizens[0].routine = [{ start: 0, place: "garden", activity }];
      const world = make(data), body = world.body("citizen-01");
      world.citizens.update(0, 1, at("10:00:00"));
      const pose = () => ["left-arm", "right-arm", "head", "broom"].map((name) => body.getObjectByName(name).rotation.toArray());
      const first = JSON.stringify(pose()); poses.add(first);
      world.citizens.update(0, 2, at("10:00:00"));
      assert.notEqual(JSON.stringify(pose()), first, `${activity} is static`);
      assert.equal(body.getObjectByName("book").visible, activity === "read");
      assert.equal(body.getObjectByName("parcel").visible, activity === "carry");
      assert.equal(body.getObjectByName("broom").visible, activity === "sweep");
      assert.equal(body.getObjectByName("work-pad").visible, activity === "work");
      world.scene.updateMatrixWorld(true);
      const mesh = world.meshes[0], target = mesh.getWorldPosition(new THREE.Vector3());
      const ray = new THREE.Raycaster(target.clone().add(new THREE.Vector3(0, 0, 3)), new THREE.Vector3(0, 0, -1));
      const hits = []; mesh.raycast(ray, hits); assert.ok(hits.length, "Awake citizen cannot be picked");
    }
    assert.equal(poses.size, 5);
  });

  test("full day and midnight preserve safety and dormant invariants", () => {
    const world = make(payload), midnight = at("00:00:00").getTime();
    for (let minute = 0; minute <= 1440; minute++) {
      world.citizens.update(1, minute, new Date(midnight + minute * 60000));
      for (const status of world.citizens.status()) {
        safePoint(point(world.body(status.id)));
        close(world.body(status.id).position.y, FEET_Y);
        assert.equal(status.agent.enabled, false); assert.equal(status.agent.mode, "dormant");
        assert.deepEqual(status.agent.tools, []);
        if (status.activity === "sleep") { assert.ok(status.place.startsWith("home-")); assert.equal(status.visible, false); }
      }
    }
    const watch = world.citizens.status().find((row) => row.role === "night-watch");
    assert.equal(watch.destination, "square"); assert.ok(watch.visible);
  });

  test("removal, reappearance and invalid refresh do not rebuild", () => {
    const data = single(), world = make(data), body = world.body("citizen-01");
    const empty = clone(data); empty.citizens = [];
    world.citizens.setRoster(empty); assert.deepEqual(world.citizens.status(), []); assert.equal(body.visible, false);
    world.citizens.setRoster(data); assert.equal(world.body("citizen-01"), body); assert.equal(world.meshes.length, 2);
    const before = point(body), duplicate = clone(data); duplicate.citizens.push(clone(duplicate.citizens[0]));
    assert.throws(() => world.citizens.setRoster(duplicate), TypeError);
    assert.equal(world.citizens.status().length, 1); assert.deepEqual(point(body), before);
    const invalid = clone(data); invalid.citizens[0].routine[0].start = 1;
    assert.throws(() => world.citizens.setRoster(invalid), TypeError);
    const speeds = payload.citizens.map((row) => seededVariation(row.id).speed);
    assert.equal(new Set(speeds).size, speeds.length);
    assert.ok(speeds.every((speed) => speed >= 0.84 && speed <= 0.96));
    world.citizens.update(0, 0, at("01:00:00"));
    const start = point(body);
    world.citizens.update(300, 300, at("01:05:00"));
    assert.ok(distance(start, point(body)) <= 0.96 + 1e-6, "Suspended frame teleported citizen");
    const still = point(body); world.citizens.update(-1, 0, at("01:05:00"));
    assert.deepEqual(point(body), still);
  });
} finally {
  if (failures.length) {
    console.error(`CITIZENS-FAIL (${passed} passed)\n${failures.join("\n")}`);
    process.exitCode = 1;
  } else console.log(`CITIZENS-OK (${passed} checks; real local Three.js, no DOM or network)`);
}
