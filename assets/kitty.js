/* Mochi: a small cream-coloured cat who now and then walks in from the side of the page, sits up, waves and says hi, then trots off.
 * Plain JavaScript and inline SVG: no libraries, no network requests, no tracking.
 * It rides on the otter script's frame loop and follows the same on/off switch in the footer as the otter and the capybara (off by default for people who ask for reduced motion). */
(function () {
  'use strict';
  if (window.__kittyLoaded) return;
  window.__kittyLoaded = true;
  var api = window.__otterAPI;
  if (!api) return;

  var INK = '#7C8299', CREAM = '#FFF7EA', PATCH = '#B9C3D9', MINT = '#7FD1B3', PINK = '#F2A3B3';

  function leg(x, cls) {
    return '<g transform="translate(' + x + ' 62)"><g class="k-leg ' + cls + '"><rect x="-3.6" y="0" width="7.2" height="16" rx="3.6" fill="' + CREAM + '" stroke="' + INK + '" stroke-width="1.2"/></g></g>';
  }
  var SIDE =
    '<svg class="k-side" viewBox="0 0 110 90" xmlns="http://www.w3.org/2000/svg" focusable="false" aria-hidden="true">' +
    '<ellipse class="k-shadow" cx="55" cy="87" rx="34" ry="2.8"/>' +
    '<g class="k-tail-w"><path class="k-tail" d="M23 56 C8 54 6 36 14 26" fill="none" stroke="' + INK + '" stroke-width="9.4" stroke-linecap="round"/><path class="k-tail" d="M23 56 C8 54 6 36 14 26" fill="none" stroke="' + CREAM + '" stroke-width="7" stroke-linecap="round"/><circle cx="14" cy="26.4" r="3.5" fill="' + PATCH + '"/></g>' +
    '<g class="k-bodyw">' +
      leg(30, 'k-b2') + leg(70, 'k-a2') +
      '<ellipse cx="50" cy="54" rx="31" ry="18" fill="' + CREAM + '" stroke="' + INK + '" stroke-width="1.3"/>' +
      '<path d="M26 50 C32 42 44 40 52 41" fill="none" stroke="' + PATCH + '" stroke-width="5" stroke-linecap="round" opacity=".7"/>' +
      leg(40, 'k-b1') + leg(80, 'k-a1') +
      '<g class="k-headw">' +
        '<path d="M68 52 C74 56 90 56 94 50" fill="none" stroke="' + MINT + '" stroke-width="6" stroke-linecap="round"/>' +
        '<path d="M70 28 L70 7 L84 20 Z" fill="' + CREAM + '" stroke="' + INK + '" stroke-width="1.3" stroke-linejoin="round"/><path d="M71.5 24 L71.5 12 L80 20 Z" fill="' + PATCH + '"/>' +
        '<circle cx="84" cy="38" r="17" fill="' + CREAM + '" stroke="' + INK + '" stroke-width="1.3"/>' +
        '<path d="M88 22 L100 8 L101 29 Z" fill="' + CREAM + '" stroke="' + INK + '" stroke-width="1.3" stroke-linejoin="round"/><path d="M92 23 L99 13 L99.5 25 Z" fill="' + PATCH + '"/>' +
        '<circle cx="90" cy="36" r="2.3" fill="#2A2438"/><circle cx="90.8" cy="35.2" r=".8" fill="#fff"/>' +
        '<path d="M98.2 40.6 l3.2 -.2 l-1.2 2.4 z" fill="' + PINK + '"/>' +
        '<path d="M99.2 44 q-2.4 2.2 -4.8 .6" fill="none" stroke="' + INK + '" stroke-width="1" stroke-linecap="round"/>' +
        '<g stroke="' + INK + '" stroke-width=".8" stroke-linecap="round" opacity=".7"><path d="M96 44 L108 46"/><path d="M96 42.4 L109 41"/></g>' +
      '</g>' +
    '</g>' +
    '</svg>';

  var SIT =
    '<svg class="k-sit" viewBox="0 0 110 90" xmlns="http://www.w3.org/2000/svg" focusable="false" aria-hidden="true">' +
    '<ellipse class="k-shadow" cx="55" cy="87" rx="30" ry="2.8"/>' +
    '<path class="k-tail2" d="M76 78 C96 80 100 62 92 54" fill="none" stroke="' + INK + '" stroke-width="9.4" stroke-linecap="round"/><path d="M76 78 C96 80 100 62 92 54" fill="none" stroke="' + CREAM + '" stroke-width="7" stroke-linecap="round"/><circle cx="92" cy="54.4" r="3.5" fill="' + PATCH + '"/>' +
    '<ellipse cx="55" cy="67" rx="23" ry="21" fill="' + CREAM + '" stroke="' + INK + '" stroke-width="1.3"/>' +
    '<ellipse cx="44" cy="84" rx="8" ry="4.6" fill="' + CREAM + '" stroke="' + INK + '" stroke-width="1.2"/><ellipse cx="66" cy="84" rx="8" ry="4.6" fill="' + CREAM + '" stroke="' + INK + '" stroke-width="1.2"/>' +
    '<ellipse cx="38" cy="68" rx="6" ry="10" fill="' + CREAM + '" stroke="' + INK + '" stroke-width="1.2"/>' +
    '<path d="M38 54 C48 60 62 60 72 54" fill="none" stroke="' + MINT + '" stroke-width="6.4" stroke-linecap="round"/>' +
    '<g class="k-wave"><rect x="69" y="30" width="11" height="30" rx="5.5" fill="' + CREAM + '" stroke="' + INK + '" stroke-width="1.2"/><circle cx="74.5" cy="32" r="3" fill="' + PINK + '" opacity=".75"/></g>' +
    '<g class="k-headw2">' +
      '<path d="M36 26 L35 4 L52 16 Z" fill="' + CREAM + '" stroke="' + INK + '" stroke-width="1.3" stroke-linejoin="round"/><path d="M38 22 L37.4 10 L47 17 Z" fill="' + PATCH + '"/>' +
      '<path d="M74 26 L75 4 L58 16 Z" fill="' + CREAM + '" stroke="' + INK + '" stroke-width="1.3" stroke-linejoin="round"/><path d="M72 22 L72.6 10 L63 17 Z" fill="' + PATCH + '"/>' +
      '<ellipse cx="55" cy="34" rx="22" ry="19.5" fill="' + CREAM + '" stroke="' + INK + '" stroke-width="1.3"/>' +
      '<g class="k-eyes"><circle cx="45.5" cy="33" r="2.4" fill="#2A2438"/><circle cx="46.3" cy="32.2" r=".85" fill="#fff"/><circle cx="64.5" cy="33" r="2.4" fill="#2A2438"/><circle cx="65.3" cy="32.2" r=".85" fill="#fff"/></g>' +
      '<ellipse cx="39" cy="40" rx="3.4" ry="2" fill="' + PINK + '" opacity=".5"/><ellipse cx="71" cy="40" rx="3.4" ry="2" fill="' + PINK + '" opacity=".5"/>' +
      '<path d="M52.6 38.4 l4.8 0 l-2.4 2.8 z" fill="' + PINK + '"/>' +
      '<path d="M55 41.2 v1.8 M55 43 q-3 3 -6 .6 M55 43 q3 3 6 .6" fill="none" stroke="' + INK + '" stroke-width="1" stroke-linecap="round"/>' +
      '<g stroke="' + INK + '" stroke-width=".8" stroke-linecap="round" opacity=".7"><path d="M33 38 L22 36"/><path d="M33 41 L21 42.5"/><path d="M77 38 L88 36"/><path d="M77 41 L89 42.5"/></g>' +
    '</g>' +
    '</svg>';

  var CSS =
    '.kit{position:fixed;left:0;bottom:14px;z-index:16;width:var(--kw,120px);pointer-events:none;will-change:transform;contain:layout}' +
    'body.has-jazz .kit,body.has-music .kit{bottom:62px!important}' +
    '.kit .k-hit{pointer-events:auto;cursor:pointer;display:block;-webkit-tap-highlight-color:transparent}' +
    '.kit .k-dir{display:block;transform:scaleX(var(--dir,1));transform-origin:50% 100%}' +
    '.kit svg{display:block;width:100%;height:auto;overflow:visible}' +
    '.kit .k-shadow{fill:rgba(11,19,36,.16)}' +
    '.kit[data-pose=side] .k-sit,.kit[data-pose=sit] .k-side{display:none}' +
    '.kit .k-leg{transform-box:fill-box;transform-origin:50% 0}' +
    '.kit .k-bodyw{transform-box:fill-box;transform-origin:50% 100%}' +
    '.kit .k-tail-w,.kit .k-wave,.kit .k-headw2,.kit .k-tail2{transform-box:fill-box}' +
    '.kit .k-tail-w{transform-origin:90% 100%;animation:k-tail 2.4s ease-in-out infinite}' +
    '.kit .k-tail2{transform-origin:10% 50%;animation:k-tail2 2.2s ease-in-out infinite}' +
    '.kit .k-wave{transform-origin:50% 100%}' +
    '.kit[data-wave=on] .k-wave{animation:k-wave .55s ease-in-out infinite}' +
    '.kit .k-headw2{transform-origin:50% 100%;animation:k-head 3.2s ease-in-out infinite}' +
    '.kit .k-eyes{transform-box:fill-box;transform-origin:50% 50%;animation:k-blink 4.6s infinite}' +
    '.kit[data-gait=walk] .k-a1,.kit[data-gait=walk] .k-a2{animation:k-legA .62s ease-in-out infinite}' +
    '.kit[data-gait=walk] .k-b1,.kit[data-gait=walk] .k-b2{animation:k-legB .62s ease-in-out infinite}' +
    '.kit[data-gait=walk] .k-bodyw{animation:k-bob .62s ease-in-out infinite}' +
    '.kit[data-gait=trot] .k-a1,.kit[data-gait=trot] .k-a2{animation:k-legA .36s ease-in-out infinite}' +
    '.kit[data-gait=trot] .k-b1,.kit[data-gait=trot] .k-b2{animation:k-legB .36s ease-in-out infinite}' +
    '.kit[data-gait=trot] .k-bodyw{animation:k-bob .36s ease-in-out infinite}' +
    '.kit .k-hop{display:block;transform-origin:50% 100%}' +
    '.kit.hop .k-hop{animation:k-hop .55s cubic-bezier(.3,.7,.4,1)}' +
    '.kit .k-say{position:absolute;left:58%;bottom:100%;transform:translate(-50%,2px);white-space:nowrap;font:500 12px/1 "IBM Plex Mono",ui-monospace,monospace;' +
      'padding:5px 9px;border-radius:999px;background:#fff;color:#0B1324;border:1px solid #D6DEE9;opacity:0;pointer-events:none;transition:opacity .15s}' +
    '.kit.say .k-say{opacity:1}' +
    '@keyframes k-legA{0%,100%{transform:rotate(-26deg)}50%{transform:rotate(26deg)}}' +
    '@keyframes k-legB{0%,100%{transform:rotate(26deg)}50%{transform:rotate(-26deg)}}' +
    '@keyframes k-bob{0%,50%,100%{transform:translateY(0)}25%,75%{transform:translateY(-1.8px)}}' +
    '@keyframes k-tail{0%,100%{transform:rotate(-7deg)}50%{transform:rotate(9deg)}}' +
    '@keyframes k-tail2{0%,100%{transform:rotate(-5deg)}50%{transform:rotate(7deg)}}' +
    '@keyframes k-wave{0%,100%{transform:rotate(-14deg)}50%{transform:rotate(24deg)}}' +
    '@keyframes k-head{0%,100%{transform:rotate(0)}40%{transform:rotate(2.2deg)}70%{transform:rotate(-1.6deg)}}' +
    '@keyframes k-blink{0%,93%,100%{transform:scaleY(1)}96%{transform:scaleY(.12)}}' +
    '@keyframes k-hop{0%{transform:translateY(0)}45%{transform:translateY(-20px)}100%{transform:translateY(0)}}' +
    '@media print{.kit{display:none!important}}';
  var style = document.createElement('style'); style.textContent = CSS; document.head.appendChild(style);

  var el = document.createElement('div');
  el.className = 'kit'; el.setAttribute('aria-hidden', 'true'); el.dataset.pose = 'side'; el.dataset.gait = 'walk'; el.dataset.wave = 'off';
  el.innerHTML = '<span class="k-say">hi!</span><span class="k-hit"><span class="k-dir"><span class="k-hop">' + SIDE + SIT + '</span></span></span>';
  var say = el.querySelector('.k-say'), hit = el.querySelector('.k-hit');

  // ks: position, direction (1 faces right), phase: away | in | hi | out
  var ks = { x: 0, dir: 1, lift: 0, phase: 'away', stopX: 0, t0: 0 }, KW = 120, running = false, nextVisit = 0, hasVisited = false;
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function measure() { KW = window.innerWidth < 640 ? 96 : 120; el.style.setProperty('--kw', KW + 'px'); }
  function render() { el.style.transform = 'translate3d(' + ks.x.toFixed(1) + 'px,' + (-ks.lift).toFixed(1) + 'px,0)'; el.style.setProperty('--dir', ks.dir); }
  function setPose(p, gait) { el.dataset.pose = p; if (gait) el.dataset.gait = gait; }
  function speak(text, ms) { say.textContent = text; el.classList.add('say'); setTimeout(function () { el.classList.remove('say'); }, ms || 1300); }
  function hop() { if (el.classList.contains('hop')) return; el.classList.add('hop'); setTimeout(function () { el.classList.remove('hop'); }, 600); }

  function visit(ts) {
    measure();
    var w = window.innerWidth, fromLeft = Math.random() < 0.5;
    ks.dir = fromLeft ? 1 : -1;
    ks.x = fromLeft ? -KW - 10 : w + 10;
    ks.stopX = clamp(w * (0.28 + Math.random() * 0.44) - KW / 2, 8, Math.max(8, w - KW - 8));
    ks.phase = 'in'; ks.lift = 0; setPose('side', 'walk'); el.dataset.wave = 'off'; el.classList.remove('say');
    if (!el.parentNode) document.body.appendChild(el);
    render(); hasVisited = true;
  }
  function leave(ts) {
    running && (nextVisit = ts + 70000 + Math.random() * 70000);
    ks.phase = 'away'; ks.lift = 0; el.dataset.wave = 'off';
    if (el.parentNode) el.parentNode.removeChild(el);
  }
  // ---------------------------------------------------------------- playing with the others
  var ot = api.st, pl = null;
  function ease(t) { t = clamp(t, 0, 1); return 1 - (1 - t) * (1 - t); }
  function stepToward(obj, target, speed, dt) { var d = target - obj.x; if (Math.abs(d) <= speed * dt) { obj.x = target; return true; } obj.x += (d > 0 ? 1 : -1) * speed * dt; return false; }
  function goOut() {
    ks.phase = 'out'; pl = null; ks.lift = 0; el.dataset.wave = 'off'; setPose('side', 'trot');
    ks.dir = ks.x + KW / 2 < window.innerWidth / 2 ? -1 : 1;        // trot off by the nearer edge
  }
  function startPlay(ts) {
    if (!api.isOn() || ot.hold) { goOut(); return; }       // the otter is away or busy: just say hi and go
    var b = api.bounds();
    ks.phase = 'play'; el.dataset.wave = 'off'; setPose('side', 'trot');
    pl = { kind: 'tag', step: 0, t0: ts, ts0: ts };
    ot.hold = true; pl.dir = ot.x < window.innerWidth / 2 ? 1 : -1;
    pl.far = clamp(ot.x + pl.dir * (340 + Math.random() * 260), b[0], b[1]);
    if (Math.abs(pl.far - ot.x) < 200) { pl.dir = -pl.dir; pl.far = clamp(ot.x + pl.dir * (340 + Math.random() * 260), b[0], b[1]); }
    ks.dir = ot.x > ks.x ? 1 : -1; speak('tag!', 900);
  }
  function endPlay(ts) {
    if (pl) { ot.hold = false; api.setMode('idle'); ot.until = ts + 700; }
    goOut();
  }
  function playTick(dt, ts) {
    if (ts - pl.ts0 > 24000) { endPlay(ts); return; }          // never get stuck
    var t = ts - pl.t0, w = window.innerWidth;
    if (pl.kind === 'tag') {
      var oc = ot.x + api.width() / 2, kc = ks.x + KW / 2;
      if (pl.step === 0 && t > 450) { pl.step = 1; api.setMode(Math.random() < 0.35 ? 'slide' : 'run'); ot.dir = pl.far > ot.x ? 1 : -1; }
      else if (pl.step === 1) {                       // the otter bolts, the cat gives chase
        ot.dir = pl.far > ot.x ? 1 : -1;
        var there = stepToward(ot, pl.far, ot.mode === 'slide' ? 320 : 250, dt);
        ks.dir = oc > kc ? 1 : -1; if (Math.abs(oc - kc) > KW * 0.75 + api.width() * 0.3) ks.x += ks.dir * 215 * dt;
        if (there) { api.setMode('idle'); pl.step = 2; }
      } else if (pl.step === 2) {                     // the cat catches up, a happy bump
        ks.dir = oc > kc ? 1 : -1;
        if (Math.abs(oc - kc) > KW * 0.75 + api.width() * 0.3) ks.x += ks.dir * 215 * dt;
        else { setPose('sit'); el.dataset.wave = 'on'; ot.dir = -ks.dir; api.flip(); hop(); speak('got you!', 1100); pl.step = 3; pl.t3 = ts; }
      } else if (pl.step === 3 && ts - pl.t3 > 1500) endPlay(ts);
      ks.x = clamp(ks.x, -KW, w);
    }
  }

  function tick(dt, ts) {
    if (!running) return;
    if (ks.phase === 'away') { if (ts > nextVisit) visit(ts); return; }
    var w = window.innerWidth;
    if (ks.phase === 'in') {
      ks.x += ks.dir * 95 * dt;
      if ((ks.dir > 0 && ks.x >= ks.stopX) || (ks.dir < 0 && ks.x <= ks.stopX)) {
        ks.x = ks.stopX; ks.phase = 'hi'; ks.t0 = ts; ks.said = false; setPose('sit'); el.dataset.wave = 'on';
      }
    } else if (ks.phase === 'hi') {
      var t = ts - ks.t0;
      if (!ks.said && t > 350) { ks.said = true; speak('hi!', 1500); hop(); }
      if (t > 2800) startPlay(ts);
    } else if (ks.phase === 'play') {
      playTick(dt, ts);
    } else if (ks.phase === 'out') {
      ks.x += ks.dir * 150 * dt;
      if (ks.x > w + 20 || ks.x < -KW - 20) leave(ts);
    }
    render();
  }
  function start() {
    if (running) return;
    running = true; measure(); ks.phase = 'away'; nextVisit = performance.now() + 9000;
  }
  function stop() {
    if (pl) { ot.hold = false; api.setMode('idle'); pl = null; }
    ks.lift = 0;
    running = false; ks.phase = 'away';
    if (el.parentNode) el.parentNode.removeChild(el);
  }
  api.on('tick', tick); api.on('start', start); api.on('stop', stop);
  if (api.isOn()) start();

  hit.addEventListener('click', function () { speak('mew!', 1000); hop(); });
  window.addEventListener('resize', measure);

  // Preview helper, only with ?otterdebug in the address.
  if (/[?&]otterdebug/.test(location.search)) {
    window.__kitty = {
      visit: function (kind) { window.__kittyForce = kind || null; this.visit0(); },
      visit0: function () { nextVisit = Infinity; if (el.parentNode) el.parentNode.removeChild(el); visit(performance.now()); },
      pose: function (p, x, dir) { nextVisit = Infinity; ks.phase = 'frozen'; measure(); if (!el.parentNode) document.body.appendChild(el); setPose(p, 'walk'); el.dataset.wave = p === 'sit' ? 'on' : 'off'; ks.x = x == null ? 400 : x; ks.dir = dir || 1; render(); },
      state: function () { return { play: pl ? pl.kind + ':' + pl.step : '', lift: ks.lift, phase: ks.phase, x: ks.x, stopX: ks.stopX, dir: ks.dir, visited: hasVisited }; }
    };
  }
})();
