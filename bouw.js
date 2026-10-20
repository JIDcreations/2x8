#!/usr/bin/env node
/*
 * 2X8: bouwt de gedeelde stukken van de site. Draai `node bouw.js` na elke wijziging aan
 * data/cases.json of aan de nav, footer en het contactblok hieronder.
 *
 * - Zet nav, contactblok en footer in elke pagina, tussen <!-- nav:start --> en <!-- nav:end -->,
 *   <!-- cta:start --> en <!-- cta:end -->, <!-- voet:start --> en <!-- voet:end -->.
 * - Schrijft een casepagina per case naar work/<slug>.html (dezelfde URL's als V1).
 * - Vult het raster op werk.html tussen <!-- cases:start --> en <!-- cases:end -->.
 *
 * De server bouwt niets: wat dit script schrijft, wordt mee gecommit.
 */
"use strict";
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const cases = JSON.parse(fs.readFileSync(path.join(ROOT, "data/cases.json"), "utf8"));
const PAGINAS = ["index.html", "websites.html", "tools.html", "werk.html", "over-ons.html", "contact.html"];
const SITE = "https://2x8.be";
/* De cases op de homepage, in deze volgorde. De eerste staat breed. */
const HOME = ["2x8-zelf", "studio-klei", "huiskamer", "elevator-antwerp", "salon-dola"];

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const icoon = (naam, p) => `<svg class="icoon" aria-hidden="true"><use href="${p}design-system/iconen/solar.svg#${naam}"></use></svg>`;
const KLEUR = { websites: "oranje", tools: "hemel" };
const SOORT = { websites: "Websites", tools: "Tools" };

/* ---------- Gedeelde stukken ---------- */

const MENU = [
  ["websites.html", "Websites", "oranje", "monitor-smartphone"],
  ["tools.html", "Tools", "hemel", "widget-5"],
  ["werk.html", "Werk", "limoen", "graph-up"],
  ["over-ons.html", "Over ons", "violet", "users-group-two-rounded"],
  ["contact.html", "Contact", "zon", "letter"],
];

function nav(p, huidig) {
  const links = MENU.slice(0, 4).map(([href, naam]) =>
    `<a href="${p}${href}"${href === huidig ? ' aria-current="page"' : ""}>${naam}</a>`).join("\n        ");
  const rijen = MENU.map(([href, naam, kleur, ic]) =>
    `<a class="x8-rij" href="${p}${href}"${href === huidig ? ' aria-current="page"' : ""}><span class="x8-rij__woord">${naam}</span><span class="x8-rij__vak x8-k-${kleur}">${icoon(ic, p)}</span></a>`).join("\n        ");
  return `<header class="nav">
    <div class="nav__in">
      <a class="nav__logo" href="${p}index.html" aria-label="2X8, naar de homepage">
        <span class="x8-logo x8-logo--klein" data-logo><img src="${p}design-system/logo/2x8-logo-inkt.svg" alt="2X8" width="109" height="28"></span>
      </a>
      <nav class="nav__links" aria-label="Hoofdmenu">
        ${links}
      </nav>
      <a class="x8-knop x8-knop--kleur nav__knop" href="${p}contact.html">Plan een gesprek</a>
      <button class="nav__menu" type="button" aria-expanded="false" aria-controls="menu">Menu</button>
    </div>
    <div class="menu" id="menu" hidden>
      <nav class="x8-lijst menu__lijst" aria-label="Menu">
        ${rijen}
      </nav>
    </div>
  </header>`;
}

function cta(p) {
  return `<section class="sectie contact" aria-labelledby="cta-kop">
      <div class="wrap">
        <div class="contact__vlak x8-k-zon">
          <div class="contact__tekst">
            <p class="t-label">Contact</p>
            <h2 id="cta-kop" class="contact__kop">Waar verlies <strong>jij</strong> tijd?</h2>
            <p class="t-lead">Plan een gesprek van een half uur. Je krijgt antwoord binnen twee werkdagen.</p>
            <div class="knoppen">
              <a class="x8-knop contact__knop" href="${p}contact.html">Plan een gesprek <span class="x8-knop__symbool" data-symbool="pijl-rechts" data-dikte="18"></span></a>
              <a class="x8-knop x8-knop--rand" href="mailto:hello@2x8.be">hello@2x8.be</a>
            </div>
          </div>
          <span class="contact__symbool" aria-hidden="true">${icoon("round-arrow-right-up", p)}</span>
        </div>
      </div>
    </section>`;
}

