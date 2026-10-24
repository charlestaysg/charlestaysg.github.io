/* A capybara that wanders along the bottom of the page and plays with the otter (nuzzle, tag, and rides).
 * Plain JavaScript and one inline SVG: no libraries, no network requests, no tracking.
 * It follows the otter's on/off switch in the footer (so it is off for people who ask for reduced motion). */
(function () {
  'use strict';
  if (window.__capyLoaded) return;
  window.__capyLoaded = true;
  var api = window.__otterAPI;
  if (!api) return;                              // the otter script is not here: nothing to play with

  // ---------------------------------------------------------------- the drawing (faces right)
  function leg(x, y, cls, fill, hoof) {
    return '<g transform="translate(' + x + ' ' + y + ')"><g class="c-leg ' + cls + '"><rect x="-4.6" y="0" width="9.2" height="19" rx="4.4" fill="' + fill + '"/><ellipse cx="0.6" cy="19.2" rx="6" ry="2.7" fill="' + hoof + '"/></g></g>';
  }
  var SVG =
    '<svg viewBox="0 0 170 80" xmlns="http://www.w3.org/2000/svg" focusable="false" aria-hidden="true">' +
    '<ellipse class="c-shadow" cx="86" cy="77.2" rx="64" ry="3"/>' +
    '<g class="c-body">' +
      leg(50, 52, 'c-b2', '#7A5535', '#4C3422') + leg(113, 52, 'c-a2', '#7A5535', '#4C3422') +
      '<path d="M24 47 C24 33 46 27 76 27 C101 27 117 30 126 38 L128 58 C117 65 92 67 62 66 C38 65 24 59 24 47 Z" fill="#A67C52"/>' +
      '<path d="M28 43 C30 33 50 29.5 76 29.5 C99 29.5 114 32.5 122 38 C106 35.5 84 34.5 62 35.5 C46 36.5 35 39 28 43 Z" fill="#8E6540" opacity=".75"/>' +
      '<path d="M38 58 C58 65 94 65.5 122 58.5 L126 59 C114 66 92 68 62 67 C48 66 41 63 38 58 Z" fill="#C7A27A"/>' +
      leg(60, 52, 'c-b1', '#8E6540', '#5A3E28') + leg(122, 52, 'c-a1', '#8E6540', '#5A3E28') +
      '<g class="c-head">' +
        '<path d="M118 29 C124 22.5 146 22.5 158 30 C164 34 165 44 163 52 C161 58.5 151 62 140 62 C127 62 119 58 117 50 Z" fill="#A67C52"/>' +
        '<path d="M126 24.5 C134 21 148 22 157 29 C150 27.5 138 27 126 30 Z" fill="#8E6540" opacity=".75"/>' +
        '<path d="M148 32 C158 31 166 36 166.5 43 C167 50 161 54 153 53.5 C149 49 148 38 148 32 Z" fill="#6A4A31"/>' +
        '<ellipse cx="162.2" cy="39.2" rx="1.9" ry="2.8" fill="#2A1B12"/>' +
        '<circle cx="139" cy="38.5" r="2.3" fill="#2A1B12"/><circle cx="139.7" cy="37.7" r=".75" fill="#fff"/>' +
        '<path d="M148 56.6 q7 3.4 14.5 -.2" fill="none" stroke="#2A1B12" stroke-width=".9" stroke-linecap="round"/>' +
        '<g stroke="#2A1B12" stroke-width=".55" opacity=".5" stroke-linecap="round" fill="none"><path d="M154 45 L168 43"/><path d="M154 47.5 L168.5 48"/></g>' +
        '<g class="c-ear"><ellipse cx="127.5" cy="28" rx="4.4" ry="5.4" fill="#7C5636"/><ellipse cx="127.8" cy="28.6" rx="2.2" ry="3.1" fill="#C48E6A"/></g>' +
      '</g>' +
    '</g>' +
    '</svg>';

  // ---------------------------------------------------------------- styles
  var CSS =
    '.capy{position:fixed;left:0;bottom:14px;z-index:14;width:var(--cw,188px);pointer-events:none;will-change:transform;contain:layout}' +
    'body.has-jazz .capy{bottom:62px!important}' +
    '.capy .c-hit{pointer-events:auto;cursor:pointer;display:block;-webkit-tap-highlight-color:transparent}' +
    '.capy .c-dir{display:block;transform:scaleX(var(--dir,1));transform-origin:50% 100%}' +
    '.capy svg{display:block;width:100%;height:auto;overflow:visible}' +
    '.capy .c-shadow{fill:rgba(11,19,36,.16)}' +
    '.capy .c-leg,.capy .c-head,.capy .c-body,.capy .c-ear{transform-box:fill-box}' +
    '.capy .c-leg{transform-origin:50% 0}' +
    '.capy .c-head{transform-origin:10% 85%}' +
    '.capy .c-body{transform-origin:50% 100%}' +
    '.capy .c-ear{transform-origin:50% 90%}' +
    '.capy .c-ear{animation:c-ear 6s ease-in-out infinite}' +
    /* stand: breathe, slow nod */
    '.capy[data-mode=idle] .c-body{animation:c-breathe 3.4s ease-in-out infinite}' +
    '.capy[data-mode=idle] .c-head{animation:c-nod 4.6s ease-in-out infinite}' +
    /* walk and trot */
    '.capy[data-mode=walk] .c-a1,.capy[data-mode=walk] .c-a2{animation:c-legA .8s ease-in-out infinite}' +
    '.capy[data-mode=walk] .c-b1,.capy[data-mode=walk] .c-b2{animation:c-legB .8s ease-in-out infinite}' +
    '.capy[data-mode=walk] .c-body{animation:c-bob .8s ease-in-out infinite}' +
    '.capy[data-mode=trot] .c-a1,.capy[data-mode=trot] .c-a2{animation:c-legA .42s ease-in-out infinite}' +
    '.capy[data-mode=trot] .c-b1,.capy[data-mode=trot] .c-b2{animation:c-legB .42s ease-in-out infinite}' +
    '.capy[data-mode=trot] .c-body{animation:c-bob .42s ease-in-out infinite}' +
    '.capy[data-mode=trot] .c-head{animation:c-nodFast .42s ease-in-out infinite}' +
    /* loaf: legs tucked in, resting */
    '.capy[data-mode=loaf] .c-leg{opacity:0}' +
    '.capy[data-mode=loaf] .c-body{transform:translateY(11px) scaleY(.94)}' +
    '.capy[data-mode=loaf] .c-head{transform:translateY(5px) rotate(3deg);animation:none}' +
    /* happy hop and speech */
    '.capy .c-hop{display:block;transform-origin:50% 100%}' +
    '.capy.hop .c-hop{animation:c-hop .6s cubic-bezier(.3,.7,.4,1)}' +
    '.capy .c-say{position:absolute;left:55%;bottom:100%;transform:translate(-50%,2px);white-space:nowrap;font:500 12px/1 "IBM Plex Mono",ui-monospace,monospace;' +
      'padding:5px 9px;border-radius:999px;background:#fff;color:#0B1324;border:1px solid #D6DEE9;opacity:0;pointer-events:none;transition:opacity .15s}' +
    '.capy.say .c-say{opacity:1}' +
    '@keyframes c-legA{0%,100%{transform:rotate(-24deg)}50%{transform:rotate(24deg)}}' +
    '@keyframes c-legB{0%,100%{transform:rotate(24deg)}50%{transform:rotate(-24deg)}}' +
    '@keyframes c-bob{0%,50%,100%{transform:translateY(0)}25%,75%{transform:translateY(-2px)}}' +
    '@keyframes c-breathe{0%,100%{transform:scaleY(1)}50%{transform:scaleY(1.02)}}' +
    '@keyframes c-nod{0%,100%{transform:rotate(0)}40%{transform:rotate(2.5deg)}70%{transform:rotate(-1.5deg)}}' +
    '@keyframes c-nodFast{0%,100%{transform:rotate(-2deg)}50%{transform:rotate(3deg)}}' +
    '@keyframes c-ear{0%,88%,100%{transform:rotate(0)}91%{transform:rotate(-16deg)}94%{transform:rotate(5deg)}97%{transform:rotate(-6deg)}}' +
    '@keyframes c-hop{0%{transform:translateY(0) scale(1,1)}20%{transform:translateY(0) scale(1.05,.92)}55%{transform:translateY(-26px) scale(.97,1.04)}100%{transform:translateY(0) scale(1,1)}}' +
    '@media print{.capy{display:none!important}}';
  var style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  var el = document.createElement('div');
  el.className = 'capy';
  el.setAttribute('aria-hidden', 'true');
  el.dataset.mode = 'idle';
  el.innerHTML = '<span class="c-say">wheek!</span><span class="c-hit"><span class="c-dir"><span class="c-hop">' + SVG + '</span></span></span>';
  var hit = el.querySelector('.c-hit');

  // ---------------------------------------------------------------- one animal's state, and helpers
  var cs = { x: 0, dir: -1, mode: 'idle', target: 0, until: 0, speed: 0, hold: false }, CW = 188, running = false;
  var ot = api.st;                                   // the otter's state, shared with otter.js
  function bounds() { return [8, Math.max(8, window.innerWidth - CW - 8)]; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function ease(t) { t = clamp(t, 0, 1); return 1 - (1 - t) * (1 - t); }
  function measure() { CW = window.innerWidth < 640 ? 138 : 188; el.style.setProperty('--cw', CW + 'px'); }
  function setMode(m) { cs.mode = m; el.dataset.mode = m; }
  function render() { el.style.transform = 'translate3d(' + cs.x.toFixed(1) + 'px,0,0)'; el.style.setProperty('--dir', cs.dir); }
  function say(ms) { el.classList.add('say'); setTimeout(function () { el.classList.remove('say'); }, ms || 1200); }
  function hop() { if (el.classList.contains('hop')) return; el.classList.add('hop'); setTimeout(function () { el.classList.remove('hop'); }, 640); }
  function capyCentre() { return cs.x + CW / 2; }
  function otterCentre() { return ot.x + api.width() / 2; }
  function liftHeight() { return CW * 0.255; }       // how high the capybara's back is, for the otter to stand on

  // ---------------------------------------------------------------- the capybara on its own: wander, stand, loaf
  function pickOwn(ts) {
    var b = bounds(), r = Math.random();
    if (r < 0.2) { setMode('loaf'); cs.until = ts + 4500 + Math.random() * 5500; cs.speed = 0; return; }
    if (r < 0.8) {
      var t = b[0] + Math.random() * (b[1] - b[0]);
      if (Math.abs(t - cs.x) < 120) t = clamp(cs.x + (Math.random() < 0.5 ? -1 : 1) * (160 + Math.random() * 240), b[0], b[1]);
      cs.target = t; cs.dir = t > cs.x ? 1 : -1; cs.speed = 46 + Math.random() * 26; setMode('walk'); return;
    }
    setMode('idle'); cs.until = ts + 1800 + Math.random() * 3600; cs.speed = 0;
  }
  function moveOwn(dt, ts) {
    if (cs.mode === 'walk' || cs.mode === 'trot') {
      cs.x += cs.speed * dt * cs.dir;
      if ((cs.dir > 0 && cs.x >= cs.target) || (cs.dir < 0 && cs.x <= cs.target)) { cs.x = cs.target; setMode('idle'); cs.until = ts + 1200 + Math.random() * 3000; }
    } else if (ts > cs.until) pickOwn(ts);
  }

  // ---------------------------------------------------------------- playing with the otter
  var sc = null, nextScene = 0;
  function stepToward(obj, target, speed, dt) {      // move obj.x toward target; true when there
    var d = target - obj.x;
    if (Math.abs(d) <= speed * dt) { obj.x = target; return true; }
    obj.x += Math.sign(d) * speed * dt; return false;
  }
  function meetSpot(side) { return capyCentre() + side * (CW * 0.5 + api.width() * 0.3) - api.width() / 2; }
  function endScene(ts) {
    sc = null; ot.hold = false; ot.lift = 0; api.setMode('idle'); ot.until = ts + 700;
    cs.hold = false; setMode('idle'); cs.until = ts + 500; nextScene = ts + 15000 + Math.random() * 17000;
  }
  function beginScene(ts) {
    var kinds = ['nuzzle', 'tag', 'ride'], b = api.bounds();
    var kind = kinds[Math.floor(Math.random() * kinds.length)];
    // the otter comes in from whichever side it is nearest to, as long as the meeting spot is on screen
    var side = otterCentre() < capyCentre() ? -1 : 1;
    if (meetSpot(side) < b[0] || meetSpot(side) > b[1]) side = -side;
    if (meetSpot(side) < b[0] || meetSpot(side) > b[1]) { nextScene = ts + 2500; return; }
    sc = { kind: kind, side: side, phase: 'approach', t0: ts };
    ot.hold = true; cs.hold = true; setMode('idle'); cs.dir = side;
    api.setMode('run'); ot.dir = meetSpot(side) > ot.x ? 1 : -1; ot.speed = 240;
  }
  function sceneTick(dt, ts) {
    var w = api.width(), s = sc, b = api.bounds();
    if (ts - s.t0 > 26000) { endScene(ts); return; } // never get stuck
    if (s.phase === 'approach') {
      ot.dir = meetSpot(s.side) > ot.x ? 1 : -1;
      if (stepToward(ot, meetSpot(s.side), 240, dt)) { api.setMode('idle'); ot.dir = -s.side; cs.dir = s.side; s.phase = s.kind; s.t0p = ts; s.step = 0; }
      return;
    }
    var t = ts - s.t0p;
    if (s.phase === 'nuzzle') {
      if (s.step === 0 && t > 250) { s.step = 1; api.flip(); }
      if (s.step === 1 && t > 600) { s.step = 2; say(1100); hop(); }
      if (t > 2100) endScene(ts);
    } else if (s.phase === 'tag') {
      if (s.step === 0) {                            // the capybara squeaks, the otter bolts
        if (t > 250) {
          s.step = 1; say(900);
          var dirAway = s.side;                      // away from the capybara, along the side it stands on
          var far = clamp(ot.x + dirAway * (340 + Math.random() * 260), b[0], b[1]);
          if (Math.abs(far - ot.x) < 200) { dirAway = -dirAway; far = clamp(ot.x + dirAway * (340 + Math.random() * 260), b[0], b[1]); }
          s.far = far; ot.dir = far > ot.x ? 1 : -1; api.setMode(Math.random() < 0.35 ? 'slide' : 'run');
        }
      } else if (s.step === 1) {                     // otter runs, capybara trots after it
        ot.dir = s.far > ot.x ? 1 : -1;
        var oArrived = stepToward(ot, s.far, ot.mode === 'slide' ? 330 : 255, dt);
        var gap = otterCentre() - capyCentre();
        if (Math.abs(gap) > CW * 0.5 + w * 0.35) { cs.dir = gap > 0 ? 1 : -1; setMode('trot'); cs.x = clamp(cs.x + cs.dir * 200 * dt, bounds()[0], bounds()[1]); }
        else setMode('idle');
        if (oArrived) { api.setMode('idle'); s.step = 2; }
      } else if (s.step === 2) {                     // wait for the capybara to catch up, then a happy bump
        var g2 = otterCentre() - capyCentre();
        if (Math.abs(g2) > CW * 0.5 + w * 0.35) { cs.dir = g2 > 0 ? 1 : -1; setMode('trot'); cs.x = clamp(cs.x + cs.dir * 200 * dt, bounds()[0], bounds()[1]); ot.dir = -cs.dir; }
        else { setMode('idle'); cs.dir = g2 > 0 ? 1 : -1; ot.dir = -cs.dir; s.step = 3; s.t3 = ts; api.flip(); }
      } else if (s.step === 3) {
        if (ts - s.t3 > 450 && !s.said) { s.said = true; say(1000); hop(); }
        if (ts - s.t3 > 1700) endScene(ts);
      }
    } else if (s.phase === 'ride') {
      if (s.step === 0 && t > 300) { s.step = 1; s.t1 = ts; api.setMode('idle'); }
      if (s.step === 1) {                            // hop up onto the back
        var u = (ts - s.t1) / 520, L = liftHeight(), ridePos = capyCentre() - w / 2 - cs.dir * CW * 0.03;
        ot.lift = L * ease(u) + 22 * Math.sin(Math.PI * clamp(u, 0, 1));
        ot.x += (ridePos - ot.x) * clamp(u * 0.9, 0, 1) * 0.5;
        ot.dir = cs.dir;
        if (u >= 1) {
          s.step = 2; s.t2 = ts; ot.lift = L; ot.x = ridePos; say(900);
          var dirw = Math.random() < 0.5 ? -1 : 1, tgt = clamp(cs.x + dirw * (300 + Math.random() * 300), bounds()[0], bounds()[1]);
          if (Math.abs(tgt - cs.x) < 200) { dirw = -dirw; tgt = clamp(cs.x + dirw * (300 + Math.random() * 300), bounds()[0], bounds()[1]); }
          cs.target = tgt; cs.dir = tgt > cs.x ? 1 : -1; cs.speed = 64; setMode('walk');
        }
      } else if (s.step === 2) {                     // a slow ride, the otter on top
        cs.x += cs.speed * dt * cs.dir;
        var done = (cs.dir > 0 && cs.x >= cs.target) || (cs.dir < 0 && cs.x <= cs.target);
        if (done) { cs.x = cs.target; setMode('idle'); s.step = 3; s.t3 = ts; api.flip(); }
        ot.dir = cs.dir; ot.x = capyCentre() - w / 2 - cs.dir * CW * 0.03; ot.lift = liftHeight() + Math.sin(ts / 190) * 1.4;
        if (!s.chirped && ts - s.t2 > 1800) { s.chirped = true; api.flip(); }
      } else if (s.step === 3) {                     // hop down in front of the capybara
        var d = (ts - s.t3) / 520, L2 = liftHeight();
        ot.lift = L2 * (1 - ease(d)) + 18 * Math.sin(Math.PI * clamp(d, 0, 1));
        ot.x = clamp(ot.x + cs.dir * 60 * dt, api.bounds()[0], api.bounds()[1]);
        if (d >= 1) { ot.lift = 0; hop(); say(900); s.step = 4; s.t4 = ts; }
      } else if (s.step === 4 && ts - s.t4 > 900) endScene(ts);
    }
  }

  // ---------------------------------------------------------------- the loop (rides on the otter's frame loop)
  function tick(dt, ts) {
    if (!running) return;
    if (sc) sceneTick(dt, ts);
    else {
      if (!cs.hold) moveOwn(dt, ts);
      if (ts > nextScene && ot.mode !== 'slide' && !ot.hold) beginScene(ts);
    }
    var b = bounds(); cs.x = clamp(cs.x, b[0], b[1]);
    render();
  }
  function start() {
    if (running) return;
    running = true; measure();
    if (!el.parentNode) document.body.appendChild(el);
    var b = bounds(); cs.x = b[0] + Math.random() * (b[1] - b[0]); cs.dir = Math.random() < 0.5 ? 1 : -1; cs.hold = false;
    setMode('idle'); cs.until = performance.now() + 1500; sc = null; nextScene = performance.now() + 7000; render();
  }
  function stop() {
    running = false; sc = null; ot.hold = false; ot.lift = 0;
    if (el.parentNode) el.parentNode.removeChild(el);
  }
  api.on('tick', tick); api.on('start', start); api.on('stop', stop);
  if (api.isOn()) start();

  hit.addEventListener('click', function () { say(1100); hop(); });
  window.addEventListener('resize', measure);

  // Preview helper, only with ?otterdebug in the address: freeze a pose, or start a game now.
  if (/[?&]otterdebug/.test(location.search)) {
    window.__capy = {
      pose: function (mode, x, dir) { setMode(mode); cs.x = x == null ? 500 : x; cs.dir = dir || 1; cs.hold = true; render(); },
      scene: function (kind) { nextScene = Infinity; ot.hold = false; sc = null; var k = ['nuzzle', 'tag', 'ride']; var save = Math.random; Math.random = function () { return k.indexOf(kind) / 3 + 0.01; }; beginScene(performance.now()); Math.random = save; },
      state: function () { return { capy: cs, sc: sc && { kind: sc.kind, phase: sc.phase, step: sc.step }, otterLift: ot.lift, otterHold: ot.hold }; }
    };
  }
})();
