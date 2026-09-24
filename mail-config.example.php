<?php
/**
 * Voorbeeld van het configuratiebestand dat mail.php verwacht.
 *
 * Zet de echte versie NIET hier, maar in de home van het hostingaccount:
 *
 *     ~/2x8-mail-config.php      (dus naast de map domains/)
 *
 * Daar komt de webserver niet bij en gaat hij niet mee in git. mail.php zoekt
 * hem op ../../../2x8-mail-config.php, gerekend vanaf de docroot.
 *
 * Ontbreekt het bestand, dan verstuurt mail.php gewoon via de lokale
 * mailserver. Niets valt dan stil, alleen de aflevering is minder betrouwbaar.
 */

return [
    'brevo_api_key' => 'xkeysib-...',
];
