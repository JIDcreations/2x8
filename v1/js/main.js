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
      gsap.fromTo(
        $('img', cover),
        { scale: 1.25 },
        { scale: 1, ease: 'none', scrollTrigger: { trigger: cover, start: 'top 90%', end: 'bottom top', scrub: true } }
      );
    }
  }

  /* ---------------------------------------------------------------- */
  /* Work: vertical scroll drives a horizontal track                   */
  /* ---------------------------------------------------------------- */
  function workTrack() {
    var section = $('[data-hscroll]');
    if (!section) return;
    var track = $('[data-hscroll-track]', section);
    var bar = $('[data-hscroll-progress]', section);

    gsap.matchMedia().add('(min-width: 900px) and (prefers-reduced-motion: no-preference)', function () {
      var distance = function () { return Math.max(0, track.scrollWidth - window.innerWidth); };
      var st = {
        trigger: section,
        start: 'top top',
        end: function () { return '+=' + distance(); },
        scrub: 1,
        invalidateOnRefresh: true,
      };
      gsap.to(track, { x: function () { return -distance(); }, ease: 'none', scrollTrigger: Object.assign({}, st, { pin: true }) });
      if (bar) {
        gsap.fromTo(bar, { scaleX: 0 }, { scaleX: 1, ease: 'none', scrollTrigger: Object.assign({}, st, { scrub: true }) });
      }
    });
  }

  /* ---------------------------------------------------------------- */
  /* Marquee: speeds up with scroll velocity                           */
  /* ---------------------------------------------------------------- */
  function marquee() {
    var el = $('[data-marquee]');
    if (!el || reduce) return;
    var track = $('[data-marquee-track]', el);
    var loop = gsap.to(track, { xPercent: -50, ease: 'none', duration: 40, repeat: -1 });

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
    // Pinned sections first so later triggers measure the pin spacing
    workTrack();
    textReveals();
    marquee();
    nav();
    menu();
    magnetic();

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
