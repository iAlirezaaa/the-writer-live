/* The book reader. A story opens as a book: a title page, the text set on paper pages (two pages side by side
   on wide screens), the critic's report at the back, and a margin with readers' notes. Any reader can select
   a passage and leave a note on it; notes on a passage are highlighted in the text. All text goes through
   textContent / text nodes, never innerHTML.

   Page turning (Persian book, right to left): the left leaf lifts off the spine and lands on the right stack,
   so a forward turn swings the LEFT page over; a back turn swings the RIGHT page over. The turning leaf is a
   real two-faced element — its front is the page leaving, its back is the page underneath it — animated with
   the Web Animations API around the spine. Single-page layouts and reduced-motion preferences get an instant
   swap instead. */

const STATUS_FA = { accepted: "پذیرفته", rejected: "رد شده" };
/* A margin note is a claim about a passage, so the writer is allowed to distrust it. The four states come
   straight from comments.state_of() and say honestly how far the note may be trusted — "unverified" means the
   passage was looked for in the real page but no model was awake to judge the claim, and the panel says so. */
const MARGIN_STATE_FA = {
  unchecked: "هنوز سنجیده نشده",
  verified: "با متنِ امروز جور است",
  unverified: "جای گذاره پیدا شد؛ ادعا سنجیده نشده",
  suspect: "مردود: با متن نمی‌خواند",
};
let ui = null;          // the overlay, built once
let book = null;        // { story, comments, pages, index, turning }
let flipMs = 460;

async function getJSON(url, opts) {
  const r = await fetch(url, opts);
  if (!r.ok) throw new Error(`${url} -> ${r.status}`);
  return r.json();
}
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const normalize = (s) => s.replace(/\s+/g, " ").trim();
const ownerToken = () => { try { return sessionStorage.getItem("the-writer-owner-token") || ""; } catch { return ""; } };
async function ownerPost(path, body) {
  const r = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(ownerToken() ? { "X-Admin-Token": ownerToken() } : {}) },
    body: JSON.stringify(body || {}),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(String(data.error || data.why || `کد ${r.status}`));
  return data;
}

