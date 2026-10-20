/* Over ons: acht bits om zelf aan en uit te zetten. Bij het binnenkomen spellen ze 2, X en 8. */
(function () {
  "use strict";
  var speel = document.querySelector("[data-byte]");
  if (!speel) return;
  var S = window.X8site;
  var g = S && S.g;
  var bits = Array.prototype.slice.call(speel.querySelectorAll(".bit"));
  var uitGetal = speel.querySelector('[data-byte-uit="getal"]');
  var uitTeken = speel.querySelector('[data-byte-uit="teken"]');

  function waarde() {
    return bits.reduce(function (t, b) { return t + (b.getAttribute("aria-pressed") === "true" ? Number(b.dataset.waarde) : 0); }, 0);
  }
  function toon() {
    var w = waarde();
    uitGetal.textContent = w;
    uitTeken.textContent = w === 32 ? "spatie" : w > 32 && w < 127 ? String.fromCharCode(w) : "geen";
  }
  function zetBit(b, aan, vertraging) {
    if ((b.getAttribute("aria-pressed") === "true") === aan) return;
    b.setAttribute("aria-pressed", aan);
    b.querySelector(".bit__cijfer").textContent = aan ? "1" : "0";
    if (g) g.fromTo(b, { rotationY: 90 }, { rotationY: 0, duration: .5, delay: vertraging || 0, ease: "back.out(2)", transformPerspective: 600 });
  }
  function zet(w) {
    bits.forEach(function (b, i) { zetBit(b, (w & Number(b.dataset.waarde)) !== 0, i * .05); });
    toon();
  }

  bits.forEach(function (b) {
    b.addEventListener("click", function () { zetBit(b, b.getAttribute("aria-pressed") !== "true"); toon(); });
  });
  speel.querySelectorAll("[data-byte-zet]").forEach(function (k) {
    k.addEventListener("click", function () { zet(Number(k.dataset.byteZet)); });
  });

  if (!g) return;
  /* Eén keer 2, X, 8 laten zien als de byte in beeld komt */
  var io = new IntersectionObserver(function (items) {
    if (!items[0].isIntersecting) return;
    io.disconnect();
    zet(50);
    setTimeout(function () { zet(88); }, 1100);
    setTimeout(function () { zet(56); }, 2200);
    setTimeout(function () { zet(88); }, 3300);
  }, { threshold: .5 });
  io.observe(speel);
})();
