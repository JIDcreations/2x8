<?php
// Therapeutenoverzicht met filter
page([
    'titel' => 'Therapeuten',
    'beschrijving' => 'De therapeuten van Brug 48. Zoek op thema of op voor wie je hulp zoekt, en neem rechtstreeks contact op.',
    'pad' => '/therapeuten',
]);

section('pagina-intro', [
    'titel' => 'Therapeuten',
    'tekst' => 'Kies waarmee je zit of voor wie je hulp zoekt. Je neemt daarna rechtstreeks contact op met de therapeut.',
]);

section('therapeuten-overzicht', [
    'filter_knop' => 'Filter op thema of voor wie',
    'kop_thema' => 'Thema',
    'kop_doelgroep' => 'Voor wie',
    'alle_themas' => "Alle thema's",
    'iedereen' => 'Iedereen',
    'knop' => 'Toon therapeuten',
    'stop' => 'Neemt tijdelijk geen nieuwe cliënten aan',
    'leeg' => 'Geen therapeut past bij beide keuzes.',
    'leeg_tekst' => 'Laat een van de twee los:',
]);
