<?php
/**
 * Ingang naar de therapeuten: per thema of op naam. Leest data/therapeuten.json zelf.
 * WordPress: dynamisch block "brug48/zoeker" (termen van taxonomie "thema" + CPT "therapeut").
 * @param string $p['kop']
 * @param string $p['tekst']
 * @param string $p['kop_namen']
 */
$alle = data()['therapeuten'];
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
    <h3 class="zoeker__kop-namen" id="zoeker-namen"><?= e($p['kop_namen']) ?></h3>
    <ul class="zoeker__namen" aria-labelledby="zoeker-namen" role="list">
      <?php foreach ($alle as $t): ?>
        <li><a href="<?= e(url('/therapeuten/' . $t['slug'])) ?>"><?= e($t['naam']) ?></a></li>
      <?php endforeach ?>
    </ul>
  </div>
</section>
