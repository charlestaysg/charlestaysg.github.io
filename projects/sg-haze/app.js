/* SG Haze Dashboard front end. Plain browser JS, no build step.
 * Pure helpers (nowcast, pm25ToAqi, neaBand, haversine ...) are exported for node tests. */
'use strict';

// Where the "Suggest an improvement" card/link points. The card is hidden while this starts with '#'.
const FEEDBACK_URL = 'https://claude.ai/artifact/NABrs71DEHEAZ2quWCKfFX';

// ------------------------------------------------------------------ constants
const DGS = 'https://api-open.data.gov.sg/v2/real-time/api/';
const PM25_URL = DGS + 'pm25';
const WIND_DIR_URL = DGS + 'wind-direction';
const WIND_SPEED_URL = DGS + 'wind-speed';
const FORECAST_URL = DGS + 'two-hr-forecast';
const ONEMAP_URL = 'https://www.onemap.gov.sg/api/common/elastic/search';
const REGIONS = ['north', 'south', 'east', 'west', 'central'];
const REGION_COLORS = { north: '#1f77b4', south: '#ff7f0e', east: '#2ca02c', west: '#9467bd', central: '#d62728' };
const REGION_DASH = { north: [], south: [6, 4], east: [2, 3], west: [8, 3, 2, 3], central: [12, 4] };
const TZ = 'Asia/Singapore';
const POSTAL_KEY = 'sgHaze.postal';
const DATA_MS = 5 * 60 * 1000;
const SLOW_MS = 10 * 60 * 1000;
const YESTERDAY_MS = 60 * 60 * 1000;
const STALE_MIN = 90;
const NOWCAST_HOURS = 12;
const HAZE_URL = 'https://www.haze.gov.sg';
const HOSPITAL_ACRONYMS = {
  'Alexandra Hospital': 'AH', 'National University Hospital': 'NUH', 'Ng Teng Fong General Hospital': 'NTFGH',
  'Singapore General Hospital': 'SGH', 'Changi General Hospital': 'CGH', 'Sengkang General Hospital': 'SKH',
  'Tan Tock Seng Hospital': 'TTSH', 'Khoo Teck Puat Hospital': 'KTPH',
  "KK Women's and Children's Hospital": 'KKH',
};
function hospitalLabel(name) {
  const a = HOSPITAL_ACRONYMS[name];
  return a && !name.includes('(') ? `${name} (${a})` : name;
}
const NUHS_URL = 'https://www.nuhs.edu.sg/patient-care/emergency-department-wait-times';
const CNA = 'https://www.channelnewsasia.com/api/v1/rss-outbound-feed?_format=xml';
const NEWS_FEEDS = [
  { url: CNA, source: 'CNA' },
  { url: CNA + '&category=10416', source: 'CNA' },
  { url: CNA + '&category=6511', source: 'CNA' },
  { url: 'https://en.antaranews.com/rss/news.xml', source: 'ANTARA' },
];
const NEWS_TOP_N = 6;
const NEWS_WINDOW_DAYS = { 'sg-govt': 3, impact: 3, indonesia: 7 };

// ------------------------------------------------------------------ SG time helpers
const sgFmt = new Intl.DateTimeFormat('en-GB', {
  timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
});
function sgParts(date) {
  const o = {};
  for (const p of sgFmt.formatToParts(date)) o[p.type] = p.value;
  return o;
}
function sgDateStr(date) { const p = sgParts(date); return `${p.year}-${p.month}-${p.day}`; }
function sgHM(date) { const p = sgParts(date); return `${p.hour}:${p.minute}`; }
function sgYesterdayStr(now = new Date()) { return sgDateStr(new Date(now.getTime() - 86400000)); }

// ------------------------------------------------------------------ pure helpers
const NEA_BANDS = [
  { level: 1, roman: 'I', name: 'Normal', max: 55, color: '#3fae5a',
    health: 'Normal activities.',
    verdict: 'Good for outdoor activities.' },
  { level: 2, roman: 'II', name: 'Elevated', max: 150, color: '#f5b400',
    health: "Reduce prolonged or strenuous outdoor activity if you're elderly, pregnant, a child, or have heart/lung conditions.",
    verdict: "OK for a walk; cut long or hard outdoor exercise if you're in a vulnerable group." },
  { level: 3, roman: 'III', name: 'High', max: 250, color: '#f0702a',
    health: 'Everyone minimise prolonged outdoor exertion; vulnerable groups avoid it.',
    verdict: 'Keep outdoor time short; vulnerable people stay indoors.' },
  { level: 4, roman: 'IV', name: 'Very High', max: Infinity, color: '#c8102e',
    health: 'Avoid outdoor activity; vulnerable groups stay indoors.',
    verdict: 'Stay indoors where you can; N95 if you must go out.' },
];
function neaBand(pm) {
  return NEA_BANDS.find(b => pm <= b.max) || NEA_BANDS[3];
}

