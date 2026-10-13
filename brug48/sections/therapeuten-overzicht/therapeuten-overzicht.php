<?php
/**
 * Therapeuten met een openklapbare filter op thema en doelgroep. Werkt zonder JavaScript
 * (details + GET-formulier); therapeuten-overzicht.js maakt het vloeiend. Leest
 * data/therapeuten.json en de URL zelf.
 * WordPress: dynamisch block "brug48/therapeuten-overzicht" (CPT "therapeut", taxonomieën "thema" en "doelgroep").
 * @param string $p['filter_knop']   tekst op de knop die de filter openklapt
 * @param string $p['kop_thema']
 * @param string $p['kop_doelgroep']
 * @param string $p['alle_themas']
 * @param string $p['iedereen']
 * @param string $p['knop']          verzendknop, enkel zichtbaar zonder JavaScript
 * @param string $p['stop']          label bij een aanmeldingsstop
 * @param string $p['leeg']          kop van de lege toestand
 * @param string $p['leeg_tekst']
 */
$f = filter_uit_url();
$facetten = [
    'thema' => [$p['kop_thema'], $p['alle_themas'], labels('themas')],
    'doelgroep' => [$p['kop_doelgroep'], $p['iedereen'], labels('doelgroepen')],
];
$n = aantal($f);
$zonder = fn(string $facet) => url('/therapeuten', array_merge($f, [$facet => '']));
$pilgroepen = ['themas' => ['thema', "Thema's"], 'doelgroepen' => ['doelgroep', 'Voor wie']];
?>
<section class="overzicht" aria-label="Therapeuten zoeken">
  <div class="dek">
    <details class="filter">
      <summary class="filter__knop"><?= e($p['filter_knop']) ?><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 6l4.5 4.5L12.5 6"/></svg></summary>
      <form class="filter__paneel" method="get" action="<?= e(url('/therapeuten')) ?>" data-filter>
        <?php foreach ($facetten as $naam => [$kop, $alle, $opties]): ?>
          <fieldset class="filter__groep">
            <legend><?= e($kop) ?></legend>
            <div class="filter__keuzes">
              <?php foreach (['' => $alle] + $opties as $id => $label):
                  $aantal = aantal(array_merge($f, [$naam => (string) $id])); ?>
                <label class="keuze<?= $aantal === 0 ? ' is-leeg' : '' ?>">
                  <input class="onzichtbaar" type="radio" name="<?= $naam ?>" value="<?= e((string) $id) ?>" data-label="<?= e($label) ?>"<?= $f[$naam] === (string) $id ? ' checked' : '' ?>>
                  <?= e($label) ?> <span class="keuze__aantal"><span data-aantal><?= $aantal ?></span><span class="onzichtbaar"> therapeuten</span></span>
                </label>
              <?php endforeach ?>
            </div>
          </fieldset>
        <?php endforeach ?>
        <button class="knop filter__toepassen" type="submit"><?= e($p['knop']) ?></button>
      </form>
    </details>

    <div class="resultaten__kop">
      <p class="resultaten__aantal" role="status"><span class="teller"><?= $n ?></span> <span data-eenheid><?= $n === 1 ? 'therapeut' : 'therapeuten' ?></span></p>
      <ul class="resultaten__actief" role="list" data-actief>
        <?php foreach ($facetten as $naam => [, , $opties]): if ($f[$naam] === '') continue; ?>
          <li><a class="wis" href="<?= e($zonder($naam)) ?>"><span class="onzichtbaar">Filter weghalen: </span><?= e($opties[$f[$naam]]) ?><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8"/></svg></a></li>
        <?php endforeach ?>
      </ul>
    </div>
  </div>

  <ul class="kaarten dek pijlers" role="list">
    <?php foreach (data()['therapeuten'] as $t):
        $zijde = $t['foto'] ? min($t['foto']['breedte'], $t['foto']['hoogte'], 480) : 0; ?>
      <li class="kaart" style="view-transition-name: kaart-<?= e($t['slug']) ?>" data-themas="<?= e(implode(' ', $t['themas'])) ?>" data-doelgroepen="<?= e(implode(' ', $t['doelgroepen'])) ?>"<?= past($t, $f) ? '' : ' hidden' ?>>
        <div class="kaart__portret">
          <?php if ($t['foto']): ?>
            <picture>
              <source type="image/avif" srcset="<?= e(asset("assets/img/therapeuten/{$t['slug']}.avif")) ?>">
              <img src="<?= e(asset("assets/img/therapeuten/{$t['slug']}.webp")) ?>" width="<?= $zijde ?>" height="<?= $zijde ?>" alt="" loading="lazy" decoding="async">
            </picture>
          <?php else: ?>
            <span class="kaart__initialen" aria-hidden="true"><?= e(initialen($t['naam'])) ?></span>
          <?php endif ?>
        </div>
        <div class="kaart__kop">
          <h2 class="kaart__naam"><a href="<?= e(url('/therapeuten/' . $t['slug'])) ?>"><?= e($t['naam']) ?></a></h2>
          <?php if ($t['aanmeldingsstop']): ?>
            <p class="kaart__stop"><?= e($p['stop']) ?></p>
          <?php endif ?>
        </div>
        <div class="kaart__pills">
          <?php foreach ($pilgroepen as $tax => [$facet, $groep]): if (!$t[$tax]) continue; ?>
            <ul class="pills" role="list" aria-label="<?= e($groep) ?>">
              <?php foreach ($t[$tax] as $id): ?>
                <li class="pil pil--<?= $facet ?><?= $f[$facet] === $id ? ' is-gekozen' : '' ?>" data-<?= $facet ?>="<?= e($id) ?>"><?= e(labels($tax)[$id]) ?></li>
              <?php endforeach ?>
            </ul>
          <?php endforeach ?>
        </div>
      </li>
    <?php endforeach ?>
  </ul>

  <div class="dek">
    <div class="leeg" data-leeg<?= $n === 0 ? '' : ' hidden' ?>>
      <p class="leeg__kop"><?= e($p['leeg']) ?></p>
      <p><?= e($p['leeg_tekst']) ?></p>
      <ul class="leeg__opties" role="list" data-opties>
        <?php if ($n === 0): foreach ($facetten as $naam => [, , $opties]):
            $los = array_merge($f, [$naam === 'thema' ? 'doelgroep' : 'thema' => '']); ?>
          <li><a href="<?= e(url('/therapeuten', $los)) ?>">Alle therapeuten voor <?= e($opties[$f[$naam]]) ?> (<?= aantal($los) ?>)</a></li>
        <?php endforeach; endif ?>
      </ul>
    </div>
  </div>
</section>
