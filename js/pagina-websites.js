/* Websites: een site die zichzelf opbouwt terwijl je scrolt. Zonder beweging staat ze er meteen helemaal. */
(function () {
  "use strict";
  var browser = document.querySelector("[data-browser]");
  if (!browser) return;
  var stappen = Array.prototype.slice.call(document.querySelectorAll(".bouwer__stappen li"));

  function zet(n) {
    if (browser.dataset.stap === String(n)) return;
    browser.dataset.stap = n;
    stappen.forEach(function (li, i) {
      li.classList.toggle("aan", i < n);
      li.classList.toggle("nu", i === n - 1);
    });
  }

  var S = window.X8site;
  if (!S || !document.documentElement.classList.contains("beweeg")) { zet(4); return; }

  zet(1);
  /* Op een groot scherm staat het beeld vast en bepaalt het scrollen de stap */
  if (S.ST && matchMedia("(min-width: 901px)").matches) {
    S.ST.create({ trigger: ".bouwer", start: "top top", end: "bottom bottom",
      onUpdate: function (s) { zet(Math.min(4, 1 + Math.floor(s.progress * 4))); } });
    return;
  }
  /* Op een gsm loopt het zelf, zodra de browser in beeld komt */
  var io = new IntersectionObserver(function (items) {
    if (!items[0].isIntersecting) return;
    io.disconnect();
    var n = 1;
    var klok = setInterval(function () { zet(++n); if (n >= 4) clearInterval(klok); }, 1100);
  }, { threshold: .5 });
  io.observe(browser);
})();
