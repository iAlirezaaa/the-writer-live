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
