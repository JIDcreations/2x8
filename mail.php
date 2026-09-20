<?php
/**
 * 2X8 — contactformulier.
 *
 * Neemt de POST van /contact, stuurt een melding naar het studio-adres en een
 * bevestiging naar de bezoeker. Verzenden gaat via Brevo, met de lokale
 * mailserver als vangnet; de API-sleutel staat in 2x8-mail-config.php, een
 * paar mappen hoger en dus buiten het bereik van de webserver.
 *
 * Antwoordt met JSON als het formulier via fetch komt, en valt anders terug op
 * een redirect, zodat het ook werkt zonder JavaScript.
 */

declare(strict_types=1);

// Waarschuwingen mogen nooit in het antwoord terechtkomen: ze breken de JSON
// die de browser verwacht. Falen doen we expliciet, via de respons.
ini_set('display_errors', '0');

/* ---------- Config ---------------------------------------------------- */

const MAIL_TO        = 'hello@2x8.be';          // waar de aanvragen toekomen
// Blinde kopie van elke aanvraag, zodat ze ook persoonlijk binnenkomt. Staat
// alleen op de melding naar de studio: de bevestiging blijft tussen de
// bezoeker en ons.
const MAIL_BCC       = ['florianbracke@gmail.com', 'jasperimpens@gmail.com'];
const MAIL_FROM      = 'hello@2x8.be';          // moet op het eigen domein staan, anders faalt SPF
const MAIL_FROM_NAME = '2X8';
const SITE_URL       = 'https://2x8.be';
const CONTACT_PATH   = '/contact';
const MIN_SECONDS    = 3;                        // sneller ingevuld dan dit = bot

/* ---------- Helpers ---------------------------------------------------- */

function post(string $key): string
{
    $raw = $_POST[$key] ?? '';
    if (!is_string($raw)) {
        return '';
    }
    // Normaliseer regeleindes en knip controletekens weg.
    $raw = str_replace(["\r\n", "\r"], "\n", $raw);
    $raw = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $raw);

    return trim($raw);
}

function e(string $value): string
{
    return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

/** Headerregels mogen geen nieuwe regel bevatten: dat is de klassieke injectie. */
function header_safe(string $value): string
{
    return trim(str_replace(["\n", "\r"], ' ', $value));
}

/** RFC 2047, anders komt "Wélkom" als mojibake in de onderwerpregel. */
function encode_subject(string $subject): string
{
    return '=?UTF-8?B?' . base64_encode(header_safe($subject)) . '?=';
}

function wants_json(): bool
{
    $accept = $_SERVER['HTTP_ACCEPT'] ?? '';
    $xhr    = $_SERVER['HTTP_X_REQUESTED_WITH'] ?? '';

    return str_contains($accept, 'application/json') || $xhr === 'fetch';
}

function respond(bool $ok, string $message, array $errors = [], int $status = 200): never
{
    if (wants_json()) {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['ok' => $ok, 'message' => $message, 'errors' => $errors], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $flag = $ok ? 'verzonden=1' : 'fout=1';
    header('Location: ' . CONTACT_PATH . '?' . $flag . '#formulier', true, 303);
    exit;
}

/**
 * Leest een instelling uit het configuratiebestand buiten de docroot.
 *
 * De Brevo-sleutel hoort niet in deze map: alles hier is via het web te
 * benaderen en gaat mee in git. Het bestand staat een paar niveaus hoger, in
 * de home van het hostingaccount, en geeft simpelweg een array terug.
 * Ontbreekt het, dan draait alles gewoon door via de lokale mailserver.
 */
function config(string $key, $default = null)
{
    static $conf = null;
    if ($conf === null) {
        $file = __DIR__ . '/../../../2x8-mail-config.php';
        $conf = is_readable($file) ? (array) require $file : [];
    }

    return $conf[$key] ?? $default;
}

/** Schrijft een regel naar het eigen logje, naast dit bestand. */
function log_line(string $line): void
{
    @file_put_contents(
        __DIR__ . '/../../../2x8-mail.log',
        '[' . gmdate('Y-m-d H:i:s') . ' UTC] ' . $line . "
",
        FILE_APPEND
    );
}

/** Verstuurt via de Brevo-API. Geeft false terug zodra er iets niet klopt. */
function send_via_brevo(string $apiKey, string $to, string $subject, string $html, string $text, string $replyTo, array $bcc = []): bool
{
    $payload = [
        'sender'      => ['name' => MAIL_FROM_NAME, 'email' => MAIL_FROM],
        'to'          => [['email' => $to]],
        'subject'     => $subject,
        'htmlContent' => $html,
        'textContent' => $text,
    ];
    if ($replyTo !== '') {
        $payload['replyTo'] = ['email' => $replyTo];
    }
    if ($bcc !== []) {
        $payload['bcc'] = array_map(static fn (string $a) => ['email' => $a], $bcc);
    }

    $ch = curl_init('https://api.brevo.com/v3/smtp/email');
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 15,
        CURLOPT_HTTPHEADER     => [
            'api-key: ' . $apiKey,
            'accept: application/json',
            'content-type: application/json',
        ],
        CURLOPT_POSTFIELDS     => json_encode($payload, JSON_UNESCAPED_UNICODE),
    ]);

    $body   = curl_exec($ch);
    $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err    = curl_error($ch);
    curl_close($ch);

    if ($status >= 200 && $status < 300) {
        return true;
    }

    // Waarom het misging is het enige dat later nog te achterhalen valt, dus
    // dat leggen we vast. De sleutel zelf komt hier nooit in.
    log_line('brevo faalde (' . $status . ') voor ' . $to . ': ' . ($err !== '' ? $err : substr((string) $body, 0, 300)));

    return false;
}

