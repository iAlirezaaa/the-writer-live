// RDR-027: Persian catalog Unicode regression against the production normalizer.
// Run: node tests/test_reader_unicode_boundaries.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../web/read.js'), 'utf8');
const match = source.match(/^const searchKey\s*=\s*value\s*=>[^;]+;/m);
assert.ok(match, 'production searchKey must exist');
const key = vm.runInNewContext(match[0] + '\nsearchKey');
const equal = [
  ['کِتاب', 'کتاب'],
  ['ک\u0650\u064eتاب', 'ک\u064e\u0650تاب'],
  ['كـتاب', 'کتاب'],
  ['ﻛﺘﺎﺏ', 'کتاب'],
  ['عَلِي', 'علی'],
];
const distinct = [
  ['می‌روم', 'میروم'], // ZWNJ is intentionally significant, not silently stripped.
  ['کتاب خانه', 'کتابخانه'],
  ['کتاب', 'کتاب‌ها'],
  ['کتاب', 'دفتر'],
];
for (const [a, b] of equal) assert.equal(key(a), key(b), 'expected equivalent: ' + a + ' / ' + b);
for (const [a, b] of distinct) assert.notEqual(key(a), key(b), 'must remain distinct: ' + a + ' / ' + b);
assert.ok(source.includes('const query=searchKey('));
assert.ok(source.includes('searchKey(`\u0024{story.title||""} \u0024{story.stage||""}`)'));
console.log('PASS RDR-027: ' + equal.length + ' equivalences, ' + distinct.length + ' distinct pairs, 2 wiring checks');

// RDR-065: normalization must be idempotent for both scripts and mixed input.
const stableInputs = ['كِتاب', 'عَلِي', 'ﻛﺘﺎﺏ', 'می‌روم', 'Book ۱۲۳', ''];
for (const value of stableInputs) {
  assert.equal(key(key(value)), key(value), 'normalization must be idempotent: ' + value);
}
console.log('PASS RDR-065: ' + stableInputs.length + ' idempotence fixtures');

// Public Pages deploys the protected asset in place of web/read.js. When that
// asset exists, its normalizer and both search call sites must remain identical.
const protectedPath = path.join(__dirname, '../.github/reader-assets/read.js');
// RDR-073: public CI must never silently skip checks for the deployed replacement.
if (process.env.GITHUB_REPOSITORY?.toLowerCase() === 'ialirezaaa/the-writer-live') {
  assert.ok(fs.existsSync(protectedPath), 'public CI requires .github/reader-assets/read.js');
}
if (fs.existsSync(protectedPath)) {
  const protectedSource = fs.readFileSync(protectedPath, 'utf8');
  const protectedMatch = protectedSource.match(/^const searchKey\s*=\s*value\s*=>[^;]+;/m);
  assert.ok(protectedMatch, 'protected catalog must expose searchKey');
  assert.equal(protectedMatch[0], match[0], 'protected and public normalizers diverged');
  for (const call of ['const query=searchKey(', 'searchKey(`\u0024{story.title||""} \u0024{story.stage||""}`)']) {
    assert.ok(protectedSource.includes(call), 'protected search wiring missing: ' + call);
  }
  console.log('PASS protected/public search parity');
}

// RDR-068: the deployed catalog must preserve numeric and punctuation distinctions.
// These are deliberately negative fixtures: no digit folding or punctuation removal
// is promised by searchKey. Keep the protected asset's behavior identical.
const boundaryPairs = [
  ['کتاب ۱۲۳', 'کتاب 123'],
  ['کتاب ١٢٣', 'کتاب ۱۲۳'],
  ['کتاب، دوم', 'کتاب دوم'],
  ['نسخه-۲', 'نسخه ۲'],
];
for (const [a, b] of boundaryPairs) {
  assert.notEqual(key(a), key(b), 'distinct search keys required: ' + a + ' / ' + b);
}
if (fs.existsSync(protectedPath)) {
  const protectedSource = fs.readFileSync(protectedPath, 'utf8');
  const protectedMatch = protectedSource.match(/^const searchKey\s*=\s*value\s*=>[^;]+;/m);
  assert.ok(protectedMatch, 'protected searchKey must exist');
  const protectedKey = vm.runInNewContext(protectedMatch[0] + '\nsearchKey');
  for (const [a, b] of boundaryPairs) {
    assert.equal(protectedKey(a), key(a), 'protected/public parity: ' + a);
    assert.equal(protectedKey(b), key(b), 'protected/public parity: ' + b);
  }
}
console.log('PASS RDR-068: ' + boundaryPairs.length + ' numeric/punctuation boundaries and protected parity');

// RDR-069: absent catalog metadata must not become the literal title "null".
// Primitive values and protected Pages normalizer must preserve the same behavior.
const missingMetadata = [[null, ''], [undefined, ''], [0, '0'], [false, 'false']];
for (const [input, expected] of missingMetadata) {
  assert.equal(key(input), expected, 'source metadata: ' + String(input));
}
if (fs.existsSync(protectedPath)) {
  const deployedSource = fs.readFileSync(protectedPath, 'utf8');
  const deployedMatch = deployedSource.match(/^const searchKey\s*=\s*value\s*=>[^;]+;/m);
  assert.ok(deployedMatch, 'protected normalizer required');
  const deployedKey = vm.runInNewContext(deployedMatch[0] + '\nsearchKey');
  for (const [input, expected] of missingMetadata) {
    assert.equal(deployedKey(input), expected, 'protected metadata: ' + String(input));
  }
}
console.log('PASS RDR-069: ' + missingMetadata.length + ' metadata fixtures and protected parity');

