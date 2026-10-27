// "Refurbished watch" boxes in the watching section: MacBook Pro 16-inch 128 GB, Mac Studio with 96 GB or more, Mac mini with 64 GB or more.
// Read refurb-api.charlestaysg.com, which reads Apple Singapore's public refurbished page once an hour. Status pill + "Check now".
(function () {
  'use strict';
  var boxes = document.querySelectorAll('.refurb[data-watch]');
  if (!boxes.length || !window.fetch) return;
  var API = window.REFURB_API || 'https://refurb-api.charlestaysg.com';
  var LATE_MS = 2 * 3600000, busy = false, everOk = false, foot = document.getElementById('rf-foot');
  var BASE_FOOT = 'Stock and prices are Apple’s, read from its public refurbished page. Stock can go at any time. Not affiliated with Apple.';

  function size(c) { return c.replace('tb', ' TB').replace('gb', ' GB'); }
  function money(t) { return String(t || '').replace(/\.00$/, ''); }
  function day(iso) { return new Intl.DateTimeFormat('en-SG', { timeZone: 'Asia/Singapore', day: 'numeric', month: 'short' }).format(new Date(iso)); }
  function clock(iso) { return new Intl.DateTimeFormat('en-SG', { timeZone: 'Asia/Singapore', hour: 'numeric', minute: '2-digit', hour12: true }).format(new Date(iso)).replace(' ', '').toLowerCase(); }
  function chip(title) { var m = /Apple (M\d[\w ]*?) Chip/i.exec(title || ''); return m ? m[1] : ''; }
  function colour(c) { return { spaceblack: 'Space Black', silver: 'Silver', spacegray: 'Space Gray' }[c] || c; }
  function span(t) { var s = document.createElement('span'); s.className = 'spec'; s.textContent = t; return s; }

  // What each box shows. wanted = how many configurations make it "all in stock" (null: any number counts as in stock).
  var CFG = {
    mbp: {
      note: 'Apple Singapore’s refurbished store: MacBook Pro, 16-inch, 128 GB memory, 2 TB or 4 TB. Read hourly.', caps: ['2tb', '4tb'],
      name: function (it) { return '16-inch MacBook Pro ' + chip(it.title) + ' · 128 GB · ' + size(it.capacity) + ' · ' + money(it.priceText); },
      slot: function (c) { return size(c) + ': not in stock right now'; }
    },
    studio: {
      note: 'Apple Singapore’s refurbished store: Mac Studio with 96 GB memory or more, any storage. Read hourly.', caps: null, empty: 'No Mac Studio with 96 GB or more is listed right now', label: 'Mac Studio',
      name: function (it) { return 'Mac Studio ' + chip(it.title) + ' · ' + it.memory + ' GB · ' + size(it.capacity) + ' · ' + money(it.priceText); }
    },
    mini: {
      note: 'Apple Singapore’s refurbished store: Mac mini with 64 GB memory or more, any storage. Read hourly.', caps: null, empty: 'No Mac mini with 64 GB or more is listed right now', label: 'Mac mini',
      name: function (it) { return 'Mac mini ' + chip(it.title) + ' · ' + it.memory + ' GB · ' + size(it.capacity) + ' · ' + money(it.priceText); }
    }
  };

  function paint(box, id, w, d) {
    var cfg = CFG[id], list = box.querySelector('.rf-list'), note = box.querySelector('.rf-note'), pill = box.querySelector('.rf-pill');
    function setPill(cls, text, title) { pill.className = 'src-pill rf-pill ' + cls; pill.title = title; pill.querySelector('.src-label').textContent = text; }
    list.textContent = '';
    function row(parts) { var li = document.createElement('li'); parts.forEach(function (p) { li.appendChild(p); }); list.appendChild(li); }
    var items = w.items || [];
    items.forEach(function (it) {
      var a = document.createElement('a'); a.href = it.url; a.rel = 'noopener'; a.textContent = cfg.name(it);
      row([a, span('In stock · first seen ' + day(it.firstSeen) + (it.color || it.year ? ' · ' + [it.color ? colour(it.color) : '', it.year].filter(Boolean).join(', ') : ''))]);
    });
    if (cfg.caps) {
      cfg.caps.forEach(function (c) {
        if (items.some(function (it) { return it.capacity === c; })) return;
        var t = document.createElement('span'), seen = w.lastSeen && w.lastSeen[c]; t.textContent = cfg.slot(c);
        row([t, span(seen ? 'Last seen ' + day(seen.at) + ' at ' + money(seen.priceText) : 'Not seen since tracking began')]);
      });
    } else if (!items.length) {
      var t2 = document.createElement('span'); t2.textContent = cfg.empty;
      var n = w.nearest, last = w.events && w.events.filter(function (e) { return e.type === 'gone'; }).slice(-1)[0];
      var more = n ? 'The most memory listed now is ' + n.memory + ' GB (' + (n.from === n.to ? money('S$' + n.from.toLocaleString('en-SG')) : 'S$' + n.from.toLocaleString('en-SG') + ' to S$' + n.to.toLocaleString('en-SG')) + ').' : '';
      row([t2, span((last ? 'Last seen ' + day(last.at) + '. ' : 'Not seen since tracking began. ') + more)]);
    }
    var ev = (w.events || []).slice(-1)[0];
    var changed = ev ? ' · last change: ' + (ev.memory ? ev.memory + ' GB ' : '') + size(ev.capacity) + ' ' + (ev.type === 'gone' ? 'sold out' : ev.type === 'price' ? 'price changed' : 'appeared') + ' ' + day(ev.at) + ', ' + clock(ev.at) : '';
    note.textContent = cfg.note + ' Checked ' + clock(d.checkedAt) + changed + '.';
    var age = Date.now() - new Date(d.checkedAt).getTime(), need = cfg.caps ? cfg.caps.length : 1;
    if (!d.ok) setPill('is-late', 'Delayed', 'Apple’s page could not be read at the last check. Showing the last result.');
    else if (age > LATE_MS) setPill('is-late', 'Delayed', 'The last check is more than 2 hours old. Press Check now.');
    else if (cfg.caps && items.length === need) setPill('is-live', 'Both in stock', 'Both configurations are listed on Apple’s page right now.');
    else if (items.length) setPill(cfg.caps ? 'is-late' : 'is-live', cfg.caps ? items.length + ' of ' + need + ' in stock' : items.length + ' in stock', 'Listed on Apple’s page right now.');
    else setPill('is-off', 'None in stock', 'Nothing matching is listed right now.');
  }
  function render(d) {
    var ws = d.watches || { mbp: d };    // the first version of the service sent the MacBook Pro watch at the top level
    boxes.forEach(function (box) { var id = box.getAttribute('data-watch'); if (ws[id] && CFG[id]) paint(box, id, ws[id], d); });
    if (foot) foot.textContent = BASE_FOOT + (d.truncated ? ' Apple’s page lists ' + d.total + ' items but sends only ' + d.shown + ', so the most expensive one can be hidden from this watch.' : '');
  }
  function fail() {
    boxes.forEach(function (box) {
      var pill = box.querySelector('.rf-pill');
      pill.className = 'src-pill rf-pill is-off'; pill.querySelector('.src-label').textContent = 'Offline';
      pill.title = everOk ? 'Could not refresh just now. Showing the last result.' : 'Could not reach the watch service right now.';
      if (!everOk) { var l = box.querySelector('.rf-list'); l.textContent = ''; var e = document.createElement('li'); e.className = 'hd-empty'; e.textContent = 'The watch is offline right now. Please try again later.'; l.appendChild(e); }
    });
  }
  function load(fresh) {
    if (busy) return; busy = true;
    boxes.forEach(function (b) { var bt = b.querySelector('.rf-check'); bt.disabled = true; if (fresh) bt.textContent = 'Checking…'; });
    return fetch(API + '/status' + (fresh ? '?fresh=1' : '')).then(function (r) { return r.json(); }).then(function (d) {
      if (!d || !d.checkedAt) throw new Error('bad reply');
      everOk = true; render(d);
    }).catch(fail).then(function () { busy = false; boxes.forEach(function (b) { var bt = b.querySelector('.rf-check'); bt.disabled = false; bt.textContent = 'Check now'; }); });
  }
  boxes.forEach(function (b) { b.querySelector('.rf-check').addEventListener('click', function () { load(true); }); });
  load(false);
  setInterval(function () { if (!document.hidden) load(false); }, 15 * 60000);
})();
