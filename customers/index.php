<?php
// customers.2x8.be — een pagina per klant, enkel bereikbaar via een link met
// wachtwoord: https://customers.2x8.be/<klant>?pass=<wachtwoord>
//
// De inhoud staat in data/<klant>.json; daar staat enkel een sha256-hash van
// het wachtwoord, nooit het wachtwoord zelf. Het wachtwoord bestaat alleen in
// de link die de klant kreeg (en in het veld "Klantpagina" op de klant in
// Notion). Nieuwe pagina: `node customers/maak.js nieuw <klant> --naam "..."`.
declare(strict_types=1);

header('Content-Type: text/html; charset=utf-8');
header('X-Robots-Tag: noindex, nofollow, noarchive');
header('Cache-Control: no-store, private');
header('Referrer-Policy: no-referrer');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');

$slug = isset($_GET['klant']) ? (string) $_GET['klant'] : '';
$pass = isset($_GET['pass']) ? (string) $_GET['pass'] : '';

if ($slug === '') {
    toon_melding(404, 'Klantenpagina\'s', 'Hier staan de pagina\'s van onze klanten. Je bereikt jouw pagina met de link die je van ons kreeg.');
}

$data = null;
if (preg_match('/^[a-z0-9][a-z0-9-]{0,63}$/', $slug)) {
    $bestand = __DIR__ . '/data/' . $slug . '.json';
    if (is_file($bestand)) {
        $data = json_decode((string) file_get_contents($bestand), true);
    }
}

$hash = is_array($data) ? (string) ($data['pass_hash'] ?? '') : '';
$ok = $pass !== '' && $hash !== '' && hash_equals($hash, hash('sha256', $pass));

if (!$ok) {
    // Zelfde antwoord voor "bestaat niet" en "verkeerd wachtwoord", en een
    // kleine vertraging: zo valt er niets af te leiden of te raden.
    usleep(random_int(150000, 400000));
    toon_melding(403, 'Geen toegang', 'Deze pagina is enkel bereikbaar via de volledige link die je van ons kreeg. Klopt de link, maar kom je er niet in? Mail naar hello@2x8.be.');
}

toon_klantpagina($data);

// ---------------------------------------------------------------------------

