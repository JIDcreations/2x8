<?php
/**
 * Sitekop: logo en hoofdmenu. WordPress: template part "header".
 * @param string $p['actief'] huidig pad, voor aria-current
 */
$menu = ['/therapeuten' => 'Therapeuten', '/locatie' => 'Locatie'];
$actief = $p['actief'] ?? '';
?>
<header class="site-header dek">
  <a class="site-header__logo" href="<?= e(url('/')) ?>"<?= $actief === '/' ? ' aria-current="page"' : '' ?>>
    <img src="<?= e(asset('assets/img/brug48-logo.png')) ?>" alt="Brug 48, welkom" width="323" height="100">
  </a>
  <nav class="site-header__menu" aria-label="Hoofdmenu">
    <ul>
      <?php foreach ($menu as $pad => $label): ?>
        <li><a href="<?= e(url($pad)) ?>"<?= $actief === $pad || str_starts_with($actief, $pad . '/') ? ' aria-current="page"' : '' ?>><?= e($label) ?></a></li>
      <?php endforeach ?>
    </ul>
  </nav>
</header>
