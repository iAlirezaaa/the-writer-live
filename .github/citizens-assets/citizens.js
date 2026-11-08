// Each resident owns a stable core and references the same shared animation
// archive. A missing core from an older public snapshot is filled locally.
export const CITIZEN_CORE_VERSION="city-citizens-v1";
const SHAPES=["tall","short","lean","round","short","tall","lean","short","round","round","tall","lean"];
const PROPS=["ledger","folder","stack","book","book","sketch","satchel","satchel","watering","cup","lantern","broom"];
const COATS=["#475c70","#786476","#797b55","#8d674e","#637b89","#625e82","#aa7454","#648c82","#5c8766","#9c7658","#5c6878","#818279"];
const VALUES=["نظم","وفاداری","کنجکاوی","مراقبت","دانش","تخیل","مسئولیت","اعتماد","صبر","مهمان‌نوازی","احتیاط","پشتکار"];
const FLAWS=["انعطاف‌ناپذیری","وسواس","بی‌قراری","نوستالژی","بدبینی","حواس‌پرتی","عجله","لجبازی","محافظه‌کاری","کمال‌گرایی","بی‌اعتمادی","سرسختی"];
const AIMS=["ثبت منصفانهٔ همهٔ داستان‌ها","حفظ نسخه‌های گمشده","پیداکردن کتاب نایاب","مرمت جلدهای قدیمی","یافتن پایان درست","ساختن نقشهٔ شهر","تحویل به‌موقع کتاب","حفظ اعتبار پیک‌ها","گسترش باغچهٔ محله","ساختن پاتوق نویسندگان","حفظ آرامش خیابان","پاکیزگی محله"];
function fallbackCore(id,role,label){
  const n=Math.max(0,Math.min(11,Number(String(id).match(/\d+$/)?.[0]||1)-1));
  return {
    identity:{name:label,role,kind:"fictional_resident"},
    core:{value:VALUES[n],flaw:FLAWS[n],desire:AIMS[n],habit:"رفتار روزمرهٔ مرتبط با پیشه",
      temperament:["آرام","دقیق","پرانرژی","سنجیده"][n%4],goals:[AIMS[n]]},
    appearance:{silhouette:SHAPES[n],accessory:PROPS[n],coat:COATS[n],
      accent:n%2?"#d7c7aa":"#d3ac83",hair_variant:n%5,outfit_variant:n%4,
      stature:.92+(n%5)*.045},
    capabilities:{conversation:{enabled:false,mode:"dormant",provider:null},
      memory:{enabled:false,mode:"dormant",store:null},autonomy:{enabled:false,tools:[]}},
    animation_library:CITIZEN_CORE_VERSION
  };
}
export const FEET_Y = -2.94;
export const ROLE_LABELS = { publisher:"مدیر انتشارات",clerk: "کارمند ناشر", bookseller: "کتاب‌فروش", reader: "کتاب‌خوان", courier: "پیک", gardener: "باغبان", cafe: "کافه‌دار", "night-watch": "نگهبان شب", cleaner: "رفتگر" };
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

// Deterministic crowd slots computed from overlapping authored daily routines.
 // Each simultaneous visitor has a different slot; no random offsets and no
 // spillover into the adjacent café/garden/square's reserved corridor.
