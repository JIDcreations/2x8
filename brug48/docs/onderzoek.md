# Fase 1: onderzoek Brug 48

Gecrawld op 13-10-2026 van https://www.brug48.be (Weebly). Bijhorend:
[huisstijl.md](huisstijl.md) (design-document), `data/therapeuten.json` (alle therapeutdata) en
`tools/scrape.py`. Dat script haalt alles opnieuw binnen. Draai het vlak voor de livegang nog
eens, want aanmeldingsstops en teksten veranderen.

## Sitemap

De huidige site heeft 13 pagina's: Welkom, Locatie en 11 therapeuten. "THERAPEUTEN" in het menu
is enkel een uitklapper (`/therapeuten.html` geeft 404).

| Huidig (Weebly) | Nieuw | Inhoud |
|---|---|---|
| `/` en `/index.html` | `/` | Tagline, welkomtekst (3 alinea's), headerfoto met bronvermelding, adres |
| (bestaat niet) | `/therapeuten` | **Nieuw:** overzicht van de 11 therapeuten met filter op thema en doelgroep |
| `/katrien-boone.html` | `/therapeuten/katrien-boone` | |
| `/michael-callaert.html` | `/therapeuten/michael-callaert` | |
| `/katja-desauw.html` | `/therapeuten/katja-desauw` | |
| `/pieter-govaerts.html` | `/therapeuten/pieter-govaerts` | |
| `/ilse-heylen.html` | `/therapeuten/ilse-heylen` | |
| `/sarah-jocqueacute.html` | `/therapeuten/sarah-jocque` | slug zonder het Weebly-restje "acute" |
| `/uus-knops.html` | `/therapeuten/uus-knops` | |
| `/kristien-lemaitre.html` | `/therapeuten/kristien-lemaitre` | |
| `/charlotte-ohms.html` | `/therapeuten/charlotte-ohms` | |
| `/tine-van-der-heyden.html` | `/therapeuten/tine-van-der-heyden` | |
| `/iben-verstuyf.html` | `/therapeuten/iben-verstuyf` | |
| `/locatie.html` | `/locatie` | Ligging, route met de fiets, de auto en het openbaar vervoer, kaart (nu een Google Maps-iframe via Weebly), adres |

Elke therapeutenpagina heeft nu: foto en naam in een olijfbalk, links hun eigen tekst (vrije
opbouw, elk anders), rechts opleiding, doelgroep, soms werkmomenten, en contactgegevens.

## Therapeuten

| Naam | Foto | Thema's | Doelgroepen | Contact | Werkmomenten | Aanmeldingsstop |
|---|---|---|---|---|---|---|
| Katrien Boone | ja | 7 | jongvolwassenen, volwassenen, ouderen | tel | - | - |
| Michaël Callaert | ja | 9 | volwassenen, koppels | tel + mail | - | - |
| Katja Desauw | ja | 8 | jongvolwassenen, volwassenen, koppels, gezinnen | tel | woensdag- en vrijdagvoormiddag | **ja** |
| Pieter Govaerts | ja | 9 | jongvolwassenen, volwassenen, koppels, gezinnen, hulpverleners | tel | - | **ja** |
| Ilse Heylen | ja | 8 | jongvolwassenen, volwassenen, koppels | mail | - | **ja** |
| Sarah Jocqué | ja | 9 | jongvolwassenen, volwassenen, koppels, gezinnen | tel + mail | Enkel op woensdagvoormiddag | - |
| Uus Knops | ja | 3 | volwassenen, hulpverleners | mail | Meestal op maandagvoor- en namiddag | - |
| Kristien Lemaitre | **nee** | 0 | jongvolwassenen, volwassenen, ouderen | tel + mail | - | - |
| Charlotte Ohms | ja | 9 | jongvolwassenen, volwassenen, koppels, gezinnen, hulpverleners | tel + mail | Enkel op donderdagnamiddag | - |
| Tine Van der Heyden | ja | 8 | jongvolwassenen, volwassenen, koppels | tel | - | - |
| Iben Verstuyf | ja | 10 | jongvolwassenen, volwassenen, koppels, gezinnen | tel | - | - |

### Wat er in `therapeuten.json` staat

Per therapeut: `naam`, `slug`, `oude_url`, `foto` (lokaal bestand, bron-URL en afmetingen),
`aanmeldingsstop` (letterlijke tekst of leeg), `intro`, `themas` en `doelgroepen` (vaste
id's), `themas_origineel` (letterlijke formuleringen, elk met de id's waaronder ze vallen),
`doelgroep_origineel`, `opleiding`, `erkenningen`, `werkmomenten`, `contact` (telefoon, e-mail,
letterlijke opmerking over bereikbaarheid), `links` (externe links) en `inhoud`. Dat laatste is
de **volledige pagina, letterlijk**, opgedeeld in koppen, alinea's en lijsten (`hoofd` =
linkerkolom, `zij` = rechterkolom). De detailpagina toont `inhoud`; de andere velden zijn eruit
gehaald voor kaarten, filter en contactblok.