/**
 * Verstuurt via de lokale mailserver: multipart, tekst en HTML.
 *
 * De regeleindes zijn hier nadrukkelijk CRLF: MIME schrijft dat voor, en een
 * body met enkel LF laten sommige servers verkeerd uiteenvallen.
 */
function send_via_sendmail(string $to, string $subject, string $html, string $text, string $replyTo, array $bcc = []): bool
{
    $crlf     = "\r\n";
    $boundary = 'b2x8' . bin2hex(random_bytes(12));

    $headers = [
        'MIME-Version: 1.0',
        'Content-Type: multipart/alternative; boundary="' . $boundary . '"',
        'From: ' . header_safe(MAIL_FROM_NAME) . ' <' . header_safe(MAIL_FROM) . '>',
    ];
    if ($replyTo !== '') {
        $headers[] = 'Reply-To: ' . header_safe($replyTo);
    }
    if ($bcc !== []) {
        $headers[] = 'Bcc: ' . implode(', ', array_map('header_safe', $bcc));
    }

    $body = implode($crlf, [
        '--' . $boundary,
        'Content-Type: text/plain; charset=UTF-8',
        'Content-Transfer-Encoding: 8bit',
        '',
        $text,
        '',
        '--' . $boundary,
        'Content-Type: text/html; charset=UTF-8',
        'Content-Transfer-Encoding: 8bit',
        '',
        $html,
        '',
        '--' . $boundary . '--',
        '',
    ]);

    return @mail(
        header_safe($to),
        encode_subject($subject),
        $body,
        implode($crlf, $headers),
        '-f' . MAIL_FROM
    );
}

/**
 * Verstuurt een mail, bij voorkeur via Brevo.
 *
 * Weigert Brevo (sleutel weg, domein nog niet geverifieerd, API plat), dan
 * gaat het bericht alsnog via de lokale mailserver de deur uit. Een aanvraag
 * mag nooit sneuvelen omdat er iets mis is met een externe dienst.
 */
function send_mail(string $to, string $subject, string $html, string $text, string $replyTo = '', array $bcc = []): bool
{
    $apiKey = (string) config('brevo_api_key', '');

    if ($apiKey !== '' && function_exists('curl_init')) {
        if (send_via_brevo($apiKey, $to, $subject, $html, $text, $replyTo, $bcc)) {
            return true;
        }
    }

    return send_via_sendmail($to, $subject, $html, $text, $replyTo, $bcc);
}

/* ---------- Mailsjablonen ---------------------------------------------- */

