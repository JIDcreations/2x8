/* 2x8.be: alle gedrag van de homepage. De pagina is volledig leesbaar zonder dit bestand. */
(function () {
  "use strict";

  var d = document.documentElement;
  var stil = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var muis = matchMedia("(hover: hover) and (pointer: fine)").matches;
  var g = window.gsap;
  var veer = "back.out(1.4)";
  var zacht = "power3.out";

  if (window.X8) X8.mount();

  /* ---------- Menu op kleine schermen ---------- */
  (function () {
    var knop = document.querySelector(".nav__menu");
    var menu = document.getElementById("menu");
    if (!knop || !menu) return;
    function zet(open) {
      knop.setAttribute("aria-expanded", open);
      knop.textContent = open ? "Sluit" : "Menu";
      menu.hidden = !open;
      if (open && g && !stil) g.fromTo(menu.querySelectorAll(".x8-rij"), { opacity: 0, x: -24 }, { opacity: 1, x: 0, duration: .45, stagger: .05, ease: "power3.out" });
    }
    knop.addEventListener("click", function () { zet(menu.hidden); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !menu.hidden) { zet(false); knop.focus(); } });
  })();

  /* ---------- Rekenmodule: hoeveel tijd verlies jij? ---------- */
  (function () {
    var form = document.getElementById("rekenmodule");
    if (!form) return;
    var WEKEN = 46, UREN_PER_DAG = 8;
    var nl1 = new Intl.NumberFormat("nl-BE", { maximumFractionDigits: 1 });
    var nl0 = new Intl.NumberFormat("nl-BE", { maximumFractionDigits: 0 });
    var uit = {};
    form.querySelectorAll("[data-uit]").forEach(function (el) { uit[el.dataset.uit] = { el: el, nu: null }; });
    var toon = {};
    form.querySelectorAll("[data-toon]").forEach(function (el) { toon[el.dataset.toon] = el; });
    var eenheid = { offertes: "", minuten: " min", overtypen: " u", tarief: " euro" };

    function vul(input) {
      var p = (input.value - input.min) / (input.max - input.min) * 100;
      input.style.setProperty("--p", p + "%");
      toon[input.name].textContent = input.value + eenheid[input.name];
    }

    function zet(naam, doel, fmt) {
      var o = uit[naam];
      if (stil || o.nu === null) { o.nu = doel; o.el.textContent = fmt.format(doel); return; }
      var van = o.nu, start = performance.now(), duur = 420;
      o.nu = doel;
      cancelAnimationFrame(o.raf);
      (function stap(t) {
        var k = Math.min(1, (t - start) / duur);
        var e = 1 - Math.pow(1 - k, 3);
        o.el.textContent = fmt.format(van + (doel - van) * e);
        if (k < 1) o.raf = requestAnimationFrame(stap);
      })(start);
    }

    function reken() {
      var f = form.elements;
      var minPerWeek = f.offertes.value * f.minuten.value + f.overtypen.value * 60;
      var week = minPerWeek / 60;
      var jaar = Math.round(week * WEKEN);
      zet("week", week, nl1);
      zet("jaar", jaar, nl0);
      zet("dagen", Math.round(jaar / UREN_PER_DAG), nl0);
      zet("kost", Math.round(jaar * f.tarief.value / 10) * 10, nl0);
    }

    form.querySelectorAll("input[type=range]").forEach(function (input) {
      vul(input);
      input.addEventListener("input", function () { vul(input); reken(); });
    });
    reken();

    /* Een widget wipt even op als zijn cijfer verandert */
    if (g && !stil) {
      form.addEventListener("input", function () {
        g.fromTo(form.querySelectorAll(".tijd__bento .x8-widget:not(.tijd__uitleg)"),
          { scale: 1 }, { scale: 1.025, duration: .12, yoyo: true, repeat: 1, ease: "power2.out", stagger: .03, overwrite: "auto" });
      });
    }
  })();

  /* ---------- Offerte-demo: een formulier maakt zelf een offerte ---------- */
  (function () {
    var demo = document.querySelector("[data-demo]");
    if (!demo) return;
    var velden = demo.querySelectorAll("[data-typ]");
    var log = demo.querySelectorAll(".demo__log li");
    var lijnen = demo.querySelectorAll("[data-lijn]");
    var klaar = demo.querySelector(".demo__klaar");
    var schakel = demo.querySelector(".demo__schakel");
    var knop = document.querySelector(".demo__opnieuw");
    var bezig = false;
    if (stil) return; /* zonder beweging blijft de ingevulde eindstand staan */

    function wacht(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
    function zichtbaar(el, aan) { el.style.opacity = aan ? 1 : 0; }

    function leeg() {
      velden.forEach(function (v) { v.textContent = ""; v.classList.remove("typt"); });
      log.forEach(function (l) { l.style.opacity = .25; });
      lijnen.forEach(function (l) { zichtbaar(l, false); });
      zichtbaar(klaar, false);
    }

    function typ(el) {
      var tekst = el.dataset.typ, i = 0;
      el.classList.add("typt");
      return new Promise(function (r) {
        (function volgende() {
          el.textContent = tekst.slice(0, ++i);
          if (i < tekst.length) setTimeout(volgende, 38 + Math.random() * 40);
          else setTimeout(function () { el.classList.remove("typt"); r(); }, 160);
        })();
      });
    }

    function verschijn(el) {
      if (g) g.fromTo(el, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: .45, ease: veer });
      else zichtbaar(el, true);
    }

    async function speel() {
      if (bezig) return;
      bezig = true;
      knop.hidden = true;
      leeg();
      await wacht(300);
      for (var i = 0; i < velden.length; i++) await typ(velden[i]);
      await wacht(250);
      if (g) g.to(schakel, { rotation: "+=360", duration: 1.6, ease: "power2.inOut" });
      for (var j = 0; j < log.length; j++) {
        log[j].style.opacity = 1;
        if (j < 3) verschijn(lijnen[j]);
        await wacht(380);
      }
      verschijn(lijnen[3]);
      await wacht(250);
      verschijn(klaar);
      if (g) g.fromTo(klaar, { scale: .8 }, { scale: 1, duration: .5, ease: "back.out(2.2)" });
      bezig = false;
      knop.hidden = false;
    }

    knop.addEventListener("click", speel);
    leeg();
    var io = new IntersectionObserver(function (items) {
      if (items[0].isIntersecting) { io.disconnect(); speel(); }
    }, { threshold: .45 });
    io.observe(demo);
  })();

  /* ---------- Alles hieronder is beweging met GSAP ---------- */
  if (!g || stil || !window.ScrollTrigger) { d.classList.remove("anim", "beweeg"); if (!g || stil) return; }
  var ST = window.ScrollTrigger;
  if (ST) g.registerPlugin(ST);
  var alle = function (sel) { return g.utils.toArray(sel); };

  /* Gedeeld met de scripts per pagina (js/pagina-*.js), die na dit bestand laden */
  window.X8site = { g: g, ST: ST, veer: veer, zacht: zacht, muis: muis };

  /* Intro: kop, tekst en tegels die een voor een invallen. Elke pagina markeert haar kop met .intro */
  var lijnen = alle(".intro .lijn > span");
  var tegels = alle(".intro .x8-tegel");
  var intro = g.timeline({ defaults: { ease: zacht } });
  if (lijnen.length) intro.fromTo(lijnen, { opacity: 1, yPercent: 105 }, { yPercent: 0, duration: .9, stagger: .12, ease: "power4.out" });
  if (alle(".intro [data-in]").length) intro.fromTo(".intro [data-in]", { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: .7, stagger: .08 }, "-=.6");
  if (tegels.length) intro.fromTo(tegels, { opacity: 0, y: 70, scale: .86, rotation: function () { return g.utils.random(-8, 8); } },
    { opacity: 1, y: 0, scale: 1, rotation: 0, duration: .8, ease: veer, stagger: .06 }, "-=.9");
  intro.add(function () { d.classList.remove("anim"); });

  /* Tegels die meebewegen met de cursor: de hero-tegels en alles met data-kantel */
  if (muis) {
    alle(".hero__tegels .x8-tegel, [data-kantel]").forEach(function (t) {
      var rx = g.quickTo(t, "rotationX", { duration: .5, ease: "power3" });
      var ry = g.quickTo(t, "rotationY", { duration: .5, ease: "power3" });
      var tz = g.quickTo(t, "z", { duration: .5, ease: "power3" });
      g.set(t, { transformPerspective: 900 });
      t.addEventListener("pointermove", function (e) {
        var r = t.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - .5;
        var y = (e.clientY - r.top) / r.height - .5;
        var k = Number(t.dataset.kantel) || 18;
        ry(x * k); rx(-y * k); tz(30);
      });
      t.addEventListener("pointerleave", function () { rx(0); ry(0); tz(0); });
    });
  }

  if (!ST) return;

  /* Hero: de kolommen tegels schuiven tegen elkaar in bij het scrollen */
  if (document.querySelector(".hero__tegels")) {
    [["kol--1", -40], ["kol--2", -110], ["kol--3", -70]].forEach(function (k) {
      g.to(".hero__tegels ." + k[0], { y: "+=" + k[1], ease: "none",
        scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: .6 } });
    });
  }

  /* Herken je dit? Het beeld staat vast, de zin en de tegel wisselen terwijl je scrolt */
  var pijn = alle(".pijn__item");
  if (pijn.length) {
    var teller = document.querySelector(".pijn__teller span");
    var nu = 0;
    pijn[0].classList.add("nu");
    var toon = function (i) {
      if (i === nu) return;
      var r = i > nu ? 1 : -1, oud = pijn[nu], nieuw = pijn[i];
      nu = i;
      teller.textContent = i + 1;
      g.to(oud.querySelector(".pijn__zin"), { yPercent: -35 * r, opacity: 0, duration: .3, ease: "power2.in", overwrite: true });
      g.to(oud.querySelector(".pijn__tegel"), { rotationY: -80 * r, scale: .9, opacity: 0, duration: .3, ease: "power2.in", overwrite: true,
        onComplete: function () { if (pijn[nu] !== oud) oud.classList.remove("nu"); } });
      nieuw.classList.add("nu");
      g.fromTo(nieuw.querySelector(".pijn__zin"), { yPercent: 35 * r, opacity: 0 }, { yPercent: 0, opacity: 1, duration: .6, delay: .12, ease: zacht, overwrite: true });
      g.fromTo(nieuw.querySelector(".pijn__tegel"), { rotationY: 80 * r, scale: .9, opacity: 0 }, { rotationY: 0, scale: 1, opacity: 1, duration: .7, delay: .16, ease: veer, overwrite: true });
    };
    ST.create({ trigger: pijn[0].closest(".pijn"), start: "top top", end: "bottom bottom",
      onUpdate: function (s) { toon(Math.min(pijn.length - 1, Math.floor(s.progress * pijn.length))); } });
  }

  /* Blokken die zacht invallen */
  alle(".kop-blok, .tijd__regelaars, .tijd__bento .x8-widget, .pijler, .demo__raster > *, .pilot, .case, .persoon, .over__tekst, .contact__vlak, [data-reveal]").forEach(function (el) {
    g.from(el, { opacity: 0, y: 40, duration: .8, ease: zacht,
      scrollTrigger: { trigger: el, start: "top 88%", once: true } });
  });

  /* Lijst-rijen: het kleurvak draait binnen */
  alle(".x8-lijst .x8-rij__vak").forEach(function (vak) {
    g.from(vak, { rotation: -90, scale: .4, duration: .7, ease: veer,
      scrollTrigger: { trigger: vak, start: "top 90%", once: true } });
  });

  /* Werk: het beeld opent zich terwijl je scrolt */
  alle(".case__beeld").forEach(function (b) {
    var img = b.querySelector("img");
    var tl = g.timeline({ scrollTrigger: { trigger: b, start: "top 95%", end: "top 40%", scrub: .6 } });
    tl.fromTo(b, { clipPath: "inset(10% 8% 10% 8% round 32px)" }, { clipPath: "inset(0% 0% 0% 0% round 32px)", ease: "none" });
    if (img) tl.fromTo(img, { scale: 1.18 }, { scale: 1, ease: "none" }, 0);
  });

  /* Eigen werking: de stappen van onze flow lichten na elkaar op */
  alle(".case__flow").forEach(function (f) {
    g.from(f.querySelectorAll(".flow__stap"), { y: 30, opacity: 0, scale: .8, duration: .6, ease: veer, stagger: .1,
      scrollTrigger: { trigger: f, start: "top 80%", once: true } });
  });

  /* Contact: de pijl draait mee met het scrollen */
  alle(".contact__symbool").forEach(function (s) {
    g.fromTo(s, { rotation: -45 }, { rotation: 0, ease: "none",
      scrollTrigger: { trigger: s.closest("section") || s, start: "top bottom", end: "center center", scrub: .6 } });
  });

  /* Voet: het logo staat letter per letter op */
  if (document.querySelector(".voet__logo")) {
    g.from(".voet__logo path", { yPercent: 110, duration: 1, ease: "power4.out", stagger: .1,
      scrollTrigger: { trigger: ".voet__logo", start: "top 95%", once: true } });
  }

  window.addEventListener("load", function () { ST.refresh(); });
})();