function voet(p) {
  return `<footer class="voet">
    <div class="wrap">
      <div class="voet__rij">
        <nav class="voet__links" aria-label="Footer">
          ${MENU.map(([href, naam]) => `<a href="${p}${href}">${naam}</a>`).join("\n          ")}
        </nav>
        <p class="t-label">Gent, België. <a href="mailto:hello@2x8.be">hello@2x8.be</a></p>
      </div>
      <span class="x8-logo voet__logo" data-logo><img src="${p}design-system/logo/2x8-logo-inkt.svg" alt="2X8" width="1596" height="412"></span>
      <p class="t-label voet__klein">&copy; 2026 2X8. Alle rechten voorbehouden. Iconen: <a href="https://www.figma.com/community/file/1166831539721848736">Solar</a> van 480 Design, CC BY 4.0.</p>
    </div>
  </footer>`;
}

function vervang(html, naam, inhoud) {
  const re = new RegExp(`(<!-- ${naam}:start -->)[\\s\\S]*?(<!-- ${naam}:end -->)`);
  return re.test(html) ? html.replace(re, `$1\n  ${inhoud}\n  $2`) : html;
}

/* ---------- Werk: een kaart per case ---------- */

function flow(p) {
  const stappen = [["zon", "letter", "Aanvraag"], ["hemel", "bill-list", "Offerte"], ["violet", "notebook", "Notion"], ["salie", "check-circle", "Akkoord"], ["limoen", "bill-check", "Factuur"]];
  return stappen.map(([k, ic, w]) => `<span class="flow__stap x8-k-${k}"><span>${icoon(ic, p)}</span>${w}</span>`)
    .join(`\n              <span class="flow__pijl" data-symbool="pijl-rechts"></span>\n              `);
}

function chips(c) {
  return `<span class="x8-chip x8-k-${KLEUR[c.soort]}">${esc(c.label)}</span>` + (c.eigen ? ` <span class="x8-chip">Eigen project</span>` : "");
}

function kaart(c, p, breed) {
  const href = `${p}work/${c.slug}.html`;
  const beeld = c.flow
    ? `<a class="case__beeld case__flow" href="${href}" aria-label="${esc(c.naam)}">\n              ${flow(p)}\n            </a>`
    : `<a class="case__beeld" href="${href}"><img src="${p}${c.cover.src}" alt="${esc(c.cover.alt)}" width="${c.cover.w}" height="${c.cover.h}" loading="lazy" decoding="async"></a>`;
  return `<article class="case${breed ? " case--breed" : ""}" data-soort="${c.soort}">
            ${beeld}
            <div class="case__info">
              <h3 class="case__naam"><a href="${href}">${esc(c.naam)}</a></h3>
              <p>${esc(c.kaart)}</p>
              ${chips(c)}
            </div>
          </article>`;
}

function filter() {
  const tel = (s) => cases.filter((c) => !s || c.soort === s).length;
  const knop = (waarde, naam, kleur, aan) =>
    `<button type="button" class="filter__knop" data-filter="${waarde}" aria-pressed="${aan}"><span class="filter__vak x8-k-${kleur}"></span>${naam} <span class="filter__tel">${tel(waarde)}</span></button>`;
  return [knop("", "Alles", "limoen", true), knop("websites", "Websites", "oranje", false), knop("tools", "Tools", "hemel", false)].join("\n        ");
}

/* ---------- Casepagina ---------- */

