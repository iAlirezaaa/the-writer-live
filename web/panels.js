/* The four tabs that the new self-knowledge needs: who it is, what it asks for, who prints it,
   and how it keeps itself alive. All text goes through textContent. */

let H = null;                     // { $, getJSON, item, post, token }
const FA = { accepted: "پذیرفته", rejected: "رد شده" };

function rows(list, empty) {
  const ul = document.createElement("ul");
  ul.className = "list";
  if (!list.length) { const li = H.item(empty || "چیزی نیست."); ul.appendChild(li); return ul; }
  for (const r of list) ul.appendChild(typeof r === "string" ? H.item(r) : H.item(r[0], r[1]));
  return ul;
}
function heading(text) { const h = document.createElement("h3"); h.textContent = text; return h; }
function para(text, cls) { const p = document.createElement("p"); p.className = cls || "small"; p.textContent = text; return p; }
function meter(label, v) {
  const row = document.createElement("div"); row.className = "skill-row";
  const name = document.createElement("span"); name.textContent = label;
  const val = document.createElement("span"); val.textContent = `${Math.round((v || 0) * 100)}`;
  row.append(name, val);
  const bar = document.createElement("div"); bar.className = "bar";
  const fill = document.createElement("span"); fill.style.width = `${Math.round((v || 0) * 100)}%`;
  bar.appendChild(fill);
  const box = document.createElement("div"); box.append(row, bar);
  return box;
}
async function section(id, url, build) {
  const host = H.$(id);
  if (!host) return null;
  let data = null;
  try { data = await H.getJSON(url); } catch (e) { host.replaceChildren(para("این بخش باز نشد.")); return null; }
  host.replaceChildren();
  for (const n of build(data) || []) if (n) host.append(n);
  return data;
}

// ---------- tab: who it is ----------
async function loadSelf() {
  await section("growth-box", "/api/skillbook", (d) => {
    const st=d.stats||{}, week=(d.progress||{}).overall||{};
    const rowsByLevel=(d.skills||[]).filter(s=>!s.made_up).slice().sort((a,b)=>(a.level||0)-(b.level||0));
    const focus=rowsByLevel.find(s=>s.goal&&s.goal!=="مهارت به بالاترین سطح رسیده.")||rowsByLevel[0];
    const out=[heading("مسیر رشد نویسنده"),para(d.summary||"رشد از نوشته‌ها، تجربه‌ها و شواهد خود نویسنده سنجیده می‌شود.")];
    out.push(rows([["شواهد تازه در هفت روز",`${week.fresh_evidence_7??0} · ارتقاهای سطح ${week.level_ups_7??0}`],["دفتر مهارت‌ها",`${st.skills??0} مهارت · ${st.links??0} پیوند · ${st.evidence_refs??0} شاهد`],["سنجش و پیشرفت",`${st.attempts??0} بار سنجش · ${st.level_ups??0} ارتقای مستند`]],""));
    if(focus){
      out.push(heading("گام نزدیک برای تمرین"));
      out.push(rows([[focus.label_fa||focus.id,focus.goal||focus.next||"برای این مهارت گام تازه‌ای تعریف نشده است."]],""));
      const refs=(focus.evidence||[]).slice(-3);
      if(refs.length)out.push(para(`شاهدهای ثبت‌شده: ${refs.join(" · ")}`));
    }
    const links=document.createElement("div");links.className="growth-links";
    for(const [label,panel] of [["پرسش و تأمل","p-inner"],["مهارت‌ها و گراف","p-graph"],["دستاوردها","p-publish"]]){
      const btn=document.createElement("button");btn.type="button";btn.textContent=label;
      btn.addEventListener("click",()=>H.selectTab?.(panel));links.append(btn);
    }
    out.push(links);
    return out;
  });
  await section("learning-progress-box", "/api/learning", (d) => {
    const stats=d.stats||{}, active=(d.skills||[]).filter(s=>s.status!=="adopted");
    const out=[heading("یادگیری بیرون از نویسندگی"),para(`${stats.sessions_total??0} جلسه تا امروز · ${active.length} مهارت در حال تمرین`),
      rows(active.slice(0,4).map(s=>[`${s.label_fa||s.key} · ${s.pct??0}٪`,s.next||"گام تمرینی تازه‌ای ثبت نشده."]),"مهارت جانبی فعالی در دفتر یادگیری نیست.")];
    return out;
  });
  const p = await section("persona-box", "/api/persona", (d) => {
    const t = d.traits || {};
    const out = [para("شخصیت ثاب نیست؛ با هر داستان و هر رد شدن جابه‌جا می‌شود و همان جابه‌جایی روی متن اثر می‌گذارد.")];
    for (const [k, v] of Object.entries(t)) {
      if (typeof v === "number") out.push(meter(k, v));
      else out.push(H.item(String(k), String(v)));
    }
    out.push(heading("تغییرهای اخیر"), rows((d.shifts || []).slice(0, 8).map((s) => [s.note || JSON.stringify(s).slice(0, 80), s.time ? String(s.time).slice(0, 16) : ""])));
    return out;
  });
  await section("core-box", "/api/core", (d) => {
    const vs = (d.versions || []).slice().reverse();
    if (!d.text && !vs.length) return [para("هسته‌ی شخصیت هنوز نوشته نشده؛ با پیشرفت خودش نوشته می‌شود.")];
    const out = [];
    if (d.text) {
      const pre = document.createElement("p"); pre.className = "core-text"; pre.textContent = d.text;
      out.push(heading("آنچه امروز درباره‌ی خودم نوشته‌ام"), pre);
    }
    out.push(heading("نسخه‌هایی که مانده"));
    out.push(rows(vs.slice(0, 4).map((v) => [`برگه‌ی ${v.n} · ${v.trigger || ""}`, `${v.summary || ""} · ${String(v.at || "").slice(0, 16)}`])));
    out.push(para(`نسخه‌ها: ${(d.stats || {}).versions ?? vs.length}`));
    return out;
  });
  await section("mind-box", "/api/mind", (d) => {
    const L = d.layers || {};
    return [para("ذهن، دانش و آثار یکی نیستند؛ هر سه یکدیگر را هل می‌دهند."),
      H.item(`ذهن — ${(L.mind || {}).count ?? 0}`, ((L.mind || {}).items || []).slice(0, 3).join(" · ")),
      H.item(`دانش — ${(L.knowledge || {}).count ?? 0}`, ((L.knowledge || {}).items || []).slice(0, 3).join(" · ")),
      H.item(`آثار — ${(L.works || {}).accepted ?? 0} پذیرفته`, `${(L.works || {}).count ?? 0} نوشته`),
      heading("تناقض‌هایی که خودش دیده"),
      rows((d.contradictions || []).slice(0, 6).map((c) => [c.what, c.pair]), "هیچ تناقضی ثبت نشده.")];
  });
  return p;
}

