/* ==========================================================================
   2X8 motion
   Needs (loaded before this file): gsap, ScrollTrigger, SplitText, Lenis
   ========================================================================== */

/* Double-clicked from disk (file://): the clean site links (/werk, /work/specter)
   point at the root of the drive. Point them at the real .html files instead, so the
   site can be clicked through locally. Does nothing on the server. */
(function () {
  if (location.protocol !== 'file:') return;
  var root = document.currentScript.src.replace(/js\/main\.js.*$/, '');
  document.querySelectorAll('a[href^="/"]').forEach(function (a) {
    var m = a.getAttribute('href').match(/^\/([^?#]*)(.*)$/);
    var path = m[1];
    if (path === '' || path.slice(-1) === '/') path += 'index.html';
    else if (!/\.[a-z0-9]+$/i.test(path)) path += '.html';
    a.href = root + path + m[2];
  });
})();

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
      eqty: 'EQTY',
      nadir: 'NADIR',
      delta: 'DLTA',
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
  /* Work filter: Alles / Websites / Apps / Platforms                   */
  /* ---------------------------------------------------------------- */
  /* ---------------------------------------------------------------- */
  /* Dienstenpagina: sprongknop opent de dienst waar ze naar wijst      */
  /* ---------------------------------------------------------------- */
  /* Zonder dit scrol je naar een dichtgeklapte <details> en zie je enkel de
     titel staan. De details delen een name-attribuut, dus het openzetten van
     de ene sluit de andere vanzelf. */
  function serviceJumps() {
    var root = $('[data-svc-jump]');
    if (!root) return;
    $$('a[href^="#"]', root).forEach(function (link) {
      link.addEventListener('click', function () {
        var target = $(link.getAttribute('href'));
        if (target && target.tagName === 'DETAILS') target.open = true;
      });
    });
  }

  function workFilter() {
    var root = $('[data-work-filter]');
    if (!root) return;
    var btns = $$('[data-work-filter-btn]', root);
    var items = $$('[data-work-category]');

    function activate(btn, focusBtn) {
      var val = btn.getAttribute('data-work-filter-btn');
      btns.forEach(function (b) {
        var active = b === btn;
        b.classList.toggle('is-active', active);
        b.setAttribute('aria-selected', String(active));
        b.tabIndex = active ? 0 : -1;
      });
      items.forEach(function (item) {
        item.hidden = val !== 'all' && item.getAttribute('data-work-category') !== val;
      });
      // Hiding a spotlight changes every scroll position below it.
      if (!reduce) ScrollTrigger.refresh();
      if (focusBtn) btn.focus();
    }

    btns.forEach(function (btn, i) {
      btn.addEventListener('click', function () { activate(btn); });
      btn.addEventListener('keydown', function (e) {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        e.preventDefault();
        activate(btns[(i + (e.key === 'ArrowRight' ? 1 : -1) + btns.length) % btns.length], true);
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
      // Rustig, vast tempo. De band liep vroeger mee met de scrollsnelheid van
      // Lenis; nu schuift ze gewoon door, wat je ook doet.
      var duration = Number(el.getAttribute('data-marquee-duration')) || 80;
      var loop = gsap.to(track, { xPercent: -50, ease: 'none', duration: duration, repeat: -1 });

      // Buiten beeld stilzetten scheelt werk en ziet niemand.
      ScrollTrigger.create({
        trigger: el,
        start: 'top bottom',
        end: 'bottom top',
        onToggle: function (self) { self.isActive ? loop.play() : loop.pause(); },
      });

      // Hover houdt de band tegen, zodat je de namen kunt lezen. Uitlopen in
      // plaats van blokkeren, anders schokt ze.
      //
      // De tijdschaal loopt via een los object: `gsap.to(loop, {timeScale: 0})`
      // zet op een tween een gelijknamige property náást de methode, en de
      // animatie trekt zich daar niets van aan. Via onUpdate de setter
      // aanroepen doet wel wat het zegt.
      var speed = { v: 1 };
      var glide = function (to) {
        gsap.to(speed, {
          v: to,
          duration: to === 0 ? 0.6 : 0.9,
          ease: 'power2.out',
          overwrite: true,
          onUpdate: function () { loop.timeScale(speed.v); },
        });
      };

      el.addEventListener('pointerenter', function (e) {
        // De media query hier uitlezen in plaats van bij het laden: of er een
        // muis is, weet de browser soms pas na de eerste beweging. Een vinger
        // mag de band niet stilzetten.
        if (e.pointerType === 'touch' || !window.matchMedia('(hover: hover)').matches) return;
        glide(0);
      });
      el.addEventListener('pointerleave', function () { glide(1); });
      el.addEventListener('pointercancel', function () { glide(1); });
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
  /* Work filter: Alles / Websites / Apps / Platforms                  */
  /* ---------------------------------------------------------------- */
  function workFilter() {
    var root = $('[data-work-filter]');
    if (!root) return;
    var btns = $$('[data-work-filter-btn]', root);
    var items = $$('[data-work-category]');

    btns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var val = btn.getAttribute('data-work-filter-btn');
        btns.forEach(function (b) {
          var active = b === btn;
          b.classList.toggle('is-active', active);
          b.setAttribute('aria-selected', active ? 'true' : 'false');
          b.tabIndex = active ? 0 : -1;
        });
        items.forEach(function (item) {
          var show = val === 'all' || item.getAttribute('data-work-category') === val;
          item.hidden = !show;
        });
        if (!reduce) ScrollTrigger.refresh();
      });
    });
  }

  /* ---------------------------------------------------------------- */
  /* Case pages: floating "visit site" button while scrolling the case */
  /* ---------------------------------------------------------------- */
  function caseFloatCta() {
    var cta = $('[data-case-float-cta]');
    var cover = $('[data-cover]');
    if (!cta || !cover) return;
    var contact = $('#contact');

    ScrollTrigger.create({
      trigger: cover,
      start: 'bottom top',
      endTrigger: contact || undefined,
      end: contact ? 'top center' : 'max',
      onToggle: function (self) { cta.classList.toggle('is-visible', self.isActive); },
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
  /* Case pages: floating "visit site" button while reading the case    */
  /* ---------------------------------------------------------------- */
  function caseFloatCta() {
    var cta = $('[data-case-float-cta]');
    var cover = $('[data-cover]');
    if (!cta || !cover) return;
    var contact = $('#contact');

    // From the moment the cover has scrolled away until the contact block:
    // before that the button sits on top of the header that already has it,
    // after that the page asks the same thing in full size.
    ScrollTrigger.create({
      trigger: cover,
      start: 'bottom top',
      endTrigger: contact || undefined,
      end: contact ? 'top center' : 'max',
      onToggle: function (self) { cta.classList.toggle('is-visible', self.isActive); },
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
  /* Contactformulier: verstuurt via fetch en schuift dan een inkt-    */
  /* paneel over het formulier. Valt terug op een gewone POST als JS   */
  /* niet draait.                                                      */
  /* ---------------------------------------------------------------- */
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function contactForm() {
    var form = $('[data-cform]');
    if (!form) return;

    var root = form.closest('[data-cform-root]') || form.parentNode;
    var status = $('[data-cform-status]', form);
    var submit = $('[data-cform-submit]', form);
    var elapsed = $('[data-cform-elapsed]', form);
    var sent = $('[data-cform-sent]', root);
    var started = 0;
    var msg = function (key, fallback) { return form.getAttribute('data-msg-' + key) || fallback; };

    form.addEventListener('input', function (e) {
      // Duur sinds de eerste echte interactie; de server gebruikt ze om bots te
      // herkennen die het formulier in een oogwenk invullen.
      if (!started) started = Date.now();
      if (elapsed) elapsed.value = String(Date.now() - started);
      if (e.target.getAttribute('aria-invalid')) clearError(e.target.name);
    });

    /* -- Fouten ----------------------------------------------------- */
    function clearError(name) {
      var slot = $('[data-error-for="' + name + '"]', form);
      if (slot) {
        slot.hidden = true;
        slot.textContent = '';
      }
      if (form.elements[name]) form.elements[name].removeAttribute('aria-invalid');
    }

    function clearErrors() {
      ['naam', 'email', 'bericht'].forEach(clearError);
      if (status) status.hidden = true;
    }

    function showErrors(errors) {
      var first = null;
      Object.keys(errors || {}).forEach(function (name) {
        var slot = $('[data-error-for="' + name + '"]', form);
        var input = form.elements[name];
        if (slot) {
          slot.textContent = errors[name];
          slot.hidden = false;
        }
        if (input) {
          input.setAttribute('aria-invalid', 'true');
          if (!first) first = input;
        }
      });
      if (first) first.focus();
      return !!first;
    }

    // Dezelfde regels als mail.php, zodat je niet op de server hoeft te wachten
    // voor een vergeten veld. De server blijft de echte controle.
    function validate() {
      var errors = {};
      if (!form.elements.naam.value.trim()) errors.naam = msg('name', 'Vul je naam in.');
      if (!EMAIL_RE.test(form.elements.email.value.trim())) errors.email = msg('email', 'Vul een geldig e-mailadres in.');
      if (form.elements.bericht.value.trim().length < 10) errors.bericht = msg('message', 'Schrijf iets meer.');
      return errors;
    }

    function setStatus(text) {
      if (!status) return;
      status.textContent = text;
      status.className = 'cform__status';
      status.hidden = false;
    }

    /* -- Verzonden -------------------------------------------------- */
    function paint(n) {
      return n.toString(2).padStart(8, '0').split('')
        .map(function (b) { return b === '1' ? '<b>1</b>' : '0'; }).join('');
    }

    function showSent(instant) {
      if (!sent) return;
      var bitsEl = $('[data-sent-bits]', sent);
      var title = $('[data-sent-title]', sent);
      sent.hidden = false;
      form.inert = true;
      if (lenis && !instant) lenis.scrollTo(sent, { offset: -$('[data-nav]').offsetHeight, duration: 1.2 });

      if (reduce || instant) {
        bitsEl.innerHTML = paint(255);
        title.focus({ preventScroll: !!instant });
        return;
      }
      var counter = { v: 0 };
      bitsEl.innerHTML = paint(0);
      gsap.timeline()
        .fromTo(sent, { clipPath: 'inset(100% 0 0 0)' }, { clipPath: 'inset(0% 0 0 0)', duration: 0.9, ease: 'expo.inOut' })
        .to(counter, {
          v: 255,
          duration: 1.2,
          ease: 'power2.inOut',
          onUpdate: function () { bitsEl.innerHTML = paint(Math.round(counter.v)); },
        }, 0.35)
        .from($$('.sent__body > *', sent), { autoAlpha: 0, y: 30, stagger: 0.08, duration: 1, ease: 'expo.out' }, 0.9)
        // Pas focussen als de titel zichtbaar is; een verborgen element pakt geen focus.
        .add(function () { title.focus({ preventScroll: true }); }, 1.05);
    }

    function hideSent() {
      function done() {
        sent.hidden = true;
        gsap.set(sent, { clearProps: 'clipPath' });
        form.inert = false;
        form.elements.naam.focus();
      }
      form.reset();
      started = 0;
      if (elapsed) elapsed.value = '';
      if (reduce) return done();
      gsap.to(sent, { clipPath: 'inset(0 0 100% 0)', duration: 0.8, ease: 'expo.inOut', onComplete: done });
    }

    var again = $('[data-cform-again]', root);
    if (again) again.addEventListener('click', hideSent);

    /* -- Versturen -------------------------------------------------- */
    form.addEventListener('submit', function (e) {
      if (!window.fetch || !window.FormData) return; // laat de browser het gewoon posten
      e.preventDefault();
      clearErrors();
      if (showErrors(validate())) return;

      submit.disabled = true;
      var btnLabel = submit.querySelector('span');
      var original = btnLabel ? btnLabel.textContent : '';
      if (btnLabel) btnLabel.textContent = msg('sending', 'Versturen…');

      fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json', 'X-Requested-With': 'fetch' }
      })
        .then(function (r) { return r.json().catch(function () { return { ok: false, message: '' }; }); })
        .then(function (data) {
          if (data.ok) return showSent();
          showErrors(data.errors);
          setStatus(data.message || msg('fail', 'Er ging iets mis. Probeer het nog eens.'));
        })
        .catch(function () {
          setStatus(msg('offline', 'Er ging iets mis met de verbinding. Mail ons gerust op hello@2x8.be.'));
        })
        .then(function () {
          submit.disabled = false;
          if (btnLabel) btnLabel.textContent = original;
        });
    });

    // Terugkomen van de no-JS redirect: toon hetzelfde paneel of dezelfde melding.
    var params = new URLSearchParams(location.search);
    if (params.has('verzonden')) {
      showSent(true);
    } else if (params.has('fout')) {
      setStatus(msg('fail', 'Het versturen lukte niet. Mail ons gerust op hello@2x8.be.'));
    }
  }

  /* ---------------------------------------------------------------- */
  /* Onderwerpen: een project uit die categorie loopt mee met de muis  */
  /* ---------------------------------------------------------------- */
  function topicPeek() {
    var list = $('[data-topics]');
    var peek = $('[data-topic-peek]');
    if (!list || !peek) return;
    var topics = $$('.topic', list);

    // Binnenkomen: de regels schuiven één voor één omhoog uit hun lijn.
    if (!reduce) {
      gsap.from($$('.topic__name', list), {
        yPercent: 110,
        duration: 1.1,
        ease: 'expo.out',
        stagger: 0.06,
        scrollTrigger: { trigger: list, start: 'top 85%', once: true },
      });
    }

    if (reduce || !finePointer) return peek.remove();

    var img = $('img', peek);
    var loaded = false;
    var current = null;
    var xTo = gsap.quickTo(peek, 'x', { duration: 0.55, ease: 'power3' });
    var yTo = gsap.quickTo(peek, 'y', { duration: 0.55, ease: 'power3' });
    var lastX = 0;

    // De covers zijn groot; pas laden als iemand de lijst echt nadert.
    function preload() {
      if (loaded) return;
      loaded = true;
      topics.forEach(function (t) {
        var src = t.getAttribute('data-topic-img');
        if (src) new Image().src = src;
      });
    }
    list.addEventListener('pointerenter', preload);
    list.addEventListener('focusin', preload);

    function place(e, instant) {
      var w = peek.offsetWidth;
      var h = peek.offsetHeight;
      // Rechts van de cursor, tenzij daar geen plaats is.
      var x = e.clientX + 32 + w > window.innerWidth ? e.clientX - w - 32 : e.clientX + 32;
      var y = Math.min(Math.max(e.clientY - h / 2, 16), window.innerHeight - h - 16);
      if (instant) {
        gsap.set(peek, { x: x, y: y });
      } else {
        xTo(x);
        yTo(y);
      }
    }

    function show(topic, e) {
      var src = topic.getAttribute('data-topic-img');
      if (!src) return hide();
      var tilt = gsap.utils.clamp(-6, 6, (e.clientX - lastX) * 0.4);
      if (current === null) {
        place(e, true);
        img.src = src;
        gsap.fromTo(peek,
          { autoAlpha: 1, clipPath: 'inset(100% 0 0 0)', rotate: tilt },
          { clipPath: 'inset(0% 0 0 0)', rotate: 0, duration: 0.6, ease: 'expo.out', overwrite: 'auto' });
      } else if (current !== src) {
        // Van regel naar regel: het nieuwe beeld schuift over het oude.
        gsap.fromTo(img, { yPercent: 12, scale: 1.15 }, { yPercent: 0, scale: 1, duration: 0.6, ease: 'expo.out' });
        img.src = src;
      }
      current = src;
    }

    function hide() {
      if (current === null) return;
      current = null;
      gsap.to(peek, { clipPath: 'inset(0 0 100% 0)', duration: 0.45, ease: 'expo.inOut', overwrite: 'auto',
        onComplete: function () { gsap.set(peek, { autoAlpha: 0 }); } });
    }

    topics.forEach(function (topic) {
      topic.addEventListener('pointerenter', function (e) { show(topic, e); });
    });
    list.addEventListener('pointermove', function (e) {
      place(e);
      lastX = e.clientX;
    });
    list.addEventListener('pointerleave', hide);
  }

  /* ---------------------------------------------------------------- */
  /* Kopieer het mailadres                                             */
  /* ---------------------------------------------------------------- */
  function copyButtons() {
    $$('[data-copy]').forEach(function (btn) {
      if (!navigator.clipboard) return btn.remove();
      var labelEl = $('[data-copy-label]', btn) || btn;
      var original = labelEl.textContent;
      var timer = 0;
      btn.addEventListener('click', function () {
        navigator.clipboard.writeText(btn.getAttribute('data-copy')).then(function () {
          labelEl.textContent = btn.getAttribute('data-done') || original;
          btn.classList.add('is-done');
          clearTimeout(timer);
          timer = setTimeout(function () {
            labelEl.textContent = original;
            btn.classList.remove('is-done');
          }, 1800);
        });
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
    caseReels();
    caseFloatCta();
    nav();
    menu();
    caseFloatCta();
    workFilter();
    magnetic();
    wipeUp();
    parallaxDrift();
    hoverReels();
    fakeFinder();
    serviceTabs();
    serviceJumps();
    workFilter();
    counters();
    contactForm();
    topicPeek();
    copyButtons();

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
