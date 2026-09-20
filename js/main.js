/* ==========================================================================
   2X8 motion
   Needs (loaded before this file): gsap, ScrollTrigger, SplitText, Lenis
   ========================================================================== */

(function () {
  gsap.registerPlugin(ScrollTrigger, SplitText);

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(pointer: fine)').matches;
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.from((root || document).querySelectorAll(sel)); };

  /* ---------------------------------------------------------------- */
  /* Smooth scroll                                                     */
  /* ---------------------------------------------------------------- */
  var lenis = null;

  function initScroll() {
    if (reduce) return;
    lenis = new Lenis({ lerp: 0.09, anchors: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
  }

  /* ---------------------------------------------------------------- */
  /* Preloader: counts one byte, 00000000 to 11111111. First visit.    */
  /* ---------------------------------------------------------------- */
  function preloader() {
    var el = $('[data-loader]');
    if (!el) return Promise.resolve();
    if (reduce || document.documentElement.classList.contains('intro-seen')) {
      el.remove();
      return Promise.resolve();
    }

    if (lenis) lenis.stop();
    var bits = $('[data-loader-bits]', el);
    var dec = $('[data-loader-dec]', el);
    var counter = { v: 0 };

    return gsap
      .to(counter, {
        v: 255,
        duration: 1.4,
        ease: 'power2.inOut',
        onUpdate: function () {
          var n = Math.round(counter.v);
          // Set bits render in orange: the accent tracks progress
          bits.innerHTML = n
            .toString(2)
            .padStart(8, '0')
            .split('')
            .map(function (b) { return b === '1' ? '<b>1</b>' : '0'; })
            .join('');
          dec.textContent = String(n).padStart(3, '0');
        },
      })
      .then(function () {
        return gsap.to(el, { yPercent: -100, duration: 0.9, ease: 'expo.inOut' });
      })
      .then(function () {
        el.remove();
        if (lenis) lenis.start();
        try { sessionStorage.setItem('2x8-intro', '1'); } catch (e) {}
      });
  }

  /* ---------------------------------------------------------------- */
  /* Hero                                                              */
  /* ---------------------------------------------------------------- */
  function heroIntro() {
    var hero = $('[data-hero]');
    if (!hero || reduce) return;
    var title = $('[data-hero-title]', hero);
    var glyphs = $$('.logo-glyph', $('[data-hero-mark]', hero));
    var fades = $$('[data-hero-fade]', hero);

    var split = SplitText.create(title, { type: 'lines', mask: 'lines', linesClass: 'split-line' });
    gsap.set([title].concat(fades, glyphs), { visibility: 'visible' });

    gsap
      .timeline({ defaults: { ease: 'expo.out', duration: 1.3 } })
      .from(split.lines, { yPercent: 105, stagger: 0.09 })
      .from(glyphs, { yPercent: 102, stagger: 0.08, duration: 1.5 }, 0.15)
      .from(fades, { autoAlpha: 0, y: 20, stagger: 0.08, duration: 1 }, 0.45);

    // The mark lags behind as you leave the hero. Brand rule: never rotate or distort the mark itself.
    gsap.to($('[data-hero-mark] .logo', hero), {
      yPercent: 35,
      ease: 'none',
      scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true },
    });

    // Cursor parallax on the glyphs, each drifting a little further than the last. Translate only,
    // same brand rule as above: never rotate or distort the mark.
    if (finePointer) {
      var xTos = glyphs.map(function (g) {
        return gsap.quickTo(g, 'x', { duration: 0.9, ease: 'power3' });
      });
      var yTos = glyphs.map(function (g) {
        return gsap.quickTo(g, 'y', { duration: 0.9, ease: 'power3' });
      });
      hero.addEventListener('pointermove', function (e) {
        var r = hero.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        glyphs.forEach(function (g, i) {
          var depth = (i + 1) * 6;
          xTos[i](px * depth);
          yTos[i](py * depth * 0.6);
        });
      });
      hero.addEventListener('pointerleave', function () {
        glyphs.forEach(function (g, i) {
          xTos[i](0);
          yTos[i](0);
        });
      });
    }
  }

  /* ---------------------------------------------------------------- */
  /* Text reveals                                                      */
  /* ---------------------------------------------------------------- */
  function textReveals() {
    if (reduce) return;

    $$('[data-split]').forEach(function (el) {
      SplitText.create(el, {
        type: 'lines',
        mask: 'lines',
        linesClass: 'split-line',
        autoSplit: true,
        onSplit: function (self) {
          return gsap.from(self.lines, {
            yPercent: 105,
            stagger: 0.08,
            duration: 1.2,
            ease: 'expo.out',
            scrollTrigger: { trigger: el, start: 'top 88%', once: true },
          });
        },
      });
    });

    // Manifesto reads itself in as you scroll
    $$('[data-words]').forEach(function (el) {
      SplitText.create(el, {
        type: 'words',
        autoSplit: true,
        onSplit: function (self) {
          return gsap.fromTo(
            self.words,
            { opacity: 0.14 },
            {
              opacity: 1,
              stagger: 0.1,
              ease: 'none',
              scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 55%', scrub: true },
            }
          );
        },
      });
    });

    var reveals = $$('[data-reveal]');
    gsap.set(reveals, { autoAlpha: 0, y: 40 });
    ScrollTrigger.batch(reveals, {
      start: 'top 90%',
      once: true,
      onEnter: function (batch) {
        gsap.to(batch, { autoAlpha: 1, y: 0, duration: 1.1, ease: 'expo.out', stagger: 0.08, overwrite: true });
      },
    });

    // Images drift inside their frames
    $$('[data-parallax]').forEach(function (img) {
      gsap.fromTo(
        img,
        { yPercent: -8 },
        {
          yPercent: 0,
          ease: 'none',
          scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true },
        }
      );
    });

    var cover = $('[data-cover]');
    if (cover) {
      gsap.fromTo(
        cover,
        { clipPath: 'inset(12% 8% 12% 8%)' },
        { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.6, ease: 'expo.inOut', delay: 0.2 }
      );
      // Only stills get the scroll-linked zoom: a recording needs its full frame in view at all times,
      // a scale scrub would crop the edges of the page it's showing.
      var coverImg = $('img', cover);
      if (coverImg) {
        gsap.fromTo(
          coverImg,
          { scale: 1.25 },
          { scale: 1, ease: 'none', scrollTrigger: { trigger: cover, start: 'top 90%', end: 'bottom top', scrub: true } }
        );
      }
    }
  }

  /* ---------------------------------------------------------------- */
  /* Wipe-up: clip-path reveal for founder portraits and case media    */
  /* ---------------------------------------------------------------- */
  function wipeUp() {
    var els = $$('[data-wipe-up]');
    if (!els.length || reduce) return;

    gsap.set(els, { clipPath: 'inset(100% 0 0 0)', y: 30 });
    ScrollTrigger.batch(els, {
      start: 'top 88%',
      once: true,
      onEnter: function (batch) {
        gsap.to(batch, { clipPath: 'inset(0% 0 0 0)', y: 0, duration: 1, ease: 'expo.out', stagger: 0.12 });
      },
    });
  }

  /* ---------------------------------------------------------------- */
  /* Parallax drift: sibling elements drift opposite directions,       */
  /* scrubbed for as long as their shared group is in view             */
  /* ---------------------------------------------------------------- */
  function parallaxDrift() {
    if (reduce || !finePointer) return;
    $$('[data-parallax-y]').forEach(function (el) {
      var dir = Number(el.getAttribute('data-parallax-y')) || 0;
      if (!dir) return;
      var group = el.closest('[data-parallax-group]') || el.parentElement;
      gsap.to(el, {
        yPercent: dir * 14,
        ease: 'none',
        scrollTrigger: { trigger: group, start: 'top bottom', end: 'bottom top', scrub: true },
      });
    });
  }

  /* ---------------------------------------------------------------- */
  /* Case tile reels: the work-grid video only plays on hover/focus,    */
  /* so four cards don't all animate at once                           */
  /* ---------------------------------------------------------------- */
  function hoverReels() {
    if (reduce) return;
    $$('.case-tile__media').forEach(function (media) {
      var video = $('video[data-hover-reel]', media);
      if (!video) return;

      function play() {
        media.classList.add('is-playing');
        video.play().catch(function () {});
      }
      function stop() {
        media.classList.remove('is-playing');
        video.pause();
      }

      media.addEventListener('pointerenter', play);
      media.addEventListener('pointerleave', stop);
      media.addEventListener('focus', play);
      media.addEventListener('blur', stop);
    });
  }

  /* ---------------------------------------------------------------- */
  /* Fake Finder: a real, clickable file browser for the lab section   */
  /* ---------------------------------------------------------------- */
  function fakeFinder() {
    var root = $('[data-finder]');
    if (!root) return;

    var sidebarItems = $$('[data-finder-project]', root);
    var grids = $$('[data-finder-grid]', root);
    var pathEl = $('[data-finder-path]', root);
    var statusEl = $('[data-finder-status]', root);
    var searchInput = $('[data-finder-search]', root);
    var previewPane = $('[data-finder-preview-pane]', root);
    var previewBody = $('[data-finder-preview-body]', root);
    var backBtn = $('[data-finder-back]', root);

    var labels = {
      specter: 'Specter',
      'studio-klei': 'Studio Klei',
      keikoku: 'Keikoku Atelier',
      'jasper-impens': 'Jasper Impens',
      'elevator-antwerp': 'Elevator Antwerp',
      readme: 'README.md',
    };
    var currentProject = 'specter';

    function activeGrid() {
      return $('[data-finder-grid="' + currentProject + '"]', root);
    }

    function updateStatus() {
      var grid = activeGrid();
      var files = grid ? $$('.finder__file', grid) : [];
      var visible = files.filter(function (f) { return f.style.display !== 'none'; });
      statusEl.textContent = visible.length + (visible.length === 1 ? ' item' : ' items');
    }

    function updatePath(fileLabel) {
      var base = currentProject === 'readme' ? '2X8 › README.md' : '2X8 › Werk › ' + labels[currentProject];
      pathEl.textContent = fileLabel ? base + ' › ' + fileLabel : base;
    }

    function closePreview() {
      previewPane.hidden = true;
      previewBody.innerHTML = '';
      updatePath();
      updateStatus();
    }

    function selectProject(id) {
      currentProject = id;
      sidebarItems.forEach(function (btn) {
        var active = btn.getAttribute('data-finder-project') === id;
        btn.classList.toggle('is-active', active);
        if (active) btn.setAttribute('aria-current', 'true');
        else btn.removeAttribute('aria-current');
      });
      grids.forEach(function (g) {
        g.classList.toggle('is-active', g.getAttribute('data-finder-grid') === id);
      });
      if (searchInput) searchInput.value = '';
      closePreview();
    }

    function openPreview(fileBtn) {
      var type = fileBtn.getAttribute('data-finder-preview');
      var name = $('.finder__file-name', fileBtn).textContent;
      previewBody.innerHTML = '';

      if (type === 'image') {
        var img = document.createElement('img');
        img.src = fileBtn.getAttribute('data-finder-src');
        img.alt = fileBtn.getAttribute('data-finder-alt') || name;
        previewBody.appendChild(img);
      } else if (type === 'video') {
        var video = document.createElement('video');
        video.src = fileBtn.getAttribute('data-finder-src');
        video.controls = true;
        video.muted = true;
        video.playsInline = true;
        previewBody.appendChild(video);
      } else if (type === 'text') {
        var pre = document.createElement('pre');
        pre.textContent = fileBtn.getAttribute('data-finder-text') || '';
        previewBody.appendChild(pre);
      }

      previewPane.hidden = false;
      updatePath(currentProject === 'readme' ? null : name);
      statusEl.textContent = 'Voorbeeld · ' + name;
    }

    sidebarItems.forEach(function (btn) {
      btn.addEventListener('click', function () { selectProject(btn.getAttribute('data-finder-project')); });
    });

    $$('.finder__file[data-finder-preview]', root).forEach(function (btn) {
      btn.addEventListener('click', function () { openPreview(btn); });
    });

    if (backBtn) backBtn.addEventListener('click', closePreview);

    if (searchInput) {
      searchInput.addEventListener('input', function () {
        var q = searchInput.value.trim().toLowerCase();
        var grid = activeGrid();
        if (!grid) return;
        $$('.finder__file', grid).forEach(function (file) {
          var name = $('.finder__file-name', file).textContent.toLowerCase();
          file.style.display = !q || name.indexOf(q) !== -1 ? '' : 'none';
        });
        updateStatus();
      });
    }

    updatePath();
    updateStatus();
  }

  /* ---------------------------------------------------------------- */
  /* Service tabs: one panel, two states, ARIA tabs pattern             */
  /* ---------------------------------------------------------------- */
  function serviceTabs() {
    var tabs = $$('[data-service-tab]');
    if (!tabs.length) return;
    var panels = $$('[data-service-panel]');
    var visualNum = $('[data-service-visual]');

    function activate(tab, focusTab) {
      tabs.forEach(function (t) {
        var active = t === tab;
        t.classList.toggle('is-active', active);
        t.setAttribute('aria-selected', String(active));
        t.tabIndex = active ? 0 : -1;
      });
      panels.forEach(function (p) {
        p.classList.toggle('is-active', p.getAttribute('data-service-panel') === tab.getAttribute('data-service-tab'));
      });
      if (visualNum) {
        visualNum.textContent = tab.getAttribute('data-service-tab') === 'build' ? '01' : '02';
      }
      if (focusTab) tab.focus();
    }

    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () { activate(tab); });
      tab.addEventListener('keydown', function (e) {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        e.preventDefault();
        var next = tabs[(i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length];
        activate(next, true);
      });
    });
  }

  /* ---------------------------------------------------------------- */
  /* Counters: numbers count up as their group scrolls into view       */
  /* ---------------------------------------------------------------- */
  function counters() {
    $$('[data-counter]').forEach(function (group) {
      var nums = $$('[data-count-to]', group);
      if (!nums.length) return;

      if (reduce) {
        nums.forEach(function (n) { n.textContent = n.getAttribute('data-count-to'); });
        return;
      }

      var proxy = { v: 0 };
      gsap.to(proxy, {
        v: 1,
        ease: 'none',
        scrollTrigger: { trigger: group, start: 'top 90%', end: 'top 40%', scrub: 0.4 },
        onUpdate: function () {
          nums.forEach(function (n) {
            var target = Number(n.getAttribute('data-count-to'));
            n.textContent = Math.round(target * proxy.v);
          });
        },
      });
    });
  }

  /* ---------------------------------------------------------------- */
  /* Marquee: speeds up with scroll velocity                           */
  /* ---------------------------------------------------------------- */
  function marquee() {
    if (reduce) return;
    $$('[data-marquee]').forEach(function (el) {
      var track = $('[data-marquee-track]', el);
      var duration = Number(el.getAttribute('data-marquee-duration')) || 40;
      var loop = gsap.to(track, { xPercent: -50, ease: 'none', duration: duration, repeat: -1 });

      ScrollTrigger.create({
        trigger: el,
        start: 'top bottom',
        end: 'bottom top',
        onToggle: function (self) { self.isActive ? loop.play() : loop.pause(); },
      });

      gsap.ticker.add(function () {
        var v = lenis ? Math.abs(lenis.velocity) : 0;
        var target = 1 + Math.min(v * 0.35, 6);
        loop.timeScale(gsap.utils.interpolate(loop.timeScale(), target, 0.08));
      });
    });
  }

  /* ---------------------------------------------------------------- */
  /* Nav: hides on scroll down, flips to ink over dark sections        */
  /* ---------------------------------------------------------------- */
  function nav() {
    var header = $('[data-nav]');
    if (!header) return;

    ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: function (self) {
        header.classList.toggle('nav--hidden', self.direction === 1 && self.scroll() > window.innerHeight * 0.4);
      },
    });

    $$('[data-theme-ink]').forEach(function (section) {
      ScrollTrigger.create({
        trigger: section,
        start: function () { return 'top ' + header.offsetHeight / 2 + 'px'; },
        end: function () { return 'bottom ' + header.offsetHeight / 2 + 'px'; },
        onToggle: function (self) { header.classList.toggle('nav--ink', self.isActive); },
      });
    });
  }

  /* ---------------------------------------------------------------- */
  /* Mobile menu                                                       */
  /* ---------------------------------------------------------------- */
  function menu() {
    var panel = $('[data-menu]');
    var openBtn = $('[data-menu-open]');
    var closeBtn = $('[data-menu-close]');
    if (!panel || !openBtn || !closeBtn) return;
    var links = $$('[data-menu-link] span', panel);

    function open() {
      panel.hidden = false;
      openBtn.setAttribute('aria-expanded', 'true');
      if (lenis) lenis.stop();
      closeBtn.focus();
      if (!reduce) {
        gsap.fromTo(panel, { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: 0.8, ease: 'expo.inOut' });
        gsap.fromTo(links, { yPercent: 110 }, { yPercent: 0, duration: 1, ease: 'expo.out', stagger: 0.06, delay: 0.3 });
      }
    }

    function close(focusBack) {
      function done() {
        panel.hidden = true;
        openBtn.setAttribute('aria-expanded', 'false');
        if (lenis) lenis.start();
        if (focusBack !== false) openBtn.focus();
      }
      if (reduce) return done();
      gsap.to(panel, { clipPath: 'inset(0 0 100% 0)', duration: 0.6, ease: 'expo.inOut', onComplete: done });
    }

    openBtn.addEventListener('click', open);
    closeBtn.addEventListener('click', function () { close(); });
    $$('[data-menu-link]', panel).forEach(function (a) {
      a.addEventListener('click', function () { close(false); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !panel.hidden) close();
    });
  }

  /* ---------------------------------------------------------------- */
  /* Case reel: big screen-recording video on a case page               */
  /* ---------------------------------------------------------------- */
  function caseReels() {
    $$('[data-case-reel]').forEach(function (video) {
      if (reduce) {
        video.removeAttribute('autoplay');
        video.pause();
        video.controls = true;
        return;
      }
      // Some browsers ignore the autoplay attribute if it was set before JS took over.
      video.play().catch(function () {});
    });
  }

  /* ---------------------------------------------------------------- */
  /* Proof panels: the live site looks back at your cursor             */
  /* ---------------------------------------------------------------- */
  function proofPanels() {
    if (reduce || !finePointer) return;
    $$('.proof-panel').forEach(function (panel) {
      var img = $('.proof-panel__frame img', panel);
      if (!img) return;
      var xTo = gsap.quickTo(img, 'xPercent', { duration: 0.7, ease: 'power3' });
      var yTo = gsap.quickTo(img, 'yPercent', { duration: 0.7, ease: 'power3' });
      panel.addEventListener('pointermove', function (e) {
        var r = panel.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        xTo(px * -4);
        yTo(py * -4);
      });
      panel.addEventListener('pointerleave', function () {
        xTo(0);
        yTo(0);
      });
    });
  }

  /* ---------------------------------------------------------------- */
  /* Magnetic CTAs                                                     */
  /* ---------------------------------------------------------------- */
  function magnetic() {
    if (reduce || !finePointer) return;
    $$('[data-magnetic]').forEach(function (el) {
      var xTo = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3' });
      var yTo = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3' });
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        xTo((e.clientX - r.left - r.width / 2) * 0.25);
        yTo((e.clientY - r.top - r.height / 2) * 0.35);
      });
      el.addEventListener('pointerleave', function () {
        xTo(0);
        yTo(0);
      });
    });
  }

  /* ---------------------------------------------------------------- */
  /* Boot                                                              */
  /* ---------------------------------------------------------------- */
  initScroll();

  document.fonts.ready.then(function () {
    textReveals();
    marquee();
    proofPanels();
    caseReels();
    nav();
    menu();
    magnetic();
    wipeUp();
    parallaxDrift();
    hoverReels();
    fakeFinder();
    serviceTabs();
    counters();

    // Arriving from a case page on "index.html#work": jump to the section
    if (location.hash && lenis) {
      var target = $(location.hash);
      if (target) requestAnimationFrame(function () { lenis.scrollTo(target, { immediate: true }); });
    }

    return preloader().then(function () {
      heroIntro();
      ScrollTrigger.refresh();
    });
  });
})();