function casePagina(c, i) {
  const p = "../";
  const volgende = cases[(i + 1) % cases.length];
  const url = `${SITE}/work/${c.slug}`;
  const kleur = KLEUR[c.soort];
  const ogBeeld = c.cover ? `${SITE}/${c.cover.src}` : `${SITE}/favicon.svg`;
  const feiten = [
    `<div class="x8-widget x8-k-wit"><span class="x8-widget__label">Klant</span><span class="case-feit">${esc(c.klant)}</span></div>`,
    `<div class="x8-widget x8-k-wit"><span class="x8-widget__label">Jaar</span><span class="case-feit">${esc(c.jaar)}</span></div>`,
    `<div class="x8-widget x8-k-${kleur}"><span class="x8-widget__label">Wat we deden</span><span class="case-feit">${esc(c.wat)}</span></div>`,
    c.online
      ? `<a class="x8-widget x8-k-limoen case-online" href="${esc(c.online)}" target="_blank" rel="noopener"><span class="x8-widget__label">Online</span><span class="case-feit">Bekijk de site</span><span class="case-online__pijl">${icoon("round-arrow-right-up", p)}</span></a>`
      : c.status ? `<div class="x8-widget x8-k-leisteen"><span class="x8-widget__label">Status</span><span class="case-feit">${esc(c.status)}</span></div>` : "",
  ].filter(Boolean).join("\n            ");
  const drie = !c.online && !c.status;

  const beeld = c.flow
    ? `<div class="wrap">
        <div class="case-cover case-cover--flow case__flow" aria-label="De flow van aanvraag tot factuur">
          ${flow(p)}
        </div>
        <div class="x8-bento case-cijfers">
          <div class="x8-widget x8-k-wit placeholder"><span class="x8-widget__label">Tijd per offerte, vroeger</span><span class="x8-widget__getal">[cijfer volgt]</span></div>
          <div class="x8-widget x8-k-wit placeholder"><span class="x8-widget__label">Tijd per offerte, nu</span><span class="x8-widget__getal">[cijfer volgt]</span></div>
          <div class="x8-widget x8-k-wit placeholder x8-widget--breed"><span class="x8-widget__label">Placeholder</span><p class="x8-widget__tekst">Hier komen de echte cijfers van onze eigen werking zodra Jasper en Florian ze aanleveren.</p></div>
        </div>
      </div>`
    : `<div class="wrap">
        <figure class="case-cover"><img src="${p}${c.cover.src}" alt="${esc(c.cover.alt)}" width="${c.cover.w}" height="${c.cover.h}" decoding="async" fetchpriority="high"></figure>
      </div>`;

  const blokken = c.blokken.map((b, j) => `<section class="case-blok">
          <h2 class="case-blok__titel"><span class="case-blok__nr t-label">0${j + 1}</span>${esc(b.titel)}</h2>
          <p class="case-blok__tekst">${esc(b.tekst)}</p>
        </section>`).join("\n        ");

  const video = c.video ? `<div class="wrap">
        <figure class="case-video" data-reveal>
          <video muted loop playsinline preload="none" poster="${p}${c.cover.src}" data-video="${p}${c.video}" aria-label="Schermopname van ${esc(c.naam)}"></video>
        </figure>
      </div>` : "";

  const galerij = (c.galerij || []).length ? `<div class="wrap case-galerij">
        ${c.galerij.map((g) => `<figure class="case-galerij__beeld${g.h > g.w ? " is-hoog" : g.w / g.h > 2.2 ? " is-smal" : ""}"><img src="${p}${g.src}" alt="${esc(g.alt)}" width="${g.w}" height="${g.h}" loading="lazy" decoding="async"></figure>`).join("\n        ")}
      </div>` : "";

  const ld = {
    "@context": "https://schema.org", "@type": "CreativeWork", name: c.naam, url, description: c.intro,
    dateCreated: c.jaar, creator: { "@id": `${SITE}/#studio` },
    ...(c.eigen ? {} : { sourceOrganization: { "@type": "Organization", name: c.klant } }),
    ...(c.cover ? { image: ogBeeld } : {}),
  };

  return `<!doctype html>
<html lang="nl-BE">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(c.naam)} | Werk van 2X8</title>
  <meta name="description" content="${esc(c.intro)}">
  <link rel="canonical" href="${url}">
  <meta property="og:type" content="article">
  <meta property="og:url" content="${url}">
  <meta property="og:title" content="${esc(c.naam)} | 2X8">
  <meta property="og:description" content="${esc(c.kaart)}">
  <meta property="og:image" content="${ogBeeld}">
  <meta property="og:locale" content="nl_BE">
  <meta name="theme-color" content="#EAEAE7">
  <link rel="icon" href="${p}favicon.svg" type="image/svg+xml">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Schibsted+Grotesk:wght@400..900&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="${p}design-system/tokens.css">
  <link rel="stylesheet" href="${p}design-system/components/bundle.css">
  <link rel="stylesheet" href="${p}css/site.css">
  <link rel="stylesheet" href="${p}css/paginas.css">
  <script>
    (function (d) {
      d.classList.add("js");
      if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
        d.classList.add("anim", "beweeg");
        setTimeout(function () { d.classList.remove("anim"); }, 2500);
      }
    })(document.documentElement);
  </script>
  <script type="application/ld+json">${JSON.stringify(ld)}</script>
</head>
<body class="x8">
  <a class="skip" href="#inhoud">Naar inhoud</a>

  <!-- nav:start -->
  ${nav(p, "werk.html")}
  <!-- nav:end -->

  <main id="inhoud">
    <article class="casepagina">
      <header class="wrap pagina-kop intro case-kop">
        <a class="terug" href="${p}werk.html" data-in><span class="terug__pijl" data-symbool="pijl-rechts" data-dikte="18"></span>Al ons werk</a>
        <div class="chips" data-in>${chips(c)}</div>
        <h1 class="pagina__kop"><span class="lijn"><span>${esc(c.naam)}</span></span></h1>
        <p class="t-lead pagina__lead" data-in>${esc(c.intro)}</p>
        <div class="x8-bento case-feiten${drie ? " case-feiten--drie" : ""}" data-in>
            ${feiten}
        </div>
      </header>

      ${beeld}

      <div class="wrap case-blokken">
        ${blokken}
      </div>

      ${video}

      ${galerij}

      <div class="wrap">
        <a class="volgende x8-k-${KLEUR[volgende.soort]}" href="${volgende.slug}.html" data-kantel="5">
          <span class="t-label">Volgende case</span>
          <span class="volgende__naam">${esc(volgende.naam)}</span>
          <span class="volgende__pijl">${icoon("round-arrow-right-up", p)}</span>
        </a>
      </div>
    </article>

    <!-- cta:start -->
    ${cta(p)}
    <!-- cta:end -->
  </main>

  <!-- voet:start -->
  ${voet(p)}
  <!-- voet:end -->

  <script src="${p}design-system/components/bundle.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js" defer></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js" defer></script>
  <script src="${p}js/site.js" defer></script>
  <script src="${p}js/pagina-case.js" defer></script>
</body>
</html>
`;
}

