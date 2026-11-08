# MAYOR-013 — Tehran weather staleness audit
Date: 2026-11-08
Scope: documentation-only city release gate; no runtime, resident, author or publisher changes.

## TODO (registered before changes)
- [x] Audit current Tehran clock/weather source, timestamp parsing and stale-data fallback.
- [x] Document a reproducible test matrix and failure gates in `city/skills/mayor-release-gate/SKILL.md`.
- [x] Add two distinct backlog proposals in `city/TODO.md`.
- [x] Mirror reviewed city documentation only to the public repository.
- [x] Record observed evidence, unexecuted tests and commit references without claiming deployment.

## Acceptance
No runtime publication. `Asia/Tehran` must govern clock and midnight rollover; provider response freshness and outage handling must remain explicit. Real-network/browser and Pages status are separate gates.

## Evidence
Private weather module and two public copies share blob `b4c23c71328a3838d30facbec998e96530a6ea45` (read-only comparison). Existing `tests/tehran_environment_probe.mjs` inspected, NOT EXECUTED. Browser network, physical layout probes, screenshots and latest Pages deployment NOT VERIFIED. Runtime release prohibited in this iteration.

Private changes: skill `b55ac3d7cc20e82943edbc948aae1aa6b1b11fad`; backlog `ad0431688c3636848950626fbc1563082f8f3e6d`. Public documentation sync pending until confirmed separately.

Public sync commits: task `3538d934caa1c49d99476f27ed63d87b5ddc5fd0`, skill `566bf80b52dcc8c0238644c53b17acc9f7b20d03`, backlog `d7a750579883ff4fcb9028fa3860e671037f514a`. Documentation-only scope complete; executable QA remains pending.