function h(?string $s): string
{
    return htmlspecialchars((string) $s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function datum_nl(?string $iso): string
{
    if (!$iso || !preg_match('/^(\d{4})-(\d{2})-(\d{2})/', $iso, $m)) {
        return (string) $iso;
    }
    $maanden = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december'];
    return (int) $m[3] . ' ' . $maanden[(int) $m[2] - 1] . ' ' . $m[1];
}

function is_url(string $s): bool
{
    return (bool) preg_match('#^(https?:)?//#i', $s) || (bool) preg_match('#^mailto:#i', $s);
}

// Tekst met alinea's (dubbele newline) en enkele regeleinden; alles ge-escaped.
function alineas(string $tekst): string
{
    $uit = '';
    foreach (preg_split('/\n\s*\n/', trim($tekst)) as $alinea) {
        $alinea = trim($alinea);
        if ($alinea === '') {
            continue;
        }
        $uit .= '<p>' . nl2br(h($alinea)) . '</p>';
    }
    return $uit;
}

function link_html(string $tekst, ?string $url): string
{
    if (!$url || !is_url($url)) {
        return h($tekst);
    }
    return '<a href="' . h($url) . '" rel="noopener noreferrer nofollow" target="_blank">' . h($tekst) . '</a>';
}

function sectie_html(array $s): string
{
    if (empty($s['tekst']) && empty($s['items']) && empty($s['lijst'])) {
        return '';
    }
    $uit = '<section class="sectie">';
    if (!empty($s['titel'])) {
        $uit .= '<h2>' . h($s['titel']) . '</h2>';
    }
    if (!empty($s['tekst'])) {
        $uit .= alineas((string) $s['tekst']);
    }
    if (!empty($s['items']) && is_array($s['items'])) {
        $uit .= '<dl class="items">';
        foreach ($s['items'] as $item) {
            if (!is_array($item)) {
                continue;
            }
            $uit .= '<div><dt>' . h($item['label'] ?? '') . '</dt><dd>'
                . link_html((string) ($item['waarde'] ?? ''), $item['url'] ?? null)
                . (!empty($item['opmerking']) ? '<span class="opm">' . h($item['opmerking']) . '</span>' : '')
                . '</dd></div>';
        }
        $uit .= '</dl>';
    }
    if (!empty($s['lijst']) && is_array($s['lijst'])) {
        $uit .= '<ul class="lijst">';
        foreach ($s['lijst'] as $regel) {
            if (is_array($regel)) {
                $uit .= '<li>' . link_html((string) ($regel['tekst'] ?? ''), $regel['url'] ?? null)
                    . (!empty($regel['opmerking']) ? '<span class="opm">' . h($regel['opmerking']) . '</span>' : '')
                    . '</li>';
            } else {
                $uit .= '<li>' . h((string) $regel) . '</li>';
            }
        }
        $uit .= '</ul>';
    }
    $uit .= '</section>';
    return $uit;
}

// --- Websitecijfers (GA4), een blok per maand, nieuwste eerst ------------------

function maand_nl(int $nr): string
{
    return ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december'][$nr - 1] ?? '';
}

function getal($n): string
{
    return number_format((float) $n, 0, ',', '.');
}

function duur(int $s): string
{
    return $s < 60 ? $s . ' s' : intdiv($s, 60) . ' min ' . ($s % 60) . ' s';
}

function maandnaam(string $maand): string
{
    if (preg_match('/^(\d{4})-Q([1-4])$/', $maand, $q)) {
        return 'Q' . $q[2] . ' ' . $q[1];
    }
    return ucfirst(maand_nl((int) substr($maand, 5, 2))) . ' ' . substr($maand, 0, 4);
}

function korte_datum(string $iso): string
{
    return (int) substr($iso, 8, 2) . ' ' . substr(maand_nl((int) substr($iso, 5, 2)), 0, 3);
}

function verschil($nu, $voor): string
{
    if (!is_numeric($voor) || $voor <= 0) {
        return '';
    }
    $p = (int) round(($nu - $voor) / $voor * 100);
    return '<span class="delta">' . ($p === 0 ? 'gelijk' : ($p > 0 ? '+' : '−') . abs($p) . '%') . '</span>';
}

// 4 -> 5, 14 -> 20, 177 -> 200: een rond maximum voor de as.
function rond_op(int $max): int
{
    if ($max <= 5) {
        return 5;
    }
    $orde = 10 ** (int) floor(log10($max));
    foreach ([1, 2, 2.5, 5, 10] as $f) {
        if ($f * $orde >= $max) {
            return (int) ($f * $orde);
        }
    }
    return 10 * $orde;
}

function staven(array $rijen, int $totaal): string
{
    $rijen = array_values(array_filter($rijen, fn($r) => is_array($r) && count($r) === 2));
    if (!$rijen) {
        return '<p class="leeg">Geen gegevens.</p>';
    }
    $max = max(1, ...array_map(fn($r) => (int) $r[1], $rijen));
    $uit = '<ul class="staven">';
    foreach ($rijen as [$naam, $waarde]) {
        $aandeel = $totaal > 0 ? (int) round($waarde / $totaal * 100) : 0;
        $uit .= '<li><span class="naam">' . h((string) $naam) . '</span>'
            . '<span class="waarde">' . getal($waarde) . '<span class="aandeel">' . $aandeel . '%</span></span>'
            . '<span class="staaf" style="width:' . round($waarde / $max * 100, 1) . '%"></span></li>';
    }
    return $uit . '</ul>';
}

function verloop(array $dagen, string $start): string
{
    $dagen = array_map('intval', $dagen);
    $n = count($dagen);
    if ($n < 2 || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $start)) {
        return '';
    }
    $top = rond_op(max($dagen));
    $punten = [];
    foreach ($dagen as $i => $v) {
        $punten[] = round($i / ($n - 1) * 600, 2) . ',' . round(160 - $v / $top * 160, 2);
    }
    $lijn = 'M' . implode(' L', $punten);
    $svg = '<svg viewBox="0 0 600 160" preserveAspectRatio="none" aria-hidden="true" focusable="false">'
        . '<line x1="0" y1="0" x2="600" y2="0" class="raster"/><line x1="0" y1="80" x2="600" y2="80" class="raster"/>'
        . '<path d="' . $lijn . ' L600,160 L0,160 Z" class="vlak"/><path d="' . $lijn . '" class="lijn"/>'
        . '<line x1="0" y1="160" x2="600" y2="160" class="basis"/></svg>';
    $ytik = '';
    foreach ([$top, $top / 2, 0] as $j => $t) {
        $ytik .= '<span style="top:' . ($j * 50) . '%">' . getal($t) . '</span>';
    }
    $dag = fn(int $i) => date('Y-m-d', strtotime($start . ' +' . $i . ' days'));
    $xtik = '';
    // een maand: om de week; langer (kwartaal): de 1e van elke maand
    $tikken = $n > 31 ? [...array_filter(range(1, $n), fn($d) => substr($dag($d - 1), 8) === '01'), $n] : [1, 8, 15, 22, $n];
    foreach ($tikken as $d) {
        // de laatste dag krijgt altijd een label; een tussenlabel te dicht ertegen valt weg
        if ($d === $n || $n - $d >= 4) {
            $xtik .= '<span style="left:' . round(($d - 1) / ($n - 1) * 100, 2) . '%">' . h(korte_datum($dag($d - 1))) . '</span>';
        }
    }
    $rijen = '';
    foreach ($dagen as $i => $v) {
        $rijen .= '<tr><td>' . h(korte_datum($dag($i))) . '</td><td>' . getal($v) . '</td></tr>';
    }
    return '<figure class="verloop" data-start="' . h($start) . '" data-top="' . $top . '" data-waarden="' . implode(',', $dagen) . '">'
        . '<figcaption>Bezoeken per dag</figcaption>'
        . '<div class="grafiek"><div class="yas">' . $ytik . '</div>'
        . '<div class="plot" tabindex="0" role="img" aria-label="Bezoeken per dag, de drukste dag telde ' . getal(max($dagen)) . ' bezoeken. Lees per dag met de pijltjestoetsen.">'
        . $svg . '<span class="kruis" hidden><span class="punt"></span></span><span class="tip" hidden></span></div>'
        . '<div class="xas">' . $xtik . '</div></div>'
        . '<details class="tabel"><summary>Toon als tabel</summary><table><thead><tr><th>Dag</th><th>Bezoeken</th></tr></thead><tbody>'
        . $rijen . '</tbody></table></details></figure>';
}

function maand_html(array $m, bool $open): string
{
    $t = is_array($m['totalen'] ?? null) ? $m['totalen'] : [];
    $v = is_array($m['vorige'] ?? null) ? $m['vorige'] : [];
    $sessies = (int) ($t['sessies'] ?? 0);
    $kern = [
        ['Bezoekers', getal($t['bezoekers'] ?? 0), verschil($t['bezoekers'] ?? 0, $v['bezoekers'] ?? null)],
        ['Bezoeken', getal($sessies), verschil($sessies, $v['sessies'] ?? null)],
        ['Paginaweergaven', getal($t['weergaven'] ?? 0), verschil($t['weergaven'] ?? 0, $v['weergaven'] ?? null)],
        ['Tijd per bezoek', duur((int) ($t['duur'] ?? 0)), verschil($t['duur'] ?? 0, $v['duur'] ?? null)],
    ];
    if (!empty($t['acties']) || !empty($v['acties'])) {
        $kern[] = ['Contactacties', getal($t['acties'] ?? 0), verschil($t['acties'] ?? 0, $v['acties'] ?? null)];
    }
    $p = is_array($m['periode'] ?? null) ? $m['periode'] : [];
    $vp = is_array($v['periode'] ?? null) ? $v['periode'] : null;
    $maand = (string) ($m['maand'] ?? '');

    $uit = '<details class="maand" data-maand="' . h($maand) . '"' . ($open ? ' open' : '') . '>'
        . '<summary><span class="maand-naam">' . h(maandnaam($maand)) . '</span>'
        . '<span class="maand-kort">' . getal($t['bezoekers'] ?? 0) . ' bezoekers</span>'
        . '<svg class="pijl" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M4 6l4 4 4-4"/></svg></summary>'
        . '<div class="maand-inhoud">';
    if ($vp) {
        $uit .= '<p class="meta">Percentages vergelijken met ' . h(datum_nl($vp['start'] ?? '')) . ' tot ' . h(datum_nl($vp['end'] ?? '')) . '.</p>';
    }
    $uit .= '<dl class="kern">';
    foreach ($kern as [$label, $waarde, $delta]) {
        $uit .= '<div><dt>' . h($label) . '</dt><dd><span class="getal">' . h($waarde) . '</span>' . $delta . '</dd></div>';
    }
    $uit .= '</dl>';
    $uit .= verloop(is_array($m['per_dag'] ?? null) ? $m['per_dag'] : [], (string) ($p['start'] ?? ''));
    $uit .= '<div class="duo"><div><h3>Waar bezoeken vandaan komen</h3>' . staven($m['kanalen'] ?? [], $sessies) . '</div>'
        . '<div><h3>Toestel</h3>' . staven($m['toestellen'] ?? [], $sessies)
        . '<h3>Land</h3>' . staven($m['landen'] ?? [], $sessies) . '</div></div>';
    $paginas = array_values(array_filter($m['paginas'] ?? [], fn($r) => is_array($r) && count($r) === 2));
    if ($paginas) {
        $uit .= '<h3>Meest bekeken pagina\'s</h3><ol class="paginas">';
        foreach ($paginas as [$pad, $aantal]) {
            $uit .= '<li><span class="pad">' . h((string) $pad) . ($pad === '/' ? '<span class="opm-in">homepagina</span>' : '') . '</span>'
                . '<span class="aantal">' . getal($aantal) . '</span></li>';
        }
        $uit .= '</ol>';
    }
    return $uit . '</div></details>';
}

function cijfers_html(array $maanden): string
{
    usort($maanden, fn($a, $b) => strcmp((string) ($b['maand'] ?? ''), (string) ($a['maand'] ?? '')));
    $uit = '<section class="sectie cijfers" id="cijfers"><h2>Websitecijfers</h2>'
        . '<p class="uitleg">Elk kwartaal zetten we hier de cijfers van jullie website uit Google Analytics. '
        . 'Een bezoeker is één persoon of toestel, een bezoek is één keer op de site komen.</p>';
    foreach ($maanden as $i => $m) {
        $uit .= maand_html($m, $i === 0);
    }
    return $uit . '</section>' . verloop_script();
}

// Kruisdraad en tooltip op de grafiek; de waarden staan ook in de tabel eronder.
function verloop_script(): string
{
    return <<<'JS'
<script>
document.querySelectorAll('.verloop').forEach(function (f) {
  var plot = f.querySelector('.plot'), kruis = f.querySelector('.kruis'), punt = f.querySelector('.punt'), tip = f.querySelector('.tip');
  var w = f.dataset.waarden.split(',').map(Number), top = Number(f.dataset.top), start = new Date(f.dataset.start + 'T12:00:00');
  var mnd = ['jan', 'feb', 'maa', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'], nu = -1;
  function toon(i) {
    nu = Math.max(0, Math.min(w.length - 1, i));
    var x = nu / (w.length - 1) * 100, d = new Date(start);
    d.setDate(d.getDate() + nu);
    kruis.style.left = x + '%';
    punt.style.bottom = (w[nu] / top * 100) + '%';
    var b = document.createElement('strong');
    b.textContent = w[nu] + (w[nu] === 1 ? ' bezoek' : ' bezoeken');
    tip.replaceChildren(b, document.createTextNode(d.getDate() + ' ' + mnd[d.getMonth()]));
    tip.style.left = x + '%';
    tip.dataset.kant = x < 15 ? 'links' : x > 85 ? 'rechts' : '';
    kruis.hidden = tip.hidden = false;
  }
  function verberg() { kruis.hidden = tip.hidden = true; nu = -1; }
  plot.addEventListener('pointermove', function (e) {
    var r = plot.getBoundingClientRect();
    toon(Math.round(Math.min(Math.max((e.clientX - r.left) / r.width, 0), 1) * (w.length - 1)));
  });
  plot.addEventListener('pointerleave', verberg);
  plot.addEventListener('blur', verberg);
  plot.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      toon(nu < 0 ? (e.key === 'ArrowRight' ? 0 : w.length - 1) : nu + (e.key === 'ArrowRight' ? 1 : -1));
    } else if (e.key === 'Escape') {
      verberg();
    }
  });
});
</script>
JS;
}

