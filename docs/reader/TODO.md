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
