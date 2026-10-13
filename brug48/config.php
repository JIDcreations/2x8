<?php
// Alles wat verandert bij de livegang staat hier. Zie README.md, "Livegang".

// Pad van de site op de server, zonder slash op het einde. Op brug48.be: ''.
const BASE_URL = '/brug48';

// Domein voor absolute URL's (canonical, Open Graph). Op brug48.be: 'https://www.brug48.be'.
const SITE_URL = 'https://2x8.be';

// Demo-modus: wachtwoord (HTTP basic auth), noindex en de 2X8-melding in de footer.
// Bij livegang op false zetten (en de X-Robots-Tag-regel in .htaccess weghalen).
const DEMO = true;
const DEMO_GEBRUIKER = 'brug48';
const DEMO_WACHTWOORD_HASH = '$2y$12$jaq6gZWffgbZgeTnoAyjBO3PSxXR6OMWaryyk1pHcxabDStuNZFX.'; // het wachtwoord zelf staat in .demo-wachtwoord, niet in git
