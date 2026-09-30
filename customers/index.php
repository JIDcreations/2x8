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
@media (max-width:560px){.items>div,.log li{grid-template-columns:1fr;gap:4px}}
CSS;
}
