<?php
/**
 * Ingang naar de therapeuten per thema. Leest data/therapeuten.json zelf.
 * WordPress: dynamisch block "brug48/zoeker" (termen van taxonomie "thema" + CPT "therapeut").
 * @param string $p['kop']
 * @param string $p['tekst']
 */
$themas = array_map(fn($t) => $t + ['aantal' => aantal(['thema' => $t['id'], 'doelgroep' => ''])], data()['themas']);
?>
<section class="zoeker" aria-labelledby="zoeker-kop">
  <div class="dek">
    <div class="zoeker__intro">
      <h2 id="zoeker-kop"><?= e($p['kop']) ?></h2>
      <p><?= e($p['tekst']) ?></p>
    </div>
    <ul class="zoeker__themas" role="list">
      <?php foreach ($themas as $t): ?>
        <li><a class="keuze" href="<?= e(url('/therapeuten', ['thema' => $t['id']])) ?>"><?= e($t['label']) ?> <span class="keuze__aantal"><?= $t['aantal'] ?><span class="onzichtbaar"> therapeuten</span></span></a></li>
      <?php endforeach ?>
    </ul>
  </div>
</section>
