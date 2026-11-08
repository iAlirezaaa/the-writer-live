# MAYOR-014 — Weather regression parity and release evidence
Date: 2026-11-08
Scope: city-only, bounded test review; no runtime or citizen/author/publisher changes.

## TODO (registered before changes)
- [x] Compare private/public Tehran regression test blob and record differences.
- [x] Inspect latest available CI evidence for the earlier failed private run.
- [x] Update city release-gate skill with an executable evidence checklist.
- [x] Add exactly two new municipal backlog proposals.
- [x] Mirror reviewed documentation to public after private edits.

## Release gate
No geometry or weather-runtime change. A matching test SHA proves only source parity; passing CI, real weather fetch, screenshot and Pages deploy require independent evidence.

## Observed evidence
Private and public weather test SHA: `6142e53403f29ae2ffcd61869c2fae07d7fc8ca5`. Private run 42512547908 / job 128828543540: failure. Public run 42512570666 / job 128828613407: success. Private job log retrieval: 404 BlobNotFound, cause unknown. No Node execution, live browser fetch or visual QA performed. Public Pages success is historical and does not certify these documentation commits.

Private skill commit `79b8e531187d1a9326272f54befa0bdb7042184a`; backlog commit `39a748f27c60c42c3410e1825b2993712f53e926`. No runtime release.

Public sync commits: task `66e9c54475b4e3e8aaeb2c123dc5219fcd701b60`, skill `f16c264f6e20fbf249193eb078f032262857bbe8`, backlog `ce4a426ff2d3e2cfad701cb67751c3ee75145c64`. All three documentation files mirrored; runtime remains unchanged.
