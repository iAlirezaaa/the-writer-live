# Reader feedback bridge — GitHub Pages to private LMDB (2026-11-08)

This document describes the boundary between the **public static reader** and the **private author engine**. Do not publish the private LMDB files, author memory, unpublished manuscripts, owner tokens, or reader fingerprints.

## Public reader (the-writer-live)

- Each story, not the library home, has its own like/dislike and commentary/selected-text annotation controls.
- GitHub Pages is a static site and **cannot write directly to LMDB**.
- On GitHub Pages, voting opens a prefilled public GitHub Issue. The visitor must be signed into GitHub and explicitly submit it. Opening the form alone does not register a vote.
- The issue's actual platform user ID is the only voter identity trusted by the private importer. The issue body and selected quotations are untrusted user-supplied content.
- When the reader is hosted by the private server instead of Pages, `POST /api/stories/<id>/votes` uses a rate-limited pseudonymous voter key.

## Private writer (the-writer)

- `writer/feedback_import.py` requests public issues and extracts votes only from supported structured forms.
- `writer/feedback_learning.py` records the effective vote per reader in LMDB and tracks reversible changes atomically.
- `writer/memory_index.py` manages the LMDB environment. It stores structured, bounded memory excerpts and votes, not the full original novel archive.
- `tools/maintain.py --job reader_feedback` is a periodic **host-side** import; no background GitHub Pages job writes to a private database.
- Five distinct effective voters and a capped confidence weight are prerequisites before aggregated reactions inform the author's writing prompt. Votes are preferences, not objectively measured literary quality.
- The publisher's hard integrity gates and the independent writer/publisher constitutional rules cannot be overridden by applause, negative comments, or public issue instructions.

## Operations

To enable the LMDB private engine, run on the author host:

```sh
python -m pip install -r requirements.txt
python tools/migrate_memory_to_lmdb.py
python tools/migrate_memory_to_lmdb.py --apply
python tools/maintain.py --job memory_index --job reader_feedback
```

The old SQLite database, if any, is retained read-only and checkpointed before migration. Production code uses LMDB; only the explicit migration helper reads SQLite. Database files and backups stay private, outside the public GitHub Pages build. A green public Pages workflow confirms static UI deployment **only**, not installation or successful migration on the private host.
