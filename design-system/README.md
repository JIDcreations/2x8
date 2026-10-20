2X8 is licht, kleurrijk en vriendelijk. Het merk bestaat uit **zachte kleurtegels** met **dikke zwarte symbolen** op een lichte grond, en grote, strakke tekst. Het voelt als een goed ontworpen app: helder, speels in kleur, rustig in vorm.

## De kern

- **Licht.** De grond is altijd `kalk`. Geen donkere pagina's, geen zwarte achtergronden.
- **Kleur in tegels.** Kleur zit in afgeronde vlakken, nooit in tekst of lijnen. Elke tegel heeft een kleur.
- **Een symbool, een woord.** Elke tegel draagt een dik zwart symbool en hoogstens een woord.
- **Zacht, niet hard.** Net als de letters van het logo: ronde hoeken (`radius-m`, `radius-l`), pilvormige knoppen, beweging die veert.
- **Groot en strak in tekst.** Schibsted Grotesk zwaar en krap voor koppen, rustig voor tekst.

## Stem

- Spreek de lezer aan met **je**. Vlaams, informeel, zeker.
- Korte zinnen. Bold op het kernwoord.
- Geen em dashes, geen emoji's, geen vakjargon als "optimalisatie" of "AI workflows". Zeg wat er gebeurt.
- Koppen zijn twee tot vijf woorden: "Meer klanten. Minder werk."

Voorbeelden:

> We bouwen **websites** die klanten brengen en **tools** die uren besparen.
> Je typt elke offerte opnieuw over. Dat hoeft niet meer.
> **8 uur** per week terug voor een vleesverkoper.

## Kleur

Een lichte basis en een familie van acht zachte tegelkleuren. `inkt` is exact de kleur van het logo.

| Rol | Tokens |
| --- | --- |
| Grond | `kalk` (pagina), `wit` (neutrale tegels en kaarten), `rand` (zachte lijnen) |
| Tekst | `inkt` (alles), `inkt-zacht` (metadata) |
| Tegels | `violet`, `oranje`, `petrol`, `limoen`, `hemel`, `salie`, `zon`, `leisteen` |

Regels:

- Zet `inkt` op elke tegelkleur, behalve op `petrol`: daar komt `op-petrol`.
- Kleur nooit tekst of lijnen. Kleur zit enkel in vlakken: tegels, widgets, chips, het vak in een lijst-rij.
- Gebruik drie tot vijf kleuren naast elkaar, nooit alle acht tegelijk.
- `oranje` is de kleur van het beeldmerk en van de knop die moet opvallen. Meestal is dat contact.
- Vaste kleur per dienst, zodat klanten ze leren herkennen: Websites `oranje`, Tools `hemel`, Automatisatie `salie`, Hosting `petrol`, Strategie `violet`, Resultaat `limoen`, Contact `zon`.

## Typografie

- **Schibsted Grotesk** (`sans`) voor alle tekst: `display`, `kop`, `tegel`, `getal`, `lead`, `body`. Zwaar (750 tot 900) en krap gespatieerd voor groot, 400 voor tekst.
- **DM Mono** (`mono`) enkel voor `label`: metadata, datums, kleine labels in widgets. Gewone hoofd- en kleine letters.
- Laden:

```html
<link href="https://fonts.googleapis.com/css2?family=Schibsted+Grotesk:wght@400..900&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">
```

- `display` hoogstens een keer per pagina. Lopende tekst maximaal 65 tekens breed. Cijfers met `font-variant-numeric: tabular-nums`.

## Symbolen

Negen eigen symbolen, getekend op een raster van 120 met een lijndikte van 14, rechte uiteinden:
`cirkel`, `pijl`, `ster`, `schakel`, `kruis`, `acht`, `punt`, `pijl-rechts`, `golf`.

- Altijd `inkt` (of `op-petrol` op petrol), op een kleurtegel. Nooit los in tekst, nooit in kleur.
- `X8.symbool(naam)` geeft de SVG; `data-symbool="naam"` met `X8.mount()` vult een element.
- Een symbool betekent iets: het hoort bij een dienst of een actie. Gebruik ze niet als versiering.
- Voor iconen op tegels (diensten, stappen, problemen) gebruikt de site Solar Bold Duotone, zie `iconen/README.md`. Geen andere sets ernaast.

## Vorm en raster

- Afronding: `radius-l` voor grote tegels, `radius-m` voor widgets en lijst-rijen, `radius-s` voor velden, `radius-pill` voor knoppen en chips.
- Tegels liggen dicht op elkaar, met `space-1` ertussen, zoals widgets op een telefoon.
- Secties met veel lucht: `space-15` op desktop, `space-8` op gsm. Binnenmarges `space-2` en `space-3`.
- 12 kolommen op desktop, 4 op gsm, zijgoot minstens `space-2`.
- Geen schaduwen. Diepte komt van kleur, niet van schaduw.

## Beeld

- Foto's licht en natuurlijk, in afgeronde kaders (`radius-l`). Echte klanten en echte plekken, geen stockfoto's van laptops.
- Screenshots van werk op een `wit`-tegel met `space-3` marge.
- Mag een foto naast tegels staan, dan neemt de foto de plek van een tegel in het raster.

## Beweging

- Zacht en verend: `240ms cubic-bezier(.2,.8,.2,1)`.
- Hover op een tegel: 4px omhoog en een graad gekanteld. Hover op een lijst-rij: het kleurvak kantelt.
- Bij het laden schuiven tegels een voor een in, met 60ms tussen elk.
- Respecteer `prefers-reduced-motion`: dan geen beweging.

## Logo

Het officiële logo is het bestand `2x8-logo-inkt.svg` in de groep Logo. De dikke, afgeronde letters zijn het vertrekpunt van het hele merk: zachte hoeken, zware vormen, licht van toon.

- Gebruik altijd het SVG-bestand of `X8.logo()`. Typ het logo nooit na in een lettertype.
- Kleur: `inkt` (#181818) op `kalk`, `wit` en lichte tegels. `2x8-logo-kalk.svg` enkel op `petrol` of op een foto.
- Vrije ruimte rondom: minstens de hoogte van de X. Minimale hoogte: 20px op scherm, 8mm op papier.
- **Beeldmerk**: de X uit het logo op een `oranje` tegel (`2x8-beeldmerk.svg`). Voor avatar, favicon en de stempel op cases.
- Niet doen: vervormen, uitrekken, een omlijning geven, andere kleuren dan `inkt` of `kalk`, het logo op een drukke foto zonder rustige plek.

## Toepassingen

- **Website**: hero met `display` en `lead` op `kalk`, daaronder een rij Tegels met de diensten. Werk als Lijst of als raster van Widgets met resultaten.
- **Kwartaalrapport**: bento van Widgets met de cijfers, een kleur per thema.
- **Instagram**: een tegel per post, vierkant, een symbool en een woord of een cijfer. Feed wordt een kleurrijk raster.
- **Offertes en facturen**: `kalk`-papier, logo bovenaan, tegelkleur van de dienst als klein vlak naast de titel.
