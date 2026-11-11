"use strict";
/* RDR-035: exercise the actual catalog search, filtering, sort and reset
 * functions from web/read.js without fetching private stories or booting the 3D world.
 * Run: node --test tests/reader-catalog-reset.test.cjs
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { readerDeployment, projectReaderHTML, REVIEWED_READER_ASSETS } = require("./reader-deployment.cjs");
const deployment = readerDeployment(path.join(__dirname, ".."));

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
  const html = fs.readFileSync(deployment.htmlPath, "utf8");
  assert.match(html, /lang="fa"\s+dir="rtl"/);
  assert.match(html, /role="search"\s+aria-label="[^"]+"/);
  assert.match(html, /<button[^>]*id="story-reset"[^>]*type="button"[^>]*hidden>/);
  assert.match(html, /id="story-search"/);
  assert.match(html, /id="story-sort"/);
  assert.match(html, /id="story-status"/);
});

test("the active deployment retains catalog behavior and semantic HTML", () => {
  const deployed = fs.readFileSync(deployment.catalogPath, "utf8");
  const html = fs.readFileSync(deployment.htmlPath, "utf8");
  const expression = /^const searchKey\s*=\s*value\s*=>[^\n]+;/m;
  assert.equal(deployed.match(expression)?.[0], source.match(expression)?.[0], "deployed Persian search must match source");
  // Check active overrides when used; direct exports additionally verify manifest hashes.
  for (const name of ["renderShelf", "resetShelfFilters"]) {
    const pattern = new RegExp("^function " + name + "\\(\\)\\s*\\{[\\s\\S]*?^\\}", "m");
    assert.equal(deployed.match(pattern)?.[0], source.match(pattern)?.[0], "deployed " + name + " differs from tested source");
  }
  for (const symbol of ["function renderShelf()", "function resetShelfFilters()", "story-reset", "const query=searchKey("]) {
    assert.ok(deployed.includes(symbol), "missing from deployed reader: " + symbol);
  }
  assert.match(html, /role="search"\s+aria-label="[^"]+"/);
  assert.match(html, /id="story-reset"/);
  assert.match(html, /read\.js\?v=[^"&]+/);
});

test("active catalog entry points share the script cache version and reset controls", () => {
  const html = fs.readFileSync(deployment.htmlPath, "utf8");
  const extractVersion = value => {
    const match = value.match(/src="[^"]*read[.]js[?]v=([^"&]+)"/);
    assert.ok(match, "missing versioned catalog script");
    return match[1];
  };
  const version = extractVersion(html);
  assert.match(html, /id="story-reset"/, "entry point must expose reset");
  for (const entry of deployment.entryPaths) {
    const entryHtml = fs.readFileSync(entry, "utf8");
    assert.equal(version, extractVersion(entryHtml), "source and deployed catalog versions diverge");
    assert.match(entryHtml, /id="story-reset"/);
  }
});

test("RDR-041: active catalog entry points preserve one named search landmark and unique controls", () => {
  for (const entry of deployment.entryPaths) {
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

test("RDR-048: deployed search normalizer executes Persian/Arabic equivalence fixtures", () => {
  const deployed = fs.readFileSync(deployment.catalogPath, "utf8");
  const expression = /^const searchKey\s*=\s*value\s*=>[^\n]+;/m;
  const implementation = deployed.match(expression)?.[0];
  assert.ok(implementation, "deployed catalog must expose searchKey");
  const normalize = new Function(implementation + "\nreturn searchKey;")();
  for (const [query, title] of [
    ["عَلِي", "علی"], ["كـِتاب", "کتاب"], ["ﻛﺘﺎﺏ", "کتاب"], ["TEST", "test"]
  ]) assert.equal(normalize(query), normalize(title), query + " must match " + title);
});


test("RDR-059: source and deployed Persian search preserve distinct words", () => {
  const expression = /^const searchKey\s*=\s*value\s*=>[^\n]+;/m;
  const sourceImplementation = source.match(expression)?.[0];
  assert.ok(sourceImplementation, "missing source search normalizer");
  const deployedImplementation = fs.readFileSync(deployment.catalogPath, "utf8").match(expression)?.[0];
  assert.equal(deployedImplementation, sourceImplementation, "deployed normalizer differs");
  const implementations = [sourceImplementation, deployedImplementation];
  for (const implementation of implementations) {
    const normalize = new Function(implementation + "\nreturn searchKey;")();
    for (const [query, title] of [
      ["كتاب", "کتاب"], ["عَلِي", "علی"], ["ﻛﺘﺎﺏ", "کتاب"]
    ]) assert.equal(normalize(query), normalize(title));
    for (const [query, title] of [
      ["کتاب", "کباب"], ["علی", "عالی"], ["گل", "کل"], ["کتاب", "کتابخانه"]
    ]) assert.notEqual(normalize(query), normalize(title), query + " must remain distinct from " + title);
  }
});

function deploymentFixture(t) {
  const os = require("node:os"), { createHash } = require("node:crypto");
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "reader-deployment-contract-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const write = (relative, content) => {
    const file = path.join(root, relative);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content);
  };
  const html = '<html lang="fa" dir="rtl"><a href="/">Home</a><script src="/web/read.js?v=fixture"></script></html>';
  write(".github/workflows/pages.yml", "jobs:\n  deploy:\n    steps:\n      - run: |\n          cp -a index.html web read snapshot _site/\n");
  const hashes = {};
  for (const asset of REVIEWED_READER_ASSETS) {
    const content = asset.endsWith("read.html") ? html : "/* reviewed " + asset + " */\n";
    write(asset, content);
    hashes[asset] = createHash("sha256").update(content).digest("hex");
  }
  write("read/index.html", projectReaderHTML(html));
  const manifest = {
    private_source_repository: "iAlirezaaa/the-writer", private_source_commit: "a".repeat(40),
    reader_assets: hashes, reader_entrypoint: "read/index.html",
  };
  write(".github/live-sync-manifest.json", JSON.stringify(manifest));
  return { root, write, manifest };
}