// ---------- tab: questions, wishes, habits ----------
async function loadInner() {
  await section("questions-box", "/api/questions", (d) => {
    const all = Array.isArray(d) ? d : [];
    return [
      para("از همه چیز می‌پرسد، از معنی ادامه دادن هم."),
      rows(all.filter((q) => q.status === "open").slice(0, 12).map((q) => [q.text, `${q.label || q.kind || ""}`]), "سوال باز نیست."),
      heading("پاسخ‌هایی که فعلاً نگه داشته"),
      rows(all.filter((q) => q.status !== "open").slice(0, 6).map((q) => [q.text, `${q.label || q.status || ""}${q.answer ? " · " + q.answer : ""}`]), ""),
    ];
  });
  await section("wishes-box", "/api/wishes", (d) => [
    rows((d.wishes || []).slice(0, 10).map((w) => [w.what, `${w.kind} · ${w.status}`]), "چیزی کم ندارد."),
    heading("باورهایی که در حال شکل گرفتن است"),
    rows((d.beliefs || []).slice(0, 6).map((b) => [b.text, `${b.status} · اطمینان ${Math.round((b.confidence || 0) * 100)}٪`]), "هنوز باوری نساخته."),
    heading("درخواست‌هایی که نوشته"),
    rows((d.requests || []).slice(0, 6).map((r) => [r.what, `نقصش: ${r.lack || "—"}`]), "درخواست باز نیست."),
  ]);
  await section("habits-box", "/api/habits", (d) => {
    const c = d.current || {};
    const out = [para("عادت‌های خودش، و آنچه روی خودش آزمایش می‌کند.")];
    for (const k of ["sleep", "wake", "writing_time", "session_minutes", "nap_minutes", "length", "pov", "tense", "ritual", "music", "revision_rounds"]) {
      const v = c[k];
      if (v == null) continue;
      const val = typeof v === "object" ? (v.value ?? JSON.stringify(v)) : v;
      const src = typeof v === "object" ? ` · منبع: ${v.source === "self" ? "خودش" : v.source === "owner" ? "شما" : "تنظیمات"}` : "";
      out.push(H.item(`${k}: ${val}${src}`));
    }
    out.push(heading("آزمایش‌های جاری"), rows((d.ladder || d.trials || []).slice(0, 6).map((t) => [`${t.key}: ${t.from} → ${t.to}`, `${t.status} · ${Array.isArray(t.samples) ? t.samples.length : (t.samples ?? 0)} نمونه`]), "آزمایشی در کار نیست."));
    return out;
  });
  await section("learning-box", "/api/learning", (d) => [
    rows((d.skills || []).map((s) => [`${s.label_fa || s.key}`, `${s.pct ?? "—"}٪ · ${s.sessions ?? 0} نشست${s.domain ? " · " + s.domain : ""}`]), "مهارت تازه‌ای یاد نگرفته."),
    para("اگر مهارتی جز نوشتن یاد بگیرد، گراف جدا برای آن باز می‌شود."),
  ]);
}

