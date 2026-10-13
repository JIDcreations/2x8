<?php
page(['titel' => 'Pagina niet gevonden', 'pad' => $pad]);

section('melding', [
    'titel' => 'Deze pagina bestaat niet (meer).',
    'tekst' => 'Misschien is de link verouderd. Via het overzicht vind je elke therapeut terug.',
    'link' => ['tekst' => 'Naar de therapeuten', 'url' => url('/therapeuten')],
]);
