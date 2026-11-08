export const FEET_Y = -2.94;
export const ROLE_LABELS = { clerk: "کارمند ناشر", bookseller: "کتاب‌فروش", reader: "کتاب‌خوان", courier: "پیک", gardener: "باغبان", cafe: "کافه‌دار", "night-watch": "نگهبان شب", cleaner: "رفتگر" };
export const ACTIVITY_LABELS = { sleep: "خواب", work: "کار", read: "مطالعه", carry: "جابجایی بسته", sweep: "نظافت", idle: "استراحت", walk: "در راه" };
export const PLACE_LABELS = { "home-west": "خانه‌های غربی", "home-east": "خانه‌های شرقی", publisher: "دفتر ناشر", bookstore: "کتاب‌فروشی", cafe: "کافه", garden: "باغچه", depot: "ایستگاه پیک", square: "میدان محله" };
const PERSONAS = [
  ["مهران رستگار", "کارمند دفتر ناشر است و نامه‌ها و قراردادها را بررسی می‌کند؛ عصرها به گل‌های باغچه رسیدگی می‌کند."],
  ["ناهید فرهمند", "کارمند بایگانی ناشر است و نسخه‌های تازه را مرتب می‌کند؛ برای استراحت به میدان می‌رود."],
  ["آرمان کیانی", "کتاب‌فروش محله است و قفسه‌هایش را از بر می‌شناسد؛ گاهی در باغچه رمان می‌خواند."],
  ["لیلا شریفی", "کتاب‌فروش باتجربه‌ای است که کتاب‌های دست‌دوم را مرمت می‌کند؛ صبح‌ها در محله قدم می‌زند."],
  ["پروین دادخواه", "بازنشستهٔ مدرسه و خوانندهٔ همیشگی محله است؛ داستان‌ها را در کافه و باغچه می‌خواند."],
  ["سامان بهرامی", "نقشه‌کش آرامی است که برای الهام گرفتن به میدان و باغچه می‌رود؛ همیشه دفترچه‌ای همراه دارد."],
  ["یونس نادری", "پیک محله است و بسته‌های کتاب را میان انبار و مغازه‌ها می‌رساند؛ مسیرهای خلوت را بلد است."],
  ["سحر موسوی", "پیک دقیق کتاب‌فروشی است؛ سفارش‌ها را با یادداشت کوتاه و بسته‌بندی محکم تحویل می‌دهد."],
  ["مریم رفیعی", "باغبان محله است و باغچهٔ عمومی را نگه‌داری می‌کند؛ ابزارهایش را در انبار می‌گذارد."],
  ["کامران وثوق", "کافه‌دار محله است و قهوهٔ صبحگاهی را خودش آماده می‌کند؛ پس از کار مطالعه می‌کند."],
  ["داوود نیک‌پی", "نگهبان شب محله است؛ چراغ‌ها و مسیرهای اطراف میدان را در گشت‌هایش بررسی می‌کند."],
  ["رویا آذری", "رفتگر محله است و پیاده‌روها و جلوی مغازه‌ها را تمیز نگه می‌دارد؛ عصرها به خانه برمی‌گردد."],
];
const MAIN = 5.7, OPPOSITE = 11.3, EPS = 1e-7;
const ACTIVITIES = new Set(["sleep", "work", "read", "carry", "sweep", "idle"]);

export const DEFAULT_PLACES = Object.freeze(Object.fromEntries([
  ["home-west", -19, 2, true], ["home-east", 19, 2, true],
  ["publisher", -10, 4, false], ["bookstore", 10, 4, false],
  ["cafe", -6, OPPOSITE, false], ["garden", 7, OPPOSITE, false],
  ["depot", -18, OPPOSITE, false], ["square", 0, OPPOSITE, false],
].map(([key, x, z, indoor]) => [key, Object.freeze({ x, z, indoor })])));

// The only road crossing is x=0; northern segments are entrance spurs, not shortcuts.
export const ROUTE_SEGMENTS = Object.freeze([
  [-23, MAIN, 23, MAIN], [-23, OPPOSITE, 23, OPPOSITE],
  [0, MAIN, 0, OPPOSITE],
  ...[-19, -10, 10, 19].map((x) => [x, 2, x, MAIN]),
].map(([x, z, endX, endZ]) => Object.freeze([
  Object.freeze({ x, z }), Object.freeze({ x: endX, z: endZ }),
])));

const distance = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
const samePoint = (a, b) => distance(a, b) < EPS;
const onSegment = (p, a, b) => Number.isFinite(p?.x) && Number.isFinite(p?.z)
  && Math.abs(distance(a, p) + distance(p, b) - distance(a, b)) < EPS;
