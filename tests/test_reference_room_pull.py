"""Regression checks for a freshly pulled private repository without room.json.gz."""
from pathlib import Path
from http.server import ThreadingHTTPServer
from unittest import TestCase, mock
import hashlib
import io
import json
import tempfile
import threading
import urllib.error
import urllib.request
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "tools"))
from materialize_reference_room import materialize
from stage_reference_room import canonical_html
import serve_reference_room


class PulledReaderTests(TestCase):
    def fixture(self, directory, data=b"public-visual-only-sample"):
        base = Path(directory) / "web/reference-room/data"
        base.mkdir(parents=True)
        manifest = {
            "asset_bytes": len(data),
            "asset_sha256": hashlib.sha256(data).hexdigest(),
            "asset_url": (
                "https://raw.githubusercontent.com/iAlirezaaa/the-writer-live/"
                + "a" * 40 + "/web/reference-room/data/room.json.gz"
            ),
        }
        (base / "room-manifest.json").write_text(json.dumps(manifest))
        return base / "room.json.gz"

    def test_missing_binary_is_downloaded_and_verified_exactly_once(self):
        with tempfile.TemporaryDirectory() as temp:
            expected = b"sample approved scene"
            target = self.fixture(temp, expected)
            requests = []
            def urlopen(url, timeout):
                requests.append((url, timeout))
                return io.BytesIO(expected)
            self.assertEqual(materialize(temp, urlopen=urlopen), target)
            self.assertEqual(target.read_bytes(), expected)
            self.assertEqual(len(requests), 1)
            self.assertEqual(
                materialize(temp, urlopen=lambda *a, **kw: self.fail("download repeated")),
                target,
            )

    def test_failed_checksum_does_not_replace_previous_file(self):
        with tempfile.TemporaryDirectory() as temp:
            target = self.fixture(temp, b"correct scene")
            target.write_bytes(b"old corrupt scene")
            with self.assertRaisesRegex(ValueError, "size/SHA-256"):
                materialize(temp, urlopen=lambda *args, **kw: io.BytesIO(b"wrong"))
            self.assertEqual(target.read_bytes(), b"old corrupt scene")

    def test_offline_error_is_actionable(self):
        with tempfile.TemporaryDirectory() as temp:
            self.fixture(temp)
            def fail(*a, **kw):
                raise OSError("network unreachable")
            with self.assertRaisesRegex(RuntimeError, "materialize_reference_room.py"):
                materialize(temp, urlopen=fail)

    def test_pulled_canonical_reader_has_the_real_3d_room_modules(self):
        html = canonical_html()
        self.assertIn('name="reader-mode" content="reference-empty"', html)
        self.assertIn('src="../web/reference-room/room.js?', html)
        self.assertIn('href="../web/reference-room/room.css?', html)
        self.assertNotIn('<iframe', html)
        self.assertIn('id="cabinet-next"', html)

    def test_safe_preview_routes_room_without_exposing_private_files(self):
        with mock.patch.object(serve_reference_room, "materialize", return_value=Path("approved")):
            server = ThreadingHTTPServer(("127.0.0.1", 0), serve_reference_room.PreviewHandler)
            thread = threading.Thread(target=server.serve_forever, daemon=True)
            thread.start()
            base = "http://127.0.0.1:" + str(server.server_address[1])
            try:
                with urllib.request.urlopen(base + "/read/") as response:
                    html = response.read().decode("utf-8")
                    self.assertEqual(response.status, 200)
                    self.assertIn('id="room"', html)
                    self.assertIn('src="../web/reference-room/room.js?', html)
                with urllib.request.urlopen(base + "/web/reference-room/room.js") as response:
                    self.assertEqual(response.status, 200)
                with self.assertRaises(urllib.error.HTTPError) as e:
                    urllib.request.urlopen(base + "/data/admin_token.txt")
                self.assertEqual(e.exception.code, 404)
                with self.assertRaises(urllib.error.HTTPError) as e:
                    urllib.request.urlopen(base + "/reader/")
                self.assertEqual(e.exception.code, 503)
            finally:
                server.shutdown()
                server.server_close()
                thread.join(timeout=3)


if __name__ == "__main__":
    import unittest
    unittest.main()
