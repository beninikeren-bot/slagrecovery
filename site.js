/* R. Keren — motion layer. Vanilla JS, no libraries. */
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var doc = document.documentElement;
  doc.classList.add('js');
  if (reduce) { doc.classList.add('no-motion'); return; }

  /* ---------- 1. progress line in header ---------- */
  var bar = document.createElement('div');
  bar.className = 'scroll-progress';
  document.body.appendChild(bar);

  /* ---------- 2. mark elements for reveal ---------- */
  var revealSel = [
    'section > .wrap > *',
    '.cols > *', '.cols-3 > *',
    '.statements p', '.stage', '.ledger li', '.checklist li',
    '.note-box', '.fig', 'figure', 'form', '.contacts',
    '.hero-media figure', '.page-head img', '.page-head > div'
  ].join(',');

  var nodes = Array.prototype.slice.call(document.querySelectorAll(revealSel));
  nodes.forEach(function (el) {
    if (el.closest('header') || el.closest('footer')) return;
    if (el.classList.contains('reveal')) return;
    el.classList.add('reveal');
  });

  /* stagger inside each group */
  document.querySelectorAll('.cols,.cols-3,.statements,.ledger,.checklist,.stages').forEach(function (group) {
    Array.prototype.slice.call(group.children).forEach(function (child, i) {
      if (child.classList.contains('reveal')) child.style.transitionDelay = (i * 70) + 'ms';
    });
  });

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    });
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });

  document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });

  /* ---------- 3. hero headline: line mask reveal ---------- */
  var h1 = document.querySelector('h1');
  if (h1 && !h1.dataset.split) {
    h1.dataset.split = '1';
    var idx = 0;
    /* split each line separately so <br> is preserved */
    var lines = h1.innerHTML.split(/<br\s*\/?>/i);
    h1.innerHTML = lines.map(function (line) {
      return line.split(/(\s+)/).map(function (w) {
        if (!w.trim()) return w;
        return '<span class="w"><i style="transition-delay:' + (60 + (idx++) * 45) + 'ms">' + w + '</i></span>';
      }).join('');
    }).join('<br>');
    requestAnimationFrame(function () { h1.classList.add('lit'); });
  }

  /* ---------- 4. parallax on full-bleed bands + slow hero zoom ---------- */
  var bands = Array.prototype.slice.call(document.querySelectorAll('.band img'));
  var ticking = false;

  function frame() {
    ticking = false;
    var vh = window.innerHeight;

    bands.forEach(function (img) {
      var r = img.parentNode.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) return;
      var mid = r.top + r.height / 2;
      var d = (mid - vh / 2) / vh;            /* -1 .. 1 */
      img.style.transform = 'scale(1.14) translate3d(0,' + (d * 26).toFixed(2) + 'px,0)';
    });

    var y = window.pageYOffset || doc.scrollTop;
    var h = doc.scrollHeight - window.innerHeight;
    bar.style.transform = 'scaleX(' + (h > 0 ? Math.min(1, y / h) : 0) + ')';
  }

  function onScroll() {
    if (!ticking) { ticking = true; requestAnimationFrame(frame); }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  frame();

  /* ---------- 5. stage list: active step tracking ---------- */
  var stages = Array.prototype.slice.call(document.querySelectorAll('.stage'));
  if (stages.length) {
    var sio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        e.target.classList.toggle('active', e.isIntersecting && e.intersectionRatio > 0.55);
      });
    }, { threshold: [0, 0.55, 1], rootMargin: '-20% 0px -30% 0px' });
    stages.forEach(function (s) { sio.observe(s); });
  }

  /* ---------- 6. header state on scroll ---------- */
  var header = document.querySelector('header');
  if (header) {
    var last = 0;
    window.addEventListener('scroll', function () {
      var y = window.pageYOffset || doc.scrollTop;
      header.classList.toggle('shrunk', y > 40);
      last = y;
    }, { passive: true });
  }
})();
