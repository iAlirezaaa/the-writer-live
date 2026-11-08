#!/usr/bin/env python3
"""Protect the shipped reader UI against the old local snapshot publisher.

The external snapshot process may overwrite public root files with an older
worktree. The approved reader assets live under .github/reader-assets,
which that publisher does not stage. This script only patches the transient
GitHub Pages artifact (_site), not the source, stories, or user data.
"""
from pathlib import Path
import re
import sys


VERSION = "reader-20261108-v4"


def patch_site(root: Path) -> None:
    web = root / "web"
    book = (web / "book.js").read_text(encoding="utf-8")
    cover = (web / "book-cover.js").read_text(encoding="utf-8")
    reader = (web / "read.js").read_text(encoding="utf-8")
    css = (web / "book.css").read_text(encoding="utf-8")
    html = (root / "read" / "index.html").read_text(encoding="utf-8")
    if not all([
        "createCoverArt" in book,
        f'./book-cover.js?v={VERSION}' in book,
        "export function coverVisual" in cover,
        "makeCover(" in reader,
        f'./book.js?v={VERSION}' in reader,
        "Reading experience v2" in css,
        "Reading room v4: definitive RTL viewport grid fix" in css,
        "grid-template-rows:max-content minmax(0,1fr) max-content" in css,
        'font-family: "Vazir"' in css,
        '"vazir-classic"' in book,
        '"turn turn-prev", "→"' in book,
        '"turn turn-next", "←"' in book,
        "read.js?v=observatory-20261108-v2" in html,
        "persian-display.js?v=observatory-20261108-v2" in reader,
        "overlay.dataset.readerTheme" in book,
    ]):
        raise RuntimeError("Reader deployment assets are incomplete or stale")

    # The shared world camera opens the same reader overlay. The build step
    # updates its book import without touching other interactions.
    world_file = web / "world.js"
    world = world_file.read_text(encoding="utf-8")
    world, count = re.subn(
        r'from "\./book\.js(?:\?v=[^"]+)?"',
        f'from "./book.js?v={VERSION}"', world
    )
    if count != 1:
        raise RuntimeError("Expected one 3D-world reader import")
    world_file.write_text(world, encoding="utf-8")

    # On the public landing page, force the current CSS after automatic sync.
    index_file = root / "index.html"
    index = index_file.read_text(encoding="utf-8")
    index, count = re.subn(
        r'href="\./web/book\.css(?:\?v=[^"]+)?"',
        f'href="./web/book.css?v={VERSION}"', index, count=1
    )
    if count != 1:
        raise RuntimeError("Cannot locate public reading stylesheet")
    # The dashboard 3D book object shares this new reading engine. Force a
    # new entrypoint URL so older browser caches cannot keep its old importer.
    index, count = re.subn(
        r'src="\./web/world\.js(?:\?v=[^"]+)?"',
        f'src="./web/world.js?v={VERSION}"', index, count=1
    )
    if count != 1:
        raise RuntimeError("Cannot locate the dashboard world script")
    index_file.write_text(index, encoding="utf-8")
    print("Reader deployment: stable cover art, responsive reading room and fresh assets OK")


if __name__ == "__main__":
    patch_site(Path(sys.argv[1]) if len(sys.argv) > 1 else Path("_site"))