const onNetwork = (p) => ROUTE_SEGMENTS.some(([a, b]) => onSegment(p, a, b));

export function minuteOfDay(date, utcOffsetMinutes = 0) {
  if (!(date instanceof Date) || !Number.isFinite(date.getTime()) || !Number.isFinite(utcOffsetMinutes)) {
    throw new TypeError("A valid server-aligned Date and UTC offset are required");
  }
  const shifted = new Date(date.getTime() + utcOffsetMinutes * 60000);
  return shifted.getUTCHours() * 60 + shifted.getUTCMinutes() + shifted.getUTCSeconds() / 60;
}

export function routineAt(routine, minute) {
  if (!routine?.length || !Number.isFinite(minute)) throw new TypeError("A routine and minute are required");
  const dayMinute = ((minute % 1440) + 1440) % 1440;
  let selected = routine[routine.length - 1];
  for (const entry of routine) {
    if (entry.start > dayMinute) break;
    selected = entry;
  }
  return { ...selected };
}

export function seededVariation(id) {
  let seed = 2166136261;
  for (const char of String(id)) seed = Math.imul(seed ^ char.charCodeAt(0), 16777619) >>> 0;
  const unit = (salt) => ((Math.imul(seed ^ salt, 2246822519) >>> 0) / 4294967296);
  return { speed: 0.84 + unit(17) * 0.12, phase: unit(31) * Math.PI * 2, station: unit(73) };
}

export function stationPoint(place, id, places = DEFAULT_PLACES) {
  const point = places[place];
  if (!point) throw new RangeError(`Unknown town place: ${place}`);
  const { station } = seededVariation(id);
  return point.z < MAIN
    ? { x: point.x, z: point.z + station * (point.indoor ? 0.25 : 0.7) }
    : { x: point.x + (station - 0.5) * 1.4, z: point.z };
}

export function buildRoute(from, to, places = DEFAULT_PLACES) {
  const resolve = (value) => {
    const p = typeof value === "string" ? places[value] : value;
    if (!onNetwork(p)) throw new RangeError("Town routes must stay on sidewalks or entrance spurs");
    return { x: p.x, z: p.z };
  };
  const start = resolve(from), end = resolve(to);
  if (samePoint(start, end)) return [];
  const nodes = [];
  const add = (p) => {
    let index = nodes.findIndex((node) => samePoint(node, p));
    if (index < 0) { index = nodes.length; nodes.push({ x: p.x, z: p.z }); }
    return index;
  };
  const first = add(start), last = add(end);
  for (const segment of ROUTE_SEGMENTS) segment.forEach(add);
  const edges = nodes.map(() => []);
  for (const [a, b] of ROUTE_SEGMENTS) {
    const members = nodes.map((p, i) => ({ p, i })).filter(({ p }) => onSegment(p, a, b));
    members.sort((u, v) => distance(a, u.p) - distance(a, v.p));
    for (let i = 1; i < members.length; i++) {
      const u = members[i - 1], v = members[i], length = distance(u.p, v.p);
      edges[u.i].push([v.i, length]); edges[v.i].push([u.i, length]);
    }
  }
  const costs = nodes.map(() => Infinity), previous = nodes.map(() => -1), visited = new Set();
  costs[first] = 0;
  while (visited.size < nodes.length) {
    let current = -1;
    for (let i = 0; i < nodes.length; i++) {
      if (!visited.has(i) && (current < 0 || costs[i] < costs[current])) current = i;
    }
    if (current < 0 || !Number.isFinite(costs[current])) break;
    if (current === last) {
      const route = [];
      for (let at = last; at !== first; at = previous[at]) route.unshift({ ...nodes[at] });
      return route;
    }
    visited.add(current);
    for (const [next, length] of edges[current]) {
      if (costs[current] + length < costs[next]) {
        costs[next] = costs[current] + length;
        previous[next] = current;
      }
    }
  }
  throw new RangeError("No safe town route exists");
}

function serverClock(iso) {
  const date = new Date(iso);
  if (typeof iso !== "string" || !Number.isFinite(date.getTime())) throw new TypeError("Missing town clock");
  const offset = iso.match(/([+-])(\d{2}):(\d{2})$/);
  const minutes = offset ? (offset[1] === "-" ? -1 : 1) * (Number(offset[2]) * 60 + Number(offset[3]))
    : /Z$/i.test(iso) ? 0 : -date.getTimezoneOffset();
  return { date, offset: minutes };
}