// ---------- tab: publishing, brand, readers ----------
async function loadPublish() {
  const pub = await section("publisher-box", "/api/publisher", (d) => {
    const rel = d.relationship || {};
    const out = [H.item(`${d.persona?.name || "ناشناس"} — ${d.persona?.house || ""}`, "دفترِ ناشر بیرون از اتاقِ نویسنده است؛ منتقد تنها نمره می‌دهد، ناشر تصمیم می‌گیرد چاپ شود یا نه.")];
    for (const k of ["trust", "curiosity", "fatigue"]) if (rel[k] != null) out.push(meter(k === "trust" ? "اعتماد" : k === "curiosity" ? "کنجکاوی" : "خستگی", typeof rel[k] === "number" ? rel[k] : rel[k].value));
    out.push(para(rel.reading || rel.note || ""));
    const std = d.publisher_standard || {};
    if (std.score_floor != null)
      out.push(heading("معیار سخت‌گیرانهٔ ناشر"),
        rows([["سطح سخت‌گیری", String(std.tier)],
              ["کف امتیاز ادبی", `${std.score_floor} از ۱۰۰`],
              ["آستانهٔ تصمیم ناشر", String(std.signal_bar)],
              ["آثار پذیرفته‌شده", String(std.publications)]]));
    if ((d.rewards || []).length)
      out.push(heading("دستاوردهای تأیید ناشر"),
        rows(d.rewards.slice(0, 8).map((r) =>
          [`اثر شمارهٔ ${r.publication_number}`, "دستاورد باز شده · پرداخت واقعی غیرفعال"])));
    out.push(heading("گفت‌وگوهای اخیر"), rows((d.meetings || []).slice(0, 5).map((m) => [m.topic || m.outcome || "گفت‌وگو", `${m.line_count ?? (m.lines || []).length} حرف · ${String(m.started || "").slice(0, 16)}`])));
    out.push(heading("آنچه برای چاپ پذیرفته"), rows((d.catalog || []).map((c) => [c.title || c.story_id, `تیراژ ${c.print_run ?? "—"} · ${c.decision || ""}`]), "هنوز چیزی را برای چاپ نپذیرفته."));
    out.push(heading("خواسته‌هایش از نویسنده"), rows((d.agenda || []).map((a) => [a.request || a.what, a.due || a.why || ""])));
    const btn = document.createElement("button");
    btn.type = "button"; btn.textContent = "بیرون برود و پیش ناشر حرف بزند";
    btn.addEventListener("click", async () => {
      btn.disabled = true;
      const r = await H.post("/api/publisher/visit", {});
      H.toast(r.ok ? `ناشر: ${(r.d.line || r.d.error || "").slice(0, 180)}` : "هنوز به میز ناشر نرسیده‌ام؛ نامه‌ی صاحب انتشارات لازم است.");
      btn.disabled = false; loadPublish();
    });
    out.push(btn);
    return out;
  });
  await section("critic-box", "/api/critic/rules", (d) => [
    para("منتقد هم خودش را ارتقا می‌دهد؛ با شاهد، نه با سلیقه‌ی لحظه‌ای."),
    H.item("نسخه‌ی قواعد", String(d.version ?? "—")),
    H.item("حد نمره", String(d.threshold ?? "—")),
    heading("سنگینی هر گیت"),
    rows(Object.entries(d.weights || {}).map(([k, v]) => [k, String(v)])),
    heading("تاریخچه‌ی ارتقا"),
    rows((d.history || []).slice(0, 6).map((h) => [`نسخه‌ی ${h.version}`, `${h.why || ""} · ${String(h.when || "").slice(0, 16)}`]), "قواعد هنوز دست نخورده است."),
  ]);
  await section("brand-box", "/api/brand", (d) => [
    H.item("نام", d.pen_name || "—"), H.item("خط‌شه", d.tagline || "—"), para(d.bio || ""),
    para(d.positioning || ""),
    heading("چه می‌خواهد"), rows(Object.entries(d.goals || {}).map(([k, v]) => [k, String(v)])),
    heading("قول‌هایی که به خواننده داده"), rows((d.promises || []).slice(0, 6).map((x) => [typeof x === "string" ? x : (x.text || ""), typeof x === "string" ? "" : String(x.time || "").slice(0, 16)]), "هنوز قولی ننوشته."),
  ]);
  await section("letters-box", "/api/letters", (d) => [
    rows((d.inbox || []).slice(0, 10).map((x) => [`${x.name}: ${x.text}`, `${x.story_title ? `روی «${x.story_title}»` : "عمومی"} · ${x.decision || "نخوانده"}${x.reply ? " · جواب داده شد" : ""}${x.state === "suspect" ? " · نقلِ موردِ تردید" : ""}`]), "نامه‌ای نرسیده."),
    para(`از ${(d.stats || {}).letters ?? 0} نامه، ${(d.stats || {}).read ?? 0} را خواندم و ${(d.stats || {}).answered ?? 0} را جواب دادم.`),
    para("جواب دادن یا ندادن تصمیم خودش است."),
  ]);
  let wd = null;
  try { wd = await H.getJSON("/api/wardrobe"); } catch { /* the menu can live without the wardrobe */ }
  await section("achievements-box", "/api/achievements", (d) => {
    const s = d.stats || {};
    const out = [para(`${s.done ?? 0} از ${s.total ?? 0} — فقط با شاهد باز می‌شود.`),
      rows((d.rows || []).slice(0, 40).map((r) => [`${r.done ? "✓ " : "· "}${r.label}`, `${r.goal} · ${r.have}/${r.target} ${r.unit || ""}`]))];
    if (wd) {
      out.push(heading("کمد لباس"));
      if (wd.locked) {
        out.push(para("درِ کمد بسته است؛ هادس هنوز اجازه ندارد ظاهرش را شخصی‌سازی کند. این تصمیمِ شماست، نه نتیجه‌ی یک عدد."));
        const btn = document.createElement("button");
        btn.type = "button"; btn.textContent = "باز کردن کمد لباس";
        btn.addEventListener("click", async () => {
          btn.disabled = true;
          const r = await H.post("/api/wardrobe/unlock", {});
          H.toast(r.ok ? "کمد لباس باز شد؛ کمدِ گوشه‌ی اتاق حالا کار می‌کند" : "باز نشد — نامه‌ی صاحب انتشارات لازم است.");
          btn.disabled = false; loadPublish();
        });
        out.push(btn);
      } else {
        out.push(para("کمد باز است؛ کمدِ گوشه‌ی اتاق را در صحنه کلیک کنید تا لباسش را عوض کنید."
          + (wd.unlocked_at ? ` · از ${String(wd.unlocked_at).slice(0, 16)}` : "")));
      }
    }
    return out;
  });
  await section("kinds-box", "/api/kinds", (d) => {
    const st = d.stats || {};
    const out = (d.shelves || []).map((s) => [`${s.label} — ${s.count ?? 0}`,
      `${s.accepted ?? 0} پذیرفته · ${(s.words ?? 0).toLocaleString("fa-IR")} واژه`
      + `${s.best_score != null ? ` · بهترین امتیاز ${s.best_score}` : ""}`
      + `${s.last ? ` · آخرین ${String(s.last).slice(0, 10)}` : ""}`]);
    return [para("نوشته‌هایش را خودش جدا می‌کند: ادبی، هنری، شعر، برای کودکان."),
      para(`${st.classified ?? 0} از ${st.total ?? 0} قفسه‌بندی شد${st.unclassified ? ` و ${st.unclassified} هنوز بی‌قفسه‌اند` : ""}.`),
      ...out];
  });
  return pub;
}

