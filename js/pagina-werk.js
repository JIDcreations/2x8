/* Werk: filteren op Websites of Tools. De kaarten schuiven naar hun nieuwe plek (GSAP Flip). */
(function () {
  "use strict";
  var raster = document.querySelector("[data-werk]");
  var filter = document.querySelector(".filter");
  if (!raster || !filter) return;
  filter.hidden = false;

  var S = window.X8site;
  var Flip = window.Flip;
  if (S && Flip) S.g.registerPlugin(Flip);
  var kaarten = Array.prototype.slice.call(raster.querySelectorAll(".case"));
  var knoppen = Array.prototype.slice.call(filter.querySelectorAll("[data-filter]"));

  /* Staat de laatste kaart alleen op haar rij, dan krijgt ze de brede vorm */
  function schik() {
    var zicht = kaarten.filter(function (c) { return !c.classList.contains("is-weg") && !c.classList.contains("case--breed"); });
    kaarten.forEach(function (c) { c.classList.remove("case--rest"); });
    if (zicht.length % 2) zicht[zicht.length - 1].classList.add("case--rest");
  }

  function kies(soort, animeer) {
    var staat = S && Flip && animeer ? Flip.getState(kaarten) : null;
    knoppen.forEach(function (k) { k.setAttribute("aria-pressed", k.dataset.filter === soort); });
    kaarten.forEach(function (c) { c.classList.toggle("is-weg", !!soort && c.dataset.soort !== soort); });
    schik();
    if (!staat) return;
    Flip.from(staat, {
      duration: .7, ease: "power3.inOut", absolute: true, nested: true,
      onEnter: function (els) { return S.g.fromTo(els, { opacity: 0, scale: .85 }, { opacity: 1, scale: 1, duration: .6, ease: S.veer }); },
      onLeave: function (els) { return S.g.to(els, { opacity: 0, scale: .85, duration: .35 }); },
      onComplete: function () { if (S.ST) S.ST.refresh(); }
    });
  }

  knoppen.forEach(function (k) {
    k.addEventListener("click", function () {
      kies(k.dataset.filter, true);
      history.replaceState(null, "", k.dataset.filter ? "#" + k.dataset.filter : location.pathname);
    });
  });

  var start = location.hash.slice(1);
  if (start === "websites" || start === "tools") kies(start, false); else schik();
})();
