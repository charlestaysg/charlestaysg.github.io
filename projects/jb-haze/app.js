/* Johor Bahru haze page. Plain browser JS, no build step.
 * Pure helpers are exported for the node smoke test (app.test.js). */
'use strict';

// ------------------------------------------------------------------ constants
const RAW_BASE = 'https://raw.githubusercontent.com/charlestaysg/charlestaysg.github.io/jb-haze-data/';
const LOCAL_BASE = 'data/';
const IS_LOCAL = typeof location !== 'undefined' && /^(localhost|127\.0\.0\.1|\[::1\]|)$/.test(location.hostname);
// Single switch: local seed files on localhost, the data branch in production.
const DATA_BASE = IS_LOCAL ? LOCAL_BASE : RAW_BASE;
// Live data is fetched on demand from a small Worker (APIMS and the news feeds send no CORS headers).
// Order: Worker -> data branch (hourly backup copy) -> seed files on main. Only this constant needs changing to move it.
const WORKER_BASE = 'https://jb-haze-api.charlestaysg.workers.dev/';
const WORKER_TIMEOUT_MS = 6000;
const WORKER_PATH = { 'latest.json': 'latest', 'history.json': 'history', 'news.json': 'news' };
// ?noworker=1 skips the Worker (tests the fallback); ?local=1 on localhost uses only the seed files.
const QS = typeof location !== 'undefined' ? new URLSearchParams(location.search) : new URLSearchParams();
// On localhost only, ?worker=http://localhost:8788/ points at a local `wrangler dev` for testing.
const WORKER_URL = (IS_LOCAL && /^http:\/\/localhost:\d+\/$/.test(QS.get('worker') || '')) ? QS.get('worker') : WORKER_BASE;
const USE_WORKER = !QS.has('noworker') && !(IS_LOCAL && QS.has('local'));

const TZ = 'Asia/Kuala_Lumpur';
const POLL_MS = 5 * 60 * 1000;
const STALE_READING_H = 2;
const HOTSPOT_STALE_H = 36;
const JB_VIEW = [[1.36, 103.66], [1.60, 104.25]];
// Must stay taller than the map box at the JB zoom, or Leaflet re-centres on this box and pushes JB off-centre.
const JB_MAX = [[0.4, 102.2], [3.2, 105.0]];
const FIT_PAD = { paddingTopLeft: [30, 56], paddingBottomRight: [56, 30] };
const REGION_VIEW = [[-6, 95], [8, 120]];
const JB_GRID = (function () {
  const pts = [];
  for (const lat of [1.35, 1.475, 1.60]) for (const lng of [103.55, 103.80, 104.05]) pts.push({ lat, lng });
  return pts;
}());
const JB_CENTRE = { lat: 1.475, lng: 103.80 };
const REGIONAL_WIND = [
  { name: 'Medan', lat: 3.59, lng: 98.67 }, { name: 'Pekanbaru', lat: 0.51, lng: 101.45 },
  { name: 'Jambi', lat: -1.61, lng: 103.61 }, { name: 'Palembang', lat: -2.98, lng: 104.76 },
  { name: 'Pontianak', lat: -0.03, lng: 109.33 }, { name: 'Kuala Lumpur', lat: 3.14, lng: 101.69 },
  { name: 'Kuantan', lat: 3.81, lng: 103.33 }, { name: 'JB', lat: 1.49, lng: 103.74 },
  { name: 'Batam', lat: 1.05, lng: 104.03 },
];
const SUMATRA_FROM = ['S', 'SSW', 'SW', 'WSW', 'W']; // English compass names
const COMPASS_EN = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
const NOWCAST_HOURS = 12;
const LS_LANG = 'jbHaze.lang';
const LS_STATION = 'jbHaze.station';
const LS_PLACE = 'jbHaze.place';
const PLAY_MS = 800;
const APIMS_URL = 'https://eqms.doe.gov.my/APIMS/main';

// Malaysia API bands (DOE). Order: blue / green / yellow / orange / red.
const API_BANDS = [
  { key: 'good', max: 50, color: '#2e7dd7' },
  { key: 'mod', max: 100, color: '#3fae5a' },
  { key: 'unh', max: 200, color: '#f5b400' },
  { key: 'vunh', max: 300, color: '#f0702a' },
  { key: 'haz', max: Infinity, color: '#c8102e' },
];
const NODATA_BAND = { key: 'nodata', max: null, color: '#8a929c' };

// ------------------------------------------------------------------ pure helpers
function apiBand(api) {
  if (api == null || isNaN(api)) return NODATA_BAND;
  return API_BANDS.find(b => api <= b.max) || API_BANDS[4];
}

// [cLo, cHi, iLo, iHi]. The pre-2024 US EPA PM2.5 scale on the latest 1-hour reading: what aqicn.org shows for
// Johor and Singapore stations, so the US AQI here matches it (and the Singapore haze page).
const AQI_BREAKPOINTS = [
  [0, 12.0, 0, 50], [12.1, 35.4, 51, 100], [35.5, 55.4, 101, 150], [55.5, 150.4, 151, 200],
  [150.5, 250.4, 201, 300], [250.5, 350.4, 301, 400], [350.5, 500.4, 401, 500],
];
const AQI_CATS = [
  { key: 'good', max: 50, color: '#00e400' }, { key: 'mod', max: 100, color: '#ffff00' },
  { key: 'usg', max: 150, color: '#ff7e00' }, { key: 'unh', max: 200, color: '#ff0000' },
  { key: 'vunh', max: 300, color: '#8f3f97' }, { key: 'haz', max: Infinity, color: '#7e0023' },
];
// Position (0-100 %) of a value on a banded scale capped at `cap`; segment widths follow each band's range.
function scaleSegments(bands, cap) {
  let lo = 0;
  return bands.map(b => { const hi = Math.min(b.max, cap); const seg = { key: b.key, color: b.color, from: lo, to: hi, pct: (hi - lo) / cap * 100 }; lo = hi; return seg; }).filter(s => s.pct > 0);
}
function scalePos(v, cap) { return v == null || isNaN(v) ? null : Math.max(0, Math.min(100, v / cap * 100)); }
function aqiCategory(aqi) { return AQI_CATS.find(c => aqi <= c.max) || AQI_CATS[5]; }
function pm25ToAqi(c) {
  if (c == null || isNaN(c)) return null;
  c = Math.floor(c * 10 + 1e-6) / 10;
  let aqi = 500;
  if (c <= 500.4) {
    const bp = AQI_BREAKPOINTS.find(b => c <= b[1]);
    aqi = Math.round((bp[3] - bp[2]) / (bp[1] - bp[0]) * (c - bp[0]) + bp[2]);
  }
  return Object.assign({ aqi }, aqiCategory(aqi));
}
/** NEA PSI band (24-h PSI). Same cut-offs and colours as the Malaysian API bands. */
function psiBand(psi) { return apiBand(psi); }
/** Pull one region out of the data.gov.sg PSI response. Returns null if the shape is wrong. */
function sgRegion(json, region) {
  try {
    const it = json.data.items[json.data.items.length - 1], r = it.readings;
    const psi = r.psi_twenty_four_hourly[region], pm = r.pm25_twenty_four_hourly[region];
    if (psi == null) return null;
    return { psi, pm25: pm == null ? null : pm, ts: it.timestamp };
  } catch (_) { return null; }
}
/** US AQI from DOE's 24-hour average PM2.5. Used as the like-for-like comparison and as the fallback when NowCast cannot be worked out. */
function usAqiFor(st) { return st ? pm25ToAqi(st.pm25_24h) : null; }
/** NowCast PM2.5. `values` newest-first (null = missing). Needs two of the last three hours. */
function nowcast(values) {
  const v = values.slice(0, NOWCAST_HOURS);
  if (v.slice(0, 3).filter(x => x != null).length < 2) return null;
  const present = v.filter(x => x != null);
  const min = Math.min(...present), max = Math.max(...present);
  const w = max > 0 ? Math.max(min / max, 0.5) : 1;
  let num = 0, den = 0;
  v.forEach((x, i) => { if (x != null) { const wi = Math.pow(w, i); num += wi * x; den += wi; } });
  return Math.round(num / den * 10) / 10;
}
/** US AQI from the latest 1-hour PM2.5 (aqicn's method). `series` oldest-first (null = gap); `latest` is the current
 * 1-hour reading, used when the series' last hour is missing it. Returns an AQI object or null.
 * (Name kept from the earlier NowCast version so callers don't change.) */
function nowcastAqi(series, latest) {
  const v = (series || []).slice();
  let c = v.length ? v[v.length - 1] : null;
  if (c == null) c = latest;
  return c == null ? null : pm25ToAqi(c);
}
/** Headline US AQI for a station: latest 1-hour reading when present, else the 24-hour figure tagged basis '24h'. Returns {aqi,key,color,basis} or null. */
function usAqiBest(st, series) {
  if (!st) return null;
  const nc = nowcastAqi(series, st.pm25);
  if (nc) return Object.assign({ basis: '1h' }, nc);
  const d = usAqiFor(st);
  return d ? Object.assign({ basis: '24h' }, d) : null;
}
/** US AQI (latest hour, aqicn method) for one Singapore region from data.gov.sg pm25 items ({timestamp, readings.pm25_one_hourly}). */
function sgNowcastAqi(items, region) {
  const all = (items || []).slice().sort((a, b) => (a.timestamp < b.timestamp ? -1 : 1));
  const vals = all.map(it => { const v = ((it.readings || {}).pm25_one_hourly || {})[region]; return v == null ? null : v; });
  let last = -1;
  for (let i = vals.length - 1; i >= 0; i--) if (vals[i] != null) { last = i; break; }
  if (last < 0) return null;
  return Object.assign({ basis: '1h', ts: all[last].timestamp }, pm25ToAqi(vals[last]));
}
/** DOE PM2.5 sub-index from the 24-hour average (explainer only; the page shows DOE's own API). */
const API_PM25_BREAKS = [[0, 12.0, 0, 50], [12.1, 35.4, 51, 100], [35.5, 55.4, 101, 150], [55.5, 150.4, 151, 200],
  [150.5, 250.4, 201, 300], [250.5, 350.4, 301, 400], [350.5, 500.4, 401, 500]];
function pm25ToApi(c) {
  if (c == null || isNaN(c)) return null;
  const bp = API_PM25_BREAKS.find(b => c <= b[1]) || API_PM25_BREAKS[6];
  return Math.round((bp[3] - bp[2]) / (bp[1] - bp[0]) * (Math.min(c, bp[1]) - bp[0]) + bp[2]);
}