const AQI_BREAKPOINTS = [ // [cLo, cHi, iLo, iHi], US EPA 2024 PM2.5
  [0, 9.0, 0, 50], [9.1, 35.4, 51, 100], [35.5, 55.4, 101, 150],
  [55.5, 125.4, 151, 200], [125.5, 225.4, 201, 300], [225.5, 325.4, 301, 500],
];
const AQI_CATS = [
  { max: 50, name: 'Good', color: '#00e400', health: 'Air quality is satisfactory.' },
  { max: 100, name: 'Moderate', color: '#ffff00', health: 'Unusually sensitive people may want to reduce prolonged outdoor exertion.' },
  { max: 150, name: 'Unhealthy for Sensitive Groups', color: '#ff7e00', health: 'Sensitive groups should reduce prolonged outdoor exertion.' },
  { max: 200, name: 'Unhealthy', color: '#ff0000', health: 'Everyone may begin to feel effects; sensitive groups more seriously.' },
  { max: 300, name: 'Very Unhealthy', color: '#8f3f97', health: 'Health alert: everyone may experience more serious effects.' },
  { max: Infinity, name: 'Hazardous', color: '#7e0023', health: 'Emergency conditions: everyone is likely to be affected.' },
];
function aqiCategory(aqi) {
  return AQI_CATS.find(c => aqi <= c.max) || AQI_CATS[5];
}
function pm25ToAqi(c) {
  if (c == null || isNaN(c)) return null;
  c = Math.floor(c * 10 + 1e-6) / 10; // EPA truncates to 0.1
  let aqi = 500;
  if (c <= 325.4) {
    const bp = AQI_BREAKPOINTS.find(b => c <= b[1]);
    aqi = Math.round((bp[3] - bp[2]) / (bp[1] - bp[0]) * (c - bp[0]) + bp[2]);
  }
  return Object.assign({ aqi }, aqiCategory(aqi));
}

/** NowCast PM2.5. `values` newest-first (null = missing), up to 12 hours. Returns µg/m³ (1 dp) or null. */
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

const COMPASS = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
function compass(deg) { return COMPASS[Math.round((((deg % 360) + 360) % 360) / 22.5) % 16]; }
/** Speed-weighted vector mean of "from" directions. Returns {from, speed} or null. */
function meanWind(stations) {
  let u = 0, v = 0, s = 0, n = 0;
  for (const st of stations) {
    if (st.dir == null || st.speed == null) continue;
    const r = st.dir * Math.PI / 180;
    u += -st.speed * Math.sin(r); v += -st.speed * Math.cos(r); s += st.speed; n++;
  }
  if (!n) return null;
  u /= n; v /= n;
  const from = ((Math.atan2(-u, -v) * 180 / Math.PI) + 360) % 360;
  return { from, speed: Math.hypot(u, v), meanSpeed: s / n };
}

function isRain(text) { return /rain|showers|thundery/i.test(text || ''); }
function textOn(hex) {
  const n = parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(x => {
    x /= 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
  });
  return (0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2]) > 0.55 ? '#111111' : '#ffffff';
}
// MOH's list has a few blank or malformed numbers; only 8-digit SG numbers get a call link.
function validTel(tel) { return /^[3689]\d{7}$/.test(String(tel || '').replace(/\D/g, '')); }
function formatPhone(tel) {
  const d = String(tel || '').replace(/\D/g, '');
  return d.length === 8 ? `${d.slice(0, 4)} ${d.slice(4)}` : d;
}
function cap(s) { return s ? s[0].toUpperCase() + s.slice(1) : s; }
function rainSummary(areas, validText) {
  const total = areas.length;
  const rainy = areas.filter(a => isRain(a.forecast)).length;
  let [a, b] = (validText || '').split(' to ');
  if (a && b && a.slice(-2) === b.slice(-2)) a = a.slice(0, -3);
  const span = a && b ? `${a}–${b}` : (validText || '');
  return rainy
    ? `Rain in ${rainy} of ${total} areas, ${span}`
    : `No rain expected until ${b || 'later'}`;
}
function parseWind(dirJson, spdJson) {
  const stations = (dirJson.data.stations || []);
  const spd = {};
  for (const r of ((spdJson.data.readings || [])[0] || {}).data || []) spd[r.stationId] = r.value;
  const dir = {};
  for (const r of ((dirJson.data.readings || [])[0] || {}).data || []) dir[r.stationId] = r.value;
  return stations.filter(s => s.location && dir[s.id] != null && spd[s.id] != null)
    .map(s => ({ id: s.id, name: s.name, lat: s.location.latitude, lng: s.location.longitude, dir: dir[s.id], speed: spd[s.id] }));
}

// ------------------------------------------------------------------ news (client-side RSS)
const NEWS_STOPWORDS = new Set(('a an the of in on at to for and or with from by as is are was were be been ' +
  'its it this that these those after over amid says say said new more than into out up singapore haze hazy').split(' '));
const HAZE_RE = [/\bhaze\b/i, /\bsmoke\b/i, /\bPM\s?2\.5\b/i, /\bair quality\b/i, /\bPSI\b/, /\bforest fires?\b/i,
  /\bpeat/i, /\bhotspots?\b/i, /\bkarhutla\b/i, /\bkebakaran\b/i, /\bwater bomb/i, /\bcloud seeding\b/i,
  /\bN95\b/i, /\btransboundary\b/i];
const INDO_RE = /\b(Indonesia|Indonesian|Jakarta|Sumatra|Kalimantan|Riau|Jambi)\b|\b(BNPB|KLHK)\b/i;
// Acronyms are case-sensitive so "mom" or "nea" as ordinary words do not match.
const SG_STRONG_RE = /\b(NEA|MOH|MOE|MOM|MSE)\b|\bGrace Fu\b|\bpolyclinics?\b/;
const SG_WORD_RE = /\b(ministry|minister|government|subsid(y|ies)|advisory|scheme)\b/i;

