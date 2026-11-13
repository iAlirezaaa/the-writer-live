#!/usr/bin/env python3
"""Install the immutable, public *visual-only* room asset into a private clone.

The binary is intentionally absent from private Git; do not upload it to the
private repository or any secret-bearing export. The URL is pinned to a public
commit and every downloaded byte is checked before atomic installation.
"""
from pathlib import Path
import hashlib
import json
import os
import re
import tempfile
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
_PUBLIC_ASSET_URL = re.compile(
    r"^https://raw\.githubusercontent\.com/iAlirezaaa/the-writer-live/"
    r"[0-9a-f]{40}/web/reference-room/data/room\.json\.gz$"
)


def materialize(root=ROOT, *, urlopen=None):
    """Return a verified asset path; fetch it once if absent or corrupted.

    An invalid local copy is never served. Failed downloads leave the existing
    file untouched, and another run can safely retry. Caller chooses whether
    to stop startup or show a useful error instead of a blank canvas.
    """
    root = Path(root)
    directory = root / "web/reference-room/data"
    lock = json.loads((directory / "room-manifest.json").read_text(encoding="utf-8"))
    target = directory / "room.json.gz"
    expected_size = int(lock["asset_bytes"])
    expected_hash = lock["asset_sha256"]
    if expected_size <= 0 or not re.fullmatch(r"[a-f0-9]{64}", expected_hash):
        raise ValueError("Invalid reference-room asset manifest")

    def valid(data):
        return len(data) == expected_size and hashlib.sha256(data).hexdigest() == expected_hash

    if target.is_file() and valid(target.read_bytes()):
        return target
    url = lock["asset_url"]
    if not _PUBLIC_ASSET_URL.fullmatch(url):
        raise ValueError("Unexpected reference-room asset host or unpinned URL")
    opener = urlopen or urllib.request.urlopen
    try:
        with opener(url, timeout=30) as response:
            data = response.read(expected_size + 1)
    except (OSError, TimeoutError) as error:
        raise RuntimeError(
            "The 3D library asset is not bundled with the private Git clone. "
            "Connect to the internet once and run: python tools/materialize_reference_room.py"
        ) from error
    if not valid(data):
        raise ValueError("Downloaded 3D library asset failed the size/SHA-256 check")
    fd, name = tempfile.mkstemp(prefix=".room-", dir=directory)
    try:
        with os.fdopen(fd, "wb") as stream:
            stream.write(data)
        os.replace(name, target)
    finally:
        if os.path.exists(name):
            os.unlink(name)
    return target


def main():
    target = materialize()
    print("REFERENCE-ROOM-READY", target, hashlib.sha256(target.read_bytes()).hexdigest())


if __name__ == "__main__":
    main()
