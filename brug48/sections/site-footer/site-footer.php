<?php
/**
 * Sitevoet: adres, menu en crisishulp. WordPress: template part "footer".
 * @param string $p['actief'] huidig pad
 */
$menu = ['/' => 'Welkom', '/therapeuten' => 'Therapeuten', '/locatie' => 'Locatie'];
?>
<footer class="site-footer">
  <div class="dek pijlers">
    <div class="site-footer__adres">
      <p class="site-footer__naam">Brug 48</p>
      <address>Residentie Evrard<br>Vincent Evrardlaan 48 bus 202<br>9050 Gentbrugge</address>
    </div>
    <nav class="site-footer__menu" aria-label="Voettekstmenu">
      <ul>
        <?php foreach ($menu as $pad => $label): ?>
          <li><a href="<?= e(url($pad)) ?>"<?= ($p['actief'] ?? '') === $pad ? ' aria-current="page"' : '' ?>><?= e($label) ?></a></li>
        <?php endforeach ?>
      </ul>
    </nav>
    <?php section('crisishulp', [
        'kop' => 'Dringend hulp nodig?',
        'regels' => [
            ['tekst' => 'Denk je aan zelfdoding? Bel de Zelfmoordlijn op', 'nummer' => '1813', 'na' => ', gratis en dag en nacht.'],
            ['tekst' => 'Is er levensgevaar? Bel', 'nummer' => '112', 'na' => '.'],
        ],
        'chat' => ['tekst' => 'Liever chatten?', 'url' => 'https://www.zelfmoord1813.be', 'label' => 'zelfmoord1813.be'],
    ]) ?>
  </div>
  <?php if (DEMO): ?>
    <div class="dek"><p class="site-footer__demo">Ontwerpvoorstel van 2X8, oktober 2026. Dit is niet de officiële website van Brug 48.</p></div>
  <?php endif ?>
</footer>
