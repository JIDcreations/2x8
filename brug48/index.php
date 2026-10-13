<?php
declare(strict_types=1);

// Lokaal: php -S localhost:8048 brug48/index.php (vanuit de map erboven). Bestaande bestanden
// serveert de ingebouwde server zelf; op de server doet .htaccess dat.
if (PHP_SAPI === 'cli-server') {
    $bestand = realpath($_SERVER['DOCUMENT_ROOT'] . urldecode((string) parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH)));
    if ($bestand && is_file($bestand) && $bestand !== __FILE__) {
        return false;
    }
}

require __DIR__ . '/lib/app.php';

demo_poort();

$pad = rawurldecode((string) parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH));
if (BASE_URL !== '' && !str_starts_with($pad . '/', BASE_URL . '/')) {
    header('Location: ' . url('/'), true, 302);
    exit;
}
$pad = substr($pad, strlen(BASE_URL)) ?: '/';

// Eén schrijfwijze per pagina: geen slash op het einde, geen lege filterparameters.
$schoon = $pad === '/' ? '/' : rtrim($pad, '/');
$query = array_filter($_GET, fn($v) => $v !== '');
if ($schoon !== $pad || count($query) !== count($_GET)) {
    header('Location: ' . url($schoon, $query), true, 301);
    exit;
}

$routes = [
    '/' => 'home',
    '/therapeuten' => 'therapeuten',
    '/locatie' => 'in-opbouw',
];
$pagina = $routes[$pad] ?? null;
$slug = null;
if (preg_match('~^/therapeuten/([a-z0-9-]+)$~', $pad, $m)) {
    $slug = $m[1];
    $pagina = in_array($slug, array_column(data()['therapeuten'], 'slug'), true) ? 'in-opbouw' : null;
}
if ($pagina === null) {
    http_response_code(404);
    $pagina = '404';
}

$GLOBALS['gebruikte_secties'] = [];
ob_start();
require __DIR__ . "/pages/$pagina.php";
$inhoud = ob_get_clean();

require __DIR__ . '/lib/layout.php';
