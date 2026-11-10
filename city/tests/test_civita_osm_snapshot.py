"""Offline Civita OSM map XML conversion regression. No external requests."""
from pathlib import Path
import importlib.util
import json
import tempfile
import unittest

PATH = Path(__file__).resolve().parents[1] / "survey" / "build_civita_osm_snapshot.py"
SPEC = importlib.util.spec_from_file_location("civita_snapshot", PATH)
SOURCE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(SOURCE)
XML = b"""<?xml version="1.0"?><osm version="0.6">
<node id="1" lat="42.62761" lon="12.11361" />
<node id="2" lat="42.62761" lon="12.11371" />
<node id="3" lat="42.62771" lon="12.11371" />
<node id="4" lat="42.62771" lon="12.11361" />
<way id="881" timestamp="2026-10-05T09:00:00Z">
 <nd ref="1"/><nd ref="2"/><nd ref="3"/><nd ref="4"/><nd ref="1"/>
 <tag k="building" v="yes"/><tag k="name" v="Do not copy this"/>
</way>
<way id="993"><nd ref="1"/><nd ref="2"/><tag k="highway" v="footway"/></way>
<way id="994"><nd ref="1"/><nd ref="55"/><tag k="highway" v="steps"/></way>
</osm>"""

class SnapshotTests(unittest.TestCase):
    def test_way_footprint_and_provenance(self):
        data=SOURCE.convert(XML, acquired_at="2026-11-10T09:00:00+00:00")
        self.assertEqual(len(data["elements"]),2)
        self.assertEqual([e["id"] for e in data["elements"]],[881,993])
        self.assertEqual(len(data["elements"][0]["geometry"]),5)
        self.assertEqual(data["elements"][0]["timestamp"],"2026-10-05T09:00:00Z")
        self.assertNotIn("name",data["elements"][0]["tags"])
        self.assertEqual(data["source"]["ways_without_full_nodes"],1)
        self.assertEqual(data["source"]["license"],"ODbL-1.0")
        self.assertEqual(data["source"]["crs"],"EPSG:4326")
        json.dumps(data)
    def test_empty_and_broken_data_are_rejected(self):
        with self.assertRaises(ValueError):
            SOURCE.convert(b"<osm version='0.6'/>", acquired_at="test")
        with self.assertRaises(ValueError):
            SOURCE.convert(b"<html/>", acquired_at="test")
        with self.assertRaises(Exception):
            SOURCE.convert(b"not xml", acquired_at="test")
    def test_no_bulk_map_and_strict_bounds(self):
        self.assertEqual(len(SOURCE.BBOX),4)
        self.assertLess((SOURCE.BBOX[2]-SOURCE.BBOX[0])*(SOURCE.BBOX[3]-SOURCE.BBOX[1]),.00001)
        self.assertIn("api.openstreetmap.org/api/0.6/map?",SOURCE.API_URL)

if __name__=="__main__":
    unittest.main()
