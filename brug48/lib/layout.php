<?php
// Paginaskelet rond $inhoud. Header en footer zijn secties (later template parts in WordPress).
$meta = $GLOBALS['meta'] ?? [];
$titel = isset($meta['titel']) ? $meta['titel'] . ' | Brug 48' : 'Brug 48 | Praktijk voor psychotherapie en begeleiding';
$beschrijving = $meta['beschrijving'] ?? 'Brug 48, praktijk voor psychotherapie en begeleiding van (jong)volwassenen';
$canoniek = SITE_URL . url($meta['pad'] ?? $pad);

ob_start();
section('site-header', ['actief' => $pad]);
$kop = ob_get_clean();

ob_start();
section('site-footer', ['actief' => $pad]);
$voet = ob_get_clean();

// CSS gaat inline mee (geen render-blokkerende requests): tokens, basis, en enkel de gebruikte secties.
$css = file_get_contents(APP . '/assets/css/tokens.css') . file_get_contents(APP . '/assets/css/basis.css');
$js = [];
foreach (array_keys($GLOBALS['gebruikte_secties']) as $s) {
    if (is_file($f = APP . "/sections/$s/$s.css")) {
        $css .= "\n/* $s */\n" . file_get_contents($f);
    }
    if (is_file(APP . "/sections/$s/$s.js")) {
        $js[] = asset("sections/$s/$s.js");
    }
}
// Zelfde URL als de preload hieronder, anders laadt de browser het lettertype twee keer.
$css = strtr($css, [
    '{{jost}}' => asset('assets/fonts/jost-var-latin.woff2'),
    '{{literata}}' => asset('assets/fonts/literata-var-latin.woff2'),
]);
?>
<!doctype html>
<html lang="nl-BE">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title><?= e($titel) ?></title>
<meta name="description" content="<?= e($beschrijving) ?>">
<?php if (DEMO): ?>
<meta name="robots" content="noindex, nofollow">
<?php endif ?>
<link rel="canonical" href="<?= e($canoniek) ?>">
<meta property="og:type" content="website">
<meta property="og:locale" content="nl_BE">
<meta property="og:site_name" content="Brug 48">
<meta property="og:title" content="<?= e($meta['titel'] ?? 'Brug 48') ?>">
<meta property="og:description" content="<?= e($beschrijving) ?>">
<meta property="og:url" content="<?= e($canoniek) ?>">
<meta property="og:image" content="<?= e(SITE_URL . asset('assets/img/og-brug48.jpg')) ?>">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="theme-color" content="#EEEFE5">
<link rel="icon" href="<?= e(asset('assets/img/favicon.svg')) ?>" type="image/svg+xml">
<link rel="preload" href="<?= e(asset('assets/fonts/jost-var-latin.woff2')) ?>" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="<?= e(asset('assets/fonts/literata-var-latin.woff2')) ?>" as="font" type="font/woff2" crossorigin>
<script>document.documentElement.classList.add('js');addEventListener('pagereveal',e=>{if(e.viewTransition)document.documentElement.classList.add('overgang')})</script>
<style>
<?= $css ?>
</style>
</head>
<body>
<a class="naar-inhoud" href="#inhoud">Naar de inhoud</a>
<?= $kop ?>
<main id="inhoud" tabindex="-1">
<?= $inhoud ?>
</main>
<?= $voet ?>
<?php foreach ($js as $src): ?>
<script src="<?= e($src) ?>" defer></script>
<?php endforeach ?>
</body>
</html>
