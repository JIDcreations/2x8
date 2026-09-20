# Backup / archief

Bevroren kopie van de site zoals die online stond op 2026-09-20, bereikbaar via
https://2x8.be/backup/. Niet bewerken — dit is een archief.

Niet geindexeerd door zoekmachines:
- elke pagina hier heeft `<meta name="robots" content="noindex, nofollow">`
- `/robots.txt` in de root bevat `Disallow: /backup/`
- `backup/.htaccess` zet `X-Robots-Tag: noindex, nofollow` op alles in deze map
- de `<link rel="canonical">` tags zijn uit deze kopie verwijderd

De HTML, CSS en JS zijn een eigen kopie; de zware bestanden in `assets/` worden
gedeeld met de live site (paden zijn herschreven naar `/assets/...`). Als een
asset later vervangen of hernoemd wordt, verandert die ook in deze backup.