// RDR-072: Unicode control-input stability and protected/public parity.
const controlInputs = ['کتاب\u0000', '\u200fکتاب', 'کتاب\u200e', '\u2067کتاب\u2069', '\ud800', '\udc00'];
const protectedKeyForControls = fs.existsSync(protectedPath)
  ? vm.runInNewContext(match[0] + '\nsearchKey')
  : null;
if (protectedKeyForControls) assert.ok(fs.readFileSync(protectedPath, 'utf8').includes(match[0]), 'protected normalizer must match public');
for (const input of controlInputs) {
  const output = key(input);
  assert.equal(typeof output, 'string');
  assert.equal(key(input), output, 'normalization must be deterministic');
  if (protectedKeyForControls) assert.equal(protectedKeyForControls(input), output);
}
console.log('PASS RDR-072: ' + controlInputs.length + ' fixtures');


// RDR-075: prove the live CI guard fails closed when the protected asset is absent.
// Use an isolated temporary checkout; never remove files from the real repository.
const os = require('node:os');
const { spawnSync } = require('node:child_process');
if (process.env.READER_GATE_FIXTURE !== '1') {
const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'reader-protected-gate-'));
try {
  fs.mkdirSync(path.join(fixtureRoot, 'tests'));
  fs.mkdirSync(path.join(fixtureRoot, 'web'));
  fs.copyFileSync(__filename, path.join(fixtureRoot, 'tests/test_reader_unicode_boundaries.cjs'));
  fs.writeFileSync(path.join(fixtureRoot, 'web/read.js'), source);
  // The nested private test also reads catalog HTML; keep the fixture complete.
  fs.writeFileSync(path.join(fixtureRoot, 'web/read.html'), fs.readFileSync(path.join(__dirname, '../web/read.html'), 'utf8'));
  const child = spawnSync(process.execPath, [path.join(fixtureRoot, 'tests/test_reader_unicode_boundaries.cjs')], {
    encoding: 'utf8',
    env: { ...process.env, GITHUB_REPOSITORY: 'iAlirezaaa/the-writer-live', READER_GATE_FIXTURE: '1' },
    timeout: 10000,
  });
  assert.equal(child.error, undefined, 'temporary public guard process must start');
  assert.notEqual(child.status, 0, 'missing protected asset must fail public CI');
  assert.match(child.stderr, /public CI requires \.github\/reader-assets\/read\.js/);
  const privateChild = spawnSync(process.execPath, [path.join(fixtureRoot, 'tests/test_reader_unicode_boundaries.cjs')], {
    encoding: 'utf8',
    env: { ...process.env, GITHUB_REPOSITORY: 'iAlirezaaa/the-writer', READER_GATE_FIXTURE: '1' },
    timeout: 10000,
  });
  assert.equal(privateChild.status, 0, 'private checkout must run without protected asset: ' + privateChild.stderr);
  console.log('PASS RDR-075: missing protected asset rejected in live, accepted in private');
} finally {
  fs.rmSync(fixtureRoot, { recursive: true, force: true });
}
}

// RDR-082: deployed HTML must retain Persian RTL and a labeled catalog search.
// The public Pages replacement is authoritative; private checkout has no protected asset.
const htmlPath = fs.existsSync(path.join(__dirname, '../read/index.html'))
  ? path.join(__dirname, '../read/index.html')
  : path.join(__dirname, '../web/read.html');
const publicHtml = fs.readFileSync(htmlPath, 'utf8');
const protectedHtmlPath = path.join(__dirname, '../.github/reader-assets/read.html');
const isPublicCI = process.env.GITHUB_REPOSITORY?.toLowerCase() === 'ialirezaaa/the-writer-live';
if (isPublicCI) assert.ok(fs.existsSync(protectedHtmlPath), 'public CI requires protected read.html');
const htmlSemantics = html => {
  const root = html.match(/<html\b[^>]*>/i)?.[0] || '';
  const landmark = html.match(/<div\b[^>]*role="search"[^>]*>[\s\S]*?<\/div>/i)?.[0] || '';
  const label = landmark.match(/<label\b[^>]*>[\s\S]*?<input\b[^>]*id="story-search"[^>]*>/i)?.[0] || '';
  assert.match(root, /\blang="fa"/i, 'reader language must be Persian');
  assert.match(root, /\bdir="rtl"/i, 'reader direction must be RTL');
  assert.match(landmark, /aria-label="[^"]+"/, 'search landmark must have an accessible name');
  assert.match(label, /جست‌وجو/, 'search input must have a visible associated label');
  return [root.match(/lang="([^"]+)"/i)[1], root.match(/dir="([^"]+)"/i)[1],
    landmark.match(/aria-label="([^"]+)"/)[1], label.replace(/<[^>]*>/g, '').trim().split(/\s+/)[0]];
};
const htmlBaseline = htmlSemantics(publicHtml);
if (fs.existsSync(protectedHtmlPath)) {
  const protectedSemantics = htmlSemantics(fs.readFileSync(protectedHtmlPath, 'utf8'));
  assert.deepEqual(protectedSemantics, htmlBaseline, 'protected/public HTML accessibility semantics differ');
}
console.log('PASS RDR-082: Persian RTL and accessible search HTML parity');