function kop_html(string $titel): void
{
    echo '<!doctype html><html lang="nl"><head><meta charset="utf-8">'
        . '<meta name="viewport" content="width=device-width, initial-scale=1">'
        . '<meta name="robots" content="noindex, nofollow, noarchive">'
        . '<meta name="referrer" content="no-referrer">'
        . '<meta name="theme-color" content="#0a0a0a">'
        . '<title>' . h($titel) . ' | 2X8</title>'
        . '<link rel="icon" type="image/svg+xml" href="https://2x8.be/favicon.svg">'
        . '<link rel="preconnect" href="https://fonts.googleapis.com">'
        . '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
        . '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;600&family=JetBrains+Mono:wght@500&display=swap">'
        . '<style>' . stijl() . '</style></head><body>'
        . '<header class="top"><a class="merk" href="https://2x8.be/" rel="noopener">2X8</a><span class="label">Klantenpagina</span></header>'
        . '<main class="wrap">';
}

function voet_html(array $contact = []): void
{
    $naam = $contact['naam'] ?? '2X8';
    $email = $contact['email'] ?? 'hello@2x8.be';
    $tel = $contact['telefoon'] ?? '';
    echo '</main><footer class="voet"><div class="wrap">'
        . '<p class="voet-kop">Vragen? Laat maar weten.</p>'
        . '<p>' . h($naam) . ' · <a href="mailto:' . h($email) . '">' . h($email) . '</a>'
        . ($tel ? ' · <a href="tel:' . h(preg_replace('/\s+/', '', $tel)) . '">' . h($tel) . '</a>' : '')
        . '</p><p class="klein">2X8 · <a href="https://2x8.be/" rel="noopener">2x8.be</a></p>'
        . '</div></footer></body></html>';
}

