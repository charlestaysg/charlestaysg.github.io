// Smoke test for the pure helpers in app.js and the string tables. Run: node projects/jb-haze/app.test.js
'use strict';
const assert = require('assert');
const A = require('./app.js');
const S = require('./strings.js');

// bands
assert.strictEqual(A.apiBand(50).key, 'good');
assert.strictEqual(A.apiBand(51).key, 'mod');
assert.strictEqual(A.apiBand(164).key, 'unh');
assert.strictEqual(A.apiBand(200).key, 'unh');
assert.strictEqual(A.apiBand(201).key, 'vunh');
assert.strictEqual(A.apiBand(301).key, 'haz');
assert.strictEqual(A.apiBand(null).key, 'nodata');

// DOE PM2.5 sub-index: Larkin 24-h 81.07 ug/m3 -> API 164
assert.strictEqual(A.pm25ToApi(81.07), 164);
assert.strictEqual(A.pm25ToApi(12.0), 50);
// US AQI (2024 breakpoints) and NowCast
assert.strictEqual(A.pm25ToAqi(9.0).aqi, 50);
assert.strictEqual(A.pm25ToAqi(35.4).aqi, 100);
assert.strictEqual(A.nowcast([null, null, 10]), null);
assert.strictEqual(A.nowcast([20, 20, 20]), 20);
assert.ok(A.nowcast([100, 50, 20, null, 10]) > 50);

// compass and wind: direction is FROM, arrow points TO
assert.strictEqual(A.compass(225), 'SW');
assert.strictEqual(A.compass(359), 'N');
assert.strictEqual(A.windTo(225), 45);
assert.strictEqual(A.windTo(90), 270);
assert.strictEqual(A.arrowRotation(0), 180);
assert.strictEqual(A.compass(A.windTo(225)), 'NE');
assert.ok(A.fromSumatra(225) && A.fromSumatra(180) && A.fromSumatra(270));
assert.ok(!A.fromSumatra(90) && !A.fromSumatra(0));
assert.strictEqual(A.compass(225, S.STRINGS.ms.compass), 'BD');

// contrast colour
assert.strictEqual(A.textOn('#f5b400'), '#111111');
assert.strictEqual(A.textOn('#2e7dd7'), '#111111'); // 5.0:1 black beats 4.2:1 white
assert.strictEqual(A.textOn('#f0702a'), '#111111');
assert.strictEqual(A.textOn('#c8102e'), '#ffffff');

// geography
const st = [{ id: 'a', lat: 1.49, lng: 103.73, jb: true, api: 164 }, { id: 'b', lat: 2.49, lng: 102.86, jb: false, api: 200 }, { id: 'c', lat: 1.47, lng: 103.89, jb: true, api: 175 }];
assert.strictEqual(A.nearest(st, 1.5, 103.7, 1)[0].id, 'a');
assert.ok(Math.abs(A.haversine(1.49, 103.73, 1.47, 103.89) - 17.9) < 1);

// headline: worst of JB-area by default, saved station wins, then location
assert.strictEqual(A.headlineStation(st).id, 'c');
assert.strictEqual(A.headlineStation(st, { myId: 'b' }).id, 'b');
assert.strictEqual(A.headlineStation(st, { loc: { lat: 2.4, lng: 102.9 } }).id, 'b');
assert.strictEqual(A.headlineStation([]), null);

// time and series
assert.strictEqual(A.agoParts(30000).unit, 'now');
assert.deepStrictEqual(A.agoParts(5 * 60000), { unit: 'min', n: 5 });
assert.deepStrictEqual(A.agoParts(135 * 60000), { unit: 'hm', h: 2, m: 15 });
assert.strictEqual(A.agoParts(50 * 3600000).d, 2);
assert.strictEqual(A.fmtHM('2026-10-12T18:05:00+08:00'), '18:05');
assert.strictEqual(A.fmtHM('2026-10-12T10:05:00Z'), '18:05');
assert.deepStrictEqual(A.lastN([1, 2, 3], 5), [null, null, 1, 2, 3]);
const hist = { start: '2026-10-10T19:00:00+08:00', hours: 72 };
const stamps = A.hourStamps(hist, 24);
assert.strictEqual(stamps.length, 24);
assert.strictEqual(A.fmtHM(stamps[23]), '18:00');
// gaps break the line
const p = A.sparkPath([1, 2, null, 4, 5], 100, 20);
assert.strictEqual((p.match(/M/g) || []).length, 2);
assert.strictEqual(A.sparkPath([null, null], 10, 10), '');

