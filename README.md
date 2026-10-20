# 2x8.be, versie 2

Gewone HTML, CSS en JavaScript. Geen build op de server: wat in de repo staat, staat live (zie `../V1/README.md` voor de deploy via Hostinger).

Lokaal bekijken: `python3 -m http.server 8765` in deze map, daarna http://localhost:8765/.

## Pagina's

| Bestand | URL | Het grote moment |
| --- | --- | --- |
| `index.html` | `/` | Rekenmodule "Hoeveel tijd verlies jij?", problemen die wisselen terwijl je scrolt, offerte-demo |
| `websites.html` | `/websites` | Een browser die terwijl je scrolt een site opbouwt: structuur, ontwerp, inhoud, online |
| `tools.html` | `/tools` | Een routeplanner die echt rekent: klanten aan of uit, route en uur van terugkomst volgen |
| `werk.html` | `/werk` | Filter op Websites of Tools, de kaarten schuiven naar hun plek (GSAP Flip) |
| `over-ons.html` | `/over-ons` | Acht bits om zelf aan en uit te zetten, met de waarde en het teken |
| `contact.html` | `/contact` | Het formulier, met ernaast live wat er met je aanvraag gebeurt |
| `work/<slug>.html` | `/work/<slug>` | Casepagina's, gegenereerd. Zelfde URL's als V1 |

`.htaccess` serveert de URL's zonder `.html` (zoals V1) en stuurt oude URL's door: `/studio` naar `/over-ons`, `/diensten/*` naar `/websites` of `/tools`, `/cms` naar `/websites`. `/fr` en `/en` gaan tijdelijk (302) naar de homepage tot de vertalingen er zijn.

## `node bouw.js`

Draai dit na elke wijziging aan `data/cases.json`, of aan de nav, de footer of het contactblok (die staan bovenaan in `bouw.js`). Het script:

- zet nav, contactblok en footer in elke pagina, tussen `<!-- nav:start -->` en `<!-- nav:end -->` (en zo ook `cta` en `voet`)
- schrijft een casepagina per case naar `work/`
- vult de cases op `werk.html`, `tools.html` en de homepage (de keuze voor de homepage staat in `HOME` in `bouw.js`)
- schrijft `sitemap.xml` en `llms.txt`

Bewerk de stukken tussen die markeringen nooit met de hand: de volgende build overschrijft ze.

Een case toevoegen: zet de beelden als WebP in `assets/cases/<slug>/` (`cover.webp`, `g1.webp`, ...), voeg een blok toe aan `data/cases.json` en draai `node bouw.js`.

## Code

- `css/site.css`: alles wat de homepage gebruikt, plus nav, footer en de gedeelde blokken. `css/paginas.css`: de andere pagina's.
- `js/site.js`: gedeeld gedrag (menu, intro, onthullingen, kantelende tegels met `data-kantel`, rekenmodule, offerte-demo). `js/pagina-*.js`: het grote moment per pagina.
- Beweging met GSAP 3.12.5 van cdnjs. Zonder JavaScript is alles leesbaar; `prefers-reduced-motion` zet de beweging uit en toont elke demo in haar eindstand.
- Iconen: Solar Bold Duotone, zie `design-system/iconen/README.md`. De vermelding in de footer moet blijven.

## Contactformulier

`mail.php` komt ongewijzigd uit V1 (Brevo met fallback naar `mail()`, sleutel buiten de docroot). Het formulier op `contact.html` gebruikt dezelfde velden: `naam`, `email`, `bedrijf`, `type`, `bericht`, de spamval `website` en `duur`. Lokaal met `python3 -m http.server` werkt verzenden niet (geen PHP); de pagina toont dan de foutmelding.

## Meegenomen uit V1, ongewijzigd

`customers/` (customers.2x8.be), `salon-dola/`, en de demo's `sanitairverschraegen/`, `tiger-auto-parts/`, `tke/`, `leef-tijd/`, zodat bestaande links blijven werken. Ze staan nergens in de nav.

## Nog open

- Placeholders op `work/2x8-zelf.html`: tijd per offerte vroeger en nu. Echte cijfers nodig.
- Frans en Engels, via dezelfde aanpak als `../V1/build.js`, nadat de Nederlandse versie goedgekeurd is.
- OG-afbeeldingen voor de nieuwe huisstijl (V1 had `og.js`).
