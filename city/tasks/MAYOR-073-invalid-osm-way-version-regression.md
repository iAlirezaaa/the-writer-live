# MAYOR-073 — reject invalid OSM way revisions

Status: TODO (registered before code change), 2026-11-10.

Scope: add one offline regression test confirming zero, negative and nonnumeric OSM `way/@version` are rejected without affecting valid sourced ways. No production geometry, citizen routing, writer room, historical Tehran or Pages asset edits.

Acceptance: Python unittest passes locally if executable; invalid ways do not appear in `elements`, valid way remains, skipped count reflects invalid revisions. If no local execution, report unverified. Private-first, mirror reviewed test/task/skill to public; record actual SHAs and CI state.
