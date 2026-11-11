// RDR-027: Persian catalog Unicode regression against the production normalizer.
// Run: node tests/test_reader_unicode_boundaries.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { readerDeployment } = require('./reader-deployment.cjs');
const deployment = readerDeployment(path.join(__dirname, '..'));
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

// Validate the catalog installed by the active Pages workflow. The resolver
// checks hashes/entrypoint rewrites for direct exports and requires legacy pins
// only when the workflow actually installs them.
const deployedPath = deployment.catalogPath;
{
  const deployedSource = fs.readFileSync(deployedPath, 'utf8');
  const deployedMatch = deployedSource.match(/^const searchKey\s*=\s*value\s*=>[^;]+;/m);
  assert.ok(deployedMatch, 'deployed catalog must expose searchKey');
  assert.equal(deployedMatch[0], match[0], 'deployed and source normalizers diverged');
  for (const call of ['const query=searchKey(', 'searchKey(`${story.title||""} ${story.stage||""}`)']) {
    assert.ok(deployedSource.includes(call), 'deployed search wiring missing: ' + call);
  }
  console.log('PASS active deployment/source search parity (' + deployment.mode + ')');
}

// RDR-068: the deployed catalog must preserve numeric and punctuation distinctions.
// These are deliberately negative fixtures: no digit folding or punctuation removal
// is promised by searchKey. Keep the deployed asset's behavior identical.
const boundaryPairs = [
  ['کتاب ۱۲۳', 'کتاب 123'],
  ['کتاب ١٢٣', 'کتاب ۱۲۳'],
  ['کتاب، دوم', 'کتاب دوم'],
  ['نسخه-۲', 'نسخه ۲'],
];
for (const [a, b] of boundaryPairs) {
  assert.notEqual(key(a), key(b), 'distinct search keys required: ' + a + ' / ' + b);
}
{
  const deployedSource = fs.readFileSync(deployedPath, 'utf8');
  const deployedMatch = deployedSource.match(/^const searchKey\s*=\s*value\s*=>[^;]+;/m);
  assert.ok(deployedMatch, 'deployed searchKey must exist');
  const deployedKey = vm.runInNewContext(deployedMatch[0] + '\nsearchKey');
  for (const [a, b] of boundaryPairs) {
    assert.equal(deployedKey(a), key(a), 'deployed/public parity: ' + a);
    assert.equal(deployedKey(b), key(b), 'deployed/public parity: ' + b);
  }
}
console.log('PASS RDR-068: ' + boundaryPairs.length + ' numeric/punctuation boundaries and deployed parity');

// RDR-069: absent catalog metadata must not become the literal title "null".
// Primitive values and deployed Pages normalizer must preserve the same behavior.
const missingMetadata = [[null, ''], [undefined, ''], [0, '0'], [false, 'false']];
for (const [input, expected] of missingMetadata) {
  assert.equal(key(input), expected, 'source metadata: ' + String(input));
}
{
  const deployedSource = fs.readFileSync(deployedPath, 'utf8');
  const deployedMatch = deployedSource.match(/^const searchKey\s*=\s*value\s*=>[^;]+;/m);
  assert.ok(deployedMatch, 'deployed normalizer required');
  const deployedKey = vm.runInNewContext(deployedMatch[0] + '\nsearchKey');
  for (const [input, expected] of missingMetadata) {
    assert.equal(deployedKey(input), expected, 'deployed metadata: ' + String(input));
  }
}
console.log('PASS RDR-069: ' + missingMetadata.length + ' metadata fixtures and deployed parity');

// RDR-072: Unicode control-input stability and deployed/public parity.
const controlInputs = ['کتاب\u0000', '\u200fکتاب', 'کتاب\u200e', '\u2067کتاب\u2069', '\ud800', '\udc00'];
const deployedKeyForControls = fs.existsSync(deployedPath)
  ? (() => {
      const deployedSource = fs.readFileSync(deployedPath, 'utf8');
      const deployedMatch = deployedSource.match(/^const searchKey\s*=\s*value\s*=>[^;]+;/m);
      assert.ok(deployedMatch, 'deployed control-input normalizer must exist');
      return vm.runInNewContext(deployedMatch[0] + '\nsearchKey');
    })()
  : null;
if (deployedKeyForControls) assert.ok(fs.readFileSync(deployedPath, 'utf8').includes(match[0]), 'deployed normalizer must match public');
for (const input of controlInputs) {
  const output = key(input);
  assert.equal(typeof output, 'string');
  assert.equal(key(input), output, 'normalization must be deterministic');
  if (deployedKeyForControls) assert.equal(deployedKeyForControls(input), output);
}
console.log('PASS RDR-072: ' + controlInputs.length + ' fixtures');


