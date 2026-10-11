/* Live Workplace Conditions: browser app. Plain JS, no build step.
 * Depends on strings.js, rules.js, air.js, data.js (loaded first, exposed on window.SH). */
'use strict';
(function () {
  const { strings: S, rules: R, air: A, data: D } = window.SH;
  const { h, sgHM, sgDateStr, sgHour, sgYesterdayStr, safeStore, safeLoad } = D;
  const $ = id => document.getElementById(id);
  const REGIONS = ['north', 'south', 'east', 'west', 'central'];
  const LEAFLET_CSS = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';
  const LEAFLET_JS = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';
  const HEAT_COLORS = { Low: '#3fae5a', Moderate: '#f5b400', High: '#f0702a' };
  const K = { lang: 'wc.lang', mode: 'wc.mode', work: 'wc.work', loc: 'wc.loc', boss: 'wc.boss', remind: 'wc.remind', brk: 'wc.brk', uv: 'wc.uv' };

  // ------------------------------------------------------------------ state
  function loadJson(key, dflt) { try { const v = JSON.parse(safeLoad(key)); return v == null ? dflt : v; } catch (_) { return dflt; } }
  const state = {
    lang: 'en', mode: 'worker', work: 'heavy',
    loc: null,            // {kind:'postal'|'geo', lat, lng, code, address, saved}
    boss: { num: '', name: '' },
    wbgt: null, wbgtHist: [], pm25Today: [], pm25Yest: [], pm25Regions: {}, yestDate: '', psi: null,
    rain: null, temp: null, rh: null, wind: null, uv: null, twohr: null, h24: null,
    lastFastOkAt: 0, errors: [],
    demo: { on: false, v: 31.0 },
    ticked: new Set(),
    remind: { running: false, intervalMin: 60, userInterval: false, lastTs: 0, mute: false, notify: false, dueAt: 0, armed: false },
    brk: { phase: 'idle', workStart: 0, breakStart: 0, plannedMin: 0, plannedEnd: 0, lastLen: 0, dueAlerted: false, raised: 0, custom: 10, last: null },
    uvr: { on: false, lastTs: 0, dueAt: 0 },
  };
  let C = {};            // computed view of the current data
  let sched = null, map = null, mapLayers = null, leafletPromise = null, lastSig = '', lastMinute = 0;
  let audioCtx = null;

  const T = (k, p) => S.t(k, p, state.lang);
  const E = (k, p) => S.t(k, p, 'en');
  const el = (tag, cls, ...kids) => h(tag, cls ? { class: cls } : null, ...kids);

  // ------------------------------------------------------------------ small DOM helpers
  /** Text with [label](https://url) links -> nodes. */
  function rich(str) {
    const out = []; let last = 0;
    for (const m of String(str).matchAll(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g)) {
      if (m.index > last) out.push(str.slice(last, m.index));
      out.push(h('a', { href: m[2], target: '_blank', rel: 'noopener' }, m[1]));
      last = m.index + m[0].length;
    }
    if (last < str.length) out.push(str.slice(last));
    return out;
  }
  const ICONS = {
    unknown: '<circle cx="12" cy="12" r="10"/><path d="M9.5 9.2a2.6 2.6 0 1 1 3.6 2.4c-.7.4-1.1.9-1.1 1.7M12 17h.01"/>',
    carryon: '<circle cx="12" cy="12" r="10"/><path d="M7 12.5l3.2 3.2L17 9"/>',
    takecare: '<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18h.01"/>',
    restnow: '<path d="M8 2h8l6 6v8l-6 6H8l-6-6V8z"/><path d="M10 8v8M14 8v8"/>',
    emergency: '<circle cx="12" cy="12" r="10"/><path d="M12 6v12M6 12h12"/>',
  };
  function icon(name) {
    const s = document.createElement('span');
    s.className = 'icon'; s.setAttribute('aria-hidden', 'true');
    s.innerHTML = `<svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[name]}</svg>`;
    return s;
  }
  function svg(tag, attrs, ...kids) {
    const e = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (const [k, v] of Object.entries(attrs || {})) e.setAttribute(k, v);
    for (const c of kids.flat()) if (c != null) e.append(c.nodeType ? c : document.createTextNode(String(c)));
    return e;
  }
  const fmt1 = n => (n == null ? '-' : Number(n).toFixed(1));
  const mmss = ms => { const s = Math.max(0, Math.ceil(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
  const minsSince = iso => (Date.now() - Date.parse(iso)) / 60000;
  const bandName = b => (b ? T('band.heat.' + b) : '-');
  const stationLabel = s => (s ? (s.town || s.name) : '');

  // ------------------------------------------------------------------ persistence
  function loadState() {
    const lang = safeLoad(K.lang); if (S.LANGS.includes(lang)) state.lang = lang;
    const mode = safeLoad(K.mode); if (mode === 'supervisor') state.mode = mode;
    if (safeLoad(K.work) === 'light') state.work = 'light';
    const loc = loadJson(K.loc, null);
    if (loc && isFinite(loc.lat) && isFinite(loc.lng)) state.loc = Object.assign({}, loc, { saved: true });
    const boss = loadJson(K.boss, null); if (boss) state.boss = { num: boss.num || '', name: boss.name || '' };
    // Settings only. Nothing about the worker's day is stored. Remove keys from earlier builds.
    safeStore('wc.shift', null); safeStore('wc.rest', null);
    const rem = loadJson(K.remind, null);
    if (rem) { state.remind.intervalMin = [15, 20, 30, 60].includes(rem.intervalMin) ? rem.intervalMin : 60; state.remind.userInterval = !!rem.userInterval; state.remind.mute = !!rem.mute; state.remind.notify = !!rem.notify; }
    const brk = loadJson(K.brk, null); if (brk && [5, 10, 15, 20].includes(brk.custom)) state.brk.custom = brk.custom;
    const uvr = loadJson(K.uv, null); if (uvr) state.uvr.on = !!uvr.on, state.uvr.lastTs = uvr.on ? Date.now() : 0;
  }
  const saveRemind = () => safeStore(K.remind, JSON.stringify({ intervalMin: state.remind.intervalMin, userInterval: state.remind.userInterval, mute: state.remind.mute, notify: state.remind.notify }));
  const saveBrk = () => safeStore(K.brk, JSON.stringify({ custom: state.brk.custom }));
  const saveUvr = () => safeStore(K.uv, JSON.stringify({ on: state.uvr.on }));

  // ------------------------------------------------------------------ computation
  function pickStation() {
    const st = ((state.wbgt && state.wbgt.stations) || []).filter(s => s.wbgt != null);
    if (!st.length) return null;
    if (state.loc) { const n = D.nearest(st, state.loc.lat, state.loc.lng, 1)[0]; return { s: n, km: n.km, worst: false }; }
    return { s: st.reduce((a, b) => (b.wbgt > a.wbgt ? b : a)), km: null, worst: true };
  }
  function regionMeta() { return (state.psi && state.psi.regions) || state.pm25Regions || {}; }
  function airFor() {
    const meta = regionMeta();
    const keys = REGIONS.filter(k => meta[k]);
    if (!keys.length) return null;
    const merged = A.mergeItems(state.pm25Yest, state.pm25Today);
    const info = keys.map(k => {
      const a = A.regionAir(merged, k);
      const pv = state.psi ? state.psi.psi[k] : null;
      const pmAge = a.ts ? minsSince(a.ts) : null, psAge = pv != null && state.psi ? minsSince(state.psi.ts) : null;
      return { key: k, pm25: a.pm == null ? null : { v: a.pm, ts: a.ts, age: pmAge, band: R.pm25Band(a.pm) }, aqi: a.aqi,
        psi: pv == null ? null : { v: pv, ts: state.psi.ts, age: psAge, band: R.psiBand(pv) } };
    });
    let pick, worst = false;
    if (state.loc) pick = D.nearest(keys.map(k => Object.assign({ key: k }, meta[k])), state.loc.lat, state.loc.lng, 1)[0].key;
    else {
      worst = true;
      const score = i => Math.max(i.pm25 ? i.pm25.band.level : 0, i.psi ? i.psi.band.level : 0) * 10000 + (i.pm25 ? i.pm25.v : 0);
      pick = info.reduce((a, b) => (score(b) > score(a) ? b : a)).key;
    }
    return Object.assign({ worst }, info.find(i => i.key === pick));
  }
  function airDetail(air, fresh) {
    const parts = [];
    if (air.pm25 && fresh.pm25 && air.pm25.band.level >= 3) parts.push(T('detail.pm25', { v: air.pm25.v, band: T('band.pm25.' + air.pm25.band.level) }));
    if (air.psi && fresh.psi && air.psi.band.level >= 3) parts.push(T('detail.psi', { v: air.psi.v, band: T('band.psi.' + air.psi.band.level) }));
    return parts.join('; ');
  }
  function compute() {
    const c = { pick: pickStation(), air: airFor() };
    // air inputs: only fresh values go to the verdict
    const air = c.air, fresh = { pm25: false, psi: false }, ages = [];
    if (air && air.pm25 && air.pm25.age != null && air.pm25.age <= R.AIR_FRESH_MIN) { fresh.pm25 = true; ages.push(air.pm25.age); }
    if (air && air.psi && air.psi.age != null && air.psi.age <= R.AIR_FRESH_MIN) { fresh.psi = true; ages.push(air.psi.age); }
    if (air) { if (air.pm25 && air.pm25.age != null && !fresh.pm25) ages.push(air.pm25.age); if (air.psi && air.psi.age != null && !fresh.psi) ages.push(air.psi.age); }
    const airInput = {
      pm25Band: fresh.pm25 ? air.pm25.band.name : null, psiBand: fresh.psi ? air.psi.band.name : null,
      airAge: ages.length ? Math.min(...ages) : null,
    };
    c.fresh = fresh;
    const p = c.pick;
    const real = {
      wbgt: p ? p.s.wbgt : null, band: p ? p.s.band : null, wbgtAge: p && state.wbgt ? minsSince(state.wbgt.ts) : null, work: state.work,
    };
    c.realVerdict = R.verdict(Object.assign({}, real, airInput));
    c.real = real;
    if (state.demo.on) c.verdict = R.verdict(Object.assign({ wbgt: state.demo.v, band: null, wbgtAge: 0, work: state.work, demo: true }, airInput));
    else c.verdict = c.realVerdict;
    c.detail = air ? airDetail(air, fresh) : '';
    c.station = p ? stationLabel(p.s) : '';
    c.lastHM = state.wbgt ? sgHM(new Date(state.wbgt.ts)) : '';
    c.area = areaName();
    C = c;
  }
  function areaName() {
    if (!state.loc) return '';
    if (state.twohr && state.twohr.areas.length) return D.nearest(state.twohr.areas, state.loc.lat, state.loc.lng, 1)[0].name;
    return state.loc.address || '';
  }

  // ------------------------------------------------------------------ messages / links
  function waHref(msg) {
    const base = /^[3689]\d{7}$/.test(state.boss.num) ? `https://wa.me/65${state.boss.num}` : 'https://wa.me/';
    return `${base}?text=${encodeURIComponent(msg)}`;
  }
  function heatMessage() {
    const v = C.realVerdict, p = C.pick;
    return R.buildMessage({
      verdict: v, station: C.station, worst: !!(p && p.worst), wbgt: p ? p.s.wbgt : null, band: v.heatBand ? E('band.heat.' + v.heatBand) : '',
      time: C.lastHM, area: C.area, bossName: state.boss.name.trim(), work: state.work,
      airDetail: C.air ? airDetailEn() : '',
    }, E);
  }
  function airDetailEn() {
    const a = C.air, f = C.fresh, parts = [];
    if (a.pm25 && f.pm25 && a.pm25.band.level >= 3) parts.push(E('detail.pm25', { v: a.pm25.v, band: E('band.pm25.' + a.pm25.band.level) }));
    if (a.psi && f.psi && a.psi.band.level >= 3) parts.push(E('detail.psi', { v: a.psi.v, band: E('band.psi.' + a.psi.band.level) }));
    return parts.join('; ');
  }
  async function copyText(text) {
    try { await navigator.clipboard.writeText(text); D.toast(T('btn.copied')); return; } catch (_) { /* fall through */ }
    const ta = h('textarea', { 'aria-hidden': 'true', style: 'position:fixed;opacity:0;top:0' });
    ta.value = text; document.body.append(ta); ta.select();
    let done = false; try { done = document.execCommand('copy'); } catch (_) { /* ignore */ }
    ta.remove(); D.toast(done ? T('btn.copied') : T('btn.copyFailed'));
  }

  // ------------------------------------------------------------------ rendering: verdict
  function verdictSig() {
    const v = C.verdict;
    return JSON.stringify([state.lang, state.demo.on, v.level, v.reasonKey, v.reasonParams, v.actionKeys, v.alsoAir, C.station, C.lastHM, state.work]);
  }
  function reasonText(v) {
    const p = Object.assign({}, v.reasonParams);
    if (v.reasonKey === 'reason.unknown.stale') p.time = C.lastHM;
    if (v.reasonKey === 'reason.heat' || v.reasonKey === 'reason.low') {
      p.station = state.demo.on ? 'DEMO' : C.station;
      p.band = bandName(v.heatBand);
    }
    if (v.reasonKey === 'reason.air') p.detail = C.detail;
    return T(v.reasonKey, p);
  }
  function renderVerdict() {
    const v = C.verdict, live = $('verdict-live');
    const word = (v.demo ? T('verdict.demoPrefix') + ' ' : '') + T(v.wordKey);
    live.className = `verdict-card c-${v.color}${v.demo ? ' is-demo' : ''}`;
    live.replaceChildren(
      el('div', 'vhead', icon(v.icon), el('div', 'vword', word)),
      el('p', 'vreason', reasonText(v)),
      el('ul', 'vactions', v.actionKeys.map(k => el('li', null, T(k)))),
      el('p', 'vnote', T('note.station')));
    renderActions();
  }
  function renderChips() {
    const v = C.verdict;
    // chips (outside the live region)
    const chips = [], p = C.pick;
    if (v.demo) chips.push(el('span', 'chip chip-demo', T('chip.demo')));
    else if (p) chips.push(el('span', 'chip', p.worst ? T('chip.stationWorst', { station: C.station }) : T('chip.station', { station: C.station, km: p.km.toFixed(1) })));
    if (C.area) chips.push(el('span', 'chip', T('chip.area', { area: C.area })));
    if (state.wbgt && !v.demo) chips.push(el('span', 'chip', T('chip.age', { ago: D.ago(Date.now() - Date.parse(state.wbgt.ts), T) })));
    if (v.heatBand) chips.push(el('span', 'chip', T('chip.band', { band: bandName(v.heatBand) })));
    const uvb = currentUv() != null ? R.uvBand(currentUv()) : null;
    if (uvb && uvb.level >= 3) chips.push(el('span', 'chip chip-warn', T('chip.also.uv', { v: currentUv(), band: T('uv.band.' + uvb.level) })));
    if (v.airDelayed) chips.push(el('span', 'chip chip-warn', T('chip.airDelayed')));
    if (v.alsoAir) chips.push(el('span', 'chip chip-warn', T('chip.also.air', { detail: C.detail })));
    $('chips').replaceChildren(...chips);
  }
  function renderActions() {
    const demo = state.demo.on, msg = demo ? '' : heatMessage();
    const wa = $('btn-wa'), cp = $('btn-copy');
    wa.setAttribute('aria-disabled', String(demo)); cp.setAttribute('aria-disabled', String(demo));
    wa.href = demo ? '#' : waHref(msg);
    wa.classList.toggle('disabled', demo); cp.classList.toggle('disabled', demo);
    $('msg-preview').textContent = demo ? T('btn.demoDisabled') : msg;
    $('demo-note').hidden = !demo; $('demo-note').textContent = T('btn.demoDisabled');
  }

  // ------------------------------------------------------------------ rendering: supervisor band, schedule
  function renderSupBand() {
    const v = C.verdict, p = C.pick;
    const box = $('supband-card');
    box.className = `verdict-card c-${v.color}${v.demo ? ' is-demo' : ''}`;
    const head = (v.demo ? T('verdict.demoPrefix') + ' ' : '') + (v.heatBand ? bandName(v.heatBand) : T(v.wordKey));
    box.replaceChildren(el('div', 'vhead', icon(v.icon), el('div', 'vword', head)),
      el('p', 'vreason', reasonText(v)),
      el('p', 'vnote', (p ? (p.worst ? T('chip.stationWorst', { station: C.station }) : T('chip.station', { station: C.station, km: p.km.toFixed(1) })) + ' · ' : '') + T('note.station')));
    for (const b of [$('work-heavy'), $('work-light')]) b.setAttribute('aria-pressed', String(b.dataset.work === state.work));
    renderSchedule();
  }
  function renderSchedule() {
    const v = C.verdict, w = v.level === 'unknown' ? null : Number(v.reasonParams.wbgt);
    const cur = w == null || v.heatBand == null ? null : v.heatBand === 'Low' ? 'low' : v.heatBand === 'High' ? 'high' : (Math.round(w * 10) >= 320 ? 'mod2' : 'mod1');
    const heavy = state.work !== 'light';
    const rows = ['low', 'mod1', 'mod2', 'high'].map(r => {
      const earlier = !heavy && (r === 'mod2' || r === 'high');
      return h('tr', { class: cur === r ? 'current' : '', 'aria-current': cur === r ? 'true' : null },
        h('th', { scope: 'row' }, T('sched.row.' + r), cur === r ? el('span', 'tag', T('sched.current')) : null),
        h('td', null, T(`sched.${r}.${heavy ? 'heavy' : 'light'}`), earlier ? el('span', 'tag tag-old', T('sched.earlier')) : null));
    });
    $('sched').replaceChildren(h('thead', null, h('tr', null, h('th', null, T('sched.col.band')), h('th', null, T('sched.col.rule')))), h('tbody', null, rows));
  }

  // ------------------------------------------------------------------ rendering: day chart (SVG)
  function hourOf(ms) { const p = D.sgParts(new Date(ms)); return Number(p.hour) + Number(p.minute) / 60; }
  /** Points for today: selected station (location set) or island-wide worst per time (no location).
   *  The newest fast-cycle reading is appended. No fallback: without history the chart says so. */
  function chartPoints() {
    const id = state.loc && C.pick ? C.pick.s.id : null;
    const hist = state.wbgtHist.slice();
    if (state.wbgt && C.pick && !hist.some(r => r.ts === state.wbgt.ts)) {
      const vals = {}; for (const s of state.wbgt.stations) if (s.wbgt != null) vals[s.id] = s.wbgt;
      hist.push({ ts: state.wbgt.ts, ms: Date.parse(state.wbgt.ts), vals });
    }
    const today = sgDateStr(new Date());
    const rows = hist.filter(r => sgDateStr(new Date(r.ms)) === today && Object.keys(r.vals).length).sort((a, b) => a.ms - b.ms);
    if (rows.length) {
      const pts = rows.map(r => {
        const mx = Math.max(...Object.values(r.vals));
        return { ms: r.ms, x: hourOf(r.ms), v: id != null ? (r.vals[id] != null ? r.vals[id] : null) : mx, mx };
      });
      return { pts, mode: id != null ? 'station' : 'worst' };
    }
    return { pts: [], mode: 'none' };
  }
  const durText = (min, tt) => R.fmtDur(min, tt);
  function daySummary(pts, tt) {
    const bm = R.bandMinutes(pts, Date.now());
    const parts = ['High', 'Moderate', 'Low'].filter(b => bm[b] > 0).map(b => tt('chart.summary.part', { dur: durText(bm[b], tt), band: tt('band.heat.' + b) }));
    return parts.length ? tt('chart.summary', { parts: parts.join(', ') }) : tt('chart.summary.none');
  }
  let chartResizeHooked = false, chartW = 0;
  function hookChartResize() {
    if (chartResizeHooked || typeof ResizeObserver === 'undefined') return;
    chartResizeHooked = true;
    new ResizeObserver(es => { const w = Math.round(es[0].contentRect.width); if (w && Math.abs(w - chartW) > 8) { chartW = w; renderChart(); } }).observe($('chart-box'));
  }
  function renderChart() {
    hookChartResize();
    const box = $('chart-box'), table = $('chart-table'), sum = $('chart-summary'), readout = $('chart-readout');
    box.replaceChildren(); table.replaceChildren();
    const { pts, mode } = chartPoints();
    $('chart-note').textContent = mode === 'none' ? '' : mode === 'worst' ? T('chart.worst') : T('chip.station', { station: C.station, km: C.pick.km.toFixed(1) });
    if (!pts.length) { sum.textContent = ''; readout.textContent = ''; box.append(el('p', 'muted', T('sup.chart.empty'))); return; }
    const vals = pts.flatMap(p => [p.v, p.mx]).filter(x => x != null && isFinite(x));
    const x0 = 0, x1 = 24;
    const y0 = Math.min(24, Math.floor(Math.min(...vals)) - 1), y1 = Math.max(36, Math.ceil(Math.max(...vals)) + 1);
    // Draw at the box's real width so labels stay at their CSS size on phones (a fixed 640 wide viewBox shrank them to ~5 px).
    const W = Math.max(300, Math.round(box.clientWidth || 640)), Ht = Math.round(Math.min(300, Math.max(210, W * 0.6))), ml = 30, mr = 10, mt = 14, mb = 26;
    const X = x => ml + (x - x0) / (x1 - x0) * (W - ml - mr), Y = y => mt + (1 - (y - y0) / (y1 - y0)) * (Ht - mt - mb);
    const zone = (lo, hi, col, label) => [
      svg('rect', { x: ml, y: Y(hi), width: W - ml - mr, height: Y(lo) - Y(hi), fill: col, opacity: '.3' }),
      svg('text', { x: ml + 6, y: Y(hi) + 15, class: 'ch-label' }, label)];
    const g = svg('svg', { viewBox: `0 0 ${W} ${Ht}`, class: 'chart', tabindex: '0', 'aria-hidden': 'false' },
      zone(y0, 31, HEAT_COLORS.Low, `${bandName('Low')} <31`), zone(31, 33, HEAT_COLORS.Moderate, `${bandName('Moderate')} 31-32.9`), zone(33, y1, HEAT_COLORS.High, `${bandName('High')} ≥33`));
    g.append(svg('title', null, T('chart.title')));
    const xStep = W < 420 ? 6 : 4;
    for (let x = 0; x <= 24; x += xStep) {
      g.append(svg('line', { x1: X(x), x2: X(x), y1: mt, y2: Ht - mb, class: 'ch-grid' }), svg('text', { x: X(x), y: Ht - 8, 'text-anchor': x === 24 ? 'end' : x === 0 ? 'start' : 'middle', class: 'ch-axis' }, String(x).padStart(2, '0') + ':00'));
    }
    for (let y = Math.ceil(y0 / 2) * 2; y <= y1; y += 2) g.append(svg('text', { x: ml - 4, y: Y(y) + 4, 'text-anchor': 'end', class: 'ch-axis' }, String(y)));
    for (const ref of [31, 33]) g.append(svg('line', { x1: ml, x2: W - mr, y1: Y(ref), y2: Y(ref), class: 'ch-ref' }));
    const path = key => { let d = '', pen = false; for (const p of pts) { if (p[key] == null) { pen = false; continue; } d += `${pen ? 'L' : 'M'}${X(p.x).toFixed(1)} ${Y(p[key]).toFixed(1)}`; pen = true; } return d; };
    if (mode === 'station') g.append(svg('path', { d: path('mx'), class: 'ch-max', fill: 'none' }));
    g.append(svg('path', { d: path('v'), class: 'ch-line', fill: 'none' }));
    // now line
    const nowX = hourOf(Date.now());
    g.append(svg('line', { x1: X(nowX), x2: X(nowX), y1: mt, y2: Ht - mb, class: 'ch-now' }),
      svg('text', { x: X(nowX) + (nowX > 20 ? -4 : 4), y: mt + 10, 'text-anchor': nowX > 20 ? 'end' : 'start', class: 'ch-axis ch-nowtxt' }, T('chart.now')));
    // peak so far
    const withV = pts.filter(p => p.v != null);
    let peakText = '';
    if (withV.length) {
      const pk = withV.reduce((a, b) => (b.v >= a.v ? b : a));
      peakText = T('chart.peak', { v: fmt1(pk.v), time: sgHM(new Date(pk.ms)) });
      const px = X(pk.x), anchor = pk.x > 17 ? 'end' : pk.x < 4 ? 'start' : 'middle';
      g.append(svg('circle', { cx: px, cy: Y(pk.v), r: 5, class: 'ch-peak' }),
        svg('text', { x: px, y: Math.max(mt + 22, Y(pk.v) - 9), 'text-anchor': anchor, class: 'ch-axis ch-peaktxt' }, peakText));
    }
    // read a point: pointer or arrow keys
    const cursor = svg('circle', { r: 6, class: 'ch-cursor', cx: -20, cy: -20 });
    g.append(cursor);
    let idx = pts.length - 1;
    const show = i => {
      idx = Math.max(0, Math.min(pts.length - 1, i)); const p = pts[idx];
      if (p.v == null) { readout.textContent = ''; return; }
      cursor.setAttribute('cx', X(p.x)); cursor.setAttribute('cy', Y(p.v));
      readout.textContent = T('chart.readout', { time: sgHM(new Date(p.ms)), v: fmt1(p.v), band: bandName(R.bandFromWbgt(p.v)) });
    };
    const at = ev => {
      const r = g.getBoundingClientRect(), vx = (ev.clientX - r.left) / r.width * W;
      let best = 0, bd = Infinity; pts.forEach((p, i) => { const d = Math.abs(X(p.x) - vx); if (d < bd) { bd = d; best = i; } });
      show(best);
    };
    g.addEventListener('pointermove', at); g.addEventListener('pointerdown', at);
    g.addEventListener('keydown', e => { if (e.key === 'ArrowLeft') { show(idx - 1); e.preventDefault(); } else if (e.key === 'ArrowRight') { show(idx + 1); e.preventDefault(); } });
    box.append(g);
    readout.textContent = T('chart.readout.hint');
    const summary = daySummary(pts, T);
    sum.textContent = summary;
    g.setAttribute('role', 'img');
    g.setAttribute('aria-label', T('chart.alt', { station: $('chart-note').textContent, peak: peakText, summary }));
    const rows = pts.filter((p, i) => /:00$/.test(sgHM(new Date(p.ms))) || i === pts.length - 1);
    table.append(h('thead', null, h('tr', null, h('th', null, T('sup.chart.col.time')), h('th', null, T('sup.chart.col.station')), h('th', null, T('sup.chart.col.max')))),
      h('tbody', null, rows.map(p => h('tr', null, h('td', null, sgHM(new Date(p.ms))), h('td', null, fmt1(p.v)), h('td', null, fmt1(p.mx))))));
  }

  // ------------------------------------------------------------------ rendering: air
  function barEl(kind, value, max) {
    const pct = value == null ? 0 : Math.min(100, Math.max(0, value / max * 100));
    return h('div', { class: `bar ${kind}`, role: 'img', 'aria-label': value == null ? T('air.nodata') : String(value) },
      value == null ? null : h('span', { class: 'marker', style: `left:${pct}%` }));
  }
  function renderAir() {
    const box = $('air-body'), a = C.air;
    if (!a) { box.replaceChildren(el('p', 'muted', T('air.nodata'))); return; }
    const region = T('region.' + a.key);
    const parts = [el('p', 'air-region', a.worst ? T('air.worst', { region }) : T('air.nearest', { region }))];
    const tile = (label, value, unit, bandText, color, bar, ageMin) => el('div', 'air-tile',
      el('div', 'air-label', label),
      el('div', 'air-value', value == null ? '-' : String(value), unit ? el('span', 'unit', unit) : null),
      h('div', { class: 'air-band', style: color ? `border-left:6px solid ${color}` : null }, bandText),
      bar, ageMin != null ? el('div', 'air-age', D.ago(ageMin * 60000, T)) : null);
    const pm = a.pm25, ps = a.psi;
    const pmInfo = pm ? A.neaBand(pm.v) : null, psInfo = ps ? A.psiBandInfo(ps.v) : null;
    const tiles = [
      tile(T('air.pm25'), pm && pm.v, T('air.unit.pm25'), pm ? `${pmInfo.roman} · ${T('band.pm25.' + pm.band.level)}` : T('air.nodata'), pmInfo && pmInfo.color, barEl('nea', pm && pm.v, 300), pm && pm.age),
      tile(T('air.psi'), ps && ps.v, '', ps ? T('band.psi.' + ps.band.level) : T('air.nodata'), psInfo && psInfo.color, barEl('psi', ps && ps.v, 300), ps && ps.age),
      tile(T('air.aqi'), a.aqi && a.aqi.aqi, '', a.aqi ? T('aqi.cat.' + a.aqi.id) : T('air.aqi.noenough'), a.aqi && a.aqi.color, barEl('aqi', a.aqi && a.aqi.aqi, 500), null)];
    parts.push(el('div', 'air-tiles', tiles));
    if (C.verdict.airDelayed) parts.push(el('p', 'note warn', T('air.delayed')));
    parts.push(el('p', 'note', T('air.note')),
      el('p', 'links', h('a', { href: 'https://aqicn.org/city/singapore/', target: '_blank', rel: 'noopener' }, T('air.aqicn')), ' ',
        h('a', { href: 'https://www.haze.gov.sg', target: '_blank', rel: 'noopener' }, T('air.haze'))));
    box.replaceChildren(...parts);
  }

  // ------------------------------------------------------------------ rendering: tiles, island, forecast
  function nearestVal(src) {
    if (!src || !src.stations.length) return null;
    if (state.loc) { const n = D.nearest(src.stations, state.loc.lat, state.loc.lng, 1)[0]; return { v: n.value, name: n.name }; }
    return null;
  }
  /** Heat index (info only, never drives the verdict) from the nearest (or hottest) station's temperature and humidity. */
  function feelsLike() {
    if (!state.temp || !state.temp.stations.length || !state.rh || !state.rh.stations.length) return null;
    const ts = state.temp.stations;
    const st = state.loc ? D.nearest(ts, state.loc.lat, state.loc.lng, 1)[0] : ts.reduce((a, b) => (b.value > a.value ? b : a));
    const rh = state.rh.stations.find(s => s.id === st.id) || D.nearest(state.rh.stations, st.lat, st.lng, 1)[0];
    return R.heatIndexC(st.value, rh.value);
  }
  function renderTiles() {
    const loc = !!state.loc, box = $('tiles-body'), tiles = [];
    const add = (label, text, sub) => tiles.push(el('div', 'tile', el('div', 'tile-label', label), el('div', 'tile-value', text), sub ? el('div', 'tile-sub', sub) : null));
    const agg = (src, mode) => {
      if (!src || !src.stations.length) return null;
      const vs = src.stations.map(s => s.value);
      return mode === 'max' ? Math.max(...vs) : vs.reduce((a, b) => a + b, 0) / vs.length;
    };
    const val = (src, mode) => (loc ? nearestVal(src) : (src ? { v: agg(src, mode), name: '' } : null));
    const w = val(state.wind, 'avg'); add(T('tile.wind'), w && w.v != null ? T('tile.wind.v', { v: w.v.toFixed(1) }) : T('tile.na'), w && w.name ? T('tile.near', { name: w.name }) : null);
    const r = val(state.rain, 'max'); add(T('tile.rain'), r && r.v != null ? T('tile.rain.v', { v: r.v }) : T('tile.na'), r && r.name ? T('tile.near', { name: r.name }) : null);
    const tp = val(state.temp, 'max'); add(T('tile.temp'), tp && tp.v != null ? T('tile.temp.v', { v: tp.v.toFixed(1) }) : T('tile.na'), tp && tp.name ? T('tile.near', { name: tp.name }) : null);
    const rh = val(state.rh, 'avg');
    const feels = feelsLike(); add(T('tile.rh'), rh && rh.v != null ? T('tile.rh.v', { v: Math.round(rh.v) }) : T('tile.na'), rh && rh.name ? T('tile.near', { name: rh.name }) : null);
    tiles.push(el('div', 'tile', el('div', 'tile-label', feels == null ? T('tile.feels') : T('tile.feels.v', { v: feels.toFixed(1) })), el('div', 'tile-value', feels == null ? T('tile.na') : feels.toFixed(1) + ' \u00b0C'), el('div', 'tile-sub', T('tile.feels.note'))));
    if (loc && state.twohr && state.twohr.areas.length) { const a = D.nearest(state.twohr.areas, state.loc.lat, state.loc.lng, 1)[0]; add(T('tile.fc'), a.forecast, `${a.name} · ${state.twohr.validText}`); }
    else add(T('tile.fc'), T('tile.na'), loc ? null : T('tile.fc.set'));
    box.replaceChildren(...[el('div', 'tiles', tiles), el('p', 'note', T('tiles.info')), loc ? null : el('p', 'note', T('tiles.noloc'))].filter(Boolean));
  }
  function renderIsland() {
    const box = $('island-body');
    const st = ((state.wbgt && state.wbgt.stations) || []).filter(s => s.wbgt != null);
    if (!st.length) { box.replaceChildren(el('p', 'muted', T('island.none'))); return; }
    const worst = st.reduce((a, b) => (b.wbgt > a.wbgt ? b : a)), best = st.reduce((a, b) => (b.wbgt < a.wbgt ? b : a));
    const cnt = { Low: 0, Moderate: 0, High: 0 };
    for (const s of st) cnt[s.band || R.bandFromWbgt(s.wbgt)]++;
    box.replaceChildren(
      el('p', null, T('island.worst', { station: stationLabel(worst), wbgt: fmt1(worst.wbgt) })),
      el('p', null, T('island.best', { station: stationLabel(best), wbgt: fmt1(best.wbgt) })),
      el('ul', 'band-counts', ['Low', 'Moderate', 'High'].map(b => el('li', null, h('span', { class: 'swatch', style: `background:${HEAT_COLORS[b]}` }), `${bandName(b)}: ${cnt[b]}`))),
      el('p', 'note', T('island.count', { n: st.length })));
  }
  function renderForecast24() {
    const box = $('fc24-body'), f = state.h24;
    if (!f) { box.replaceChildren(el('p', 'muted', T('sup.fc.empty'))); return; }
    const g = f.general;
    const mine = (() => { const m = regionMeta(); if (!state.loc || !Object.keys(m).length) return null; return D.nearest(Object.keys(m).map(k => Object.assign({ key: k }, m[k])), state.loc.lat, state.loc.lng, 1)[0].key; })();
    box.replaceChildren(
      el('p', null, T('sup.fc.general', { text: g.text, low: g.tempLow, high: g.tempHigh, rhlow: g.rhLow, rhhigh: g.rhHigh })),
      el('p', 'note', T('sup.fc.valid', { text: g.validText })),
      el('div', 'table-wrap', h('table', { class: 'tbl' },
        h('thead', null, h('tr', null, h('th', null, ''), REGIONS.map(k => h('th', { class: mine === k ? 'current' : '' }, T('region.' + k))))),
        h('tbody', null, f.periods.map(p => h('tr', null, h('th', { scope: 'row' }, p.text), REGIONS.map(k => h('td', { class: mine === k ? 'current' : '' }, p.regions[k] || '-'))))))));
  }

  // ------------------------------------------------------------------ rendering: water & rest
  function targetInfo() { return R.hydrationTarget(C.verdict ? C.verdict.heatBand : null); }
  function effectiveInterval() {
    const t = targetInfo();
    return state.remind.userInterval ? state.remind.intervalMin : t.defaultIntervalMin;
  }
  function renderWater() {
    const t = targetInfo(), r = state.remind;
    $('wr-target').textContent = T(t.key);
    $('wr-tip').textContent = T('wr.tip');
    const sel = $('wr-interval'); sel.replaceChildren(...[15, 20, 30, 60].map(n => h('option', { value: n, selected: n === effectiveInterval() }, T('wr.min', { n }))));
    $('wr-startstop').textContent = r.running ? T('wr.stop') : T('wr.start');
    $('wr-startstop').dataset.running = r.running ? '1' : '0';
    $('wr-mute').checked = !!r.mute;
    const nb = $('wr-notify');
    if (!('Notification' in window)) { nb.disabled = true; nb.textContent = T('wr.notify.unsupported'); }
    else if (Notification.permission === 'denied') { nb.disabled = true; nb.textContent = T('wr.notify.denied'); }
    else if (r.notify && Notification.permission === 'granted') { nb.disabled = true; nb.textContent = T('wr.notify.on'); }
    else { nb.disabled = false; nb.textContent = T('wr.notify'); }
    renderDue();
  }
  function renderDue() {
    const r = state.remind, box = $('wr-alert');
    box.hidden = !r.dueAt;
    box.textContent = r.dueAt ? `${T('wr.due')} ${T('wr.wasDue', { time: sgHM(new Date(r.dueAt)) })}` : '';
    $('wr-done').hidden = !r.dueAt;
    $('wr-card').classList.toggle('is-due', !!r.dueAt);
    $('wr-count').textContent = r.running ? T('wr.next', { mmss: mmss(R.nextReminder(r.lastTs, effectiveInterval(), Date.now()).msLeft) }) : T('wr.off');
  }
  function beep() {
    if (state.remind.mute || !audioCtx) return;
    try {
      const o = audioCtx.createOscillator(), g = audioCtx.createGain();
      o.frequency.value = 880; g.gain.value = 0.15; o.connect(g); g.connect(audioCtx.destination);
      o.start(); o.stop(audioCtx.currentTime + 0.25);
    } catch (_) { /* audio blocked */ }
  }
  function alertUser(titleKey, bodyKey, tag) {
    try { if (navigator.vibrate) navigator.vibrate([200, 100, 200]); } catch (_) { /* ignore */ }
    beep();
    if (state.remind.notify && 'Notification' in window && Notification.permission === 'granted') {
      const opts = { body: T(bodyKey), tag, renotify: true };
      if (navigator.serviceWorker && navigator.serviceWorker.ready) navigator.serviceWorker.ready.then(reg => reg.showNotification(T(titleKey), opts)).catch(() => { try { new Notification(T(titleKey), opts); } catch (_) { /* ignore */ } });
      else { try { new Notification(T(titleKey), opts); } catch (_) { /* ignore */ } }
    }
  }
  function fireReminder(dueTs) {
    const r = state.remind;
    r.dueAt = dueTs; r.lastTs = Date.now(); saveRemind();
    alertUser('wr.title', 'wr.notify.body', 'wc-water');
    renderDue();
  }
  function checkReminder() {
    const r = state.remind;
    if (!r.running) return;
    const n = R.nextReminder(r.lastTs, effectiveInterval(), Date.now());
    if (n.overdue) fireReminder(n.dueTs);
  }
  function startStopReminder() {
    const r = state.remind;
    if (r.running) { r.running = false; r.dueAt = 0; }
    else {
      r.running = true; r.lastTs = Date.now(); r.dueAt = 0;
      try { audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)(); if (audioCtx.resume) audioCtx.resume(); r.armed = true; } catch (_) { /* no audio */ }
    }
    saveRemind(); renderWater();
  }
  function waterDone() { // dismiss the alert and restart the countdown. Nothing is recorded.
    const r = state.remind; r.dueAt = 0; r.lastTs = Date.now(); renderWater();
  }

  // ------------------------------------------------------------------ rest breaks
  function brkReq() {
    const wbgt = C.verdict.demo ? state.demo.v : C.real.wbgt;
    return R.breakMinutes(C.verdict.heatBand, wbgt, state.work);
  }
  const brkLen = () => { const q = brkReq(); return q.minutes != null ? q.minutes : state.brk.custom; };
  function armAudio() {
    try { audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)(); if (audioCtx.resume) audioCtx.resume(); } catch (_) { /* no audio */ }
  }
  function logBreak(status, end) { // in memory only: the last break taken, shown on the card
    const b = state.brk;
    b.last = status === 'taken' ? { start: b.breakStart, end } : null;
  }
  function startWork() { armAudio(); Object.assign(state.brk, { phase: 'work', workStart: Date.now(), dueAlerted: false, lastLen: brkLen() }); saveBrk(); renderBrk(); }
  function stopWork() { state.brk.phase = 'idle'; saveBrk(); renderBrk(); }
  function startBreak() {
    armAudio();
    const n = brkLen(), now = Date.now();
    Object.assign(state.brk, { phase: 'break', breakStart: now, plannedMin: n, plannedEnd: now + n * 60000, raised: 0 });
    saveBrk(); renderBrk();
  }
  function finishBreak(status, end) {
    logBreak(status, end);
    Object.assign(state.brk, { phase: 'work', workStart: Date.now(), dueAlerted: false, lastLen: brkLen() });
    saveBrk(); renderBrk();
  }
  function skipBreak() { logBreak('skipped', Date.now()); Object.assign(state.brk, { workStart: Date.now(), dueAlerted: false }); saveBrk(); renderBrk(); }
  function brkTick(now) {
    const b = state.brk;
    if (b.phase === 'work') {
      if (R.nextBreakDue(b.workStart, brkLen(), now).overdue && !b.dueAlerted) { b.dueAlerted = true; saveBrk(); alertUser('brk.due', 'brk.due', 'wc-break'); renderBrk(); }
    } else if (b.phase === 'break') {
      if (now >= b.plannedEnd) { alertUser('brk.over', 'brk.over', 'wc-break'); finishBreak('taken', b.plannedEnd); return; }
    }
    updateBrkCount(now);
  }
  function updateBrkCount(now) {
    const b = state.brk, out = $('brk-count');
    if (b.phase === 'break') out.textContent = T('brk.on', { mmss: mmss(b.plannedEnd - now) });
    else if (b.phase === 'work') {
      const n = R.nextBreakDue(b.workStart, brkLen(), now);
      out.textContent = n.overdue ? T('brk.due') : T('brk.next', { mmss: mmss(n.msLeft) });
    } else out.textContent = '';
  }
  function renderBrk() {
    const b = state.brk, q = brkReq(), len = brkLen(), unknown = C.verdict.level === 'unknown';
    $('brk-need').textContent = T(q.key);
    $('brk-unk').hidden = !unknown; $('brk-unk').textContent = T('brk.unk');
    $('brk-source').replaceChildren(...rich(T('brk.source')));
    const cr = $('brk-custom-row'); cr.hidden = q.fixed;
    $('brk-custom').replaceChildren(...[5, 10, 15, 20].map(n => h('option', { value: n, selected: n === b.custom }, T('wr.min', { n }))));
    // heat went up during the hour: show the new length
    if (b.phase !== 'idle' && q.fixed && b.lastLen && len > b.lastLen) b.raised = len;
    if (b.phase !== 'idle') b.lastLen = len;
    $('brk-raised').hidden = !b.raised; $('brk-raised').textContent = b.raised ? T('brk.raised', { n: b.raised }) : '';
    const overdue = b.phase === 'work' && R.nextBreakDue(b.workStart, len, Date.now()).overdue;
    $('brk-alert').hidden = !overdue; $('brk-alert').textContent = overdue ? T('brk.due') : '';
    $('brk-card').classList.toggle('is-due', overdue);
    $('brk-water').hidden = b.phase !== 'break'; $('brk-water').textContent = T('brk.water');
    $('brk-status').textContent = b.phase === 'idle' ? T('brk.idle') : '';
    const lastEl = $('brk-last'), l = b.last;
    lastEl.textContent = l ? T('brk.last', { from: sgHM(new Date(l.start)), to: sgHM(new Date(l.end)) }) : '';
    const btn = (cls, key, params, fn) => h('button', { type: 'button', class: cls, onclick: fn }, T(key, params));
    const row = $('brk-buttons');
    if (b.phase === 'idle') row.replaceChildren(btn('btn btn-big', 'brk.start.work', null, startWork));
    else if (b.phase === 'work') row.replaceChildren(btn('btn btn-big', 'brk.start.break', { n: len }, startBreak), btn('btn ghost', 'brk.skip', null, skipBreak), btn('btn ghost', 'brk.stop.work', null, stopWork));
    else row.replaceChildren(btn('btn ghost', 'brk.end.early', null, () => finishBreak('short', Date.now())));
    updateBrkCount(Date.now());
  }
  function renderPlan() {
    const q = brkReq(), v = C.verdict;
    const key = v.level === 'unknown' ? 'sup.plan.unknown' : v.heatBand === 'High' ? 'sup.plan.high' : q.fixed ? 'sup.plan.mod' : 'sup.plan.none';
    $('plan-body').textContent = T(key);
  }

  // ------------------------------------------------------------------ sun and UV
  function currentUv() { return state.uv && state.uv.value != null ? state.uv.value : null; }
  const UV_COLORS = ['#3fae5a', '#f5b400', '#f0702a', '#c8102e', '#8f3f97'];
  let uvSig = '';
  function renderUv() {
    const body = $('uv-body'), uv = state.uv, today = sgDateStr(new Date());
    const cur = currentUv();
    const todays = uv ? uv.hourly.filter(x => sgDateStr(new Date(x.hour)) === today) : [];
    const sig = JSON.stringify([state.lang, cur, uv && uv.ts, todays.length]);
    renderUvReminder();
    if (sig === uvSig) return;
    uvSig = sig;
    if (cur == null) { body.replaceChildren(el('p', 'muted', T('tile.na'))); return; }
    const band = R.uvBand(cur), col = UV_COLORS[band.level - 1];
    const parts = [h('div', { class: 'uv-now', style: `background:${col};color:${D.textOn(col)}` },
      el('span', 'uv-val', cur === 0 ? T('uv.low.now') : T('uv.now', { v: cur })), cur === 0 ? null : el('span', 'uv-band', T('uv.band.' + band.level)))];
    parts.push(el('p', 'note', T('uv.asof', { time: sgHM(new Date(uv.ts)) })));
    if (todays.length) {
      const pk = todays.reduce((a, b) => (b.value > a.value ? b : a));
      if (pk.value > 0) parts.push(el('p', null, T('uv.peak', { v: pk.value, time: sgHM(new Date(pk.hour)) })));
      const hrs = todays.filter(x => { const hh = sgHour(new Date(x.hour)); return hh >= 7 && hh <= 19; });
      const strip = h('div', { class: 'uv-strip', role: 'img', 'aria-label': T('uv.strip.alt', { list: hrs.map(x => `${sgHM(new Date(x.hour))} ${x.value}`).join(', ') }) },
        hrs.map(x => { const c = UV_COLORS[R.uvBand(x.value).level - 1];
          return h('div', { class: 'uv-cell', title: `${sgHM(new Date(x.hour))}: UV ${x.value}` },
            el('span', 'uv-n', String(x.value)), h('span', { class: 'uv-bar', style: `height:${Math.max(3, x.value / 12 * 56)}px;background:${c}` }), el('span', 'uv-h', String(sgHour(new Date(x.hour))))); }));
      parts.push(el('p', 'note', T('uv.strip')), strip);
    }
    const adv = R.uvAdvice(band.level);
    if (adv.length) parts.push(el('h3', null, T('uv.advice.title')), el('ul', null, adv.map(k => el('li', null, T(k)))));
    body.replaceChildren(...parts);
  }
  function renderUvReminder() {
    const r = state.uvr, cur = currentUv();
    $('uv-toggle').checked = !!r.on;
    $('uv-suggest').hidden = !(cur != null && cur >= 3 && !r.on);
    $('uv-suggest').textContent = T('uv.remind.suggest', { v: cur });
    $('uv-alert').hidden = !r.dueAt; $('uv-alert').textContent = r.dueAt ? `${T('uv.remind.due')} ${T('uv.remind.wasDue', { time: sgHM(new Date(r.dueAt)) })}` : '';
    $('uv-done').hidden = !r.on;
    const nb = $('uv-notify'), wn = $('wr-notify'); nb.disabled = wn.disabled; nb.textContent = wn.textContent;
    updateUvCount(Date.now());
  }
  function updateUvCount(now) {
    const r = state.uvr;
    $('uv-count').textContent = r.on ? T('uv.remind.count', { mmss: mmss(R.nextReminder(r.lastTs, 120, now).msLeft) }) : T('uv.remind.off');
  }
  function toggleUvReminder(e) {
    const r = state.uvr; r.on = e.target.checked; r.dueAt = 0; r.lastTs = Date.now();
    if (r.on) armAudio();
    saveUvr(); renderUvReminder();
  }
  function uvDone() { state.uvr.dueAt = 0; state.uvr.lastTs = Date.now(); saveUvr(); renderUvReminder(); }
  function uvTick(now) {
    const r = state.uvr;
    if (!r.on) return;
    const n = R.nextReminder(r.lastTs, 120, now);
    if (n.overdue) { r.dueAt = n.dueTs; r.lastTs = now; saveUvr(); alertUser('uv.remind.due', 'uv.remind.due', 'wc-uv'); renderUvReminder(); }
    else updateUvCount(now);
  }

  // ------------------------------------------------------------------ symptom checker
  function renderSymptoms() {
    const box = $('sx-boxes');
    if (!box.dataset.built || box.dataset.lang !== state.lang) {
      box.dataset.built = '1'; box.dataset.lang = state.lang;
      const group = (title, ids) => h('fieldset', { class: 'sx-group' }, h('legend', null, title),
        ids.map(id => h('label', { class: 'sx-item' }, h('input', { type: 'checkbox', value: id, checked: state.ticked.has(id), onchange: onTick }), h('span', null, T('sx.' + id)))));
      box.replaceChildren(group(T('sx.groupA'), R.SX_A), group(T('sx.groupB'), R.SX_B));
    }
    const tri = R.symptomTriage([...state.ticked]);
    const out = $('sx-result');
    out.className = `sx-result lvl-${tri.level}`;
    const wa = $('sx-wa');
    if (tri.level === 'none') {
      out.replaceChildren(el('p', null, T('sx.none')));
      wa.hidden = true;
    } else if (tri.level === 'emergency') {
      out.replaceChildren(el('div', 'vhead', icon('emergency'), el('div', 'vword', T('sx.emergency.title'))),
        h('a', { class: 'btn btn-big btn-red', href: 'tel:995' }, T('btn.call995')),
        el('ul', null, [1, 2, 3, 4, 5].map(i => el('li', null, T('sx.emergency.' + i)))));
    } else {
      out.replaceChildren(el('div', 'vhead', icon('takecare'), el('div', 'vword', T('sx.act.title'))),
        el('ul', null, [1, 2, 3, 4, 5, 6].map(i => el('li', null, T('sx.act.' + i)))),
        h('a', { class: 'btn', href: 'tel:995' }, T('btn.call995')));
    }
    if (tri.level !== 'none') {
      const p = C.pick, labels = {};
      for (const id of tri.a.concat(tri.b)) labels[id] = E('sx.' + id);
      const msg = R.buildSymptomMessage({ ticked: [...state.ticked], time: sgHM(new Date()), station: C.station, wbgt: p ? C.real.wbgt : null,
        band: C.realVerdict.heatBand ? E('band.heat.' + C.realVerdict.heatBand) : '', bossName: state.boss.name.trim() }, E, labels);
      wa.hidden = false; wa.href = waHref(msg);
    }
  }
  function onTick(e) {
    const before = R.symptomTriage([...state.ticked]).level;
    if (e.target.checked) state.ticked.add(e.target.value); else state.ticked.delete(e.target.value);
    renderSymptoms();
    // An emergency result sits below the checklist; bring it into view so "Call 995" is seen at once.
    if (before !== 'emergency' && R.symptomTriage([...state.ticked]).level === 'emergency') {
      const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
      $('sx-result').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
    }
  }

  // ------------------------------------------------------------------ why this verdict
  function renderWhy() {
    const v = C.verdict, p = C.pick;
    const dataText = v.demo ? `DEMO ${fmt1(state.demo.v)} °C` : (p && state.wbgt && v.level !== 'unknown'
      ? T('why.data.heat', { wbgt: fmt1(p.s.wbgt), ago: D.ago(Date.now() - Date.parse(state.wbgt.ts), T) }) : T('why.data.none'));
    const airText = C.air && (C.fresh.pm25 || C.fresh.psi) ? T('why.data.air', { text: C.detail || [C.fresh.pm25 ? C.air.pm25.band.name : null, C.fresh.psi ? C.air.psi.band.name : null].filter(Boolean).join(' / ') }) : T('why.data.airnone');
    const ruleKey = v.level === 'unknown' ? 'why.rule.unknown' : v.heatBand === 'High' ? 'why.rule.high' : v.heatBand === 'Moderate' ? 'why.rule.mod' : v.level === 'takecare' ? 'why.rule.air' : 'why.rule.low';
    $('why-chain').replaceChildren(
      el('li', null, T('why.chain.data', { text: `${dataText}; ${airText}` })),
      el('li', null, T('why.chain.band', { text: v.heatBand ? bandName(v.heatBand) : T(v.wordKey) })),
      el('li', null, T('why.chain.rule', { text: T(ruleKey) })),
      el('li', null, T('why.chain.action', { text: v.actionKeys.map(k => T(k)).join(' ') })));
    const cur = v.heatBand;
    const heat = [['Low', 'why.th.row.low'], ['Moderate', 'why.th.row.mod'], ['High', 'why.th.row.high']];
    const pmCur = C.air && C.air.pm25 ? C.air.pm25.band.level : 0, psCur = C.air && C.air.psi ? C.air.psi.band.level : 0;
    const th = (rows, curTest) => rows.map(r => h('tr', { class: curTest(r) ? 'current' : '', 'aria-current': curTest(r) ? 'true' : null }, h('th', { scope: 'row' }, r.l), h('td', null, r.r)));
    $('why-th').replaceChildren(
      h('thead', null, h('tr', null, h('th', null, T('why.th.heat')), h('th', null, ''))),
      h('tbody', null, th(heat.map(([b, k]) => ({ b, l: T(k), r: bandName(b) })), r => r.b === cur)),
      h('thead', null, h('tr', null, h('th', null, T('why.th.pm25')), h('th', null, ''))),
      h('tbody', null, th([1, 2, 3, 4].map(i => ({ i, l: T('why.th.pm25.' + i), r: T('band.pm25.' + i) })), r => r.i === pmCur)),
      h('thead', null, h('tr', null, h('th', null, T('why.th.psi')), h('th', null, ''))),
      h('tbody', null, th([1, 2, 3, 4, 5].map(i => ({ i, l: T('why.th.psi.' + i), r: T('band.psi.' + i) })), r => r.i === psCur)));
    $('demo-label').textContent = T('why.demo.slider', { v: fmt1(state.demo.v) });
    $('demo-slider').setAttribute('aria-valuetext', `${fmt1(state.demo.v)} °C`);
  }
  function renderBrief() {
    $('brief-list').replaceChildren(...[1, 2, 3, 4, 5, 6].map(i => el('li', null, T('brief.' + i, { band: C.verdict.heatBand ? bandName(C.verdict.heatBand) : T('verdict.unknown') }))));
  }
  function briefText() {
    return [E('brief.title')].concat([1, 2, 3, 4, 5, 6].map(i => `${i}. ${E('brief.' + i, { band: C.verdict.heatBand ? E('band.heat.' + C.verdict.heatBand) : E('verdict.unknown') })}`)).join('\n');
  }
  function renderChecklist() {
    $('check-list').replaceChildren(...[1, 2, 3, 4, 5, 6].map(i => el('li', null, T('sup.check.' + i))));
    $('check-mand').replaceChildren(...[1, 2, 3, 4].map(i => el('li', null, T('sup.check.m' + i))));
  }

  // ------------------------------------------------------------------ location form
  function renderLoc() {
    const l = state.loc;
    $('loc-status').textContent = !l ? T('loc.status.none') : l.kind === 'geo' ? T('loc.status.geo') : T('loc.status.postal', { code: l.code, address: l.address || '' }) + (l.saved ? ' ' + T('loc.status.saved') : '');
    $('loc-save').hidden = !l || l.saved;
    $('loc-forget').hidden = !l || !l.saved;
    for (const b of [$('loc-heavy'), $('loc-light')]) b.setAttribute('aria-pressed', String(b.dataset.work === state.work));
    if (document.activeElement !== $('boss-num')) $('boss-num').value = state.boss.num;
    if (document.activeElement !== $('boss-name')) $('boss-name').value = state.boss.name;
  }
  function setMsg(id, text) { const m = $(id); m.textContent = text || ''; m.hidden = !text; }
  async function applyPostal() {
    const code = $('loc-postal').value.trim();
    if (!/^\d{6}$/.test(code)) { setMsg('loc-msg', T('loc.err.format')); return; }
    setMsg('loc-msg', T('loc.looking'));
    let r;
    try { r = await D.lookupPostal(code); } catch (_) { setMsg('loc-msg', T('loc.err.onemap')); return; }
    if (!r) { setMsg('loc-msg', T('loc.err.notfound')); return; }
    setMsg('loc-msg', '');
    setLoc({ kind: 'postal', lat: r.lat, lng: r.lng, code, address: r.address, saved: false });
  }
  function useGeo() { // only ever called from a tap
    if (!navigator.geolocation) { setMsg('loc-msg', T('loc.err.geo.unsupported')); return; }
    setMsg('loc-msg', T('loc.looking'));
    navigator.geolocation.getCurrentPosition(pos => {
      setMsg('loc-msg', '');
      setLoc({ kind: 'geo', lat: pos.coords.latitude, lng: pos.coords.longitude, code: null, address: '', saved: false });
    }, () => setMsg('loc-msg', T('loc.err.geo')), { timeout: 10000, maximumAge: 60000 });
  }
  function setLoc(loc) { state.loc = loc; recomputeAndRender(); }
  function saveLoc() {
    if (!state.loc) return;
    state.loc.saved = true;
    safeStore(K.loc, JSON.stringify({ kind: state.loc.kind, lat: state.loc.lat, lng: state.loc.lng, code: state.loc.code, address: state.loc.address }));
    recomputeAndRender();
  }
  function forgetLoc() { safeStore(K.loc, null); state.loc = null; $('loc-postal').value = ''; recomputeAndRender(); }
  function saveBoss() {
    const num = $('boss-num').value.replace(/\s/g, ''), name = $('boss-name').value.trim().slice(0, 40);
    if (num && !/^[3689]\d{7}$/.test(num)) { setMsg('boss-msg', T('loc.boss.err')); return; }
    state.boss = { num, name };
    safeStore(K.boss, num || name ? JSON.stringify(state.boss) : null);
    setMsg('boss-msg', T('loc.boss.saved')); recomputeAndRender();
  }
  function setWork(w) { state.work = w; safeStore(K.work, w); recomputeAndRender(); }

  // ------------------------------------------------------------------ map (Leaflet loaded lazily)
  function loadLeaflet() {
    if (window.L) return Promise.resolve();
    if (leafletPromise) return leafletPromise;
    leafletPromise = new Promise((resolve, reject) => {
      document.head.append(h('link', { rel: 'stylesheet', href: LEAFLET_CSS }));
      const s = h('script', { src: LEAFLET_JS });
      s.onload = resolve; s.onerror = () => { leafletPromise = null; reject(new Error('leaflet')); };
      document.head.append(s);
    });
    return leafletPromise;
  }
  async function onMapToggle() {
    if (!$('map-details').open) return;
    renderStationList();
    try { await loadLeaflet(); } catch (_) { $('map-msg').hidden = false; $('map-msg').textContent = T('map.failed'); return; }
    $('map-msg').hidden = true;
    if (!map) {
      map = L.map('map', { scrollWheelZoom: false }).setView([1.3521, 103.8198], 11);
      const dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      L.tileLayer(`https://www.onemap.gov.sg/maps/tiles/${dark ? 'Night' : 'Grey'}/{z}/{x}/{y}.png`, {
        minZoom: 11, maxZoom: 19, detectRetina: true,
        attribution: '<a href="https://www.onemap.gov.sg/" target="_blank" rel="noopener">OneMap</a> © contributors | <a href="https://www.sla.gov.sg/" target="_blank" rel="noopener">Singapore Land Authority</a>',
      }).addTo(map);
      mapLayers = L.layerGroup().addTo(map);
    }
    setTimeout(() => { map.invalidateSize(); renderMap(); }, 50);
  }
  function renderMap() {
    if (!map || !mapLayers) return;
    mapLayers.clearLayers();
    const st = ((state.wbgt && state.wbgt.stations) || []).filter(s => s.wbgt != null);
    for (const s of st) {
      const band = s.band || R.bandFromWbgt(s.wbgt), col = HEAT_COLORS[band];
      const used = C.pick && C.pick.s.id === s.id;
      const html = `<div class="pill${used ? ' pill-used' : ''}" style="background:${col};color:${D.textOn(col)}">${fmt1(s.wbgt)}</div>`;
      L.marker([s.lat, s.lng], { icon: L.divIcon({ className: 'leaflet-div-icon pill-icon', html, iconSize: [48, 24], iconAnchor: [24, 12] }), title: `${stationLabel(s)}: ${fmt1(s.wbgt)} °C ${bandName(band)}`, zIndexOffset: used ? 1000 : 0 }).addTo(mapLayers);
    }
    if (state.loc) L.circleMarker([state.loc.lat, state.loc.lng], { radius: 8, color: '#fff', weight: 2, fillColor: '#0b5fff', fillOpacity: 1 }).bindTooltip(T('map.you')).addTo(mapLayers);
  }
  function renderStationList() {
    const st = ((state.wbgt && state.wbgt.stations) || []).filter(s => s.wbgt != null);
    const rows = st.map(s => Object.assign({ km: state.loc ? D.haversine(state.loc.lat, state.loc.lng, s.lat, s.lng) : null }, s))
      .sort((a, b) => (state.loc ? a.km - b.km : b.wbgt - a.wbgt)).slice(0, 12);
    $('station-table').replaceChildren(
      h('thead', null, h('tr', null, h('th', null, T('map.col.station')), h('th', null, T('map.col.wbgt')), h('th', null, T('map.col.band')), state.loc ? h('th', null, T('map.col.dist')) : null)),
      h('tbody', null, rows.map(s => { const b = s.band || R.bandFromWbgt(s.wbgt), used = C.pick && C.pick.s.id === s.id;
        return h('tr', { class: used ? 'current' : '' }, h('th', { scope: 'row' }, stationLabel(s), used ? el('span', 'tag', T('map.nearest')) : null),
          h('td', null, fmt1(s.wbgt)), h('td', null, bandName(b)), state.loc ? h('td', null, `${s.km.toFixed(1)} km`) : null); })));
  }

  // ------------------------------------------------------------------ status line and chrome
  function renderStatus() {
    const now = Date.now();
    $('st-nea').textContent = T('status.nea', { time: state.wbgt ? sgHM(new Date(state.wbgt.ts)) : T('status.none') });
    $('st-upd').textContent = state.lastFastOkAt ? T('status.updated', { time: sgHM(new Date(state.lastFastOkAt)) }) : T('status.loading');
    $('st-next').textContent = state.lastFastOkAt || sched ? T('status.next', { mmss: mmss(Math.max(0, sched.nextFastAt() - now)) }) : '';
    const rb = $('refresh'), lock = sched ? sched.lockLeftMs() : 0;
    const busy = sched && sched.isBusy();
    rb.disabled = !!busy || lock > 0;
    rb.textContent = busy ? T('status.refreshing') : lock > 0 ? T('status.wait', { n: Math.ceil(lock / 1000) }) : T('status.refresh');
  }
  function applyStaticI18n() {
    document.documentElement.lang = S.HTML_LANG[state.lang] || state.lang;
    document.title = T('app.doctitle');
    $('meta-desc').setAttribute('content', T('app.description'));
    for (const n of document.querySelectorAll('[data-i18n]')) n.replaceChildren(...rich(T(n.dataset.i18n)));
    for (const n of document.querySelectorAll('[data-i18n-aria]')) n.setAttribute('aria-label', T(n.dataset.i18nAria));
    for (const n of document.querySelectorAll('[data-i18n-ph]')) n.setAttribute('placeholder', T(n.dataset.i18nPh));
    $('i18n-notice').hidden = S.isReviewed(state.lang); $('i18n-notice').textContent = T('i18n.unreviewed');
    const sel = $('lang'); // Only offer languages that have translations; empty placeholder blocks stay hidden until filled in.
    const ready = S.LANGS.filter(l => l === 'en' || Object.keys(S.STRINGS[l] || {}).filter(k => k !== 'meta').length > 0);
    if (!ready.includes(state.lang)) state.lang = 'en';
    sel.replaceChildren(...ready.map(l => h('option', { value: l, selected: l === state.lang }, S.STRINGS[l].meta.name)));
    $('foot-odl').replaceChildren(...rich(T('foot.odl', { date: new Intl.DateTimeFormat('en-SG', { timeZone: 'Asia/Singapore', day: 'numeric', month: 'short', year: 'numeric' }).format(new Date()) })));
    $('map-attr').replaceChildren(...rich(T('map.attr')));
    $('sx-sources').replaceChildren(...rich(T('sx.sources')));
    $('uv-sources').replaceChildren(...rich(T('uv.sources')));
    $('why-sources').replaceChildren(...['why.src.mom', 'why.src.mom2023', 'why.src.reporting'].map(k => el('li', null, ...rich(T(k)))));
  }
  function setMode(m) {
    state.mode = m; safeStore(K.mode, m);
    $('main').dataset.mode = m;
    $('mode-worker').setAttribute('aria-pressed', String(m === 'worker')); $('mode-supervisor').setAttribute('aria-pressed', String(m === 'supervisor'));
    $('sx-details').open = m === 'worker';
  }

  // ------------------------------------------------------------------ orchestration
  function recomputeAndRender() {
    compute();
    $('demo-banner').hidden = !state.demo.on;
    const sig = verdictSig();
    if (sig !== lastSig) { lastSig = sig; renderVerdict(); }
    renderChips(); renderActions();
    renderSupBand(); renderAir(); renderTiles(); renderIsland(); renderWater(); renderBrk(); renderUv(); renderPlan(); renderSymptoms(); renderWhy(); renderBrief(); renderChecklist();
    renderChart(); renderForecast24(); renderLoc(); renderStatus();
    if ($('map-details').open) { renderStationList(); renderMap(); }
  }
  function fullRender() { lastSig = ''; applyStaticI18n(); recomputeAndRender(); $('sx-boxes').dataset.built = ''; renderSymptoms(); }

  async function runFast() {
    const budget = D.newBudget(10), errs = [], today = sgDateStr(new Date());
    let wbgtOk = false;
    const steps = [
      ['WBGT', async () => { const r = await D.loadWbgt(budget); if (!r) throw new Error('empty'); state.wbgt = r; wbgtOk = true; }],
      ['PM2.5', async () => { const r = await D.loadPm25Day(today, budget, 2); state.pm25Today = r.items; if (Object.keys(r.regions).length) state.pm25Regions = r.regions; }],
      ['PSI', async () => { const r = await D.loadSimple('psi', D.parsePsi, budget); if (!r) throw new Error('empty'); state.psi = r; }],
      ['rain', async () => { state.rain = await D.loadSimple('rain', D.parseStationValues, budget); }],
      ['temperature', async () => { state.temp = await D.loadSimple('temp', D.parseStationValues, budget); }],
      ['humidity', async () => { state.rh = await D.loadSimple('rh', D.parseStationValues, budget); }],
    ];
    for (let i = 0; i < steps.length; i++) {
      if (i) await D.sleep(D.STEP_GAP_MS);
      try { await steps[i][1](); } catch (e) { errs.push(steps[i][0]); }
      recomputeAndRender();
    }
    state.errors = errs;
    if (wbgtOk) state.lastFastOkAt = Date.now();
    D.banner(errs.length ? T('banner.error', { what: errs.join(', ') }) : '');
    recomputeAndRender();
    return wbgtOk;
  }
  async function runSlow() {
    const budget = D.newBudget(16), now = new Date();
    const yDate = sgYesterdayStr(now);
    const yestComplete = state.yestDate === yDate && state.pm25Yest.some(i => /T23:00/.test(i.timestamp));
    const skipY = yestComplete || (sgHour(now) >= 12 && state.pm25Today.length >= 12);
    const steps = [];
    if (!skipY) steps.push(async () => { state.pm25Yest = (await D.loadPm25Day(yDate, budget, 2)).items; state.yestDate = yDate; });
    steps.push(async () => { state.wbgtHist = await D.loadWbgtDay(sgDateStr(now), budget); });
    steps.push(async () => { state.twohr = await D.loadSimple('twohr', D.parseTwoHr, budget); });
    steps.push(async () => { state.uv = await D.loadSimple('uv', D.parseUv, budget); });
    steps.push(async () => { state.wind = await D.loadSimple('wind', D.parseStationValues, budget); });
    steps.push(async () => { state.h24 = await D.loadSimple('h24', D.parse24h, budget); });
    for (let i = 0; i < steps.length; i++) {
      if (i) await D.sleep(D.STEP_GAP_MS);
      try { await steps[i](); } catch (_) { /* slow data is optional */ }
      recomputeAndRender();
    }
  }

  function tick() {
    const now = Date.now();
    if (document.hidden) return;
    sched.tick();
    renderStatus();
    const minute = Math.floor(now / 60000);
    if (minute !== lastMinute) { lastMinute = minute; recomputeAndRender(); }
    checkReminder();
    if (state.remind.running) $('wr-count').textContent = T('wr.next', { mmss: mmss(R.nextReminder(state.remind.lastTs, effectiveInterval(), now).msLeft) });
    brkTick(now); uvTick(now);
  }

  // ------------------------------------------------------------------ init
  function bind() {
    $('lang').addEventListener('change', e => { state.lang = e.target.value; safeStore(K.lang, state.lang); fullRender(); });
    $('mode-worker').addEventListener('click', () => setMode('worker'));
    $('mode-supervisor').addEventListener('click', () => setMode('supervisor'));
    $('refresh').addEventListener('click', () => { sched.manualRefresh(); renderStatus(); });
    for (const b of document.querySelectorAll('[data-work]')) b.addEventListener('click', () => setWork(b.dataset.work));
    $('btn-wa').addEventListener('click', e => { if (state.demo.on) e.preventDefault(); });
    $('btn-copy').addEventListener('click', () => { if (!state.demo.on) copyText(heatMessage()); });
    $('wr-startstop').addEventListener('click', startStopReminder);
    $('wr-interval').addEventListener('change', e => { state.remind.intervalMin = Number(e.target.value); state.remind.userInterval = true; if (state.remind.running) state.remind.lastTs = Date.now(); saveRemind(); renderWater(); });
    $('wr-mute').addEventListener('change', e => { state.remind.mute = e.target.checked; saveRemind(); });
    $('wr-notify').addEventListener('click', async () => {
      try { const p = await Notification.requestPermission(); state.remind.notify = p === 'granted'; saveRemind(); } catch (_) { /* ignore */ }
      renderWater();
    });
    $('wr-done').addEventListener('click', waterDone);
    $('uv-toggle').addEventListener('change', toggleUvReminder);
    $('uv-done').addEventListener('click', uvDone);
    $('uv-notify').addEventListener('click', () => $('wr-notify').click());
    $('brk-custom').addEventListener('change', e => { state.brk.custom = Number(e.target.value); saveBrk(); renderBrk(); });
    $('sx-clear').addEventListener('click', () => { state.ticked.clear(); $('sx-boxes').dataset.built = ''; renderSymptoms(); });
    $('demo-toggle').addEventListener('change', e => { state.demo.on = e.target.checked; recomputeAndRender(); });
    $('demo-slider').addEventListener('input', e => { state.demo.v = Number(e.target.value); recomputeAndRender(); });
    $('brief-copy').addEventListener('click', () => copyText(briefText()));
    $('loc-form').addEventListener('submit', e => { e.preventDefault(); applyPostal(); });
    $('loc-geo').addEventListener('click', useGeo);
    $('loc-save').addEventListener('click', saveLoc);
    $('loc-forget').addEventListener('click', forgetLoc);
    $('boss-form').addEventListener('submit', e => { e.preventDefault(); saveBoss(); });
    $('map-details').addEventListener('toggle', onMapToggle);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) { sched.onVisible(); checkReminder(); recomputeAndRender(); } });
    window.addEventListener('pageshow', () => { sched.onVisible(); });
  }

  function init() {
    loadState();
    if (state.loc && state.loc.code) $('loc-postal').value = state.loc.code;
    $('demo-slider').value = String(state.demo.v);
    sched = D.createScheduler({ runFast, runSlow, isHidden: () => document.hidden });
    bind();
    setMode(state.mode);
    fullRender();
    lastMinute = Math.floor(Date.now() / 60000);
    checkReminder();
    setInterval(tick, 1000);
    if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => { /* optional */ });
  }
  init();
})();
