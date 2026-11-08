/* Click an object in the room: the camera zooms into it and its information opens inside it.
   The card is built from text nodes only (no innerHTML), and every list row can carry an action. */

import { ROLE_LABELS, ACTIVITY_LABELS, PLACE_LABELS } from "./citizens.js";

let ctx = null;                       // { camera, controls, stage, toast, openStory, selectTab, setFocus, getFocus, state }
let card = null, cardBody = null, cardTitle = null, cardHint = null;
let openKey = null;
let loadToken = 0;

const FA = { accepted: "پذیرفته", rejected: "رد شده" };

async function jget(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${url} -> ${r.status}`);
  return r.json();
}
const cell = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const token = () => { try { return sessionStorage.getItem("the-writer-owner-token") || ""; } catch { return ""; } };
const post = (url, body) => fetch(url, {
  method: "POST",
  headers: { "Content-Type": "application/json", ...(token() ? { "X-Admin-Token": token() } : {}) },
  body: JSON.stringify(body || {}),
}).then((r) => r.json().then((d) => ({ ok: r.ok, status: r.status, d })));

function row(text, sub, onClick, badge) {
  const li = cell("li");
  const main = cell("div", "row-main", text);
  if (badge) main.prepend(cell("span", "row-badge", badge));
  li.append(main);
  if (sub) li.append(cell("div", "row-sub", sub));
  if (onClick) { li.classList.add("clickable"); li.addEventListener("click", onClick); }
  return li;
}
function list(items) {
  const ul = cell("ul", "rows");
  for (const it of items) ul.append(it);
  if (!items.length) ul.append(row("چیزی اینجا نیست."));
  return ul;
}
function kv(pairs) {
  const dl = cell("dl", "rows-kv");
  for (const [k, v] of pairs) { dl.append(cell("dt", null, k)); dl.append(cell("dd", null, String(v ?? "—"))); }
  return dl;
}
function actions(buttons) {
  const div = cell("div", "row-acts");
  for (const [label, fn] of buttons) {
    const b = cell("button", "act", label);
    b.addEventListener("click", async () => { b.disabled = true; try { await fn(); } finally { b.disabled = false; } });
    div.append(b);
  }
  return div;
}

// the dashboard tab an object belongs to, and the view that opens inside the object
const PANEL_VIEW = {
  "p-stories": "stories", "p-notebook": "notebook", "p-diary": "diary", "p-planner": "planner",
  "p-graph": "mind", "p-world": "world", "p-flaws": "flaws", "p-books": "library",
  "p-comments": "letters", "p-status": "status",
};

// ---------- one entry per thing in the room ----------
const SOURCES = {
  stories: {
    title: "دفتر داستان‌ها", hint: "روی هر دست‌نوشته کلیک کنید تا مثل کتاب باز شود.",
    async render() {
      const s = await jget("/api/stories");
      const rowOf = (x) => row(x.title, `${(x.created || "").replace("T", " ").slice(0, 16)} · ${x.stage} · امتیاز ${x.score} · ${x.words} کلمه`,
        () => ctx.openStory(x.id), FA[x.status] || x.status);
      const ok = s.filter((x) => x.status === "accepted");
      const no = s.filter((x) => x.status !== "accepted" && x.status !== "pending");
      const wait = s.filter((x) => x.status === "pending");
      const out = [cell("h4", "grp", `پذیرفته‌شده (${ok.length}) — همان‌ها که درسِ نوشته‌های بعد می‌شوند`),
        list(ok.slice(0, 8).map(rowOf))];
      if (wait.length) out.push(cell("h4", "grp", `هنوز روی میزِ ناشر (${wait.length})`), list(wait.slice(0, 4).map(rowOf)));
      out.push(cell("h4", "grp", `رد شده (${no.length}) — نگه داشته شده، ولی کمتر از پذیرفته‌شده وزن دارد`),
        list(no.slice(0, 8).map(rowOf)));
      return out;
    },
  },
  notebook: {
    title: "دفترچه‌ی ایده‌ها", hint: "ایده‌ها روی کاغذهای این دفترچه نوشته شده‌اند.",
    async render() {
      const n = await jget("/api/notebook");
      const weave = await jget("/api/weave").catch(() => null);
      const ST = { new: "در انتظار", planned: "روی میزِ نوشتن", used: "از آن نوشته شد" };
      const out = [list(n.slice(0, 10).map((x) => row(x.text, `${x.source === "owner" ? "ایده‌ی شما" : "ایده‌ی خودش"} · ${ST[x.status] || x.status || ""}${x.why ? " · " + x.why : ""} · ${hm(x.time)}`, null, x.status === "new" ? "تازه" : null)))];
      const items = weave?.items || [];
      if (items.length) out.push(cell("h4", "grp", "پیوند‌هایی که زده"),
        list(items.slice(0, 6).map((l) => row(`${(l.labels || []).join(" + ")}`, `${l.premise || ""} · ${l.why || ""} · امتیاز ${l.score ?? "—"}`))));
      return out;
    },
  },
  diary: {
    title: "دفترچه‌ی شخصی", hint: "هر شب یک برگ می‌چیند؛ دست‌خط همان‌جا است.",
    async render() {
      const d = await jget("/api/diary");
      return [list(d.slice(0, 10).map((x) => row(x.text.slice(0, 300), hm(x.time))))];
    },
  },
  core: {
    title: "هسته‌ی شخصیت", hint: "صفحه‌هایی که خودش درباره‌ی خودش نوشته است.",
    async render() {
      const c = await jget("/api/core");
      const vs = (c.versions || []).slice().reverse();
      return [kv(Object.entries(c.stats || {})),
        cell("p", "body", c.text || c.line || ""),
        cell("h4", "grp", "نسخه‌هایی که از این هسته مانده"),
        list(vs.slice(0, 8).map((v) => row(`برگه‌ی ${v.n}`, `${v.trigger ? v.trigger + " · " : ""}${v.summary || ""}${v.words ? ` · ${v.words} واژه` : ""} · ${String(v.at || "").replace("T", " ").slice(0, 16)}`)))];
    },
  },
  persona: {
    title: "پرسونا", hint: "شخصیت او ثاب نیست؛ با هر تجربه جابه‌جا می‌شود و روی نوشته‌ها اثر می‌گذارد.",
    async render() {
      const p = await jget("/api/persona");
      const shift = (s) => {
        const moves = Object.entries(s.traits || {}).map(([k, v]) => `${k} ${v}`).join(" · ");
        return row(s.note || s.event || s.text || "جابه‌جایی", `${moves || "خصایل"} · ${hm(s.time || s.at)}`);
      };
      return [kv(Object.entries(p.traits || {})),
        cell("h4", "grp", "تغییرهای اخیر"),
        list((p.shifts || []).slice().reverse().slice(0, 8).map(shift))];
    },
  },
  mind: {
    title: "سه لایه‌ی ذهن", hint: "ذهن، دانش و آثار یکی نیستند؛ یکدیگر را هل می‌دهند.",
    async render() {
      const m = await jget("/api/mind");
      const L = m.layers || {};
      return [kv([
        ["ذهن", `${L.mind?.count ?? 0} چیز`],
        ["دانش", `${L.knowledge?.count ?? 0} منبع`],
        ["آثار", `${L.works?.accepted ?? 0} پذیرفته‌شده`],
      ]),
      cell("h4", "grp", "تناقض‌هایی که خودش دیده"),
      list((m.contradictions || []).slice(0, 8).map((c) => row(c.what, c.pair)))]
        .filter(Boolean);
    },
  },
  questions: {
    title: "سوال‌های باز", hint: "از همه چیز می‌پرسد، حتی از معنی ادامه دادن.",
    async render() {
      const q = await jget("/api/questions");
      const rows = Array.isArray(q) ? q : [];
      const open = rows.filter((x) => x.status === "open");
      const aside = rows.filter((x) => x.status !== "open");
      const days = (x) => { const t = Date.parse(x.born); return Number.isNaN(t) ? "—" : Math.max(0, Math.round((Date.now() - t) / 864e5)); };
      return [list(open.slice(0, 10).map((x) => row(x.text, `${x.kind || ""} · ${days(x)} روز باز مانده${x.born_from ? " · از: " + x.born_from : ""}`))),
        cell("h4", "grp", "سوال‌هایی که کنار گذاشت یا جواب گرفت"),
        list(aside.slice(0, 8).map((x) => row(x.text, `${x.label || x.status || ""}${x.answer ? " · " + x.answer : ""}${x.answered_at ? " · " + hm(x.answered_at) : ""}`)))];
    },
  },
  wishes: {
    title: "آرزوها و دعاها", hint: "چیزهایی که ندارد؛ اعتقادش هم مثل بقیه‌ی چیزها ساخته می‌شود.",
    async render() {
      const w = await jget("/api/wishes");
      const out = [cell("p", "body", w.summary || ""),
        list((w.wishes || []).slice(0, 8).map((x) => row(x.what, `${x.kind} · ${x.status} · ${hm(x.born)}`)))];
      if ((w.prayers || []).length) out.push(cell("h4", "grp", "دعاها"),
        list(w.prayers.slice(0, 6).map((x) => row(x.words || x.what || String(x), hm(x.spoken_at || x.born)))));
      if ((w.beliefs || []).length) out.push(cell("h4", "grp", "باورهایی که در حال شکل گرفتن است"),
        list(w.beliefs.slice(0, 6).map((b) => row(b.text || b.what || "", `${b.status || ""} · اطمینان ${Math.round((b.confidence || 0) * 100)}٪`))));
      if ((w.requests || []).length) out.push(cell("h4", "grp", "درخواست‌ها از شما"),
        list(w.requests.slice(0, 5).map((r) =>
          row(r.what, `نقصش: ${r.lack || "—"} · ${r.kind || ""} · ${hm(r.born)}`))));
      return out;
    },
  },
  letters: {
    title: "نامه‌های طرفداران", hint: "خواندنش اجباری است؛ جواب دادنش نه.",
    async render() {
      const l = await jget("/api/letters");
      const inbox = list((l.inbox || []).slice(0, 10).map((x) => row(
        `${x.name}: ${x.text}`,
        `${x.story_title ? `روی «${x.story_title}»` : "عمومی"} · ${x.decision || "نخوانده"}${x.state === "suspect" ? " · نقلی که در کتاب پیدا نشد" : ""} · ${hm(x.time)}`)));
      const answer = actions([["نامه‌ی بعدی را خودش جواب بدهد", async () => {
        const next = (l.inbox || []).find((x) => x.decision !== "answered" && !x.reply);
        if (!next) { ctx.toast("نامه‌ای که جواب نگرفته باشد روی میز نیست."); return; }
        const r = await post("/api/letters/answer", { cid: next.cid });
        ctx.toast(r.ok && r.d?.reply ? (r.d.delivered ? "جواب نوشت و فرستاد." : "جواب نوشت، ولی به دستِ نویسنده‌ی نامه نرساند.")
          : (r.d?.error || "جواب نداد — تصمیم خودش بود."));
        refreshIfOpen();
      }]]);
      return [inbox, answer, kv(Object.entries(l.stats || {}))];
    },
  },
  brand: {
    title: "برند و readers", hint: "دلش می‌خواهد معروف شود؛ اما با حرف‌هایی که واقعاً دارد.",
    async render() {
      const b = await jget("/api/brand");
      return [kv([["نام", b.pen_name], ["خط‌شه", b.tagline], ["از", (b.since || "").slice(0, 10)]]),
      cell("h4", null, "خودنویسی"), cell("p", "body", b.bio || "—"),
      cell("p", "quote", b.positioning || ""),
      kv(Object.entries(b.goals || {})),
      list((b.promises || []).slice(0, 6).map((x) => row(typeof x === "string" ? x : (x.text || ""), typeof x === "string" ? " قولی که به خواننده دادم" : hm(x.time)))),
      list((b.reviews_log || []).slice(-4).reverse().map((x) => row(x.text || x.note || "", `${x.rating ?? ""} · ${hm(x.time || x.at)}`)))];
    },
  },
  achievements: {
    title: "دیوار دست‌ها", hint: "فقط با شاهد باز می‌شود؛ بدون شاهد هیچ قفلی نمی‌شکند.",
    async render() {
      const a = await jget("/api/achievements");
      const done = (a.rows || []).filter((r) => r.done).length;
      return [kv([["رسیده", `${done} از ${(a.rows || []).length}`], ...Object.entries(a.stats || {}).filter(([k]) => k !== "latest" && k !== "near")]),
      cell("p", "body", a.summary || ""),
      list((a.rows || []).slice().sort((x, y) => (y.done - x.done) || (x.near ? -1 : 1)).slice(0, 30).map((r) =>
        row(r.label, `${r.goal} · ${r.have}/${r.target} ${r.unit || ""}${r.unlocked_at ? " · " + String(r.unlocked_at).slice(0, 10) : ""}`,
          null, r.done ? "رسید" : (r.near ? "نزدیک" : null))))];
    },
  },
  kinds: {
    title: "قفسه‌ی جورجورها", hint: "نوشته‌هایش را خودش تفکیک می‌کند: ادبی، هنری، شعر، کودک.",
    async render() {
      const k = await jget("/api/kinds");
      const sh = (k.shelves || []).filter((s) => s.count);
      const out = [kv(Object.entries(k.stats || {}).filter(([key]) => key !== "by_kind"))];
      out.push(list(sh.map((s) => row(`${s.label} — ${s.count} نوشته`,
        `${s.words} واژه · ${s.accepted} پذیرفته‌شده · بهترین امتیاز ${s.best_score ?? "—"} · آخرین: ${s.last ? hm(s.last) : "—"}`))));
      if (!sh.length) out.push(list([]));
      const un = (k.stats || {}).unclassified;
      if (un) out.push(cell("p", "time", `${un} نوشته هنوز گونه‌ای برایش نگذاشته‌ام.`));
      return out;
    },
  },
  library: {
    title: "کتابخانه", hint: "کتاب‌هایی که خودش از اینترنت آورده یا شما گذاشته‌اید.",
    async render() {
      const [merge, shelf] = await Promise.all([jget("/api/library").catch(() => []), jget("/api/shelf").catch(() => [])]);
      const raw = [...(Array.isArray(shelf) ? shelf : []), ...(Array.isArray(merge) ? merge : [])];
      const books = []; const seen = new Set();
      for (const b of raw) { const key = String(b.title || b.id || ""); if (key && !seen.has(key)) { seen.add(key); books.push(b); } }
      const FROM = { gutenberg: "از کتابخانه‌ی اینترنت", local: "از قفسه‌ی خودم" };
      return [list(books.slice(0, 14).map((b) => row(`${b.title || "بی‌نام"}${b.author ? " — " + b.author : ""}`,
        `${FROM[b.source] || b.source || ""}${b.added ? " · " + String(b.added).slice(0, 10) : ""}`
        + `${b.pct != null ? ` · ${b.pct}٪ خوانده` : ""}${b.words ? ` · ${b.words} واژه` : ""}${b.note ? " · " + b.note : ""}`))),
      kv([["روی قفسه", books.length], ["که خودش آورده", books.filter((b) => b.source === "gutenberg").length]]),
      actions([["یک کتاب از اینترنت بگیر", async () => {
        const s = ctx.state();
        const want = (s.want_book || s.book_query || "");
        const r = await post("/api/library/download", want ? { query: want } : {});
        ctx.toast(r.ok && r.d?.title ? `«${r.d.title}» به کتابخانه اضافه شد.` : (r.d?.error || "دریافت نشد."));
        refreshIfOpen();
      }]])];
    },
  },
  backups: {
    title: "گاوصندوق", hint: "چک‌پوینت‌هایی که خودش از خودش می‌گیرد.",
    async render() {
      const b = await jget("/api/backups");
      return [kv(Object.entries(b.stats || {})),
      list((b.index || []).slice(0, 10).map((c) => row(`${c.label || "بی‌برچسب"} · ${c.id}`, `${hm(c.when)} · ${Math.round((c.bytes || 0) / 1024)} کیلوبایت · ${c.counts?.files ?? c.files ?? "?"} فایل${c.reason ? " · " + c.reason : ""}`))),
      actions([["همین حالا یک چک‌پوینت", async () => {
        const r = await post("/api/backup/snapshot", { label: "manual" });
        ctx.toast(r.ok ? `چک‌پوینت ${r.d.id || ""} ساخته شد.` : "اجازه‌ی مالک لازم است.");
      }]])];
    },
  },
  graph: {
    title: "حافظه", hint: "گره‌ها کهنه می‌شوند و می‌میرند؛ آنچه زیاد استفاده شود می‌ماند.",
    async render() {
      const g = await jget("/api/graph");
      const doms = Object.entries(g.counts || {});
      const total = doms.reduce((n, [, v]) => n + (Number(v) || 0), 0);
      return [kv([...doms, ["همه‌ی گره‌ها", total], ["پیوند‌ها", g.edge_count ?? (g.edges || []).length]]),
      actions([["کاوش کامل گراف", () => ctx.openExplorer && ctx.openExplorer()]]),
      cell("p", "time", `حافظه‌ام الان در حوزه‌ی «${g.domain || "همه"}» این‌قدر گره دارد؛ گره‌ای که زیاد دستگیرم نشود کهنه می‌شود.`)];
    },
  },
  habits: {
    title: "عادت‌ها", hint: "ساعت خواب، ساعت بیداری و نحوه‌ی نوشتن — و آزمایش‌هایی که روی خودش انجام می‌دهد.",
    async render() {
      const h = await jget("/api/habits");
      return [kv(Object.entries(h.current || {})),
      cell("h4", "grp", "آزمایش‌های جاری"),
      list((h.ladder || []).slice(0, 8).map((t) => row(`${t.key}: ${t.from} → ${t.to}`,
        `${t.status} · ${(t.samples || []).length} نمونه` + (t.delta != null ? ` · فاصله‌ی امتیاز ${t.delta}` : "") + (t.why ? ` · ${t.why}` : "")))),
      actions([["ساعت خواب را خودش عوض کند", async () => {
        const r = await post("/api/habits/set", { key: "sleep", value: "23:30" });
        ctx.toast(r.ok && r.d.ok !== false ? "عادت تازه ثبت شد." : "پذیرفته نشد.");
      }]])];
    },
  },
  masterpiece: {
    title: "شاهکار", hint: "پروژه‌ی بلند: فصل‌ها، میله‌ی کیفیت، و شرط اینکه هنوز وقتش نیست.",
    async render() {
      const m = await jget("/api/masterpiece");
      const c = m.current || {};
      const hist = (m.history || []).slice(0, 6).map((h) => row(
        h.title || "پروژه‌ی پیشین",
        `${h.chapters ?? 0} فصل · امتیاز نهایی ${h.final_score ?? "—"} · ${String(h.born || "").slice(0, 10) || "—"}`,
        null, h.declared ? "اعلام شده" : null));
      return [kv([["وضعیت", c.state], ["پروژه‌ای اعلام‌شده", c.declared ? "بله" : "نه"], ["فعال", c.active ? "بله" : "نه"],
        ["فصل‌ها", `${c.chapters_done ?? 0} از ${c.chapters_planned ?? "—"}`], ["پیشرفت", `${c.pct ?? 0}٪`],
        ["واژه", `${c.words ?? 0} از ${c.words_target ?? "—"}`], ["میانگین امتیاز", c.avg_score ?? "—"],
        ["بهترین/بدترین فصل", `${c.best_chapter ?? "—"} / ${c.worst_chapter ?? "—"}`], ["قدمِ بعد", c.next || "—"]]),
      cell("p", "body", c.title ? `«${c.title}»${c.since ? " از " + String(c.since).slice(0, 10) : ""}` : "هنوز پروژه‌ی بلندی را برای خودم اعلام نکرده‌ام."),
      list(hist)];
    },
  },
  planner: {
    title: "برنامه‌ی امروز", hint: "بلوک‌های ۴۵ دقیقه‌ای؛ انجام‌شده و از‌دست‌رفته.",
    async render() {
      const p = await jget("/api/planner");
      const blocks = p.blocks || p.plan || [];
      return [list(blocks.map((b) => row(`${hm(b.start)}–${hm(b.end)} · ${b.task}`, b.status || ""))),
        kv(Object.entries(p.codex || {}))];
    },
  },
  publisher: {
    title: "دفتر ناشر — بیرون از این خانه",
    hint: "میزِ ناشر جای دیگری در شهر است و هادس هنوز کلیدی به آنجا ندارد؛ فقط می‌رود و حرف می‌زند. این‌جا همان است که از ملاقات‌ها می‌داند، نه داخلِ اتاق.",
    async render() {
      const [pub, rules] = await Promise.all([jget("/api/publisher"), jget("/api/critic/rules").catch(() => ({}))]);
      const rel = pub.relationship || {};
      const pc = (v) => `${Math.round((v || 0) * 100)}٪`;
      const st = pub.stats || {};
      const out = [kv([
        ["نام", pub.name], ["انتشارات", pub.house], ["خلق‌وخو", pub.mood],
        ["اعتماد", pc(rel.trust)], ["کنجکاوی", pc(rel.curiosity)], ["خستگی", pc(rel.fatigue)],
        ["از", (pub.since || "").slice(0, 10)],
      ]), cell("p", "body", rel.reading || "")];
      const std = pub.publisher_standard || {};
      if (std.score_floor != null) {
        out.push(cell("h4", "grp", "معیارهای سخت‌گیرانهٔ نشر"),
          kv([["سطح سخت‌گیری", std.tier], ["حداقل کیفیت", `${std.score_floor} از ۱۰۰`],
              ["حداقل سیگنال ناشر", std.signal_bar],
              ["تعداد آثار تأییدشده", std.publications]]));
      }
      if ((pub.rewards || []).length)
        out.push(cell("h4", "grp", "دستاوردهای تأیید ناشر"),
          list(pub.rewards.slice(0, 8).map((r) =>
            row(`اثر شمارهٔ ${r.publication_number} · ${r.title || "پذیرش اثر"}`,
              `دستاورد باز شد · ${(r.unlocked_at || "").slice(0, 10)} · پرداخت واقعی غیرفعال`))));
      if (pub.last_line) out.push(cell("p", "quote", "ناشر: " + pub.last_line));
      out.push(cell("h4", "grp", "گفت‌وگوها"),
        list((pub.meetings || []).slice(0, 5).map((m) => row(m.topic || "گفت‌وگو", `${String(m.started || m.at || "").replace("T", " ").slice(0, 16)} · ${(m.last || "").slice(0, 90)}`))));
      out.push(cell("h4", "grp", "آنچه برای چاپ پذیرفته"),
        list((pub.catalog || []).map((c) => row(c.title || c.story_id,
          `تیراژ ${c.print_run ?? "—"} · پیش‌پرداخت ${c.advance ?? "—"} · ${(c.decided_at || "").slice(0, 10)}`,
          c.story_id ? () => ctx.openStory(c.story_id) : null, "چاپ"))));
      out.push(cell("h4", "grp", "خواسته‌هایش"),
        list((pub.agenda || []).map((a) => row(a.text || a.what || "", a.story_id ? "روی داستان " + a.story_id : a.kind || ""))));
      out.push(actions([["بیرون برود و پیش ناشر حرف بزند", async () => {
        const r = await post("/api/publisher/visit", {});
        ctx.toast(r.ok ? `ناشر: ${(r.d.line || "").slice(0, 160)}` : "نامه‌ی صاحب انتشارات لازم است.");
        refreshIfOpen();
      }]]));
      const rs = rules.stats || {};
      out.push(cell("h4", "grp", "قواعد منتقد، نسخه‌ی خودش"),
        kv([["نسخه", rules.version], ["حد", rules.threshold], ["نمونه‌ها", `${rs.samples ?? "—"} (حداقل ${rs.min_samples ?? "—"})`],
        ["گیت‌های قابل‌تغییر", rs.actionable_gates], ["بلندی قواعد", rs.loudness]]),
        list((rules.gates || []).map((g) => row(`${g.name}: وزن ${g.weight}`, `اثر واقعی روی رد/پذیرش ${g.lift} · فاصله از پیش‌فرض ${g.delta}`))),
        list((rules.history || []).slice(0, 4).map((h) => row(`نسخه‌ی ${h.version}`, `${h.why || ""} · ${String(h.when || "").slice(0, 16)}`))));
      if ((pub.guard || []).length)
        out.push(cell("h4", "grp", "آنچه ناشر ادعا نکرد"), list(pub.guard.slice(-4).map((g) => row(g.reason || g.text || String(g), hm(g.when || g.at)))));
      return out;
    },
  },
  backstory: {
    title: "گذشته‌ی خودش", hint: "نیمی از این گذشته مدرک دارد؛ نیمِ دیگر را خودش ساخته و صریحاً گفته که ساخته است.",
    async render() {
      const b = await jget("/api/backstory");
      const write = async () => {
        const r = await post("/api/backstory/write", { trigger: "manual" });
        ctx.toast(r.ok ? "گذشته‌اش را دوباره نوشت." : "نامه‌ی صاحب انتشارات لازم است.");
        refreshIfOpen();
      };
      if (b.no_backstory)
        return [cell("p", "body", b.line || "هنوز گذشته‌ای برای خودش ننوشته است."), actions([["گذشته‌اش را بنویسد", write]])];
      const s = b.stats || {};
      const out = [cell("p", "body", b.summary || ""),
        kv([["نسخه", b.version], ["آخرین بازنویسی", dt(b.updated)],
        ["با مدرک", s.canon], ["ساخته‌ی خودش", s.invented], ["بخش‌های پر", s.sections_filled],
        ["از راه", s.via === "llm" ? "با یاریِ ماشینِ نوشتن" : "فقط واقعیت‌های ثبت‌شده"]])];
      out.push(cell("h4", "grp", "آنچه می‌تواند ثابت کند"),
        list((b.canon || []).slice(-14).reverse().map((c) => row(c.text, `${String(c.at || "").slice(0, 10)} · مدرک: ${c.evidence || ""}`))));
      out.push(cell("h4", "grp", "آنچه خودش ساخته — ادعای واقعیت ندارد"),
        list((b.invented || []).map((c) => row(c.text, c.why || "", null, "ساخته"))));
      out.push(cell("h4", "grp", "بخش‌ها"),
        list((b.sections || []).filter((x) => x.text).map((x) => row(x.label_fa, x.text))));
      if ((b.openings || []).length) out.push(cell("h4", "grp", "گشایش‌هایش"), list(b.openings.map((o) => row(o))));
      out.push(actions([["گذشته را دوباره بنویسد", write]]));
      if ((b.versions || []).length)
        out.push(cell("h4", "grp", "نسخه‌های گذشته"),
          list(b.versions.slice(0, 6).map((v) => row(`نسخه‌ی ${v.n}: ${v.summary || ""}`, `${v.trigger} · ${v.words} کلمه · ${dt(v.at)}`))));
      return out;
    },
  },
  timeline: {
    title: "خط زمان زندگی", hint: "هر سنگ‌راه از فایل‌های خودش خوانده شده؛ چیزی که مدرک ندارد روی این خط نمی‌نشیند.",
    async render() {
      const t = await jget("/api/timeline");
      const out = [cell("p", "body", t.summary || "")];
      if (t.next) out.push(cell("h4", "grp", "سنگ‌راه بعدی"), kv([["عنوان", t.next.title], ["چرا", t.next.why]]));
      out.push(cell("h4", "grp", "اولین‌ها"),
        list((t.firsts || []).slice().reverse().slice(0, 12).map((e) => row(e.title, `${String(e.at || "").slice(0, 10)} · ${e.detail || ""}`, null, "اولین"))));
      out.push(cell("h4", "grp", "دوره‌های زندگی"),
        list((t.chapters || []).map((c) => row(`${c.n}. ${c.label}`,
          `${String(c.from || "").slice(0, 10)} ← ${c.to ? String(c.to).slice(0, 10) : "اکنون"} · ${c.count} رویداد`))));
      const c = t.counts || {};
      out.push(cell("h4", "grp", "شمارش"), kv([["همه", c.total], ...Object.entries(c.by_kind || {}).filter(([, v]) => v)]));
      out.push(cell("h4", "grp", "همه‌ی لحظه‌ها"),
        list((t.spine || []).slice().reverse().slice(0, 30).map((e) => row(e.title,
          `${String(e.at || "").replace("T", " ").slice(0, 16)} · ${e.label || ""} · اهمیت ${e.importance}`))));
      return out;
    },
  },
  life: {
    title: "داستان زندگی", hint: "سطح نمایشی از شمارنده‌های ثبت‌شده، زنجیرهٔ دفترچه، برنامهٔ امروز و فصل‌های زندگی؛ نه مدرک مهارت یا موفقیت در دنیای واقعی.",
    async render() {
      const l = await jget("/api/life");
      const lv = l.level || {}, st = l.streak || {}, s = l.stats || {};
      const out = [cell("p", "body", l.story || "هنوز داستانی نوشته نشده."),
        kv([["سطح", lv.label ? `${lv.n} — ${lv.label}` : "—"], ["امتیاز", lv.next_xp === null ? `${lv.xp} · آخرین سطح نمایشی` : `${lv.xp ?? "—"} از ${lv.next_xp ?? "—"}`],
        ["زنجیرهٔ دفترچه", `${st.current ?? "—"} روز (بیشترین در دادهٔ موجود: ${st.best ?? "—"})`],
        ["مأموریت‌های امروز", `${s.quests_done ?? "—"}/${s.quests_total ?? "—"}`],
        ["روزهای دفترچه", s.diary_days ?? "—"], ["فصل‌ها", s.episodes ?? "—"]]),
        cell("p", "time", l.metric_scope || "شاخص‌ها از داده‌های باقی‌مانده محاسبه شده‌اند و سابقهٔ مادام‌العمر نیستند.")];
      if ((l.quests || []).length) {
        out.push(cell("h4", "grp", "مأموریت‌های امروز"),
          list(l.quests.map((q) => row(q.label, `${q.hint || ""} · ${q.source === "diary" ? "از دفترچه" : "از برنامه‌ی روز"}`,
            null, q.state === "done" ? "انجام شد" : (q.state === "skipped" ? "افتاد" : "در برنامه")))));
      }
      for (const ep of (l.episodes || [])) {
        out.push(cell("h4", "grp", `فصل ${ep.n}${ep.current ? " — همین حالا" : ""}`),
          row(`${ep.label || "دوره"}`,
            `${String(ep.from || "").slice(0, 10)} ← ${ep.to ? String(ep.to).slice(0, 10) : "اکنون"} · ${ep.count || 0} رویداد${(ep.unlocked || []).length ? ` · ${ep.unlocked.length} دستاورد` : ""}`));
        if (ep.current && (ep.moments || []).length)
          out.push(list(ep.moments.slice().reverse().map((m) => row(m.title || "لحظه",
            `${String(m.at || "").replace("T", " ").slice(0, 16)} · ${m.label || ""}`))));
      }
      if (l.no_life) out.push(cell("p", "body", "زندگی هنوز چیزی برای تعقیب‌کردن ثبت نکرده است."));
      return out;
    },
  },
  sales: {
    title: "دفتر فروش", hint: "تلاش‌هایش را جدی می‌گیرد؛ اما شمارِ فروش و تیراژ را خودش ساخته است.",
    async render() {
      const s = await jget("/api/sales");
      const f = s.funnel || {}, inv = s.inventory || {}, mo = s.mood || {}, re = s.results || {};
      const IdeaState = { seeded: "نهاده", picked: "برگزیده", tried: "آزموده", dropped: "رهاشده" };
      const out = [cell("p", "body", s.due?.why || (s.empty ? "فعلاً چیزی برای فروش ندارد." : "")),
        kv([["ایده‌ها", f.ideas], ["برگزیده", f.picked], ["طرح‌ریزی‌شده", f.planned], ["تلاش‌شده", f.attempted],
        ["آموخته", f.learned], ["پذیرفته‌شده", inv.accepted_total], ["خواننده", inv.readers],
        ["بله‌ی ناشر", inv.publisher_print], ["خالص (ساخته‌ی خودش)", re.net_modelled],
        ["فشار فروش", `${Math.round((mo.pressure || 0) * 100)}٪`], ["ناامید", mo.discouraged ? "بله" : "نه"]])];
      if (mo.note) out.push(cell("p", "quote", mo.note));
      out.push(cell("h4", "grp", "ایده‌هایش برای فروش"),
        list((s.ideas || []).slice(0, 10).map((i) => row(i.text, `${i.kind || ""} · زحمت ${i.effort || "—"} · ${i.why || ""}${i.expected ? " · انتظار: " + i.expected : ""}`,
          null, IdeaState[i.status] || i.status))));
      out.push(cell("h4", "grp", "طرح‌ها"),
        list((s.plans || []).map((p) => {
          const done = (p.steps || []).filter((x) => x.done).length;
          return row((p.steps || [])[0]?.text || p.id,
            `${done}/${(p.steps || []).length} قدم · سرآمد ${String(p.due || "").slice(0, 10)} · ${p.state === "open" ? "باز" : p.state}`);
        })));
      out.push(cell("h4", "grp", "تلاش‌های ثبت‌شده"),
        list((s.attempts || []).slice(0, 10).map((a) => row(a.action || a.text || a.idea_id || "",
          `${String(a.at || "").replace("T", " ").slice(0, 16)} · پیامد ${a.outcome || "—"} · ${Array.isArray(a.notes) ? a.notes.join("؛ ") : (a.notes || a.lesson || "")}`,
          null, a.modelled ? "ساخته" : null))));
      out.push(cell("h4", "grp", "نتیجه‌گیری"),
        kv([["نمونه‌ها", re.sample], ["بهترین", re.best?.text], ["بدترین", re.worst?.text], ["قابل‌اتکا بودن", re.reliable ? "بله" : "نه"]]),
        re.warning ? cell("p", "warn", re.warning) : null);
      out.push(actions([["به فکر فروش بیفتد و ایده جمع کند", async () => {
        const r = await post("/api/sales/idea", {});
        ctx.toast(r.ok ? (r.d.note || r.d.reason || "ایده‌های تازه‌ای آمد.") : "نامه‌ی صاحب انتشارات لازم است.");
        refreshIfOpen();
      }]]));
      out.push(cell("p", "time", "هیچ‌یک از این اعداد از دنیای بیرون نیامده؛ همه را خودم ساخته‌ام تا تلاشِ خودم را بسنجم."));
      return out.filter(Boolean);
    },
  },
  purse: {
    title: "کیسه", hint: "واحد‌های کیسه از فروشِ ساخته‌ی خودش می‌آید؛ پولِ واقعی نیست. با همین واحد‌ها به کتاب‌فروشیِ نمادین سر می‌زند.",
    async render() {
      const [p, bs] = await Promise.all([jget("/api/purse").catch(() => ({})), jget("/api/bookstore").catch(() => ({}))]);
      const unit = p.unit || bs.unit || "واحد";
      const Src = { sales: "فروش", publisher: "ناشر" };
      const ST = { delivered: "به دست آمد", refunded: "پول پس‌گرفته", unaffordable: "کیسه کم بود", unreachable: "پیدا نشد" };
      const out = [cell("p", "body", p.honesty || bs.honesty || ""),
        kv([["در کیسه", `${p.balance ?? 0} ${unit}`],
        ["پله‌ی سندباکس", `${p.tier ?? bs.tier ?? "؟"} — ${p.tier_label || bs.tier_label || "؟"}`],
        ["خرج کردن", p.rung_open ? "باز" : "بسته (پله‌ی ۴ می‌خواهد)"],
        ["کتاب‌فروشی", bs.rung_open ? "باز (پله‌ی ۵)" : "بسته"]])];
      if (p.price_rule?.rule_fa) out.push(cell("p", "time", p.price_rule.rule_fa));
      const income = (p.income || []).slice(0, 8);
      out.push(cell("h4", "grp", "درآمدها (از کارهای خودش)"),
        list(income.length ? income.map((r) => row(r.detail || Src[r.source] || r.source || "درآمد",
          `${String(r.at || "").slice(0, 10)} · ${Src[r.source] || r.source || ""} · ${r.amount ?? 0} ${unit}`,
          null, r.amount < 0 ? "زیان" : "ثبت")) : []));
      const spends = (p.spends || []).slice(0, 6);
      out.push(cell("h4", "grp", "خرج‌ها"),
        list(spends.length ? spends.map((s) => row(s.purpose || "خرج",
          `${String(s.at || "").slice(0, 10)} · ${s.item || ""} · ${s.amount ?? 0} ${unit}`)) : []));
      const refunds = p.refunds || [];
      if (refunds.length) out.push(cell("h4", "grp", "بازگشتِ پول (کتاب نرسید)"),
        list(refunds.slice(0, 6).map((r) => row("پول پس‌گرفته شد", `${String(r.at || "").slice(0, 10)} · ${r.amount ?? 0} ${unit}`))));
      const acct = bs.account || {};
      out.push(cell("h4", "grp", "حسابم در کتاب‌فروشی"),
        acct.exists ? kv([["دکته", acct.handle || "—"], ["فروشگاه", acct.shop || "—"], ["از", String(acct.opened || "").slice(0, 10)]])
          : cell("p", "time", acct.note || "هنوز حسابی در کتاب‌فروشی باز نکرده‌ام."));
      const sug = bs.suggestion;
      if (sug && sug.ok) out.push(cell("p", "quote", `${sug.reason || ""}${sug.book?.title ? " ← «" + sug.book.title + "»" : ""}${sug.affordable === false ? " (کیسه‌ام هنوز نمی‌رسد)" : ""}`));
      const orders = (bs.orders || []).slice(0, 8);
      out.push(cell("h4", "grp", "سفارش‌ها"),
        list(orders.length ? orders.map((o) => row(o.title || "کتاب",
          `${String(o.at || "").slice(0, 10)} · ${o.price ?? 0} ${unit}${o.reason ? " · " + o.reason : ""}`,
          null, ST[o.state] || o.state || "")) : []));
      out.push(actions([["به کتاب‌فروشی برو و یک کتاب بخر", async () => {
        const s = ctx.state();
        const want = (s.want_book || s.book_query || "");
        const r = await post("/api/bookstore/order", want ? { query: want } : {});
        if (r.ok) ctx.toast(r.d?.title ? `«${r.d.title}» ${ST[r.d.state] || "سفارش داده شد"}.` : "سفارش داده شد.");
        else if (r.d?.refused === "tier_gate") ctx.toast("پله‌ی ۵ باز نیست؛ حسابِ کتاب‌فروشی امضایِ آدم می‌خواهد.");
        else ctx.toast(r.d?.reason || "سفارش ثبت نشد.");
        refreshIfOpen();
      }]]));
      out.push(cell("p", "time", "هیچ سفارشی فروشگاه واقعی را بیدار نکرد؛ نه ایمیلی رفت، نه پولی پرداخت شد."));
      return out.filter(Boolean);
    },
  },
  bookstore: {
    title: "کتاب‌فروشی محله", hint: "یک ساختمان مستقل برای کتاب‌های نویسنده؛ خریدها با واحد نمادین انجام می‌شوند، نه پول واقعی.",
    async render() {
      const [shop, shelf] = await Promise.all([jget("/api/bookstore"), jget("/api/library")]);
      const stateLabels = { delivered: "تحویل‌شده", refunded: "برگشت واحد", unaffordable: "موجودی ناکافی", unreachable: "در دسترس نبود" };
      const out = [kv([["موجودی نمادین", `${shop.balance ?? 0} ${shop.unit || "واحد"}`],
        ["خرید", shop.rung_open ? "باز، با اجازهٔ مالک" : "قفل؛ نیازمند پلهٔ ۵ و تأیید مالک"]]),
        cell("p", "body", shop.honesty || "این فروشگاه واقعی نیست و پرداخت بیرونی ندارد."),
        cell("h4", "grp", "کتاب‌های واردشده به کتابخانه"),
        list(shelf.map((book) => row(book.title, book.author || ""))),
        cell("h4", "grp", "آخرین سفارش‌ها"),
        list((shop.orders || []).slice(0, 8).map((order) => row(order.title || "کتاب", `${order.price ?? 0} ${shop.unit || "واحد"} · ${hm(order.at)}`, null, stateLabels[order.state] || order.state)))];
      if (shop.suggestion?.book) out.push(cell("p", "quote", `پیشنهاد: ${shop.suggestion.book.title} · ${shop.suggestion.reason || ""}`));
      out.push(actions([["دیدن کیسه و خرید با اجازهٔ مالک", () => {
        const mesh = ctx.findMesh("purse"); if (mesh) inspect(mesh);
      }]]));
      return out;
    },
  },
  town: {
    title: "زندگی محله", hint: "روتین‌های نمایشی با ایجنت‌های مستقلِ غیرفعال؛ هنوز تصمیم‌گیری و یادگیری خودمختار ندارند.",
    async render() {
      const roster = await jget("/api/town");
      const live = new Map((ctx.citizenStatus?.() || []).map((entry) => [entry.id, entry]));
      return [kv([["جمعیت", roster.citizens.length], ["ایجنت فعال", 0], ["نوع زندگی", "روتین شبیه‌سازی‌شده"]]),
        list(roster.citizens.map((citizen) => {
          const now = live.get(citizen.id);
          return row(`${ROLE_LABELS[citizen.role]} ${citizen.id.split("-").pop()}`,
            now ? `${ACTIVITY_LABELS[now.activity]} · ${PLACE_LABELS[now.destination]}` : "برنامه در حال بارگذاری",
            () => { closeInspect(false); ctx.selectTab("p-town", false); }, "روتین");
        })),
        cell("p", "time", "برنامهٔ کامل هر شهروند و شناسهٔ ایجنت در منوی محله قابل مشاهده است؛ کلیک روی ردیف آن را باز می‌کند.")];
    },
  },
  status: {
    title: "حال‌وهوا", hint: "این اعداد را از رفتار خودم می‌گیرم؛ ادعای احساس انسانی ندارند.",
    async render() {
      const s = ctx.state();
      return [kv([["وضعیت", s.activity || "—"], ["انرژی", Math.round((s.energy || 0) * 100) + "٪"],
      ["اعتماد به نفس", Math.round((s.mood?.confidence || 0) * 100) + "٪"],
      ["بی‌قراری", Math.round((s.mood?.restlessness || 0) * 100) + "٪"],
      ["غرور", Math.round((s.mood?.pride || 0) * 100) + "٪"], ["مرحله", s.stage]]),
      s.last_error ? cell("p", "warn", "خطای آخر: " + s.last_error) : null].filter(Boolean);
    },
  },
  cli: {
    title: "ترمینال روی میز", hint: "دسترسی خودش به Codex و به چند ابزار فقط‌خواندنی.",
    async render() {
      const c = await jget("/api/cli");
      return [list((c.tools || []).map((t) => row(t.label_fa || t.name, `${(t.files || []).join("، ")} · زحمت ${t.effort || "کم"}`))),
      kv(Object.entries(c.stats || {})),
      kv([["ماشینِ نوشتن", c.available?.exists ? "در دسترس" : "در دسترس نیست"], ["مدل", c.available?.model], ["رونوی ساختگی", c.available?.fake ? "بله" : "نه"]]),
      actions([["از لونا بپرسد", async () => {
        const r = await post("/api/cli/ask", { prompt: "یک جمله‌ی کوتاه درباره‌ی کاری که الان باید بکنی بنویس." });
        ctx.toast(r.ok ? (r.d.text || "").slice(0, 160) : "اجازه‌ی مالک لازم است.");
      }]]),
      cell("p", "time", "این ترمینال همان جعبه‌ای است که از آن خواسته‌هایم را می‌نویسم؛ هر تماس تازه است و چیزی از دفعه‌ی پیش در ذهنش نمی‌ماند.")];
    },
  },
  room: {
    title: "اتاق و گرافیک", hint: "پیشنهاد‌های بصری که خودش می‌دهد؛ شما می‌توانید امتیاز بدهید.",
    async render() {
      const r = await jget("/api/room");
      return [kv(Object.entries(r.overrides || {})),
      list((r.queue || []).map((p) => row(`${p.lever}: ${p.value}`, p.why))),
      actions([["به این اتاق امتیاز بدهم", async () => {
        const r2 = await post("/api/polish/rate", { key: "room", score: 0.8 });
        ctx.toast(r2.ok ? "امتیاز شما ثبت شد." : "ثبت نشد.");
      }]])];
    },
  },
  comments: {
    title: "تخته‌ی نظرها", hint: "هر چه visitors نوشته‌اند، بی‌آنکه پاک شود.",
    async render() {
      const c = await jget("/api/comments");
      return [list(c.slice(0, 12).map((x) => row(`${x.name}: ${x.text}`, `${x.story_id ? "روی داستان " + x.story_id : "عمومی"} · ${hm(x.time)}`)))];
    },
  },
  world: {
    title: "نقشه‌ی جهان", hint: "مکان‌ها و قانون‌هایی که از فایل‌ها و داستان‌ها ساخته شده.",
    async render() {
      const w = await jget("/api/world");
      return [list((w.locations || []).map((p) => row(p.name, p.desc || ""))),
      cell("h4", "grp", "قانون‌ها"), list((w.rules || []).map((r) => row(String(r))))];
    },
  },
  flaws: {
    title: "تخته‌ی ایرادها", hint: "ایرادهایی که خودش پیدا کرده و حدس دلیلشان.",
    async render() {
      const f = await jget("/api/flaws");
      const items = Array.isArray(f) ? f : f.open || [];
      return [list(items.slice(0, 12).map((x) => row(x.problem, `${x.guess || ""} · ${x.plan || ""}`, null, x.status)))];
    },
  },
  revisions: {
    title: "دفترچه‌ی بازنویسی", hint: "هر بار که به‌جای داستانِ تازه، یک صفحه‌ی قدیمیِ خودش را برداشته — و آنچه نگهبانِ درونش درباره‌ی تکرار گفته است.",
    async render() {
      const v = await jget("/api/revisions");
      const KIND = { rewrite: "بازنویسیِ پذیرفته‌شده", rescue: "نجاتِ ردشده" };
      const OUT = { written: "تا نوشته‌ی تازه پیش رفت", guard_blocked: "نگهبانِ درون جلویش را گرفت",
        abandoned: "منتقد نپذیرفت", skipped: "کنار گذاشته شد" };
      const flagFa = (f) => (f === "clone_of_source" ? "همانِ منبع"
        : String(f).startsWith("too_close") ? "نزدیک به یکی از نوشته‌های دیگر"
          : f === "novelty_loss" ? "نوآوری کم" : String(f));
      const out = [cell("p", "body", v.summary || ""), kv(Object.entries(v.stats || {})),
        cell("h4", "grp", "دفترِ تصمیم‌ها — فقط چیزی که واقعاً نوشته شده اینجا می‌آید"),
        list((v.rows || []).slice(0, 10).map((r) => {
          const g = r.guard || {};
          return row(`${r.title || "بی‌عنوان"} → ${r.new_sid ? "نوشته‌ی تازه شد" : "جایی نرفت"}`,
            `${dt(r.at)} · ${KIND[r.kind] || r.kind || "—"} · از ${FA[r.status_before] || r.status_before || "—"} · `
            + `شباهت با منبع ${g.self_similarity ?? "—"} · با دیگر نوشته‌ها ${g.max_other ?? "—"} · نوآوری ${g.novelty ?? "—"}`
            + ((g.flags || []).length ? ` · نشانه‌ها: ${g.flags.map(flagFa).join("، ")}` : "")
            + (r.note ? ` · ${r.note}` : "") + (r.via ? ` · از ${r.via}` : ""),
            r.new_sid ? () => ctx.openStory(r.new_sid) : null, OUT[r.outcome] || r.outcome);
        }))];
      const cand = v.candidates || [];
      const candRow = (c) => row(c.title || "بی‌عنوان",
        `${Math.round(c.age_days ?? 0)} روزه · امتیاز ${c.score ?? "—"} · ${c.why || ""}`,
        () => ctx.openStory(c.id), FA[c.status] || c.status);
      const ok = cand.filter((c) => c.status === "accepted");
      const no = cand.filter((c) => c.status !== "accepted");
      out.push(cell("h4", "grp", `پذیرفته‌شده‌ها (${ok.length}) — این‌ها جلوتر ایستاده‌اند`), list(ok.slice(0, 8).map(candRow)));
      out.push(cell("h4", "grp", `ردشده‌ها (${no.length}) — فرصتِ دوم، ولی برای درس‌گرفتن وزنشان کمتر است`), list(no.slice(0, 8).map(candRow)));
      // ---- the other half of the same habit: not a new page grown from an old one, but the old page itself rewritten in place
      const d = await jget("/api/stories/revisions").catch(() => ({}));
      const b = d.budget || {}, rail = d.rails || {};
      const DEC = { revised: "از نو نوشته شد و نسخه‌ی کهنه بایگانی شد",
        refused_similarity: "نگهبانِ درون جلویش را گرفت — هنوز کپی است",
        unchanged: "هیچ چیزی عوض نشد", no_budget: "بودجه‌ی بازنویسی تمام است",
        refused_repeat: "این صفحه به سقفِ نسخه‌هایش رسیده", nothing_to_revise: "صفحه‌ای استدعا نبود",
        unknown_story: "چنین صفحه‌ای روی قفسه نیست", empty_body: "صفحه‌ی کهنه خالی بود" };
      const ask = async (id, label) => {
        const r = await post("/api/stories/revise", id ? { id, reason: `از ${label}` } : { reason: `از ${label}` });
        if (r.ok) ctx.toast(`«${r.d.title || "صفحه"}» نسخه‌ی ${r.d.version} گرفت؛ نسخه‌ی پیشین بایگانی شد.`);
        else ctx.toast(`${DEC[r.d?.status] || "بازنویسی نشد"} — ${r.d?.note || r.d?.error || ""}`);
        refreshIfOpen();
      };
      const dcand = (d.candidates || []).map((c) => {
        const sure = (c.notes || []).filter((n) => n.reliable && n.text).length;
        return row(`${c.title || "بی‌عنوان"} — نسخه‌ی ${((c.versions || 0) + 1)}`,
          `${(c.reasons || []).join("؛ ") || "بی‌دلیل"} · نیاز ${c.need ?? "—"} × وزن ${c.weight ?? "—"} =cue ${c.cue ?? "—"}`
          + ` · ${sure} یادداشتِ سنجیده‌شده`, () => ask(c.id, "درخواستِ صاحبِ اتاق"), FA[c.status] || c.status);
      });
      out.push(cell("h4", "grp", "نیمه‌ی دیگر: صفحه‌ی کهنه را برمی‌دارد و همان‌جا از نو می‌نویسد"),
        kv([["از این راه", `${d.total ?? 0} بار`], ["امروز", `${b.used ?? 0} از ${b.limit ?? "—"} بازنویسی`],
            ["در پنجره‌ی تازه", `${b.window_stories ?? 0} صفحه`], ["سقفِ هر صفحه", rail.per_story ?? "—"],
            ["شباهت به دیگر نوشته‌ها تا", rail.similarity_max ?? "—"], ["شباهت به خودِ همان صفحه تا", rail.self_similarity_max ?? "—"],
            ["«چیزی عوض نشد» از", rail.unchanged_max ?? "—"]]),
        list(dcand.slice(0, 6)),
        actions([["خودش قوی‌ترین کهنه را بردارد", () => ask(null, "تصمیمِ خودش")]]),
        list((d.ledger || []).slice(0, 6).map((r) => {
          const g = r.guard || {};
          return row(`${r.title || "بی‌عنوان"} — ${DEC[r.outcome] || r.outcome}`,
            `${dt(r.at)} · نسخه‌ی ${r.version ?? "—"} · وزنِ قفسه ${r.weight ?? "—"} · شباهت به خود ${g.self_similarity ?? "—"}، `
            + `به دیگران ${g.similarity ?? "—"} (حد ${g.threshold ?? "—"})`
            + (r.reason ? ` · ${r.reason}` : "") + (r.via ? ` · از ${r.via}` : ""),
            () => ctx.openStory(r.story_id));
        })));
      out.push(cell("p", "time", "اعدادِ شباهت حسابِ خودم روی متن‌های خودم است، نه نظرِ یک ماشین؛ بازنویسی‌ای که نگهبانِ درونم نزدیکش بداند، نه داستان است و نه ردشده — روی میز می‌ماند. "
        + "بالا دفترِ همان ریلی است که خودبه‌خود در حلقه می‌چرخد و نوشته‌ی تازه می‌سازد؛ پایینِ دفترچه همان صفحه‌ی کهنه را از نو می‌نویسد — دو راهِ متفاوت، دو دفترِ جدا."));

      return out;
    },
  },
  margins: {
    title: "حاشیه‌های روی نوشته‌ها",
    hint: "یادداشت‌هایی که روی متن‌هایش مانده؛ هیچ‌کدام بی‌سنجیدن با خودِ متن باور نمی‌شود و هر کدام پاک‌کردنی دارد.",
    async render() {
      const m = await jget("/api/margins");
      const STATE = { verified: "متنِ نوشته تأییدش کرد", unverified: "متن چیزی را تأیید نکرد",
        suspect: "سنجش ردش کرد", unchecked: "هنوز سنجیده نشده" };
      const noteRow = (n) => row(`${n.name ? n.name + ": " : ""}${n.text}`,
        `${n.story_id ? `روی «${n.story_id}»` : "عمومی"}${n.quote ? ` · به «${n.quote}» تکیه کرده` : ""}`
        + ` · ${STATE[n.state] || n.state || "—"}${n.check?.via === "model" ? " (سنجش با ماشین نوشتن)" : ""}`
        + `${n.check?.why ? ` · ${n.check.why}` : ""} · ${dt(n.time)}`,
        n.story_id ? () => ctx.openStory(n.story_id) : null,
        n.reliable ? "معتبر" : (n.state === "suspect" ? "بی‌اعتبار" : null));
      const out = [cell("p", "body", m.summary || ""), kv(Object.entries(m.stats || {})),
        cell("h4", "grp", "حاشیه‌هایی که هنوز روی نوشته‌ها مانده‌اند"),
        list((m.notes || []).slice(0, 12).map(noteRow))];
      const bad = (m.suspect || []).slice(0, 4);
      if (bad.length) {
        out.push(cell("h4", "grp", "آن‌ها که سنجش رد کرده — این‌ها وارد باورم نمی‌شوند"));
        for (const n of bad) {
          out.push(list([noteRow(n)]));
          out.push(actions([["این حاشیه را پاک کند", async () => {
            const r = await post("/api/margins/remove", { id: n.id, reason: "سنجش با متن ردش کرد" });
            ctx.toast(r.ok && r.d?.removed ? `پاک شد؛ ${r.d.why || ""}` : (r.d?.why || "چیزی پاک نشد — اجازه‌ی شما لازم است."));
            refreshIfOpen();
          }]]));
        }
      }
      out.push(actions([
        ["حاشیه‌ها را با متن بسنجد", async () => {
          const r = await post("/api/margins/check", { limit: 12 });
          const d = r.d || {};
          ctx.toast(r.ok ? `سنجید: ${d.checked ?? 0} · معتبر ${d.verified ?? 0} · رد ${d.suspect ?? 0} · بی‌پیوند ${d.unverified ?? 0}`
            : "سنجش انجام نشد — اجازه‌ی شما لازم است.");
          refreshIfOpen();
        }],
        ["حاشیه‌های بی‌جایگاه را پاک کند", async () => {
          const r = await post("/api/margins/sweep", {});
          const d = r.d || {};
          ctx.toast(r.ok ? `پاک شد ${ (d.wiped || []).length } · ماند ولی بی‌اعتبار ${(d.kept_but_distrusted || []).length} · حاشیه‌های باقی‌مانده ${d.notes_left ?? "—"}`
            : "پاک نشد — اجازه‌ی شما لازم است.");
          refreshIfOpen();
        }]]));
      out.push(cell("h4", "grp", "دفترِ پاک‌شده‌ها — هیچ حاشیه‌ای بی‌ردپا نمی‌رود"),
        list((m.removed || []).slice(0, 8).map((t) => row(`${t.note?.name ? t.note.name + ": " : ""}${t.note?.text || ""}`,
          `${t.id || ""} · ${dt(t.removed_at)} · پاک کرد: ${t.by || "—"} · دلیل: ${t.reason || "—"}`
          + `${t.note?.quote ? ` · جای متن: «${t.note.quote}»` : ""} · وضعیتِ روزِ پاک‌شدن: ${STATE[t.state] || t.state || "—"}`))));
      return out;
    },
  },
  building: {
    title: "نقشه‌ی ساختمان",
    hint: "کل ساختمانِ نویسنده؛ با نمایِ «ساختمان» از بیرون دیده می‌شود.",
    async render() {
      return [cell("p", "body", "ساختمانِ هادس دو طبقه و یک پشت‌بام دارد. همین صحنه طبقه‌ی بالاست که دیوارِ جلویش برای دیدن برداشته شده؛ پله‌ها و راهرو زیرِ همین اتاق‌اند و درِ خیابان روی نمایِ جلوست."),
        list([
          row("پشت‌بام", "جان‌پناه، آب‌پز و آنتن — بلندترین نقطه‌ی خانه"),
          row("طبقه‌ی بالا — اتاق هادس", "میزِ نوشتن، کتابخانه، تخت، مبل، کمد لباس و درِ بسته‌ی ناشر؛ همه‌ی زندگیِ همین صحنه"),
          row("پاگرد و پله‌ها", "زیرِ اتاق؛ از درِ خیابان تا درِ اتاق — در نمایِ عروسکی دیده نمی‌شود چون دیوارِ جلو برداشته شده"),
          row("طبقه‌ی زیرین — راهرو", "جعبه‌ها و چراغِ راهرو؛ جای کاری که هنوز به آن اجازه ندارد"),
          row("درِ خیابان", "تنها ورودِ خانه؛ روی نمایِ جلو، در نمایِ «ساختمان»"),
          row("دفترِ ناشر", "این‌جا نیست — جای دیگری در شهر است؛ هادس فقط می‌رود و حرف می‌زند"),
        ]),
        cell("p", "time", "برای دیدنِ کل ساختمان، دکمه‌ی «ساختمان» را در نوارِ بالای صحنه بزنید.")];
    },
  },
  wardrobe: {
    title: "کمد لباس",
    hint: "شخصی‌سازیِ ظاهرِ نویسنده. درِ کمد قفل است؛ کلیدش در منوی دستاوردهاست (تب «چاپ»).",
    async render() {
      const w = await jget("/api/wardrobe");
      if (w.locked) {
        return [cell("p", "body", "درِ کمد بسته است و هادس همان لباسِ همیشگی را دارد. تغییرِ چهره‌ی شخصیت تصمیمِ انسانی است: از منوی دستاوردها (تب «چاپ» در منوی کنار) اجازه بدهید تا کمد باز شود."),
          kv([["وضعیت", "قفل"]])];
      }
      const PRESETS = {
        "همیشگی": { shirt: "#5b4a6e", sweater: "#8a7a60", pants: "#2f3440" },
        "شبِ کار": { shirt: "#31465a", sweater: "#4a3b55", pants: "#23262e" },
        "جمعه": { shirt: "#7a3e2e", sweater: "#b0906a", pants: "#3f4a66" },
        "راحتی": { shirt: "#6e8f6b", sweater: "#8a5c7a", pants: "#4a4a42" },
      };
      const wear = (colors) => async () => {
        const r = await post("/api/wardrobe/outfit", { colors });
        ctx.toast(r.ok ? "هادس لباس تازه پوشید" : (r.d?.error || "نشد — اجازه‌ی شما لازم است."));
        refreshIfOpen();
      };
      const out = [cell("p", "body", "کمد باز است. یک لباسِ آماده انتخاب کنید یا رنگِ هر تکه را خودتان بچینید؛ رنگ‌ها همان لحظه روی هادس در اتاق می‌نشیند."),
        kv(Object.entries(w.outfit || {}).map(([k, v]) => [k, String(v)])),
        actions(Object.entries(PRESETS).map(([name, colors]) => [`«${name}» را بپوشد`, wear(colors)]))];
      const inputs = {};
      const pickers = cell("div", "obj-body");
      for (const [part, fa] of [["shirt", "پیراهن"], ["sweater", "بافتان"], ["pants", "شلوار"]]) {
        const inp = document.createElement("input");
        inp.type = "color";
        inp.value = /^#[0-9a-f]{6}$/.test(String(w.outfit?.[part] || "")) ? w.outfit[part] : "#5b4a6e";
        inputs[part] = inp;
        pickers.append(cell("div", "row-sub", fa), inp);
      }
      out.push(cell("h4", "grp", "لباسِ خودتان"), pickers,
        actions([["این رنگ‌ها را بپوشد", async () => {
          const colors = {};
          for (const [p, i] of Object.entries(inputs)) colors[p] = i.value;
          await wear(colors)();
        }]]));
      out.push(cell("h4", "grp", "لباس‌هایی که تا حالا پوشیده"),
        list((w.history || []).map((h) => row(String(h.at || "").replace("T", " ").slice(0, 16),
          Object.values(h.outfit || {}).join(" · ")))));
      return out;
    },
  },
  skillbook: {
    title: "دفتر مهارت‌ها", hint: "مهارت‌هایی که از کارهای واقعیِ خودش جمع کرده — هر کدام با مدرک، و پیوند میان‌شان.",
    async render() {
      const [s, learn] = await Promise.all([jget("/api/skillbook"), jget("/api/learning").catch(() => null)]);
      const nodes = (s.graph || {}).nodes || [];
      const studied = new Set(nodes.filter((x) => x.studied).map((x) => x.id));
      const out = [cell("p", "body", s.summary || ""), kv(Object.entries(s.stats || {})),
        cell("h4", "grp", "نردبانِ هر مهارت"),
        list((s.levels || []).slice(0, 14).map((l) => row(`${l.label_fa} — سطح ${l.level}`,
          `${l.value ?? 0} ${l.unit || ""} · تا درِ بعدی ${l.remaining ?? "—"} · خانواده: ${l.family || "—"}`
          + (l.max ? " · به سقف رسیده" : "") + (l.advanced_on ? ` · آخرین رشد: ${String(l.advanced_on).slice(0, 10)}` : ""),
          null, studied.has(l.id) ? "آموخته" : null)))];
      const links = (s.graph || {}).links || [];
      if (links.length) out.push(cell("h4", "grp", "پیوند‌هایی که میان‌شان گذاشته"),
        list(links.slice(0, 10).map((l) => row(`${l.a} ↔ ${l.b} (${l.kind})`, `${l.why || ""} · ${l.evidence ?? 0} مدرک · ${dt(l.at)}`))));
      if ((s.refusals || []).length) out.push(cell("h4", "grp", "ارتقاهایی که بی‌مدرک رد کرده‌ام"),
        list(s.refusals.slice(0, 6).map((r) => row(`${r.skill ?? r.id ?? "—"} → سطح ${r.to ?? r.level ?? "—"}`,
          `${r.reason || r.why || "بی‌مدرک"} · ${dt(r.at)}`))));
      if (learn && (learn.skills || []).length) out.push(cell("h4", "grp", "خارج از نویسندگی — گرافِ جدا"),
        list(learn.skills.slice(0, 8).map((k) => row(`${k.label_fa || k.key} — ${k.pct ?? "?"}٪`,
          `${k.domain || ""} · ${k.sessions ?? 0} نشست · ${k.status || ""}${k.next ? " · قدمِ بعد: " + k.next : ""}`))));
      out.push(actions([["دفتر را از کارهای تازه پر کند", async () => {
        const r = await post("/api/skillbook/tidy", {});
        const h = r.d?.harvest, c = r.d?.connect;
        ctx.toast(r.ok && h && c
          ? `مهارت‌های تازه: ${h.created?.length ?? 0} · رشد کرده: ${h.grew?.length ?? 0} · پیوندهای تازه: ${c.added?.length ?? 0}`
          : "به‌روز نشد — اجازه‌ی شما لازم است.");
        refreshIfOpen();
      }]]));
      return out;
    },
  },
  sandbox: {
    title: "رایانه‌ی میزش", hint: "دسترسی‌اش را پله‌پله می‌گیرد؛ فعلاً در حدِ استفاده‌ی تحقیقاتی.",
    async render() {
      const v = await jget("/api/sandbox");
      const st = v.stats || {};
      const out = [cell("p", "body", v.summary || ""),
        kv([["پله", `${v.tier ?? "—"} — ${v.label_fa || "—"}`], ["نامِ پله", v.slug || "—"],
        ["چه معنی دارد", v.means_fa || ""], ["چه کسی داده", st.granted_by || "—"],
        ["روش", st.mode || "—"], ["شاهدِ تخلف", st.violations ?? 0], ["تخلفِ سخت", st.hard_violations ?? 0],
        ["کارِ تمیز روی این پله", st.clean_jobs ?? 0], ["ساعت‌های در دست", st.held_hours ?? 0],
        ["درخواست از کتابخانه", st.library_requests ?? 0], ["دریافت‌های موفق", st.fetches_ok ?? 0]]),
        cell("h4", "grp", "نردبان"),
        list((v.ladder || []).map((r) => row(`پله‌ی ${r.tier}: ${r.label_fa} (${r.slug})`,
          `${r.means_fa || ""}${(r.capabilities || []).length ? ` · می‌گشاید: ${r.capabilities.join("، ")}` : ""}`,
          null, r.open ? "باز" : (r.manual_only ? "فقط دستی" : null))))];
      out.push(cell("h4", "grp", "دسترسی‌ها، یکی‌یکی"),
        list((v.capabilities || []).map((c) => row(`${c.label_fa || c.cap}`,
          `پله‌ی ${c.min_tier} · ${c.open ? "باز است" : "بسته است"}${c.modelled ? " · هنوز لایه‌ی اجرایی ندارد" : ""}`
          + `${c.detail_fa ? ` · ${c.detail_fa}` : ""}`, null, c.open ? "باز" : "بسته"))));
      const nx = v.next || {};
      out.push(cell("h4", "grp", "پله‌ی بعد"), nx.to
        ? list([row(`پله‌ی ${nx.to}: ${nx.label_fa || ""}`, `${nx.note || ""} `
          + (nx.criteria || []).map((c) => `${c.need} ${c.have}/${c.want}${c.ok ? " ✓" : ""}`).join(" · "))])
        : list([]));
      out.push(cell("h4", "grp", "تغییرهای دسترسی"),
        list((v.changes || []).slice(0, 8).map((c) => row(`${c.direction === "down" ? "پایین" : "بالا"} → پله‌ی ${c.to ?? c.tier ?? "—"}`,
          `${c.reason || ""} · ${c.by || c.granted_by || "—"} · ${dt(c.at)}`))));
      out.push(actions([
        ["پله‌ی بعد را باز کند (تأیید شما)", async () => {
          const to = (v.next || {}).to ?? ((v.tier || 1) + 1);
          const r = await post("/api/sandbox/grant", { tier: to, by: "owner", reason: "تأیید دستی از صفحه‌ی اتاق" });
          ctx.toast(r.ok && r.d?.changed ? (r.d.why || "پله باز شد.") : (r.d?.why || "اجازه‌ی مالک لازم است."));
          refreshIfOpen();
        }],
        ["یک پله پایین بیاورد", async () => {
          const to = Math.max(1, (v.tier || 1) - 1);
          const r = await post("/api/sandbox/demote", { tier: to, reason: "درخواست شما از صفحه‌ی اتاق" });
          ctx.toast(r.ok && r.d?.changed ? (r.d.why || "پله بسته شد.") : (r.d?.why || "چیزی عوض نشد."));
          refreshIfOpen();
        }]]));
      out.push(cell("p", "time", "هیچ دسترسی‌ای بی‌شاهد باز نمی‌شود؛ هر چه اینجا هست از فایل‌های خودِ همین اتاق خوانده شده."));
      return out;
    },
  },
};

function hm(iso) { return iso ? String(iso).slice(11, 16) : ""; }
function dt(iso) { return iso ? String(iso).replace("T", " ").slice(0, 16) : ""; }

// ---------- the card that opens over the stage ----------
function buildCard() {
  card = cell("div", "obj-card");
  card.setAttribute("role", "dialog");
  card.setAttribute("aria-label", "اطلاعات داخل شیء");
  const head = cell("div", "obj-head");
  cardTitle = cell("h3", null, "");
  const close = cell("button", "obj-close", "بستن");
  close.addEventListener("click", () => closeInspect(true));
  head.append(cardTitle, close);
  cardHint = cell("p", "obj-hint", "");
  cardBody = cell("div", "obj-body");
  card.append(head, cardHint, cardBody);
  ctx.stage.appendChild(card);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeInspect(true); });
}

export function initObjects(context) {
  ctx = context;
  buildCard();
}

export function closeInspect(resetView) {
  openKey = null;
  if (card) card.hidden = true;
  if (resetView && ctx?.setFocus) ctx.setFocus(null);
}

export function currentObject() { return openKey; }

export async function inspect(mesh, point) {
  if (!ctx) return;
  const key = mesh.userData.view || PANEL_VIEW[mesh.userData.panel] || "status";
  const src = SOURCES[key] || SOURCES.status;
  openKey = key;
  if (!card) buildCard();
  card.hidden = false;
  cardTitle.textContent = src.title;
  cardHint.textContent = src.hint || "";
  cardBody.replaceChildren(cell("p", "time", "در حال خواندن…"));

  // the camera moves into the object first, then its content appears
  const box = new THREE.Box3().setFromObject(mesh);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const radius = Math.max(0.35, size.length() * 0.6);
  const from = ctx.camera.position.clone().sub(center);
  if (from.lengthSq() < 1e-4) from.set(0, 0.6, 1);
  from.normalize().multiplyScalar(Math.max(ctx.controls.minDistance + 0.2, radius * 1.5));
  const pos = center.clone().add(from);
  pos.y = Math.max(pos.y, center.y + 0.15);
  ctx.setFocus({ key, center, pos, until: performance.now() + 6000 });
  if (ctx.selectTab && mesh.userData.panel) ctx.selectTab(mesh.userData.panel, false);

  const token = ++loadToken;
  try {
    const nodes = await src.render();
    if (token !== loadToken) return;
    cardBody.replaceChildren(...nodes.flat().filter(Boolean));
  } catch (e) {
    if (token !== loadToken) return;
    cardBody.replaceChildren(cell("p", "warn", "این شیء باز نشد: " + e.message));
  }
}

export function refreshIfOpen() {
  if (!openKey || !ctx?.findMesh) return;
  const mesh = ctx.findMesh(openKey);
  if (mesh) inspect(mesh);
}

// THREE is provided by world.js so this module needs no import map of its own.
let THREE = null;
export function setTHREE(t) { THREE = t; }