/** Eén opmaak voor beide mails: zwart-wit, JetBrains-achtige mono voor labels. */
function mail_shell(string $preheader, string $inner): string
{
    $preheader = e($preheader);

    return <<<HTML
<!doctype html>
<html lang="nl">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#fafbfc;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">{$preheader}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fafbfc;">
  <tr><td align="center" style="padding:32px 16px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
           style="max-width:560px;background:#ffffff;border:1px solid #0a0a0a;">
      <tr>
        <td style="background:#0a0a0a;padding:28px 32px;">
          <span style="font-family:'Courier New',monospace;font-size:30px;font-weight:700;
                       letter-spacing:-0.02em;color:#fafbfc;">2X8</span>
        </td>
      </tr>
      <tr><td style="padding:32px;font-family:Helvetica,Arial,sans-serif;font-size:15px;
                     line-height:1.6;color:#0a0a0a;">{$inner}</td></tr>
      <tr>
        <td style="border-top:1px solid #0a0a0a;padding:20px 32px;
                   font-family:'Courier New',monospace;font-size:11px;
                   letter-spacing:0.06em;text-transform:uppercase;color:#6e6a66;">
          2X8 &middot; <a href="mailto:hello@2x8.be" style="color:#6e6a66;">hello@2x8.be</a>
          &middot; <a href="https://2x8.be" style="color:#6e6a66;">2x8.be</a>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body>
</html>
HTML;
}

function row(string $label, string $value): string
{
    return '<tr>'
        . '<td style="padding:10px 0;border-bottom:1px solid #e6e6e6;width:120px;vertical-align:top;'
        . 'font-family:\'Courier New\',monospace;font-size:11px;letter-spacing:0.06em;'
        . 'text-transform:uppercase;color:#6e6a66;">' . e($label) . '</td>'
        . '<td style="padding:10px 0;border-bottom:1px solid #e6e6e6;'
        . 'font-family:Helvetica,Arial,sans-serif;font-size:15px;color:#0a0a0a;">' . $value . '</td>'
        . '</tr>';
}

/**
 * Onderwerpregel van de melding naar de studio.
 *
 * Het gekozen onderwerp staat tussen haakjes achter de naam. "Iets anders"
 * zegt niets, dus dan laten we het weg in plaats van het mee te slepen.
 */
function mail_subject(array $d): string
{
    $soort = trim((string) ($d['type'] ?? ''));

    if ($soort === '' || $soort === 'Iets anders') {
        return 'Nieuwe aanvraag: ' . $d['naam'];
    }

    return 'Nieuwe aanvraag: ' . $d['naam'] . ' (' . $soort . ')';
}

function studio_mail(array $d): array
{
    $bericht = nl2br(e($d['bericht']));
    $rows = row('Naam', e($d['naam']))
        . row('E-mail', '<a href="mailto:' . e($d['email']) . '" style="color:#0a0a0a;">' . e($d['email']) . '</a>')
        . ($d['bedrijf'] !== '' ? row('Bedrijf', e($d['bedrijf'])) : '')
        . row('Type', e($d['type']))
        . row('Bericht', $bericht);

    $inner = '<p style="margin:0 0 20px;font-size:20px;font-weight:700;">Nieuwe aanvraag via 2x8.be</p>'
        . '<table role="presentation" width="100%" cellpadding="0" cellspacing="0">' . $rows . '</table>'
        . '<p style="margin:24px 0 0;"><a href="mailto:' . e($d['email'])
        . '" style="display:inline-block;background:#0a0a0a;color:#fafbfc;padding:12px 20px;'
        . 'text-decoration:none;font-weight:600;">Antwoord ' . e($d['naam']) . '</a></p>';

    $text = "Nieuwe aanvraag via 2x8.be\n\n"
        . "Naam: {$d['naam']}\n"
        . "E-mail: {$d['email']}\n"
        . ($d['bedrijf'] !== '' ? "Bedrijf: {$d['bedrijf']}\n" : '')
        . "Type: {$d['type']}\n\n"
        . "Bericht:\n{$d['bericht']}\n";

    return [
        'subject' => mail_subject($d),
        'html'    => mail_shell('Nieuwe aanvraag van ' . $d['naam'], $inner),
        'text'    => $text,
    ];
}

