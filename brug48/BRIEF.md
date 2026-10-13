# Brief: Brug 48 (pitch-demo)

Laatst bijgewerkt: 13-10-2026

## In één zin
Een nieuwe, veel modernere versie van brug48.be die we op eigen initiatief bouwen om de
praktijk als klant binnen te halen, met als hoofdargument: een cliënt vindt sneller de juiste
therapeut.

## Klant en context
Brug 48 is een groepspraktijk voor psychotherapie en begeleiding in Gentbrugge (Residentie
Evrard, Vincent Evrardlaan 48 bus 202, 9050 Gentbrugge), 11 therapeuten. De huidige site staat
op Weebly (https://www.brug48.be/). Ze zijn nog geen klant en weten niet dat we dit maken.
De demo komt op 2x8.be/brug48. Worden ze klant, dan verhuist de site naar brug48.be en zetten
we hem later om naar WordPress.

## Doelen
- De praktijk moet denken: "hiermee vindt een cliënt sneller de juiste therapeut". De
  therapeutenfilter (thema + doelgroep) is het hoofdargument van de pitch.
- Belangrijkste actie voor een bezoeker: de juiste therapeut vinden en die rechtstreeks
  contacteren. De praktijk heeft geen centraal nummer of mailadres, elke therapeut heeft
  eigen contactgegevens.
- Uitstraling: herkenbaar hun huisstijl (logo, kleuren), maar veel moderner. Rust en
  vertrouwen.

## Klaar wanneer
- Werkende site, lokaal te starten met `php -S`, en online op 2x8.be/brug48.
- Elke pagina gecontroleerd in de browser met screenshots op 360, 768 en 1440 px.
- WCAG 2.1 AA, volledig toetsenbordbedienbaar, `prefers-reduced-motion` gerespecteerd.
- Lighthouse 90+ op alle onderdelen.
- Per pagina eigen title, meta description en Open Graph.
- Opgeleverd: `SECTIES.md`, `REDIRECTS.md`, `README.md` (deploy + livegang-checklist).

## No-go's
- Geen donker thema (ook geen donkere secties).
- Geen inhoud verzinnen of teksten herschrijven zonder te vragen: geen testimonials, geen
  blog, geen tarieven die er nu niet staan.
- Geen extra pagina's buiten de structuur hieronder.
- Geen cookies of tracking. Kaart zonder Google Maps-embed die cookies zet.
- Geen framework, geen build-stap, geen database, geen CDN.
- Beweging nooit druk: traag, zacht, rustgevend.

## Doelgroep
Jongvolwassenen en volwassenen (en bij sommige therapeuten ouderen, koppels, ...) die een
therapeut zoeken in de buurt van Gent. Vaak in een kwetsbare periode: de site moet
geruststellen, niet overweldigen.

## Scope
### Wel
- `/` Welkom
- `/therapeuten` NIEUW: overzicht met kaarten (foto, naam, thema's) en filter op thema en
  doelgroep, combineerbaar, aantal resultaten zichtbaar, duidelijke lege toestand. Filter in
  de URL (`?thema=angst`), werkt zonder JS; JS maakt het vloeiend.
- `/therapeuten/{slug}` detailpagina per therapeut (11)
- `/locatie` ligging, route per fiets/auto/OV, kaart
- Demo-beveiliging: noindex/nofollow + `X-Robots-Tag`, HTTP basic auth, beide met één
  instelling in `config.php` uit te zetten.
- `REDIRECTS.md` met 301's van de oude Weebly-URL's.

### Niet
- WordPress-omzetting (later, apart). Wel nu al bouwen in secties die later Gutenberg-blocks
  worden.
- Verhuis naar brug48.be (pas als ze klant worden).
- Nieuwe content, fotografie of teksten.

## Techniek en hosting
- PHP 8.2 (Hostinger), HTML, CSS, vanilla JS. GSAP mag als het de animaties echt beter
  maakt, lokaal gehost.
- Eén `BASE_URL` in `config.php`, nergens hardgecodeerde paden. Routing via `.htaccess`,
  nette URL's zonder `.php`/`.html`.
- Secties: elke sectie een PHP-partial in `/sections`, aangeroepen als
  `section('hero', [...])`. Pagina's zijn enkel een reeks `section()`-aanroepen. CSS en JS
  per sectie. Design-tokens als CSS custom properties in één bestand (later `theme.json`).
- `data/therapeuten.json` is de enige bron voor therapeutdata (later CPT "therapeut" met
  taxonomieën "thema" en "doelgroep").
- Locatie in de code: map `brug48/` in de repo `2x8-studio/2x8-website`. Live via
  `git push origin main` (Hostinger GitHub-koppeling), net als de andere pitch-demo's.
  De map heeft een eigen `.htaccess` (regels van de 2x8-root gelden er niet).
- SSH voor controle: `id_webwork_staging`, poort 65002, `u378989036@185.97.145.224`,
  docroot `~/domains/2x8.be/public_html/brug48`.

## Content en beeld
- Alle teksten letterlijk van de huidige site. Ontbreekt iets: leeg laten en melden.
- Beeld: logo, headerfoto en de therapeutfoto's van de huidige site.
- Headerfoto komt van "Fietsbult / blog van Fietsersbond Gent". De vermelding op de pagina mag
  weg (Florian, 13-10-2026); de rechten moeten wel gecheckt worden voor livegang.
- Foto's en telefoonnummers van therapeuten staan erin, daarom de demo-beveiliging.

## Design: referenties en huisstijl
- Huisstijl: logo en kleuren herkenbaar (wordt in fase 1 vastgelegd in het design-document).
- Niveau: award-winnend. Sterke typografie, royale witruimte, doordachte scroll- en
  pagina-overgangen, micro-interacties.
- Brug-motief (verbinden, oversteken, pijlers) mag visueel terugkomen.
- Referenties: Florian heeft er geen; Claude stelt in fase 1 drie richtingen met
  voorbeeldsites voor, Florian kiest bij de STOP.

## Planning en budget
- Op eigen initiatief, geen budget van de klant.
- Demo klaar om te tonen tegen **20 oktober 2026**.
- Fase 1 onderzoek → STOP → fase 2 homepage + therapeutenoverzicht → STOP → rest bouwen,
  audit en polish → oplevering.

## Open vragen
- Rechten op de headerfoto (Fietsbult / Fietsersbond Gent): Florian of de praktijk, vóór
  livegang.
- Gebruikersnaam en wachtwoord voor de basic auth van de demo: Claude stelt voor, Florian
  bewaart ze.
