"""Run: python3 -m unittest tools/jb-haze/test_jb_haze.py  (or python3 tools/jb-haze/test_jb_haze.py)"""
import os
import sys
import unittest
from datetime import datetime, timezone

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import fetch  # noqa: E402
import news_rules as nr  # noqa: E402


def cls(title, desc="", indo=False):
    return nr.classify({"title": title, "description": desc, "source_indonesian": indo})


class Classify(unittest.TestCase):
    def test_not_haze_dropped(self):
        self.assertIsNone(cls("Johor budget tabled in state assembly"))

    def test_impact(self):
        self.assertEqual(cls("Haze worsens in Johor Bahru, 23 stations Unhealthy"), "impact")
        self.assertEqual(cls("Jerebu: IPU Pasir Gudang cecah tahap tidak sihat"), "impact")

    def test_govt(self):
        self.assertEqual(cls("Minister: schools closed in Johor as haze worsens"), "govt")
        self.assertEqual(cls("DOE issues compound for open burning in Kedah"), "govt")
        self.assertEqual(cls("Kementerian umum penutupan sekolah akibat jerebu"), "govt")

    def test_indonesia(self):
        self.assertEqual(cls("Riau fire crews battle peat fires as haze spreads"), "indonesia")
        self.assertEqual(cls("Kebakaran hutan dan lahan di Kalimantan", indo=True), "indonesia")
        self.assertEqual(cls("Penanganan karhutla dipercepat", indo=True), "indonesia")

    def test_indonesia_source_always_indonesia_tab(self):
        self.assertEqual(cls("Malaysian minister meets counterpart over haze", indo=True), "indonesia")

    def test_govt_and_my_beats_indonesia_mention(self):
        self.assertEqual(cls("Malaysia minister sends diplomatic note to Indonesia over haze"), "govt")

    def test_singapore_only_dropped(self):
        self.assertIsNone(cls("PSI hits unhealthy range as NEA warns of haze in Singapore"))
        self.assertEqual(cls("Singapore and Johor haze: Causeway queues grow"), "impact")

    def test_malaysian_outlet_default_impact(self):
        self.assertEqual(cls("Visibility drops sharply in the haze"), "impact")


class Organise(unittest.TestCase):
    NOW = datetime(2026, 10, 12, 12, 0, tzinfo=timezone.utc)

    def item(self, title, link, pub, **kw):
        d = {"title": title, "description": "", "link": link, "source": "X", "lang": "en",
             "published": pub, "source_indonesian": False}
        d.update(kw)
        return d

    def test_dedupe_link_and_title(self):
        items = [
            self.item("Haze worsens across Johor", "https://a.example/1?utm=1", "2026-10-12T10:00:00Z"),
            self.item("Haze worsens across Johor", "https://a.example/1/", "2026-10-12T09:00:00Z"),
            self.item("Haze worsens across Johor today", "https://b.example/2", "2026-10-12T08:00:00Z"),
        ]
        out = nr.organise(items, self.NOW)
        self.assertEqual(len(out["impact"]), 1)

    def test_window_and_https(self):
        items = [
            self.item("Haze in Johor", "https://a.example/old", "2026-10-01T10:00:00Z"),
            self.item("Haze in Johor Bahru again", "http://a.example/insecure", "2026-10-12T10:00:00Z"),
            self.item("Kabut asap Riau", "https://a.example/id", "2026-10-07T10:00:00Z", source_indonesian=True),
        ]
        out = nr.organise(items, self.NOW)
        self.assertEqual(out["impact"], [])
        self.assertEqual(len(out["indonesia"]), 1)  # 5 days old, within the 7-day Indonesia window

    def test_newest_first(self):
        items = [self.item("Haze in Johor alpha", "https://a.example/a", "2026-10-11T10:00:00Z"),
                 self.item("Jerebu teruk di Perak kini", "https://a.example/b", "2026-10-12T10:00:00Z")]
        out = nr.organise(items, self.NOW)
        self.assertTrue(out["impact"][0]["u"].endswith("/b"))