function normalizeRoster(payload) {
  if (payload?.simulated !== true || !Array.isArray(payload.citizens)) throw new TypeError("Expected a simulated citizen roster");
  const clock = serverClock(payload.clock);
  const places = Object.fromEntries(Object.entries(DEFAULT_PLACES).map(([key, point]) => {
    const supplied = payload.places?.[key] || point;
    if (supplied.x !== point.x || !!supplied.indoor !== point.indoor) {
      throw new RangeError(`Place does not match the town walkways: ${key}`);
    }
    return [key, { ...point }];
  }));
  const seen = new Set();
  const citizens = payload.citizens.map((row) => {
    const persona = PERSONAS[Number(String(row.id).match(/\d+$/)?.[0]) - 1];
    if (!/^citizen-\d{2,}$/.test(row.id) || seen.has(row.id) || !places[row.home]?.indoor
        || typeof row.label !== "string" || typeof row.role !== "string" || !row.routine?.length) {
      throw new TypeError("Invalid or duplicate citizen");
    }
    seen.add(row.id);
    let previous = -1;
    const routine = row.routine.map((entry, index) => {
      if (!Number.isInteger(entry.start) || entry.start <= previous || entry.start > 1439
          || (index === 0 && entry.start !== 0) || !places[entry.place] || !ACTIVITIES.has(entry.activity)
          || (entry.activity === "sleep" && entry.place !== row.home)) {
        throw new TypeError(`Invalid daily routine: ${row.id}`);
      }
      previous = entry.start;
      return { start: entry.start, place: entry.place, activity: entry.activity };
    });
    return { id: row.id, label: persona?.[0] || row.label, story: row.story || persona?.[1] || "ساکن محله با برنامهٔ روزانهٔ ثابت و پیشهٔ پایدار.", role: row.role, home: row.home, routine,
      color: /^#[0-9a-f]{6}$/i.test(row.color) ? row.color : "#82827b" };
  });
  return { ...clock, places, citizens };
}

function buildFigure(THREE, row, agent, clickable) {
  const root = new THREE.Group(), rig = new THREE.Group();
  root.name = row.id;
  root.userData = { citizenId: row.id, label: row.label, story: row.story, role: row.role, view: "town", agent };
  root.add(rig);
  const cloth = new THREE.MeshStandardMaterial({ color: row.color, roughness: 0.96 });
  const material = (color) => new THREE.MeshStandardMaterial({ color, roughness: 0.95 });
  const skin = material("#ba9c83"), trousers = material("#555b5d"), shoes = material("#454542");
  const paper = material("#ded8c9"), cover = material("#687568"), wood = material("#95816a");
  const box = (parent, name, dimensions, mat, x, y, z) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(...dimensions), mat);
    mesh.name = name; mesh.position.set(x, y, z); mesh.castShadow = true;
    parent.add(mesh); return mesh;
  };
  const torso = box(rig, "shirt", [0.43, 0.5, 0.29], cloth, 0, 1.0, 0);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.17, 8, 6), skin);
  head.name = "head"; head.position.set(0, 1.48, 0); head.castShadow = true; rig.add(head);
  const hairColor = ({ clerk: "#51453d", bookseller: "#493a34", reader: "#665447", courier: "#403c39",
    gardener: "#514a39", cafe: "#493b32", "night-watch": "#353b42", cleaner: "#51473e" })[row.role] || "#51453d";
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.177, 10, 7, 0, Math.PI * 2, 0, Math.PI * 0.48), material(hairColor));
  hair.name = "hair"; hair.position.set(0, 1.52, -0.018); rig.add(hair);
  for (const x of [-0.065, 0.065]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 6), material("#302c28"));
    eye.position.set(x, 1.49, 0.155); rig.add(eye);
  }
  box(rig, "waist", [0.34, 0.17, 0.26], trousers, 0, 0.69, 0);
  const limb = (name, x, y, mat, length, width) => {
    const pivot = new THREE.Group(); pivot.name = name; pivot.position.set(x, y, 0); rig.add(pivot);
    box(pivot, `${name}-limb`, [width, length, width], mat, 0, -length / 2, 0);
    return pivot;
  };
  const leftArm = limb("left-arm", -0.29, 1.23, cloth, 0.47, 0.13);
  const rightArm = limb("right-arm", 0.29, 1.23, cloth, 0.47, 0.13);
  for (const arm of [leftArm, rightArm]) box(arm, "hand", [0.12, 0.12, 0.12], skin, 0, -0.5, 0);
  const leftLeg = limb("left-leg", -0.105, 0.62, trousers, 0.51, 0.14);
  const rightLeg = limb("right-leg", 0.105, 0.62, trousers, 0.51, 0.14);
  for (const leg of [leftLeg, rightLeg]) box(leg, "shoe", [0.16, 0.11, 0.25], shoes, 0, -0.565, 0.04);
  if (["cafe", "bookseller", "gardener"].includes(row.role)) {
    box(rig, "apron", [0.32, 0.57, 0.025], wood, 0, 0.88, 0.16);
  }
  if (["courier", "cleaner", "night-watch"].includes(row.role)) {
    box(rig, "cap", [0.36, 0.09, 0.36], cloth, 0, 1.61, 0.01);
  }
  const book = new THREE.Group(); book.name = "book"; book.position.set(0, 0.96, 0.35); rig.add(book);
  for (const x of [-0.10, 0.10]) {
    box(book, "book-cover", [0.20, 0.035, 0.26], cover, x, 0, 0);
    box(book, "book-pages", [0.18, 0.035, 0.24], paper, x, 0.03, 0);
  }
  const parcel = box(rig, "parcel", [0.42, 0.3, 0.32], wood, 0, 0.88, 0.38);
  const clipboard = box(rig, "work-pad", [0.30, 0.04, 0.24], paper, -0.05, 0.94, 0.32);
  const broom = new THREE.Group(); broom.name = "broom"; broom.position.set(0.34, 0, 0.3); rig.add(broom);
  box(broom, "broom-handle", [0.035, 1.1, 0.035], wood, 0, 0.62, 0);
  box(broom, "broom-bristles", [0.34, 0.12, 0.12], wood, 0, 0.06, 0);
  const pickables = [torso, head];
  for (const mesh of pickables) {
    mesh.userData = { citizenId: row.id, label: row.label, view: "town" };
    const raycast = mesh.raycast;
    mesh.raycast = function (raycaster, hits) {
      if (root.visible && this.visible) raycast.call(this, raycaster, hits);
    };
    if (typeof clickable === "function") clickable(mesh, "p-world", row.label);
    else if (Array.isArray(clickable)) clickable.push(mesh);
  }
  return { root, rig, head, cloth, leftArm, rightArm, leftLeg, rightLeg, book, parcel, clipboard, broom, pickables };
}

