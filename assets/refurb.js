// "Refurbished MacBook Pro watch" box in the news section. Reads refurb-api.charlestaysg.com, which reads Apple Singapore's public
// refurbished store page once an hour. Status pill + "Check now", like the headlines box.
(function () {
  'use strict';
  var box = document.getElementById('refurb');
  if (!box || !window.fetch) return;
  var API = window.REFURB_API || 'https://refurb-api.charlestaysg.com';
  var list = document.getElementById('rf-list'), pill = document.getElementById('rf-pill'), note = document.getElementById('rf-note'), btn = document.getElementById('rf-check');
  var CAPS = ['2tb', '4tb'], LATE_MS = 2 * 3600000, busy = false, everOk = false;
  var BASE_NOTE = 'Apple Singapore’s refurbished store: MacBook Pro, 16-inch, 128 GB memory, 2 TB or 4 TB. Read hourly.';

  function label(c) { return c.replace('tb', ' TB'); }
  function day(iso) { return new Intl.DateTimeFormat('en-SG', { timeZone: 'Asia/Singapore', day: 'numeric', month: 'short' }).format(new Date(iso)); }
  function clock(iso) { return new Intl.DateTimeFormat('en-SG', { timeZone: 'Asia/Singapore', hour: 'numeric', minute: '2-digit', hour12: true }).format(new Date(iso)).replace(' ', '').toLowerCase(); }
  function chip(title) { var m = /Apple (M\d[\w ]*?) Chip/i.exec(title || ''); return m ? m[1] : ''; }
  function colour(c) { return { spaceblack: 'Space Black', silver: 'Silver', spacegray: 'Space Gray' }[c] || c; }
  function setPill(cls, text, title) { pill.className = 'src-pill ' + cls; pill.title = title; pill.querySelector('.src-label').textContent = text; }
  function li(parts) { var el = document.createElement('li'); parts.forEach(function (p) { el.appendChild(p); }); list.appendChild(el); }
  function span(t) { var s = document.createElement('span'); s.className = 'spec'; s.textContent = t; return s; }

  function render(d) {
    list.textContent = '';
    var by = {}; (d.items || []).forEach(function (it) { by[it.capacity] = it; });
    CAPS.forEach(function (c) {
      var it = by[c];
      if (it) {
        var a = document.createElement('a'); a.href = it.url; a.rel = 'noopener';
        a.textContent = '16-inch MacBook Pro ' + chip(it.title) + ' · 128 GB · ' + label(c) + ' · ' + it.priceText.replace(/\.00$/, '');
        li([a, span('In stock · first seen ' + day(it.firstSeen) + ' · ' + colour(it.color) + ', ' + it.year)]);
      } else {
        var t = document.createElement('span'); t.textContent = label(c) + ': not in stock right now';
        var seen = d.lastSeen && d.lastSeen[c];
        li([t, span(seen ? 'Last seen ' + day(seen.at) + ' at ' + seen.priceText.replace(/\.00$/, '') : 'Not seen since tracking began')]);
      }
    });
    var ev = (d.events || []).slice(-1)[0];
    var changed = ev ? ' · last change: ' + label(ev.capacity) + ' ' + (ev.type === 'gone' ? 'sold out' : ev.type === 'price' ? 'price changed' : 'appeared') + ' ' + day(ev.at) + ', ' + clock(ev.at) : '';
    note.textContent = BASE_NOTE + ' Checked ' + clock(d.checkedAt) + changed + '.';
  }
  function status(d) {
    var n = (d.items || []).length, age = Date.now() - new Date(d.checkedAt).getTime();
    if (!d.ok) setPill('is-late', 'Delayed', 'Apple’s page could not be read at the last check. Showing the last result.');
    else if (age > LATE_MS) setPill('is-late', 'Delayed', 'The last check is more than 2 hours old. Press Check now.');
    else if (n === CAPS.length) setPill('is-live', 'Both in stock', 'Both configurations are listed on Apple’s page right now.');
    else if (n > 0) setPill('is-late', n + ' of ' + CAPS.length + ' in stock', 'Only some of the configurations are listed right now.');
    else setPill('is-off', 'None in stock', 'Neither configuration is listed right now.');
  }
  function fail() {
    if (everOk) { setPill('is-off', 'Offline', 'Could not refresh just now. Showing the last result.'); return; }
    setPill('is-off', 'Offline', 'Could not reach the watch service right now.');
    list.textContent = ''; var e = document.createElement('li'); e.className = 'hd-empty'; e.textContent = 'The watch is offline right now. Please try again later.'; list.appendChild(e);
  }
  function load(fresh) {
    if (busy) return; busy = true; btn.disabled = true; if (fresh) btn.textContent = 'Checking…';
    return fetch(API + '/status' + (fresh ? '?fresh=1' : '')).then(function (r) { return r.json(); }).then(function (d) {
      if (!d || !d.checkedAt) throw new Error('bad reply');
      everOk = true; render(d); status(d);
    }).catch(fail).then(function () { busy = false; btn.disabled = false; btn.textContent = 'Check now'; });
  }
  btn.addEventListener('click', function () { load(true); });
  load(false);
  setInterval(function () { if (!document.hidden) load(false); }, 15 * 60000);
})();