function build() {
  const overlay = el("div", "book-overlay"); overlay.hidden = true;
  overlay.setAttribute("role", "dialog"); overlay.setAttribute("aria-modal", "true");
  const bar = el("div", "book-bar");
  const title = el("span", "book-bar-title");
  const tools = el("div", "book-tools");
  const marginBtn = el("button", "", "حاشیه‌ها");
  const closeBtn = el("button", "", "بستن");
  tools.append(marginBtn, closeBtn);
  bar.append(title, tools);
  const shelf = el("div", "book-shelf");
  const bookEl = el("div", "book");
  const pageR = el("div", "page page-right");
  const pageL = el("div", "page page-left");
  bookEl.append(pageR, pageL);           // RTL: the first page of a spread is on the right
  const prev = el("button", "turn turn-prev", "›"); prev.setAttribute("aria-label", "صفحه‌ی قبل");
  const next = el("button", "turn turn-next", "‹"); next.setAttribute("aria-label", "صفحه‌ی بعد");
  shelf.append(prev, bookEl, next);
  const footer = el("div", "book-footer");
  const counter = el("span", "book-counter");
  footer.append(counter);
  const margin = el("aside", "book-margin"); margin.hidden = true;
  const selBtn = el("button", "sel-note", "نظر روی این بخش"); selBtn.hidden = true;
  const pop = el("form", "note-pop"); pop.hidden = true;
  const popQuote = el("blockquote", "note-quote");
  const popName = el("input"); popName.placeholder = "نام (اختیاری)"; popName.maxLength = 40;
  const popText = el("textarea"); popText.placeholder = "نظرتان درباره‌ی همین بخش"; popText.maxLength = 500; popText.rows = 3;
  const popRow = el("div", "note-row");
  const popSend = el("button", "", "ثبت نظر"); popSend.type = "submit";
  const popCancel = el("button", "", "انصراف"); popCancel.type = "button";
  const popStatus = el("span", "time");
  popRow.append(popSend, popCancel, popStatus);
  pop.append(popQuote, popName, popText, popRow);
  // a hidden page used to measure how much text fits
  const measure = el("div", "page page-measure");
  overlay.append(bar, shelf, footer, margin, selBtn, pop, measure);
  document.body.appendChild(overlay);

  ui = { overlay, title, bookEl, pageR, pageL, prev, next, counter, margin, marginBtn, closeBtn, selBtn, pop, popQuote, popName, popText, popStatus, popCancel, measure };

  closeBtn.addEventListener("click", close);
  overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });
  prev.addEventListener("click", () => turn(-1));
  next.addEventListener("click", () => turn(1));
  marginBtn.addEventListener("click", () => { margin.hidden = !margin.hidden; marginBtn.setAttribute("aria-pressed", String(!margin.hidden)); });
  document.addEventListener("keydown", (e) => {
    if (overlay.hidden || e.target.closest?.("input, textarea")) return;
    if (e.key === "Escape") close();
    if (e.key === "ArrowLeft") turn(1);
    if (e.key === "ArrowRight") turn(-1);
  });
  let touchX = null;
  bookEl.addEventListener("touchstart", (e) => { touchX = e.touches[0].clientX; }, { passive: true });
  bookEl.addEventListener("touchend", (e) => {
    if (touchX == null) return;
    const dx = e.changedTouches[0].clientX - touchX; touchX = null;
    if (Math.abs(dx) > 50 && !window.getSelection().toString()) turn(dx > 0 ? 1 : -1);
  });
  bookEl.addEventListener("mouseup", (e) => { if (!onSelect(e)) edgeTurn(e); });
  bookEl.addEventListener("touchend", () => setTimeout(onSelect, 50));
  selBtn.addEventListener("mousedown", (e) => e.preventDefault());
  selBtn.addEventListener("click", openNoteForm);
  popCancel.addEventListener("click", () => { pop.hidden = true; });
  pop.addEventListener("submit", sendNote);
  let t = null;
  window.addEventListener("resize", () => { clearTimeout(t); t = setTimeout(() => { if (book && !overlay.hidden) repaginate(); }, 200); });
  // the reader keeps its own preferred flip speed; the room's polish loop can set it
  const rm = window.matchMedia("(prefers-reduced-motion: reduce)");
  rm.addEventListener?.("change", () => { if (book && !overlay.hidden) show(); });
}

export async function openBook(storyId) {
  if (!ui) build();
  const [story, notes] = await Promise.all([
    getJSON(`/api/stories/${encodeURIComponent(storyId)}`),
    getJSON(`/api/stories/${encodeURIComponent(storyId)}/comments`).catch(() => []),
  ]);
  book = { story, comments: notes, pages: [], index: 0, turning: null, repaginateLater: false };
  ui.title.textContent = story.title;
  ui.overlay.hidden = false;
  document.body.classList.add("book-open");
  renderMargin();
  repaginate();
}

function close() {
  endTurn();
  ui.overlay.hidden = true; ui.selBtn.hidden = true; ui.pop.hidden = true;
  document.body.classList.remove("book-open");
}

export function setTurnSpeed(ms) {
  if (Number.isFinite(ms) && ms >= 120 && ms <= 1400) flipMs = ms;
}

function spread() { return window.innerWidth >= 860 ? 2 : 1; }
function reducedMotion() { return window.matchMedia("(prefers-reduced-motion: reduce)").matches; }

