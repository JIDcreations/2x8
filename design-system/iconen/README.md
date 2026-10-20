# Iconen

Naast de negen eigen symbolen gebruikt de site **Solar Bold Duotone** (480 Design, licentie CC BY 4.0) voor iconen op tegels: diensten, stappen, problemen. Gekozen omdat ze dik en tweetonig zijn: de tweede laag neemt de tegelkleur mee, zodat het icoon in het vlak zit in plaats van erop te liggen.

- Alles staat in `solar.svg` als sprite. Gebruik: `<svg class="icoon" aria-hidden="true"><use href="design-system/iconen/solar.svg#naam"></use></svg>`. Werkt zonder JavaScript.
- Altijd `inkt`, op `petrol` `op-petrol`. Op een kleurtegel, nooit los in tekst.
- De vermelding "Iconen: Solar van 480 Design, CC BY 4.0" staat in de footer. Die moet blijven.
- Een icoon nodig dat er nog niet in zit: haal het op van `https://api.iconify.design/solar/<naam>-bold-duotone.svg` en voeg het als `<symbol>` toe.
- De symbolen `pijl-rechts` (in knoppen) en het logo blijven uit `bundle.js`.