// ---------- tab: keeping itself alive ----------
async function loadCare() {
  await section("backups-box", "/api/backups", (d) => {
    const st = d.stats || {};
    const last = st.latest || {};
    return [para(`${st.count ?? 0} چک‌پوینت · آخرین: ${String(last.when || "—").slice(0, 16)}`
      + `${st.verify_ok === false ? " · آخرین خوانده نشد" : st.verify_ok ? " · سلامت" : ""}`),
      rows((d.index || []).slice(0, 12).map((c) => [`${c.label || "چک‌پوینت"} · ${c.id}`,
        `${String(c.when || "").slice(0, 16)} · ${Math.round((c.bytes || 0) / 1024)} کیلوبایت${c.reason ? ` · ${c.reason}` : ""}`])),
      st.last_error ? para("خطا: " + st.last_error, "warn small") : null];
  });
  await section("masterpiece-box", "/api/masterpiece", (d) => {
    const c = d.current || {};
    return [H.item("وضعیت", c.active ? "در جریان" : (c.declared ? "اعلام شده" : "چیزی در کار نیست")),
      H.item("عنوان", c.title || "—"),
      H.item("فصل‌ها", `${c.chapters_done ?? 0} از ${c.chapters_planned ?? 0}`),
      H.item("واژه‌ها", `${(c.words ?? 0).toLocaleString("fa-IR")} از ${(c.words_target ?? 0).toLocaleString("fa-IR")} · ${c.pct ?? 0}٪`),
      para(c.next || ""),
      c.avg_score != null ? para(`میانگین امتیاز فصل‌های پذیرفته: ${c.avg_score} — بهترین: ${c.best_chapter || "—"}، ضعیف‌ترین: ${c.worst_chapter || "—"}`) : null,
      heading("شاهکارهای گذشته"),
      rows((d.history || []).map((h) => [h.title || h.id, `${h.chapters ?? 0} فصل · امتیاز نهایی ${h.final_score ?? "—"}${h.declared ? " · اعلام شده" : ""}`]),
        "هنوز هیچ شاهکاری تمام نشده.")]
  });
  await section("cli-box", "/api/cli", (d) => {
    const out = [para("دسترسی خودش به خط فرمانِ رایانه‌ی میزش و به ابزارهای فقط‌خواندنی."),
      para(`${(d.available || {}).exists ? `از ${String((d.available || {}).model || "مدل").split("/").pop()} استفاده می‌کند` : "هنوز هیچ خط فرمانی در دسترسش نیست"}`
        + `${(d.available || {}).fake ? " — و این نسخه‌ی آزمایشی است، نه واقعی" : ""}.`),
      rows((d.tools || []).map((t) => [`${t.label_fa || t.name}`, `${(t.files || []).join("، ") || "بی‌فایل"} · ${t.effort || ""}`]))];
    const ask = document.createElement("textarea"); ask.rows = 2; ask.placeholder = "از رایانه‌اش چه بپرسد؟";
    const btn = document.createElement("button"); btn.type = "button"; btn.textContent = "بپرس";
    const res = document.createElement("p"); res.className = "small";
    btn.addEventListener("click", async () => {
      btn.disabled = true; res.textContent = "در حال پرسیدن…";
      const r = await H.post("/api/cli/ask", { prompt: ask.value });
      res.textContent = r.ok ? (r.d.text || r.d.output || "پاسخی نیامد") : "نامه‌ی صاحب انتشارات لازم است.";
      btn.disabled = false;
    });
    out.push(ask, btn, res);
    return out;
  });
  await section("room-box", "/api/room", (d) => {
    const out = [para("اتاق هیچ‌وقت تمام نمی‌شود؛ خودش پیشنهاد می‌دهد و شما امتیاز می‌دهید."),
      rows(Object.entries(d.overrides || {}).map(([k, v]) => [k, String(v)]), "هنوز تغییری اعمال نشده."),
      heading("پیشنهادها در نوبت")];
    for (const p of (d.queue || []).slice(0, 6)) {
      const li = H.item(`${p.lever}: ${p.value}`, p.why || "");
      const b1 = document.createElement("button"); b1.type = "button"; b1.textContent = "خوب است";
      const b2 = document.createElement("button"); b2.type = "button"; b2.textContent = "نه";
      b1.addEventListener("click", async () => { await H.post("/api/polish/rate", { key: p.key, score: 0.9 }); loadCare(); });
      b2.addEventListener("click", async () => { await H.post("/api/polish/rate", { key: p.key, score: 0.15 }); loadCare(); });
      li.append(b1, b2); out.push(li);
    }
    return out;
  });
  await section("weave-box", "/api/weave", (d) => [
    para("کار اصلی‌اش: ایده‌ها را به هم وصل کردن."),
    rows((d.items || []).slice(0, 10).map((l) => [`${(l.labels || []).join(" + ") || (l.inputs || []).join(" + ")}`,
      `${l.premise || ""}${l.why ? ` — ${l.why}` : ""}${l.score != null ? ` · امتیاز ${l.score}` : ""}${l.story_id ? " · نوشته شد" : ""}`]),
      "فعلاً چیزی به چیز دیگر وصل نشده."),
  ]);
}

export function initPanels(helpers) {
  H = helpers;
  return { loadSelf, loadInner, loadPublish, loadCare,
    async loadAll() { await Promise.allSettled([loadSelf(), loadInner(), loadPublish(), loadCare()]); } };
}
