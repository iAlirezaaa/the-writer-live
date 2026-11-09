"""Static regression guard for the public reader keyboard-focus styling.

Run: python -m unittest tests.test_reader_focus_css -v
"""
from pathlib import Path
import re
import unittest

CSS = Path(__file__).resolve().parents[1] / "web" / "book.css"


class ReaderFocusCssTests(unittest.TestCase):
    def test_keyboard_focus_rule_covers_core_controls(self):
        css = CSS.read_text(encoding="utf-8")
        match = re.search(
            r"\.book-overlay\s+:is\(([^)]*)\):focus-visible\s*\{([^}]*)\}",
            css,
        )
        self.assertIsNotNone(match, "Missing reader-wide :focus-visible rule")
        controls = {part.strip() for part in match.group(1).split(",")}
        self.assertTrue({"button", "input", "select", "summary"} <= controls)
        self.assertRegex(match.group(2), r"outline\s*:\s*3px\s+solid\s+#[0-9a-fA-F]{6}")
        self.assertRegex(match.group(2), r"outline-offset\s*:\s*3px")

    def test_progress_focus_is_not_hidden(self):
        css = CSS.read_text(encoding="utf-8")
        self.assertRegex(
            css,
            r"\.book-overlay\s+\.book-progress:focus-visible\s*\{\s*outline-offset:\s*5px;",
        )


if __name__ == "__main__":
    unittest.main()
