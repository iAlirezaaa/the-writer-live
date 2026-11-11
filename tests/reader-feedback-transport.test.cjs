// Execute the real reader vote/comment functions in a minimal Pages runtime.
// No external services, browser, account, or credentials are required.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { readerDeployment } = require("./reader-deployment.cjs");

const root = path.resolve(__dirname, "..");
const bookSource = fs.readFileSync(path.join(root, "web/book.js"), "utf8");

function compiled(name, next, env) {
  const start = bookSource.indexOf("async function " + name + "(");
  assert.notEqual(start, -1, name + " missing");
  const end = bookSource.indexOf("\nfunction " + next + "(", start);
  assert.ok(end > start, "missing end boundary for " + name);
  const sessionGuard=bookSource.match(/^function currentBook\([^\n]*\)\s*\{[\s\S]*?^\}/m)?.[0];
  assert.ok(sessionGuard,"current reader session guard");
  return vm.runInNewContext(sessionGuard+"\n"+bookSource.slice(start, end) + "\n" + name, env);
}
function setup(api = "") {
  const calls = [];
  const ui = {
    overlay: { hidden: false },
    voteStatus: { textContent: "", replaceChildren(x) { this.child = x; } },
    pop: { dataset: { quote: "selected passage" }, hidden: false },
    popName: { value: "خواننده" },
    popText: { value: "A specific, constructive comment." },
    popCategory: { value: "general" },
    popRating: { value: "5" },
    popStatus: { textContent: "", replaceChildren(x) { this.child = x; } }
  };
  const book = { story: { id: "12", title: "داستان نمونه" }, comments: [] };
  const env = {
    window: { THE_WRITER_FEEDBACK_API: api },
    book, ui, readerRequest: 0, encodeURIComponent, isGitHubPages: () => true,
    fetch: async (...args) => { calls.push(args); return { ok: true, json: async () => ({ id: "c1", text: ui.popText.value, updated: true }) }; },
    openPublicVote: () => ({ opened: true }), openPublicFeedback: () => ({ opened: true }),
    renderMargin: () => { calls.push(["render"]); },
    repaginate: () => { calls.push(["repaginate"]); },
    document: { createTextNode: x => x },
    el: () => ({})
  };
  return { calls, ui, book, env };
}

test("static Pages vote preserves explicit GitHub confirmation without a backend", async () => {
  const s = setup();
  await compiled("sendReaderVote", "adjustFont", s.env)(1);
  assert.match(s.ui.voteStatus.textContent, /GitHub/);
  assert.equal(s.calls.length, 0);
});

test("configured Pages vote sends data directly and reports actual success", async () => {
  const s = setup("https://feedback.example/");
  await compiled("sendReaderVote", "adjustFont", s.env)(-1);
  assert.equal(s.calls.length, 1);
  assert.equal(s.calls[0][0], "https://feedback.example/api/stories/12/votes");
  assert.equal(JSON.parse(s.calls[0][1].body).value, -1);
  assert.match(s.ui.voteStatus.textContent, /ثبت شد/);
});

test("failed direct vote never claims success", async () => {
  const s = setup("https://feedback.example");
  s.env.fetch = async () => ({ ok: false, json: async () => ({ error: "Unavailable" }) });
  await compiled("sendReaderVote", "adjustFont", s.env)(1);
  assert.match(s.ui.voteStatus.textContent, /ناموفق/);
  assert.doesNotMatch(s.ui.voteStatus.textContent, /رأی شما ثبت شد/);
});

test("configured Pages comments submit in place", async () => {
  const s = setup("https://feedback.example/");
  let prevented = false;
  await compiled("sendNote", "renderMargin", s.env)({ preventDefault: () => { prevented = true; } });
  assert.equal(prevented, true);
  assert.equal(s.calls[0][0], "https://feedback.example/api/stories/12/comments");
  assert.equal(JSON.parse(s.calls[0][1].body).quote, "selected passage");
  assert.equal(s.book.comments.length, 1);
  assert.equal(s.ui.pop.hidden, true);
});

test("static Pages comments still require a GitHub submission without backend", async () => {
  const s = setup();
  await compiled("sendNote", "renderMargin", s.env)({ preventDefault() {} });
  assert.match(s.ui.popStatus.child, /GitHub/);
  assert.equal(s.book.comments.length, 0);
  assert.equal(s.calls.length, 0);
});

test("active Pages assets retain the tested search and feedback logic", () => {
  const deployment = readerDeployment(root);
  for (const [name, deployedPath] of [["book.js", deployment.bookPath], ["read.js", deployment.catalogPath]]) {
    assert.equal(fs.readFileSync(path.join(root, "web", name), "utf8"),
      fs.readFileSync(deployedPath, "utf8"), "deployed " + name + " differs from the tested implementation");
  }
  if (deployment.mode === "legacy") {
    assert.equal(fs.readFileSync(path.join(root, "read/index.html"), "utf8"),
      fs.readFileSync(deployment.htmlPath, "utf8"));
  }
});

test("public catalog still executes Persian/Arabic search equivalence", () => {
  const reader = fs.readFileSync(path.join(root, "web/read.js"), "utf8");
  const line = reader.match(/^const searchKey = .+;$/m)?.[0];
  assert.ok(line, "production searchKey");
  const normalize = vm.runInNewContext(line + "\nsearchKey");
  assert.equal(normalize("كتاب"), normalize("کتاب"));
  assert.equal(normalize("علي"), normalize("علی"));
  assert.equal(normalize("کِتاب"), normalize("کتاب"));
});
