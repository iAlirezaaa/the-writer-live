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
