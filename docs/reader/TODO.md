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
