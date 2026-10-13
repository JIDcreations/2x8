# Redirects voor de livegang op brug48.be

Oude Weebly-URL's → nieuwe URL's, allemaal 301. Pas actief maken bij de livegang (zie README.md).
Zolang de site in `/brug48` op 2x8.be staat, zijn ze niet nodig.

| Oud | Nieuw |
|---|---|
| `/index.html` | `/` |
| `/katrien-boone.html` | `/therapeuten/katrien-boone` |
| `/michael-callaert.html` | `/therapeuten/michael-callaert` |
| `/katja-desauw.html` | `/therapeuten/katja-desauw` |
| `/pieter-govaerts.html` | `/therapeuten/pieter-govaerts` |
| `/ilse-heylen.html` | `/therapeuten/ilse-heylen` |
| `/sarah-jocqueacute.html` | `/therapeuten/sarah-jocque` |
| `/uus-knops.html` | `/therapeuten/uus-knops` |
| `/kristien-lemaitre.html` | `/therapeuten/kristien-lemaitre` |
| `/charlotte-ohms.html` | `/therapeuten/charlotte-ohms` |
| `/tine-van-der-heyden.html` | `/therapeuten/tine-van-der-heyden` |
| `/iben-verstuyf.html` | `/therapeuten/iben-verstuyf` |
| `/locatie.html` | `/locatie` |
| `/therapeuten.html` | `/therapeuten` (gaf op Weebly 404, maar stond in het menu) |

## Voor `.htaccess` (bovenaan, vóór de regel naar index.php)

```apache
RewriteRule ^index\.html$ / [R=301,L]
RewriteRule ^sarah-jocqueacute\.html$ /therapeuten/sarah-jocque [R=301,L]
RewriteRule ^locatie\.html$ /locatie [R=301,L]
RewriteRule ^therapeuten\.html$ /therapeuten [R=301,L]
RewriteRule ^(katrien-boone|michael-callaert|katja-desauw|pieter-govaerts|ilse-heylen|uus-knops|kristien-lemaitre|charlotte-ohms|tine-van-der-heyden|iben-verstuyf)\.html$ /therapeuten/$1 [R=301,L]
```

Na de livegang testen met `curl -sI https://www.brug48.be/katrien-boone.html` (verwacht: `301`
en `Location: /therapeuten/katrien-boone`).
