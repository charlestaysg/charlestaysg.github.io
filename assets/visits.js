// Visitor count in the footer. Reads/adds to visits-api.charlestaysg.com. Counts a browser at most once per day
// (the day is remembered in this browser only, in localStorage, not a cookie). Skips counting for people who send
// Do Not Track or Global Privacy Control; they still see the number. If anything fails, nothing is shown.
(function () {
  'use strict';
  var API = window.VISITS_API || 'https://visits-api.charlestaysg.com', KEY = 'visit-day';
  var host = document.querySelector('footer .wrap');
  if (!host || !window.fetch) return;
  function sgtDay() {
    try { return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Singapore', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()); }
    catch (e) { return new Date().toISOString().slice(0, 10); }
  }
  var seen = null;
  try { seen = localStorage.getItem(KEY); } catch (e) { /* private window: fine */ }
  var today = sgtDay();
  var dnt = navigator.doNotTrack === '1' || navigator.globalPrivacyControl === true;
  var post = !dnt && seen !== today;
  fetch(API + (post ? '/hit' : '/count'), { method: post ? 'POST' : 'GET', mode: 'cors', cache: 'no-store', credentials: 'omit' })
    .then(function (r) { return r.json(); })
    .then(function (d) {
      if (!d || typeof d.total !== 'number') return;
      var span = document.createElement('span');
      span.className = 'visits';
      span.textContent = 'Visits: ' + d.total.toLocaleString('en-SG');
      span.title = 'A simple count: one per browser per day. No cookies; nothing about you is kept.';
      host.appendChild(span);
      if (post) { try { localStorage.setItem(KEY, today); } catch (e) { /* fine */ } }
    })
    .catch(function () { /* the counter is optional */ });
})();
