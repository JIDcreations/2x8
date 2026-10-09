# Salon Dola: boekingsmodule, achter de schermen

Technische uitwerking bij het voorbeeld op `2x8.be/salon-dola/boekingen`. Alles wat daar
zichtbaar is, moet met deze opzet echt te bouwen zijn. Doel: WordPress + Gravity Forms voor de
intake, een eigen plugin (`dola-boekingen`) voor de rest.

Deze map (`docs/`) wordt door `.htaccess` geblokkeerd: niet publiek.

## 1. Waarom Gravity Forms niet alles doet

Gravity Forms is goed in: formulier tonen, valideren, spam weren, entry opslaan, notificatie
sturen. Het is niet goed in: een statusmachine, beschikbaarheid berekenen, links met
handtekening, een overzicht met acties. Daarom:

- **Gravity Forms** = enkel de voordeur. Velden: behandeling (checkboxen), datum, tijd, naam,
  telefoon, e-mail, bericht, nieuwe klant, extensions-bevestiging.
- **Eigen plugin** = de boeking zelf. Hookt op `gform_after_submission_{form_id}`, maakt een
  boeking aan in een eigen tabel en neemt vanaf daar alles over (mails, links, dashboard, cron).
- De **Gravity Forms-notificaties staan uit** voor dit formulier. Anders krijgt de klant twee
  mails en zijn de mails niet in sync met de status. De entry blijft wel bewaard als bewijs van
  wat er ingevuld werd (en kan na x maanden automatisch weg).

### Datum- en tijdkiezer

De kalender met vrije uren is geen standaard GF-veld. Twee opties:

1. **Aanbevolen:** eigen veldtype via `GF_Field` (of een HTML-veld + twee verborgen velden
   `datum` en `start`) met eigen JS. De JS haalt vrije momenten op via
   `GET /wp-json/dola/v1/beschikbaarheid?datum=2026-10-09&diensten=kleuren,brushing`.
2. Datum- en tijdvelden van GF met `gform_field_validation` als controle. Werkt, maar toont geen
   bezette uren vooraf: de klant hoort pas bij versturen dat het niet past. Slechter.

**Altijd server-side opnieuw checken** in `gform_validation`: is het moment nog vrij, binnen de
uren, niet in het verleden, niet verder dan `max_dagen`? Twee mensen kunnen tegelijk hetzelfde
uur kiezen. Bij een conflict: validatiefout op het tijdveld ("Dit uur is net bezet, kies een
ander"). De insert zelf gebeurt in een transactie met een overlap-check (`SELECT ... FOR UPDATE`
op die dag), zodat er nooit twee actieve boekingen overlappen.

## 2. Datamodel

Eigen tabel, geen custom post type: we filteren en sorteren veel op datum en status, en dat is
met postmeta traag en omslachtig.

```sql
CREATE TABLE wp_dola_boekingen (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  ref             VARCHAR(12)  NOT NULL UNIQUE,      -- D-1071
  status          VARCHAR(24)  NOT NULL,             -- zie 3
  datum           DATE         NOT NULL,
  start_min       SMALLINT     NOT NULL,             -- minuten na middernacht
  duur_min        SMALLINT     NOT NULL,             -- vastgelegd bij aanvraag
  diensten        VARCHAR(255) NOT NULL,             -- "kleuren,brushing"
  voorstel_datum  DATE         NULL,
  voorstel_start  SMALLINT     NULL,
  naam            VARCHAR(120) NOT NULL,
  telefoon        VARCHAR(40)  NOT NULL,
  email           VARCHAR(190) NOT NULL,
  bericht         TEXT         NULL,
  nieuwe_klant    TINYINT(1)   NOT NULL DEFAULT 0,
  bron            VARCHAR(16)  NOT NULL DEFAULT 'website', -- website | telefoon
  klant_token     CHAR(43)     NOT NULL UNIQUE,      -- base64url van 32 random bytes
  gf_entry_id     BIGINT       NULL,
  aangemaakt      DATETIME     NOT NULL,
  gewijzigd       DATETIME     NOT NULL,
  herinnerd_tim   DATETIME     NULL,
  herinnerd_klant DATETIME     NULL,
  INDEX (datum, status),
  INDEX (status, aangemaakt)
);

CREATE TABLE wp_dola_log (          -- de "Geschiedenis" in het dashboard
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  boeking_id  BIGINT UNSIGNED NOT NULL,
  tijd        DATETIME NOT NULL,
  door        VARCHAR(16) NOT NULL,  -- klant | tim | systeem
  actie       VARCHAR(32) NOT NULL,
  van_status  VARCHAR(24) NULL,
  naar_status VARCHAR(24) NULL,
  info        TEXT NULL,             -- reden, bericht, oud moment, verstuurde mail
  INDEX (boeking_id)
);

CREATE TABLE wp_dola_blokken (      -- "Moment blokkeren": vakantie, tandarts, ziekte
  id     BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  datum  DATE NOT NULL,
  van    SMALLINT NOT NULL,
  tot    SMALLINT NOT NULL,
  reden  VARCHAR(120) NULL,
  INDEX (datum)
);
```

