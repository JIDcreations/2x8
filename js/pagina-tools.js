/* Tools: een routeplanner die echt rekent. Klanten aan of uit, de route en het uur van terugkomst volgen. */
(function () {
  "use strict";
  var demo = document.querySelector("[data-route]");
  if (!demo) return;

  var S = window.X8site;
  var g = S && S.g;
  var VERTREK = 8 * 60;          /* 8:00, in minuten */
  var MIN_PER_EENHEID = 0.45;    /* rijtijd per eenheid op de kaart, voor de demo */

  var vak = demo.querySelector(".route__pins");
  var lijn = demo.querySelector(".route__lijn");
  var lijst = demo.querySelector(".route__volgorde");
  var uitAantal = demo.querySelector('[data-route-uit="aantal"]');
  var uitTerug = demo.querySelector('[data-route-uit="terug"]');
  var start = { x: Number(vak.dataset.startX), y: Number(vak.dataset.startY) };

  var klanten = Array.prototype.map.call(demo.querySelectorAll("tbody tr"), function (tr) {
    var pin = document.createElement("span");
    pin.className = "route__pin";
    pin.style.left = tr.dataset.x + "%";
    pin.style.top = tr.dataset.y + "%";
    vak.appendChild(pin);
    return {
      tr: tr, pin: pin, mee: true,
      naam: tr.cells[0].textContent,
      minuten: parseInt(tr.cells[1].textContent, 10),
      x: Number(tr.dataset.x), y: Number(tr.dataset.y),
      knop: tr.querySelector(".route__aan")
    };
  });

  var startPin = document.createElement("span");
  startPin.className = "route__start";
  startPin.style.left = start.x + "%";
  startPin.style.top = start.y + "%";
  startPin.innerHTML = demo.querySelector(".route__sheet-vak").innerHTML.replace("#document-text", "#map-arrow-square");
  vak.appendChild(startPin);

  function afstand(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }

  /* Dichtste klant eerst: eenvoudig, snel en voor een ronde van een handvol klanten goed genoeg */
  function plan() {
    var over = klanten.filter(function (k) { return k.mee; });
    var route = [], hier = start, rijden = 0;
    while (over.length) {
      over.sort(function (a, b) { return afstand(hier, a) - afstand(hier, b); });
      var k = over.shift();
      rijden += afstand(hier, k) * MIN_PER_EENHEID;
      route.push(k);
      hier = k;
    }
    if (route.length) rijden += afstand(hier, start) * MIN_PER_EENHEID;
    var bezoek = route.reduce(function (t, k) { return t + k.minuten; }, 0);
    return { route: route, terug: VERTREK + Math.round(rijden + bezoek) };
  }

  function uur(min) { return Math.floor(min / 60) + ":" + String(min % 60).padStart(2, "0"); }

  function punten(route, t) {
    var p = [start].concat(route, route.length ? [start] : []);
    if (t >= 1 || p.length < 2) return p;
    var lengtes = [], totaal = 0;
    for (var i = 1; i < p.length; i++) { lengtes.push(afstand(p[i - 1], p[i])); totaal += lengtes[i - 1]; }
    var doel = totaal * t, uit = [p[0]];
    for (var j = 1; j < p.length; j++) {
      if (doel >= lengtes[j - 1]) { doel -= lengtes[j - 1]; uit.push(p[j]); continue; }
      var f = doel / lengtes[j - 1];
      uit.push({ x: p[j - 1].x + (p[j].x - p[j - 1].x) * f, y: p[j - 1].y + (p[j].y - p[j - 1].y) * f });
      break;
    }
    return uit;
  }

  function teken(lijst) { lijn.setAttribute("points", lijst.map(function (p) { return p.x + "," + p.y; }).join(" ")); }

  var tween;
  function toon(animeer) {
    var r = plan();
    klanten.forEach(function (k) {
      var nr = r.route.indexOf(k);
      k.pin.textContent = nr < 0 ? "" : nr + 1;
      k.pin.classList.toggle("is-uit", !k.mee);
      k.tr.classList.toggle("is-uit", !k.mee);
      k.knop.setAttribute("aria-pressed", k.mee);
      k.knop.textContent = k.mee ? "Mee" : "Niet";
    });
    uitAantal.textContent = r.route.length;
    uitTerug.textContent = uur(r.terug);
    lijst.innerHTML = r.route.map(function (k, i) { return "<li><span>" + (i + 1) + ". " + k.naam + "</span><span>" + k.minuten + " min</span></li>"; }).join("");

    if (tween) tween.kill();
    if (!g || !animeer) { teken(punten(r.route, 1)); return; }
    var stand = { t: 0 }, bereikt = 0, stops = r.route.length + 1;
    tween = g.to(stand, { t: 1, duration: .5 + r.route.length * .28, ease: "power1.inOut",
      onUpdate: function () {
        teken(punten(r.route, stand.t));
        var nu = Math.floor(stand.t * stops);
        while (bereikt < Math.min(nu, r.route.length)) {
          g.fromTo(r.route[bereikt].pin, { scale: .4 }, { scale: 1, duration: .5, ease: "back.out(3)" });
          bereikt++;
        }
      } });
    g.fromTo(uitTerug.parentNode, { scale: .96 }, { scale: 1, duration: .5, ease: "back.out(2)" });
  }

  klanten.forEach(function (k) {
    k.knop.addEventListener("click", function () { k.mee = !k.mee; toon(true); });
  });

  toon(false);
  if (g) {
    teken([start]);
    var io = new IntersectionObserver(function (items) {
      if (items[0].isIntersecting) { io.disconnect(); toon(true); }
    }, { threshold: .4 });
    io.observe(demo);
  }
})();