// ---------- content ----------
function storyParagraphs() {
  return book.story.body.replace(/^# .*\n+/, "").split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
}
function checkLines() {
  return (book.story.check || "").split("\n").map((l) => l.replace(/^#+\s*/, "").replace(/^-\s*/, "• ").trim()).filter(Boolean);
}

function marked(text, quotes) {
  const frag = document.createDocumentFragment();
  let rest = text;
  while (rest) {
    let best = null;
    for (const q of quotes) {
      const i = rest.indexOf(q.quote);
      if (i >= 0 && (!best || i < best.i)) best = { i, q };
    }
    if (!best) { frag.appendChild(document.createTextNode(rest)); break; }
    if (best.i > 0) frag.appendChild(document.createTextNode(rest.slice(0, best.i)));
    const m = el("mark", "note-mark", best.q.quote);
    m.title = `${best.q.name}: ${best.q.text}`;
    m.dataset.cid = best.q.id;
    frag.appendChild(m);
    rest = rest.slice(best.i + best.q.quote.length);
  }
  return frag;
}

// Marks get their click handlers after mounting: cloneNode() drops listeners.
function bindMarks(root) {
  root.querySelectorAll("mark.note-mark").forEach((m) => {
    m.addEventListener("click", () => { ui.margin.hidden = false; focusNote(m.dataset.cid); });
  });
}

function titlePage() {
  const s = book.story;
  const page = el("div", "page-content title-page");
  page.append(el("div", "tp-kicker", "داستان"), el("h1", "tp-title", s.title));
  const ribbon = el("div", `tp-status ${s.status}`, STATUS_FA[s.status] || s.status);
  const meta = el("div", "tp-meta");
  meta.append(
    el("div", "", `${s.stage} · ${s.words} کلمه`),
    el("div", "", `امتیاز منتقد ${s.score} از حد ${s.threshold}`),
    el("div", "", (s.created || "").replace("T", " ").slice(0, 16)),
  );
  if (s.experiment) meta.append(el("div", "", `آزمایش این داستان: ${s.experiment}`));
  page.append(ribbon, meta, el("div", "tp-hint", "متن را انتخاب کنید تا روی آن بخش نظر بدهید."));
  return { node: page, kind: "title", firstPara: 0 };
}

// Fill measured pages paragraph by paragraph; split a paragraph by words when it does not fit.
// The binary search measures plain text, so the highlight pass runs once per accepted chunk.
function paginate(blocks, kind) {
  const pages = [];
  const quotes = book.comments.filter((c) => c.quote);
  const m = ui.measure;
  let content = el("div", `page-content ${kind}`);
  let firstPara = null;
  m.replaceChildren(content);
  const flush = () => {
    if (content.childElementCount) pages.push({ node: content, kind, firstPara });
    content = el("div", `page-content ${kind}`);
    firstPara = null;
    m.replaceChildren(content);
  };
  const fits = () => m.scrollHeight <= m.clientHeight + 1;
  for (const b of blocks) {
    let words = b.text.split(" ");
    while (words.length) {
      if (!content.childElementCount) firstPara = b.index;
      const p = el(b.tag || "p", b.cls || "");
      p.textContent = words.join(" ");
      content.appendChild(p);
      if (fits()) { p.replaceChildren(marked(words.join(" "), quotes)); words = []; break; }
      content.removeChild(p);
      let lo = 0, hi = words.length;
      while (lo < hi) {
        const mid = Math.ceil((lo + hi) / 2);
        p.textContent = words.slice(0, mid).join(" ");
        content.appendChild(p);
        const ok = fits();
        content.removeChild(p);
        if (ok) lo = mid; else hi = mid - 1;
      }
      if (lo === 0) {
        if (content.childElementCount) { flush(); continue; }
        lo = 1;                       // one oversized word still needs a page of its own
      }
      const cut = words.slice(0, lo).join(" ");
      p.replaceChildren(marked(cut, quotes));
      p.classList.add("cont");
      content.appendChild(p);
      words = words.slice(lo);
      flush();
    }
  }
  if (content.childElementCount) pages.push({ node: content, kind, firstPara });
  return pages;
}

// Remember where the reader is by (kind, paragraph) rather than by page number, so adding a note or
// resizing keeps them in the same passage instead of throwing them back to the title page.
function anchorOf(page) {
  return page ? { kind: page.kind, firstPara: page.firstPara } : null;
}
function locate(anchor, per) {
  const pages = book.pages;
  if (!anchor) return 0;
  let i = -1;
  if (anchor.kind === "body") {
    i = pages.findIndex((p) => p.kind === "body" && p.firstPara >= anchor.firstPara);
    if (i < 0) i = lastPageOf("body");
  } else {
    i = pages.findIndex((p) => p.kind === anchor.kind && p.firstPara >= anchor.firstPara);
    if (i < 0) i = pages.findIndex((p) => p.kind === anchor.kind);
    if (i < 0) i = lastPageOf(anchor.kind === "report" ? "body" : anchor.kind);
  }
  if (i < 0) i = 0;
  i -= i % per;
  return Math.min(i, Math.max(0, pages.length - per));
}
function lastPageOf(kind) {
  for (let i = book.pages.length - 1; i >= 0; i--) if (book.pages[i].kind === kind) return i;
  return 0;
}

function repaginate() {
  if (book.turning) { book.repaginateLater = true; return; }
  const anchor = anchorOf(book.pages[book.index]);
  const per = spread();
  ui.bookEl.classList.toggle("single", per === 1);
  // size the measuring page exactly like a real page
  const r = ui.pageR.getBoundingClientRect();
  ui.measure.style.width = `${r.width}px`;
  ui.measure.style.height = `${r.height}px`;
  const text = storyParagraphs().map((t, i) => ({ text: t, index: i }));
  book.pages = [titlePage(), ...paginate(text, "body")];
  const report = checkLines();
  if (report.length) {
    const rp = paginate(report.map((t, i) => ({ text: t, index: i, cls: "report-line" })), "report");
    if (rp.length) rp[0].node.prepend(el("h2", "report-title", "گزارش منتقد"));
    book.pages.push(...rp);
  }
  if (per === 2 && book.pages.length % 2) {
    book.pages.push({ node: el("div", "page-content blank"), kind: "blank", firstPara: null });
  }
  book.index = locate(anchor, per);
  show();
  if (book.repaginateLater) { book.repaginateLater = false; repaginate(); }
}

function mountPage(host, page, folio) {
  host.replaceChildren();
  if (!page) return;
  host.appendChild(page.node.cloneNode(true));
  host.appendChild(el("div", "folio", String(folio)));
}

function show() {
  const per = spread();
  mountPage(ui.pageR, book.pages[book.index], book.index + 1);
  mountPage(ui.pageL, per === 2 ? book.pages[book.index + 1] : null, book.index + 2);
  ui.pageL.hidden = per === 1;
  bindMarks(ui.bookEl);
  ui.prev.disabled = book.index === 0;
  ui.next.disabled = book.index + per >= book.pages.length;
  const last = Math.min(book.pages.length, book.index + per);
  ui.counter.textContent = `صفحه‌ی ${book.index + 1}${per === 2 && last > book.index + 1 ? `–${last}` : ""} از ${book.pages.length}`;
}

// ---------- turning ----------
function endTurn() {
  if (book?.turning) {
    const { leaf, anim } = book.turning;
    try { anim.cancel(); } catch { /* already finished */ }
    leaf.remove();
    book.turning = null;
  }
}

function turn(dir) {
  if (!book || book.turning) return;
  const per = spread();
  const target = book.index + dir * per;
  if (target < 0 || target >= book.pages.length) return;
  ui.selBtn.hidden = true; ui.pop.hidden = true;

  if (per === 1 || reducedMotion()) { book.index = target; show(); return; }

  const pages = book.pages;
  const forward = dir > 0;
  // forward: the left leaf (pages[i+1]) swings right and its back becomes the new right page (pages[t]).
  // back:    the right leaf (pages[i]) swings left and its back becomes the new left page (pages[t+1]).
  const faceA = forward ? pages[book.index + 1] : pages[book.index];
  const faceB = forward ? pages[target] : pages[target + 1];
  if (!faceA || !faceB) { book.index = target; show(); return; }

  const leaf = el("div", `leaf ${forward ? "from-left" : "from-right"}`);
  const a = el("div", "leaf-face");
  const b = el("div", "leaf-face back");
  a.appendChild(faceA.node.cloneNode(true));
  a.appendChild(el("div", "folio", String(forward ? book.index + 2 : book.index + 1)));
  b.appendChild(faceB.node.cloneNode(true));
  b.appendChild(el("div", "folio", String(forward ? target + 1 : target + 2)));
  leaf.append(a, b);
  ui.bookEl.appendChild(leaf);
  bindMarks(leaf);

  // the page hidden under the lifting leaf appears as soon as the leaf is off it
  if (forward) mountPage(ui.pageL, pages[target + 1] || null, target + 2);
  else mountPage(ui.pageR, pages[target] || null, target + 1);

  const anim = leaf.animate(
    [{ transform: "rotateY(0deg)" }, { transform: `rotateY(${forward ? 180 : -180}deg)` }],
    { duration: flipMs, easing: "cubic-bezier(0.42, 0.02, 0.4, 1)" },
  );
  book.turning = { leaf, anim };
  const done = () => {
    if (!book || !book.turning) return;
    book.index = target;
    endTurn();
    show();
    if (book.repaginateLater) { book.repaginateLater = false; repaginate(); }
  };
  anim.finished.then(done, done);
}

// ---------- notes ----------
let pendingQuote = "";
function onSelect() {
  const sel = window.getSelection();
  const text = sel ? normalize(sel.toString()) : "";
  if (!sel || sel.rangeCount === 0 || text.length < 3 || !ui.bookEl.contains(sel.anchorNode)) { ui.selBtn.hidden = true; return false; }
  pendingQuote = text.slice(0, 300);
  const rect = sel.getRangeAt(0).getBoundingClientRect();
  ui.selBtn.hidden = false;
  ui.selBtn.style.top = `${Math.max(8, rect.top - 44)}px`;
  ui.selBtn.style.left = `${Math.min(window.innerWidth - 170, Math.max(8, rect.left + rect.width / 2 - 80))}px`;
  return true;
}
function edgeTurn(e) {
  if (e.button !== 0 || book?.turning) return;
  if (e.target.closest("mark, button, a, input, textarea")) return;
  const r = ui.bookEl.getBoundingClientRect();
  const x = e.clientX - r.left;
  if (x < r.width * 0.2) turn(1);            // RTL: the outer left edge advances
  else if (x > r.width * 0.8) turn(-1);
}
function openNoteForm(quote) {
  const q = typeof quote === "string" ? quote : pendingQuote;
  ui.selBtn.hidden = true;
  ui.pop.hidden = false;
  ui.popQuote.textContent = q ? `«${q}»` : "نظر کلی درباره‌ی این داستان";
  ui.pop.dataset.quote = q || "";
  ui.popStatus.textContent = "";
  ui.popText.value = "";
  ui.popText.focus();
}
async function sendNote(e) {
  e.preventDefault();
  const r = await fetch(`/api/stories/${encodeURIComponent(book.story.id)}/comments`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: ui.popName.value, text: ui.popText.value, quote: ui.pop.dataset.quote }),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) { ui.popStatus.textContent = r.status === 429 ? "کمی صبر کنید" : (data.error || "ثبت نشد"); return; }
  book.comments.push(data);
  ui.pop.hidden = true;
  window.getSelection()?.removeAllRanges();
  renderMargin();
  repaginate();
  ui.margin.hidden = false;
  focusNote(data.id);
}
function renderMargin() {
  const m = ui.margin;
  m.replaceChildren();
  const head = el("div", "margin-head");
  head.append(el("h3", "", `حاشیه‌ها (${book.comments.length})`));
  const general = el("button", "", "نظر کلی");
  general.addEventListener("click", () => openNoteForm(""));
  head.append(general);
  m.append(head);
  if (!book.comments.length) m.append(el("p", "time", "هنوز کسی چیزی ننوشته. بخشی از متن را انتخاب کنید یا نظر کلی بدهید."));
  for (const c of [...book.comments].reverse()) {
    const card = el("div", "note-card");
    card.dataset.cid = c.id;
    if (c.state === "suspect") card.classList.add("suspect");
    if (c.quote) card.append(el("blockquote", "note-quote", `«${c.quote}»`));
    card.append(el("div", "", c.text), el("div", "time", `${c.name} · ${(c.time || "").replace("T", " ").slice(0, 16)}`));
    card.append(noteState(c));
    if (c.quote) card.addEventListener("click", () => goToQuote(c.quote));
    m.append(card);
  }
  ui.marginBtn.textContent = `حاشیه‌ها (${book.comments.length})`;
}
// One note's check line: the derived state, what the check rested on, and (for the owner) the two verbs.
function noteState(c) {
  const row = el("div", "note-state");
  const chk = c.check || {};
  const badge = el("span", `state state-${c.state || "unchecked"}`, MARGIN_STATE_FA[c.state] || MARGIN_STATE_FA.unchecked);
  row.append(badge);
  if (chk.why) row.append(el("span", "state-why", chk.why));
  if (chk.via) row.append(el("span", "state-via", chk.via === "model" ? "سنجیده با ماشین نوشتن" : "سنجشِ مکانیکی (آفلاین)"));
  if (chk.evidence) row.append(el("span", "state-ev", chk.evidence));
  if (ownerToken()) {
    const actions = el("div", "note-actions");
    const check = el("button", "", "بسنج");
    check.title = "گذاره را دوباره در متنِ امروزِ نوشته پیدا کنید و حرفِ این حاشیه را با آن بسنجید";
    check.addEventListener("click", (e) => { e.stopPropagation(); checkNote(c.id, check); });
    const wipe = el("button", "", "پاکش کنم");
    wipe.addEventListener("click", (e) => {
      e.stopPropagation();
      if (!wipe.dataset.armed) { wipe.dataset.armed = "1"; wipe.textContent = "قطعی؟"; return; }
      removeNote(c.id, wipe);
    });
    actions.append(check, wipe);
    row.append(actions);
  }
  return row;
}
async function checkNote(cid, btn) {
  btn.disabled = true; btn.textContent = "…";
  try {
    const res = await ownerPost("/api/margins/check", { id: cid });
    const c = book.comments.find((x) => x.id === cid);
    if (c) { c.state = res.state; c.check = res.check; c.suspect = res.state === "suspect"; }
    renderMargin();
  } catch (err) {
    btn.disabled = false; btn.textContent = "بسنج";
    btn.closest(".note-actions")?.append(el("span", "time", String(err.message || err)));
  }
}
async function removeNote(cid, btn) {
  btn.disabled = true;
  try {
    await ownerPost("/api/margins/remove", { id: cid, by: "مالک", reason: "حاشیه‌ای که دیگر نباید خوانده شود" });
    book.comments = book.comments.filter((c) => c.id !== cid);
    renderMargin();
    repaginate();          // the note's highlight must leave the page too
  } catch (err) {
    btn.disabled = false; btn.textContent = "پاکش کنم";
    btn.closest(".note-actions")?.append(el("span", "time", String(err.message || err)));
  }
}
function focusNote(cid) {
  ui.margin.querySelectorAll(".note-card").forEach((c) => c.classList.toggle("focus", c.dataset.cid === cid));
  ui.margin.querySelector(`.note-card[data-cid="${CSS.escape(cid)}"]`)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
}
function goToQuote(q) {
  const needle = normalize(q);
  const head = needle.slice(0, 24);
  let i = book.pages.findIndex((p) => (p.kind === "body" || p.kind === "report") && normalize(p.node.textContent).includes(needle));
  // a quote that straddles a page break only shows its first words on the page it started in
  if (i < 0) i = book.pages.findIndex((p) => (p.kind === "body" || p.kind === "report") && normalize(p.node.textContent).includes(head));
  if (i < 0) return;
  const per = spread();
  book.index = Math.min(i - (i % per), Math.max(0, book.pages.length - per));
  show();
}
