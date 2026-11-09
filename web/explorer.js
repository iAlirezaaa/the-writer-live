/* Graph explorer: walk through the writer's memory. Pan by dragging, zoom with the wheel or pinch,
   click a node to see what it is and what it is linked to, follow links, search, filter by domain. */

const KIND_FA = {
  episode: "داستان", skill: "مهارت", lesson: "درس", experiment: "آزمایش", flaw: "ایراد", entity: "شخصیت یا مکان",
  thread: "رشته‌ی داستانی", source: "فایل جهان", rule: "قانون جهان", research: "تحقیق", feedback: "فکر بیرونی",
  idea: "ایده", diary: "یادداشت دفترچه", skillnode: "مفهوم مهارتی",
};
const DOMAIN_FA = { all: "همه", craft: "داستان و مهارت", flaw: "ایرادها", world: "جهان", research: "تحقیق", audience: "مخاطب", self: "درون" };
const DOMAIN_COLOR = { craft: "#c08a2e", flaw: "#c0573a", world: "#9a7a5c", research: "#4d8f90", audience: "#9a6a8a", self: "#6e9a6b" };
const DOMAIN_ORDER = ["craft", "flaw", "world", "research", "audience", "self"];
const SYMMETRIC_RELATIONS = new Set(["related", "co_occurs"]);
const REL_FA = {
  learned_from: "آموخته از", improves: "بهتر می‌کند", weakens: "ضعیف می‌کند", exercised: "تمرین شد در", passed: "گذشت در",
  failed: "رد شد در", appears_in: "حاضر در", co_occurs: "همراه با", related: "مرتبط با", about: "درباره‌ی", found_in: "پیدا شده در",
  resolved_in: "حل شد در", inspired_by: "الهام از", reflects_on: "تأمل درباره‌ی", open_in: "باز در", defined_in: "تعریف شده در",
  tried_in: "امتحان شده در", woven_into: "بافته شد در",
};
const domainLabel = (key) => DOMAIN_FA[key] || (key.startsWith("skill:")
  ? `مهارت · ${data.domain_labels?.[key] || key.slice(6).replaceAll("-", " ")}` : key);
const domainColor = (key) => DOMAIN_COLOR[key] || (key.startsWith("skill:") ? DOMAIN_COLOR.craft : "#888");
const nodeShape = (kind) => kind === "idea" || kind === "thread" ? "◇" :
  kind === "skill" || kind === "skillnode" ? "⬡" : kind === "flaw" ? "△" : "●";

let ui = null;
let data = { nodes: [], edges: [] };
let pos = new Map();
let cam = { x: 0, y: 0, k: 1 };
let selected = null, hovered = null, neighbours = new Set(), searchMatches = new Set();
let domain = "craft";
let raf = 0, ticks = 0;

const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
async function getJSON(url) { const r = await fetch(url); if (!r.ok) throw new Error(`${url} -> ${r.status}`); return r.json(); }

