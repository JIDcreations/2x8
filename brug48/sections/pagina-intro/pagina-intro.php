<?php
/**
 * Paginatitel onder de boog. WordPress: block "brug48/pagina-intro".
 * @param string $p['titel']
 * @param string $p['tekst']  optioneel
 */
?>
<section class="pagina-intro" aria-labelledby="pagina-titel">
  <div class="dek">
    <div class="pagina-intro__boog"><?= brug() ?></div>
    <div class="pagina-intro__tekst">
      <h1 id="pagina-titel"><?= e($p['titel']) ?></h1>
      <?php if (!empty($p['tekst'])): ?>
        <p><?= e($p['tekst']) ?></p>
      <?php endif ?>
    </div>
  </div>
</section>
