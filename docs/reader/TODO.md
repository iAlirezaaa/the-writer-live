# Public reader TODO and release log

Scope: reader UX and future digital bookstore only; no city changes, checkout, payments or private writer state.

## RDR-029 — 2026-11-09 — stable passage position

- [x] Add `web/reader-position.js` (passage anchor locator independent from page count).
- [x] Update `web/book.js` to save `kind/firstPara/firstWord` and resume with a percentage-only legacy fallback.
- [x] Add `tests/reader-position.test.mjs` with six pure regression tests.
- [x] Record docs and prioritized backlog in `docs/reader/README.md`.
- [x] Standalone Node 22 tests run locally: **6/6 passed** with `node --test --experimental-default-type=module tests/reader-position.test.mjs`.
- [ ] Full-browser reflow check on mobile/desktop and cross-device owner-sync smoke test (**not run**).
- [ ] Full repository integration and CI (**not run**).

## Next distinct ideas

- [ ] **RDR-030 P1:** bookmarks should carry their own text-position anchor, independent from latest reading progress. Verify exact-passage recovery after font size or viewport changes.
- [ ] **RDR-031 P1:** revision-aware reading locators should detect edited paragraphs and avoid falsely claiming an exact restore when source text has changed.

## Notes

Public code contains no keys, private reader-state database, owner tokens, or unpublished story content. Only public UI, tests and documentation belong in this repository. Benchmark sources: [Readium locator architecture](https://readium.org/architecture/models/locators/) and [WCAG 2.2](https://www.w3.org/TR/wcag/).

## RDR-035 — 2026-11-09 — accessible catalog filter reset

- [x] Added a keyboard-accessible `پاک‌کردن فیلترها` action in the public catalog to clear query, status, and sort, with search focus restoration and no page reload. Escape in the search field also resets.
- [x] Applied the change to both public working files and protected `.github/reader-assets/` files used by Pages build. The protected script now includes the same Arabic/Persian/Unicode search normalizer as the public root.
- [x] Added responsive reset styling and bumped only the catalog `read.js` cache version to `reader-20261109-catalog-v8`; updated the existing deployment guards without touching the world/city build.
- [x] CI: [Reader catalog focused tests — success](https://github.com/iAlirezaaa/the-writer-live/actions/runs/42602851160). 10/10 source-linked catalog tests, 6/6 passage-anchor tests, both Unicode suites and JS syntax check passed on Node.js 22.
- [ ] Verify the final Pages deployment and real keyboard/screen-reader/mobile browser behavior; CI success is not proof of deployment or visual performance.

### Next prioritized, distinct ideas
- [ ] **RDR-036 P1:** allowlisted URL state for catalog query/status/sort so book searches can be shared and restored; never expose unpublished items and sanitize malformed links.
- [ ] **RDR-037 P2:** rights-aware collection of book series and editions with stable volume order and explicit publication eligibility; no checkout or private story text.

References: [Kobo Web Reader](https://help.kobo.com/hc/en-us/articles/35996239522967-Kobo-Web-Reader-Navigation-Reading-Features), [Google Play Books library organization](https://support.google.com/googleplay/answer/9402600?hl=en).

## RDR-038 — 2026-11-09 — protected/public catalog parity regression

- [x] Restore public `web/read.js` reset/filter behavior from the already-tested private implementation; previously public root lacked reset while protected Pages assets had it.
- [x] Extend Node catalog test to compare actual `renderShelf` and `resetShelfFilters` implementations between public root and protected Pages assets, not just symbol presence; test authored in private first.
- [ ] **RDR-039 P1 new:** fail CI when the public HTML entry point references a stale catalog script cache key compared with the protected Pages HTML. Acceptance: matching version keys and a passing Node regression.
- [ ] **RDR-040 P2 new:** add a rights-safe catalog loading retry control with an accessible error status when a public snapshot request fails. Acceptance: retry without reload, no unpublished data exposure.
- CI and browser status must be recorded separately; protected assets replace root files at deployment, so root/protected parity is a release gate.

## RDR-039 — 2026-11-09 — public catalog entry-point parity
- [x] Correct public `read/index.html` to match protected `.github/reader-assets/read.html`: restore the accessible filter-reset control and catalog JS cache key `reader-20261109-catalog-v8`. No story data, checkout, or city files changed.
- [x] Add a Node regression in `tests/reader-catalog-reset.test.cjs` checking versioned entry scripts and reset controls; private-first commit `4c163c447bd0c1881dca3b8896e2282986eff546`; public HTML `eaa4f748956f173965562d171feefbf94643d0f6`; public test `4011a1d4abdd5d1a7885bc578ebf6b335b0b7373`.
- [ ] Confirm fresh reader-catalog-quality workflow run and Node pass/fail totals. Connector currently cannot list push-triggered workflow runs; do not infer success. Browser QA and Pages deployment remain unverified.
- [ ] **RDR-041 P1:** assert both public entry HTML and protected replacement preserve exactly one named search landmark and all search/status/sort/reset IDs, with one Node test. Acceptance: no entry-point semantic drift.
- [ ] **RDR-042 P2:** test RTL keyboard arrow page-turn behavior with an explicit language-direction fixture, including reduced-motion mode. Acceptance: deterministic navigation without scroll hijacking.
- Benchmark: Kobo Web Reader supports keyboard page navigation, bookmarks, annotations, search and reading settings: https://help.kobo.com/hc/en-us/articles/35996239522967-Kobo-Web-Reader-Navigation-Reading-Features .

## RDR-043 — 2026-11-09 — premium public library release
- [x] Functional, visible catalog update: editorial jade/gold hero, dynamic stats, responsive covers, grid/list views, light/dark theme, favorites and reading-progress filters, and estimated reading minutes. All preferences are browser-local; no private writer data or payment integration.
- [x] Reviewed public `web/read.js`, `read/index.html`, `web/book.css` and protected `.github/reader-assets/` copies; Pages build guard checks catalog version `reader-20261109-library-v2`.
- [x] [Node 22 CI](https://github.com/iAlirezaaa/the-writer-live/actions/runs/42623444113): 11 catalog + 10 library UX + 6 resume tests = **27 passing / 0 failing**, plus Unicode checks and JS syntax verification.
- [ ] [GitHub Pages deployment](https://github.com/iAlirezaaa/the-writer-live/actions/runs/42623444479) pending at time of report; real browser and responsive visual QA not verified yet.
- [ ] **RDR-044 P1:** cross-tab consistency for local favorites, theme and catalog view preference via `storage` event, with no server-side telemetry.
- [ ] **RDR-045 P2:** rights-cleared category/genre filtering based exclusively on published metadata. Do not reveal unpublished or unlicensed content.
- UX references: [Apple HIG](https://developer.apple.com/design/human-interface-guidelines/), [Readwise Reader](https://docs.readwise.io/reader/docs/faqs/appearance) and [Kobo Web Reader](https://help.kobo.com/hc/en-us/articles/35996239522967-Kobo-Web-Reader-Navigation-Reading-Features).

- **Release confirmation (after QA):** [GitHub Pages deployment 42624010484](https://github.com/iAlirezaaa/the-writer-live/actions/runs/42624010484) completed successfully at 2026-11-09T13:17:25Z. Its deploy job validated pinned reader assets and uploaded/deployed the public site at https://ialirezaaa.github.io/the-writer-live/ . Catalog route: https://ialirezaaa.github.io/the-writer-live/read/ . Actual desktop/mobile visual checks and manual screen-reader QA remain unverified.

## RDR-041 — 2026-11-09 — catalog search landmark parity regression
- [x] Add one Node regression checking exactly one named search region and unique search/status/sort/reset IDs inside it in each available public and protected HTML entry point. Production behavior unchanged.
- [ ] Confirm focused Node CI run and pass/fail totals; do not confuse CI with Pages deployment or real-browser accessibility QA.
- [ ] **RDR-046 P1 new:** test live-region announcements when filtering quickly, requiring one settled result count rather than one announcement per keystroke.
- [ ] **RDR-047 P2 new:** verify public-only book preview links use an explicit rights allowlist and never construct links for unpublished editions.
- Benchmark: Kobo Web Reader documents keyboard navigation, table of contents, search, bookmarks and reading settings: https://help.kobo.com/hc/en-us/articles/35996239522967-Kobo-Web-Reader-Navigation-Reading-Features .
- Only a generic Node test is synchronized publicly; no unpublished writer data, secrets or payment functionality.

## RDR-048 — 2026-11-09 — executable protected-search regression
- [x] Add a Node regression in `tests/reader-catalog-reset.test.cjs` that evaluates the deployed protected `searchKey` implementation against four Persian/Arabic/Latin equivalence fixtures. The test is skipped in the private repository when public deployment assets are absent, and executes against the protected file in live. No runtime catalog behavior, story data, city code or payment changes.
- [ ] Confirm a fresh `reader-catalog-quality.yml` CI run for the new commit, including exact Node pass/fail totals. Previous known live run 42623444113 passed, but does not validate RDR-048. A separate earlier run 42623242316 failed in the catalog test step; root cause and fresh results remain unconfirmed.
- [ ] Browser keyboard, screen-reader and GitHub Pages deployment verification remain separate and unverified.
- [ ] **RDR-049 P1 new:** add a protected/public normalization fuzz corpus covering ZWNJ, Arabic digits and punctuation with deterministic expected matches and false-positive boundaries; run it in focused CI.
- [ ] **RDR-050 P2 new:** add a non-transactional, rights-aware sample-length badge (pages or minutes) generated only from explicitly public preview metadata; never inspect unpublished text or enable checkout.
- Benchmark: Kobo Web Reader supports keyboard navigation, book search, notes, adjustable typography and saved position: https://help.kobo.com/hc/en-us/articles/35996239522967-Kobo-Web-Reader-Navigation-Reading-Features .

## RDR-051 — 2026-11-09 — repair focused Node regression
- [x] **P0 test repair:** remove a broken undeclared `implementation` reference and orphaned loop from protected/source parity test; repair executable protected `searchKey` fixture escaping. One focused test-only change, private-first then public. No runtime, catalog records, city or payment edits.
- [ ] **CI verification pending:** run `.github/workflows/reader-catalog-quality.yml` and report exact successful/failed Node counts; a prior green run cannot validate this change. Browser QA and Pages deployment are independent.
- [ ] **RDR-052 P1 new:** add a negative-match fixture to ensure normalizing Arabic/Persian letters does not collapse distinct catalog titles. Acceptance: public and protected implementations produce identical positive and negative results.
- [ ] **RDR-053 P2 new:** introduce a rights-only preview eligibility contract for storefront cards, with explicit reason codes for blocked previews and no unpublished text in test fixtures.
- Benchmark: Kobo Web Reader supports keyboard navigation, notes, saved position and typography controls: https://help.kobo.com/hc/en-us/articles/35996239522967-Kobo-Web-Reader-Navigation-Reading-Features .


## RDR-057 — 2026-11-09 — public feedback transport publication
- [x] Publish reader vote/comment branches from the private source into public `web/book.js` and the protected `.github/reader-assets/book.js`, without copying private writer data. Both protected/public JavaScript sources have matching blob hashes. Only the explicitly public transport branches were ported; the earlier public pagination implementation was preserved.
- [x] Update versioned public reader imports, catalog HTML, and `.github/scripts/prepare_reader_deploy.py` so the protected assets survive future snapshot pushes and bypass old browser module caches.
- [x] Add `tests/reader-feedback-transport.test.cjs` and include it in the independent `reader-catalog-quality.yml`; it exercises GitHub fallback, direct submission with a configured API, error messaging, protected/source parity and live Persian normalization behavior.
- **Deployment caveat:** A public backend URL has not been configured. GitHub Pages therefore still opens an explicit GitHub Issue for final vote/comment confirmation; this is **not** first-party data capture. Pushing commits triggers the Pages workflow, but neither Pages outcome nor fresh focused Node results were verified from the connector in this run. Browser validation was not performed.
- [ ] **RDR-057a P1 new:** prevent duplicate in-flight comment submissions on rapid double click; preserve typed feedback and show an accessible retry action on network/429 errors. Acceptance: one request per submission attempt and no lost form text.
- [ ] **RDR-058 P2 new:** add a clear on-page transport status (GitHub confirmation vs direct API connected), announced accessibly when it changes; no misleading success toast, no persistent health polling, no exposed API keys.
- Security: do not expose admin credentials, unpublished writer data, private `data/index/` comment queue, or a guessed external API endpoint in public assets. Actual backend deployment and anti-abuse controls remain RDR-055.

## RDR-069 — 2026-11-09 — missing catalog metadata regression
- [x] **P1 test only:** four executable Node fixtures for null, undefined, zero and false in production searchKey; protected Pages replacement is checked when present. Private commit `3a019b64577667457dc7f9860cbc05b999e20e10`; public commit `ccbbf7ce109dc047c118a02d6ad2cbf279919775`. Source and public test blob SHA match: `87c5783c001b795f308c245de5ab08e397eaa348`.
- [ ] **P0 verification:** retrieve actual focused CI run status and exact Node pass/fail totals. Workflow includes this test but successful commit is not proof of CI success. Browser QA and Pages deployment are separate.
- [ ] **RDR-070 P1 NEW:** add a catalog regression for malformed Unicode surrogate input and verify safe search without crashes, identical in protected and public scripts.
- [ ] **RDR-071 P2 NEW:** test accessible empty cover fallback labels for rights-cleared books with no cover URL, without publishing private book metadata.
- Priority remains reliable public search and accessibility before storefront checkout. No production runtime or payment changes.

## RDR-072 — 2026-11-10 — control-input search parity regression
- [x] Added six deterministic Unicode/control-input fixtures to `tests/test_reader_unicode_boundaries.cjs`; protected Pages normalizer is compared when present. No runtime UI or private data changed.
- [ ] **RDR-073 P1 new:** make the protected asset's existence mandatory in public CI instead of silently skipping parity checks. Acceptance: missing `.github/reader-assets/read.js` fails public workflow, while private source tests remain usable.
- [ ] **RDR-074 P2 new:** add an explicit catalog empty-state action to clear only search text while preserving selected status/sort; acceptance: keyboard focus remains on search and protected/public implementations agree.
- Test status: GitHub Actions push-run outcome not yet verified; Node execution and browser QA not claimed. Benchmark: https://help.kobo.com/hc/en-us/articles/35996239522967-Kobo-Web-Reader-Navigation-Reading-Features .

## RDR-073 — 2026-11-10 — public protected-asset CI gate
- [x] **P1 test-only:** `tests/test_reader_unicode_boundaries.cjs` now asserts `.github/reader-assets/read.js` exists when `GITHUB_REPOSITORY` identifies the live repository. The private test remains runnable without the protected asset. Existing executable Unicode normalization and source/protected parity checks remain intact. Private commit `dc321a0eb7986031f5c67b4a31e41c88a2e6c846`; public commit `4e34e698337589d4666cd4afbb78994a8131a11c`; test blob `a14bc4c89038007fc3e27ed60b513e642d8ba34c` in both repositories.
- [ ] **P0 verification:** focused Node CI execution, exact pass/fail counts, GitHub Pages deployment, and browser QA are not verified; connector's commit-run lookup returns no push-triggered runs. Never equate a commit or source check with successful execution.
- [ ] **RDR-075 P1 NEW:** add a controlled Node fixture that intentionally removes the protected asset in a temporary checkout and asserts the public CI guard exits nonzero, while private mode succeeds. No production file deletion.
- [ ] **RDR-076 P2 NEW:** test catalog favorites persistence when storage quota is exceeded or browser storage is disabled; preserve visible book list and announce recoverable state without leaking reading data.
- Priority: confirm real CI first, then browser-level RTL/keyboard QA, then optional rights-aware catalog commerce metadata. No checkout, payment, private stories or city changes.


## RDR-075 — 2026-11-10 — isolated fail-closed CI fixture
- [x] **P1 test-only:** isolated temporary Node checkout asserts the live repository rejects missing `.github/reader-assets/read.js` and the private repository accepts its absence. Production files are never removed; child fixtures avoid recursion. Private commit `33361b514eacbe1fba8686c6453adb8a73a00562`; public commit `7f8436a33ff4cb1ba34c04e7c7db88767cd9956c`; identical test blob `1686f882fc0b46346be8ed9b14f62aba512d9ba8`.
- [ ] **P0 verification:** run focused Node suite in Actions and capture exact pass/fail counts and run URL. Push-triggered Actions runs cannot be enumerated using current connector. No browser or Pages success inferred.
- [ ] **RDR-077 P1 NEW:** execute protected/public Unicode normalization parity with randomized, seeded Persian/Arabic search strings and report reproducible failing seed; never include unpublished titles.
- [ ] **RDR-078 P2 NEW:** test accessible keyboard focus recovery after closing an RTL book preview and returning to its catalog card, including when sorting changes.
- Benchmarks: Kobo Web Reader supports saved bookmarks, search and typography controls (https://help.kobo.com/hc/en-us/articles/35996239522967-Kobo-Web-Reader-Navigation-Reading-Features); Libby respects reduced motion and labeled navigation (https://help.libbyapp.com/en-us/6243.htm).
- Priority: CI runtime verification, then RTL keyboard accessibility, then future rights-cleared storefront metadata; no payment, city or private content changes.


## RDR-079 — 2026-11-10 — repair Node parser failure in reader gate test
- [x] **P0 test repair:** replace literal `\\n` following the `READER_GATE_FIXTURE` guard with an actual newline in `tests/test_reader_unicode_boundaries.cjs`. This was a JavaScript syntax error that prevented any of the Unicode or protected-asset assertions from executing. Private commit `2b7bef2ec71afe7c2c88820e728c7c917dba7244`; public commit `92cb85b776384d4ac1219aad70b1d8990046f797`; matching blob `cfd086c5775c9bd11a40cbc3c1c15ec8d6687742`.
- [ ] **P0 runtime verification:** GitHub commit-associated workflow lookup returned zero runs and combined commit statuses returned zero checks; this connector does not enumerate push-triggered runs. No CI test totals, Pages deployment success, or browser verification are claimed. Full Node suite remains to be verified.
- [ ] **RDR-080 P1 NEW:** introduce a standalone `node --check tests/test_reader_unicode_boundaries.cjs` CI step before behavioral suites, with a fixture that rejects escaped line-break tokens outside JS strings; record exact parser failure location.
- [ ] **RDR-081 P2 NEW:** add a rights-aware public catalog preview indicator with explicit `sampleAvailable` metadata and accessible Persian labels, ensuring unavailable or unpublished samples never become clickable.
- Benchmark: Kobo Web Reader documents in-book search, annotations, bookmarks, and adjustable reading layout; Libby documents reduced-motion accessibility settings. Favor correctness and accessibility before commercial checkout.
