/* R. Keren — motion layer. Vanilla JS, no libraries.
   Правило: анимация включается только после того, как весь слой собран без ошибок.
   Класс html.motion добавляется последним. Пока его нет — контент виден полностью. */
(function () {
  var doc = document.documentElement;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduce || !('IntersectionObserver' in window) || !('requestAnimationFrame' in window)) {
    doc.classList.add('no-motion');
    return;
  }

  var intro = null;

  function closeIntro() {
    var el = document.querySelector('.intro');
    doc.classList.remove('loading');
    if (!el) return;
    el.classList.add('out');
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 900);
  }

  function sweep() {
    var vh = window.innerHeight;
    Array.prototype.slice.call(document.querySelectorAll('.reveal:not(.in),.mask:not(.in)'))
      .forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.top < vh && r.bottom > -1) el.classList.add('in');
      });
    Array.prototype.slice.call(document.querySelectorAll('h1:not(.lit),h2:not(.lit)'))
      .forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.top < vh && r.bottom > -1) el.classList.add('lit');
      });
  }

  try {
    doc.classList.add('js');

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
      if (el.tagName === 'VIDEO' || el.querySelector('video')) return;
      if (el.classList.contains('reveal')) return;
      el.classList.add('reveal');
    });

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
      var lines = h1.innerHTML.split(/<br\s*\/?>/i);
      h1.innerHTML = lines.map(function (line) {
        return line.split(/(\s+)/).map(function (w) {
          if (!w.trim()) return w;
          return '<span class="w"><i style="transition-delay:' + (60 + (idx++) * 45) + 'ms">' + w + '</i></span>';
        }).join('');
      }).join('<br>');
      requestAnimationFrame(function () { h1.classList.add('lit'); });
    }

    /* ---------- 4. parallax on full-bleed bands + progress bar ---------- */
    var bands = Array.prototype.slice.call(document.querySelectorAll('.band img'));
    var ticking = false;

    function frame() {
      ticking = false;
      var vh = window.innerHeight;

      bands.forEach(function (img) {
        var r = img.parentNode.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        var mid = r.top + r.height / 2;
        var d = (mid - vh / 2) / vh;
        img.style.transform = 'translate3d(0,' + (d * 8).toFixed(2) + 'px,0)';
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
      window.addEventListener('scroll', function () {
        header.classList.toggle('shrunk', (window.pageYOffset || doc.scrollTop) > 40);
      }, { passive: true });
    }

    /* ---------- 7. photo reveal: curtain wipe + slow drift ---------- */
    var photos = Array.prototype.slice.call(document.querySelectorAll('img')).filter(function (im) {
      return !im.closest('header') && !im.closest('footer') && !im.closest('.band');
    });

    photos.forEach(function (im) {
      if (im.parentNode && im.parentNode.classList && im.parentNode.classList.contains('mask')) return;
      var mask = document.createElement('span');
      mask.className = 'mask';
      im.parentNode.insertBefore(mask, im);
      mask.appendChild(im);
    });

    var masks = Array.prototype.slice.call(document.querySelectorAll('.mask'));
    var mio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); mio.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.15 });
    masks.forEach(function (m) { mio.observe(m); });

    function drift() {
      var vh = window.innerHeight;
      masks.forEach(function (m) {
        var r = m.getBoundingClientRect();
        if (r.bottom < -100 || r.top > vh + 100) return;
        var im = m.querySelector('img');
        if (!im || !m.classList.contains('in')) return;
        var d = ((r.top + r.height / 2) - vh / 2) / vh;
        im.style.transform = 'translate3d(0,' + (d * -6).toFixed(2) + 'px,0)';
      });
    }
    window.addEventListener('scroll', function () { requestAnimationFrame(drift); }, { passive: true });

    /* ---------- 8. intro curtain ---------- */
    intro = document.createElement('div');
    intro.className = 'intro';
    intro.innerHTML = '<div class="intro-in"><span class="intro-mark">R. Keren</span><span class="intro-num">0</span></div>';
    document.body.appendChild(intro);
    doc.classList.add('loading');

    (function () {
      var num = intro.querySelector('.intro-num');
      var n = 0, step = function () {
        n += Math.max(1, Math.round((100 - n) / 12));
        if (n > 100) n = 100;
        num.textContent = n;
        if (n < 100) setTimeout(step, 26);
        else setTimeout(closeIntro, 260);
      };
      step();
    })();

    /* ---------- 9. custom cursor ---------- */
    if (matchMedia('(pointer:fine)').matches) {
      var cur = document.createElement('div'); cur.className = 'cursor';
      var dot = document.createElement('div'); dot.className = 'cursor-dot';
      document.body.appendChild(cur); document.body.appendChild(dot);
      var cx = 0, cy = 0, tx = 0, ty = 0;
      document.addEventListener('mousemove', function (e) {
        tx = e.clientX; ty = e.clientY;
        dot.style.transform = 'translate3d(' + tx + 'px,' + ty + 'px,0)';
      });
      (function loop() {
        cx += (tx - cx) * 0.16; cy += (ty - cy) * 0.16;
        cur.style.transform = 'translate3d(' + cx + 'px,' + cy + 'px,0)';
        requestAnimationFrame(loop);
      })();
      document.querySelectorAll('a,button,.mask,input,textarea').forEach(function (el) {
        el.addEventListener('mouseenter', function () { cur.classList.add('big'); });
        el.addEventListener('mouseleave', function () { cur.classList.remove('big'); });
      });
    }

    /* ---------- 10. running strip ---------- */
    var firstBand = document.querySelector('.band');
    if (firstBand) {
      var strip = document.createElement('div');
      strip.className = 'ticker';
      var unit = (doc.lang === 'en')
        ? 'SLAG \u00b7 SLUDGE \u00b7 DUMPS \u00b7 SECONDARY METALLURGICAL MATERIALS \u00b7 '
        : '\u0428\u041b\u0410\u041a \u00b7 \u0428\u041b\u0410\u041c \u00b7 \u041e\u0422\u0412\u0410\u041b\u042b \u00b7 \u0412\u0422\u041e\u0420\u0418\u0427\u041d\u042b\u0415 \u041c\u0415\u0422\u0410\u041b\u041b\u0423\u0420\u0413\u0418\u0427\u0415\u0421\u041a\u0418\u0415 \u041c\u0410\u0422\u0415\u0420\u0418\u0410\u041b\u042b \u00b7 ';
      strip.innerHTML = '<div class="ticker-row"><span>' + unit.repeat(4) + '</span><span>' + unit.repeat(4) + '</span></div>';
      firstBand.parentNode.insertBefore(strip, firstBand.nextSibling);
    }

    /* ---------- 11. h2 line reveal ---------- */
    document.querySelectorAll('h2').forEach(function (h) {
      if (h.children.length) return;
      h.innerHTML = '<span class="w"><i>' + h.textContent + '</i></span>';
      var o = new IntersectionObserver(function (en) {
        en.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('lit'); o.unobserve(e.target); } });
      }, { threshold: 0.4 });
      o.observe(h);
    });

    /* ---------- 12. magnetic buttons ---------- */
    document.querySelectorAll('.btn').forEach(function (b) {
      b.addEventListener('mousemove', function (e) {
        var r = b.getBoundingClientRect();
        b.style.transform = 'translate3d(' + ((e.clientX - r.left - r.width / 2) * 0.18) + 'px,'
          + ((e.clientY - r.top - r.height / 2) * 0.28) + 'px,0)';
      });
      b.addEventListener('mouseleave', function () { b.style.transform = ''; });
    });

    /* всё собрано без ошибок — только теперь разрешаем прятать элементы */
    doc.classList.add('motion');

  } catch (e) {
    doc.classList.remove('motion', 'js', 'loading');
    doc.classList.add('no-motion');
    if (intro && intro.parentNode) intro.parentNode.removeChild(intro);
    if (window.console && console.error) console.error('site.js:', e);
  }

  /* ---------- сторожа: ничего не может остаться скрытым ---------- */
  setTimeout(sweep, 1500);
  setTimeout(sweep, 3000);
  setTimeout(closeIntro, 4000);
  window.addEventListener('load', function () { setTimeout(sweep, 500); });
  window.addEventListener('orientationchange', function () { setTimeout(sweep, 300); });
  window.addEventListener('pageshow', function () { setTimeout(sweep, 200); });
})();