/* ---------- Schrijven ---------- */

fs.mkdirSync(path.join(ROOT, "work"), { recursive: true });
cases.forEach((c, i) => fs.writeFileSync(path.join(ROOT, "work", `${c.slug}.html`), casePagina(c, i)));

for (const pagina of PAGINAS) {
  const bestand = path.join(ROOT, pagina);
  if (!fs.existsSync(bestand)) continue;
  let html = fs.readFileSync(bestand, "utf8");
  html = vervang(html, "nav", nav("", pagina));
  html = vervang(html, "cta", cta(""));
  html = vervang(html, "voet", voet(""));
  if (pagina === "werk.html") {
    html = vervang(html, "cases", cases.map((c, i) => kaart(c, "", i === 0)).join("\n          "));
    html = vervang(html, "filter", filter());
  }
  if (pagina === "tools.html") {
    const tools = cases.filter((c) => c.soort === "tools");
    html = vervang(html, "tools", tools.map((c, i) => kaart(c, "", i === 0)).join("\n          "));
  }
  if (pagina === "index.html") {
    const keuze = HOME.map((slug) => cases.find((c) => c.slug === slug));
    html = vervang(html, "cases", keuze.map((c, i) => kaart(c, "", i === 0)).join("\n          "));
  }
  fs.writeFileSync(bestand, html);
}

/* ---------- Machine-leesbaar: sitemap.xml en llms.txt ---------- */

const PAGINA_URL = { "index.html": "/", "websites.html": "/websites", "tools.html": "/tools", "werk.html": "/werk", "over-ons.html": "/over-ons", "contact.html": "/contact" };
const vandaag = new Date().toISOString().slice(0, 10);
const urls = Object.values(PAGINA_URL).concat(cases.map((c) => `/work/${c.slug}`));
fs.writeFileSync(path.join(ROOT, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${SITE}${u}</loc><lastmod>${vandaag}</lastmod></url>`).join("\n")}
</urlset>
`);

const beschrijving = (bestand) => {
  const m = fs.readFileSync(path.join(ROOT, bestand), "utf8").match(/<meta name="description" content="([^"]*)"/);
  return m ? m[1] : "";
};
fs.writeFileSync(path.join(ROOT, "llms.txt"), `# 2X8

> Studio uit Gent van Jasper Impens (design en front-end) en Florian Bracke (development en consultancy). We bouwen websites die klanten brengen en tools die uren werk besparen. Voor kleine Belgische bedrijven, rechtstreeks met de twee mensen die het bouwen.

Contact: hello@2x8.be. Antwoord binnen twee werkdagen. Een eerste gesprek duurt een half uur.

## Diensten

- Websites: onepager vanaf 900 euro, website met meerdere pagina's vanaf 1.900 euro, webshop vanaf 2.900 euro, hosting met updates en onderhoud 350 euro per jaar. Alles excl. btw. Een site kan online staan in 2 dagen.
- Tools en automatisatie: we kijken hoe een bedrijf werkt, vinden waar het tijd verliest en programmeren dat weg, met de software die het al gebruikt. Voorbeelden: offertes uit een contactformulier, pdf's in plaats van rondgestuurde Excels, routes uit een klantenlijst in Google Sheets, documenten op één plek. Voor de eerste bedrijven is de pilot gratis, in ruil voor cijfers en een case.

## Pagina's

${Object.entries(PAGINA_URL).map(([b, u]) => `- [${u === "/" ? "Home" : u.slice(1)}](${SITE}${u}): ${beschrijving(b)}`).join("\n")}

## Werk

${cases.map((c) => `- [${c.naam}](${SITE}/work/${c.slug}): ${c.intro} (${SOORT[c.soort]}, ${c.label}, ${c.eigen ? "eigen project" : "klant: " + c.klant}, ${c.jaar})`).join("\n")}
`);

console.log(`${cases.length} casepagina's en ${PAGINAS.length} pagina's bijgewerkt.`);
