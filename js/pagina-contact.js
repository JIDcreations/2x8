/* Contact: het formulier verstuurt via mail.php, en het paneel ernaast toont live wat er met je aanvraag gebeurt. */
(function () {
  "use strict";
  var form = document.getElementById("formulier");
  if (!form) return;
  var S = window.X8site;
  var g = S && S.g;
  var melding = form.querySelector("[data-melding]");
  var knop = form.querySelector('button[type="submit"]');
  var volg = document.querySelector("[data-volg]");
  var stappen = volg ? Array.prototype.slice.call(volg.querySelectorAll("[data-volg-stap]")) : [];
  var KLEUR = { "Website": "oranje", "Tools": "hemel", "Gratis pilot": "limoen", "Iets anders": "zon" };
  var eersteToets = 0;

  function meld(tekst, ok) {
    melding.textContent = tekst;
    melding.className = "melding " + (ok ? "is-ok" : "is-fout");
    melding.hidden = false;
  }

  /* Na een verzending zonder JavaScript komt mail.php terug met ?verzonden=1 of ?fout=1 */
  if (/[?&]verzonden=1/.test(location.search)) meld("Bedankt, je bericht is verstuurd. Je hoort van ons binnen twee werkdagen.", true);
  if (/[?&]fout=1/.test(location.search)) meld("Het versturen lukte niet. Mail ons gerust rechtstreeks op hello@2x8.be.", false);

  function geldig(naam) {
    var v = form.elements[naam].value.trim();
    if (naam === "email") return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
    if (naam === "bericht") return v.length >= 10;
    return v.length > 0;
  }
  var FOUT = { naam: "Vul je naam in.", email: "Vul een geldig e-mailadres in.", bericht: "Schrijf iets meer, zodat we je goed kunnen antwoorden." };
  function toonFout(naam, tekst) {
    var veld = form.elements[naam].closest(".veld");
    veld.classList.toggle("is-fout", !!tekst);
    veld.querySelector("[data-fout]").textContent = tekst || "";
  }

  function zetStap(n) {
    stappen.forEach(function (li, i) {
      var aan = i < n;
      if (aan && !li.classList.contains("aan") && g) g.fromTo(li, { x: -10 }, { x: 0, duration: .5, ease: "back.out(2)" });
      li.classList.toggle("aan", aan);
    });
  }

  function volgBij() {
    if (!volg) return;
    var naam = form.elements.naam.value.trim();
    var bedrijf = form.elements.bedrijf.value.trim();
    var type = form.querySelector('input[name="type"]:checked').value;
    volg.querySelector("[data-volg-naam]").textContent = naam || "Jouw naam";
    volg.querySelector("[data-volg-bedrijf]").textContent = bedrijf || "Je bedrijf";
    var chip = volg.querySelector("[data-volg-type]");
    if (chip.textContent !== type) {
      chip.textContent = type;
      chip.className = "x8-chip x8-k-" + KLEUR[type];
      if (g) g.fromTo(chip, { scale: .7 }, { scale: 1, duration: .5, ease: "back.out(3)" });
    }
    zetStap(geldig("naam") && geldig("email") && geldig("bericht") ? 1 : 0);
  }

  form.addEventListener("input", function (e) {
    if (!eersteToets) eersteToets = Date.now();
    if (e.target.name in FOUT && geldig(e.target.name)) toonFout(e.target.name, "");
    volgBij();
  });
  form.addEventListener("change", volgBij);
  volgBij();

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var fouten = ["naam", "email", "bericht"].filter(function (n) { return !geldig(n); });
    ["naam", "email", "bericht"].forEach(function (n) { toonFout(n, fouten.indexOf(n) >= 0 ? FOUT[n] : ""); });
    if (fouten.length) { form.elements[fouten[0]].focus(); return; }

    form.elements.duur.value = eersteToets ? Date.now() - eersteToets : 0;
    knop.disabled = true;
    fetch(form.action, { method: "POST", body: new FormData(form), headers: { Accept: "application/json", "X-Requested-With": "fetch" } })
      .then(function (r) { return r.json().catch(function () { return { ok: false }; }); })
      .then(function (data) {
        if (data.ok) {
          meld("Bedankt, je bericht is verstuurd. Je hoort van ons binnen twee werkdagen.", true);
          form.reset();
          volgBij();
          zetStap(1);
          [2, 3, 4].forEach(function (n, i) { setTimeout(function () { zetStap(n); }, 400 * (i + 1)); });
          return;
        }
        Object.keys(data.errors || {}).forEach(function (n) { if (n in FOUT) toonFout(n, data.errors[n]); });
        meld(data.message || "Het versturen lukte niet. Mail ons gerust rechtstreeks op hello@2x8.be.", false);
      })
      .catch(function () { meld("Het versturen lukte niet. Mail ons gerust rechtstreeks op hello@2x8.be.", false); })
      .then(function () { knop.disabled = false; melding.scrollIntoView({ block: "center", behavior: "smooth" }); });
  });
})();
