<?php
// Welkom
page([
    'titel' => 'Praktijk voor psychotherapie en begeleiding',
    'beschrijving' => 'Brug 48, praktijk voor psychotherapie en begeleiding van (jong)volwassenen, aan de Gentbruggebrug in Gentbrugge.',
    'pad' => '/',
]);

section('hero', [
    'titel' => 'Praktijk voor psychotherapie en begeleiding',
    'foto' => 'assets/img/gentbruggebrug',
    'breedtes' => [640, 1200, 1754],
    'formaat' => [1754, 1240],
    'alt' => 'Fietsers steken een brug over het water over.',
    'actie' => ['tekst' => 'Vind een therapeut', 'url' => url('/therapeuten')],
    'adres' => ['tekst' => 'Residentie Evrard, Vincent Evrardlaan 48 bus 202, 9050 Gentbrugge', 'url' => url('/locatie')],
]);

section('welkom', [
    'kop' => 'Welkom',
    'alineas' => [
        'Brug 48 is een praktijk voor psychotherapie en begeleiding, gelegen aan Gentbrugge brug.',
        'De ligging inspireerde ons voor de naamgeving van de praktijk. Bruggen bouwen, de brug oversteken, een brug met sterke pijlers: inspirerende metaforen die de essentie van verbondenheid en communicatie weergeven en die we moeiteloos kunnen vertalen naar het domein van de therapie.',
        'In Brug48 verwelkomen we onze cliënten - jongvolwassenen en volwassenen - in een hedendaagse, rustige setting waarin elk met zijn eigen levensverhaal, zijn vragen, zijn eigen waarden terecht kan.',
    ],
    'nadruk' => 1,
]);

section('zoeker', [
    'kop' => 'Waarmee kunnen we je helpen?',
    'tekst' => 'Kies een thema en je ziet meteen welke therapeuten erbij passen. Je neemt daarna rechtstreeks contact op.',
]);
