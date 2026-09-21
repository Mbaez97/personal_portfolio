/* =========================================================================
   Marcelo Báez — personal site
   No dependencies. Everything degrades gracefully if a feature is missing.
   ========================================================================= */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  // Each block below is independent: a failure in one must not disable the others.
  function safe(fn) {
    try { fn(); } catch (e) { if (window.console && console.warn) console.warn(fn.name + ' failed:', e); }
  }

  /* ---------------------------------------------------------------- theme */
  safe(function theme() {
    var toggle = document.getElementById('themeToggle');
    if (!toggle) return;

    function sync() {
      var dark = root.getAttribute('data-theme') === 'dark';
      toggle.setAttribute('aria-pressed', String(dark));
      toggle.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
    }

    toggle.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('theme', next); } catch (e) { /* storage blocked */ }
      sync();
      window.dispatchEvent(new CustomEvent('themechange'));
    });

    // Follow the OS only while the visitor has not made an explicit choice.
    var os = window.matchMedia('(prefers-color-scheme: dark)');
    var onOsChange = function (e) {
      var chosen = null;
      try { chosen = localStorage.getItem('theme'); } catch (err) { /* storage blocked */ }
      if (chosen) return;
      root.setAttribute('data-theme', e.matches ? 'dark' : 'light');
      sync();
      window.dispatchEvent(new CustomEvent('themechange'));
    };
    if (os.addEventListener) os.addEventListener('change', onOsChange);
    else if (os.addListener) os.addListener(onOsChange);

    sync();
  });

  /* ------------------------------------------------------------ mobile nav */
  safe(function mobileNav() {
    var nav = document.getElementById('nav');
    var toggle = document.getElementById('navToggle');
    if (!nav || !toggle) return;

    function setOpen(open) {
      nav.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    }

    toggle.addEventListener('click', function () {
      setOpen(!nav.classList.contains('is-open'));
    });

    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) setOpen(false);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        setOpen(false);
        toggle.focus();
      }
    });

    document.addEventListener('click', function (e) {
      if (!nav.classList.contains('is-open')) return;
      if (!nav.contains(e.target) && !toggle.contains(e.target)) setOpen(false);
    });

    // Reset when the menu stops being a menu.
    var wide = window.matchMedia('(min-width: 861px)');
    var onWide = function (e) { if (e.matches) setOpen(false); };
    if (wide.addEventListener) wide.addEventListener('change', onWide);
    else if (wide.addListener) wide.addListener(onWide);
  });

  /* ------------------------------------------ header state + scroll progress */
  safe(function scrollChrome() {
    var header = document.getElementById('siteHeader');
    var bar = document.getElementById('scrollProgress');
    var ticking = false;

    function update() {
      ticking = false;
      var y = window.scrollY || window.pageYOffset;
      if (header) header.classList.toggle('is-stuck', y > 8);
      if (bar) {
        var max = document.documentElement.scrollHeight - window.innerHeight;
        bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(y / max, 1) : 0) + ')';
      }
    }

    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
    }, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    update();
  });

  /* ------------------------------------------------------------- scrollspy */
  safe(function scrollspy() {
    var links = Array.prototype.slice.call(document.querySelectorAll('.nav a[href^="#"]'));
    if (!links.length || !('IntersectionObserver' in window)) return;

    var map = {};
    var sections = [];
    links.forEach(function (link) {
      var el = document.getElementById(link.getAttribute('href').slice(1));
      if (el) { map[el.id] = link; sections.push(el); }
    });
    if (!sections.length) return;

    var visible = {};
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        visible[entry.target.id] = entry.isIntersecting ? entry.intersectionRatio : 0;
      });

      var bestId = null;
      var best = 0;
      sections.forEach(function (s) {
        if ((visible[s.id] || 0) > best) { best = visible[s.id]; bestId = s.id; }
      });

      links.forEach(function (l) { l.classList.remove('is-active'); });
      if (bestId && map[bestId]) map[bestId].classList.add('is-active');
    }, { rootMargin: '-72px 0px -45% 0px', threshold: [0, 0.15, 0.4, 0.75, 1] });

    sections.forEach(function (s) { observer.observe(s); });
  });

  /* -----------------------------------------------------  reveal on scroll
     Deliberately a scroll sweep rather than an IntersectionObserver: if the
     observer ever misses a callback the content stays invisible, and a CV
     page that hides itself is worse than one with no animation at all.     */
  safe(function reveal() {
    var targets = Array.prototype.slice.call(document.querySelectorAll(
      '.section-head, .about-grid, .timeline, .card, .pub, .proj, .stack, .langs, .contact-box, .sub-title'
    ));
    if (!targets.length) return;

    function showAll() {
      targets.forEach(function (el) { el.classList.add('is-visible'); });
      targets = [];
    }

    if (reduceMotion.matches) { showAll(); return; }

    targets.forEach(function (el, i) {
      el.classList.add('reveal');
      el.style.transitionDelay = Math.min(i % 4, 3) * 60 + 'ms';
    });

    var ticking = false;

    function sweep() {
      ticking = false;
      if (!targets.length) return;
      try {
        var limit = window.innerHeight * 0.94;
        targets = targets.filter(function (el) {
          if (el.getBoundingClientRect().top >= limit) return true;
          el.classList.add('is-visible');
          return false;
        });
        if (!targets.length) detach();
      } catch (e) {
        // Never leave the page half-invisible because of a measuring error.
        showAll();
        detach();
      }
    }

    function onScroll() {
      if (!ticking) { ticking = true; window.requestAnimationFrame(sweep); }
    }

    function detach() {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    window.addEventListener('load', sweep);
    if (reduceMotion.addEventListener) reduceMotion.addEventListener('change', function () {
      if (reduceMotion.matches) { showAll(); detach(); }
    });

    sweep();
  });

  /* --------------------------------------------------------- copy BibTeX */
  safe(function bibtex() {
    var buttons = document.querySelectorAll('[data-bibtex]');
    if (!buttons.length) return;

    Array.prototype.forEach.call(buttons, function (btn) {
      var original = btn.textContent;
      var target = document.getElementById(btn.getAttribute('data-bibtex'));
      if (!target) return;

      btn.addEventListener('click', function () {
        target.hidden = false;

        function done(label, ok) {
          btn.textContent = label;
          btn.classList.toggle('is-copied', !!ok);
          window.setTimeout(function () {
            btn.textContent = original;
            btn.classList.remove('is-copied');
          }, 2000);
        }

        var text = target.textContent;
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(
            function () { done('Copied ✓', true); },
            function () { selectText(target); done('Press ⌘/Ctrl+C', false); }
          );
        } else {
          selectText(target);
          done('Press ⌘/Ctrl+C', false);
        }
      });
    });

    function selectText(el) {
      try {
        var range = document.createRange();
        range.selectNodeContents(el);
        var sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
      } catch (e) { /* selection unavailable */ }
    }
  });

  /* --------------------------------------------------------- footer year */
  safe(function year() {
    var el = document.getElementById('year');
    if (el) el.textContent = String(new Date().getFullYear());
  });

  /* -------------------------------------------------- hero network canvas
     A quiet nod to the protein-interaction networks this research lives in.
     Static single frame when the visitor prefers reduced motion.            */
  safe(function heroNetwork() {
    var canvas = document.getElementById('heroNet');
    if (!canvas || !canvas.getContext) return;

    var ctx = canvas.getContext('2d');
    var hero = canvas.parentElement;
    var nodes = [];
    var width = 0;
    var height = 0;
    var dpr = 1;
    var frame = null;
    var onScreen = true;
    var LINK_DIST = 132;

    var colors = { node: 'rgba(10,108,181,0.55)', edge: 'rgba(15,143,135,0.28)' };

    function readColors() {
      var cs = getComputedStyle(root);
      var n = cs.getPropertyValue('--net-node').trim();
      var e = cs.getPropertyValue('--net-edge').trim();
      if (n) colors.node = n;
      if (e) colors.edge = e;
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = hero.clientWidth;
      height = hero.clientHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    }

    function seed() {
      // Density scales with area, but stays cheap on large screens.
      var count = Math.max(14, Math.min(46, Math.round((width * height) / 26000)));
      nodes = [];
      for (var i = 0; i < count; i++) {
        nodes.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.22,
          vy: (Math.random() - 0.5) * 0.22,
          r: 1.6 + Math.random() * 2.4
        });
      }
    }

    function draw() {
      ctx.clearRect(0, 0, width, height);

      for (var i = 0; i < nodes.length; i++) {
        for (var j = i + 1; j < nodes.length; j++) {
          var dx = nodes[i].x - nodes[j].x;
          var dy = nodes[i].y - nodes[j].y;
          var d = Math.sqrt(dx * dx + dy * dy);
          if (d > LINK_DIST) continue;
          ctx.globalAlpha = 1 - d / LINK_DIST;
          ctx.strokeStyle = colors.edge;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.stroke();
        }
      }

      ctx.globalAlpha = 1;
      ctx.fillStyle = colors.node;
      for (var k = 0; k < nodes.length; k++) {
        ctx.beginPath();
        ctx.arc(nodes[k].x, nodes[k].y, nodes[k].r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function step() {
      for (var i = 0; i < nodes.length; i++) {
        var n = nodes[i];
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < -20) n.x = width + 20;
        if (n.x > width + 20) n.x = -20;
        if (n.y < -20) n.y = height + 20;
        if (n.y > height + 20) n.y = -20;
      }
      draw();
      frame = window.requestAnimationFrame(step);
    }

    function start() {
      if (frame !== null || reduceMotion.matches) return;
      frame = window.requestAnimationFrame(step);
    }

    function stop() {
      if (frame === null) return;
      window.cancelAnimationFrame(frame);
      frame = null;
    }

    readColors();
    resize();
    draw();

    if (reduceMotion.matches) {
      // One static frame is enough.
    } else {
      start();
    }

    var resizeTimer = null;
    window.addEventListener('resize', function () {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(function () {
        resize();
        draw();
      }, 150);
    }, { passive: true });

    window.addEventListener('themechange', function () { readColors(); draw(); });

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stop();
      else if (onScreen) start();
    });

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        onScreen = entries[0].isIntersecting;
        if (onScreen && !document.hidden) start();
        else stop();
      }, { threshold: 0 }).observe(hero);
    }

    var onMotionChange = function () {
      if (reduceMotion.matches) { stop(); draw(); }
      else start();
    };
    if (reduceMotion.addEventListener) reduceMotion.addEventListener('change', onMotionChange);
    else if (reduceMotion.addListener) reduceMotion.addListener(onMotionChange);
  });
})();
