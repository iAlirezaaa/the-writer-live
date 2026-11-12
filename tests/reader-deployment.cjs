"use strict";
// Resolve what the Pages workflow actually ships. Archived reader-assets are
// authoritative only while an active workflow command installs them.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { createHash } = require("node:crypto");

const REVIEWED_READER_ASSETS = [
  "web/book.js", "web/read.js", "web/library-stage.js",
  "web/library.css", "web/reader-room.css", "web/read.html",
];

const projectReaderHTML = html => html
  .replaceAll('href="/web/', 'href="../web/')
  .replaceAll('src="/web/', 'src="../web/')
  .replaceAll('href="/"', 'href="../"');

function readerDeployment(root, { repository = process.env.GITHUB_REPOSITORY || "" } = {}) {
  root = path.resolve(root);
  const required = relative => {
    const file = path.join(root, relative);
    assert.ok(fs.existsSync(file) && fs.statSync(file).isFile(), "active reader deployment requires " + relative);
    return file;
  };
  const workflow = fs.readFileSync(required(".github/workflows/pages.yml"), "utf8")
    .split("\n").filter(line => !/^\s*#/.test(line)).join("\n");
  const legacy = /^\s*(?:python(?:3(?:\.\d+)?)?\s+["']?\.github\/scripts\/prepare_reader_deploy\.py\b|(?:cp|rsync)\s+[^\n]*\.github\/reader-assets\/)/m.test(workflow);
  const direct = /^\s*cp\s+(?:-[^\s]+\s+)*index\.html\s+web\s+read(?:\s+reader)?\s+snapshot\s+_site\/?\s*$/m.test(workflow);
  const sourceStage = workflow.includes('shutil.copytree(web, site / "web"')
    && workflow.includes('(web / "read.html").read_text')
    && workflow.includes('(site / "read/index.html").write_text');
  const mode = legacy ? "legacy" : direct ? "direct" : sourceStage ? "source" : null;
  assert.ok(mode, "unrecognized active reader Pages staging contract");
  if (repository.toLowerCase() === "ialirezaaa/the-writer-live") {
    assert.notEqual(mode, "source", "public reader CI requires a public deployment contract");
  }

  const catalogPath = required(mode === "legacy" ? ".github/reader-assets/read.js" : "web/read.js");
  const bookPath = required(mode === "legacy" ? ".github/reader-assets/book.js" : "web/book.js");
  const htmlPath = required(mode === "legacy" ? ".github/reader-assets/read.html"
    : mode === "direct" ? "read/index.html" : "web/read.html");
  let manifest = null;
  if (mode === "direct") {
    manifest = JSON.parse(fs.readFileSync(required(".github/live-sync-manifest.json"), "utf8"));
    assert.equal(manifest.private_source_repository, "iAlirezaaa/the-writer");
    assert.match(manifest.private_source_commit || "", /^[0-9a-f]{40}$/, "manifest must identify a committed private source");
    assert.equal(manifest.reader_entrypoint, "read/index.html", "manifest must identify the deployed reader entrypoint");
    assert.ok(manifest.reader_assets && typeof manifest.reader_assets === "object"
      && !Array.isArray(manifest.reader_assets), "direct deployment requires reviewed reader asset hashes");
    for (const name of REVIEWED_READER_ASSETS) {
      assert.match(manifest.reader_assets[name] || "", /^[0-9a-f]{64}$/, "missing reviewed reader asset hash: " + name);
    }
    for (const [name, expected] of Object.entries(manifest.reader_assets)) {
      const resolved = path.resolve(root, name);
      assert.ok(name.startsWith("web/") && path.relative(root, resolved).split(path.sep).join("/") === name,
        "reader manifest path must remain inside web/: " + name);
      const actual = createHash("sha256").update(fs.readFileSync(required(name))).digest("hex");
      assert.equal(actual, expected, "reviewed reader asset hash mismatch: " + name);
    }
    const expectedHTML = projectReaderHTML(fs.readFileSync(required("web/read.html"), "utf8"));
    assert.equal(fs.readFileSync(htmlPath, "utf8"), expectedHTML,
      "deployed reader HTML must match the reviewed source with project paths");
  }
  const entryPaths = [...new Set([
    htmlPath,
    ...(mode === "legacy" ? [required("read/index.html")] : []),
    ...(fs.existsSync(path.join(root, "web/read.html")) ? [path.join(root, "web/read.html")] : []),
  ])];
  return { mode, catalogPath, bookPath, htmlPath, entryPaths, manifest };
}

module.exports = { readerDeployment, projectReaderHTML, REVIEWED_READER_ASSETS };