export const STATION_SLOTS=Object.freeze({
  bookstore:Object.freeze({"citizen-03":0,"citizen-04":1,"citizen-08":2,"citizen-05":3,"citizen-07":4,"citizen-12":5,"citizen-02":3,"citizen-06":2}),
  cafe:Object.freeze({"citizen-10":0,"citizen-06":1,"citizen-02":2,"citizen-03":1,"citizen-05":2,"citizen-07":2,"citizen-09":3,"citizen-11":1,"citizen-01":2,"citizen-08":2,"citizen-12":0,"citizen-04":1}),
  depot:Object.freeze({"citizen-07":0,"citizen-08":1,"citizen-12":2,"citizen-10":1,"citizen-09":0,"citizen-11":0}),
  garden:Object.freeze({"citizen-09":0,"citizen-05":1,"citizen-10":2,"citizen-12":3,"citizen-01":2,"citizen-04":1,"citizen-06":2,"citizen-03":1,"citizen-11":0}),
  publisher:Object.freeze({"citizen-01":0,"citizen-02":1,"citizen-07":2,"citizen-12":3,"citizen-08":2}),
  square:Object.freeze({"citizen-03":0,"citizen-11":1,"citizen-06":2,"citizen-04":2,"citizen-08":0,"citizen-09":1,"citizen-01":1,"citizen-05":1,"citizen-12":0,"citizen-02":0,"citizen-10":0}),
});
const STATION_SIZES=Object.freeze({bookstore:6,publisher:4,cafe:4,garden:4,depot:3,square:3});

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
  // Placement is indexed by each place's authored daily visitor conflicts.
  // Stations never overlap adjacent venues and remain on valid network lines.
  const n=Math.max(0,Number(String(id).match(/\d+$/)?.[0]||1)-1);
  if(point.indoor)return {x:point.x,z:point.z+station*.25};
  const slotMap=STATION_SLOTS[place]||{};
  const max=STATION_SIZES[place]||4;
  const slot=Number.isInteger(slotMap[id])?slotMap[id]:((n*7)%max);
  if(point.z<MAIN)return {x:point.x,z:2.12+slot*.68};
  return {x:point.x+(slot-(max-1)/2)*.76,z:point.z};
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
    const label=persona?.[0]||row.label;
    const fallback=fallbackCore(row.id,row.role,label);
    const supplied=row.core&&typeof row.core==="object"?row.core:{};
    const core={
      identity:fallback.identity,
      core:{...fallback.core,...(supplied.core||{})},
      appearance:{...fallback.appearance,...(supplied.appearance||{})},
      // Ignore remote capability flags: all ordinary-citizen social systems
      // are OFF by design until a separate human-approved implementation.
      capabilities:fallback.capabilities,animation_library:CITIZEN_CORE_VERSION
    };
    return { id: row.id, label,story:row.story||persona?.[1]||"ساکن محله با برنامهٔ روزانهٔ ثابت.",role:row.role,home:row.home,routine,
      core,color:/^#[0-9a-f]{6}$/i.test(row.color)?row.color:"#82827b" };
  });
  return { ...clock, places, citizens };
}