// hotspot mode: missing, wms, stale -> wms; fresh points -> points
const now = Date.parse('2026-10-12T12:00:00Z');
assert.strictEqual(A.hotspotMode(null, now), 'wms');
assert.strictEqual(A.hotspotMode({ mode: 'wms', generated: '2026-10-12T11:00:00Z', points: [] }, now), 'wms');
assert.strictEqual(A.hotspotMode({ mode: 'points', generated: '2026-10-10T11:00:00Z', points: [] }, now), 'wms');
assert.strictEqual(A.hotspotMode({ mode: 'points', generated: '2026-10-12T11:00:00Z', points: [] }, now), 'points');
assert.strictEqual(A.filterHotspots([[0, 0, 'h'], [0, 0, 'n']], 'high').length, 1);
assert.strictEqual(A.hhmm('0645'), '06:45');

// US AQI from DOE 24-h PM2.5 (EPA 2024 breakpoints)
// 81.07 -> 81.0; (200-151)/(125.4-55.5)*(81.0-55.5)+151 = 168.88 -> 169, "unh"
assert.strictEqual(A.usAqiFor({ pm25_24h: 81.07 }).aqi, 169);
assert.strictEqual(A.usAqiFor({ pm25_24h: 81.07 }).key, 'unh');
assert.strictEqual(A.usAqiFor({ pm25_24h: 40 }).aqi, 112);
assert.strictEqual(A.usAqiFor({ pm25_24h: 40 }).key, 'usg');
assert.strictEqual(A.pm25ToApi(81.07), 164);
assert.strictEqual(A.pm25ToApi(40), 112);
assert.strictEqual(A.usAqiFor({ pm25_24h: null }), null);
assert.strictEqual(A.usAqiFor({}), null);
assert.strictEqual(A.usAqiFor(null), null);

// NowCast US AQI: steady series equals the plain conversion; a rising spike beats the 24-h based figure
const steady = Array(12).fill(20);
assert.strictEqual(A.nowcastAqi(steady, 20).aqi, A.pm25ToAqi(20).aqi);
const spike = [20, 20, 20, 20, 20, 20, 20, 20, 25, 40, 70, 100]; // oldest first
const spikeSt = { pm25: 100, pm25_24h: 35 };
const best = A.usAqiBest(spikeSt, spike);
assert.strictEqual(best.basis, 'nowcast');
assert.ok(best.aqi > A.usAqiFor(spikeSt).aqi);
assert.ok(best.aqi < A.pm25ToAqi(100).aqi); // weighted, below the raw latest hour
// latest pm25 fills a missing last hour
const gapLast = spike.slice(0, 11).concat([null]);
assert.strictEqual(A.nowcastAqi(gapLast, 100).aqi, A.nowcastAqi(spike, 100).aqi);
// fewer than 2 of the last 3 hours -> null -> flagged 24-h fallback
const sparse = [50, 50, 50, 50, 50, 50, 50, 50, 50, 50, null, null];
assert.strictEqual(A.nowcastAqi(sparse, null), null);
const fb = A.usAqiBest({ pm25: null, pm25_24h: 81.07 }, sparse);
assert.strictEqual(fb.basis, '24h');
assert.strictEqual(fb.aqi, 169);
assert.strictEqual(A.usAqiBest({ pm25: null, pm25_24h: null }, sparse), null);
assert.strictEqual(A.usAqiBest(null, []), null);
assert.strictEqual(A.usAqiBest({ pm25: 30, pm25_24h: 30 }, []).basis, '24h'); // one hour alone is not enough
// Singapore: data.gov.sg pm25 items -> NowCast
const mk = (h, w) => ({ timestamp: '2026-10-12T' + String(h).padStart(2, '0') + ':00:00+08:00', readings: { pm25_one_hourly: { west: w, north: 10 } } });
const sgItems = [mk(5, 20), mk(6, 20), mk(7, 20), mk(8, 60), mk(9, 90)];
const sgW = A.sgNowcastAqi(sgItems, 'west');
assert.strictEqual(sgW.basis, 'nowcast');
assert.ok(sgW.aqi > A.pm25ToAqi(20).aqi && sgW.aqi < A.pm25ToAqi(90).aqi);
assert.strictEqual(A.sgNowcastAqi(sgItems, 'north').aqi, A.pm25ToAqi(10).aqi);
assert.strictEqual(A.sgNowcastAqi([], 'west'), null);
assert.strictEqual(A.sgNowcastAqi([mk(5, 20), mk(6, null), mk(7, null)], 'west'), null);

