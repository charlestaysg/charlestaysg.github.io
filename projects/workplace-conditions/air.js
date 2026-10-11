/* Air helpers ported from the haze dashboard: NEA bands, US AQI, NowCast, merge.
 * Display text for bands lives in strings.js; this file holds only numbers and colours. */
(function (root) {
  'use strict';
  const NOWCAST_HOURS = 12;

  const NEA_BANDS = [
    { level: 1, roman: 'I', name: 'Normal', max: 55, color: '#3fae5a' },
    { level: 2, roman: 'II', name: 'Elevated', max: 150, color: '#f5b400' },
    { level: 3, roman: 'III', name: 'High', max: 250, color: '#f0702a' },
    { level: 4, roman: 'IV', name: 'Very High', max: Infinity, color: '#c8102e' },
  ];
  function neaBand(pm) {
    return NEA_BANDS.find(b => pm <= b.max) || NEA_BANDS[3];
  }

  // 24-hour PSI bands (NEA), colours for the bar only.
  const PSI_BANDS = [
    { level: 1, max: 50, color: '#3fae5a' }, { level: 2, max: 100, color: '#4a90d9' },
    { level: 3, max: 200, color: '#f5b400' }, { level: 4, max: 300, color: '#f0702a' },
    { level: 5, max: Infinity, color: '#c8102e' },
  ];
  function psiBandInfo(v) { return PSI_BANDS.find(b => v <= b.max) || PSI_BANDS[4]; }

  const AQI_BREAKPOINTS = [ // [cLo, cHi, iLo, iHi], US EPA 2024 PM2.5
    [0, 9.0, 0, 50], [9.1, 35.4, 51, 100], [35.5, 55.4, 101, 150],
    [55.5, 125.4, 151, 200], [125.5, 225.4, 201, 300], [225.5, 325.4, 301, 500],
  ];
  const AQI_CATS = [
    { id: 1, max: 50, color: '#00e400' },
    { id: 2, max: 100, color: '#ffff00' },
    { id: 3, max: 150, color: '#ff7e00' },
    { id: 4, max: 200, color: '#ff0000' },
    { id: 5, max: 300, color: '#8f3f97' },
    { id: 6, max: Infinity, color: '#7e0023' },
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

  /** NowCast PM2.5. `values` newest-first (null = missing), up to 12 hours. Returns ug/m3 (1 dp) or null. */
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

  function mergeItems(...lists) {
    const m = new Map();
    for (const it of lists.flat()) m.set(it.timestamp, it);
    return [...m.values()].sort((a, b) => a.timestamp < b.timestamp ? -1 : 1);
  }

  /** Latest NEA 1-hr PM2.5 and NowCast AQI for one region from merged ascending items. */
  function regionAir(allItems, key) {
    const vals = allItems.map(it => (it.readings.pm25_one_hourly || {})[key]).map(v => (v == null ? null : v));
    let last = -1;
    for (let i = vals.length - 1; i >= 0; i--) if (vals[i] != null) { last = i; break; }
    if (last < 0) return { pm: null, ts: null, aqi: null };
    const hist = [];
    for (let j = last; j > last - NOWCAST_HOURS && j >= 0; j--) hist.push(vals[j]);
    const nc = nowcast(hist);
    return { pm: vals[last], ts: allItems[last].timestamp, aqi: nc == null ? null : pm25ToAqi(nc) };
  }

  const api = { NEA_BANDS, neaBand, PSI_BANDS, psiBandInfo, AQI_BREAKPOINTS, AQI_CATS, aqiCategory, pm25ToAqi, nowcast, mergeItems, regionAir };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else { root.SH = root.SH || {}; root.SH.air = api; }
})(typeof globalThis !== 'undefined' ? globalThis : this);