Instellingen (WP-opties, met een instellingenpagina): openingsuren per weekdag, diensten met
duur, stap (30 min), min/max vooruit boeken, annuleertermijn (24 u), herinnering Tim (2 dagen),
vervaltermijn (3 dagen), ontvangers, afzender.

`duur_min` wordt bij de aanvraag vastgelegd. Verandert Tim later de duur van "kleuren", dan
schuiven bestaande afspraken niet mee.

## 3. Statussen en overgangen

| Status              | Houdt moment bezet | Komt van                       |
|---------------------|--------------------|--------------------------------|
| `nieuw`             | ja                 | aanvraag, of klant wijzigt     |
| `voorstel`          | ja (het voorstel)  | Tim stelt ander moment voor    |
| `bevestigd`         | ja                 | Tim bevestigt, of klant accepteert voorstel |
| `geweigerd`         | nee                | Tim weigert een `nieuw`        |
| `geannuleerd_klant` | nee                | klant via link                 |
| `geannuleerd_salon` | nee                | Tim annuleert `bevestigd`/`voorstel` |
| `verlopen`          | nee                | cron: geen reactie             |

`afgewerkt` is geen opgeslagen status: het is `bevestigd` met een datum in het verleden.
Eventueel later `niet_gekomen` toevoegen (Tim markeert een no-show).

Toegestane overgangen, en dus de enige acties die de code aanbiedt:

```
nieuw      --tim:bevestig-->      bevestigd
nieuw      --tim:voorstel-->      voorstel
nieuw      --tim:weiger-->        geweigerd
nieuw      --klant:wijzig-->      nieuw          (nieuw moment, Tim krijgt opnieuw mail)
nieuw      --klant:annuleer-->    geannuleerd_klant
nieuw      --cron:3 dagen-->      verlopen
voorstel   --klant:accepteer-->   bevestigd      (voorstel wordt het moment)
voorstel   --klant:wijzig-->      nieuw
voorstel   --klant:annuleer-->    geannuleerd_klant
voorstel   --tim:annuleer-->      geannuleerd_salon
voorstel   --cron:3 dagen-->      verlopen
bevestigd  --tim:verleg-->        voorstel
bevestigd  --tim:annuleer-->      geannuleerd_salon
bevestigd  --klant:wijzig-->      nieuw          (enkel tot 24 u vooraf)
bevestigd  --klant:annuleer-->    geannuleerd_klant (enkel tot 24 u vooraf)
```

Alles in een functie `dola_overgang($boeking, $actie, $door, $data)`: checkt of de overgang mag,
schrijft status + log in een transactie, en stuurt daarna de bijhorende mail. Mag de overgang
niet (oude link, dubbele klik), dan gebeurt er niets en toont de pagina de huidige stand. Zo is
elke link idempotent.

## 4. Links in de mails

### Tim (beheerlinks)

`https://salondola.be/afspraak/actie/<ref>/<actie>?exp=<unix>&sig=<hmac>`

