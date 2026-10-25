// Jazz bar: a slim strip at the bottom. Nothing is loaded from YouTube until the visitor presses play.
// Music comes from two small YouTube channels plus a short list of songs I love, embedded with YouTube's own player (youtube-nocookie.com).
(function () {
  var box = document.getElementById('jazz');
  if (!box) return;
  var CH = {
    coffee: { name: 'Jazz Coffee Vintage', ids: ['LMhu-cXhGRE', 's_IGRv2d2N0', '-tVqyv8vdsc', 'vaVCImnH_Ec', 'keEJfbcPeZs', 'ljXlVvvx5RY', 'fhCAZyCuPnU', 's886qGHiMEc'] },
    bossa: { name: 'Bossa Bean Serenade', ids: ['kkaO7bzJxDA', 'LPYz4XRNuSw', 'gU86PzGEvQA', 'S_2xTRKX040', 'az2UdhcAatw', 'YeqmALX42pA', 'lt3SpdFdmyc', 'jRaz7DRIJJg'] },
    loved: { name: 'Songs I love', ids: ['URuTrLs7Vtk', 'A0at5cAlbZQ', 'u8XQ8vabPz0', 'sQIEzGVNzHI', 'iWgnNbzq8a8', 'hjXrL7CuAvc', 'JZ9pHBEUWPo', 'YsKKuCUYUMU', 'k8Zmlutc3rQ'] }
  };
  var panel = document.getElementById('jz-panel'), frame = document.getElementById('jz-frame');
  var toggle = document.getElementById('jz-toggle'), label = document.getElementById('jz-label'), closeBtn = document.getElementById('jz-close');
  var chips = box.querySelectorAll('.chip'), current = 'coffee', playing = false;
  document.body.classList.add('has-jazz');

  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function play(key) {
    var ids = shuffle(CH[key].ids); // playlist must list every id, first one included, or YouTube skips the first
    var f = document.createElement('iframe');
    f.src = 'https://www.youtube-nocookie.com/embed/' + ids[0] + '?playlist=' + ids.join(',') + '&autoplay=1&loop=1&rel=0&playsinline=1';
    f.title = CH[key].name + ' on YouTube';
    f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    f.referrerPolicy = 'strict-origin-when-cross-origin';
    frame.textContent = ''; frame.appendChild(f); playing = true;
  }
  function open() { panel.hidden = false; toggle.setAttribute('aria-expanded', 'true'); closeBtn.hidden = false; if (!playing) play(current); label.textContent = 'Music playing · hide'; }
  function hide() { panel.hidden = true; toggle.setAttribute('aria-expanded', 'false'); label.textContent = 'Music playing · show'; }
  function stop() { frame.textContent = ''; playing = false; panel.hidden = true; closeBtn.hidden = true; toggle.setAttribute('aria-expanded', 'false'); label.textContent = 'Play some music'; }

  toggle.addEventListener('click', function () { if (!playing || panel.hidden) open(); else hide(); });
  closeBtn.addEventListener('click', stop);
  chips.forEach(function (c) {
    c.addEventListener('click', function () {
      current = c.dataset.ch;
      chips.forEach(function (x) { x.setAttribute('aria-pressed', x === c ? 'true' : 'false'); });
      if (playing) play(current);
    });
  });
})();