Lege velden, zo op de huidige site en niets aangevuld:

- geen foto en geen thema's bij Kristien;
- geen telefoon bij Ilse en Uus;
- geen e-mail bij Katrien, Katja, Pieter, Tine en Iben;
- geen erkenningen bij Sarah, Uus en Kristien;
- werkmomenten enkel bij Katja, Sarah, Uus en Charlotte.

De mailadressen waren op Weebly versleuteld door Cloudflare ("[email protected]"); de scraper
ontsleutelt ze.

## Themalijst

Elf therapeuten formuleren hun thema's op elf manieren: van "Piekeren" tot een alinea van vijf
regels. Voorstel: **14 vaste thema's** en **6 doelgroepen**. De id staat in de URL
(`/therapeuten?thema=angst&doelgroep=koppels`). De originele formulering blijft per therapeut
bewaard en staat letterlijk op de detailpagina.

Keuzes die ik maakte:

- Labels in gewone woorden, zoals iemand het zelf zou zeggen ("Angst en piekeren", niet
  "Angststoornissen").
- Eén formulering kan onder meerdere thema's vallen ("Gevoelens van angst, somberheid of
  stress" telt voor drie).
- **Supervisie en coaching voor hulpverleners** is een **doelgroep**, geen thema: het gaat om
  wie je bent, niet om wat er scheelt.
- Uus heeft geen lijst; zijn thema's komen uit zijn lopende tekst. Iben heeft één zin met
  puntkomma's; die is per stuk opgesplitst.
- Niet apart opgenomen: slaap (valt onder stress en burn-out), schaamte, schuld en kwaadheid
  (blijven in de originele tekst), hechting (valt onder relatie).

### Thema's