function animateFigure(figure, activity, role, t, phase) {
  const { rig, head, leftArm, rightArm, leftLeg, rightLeg, book, parcel, clipboard, broom } = figure;
  const wave = Math.sin(t * 2.2 + phase), stride = Math.sin(t * 7 + phase);
  rig.position.y = 0; rig.rotation.set(0, 0, 0);
  head.rotation.set(0, 0, 0);
  for (const limb of [leftArm, rightArm, leftLeg, rightLeg]) limb.rotation.set(0, 0, 0);
  book.visible = activity === "read";
  parcel.visible = activity === "carry" || (activity === "walk" && role === "courier");
  clipboard.visible = activity === "work";
  broom.visible = activity === "sweep";
  broom.rotation.set(0, 0, 0); broom.position.x = 0.34;
  if (activity === "walk") {
    leftLeg.rotation.x = stride * 0.43; rightLeg.rotation.x = -stride * 0.43;
    leftArm.rotation.x = -stride * 0.36; rightArm.rotation.x = stride * 0.36;
    rig.position.y = Math.abs(stride) * 0.025;
    if (parcel.visible) leftArm.rotation.x = rightArm.rotation.x = -0.95;
  } else if (activity === "read") {
    leftArm.rotation.x = -1.03; rightArm.rotation.x = -1.05 + wave * 0.06;
    head.rotation.x = 0.24 + wave * 0.035; book.rotation.z = wave * 0.025;
  } else if (activity === "carry") {
    leftArm.rotation.x = rightArm.rotation.x = -0.95;
    rig.rotation.z = wave * 0.035; head.rotation.y = wave * 0.08;
  } else if (activity === "sweep") {
    rightArm.rotation.x = -0.52; rightArm.rotation.z = wave * 0.25;
    leftArm.rotation.x = -0.22; rig.rotation.x = 0.09;
    broom.rotation.z = wave * 0.16; broom.position.x = 0.34 + wave * 0.19;
  } else if (activity === "work") {
    leftArm.rotation.x = -1.05; rightArm.rotation.x = -0.75 + wave * 0.28;
    head.rotation.x = 0.15; rig.rotation.x = role === "gardener" ? 0.18 + wave * 0.09 : 0.025 * wave;
  } else if (activity === "idle") {
    head.rotation.y = Math.sin(t * 0.55 + phase) * 0.28;
    leftArm.rotation.z = 0.035 + wave * 0.025; rightArm.rotation.z = -0.035 - wave * 0.025;
  }
}

