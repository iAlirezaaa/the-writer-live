#!/usr/bin/env python3
"""Standalone, safe localhost preview of the pulled 3D reference library.

Use: python tools/serve_reference_room.py --port 8788
For the full private story-reading API use: python run.py --no-heartbeat
No writer state, secrets or private filesystem paths are exposed here.
"""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlsplit
import argparse
import mimetypes

from materialize_reference_room import ROOT, materialize
from stage_reference_room import canonical_html


class PreviewHandler(SimpleHTTPRequestHandler):
    """Only explicitly public frontend paths are served from this clone."""
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def _html(self, code, text):
        body = text.encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def _missing_asset(self, error):
        message = (
            '<!doctype html><html lang="fa" dir="rtl"><meta charset="utf-8">'
            '<title>فایل صحنه پیدا نشد</title><body style="font:18px/2 system-ui;'
            'margin:12vh auto;max-width:40em;padding:16px">'
            '<h1>مدل کتابخانه هنوز دریافت نشده است</h1>'
            '<p>پس از اتصال اینترنت، این دستور را اجرا کنید:</p>'
            '<pre dir="ltr">python tools/materialize_reference_room.py</pre>'
            '<p>اگر به خوانشگر داستان‌ها نیاز دارید، پروژه را با '
            '<code>python run.py --no-heartbeat</code> اجرا کنید.</p>'
            '<small>' + __import__("html").escape(str(error)) + '</small></body></html>'
        )
        self._html(503, message)

    def do_GET(self):
        raw = unquote(urlsplit(self.path).path)
        parts = raw.split("/")
        if any(p in (".", "..") or p.startswith(".") for p in parts if p):
            return self.send_error(404)
        if raw in ("/read", "/read/", "/read/index.html"):
            try:
                materialize()
                return self._html(200, canonical_html())
            except (OSError, RuntimeError, ValueError, KeyError) as error:
                return self._missing_asset(error)
        if raw in ("/reader", "/reader/", "/reader/index.html"):
            # A static preview has no access to the private writer's stories API.
            # Don't show an empty reader and pretend the manuscripts are missing.
            return self._html(503,
                '<html lang="fa" dir="rtl"><meta charset="utf-8">'
                '<h1>برای خواندن داستان‌ها سرور نویسنده را اجرا کنید</h1>'
                '<pre dir="ltr">python run.py --no-heartbeat</pre>'
                '<a href="/read/">بازگشت به کتابخانه</a></html>')
        if raw in ("/", "/index.html"):
            self.path = "/index.html"
            return super().do_GET()
        if raw in ("/web/reference-room", "/web/reference-room/"):
            self.path = "/web/reference-room/index.html"
            return super().do_GET()
        if raw.startswith("/web/") and not raw.endswith("/"):
            if raw == "/web/reference-room/data/room.json.gz":
                try:
                    materialize()
                except (OSError, RuntimeError, ValueError, KeyError) as error:
                    return self._missing_asset(error)
            return super().do_GET()
        if raw.startswith("/snapshot/") and not raw.endswith("/"):
            # Only files in the already-authorized public snapshot directory.
            return super().do_GET()
        return self.send_error(404)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, default=8788)
    parser.add_argument("--host", choices=["127.0.0.1", "localhost"], default="127.0.0.1")
    args = parser.parse_args()
    try:
        materialize()
    except (OSError, RuntimeError, ValueError, KeyError) as error:
        print("Reference-room asset unavailable:", error)
        print("Run: python tools/materialize_reference_room.py")
        raise SystemExit(1)
    address = (args.host, args.port)
    with ThreadingHTTPServer(address, PreviewHandler) as server:
        print(f"3D library preview: http://{args.host}:{args.port}/read/")
        print("For real reading and the writer API, run: python run.py --no-heartbeat")
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass


if __name__ == "__main__":
    main()