function buildFigure(THREE, row, agent, clickable) {
  const root = new THREE.Group(), rig = new THREE.Group();
  root.name = row.id;
  root.userData = { citizenId: row.id, label: row.label, story: row.story, role: row.role, view: "town", agent,
    core:row.core };
  root.add(rig);
  const look=row.core?.appearance||fallbackCore(row.id,row.role,row.label).appearance;
  const silhouette=look.silhouette||"tall";
  const stature=Number.isFinite(Number(look.stature))?Math.min(1.16,Math.max(.85,Number(look.stature))):1;
  rig.scale.setScalar(stature);
  const cloth = new THREE.MeshStandardMaterial({ color:look.coat||row.color, roughness: 0.88 });
  const material = (color) => new THREE.MeshStandardMaterial({ color, roughness: 0.95 });
  const skin = material("#ba9c83"), trousers = material("#555b5d"), shoes = material("#454542");
  const paper = material("#ded8c9"), cover = material("#687568"), wood = material("#95816a");
  const box = (parent, name, dimensions, mat, x, y, z) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(...dimensions), mat);
    mesh.name = name; mesh.position.set(x, y, z); mesh.castShadow = true;
    parent.add(mesh); return mesh;
  };
  const chestWidth=silhouette==="round"?.56:silhouette==="lean"?.36:silhouette==="tall"?.42:.47;
  const torso = box(rig, "shirt", [chestWidth, silhouette==="tall"?.64:.52, .30], cloth, 0, 1.0, 0);
  const head = new THREE.Mesh(new THREE.SphereGeometry(
    silhouette==="short"?.19:.17,12,9), skin);
  head.name = "head"; head.position.set(0, 1.48, 0); head.castShadow = true; rig.add(head);
  const hairColor = ({ clerk: "#51453d", bookseller: "#493a34", reader: "#665447", courier: "#403c39",
    gardener: "#514a39", cafe: "#493b32", "night-watch": "#353b42", cleaner: "#51473e" })[row.role] || "#51453d";
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.177, 10, 7, 0, Math.PI * 2, 0, Math.PI * 0.48), material(hairColor));
  hair.name = "hair";hair.position.set(0,1.52,-0.018);rig.add(hair);
  // Strong individual silhouettes: height, haircut, collars, coats and hats.
  const hairType=Number(look.hair_variant)||0;
  if(hairType===1)box(rig,"hair-bob",[.39,.17,.30],hair.material,0,1.50,-.075);
  else if(hairType===2)box(rig,"side-fringe",[.30,.08,.26],hair.material,.075,1.60,.025);
  else if(hairType===3)box(rig,"hair-knot",[.16,.15,.16],hair.material,0,1.69,-.13);
  else if(hairType===4)box(rig,"wide-hair",[.45,.08,.30],hair.material,0,1.59,-.01);
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
  // Distinctive occupational outfit and prop; all pieces remain children of
  // the resident's rig, never world-parented and never flipped at random.
  const accent=material(look.accent||"#d3ac83");
  if(["clerk","bookseller","reader"].includes(row.role)){
    box(rig,"lapel-left",[.07,.34,.035],accent,-.115,1.13,.167);
    box(rig,"lapel-right",[.07,.34,.035],accent,.115,1.13,.167);
  }
  if(row.role==="publisher"){
    box(rig,"formal-tie",[.09,.40,.036],accent,0,1.07,.184);
    box(rig,"publisher-vest",[.39,.36,.036],wood,0,.94,.173);
    box(rig,"editorial-folder",[.31,.045,.35],paper,-.28,.86,.24);
    box(rig,"gold-pin",[.055,.055,.025],accent,.18,1.22,.19);
  }
  if(row.role==="courier"){
    box(rig,"cross-body-strap",[.07,.62,.033],accent,-.08,1.02,.17).rotation.z=-.42;
    box(rig,"shoulder-bag",[.34,.28,.15],wood,.28,.76,-.09);
  }
  if(row.role==="night-watch"){
    box(rig,"reflective-band",[.48,.055,.30],accent,0,1.10,.01);
    box(rig,"radio",[.10,.20,.10],shoes,.26,1.21,.04);
  }
  if(row.role==="gardener"){
    box(rig,"gardener-pocket",[.24,.17,.04],wood,.07,.88,.185);
    box(rig,"watering-can",[.26,.20,.26],wood,-.27,.65,.18);
  }
  if(row.role==="cafe"){
    box(rig,"cafe-collar",[.37,.08,.36],accent,0,1.29,.03);
    const mug=box(rig,"cup",[.19,.15,.16],paper,.34,.77,.29);
    mug.name="coffee-cup";
  }
  if(row.role==="cleaner"){
    box(rig,"safety-vest",[.48,.10,.33],accent,0,1.06,.02);
  }
  const identitySign=new THREE.Group();
  identitySign.name="identity-sign";identitySign.visible=false;
  identitySign.position.set(0,1.86,0);rig.add(identitySign);
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
  return { root, rig, head, cloth, leftArm, rightArm, leftLeg, rightLeg, book, parcel, clipboard, broom, pickables,
    identitySign, stature };
}

function animateFigure(figure, activity, role, t, phase, motionArchive) {
  const { rig, head, leftArm, rightArm, leftLeg, rightLeg, book, parcel, clipboard, broom } = figure;
  const pose=motionArchive?.evaluateClip?.(activity,t,phase,
    figure.pose||(figure.pose={}));
  const wave=pose?pose.sway:Math.sin(t*2.2+phase);
  const stride=pose?pose.step:Math.sin(t*7+phase);
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

function createResident(THREE, scene, clickable, row, places, minute, motionArchive) {
  const isPublisher=row.role==="publisher";
  const agent=Object.freeze({id:row.id,enabled:isPublisher,mode:isPublisher?"publisher-only":"dormant",tools:Object.freeze([])});
  const figure = buildFigure(THREE, row, agent, clickable), traits = seededVariation(row.id);
  const goal = routineAt(row.routine, minute), point = stationPoint(goal.place, row.id, places);
  figure.root.position.set(point.x, FEET_Y, point.z);
  figure.root.rotation.y = point.z < MAIN ? Math.PI : traits.phase * 0.2 - 0.6;
  figure.root.visible = goal.activity !== "sleep" && goal.place !== row.home;
  animateFigure(figure, goal.activity, row.role, 0, traits.phase, motionArchive);
  // Route geometry is attached to its own citizen (no extra scene roots).
  // It is built from planned sidewalk waypoints and never participates in raycasts.
  const routeGuide=new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),new THREE.Vector3()]),
    new THREE.LineBasicMaterial({color:row.core.appearance.accent,transparent:true,opacity:.42,depthWrite:false})
  );
  routeGuide.name="shared-sidewalk-route";
  routeGuide.visible=false;figure.root.add(routeGuide);
  const destination=new THREE.Mesh(new THREE.RingGeometry(.14,.23,18),
    new THREE.MeshBasicMaterial({color:row.core.appearance.accent,transparent:true,opacity:.75,side:THREE.DoubleSide,depthWrite:false}));
  destination.name="route-destination";destination.rotation.x=-Math.PI/2;
  destination.visible=false;figure.root.add(destination);
  scene.add(figure.root);
  return { row, agent, figure, traits, goal, place: goal.place, route: [], present: true,
    routeGuide,destination,core:row.core, trail:[],
    memory:{enabled:false,events:[]},conversation:{enabled:false,transcript:[]} };
}

