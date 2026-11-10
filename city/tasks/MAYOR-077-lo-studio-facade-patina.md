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
- [ ] Source-bound surface shader/decal implemented
- [ ] Automated smoke + polygon/room regression executed
- [ ] Mirrored to public and vetted CI/Pages status
- [ ] Browser capture checked / explicitly marked unavailable