test("direct Pages deployment validates reviewed assets while ignoring dormant legacy archives", t => {
  const f = deploymentFixture(t);
  for (const name of ["read.js", "book.js", "read.html"]) f.write(".github/reader-assets/" + name, "obsolete archive");
  const active = readerDeployment(f.root, { repository: "iAlirezaaa/the-writer-live" });
  assert.equal(active.mode, "direct");
  assert.equal(active.catalogPath, path.join(f.root, "web/read.js"));
  assert.equal(active.htmlPath, path.join(f.root, "read/index.html"));
});

test("direct Pages deployment rejects changed assets and an incomplete review manifest", t => {
  const f = deploymentFixture(t), file = path.join(f.root, "web/read.js");
  const original = fs.readFileSync(file);
  fs.appendFileSync(file, "changed after review");
  assert.throws(() => readerDeployment(f.root), /reviewed reader asset hash mismatch: web\/read.js/);
  fs.writeFileSync(file, original);
  delete f.manifest.reader_assets["web/library-stage.js"];
  f.write(".github/live-sync-manifest.json", JSON.stringify(f.manifest));
  assert.throws(() => readerDeployment(f.root), /missing reviewed reader asset hash: web\/library-stage.js/);
});

test("direct Pages deployment rejects stale or incorrectly rewritten reader HTML", t => {
  const f = deploymentFixture(t);
  f.write("read/index.html", fs.readFileSync(path.join(f.root, "web/read.html")));
  assert.throws(() => readerDeployment(f.root), /deployed reader HTML must match the reviewed source/);
});

test("legacy override assets remain mandatory only when the active workflow installs them", t => {
  const f = deploymentFixture(t);
  f.write(".github/workflows/pages.yml", "jobs:\n  deploy:\n    steps:\n      - run: |\n          python3 .github/scripts/prepare_reader_deploy.py _site\n");
  assert.throws(() => readerDeployment(f.root), /active reader deployment requires \.github\/reader-assets\/read.js/);
  for (const name of ["read.js", "book.js", "read.html"]) {
    f.write(".github/reader-assets/" + name, fs.readFileSync(path.join(f.root, "web", name)));
  }
  const active = readerDeployment(f.root, { repository: "iAlirezaaa/the-writer-live" });
  assert.equal(active.mode, "legacy");
  assert.equal(active.catalogPath, path.join(f.root, ".github/reader-assets/read.js"));
});
