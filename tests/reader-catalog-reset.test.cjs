"use strict";
/* RDR-035: exercise the actual catalog search, filtering, sort and reset
 * functions from web/read.js without fetching private stories or booting the 3D world.
 * Run: node --test tests/reader-catalog-reset.test.cjs
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const source = fs.readFileSync(path.join(__dirname, "../web/read.js"), "utf8");
const capture = (pattern, label) => {
  const hit = source.match(pattern);
  assert.ok(hit, "Missing production implementation: " + label);
  return hit[0];
};
const script = [
  capture(/^const searchKey\s*=\s*value\s*=>[^\n]+;/m, "Persian search normalizer"),
  capture(/^function renderShelf\(\)\s*\{[\s\S]*?^\}/m, "shelf renderer"),
  capture(/^function resetShelfFilters\(\)\s*\{[\s\S]*?^\}/m, "reset action"),
  capture(/^\$\("story-reset"\)\.addEventListener\("click",resetShelfFilters\);/m, "reset click binding"),
  capture(/\$\("story-search"\)\.addEventListener\("keydown",event=>\{[\s\S]*?^\}\);/m, "Escape binding"),
  "return { searchKey, renderShelf, resetShelfFilters };",
].join("\n");
const library = [
  { id: "1", title: "علی و کتاب", stage: "رمان", status: "accepted", score: 7, created: "2026-01-01" },
  { id: "2", title: "دشت بارانی", stage: "داستان", status: "accepted", score: 9, created: "2026-04-01" },
  { id: "3", title: "کوهستان", stage: "داستان", status: "rejected", score: 2, created: "2026-02-01" },
];
function fixture() {
  const nodes = {
    "story-search": { value: "", focused: false, handlers: {}, focus() { this.focused = true; }, addEventListener(name, fn) { this.handlers[name] = fn; } },
    "story-status": { value: "all" },
    "story-sort": { value: "newest" },
    "reading-filter": { value: "all" },
    "story-reset": { hidden: true, handlers: {}, addEventListener(name, fn) { this.handlers[name] = fn; } },
    "shelf-count": { textContent: "" },
    covers: { children: [], replaceChildren(...cards) { this.children = cards; }, append(card) { this.children.push(card); } },
  };
  const deps = {
    stories: library,
    favoritesOnly: false,
    readingFilter: "all",
    isFavorite: () => false,
    updateFavoritesBadge: () => {},
    updateLibraryControls: () => {},
    savedProgress: () => 0,
    $: id => nodes[id],
    nfa: number => new Intl.NumberFormat("fa-IR").format(number),
    makeCover: story => ({ id: story.id, title: story.title }),
    make: (tag, cls, value) => ({ tag, cls, textContent: value }),
  };
  const reader = new Function(...Object.keys(deps), script)(...Object.values(deps));
  return { reader, nodes };
}

test("unfiltered shelf displays all stories and hides reset action", () => {
  const { reader, nodes } = fixture();
  reader.renderShelf();
  assert.equal(nodes.covers.children.length, 3);
  assert.equal(nodes["story-reset"].hidden, true);
  assert.match(nodes["shelf-count"].textContent, /۳ اثر از ۳/);
});

test("Arabic yeh and vowel marks match Persian titles", () => {
  const { reader, nodes } = fixture();
  nodes["story-search"].value = "عَلِي";
  reader.renderShelf();
  assert.deepEqual(nodes.covers.children.map(book => book.id), ["1"]);
});

test("Arabic kaf, tatweel and vowels normalize without changing book title", () => {
  const { reader, nodes } = fixture();
  nodes["story-search"].value = "كـِتاب";
  reader.renderShelf();
  assert.deepEqual(nodes.covers.children.map(book => book.id), ["1"]);
  assert.equal(library[0].title, "علی و کتاب");
});

test("status filter is respected and reset becomes discoverable", () => {
  const { reader, nodes } = fixture();
  nodes["story-status"].value = "accepted";
  reader.renderShelf();
  assert.equal(nodes.covers.children.length, 2);
  assert.equal(nodes["story-reset"].hidden, false);
});

test("score sorting is descending and deterministic for distinct scores", () => {
  const { reader, nodes } = fixture();
  nodes["story-sort"].value = "score";
  reader.renderShelf();
  assert.deepEqual(nodes.covers.children.map(book => book.id), ["2", "1", "3"]);
});

test("empty result keeps a visible recovery action", () => {
  const { reader, nodes } = fixture();
  nodes["story-search"].value = "ناموجود";
  reader.renderShelf();
  assert.equal(nodes.covers.children.length, 1);
  assert.equal(nodes.covers.children[0].cls, "reading-empty");
  assert.equal(nodes["story-reset"].hidden, false);
});

test("click resets query, publication filter and sort, then restores focus", () => {
  const { reader, nodes } = fixture();
  nodes["story-search"].value = "ناموجود";
  nodes["story-status"].value = "accepted";
  nodes["story-sort"].value = "score";
  reader.renderShelf();
  nodes["story-reset"].handlers.click();
  assert.equal(nodes["story-search"].value, "");
  assert.equal(nodes["story-status"].value, "all");
  assert.equal(nodes["story-sort"].value, "newest");
  assert.equal(nodes["story-search"].focused, true);
  assert.equal(nodes["story-reset"].hidden, true);
  assert.equal(nodes.covers.children.length, 3);
});

test("Escape from search resets without reloading the document", () => {
  const { reader, nodes } = fixture();
  nodes["story-search"].value = "ناموجود";
  reader.renderShelf();
  let prevented = false;
  nodes["story-search"].handlers.keydown({ key: "Escape", preventDefault() { prevented = true; } });
  assert.equal(prevented, true);
  assert.equal(nodes["story-search"].value, "");
  assert.equal(nodes.covers.children.length, 3);
});

test("catalog HTML retains named search region and labeled reset button", () => {
  const privateHtml = path.join(__dirname, "../web/read.html");
  const publicHtml = path.join(__dirname, "../read/index.html");
  const html = fs.readFileSync(fs.existsSync(privateHtml) ? privateHtml : publicHtml, "utf8");
  assert.match(html, /lang="fa"\s+dir="rtl"/);
  assert.match(html, /role="search"\s+aria-label="[^"]+"/);
  assert.match(html, /<button[^>]*id="story-reset"[^>]*type="button"[^>]*hidden>/);
  assert.match(html, /id="story-search"/);
  assert.match(html, /id="story-sort"/);
  assert.match(html, /id="story-status"/);
});

test("public protected assets retain catalog behavior and semantic HTML", () => {
  const pinnedJS = path.join(__dirname, "../.github/reader-assets/read.js");
  const pinnedHTML = path.join(__dirname, "../.github/reader-assets/read.html");
  if (!fs.existsSync(pinnedJS)) return; // private source does not have public deployment assets
  const pinned = fs.readFileSync(pinnedJS, "utf8");
  const html = fs.readFileSync(pinnedHTML, "utf8");
  const expression = /^const searchKey\s*=\s*value\s*=>[^\n]+;/m;
  assert.equal(pinned.match(expression)?.[0], source.match(expression)?.[0], "deployed Persian search must match source");
  // Prevent the protected Pages replacement from silently diverging from tested catalog behavior.
  for (const name of ["renderShelf", "resetShelfFilters"]) {
    const pattern = new RegExp("^function " + name + "\\(\\)\\s*\\{[\\s\\S]*?^\\}", "m");
    assert.equal(pinned.match(pattern)?.[0], source.match(pattern)?.[0], "protected " + name + " differs from public source");
  }
  for (const symbol of ["function renderShelf()", "function resetShelfFilters()", "story-reset", "const query=searchKey("]) {
    assert.ok(pinned.includes(symbol), "missing from public pinned reader: " + symbol);
  }
  assert.match(html, /role="search"\s+aria-label="[^"]+"/);
  assert.match(html, /id="story-reset"/);
  assert.match(html, /read\.js\?v=reader-20261109-library-v2/);
});

test("catalog entry points share the protected script cache version and reset controls", () => {
  const privateEntry = path.join(__dirname, "../web/read.html");
  const publicEntry = path.join(__dirname, "../read/index.html");
  const protectedEntry = path.join(__dirname, "../.github/reader-assets/read.html");
  const entry = fs.existsSync(publicEntry) ? publicEntry : privateEntry;
  const html = fs.readFileSync(entry, "utf8");
  const extractVersion = value => {
    const match = value.match(/src="[^"]*read[.]js[?]v=([^"&]+)"/);
    assert.ok(match, "missing versioned catalog script");
    return match[1];
  };
  const version = extractVersion(html);
  assert.match(html, /id="story-reset"/, "entry point must expose reset");
  if (fs.existsSync(protectedEntry)) {
    const pinnedHtml = fs.readFileSync(protectedEntry, "utf8");
    assert.equal(version, extractVersion(pinnedHtml), "root and protected catalog versions diverge");
    assert.match(pinnedHtml, /id="story-reset"/);
  }
});

test("RDR-041: public and protected catalog entry points preserve one named search landmark and unique controls", () => {
  const entries = ["../read/index.html", "../.github/reader-assets/read.html"]
    .map(relative => path.join(__dirname, relative)).filter(fs.existsSync);
  if (!entries.length) return; // private repository may not include public entry points
  for (const entry of entries) {
    const html = fs.readFileSync(entry, "utf8");
    const regions = html.match(/role="search"\s+aria-label="[^"]+"/g) || [];
    assert.equal(regions.length, 1, entry + ": expected exactly one named search region");
    for (const id of ["story-search", "story-status", "story-sort", "story-reset"]) {
      const occurrences = html.match(new RegExp('id="' + id + '"', "g")) || [];
      assert.equal(occurrences.length, 1, entry + ": " + id + " must be unique");
    }
    const regionStart = html.indexOf('role="search"');
    const regionEnd = html.indexOf('</div>', html.indexOf('id="story-reset"'));
    assert.ok(regionStart >= 0 && regionEnd > regionStart, entry + ": missing search toolbar boundary");
    for (const id of ["story-search", "story-status", "story-sort", "story-reset"]) {
      const position = html.indexOf('id="' + id + '"');
      assert.ok(position > regionStart && position < regionEnd, entry + ": " + id + " outside search region");
    }
  }
});

test("RDR-048: deployed protected search normalizer executes Persian/Arabic equivalence fixtures", () => {
  const pinnedPath = path.join(__dirname, "../.github/reader-assets/read.js");
  if (!fs.existsSync(pinnedPath)) return; // private repo has no protected public assets
  const pinned = fs.readFileSync(pinnedPath, "utf8");
  const expression = /^const searchKey\s*=\s*value\s*=>[^\n]+;/m;
  const implementation = pinned.match(expression)?.[0];
  assert.ok(implementation, "protected catalog must expose searchKey");
  const normalize = new Function(implementation + "\nreturn searchKey;")();
  for (const [query, title] of [
    ["عَلِي", "علی"], ["كـِتاب", "کتاب"], ["ﻛﺘﺎﺏ", "کتاب"], ["TEST", "test"]
  ]) assert.equal(normalize(query), normalize(title), query + " must match " + title);
});
