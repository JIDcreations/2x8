<?php
// Tijdelijk tot fase 3: detailpagina's en Locatie.
$naam = $slug ? array_column(data()['therapeuten'], 'naam', 'slug')[$slug] : 'Locatie';
page(['titel' => $naam, 'pad' => $pad]);

section('melding', [
    'titel' => $naam,
    'tekst' => 'Deze pagina komt in de volgende fase van het voorstel.',
    'link' => ['tekst' => 'Terug naar de therapeuten', 'url' => url('/therapeuten')],
]);