function toon_melding(int $status, string $titel, string $tekst): void
{
    http_response_code($status);
    kop_html($titel);
    echo '<h1>' . h($titel) . '</h1><p class="intro">' . h($tekst) . '</p>';
    voet_html();
    exit;
}

function toon_klantpagina(array $d): void
{
    $naam = (string) ($d['naam'] ?? 'Klant');
    kop_html($naam);

    echo '<p class="boven">Alles over jullie project bij 2X8</p>';
    echo '<h1>' . h($naam) . '</h1>';
    if (!empty($d['bijgewerkt'])) {
        echo '<p class="meta">Bijgewerkt op ' . h(datum_nl((string) $d['bijgewerkt'])) . '</p>';
    }
    if (!empty($d['intro'])) {
        echo '<div class="intro">' . alineas((string) $d['intro']) . '</div>';
    }

    if (!empty($d['secties']) && is_array($d['secties'])) {
        foreach ($d['secties'] as $s) {
            if (is_array($s)) {
                echo sectie_html($s);
            }
        }
    }

    if (!empty($d['cijfers']) && is_array($d['cijfers'])) {
        echo cijfers_html(array_values(array_filter($d['cijfers'], 'is_array')));
    }

    if (!empty($d['updates']) && is_array($d['updates'])) {
        $updates = array_values(array_filter($d['updates'], 'is_array'));
        usort($updates, fn($a, $b) => strcmp((string) ($b['datum'] ?? ''), (string) ($a['datum'] ?? '')));
        echo '<section class="sectie"><h2>Logboek</h2><ol class="log">';
        foreach ($updates as $u) {
            echo '<li><time datetime="' . h((string) ($u['datum'] ?? '')) . '">' . h(datum_nl((string) ($u['datum'] ?? ''))) . '</time>'
                . '<div>' . alineas((string) ($u['tekst'] ?? '')) . '</div></li>';
        }
        echo '</ol></section>';
    }

    echo '<aside class="kader"><strong>Bewaar deze link.</strong> Deze pagina is enkel bereikbaar via de link die je van ons kreeg. Deel ze gerust met collega\'s, maar zet ze niet openbaar.</aside>';

    voet_html(is_array($d['contact'] ?? null) ? $d['contact'] : []);
}