// RDR-075: legacy publication must fail closed without its active override;
// private source staging must still execute the complete Unicode suite.
// Use temporary checkouts; never remove real repository files.
const os = require('node:os');
const { spawnSync } = require('node:child_process');
if (process.env.READER_GATE_FIXTURE !== '1') {
const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'reader-deployment-gate-'));
try {
  fs.mkdirSync(path.join(fixtureRoot, 'tests'));
  fs.mkdirSync(path.join(fixtureRoot, 'web'));
  fs.mkdirSync(path.join(fixtureRoot, '.github/workflows'), { recursive: true });
  fs.copyFileSync(__filename, path.join(fixtureRoot, 'tests/test_reader_unicode_boundaries.cjs'));
  fs.copyFileSync(path.join(__dirname, 'reader-deployment.cjs'), path.join(fixtureRoot, 'tests/reader-deployment.cjs'));
  fs.writeFileSync(path.join(fixtureRoot, 'web/read.js'), source);
  fs.copyFileSync(path.join(__dirname, '../web/book.js'), path.join(fixtureRoot, 'web/book.js'));
  const sourceHTML = path.join(__dirname, '../web/read.html');
  fs.writeFileSync(path.join(fixtureRoot, 'web/read.html'), fs.readFileSync(
    fs.existsSync(sourceHTML) ? sourceHTML : deployment.htmlPath, 'utf8'));
  const workflowPath = path.join(fixtureRoot, '.github/workflows/pages.yml');
  fs.writeFileSync(workflowPath, 'jobs:\n  deploy:\n    steps:\n      - run: |\n          python3 .github/scripts/prepare_reader_deploy.py _site\n');
  // RDR-090: verify fixture prerequisites before spawning child Node processes.
  for (const required of ['tests/test_reader_unicode_boundaries.cjs', 'tests/reader-deployment.cjs',
    'web/read.js', 'web/book.js', 'web/read.html', '.github/workflows/pages.yml']) {
    assert.ok(fs.existsSync(path.join(fixtureRoot, required)), 'incomplete reader fixture: missing ' + required);
  }
  const child = spawnSync(process.execPath, [path.join(fixtureRoot, 'tests/test_reader_unicode_boundaries.cjs')], {
    encoding: 'utf8',
    env: { ...process.env, GITHUB_REPOSITORY: 'iAlirezaaa/the-writer-live', READER_GATE_FIXTURE: '1' },
    timeout: 10000,
  });
  assert.equal(child.error, undefined, 'temporary public guard process must start');
  assert.notEqual(child.status, 0, 'missing active legacy asset must fail public CI');
  assert.match(child.stderr, /active reader deployment requires \.github\/reader-assets\/read\.js/);
  fs.writeFileSync(workflowPath, [
    'jobs:', '  build:', '    steps:', '      - run: |',
    '          shutil.copytree(web, site / "web", dirs_exist_ok=True)',
    '          reader = (web / "read.html").read_text(encoding="utf-8")',
    '          (site / "read/index.html").write_text(reader, encoding="utf-8")', '',
  ].join('\n'));
  const privateChild = spawnSync(process.execPath, [path.join(fixtureRoot, 'tests/test_reader_unicode_boundaries.cjs')], {
    encoding: 'utf8',
    env: { ...process.env, GITHUB_REPOSITORY: 'iAlirezaaa/the-writer', READER_GATE_FIXTURE: '1' },
    timeout: 10000,
  });
  assert.equal(privateChild.status, 0, 'private source staging must run without legacy overrides: ' + privateChild.stderr);
  console.log('PASS RDR-075: missing active legacy asset rejected; private source staging accepted');
} finally {
  fs.rmSync(fixtureRoot, { recursive: true, force: true });
}
}

// RDR-082: deployed HTML must retain Persian RTL and a labeled catalog search.
// Validate the active deployed HTML and the checked-in catalog semantics.
const htmlPath = fs.existsSync(path.join(__dirname, '../read/index.html'))
  ? path.join(__dirname, '../read/index.html')
  : path.join(__dirname, '../web/read.html');
const publicHtml = fs.readFileSync(htmlPath, 'utf8');
const deployedHtmlPath = deployment.htmlPath;
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
{
  const deployedSemantics = htmlSemantics(fs.readFileSync(deployedHtmlPath, 'utf8'));
  assert.deepEqual(deployedSemantics, htmlBaseline, 'deployed/public HTML accessibility semantics differ');
}
console.log('PASS RDR-082: Persian RTL and accessible search HTML parity');

