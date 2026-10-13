<?php
declare(strict_types=1);

const APP = __DIR__ . '/..';
require APP . '/config.php';

/** HTML-escape. */
function e(?string $s): string
{
    return htmlspecialchars((string) $s, ENT_QUOTES, 'UTF-8');
}

/** Link binnen de site: url('/therapeuten'). */
function url(string $pad = '/', array $query = []): string
{
    $query = array_filter($query, fn($v) => $v !== null && $v !== '');
    return BASE_URL . $pad . ($query ? '?' . http_build_query($query) : '');
}

/** Bestand in de site met cachebuster op wijzigingsdatum: asset('assets/img/x.webp'). */
function asset(string $pad): string
{
    $f = APP . '/' . $pad;
    return BASE_URL . '/' . $pad . (is_file($f) ? '?v=' . filemtime($f) : '');
}

/**
 * Toon een sectie: sections/<naam>/<naam>.php met $p als parameters.
 * Een sectie = een toekomstig Gutenberg-block; $p = de block-attributen.
 */
function section(string $naam, array $p = []): void
{
    $GLOBALS['gebruikte_secties'][$naam] = true;
    (static function (string $__bestand, array $p): void {
        include $__bestand;
    })(APP . "/sections/$naam/$naam.php", $p);
}

/** Paginagegevens voor <head>: titel, beschrijving, pad. */
function page(array $meta): void
{
    $GLOBALS['meta'] = $meta;
}

// ---------------------------------------------------------------- data

function data(): array
{
    static $d;
    return $d ??= json_decode(file_get_contents(APP . '/data/therapeuten.json'), true, 512, JSON_THROW_ON_ERROR);
}

/** [id => label] voor 'themas' of 'doelgroepen'. */
function labels(string $taxonomie): array
{
    return array_column(data()[$taxonomie], 'label', 'id');
}

/** Gekozen filter uit de URL, enkel bekende id's. */
function filter_uit_url(): array
{
    $f = [];
    foreach (['thema' => 'themas', 'doelgroep' => 'doelgroepen'] as $param => $tax) {
        $v = $_GET[$param] ?? '';
        $f[$param] = is_string($v) && isset(labels($tax)[$v]) ? $v : '';
    }
    return $f;
}

function past(array $t, array $f): bool
{
    return ($f['thema'] === '' || in_array($f['thema'], $t['themas'], true))
        && ($f['doelgroep'] === '' || in_array($f['doelgroep'], $t['doelgroepen'], true));
}

function aantal(array $f): int
{
    return count(array_filter(data()['therapeuten'], fn($t) => past($t, $f)));
}

/**
 * De brug uit het logo: een dubbele boog over pijlers. Schaalt mee met zijn kader
 * (viewBox 0-100, boog = rand van een ellips met middelpunt 50,100 en stralen 70 en 100).
 * Pijlers: p-buiten altijd, p-twee op tablet, p-drie op desktop (zie basis.css).
 */
function brug(): string
{
    $pijlers = [[0, 36, 'buiten'], [33.333, 9, 'drie'], [50, 6, 'twee'], [66.667, 9, 'drie'], [100, 36, 'buiten']];
    $svg = '<svg class="brug" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false"><g class="brug__pijlers">';
    foreach ($pijlers as [$x, $tot, $soort]) {
        $svg .= "<line class=\"p-$soort\" x1=\"$x\" y1=\"-18\" x2=\"$x\" y2=\"$tot\"/>";
    }
    return $svg . '</g><g class="brug__boog"><path d="M-2 33.05A70 100 0 0 1 102 33.05"/><path d="M-2 31.04A70 103 0 0 1 102 31.04"/></g></svg>';
}

/** Initialen voor wie geen foto heeft. */
function initialen(string $naam): string
{
    $delen = array_filter(explode(' ', $naam), fn($w) => mb_strtoupper(mb_substr($w, 0, 1)) === mb_substr($w, 0, 1));
    return implode('', array_map(fn($w) => mb_substr($w, 0, 1), [reset($delen), end($delen)]));
}

// ---------------------------------------------------------------- demo

/** Wachtwoord en noindex zolang DEMO aan staat. Lokaal (php -S) zonder wachtwoord. */
function demo_poort(): void
{
    if (!DEMO) {
        return;
    }
    header('X-Robots-Tag: noindex, nofollow');
    if (PHP_SAPI === 'cli-server') {
        return;
    }
    $gebruiker = $_SERVER['PHP_AUTH_USER'] ?? null;
    $wachtwoord = $_SERVER['PHP_AUTH_PW'] ?? null;
    // Hostinger (LiteSpeed) geeft de header soms enkel door via de RewriteRule in .htaccess.
    $auth = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
    if ($gebruiker === null && str_starts_with($auth, 'Basic ')) {
        [$gebruiker, $wachtwoord] = array_pad(explode(':', (string) base64_decode(substr($auth, 6)), 2), 2, null);
    }
    if ($gebruiker === DEMO_GEBRUIKER && is_string($wachtwoord) && password_verify($wachtwoord, DEMO_WACHTWOORD_HASH)) {
        return;
    }
    header('WWW-Authenticate: Basic realm="Brug 48 (voorstel)", charset="UTF-8"');
    http_response_code(401);
    exit('Dit ontwerpvoorstel is beveiligd met een wachtwoord.');
}
