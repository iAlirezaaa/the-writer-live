# Reader execution tracker — 2026-11-09

Scope: reader and future digital bookstore only. Private repository is authoritative. Never copy owner tokens, author data, runtime databases, or credentials into the public repository.

## Verified baseline
- `web/book.js`: RTL page navigation, Web Animations API leaf turn, reduced-motion fallback, font/theme controls, progress, bookmarks, text search, annotations.
- `web/book.css`: responsive single/spread layout and typography controls.
- This audit is source inspection, **not** a browser/runtime test.
- Reference comparison: [Kobo Web Reader](https://help.kobo.com/hc/en-us/articles/35996239522967-Kobo-Web-Reader-Navigation-Reading-Features), [Readium CSS](https://readium.org/css/docs/), [Thorium accessibility](https://daisy.org/info-help/guidance-training/reading-systems/thorium-epub-reader-quick-start-guide/).

## One small improvement this run: reproducible RTL reader QA acceptance checklist
Status: DOCUMENTED; runtime execution PENDING. No production code modified.

1. Open a Persian story in a 390px viewport and a 1280px viewport; ensure text is not clipped and controls remain reachable.
2. From the title page, press ArrowLeft: advance one page/spread. ArrowRight: return. Verify boundary buttons disable correctly.
3. Select text, then swipe: selection must not accidentally turn a page.
4. Enable OS reduced motion, turn a page: no 3D flip should occur.
5. Change font, line spacing, and margins mid-chapter: text reflows without losing the current passage.
6. Reload after bookmarking and after changing reading settings: verify restored position and settings.
7. Navigate controls using keyboard alone and inspect focus visibility and screen-reader names.
8. Record actual device/browser, expected/observed results, console errors, and any regressions before marking PASS.

Acceptance: all eight scenarios pass on desktop and mobile; any failure becomes a tracked bug before visual polish.

## Prioritized backlog (deduplicate before implementation)
- P0 [IMPLEMENTED — browser verification pending] Stable passage anchors: store section, paragraph and word offset alongside legacy percentage. Restore across font/viewport changes; server retains validated coordinates for owner-only sync.
- P1 [NEW IDEA 2] RTL-aware page-turn regression harness: automated assertions for forward/back direction, reduced motion and one-page/two-page boundary behavior.
- P1 [NEW IDEA 3 — next] Persist bookmark as its own passage anchor, not a numeric page, so bookmark survives a font/viewport change independently of read progress.
- P1 [NEW IDEA 4 — next] Add a lightweight story-text revision fingerprint to saved locators and a safe fallback when paragraphs are edited/reordered.
- P1 Verify focus-visible, keyboard-only access and live status announcements against WCAG 2.2.
- P1 Long Persian paragraph line-breaking and punctuation QA on 320–390px viewports.
- P2 Catalog metadata schema: title, author, edition, language, rights, preview availability, without checkout or payment.
- P2 Library filters for reading / finished / saved, with accessible empty states.
- P3 Cart prototype with mock data only, pending explicit approval before checkout/payment.

## Change log
- 2026-11-09: reader audit and reproducible QA checklist created; two distinct new backlog ideas recorded.
- Tests: source inspection only; browser test suite not run from connector environment.
- Public sync: documentation is safe to publish after checking the public repository path; no private data in this file.

## Execution 2 — 2026-11-09: stable passage restoration

**Scope:** One behavioral improvement: persist a stable passage anchor in addition to the existing fractional page progress. No payment, bookstore checkout, city, or author data changed.

- `web/reader-position.js`: pure lookup by `kind`, `firstPara`, `firstWord`, with 1-page/2-page spread alignment and fallback if the critic's report was removed.
- `web/book.js`: records word offset at page creation, writes anchor to local state and resumes from it; old percentage-only state remains accepted.
- **Private only:** `writer/reader_state.py` now validates and stores only bounded anchor coordinates, never arbitrary selected text. `tests/test_reader_state.py` covers round-trip, malformed input and field stripping.
- `tests/reader-position.test.mjs`: six pure unit tests for paragraph splits, reflow, RTL spread, report anchor, malformed/legacy values, and removed report.
- **Executed locally:** `node --test --experimental-default-type=module tests/reader-position.test.mjs` → **6/6 pass** (Node 22); standalone Python sanitizer smoke → 9 assertions pass.
- **Not executed:** full repository Python unittest suite, browser/device QA, actual server sync across two devices. Do not treat those as passed.
- **Manual acceptance still required:** reopen a Persian story midway through a long paragraph; change font/viewport, refresh and test owner sync. Verify the same passage is visible, not simply the same percentage.
- **Standards comparison:** [Readium locators](https://readium.org/architecture/models/locators/), [Readium RTL pagination](https://readium.org/css/docs/CSS03-injection_and_pagination.html), [WCAG 2.2 reflow/focus](https://www.w3.org/TR/wcag/).
- Operational TODO and test follow-up: [`docs/reader/TODO.md`](TODO.md).