export function createCitizens({ THREE, scene, clickable, motionArchive=null }) {
  const residents = new Map();
  let places=DEFAULT_PLACES,offset=0,lastDate=null,animationTime=0;
  let selectedId=null, crossingOwner=null;
  const CROSS_EPS=.015, CROWD_RADIUS=.61;
  const roadInterior=(p)=>Math.abs(p.x)<.12 && p.z>MAIN+CROSS_EPS && p.z<OPPOSITE-CROSS_EPS;
  const onCrossing=(a,b)=>Math.abs(a.x)<.12 && Math.abs(b.x)<.12
    && a.z>=MAIN-CROSS_EPS && a.z<=OPPOSITE+CROSS_EPS
    && b.z>=MAIN-CROSS_EPS && b.z<=OPPOSITE+CROSS_EPS
    && Math.abs(a.z-b.z)>.05;
  function wantsCrossing(resident){
    if(!resident.present || resident.row.role==="publisher" || !resident.route.length)return false;
    const p=resident.figure.root.position;
    const needs=resident.route.some((w,i)=>onCrossing(i?resident.route[i-1]:p,w));
    if(!needs)return false;
    // Reserve the crossing when near either mouth, not from blocks away.
    return roadInterior(p)||(Math.abs(p.x)<1.2 &&
      (Math.abs(p.z-MAIN)<.2 || Math.abs(p.z-OPPOSITE)<.2));
  }
  function crossingDemand(){
    if(crossingOwner)return true;
    return [...residents.values()].some(wantsCrossing);
  }
  function crossingIsClear(traffic){
    if(!Array.isArray(traffic))return true; // old offline scene tests
    return traffic.every(car=>!(
      Number(car.z)>6 && Number(car.z)<11 &&
      Math.abs(Number(car.x)) < // The stop line is at halfLength+2.1. A car that passed it must
      // leave the entire crossing before a pedestrian is released.
      Math.max(0,Number(car.halfLength)||0)+2.099
    ));
  }
  function select(id){
    selectedId=typeof id==="string"&&residents.has(id)?id:null;
    for(const resident of residents.values()){
      if(resident.routeGuide?.material)resident.routeGuide.material.opacity=resident.row.id===selectedId?.96:.30;
    }
    return selectedId;
  }
  function paintRoute(resident){
    const {figure,route,routeGuide,destination}=resident;
    const visible=figure.root.visible&&resident.present&&route.length>0;
    routeGuide.visible=visible;
    destination.visible=visible&&(resident.row.id===selectedId);
    if(!visible)return;
    const pos=figure.root.position;
    // Dynamic, absolute route geometry transformed into local coordinates.
    // The current point and the remaining waypoints are always valid network
    // locations; no invented straight-line shortcut over a road.
    const points=[new THREE.Vector3(0,.045,0),
      ...route.map(pt=>new THREE.Vector3(pt.x-pos.x,.045,pt.z-pos.z))];
    routeGuide.geometry.setFromPoints(points);
    const last=route[route.length-1];
    destination.position.set(last.x-pos.x,.065,last.z-pos.z);
  }

  function setRoster(payload) {
    const normalized = normalizeRoster(payload);
    places = normalized.places; offset = normalized.offset;
    if (!lastDate) lastDate = normalized.date;
    const ids = new Set(normalized.citizens.map((row) => row.id));
    if(crossingOwner && !ids.has(crossingOwner))crossingOwner=null;
    for (const resident of residents.values()) {
      resident.present=resident.row.role==="publisher"||ids.has(resident.row.id);
      if(!resident.present)resident.figure.root.visible=false;
    }
    for (const row of normalized.citizens) {
      const resident = residents.get(row.id);
      if (resident) {
        resident.row = row;
        resident.figure.cloth.color.set(row.core?.appearance?.coat||row.color);
        resident.figure.root.userData.label = row.label;
        resident.figure.root.userData.story = row.story;
        resident.core=row.core;
        resident.figure.root.userData.core=row.core;
        for (const mesh of resident.figure.pickables) mesh.userData.label = row.label;
      } else {
        residents.set(row.id, createResident(THREE, scene, clickable, row, places, minuteOfDay(normalized.date, offset),motionArchive));
      }
    }
  }

  function setPublisherProfile(profile) {
    if(!profile||typeof profile!=="object")return null;
    const name=String(profile.name||profile.publisher_core?.identity?.name||"مدیر انتشارات محله").slice(0,90);
    const identity=profile.publisher_core&&typeof profile.publisher_core==="object"
      ?profile.publisher_core:{};
    const base=fallbackCore("citizen-01","publisher",name);
    const core={
      identity:{...base.identity,...(identity.identity||{}),name},
      core:{...base.core,...(identity.core||{})},
      appearance:{...base.appearance,...(identity.appearance||{}),
        coat:"#423d50",accessory:"editorial-ledger",silhouette:"tall"},
      capabilities:{conversation:{enabled:true,mode:"publisher_meetings_only",provider:null},
        memory:{enabled:true,mode:"publisher_ledger_only",store:null},
        autonomy:{enabled:false,tools:[]}},
      animation_library:CITIZEN_CORE_VERSION
    };
    const row={
      id:"publisher-character",label:name,story:"ناشرِ واقعیِ درون داستان؛ سابقهٔ جلسه و تصمیم چاپ دارد و از بازنویسی‌های مستند می‌آموزد.",
      role:"publisher",home:"home-west",color:"#423d50",core,
      routine:[{start:0,place:"publisher",activity:"work"}]
    };
    let resident=residents.get(row.id);
    if(!resident){
      resident=createResident(THREE,scene,clickable,row,places,
        lastDate?minuteOfDay(lastDate,offset):600,motionArchive);
      resident.figure.root.position.set(-10,FEET_Y,1.18);
      resident.figure.root.visible=true;
      residents.set(row.id,resident);
    }else{
      resident.row=row;resident.core=core;resident.present=true;
      resident.figure.root.visible=true;
      resident.figure.root.userData.label=name;
      resident.figure.root.userData.core=core;
      for(const m of resident.figure.pickables)m.userData.label=name;
    }
    resident.publisher={
      public_proxy:profile.public_proxy===true,
      house:String(profile.house||identity.identity?.house||"دفتر نشر محله"),
      learning:identity.editorial_learning||null,
    };
    return row;
  }

  function update(dt, elapsed, nowDate, traffic=null) {
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
      let remaining=step*traits.speed;
      resident.waitingForCrossing=false;
      // Even a large delta must not tunnel a body through another capsule.
      // The check is the whole swept segment, not just the final position.
      // Deterministic ID ordering prevents update-order randomness.
      const blockers=[...residents.values()].filter(other=>
        other!==resident&&other.present&&other.figure.root.visible)
        .sort((a,b)=>a.row.id.localeCompare(b.row.id));
      const clearTo=(candidate,start)=>{
        for(const other of blockers){
          const p=other.figure.root.position,dx=candidate.x-start.x,dz=candidate.z-start.z;
          const lenSq=dx*dx+dz*dz;
          const t=lenSq>1e-10?Math.max(0,Math.min(1,((p.x-start.x)*dx+(p.z-start.z)*dz)/lenSq)):0;
          const closest={x:start.x+dx*t,z:start.z+dz*t};
          if(distance(closest,p)<CROWD_RADIUS-1e-4)return false;
        }
        return true;
      };
      while (resident.route.length && remaining > 0) {
        const waypoint = resident.route[0], position = figure.root.position;
        const length = distance(position, waypoint);
        if (length > EPS) figure.root.rotation.y = Math.atan2(waypoint.x - position.x, waypoint.z - position.z);
        const move=Math.min(length,remaining);
        const candidate=length<=EPS?{x:waypoint.x,z:waypoint.z}:{
          x:position.x+(waypoint.x-position.x)*move/length,
          z:position.z+(waypoint.z-position.z)*move/length
        };
        const entersRoad=!roadInterior(position)&&roadInterior(candidate)
          && onCrossing(position,waypoint);
        if(entersRoad && (crossingOwner!==null && crossingOwner!==row.id ||
                          !crossingIsClear(traffic))){
          resident.waitingForCrossing=true;
          remaining=0;
          break;
        }
        if(!clearTo(candidate,position)){
          // Clip the movement to the largest collision-free prefix. This also
          // prevents a suspended tab's larger step from tunneling past peers.
          let low=0,high=1;
          const start={x:position.x,z:position.z};
          for(let k=0;k<14;k++){
            const mid=(low+high)*.5;
            const probe={x:start.x+(candidate.x-start.x)*mid,
              z:start.z+(candidate.z-start.z)*mid};
            if(clearTo(probe,start))low=mid;
            else high=mid;
          }
          if(low>1e-5){
            position.x=start.x+(candidate.x-start.x)*low;
            position.z=start.z+(candidate.z-start.z)*low;
            // Partial entry into the carriageway still owns its crossing.
            if(entersRoad && roadInterior(position))crossingOwner=row.id;
          }
          remaining=0;
          break;
        }
        if(entersRoad)crossingOwner=row.id;
        position.x=candidate.x;position.z=candidate.z;
        remaining-=move;
        if(length<=move+EPS)resident.route.shift();
        if(crossingOwner===row.id&&!roadInterior(position)
            && (Math.abs(position.z-MAIN)<CROSS_EPS
                || Math.abs(position.z-OPPOSITE)<CROSS_EPS))
          crossingOwner=null;
      }
      const walking = resident.route.length > 0;
      // A scheduled change can release a crossing owner after it has
      // safely reached the sidewalk; avoid holding a ghost reservation.
      if(crossingOwner===row.id&&!roadInterior(figure.root.position)
          && !wantsCrossing(resident))crossingOwner=null;
      if (!walking) {
        resident.place = resident.goal.place;
        figure.root.rotation.y = places[resident.place].z < MAIN ? Math.PI : traits.phase * 0.2 - 0.6;
      }
      // Home interiors are not modelled yet. Keep residents who are resting
      // indoors hidden rather than stacking multiple identical bodies in one
      // door opening; their schedule and identity remain inspectable.
      const indoors=!walking&&resident.goal.place===row.home;
      figure.root.visible=walking||(!indoors&&resident.goal.activity!=="sleep");
      animateFigure(figure, walking ? "walk" : resident.goal.activity, row.role, animationTime, traits.phase, motionArchive);
      paintRoute(resident);
    }
  }

  function status() {
    return [...residents.values()].filter((resident) => resident.present).map((resident) => ({
      id: resident.row.id, label: resident.row.label, story: resident.row.story, role: resident.row.role,
      place: resident.place, activity: resident.route.length ? "walk" : resident.goal.activity,
      destination: resident.goal.place, visible: resident.figure.root.visible,
      agent: { ...resident.agent, tools: [...resident.agent.tools] },
      // Never leak mutable references into a UI or test status snapshot.
      core:JSON.parse(JSON.stringify(resident.core)),
      route:resident.route.map(p=>({x:p.x,z:p.z})),
      position:{x:resident.figure.root.position.x,z:resident.figure.root.position.z},
      conversation:resident.row.role==="publisher"
        ?{enabled:true,mode:"publisher_meetings_only",messages:0}
        :{enabled:false,mode:"dormant",messages:0},
      memory:resident.row.role==="publisher"
        ?{enabled:true,mode:"publisher_ledger_only",records:resident.publisher?.learning?.episodes||0}
        :{enabled:false,mode:"dormant",records:0},
      animation_archive:motionArchive?.MOTION_LIBRARY_VERSION||CITIZEN_CORE_VERSION,
      publisher:resident.publisher?JSON.parse(JSON.stringify(resident.publisher)):null,
      waitingForCrossing:resident.waitingForCrossing===true,
      crossingOwner:crossingOwner===resident.row.id,
    }));
  }

  return { setRoster, setPublisherProfile, update, status, select, crossingDemand,
    animationLibrary:motionArchive?.MOTION_ARCHIVE||null };
}
