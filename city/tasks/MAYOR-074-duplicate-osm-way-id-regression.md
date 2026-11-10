# MAYOR-074 — Duplicate OSM way identity regression

Status: TODO registered before code (2026-11-10).

Scope: one offline regression for repeated OSM way IDs in the bounded source converter. No renderer, geometry, writer room, citizen, Tehran backup, or pinned Pages changes.

Acceptance: a fixture containing two building ways with the same OSM way ID but conflicting versions must not silently be treated as two independent buildings. Record observed behavior; do not claim a production fix unless converter behavior is changed and validated. Run offline test if possible, report results accurately. Private first; publish only reviewed safe test and documentation. Two backlog ideas and learning in city skill.