function confirm_mail(array $d): array
{
    // Aanspreken met de voornaam: "Dag Florian" leest als een mens, "Dag
    // Florian Bracke" als een databaseveld.
    $voornaam = explode(' ', trim($d['naam']))[0];
    $naam     = e($voornaam);
    $bericht  = nl2br(e($d['bericht']));

    $inner = '<p style="margin:0 0 8px;font-size:22px;font-weight:700;line-height:1.25;">'
        . 'Dag ' . $naam . ', we hebben je bericht goed ontvangen.</p>'
        . '<p style="margin:0 0 24px;color:#6e6a66;">We antwoorden zo snel mogelijk. '
        . 'Hieronder wat je ons stuurde:</p>'
        . '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" '
        . 'style="border:1px solid #0a0a0a;border-collapse:collapse;">'
        . '<tr><td style="padding:20px;">'
        . '<p style="margin:0 0 6px;font-family:\'Courier New\',monospace;font-size:11px;'
        . 'letter-spacing:0.06em;text-transform:uppercase;color:#6e6a66;">' . e($d['type']) . '</p>'
        . '<p style="margin:0;color:#0a0a0a;">' . $bericht . '</p>'
        . '</td></tr></table>'
        . '<p style="margin:24px 0 0;">Moet er iets bij? Antwoord gerust op deze mail.</p>'
        . '<p style="margin:24px 0 0;"><a href="' . SITE_URL . '/werk"'
        . ' style="display:inline-block;background:#0a0a0a;color:#fafbfc;padding:12px 20px;'
        . 'text-decoration:none;font-weight:600;">Bekijk ons werk</a></p>';

    $text = "Dag {$voornaam}, we hebben je bericht goed ontvangen.\n\n"
        . "We antwoorden zo snel mogelijk.\n\n"
        . "Wat je ons stuurde ({$d['type']}):\n{$d['bericht']}\n\n"
        . "Moet er iets bij? Antwoord gerust op deze mail.\n\n"
        . "2X8 — hello@2x8.be — https://2x8.be\n";

    return [
        'subject' => 'We hebben je bericht — 2X8',
        'html'    => mail_shell('We antwoorden zo snel mogelijk.', $inner),
        'text'    => $text,
    ];
}

/* ---------- Afhandeling ------------------------------------------------- */

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    respond(false, 'Methode niet toegestaan.', [], 405);
}

// Spamval en tijdcheck: allebei stil laten slagen, zodat een bot niet leert
// waarop hij afknapte.
if (post('website') !== '') {
    respond(true, 'Bedankt, je bericht is verstuurd.');
}
// Duur in ms sinds de eerste toetsaanslag, gemeten door de browser zelf. Een
// timestamp zou hier niet deugen: die vergelijkt de klok van de bezoeker met
// die van de server, en bij een voorlopende klok valt een echt bericht weg.
$duur = (int) post('duur');
if ($duur > 0 && $duur < MIN_SECONDS * 1000) {
    respond(true, 'Bedankt, je bericht is verstuurd.');
}

$data = [
    'naam'    => mb_substr(post('naam'), 0, 120),
    'email'   => mb_substr(post('email'), 0, 200),
    'bedrijf' => mb_substr(post('bedrijf'), 0, 160),
    'type'    => mb_substr(post('type'), 0, 60),
    'bericht' => mb_substr(post('bericht'), 0, 5000),
];

$errors = [];
if ($data['naam'] === '') {
    $errors['naam'] = 'Vul je naam in.';
}
if ($data['email'] === '' || !filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
    $errors['email'] = 'Vul een geldig e-mailadres in.';
}
if (mb_strlen($data['bericht']) < 10) {
    $errors['bericht'] = 'Schrijf iets meer, zodat we je goed kunnen antwoorden.';
}
if ($data['type'] === '') {
    $data['type'] = 'Iets anders';
}

if ($errors !== []) {
    respond(false, 'Kijk de aangeduide velden nog even na.', $errors, 422);
}

$studio  = studio_mail($data);
$confirm = confirm_mail($data);

// De melding naar de studio is de belangrijke: slaagt die niet, dan is het
// bericht weg en moet de bezoeker dat weten.
$sentStudio = send_mail(MAIL_TO, $studio['subject'], $studio['html'], $studio['text'], $data['email'], MAIL_BCC);
if (!$sentStudio) {
    respond(false, 'Het versturen lukte niet. Mail ons gerust rechtstreeks op ' . MAIL_TO . '.', [], 500);
}

// De bevestiging is een extraatje: mislukt die, dan heeft de studio het bericht
// nog altijd, dus dat mag de bezoeker geen foutmelding opleveren.
send_mail($data['email'], $confirm['subject'], $confirm['html'], $confirm['text'], MAIL_TO);

respond(true, 'Bedankt! Je bericht is verstuurd, je bevestiging staat in je mailbox.');
