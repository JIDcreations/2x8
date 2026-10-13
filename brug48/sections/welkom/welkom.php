<?php
/**
 * Welkomtekst van de praktijk. WordPress: block "brug48/tekst-met-kop".
 * @param string   $p['kop']
 * @param string[] $p['alineas']  letterlijk; de alinea met index $p['nadruk'] staat groter
 * @param int      $p['nadruk']
 */
?>
<section class="welkom dek pijlers" aria-labelledby="welkom-kop">
  <h2 id="welkom-kop"><?= e($p['kop']) ?></h2>
  <div class="welkom__tekst">
    <?php foreach ($p['alineas'] as $i => $alinea): ?>
      <p<?= $i === ($p['nadruk'] ?? -1) ? ' class="welkom__nadruk"' : '' ?>><?= e($alinea) ?></p>
    <?php endforeach ?>
  </div>
</section>
