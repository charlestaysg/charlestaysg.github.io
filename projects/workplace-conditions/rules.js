/* Live Workplace Conditions: verdict rules. Pure functions, no DOM, no network.
 * Loaded in the browser as SH.rules and in node tests via require().
 * Sources: MOM heat stress measures for outdoor work (updated 28 Aug 2026);
 * MOM press release 24 Oct 2023 (light-work rows, shown as "earlier guidance").
 * MOM states no WBGT at which all work must stop, so none is invented here. */
(function (root) {
  'use strict';

  const WBGT_FRESH_MIN = 45;
  const AIR_FRESH_MIN = 120;
  const MOD_AT = 31, HIGH_AT = 33, REST10_AT = 32;
  const PM25_NAMES = ['Normal', 'Elevated', 'High', 'Very High'];
  const PSI_NAMES = ['Good', 'Moderate', 'Unhealthy', 'Very unhealthy', 'Hazardous'];
  const HEAT_BANDS = ['Low', 'Moderate', 'High'];

  /** Fallback band from a WBGT number: <31 Low, 31 to <33 Moderate, >=33 High. */
  function bandFromWbgt(w) {
    if (typeof w !== 'number' || !isFinite(w)) return null;
    // Work in tenths so 32.9 and 33.0 compare exactly.
    const x = Math.round(w * 10);
    if (x < MOD_AT * 10) return 'Low';
    if (x < HIGH_AT * 10) return 'Moderate';
    return 'High';
  }
  /** NEA 1-hour PM2.5 bands: Normal <=55, Elevated 56-150, High 151-250, Very High >250. */
  function pm25Band(v) {
    if (typeof v !== 'number' || !isFinite(v)) return null;
    const level = v <= 55 ? 1 : v <= 150 ? 2 : v <= 250 ? 3 : 4;
    return { level, name: PM25_NAMES[level - 1] };
  }
  /** NEA 24-hour PSI bands: Good <=50, Moderate 51-100, Unhealthy 101-200, Very unhealthy 201-300, Hazardous >300. */
  function psiBand(v) {
    if (typeof v !== 'number' || !isFinite(v)) return null;
    const level = v <= 50 ? 1 : v <= 100 ? 2 : v <= 200 ? 3 : v <= 300 ? 4 : 5;
    return { level, name: PSI_NAMES[level - 1] };
  }
  const pm25Level = n => (n ? PM25_NAMES.indexOf(n) + 1 : 0);
  const psiLevel = n => (n ? PSI_NAMES.indexOf(n) + 1 : 0);

  /** Rest minutes MOM sets for this band and work type, or null when no fixed minutes apply. */
  function restRequirement(band, wbgt, work) {
    const heavy = work !== 'light';
    if (band === 'High') return heavy ? { minutes: 15, key: 'wr.rest.need.high.heavy' } : { minutes: 10, key: 'wr.rest.need.high.light' };
    if (band === 'Moderate' && typeof wbgt === 'number' && Math.round(wbgt * 10) >= REST10_AT * 10) {
      return heavy ? { minutes: 10, key: 'wr.rest.need.mod.heavy' } : { minutes: 5, key: 'wr.rest.need.mod.light' };
    }
    return { minutes: null, key: 'wr.rest.need.none' };
  }

  const AIR_ACTIONS = ['act.air.1', 'act.air.2', 'act.air.3'];

  /**
   * verdict(input) -> { level, color, icon, wordKey, reasonKey, reasonParams, actionKeys, heatBand,
   *                     airBad, airDelayed, alsoAir, demo }
   * input: { wbgt, band, wbgtAge (minutes), pm25Band, psiBand (names or null), airAge (minutes), work, demo }
   * Never returns CARRY ON when WBGT is stale or missing.
   */
  function verdict(inp) {
    const work = inp.work === 'light' ? 'light' : 'heavy';
    const wbgt = typeof inp.wbgt === 'number' && isFinite(inp.wbgt) ? inp.wbgt : null;
    const age = typeof inp.wbgtAge === 'number' && isFinite(inp.wbgtAge) ? inp.wbgtAge : null;
    const airAge = typeof inp.airAge === 'number' && isFinite(inp.airAge) ? inp.airAge : null;
    const demo = !!inp.demo;

    const airFresh = airAge != null && airAge <= AIR_FRESH_MIN;
    const pmL = airFresh ? pm25Level(inp.pm25Band) : 0;
    const psL = airFresh ? psiLevel(inp.psiBand) : 0;
    const airBad = pmL >= 3 || psL >= 3;
    const airDelayed = !airFresh;

    const out = { work, demo, airBad, airDelayed, alsoAir: false, heatBand: null, reasonParams: {} };
    const fresh = wbgt != null && age != null && age <= WBGT_FRESH_MIN;

    if (!fresh) {
      return Object.assign(out, {
        level: 'unknown', color: 'grey', icon: 'unknown', wordKey: 'verdict.unknown',
        reasonKey: wbgt == null ? 'reason.unknown.missing' : 'reason.unknown.stale',
        actionKeys: ['act.unk.1', 'act.unk.2', 'act.unk.3'].concat(airBad ? AIR_ACTIONS : []),
        alsoAir: false,
      });
    }

    const valid = HEAT_BANDS.indexOf(inp.band) >= 0;
    const band = valid ? inp.band : bandFromWbgt(wbgt);
    out.heatBand = band;
    out.reasonParams = { wbgt: wbgt.toFixed(1), band };

    if (band === 'High') {
      return Object.assign(out, {
        level: 'restnow', color: 'orange', icon: 'restnow', wordKey: 'verdict.restnow', reasonKey: 'reason.heat',
        actionKeys: [work === 'light' ? 'act.high.rest.light' : 'act.high.rest.heavy', 'act.high.2', 'act.high.3'],
        alsoAir: airBad,
      });
    }
    if (band === 'Moderate') {
      const keys = ['act.mod.1', 'act.mod.2', 'act.mod.3'];
      if (Math.round(wbgt * 10) >= REST10_AT * 10) keys.push(work === 'light' ? 'act.mod.rest.light' : 'act.mod.rest.heavy');
      return Object.assign(out, {
        level: 'takecare', color: 'amber', icon: 'takecare', wordKey: 'verdict.takecare', reasonKey: 'reason.heat',
        actionKeys: keys, alsoAir: airBad,
      });
    }
    if (airBad) {
      return Object.assign(out, {
        level: 'takecare', color: 'amber', icon: 'takecare', wordKey: 'verdict.takecare', reasonKey: 'reason.air',
        actionKeys: AIR_ACTIONS.concat(['act.low.1']), alsoAir: false,
      });
    }
    return Object.assign(out, {
      level: 'carryon', color: 'green', icon: 'carryon', wordKey: 'verdict.carryon', reasonKey: 'reason.low',
      actionKeys: ['act.low.1', 'act.low.2', 'act.low.3', 'act.low.4'],
    });
  }

  /** Heat index in degC (US NWS Rothfusz regression with the low-HI and humidity adjustments). Info only. */
  function heatIndexC(tC, rh) {
    if (typeof tC !== 'number' || typeof rh !== 'number' || !isFinite(tC) || !isFinite(rh)) return null;
    const T = tC * 9 / 5 + 32;
    let hi = 0.5 * (T + 61 + (T - 68) * 1.2 + rh * 0.094);
    if ((hi + T) / 2 >= 80) {
      hi = -42.379 + 2.04901523 * T + 10.14333127 * rh - 0.22475541 * T * rh - 0.00683783 * T * T - 0.05481717 * rh * rh +
        0.00122874 * T * T * rh + 0.00085282 * T * rh * rh - 0.00000199 * T * T * rh * rh;
      if (rh < 13 && T >= 80 && T <= 112) hi -= ((13 - rh) / 4) * Math.sqrt((17 - Math.abs(T - 95)) / 17);
      else if (rh > 85 && T >= 80 && T <= 87) hi += ((rh - 85) / 10) * ((87 - T) / 5);
    }
    return Math.round((hi - 32) * 5 / 9 * 10) / 10;
  }

  /** Minutes per heat band from time-ordered points [{ms, v}]. Each point counts until the next one
   *  (capped at 20 min); the last counts up to `nowMs` (capped at 15 min). Returns {Low, Moderate, High}. */
  function bandMinutes(points, nowMs) {
    const out = { Low: 0, Moderate: 0, High: 0 };
    for (let i = 0; i < points.length; i++) {
      const p = points[i]; if (p.v == null) continue;
      const end = i + 1 < points.length ? points[i + 1].ms : (nowMs == null ? p.ms + 15 * 60000 : nowMs);
      const min = Math.max(0, Math.min((end - p.ms) / 60000, i + 1 < points.length ? 20 : 15));
      out[bandFromWbgt(p.v)] += min;
    }
    for (const k of Object.keys(out)) out[k] = Math.round(out[k]);
    return out;
  }

  // ------------------------------------------------------------------ UV (protection advice only, never drives the verdict)
  const UV_NAMES = ['Low', 'Moderate', 'High', 'Very High', 'Extreme'];
  /** WHO / NEA UV bands: Low 0-2, Moderate 3-5, High 6-7, Very High 8-10, Extreme 11+. */
  function uvBand(v) {
    if (typeof v !== 'number' || !isFinite(v) || v < 0) return null;
    const level = v < 3 ? 1 : v < 6 ? 2 : v < 8 ? 3 : v < 11 ? 4 : 5;
    return { level, name: UV_NAMES[level - 1] };
  }
  /** Advice string keys for a UV band level (1-5). None below Moderate (UV 3). */
  function uvAdvice(level) {
    if (!level || level < 2) return [];
    const keys = ['uv.adv.hat', 'uv.adv.glasses', 'uv.adv.sunscreen', 'uv.adv.clothing', 'uv.adv.shade'];
    if (level >= 4) keys.push('uv.adv.limit');
    keys.push('uv.heat.note');
    return keys;
  }

  // ------------------------------------------------------------------ rest breaks
  /** breakMinutes(band, wbgt, work) -> { minutes (null = no fixed minutes), fixed, earlier, key }.
   *  High: heavy 15, light 10 (2023). Moderate from 32: heavy 10, light 5 (2023, MOM says 5 to 10).
   *  Moderate 31 to <32 or Low: adequate rest in shade, no fixed minutes. Unknown band: Moderate-from-32 values. */
  function breakMinutes(band, wbgt, work) {
    const heavy = work !== 'light';
    if (band === 'High') return { minutes: heavy ? 15 : 10, fixed: true, earlier: !heavy, key: heavy ? 'wr.rest.need.high.heavy' : 'wr.rest.need.high.light' };
    const mod32 = band == null || (band === 'Moderate' && typeof wbgt === 'number' && Math.round(wbgt * 10) >= REST10_AT * 10);
    if (mod32) return { minutes: heavy ? 10 : 5, fixed: true, earlier: !heavy, key: heavy ? 'wr.rest.need.mod.heavy' : 'wr.rest.need.mod.light' };
    return { minutes: null, fixed: false, earlier: false, key: 'wr.rest.need.none' };
  }
  /** nextBreakDue(workStartTs, breakMin, now): next break after (60 - breakMin) minutes of work. Timestamps, so it survives sleep. */
  function nextBreakDue(workStartTs, breakMin, now) {
    const workMin = 60 - Math.max(0, Math.min(55, Number(breakMin) || 0));
    const dueTs = workStartTs + workMin * 60000;
    return { dueTs, overdue: now >= dueTs, msLeft: Math.max(0, dueTs - now), workMin };
  }
  /** fmtDur(min, t): "2 h 15 min", "3 h", "45 min". */
  function fmtDur(min, t) {
    const hh = Math.floor(min / 60), mm = Math.round(min % 60);
    return hh && mm ? t('chart.dur.hm', { h: hh, m: mm }) : hh ? t('chart.dur.h', { h: hh }) : t('chart.dur.m', { m: mm });
  }
  // ------------------------------------------------------------------ symptom checker
  const SX_A = ['a.confused', 'a.collapsed', 'a.seizure', 'a.hotdry', 'a.vomiting', 'a.noresponse'];
  const SX_B = ['b.sweat', 'b.dizzy', 'b.headache', 'b.nausea', 'b.cramps', 'b.tired', 'b.heart', 'b.pale'];
  /** symptomTriage(ticked: string[]) -> { level: 'none'|'act'|'emergency', a: [], b: [] }.
   *  Any Group A sign is an emergency. Group B alone is ACT NOW. Nothing ticked is 'none', never "fine". */
  function symptomTriage(ticked) {
    const set = new Set(Array.isArray(ticked) ? ticked : []);
    const a = SX_A.filter(k => set.has(k));
    const b = SX_B.filter(k => set.has(k));
    return { level: a.length ? 'emergency' : b.length ? 'act' : 'none', a, b };
  }

  // ------------------------------------------------------------------ hydration
  /** hydrationTarget(band): amounts come from MOM. Unknown or missing band uses the Moderate target. */
  function hydrationTarget(band) {
    if (band === 'Moderate' || band === 'High') return { mlPerHour: 300, mode: 'fixed', defaultIntervalMin: 20, key: 'wr.target.mod' };
    if (band === 'Low') return { mlPerHour: null, mode: 'regular', defaultIntervalMin: 60, key: 'wr.target.low' };
    return { mlPerHour: 300, mode: 'fixed', defaultIntervalMin: 20, key: 'wr.target.unk' };
  }
  /** nextReminder(lastTs, intervalMin, now) uses timestamps so it survives a sleeping tab. */
  function nextReminder(lastTs, intervalMin, now) {
    const step = Math.max(1, Number(intervalMin) || 60) * 60000;
    const dueTs = lastTs + step;
    const overdue = now >= dueTs;
    return { dueTs, overdue, msLeft: overdue ? 0 : dueTs - now, missed: overdue ? Math.floor((now - lastTs) / step) : 0 };
  }
  // ------------------------------------------------------------------ messages (English)
  function nameBit(name) { return name ? ' ' + name : ' boss'; }

  /** buildMessage(ctx, t): the WhatsApp heat update. t is an English t(key, params).
   * ctx: { verdict, station, worst (bool), wbgt, band, time, area, bossName, work, airDetail (string|null) } */
  function buildMessage(ctx, t) {
    const v = ctx.verdict, work = ctx.work === 'light' ? 'light' : 'heavy';
    const lines = [];
    lines.push(t('wa.hi', { name: nameBit(ctx.bossName), area: ctx.area ? t('wa.hi.area', { area: ctx.area }) : '' }));
    let rule, ask;
    if (v.level === 'unknown') {
      lines.push(t('wa.unknown', { last: ctx.time ? t('wa.unknown.last', { time: ctx.time }) : '' }));
      rule = t('wa.rule.unknown'); ask = t('wa.ask.unknown');
    } else {
      lines.push(t(ctx.worst ? 'wa.wbgt.worst' : 'wa.wbgt', { station: ctx.station, wbgt: Number(ctx.wbgt).toFixed(1), band: ctx.band, time: ctx.time }));
      if (v.heatBand === 'High') {
        rule = t(work === 'light' ? 'wa.rule.high.light' : 'wa.rule.high.heavy');
        ask = t(work === 'light' ? 'wa.ask.high.light' : 'wa.ask.high');
      } else if (v.heatBand === 'Moderate') {
        rule = t('wa.rule.mod') + (Math.round(ctx.wbgt * 10) >= 320 ? t(work === 'light' ? 'wa.rule.mod.rest.light' : 'wa.rule.mod.rest.heavy') : '');
        ask = t('wa.ask.mod');
      } else {
        rule = t('wa.rule.low'); ask = t('wa.ask.low');
      }
    }
    lines.push(t('wa.rule', { rule }));
    lines.push(t('wa.hotter', { ask }));
    if (v.airBad && ctx.airDetail) lines.push(t('wa.air', { detail: ctx.airDetail }));
    lines.push(t('wa.source'));
    lines.push(t('wa.sent'));
    return lines.join('\n');
  }

  /** buildSymptomMessage(ctx, t, labels): "Tell my supervisor". labels maps tick ids to English text. */
  function buildSymptomMessage(ctx, t, labels) {
    const tri = symptomTriage(ctx.ticked);
    if (tri.level === 'none') return '';
    const lines = [t('sx.msg.hi', { name: nameBit(ctx.bossName) })];
    const who = t('sx.msg.who');
    lines.push(tri.level === 'emergency' ? t('sx.msg.emergency', { who }) : t('sx.msg.act', { who }));
    lines.push(t('sx.msg.signs', { list: tri.a.concat(tri.b).map(k => labels[k] || k).join('; ') }));
    lines.push(t('sx.msg.time', { time: ctx.time }));
    lines.push(ctx.wbgt != null
      ? t('sx.msg.wbgt', { station: ctx.station, wbgt: Number(ctx.wbgt).toFixed(1), band: ctx.band })
      : t('sx.msg.wbgt.na'));
    lines.push(tri.level === 'emergency' ? t('sx.msg.cool') : t('sx.msg.rest'));
    lines.push(t('wa.sent'));
    return lines.join('\n');
  }

  const api = {
    WBGT_FRESH_MIN, AIR_FRESH_MIN, PM25_NAMES, PSI_NAMES, HEAT_BANDS, SX_A, SX_B,
    bandFromWbgt, uvBand, uvAdvice, breakMinutes, nextBreakDue, fmtDur, heatIndexC, bandMinutes, pm25Band, psiBand, restRequirement, verdict, symptomTriage,
    hydrationTarget, nextReminder, buildMessage, buildSymptomMessage,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else { root.SH = root.SH || {}; root.SH.rules = api; }
})(typeof globalThis !== 'undefined' ? globalThis : this);
