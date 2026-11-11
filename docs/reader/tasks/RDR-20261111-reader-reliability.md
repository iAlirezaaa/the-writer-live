# Reader interaction and motion reliability — 2026-11-11

Status: implementation committed; real-browser CI and public promotion pending. Private base: `fd8328f60edd2973538e4d8bae255cc58c76983a`; implementation: `e60485213ce620b4532ccd240bae4ac5763c3609`.

## Scope and acceptance

- [x] Reproduce and fix reader session/navigation failures, shelf keyboard/focus loss, and interrupted opening/closing animation cleanup.
- [x] Preserve the current single bookcase, RTL reading, approved public publication labels, public story snapshot, and unrelated city/author files.
- [ ] Verify actual desktop/mobile browser behavior, default/reduced motion, delayed loads, search, bookmark/reflow, closing and returning to the shelf.
- [x] Run focused existing reader regressions and add behavior coverage for repaired failures.
- [ ] Commit private source first; mirror only reviewed public reader assets/tests; update the live manifest and verify the new public Pages deployment.

## Baseline

- Existing Node suites: 32/32 passing; geometry probe: passing.
- Existing static Python reader checks: 10 passing, 2 failures in `test_reader_search_landmark.py`; its word-boundary regexes are double-escaped and do not match valid markup.
- Public publication label `owner_shared` exists only in public `book.js`/`read.js`; include it in private source before mirroring.
- The current public Pages workflow deploys checked-in files directly. Historical protected reader pins are no longer part of this deployment.

## Follow-up ideas

- Add fixed-time screenshots of interrupted and resumed opening at mobile/desktop sizes to detect visible stage jumps.

## Implemented

- Session tokens prevent late story, comment, vote, owner-sync, font and paper responses from modifying a newer book. Escape and a visible shelf-return button cancel loading/opening without waiting for the network.
- The shelf-to-page stage measures the loaded reader's actual geometry, cleans up filled animation effects and hidden source books in every exit path, and supports static loading/cancellation with reduced motion. Opening lasts 1.6 seconds and closing 1 second before optional user acceleration.
- Bookmark paragraph/word anchors survive font and viewport reflow; reaching the last visible spread records completion. The private state sanitizer accepts the anchor and the current paper/motion/lamp options without storing passage text.
- Touch curls follow displacement from the finger's starting point, so a short gesture no longer turns a page merely because it began near the spine. Mouse grips preserve their physical hinge geometry.
- Search opens its settings drawer; focus stays within the reader, returns to the corresponding shelf book, and remains visible. Favorite removal, RTL arrow boundaries and fractional shelf rows retain a single keyboard tab stop.
- Story-load errors return to an interactive shelf with a visible retry message. Focus mode retains access to its settings and exit control.
- The publisher rejects uncommitted reader frontend changes before `--push` and rechecks before public Git operations. Private Pages staging uses current entrypoints and only the existing authorized public snapshot. Obsolete protected-reader pins are not used.
- Deployment checks resolve the active Pages workflow and validate the actual shipped reader, including reviewed asset hashes and the project-relative public entrypoint. Dormant historical pins no longer override these checks.

## Verification so far

- Node behavior: **73/73 passed**, including 19 reader-session, 9 stage-lifecycle, 9 shelf-focus and 4 deployment-contract cases.
- Python focused reader/state/release checks: **32/32 passed**.
- Page-curl geometry and Persian Unicode scripts: passed, including the deterministic 250-case Unicode corpus.
- Browser suite: 12 scenarios prepared for Chromium CI at 1280×900 and 375×812, normal/reduced motion, with synthetic read-only fixtures and screenshot/report artifacts. This is not yet a browser pass.
- Local Chromium could not start because the execution sandbox denied its required local socket; execution outside that sandbox is unavailable. The browser suite must run in Actions before public promotion.
- Private Actions run `43091225603` failed before executing any step (`runner_id: 0`, empty steps). The public candidate branch will provide the browser execution environment before live promotion.

## Current publication procedure

Commit private source first. Copy reviewed reader assets to public, rewrite `read/index.html` project-relative paths, update the live sync manifest to that private commit, and run the public reader checks. A `reader/**` candidate branch can run the browser suite before `main` is advanced; it does not trigger the Pages workflow. Confirm the actual new Pages run separately.
