<?php
/**
 * Hero met de brug: foto in een boogvenster, titel en primaire actie. WordPress: block "brug48/hero".
 * @param string $p['titel']
 * @param string $p['foto']        pad zonder breedte en extensie, bv. 'assets/img/gentbruggebrug'
 * @param int[]  $p['breedtes']    beschikbare breedtes van de foto
 * @param int[]  $p['formaat']     [breedte, hoogte] van het origineel
 * @param string $p['alt']
 * @param array  $p['actie']       ['tekst' => ..., 'url' => ...]
 * @param array  $p['adres']       ['tekst' => ..., 'url' => ...]
 */
$srcset = fn(string $ext) => implode(', ', array_map(fn($w) => asset("{$p['foto']}-$w.$ext") . " {$w}w", $p['breedtes']));
$sizes = '(min-width: 84rem) 76rem, 92vw';
?>
<section class="hero" aria-labelledby="hero-titel">
  <div class="dek">
    <figure class="hero__figuur">
      <div class="hero__boog">
        <div class="hero__venster">
        <picture>
          <source type="image/avif" srcset="<?= e($srcset('avif')) ?>" sizes="<?= $sizes ?>">
          <source type="image/webp" srcset="<?= e($srcset('webp')) ?>" sizes="<?= $sizes ?>">
          <img src="<?= e(asset("{$p['foto']}-1200.webp")) ?>" width="<?= (int) $p['formaat'][0] ?>" height="<?= (int) $p['formaat'][1] ?>" alt="<?= e($p['alt']) ?>" fetchpriority="high">
        </picture>
        </div>
        <?= brug() ?>
      </div>
    </figure>
  </div>
  <div class="hero__tekst dek">
    <h1 id="hero-titel"><?= e($p['titel']) ?></h1>
    <div class="hero__actie">
      <a class="knop" href="<?= e($p['actie']['url']) ?>"><?= e($p['actie']['tekst']) ?></a>
      <p class="hero__adres"><a href="<?= e($p['adres']['url']) ?>"><?= e($p['adres']['tekst']) ?></a></p>
    </div>
  </div>
</section>