function stijl(): string
{
    return <<<'CSS'
:root{--ink:#0a0a0a;--paper:#fafbfc;--ash:#6e6a66;--ash-2:#9c948c;--orange:#f05522;--orange-text:#c23d10;--wash:rgb(10 10 10 / .08);--font:'Sora',system-ui,sans-serif;--mono:'JetBrains Mono',ui-monospace,monospace;--gx:clamp(16px,4vw,40px);color-scheme:light}
*,*::before,*::after{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--paper);color:var(--ink);font-family:var(--font);font-size:16px;line-height:1.55;-webkit-font-smoothing:antialiased}
a{color:inherit;text-decoration:underline;text-decoration-thickness:1px;text-underline-offset:.15em}
a:hover{color:var(--orange-text)}
h1,h2,p,dl,dd,ul,ol{margin:0}
ul,ol{padding:0;list-style:none}
.wrap{max-width:760px;margin:0 auto;padding:0 var(--gx)}
.top{display:flex;align-items:center;justify-content:space-between;height:64px;padding:0 var(--gx);border-bottom:1px solid var(--ink)}
.merk{font-weight:600;letter-spacing:.06em;text-decoration:none}
.label{font-family:var(--mono);font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--ash)}
main{padding:clamp(40px,7vw,80px) var(--gx) clamp(56px,8vw,96px)}
.boven{font-family:var(--mono);font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--orange-text);margin-bottom:16px}
h1{font-size:clamp(32px,5vw,48px);font-weight:600;line-height:1.05;letter-spacing:-.02em}
.meta{margin-top:12px;color:var(--ash);font-size:14px}
.intro{margin-top:24px;font-size:18px;font-weight:300;max-width:60ch}
.intro p+p{margin-top:12px}
.sectie{margin-top:clamp(40px,6vw,64px);padding-top:24px;border-top:1px solid var(--ink)}
.sectie h2{font-size:14px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;margin-bottom:20px}
.sectie p+p{margin-top:12px}
.items{display:grid;gap:0}
.items>div{display:grid;grid-template-columns:minmax(120px,200px) 1fr;gap:16px;padding:12px 0;border-bottom:1px solid var(--wash)}
.items dt{color:var(--ash);font-size:14px;padding-top:2px}
.items dd{overflow-wrap:anywhere}
.opm{display:block;color:var(--ash);font-size:14px;margin-top:2px}
.lijst li{padding:10px 0;border-bottom:1px solid var(--wash)}
.log li{display:grid;grid-template-columns:minmax(120px,200px) 1fr;gap:16px;padding:12px 0;border-bottom:1px solid var(--wash)}
.log time{color:var(--ash);font-size:14px;padding-top:2px}
.kader{margin-top:clamp(40px,6vw,64px);padding:16px 20px;border-left:3px solid var(--orange);background:#fff;font-size:15px}
.voet{background:var(--ink);color:var(--paper);padding:40px 0}
.voet a{color:inherit}
.voet a:hover{color:var(--orange)}
.voet-kop{font-weight:600;margin-bottom:8px}
.klein{margin-top:16px;color:var(--ash-2);font-size:13px}
::selection{background:rgb(240 85 34 / .22)}
:focus-visible{outline:2px solid var(--orange-text);outline-offset:3px}
.uitleg{color:var(--ash);font-size:15px;max-width:60ch;margin-bottom:8px}
.maand{border-bottom:1px solid var(--wash)}
.maand summary{display:flex;align-items:baseline;gap:16px;padding:18px 0;cursor:pointer;list-style:none}
.maand summary::-webkit-details-marker{display:none}
.maand-naam{font-size:20px;font-weight:600;letter-spacing:-.01em}
.maand-kort{color:var(--ash);font-size:14px;margin-left:auto;font-variant-numeric:tabular-nums}
.pijl{width:16px;height:16px;flex:none;align-self:center;fill:none;stroke:currentColor;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round;transition:transform .2s cubic-bezier(.16,1,.3,1)}
.maand[open] .pijl{transform:rotate(180deg)}
.maand summary:hover .maand-naam{color:var(--orange-text)}
.maand-inhoud{padding:0 0 40px}
.maand-inhoud .meta{margin:0 0 20px}
.kern{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));border-top:1px solid var(--wash)}
.kern>div{padding:16px 16px 18px 0;border-bottom:1px solid var(--wash)}
.kern dt{color:var(--ash);font-size:13px}
.kern dd{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap;margin-top:6px}
.getal{font-size:28px;font-weight:600;letter-spacing:-.02em;line-height:1.1}
.delta{color:var(--ash);font-size:13px;font-variant-numeric:tabular-nums}
.cijfers h3{font-size:14px;font-weight:600;margin:40px 0 12px}
.verloop{margin:40px 0 0}
.verloop figcaption{font-size:14px;font-weight:600;margin-bottom:16px}
.grafiek{display:grid;grid-template-columns:auto 1fr;column-gap:12px}
.yas{position:relative;height:160px;color:var(--ash);font-size:12px;font-variant-numeric:tabular-nums;text-align:right;min-width:2ch}
.yas span{position:absolute;right:0;transform:translateY(-50%);line-height:1}
.plot{position:relative;height:160px;outline-offset:6px;cursor:crosshair;touch-action:pan-y}
.plot svg{display:block;width:100%;height:100%;overflow:visible}
.raster{stroke:var(--wash);stroke-width:1;vector-effect:non-scaling-stroke}
.basis{stroke:var(--ash-2);stroke-width:1;vector-effect:non-scaling-stroke}
.lijn{fill:none;stroke:var(--orange);stroke-width:2;stroke-linejoin:round;stroke-linecap:round;vector-effect:non-scaling-stroke}
.vlak{fill:rgb(240 85 34 / .1)}
.kruis{position:absolute;top:0;bottom:0;width:1px;background:var(--ink);pointer-events:none}
.punt{position:absolute;left:-5px;width:10px;height:10px;margin-bottom:-5px;border-radius:50%;background:var(--orange);box-shadow:0 0 0 2px var(--paper)}
.tip{position:absolute;top:-8px;transform:translate(-50%,-100%);background:var(--ink);color:var(--paper);font-size:13px;padding:6px 10px;border-radius:4px;white-space:nowrap;pointer-events:none;display:flex;gap:8px;box-shadow:0 4px 12px rgb(10 10 10 / .18)}
.tip[hidden],.kruis[hidden]{display:none}
.tip[data-kant=links]{transform:translate(0,-100%)}
.tip[data-kant=rechts]{transform:translate(-100%,-100%)}
.tip strong{font-weight:600}
.xas{grid-column:2;position:relative;height:28px;color:var(--ash);font-size:12px}
.xas span{position:absolute;top:10px;transform:translateX(-50%);white-space:nowrap}
.xas span:first-child{transform:none}
.xas span:last-child{transform:translateX(-100%)}
.tabel{margin-top:8px;font-size:14px}
.tabel summary{cursor:pointer;color:var(--ash);width:max-content}
.tabel summary:hover{color:var(--orange-text)}
.tabel table{margin-top:12px;border-collapse:collapse;font-variant-numeric:tabular-nums}
.tabel th,.tabel td{text-align:left;padding:4px 24px 4px 0;border-bottom:1px solid var(--wash)}
.tabel th{font-weight:600}
.duo{display:grid;grid-template-columns:1fr 1fr;column-gap:clamp(24px,5vw,56px)}
.staven li{display:grid;grid-template-columns:1fr auto;column-gap:12px;row-gap:6px;padding:8px 0}
.staven .naam{font-size:15px}
.staven .waarde{font-variant-numeric:tabular-nums;font-size:15px;font-weight:600}
.aandeel{color:var(--ash);font-weight:400;margin-left:8px;display:inline-block;min-width:4ch;text-align:right}
.staaf{grid-column:1/-1;height:8px;min-width:2px;background:var(--orange);border-radius:0 4px 4px 0}
.paginas li{display:flex;justify-content:space-between;gap:16px;padding:10px 0;border-bottom:1px solid var(--wash)}
.pad{font-family:var(--mono);font-size:13px;overflow-wrap:anywhere;padding-top:2px}
.opm-in{font-family:var(--font);color:var(--ash);margin-left:8px}
.aantal{font-variant-numeric:tabular-nums;font-weight:600}
.leeg{color:var(--ash);font-size:14px}
@media (prefers-reduced-motion:reduce){.pijl{transition:none}}
@media (max-width:560px){.items>div,.log li{grid-template-columns:1fr;gap:4px}.duo{grid-template-columns:1fr}.kern{grid-template-columns:1fr 1fr}.maand-kort{display:none}}
CSS;
}
