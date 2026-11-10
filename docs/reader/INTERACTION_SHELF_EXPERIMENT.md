# Removable reader bookshelf mode

The public Reader catalog now has a third **قفسهٔ تعاملی** button beside **جلدی** and **فهرستی**. It reuses the *same approved public stories*, Persian search, filters, favorites, reading progress and reader overlay.

The new design references https://library.jjangik.kr/ as interaction inspiration; no third-party files, artwork or packages are copied. Its only dedicated visual module is `web/interaction-library/reader-shelf.css`, pinned identically in `.github/reader-assets/reader-shelf.css`. The book opening delay (260ms) exists only in that opt-in view and is skipped for `prefers-reduced-motion`.

Rollback: remove the third button and stylesheet link in `read/index.html` and `.github/reader-assets/read.html`, remove only the `shelf` path from `web/read.js` and `.github/reader-assets/read.js`, delete the two dedicated CSS files, and remove CSS copy/validation lines from `.github/workflows/pages.yml` and `.github/scripts/prepare_reader_deploy.py`. Do not touch the story data, 15 observatory panels, 10 cameras, RTL dates or public privacy controls.

Verification evidence: 11 source-backed V8 DOM-mock tests passed privately; no browser interaction or deployment is claimed until verified.


## 2026-11-10 — Spine-first shelf v2

- Move the former cinematic cabinet/front-facing books to the **جلدی** button. The **قفسهٔ تعاملی** button now groups narrow physical spines, varied book heights/widths, repeated wooden ledges and responsive Persian vertical titles. All covers and favorite/progress data still belong to the original story cards.
- Hover/focus extracts a book; activation pulls it forward, rotates/reveals its full designed cover and then opens the same original reader in 540ms. Motion preferences skip animation and delay completely. Duplicate clicks are ignored while opening.
- Implemented only in the removable `web/interaction-library/reader-shelf.css`, pinned Pages counterpart, `read.js` and paired HTML versions. No new API, library, image resources, backend or public/private story-content transfer.
- Private source-backed V8 DOM-mock regression: 12/12 checks passed, including actual per-story spine titles and existing grid/list/favorites; **not browser testing**. Private GitHub CI runner reports failure without job steps/logs, so the cause is undetermined.
- Reviewer must verify actual narrow/mobile spines, readable titles, cover extraction, focus/favorites and Pages deployment before claiming browser signoff.


## 2026-11-10 — immersive room & continuous notebook handoff (v4)

Reference https://library.jjangik.kr/ uses a 3D room, notebook spines, floating previews and a camera-to-live-sample transition (Three.js, custom shaders, GSAP). The Writer's **independently written** lightweight interpretation is deliberately restricted to the opt-in \`قفسهٔ تعاملی\` view. It is not a copy of the reference source/artwork, nor a pixel-exact or WebGL-identical rebuild.

- Scenic window, wooden bookcase, lamp, decorative clock displaying Persian local time, daytime/evening light.
- On hover/focus: an accessible real-story book and a visual tooltip sample, with no extra data request.
- On selection: lazy-load \`web/interaction-library/reader-shelf-room.js\`, use a native dialog and a geometry-derived FLIP camera move to a two-page notebook. On phones use a one-column spread; Escape/return closes and restores focus.
- On \`باز کردن و مطالعه\`: hand off to the **existing** book reader with stored progress, favorites and all publication safeguards. Reduced motion skips all staging animation.
- Self-contained scene styles in \`web/interaction-library/reader-shelf.css\`. CSS grid supplies as many shelf rows as the filtered catalog needs, and the default \`جلدی\` / \`فهرستی\` modes do not import the optional animation module.
- Tests cover 0,1,5,12,50,200 book records and three switchable modes; public Pages copies pinned CSS, JS and HTML and the separately pinned animation module before checks.
- Rollback: delete optional room module and associated pinned file, revert only \`library-room\` wrapper and \`shelf\` branch in the two paired HTML/JS files, remove the appended v4 styles, restore prior cache guards/pin copy. Preserve all story data.

Status: private source-backed V8 DOM test 14/14 passed; public CI, Pages deployment and real browser visual fidelity must be verified separately. Do not call the visual replica exact.
