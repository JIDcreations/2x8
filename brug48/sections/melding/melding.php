<?php
/**
 * Korte melding met een weg verder (404, pagina in opbouw). WordPress: patroon of block "brug48/melding".
 * @param string $p['titel']
 * @param string $p['tekst']
 * @param array  $p['link']  ['tekst' => ..., 'url' => ...]
 */
?>
<section class="melding" aria-labelledby="melding-titel">
  <div class="dek">
    <div class="melding__boog"><?= brug() ?></div>
    <div class="melding__tekst">
      <h1 id="melding-titel"><?= e($p['titel']) ?></h1>
      <p><?= e($p['tekst']) ?></p>
      <a class="knop" href="<?= e($p['link']['url']) ?>"><?= e($p['link']['tekst']) ?></a>
    </div>
  </div>
</section>
