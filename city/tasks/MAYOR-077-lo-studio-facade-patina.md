# MAYOR-077 — Lo Studio facade detail pass (tufa courses + source-documented ivy)

Status: TODO registered **before** any code changes — 2026-11-10 (Europe/Rome).

## Why this is needed
The current author-house model is made of smooth solid-color box faces and omits the dense climbing ivy visible in the Civita Institute's photos of Lo Studio. The result reads as a generic stylized 2-storey box, not a recognizable Civita facade. The Institute describes golden tufa, gray peperino, chestnut and clay tile; its own photos show ivy over facade and a vine-covered terrace. Photos are VISUAL REFERENCE ONLY, not reusable textures.

Primary source: https://www.civitainstitute.org/496/lo-studio.html
Primary photo facade/terrace: https://www.civitainstitute.org/images/medium/233.jpg
Primary photo street doors: https://www.civitainstitute.org/images/medium/234.jpg

## Exactly one feature
Add a deterministic, original procedurally-painted translucent **facade surface atlas** to the already approved author-house shell: irregular warm tufa joints/weathering and ivy clusters, with doors/windows kept uncovered. Surface overlay only; no new doors, storeys, eaves, balcony structure, steps, cliff, floors or roof geometry. This is an **interpretive facade study**, not a 1:1 survey. Use a single bounded plane and a CanvasTexture only in browsers (SSR/Node fallback invisible). Material/UV support to align a facade without reproducing copyrighted image pixels.

## Acceptance and release gate
1. Keep original 6x6m furnished writer room, entrances/click hotspot, authored character and outer structural geometry untouched.
2. Geometry parcel-boundary and location probe (actual Three.js) must still pass; decorative plane must not create an out-of-polygon vertex and must not block a physical entrance/collision.
3. Browser texture should be reproducible at fixed seed; canvas drawing optional when browser APIs unavailable. Verify surface creation, output size and exclusion masks; **browser rendering requires real screenshot QA before claiming visual success**.
4. No added Tehran geometries, private literary/personality/citizen changes, source photo downloads in website or copyrighted tracing.
5. Work private-first, mirror safe files to public, check public pinned deployment assets. Record actual tests, sha, CI/Pages and limits. Add exactly two new follow-up backlog ideas to city skill.

Checklist
- [x] TODO created before implementation
- [x] Source-bound surface shader/decal implemented
- [x] Automated smoke + polygon/room regression executed
- [x] Mirrored to public and vetted CI/Pages status
- [x] Browser capture checked / explicitly marked unavailable

## Run outcome (2026-11-10, actual evidence)
- [x] Registered first in private GitHub: `bc3d6407a87fe36dbbd8205701b2aa8d6cb7e404`.
- [x] Added **a real visible procedural stone/ivy facade surface** to the public-author-house builder, not merely prose. Two small noncolliding planes show on front and on opposite wall actually facing the default city camera; no real building survey/cadastral claim. All previously modeled structural boxes, entrance and original writer room untouched.
- [x] Source photography was visually consulted **only**, not downloaded into code, traced, or used as a redistributed texture. 768² original atlas, deterministic seed, 2 cached textures; adaptive window/door exclusion masks on front, transparent non-browser fallback.
- [x] Executed isolated JavaScript material/geometry smoke with actual GitHub module text: PASS, 39 mesh objects in a mocked Three.js interface, 2 procedural canvas images, 8,250 drawing operations, visible atlas and invisible headless fallback, existing clickable front door retained. This **is not** a browser/WebGL screenshot or a real Three.js draw.
- [x] Executed `Deploy living world` public GitHub Actions run **42823482139**, complete and **SUCCESS** for public commit `3762c10a2a2fa561b756f0758d763c11985b65fd`; checked deployment status from GitHub API, not inferred from push only.
- [x] Real Three.js `tests/civita_writer_location_probe.mjs` on Pages workflow: `CIVITA-REAL-WRITER-PARCEL-CANDIDATE-OK`, **872 vertices tested / 0 out of candidate OSM polygon**, preserved writer appearance and camera home in frame. Other CI checks completed. Bounded official source: **66 ways / 61 building polygons / 5 footpaths**; source terrain grid 97×49 model-derived (NOT a measured plateau).
- [x] Mirrored private source, regression and skills to public with identical blob SHAs. Pinned `town.js` and `objects.js` were deliberately NOT edited; the workflow copies changed `web/civita-writer-house.js` into the Pages artifact, and the new tests ran against that staged asset.
- [ ] Live-site real WebGL photographic inspection **BLOCKED** in this environment: Playwright Chromium on `https://ialirezaaa.github.io/the-writer-live/` returned `net::ERR_BLOCKED_BY_ADMINISTRATOR`. Do not claim screenshot/visual pixel validation.
- [ ] Exact historical masonry positions, vegetation spread, real terrace geometry, actual cadastral identity or measured doorway/threshold remain **unknown**; this is a clearly identified interpretive material pass, not 1:1 architectural completion.
- [x] Two follow-up items and technical learning appended in `city/skills/civita-digital-twin/SKILL.md`.

Final assessment: a visible facade detail upgrade passed geometry and release CI, but resemblance to the specific historic building and final visual QA need an authenticated street-facing capture. No Tehran/new street/citizen/author/publisher work was touched. No changes to existing scheduled tasks.
