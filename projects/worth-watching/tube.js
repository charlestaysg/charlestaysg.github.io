// HackerTube-style video wall.
// The page sets window.TUBE = { key, videos, shelves, shelfLabel, meta(v), detail(v), sorts } before loading this file.
// Videos: { id, title, secs, date, short, shelves: [[name, index]], blurb, rank }.
// Thumbnails are YouTube's own frame from the middle of the video (hq2.jpg), not the uploader's custom thumbnail.
// Watched and recently opened videos are kept in this browser only (localStorage); nothing is sent anywhere.
(() => {
  const T = window.TUBE;
  if (!T || !T.videos) return;
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------- browser-only state ----------
  const store = {
    get() { try { return JSON.parse(localStorage.getItem(T.key) || "{}"); } catch (e) { return {}; } },
    set(v) { try { localStorage.setItem(T.key, JSON.stringify(v)); } catch (e) { /* private window: state lives for this visit only */ } },
  };
  const saved = store.get();
  const state = {
    watched: new Set(saved.watched || []),
    recent: (saved.recent || []).filter((id) => T.videos.some((v) => v.id === id)),
    shelf: "all", sort: T.sorts[0][0], hideWatched: !!saved.hideWatched, q: "",
  };
  const save = () => store.set({ watched: [...state.watched], recent: state.recent.slice(0, 12), hideWatched: state.hideWatched });

  const byId = new Map(T.videos.map((v) => [v.id, v]));
  const dur = (s) => !s ? "" : s >= 3600 ? `${Math.floor(s / 3600)}:${String(Math.floor(s / 60) % 60).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}` : `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  const fmtDate = (d) => d ? new Date(d + "T00:00:00").toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" }) : "";
  const thumb = (id) => `https://i.ytimg.com/vi/${id}/hq2.jpg`;
  const ytUrl = (v) => v.short ? `https://www.youtube.com/shorts/${v.id}` : `https://youtu.be/${v.id}`;
  const STOP = new Set("a an and the of to in on for with at by from is it its my your our this that how what why when who you we i be are was not no do does".split(" "));
  const words = (s) => new Set(String(s).toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w)));
  T.videos.forEach((v) => { v._w = words(`${v.title} ${v.blurb || ""}`); v._q = `${v.title} ${v.blurb || ""} ${(v.shelves || []).map((s) => s[0]).join(" ")} ${v.extra || ""}`.toLowerCase(); });

  // ---------- controls ----------
  const counts = {};
  T.videos.forEach((v) => (v.shelves || []).forEach(([s]) => (counts[s] = (counts[s] || 0) + 1)));
  const shelves = T.shelves.filter((s) => counts[s]);
  $("#tube-shelves").innerHTML = [`<button class="chip" type="button" data-shelf="all" aria-pressed="true">All<span>${T.videos.length}</span></button>`]
    .concat(shelves.map((s) => `<button class="chip" type="button" data-shelf="${esc(s)}" aria-pressed="false">${esc(s)}<span>${counts[s]}</span></button>`)).join("");
  $("#tube-sort").innerHTML = T.sorts.map(([k, label]) => `<option value="${k}">${esc(label)}</option>`).join("");
  $("#tube-hide").checked = state.hideWatched;

  // ---------- grid ----------
  function card(v) {
    const seen = state.watched.has(v.id);
    const shelf = (v.shelves || [])[0];
    return `<article class="tcard${seen ? " seen" : ""}${v.short ? " is-short" : ""}" data-id="${v.id}">
      <button class="tthumb" type="button" aria-label="Play ${esc(v.title)}">
        <img src="${thumb(v.id)}" alt="" loading="lazy" decoding="async" width="480" height="360">
        ${v.secs ? `<span class="tdur">${v.short ? "Short · " : ""}${dur(v.secs)}</span>` : ""}
        ${seen ? `<span class="tseen">Watched</span>` : ""}
      </button>
      <div class="tbody">
        <h3><button class="tplay" type="button">${esc(v.title)}</button></h3>
        <p class="tmeta">${T.meta ? T.meta(v) : esc([shelf && shelf[0], fmtDate(v.date)].filter(Boolean).join(" · "))}</p>
        ${v.blurb ? `<p class="tblurb">${esc(v.blurb)}</p>` : ""}
        ${T.cardExtra ? T.cardExtra(v) : ""}
      </div>
    </article>`;
  }
  function list() {
    const q = state.q.toLowerCase();
    let vs = T.videos.filter((v) => (state.shelf === "all" || (v.shelves || []).some(([s]) => s === state.shelf))
      && (!q || q.split(/\s+/).every((w) => v._q.includes(w)))
      && !(state.hideWatched && state.watched.has(v.id)));
    const sorter = {
      newest: (a, b) => (b.date || "").localeCompare(a.date || ""),
      oldest: (a, b) => (a.date || "").localeCompare(b.date || ""),
      shortest: (a, b) => (a.secs || 9e9) - (b.secs || 9e9),
      longest: (a, b) => (b.secs || 0) - (a.secs || 0),
      rank: (a, b) => (b.rank || 0) - (a.rank || 0),
      shelf: (a, b) => shelfIndex(a) - shelfIndex(b),
    }[state.sort];
    if (state.sort === "random") vs = shuffle(vs); else if (sorter) vs.sort(sorter);
    if (state.shelf !== "all" && state.sort === T.sorts[0][0] && T.shelfOrder) vs.sort((a, b) => shelfIndex(a) - shelfIndex(b));
    return vs;
  }
  const shelfIndex = (v) => { const s = (v.shelves || []).find(([n]) => n === state.shelf); return s ? s[1] : 9e9; };
  function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

  function render() {
    const vs = list();
    $("#tube-grid").innerHTML = vs.map(card).join("") || `<p class="tempty">Nothing matches. Clear the search or pick another shelf.</p>`;
    const w = T.videos.filter((v) => state.watched.has(v.id)).length;
    $("#tube-count").textContent = `${vs.length} of ${T.videos.length} videos · ${w} watched in this browser`;
    $$("#tube-shelves .chip").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.shelf === state.shelf)));
    renderRecent();
  }
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  function renderRecent() {
    const ids = state.recent.filter((id) => byId.has(id)).slice(0, 6);
    $("#tube-recent").hidden = !ids.length;
    $("#tube-recent-list").innerHTML = ids.map((id) => { const v = byId.get(id); return `<button class="rchip" type="button" data-id="${id}"><img src="${thumb(id)}" alt="" loading="lazy"><span>${esc(v.title)}</span></button>`; }).join("");
  }

  // ---------- player and up next ----------
  function upNext(v) {
    // 1) the next videos on the same shelf, in shelf order; 2) videos that share the most title words; unwatched first.
    const out = [];
    const shelf = (v.shelves || []).find(([n]) => state.shelf === "all" || n === state.shelf) || (v.shelves || [])[0];
    if (shelf) {
      const same = T.videos.filter((x) => x.id !== v.id && (x.shelves || []).some(([n]) => n === shelf[0]));
      const idx = (x) => x.shelves.find(([n]) => n === shelf[0])[1];
      same.sort((a, b) => idx(a) - idx(b));
      const after = same.filter((x) => idx(x) > shelf[1]).concat(same.filter((x) => idx(x) <= shelf[1]));
      out.push(...after.filter((x) => !state.watched.has(x.id)).slice(0, 3).map((x) => [x, `Next in ${shelf[0]}`]));
    }
    const sim = T.videos.filter((x) => x.id !== v.id && !out.some(([o]) => o.id === x.id))
      .map((x) => { let n = 0; x._w.forEach((w) => v._w.has(w) && n++); return [x, n + (T.related ? T.related(v, x) : 0)]; })
      .filter(([, n]) => n > 0).sort((a, b) => (state.watched.has(a[0].id) - state.watched.has(b[0].id)) || b[1] - a[1]);
    out.push(...sim.slice(0, 6 - out.length).map(([x]) => [x, "Similar"]));
    return out;
  }
  function open(id, scroll = true) {
    const v = byId.get(id);
    if (!v) return;
    state.watched.add(id);
    state.recent = [id, ...state.recent.filter((x) => x !== id)];
    save();
    const p = $("#tube-player");
    p.hidden = false;
    p.innerHTML = `<div class="pframe${v.short ? " vertical" : ""}"><iframe src="https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1&playsinline=1" title="${esc(v.title)}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe></div>
      <div class="pside">
        <div class="kicker">Now playing</div>
        <h2>${esc(v.title)}</h2>
        <p class="tmeta">${T.meta ? T.meta(v) : esc([(v.shelves || [])[0]?.[0], fmtDate(v.date), dur(v.secs)].filter(Boolean).join(" · "))}</p>
        ${T.detail ? T.detail(v) : v.blurb ? `<p class="pblurb">${esc(v.blurb)}</p>` : ""}
        <div class="pact"><button class="chip" type="button" data-copy="${ytUrl(v)}">Copy link</button><a class="chip" href="${ytUrl(v)}" target="_blank" rel="noopener">YouTube ↗</a><button class="chip" type="button" data-unwatch="${id}">Mark unwatched</button><button class="chip" type="button" data-close>Close</button></div>
        <div class="kicker pnext-h">Up next</div>
        <ol class="pnext">${upNext(v).map(([x, why]) => `<li><button type="button" data-id="${x.id}"><img src="${thumb(x.id)}" alt="" loading="lazy"><span><b>${esc(x.title)}</b><small>${esc(why)}${x.secs ? " · " + dur(x.secs) : ""}${state.watched.has(x.id) ? " · watched" : ""}</small></span></button></li>`).join("")}</ol>
      </div>`;
    history.replaceState(null, "", "#v=" + id);
    if (scroll) p.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    render();
  }
  function close() { const p = $("#tube-player"); p.hidden = true; p.innerHTML = ""; history.replaceState(null, "", location.pathname); }

  async function copy(text, btn) {
    let ok = false;
    try { await navigator.clipboard.writeText(text); ok = true; } catch (e) {
      const ta = Object.assign(document.createElement("textarea"), { value: text }); ta.style.cssText = "position:fixed;opacity:0";
      document.body.appendChild(ta); ta.select(); try { ok = document.execCommand("copy"); } catch (e2) { ok = false; } ta.remove();
    }
    const was = btn.textContent; btn.textContent = ok ? "Copied" : "Copy failed"; setTimeout(() => (btn.textContent = was), 1400);
  }

  // ---------- events ----------
  document.addEventListener("click", (e) => {
    const t = e.target;
    const c = t.closest(".tcard"); if (c && t.closest(".tthumb, .tplay")) return open(c.dataset.id);
    const n = t.closest(".pnext button, .rchip"); if (n) return open(n.dataset.id);
    const s = t.closest("#tube-shelves .chip"); if (s) { state.shelf = s.dataset.shelf; return render(); }
    const cp = t.closest("[data-copy]"); if (cp) return copy(cp.dataset.copy, cp);
    const u = t.closest("[data-unwatch]"); if (u) { state.watched.delete(u.dataset.unwatch); save(); u.textContent = "Marked unwatched"; return render(); }
    if (t.closest("[data-close]")) return close();
    if (t.closest("#tube-forget")) { if (confirm("Forget every watched mark and recent video on this page, in this browser?")) { state.watched.clear(); state.recent = []; save(); render(); } }
    if (t.closest("#tube-surprise")) { const pool = list().filter((v) => !state.watched.has(v.id)); if (pool.length) open(pool[Math.floor(Math.random() * pool.length)].id); }
  });
  $("#tube-q").addEventListener("input", (e) => { state.q = e.target.value.trim(); render(); });
  $("#tube-sort").addEventListener("change", (e) => { state.sort = e.target.value; render(); });
  $("#tube-hide").addEventListener("change", (e) => { state.hideWatched = e.target.checked; save(); render(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !$("#tube-player").hidden) close(); });

  render();
  const m = location.hash.match(/^#v=([\w-]{6,20})$/);
  if (m) open(m[1], false);
})();
