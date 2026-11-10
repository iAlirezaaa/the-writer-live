# MAYOR-071 — Preserve OSM way versions in static Civita source

Status: TODO before code; scope one reversible metadata-only improvement.

- [ ] Add official OSM `way/@version` as nullable positive integer to the bounded static snapshot converter. Never invent a version when missing.
- [ ] Add fixture assertions for present and absent versions, including no unrelated private metadata.
- [ ] Run offline Python snapshot tests and report actual results.
- [ ] Mirror reviewed source/test/task and city skill to public repository; no pinned Pages asset changes are needed because this is build-time source metadata only.

Safety: no geometry, room, citizen, publisher, old Tehran archive, camera, or deployment settings change. OSM attribution ODbL-1.0 retained. Follow-up: compare ID/version changes without automatically updating buildings.