// Singapore PSI bands (NEA) and PSI response parsing
assert.strictEqual(A.psiBand(50).key, 'good');
assert.strictEqual(A.psiBand(51).key, 'mod');
assert.strictEqual(A.psiBand(100).key, 'mod');
assert.strictEqual(A.psiBand(101).key, 'unh');
assert.strictEqual(A.psiBand(200).key, 'unh');
assert.strictEqual(A.psiBand(201).key, 'vunh');
assert.strictEqual(A.psiBand(300).key, 'vunh');
assert.strictEqual(A.psiBand(301).key, 'haz');
const sgJson = { data: { items: [{ timestamp: '2026-10-12T19:00:00+08:00', readings: { psi_twenty_four_hourly: { west: 155 }, pm25_twenty_four_hourly: { west: 107 } } }] } };
assert.deepStrictEqual(A.sgRegion(sgJson, 'west'), { psi: 155, pm25: 107, ts: '2026-10-12T19:00:00+08:00' });
assert.strictEqual(A.sgRegion(sgJson, 'north'), null);
assert.strictEqual(A.sgRegion({}, 'west'), null);

// news and links
const news = [{ l: 'en', t: 'a' }, { l: 'ms', t: 'b' }, { l: 'ms', t: 'c' }];
assert.deepStrictEqual(A.sortNews(news, 'ms').map(x => x.t), ['b', 'c', 'a']);
assert.deepStrictEqual(A.sortNews(news, 'en').map(x => x.t), ['a', 'b', 'c']);
assert.strictEqual(A.safeUrl('javascript:alert(1)'), '#');
assert.strictEqual(A.safeUrl('http://x.example'), '#');
assert.strictEqual(A.safeUrl('https://x.example'), 'https://x.example');
assert.deepStrictEqual(A.mdParts('see [APIMS](https://a.example) now'), [{ text: 'see ' }, { text: 'APIMS', href: 'https://a.example' }, { text: ' now' }]);

// data base is a single constant: raw GitHub unless the page runs on localhost (no location in node)
assert.ok(A.RAW_BASE.startsWith('https://raw.githubusercontent.com/charlestaysg/charlestaysg.github.io/jb-haze-data/'));
assert.strictEqual(A.DATA_BASE, A.RAW_BASE);
assert.strictEqual(A.LOCAL_BASE, 'data/');

// strings: Malay covers every key except the proper-name back link; unreviewed flag; placeholders
assert.deepStrictEqual(S.missingKeys('ms').filter(k => !['meta', 'back'].includes(k)), []);
assert.strictEqual(S.isReviewed('en'), true);
assert.strictEqual(S.isReviewed('ms'), false);
assert.strictEqual(S.t('time.min', { n: 5 }, 'ms'), '5 minit lalu');
assert.strictEqual(S.t('band.vunh', null, 'ms'), 'Sangat Tidak Sihat');
assert.strictEqual(S.t('no.such.key'), 'no.such.key');
for (const lang of ['en', 'ms']) {
  assert.strictEqual(S.STRINGS[lang].compass.length, 16);
  assert.ok(!new RegExp(['NA' + 'CE', 'poly' + 'technic'].join('|'), 'i').test(JSON.stringify(S.STRINGS[lang])));
}
// Scale bar: segments follow band ranges up to the cap; marker position is clamped.
{
  const segs = A.scaleSegments(A.API_BANDS, 400);
  assert.deepStrictEqual(segs.map(x => x.to), [50, 100, 200, 300, 400]);
  assert.ok(Math.abs(segs.reduce((t, x) => t + x.pct, 0) - 100) < 1e-9);
  assert.strictEqual(A.scalePos(200, 400), 50);
  assert.strictEqual(A.scalePos(900, 400), 100);
  assert.strictEqual(A.scalePos(null, 400), null);
}
console.log('app.test.js: all checks passed');
