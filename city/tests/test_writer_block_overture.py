"""Offline unit test: no cloud call, no invented real building heights."""
import importlib.util
import json
import pathlib
import unittest

ROOT=pathlib.Path(__file__).resolve().parents[2]
spec=importlib.util.spec_from_file_location("writer_block_overture",
    ROOT/"city/survey/acquire-writer-block-overture.py")
mod=importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)
SURVEY=json.loads((ROOT/"city/survey/output/writer-block-survey.json").read_text("utf8"))

def quad(lon,lat,delta=.00002):
    return [[lon-delta,lat-delta],[lon+delta,lat-delta],
            [lon+delta,lat+delta],[lon-delta,lat+delta],[lon-delta,lat-delta]]

def feature(key, coords, height=None):
    return {"type":"Feature","id":key,"geometry":{
      "type":"Polygon","coordinates":[coords]},
      "properties":{"id":key,"height":height,"sources":[{"dataset":"test-fixture"}]}}
class WriterBlockOvertureUnit(unittest.TestCase):
    def test_one_inside_and_one_outside(self):
        raw={"type":"FeatureCollection","features":[
          feature("inside-01",quad(mod.HOME_LON,mod.HOME_LAT)),
          feature("outside-01",quad(mod.HOME_LON+.01,mod.HOME_LAT+.01),20)]}
        d=mod.process(raw,SURVEY,"2026-11-09T00:00:00Z","synthetic-test-fixture")
        self.assertEqual(d["counts"]["inBlock"],1)
        self.assertEqual(d["counts"]["knownSourceHeight"],0)
        self.assertEqual(d["buildings"][0]["id"],"inside-01")
        self.assertIsNone(d["buildings"][0]["heightMetersSource"])
        self.assertLess(d["buildings"][0]["areaSquareMeters"],40)
        self.assertEqual(d["blockBoundary"]["status"],"OSM_CENTERLINE_CANDIDATE")
    def test_height_source_or_null(self):
        raw={"type":"FeatureCollection","features":[
          feature("height-01",quad(mod.HOME_LON,mod.HOME_LAT),14.8)]}
        d=mod.process(raw,SURVEY,"2026-11-09T00:00:00Z","synthetic-test-fixture")
        self.assertEqual(d["buildings"][0]["heightMetersSource"],14.8)
    def test_fail_closed_on_wrong_boundary(self):
        changed=json.loads(json.dumps(SURVEY))
        changed["homeAnchor"]["lon"]+=.001
        with self.assertRaises(ValueError):mod.survey_block(changed)
        changed=json.loads(json.dumps(SURVEY))
        changed["blockBoundary"]["status"]="UNKNOWN"
        with self.assertRaises(ValueError):mod.survey_block(changed)
    def test_reject_wrong_format(self):
        with self.assertRaises(ValueError):mod.process({"features":[]},SURVEY,
            "2026-11-09T00:00:00Z","fixture")
if __name__=="__main__": unittest.main()