function createResident(THREE, scene, clickable, row, places, minute) {
  const agent = Object.freeze({ id: row.id, enabled: false, mode: "dormant", tools: Object.freeze([]) });
  const figure = buildFigure(THREE, row, agent, clickable), traits = seededVariation(row.id);
  const goal = routineAt(row.routine, minute), point = stationPoint(goal.place, row.id, places);
  figure.root.position.set(point.x, FEET_Y, point.z);
  figure.root.rotation.y = point.z < MAIN ? Math.PI : traits.phase * 0.2 - 0.6;
  figure.root.visible = goal.activity !== "sleep";
  animateFigure(figure, goal.activity, row.role, 0, traits.phase);
  scene.add(figure.root);
  return { row, agent, figure, traits, goal, place: goal.place, route: [], present: true };
}

export function createCitizens({ THREE, scene, clickable }) {
  const residents = new Map();
  let places = DEFAULT_PLACES, offset = 0, lastDate = null, animationTime = 0;

  function setRoster(payload) {
    const normalized = normalizeRoster(payload);
    places = normalized.places; offset = normalized.offset;
    if (!lastDate) lastDate = normalized.date;
    const ids = new Set(normalized.citizens.map((row) => row.id));
    for (const resident of residents.values()) {
      resident.present = ids.has(resident.row.id);
      if (!resident.present) resident.figure.root.visible = false;
    }
    for (const row of normalized.citizens) {
      const resident = residents.get(row.id);
      if (resident) {
        resident.row = row;
        resident.figure.cloth.color.set(row.color);
        resident.figure.root.userData.label = row.label;
        resident.figure.root.userData.story = row.story;
        for (const mesh of resident.figure.pickables) mesh.userData.label = row.label;
      } else {
        residents.set(row.id, createResident(THREE, scene, clickable, row, places, minuteOfDay(normalized.date, offset)));
      }
    }
  }

  function update(dt, elapsed, nowDate) {
    // A suspended tab must resume walking, not jump across the town in one frame.
    const step = Number.isFinite(dt) ? Math.max(0, Math.min(dt, 1)) : 0;
    if (nowDate !== undefined) {
      minuteOfDay(nowDate, offset);
      lastDate = new Date(nowDate.getTime());
    } else if (lastDate) lastDate = new Date(lastDate.getTime() + step * 1000);
    if (!lastDate) return;
    animationTime = Number.isFinite(elapsed) ? elapsed : animationTime + step;
    const minute = minuteOfDay(lastDate, offset);
    for (const resident of residents.values()) {
      if (!resident.present) continue;
      const { figure, row, traits } = resident;
      const next = routineAt(row.routine, minute);
      if (next.place !== resident.goal.place || next.activity !== resident.goal.activity || next.start !== resident.goal.start) {
        resident.goal = next;
        resident.route = buildRoute(figure.root.position, stationPoint(next.place, row.id, places), places);
      }
      let remaining = step * traits.speed;
      while (resident.route.length && remaining > 0) {
        const waypoint = resident.route[0], position = figure.root.position;
        const length = distance(position, waypoint);
        if (length > EPS) figure.root.rotation.y = Math.atan2(waypoint.x - position.x, waypoint.z - position.z);
        if (length <= remaining) {
          position.x = waypoint.x; position.z = waypoint.z;
          remaining -= length; resident.route.shift();
        } else {
          position.x += (waypoint.x - position.x) * remaining / length;
          position.z += (waypoint.z - position.z) * remaining / length;
          remaining = 0;
        }
      }
      const walking = resident.route.length > 0;
      if (!walking) {
        resident.place = resident.goal.place;
        figure.root.rotation.y = places[resident.place].z < MAIN ? Math.PI : traits.phase * 0.2 - 0.6;
      }
      figure.root.visible = walking || resident.goal.activity !== "sleep";
      animateFigure(figure, walking ? "walk" : resident.goal.activity, row.role, animationTime, traits.phase);
    }
  }

  function status() {
    return [...residents.values()].filter((resident) => resident.present).map((resident) => ({
      id: resident.row.id, label: resident.row.label, role: resident.row.role,
      place: resident.place, activity: resident.route.length ? "walk" : resident.goal.activity,
      destination: resident.goal.place, visible: resident.figure.root.visible,
      agent: { ...resident.agent, tools: [...resident.agent.tools] },
    }));
  }

  return { setRoster, update, status };
}
