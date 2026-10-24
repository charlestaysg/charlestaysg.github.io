/* A small otter that wanders along the bottom of the page.
 * Plain JavaScript and one inline SVG: no libraries, no network requests, no tracking.
 * It stays off for people who ask for reduced motion (they can switch it on); the footer button turns it off or on,
 * and the choice is remembered in this browser only (localStorage, not a cookie). */
(function () {
  'use strict';
  if (window.__otterLoaded) return;
  window.__otterLoaded = true;

  var KEY = 'otter-pref';                       // 'on' or 'off'; missing = no choice yet
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function read() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function write(v) { try { localStorage.setItem(KEY, v); } catch (e) { /* private window: fine */ } }
  var pref = read();
  var on = pref === 'on' ? true : pref === 'off' ? false : !reduce;

  // ---------------------------------------------------------------- the drawing (faces right)
  var SVG =
    '<svg viewBox="0 0 140 64" xmlns="http://www.w3.org/2000/svg" focusable="false" aria-hidden="true">' +
    '<ellipse class="o-shadow" cx="68" cy="61.5" rx="38" ry="2.4"/>' +
    '<g class="o-bob">' +
      '<g class="o-tail"><path d="M40 31 C28 31 14 37 2 43.5 C14 46 28 45.5 40 42.5 Z" fill="#7A4F33"/></g>' +
      '<g transform="translate(52 41)"><g class="o-leg o-b2"><rect x="-3.2" y="0" width="6.4" height="15" rx="3.2" fill="#6A432C"/><ellipse cx="1" cy="15.4" rx="5.2" ry="2.6" fill="#5A3823"/></g></g>' +
      '<g transform="translate(88 41)"><g class="o-leg o-a2"><rect x="-3.2" y="0" width="6.4" height="15" rx="3.2" fill="#6A432C"/><ellipse cx="1" cy="15.4" rx="5.2" ry="2.6" fill="#5A3823"/></g></g>' +
      '<path d="M32 36 C32 27.5 50 24.5 68 24.5 C82 24.5 92 26.5 98 32 L98 44 C89 48.5 70 49 54 47.5 C40 46.2 32 42.5 32 36 Z" fill="#8B5E3C"/>' +
      '<path d="M41 44.6 C55 48 78 48.6 97 43 L98 44.4 C89 48.8 70 49.2 54 47.7 C47 47 43 46 41 44.6 Z" fill="#E8D5B5"/>' +
      '<g transform="translate(58 42)"><g class="o-leg o-b1"><rect x="-3.4" y="0" width="6.8" height="14.5" rx="3.4" fill="#8B5E3C"/><ellipse cx="1" cy="14.9" rx="5.4" ry="2.7" fill="#7A4F33"/></g></g>' +
      '<g transform="translate(94 42)"><g class="o-leg o-a1"><rect x="-3.4" y="0" width="6.8" height="14.5" rx="3.4" fill="#8B5E3C"/><ellipse cx="1" cy="14.9" rx="5.4" ry="2.7" fill="#7A4F33"/></g></g>' +
      '<g class="o-head">' +
        '<path d="M91 25 C95 19.5 108 19.5 117 25.5 C121.5 28.5 122 33 118.5 36.5 C114 40.5 103 42.2 95.5 40 C89.5 38 87 30.5 91 25 Z" fill="#8B5E3C"/>' +
        '<path d="M107 33.5 C112 30.8 119.5 31.6 120.6 35 C119.5 39.4 111.5 41.4 105.5 39.4 C104 37.8 104.8 35 107 33.5 Z" fill="#E8D5B5"/>' +
        '<circle cx="97.5" cy="23.2" r="3.3" fill="#6A432C"/><circle cx="97.5" cy="23.6" r="1.5" fill="#A0714C"/>' +
        '<ellipse cx="120.6" cy="33.6" rx="2.5" ry="2" fill="#2A1B12"/>' +
        '<circle cx="108.5" cy="28.4" r="1.9" fill="#2A1B12"/><circle cx="109.1" cy="27.7" r=".6" fill="#fff"/>' +
        '<path d="M111.5 38.2 q3.2 1.7 6.5 .2" fill="none" stroke="#2A1B12" stroke-width=".8" stroke-linecap="round"/>' +
        '<g stroke="#2A1B12" stroke-width=".55" opacity=".55" stroke-linecap="round" fill="none"><path d="M114.5 35.5 L127 32.5"/><path d="M115 36.8 L128 36.8"/><path d="M114.5 38 L126.5 41"/></g>' +
      '</g>' +
    '</g>' +
    '<g class="o-puff"><circle cx="30" cy="54" r="3"/><circle cx="21" cy="50" r="2.2"/><circle cx="13" cy="55.5" r="1.8"/></g>' +
    '</svg>';

  // ---------------------------------------------------------------- styles
  var CSS =
    '.otter{position:fixed;left:0;bottom:14px;z-index:15;width:var(--ow,150px);pointer-events:none;will-change:transform;contain:layout}' +
    '.otter .o-hit{pointer-events:auto;cursor:pointer;display:block;-webkit-tap-highlight-color:transparent}' +
    '.otter .o-dir{display:block;transform:scaleX(var(--dir,1));transform-origin:50% 100%}' +
    '.otter svg{display:block;width:100%;height:auto;overflow:visible}' +
    '.otter .o-shadow{fill:rgba(11,19,36,.14)}' +
    '.otter .o-leg,.otter .o-tail,.otter .o-head,.otter .o-bob{transform-box:fill-box}' +
    '.otter .o-leg{transform-origin:50% 0}' +
    '.otter .o-tail{transform-origin:100% 50%}' +
    '.otter .o-head{transform-origin:12% 80%}' +
    '.otter .o-bob{transform-origin:50% 100%}' +
    '.otter .o-puff{opacity:0;fill:#fff;stroke:#9DB4C9;stroke-width:.8}' +
    /* run */
    '.otter[data-mode=run] .o-a1,.otter[data-mode=run] .o-a2{animation:o-legA .36s ease-in-out infinite}' +
    '.otter[data-mode=run] .o-b1,.otter[data-mode=run] .o-b2{animation:o-legB .36s ease-in-out infinite}' +
    '.otter[data-mode=run] .o-a2,.otter[data-mode=run] .o-b2{animation-delay:-.06s}' +
    '.otter[data-mode=run] .o-bob{animation:o-bound .36s ease-in-out infinite}' +
    '.otter[data-mode=run] .o-tail{animation:o-tailRun .36s ease-in-out infinite}' +
    '.otter[data-mode=run] .o-head{animation:o-headRun .36s ease-in-out infinite}' +
    /* belly slide */
    '.otter[data-mode=slide] .o-leg{transform:rotate(78deg)}' +
    '.otter[data-mode=slide] .o-a1,.otter[data-mode=slide] .o-a2{transform:rotate(-70deg)}' +
    '.otter[data-mode=slide] .o-bob{transform:translateY(7px) rotate(-3deg) scaleY(.9)}' +
    '.otter[data-mode=slide] .o-tail{transform:rotate(-8deg)}' +
    '.otter[data-mode=slide] .o-head{transform:rotate(-8deg)}' +
    '.otter[data-mode=slide] .o-puff{animation:o-puff .5s linear infinite}' +
    /* stand and sniff */
    '.otter[data-mode=idle] .o-head{animation:o-sniff 2.2s ease-in-out infinite}' +
    '.otter[data-mode=idle] .o-tail{animation:o-tailIdle 2.6s ease-in-out infinite}' +
    '.otter[data-mode=idle] .o-bob{animation:o-breathe 3s ease-in-out infinite}' +
    /* click: flip */
    '.otter .o-flip{display:block;transform-origin:50% 60%}' +
    '.otter.flip .o-flip{animation:o-flip .75s cubic-bezier(.3,.7,.4,1)}' +
    '.otter .o-say{position:absolute;left:50%;bottom:100%;transform:translate(-50%,2px);white-space:nowrap;font:500 12px/1 "IBM Plex Mono",ui-monospace,monospace;' +
      'padding:5px 9px;border-radius:999px;background:#fff;color:#0B1324;border:1px solid #D6DEE9;opacity:0;pointer-events:none;transition:opacity .15s}' +
    '.otter.say .o-say{opacity:1}' +
    '@keyframes o-legA{0%,100%{transform:rotate(-40deg)}50%{transform:rotate(40deg)}}' +
    '@keyframes o-legB{0%,100%{transform:rotate(40deg)}50%{transform:rotate(-40deg)}}' +
    '@keyframes o-bound{0%,50%,100%{transform:translateY(0) rotate(0)}25%{transform:translateY(-3.5px) rotate(-2.2deg)}75%{transform:translateY(-3.5px) rotate(2.2deg)}}' +
    '@keyframes o-tailRun{0%,100%{transform:rotate(-7deg)}50%{transform:rotate(6deg)}}' +
    '@keyframes o-headRun{0%,100%{transform:rotate(-2deg)}50%{transform:rotate(3deg)}}' +
    '@keyframes o-sniff{0%,100%{transform:rotate(0)}18%{transform:rotate(-7deg)}34%{transform:rotate(1deg)}52%{transform:rotate(-6deg)}70%{transform:rotate(2deg)}}' +
    '@keyframes o-tailIdle{0%,100%{transform:rotate(-3deg)}50%{transform:rotate(5deg)}}' +
    '@keyframes o-breathe{0%,100%{transform:scaleY(1)}50%{transform:scaleY(1.025)}}' +
    '@keyframes o-puff{0%{opacity:.9;transform:translate(0,0) scale(.7)}100%{opacity:0;transform:translate(-12px,-8px) scale(1.25)}}' +
    '@keyframes o-flip{0%{transform:translateY(0) rotate(0)}45%{transform:translateY(-46px) rotate(-200deg)}100%{transform:translateY(0) rotate(-360deg)}}' +
    '.otter-toggle{font:inherit;color:var(--green,#148A4E);background:none;border:0;padding:0;cursor:pointer;text-decoration:underline;text-underline-offset:3px}' +
    '.otter-toggle:focus-visible{outline:2px solid var(--green,#148A4E);outline-offset:3px}' +
    '@media print{.otter{display:none!important}}';

  // ---------------------------------------------------------------- build
  var style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  var el = document.createElement('div');
  el.className = 'otter';
  el.setAttribute('aria-hidden', 'true');
  el.dataset.mode = 'idle';
  el.innerHTML = '<span class="o-say">chirp!</span><span class="o-hit"><span class="o-dir"><span class="o-flip">' + SVG + '</span></span></span>';
  var hit = el.querySelector('.o-hit');

  var W = 150, st = { x: 0, dir: 1, mode: 'idle', target: 0, until: 0, speed: 0 }, mouseX = null, raf = 0, last = 0;
  var hooks = { tick: [], start: [], stop: [] };
  window.__otterAPI = {
    el: el, st: st,
    on: function (ev, fn) { if (hooks[ev]) hooks[ev].push(fn); },
    isOn: function () { return on; },
    width: function () { return W; },
    bounds: function () { return bounds(); },
    setMode: function (m) { setMode(m); },
    flip: function () { hit.click(); }
  };
  function measure() {
    W = window.innerWidth < 640 ? 108 : 150;
    el.style.setProperty('--ow', W + 'px');
  }
  function bounds() { return [8, Math.max(8, window.innerWidth - W - 8)]; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  function setMode(m) { st.mode = m; el.dataset.mode = m; }
  function render() {
    el.style.transform = 'translate3d(' + st.x.toFixed(1) + 'px,' + (-(st.lift || 0)).toFixed(1) + 'px,0)';
    el.style.setProperty('--dir', st.dir);
  }
  function pick(now) {
    var b = bounds(), t;
    if (mouseX !== null && Math.random() < 0.45) t = clamp(mouseX - W / 2, b[0], b[1]);   // curious about the cursor
    else t = b[0] + Math.random() * (b[1] - b[0]);
    if (Math.abs(t - st.x) < 80) t = clamp(st.x + (Math.random() < 0.5 ? -1 : 1) * (140 + Math.random() * 260), b[0], b[1]);
    st.target = t;
    st.dir = t > st.x ? 1 : -1;
    var slide = Math.abs(t - st.x) > 260 && Math.random() < 0.28;
    st.speed = slide ? 360 : 165 + Math.random() * 60;
    setMode(slide ? 'slide' : 'run');
  }
  function frame(ts) {
    if (!on) return;
    var dt = Math.min(0.08, (ts - last) / 1000);
    last = ts;
    for (var h = 0; h < hooks.tick.length; h++) hooks.tick[h](dt, ts);
    if (st.hold) {
      /* a game with the capybara is moving the otter */
    } else if (st.mode === 'idle') {
      if (ts > st.until) pick(ts);
    } else {
      st.x += st.speed * dt * st.dir;
      if ((st.dir > 0 && st.x >= st.target) || (st.dir < 0 && st.x <= st.target)) {
        st.x = st.target;
        setMode('idle');
        st.until = ts + 1300 + Math.random() * 3300;
      }
    }
    var b = bounds();
    st.x = clamp(st.x, b[0], b[1]);
    render();
    raf = requestAnimationFrame(frame);
  }

  function start() {
    if (!el.parentNode) document.body.appendChild(el);
    measure();
    var b = bounds();
    st.x = b[0] + Math.random() * (b[1] - b[0]);
    st.dir = Math.random() < 0.5 ? 1 : -1;
    setMode('idle');
    st.until = performance.now() + 900;
    render();
    last = performance.now();
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(frame);
    for (var i = 0; i < hooks.start.length; i++) hooks.start[i]();
  }
  function stop() {
    cancelAnimationFrame(raf);
    st.hold = false; st.lift = 0;
    if (el.parentNode) el.parentNode.removeChild(el);
    for (var i = 0; i < hooks.stop.length; i++) hooks.stop[i]();
  }

  // ---------------------------------------------------------------- interaction
  hit.addEventListener('click', function () {
    if (el.classList.contains('flip')) return;
    el.classList.add('flip', 'say');
    setTimeout(function () { el.classList.remove('flip'); }, 780);
    setTimeout(function () { el.classList.remove('say'); }, 1300);
  });
  window.addEventListener('pointermove', function (e) { if (e.pointerType !== 'touch') mouseX = e.clientX; }, { passive: true });
  window.addEventListener('resize', function () { measure(); });

  // ---------------------------------------------------------------- footer switch
  var btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'otter-toggle';
  function label() { btn.textContent = on ? 'Otter, capybara & cat: on' : 'Otter, capybara & cat: off'; btn.setAttribute('aria-pressed', on ? 'true' : 'false'); }
  btn.addEventListener('click', function () {
    on = !on;
    write(on ? 'on' : 'off');
    label();
    if (on) start(); else stop();
  });
  function mountSwitch() {
    var host = document.querySelector('footer .wrap') || document.querySelector('footer');
    if (!host) return;
    var span = document.createElement('span');
    span.appendChild(btn);
    host.appendChild(span);
  }

  function init() {
    label();
    mountSwitch();
    if (on) start();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();

  // Preview helper, only with ?otterdebug in the address: freeze a pose to look at it.
  if (/[?&]otterdebug/.test(location.search)) {
    window.__otter = {
      pose: function (mode, x, dir) {
        cancelAnimationFrame(raf);
        if (!el.parentNode) document.body.appendChild(el);
        measure(); st.x = x == null ? 300 : x; st.dir = dir || 1; setMode(mode); render();
      },
      resume: function () { last = performance.now(); raf = requestAnimationFrame(frame); }
    };
  }
})();