class Datetimes(unittest.TestCase):
    def test_epoch_ms_is_myt_wall_clock(self):
        # 1791828000000 ms reads 18:00 as UTC clock fields; label as MYT without shifting.
        d = fetch.epoch_ms_to_myt(1791828000000)
        self.assertEqual(fetch.iso_myt(d), "2026-10-12T18:00:00+08:00")
        self.assertEqual(d.hour, 18)

    def test_trend_string_already_myt(self):
        d = fetch.trend_str_to_myt("2026-10-11T18:00:00")
        self.assertEqual(fetch.iso_myt(d), "2026-10-11T18:00:00+08:00")


class CarryForward(unittest.TestCase):
    def latest(self, api, ts):
        return {"readingTime": "2026-10-12T20:00:00+08:00", "stations": [{"id": "CA33J", "api": api, "ts": ts}]}

    def test_late_station_keeps_last_reading(self):
        new = self.latest(None, None)
        fetch.carry_forward(new, self.latest(164.0, "2026-10-12T19:00:00+08:00"))
        self.assertEqual(new["stations"][0]["api"], 164.0)
        self.assertEqual(new["stations"][0]["ts"], "2026-10-12T19:00:00+08:00")

    def test_old_reading_is_not_kept(self):
        new = self.latest(None, None)
        fetch.carry_forward(new, self.latest(164.0, "2026-10-12T15:00:00+08:00"))
        self.assertIsNone(new["stations"][0]["api"])

    def test_fresh_reading_wins(self):
        new = self.latest(170.0, "2026-10-12T20:00:00+08:00")
        fetch.carry_forward(new, self.latest(164.0, "2026-10-12T19:00:00+08:00"))
        self.assertEqual(new["stations"][0]["api"], 170.0)


class History(unittest.TestCase):
    def test_merge_shifts_window_and_keeps_gaps(self):
        meta = [{"id": "CA33J", "name": "Larkin", "lat": 1.49, "lng": 103.73, "category": "Urban", "jb": True}]
        latest = {"stations": [{"id": "CA33J", "ts": "2026-10-12T18:00:00+08:00", "api": 164, "pm25": 146.4}]}
        prev = {"start": "2026-10-09T19:00:00+08:00", "hours": 72,
                "stations": {"CA33J": {"api": [100] + [None] * 70 + [150], "pm25": [None] * 72}}}
        h = fetch.merge_history(prev, latest, [("CA33J", fetch.trend_str_to_myt("2026-10-12T17:00:00"), 160)])
        s = h["stations"]["CA33J"]
        self.assertEqual(len(s["api"]), 72)
        self.assertEqual(s["api"][-1], 164)
        self.assertEqual(s["api"][-2], 160)
        self.assertEqual(s["pm25"][-1], 146.4)
        self.assertIsNone(s["api"][10])


class Parse(unittest.TestCase):
    def test_rh_zero_is_missing_and_no_personal_fields(self):
        meta = [{"id": "CA29J", "name": "Segamat", "lat": 2.49, "lng": 102.86, "category": "Sub Urban", "jb": False}]
        payload = {"features": [{"attributes": {"STATION_ID": "CA29J", "DATETIME": 1791828000000, "API": 96.0,
                                                "RELATIVE_HUMIDITY": 0.0, "OP_PHONE": "x"}}]}
        out = fetch.parse_latest(payload, meta)
        self.assertIsNone(out["stations"][0]["rh"])
        self.assertNotIn("OP_PHONE", str(out))
        self.assertNotIn("*", fetch.OUT_FIELDS)

    def test_region_counts(self):
        regs = fetch.load_regions()
        self.assertEqual(fetch.region_of(1.5, 103.7, regs), "johor")
        self.assertEqual(fetch.region_of(0.5, 101.5, regs), "riau")
        self.assertEqual(fetch.region_of(-2.5, 112.0, regs), "kalteng")


if __name__ == "__main__":
    unittest.main()
