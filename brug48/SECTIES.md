# Secties

Elke sectie staat in `sections/<naam>/` met een `.php` (markup), een `.css` en soms een `.js`.
Een pagina in `pages/` is enkel een reeks `section('<naam>', [...])`-aanroepen. Eén sectie wordt
later één Gutenberg-block; de parameters worden de block-attributen. CSS van de gebruikte
secties gaat inline in de `<head>`, JS als apart `defer`-script (zie `lib/layout.php`).

Gedeeld: `assets/css/tokens.css` (kleur, type, ruimte, wordt `theme.json`) en
`assets/css/basis.css` (dek en pijlers, knop, keuzelabel, de brug-SVG uit `brug()` in
`lib/app.php`).

Stand: fase 2 (homepage en therapeutenoverzicht). Detailpagina en Locatie volgen.

| Sectie | Parameters | Beoogd block | Opmerking |
|---|---|---|---|
| `site-header` | `actief` (huidig pad) | template part `header` | logo + menu (Therapeuten, Locatie); het logo is de link naar Welkom |
| `hero` | `titel`, `foto` (pad zonder breedte), `breedtes[]`, `formaat[b,h]`, `alt`, `fotobron`, `actie{tekst,url}`, `adres{tekst,url}` | `brug48/hero` | foto in een boogvenster met de brug erover; de entree-animatie zit hier |
| `welkom` | `kop`, `alineas[]`, `nadruk` (index van de groot gezette alinea) | `brug48/tekst-met-kop` | teksten letterlijk |
| `zoeker` | `kop`, `tekst`, `kop_namen` | dynamisch `brug48/zoeker` | leest thema's en therapeuten zelf (WP: termen van `thema` + CPT `therapeut`) |
| `pagina-intro` | `titel`, `tekst` | `brug48/pagina-intro` | titel onder de boog, zonder foto |
| `therapeuten-overzicht` | `kop_thema`, `kop_doelgroep`, `alle_themas`, `iedereen`, `knop`, `stop`, `leeg`, `leeg_tekst` | dynamisch `brug48/therapeuten-overzicht` | filter + kaarten; leest data en `?thema=`/`?doelgroep=` zelf; JS maakt het vloeiend |
| `crisishulp` | `kop`, `regels[{tekst,nummer,na}]`, `chat{tekst,url,label}` | `brug48/crisishulp` | nieuwe inhoud, goedgekeurd door Florian (13-10-2026) |
| `site-footer` | `actief` | template part `footer` | adres, menu, crisishulp, demomelding zolang `DEMO` aan staat |
| `melding` | `titel`, `tekst`, `link{tekst,url}` | patroon of `brug48/melding` | 404 en (tijdelijk) pagina's in opbouw |

## Data naar WordPress

- `data/therapeuten.json` → custom post type `therapeut`; `naam` = titel, `slug` = slug,
  `inhoud` (koppen, alinea's, lijsten) = de blocks van de post, de overige velden = meta.
- `themas` en `doelgroepen` → taxonomieën `thema` en `doelgroep` met de id's als slug
  (dan blijven `?thema=angst`-links werken).
- `themas_origineel` blijft als meta bij de therapeut: de letterlijke formulering per thema.