function haversine(lat1, lng1, lat2, lng2) { // km
  const R = 6371, rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad, dLng = (lng2 - lng1) * rad;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
function nearest(items, lat, lng, n = 1) {
  return items.map(it => Object.assign({ km: haversine(lat, lng, it.lat, it.lng) }, it))
    .sort((a, b) => a.km - b.km).slice(0, n);
}
function compassIndex(deg) { return Math.round((((deg % 360) + 360) % 360) / 22.5) % 16; }
function compass(deg, names) { return (names || COMPASS_EN)[compassIndex(deg)]; }
/** Open-Meteo and APIMS give the direction the wind comes FROM; arrows point where it blows TO. */
function windTo(fromDeg) { return (((fromDeg + 180) % 360) + 360) % 360; }
function arrowRotation(fromDeg) { return windTo(fromDeg); }
function fromSumatra(fromDeg) { return SUMATRA_FROM.includes(compass(fromDeg)); }

function lum(hex) {
  const n = parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(x => { x /= 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); });
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
}
/** Black or white, whichever has the higher contrast on `hex`. */
function textOn(hex) {
  const L = lum(hex);
  return (L + 0.05) / 0.05 >= 1.05 / (L + 0.05) ? '#111111' : '#ffffff';
}

/** Splits an age in ms into parts; the caller turns them into words. */
function agoParts(ms) {
  const m = Math.max(0, Math.floor(ms / 60000));
  if (m < 1) return { unit: 'now' };
  if (m < 60) return { unit: 'min', n: m };
  const h = Math.floor(m / 60);
  if (h < 24) return { unit: 'hm', h, m: m % 60 };
  return { unit: 'd', d: Math.floor(h / 24) };
}

const mytTime = typeof Intl !== 'undefined'
  ? new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: false }) : null;
function fmtHM(dateOrIso) {
  if (dateOrIso == null || dateOrIso === '') return '—'; // new Date(null) is 1970, which would print 07:30 MYT
  const d = dateOrIso instanceof Date ? dateOrIso : new Date(dateOrIso);
  if (isNaN(d)) return '—';
  return mytTime ? mytTime.format(d) : d.toISOString().slice(11, 16);
}

/** Last n values of a series (array), padded at the front with nulls. */
function lastN(series, n) {
  const s = (series || []).slice(-n);
  while (s.length < n) s.unshift(null);
  return s;
}
/** Hour labels for the last n slots of a history window. */
function hourStamps(history, n) {
  const start = Date.parse(history.start);
  const total = history.hours;
  const out = [];
  for (let i = total - n; i < total; i++) out.push(new Date(start + i * 3600000));
  return out;
}
/** SVG path for a sparkline with gaps where values are null. */
function sparkPath(values, w, h, pad = 2, lo, hi) {
  const present = values.filter(v => v != null);
  if (!present.length) return '';
  lo = lo == null ? Math.min(...present) : lo;
  hi = hi == null ? Math.max(...present) : hi;
  if (hi - lo < 10) { const mid = (hi + lo) / 2; lo = mid - 5; hi = mid + 5; }
  const n = values.length;
  let d = '', pen = false;
  values.forEach((v, i) => {
    if (v == null) { pen = false; return; }
    const x = pad + (n > 1 ? i * (w - 2 * pad) / (n - 1) : 0);
    const y = h - pad - (v - lo) / (hi - lo) * (h - 2 * pad);
    d += (pen ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1);
    pen = true;
  });
  return d;
}

/** Headline station: the user's saved station, else the nearest to their location, else the worst JB-area API. */
function headlineStation(stations, opts = {}) {
  const byId = id => stations.find(s => s.id === id);
  if (opts.myId && byId(opts.myId)) return byId(opts.myId);
  if (opts.loc) {
    const n = nearest(stations, opts.loc.lat, opts.loc.lng, 1)[0];
    if (n) return byId(n.id);
  }
  const jb = stations.filter(s => s.jb);
  const pool = jb.length ? jb : stations;
  let best = null;
  for (const s of pool) if (s.api != null && (!best || s.api > best.api)) best = s;
  return best || pool[0] || null;
}

/** 'points' only when the file exists, says so, and is fresh; otherwise the keyless WMS overlay. */
function hotspotMode(hs, now = Date.now()) {
  if (!hs || hs.mode !== 'points' || !Array.isArray(hs.points)) return 'wms';
  const t = Date.parse(hs.generated);
  if (isNaN(t) || now - t > HOTSPOT_STALE_H * 3600000) return 'wms';
  return 'points';
}
function filterHotspots(points, conf) {
  return conf === 'high' ? points.filter(p => p[2] === 'h') : points;
}
/** Malaysia time of a baked "HHMM" string as "HH:MM". */
function hhmm(s) { return s && s.length === 4 ? s.slice(0, 2) + ':' + s.slice(2) : '—'; }