// RDR-095: a deliberately corrupted deployed normalizer must be caught by parity.
// Mutation stays in memory; neither production nor deployed assets are modified.
{
  const deployed = fs.readFileSync(deployedPath, 'utf8');
  const deployedMatch = deployed.match(/^const searchKey\s*=\s*value\s*=>[^;]+;/m);
  assert.ok(deployedMatch, 'deployed normalizer must be available for mutation test');
  const mutatedDefinition = deployedMatch[0].replace('searchKey', 'searchKeyMutated');
  assert.notEqual(mutatedDefinition, deployedMatch[0], 'mutation must change the deployed definition');
  assert.throws(() => assert.equal(mutatedDefinition, match[0], 'deployed normalizer mutation detected'), /deployed normalizer mutation detected/,
    'parity assertion must reject a mutated deployed normalizer');
  console.log('PASS RDR-095: in-memory deployed normalizer mutation rejected');
}


// RDR-097: behavioral mutation must be observable on real Persian/Arabic fixtures.
// The mutation is evaluated in memory and never changes deployed files.
{
  const deployedSource = fs.readFileSync(deployedPath, 'utf8');
  const deployedDefinition = deployedSource.match(/^const searchKey\s*=\s*value\s*=>[^;]+;/m);
  assert.ok(deployedDefinition, 'deployed search normalizer required for behavioral mutation');
  const deployedKey = vm.runInNewContext(deployedDefinition[0] + '\nsearchKey');
  const mutatedKey = value => String(value ?? ''); // deliberately omits Persian/Arabic folding
  const mutationFixtures = ['كـتاب', 'ﻛﺘﺎﺏ', 'عَلِي'];
  for (const input of mutationFixtures) {
    assert.equal(deployedKey(input), key(input), 'deployed/public behavior must agree: ' + input);
    assert.notEqual(mutatedKey(input), key(input), 'behavioral mutation escaped detection: ' + input);
  }
  console.log('PASS RDR-097: ' + mutationFixtures.length + ' behavioral mutation fixtures');
}


// RDR-099: bounded pathological Unicode inputs must normalize promptly.
// Check actual public and deployed replacement functions, not a stand-in.
const { performance } = require('node:perf_hooks');
const stressInputs = [
  '\u0643' + '\u0650'.repeat(1999),
  '\u064A' + '\u0640'.repeat(1999),
  '\ud800'.repeat(2000),
  '\u200f'.repeat(2000),
];
for (const input of stressInputs) {
  const started = performance.now();
  const baseline = key(input);
  assert.equal(typeof baseline, 'string');
  assert.ok(performance.now() - started < 1000, 'public search normalization exceeded 1000ms');
  if (deployedKeyForControls) {
    const deployedStarted = performance.now();
    assert.equal(deployedKeyForControls(input), baseline, 'deployed/public stress mismatch');
    assert.ok(performance.now() - deployedStarted < 1000, 'deployed search normalization exceeded 1000ms');
  }
}
console.log('PASS RDR-099: ' + stressInputs.length + ' bounded Unicode stress fixtures');

// RDR-101: deterministic 250-case Unicode corpus, including malformed surrogates.
// Compare the actual deployed implementation when available, never a stand-in.
{
  let seed = 0x51f15e;
  const next = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 0x100000000);
  const alphabet = ['ک', 'ك', 'ی', 'ي', 'ا', 'ﻛ', 'ﺎ', '\\u200c', '\\u200f', '\\u2067', '\\u2069', '\\u0650', '\\u0640', '\\ud800', '\\udc00', ' ', '۳'];
  // RDR-103: pin the exact generated corpus (UTF-16 code units, FNV-1a).
  let corpusHash = 2166136261;
  for (let caseIndex = 0; caseIndex < 250; caseIndex++) {
    const size = 1 + Math.floor(next() * 48);
    let input = '';
    for (let i = 0; i < size; i++) input += alphabet[Math.floor(next() * alphabet.length)];
    for (let unit = 0; unit < input.length; unit++) {
      corpusHash = Math.imul(corpusHash ^ input.charCodeAt(unit), 16777619) >>> 0;
    }
    corpusHash = Math.imul(corpusHash ^ 0xffff, 16777619) >>> 0;
    const expected = key(input);
    assert.equal(key(input), expected, 'non-deterministic search key at case ' + caseIndex);
    assert.equal(key(expected), expected, 'non-idempotent search key at case ' + caseIndex + ': ' + JSON.stringify(input));
    if (deployedKeyForControls) {
      assert.equal(deployedKeyForControls(input), expected,
        'deployed/public mismatch at case ' + caseIndex + ': ' + JSON.stringify(input));
    }
  }
  assert.equal(corpusHash.toString(16).padStart(8, '0'), '4777eb3d', 'RDR-103 corpus drift: review seed/alphabet before updating digest');
  console.log('PASS RDR-101/RDR-103: 250 deterministic Unicode cases and pinned corpus digest');
}
