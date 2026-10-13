# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

PHP 8.2, HTML, CSS, vanilla JS (beslist in BRIEF.md). Geen framework, build-stap, database of
CDN; bibliotheken lokaal (GSAP toegestaan). Draait nu in submap `/brug48` op 2x8.be, later op de
root van brug48.be en daarna WordPress: elke sectie is een PHP-partial die later een
Gutenberg-block wordt.

## Users

- **Bezoeker (primair):** een jongvolwassene of volwassene (bij sommige therapeuten ook ouderen,
  koppels of gezinnen) uit de regio Gent die psychologische hulp zoekt, vaak in een kwetsbare
  periode. Twee situaties, allebei frequent:
  - komt met een **naam** (doorverwezen door huisarts of via mond-aan-mond) en wil die
    therapeut terugvinden en contacteren;
  - komt met een **probleem** (angst, rouw, burn-out, ...) en zoekt wie daarbij kan helpen.
- **De praktijk (pitch-publiek):** de therapeuten van Brug 48 die de demo te zien krijgen. Ze
  moeten zichzelf en hun teksten herkennen, en zien dat een cliënt zo sneller bij de juiste
  therapeut komt.

## Product Purpose

De website van Brug 48, een groepspraktijk voor psychotherapie en begeleiding in Gentbrugge.
Ze stelt de praktijk en haar 11 therapeuten voor en helpt een bezoeker de therapeut te vinden
die bij zijn vraag past, om die daarna rechtstreeks te contacteren. Succes: een bezoeker vindt
in een paar stappen een passende therapeut en diens contactgegevens.

## Positioning

Overgenomen van de huidige site, niets toegevoegd: de praktijk ligt aan de Gentbrugse brug, en
die ligging gaf haar de naam. "Bruggen bouwen, de brug oversteken, een brug met sterke pijlers"
zijn voor de praktijk metaforen voor verbondenheid en communicatie in therapie. Cliënten worden
ontvangen in "een hedendaagse, rustige setting waarin elk met zijn eigen levensverhaal, zijn
vragen, zijn eigen waarden terecht kan". Meerdere therapeuten met elk eigen thema's en
benaderingen onder één dak.

## Operating Context

- Geen centraal telefoonnummer, mailadres of boekingssysteem: elke therapeut heeft eigen
  contactgegevens en wordt rechtstreeks gecontacteerd.
- Adres: BRUG 48, Residentie Evrard, Vincent Evrardlaan 48 bus 202, 9050 Gentbrugge.
- Bezoekers lezen vaak op gsm.

## Capabilities and Constraints

- Pagina's: Welkom, Therapeuten (nieuw overzicht met filter op thema en doelgroep, ook
  zoeken op naam moet vlot gaan), detailpagina per therapeut, Locatie. Geen andere pagina's.
- Filter staat in de URL (`?thema=angst`) en werkt zonder JavaScript.
- Thema's en doelgroepen worden genormaliseerd naar één vaste lijst; de originele formulering
  van elke therapeut blijft op de detailpagina staan.
- Geen cookies of tracking; kaart zonder cookie-zettende embed.
- Demo-fase: noindex en HTTP basic auth, met één instelling uit te zetten bij livegang.
- Terminologie: "cliënt" (zoals de huidige site), "therapeut", "praktijk".

## Brand Commitments

- Naam: **BRUG 48** (logo-schrijfwijze) / Brug 48 / Brug48 komen alle drie voor op de huidige
  site.
- Logo en huisstijlkleuren blijven herkenbaar (zie design-document, fase 1).
- Alle teksten letterlijk van de huidige site; herschrijven enkel na akkoord.
- Nieuwe interfaceteksten spreken de bezoeker aan met **je**, zoals de therapeuten in hun eigen
  teksten.
- Headerfoto met bronvermelding "foto Fietsbult / blog van Fietsersbond Gent": vermelding
  blijft staan, rechten nog te checken.

## Evidence on Hand

- Teksten van Welkom, Locatie en 11 therapeutenpagina's (brug48.be), gestructureerd in
  `data/therapeuten.json`.
- Logo, headerfoto en één portretfoto per therapeut van de huidige site.
- **Bestaat niet en mag niet verzonnen worden:** testimonials, cijfers, tarieven,
  wachttijden, blog, extra foto's van de praktijk of de therapeuten.

## Product Principles

1. **Vinden boven vertellen:** de weg naar de juiste therapeut is de kern; alles anders dient
   dat.
2. **Rust is functie:** wie hulp zoekt, is vaak gespannen. Niets mag haasten, overweldigen of
   druk zetten.
3. **Hun woorden, niet de onze:** de teksten van de therapeuten blijven letterlijk; de site
   ordent, ze vult niet in.
4. **Rechtstreeks contact:** van elke therapeut zijn de contactgegevens snel bereikbaar.
5. **Klaar voor later:** elke sectie en elk gegeven moet zonder herwerk naar WordPress kunnen.

## Accessibility & Inclusion

WCAG 2.1 AA, volledig toetsenbordbedienbaar, `prefers-reduced-motion` gerespecteerd (dan geen
animaties). Mobile first, getest op 360, 768 en 1440 px.