function build() {
  const overlay = el("div", "explorer"); overlay.hidden = true;
  overlay.setAttribute("role", "dialog"); overlay.setAttribute("aria-modal", "true");
  const bar = el("div", "explorer-bar");
  const title = el("h2", "", "کاوش در حافظه");
  const search = el("input", "explorer-search"); search.placeholder = "جست‌وجو در حافظه"; search.type = "search";
  const chips = el("div", "tabs");
  const close = el("button", "", "بستن");
  bar.append(title, search, chips, close);
  const body = el("div", "explorer-body");
  const canvasWrap = el("div", "explorer-canvas");
  const canvas = el("canvas");
  const legend = el("div", "explorer-legend");
  for (const [d, c] of Object.entries(DOMAIN_COLOR)) { const s = el("span", "", DOMAIN_FA[d]); s.style.setProperty("--c", c); legend.append(s); }
  const zoom = el("div", "explorer-zoom");
  const zoomIn = el("button", "", "+"); zoomIn.title = "بزرگ‌نمایی"; zoomIn.setAttribute("aria-label", zoomIn.title);
  const zoomOut = el("button", "", "−"); zoomOut.title = "کوچک‌نمایی"; zoomOut.setAttribute("aria-label", zoomOut.title);
  const reset = el("button", "", "نمای کلی"); reset.title = "بازنشانی نما";
  zoom.append(zoomIn,zoomOut,reset);
  const help = el("div", "explorer-help", "رنگ = حوزه · شکل = نوع · پیکان = جهت رابطه | بکشید، بزرگ‌نمایی کنید و برای جزئیات روی گره بزنید.");
  const shapes = el("div", "explorer-shapes", "● داستان/منبع   ⬡ مهارت   ◇ ایده/رشته   △ ایراد");
  canvasWrap.append(canvas, legend, shapes, help, zoom);
  const side = el("aside", "explorer-side");
  body.append(canvasWrap, side);
  overlay.append(bar, body);
  document.body.appendChild(overlay);
  ui = { overlay, canvas, ctx: canvas.getContext("2d"), side, search, chips, canvasWrap };
  const zoomAt = (factor) => {const r=canvas.getBoundingClientRect(),mx=r.width/2,my=r.height/2,k=Math.max(.3,Math.min(5,cam.k*factor));cam.x=mx-(mx-cam.x)*(k/cam.k);cam.y=my-(my-cam.y)*(k/cam.k);cam.k=k;draw();};
  zoomIn.addEventListener("click",()=>zoomAt(1.25));
  zoomOut.addEventListener("click",()=>zoomAt(.8));
  reset.addEventListener("click",()=>{selected=null;hovered=null;neighbours.clear();cam={x:canvas.clientWidth/2,y:canvas.clientHeight/2,k:1};showOverview();draw();});

  close.addEventListener("click", closeExplorer);
  document.addEventListener("keydown", (e) => { if (!overlay.hidden && e.key === "Escape") closeExplorer(); });
  let timer = null;
  search.addEventListener("input", () => { clearTimeout(timer); timer = setTimeout(() => runSearch(search.value), 250); });

  // pan, zoom, pick
  let drag = null;
  canvas.addEventListener("pointerdown", (e) => { drag = { x: e.clientX, y: e.clientY, cx: cam.x, cy: cam.y, moved: false }; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener("pointermove", (e) => {
    if (drag) {
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (Math.hypot(dx, dy) > 4) drag.moved = true;
      cam.x = drag.cx + dx; cam.y = drag.cy + dy; draw();
    } else {
      const h = pick(e);
      if (h !== hovered) { hovered = h; canvas.style.cursor = h ? "pointer" : "grab"; draw(); }
    }
  });
  canvas.addEventListener("pointerup", (e) => {
    if (drag && !drag.moved) { const h = pick(e); if (h) select(h); }
    drag = null;
  });
  canvas.addEventListener("wheel", (e) => {
    e.preventDefault();
    const r = canvas.getBoundingClientRect();
    const mx = e.clientX - r.left, my = e.clientY - r.top;
    const f = Math.exp(-e.deltaY * 0.0015);
    const k = Math.max(0.3, Math.min(5, cam.k * f));
    cam.x = mx - (mx - cam.x) * (k / cam.k); cam.y = my - (my - cam.y) * (k / cam.k); cam.k = k;
    draw();
  }, { passive: false });
  canvas.tabIndex=0;canvas.setAttribute("aria-label","گراف تعاملی. با کلیدهای جمع، منها و صفر بزرگ‌نمایی یا بازنشانی کنید.");
  canvas.addEventListener("keydown",e=>{if(e.key==="+")zoomAt(1.2);else if(e.key==="-")zoomAt(.8);else if(e.key==="0")reset.click();});
  new ResizeObserver(() => { resize(); draw(); }).observe(canvasWrap);
}

export async function openExplorer(startId) {
  if (!ui) build();
  ui.overlay.hidden = false;
  document.body.classList.add("book-open");
  try {
    await load();
    if (startId) focusId(startId);
    else showOverview();
  } catch {
    showGraphError("گراف بارگذاری نشد", "داده‌ی گراف از حافظه دریافت نشد. اتصال را بررسی کنید و دوباره باز کنید.");
  }
}

function showGraphError(title, message) {
  ui.side.replaceChildren(el("h3", "", title), el("p", "muted small", message));
}

function closeExplorer() {
  ui.overlay.hidden = true;
  cancelAnimationFrame(raf);
  document.body.classList.remove("book-open");
}

async function load() {
  const q = domain === "all" ? "?limit=300" : `?domain=${domain}&limit=300`;
  data = await getJSON(`/api/graph${q}`);
  renderChips(data.counts);
  pos = new Map();
  const domainOrder=[...DOMAIN_ORDER.filter((key)=>data.nodes.some((node)=>node.domain===key)),
    ...[...new Set(data.nodes.map((node)=>node.domain).filter((key)=>!DOMAIN_ORDER.includes(key)))].sort()];
  const hashId=(s)=>{let h=2166136261;for(const ch of String(s)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;};
  for(const [sectorIndex,key] of domainOrder.entries()){
    const members=data.nodes.filter((node)=>node.domain===key).slice().sort((a,b)=>a.id.localeCompare(b.id));
    const center=(sectorIndex+.5)/domainOrder.length*Math.PI*2;
    const span=domainOrder.length===1?Math.PI*2:Math.PI*2/domainOrder.length*.78;
    members.forEach((node,i)=>{
      const h=hashId(node.id),a=center+(i/Math.max(1,members.length-1)-.5)*span+((h%1000)/1000-.5)*.08;
      const r=48+Math.floor(i/12)*26+((h>>>10)%10);
      const x=Math.cos(a)*r,y=Math.sin(a)*r;
      pos.set(node.id,{x,y,homeX:x,homeY:y,vx:0,vy:0});
    });
  }
  resize();
  const r = ui.canvas.getBoundingClientRect();
  cam = { x: r.width / 2, y: r.height / 2, k: 1 };
  ticks = 0; cancelAnimationFrame(raf); simulate();
}

function renderChips(counts) {
  ui.chips.replaceChildren();
  const present = Object.keys(counts).filter((key) => counts[key] > 0);
  const dynamic = present.filter((key) => !DOMAIN_ORDER.includes(key)).sort();
  const keys = ["all", ...DOMAIN_ORDER.filter((key) => counts[key] > 0), ...dynamic];
  for (const d of keys) {
    const n = d === "all" ? Object.values(counts).reduce((a, c) => a + c, 0) : counts[d] || 0;
    const b = el("button", "", `${domainLabel(d)} (${n})`);
    b.setAttribute("aria-pressed", String(domain === d));
    b.addEventListener("click", async () => {
      domain = d; selected = null;
      try { await load(); showOverview(); }
      catch { showGraphError("فیلتر بارگذاری نشد", "داده‌ی این حوزه در دسترس نیست؛ دوباره تلاش کنید."); }
    });
    ui.chips.append(b);
  }
}

// a light force simulation that settles over a few hundred frames
function simulate() {
  const nodes = data.nodes, edges = data.edges;
  for (let it = 0; it < 1; it++) {
    for (let i = 0; i < nodes.length; i++) {
      const a = pos.get(nodes[i].id);
      for (let j = i + 1; j < nodes.length; j++) {
        const b = pos.get(nodes[j].id);
        let dx = a.x - b.x, dy = a.y - b.y; const d2 = dx * dx + dy * dy + 0.01;
        if (d2 > 32400) continue;
        const f = 70 / d2; dx *= f; dy *= f;
        a.vx += dx; a.vy += dy; b.vx -= dx; b.vy -= dy;
      }
    }
    for (const e of edges) {
      const a = pos.get(e.a), b = pos.get(e.b); if (!a || !b) continue;
      const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) + 0.01;
      const f = (d - 70) * 0.004 * Math.min(2, e.w);
      a.vx += (dx / d) * f * d * 0.05; a.vy += (dy / d) * f * d * 0.05;
      b.vx -= (dx / d) * f * d * 0.05; b.vy -= (dy / d) * f * d * 0.05;
    }
    for (const p of pos.values()) {
      p.vx += (p.homeX - p.x) * 0.015; p.vy += (p.homeY - p.y) * 0.015;
      p.vx -= p.x * 0.001; p.vy -= p.y * 0.001;
      p.x += Math.max(-8, Math.min(8, p.vx)); p.y += Math.max(-8, Math.min(8, p.vy));
      p.vx *= 0.55; p.vy *= 0.55;
    }
  }
  draw();
  if (++ticks < 90) raf = requestAnimationFrame(simulate);
}

function resize() {
  const r = ui.canvasWrap.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
  ui.canvas.width = r.width * dpr; ui.canvas.height = r.height * dpr;
  ui.canvas.style.width = `${r.width}px`; ui.canvas.style.height = `${r.height}px`;
  ui.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
const screen = (p) => [cam.x + p.x * cam.k, cam.y + p.y * cam.k];
const radius = (n) => (4 + Math.min(8, n.strength * 8 + Math.log1p(n.uses))) * Math.sqrt(cam.k);

function pick(e) {
  const r = ui.canvas.getBoundingClientRect();
  const mx = e.clientX - r.left, my = e.clientY - r.top;
  let best = null, bd = Infinity;
  for (const n of data.nodes) {
    const p = pos.get(n.id); if (!p) continue;
    const [x, y] = screen(p); const d = Math.hypot(x - mx, y - my);
    if (d < radius(n) + 5 && d < bd) { best = n; bd = d; }
  }
  return best;
}

function draw() {
  if (!ui || ui.overlay.hidden) return;
  const { ctx, canvas } = ui;
  const w = canvas.clientWidth, h = canvas.clientHeight;
  ctx.clearRect(0, 0, w, h);
  const focus = selected ? new Set([selected.id, ...neighbours]) : null;
  for (const e of data.edges) {
    const a = pos.get(e.a), b = pos.get(e.b); if (!a || !b) continue;
    const on = focus && (e.a === selected?.id || e.b === selected?.id);
    ctx.strokeStyle = on ? "rgba(224,168,79,0.9)" : focus ? "rgba(150,140,125,0.07)" : "rgba(150,140,125,0.2)";
    ctx.lineWidth = on ? 1.8 : 0.9;
    const [x1, y1] = screen(a), [x2, y2] = screen(b);
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    if (on && !SYMMETRIC_RELATIONS.has(e.rel)) {
      const angle=Math.atan2(y2-y1,x2-x1),size=6;
      ctx.fillStyle="rgba(224,168,79,0.95)";ctx.beginPath();ctx.moveTo(x2,y2);
      ctx.lineTo(x2-size*Math.cos(angle-.48),y2-size*Math.sin(angle-.48));
      ctx.lineTo(x2-size*Math.cos(angle+.48),y2-size*Math.sin(angle+.48));ctx.closePath();ctx.fill();
    }
  }
  ctx.direction = "rtl"; ctx.textAlign = "right";
  for (const n of data.nodes) {
    const p = pos.get(n.id); if (!p) continue;
    const [x, y] = screen(p), r = radius(n);
    const dim = focus && !focus.has(n.id);
    ctx.globalAlpha = dim ? 0.18 : 1;
    ctx.fillStyle = domainColor(n.domain);
    if (n.kind === "idea" || n.kind === "thread") {
      ctx.beginPath();ctx.moveTo(x,y-r);ctx.lineTo(x+r,y);ctx.lineTo(x,y+r);ctx.lineTo(x-r,y);ctx.closePath();ctx.fill();
    } else if (n.kind === "skill" || n.kind === "skillnode") {
      ctx.beginPath();for(let i=0;i<6;i++){const a=Math.PI/3*i-Math.PI/6,px=x+Math.cos(a)*r,py=y+Math.sin(a)*r;i?ctx.lineTo(px,py):ctx.moveTo(px,py);}ctx.closePath();ctx.fill();
    } else if (n.kind === "flaw") {
      ctx.beginPath();ctx.moveTo(x,y-r);ctx.lineTo(x+r,y+r);ctx.lineTo(x-r,y+r);ctx.closePath();ctx.fill();
    } else { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); }
    if(searchMatches.has(n.id)){ctx.strokeStyle="#f0ce84";ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,r+4,0,Math.PI*2);ctx.stroke();}
    if (selected && n.id === selected.id) { ctx.strokeStyle = "#f1ead8"; ctx.lineWidth = 2; ctx.stroke(); }
    const showLabel = !dim && (cam.k > 1.6 || n === hovered || (focus && focus.has(n.id)) || ["episode", "skill", "source"].includes(n.kind));
    if (showLabel) {
      ctx.fillStyle = "#ece6da"; ctx.font = `${n === hovered || n === selected ? 500 : 400} 12px Vazirmatn, Tahoma, sans-serif`;
      ctx.fillText(n.label.slice(0, 28), x - r - 4, y + 4);
    }
  }
  ctx.globalAlpha = 1;
  if (!data.nodes.length) {
    ctx.fillStyle = "#a39b8d"; ctx.textAlign = "center"; ctx.font = "14px Vazirmatn, Tahoma, sans-serif";
    ctx.fillText("در این بخش هنوز چیزی در حافظه نیست.", w / 2, h / 2);
  }
}

async function select(n) {
  selected = n;
  neighbours = new Set(data.edges.filter((e) => e.a === n.id || e.b === n.id).map((e) => (e.a === n.id ? e.b : e.a)));
  draw();
  let d;
  try { d = await getJSON(`/api/graph/node?id=${encodeURIComponent(n.id)}`); }
  catch { showGraphError("جزئیات دریافت نشد", "اتصال به حافظه قطع شد؛ دوباره روی نود بزنید."); return; }
  renderDetail(d);
}

function renderDetail(d) {
  const s = ui.side; s.replaceChildren();
  const back = el("button", "", "نمای کلی");
  back.addEventListener("click", () => { selected = null; neighbours = new Set(); showOverview(); draw(); });
  s.append(back);
  const head = el("div", "detail-head");
  const dot = el("span", "dot"); dot.style.background = domainColor(d.domain);
  head.append(dot, el("span", "time", `${nodeShape(d.kind)} ${KIND_FA[d.kind] || d.kind} · ${domainLabel(d.domain)}`));
  s.append(head, el("h3", "detail-title", d.label));
  if (d.text && d.text !== d.label) s.append(el("p", "detail-text", d.text));
  const facts = el("dl", "facts");
  const add = (k, v) => { if (v == null || v === "") return; facts.append(el("dt", "", k), el("dd", "", String(v))); };
  add("قدرت", `${Math.round((d.strength || 0) * 100)}٪`);
  add("دفعات استفاده", d.uses);
  add("وضعیت", d.status);
  add("حدس دلیل", d.guess);
  add("کار بعدی", d.plan);
  add("ساخته شده", (d.created || "").replace("T", " ").slice(0, 16));
  add("آخرین استفاده", (d.last_used || "").replace("T", " ").slice(0, 16));
  s.append(facts);
  s.append(el("h3", "", `پیوندها (${d.neighbours.length})`));
  const ul = el("ul", "list small");
  for (const nb of d.neighbours) {
    const li = el("li", "clickable");
    const top = el("div"); top.append(el("span", "rel", REL_FA[nb.rel] || nb.rel), document.createTextNode(" "), el("span", "", nb.label));
    li.append(top, el("div", "time", `${nodeShape(nb.kind)} ${KIND_FA[nb.kind] || nb.kind} · ${domainLabel(nb.domain)}`));
    li.addEventListener("click", () => focusId(nb.id, nb));
    ul.append(li);
  }
  if (!d.neighbours.length) ul.append(el("li", "time", "هنوز به چیزی وصل نیست."));
  s.append(ul);
}

function focusId(id, hint) {
  let n = data.nodes.find((x) => x.id === id);
  if (!n && hint) {
    // bring a node from another domain into view next to the current selection
    n = { id, kind: hint.kind, domain: hint.domain, label: hint.label, strength: 0.5, uses: 1 };
    data.nodes.push(n);
    const near = selected ? pos.get(selected.id) : { x: 0, y: 0 };
    pos.set(id, { x: near.x + 60, y: near.y + 30, vx: 0, vy: 0 });
    if (selected) data.edges.push({ a: selected.id, b: id, rel: hint.rel, w: 1 });
  }
  if (!n) return;
  const p = pos.get(n.id), r = ui.canvas.getBoundingClientRect();
  cam.k = Math.max(cam.k, 1.4);
  cam.x = r.width / 2 - p.x * cam.k; cam.y = r.height / 2 - p.y * cam.k;
  select(n);
}

async function runSearch(q) {
  if (!q.trim()) { searchMatches.clear();draw();if (!selected) showOverview(); return; }
  let rows;
  try { rows = await getJSON(`/api/graph/search?q=${encodeURIComponent(q)}`); }
  catch { showGraphError("جست‌وجو در دسترس نیست", "پاسخی از حافظه دریافت نشد؛ دوباره تلاش کنید."); return; }
  searchMatches=new Set(rows.map(r=>r.id));draw();
  const s = ui.side; s.replaceChildren();
  s.append(el("h3", "", `نتیجه‌ها (${rows.length})`));
  const ul = el("ul", "list small");
  for (const r of rows) {
    const li = el("li", "clickable");
    li.append(el("div", "", r.label), el("div", "time", `${nodeShape(r.kind)} ${KIND_FA[r.kind] || r.kind} · ${domainLabel(r.domain)}`));
    li.addEventListener("click", () => focusId(r.id, r));
    ul.append(li);
  }
  if (!rows.length) ul.append(el("li", "time", "چیزی پیدا نشد."));
  s.append(ul);
}

function showOverview() {
  const s = ui.side; s.replaceChildren();
  s.append(el("h3", "", "حافظه‌ی نویسنده"));
  s.append(el("p", "muted small", "قاعده‌ی خواندن: رنگ حوزه را نشان می‌دهد، شکل نوع نود را؛ عنوان، مفهوم است و شناسه فقط کلید داخلی. پیوند جهت‌دار از فاعل به مقصد می‌رود. هر نود یک مفهوم کوتاه دارد و جزئیات در پرونده‌ی کناری است."));
  const counts = el("dl", "facts");
  for (const [d, n] of Object.entries(data.counts || {})) counts.append(el("dt", "", domainLabel(d)), el("dd", "", String(n)));
  counts.append(el("dt", "", "پیوندها"), el("dd", "", String(data.edge_count || 0)));
  s.append(counts);
  const strong = [...data.nodes].sort((a, b) => b.strength * (1 + b.uses / 5) - a.strength * (1 + a.uses / 5)).slice(0, 12);
  s.append(el("p", "time", `${data.nodes.length} نود از ${data.node_count ?? data.nodes.length} نود · ${data.visible_edge_count ?? data.edges.length} پیوند در این نما`));
  s.append(el("h3", "", "پررنگ‌ترین‌ها"));
  const ul = el("ul", "list small");
  for (const n of strong) {
    const li = el("li", "clickable");
    li.append(el("div", "", n.label), el("div", "time", `${nodeShape(n.kind)} ${KIND_FA[n.kind] || n.kind} · ${domainLabel(n.domain)} · قدرت ${Math.round(n.strength * 100)}٪`));
    li.addEventListener("click", () => focusId(n.id));
    ul.append(li);
  }
  s.append(ul);
}
