# Brug 48: nieuwe website (voorstel van 2X8)

PHP zonder framework, build-stap of database. Brief: `BRIEF.md`. Product: `PRODUCT.md`.
Secties en WordPress-vertaling: `SECTIES.md`. Onderzoek en huisstijl: `docs/`.

## Lokaal starten

Vanuit de map erboven (de 2x8-repo), zodat de URL's gelijk zijn aan die op de server:

```bash
php -S localhost:8048 brug48/index.php
```

Dan http://localhost:8048/brug48/. Lokaal vraagt de site geen wachtwoord.

## Opbouw

- `config.php`: alles wat verandert bij de livegang (`BASE_URL`, `SITE_URL`, `DEMO`).
- `index.php`: router; `lib/app.php` helpers en data; `lib/layout.php` het paginaskelet.
- `pages/`: per pagina enkel `section()`-aanroepen.
- `sections/<naam>/`: php, css en js per sectie.
- `data/therapeuten.json`: enige bron voor therapeutdata.
- `tools/scrape.py`: haalt teksten en foto's opnieuw van brug48.be (`python tools/scrape.py`).
- `tools/beelden.py`: maakt WebP/AVIF, vierkante portretten (de CSS toont ze zwart-wit) en de Open Graph-afbeelding.
- Lettertypes (Jost, Literata; SIL Open Font License) staan lokaal in `assets/fonts/`.

## Demo op 2x8.be/brug48

De map zit in de repo `2x8-studio/2x8-website`; `git push origin main` zet ze live. De
`.htaccess` hier heeft eigen regels en blokkeert bronbestanden (`data/`, `docs/`, `tools/`,
`*.md`, de originele beelden).

- Wachtwoord: HTTP basic auth via PHP, gebruiker en hash in `config.php`. Het wachtwoord zelf
  staat lokaal in `.demo-wachtwoord` (niet in git). Nieuw wachtwoord:
  `php -r "echo password_hash('NIEUW', PASSWORD_DEFAULT);"` en de hash in `config.php` zetten.
- Enkel de pagina's vragen een wachtwoord; beelden en lettertypes zijn rechtstreeks
  bereikbaar (ze staan sowieso al op brug48.be) maar krijgen `X-Robots-Tag: noindex`.

## Livegang op brug48.be

1. `config.php`: `BASE_URL = ''`, `SITE_URL = 'https://www.brug48.be'`, `DEMO = false`
   (zet wachtwoord, noindex en de 2X8-melding in de footer uit).
2. `.htaccess`: het blok `Header set X-Robots-Tag` onderaan weghalen.
3. `.htaccess`: de redirects uit `REDIRECTS.md` toevoegen.
4. `python tools/scrape.py` opnieuw draaien en de verschillen nakijken (aanmeldingsstops en
   teksten veranderen).
5. Open punten uit `docs/onderzoek.md` afgehandeld: rechten headerfoto, vectorlogo, foto's.
6. Controleren: `curl -sI https://www.brug48.be/` (200, geen `X-Robots-Tag`), de redirects,
   en Lighthouse op home, overzicht, een detailpagina en Locatie.