| id (URL) | Label | Therapeuten | Valt eronder (originele formulering) |
|---|---|---|---|
| `angst` | Angst en piekeren | 9 | Katrien: “Angst: faalangst, fobische klachten, paniekstoornis”<br>Katrien: “Piekeren”<br>Michaël: “psychische klachten en/of gedragsproblemen die uw functioneren binnen …”<br>Katja: “angst, schaamte, schuld, verdriet of kwaadheid”<br>Ilse: “Angsten”<br>Ilse: “Piekeren”<br>Sarah: “Emotionele problemen: onverwerkt verdriet, depressieve gevoelens, neer…”<br>Uus: “angst- of stemmingsstoornissen, zoals depressiviteit, en zeker ook rou…”<br>Charlotte: “Gevoelens van angst, somberheid of stress”<br>Tine: “Emotionele problemen (bv. depressieve gevoelens, angst, onzekerheid, ……”<br>Iben: “angsten”<br>Iben: “stress en piekeren” |
| `somberheid` | Somberheid en depressie | 9 | Katrien: “Depressieve klachten”<br>Michaël: “stemmingsgerelateerde problemen zoals depressie, bipolariteit, dysthym…”<br>Katja: “angst, schaamte, schuld, verdriet of kwaadheid”<br>Ilse: “Depressie”<br>Sarah: “Emotionele problemen: onverwerkt verdriet, depressieve gevoelens, neer…”<br>Uus: “angst- of stemmingsstoornissen, zoals depressiviteit, en zeker ook rou…”<br>Charlotte: “Gevoelens van angst, somberheid of stress”<br>Tine: “Emotionele problemen (bv. depressieve gevoelens, angst, onzekerheid, ……”<br>Iben: “depressieve gevoelens” |
| `stress-burn-out` | Stress en burn-out | 8 | Katrien: “Burn-out klachten”<br>Katrien: “Stress – spannings klachten”<br>Michaël: “energieproblemen: burn-out/bore-out. Met aandacht zowel voor individue…”<br>Katja: “burn-out, stress en slaapproblemen”<br>Ilse: “Burn-out en bore-out”<br>Sarah: “Emotionele problemen: onverwerkt verdriet, depressieve gevoelens, neer…”<br>Charlotte: “Gevoelens van angst, somberheid of stress”<br>Tine: “Burn-out klachten”<br>Iben: “stress en piekeren” |
| `rouw-verlies` | Rouw en verlies | 8 | Katrien: “Omgaan met verlies”<br>Pieter: “Rouw en verlies”<br>Pieter: “Scheiding”<br>Ilse: “Rouw, verlieservaringen”<br>Sarah: “Verwerking van verlieservaringen: overlijden, relatiebreuk, miskraam, …”<br>Uus: “angst- of stemmingsstoornissen, zoals depressiviteit, en zeker ook rou…”<br>Charlotte: “Verlies, rouw en ingrijpende ervaringen”<br>Tine: “Verlieservaringen (bv. overlijden, relatiebreuk, miskraam, abortus, zi…”<br>Iben: “verlieservaringen en rouw” |
| `trauma` | Trauma en ingrijpende ervaringen | 6 | Michaël: “slachtofferschap en/of verwerkingsproblemen.”<br>Katja: “trauma en relationele kwetsuren”<br>Pieter: “Ingrijpende gebeurtenissen binnen het gezin”<br>Pieter: “Ingrijpende levensgebeurtenissen”<br>Ilse: “Trauma”<br>Charlotte: “Verlies, rouw en ingrijpende ervaringen”<br>Iben: “moeilijke en traumatische ervaringen” |
| `relatie` | Relatie en koppel | 8 | Michaël: “relatieproblemen tussen partners: veelvuldige conflicten, seksuele fru…”<br>Katja: “relatie- en gezinsproblemen”<br>Katja: “terugkerende patronen in relaties”<br>Katja: “moeilijkheden rond verbinding, vertrouwen en grenzen”<br>Pieter: “Relatiebegeleiding en -bemiddeling”<br>Pieter: “Communicatieproblemen”<br>Pieter: “Relatievorming”<br>Pieter: “Scheiding”<br>Ilse: “Relatieproblemen”<br>Ilse: “Hechting”<br>Sarah: “Relationele vragen: conflicten, uit elkaar groeien, eenzaamheid, seksu…”<br>Charlotte: “Relationele moeilijkheden of communicatieproblemen”<br>Tine: “Relationele vragen (bv. conflicten, uit elkaar groeien, eenzaamheid, s…”<br>Iben: “relatiemoeilijkheden” |
| `gezin` | Gezin en opvoeding | 6 | Michaël: “nieuw-samengesteld-gezin problematiek;”<br>Katja: “relatie- en gezinsproblemen”<br>Pieter: “Opvoedingsvragen”<br>Pieter: “Nieuw samengestelde gezinnen”<br>Pieter: “Gezinsconflicten”<br>Pieter: “Ingrijpende gebeurtenissen binnen het gezin”<br>Pieter: “Ouderschap”<br>Sarah: “Gezinsvragen: opvoedingsondersteuning, ingrijpende gebeurtenissen, nie…”<br>Sarah: “Moederschap: als je je evenwicht maar niet lijkt terug te vinden na he…”<br>Charlotte: “Spanningen binnen het gezin”<br>Iben: “vastgelopen gezinssituaties” |
| `zelfbeeld` | Zelfbeeld en identiteit | 6 | Michaël: “zelfwaardeproblematiek: twijfel over voldoende liefdeswaardig te zijn,…”<br>Pieter: “Gender- en identiteitsvragen”<br>Sarah: “Emotionele problemen: onverwerkt verdriet, depressieve gevoelens, neer…”<br>Charlotte: “Identiteits- en levensfasevragen”<br>Tine: “Emotionele problemen (bv. depressieve gevoelens, angst, onzekerheid, ……”<br>Iben: “vragen rond seksualiteit en geaardheid”<br>Iben: “identiteitsvragen…” |
| `levensfase` | Levensfase en zingeving | 7 | Katrien: “Levensfaseproblematiek”<br>Katja: “levensfase- en zingevingsvragen”<br>Pieter: “Overgangen en veranderingen in de levensloop”<br>Pieter: “Jongvolwassenheid”<br>Pieter: “Werk- en loopbaantransities”<br>Ilse: “Zingevingsvragen”<br>Charlotte: “Identiteits- en levensfasevragen”<br>Tine: “Zingevingsvragen”<br>Iben: “levensfasemoeilijkheden” |
| `lichaam` | Lichamelijke klachten en ziekte | 3 | Katrien: “Psychosomatische klachten”<br>Katja: “psychosomatische klachten”<br>Katja: “chronische pijn, chronisch vermoeidheidssyndroom en chronische aandoen…”<br>Sarah: “Psycho-oncologie: begeleiding bij kankerdiagnose en behandeling” |
| `adhd-autisme` | ADHD, autisme en hoogsensitiviteit | 3 | Katrien: “ADHD (coaching / therapie)”<br>Pieter: “Hoogbegaafdheid”<br>Ilse: “Hoogsensitiviteit, ASS, AD(H)D,hoogbegaafdheid” |
| `zelfdestructief` | Zelfdestructieve gedachten | 2 | Michaël: “psychische klachten en/of gedragsproblemen die uw functioneren binnen …”<br>Iben: “zelfdestructieve neigingen”<br>Iben: “zelfmoordgedachten” |
| `verslaving` | Verslaving | 1 | Pieter: “Verslavingsproblematiek” |
| `werk-sociaal` | Werk en sociaal leven | 4 | Michaël: “psychische klachten en/of gedragsproblemen die uw functioneren binnen …”<br>Pieter: “Werk- en loopbaantransities”<br>Sarah: “Vragen rond sociaal functioneren: werk, sociaal leven, vrienden,…”<br>Tine: “Sociaal functioneren (bv. op werk, sociaal leven, vrienden, ...)” |

### Doelgroepen

| id (URL) | Label | Therapeuten | Valt eronder (originele formulering) |
|---|---|---|---|
| `jongvolwassenen` | Jongvolwassenen | 9 | Katrien: “Jongvolwassenen”<br>Katja: “jongvolwassenen (vanaf 15 jaar)”<br>Pieter: “(Jong)volwassenen”<br>Ilse: “(Jong)volwassenen”<br>Sarah: “(Jong)volwassenen”<br>Kristien: “Jongvolwassenen”<br>Charlotte: “(Jong)volwassenen”<br>Tine: “(Jong)volwassenen”<br>Iben: “(Jong)volwassenen” |
| `volwassenen` | Volwassenen | 11 | Katrien: “Volwassenen”<br>Michaël: “volwassenen”<br>Katja: “volwassenen”<br>Pieter: “(Jong)volwassenen”<br>Ilse: “(Jong)volwassenen”<br>Sarah: “(Jong)volwassenen”<br>Uus: “Volwassenen”<br>Kristien: “Volwassenen”<br>Charlotte: “(Jong)volwassenen”<br>Tine: “(Jong)volwassenen”<br>Iben: “(Jong)volwassenen” |
| `ouderen` | Ouderen | 2 | Katrien: “Ouderen”<br>Kristien: “Ouderen” |
| `koppels` | Koppels | 8 | Michaël: “koppels”<br>Katja: “koppels en gezinnen”<br>Pieter: “Koppels”<br>Ilse: “Koppels”<br>Sarah: “Koppels”<br>Charlotte: “Koppels”<br>Tine: “Koppels”<br>Iben: “Koppels” |
| `gezinnen` | Gezinnen | 5 | Katja: “koppels en gezinnen”<br>Pieter: “Gezinnen”<br>Sarah: “Gezinnen”<br>Charlotte: “Gezinnen”<br>Iben: “Gezinnen” |
| `hulpverleners` | Hulpverleners (supervisie en coaching) | 3 | Pieter: uit thema-item<br>Uus: uit thema-item<br>Charlotte: uit thema-item |

Let op: **"Volwassenen" geldt voor alle 11** therapeuten. Als filter levert die dus niets op.
Voorstel: wel tonen (met "11"), zodat niemand zich uitgesloten voelt, maar niet als eerste.

## Onduidelijkheden

### Voor de praktijk (voor de livegang, niet nodig voor de demo)

1. **Logo**: enkel een PNG van 323×100 px. Vectorbestand (SVG, AI of PDF) vragen.
2. **Portretten**: klein (150 tot 480 px) en heel verschillend van stijl. Grotere of nieuwe
   foto's vragen. Kristien heeft geen foto.
3. **Rechten headerfoto** (Fietsbult / Fietsersbond Gent): bevestigen dat de praktijk die mag
   gebruiken. De vermelding blijft staan.
4. **Locatiefoto**: watermerk linksonder en "TE KOOP"-borden aan de gevel; bron en rechten
   onbekend. Voorstel: in de demo niet gebruiken, de headerfoto en een kaart volstaan.
5. **Charlotte Ohms en Pieter Govaerts hebben hetzelfde erkenningsnummer** bij de
   Psychologencommissie (831109817). Waarschijnlijk een kopieerfout op de huidige site.
   Letterlijk overgenomen, niet aangepast.
6. **Kristien Lemaitre**: geen foto, geen thema's, en haar tekst begint abrupt ("Beeldvorming,
   hypothesevorming wordt telkens afgestemd..."). Het lijkt alsof er een stuk ontbreekt. Ze
   verschijnt nu enkel in het overzicht zolang er niet op thema gefilterd wordt.
7. **Michaël Callaert**: het menu zegt "Michael", zijn eigen pagina "Michaël". Ik gebruik
   Michaël. Zijn doelgroep zegt "koppels, volwassenen", maar zijn tekst noemt ook ouder-kind-
   en gezinsgesprekken. Nu niet als "gezinnen" gemarkeerd.
8. **Katja Desauw**: doelgroep "jongvolwassenen (vanaf 15 jaar)". Vijftienjarigen vallen
   eigenlijk niet onder "jongvolwassenen". Nu enkel als jongvolwassenen gemarkeerd.
9. **Taalfouten op de huidige site** die ik letterlijk overneem, bv. "gelegen aan Gentbrugge
   brug", "tav", "Stress – spannings klachten", "AD(H)D,hoogbegaafdheid", "veiligheid begint
   ook bij goed selectie". Corrigeren kan, maar enkel met akkoord.

### Voor jou, te beslissen vóór fase 2

10. **Aanmeldingsstop** (Katja, Pieter, Ilse): hoe tonen? Voorstel: een rustig label "Neemt
    tijdelijk geen nieuwe cliënten aan" op kaart en detailpagina, en achteraan in het
    overzicht. Wie belt en "nee" hoort, verliest tijd, en dat botst met "sneller de juiste
    therapeut".
11. **Crisisinformatie**: Iben noemt zelfmoordgedachten, Uus schrijft dat hij niet geschikt is
    voor crisisgevoelige mensen. Een korte, vaste vermelding (Zelfmoordlijn 1813, 112) past
    bij een therapiesite, maar is **nieuwe inhoud** en staat nu nergens. Toevoegen of niet?
12. **Psychiaters**: Uus en Kristien zijn psychiater en kunnen medicatie voorschrijven. Dat is
    een echt verschil voor wie zoekt. Een label of filteroptie "psychiater" zou helpen, maar
    staat niet in de brief.
13. **Tarieven**: vijf therapeuten noemen hun prijs (€65 tot €80) in hun eigen tekst. Die
    blijven daar letterlijk staan. Voorstel: geen apart prijsblok en geen vergelijking.
14. **Aanspreking**: Michaël, Katja, Sarah en Kristien schrijven "u", de anderen "je". Hun
    teksten blijven zoals ze zijn; nieuwe interfaceteksten gebruiken "je" (afgesproken).
15. **Kaart op /locatie**: nu een Google Maps-iframe die cookies zet. Voorstel: een statische
    kaart op basis van OpenStreetMap, lokaal gehost (geen enkele externe request, met
    "© OpenStreetMap-bijdragers"), plus een link "Open in kaarten" voor de route.
16. **Pieter Govaerts**: "(Jong)volwassenen" staat twee keer bij zijn doelgroep; in de nieuwe
    site één keer.
