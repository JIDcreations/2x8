<?php
/**
 * Waar je terechtkunt bij een crisis. WordPress: block "brug48/crisishulp".
 * @param string $p['kop']
 * @param array  $p['regels']  [['tekst' => ..., 'nummer' => ..., 'na' => ...]]; nummer wordt een tel:-link
 * @param array  $p['chat']    ['tekst' => ..., 'url' => ..., 'label' => ...]
 */
?>
<aside class="crisishulp" aria-labelledby="crisishulp-kop">
  <h2 id="crisishulp-kop"><?= e($p['kop']) ?></h2>
  <?php foreach ($p['regels'] as $r): ?>
    <p><?= e($r['tekst']) ?> <a class="crisishulp__nummer" href="tel:<?= e($r['nummer']) ?>"><?= e($r['nummer']) ?></a><?= e($r['na'] ?? '') ?></p>
  <?php endforeach ?>
  <p><?= e($p['chat']['tekst']) ?> <a href="<?= e($p['chat']['url']) ?>" rel="noopener"><?= e($p['chat']['label']) ?></a>.</p>
</aside>