function stripHtml(s) {
  return String(s || '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'").replace(/\s+/g, ' ').trim();
}
function titleWords(title) {
  const t = String(title || '').toLowerCase().replace(/[^\w\s]/g, ' ');
  return new Set(t.split(/\s+/).filter(w => w.length > 1 && !NEWS_STOPWORDS.has(w)));
}
function jaccard(a, b) {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  return inter / (a.size + b.size - inter);
}
function normLink(l) { return String(l || '').trim().replace(/[?#].*$/, '').replace(/\/+$/, '').toLowerCase(); }
function isHazeNews(it) {
  const text = `${it.title} ${it.description || ''}`;
  return HAZE_RE.some(re => re.test(text));
}
/** Route an item to 'sg-govt' | 'impact' | 'indonesia'. Priority Indonesia > SG govt > Impact,
 *  except Singapore-government items that mention Indonesia go to SG govt. */
function routeNews(it) {
  const text = `${it.title} ${it.description || ''}`;
  const indo = it.source === 'ANTARA' || INDO_RE.test(text);
  const sgStrong = SG_STRONG_RE.test(text) || (SG_WORD_RE.test(text) && /\bSingapore\b/i.test(text));
  const sgAny = SG_STRONG_RE.test(text) || SG_WORD_RE.test(text);
  if (indo && sgStrong) return 'sg-govt';
  if (indo) return 'indonesia';
  if (sgAny) return 'sg-govt';
  return 'impact';
}
/** items: [{title, description, link, source, published(ISO)}]. Returns {topic: [items]} (each item in at most one tab). */
function organiseNews(items, now = Date.now(), limit = NEWS_TOP_N) {
  const kept = [], seenLinks = new Set();
  const sorted = items.filter(isHazeNews)
    .map(it => ({ ...it, _t: Date.parse(it.published) || 0, _words: titleWords(it.title) }))
    .sort((a, b) => b._t - a._t);
  for (const it of sorted) {
    const nl = normLink(it.link);
    if (nl && seenLinks.has(nl)) continue;
    if (kept.some(k => jaccard(it._words, k._words) >= 0.5)) continue;
    if (nl) seenLinks.add(nl);
    kept.push(it);
  }
  const out = { 'sg-govt': [], impact: [], indonesia: [] };
  for (const it of kept) {
    const topic = routeNews(it);
    const days = NEWS_WINDOW_DAYS[topic];
    if (!it._t || it._t < now - days * 86400000) continue;
    if (out[topic].length < limit) out[topic].push({ title: it.title, source: it.source, link: it.link, published: it.published });
  }
  return out;
}
/** Parse an RSS document (string) with DOMParser (browser) or a supplied parser. */
function parseFeed(xmlText, source, Parser) {
  const doc = new (Parser || DOMParser)().parseFromString(xmlText, 'text/xml');
  if (doc.querySelector && doc.querySelector('parsererror')) throw new Error('bad xml');
  const txt = (el, tag) => { const n = el.getElementsByTagName(tag)[0]; return n ? (n.textContent || '').trim() : ''; };
  return [...doc.getElementsByTagName('item')].map(el => {
    const d = new Date(txt(el, 'pubDate'));
    return {
      title: stripHtml(txt(el, 'title')), description: stripHtml(txt(el, 'description')),
      link: txt(el, 'link'), source, published: isNaN(d) ? '' : d.toISOString(),
    };
  }).filter(it => it.title && it.link);
}

if (typeof module !== 'undefined') {
  module.exports = { nowcast, pm25ToAqi, neaBand, haversine, nearest, compass, meanWind, isRain, textOn,
    formatPhone, validTel, rainSummary, hospitalLabel, parseWind, aqiCategory, sgDateStr, sgHM,
    organiseNews, routeNews, isHazeNews, parseFeed, titleWords, jaccard, stripHtml };
}

// ------------------------------------------------------------------ browser app
if (typeof document !== 'undefined') {
  /* ---------- state ---------- */
  const state = {
    regionMeta: {},      // key -> {lat,lng}
    items: [],           // [{timestamp, readings:{key:value}}] sorted ascending
    yesterdayItems: [],
    yesterdayFetchedAt: 0,
    yesterdayDate: '',
    lastSuccess: 0,
    nextDataAt: 0,
    computed: {},        // key -> {pm, aqi{...}, ts, series[]}
    wind: [],
    forecast: null,      // {areas:[{name,lat,lng,forecast}], validText}
    news: {},
    newsTab: 'sg-govt',
    postal: null,        // {code, lat, lng, address}  (code null for geolocation)
    clinics: null,
    metric: 'nea',
  };
  let map = null, pillMarkers = {}, windLayer = null, weatherLayer = null, clinicLayer = null, tileLayer = null, chart = null;
  let dgsCalls = 0;

  /* ---------- tiny DOM helpers ---------- */
  const $ = id => document.getElementById(id);
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
  function safeStore(key, val) {
    try { if (val == null) localStorage.removeItem(key); else localStorage.setItem(key, val); } catch (_) { /* private mode */ }
  }
  function safeLoad(key) { try { return localStorage.getItem(key); } catch (_) { return null; } }
  function safeUrl(u) { return /^https?:\/\//i.test(u || '') ? u : '#'; }
  let toastTimer = null;
  function toast(msg) {
    const t = $('toast'); t.textContent = msg; t.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.hidden = true; }, 5000);
  }
  function banner(msg) { const b = $('error-banner'); b.textContent = msg || ''; b.hidden = !msg; }
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  function ago(ms) {
    const m = Math.round(ms / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m} min ago`;
    const hr = Math.floor(m / 60);
    return hr < 24 ? `${hr} h ${m % 60} min ago` : `${Math.floor(hr / 24)} d ago`;
  }

  /* ---------- data.gov.sg ---------- */
  async function dgsGet(url, budget = 4) {
    for (let attempt = 0; attempt < 2; attempt++) {
      if (dgsCalls >= budget) throw new Error('data.gov.sg call budget reached');
      dgsCalls++;
      const ctl = new AbortController();
      const timer = setTimeout(() => ctl.abort(), 10000);
      let json = null, status = 0;
      try {
        const res = await fetch(url, { signal: ctl.signal });
        status = res.status;
        try { json = await res.json(); } catch (_) { json = null; }
      } finally { clearTimeout(timer); }
      const limited = status === 429 || (json && json.code === 24);
      if (limited && attempt === 0) { await sleep(10000); continue; }
      if (!json || json.code !== 0) throw new Error(`data.gov.sg error (${status || 'network'}${json && json.code != null ? ' code ' + json.code : ''})`);
      return json;
    }
    throw new Error('data.gov.sg rate limited');
  }

  async function fetchPm25Day(dateStr, budget) {
    let items = [], meta = null, token = null;
    for (let page = 0; page < 3; page++) {
      const q = `?date=${dateStr}` + (token ? `&paginationToken=${encodeURIComponent(token)}` : '');
      const json = await dgsGet(PM25_URL + q, budget);
      meta = meta || json.data.regionMetadata;
      items = items.concat(json.data.items || []);
      token = json.data.paginationToken;
      if (!token) break;
      await sleep(1000);
    }
    return { items, meta };
  }

  function mergeItems(...lists) {
    const m = new Map();
    for (const it of lists.flat()) m.set(it.timestamp, it);
    return [...m.values()].sort((a, b) => a.timestamp < b.timestamp ? -1 : 1);
  }

  /* ---------- computation ---------- */
  function computeAll() {
    const all = mergeItems(state.yesterdayItems, state.items);
    const out = {};
    for (const key of REGIONS) {
      const vals = all.map(it => (it.readings.pm25_one_hourly || {})[key]).map(v => (v == null ? null : v));
      const series = vals.map((v, i) => {
        const hist = [];
        for (let j = i; j > i - NOWCAST_HOURS && j >= 0; j--) hist.push(vals[j]);
        const nc = nowcast(hist);
        return { ts: all[i].timestamp, pm: v, aqi: nc == null ? null : pm25ToAqi(nc) };
      });
      let last = null;
      for (let i = series.length - 1; i >= 0; i--) if (series[i].pm != null) { last = series[i]; break; }
      out[key] = last ? { pm: last.pm, aqi: last.aqi, ts: last.ts, series } : { pm: null, aqi: null, ts: null, series };
    }
    state.computed = out;
  }

  /* ---------- loaders ---------- */
  async function loadData() {
    dgsCalls = 0;
    try {
      const today = sgDateStr(new Date());
      const day = await fetchPm25Day(today);
      state.items = day.items;
      if (day.meta) {
        for (const r of day.meta) state.regionMeta[r.name] = { lat: r.labelLocation.latitude, lng: r.labelLocation.longitude };
      }
      const needY = Date.now() - state.yesterdayFetchedAt > YESTERDAY_MS || state.yesterdayDate !== sgYesterdayStr();
      if (needY) {
        await sleep(1000);
        try {
          state.yesterdayItems = (await fetchPm25Day(sgYesterdayStr())).items;
          state.yesterdayFetchedAt = Date.now();
          state.yesterdayDate = sgYesterdayStr();
        } catch (e) { /* keep older yesterday data; NowCast copes with gaps */ }
      }
      state.lastSuccess = Date.now();
      computeAll();
      renderAll();
      banner('');
    } catch (e) {
      banner(`Could not refresh NEA data (${e.message}). Showing the last data received. Check haze.gov.sg for official readings.`);
    }
    try { await sleep(1000); await loadWind(); } catch (_) { /* wind is optional */ }
    state.nextDataAt = Date.now() + DATA_MS;
    renderStatus();
  }

  async function loadWind() {
    const dir = await dgsGet(WIND_DIR_URL, 4);
    await sleep(1000);
    const spd = await dgsGet(WIND_SPEED_URL, 4);
    state.wind = parseWind(dir, spd);
    renderWind();
  }

  async function loadForecast() {
    dgsCalls = 0; // separate cycle; counted on its own
    try {
      const j = await dgsGet(FORECAST_URL, 2);
      const item = (j.data.items || [])[0];
      if (!item) throw new Error('no forecast');
      const meta = {};
      for (const a of j.data.area_metadata || []) meta[a.name] = a.label_location;
      const areas = (item.forecasts || []).filter(f => meta[f.area]).map(f => ({
        name: f.area, lat: meta[f.area].latitude, lng: meta[f.area].longitude, forecast: f.forecast,
      }));
      state.forecast = { areas, validText: (item.valid_period || {}).text || '' };
      renderForecast();
    } catch (e) {
      $('rain-chip').hidden = true;
    }
  }

  async function fetchFeed(feed) {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 12000);
    try {
      const res = await fetch(feed.url, { signal: ctl.signal });
      if (!res.ok) throw new Error(res.status);
      return parseFeed(await res.text(), feed.source);
    } finally { clearTimeout(timer); }
  }
  async function loadAllNews() {
    const results = await Promise.allSettled(NEWS_FEEDS.map(fetchFeed));
    const ok = results.filter(r => r.status === 'fulfilled');
    if (!ok.length) {
      for (const t of Object.keys(NEWS_WINDOW_DAYS)) if (!state.news[t] || state.news[t].error) state.news[t] = { error: true, items: [] };
    } else {
      const organised = organiseNews(ok.flatMap(r => r.value));
      const fetchedAt = new Date().toISOString();
      for (const t of Object.keys(organised)) state.news[t] = { topic: t, fetchedAt, items: organised[t] };
    }
    renderNews();
  }

  /* ---------- rendering: status, banner ---------- */
  function latestTs() {
    let t = null;
    for (const k of REGIONS) { const c = state.computed[k]; if (c && c.ts && (!t || c.ts > t)) t = c.ts; }
    return t;
  }
  function renderStatus() {
    const t = latestTs();
    $('nea-time').textContent = t ? sgHM(new Date(t)) : '—';
    $('nea-ago').textContent = state.lastSuccess ? ago(Date.now() - state.lastSuccess) : '—';
    const left = Math.max(0, Math.round((state.nextDataAt - Date.now()) / 1000));
    $('countdown').textContent = state.nextDataAt ? `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}` : '—';
    if (t && Date.now() - new Date(t).getTime() > STALE_MIN * 60000 && $('error-banner').hidden) {
      banner('NEA data may be delayed. Check haze.gov.sg for the latest official readings.');
    }
  }

  /* ---------- rendering: region cards ---------- */
  function bar(kind, value, max) {
    const pct = value == null ? 0 : Math.min(100, Math.max(0, value / max * 100));
    return h('div', { class: `bar ${kind}`, role: 'img', 'aria-label': value == null ? 'no data' : String(value) },
      value == null ? null : h('span', { class: 'marker', style: `left:${pct}%` }));
  }
  function aqiFor(key) {
    const c = state.computed[key];
    return c && c.aqi ? c.aqi : null;
  }
  function renderCard(key) {
    const card = $('region-' + key);
    const c = state.computed[key];
    card.classList.remove('skeleton');
    card.replaceChildren();
    if (!c || c.pm == null) {
      card.append(h('header', null, h('h3', null, key)), h('p', { class: 'muted' }, 'No data'));
      return;
    }
    const band = neaBand(c.pm), aq = aqiFor(key);
    const nea = h('div', { class: 'half nea' },
      h('div', { class: 'label' }, h('abbr', { title: 'National Environment Agency' }, 'NEA'), ' 1-hr ', h('abbr', { title: 'fine particles 2.5 micrometres or smaller' }, 'PM2.5')),
      h('div', { class: 'value' }, String(c.pm), h('span', { class: 'unit' }, h('abbr', { title: 'micrograms per cubic metre' }, 'µg/m³'))),
      h('div', { class: 'band', style: `border-left:4px solid ${band.color};padding-left:6px` }, `Band ${band.roman} · ${band.name}`),
      bar('nea', c.pm, 300),
      h('p', { class: 'health' }, band.health, ' ', h('a', { href: HAZE_URL, target: '_blank', rel: 'noopener' }, 'NEA advisory →')));
    const aqiHalf = h('div', { class: 'half aqi' },
      h('div', { class: 'label' }, 'US ', h('abbr', { title: 'Air Quality Index' }, 'AQI'), h('small', null, 'computed from NEA data, matches aqicn method')),
      h('div', { class: 'value' }, aq ? String(aq.aqi) : '—'),
      h('div', { class: 'band', style: aq ? `border-left:4px solid ${aq.color};padding-left:6px` : '' }, aq ? aq.name : 'insufficient hours'),
      bar('aqi', aq ? aq.aqi : null, 500),
      h('p', { class: 'health' }, aq ? aq.health : 'Not enough recent hourly readings to compute NowCast.'));
    card.append(h('header', null, h('h3', null, key), h('span', { class: 'updated' }, sgHM(new Date(c.ts)))),
      h('div', { class: 'pair' }, nea, aqiHalf));
  }

  /* ---------- rendering: map ---------- */
  function initMap() {
    if (typeof L === 'undefined') { document.querySelector('.map-fallback').hidden = false; return; }
    map = L.map('map', { scrollWheelZoom: false, zoomSnap: 0.25 }).setView([1.3521, 103.8198], 11);
    setTiles();
    fitRegions();
    window.addEventListener('resize', fitRegions);
    windLayer = L.layerGroup().addTo(map);
    weatherLayer = L.layerGroup();
    clinicLayer = L.layerGroup().addTo(map);
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', setTiles);
  }
  // On narrow screens, zoom out just enough that all five region badges stay fully inside the map.
  function fitRegions() {
    if (!map || window.innerWidth >= 500) return;
    map.fitBounds([[1.41803, 103.70], [1.29587, 103.94]], { paddingTopLeft: [48, 24], paddingBottomRight: [48, 24] });
  }
  function setTiles() {
    if (!map) return;
    if (tileLayer) map.removeLayer(tileLayer);
    const dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    // OneMap (Singapore Land Authority) basemap: free, no key; Grey keeps band colours readable.
    tileLayer = L.tileLayer(`https://www.onemap.gov.sg/maps/tiles/${dark ? 'Night' : 'Grey'}/{z}/{x}/{y}.png`, {
      minZoom: 9, minNativeZoom: 11, maxZoom: 19, detectRetina: true, // detectRetina adds 1 to minZoom on high-DPI screens
      attribution: '<img src="https://www.onemap.gov.sg/web-assets/images/logo/om_logo.png" style="height:14px;width:14px"> <a href="https://www.onemap.gov.sg/" target="_blank" rel="noopener">OneMap</a> © contributors | <a href="https://www.sla.gov.sg/" target="_blank" rel="noopener">Singapore Land Authority</a>',
    }).addTo(map);
  }
  function pillHtml(key) {
    const c = state.computed[key];
    if (!c || c.pm == null) return '<div class="pill"><span>—</span></div>';
    const band = neaBand(c.pm), aq = aqiFor(key);
    const aqPart = aq
      ? `<span style="background:${aq.color};color:${textOn(aq.color)}">${aq.aqi}</span>` : '<span>—</span>';
    return `<div class="pill"><span style="background:${band.color};color:${textOn(band.color)}">${c.pm}</span>${aqPart}</div>`;
  }
  function renderMap() {
    if (!map) return;
    for (const key of REGIONS) {
      const m = state.regionMeta[key];
      if (!m) continue;
      const c = state.computed[key], aq = aqiFor(key);
      const icon = L.divIcon({ className: 'leaflet-div-icon pill-icon', html: pillHtml(key), iconSize: [88, 26], iconAnchor: [44, 13] });
      const title = c && c.pm != null ? `${cap(key)}: NEA ${c.pm} µg/m³ · US AQI ${aq ? aq.aqi : '—'}` : `${cap(key)}: no data`;
      if (pillMarkers[key]) { pillMarkers[key].setIcon(icon); pillMarkers[key].getElement() && pillMarkers[key].getElement().setAttribute('title', title); }
      else {
        pillMarkers[key] = L.marker([m.lat, m.lng], { icon, title, zIndexOffset: 1000 }).addTo(map);
        pillMarkers[key].on('click', () => $('region-' + key).scrollIntoView({ behavior: 'smooth', block: 'center' }));
      }
    }
  }
  function renderWind() {
    const chip = $('wind-chip');
    const mean = meanWind(state.wind);
    if (mean) {
      chip.hidden = false;
      chip.textContent = `Wind from ${compass(mean.from)}, ${Math.round(mean.speed)} kn`;
    } else chip.hidden = true;
    if (!map) return;
    windLayer.clearLayers();
    for (const s of state.wind) {
      if (!s.speed) continue;
      const to = (s.dir + 180) % 360;
      const svg = `<svg width="18" height="18" viewBox="0 0 18 18" style="transform:rotate(${to}deg)" aria-hidden="true"><path d="M9 1 L14 16 L9 12.5 L4 16 Z" fill="#1565c0" stroke="#fff" stroke-width="1"/></svg>`;
      L.marker([s.lat, s.lng], {
        icon: L.divIcon({ className: 'leaflet-div-icon wind-icon', html: svg, iconSize: [18, 18], iconAnchor: [9, 9] }),
        zIndexOffset: -1000, keyboard: false,
      }).bindTooltip(`From ${compass(s.dir)} · ${Math.round(s.speed)} kn`).addTo(windLayer);
    }
  }
  function weatherEmoji(f) {
    if (/thundery/i.test(f)) return '⛈️';
    if (/rain|showers/i.test(f)) return '🌧️';
    if (/haz/i.test(f)) return '🌫️';
    if (/partly/i.test(f)) return '⛅';
    if (/cloudy|overcast/i.test(f)) return '☁️';
    if (/fair|sunny/i.test(f)) return '☀️';
    return '🌤️';
  }
  function renderWeatherLayer() {
    if (!map || !state.forecast) return;
    weatherLayer.clearLayers();
    for (const a of state.forecast.areas) {
      L.marker([a.lat, a.lng], {
        icon: L.divIcon({ className: 'leaflet-div-icon weather-icon-wrap', html: `<span class="weather-icon">${weatherEmoji(a.forecast)}</span>`, iconSize: [20, 20], iconAnchor: [10, 10] }),
        keyboard: false, zIndexOffset: -500,
      }).bindTooltip(`${a.name}: ${a.forecast}`).addTo(weatherLayer);
    }
  }

  /* ---------- rendering: trend chart ---------- */
  function renderTrend() {
    if (typeof Chart === 'undefined') {
      const wrap = document.querySelector('.chart-wrap');
      wrap.replaceChildren(h('p', { class: 'muted' }, 'Chart unavailable.'));
      return;
    }
    const today = sgDateStr(new Date());
    const any = state.computed.central.series.length ? state.computed.central.series : state.computed.north.series;
    const idx = [];
    any.forEach((p, i) => { if (sgDateStr(new Date(p.ts)) === today) idx.push(i); });
    const labels = idx.map(i => sgHM(new Date(any[i].ts)));
    const style = getComputedStyle(document.documentElement);
    const muted = style.getPropertyValue('--muted').trim() || '#666';
    const grid = style.getPropertyValue('--border').trim() || '#ddd';
    const datasets = REGIONS.map(key => ({
      label: cap(key), borderColor: REGION_COLORS[key], backgroundColor: REGION_COLORS[key],
      borderDash: REGION_DASH[key], borderWidth: 2, pointRadius: 2, tension: 0.2, spanGaps: true,
      data: idx.map(i => {
        const p = state.computed[key].series[i];
        if (!p) return null;
        return state.metric === 'nea' ? p.pm : (p.aqi ? p.aqi.aqi : null);
      }),
    }));
    if (chart) { chart.data.labels = labels; chart.data.datasets = datasets; chart.options.scales.y.title.text = state.metric === 'nea' ? 'µg/m³' : 'US AQI'; chart.update(); return; }
    chart = new Chart($('trend-chart'), {
      type: 'line', data: { labels, datasets },
      options: {
        responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false },
        plugins: { legend: { labels: { color: muted } } },
        scales: {
          x: { ticks: { color: muted }, grid: { color: grid } },
          y: { beginAtZero: true, ticks: { color: muted }, grid: { color: grid }, title: { display: true, text: 'µg/m³', color: muted } },
        },
      },
    });
  }

  /* ---------- rendering: my area, forecast ---------- */
  function areaRegionKey() {
    if (!state.postal) return null;
    const list = REGIONS.filter(k => state.regionMeta[k]).map(k => Object.assign({ key: k }, state.regionMeta[k]));
    return list.length ? nearest(list, state.postal.lat, state.postal.lng, 1)[0].key : null;
  }
  function renderMyArea() {
    const head = $('myarea-headline'), verdict = $('myarea-verdict'), rain = $('myarea-rain');
    rain.hidden = true;
    $('myarea-forget').hidden = !state.postal;
    const have = REGIONS.filter(k => state.computed[k] && state.computed[k].pm != null);
    if (!have.length) { head.textContent = 'Waiting for NEA readings…'; verdict.textContent = ''; return; }
    const describe = key => {
      const c = state.computed[key], b = neaBand(c.pm), aq = aqiFor(key);
      return { b, text: `Band ${b.roman} ${b.name} (${c.pm} µg/m³)` + (aq ? `, US AQI ${aq.aqi} ${aq.name}` : '') };
    };
    let key, label;
    const areaKey = areaRegionKey();
    if (areaKey && state.computed[areaKey] && state.computed[areaKey].pm != null) {
      key = areaKey;
      let place = state.postal.address ? '' : 'Your location';
      if (state.forecast && state.forecast.areas.length) place = nearest(state.forecast.areas, state.postal.lat, state.postal.lng, 1)[0].name;
      const d = describe(key);
      head.textContent = `${place} · ${cap(key)} region: ${d.b.name === '' ? '' : `Band ${d.b.roman} ${d.b.name} (${state.computed[key].pm} µg/m³)`}` +
        (aqiFor(key) ? ` · US AQI ${aqiFor(key).aqi} ${aqiFor(key).name}` : '');
      label = d;
    } else {
      key = have.reduce((w, k) => (state.computed[k].pm > state.computed[w].pm ? k : w), have[0]);
      const d = describe(key);
      head.textContent = `Worst now: ${cap(key)} — ${d.text}`;
      label = d;
    }
    verdict.textContent = label.b.verdict;
    if (areaKey && state.forecast) {
      const fa = nearest(state.forecast.areas, state.postal.lat, state.postal.lng, 2);
      if (fa.some(a => isRain(a.forecast))) {
        rain.textContent = 'Rain expected in the next 2 hours — may help clear haze.';
        rain.hidden = false;
      }
    }
  }
  function renderForecast() {
    const f = state.forecast;
    if (!f) return;
    const chip = $('rain-chip');
    chip.hidden = false;
    chip.textContent = rainSummary(f.areas, f.validText);
    renderWeatherLayer();
    renderMyArea();
  }

  /* ---------- rendering: news ---------- */
  function relTime(iso) {
    const t = Date.parse(iso);
    return isNaN(t) ? '' : ago(Date.now() - t);
  }
  function renderNews() {
    const box = $('news-list');
    const d = state.news[state.newsTab];
    box.replaceChildren();
    if (!d) { box.append(h('p', { class: 'muted' }, 'Loading…')); return; }
    if (d.error) { box.append(h('p', { class: 'muted' }, 'News feed unavailable')); return; }
    if (!d.items.length) box.append(h('p', { class: 'muted' }, 'No recent stories.'));
    for (const it of d.items) {
      box.append(h('div', { class: 'news-item' },
        h('a', { href: safeUrl(it.link), target: '_blank', rel: 'noopener', title: it.title }, it.title),
        h('div', { class: 'news-meta' }, h('span', null, it.source), h('span', null, relTime(it.published)))));
    }
    $('news-updated').textContent = d.fetchedAt ? `Updated ${sgHM(new Date(d.fetchedAt))}` : '';
  }
  function bindTabs() {
    document.querySelectorAll('[role="tab"]').forEach(tab => tab.addEventListener('click', () => {
      state.newsTab = tab.dataset.topic;
      document.querySelectorAll('[role="tab"]').forEach(t => t.setAttribute('aria-selected', String(t === tab)));
      renderNews();
    }));
  }

  /* ---------- A&E ---------- */
  async function loadHospitals() {
    const box = $('hospital-links');
    try {
      const list = await (await fetch('data/hospitals.json')).json();
      box.replaceChildren();
      for (const [type, title] of [['public', 'Public hospitals'], ['private', 'Private hospitals']]) {
        const g = list.filter(x => x.type === type && /^https?:\/\//.test(x.edUrl || ''));
        if (!g.length) continue;
        box.append(h('div', { class: 'hospital-group' }, h('h4', null, title),
          h('ul', null, g.map(x => h('li', null, h('a', { href: x.edUrl, target: '_blank', rel: 'noopener' }, x.name),
            x.note && !/https?:\/\//.test(x.note) && !/rate-limit/i.test(x.note) ? h('span', { class: 'hosp-note' }, ` (${x.note})`) : null)))));
      }
    } catch (e) { box.replaceChildren(); }
  }

  /* ---------- postal code, GP finder ---------- */
  async function lookupPostal(code) {
    const url = `${ONEMAP_URL}?searchVal=${code}&returnGeom=Y&getAddrDetails=Y&pageNum=1`;
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 10000);
    try {
      const j = await (await fetch(url, { signal: ctl.signal })).json();
      const r = (j.results || [])[0];
      if (!r) return null;
      return { code, lat: parseFloat(r.LATITUDE), lng: parseFloat(r.LONGITUDE), address: r.ADDRESS };
    } finally { clearTimeout(t); }
  }
  function setMsg(el, text) { el.textContent = text || ''; el.hidden = !text; }
  async function applyPostal(code, fromStorage) {
    const msg = $('myarea-msg');
    if (!/^\d{6}$/.test(code)) { setMsg(msg, 'Enter a 6-digit postal code.'); return; }
    setMsg(msg, 'Looking up…');
    let loc;
    try { loc = await lookupPostal(code); } catch (e) { setMsg(msg, 'Could not reach OneMap. Try again later.'); return; }
    if (!loc) { setMsg(msg, 'Postal code not found'); $('gp-results').replaceChildren(h('p', { class: 'gp-msg' }, 'Postal code not found')); return; }
    setMsg(msg, '');
    state.postal = loc;
    safeStore(POSTAL_KEY, JSON.stringify(loc));
    $('myarea-postal').value = code; $('gp-postal').value = code;
    renderMyArea();
    runGp();
  }
  function forgetPostal() {
    safeStore(POSTAL_KEY, null);
    state.postal = null;
    $('myarea-postal').value = ''; $('gp-postal').value = '';
    $('gp-results').replaceChildren();
    if (clinicLayer) clinicLayer.clearLayers();
    renderMyArea();
  }
  // zoomToClinics=false on page load, so a remembered postal code keeps the island overview.
  async function runGp(zoomToClinics = true) {
    const out = $('gp-results');
    const p = state.postal;
    if (!p) return;
    out.replaceChildren(h('p', { class: 'gp-msg muted' }, 'Finding clinics…'));
    try {
      if (!state.clinics) state.clinics = await (await fetch('data/clinics.json')).json();
    } catch (e) { out.replaceChildren(h('p', { class: 'gp-msg' }, 'Clinic list unavailable.')); return; }
    const near = nearest(state.clinics, p.lat, p.lng, 8);
    out.replaceChildren(...near.map(c => h('div', { class: 'clinic' },
      h('div', { class: 'name' }, c.name),
      h('div', { class: 'addr' }, `${c.address} · ${c.km.toFixed(1)} km`),
      h('div', { class: 'links' },
        validTel(c.tel)
          ? h('span', { class: 'tel' }, 'Tel ', h('a', { href: `tel:+65${String(c.tel).replace(/\D/g, '')}` }, formatPhone(c.tel)))
          : h('span', { class: 'tel muted' }, 'No phone listed'),
        h('a', { href: `https://www.google.com/maps/dir/?api=1&destination=${c.lat},${c.lng}`, target: '_blank', rel: 'noopener' }, 'Directions')))));
    if (map) {
      clinicLayer.clearLayers();
      const pts = [[p.lat, p.lng]];
      L.circleMarker([p.lat, p.lng], { radius: 7, color: '#fff', weight: 2, fillColor: '#0b5fff', fillOpacity: 1 })
        .bindTooltip('You').addTo(clinicLayer);
      for (const c of near) {
        L.marker([c.lat, c.lng], { icon: L.divIcon({ className: 'leaflet-div-icon clinic-icon', html: '<div class="clinic-pin">+</div>', iconSize: [22, 22], iconAnchor: [11, 11] }) })
          .bindTooltip(c.name).addTo(clinicLayer);
        pts.push([c.lat, c.lng]);
      }
      if (zoomToClinics) map.fitBounds(pts, { padding: [30, 30], maxZoom: 15 });
    }
  }
  function useMyLocation() { // only ever called from a click
    if (!navigator.geolocation) { toast('Location is not available in this browser.'); return; }
    navigator.geolocation.getCurrentPosition(pos => {
      state.postal = { code: null, lat: pos.coords.latitude, lng: pos.coords.longitude, address: '' };
      renderMyArea(); runGp();
    }, () => toast('Could not get your location. Enter a postal code instead.'), { timeout: 10000 });
  }
  function loadStoredPostal() {
    const raw = safeLoad(POSTAL_KEY);
    if (!raw) return;
    try {
      const o = JSON.parse(raw);
      if (o && /^\d{6}$/.test(o.code) && isFinite(o.lat) && isFinite(o.lng)) {
        state.postal = o;
        $('myarea-postal').value = o.code; $('gp-postal').value = o.code;
        return true;
      }
    } catch (_) {
      if (/^\d{6}$/.test(raw)) { applyPostal(raw, true); }
    }
  }

  /* ---------- orchestration ---------- */
  function renderAll() {
    REGIONS.forEach(renderCard);
    renderMap();
    renderTrend();
    renderMyArea();
    renderStatus();
    if (state.wind.length) renderWind();
  }

  function init() {
    initMap();
    bindTabs();
    document.querySelectorAll('input[name="trend-metric"]').forEach(r => r.addEventListener('change', () => {
      state.metric = r.value; if (state.computed.north) renderTrend();
    }));
    $('weather-toggle').addEventListener('change', e => {
      if (!map) return;
      if (e.target.checked) { renderWeatherLayer(); weatherLayer.addTo(map); } else map.removeLayer(weatherLayer);
    });
    $('myarea-form').addEventListener('submit', e => { e.preventDefault(); applyPostal($('myarea-postal').value.trim()); });
    $('gp-form').addEventListener('submit', e => { e.preventDefault(); applyPostal($('gp-postal').value.trim()); });
    $('myarea-forget').addEventListener('click', e => { e.preventDefault(); forgetPostal(); });
    $('gp-locate').addEventListener('click', useMyLocation);

    if (!FEEDBACK_URL.startsWith('#')) {
      document.querySelectorAll('a.feedback-link').forEach(a => { a.href = FEEDBACK_URL; });
    } else {
      document.querySelectorAll('.feedback-card, a.feedback-link').forEach(el => { el.hidden = true; });
    }

    // Everything below runs on load with no user action and no prompts.
    const hadStored = loadStoredPostal();
    loadHospitals();
    loadAllNews();
    loadData().then(() => loadForecast()).then(() => { if (hadStored) runGp(false); });

    setInterval(() => { if (!document.hidden) { renderStatus(); } }, 1000);
    setInterval(() => { if (!document.hidden) loadData(); }, DATA_MS);
    setInterval(() => { if (!document.hidden) { loadForecast(); loadAllNews(); } }, SLOW_MS);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) return;
      if (Date.now() - state.lastSuccess > DATA_MS) loadData();
      renderStatus();
    });
  }
  init();
}
