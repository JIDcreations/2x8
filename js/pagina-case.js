/* Casepagina: het grote beeld opent zich, de galerij beweegt mee, video's laden pas als ze in beeld komen. */
(function () {
  "use strict";
  var S = window.X8site;
  var stil = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Video's: pas laden in beeld. Zonder beweging geen autoplay, wel een play-knop. */
  Array.prototype.forEach.call(document.querySelectorAll("video[data-video]"), function (v) {
    var io = new IntersectionObserver(function (items) {
      var zicht = items[0].isIntersecting;
      if (zicht && !v.src) {
        v.src = v.dataset.video;
        if (stil) v.controls = true;
      }
      if (stil) return;
      if (zicht) { var p = v.play(); if (p && p.catch) p.catch(function () { v.controls = true; }); } else v.pause();
    }, { threshold: .25 });
    io.observe(v);
  });

  if (!S || !S.ST) return;
  var g = S.g;

  var cover = document.querySelector(".case-cover");
  if (cover) {
    var img = cover.querySelector("img");
    var tl = g.timeline({ scrollTrigger: { trigger: cover, start: "top 90%", end: "top 15%", scrub: .6 } });
    tl.fromTo(cover, { clipPath: "inset(6% 12% 6% 12% round 32px)" }, { clipPath: "inset(0% 0% 0% 0% round 32px)", ease: "none" });
    if (img) tl.fromTo(img, { scale: 1.2 }, { scale: 1, ease: "none" }, 0);
  }

  g.utils.toArray(".case-galerij__beeld img").forEach(function (b) {
    g.fromTo(b, { yPercent: -5, scale: 1.12 }, { yPercent: 5, scale: 1.12, ease: "none",
      scrollTrigger: { trigger: b.parentNode, start: "top bottom", end: "bottom top", scrub: true } });
  });

  g.utils.toArray(".case-blok").forEach(function (b) {
    g.from(b.children, { opacity: 0, y: 30, duration: .8, ease: S.zacht, stagger: .1,
      scrollTrigger: { trigger: b, start: "top 85%", once: true } });
  });
})();