/** Plain-text [label](url) links to DOM-safe parts. Returns [{text}|{text,href}]. */
function mdParts(s) {
  const out = []; const re = /\[([^\]]+)\]\(([^)\s]+)\)/g; let last = 0, m;
  while ((m = re.exec(s))) {
    if (m.index > last) out.push({ text: s.slice(last, m.index) });
    out.push({ text: m[1], href: m[2] });
    last = re.lastIndex;
  }
  if (last < s.length) out.push({ text: s.slice(last) });
  return out;
}
function safeUrl(u) { return /^https:\/\//i.test(u || '') ? u : '#'; }
function sortNews(items, lang) {
  const list = (items || []).slice();
  if (lang !== 'ms') return list;
  const rank = it => (it.l === 'ms' ? 0 : 1);
  return list.map((it, i) => ({ it, i })).sort((a, b) => rank(a.it) - rank(b.it) || a.i - b.i).map(x => x.it);
}

// ---- time slider and place search helpers
/** Hourly steps for the map slider: the last `n` hours of the history window in which at least one station has a value. Oldest first.
 * `idx` indexes the history series; `ms` is that hour's timestamp. The last step is treated as "Now". */
function timeSteps(history, n = 24) {
  if (!history || !history.stations || !history.hours) return [];
  const start = Date.parse(history.start);
  if (isNaN(start)) return [];
  const all = Object.values(history.stations), out = [];
  for (let i = Math.max(0, history.hours - n); i < history.hours; i++) {
    if (all.some(s => (s.api || [])[i] != null || (s.pm25 || [])[i] != null)) out.push({ idx: i, ms: start + i * 3600000 });
  }
  return out;
}
/** Whole hours between a step and the newest step. */
function stepAgoHours(ms, newestMs) { return Math.max(0, Math.round((newestMs - ms) / 3600000)); }
/** Index of the step closest to `ms` (or -1 for no steps). Used to keep the chosen hour across a data refresh. */
function stepIndexForMs(steps, ms) {
  if (!steps.length) return -1;
  let best = 0;
  steps.forEach((s, i) => { if (Math.abs(s.ms - ms) < Math.abs(steps[best].ms - ms)) best = i; });
  return best;
}
/** API and US AQI for one station at one history index. AQI is NowCast of the PM2.5 up to that hour; if NowCast cannot be
 * worked out, the mean of the last 24 hourly values (needs 12 of them) tagged basis '24h'; else null. */
function stationAtStep(history, id, idx) {
  const s = history && history.stations && history.stations[id];
  if (!s) return { api: null, aq: null };
  const a = (s.api || [])[idx];
  const pm = (s.pm25 || []).slice(0, idx + 1);
  let aq = nowcastAqi(pm, null);
  if (aq) aq = Object.assign({ basis: '1h' }, aq);
  else {
    const w = pm.slice(-24).filter(x => x != null);
    if (w.length >= 12) aq = Object.assign({ basis: '24h' }, pm25ToAqi(w.reduce((t, x) => t + x, 0) / w.length));
  }
  return { api: a == null ? null : a, aq: aq || null };
}

/** Lower-case, accents and punctuation removed, single spaces. "Bandar Dato' Onn" -> "bandar dato onn". */
function normText(s) {
  return String(s == null ? '' : s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/['’`]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
}
// Johor places for the search box: [name, lat, lng, other spellings]. Coordinates are approximate (about 1 km).
const JOHOR_PLACES = [
  ['Johor Bahru city centre', 1.4655, 103.7578, ['Johor Baharu', 'JB', 'Bandar Johor Bahru', 'JB city']],
  ['JB Sentral', 1.4619, 103.7637, ['Johor Bahru Sentral']],
  ['Bukit Chagar', 1.4570, 103.7687, ['RTS Link', 'Bukit Chagar RTS']],
  ['CIQ Bangunan Sultan Iskandar', 1.4637, 103.7677, ['CIQ', 'BSI', 'Woodlands Causeway', 'Customs']],
  ['Stulang', 1.4640, 103.7795, ['Stulang Laut']],
  ['Larkin', 1.4977, 103.7405, ['Larkin Sentral']],
  ['Taman Pelangi', 1.4761, 103.7753, []],
  ['Danga Bay', 1.4700, 103.7260, ['Teluk Danga']],
  ['Taman Perling', 1.4862, 103.6800, ['Perling']],
  ['Tampoi', 1.5100, 103.7130, []],
  ['Bandar Dato\' Onn', 1.5470, 103.7400, ['Dato Onn']],
  ['Kempas', 1.5288, 103.7051, ['Taman Kempas']],
  ['Taman Molek', 1.5286, 103.7908, ['Molek']],
  ['Tebrau', 1.5628, 103.7883, []],
  ['Mount Austin', 1.5507, 103.7860, ['Austin Heights', 'Taman Mount Austin']],
  ['Johor Jaya', 1.5435, 103.8040, []],
  ['Permas Jaya', 1.4880, 103.8180, ['Bandar Baru Permas Jaya', 'Permas']],
  ['Masai', 1.4950, 103.8730, []],
  ['Seri Alam', 1.5079, 103.8661, ['Bandar Seri Alam']],
  ['Plentong', 1.5200, 103.8400, []],
  ['Pasir Gudang', 1.4727, 103.9035, ['Bandar Pasir Gudang']],
  ['Ulu Tiram', 1.6010, 103.8190, ['Hulu Tiram']],
  ['Skudai', 1.5370, 103.6590, []],
  ['Taman Universiti', 1.5400, 103.6350, ['UTM', 'Universiti Teknologi Malaysia']],
  ['Bukit Indah', 1.4801, 103.6596, ['Taman Bukit Indah']],
  ['Horizon Hills', 1.4576, 103.6456, []],
  ['Iskandar Puteri', 1.4272, 103.6395, []],
  ['Nusajaya', 1.4170, 103.6370, []],
  ['Kota Iskandar', 1.4227, 103.6526, []],
  ['Puteri Harbour', 1.4240, 103.6624, []],
  ['Legoland Malaysia', 1.4271, 103.6307, ['Legoland']],
  ['Gelang Patah', 1.4529, 103.5992, []],
  ['Tanjung Pelepas', 1.3640, 103.5470, ['Port of Tanjung Pelepas', 'PTP']],
  ['Second Link (Tanjung Kupang)', 1.3821, 103.5936, ['Tanjung Kupang', 'Kupang', 'Linkedua', 'Laluan Kedua']],
  ['Kulai', 1.6561, 103.6003, []],
  ['Senai', 1.6030, 103.6420, []],
  ['Pontian', 1.4860, 103.3890, ['Pontian Kechil']],
  ['Kukup', 1.3300, 103.4400, []],
  ['Batu Pahat', 1.8548, 102.9325, []],
  ['Yong Peng', 2.0127, 103.0580, []],
  ['Ayer Hitam', 1.9230, 103.1830, ['Air Hitam']],
  ['Simpang Renggam', 1.8267, 103.3087, []],
  ['Kluang', 2.0300, 103.3180, []],
  ['Muar', 2.0442, 102.5689, ['Bandar Maharani']],
  ['Tangkak', 2.2680, 102.5450, []],
  ['Segamat', 2.5148, 102.8158, []],
  ['Labis', 2.3850, 103.0210, []],
  ['Mersing', 2.4300, 103.8400, []],
  ['Kota Tinggi', 1.7380, 103.8990, []],
  ['Desaru', 1.5550, 104.2650, ['Desaru Coast']],
  ['Bandar Penawar', 1.5538, 104.2308, ['Penawar']],
  ['Pengerang', 1.3870, 104.1500, []],
].map(([name, lat, lng, alt]) => ({ name, lat, lng, alt, keys: [name].concat(alt).map(normText) }));

/** Local place suggestions. Every word typed must start a word of the place name (or of another spelling), so "baharu" and
 * "pasir gu" both work. Names that start with the query come first. */
function matchPlaces(query, places = JOHOR_PLACES, limit = 6) {
  const q = normText(query);
  if (!q) return [];
  const toks = q.split(' ');
  const hits = [];
  places.forEach((p, i) => {
    let best = null;
    p.keys.forEach((k, ki) => {
      const words = k.split(' ');
      if (!toks.every(t => words.some(w => w.startsWith(t)))) return;
      const score = k === q ? -1 : k.startsWith(q) ? (ki === 0 ? 0 : 1) : 2;
      if (best == null || score < best) best = score;
    });
    if (best != null) hits.push({ p, i, score: best });
  });
  return hits.sort((a, b) => a.score - b.score || a.i - b.i).slice(0, limit).map(x => x.p);
}
/** Nominatim result -> {name, lat, lng}, or null when it is malformed or outside Johor's rough box. */
function parseNominatim(list) {
  if (!Array.isArray(list)) return [];
  const out = [];
  for (const r of list) {
    const lat = parseFloat(r && r.lat), lng = parseFloat(r && r.lon);
    if (!isFinite(lat) || !isFinite(lng) || lat < 1.1 || lat > 3.0 || lng < 102.3 || lng > 104.6) continue;
    const name = String((r.name || String(r.display_name || '').split(',')[0] || '')).trim();
    const where = String(r.display_name || '').split(',').slice(1, 3).map(x => x.trim()).filter(Boolean).join(', ');
    if (name) out.push({ name, detail: where, lat, lng });
  }
  return out;
}
function nominatimUrl(q, lang) {
  return 'https://nominatim.openstreetmap.org/search?format=jsonv2&countrycodes=my&viewbox=102.4,2.9,104.5,1.2&bounded=1&limit=5&accept-language='
    + (lang === 'ms' ? 'ms' : 'en') + '&q=' + encodeURIComponent(String(q).trim().slice(0, 100));
}

if (typeof module !== 'undefined') {
  module.exports = { scaleSegments, scalePos, apiBand, API_BANDS, pm25ToAqi, usAqiFor, nowcastAqi, usAqiBest, sgNowcastAqi, psiBand, sgRegion, aqiCategory, nowcast, pm25ToApi, haversine, nearest, compass,
    windTo, arrowRotation, fromSumatra, textOn, agoParts, fmtHM, lastN, hourStamps, sparkPath, headlineStation,
    hotspotMode, filterHotspots, timeSteps, stepAgoHours, stepIndexForMs, stationAtStep, normText, matchPlaces, parseNominatim, nominatimUrl, JOHOR_PLACES, hhmm, mdParts, safeUrl, sortNews, DATA_BASE, RAW_BASE, LOCAL_BASE, COMPASS_EN };
}

// ------------------------------------------------------------------ browser app
if (typeof document !== 'undefined') {
  const S = window.JBH.strings;
  const $ = id => document.getElementById(id);
  const state = {
    lang: 'en', meta: [], latest: null, history: null, news: null, hotspots: null,
    selectedId: null, myId: null, loc: null, conf: 'all', metric: 'api', compare: new Set(),
    layers: { wind: true, hs: false, others: false }, hotspotView: false, topic: 'impact',
    latestSource: 'worker', windJB: null, windRegional: null, nextAt: 0, fetchedAt: 0, loadedOnce: false, fetchError: false,
    chartSeen: false, sheetOpen: false, lastFocus: null,
    viewMs: null, place: null, nom: null, nomBusy: false,
  };
  const desktopMQ = window.matchMedia('(min-width: 900px)');
  const darkMQ = window.matchMedia('(prefers-color-scheme: dark)');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const T = (k, p) => S.t(k, p, state.lang);

  function h(tag, attrs, ...kids) {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v == null || v === false) continue;
      if (k === 'class') e.className = v;
      else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
      else e.setAttribute(k, v);
    }
    for (const c of kids.flat()) {
      if (c == null || c === false) continue;
      e.append(c.nodeType ? c : document.createTextNode(String(c)));
    }
    return e;
  }
  function svgEl(tag, attrs) {
    const e = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (const [k, v] of Object.entries(attrs || {})) e.setAttribute(k, v);
    return e;
  }
  function safeStore(key, val) { try { if (val == null) localStorage.removeItem(key); else localStorage.setItem(key, val); } catch (_) { /* private mode */ } }
  function safeLoad(key) { try { return localStorage.getItem(key); } catch (_) { return null; } }
  function sessGet(key) { try { return JSON.parse(sessionStorage.getItem(key)); } catch (_) { return null; } }
  function sessSet(key, val) { try { sessionStorage.setItem(key, JSON.stringify(val)); } catch (_) { /* ignore */ } }
  let toastTimer = null;
  function toast(msg) {
    const t = $('toast'); t.textContent = msg; t.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.hidden = true; }, 5000);
  }
  function agoText(ms) {
    const p = agoParts(ms);
    if (p.unit === 'now') return T('time.now');
    if (p.unit === 'min') return T('time.min', { n: p.n });
    if (p.unit === 'hm') return T('time.hm', { h: p.h, m: p.m });
    return T('time.d', { d: p.d });
  }
  function appendMd(el, text) {
    for (const p of mdParts(text)) el.append(p.href ? h('a', { href: p.href.startsWith('http') ? safeUrl(p.href) : p.href, target: p.href.startsWith('http') ? '_blank' : null, rel: 'noopener' }, p.text) : p.text);
  }
  const metaOf = id => state.meta.find(m => m.id === id);
  const aqicnSlug = id => { const m = metaOf(id); return m && /^[a-z0-9-]+$/.test(m.aqicn || '') ? m.aqicn : null; };
  const aqicnUrl = slug => `https://aqicn.org/city/malaysia/johor/${slug}/`;
  const stName = st => { const m = metaOf(st.id); return state.lang === 'ms' && m && m.nameMs ? m.nameMs : st.name; };
  const bandWord = band => T('band.' + band.key);
  const stations = () => (state.latest ? state.latest.stations : []);
  const stationById = id => stations().find(s => s.id === id);
  const usSeries = id => (state.history && state.history.stations[id] ? state.history.stations[id].pm25 : []);
  const usOf = st => usAqiBest(st, st ? usSeries(st.id) : []);
  const tag24 = aq => (aq && aq.basis === '24h' ? ' ' + T('tag.24h') : '');
  const compassNames = () => S.t('compass', null, state.lang);

  // ---------------------------------------------------------------- language
  function applyLang(lang, persist) {
    state.lang = S.LANGS.includes(lang) ? lang : 'en';
    document.documentElement.lang = S.STRINGS[state.lang].meta.htmlLang;
    document.title = T('app.doctitle');
    $('meta-desc').setAttribute('content', T('app.description'));
    document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = T(el.dataset.i18n); });
    document.querySelectorAll('[data-i18n-aria]').forEach(el => el.setAttribute('aria-label', T(el.dataset.i18nAria)));
    document.querySelectorAll('[data-i18n-title]').forEach(el => el.setAttribute('title', T(el.dataset.i18nTitle)));
    document.querySelectorAll('.lang button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.lang === state.lang)));
    $('ms-notice').hidden = S.isReviewed(state.lang);
    if (persist) {
      safeStore(LS_LANG, state.lang);
      try {
        const u = new URL(location.href);
        if (state.lang === 'en') u.searchParams.delete('lang'); else u.searchParams.set('lang', state.lang);
        history.replaceState(null, '', u);
      } catch (_) { /* ignore */ }
    }
    renderStatic();
    renderAll();
  }
  function initialLang() {
    try { const q = new URLSearchParams(location.search).get('lang'); if (S.LANGS.includes(q)) return q; } catch (_) { /* ignore */ }
    const s = safeLoad(LS_LANG);
    return S.LANGS.includes(s) ? s : 'en';
  }

  function renderStatic() {
    for (const k of ['impact', 'govt', 'indonesia']) $('tab-' + k).textContent = T('news.tab.' + k);
    const foot = (id, key) => { const el = $(id); el.replaceChildren(); appendMd(el, T(key)); };
    foot('foot-main', 'foot.main'); foot('foot-fire', 'foot.fire'); foot('foot-other', 'foot.other');
    foot('foot-private', 'foot.private'); foot('foot-place', 'foot.place'); foot('foot-sg', 'foot.sg');
    $('cw-h').textContent = T('strip.title'); $('cw-basis').textContent = T('strip.basis');
    $('cw-sglink').textContent = T('strip.sglink'); $('cw-nea').textContent = T('strip.nea') + ' ↗'; foot('adv-causeway', 'adv.causeway');
    $('abbr-list').replaceChildren(...T('foot.abbr').flatMap(([a, b]) => [h('dt', {}, a), h('dd', {}, b)]));
    $('legend-list').replaceChildren(...API_BANDS.map(b => h('li', {}, h('span', { class: 'sw', style: 'background:' + b.color }), `${bandWord(b)} (${T('range.' + b.key)})`)),
      h('li', {}, h('span', { class: 'sw', style: 'background:' + NODATA_BAND.color }), bandWord(NODATA_BAND)));
    $('btn-lock').textContent = lockOn ? T('map.lock') : T('map.tap');
    $('place-q').setAttribute('placeholder', T('pl.ph')); $('place-q').setAttribute('aria-label', T('pl.ph'));
    $('place-clear').setAttribute('aria-label', T('pl.clear')); $('place-clear').setAttribute('title', T('pl.clear'));
    $('tm-range').setAttribute('aria-label', T('tm.slider'));
    $('btn-hs').textContent = state.hotspotView ? T('map.back') : T('hs.show');
  }

  // ---------------------------------------------------------------- data
  async function getJson(name) {
    const bust = Math.floor(Date.now() / POLL_MS);
    const tryUrl = async (url, ms) => {
      const ctl = new AbortController(); const timer = setTimeout(() => ctl.abort(), ms);
      try {
        const r = await fetch(url, { signal: ctl.signal, cache: 'no-cache' });
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return await r.json();
      } finally { clearTimeout(timer); }
    };
    if (USE_WORKER && WORKER_PATH[name]) {
      try { return { data: await tryUrl(WORKER_URL + WORKER_PATH[name], WORKER_TIMEOUT_MS), source: 'worker' }; } catch (_) { /* fall back */ }
    }
    const q = '?t=' + bust;
    if (DATA_BASE !== LOCAL_BASE) {
      try { return { data: await tryUrl(DATA_BASE + name + q, 12000), source: 'backup' }; } catch (_) { /* seed copy on main */ }
    }
    return { data: await tryUrl(LOCAL_BASE + name + q, 12000), source: 'backup' };
  }
  async function loadSG() {
    const ctl = new AbortController(), to = setTimeout(() => ctl.abort(), 8000);
    try {
      const r = await fetch('https://api-open.data.gov.sg/v2/real-time/api/psi', { signal: ctl.signal });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const j = await r.json();
      return sgRegion(j, 'west') && sgRegion(j, 'north') ? j : null;
    } catch (_) { return null; } finally { clearTimeout(to); }
  }
  async function sgPm25Day(dateStr) {
    let items = [], token = null;
    for (let page = 0; page < 3; page++) {
      const ctl = new AbortController(), to = setTimeout(() => ctl.abort(), 8000);
      let j;
      try {
        const r = await fetch('https://api-open.data.gov.sg/v2/real-time/api/pm25?date=' + dateStr + (token ? '&paginationToken=' + encodeURIComponent(token) : ''), { signal: ctl.signal });
        if (!r.ok) throw new Error('HTTP ' + r.status);
        j = await r.json();
      } finally { clearTimeout(to); }
      if (!j || j.code !== 0) throw new Error('bad response');
      items = items.concat(j.data.items || []);
      token = j.data.paginationToken;
      if (!token) break;
    }
    return items;
  }
  /** Today + yesterday (Singapore dates) of NEA 1-hour PM2.5, so NowCast has 12 hours to work with. Null on failure. */
  async function loadSgPm25() {
    try {
      const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Singapore', year: 'numeric', month: '2-digit', day: '2-digit' });
      const today = fmt.format(new Date()), yest = fmt.format(new Date(Date.now() - 86400000));
      const todayItems = await sgPm25Day(today);
      let yItems = [];
      try { yItems = await sgPm25Day(yest); } catch (_) { /* NowCast copes with fewer hours */ }
      const west = sgNowcastAqi(todayItems.concat(yItems), 'west'), north = sgNowcastAqi(todayItems.concat(yItems), 'north');
      return west || north ? { west, north } : null;
    } catch (_) { return null; }
  }
  async function loadData(first) {
    const sgP = loadSG(), sgPmP = loadSgPm25();
    const [lat, his, nws, hot] = await Promise.allSettled([getJson('latest.json'), getJson('history.json'), getJson('news.json'), getJson('hotspots.json')]);
    state.sg = await sgP; state.sgNc = await sgPmP;
    if (lat.status === 'fulfilled') { state.latest = lat.value.data; state.latestSource = lat.value.source; state.fetchedAt = Date.now(); state.fetchError = false; } else state.fetchError = true;
    if (his.status === 'fulfilled') state.history = his.value.data;
    if (nws.status === 'fulfilled') state.news = nws.value.data;
    state.hotspots = hot.status === 'fulfilled' ? hot.value.data : null;
    state.nextAt = Date.now() + POLL_MS;
    if (!first || lat.status === 'fulfilled') state.loadedOnce = state.loadedOnce || lat.status === 'fulfilled';
    if (state.selectedId == null || !stationById(state.selectedId)) state.selectedId = (headline() || {}).id || null;
    renderAll();
  }
  async function loadMeta() {
    try { const r = await fetch(LOCAL_BASE + 'stations.json'); state.meta = await r.json(); } catch (_) { state.meta = []; }
  }

  // ---------------------------------------------------------------- render
  const headline = () => headlineStation(stations(), { myId: state.myId, loc: state.loc });
  function renderAll() {
    renderHero(); renderStatus(); renderTime(); renderMap(); renderPlace(); renderSuggest(); renderList(); renderStrip(); renderDetail(); renderTrend();
    renderHotspotPanel(); renderAdvice(); renderExplainer(); renderNews(); renderWindText();
  }
  function renderHero() {
    const st = headline(), ring = $('ring'), num = $('ring-num');
    if (!st) { $('hero-line').textContent = T('status.loading'); return; }
    const b = apiBand(st.api), aq = usOf(st);
    ring.style.borderColor = b.color;
    num.textContent = st.api == null ? '–' : String(st.api);
    const line = $('hero-line'); line.replaceChildren(h('b', {}, bandWord(b)), ' · ', stName(st));
    const sub = $('hero-sub'); sub.replaceChildren(...(aq ? [h('span', { class: 'aqi-dot', style: 'background:' + aq.color }), h('b', {}, T('idx.us') + ' ' + aq.aqi), ' ' + T('aqi.' + aq.key) + tag24(aq)] : [T('idx.us') + ' –']), ` · ${fmtHM(st.ts)}` + (state.myId === st.id ? ' · ★' : ''));
    $('ring').setAttribute('title', `${T('idx.my')} ${st.api == null ? '' : st.api}`);
    const us = $('ring-us');
    us.style.borderColor = aq ? aq.color : NODATA_BAND.color;
    $('ring-us-num').textContent = aq ? String(aq.aqi) : '–';
    $('lbl-my').textContent = T('idx.my'); $('lbl-us').textContent = T('idx.us');
    us.setAttribute('title', `${T('idx.us')} ${aq ? aq.aqi + ' ' + T('aqi.' + aq.key) + tag24(aq) : ''}`);
  }
  function renderStrip() {
    const sec = $('causeway'), body = $('cw-body');
    const lark = stationById('CA33J'), west = state.sg && sgRegion(state.sg, 'west'), north = state.sg && sgRegion(state.sg, 'north');
    if (!west || !north || !lark) { sec.hidden = true; return; }
    sec.hidden = false;
    const cell = (label, idxName, num, band, aq) => h('div', { class: 'cw-cell' },
      h('div', { class: 'cw-l' }, label),
      h('div', { class: 'cw-main' },
        h('span', { class: 'cw-n', style: `background:${band.color};color:${textOn(band.color)}` }, num == null ? '–' : num),
        h('span', { class: 'cw-w' }, h('span', { class: 'cw-i' }, idxName), h('b', {}, bandWord(band)))),
      h('div', { class: 'cw-us' }, h('span', { class: 'aqi-dot', style: 'background:' + (aq ? aq.color : NODATA_BAND.color) }), `${T('idx.us')} `, h('b', {}, aq ? String(aq.aqi) : '–'), aq ? ' ' + T('aqi.' + aq.key) + tag24(aq) : ''));
    const sgCell = (key, r) => {
      const nc = state.sgNc && state.sgNc[key];
      const d = r.pm25 == null ? null : pm25ToAqi(r.pm25);
      return cell(T('strip.' + key), T('strip.psi'), r.psi, psiBand(r.psi), nc || (d && Object.assign({ basis: '24h' }, d)));
    };
    body.replaceChildren(cell(T('strip.jb'), T('idx.my'), lark.api, apiBand(lark.api), usOf(lark)), sgCell('west', west), sgCell('north', north));
    $('cw-time').textContent = T('strip.time', { sg: String(west.ts || '').slice(11, 16), jb: fmtHM(lark.ts) });
  }
  function renderStatus() {
    const el = $('status');
    if (!state.latest) { el.textContent = state.fetchError ? T('banner.nodata') : T('status.loading'); setBanner(state.fetchError ? T('banner.nodata') : ''); return; }
    const left = Math.max(0, Math.round((state.nextAt - Date.now()) / 1000));
    // Live = readings came from the Worker just now; Backup = the hourly saved copy (Worker unreachable).
    const live = state.latestSource !== 'backup';
    el.replaceChildren(
      h('span', { class: 'src-pill ' + (live ? 'is-live' : 'is-backup'), title: T(live ? 'status.live.title' : 'status.backup.title') },
        h('span', { class: 'src-dot', 'aria-hidden': 'true' }), T(live ? 'status.live' : 'status.backup')),
      ' ' + T('status.line', {
        time: fmtHM(state.latest.readingTime), ago: agoText(Date.now() - Date.parse(state.latest.generated)),
        mmss: `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`,
      }));
    const readingAgeH = (Date.now() - Date.parse(state.latest.readingTime)) / 3600000;
    if (readingAgeH > STALE_READING_H) setBanner(T('banner.stale', { ago: agoText(Date.now() - Date.parse(state.latest.readingTime)) }));
    else if (state.fetchError) setBanner(T('banner.error'));
    else setBanner('');
  }
  function setBanner(msg) { const b = $('error-banner'); b.textContent = msg || ''; b.hidden = !msg; }

  // ---- map
  let map = null, tiles = null, lockOn = false;
  const groups = {};
  let hsCanvas = null, wmsLayer = null, meMarker = null;
  // CARTO's free basemap now needs an API key, so the page uses Esri's keyless Light/Dark Gray Canvas.
  const ESRI = 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/';
  const ESRI_ATTR = 'Tiles © <a href="https://www.esri.com/" target="_blank" rel="noopener">Esri</a>, HERE, Garmin, © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors';
  function setTiles() {
    if (!map) return;
    if (tiles) tiles.forEach(t => map.removeLayer(t));
    const kind = darkMQ.matches ? 'World_Dark_Gray' : 'World_Light_Gray';
    const base = L.tileLayer(`${ESRI}${kind}_Base/MapServer/tile/{z}/{y}/{x}`, { maxZoom: 16, attribution: ESRI_ATTR });
    const labels = L.tileLayer(`${ESRI}${kind}_Reference/MapServer/tile/{z}/{y}/{x}`, { maxZoom: 16, pane: 'shadowPane' });
    tiles = [base, labels];
    tiles.forEach(t => t.addTo(map));
    base.bringToBack();
  }
  function fitJB() {
    // Fit with bounds lifted and no animation, then re-apply limits; doing it in the other order starts competing animations.
    map.stop(); map.setMaxBounds(null); map.setMinZoom(3);
    map.invalidateSize(false);
    map.fitBounds(JB_VIEW, Object.assign({ animate: false }, FIT_PAD));
    map.setMinZoom(Math.min(8, map.getZoom())); map.setMaxBounds(JB_MAX);
  }
  function fitHome() { if (state.layers.others) fitJohor(); else fitJB(); }
  function fitJohor() {
    const pts = stations().filter(st => st.lat != null && st.lng != null).map(st => [st.lat, st.lng]);
    if (!pts.length) return;
    map.stop(); map.setMaxBounds(null); map.setMinZoom(3);
    map.invalidateSize(false);
    map.fitBounds(pts, Object.assign({ animate: false }, FIT_PAD));
    map.setMinZoom(Math.min(8, map.getZoom())); map.setMaxBounds(JB_MAX);
  }
  function initMap() {
    if (typeof L === 'undefined') { document.querySelector('.map-fallback').hidden = false; return; }
    map = L.map('map', { preferCanvas: true, zoomSnap: 0.25, scrollWheelZoom: false, zoomControl: false, minZoom: 8, maxZoom: 16, maxBounds: JB_MAX, maxBoundsViscosity: 1 });
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    fitJB();
    // The container can still be settling (sticky header, fonts); re-measure once layout is done and on resize.
    requestAnimationFrame(() => setTimeout(() => { if (!state.hotspotView) fitHome(); }, 60));
    // Width only: phone browsers fire resize when the address bar hides on scroll.
    let lastW = window.innerWidth;
    window.addEventListener('resize', () => { if (window.innerWidth !== lastW) { lastW = window.innerWidth; if (!state.hotspotView) fitHome(); } });
    setTiles();
    for (const k of ['stations', 'others', 'wind']) groups[k] = L.layerGroup().addTo(map);
    hsCanvas = L.canvas({ padding: 0.4 });
    groups.hs = L.layerGroup();
    if (coarse) { map.dragging.disable(); map.touchZoom.disable(); $('btn-lock').hidden = false; }
    darkMQ.addEventListener && darkMQ.addEventListener('change', setTiles);
    window.addEventListener('resize', () => map.invalidateSize());
  }
  /** What a pin shows for a station: the latest reading, or the chosen hour from history when the slider is not at Now. */
  function viewOf(st) {
    const step = viewStep();
    if (!step) return { api: st.api, aq: usOf(st), past: false };
    const v = stationAtStep(state.history, st.id, step.idx);
    return { api: v.api, aq: v.aq, past: true };
  }
  function pinIcon(st) {
    const v = viewOf(st), b = apiBand(v.api), col = b.color, aq = v.aq;
    const cls = 'pin' + (st.id === state.selectedId ? ' sel' : '') + (st.id === state.myId ? ' mine' : '') + (v.past ? ' past' : '');
    const html = `<span class="${cls}" style="background:${col};color:${textOn(col)}"><b>${v.api == null ? '–' : Number(v.api)}</b><i>${bandWord(b)}</i>${aq ? `<u>${T('idx.us.short')} ${aq.aqi}${tag24(aq)}</u>` : (v.past ? `<u>${T('idx.us.short')} –</u>` : '')}</span>`;
    return L.divIcon({ className: 'pin-wrap', html, iconSize: [84, 56], iconAnchor: [42, 28] });
  }
  function renderMap() {
    if (!map) return;
    groups.stations.clearLayers(); groups.others.clearLayers();
    for (const st of stations()) {
      const v = viewOf(st);
      const m = L.marker([st.lat, st.lng], { icon: pinIcon(st), keyboard: true, alt: T('pin.aria', { name: stName(st), idx: T('idx.name'), api: v.api == null ? '–' : v.api, band: bandWord(apiBand(v.api)) }), title: stName(st) });
      m.on('click', () => openDetail(st.id));
      (st.jb ? groups.stations : groups.others).addLayer(m);
    }
    syncLayers();
  }
  function syncLayers() {
    if (!map) return;
    const show = (g, on) => { if (on && !map.hasLayer(g)) map.addLayer(g); else if (!on && map.hasLayer(g)) map.removeLayer(g); };
    show(groups.stations, !state.hotspotView);
    show(groups.others, state.layers.others && !state.hotspotView);
    show(groups.wind, state.layers.wind);
    renderHotspotsOnMap();
    $('btn-back-jb').hidden = !state.hotspotView;
    $('chk-hs').checked = state.hotspotView;
    $('chk-wind').checked = state.layers.wind;
    $('chk-others').checked = state.layers.others;
  }
  function renderHotspotsOnMap() {
    if (!map) return;
    if (map.hasLayer(groups.hs)) map.removeLayer(groups.hs);
    if (wmsLayer && map.hasLayer(wmsLayer)) map.removeLayer(wmsLayer);
    groups.hs.clearLayers();
    if (!state.hotspotView) return;
    if (hotspotMode(state.hotspots) === 'points') {
      for (const p of filterHotspots(state.hotspots.points, state.conf)) {
        const high = p[2] === 'h';
        L.circleMarker([p[0], p[1]], { renderer: hsCanvas, radius: 3, weight: 0, interactive: false,
          fillColor: high ? '#d7191c' : '#fd8d3c', fillOpacity: high ? 0.95 : 0.6 }).addTo(groups.hs);
      }
      map.addLayer(groups.hs);
    } else {
      // The FIRMS WMS now needs a MAP_KEY, so the keyless fallback is NASA GIBS' rendering of the same VIIRS detections.
      if (!wmsLayer) wmsLayer = L.tileLayer.wms('https://gibs.earthdata.nasa.gov/wms/epsg3857/best/wms.cgi', {
        layers: 'VIIRS_SNPP_Thermal_Anomalies_375m_All', format: 'image/png', transparent: true, opacity: 0.95, attribution: 'NASA GIBS / FIRMS' });
      map.addLayer(wmsLayer);
    }
  }
  function setHotspotView(on) {
    if (!map || state.hotspotView === on) { if (map) syncLayers(); return; }
    state.hotspotView = on; state.layers.hs = on;
    if (on) {
      map.setMinZoom(3); map.setMaxBounds(null); map.fitBounds(REGION_VIEW);
      loadRegionalWind();
    } else {
      fitHome();
    }
    syncLayers(); drawWind(); renderHotspotPanel(); renderStatic(); renderTime();
  }

  // ---- time slider (map only)
  let playTimer = null;
  const steps = () => timeSteps(state.history, 24);
  /** The step the map is showing, or null when it is at Now. */
  function viewStep() {
    if (state.viewMs == null) return null;
    const st = steps();
    if (st.length < 2) return null;
    const i = stepIndexForMs(st, state.viewMs);
    return i >= st.length - 1 ? null : st[i];
  }
  function stopPlay() { if (playTimer) { clearInterval(playTimer); playTimer = null; } if ($('tm-play')) $('tm-play').textContent = T('tm.play'); }
  function renderTime() {
    const panel = $('time-panel'), st = steps();
    const ok = st.length >= 2 && !state.hotspotView;
    panel.hidden = !ok;
    if (st.length < 2) state.viewMs = null;
    if (!ok) { stopPlay(); return; }
    const range = $('tm-range');
    // Snap the chosen hour to a step that still exists after a refresh; the last step is Now.
    let i = state.viewMs == null ? st.length - 1 : stepIndexForMs(st, state.viewMs);
    state.viewMs = i >= st.length - 1 ? null : st[i].ms;
    if (state.viewMs == null) i = st.length - 1;
    range.max = String(st.length - 1); range.value = String(i);
    const now = state.viewMs == null;
    const txt = now ? T('tm.now') : T('tm.showing', { time: fmtHM(new Date(st[i].ms)), h: stepAgoHours(st[i].ms, st[st.length - 1].ms) });
    $('tm-label').textContent = txt;
    range.setAttribute('aria-valuetext', txt);
    $('tm-now').hidden = now;
    $('tm-play').textContent = playTimer ? T('tm.pause') : T('tm.play');
    $('tm-play').setAttribute('aria-pressed', String(!!playTimer));
    $('tm-start').textContent = fmtHM(new Date(st[0].ms));
    panel.classList.toggle('is-past', !now);
  }
  function setStep(i) {
    const st = steps();
    if (st.length < 2) return;
    i = Math.max(0, Math.min(st.length - 1, i));
    state.viewMs = i === st.length - 1 ? null : st[i].ms;
    renderTime(); renderMap();
  }
  const curStepIdx = () => { const st = steps(); return state.viewMs == null ? st.length - 1 : stepIndexForMs(st, state.viewMs); };
  function togglePlay() {
    if (playTimer) { stopPlay(); return; }
    const st = steps();
    if (st.length < 2) return;
    // From Now, start again at the oldest hour; from a past hour, carry on from there.
    setStep(state.viewMs == null ? 0 : curStepIdx());
    playTimer = setInterval(() => {
      const next = curStepIdx() + 1;
      setStep(next);
      if (next >= steps().length - 1) { stopPlay(); renderTime(); }
    }, PLAY_MS);
    renderTime();
  }

  // ---- place search
  function clampPlace(o) {
    if (!o || typeof o.n !== 'string' || !isFinite(o.lat) || !isFinite(o.lng)) return null;
    if (o.lat < 1.1 || o.lat > 3.0 || o.lng < 102.3 || o.lng > 104.6) return null;
    return { name: o.n.slice(0, 80), lat: o.lat, lng: o.lng, saved: true };
  }
  let placeMarker = null;
  function drawPlaceMarker() {
    if (!map) return;
    if (placeMarker) { map.removeLayer(placeMarker); placeMarker = null; }
    const p = state.place;
    if (!p || p.loc) return;
    placeMarker = L.marker([p.lat, p.lng], { icon: L.divIcon({ className: 'place-wrap', html: '<div class="place-pin"></div>', iconSize: [26, 34], iconAnchor: [13, 32] }), interactive: false, keyboard: false, zIndexOffset: 800 }).addTo(map);
  }
  function showPlaceOnMap() {
    drawPlaceMarker();
    const p = state.place;
    if (!map || !p || p.loc) return;
    if (state.hotspotView) setHotspotView(false);
    const n = nearest(stations(), p.lat, p.lng, 1)[0];
    // Stations outside the JB area are hidden by default; show them so the nearest one is on the map.
    if (n && !n.jb && !state.layers.others) { state.layers.others = true; syncLayers(); renderMap(); }
    const pts = [[p.lat, p.lng]]; if (n) pts.push([n.lat, n.lng]);
    map.stop(); map.setMaxBounds(null); map.setMinZoom(3);
    map.invalidateSize(false);
    map.fitBounds(pts, { padding: [60, 60], maxZoom: 13, animate: !reduceMotion });
    map.setMinZoom(Math.min(8, map.getZoom())); map.setMaxBounds(JB_MAX);
  }
  function choosePlace(p) {
    state.place = { name: p.name, lat: p.lat, lng: p.lng, saved: true };
    safeStore(LS_PLACE, JSON.stringify({ n: p.name, lat: p.lat, lng: p.lng }));
    state.nom = null;
    $('place-q').value = p.name;
    $('place-list').hidden = true; $('place-q').blur();
    const n = nearest(stations(), p.lat, p.lng, 1)[0];
    if (n) state.selectedId = n.id;
    showPlaceOnMap();
    renderAll();
  }
  function clearPlace() {
    state.place = null; state.nom = null; safeStore(LS_PLACE, null);
    $('place-q').value = ''; $('place-list').hidden = true;
    drawPlaceMarker(); renderPlace();
  }
  function renderPlace() {
    const card = $('place-card'), p = state.place;
    $('place-clear').hidden = !p && !$('place-q').value;
    if (!p || !stations().length) { card.hidden = true; return; }
    const n = nearest(stations(), p.lat, p.lng, 1)[0];
    const st = n && stationById(n.id);
    if (!st) { card.hidden = true; return; }
    const b = apiBand(st.api), aq = usOf(st), mine = state.myId === st.id;
    card.hidden = false;
    card.replaceChildren(
      h('p', { class: 'pc-place' }, h('b', {}, p.loc ? T('pl.mylocation') : p.name)),
      h('p', { class: 'pc-line' }, h('b', {}, T('pl.nearest', { name: stName(st), km: n.km.toFixed(1) })), ' · ',
        `${T('idx.name')} ${st.api == null ? '–' : st.api} ${bandWord(b)}`, ' · ', `${T('idx.us')} ${aq ? aq.aqi : '–'}${tag24(aq)}`),
      h('div', { class: 'pc-actions' },
        h('button', { type: 'button', class: 'primary' + (mine ? ' on' : ''), 'aria-pressed': String(mine), onclick: () => setMyStation(mine ? null : st.id) }, mine ? T('detail.unset') : T('detail.set')),
        h('button', { type: 'button', class: 'pc-sec', onclick: () => openDetail(st.id) }, T('pl.details'))));
  }
  function renderSuggest() {
    const ul = $('place-list'), inp = $('place-q');
    if (ul.hidden && document.activeElement !== inp) return;
    const q = inp.value.trim();
    $('place-clear').hidden = !state.place && !inp.value;
    const li = (...kids) => h('li', {}, ...kids);
    const item = (label, sub, fn) => li(h('button', { type: 'button', class: 'pl-item', onclick: fn }, h('span', { class: 'pl-n' }, label), sub ? h('span', { class: 'pl-s' }, sub) : null));
    const kids = [item(T('pl.locate'), '', locateMe)];
    const local = matchPlaces(q);
    local.forEach(p => kids.push(item(p.name, '', () => choosePlace(p))));
    const nom = state.nom && state.nom.q === q ? state.nom : null;
    if (q.length >= 3 && !local.length) {
      if (!nom) kids.push(li(h('p', { class: 'pl-msg' }, T('pl.nolocal')), h('button', { type: 'button', class: 'pl-item pl-more', onclick: searchMore }, T('pl.more'))));
      else if (nom.busy) kids.push(li(h('p', { class: 'pl-msg' }, T('pl.searching'))));
      else if (nom.error) kids.push(li(h('p', { class: 'pl-msg' }, T('pl.error'))));
      else if (!nom.items.length) kids.push(li(h('p', { class: 'pl-msg' }, T('pl.none'))));
      else nom.items.forEach(p => kids.push(item(p.name, p.detail, () => choosePlace(p))));
      if (nom && !nom.busy) { const c = h('p', { class: 'pl-credit' }); appendMd(c, T('pl.credit')); kids.push(li(c)); }
    }
    ul.replaceChildren(...kids);
    ul.hidden = false;
  }
  async function searchMore() {
    const q = $('place-q').value.trim();
    if (q.length < 3 || state.nomBusy) return;
    state.nomBusy = true; state.nom = { q, busy: true }; renderSuggest();
    const ctl = new AbortController(), to = setTimeout(() => ctl.abort(), 8000);
    try {
      const r = await fetch(nominatimUrl(q, state.lang), { signal: ctl.signal });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      state.nom = { q, items: parseNominatim(await r.json()) };
    } catch (_) { state.nom = { q, error: true }; } finally { clearTimeout(to); state.nomBusy = false; }
    renderSuggest();
  }
  function locateMe() {
    $('place-list').hidden = true; $('place-q').blur();
    if (!navigator.geolocation) { toast(T('locate.denied')); return; }
    navigator.geolocation.getCurrentPosition(pos => {
      state.loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      const n = nearest(stations(), state.loc.lat, state.loc.lng, 1)[0];
      if (n && n.km > 60) toast(T('locate.far'));
      if (map) {
        if (meMarker) map.removeLayer(meMarker);
        meMarker = L.marker([state.loc.lat, state.loc.lng], { icon: L.divIcon({ className: 'me-wrap', html: '<div class="me-dot"></div>', iconSize: [16, 16], iconAnchor: [8, 8] }), interactive: false, keyboard: false }).addTo(map);
      }
      // The location is shown on the card for this visit only; it is never saved (unlike a chosen place).
      state.place = { name: '', lat: state.loc.lat, lng: state.loc.lng, loc: true, saved: false };
      $('place-q').value = '';
      if (n) { state.selectedId = n.id; }
      drawPlaceMarker();
      renderAll();
      if (n && map && !state.hotspotView) map.panTo([n.lat, n.lng]);
    }, () => toast(T('locate.denied')), { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 });
  }

  // ---- wind (Open-Meteo, client side)
  const hourKey = () => new Date().toISOString().slice(0, 13);
  async function fetchWind(points, cacheName) {
    const key = `jbHaze.wind.${cacheName}.${hourKey()}`;
    const cached = sessGet(key);
    if (cached) return cached;
    const url = 'https://api.open-meteo.com/v1/forecast?latitude=' + points.map(p => p.lat).join(',') + '&longitude=' + points.map(p => p.lng).join(',') +
      '&current=wind_speed_10m,wind_direction_10m&wind_speed_unit=kmh';
    const r = await fetch(url);
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const j = await r.json();
    const arr = Array.isArray(j) ? j : [j];
    const out = arr.map((o, i) => ({ lat: points[i].lat, lng: points[i].lng, name: points[i].name || '', speed: o.current.wind_speed_10m, dir: o.current.wind_direction_10m }));
    sessSet(key, out);
    return out;
  }
  async function loadJBWind() {
    try { state.windJB = await fetchWind(JB_GRID, 'jb'); } catch (_) { state.windJB = false; }
    drawWind(); renderWindText();
  }
  async function loadRegionalWind() {
    if (state.windRegional) return;
    try { state.windRegional = await fetchWind(REGIONAL_WIND, 'regional'); } catch (_) { state.windRegional = false; }
    drawWind();
  }
  function windColor(sp) { return sp < 10 ? '#4a6f94' : sp < 20 ? '#1d6fb8' : sp < 30 ? '#7b3fa0' : '#b02a37'; }
  function drawWind() {
    if (!map) return;
    groups.wind.clearLayers();
    const pts = state.hotspotView ? state.windRegional : state.windJB;
    if (!pts) return;
    for (const p of pts) {
      const size = Math.round(20 + Math.min(p.speed, 40) * 0.5), col = windColor(p.speed), rot = arrowRotation(p.dir);
      const html = `<svg width="${size}" height="${size}" viewBox="-12 -12 24 24" style="transform:rotate(${rot}deg)" aria-hidden="true"><path d="M0 -10 L6 4 L0 1 L-6 4 Z" fill="${col}" stroke="#fff" stroke-width="1.2" stroke-linejoin="round"/></svg>`;
      groups.wind.addLayer(L.marker([p.lat, p.lng], { icon: L.divIcon({ className: 'wind-wrap', html, iconSize: [size, size], iconAnchor: [size / 2, size / 2] }),
        interactive: false, keyboard: false, zIndexOffset: -1000 }));
    }
  }
  function renderWindText() {
    const chip = $('wind-chip'), note = $('wind-note');
    if (state.windJB === false) { chip.textContent = T('wind.na'); note.hidden = true; return; }
    if (!state.windJB) { chip.textContent = T('wind.loading'); note.hidden = true; return; }
    const c = state.windJB.find(p => p.lat === JB_CENTRE.lat && p.lng === JB_CENTRE.lng) || state.windJB[4];
    const names = compassNames();
    chip.textContent = T('wind.chip', { from: compass(c.dir, names), speed: Math.round(c.speed), to: compass(windTo(c.dir), names) });
    chip.title = T('wind.source');
    note.hidden = !fromSumatra(c.dir);
    note.textContent = T('wind.sumatra');
  }

  // ---- sheet / detail
  function openDetail(id) {
    state.selectedId = id;
    renderMap(); renderList(); renderDetail(); renderTrend();
    if (!desktopMQ.matches) {
      state.lastFocus = document.activeElement;
      $('detail').classList.add('open'); $('detail').setAttribute('aria-hidden', 'false'); state.sheetOpen = true;
      setTimeout(() => $('detail-close').focus({ preventScroll: true }), 50);
    }
  }
  function closeDetail() {
    $('detail').classList.remove('open'); $('detail').setAttribute('aria-hidden', 'true'); state.sheetOpen = false;
    if (state.lastFocus && state.lastFocus.focus) state.lastFocus.focus({ preventScroll: true });
  }
  function syncSheetAria() { if (desktopMQ.matches) $('detail').setAttribute('aria-hidden', 'false'); else if (!state.sheetOpen) $('detail').setAttribute('aria-hidden', 'true'); }

  function sparkSvg(values, w, h2, stroke) {
    const svg = svgEl('svg', { viewBox: `0 0 ${w} ${h2}`, preserveAspectRatio: 'none', 'aria-hidden': 'true' });
    const d = sparkPath(values, w, h2);
    if (d) svg.append(svgEl('path', { d, class: 'spark-line', 'vector-effect': 'non-scaling-stroke' }));
    return svg;
  }
  const apiSeries = id => lastN(state.history && state.history.stations[id] ? state.history.stations[id].api : [], 24);

  function renderDetail() {
    const body = $('detail-body'); body.replaceChildren();
    const st = stationById(state.selectedId);
    if (!st) { body.append(h('p', { class: 'muted' }, T('detail.pick'))); return; }
    const b = apiBand(st.api), col = b.color;
    const aq = usOf(st), ac = aq ? aq.color : NODATA_BAND.color;
    body.append(h('div', { class: 'd-hero' },
      h('div', { class: 'nm' }, stName(st), state.myId === st.id ? ' ★' : ''),
      h('div', { class: 'sub' }, `${st.category || ''}${st.category ? ' · ' : ''}${T('detail.reading', { time: fmtHM(st.ts) })}`)));
    const tile = (label, num, word, basis, c) => h('div', { class: 'tile', style: `background:${c};color:${textOn(c)}` },
      h('div', { class: 'tl' }, label), h('div', { class: 'tn' }, num), h('div', { class: 'tw' }, word), h('div', { class: 'tb' }, basis));
    body.append(h('div', { class: 'd-tiles' },
      tile(T('idx.my'), st.api == null ? '–' : st.api, bandWord(b), T('detail.basis.api'), col),
      tile(T('idx.us'), aq ? aq.aqi : '–', aq ? T('aqi.' + aq.key) : bandWord(NODATA_BAND), T(aq && aq.basis === '24h' ? 'detail.basis.us24' : 'detail.basis.us'), ac)));
    const bar = (label, v, bands, cap, word) => {
      const pos = scalePos(v, cap);
      return h('div', { class: 'scale', role: 'img', 'aria-label': `${label}: ${v == null ? '–' : v} ${word}` },
        h('div', { class: 'scale-l' }, label),
        h('div', { class: 'scale-track' },
          ...scaleSegments(bands, cap).map(sg => h('span', { class: 'scale-seg', style: `width:${sg.pct}%;background:${sg.color}` })),
          pos == null ? null : h('span', { class: 'scale-mark', style: `left:${pos}%` })),
        h('div', { class: 'scale-ticks' }, ...scaleSegments(bands, cap).slice(0, -1).map(sg => h('span', { style: `left:${sg.to / cap * 100}%` }, String(sg.to)))));
    };
    body.append(h('div', { class: 'd-scales' },
      bar(T('scale.my'), st.api, API_BANDS, 400, bandWord(b)),
      bar(T('scale.us'), aq ? aq.aqi : null, AQI_CATS, 400, aq ? T('aqi.' + aq.key) : '')));
    const us24 = usAqiFor(st);
    body.append(h('p', { class: 'note d-us24' }, T('detail.us24'), ' ', h('b', {}, us24 ? us24.aqi : '–')));
    body.append(h('p', { class: 'd-advice' }, T('advice.' + b.key)));
    const kv = h('dl', { class: 'kv' });
    const row = (k, v) => { if (v != null && v !== '') kv.append(h('dt', {}, k), h('dd', {}, v)); };
    // Pollutant table: latest hour and 24-hour average where DOE gives one.
    const fmt = (v, unit) => v == null ? '–' : `${v} ${unit}`;
    const ug = T('unit.ugm3'), mg = T('unit.mgm3');
    const pols = [['pol.pm25', st.pm25, st.pm25_24h, ug], ['pol.pm10', st.pm10, st.pm10_24h, ug],
      ['pol.o3', st.o3, null, ug], ['pol.no2', st.no2, null, ug], ['pol.so2', st.so2, null, ug], ['pol.co', st.co, null, mg]]
      .filter(r => r[1] != null || r[2] != null);
    body.append(h('table', { class: 'pol' },
      h('caption', {}, T('detail.pollutants')),
      h('thead', {}, h('tr', {}, h('th', { scope: 'col' }, ''), h('th', { scope: 'col' }, T('detail.now')), h('th', { scope: 'col' }, T('detail.avg24')))),
      h('tbody', {}, ...pols.map(([k, now, avg, unit]) => h('tr', {}, h('th', { scope: 'row' }, T(k)), h('td', {}, fmt(now, unit)), h('td', {}, avg == null ? '' : fmt(avg, unit)))))));
    body.append(h('p', { class: 'note' }, T('detail.unitsNote'), ' ', h('a', { href: '#explainer' }, T('detail.why'))));
    row(T('detail.temp'), st.temp == null ? null : st.temp + ' °C');
    row(T('detail.rh'), st.rh == null ? null : st.rh + ' %');
    // Station wind (DOE): direction only
    row(T('wind.station'), st.windDir == null ? null : T('wind.stationVal', { from: compass(st.windDir, compassNames()), deg: Math.round(st.windDir) }));
    body.append(kv);
    body.append(h('div', { class: 'd-spark' }, h('div', { class: 'note', style: 'margin:0 0 2px' }, T('detail.trend')), sparkSvg(apiSeries(st.id), 240, 56)));
    const mine = state.myId === st.id;
    body.append(h('div', { class: 'd-actions' },
      h('button', { type: 'button', class: mine ? 'on' : '', 'aria-pressed': String(mine), onclick: () => setMyStation(mine ? null : st.id) }, mine ? T('detail.unset') : T('detail.set')),
      h('a', { href: APIMS_URL, target: '_blank', rel: 'noopener' }, T('detail.apims') + ' ↗'),
      aqicnSlug(st.id) ? h('a', { href: aqicnUrl(aqicnSlug(st.id)), target: '_blank', rel: 'noopener' }, T('detail.aqicn') + ' ↗') : null));
  }
  function setMyStation(id) {
    state.myId = id; safeStore(LS_STATION, id);
    const st = stationById(id);
    toast(id ? T('detail.stationSet', { name: st ? stName(st) : id }) : T('detail.stationUnset'));
    renderAll();
  }

  // ---- list
  function renderList() {
    const box = $('station-list'); box.replaceChildren();
    const all = stations().slice().sort((a, b) => (b.jb - a.jb) || a.id.localeCompare(b.id));
    if (!all.length) { box.append(h('p', { class: 'muted' }, T('status.loading'))); return; }
    const mk = st => {
      const b = apiBand(st.api), col = b.color, aq = usOf(st), ac = aq ? aq.color : NODATA_BAND.color;
      return h('button', { type: 'button', class: 'row', 'aria-pressed': String(st.id === state.selectedId), 'aria-label': T('list.open', { name: stName(st) }), onclick: () => openDetail(st.id) },
        h('span', { class: 'api-pill', style: `background:${col};color:${textOn(col)}`, title: T('idx.my') }, st.api == null ? '–' : st.api, h('small', {}, T('idx.my.short'))),
        h('span', { class: 'api-pill', style: `background:${ac};color:${textOn(ac)}`, title: aq ? `${T('idx.us')} ${T('aqi.' + aq.key)}${tag24(aq)}` : T('idx.us') }, aq ? aq.aqi : '–', h('small', {}, T('idx.us.short') + tag24(aq))),
        h('span', {}, h('span', { class: 'nm', style: 'display:block' }, stName(st), state.myId === st.id ? ' ★' : ''),
          h('span', { class: 'sub', style: 'display:block' }, `${bandWord(b)}${st.pm25 == null ? '' : ' · PM2.5 ' + st.pm25} · ${fmtHM(st.ts)}`)),
        sparkSvg(apiSeries(st.id), 80, 24));
    };
    box.append(h('div', { class: 'list-div' }, T('list.jb')), ...all.filter(s => s.jb).map(mk),
      h('div', { class: 'list-div' }, T('list.rest')), ...all.filter(s => !s.jb).map(mk));
  }

  // ---- trend (Chart.js, lazy)
  let chart = null;
  const SERIES_COLORS = ['#0b5fff', '#d7591c', '#1b9e77', '#7b3fa0'];
  const bandPlugin = {
    id: 'apiBands',
    beforeDraw(c) {
      if (state.metric !== 'api') return;
      const { ctx, chartArea: a, scales: { y } } = c;
      if (!a) return;
      ctx.save();
      API_BANDS.forEach((b, i) => {
        const lo = i ? API_BANDS[i - 1].max : 0, hi = isFinite(b.max) ? b.max : y.max;
        const y1 = y.getPixelForValue(Math.min(hi, y.max)), y2 = y.getPixelForValue(Math.max(lo, y.min));
        if (y2 <= a.top || y1 >= a.bottom || y1 >= y2) return;
        ctx.globalAlpha = 0.16; ctx.fillStyle = b.color;
        ctx.fillRect(a.left, Math.max(y1, a.top), a.right - a.left, Math.min(y2, a.bottom) - Math.max(y1, a.top));
      });
      ctx.restore();
    },
  };
  function trendIds() {
    const main = (headline() || {}).id || state.selectedId;
    const ids = [state.selectedId || main];
    for (const id of state.compare) if (!ids.includes(id) && ids.length < 4) ids.push(id);
    return ids.filter(Boolean);
  }
  function renderTrend() {
    // compare checkboxes
    const cl = $('compare-list'); cl.replaceChildren();
    const primary = state.selectedId || (headline() || {}).id;
    for (const st of stations()) {
      if (st.id === primary) continue;
      const on = state.compare.has(st.id);
      const cb = h('input', { type: 'checkbox', checked: on ? 'checked' : null, onchange: e => { if (e.target.checked) { if (state.compare.size >= 3) { e.target.checked = false; return; } state.compare.add(st.id); } else state.compare.delete(st.id); renderTrend(); } });
      if (on) cb.checked = true;
      cl.append(h('label', {}, cb, ' ', stName(st)));
    }
    if (!state.chartSeen || !state.history) return;
    if (typeof Chart === 'undefined') { $('trend-summary').textContent = T('trend.noChart'); return; }
    const key = state.metric, ids = trendIds().filter(id => state.history.stations[id]);
    if (!ids.length) { $('trend-summary').textContent = T('trend.nodata'); return; }
    const stamps = hourStamps(state.history, 24), labels = stamps.map(d => fmtHM(d));
    const style = getComputedStyle(document.documentElement);
    const txt = style.getPropertyValue('--muted').trim() || '#666', grid = style.getPropertyValue('--border').trim() || '#ddd';
    const datasets = ids.map((id, i) => {
      const data = lastN(state.history.stations[id][key], 24);
      let lastIdx = -1; data.forEach((v, j) => { if (v != null) lastIdx = j; });
      return { label: stName(stationById(id) || { id, name: id }), data, borderColor: SERIES_COLORS[i], backgroundColor: SERIES_COLORS[i], borderWidth: 2,
        spanGaps: false, tension: 0.2, pointRadius: data.map((_, j) => (j === lastIdx ? 5 : 0)), pointHoverRadius: 6, pointHitRadius: 14 };
    });
    const cfg = {
      type: 'line', data: { labels, datasets }, plugins: [bandPlugin],
      options: {
        responsive: true, maintainAspectRatio: false, animation: reduceMotion ? false : { duration: 300 },
        interaction: { mode: 'index', intersect: false },
        plugins: { legend: { display: ids.length > 1, labels: { color: txt, boxWidth: 12 } }, tooltip: { callbacks: { title: items => items[0].label + ' MYT' } } },
        scales: {
          x: { ticks: { color: txt, autoSkip: false, maxRotation: 0, callback(v, i) { return i % 3 === 0 ? labels[i] : ''; } }, grid: { color: grid } },
          y: { beginAtZero: key === 'api', suggestedMax: key === 'api' ? 120 : 60, ticks: { color: txt }, grid: { color: grid }, title: { display: true, text: key === 'api' ? T('idx.name') : T('unit.ugm3'), color: txt } },
        },
      },
    };
    if (chart) { chart.destroy(); chart = null; }
    chart = new Chart($('trend-chart'), cfg);
    // min/max for the main series
    const main = datasets[0].data, present = main.filter(v => v != null);
    const sum = $('trend-summary');
    if (!present.length) sum.textContent = T('trend.nodata');
    else {
      const mn = Math.min(...present), mx = Math.max(...present);
      sum.textContent = T('trend.minmax', { name: datasets[0].label, min: mn, max: mx, tmin: labels[main.indexOf(mn)], tmax: labels[main.lastIndexOf(mx)] });
    }
  }

  // ---- hotspot panel
  function renderHotspotPanel() {
    const hs = state.hotspots, box = $('hs-counts'); box.replaceChildren();
    $('btn-hs').textContent = state.hotspotView ? T('map.back') : T('hs.show');
    const mode = hotspotMode(hs);
    if (mode === 'wms') { box.append(h('p', { class: 'note' }, T('hs.wms'))); $('hs-passes').textContent = ''; return; }
    const rows = Object.entries(hs.counts || {}).map(([k, v]) => ({ k, h: v.h, n: v.n })).sort((a, b) => (b.h + b.n) - (a.h + a.n));
    if (!rows.length) box.append(h('p', { class: 'note' }, T('hs.none')));
    else {
      const high = state.conf === 'high';
      const table = h('table', { class: 'counts' }, h('caption', {}, T('hs.counts')),
        h('thead', {}, h('tr', {}, h('th', {}, ''), h('th', { class: 'n' }, T('hs.high')), high ? null : h('th', { class: 'n' }, T('hs.nominal')))),
        h('tbody', {}, ...rows.map(r => h('tr', {}, h('td', {}, T('region.' + r.k)), h('td', { class: 'n' }, r.h), high ? null : h('td', { class: 'n' }, r.n)))));
      box.append(table);
    }
    const parts = Object.entries(hs.passes || {}).map(([s, t]) => `${s} ${hhmm(t)}`);
    $('hs-passes').textContent = (parts.length ? T('hs.passes') + ': ' + parts.join(' · ') + '. ' : '') + T('hs.updated', { ago: agoText(Date.now() - Date.parse(hs.generated)) }) + (hs.truncated ? ' ' + T('hs.truncated', { n: hs.points.length }) : '');
  }

  // ---- advice / explainer
  function renderAdvice() {
    const cur = apiBand((headline() || {}).api).key, box = $('advice-list'); box.replaceChildren();
    for (const b of API_BANDS) {
      box.append(h('div', { class: 'adv' + (b.key === cur ? ' cur' : ''), 'aria-current': b.key === cur ? 'true' : null },
        h('span', { class: 'sw', style: 'background:' + b.color }),
        h('div', {}, h('b', {}, bandWord(b)), ' ', h('span', { class: 'r' }, `${T('idx.name')} ${T('range.' + b.key)}`)),
        h('p', {}, T('advice.' + b.key))));
    }
  }
  function renderExplainer() {
    const el = $('exp-1'); const st = headline();
    const ex = st && st.pm25_24h != null ? ' ' + T('exp.1.example', { name: stName(st), pm: st.pm25_24h, api: pm25ToApi(st.pm25_24h) }) : '';
    el.textContent = T('exp.1', { example: ex.trim() });
    $('exp-2').textContent = T('exp.2');
  }

  // ---- news
  function renderNews() {
    const box = $('news-list'); box.replaceChildren();
    document.querySelectorAll('#news [role=tab]').forEach(b => { const on = b.dataset.topic === state.topic; b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1; });
    $('news-list').setAttribute('aria-labelledby', 'tab-' + state.topic);
    if (!state.news) { box.append(h('p', { class: 'muted' }, T('status.loading'))); $('news-updated').textContent = ''; return; }
    $('news-updated').textContent = T('news.updated', { time: fmtHM(state.news.generated) + ' MYT' });
    const items = sortNews((state.news.tabs || {})[state.topic], state.lang);
    if (!items.length) { box.append(h('p', { class: 'muted' }, T('news.empty'))); return; }
    for (const it of items) {
      box.append(h('article', { class: 'news-item' },
        h('a', { href: safeUrl(it.u), target: '_blank', rel: 'noopener noreferrer' }, it.t),
        h('div', { class: 'news-meta' }, h('span', {}, it.s), h('span', { class: 'ltag' }, T('news.lang.' + (it.l || 'en'))), h('span', {}, agoText(Date.now() - Date.parse(it.p))))));
    }
  }

  // ---------------------------------------------------------------- events
  let lockToggle = false;
  function setLock(on) {
    lockOn = on; if (!map) return;
    if (on) { map.dragging.enable(); map.touchZoom.enable(); } else { map.dragging.disable(); map.touchZoom.disable(); }
    $('btn-lock').textContent = on ? T('map.lock') : T('map.tap');
  }
  function bind() {
    document.querySelectorAll('.lang button').forEach(b => b.addEventListener('click', () => applyLang(b.dataset.lang, true)));
    $('detail-close').addEventListener('click', closeDetail);
    $('detail-body').addEventListener('click', e => { if (e.target.closest && e.target.closest('a[href^="#"]') && state.sheetOpen) closeDetail(); });
    $('detail').querySelector('.sheet-handle').addEventListener('click', closeDetail);
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && state.sheetOpen) closeDetail(); });
    desktopMQ.addEventListener && desktopMQ.addEventListener('change', syncSheetAria);
    $('btn-lock').addEventListener('click', () => setLock(!lockOn));
    $('btn-back-jb').addEventListener('click', () => setHotspotView(false));
    $('btn-hs').addEventListener('click', () => { setHotspotView(!state.hotspotView); if (state.hotspotView) $('map-wrap').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' }); });
    $('chk-hs').addEventListener('change', e => setHotspotView(e.target.checked));
    $('chk-wind').addEventListener('change', e => { state.layers.wind = e.target.checked; syncLayers(); });
    // The other Johor stations sit 60–150 km north of JB, so zoom out to show them (and back to JB when hidden).
    $('chk-others').addEventListener('change', e => {
      state.layers.others = e.target.checked; syncLayers();
      if (state.hotspotView) return;
      if (e.target.checked) fitJohor(); else fitJB();
    });
    document.querySelectorAll('input[name=hsconf]').forEach(r => r.addEventListener('change', () => { state.conf = r.value; if (r.checked) { renderHotspotsOnMap(); renderHotspotPanel(); } }));
    document.querySelectorAll('input[name=tmetric]').forEach(r => r.addEventListener('change', () => { if (r.checked) { state.metric = r.value; renderTrend(); } }));
    document.querySelectorAll('#news [role=tab]').forEach(b => {
      b.addEventListener('click', () => { state.topic = b.dataset.topic; renderNews(); });
      b.addEventListener('keydown', e => {
        const tabs = [...document.querySelectorAll('#news [role=tab]')]; const i = tabs.indexOf(b);
        const j = e.key === 'ArrowRight' ? (i + 1) % tabs.length : e.key === 'ArrowLeft' ? (i + tabs.length - 1) % tabs.length : -1;
        if (j >= 0) { e.preventDefault(); state.topic = tabs[j].dataset.topic; renderNews(); tabs[j].focus(); }
      });
    });
    $('btn-locate').addEventListener('click', locateMe);
    // time slider
    $('tm-range').addEventListener('input', e => { stopPlay(); setStep(Number(e.target.value)); });
    $('tm-play').addEventListener('click', togglePlay);
    $('tm-now').addEventListener('click', () => { stopPlay(); setStep(Infinity); });
    // place search: suggestions come from the built-in list; the network is used only by the "Search more places" button
    const pq = $('place-q');
    pq.addEventListener('input', () => { renderSuggest(); });
    pq.addEventListener('focus', () => { $('place-list').hidden = false; renderSuggest(); });
    pq.addEventListener('keydown', e => {
      if (e.key === 'Escape') { $('place-list').hidden = true; }
      else if (e.key === 'Enter') { e.preventDefault(); const m = matchPlaces(pq.value); if (m.length) choosePlace(m[0]); }
    });
    $('place-panel').addEventListener('focusout', e => { if (!e.relatedTarget || !$('place-panel').contains(e.relatedTarget)) setTimeout(() => { if (!$('place-panel').contains(document.activeElement)) $('place-list').hidden = true; }, 250); });
    $('place-clear').addEventListener('click', () => { clearPlace(); pq.focus(); });
    document.addEventListener('visibilitychange', () => { if (!document.hidden && Date.now() >= state.nextAt) loadData(false); });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver((es, o) => { if (es.some(e => e.isIntersecting)) { state.chartSeen = true; o.disconnect(); renderTrend(); } }, { rootMargin: '200px' }).observe($('trend'));
    } else { state.chartSeen = true; }
    darkMQ.addEventListener && darkMQ.addEventListener('change', () => renderTrend());
  }

  async function start() {
    state.myId = safeLoad(LS_STATION);
    try { state.place = clampPlace(Object.assign({}, JSON.parse(safeLoad(LS_PLACE) || 'null'))); } catch (_) { state.place = null; }
    if (state.place) $('place-q').value = state.place.name;
    bind();
    initMap();
    applyLang(initialLang(), true);
    await loadMeta();
    loadJBWind();
    await loadData(true);
    setInterval(() => {
      if (document.hidden) return;
      renderStatus();
      if (Date.now() >= state.nextAt) loadData(false);
    }, 1000);
    // second pass: list/detail names need meta
    drawPlaceMarker();
    renderAll();
    syncSheetAria();
  }
  start();
}
