// "Latest headlines" box in the news section. Reads news-api.charlestaysg.com (hourly cache of the publishers' own RSS feeds).
// Shows headline, source and date only, links to the publisher. Status pill + "Check now", like the haze strip.
(function () {
  var box = document.getElementById('heads');
  if (!box || !window.fetch) return;
  var API = window.HEADLINES_API || 'https://news-api.charlestaysg.com';
  var list = document.getElementById('hd-list'), pill = document.getElementById('hd-pill'), note = document.getElementById('hd-note');
  var btn = document.getElementById('hd-check'), chips = box.querySelectorAll('.chip');
  var LATE_MS = 2 * 3600000, topic = 'sme', data = {}, busy = false, everOk = false;

  function setPill(cls, label, title) {
    pill.className = 'src-pill ' + cls; pill.title = title;
    pill.querySelector('.src-label').textContent = label;
  }
  function when(iso) {
    var t = new Date(iso), mins = Math.round((Date.now() - t.getTime()) / 60000);
    if (mins < 60) return Math.max(mins, 1) + ' min ago';
    if (mins < 24 * 60) return Math.round(mins / 60) + ' h ago';
    return new Intl.DateTimeFormat('en-SG', { timeZone: 'Asia/Singapore', day: 'numeric', month: 'short' }).format(t);
  }
  function clock(iso) {
    return new Intl.DateTimeFormat('en-SG', { timeZone: 'Asia/Singapore', hour: 'numeric', minute: '2-digit', hour12: true }).format(new Date(iso)).replace(' ', '').toLowerCase();
  }
  function render(d) {
    list.textContent = '';
    if (!d.items.length) {
      var e = document.createElement('li'); e.textContent = 'Nothing matching this topic in the last couple of weeks.'; e.className = 'hd-empty'; list.appendChild(e); return;
    }
    d.items.forEach(function (it) {
      var li = document.createElement('li'), a = document.createElement('a'), s = document.createElement('span');
      a.href = it.link; a.rel = 'noopener'; a.textContent = it.title;
      s.className = 'spec'; s.textContent = it.source + ' · ' + when(it.published);
      li.appendChild(a); li.appendChild(s); list.appendChild(li);
    });
  }
  function status(d) {
    var age = Date.now() - new Date(d.fetchedAt).getTime(), down = d.feedsTotal - d.feedsOk;
    if (age > LATE_MS) setPill('is-late', 'Delayed', 'The headlines are more than 2 hours old. Press Check now.');
    else if (down > 2) setPill('is-late', 'Partial', down + ' of ' + d.feedsTotal + ' news sources are not responding right now. The rest are shown.');
    else setPill('is-live', 'Live', 'Reading the publishers’ own feeds. Refreshes hourly.');
    note.textContent = 'Updated ' + clock(d.fetchedAt) + ' · ' + d.feedsOk + ' of ' + d.feedsTotal + ' sources reachable · refreshed hourly';
  }
  function fail() {
    if (everOk) { setPill('is-off', 'Offline', 'Could not refresh just now. Showing the last headlines received.'); return; }
    setPill('is-off', 'Offline', 'Could not reach the headlines service right now.');
    list.textContent = ''; var e = document.createElement('li'); e.className = 'hd-empty';
    e.textContent = 'Headlines are offline right now. Please try again later.'; list.appendChild(e);
    note.textContent = '';
  }
  function load(fresh) {
    if (busy) return; busy = true; btn.disabled = true; if (fresh) btn.textContent = 'Checking…';
    var t = topic;
    return fetch(API + '/headlines?topic=' + t + (fresh ? '&fresh=1' : '')).then(function (r) { return r.json(); }).then(function (d) {
      if (d.error || !d.items) throw new Error(d.error || 'bad reply');
      everOk = true; if (fresh) data = {}; data[t] = d;
      if (t === topic) { render(d); status(d); }
    }).catch(fail).then(function () { busy = false; btn.disabled = false; btn.textContent = 'Check now'; });
  }
  chips.forEach(function (c) {
    c.addEventListener('click', function () {
      topic = c.dataset.topic;
      chips.forEach(function (x) { x.setAttribute('aria-pressed', x === c ? 'true' : 'false'); });
      if (data[topic]) { render(data[topic]); status(data[topic]); } else load(false);
    });
  });
  btn.addEventListener('click', function () { load(true); });
  load(false);
  setInterval(function () { if (!document.hidden) { data = {}; load(false); } }, 15 * 60000);
})();
