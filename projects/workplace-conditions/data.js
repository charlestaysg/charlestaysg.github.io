/* Live Workplace Conditions: data layer. data.gov.sg v2 real-time API (no key), parsers, scheduler,
 * OneMap lookup and small helpers. Ported from the haze dashboard where noted. */
(function (root) {
  'use strict';

  const DGS = 'https://api-open.data.gov.sg/v2/real-time/api/';
  const URLS = {
    wbgt: DGS + 'weather?api=wbgt',
    pm25: DGS + 'pm25',
    psi: DGS + 'psi',
    rain: DGS + 'rainfall',
    temp: DGS + 'air-temperature',
    rh: DGS + 'relative-humidity',
    uv: DGS + 'uv',
    wind: DGS + 'wind-speed',
    twohr: DGS + 'two-hr-forecast',
    h24: DGS + 'twenty-four-hr-forecast',
  };
  const ONEMAP_URL = 'https://www.onemap.gov.sg/api/common/elastic/search';
  const TZ = 'Asia/Singapore';
  const STEP_GAP_MS = 2000; // 5 calls per 10 s, under the ~6 per 10 s limit

  // ------------------------------------------------------------------ SG time helpers (ported)
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
  function sgHour(date) { return Number(sgParts(date).hour); }
  function sgYesterdayStr(now = new Date()) { return sgDateStr(new Date(now.getTime() - 86400000)); }

  // ------------------------------------------------------------------ geometry (ported)
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
  function textOn(hex) { // pick black or white, whichever has more contrast
    const n = parseInt(hex.slice(1), 16);
    const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(x => {
      x /= 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
    });
    const L = 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
    return (L + 0.05) / 0.05 > 1.05 / (L + 0.05) ? '#111111' : '#ffffff';
  }

  // ------------------------------------------------------------------ small helpers (ported)
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  function safeStore(key, val) {
    try { if (val == null) localStorage.removeItem(key); else localStorage.setItem(key, val); } catch (_) { /* private mode */ }
  }
  function safeLoad(key) { try { return localStorage.getItem(key); } catch (_) { return null; } }
  function safeUrl(u) { return /^https?:\/\//i.test(u || '') ? u : '#'; }
  /** DOM builder. */
  function h(tag, attrs, ...kids) {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v == null || v === false) continue;
      if (k === 'class') e.className = v;
      else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
      else e.setAttribute(k, v === true ? '' : v);
    }
    for (const c of kids.flat()) {
      if (c == null || c === false) continue;
      e.append(c.nodeType ? c : document.createTextNode(String(c)));
    }
    return e;
  }
  /** ago(ms, t): t(key, params) supplies the words so it can be translated. */
  function ago(ms, t) {
    const m = Math.round(ms / 60000);
    if (m < 1) return t('time.justNow');
    if (m < 60) return t('time.minAgo', { n: m });
    const hr = Math.floor(m / 60);
    return hr < 24 ? t('time.hAgo', { h: hr, m: m % 60 }) : t('time.dAgo', { d: Math.floor(hr / 24) });
  }
  function banner(msg) {
    const b = document.getElementById('error-banner');
    if (!b) return;
    b.textContent = msg || ''; b.hidden = !msg;
  }
  let toastTimer = null;
  function toast(msg) {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg; el.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(() => { el.hidden = true; }, 5000);
  }

  // ------------------------------------------------------------------ data.gov.sg fetch
  function newBudget(n) { return { calls: 0, max: n }; }
  /** dgsGet(url, budget): call budget, 10 s timeout, one retry after a 10 s wait on HTTP 429 / API code 24. */
  async function dgsGet(url, budget) {
    for (let attempt = 0; attempt < 2; attempt++) {
      if (budget && budget.calls >= budget.max) throw new Error('call budget reached');
      if (budget) budget.calls++;
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

  /** Follow paginationToken. `pick(json)` returns the array to collect. Pages are STEP_GAP_MS apart. */
  async function dgsPaged(baseUrl, budget, pick, maxPages, gap = STEP_GAP_MS) {
    let out = [], first = null, token = null;
    for (let page = 0; page < maxPages; page++) {
      const sep = baseUrl.includes('?') ? '&' : '?';
      const json = await dgsGet(baseUrl + (token ? `${sep}paginationToken=${encodeURIComponent(token)}` : ''), budget);
      first = first || json;
      out = out.concat(pick(json) || []);
      token = json.data && json.data.paginationToken;
      if (!token) break;
      await sleep(gap);
    }
    return { items: out, first };
  }

  // ------------------------------------------------------------------ parsers (pure)
  const num = v => { const n = typeof v === 'number' ? v : parseFloat(v); return isFinite(n) ? n : null; };
  const HEAT = ['Low', 'Moderate', 'High'];

  /** weather?api=wbgt -> { ts (ISO), stations: [{id,name,town,lat,lng,wbgt,band}] } from the newest record. */
  function parseWbgt(json) {
    const recs = (json && json.data && json.data.records) || [];
    if (!recs.length) return null;
    const rec = recs.slice().sort((a, b) => Date.parse(b.datetime) - Date.parse(a.datetime))[0];
    const stations = ((rec.item && rec.item.readings) || []).map(r => ({
      id: r.station && r.station.id, name: r.station && r.station.name, town: r.station && r.station.townCenter,
      lat: num(r.location && r.location.latitude), lng: num(r.location && r.location.longitude),
      wbgt: num(r.wbgt), band: HEAT.indexOf(r.heatStress) >= 0 ? r.heatStress : null,
    })).filter(s => s.id && s.lat != null && s.lng != null);
    return { ts: rec.datetime, stations };
  }
  /** Many pages of records (any order) -> [{ts, ms, vals:{stationId: wbgt}}] ascending, de-duplicated. */
  function parseWbgtHistory(records) {
    const m = new Map();
    for (const rec of records || []) {
      const vals = {};
      for (const r of (rec.item && rec.item.readings) || []) {
        const w = num(r.wbgt);
        if (r.station && w != null) vals[r.station.id] = w;
      }
      m.set(rec.datetime, { ts: rec.datetime, ms: Date.parse(rec.datetime), vals });
    }
    return [...m.values()].sort((a, b) => a.ms - b.ms);
  }
  /** psi -> { ts, updated, regions: {north:{lat,lng}}, psi: {north: 109}, pm25_24: {...} } from the newest item. */
  function parsePsi(json) {
    const d = json && json.data; if (!d) return null;
    const items = (d.items || []).slice().sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp));
    if (!items.length) return null;
    const it = items[0], regions = {};
    for (const r of d.regionMetadata || []) regions[r.name] = { lat: r.labelLocation.latitude, lng: r.labelLocation.longitude };
    return { ts: it.timestamp, updated: it.updatedTimestamp, regions, psi: (it.readings || {}).psi_twenty_four_hourly || {}, pm25_24: (it.readings || {}).pm25_twenty_four_hourly || {} };
  }
  /** pm25 pages -> { items (raw, as the API gives them), regions }. */
  function parsePm25(pages) {
    let items = [], regions = {};
    for (const json of pages) {
      const d = json && json.data; if (!d) continue;
      items = items.concat(d.items || []);
      for (const r of d.regionMetadata || []) regions[r.name] = { lat: r.labelLocation.latitude, lng: r.labelLocation.longitude };
    }
    return { items, regions };
  }
  /** rainfall / air-temperature / relative-humidity / wind-speed -> { ts, unit, stations: [{id,name,lat,lng,value}] }. */
  function parseStationValues(json) {
    const d = json && json.data; if (!d) return null;
    const rd = (d.readings || []).slice().sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))[0];
    if (!rd) return null;
    const val = {};
    for (const r of rd.data || []) val[r.stationId] = r.value;
    const stations = (d.stations || []).filter(s => s.location && val[s.id] != null && isFinite(val[s.id]))
      .map(s => ({ id: s.id, name: s.name, lat: s.location.latitude, lng: s.location.longitude, value: val[s.id] }));
    return { ts: rd.timestamp, unit: d.readingUnit, stations };
  }
  /** uv -> { ts, value, hourly:[{hour,value}] } (latest hour). */
  function parseUv(json) {
    const rec = json && json.data && (json.data.records || [])[0];
    if (!rec) return null;
    const hourly = (rec.index || []).slice().sort((a, b) => Date.parse(a.hour) - Date.parse(b.hour));
    const last = hourly[hourly.length - 1];
    return last ? { ts: last.hour, value: last.value, hourly } : null;
  }
  /** two-hr-forecast -> { ts, validText, areas:[{name,lat,lng,forecast}] }. */
  function parseTwoHr(json) {
    const d = json && json.data; if (!d) return null;
    const item = (d.items || [])[0]; if (!item) return null;
    const meta = {};
    for (const a of d.area_metadata || []) meta[a.name] = a.label_location;
    const areas = (item.forecasts || []).filter(f => meta[f.area]).map(f => ({ name: f.area, lat: meta[f.area].latitude, lng: meta[f.area].longitude, forecast: f.forecast }));
    return { ts: item.timestamp, validText: (item.valid_period || {}).text || '', areas };
  }
  /** twenty-four-hr-forecast -> { general:{...}, periods:[{text, regions:{north:text}}] }. */
  function parse24h(json) {
    const rec = json && json.data && (json.data.records || [])[0];
    if (!rec || !rec.general) return null;
    const g = rec.general;
    return {
      ts: rec.timestamp || rec.updatedTimestamp,
      general: {
        text: g.forecast && g.forecast.text, validText: g.validPeriod && g.validPeriod.text,
        tempLow: g.temperature && g.temperature.low, tempHigh: g.temperature && g.temperature.high,
        rhLow: g.relativeHumidity && g.relativeHumidity.low, rhHigh: g.relativeHumidity && g.relativeHumidity.high,
      },
      periods: (rec.periods || []).map(p => {
        const regions = {};
        for (const [k, v] of Object.entries(p.regions || {})) regions[k] = v && v.text;
        return { text: p.timePeriod && p.timePeriod.text, regions };
      }),
    };
  }

  // ------------------------------------------------------------------ loaders
  async function loadWbgt(budget) { return parseWbgt(await dgsGet(URLS.wbgt, budget)); }
  async function loadPm25Day(dateStr, budget, maxPages = 2) {
    const r = await dgsPaged(`${URLS.pm25}?date=${dateStr}`, budget, j => [j], maxPages);
    return parsePm25(r.items);
  }
  async function loadWbgtDay(dateStr, budget) {
    const r = await dgsPaged(`${URLS.wbgt}&date=${dateStr}`, budget, j => (j.data && j.data.records) || [], 6);
    return parseWbgtHistory(r.items);
  }
  async function loadSimple(key, parser, budget) { return parser(await dgsGet(URLS[key], budget)); }

  // ------------------------------------------------------------------ OneMap (ported)
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

  // ------------------------------------------------------------------ scheduler
  /** Fast cycle every 5 min, slow cycle every 30 min offset by 90 s. One cycle at a time.
   *  Pauses while hidden. Manual refresh: fast cycle, locked for 30 s, ignored while in flight. */
  function createScheduler(o) {
    const FAST = o.fastMs || 300000, SLOW = o.slowMs || 1800000, OFFSET = o.slowOffsetMs || 90000;
    const LOCK = o.lockMs || 30000, VIS = o.visMs || 60000, RETRY = o.retryMs || 60000;
    const now = o.now || Date.now;
    const start = now();
    // First slow cycle runs right after the first fast burst, so UV, wind, forecast and the day chart
    // aren't blank on load; later slow cycles follow every SLOW ms after the previous one.
    const FIRST_SLOW = o.firstSlowMs != null ? o.firstSlowMs : 15000;
    let nextFast = start, nextSlow = start + FIRST_SLOW, inflight = false, lastSuccess = 0, lockUntil = 0;

    async function run(kind) {
      if (inflight) return false;
      inflight = true;
      try {
        if (kind === 'fast') {
          const ok = await o.runFast();
          if (ok) lastSuccess = now();
          nextFast = now() + (ok ? FAST : RETRY);
        } else {
          await o.runSlow();
          nextSlow = now() + SLOW;
        }
      } catch (_) {
        if (kind === 'fast') nextFast = now() + RETRY; else nextSlow = now() + SLOW;
      } finally { inflight = false; }
      return true;
    }
    return {
      tick() {
        if ((o.isHidden && o.isHidden()) || inflight) return null;
        if (now() >= nextFast) return run('fast');
        if (now() >= nextSlow) return run('slow');
        return null;
      },
      manualRefresh() {
        if (inflight || now() < lockUntil) return false;
        lockUntil = now() + LOCK;
        run('fast');
        return true;
      },
      onVisible() {
        if (!inflight && now() - lastSuccess > VIS) return run('fast');
        return null;
      },
      lockLeftMs() { return Math.max(0, lockUntil - now()); },
      nextFastAt() { return nextFast; },
      lastSuccessAt() { return lastSuccess; },
      isBusy() { return inflight; },
    };
  }

  const api = {
    URLS, STEP_GAP_MS, sgParts, sgDateStr, sgHM, sgHour, sgYesterdayStr, haversine, nearest, textOn,
    sleep, safeStore, safeLoad, safeUrl, h, ago, banner, toast, newBudget, dgsGet, dgsPaged,
    parseWbgt, parseWbgtHistory, parsePsi, parsePm25, parseStationValues, parseUv, parseTwoHr, parse24h,
    loadWbgt, loadPm25Day, loadWbgtDay, loadSimple, lookupPostal, createScheduler,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else { root.SH = root.SH || {}; root.SH.data = api; }
})(typeof globalThis !== 'undefined' ? globalThis : this);