- `sig = HMAC-SHA256(secret, ref|actie|exp)`, `secret` in `wp-config.php`, niet in de database.
- Geldig 14 dagen. Daarna: "Deze link is verlopen, open het dashboard."
- **Een GET verandert nooit iets.** Mailscanners (Outlook Safe Links, Gmail, virusscanners)
  openen links vooraf. Zou een GET bevestigen, dan bevestigt Microsoft je afspraken. De link
  toont daarom een bevestigingspagina (de telefoon in het voorbeeld) met een `POST`-knop, plus
  een WP-nonce. Optioneel: als Tim ingelogd is in WP, mag het ook zonder handtekening.
- Bij verleggen toont de pagina de eerstvolgende vrije momenten voor die duur (zelfde
  beschikbaarheidsfunctie), plus een kalender voor wie verder wil kijken.

### Klant (beheerpagina)

`https://salondola.be/afspraak/<klant_token>`

- Token = 32 random bytes, base64url. Geen gok mogelijk, geen login nodig.
- Toont status, moment, en de acties die op dat moment mogen (zie 3).
- Binnen de annuleertermijn: enkel nog het telefoonnummer.
- Wijzigen = zelfde kalender als het formulier, boeking gaat terug naar `nieuw`.
- Ook hier: GET toont, POST doet. Annuleren vraagt een bevestiging.
- `X-Robots-Tag: noindex` en `Referrer-Policy: no-referrer` op deze pagina's.

Routes via `add_rewrite_rule` naar een eigen template, of via `template_redirect`. Geen
Gravity Forms nodig voor deze pagina's.

## 5. Mails

Allemaal via de plugin, met `wp_mail` en een SMTP-plugin (of Brevo, zoals op 2x8.be: zie
`mail.php`). Afzender `afspraak@salondola.be`, `Reply-To` naar Tim zodat een klant gewoon kan
antwoorden. SPF, DKIM en DMARC op het domein in orde brengen, anders landen ze in spam.

| Trigger                  | Naar   | Inhoud                                              |
|--------------------------|--------|-----------------------------------------------------|
| aanvraag                 | Tim    | details, conflictcheck, 3 knoppen                   |
| aanvraag                 | klant  | ontvangen, "nog geen afspraak", link wijzig/annuleer |
| tim:bevestig             | klant  | bevestigd + `.ics`-bijlage + link                   |
| tim:voorstel / verleg    | klant  | voorstel + "Ja, dat past" + "Ander moment"          |
| tim:weiger               | klant  | reden/bericht + link naar nieuwe aanvraag           |
| tim:annuleer             | klant  | excuses + link naar nieuwe aanvraag                 |
| klant:annuleer           | Tim    | melding, reden                                      |
| klant:wijzig             | Tim    | zoals een nieuwe aanvraag, met het oude moment      |
| klant:wijzig             | klant  | ontvangen (zoals bij aanvraag)                      |
| klant:accepteer          | Tim + klant | Tim: melding. Klant: bevestiging + `.ics`      |
| cron: nieuw > 2 dagen    | Tim    | herinnering, open aanvragen                         |
| cron: nieuw/voorstel > 3 dagen | klant | verlopen                                      |
| cron: dag ervoor 10 u    | klant  | herinnering, link annuleren                         |

Templates als PHP-bestanden in de plugin (een layout + een partial per mail), tabellen en
inline CSS, 600 px breed, licht. Het voorbeeld toont de inhoud; de echte HTML moet ook in
Outlook werken (geen flex, knoppen als tabelcel met `bgcolor`).

`.ics`: `METHOD:PUBLISH`, `UID:<ref>@salondola.be`, vaste `SEQUENCE` die stijgt bij verleggen,
tijdzone `Europe/Brussels`. Bij annuleren eventueel een `.ics` met `STATUS:CANCELLED`.

Elke verstuurde mail komt in `wp_dola_log`. Faalt het versturen, dan ook loggen en tonen in het
dashboard; nooit stilletjes.

## 6. Cron

WP-cron is onbetrouwbaar op een rustige site. Op Hostinger: echte cron elke 15 minuten op
`wp cron event run --due-now` (of een eigen REST-endpoint met geheim). Taken:

- `nieuw` ouder dan 2 dagen, nog niet herinnerd: mail naar Tim.
- `nieuw` of `voorstel` ouder dan 3 dagen: naar `verlopen`, mail naar klant.
- `bevestigd` voor morgen, nog niet herinnerd, na 10 u: herinnering naar klant.
- Eens per nacht: persoonsgegevens van boekingen ouder dan 24 maanden anonimiseren (GDPR),
  Gravity Forms-entries ouder dan 3 maanden verwijderen.

`nieuw` dat in het verleden ligt (aanvraag voor morgen, Tim reageert niet) ook laten vervallen.

## 7. Beschikbaarheid

Een functie, gebruikt door het formulier, de verleg-pagina, de klantpagina en de validatie:

```
vrije_starts(datum, duur, negeer_boeking_id = null):
  uren   = openingsuren[weekdag(datum)]   -> leeg als gesloten
  bezet  = boekingen op datum met status in (nieuw, voorstel, bevestigd), behalve negeer_id
           (bij voorstel telt het voorgestelde moment, niet het originele)
         + blokken op datum
  for s = open; s + duur <= sluit; s += stap:
     vrij als s > nu + 2 uur en [s, s+duur) overlapt met niets in bezet
```

`negeer_boeking_id` is nodig bij wijzigen: het eigen moment telt dan niet als bezet.

Pauzes (middag) en buffer tussen afspraken (bv. 15 min opkuisen) zijn extra instellingen die
dezelfde functie meeneemt. Telefonische afspraken voert Tim in het dashboard in (bron
`telefoon`, meteen `bevestigd`, mail naar klant optioneel), zodat die uren online ook bezet zijn.

## 8. Dashboard

Een WP-adminpagina (`add_menu_page`, capability `manage_options` of een eigen rol voor Tim)
of een frontendpagina achter login op `/beheer`. Voor Tim op gsm is de frontendversie
vriendelijker; de WP-admin is een prima eerste versie.

- Teller-tegels: nieuw, bevestigd deze week, wacht op klant, geannuleerd deze maand.
- Lijst gegroepeerd per dag, filters op status, zoeken op naam/telefoon/ref.
- Weekweergave (di tot za).
- Detailpaneel: gegevens, acties (zelfde `dola_overgang`), geschiedenis uit `wp_dola_log`.
- Knoppen: afspraak invoeren (telefonisch), moment blokkeren, export (CSV).
- Acties via `admin-post.php` of de REST API met nonce, nooit via GET.

## 9. Veiligheid en randgevallen

- Honeypot + GF anti-spam (of Turnstile). Rate limit per IP op de beschikbaarheids-API.
- Alle invoer server-side valideren; telefoon normaliseren, e-mail verplicht (in het huidige
  ontwerp is e-mail optioneel; voor boekingen moet het verplicht worden).
- Extensions: checkbox "geen extensions van elders" blijft verplicht als extensions gekozen is.
- Klant vraagt twee keer hetzelfde aan: dedup op e-mail + datum binnen 10 minuten.
- Tim klikt twee keer of op een oude mail: idempotent, toont huidige stand (zie 3).
- Zomeruur: alles in `Europe/Brussels` rekenen, minuten-na-middernacht per datum, nooit UTC
  timestamps optellen.
- Mail naar Tim faalt: dashboard toont een badge met openstaande aanvragen, zodat er nooit
  iets onzichtbaar blijft.

## 10. Bouwvolgorde

1. Plugin-skelet, tabellen, instellingen, `vrije_starts`, `dola_overgang` met tests.
2. Gravity Forms-koppeling: veld, validatie, aanmaak boeking, eerste twee mails.
3. Beheerlinks voor Tim + bevestigingspagina's (bevestig, voorstel, weiger).
4. Klantpagina (status, wijzig, annuleer, voorstel accepteren).
5. Overige mails + `.ics`.
6. Cron (herinneringen, verlopen, opkuis).
7. Dashboard (lijst, detail, acties), daarna week, blokkeren, telefonische invoer.
