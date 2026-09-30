#!/usr/bin/env node
// Klantpagina's op customers.2x8.be aanmaken en publiceren.
//
//   node customers/maak.js nieuw <klant> --naam "Elevator Antwerp" [--website https://...]
//       maakt data/<klant>.json met een vers wachtwoord en print de link.
//       Het wachtwoord wordt maar één keer getoond: het bestand bevat enkel de hash.
//   node customers/maak.js reset <klant>
//       nieuw wachtwoord voor een bestaande pagina (oude link werkt niet meer).
//   node customers/maak.js check <klant> <wachtwoord>
//       controleert of een wachtwoord bij de pagina hoort.
//   node customers/maak.js publiceer <klant> [--pass <wachtwoord>]
//       commit data/<klant>.json, pull --rebase, push, en test de live URL.
//
// Na `nieuw` vul je data/<klant>.json aan (secties, updates) en doe je `publiceer`.
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const DATA = path.join(__dirname, 'data');
const HOST = 'https://customers.2x8.be';

const [, , cmd, slug, ...rest] = process.argv;
const opts = {};
for (let i = 0; i < rest.length; i++) {
  if (rest[i].startsWith('--')) {
    opts[rest[i].slice(2)] = rest[i + 1] && !rest[i + 1].startsWith('--') ? rest[++i] : true;
  } else {
    (opts._ = opts._ || []).push(rest[i]);
  }
}

function stop(msg) {
  console.error(msg);
  process.exit(1);
}
function checkSlug(s) {
  if (!s || !/^[a-z0-9][a-z0-9-]{0,63}$/.test(s)) stop('Klant-slug: enkel kleine letters, cijfers en koppeltekens, bv. elevator-antwerp');
}
function bestand(s) {
  return path.join(DATA, s + '.json');
}
function lees(s) {
  const f = bestand(s);
  if (!fs.existsSync(f)) stop(`Bestaat niet: ${path.relative(ROOT, f)}`);
  return JSON.parse(fs.readFileSync(f, 'utf8'));
}
function schrijf(s, data) {
  fs.mkdirSync(DATA, { recursive: true });
  fs.writeFileSync(bestand(s), JSON.stringify(data, null, 2) + '\n');
}
function wachtwoord() {
  // 24 tekens uit [A-Za-z0-9]: ~143 bits, zonder tekens die in een URL storen.
  const abc = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = crypto.randomBytes(48);
  let uit = '';
  for (let i = 0; i < bytes.length && uit.length < 24; i++) {
    if (bytes[i] < 248) uit += abc[bytes[i] % 62]; // 248 = 4*62, geen bias
  }
  return uit.length === 24 ? uit : wachtwoord();
}
function hash(p) {
  return crypto.createHash('sha256').update(p, 'utf8').digest('hex');
}
function vandaag() {
  return new Date().toISOString().slice(0, 10);
}
function link(s, p) {
  return `${HOST}/${s}?pass=${p}`;
}
function git(...args) {
  return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] }).trim();
}

checkSlug(slug);

switch (cmd) {
  case 'nieuw': {
    if (fs.existsSync(bestand(slug))) stop(`Bestaat al: data/${slug}.json. Gebruik "reset" voor een nieuw wachtwoord.`);
    const naam = typeof opts.naam === 'string' ? opts.naam : stop('--naam "Naam van de klant" is verplicht');
    const website = typeof opts.website === 'string' ? opts.website : '';
    const p = wachtwoord();
    const data = {
      naam,
      slug,
      pass_hash: hash(p),
      aangemaakt: vandaag(),
      bijgewerkt: vandaag(),
      intro: `Welkom ${naam}. Op deze pagina verzamelen we alles wat je over jullie project bij 2X8 moet weten: waar de site staat, wie je kunt bellen, en wat er sindsdien veranderde.`,
      contact: { naam: 'Florian Bracke', email: 'hello@2x8.be', telefoon: '+32 498 19 00 84' },
      secties: [
        {
          titel: 'Jullie website',
          items: website ? [{ label: 'Adres', waarde: website.replace(/^https?:\/\//, '').replace(/\/$/, ''), url: website }] : [],
        },
        { titel: 'Hosting en domein', items: [] },
        { titel: 'Wat we bouwden', tekst: '' },
      ],
      updates: [{ datum: vandaag(), tekst: 'Klantenpagina aangemaakt.' }],
    };
    schrijf(slug, data);
    console.log(`Aangemaakt: customers/data/${slug}.json`);
    console.log(`Link (eenmalig getoond, bewaar in Notion bij de klant):\n${link(slug, p)}`);
    break;
  }
  case 'reset': {
    const data = lees(slug);
    const p = wachtwoord();
    data.pass_hash = hash(p);
    data.bijgewerkt = vandaag();
    schrijf(slug, data);
    console.log(`Nieuw wachtwoord voor ${slug}. De oude link werkt niet meer.\n${link(slug, p)}`);
    break;
  }
  case 'check': {
    const data = lees(slug);
    const p = (opts._ || [])[0] || stop('Geef het wachtwoord mee: check <klant> <wachtwoord>');
    const ok = data.pass_hash === hash(p);
    console.log(ok ? 'OK: wachtwoord klopt.' : 'FOUT: wachtwoord klopt niet.');
    process.exit(ok ? 0 : 2);
  }
  case 'publiceer': {
    const data = lees(slug);
    const rel = `customers/data/${slug}.json`;
    git('add', '--', rel);
    const staged = git('diff', '--cached', '--name-only', '--', rel);
    if (staged) {
      git('commit', '-m', `Klantenpagina ${data.naam} bijgewerkt\n\nCo-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`, '--', rel);
      console.log('Gecommit.');
    } else {
      console.log('Niets te committen; ik push wat er al staat.');
    }
    git('pull', '--rebase', '--autostash', 'origin', 'main');
    git('push', 'origin', 'main');
    console.log('Gepusht; Hostinger trekt het binnen enkele seconden binnen.');
    (async () => {
      await new Promise((r) => setTimeout(r, 8000));
      const zonder = await fetch(`${HOST}/${slug}`, { redirect: 'manual' });
      console.log(`Zonder wachtwoord: ${zonder.status} (verwacht 403)`);
      if (typeof opts.pass === 'string') {
        const met = await fetch(link(slug, opts.pass), { redirect: 'manual' });
        const html = await met.text();
        const okNaam = html.includes(`<h1>${data.naam.replace(/&/g, '&amp;')}</h1>`);
        console.log(`Met wachtwoord: ${met.status}, naam op de pagina: ${okNaam ? 'ja' : 'NEE'} (verwacht 200 en ja)`);
        if (met.status !== 200 || !okNaam) process.exit(2);
      }
      if (zonder.status !== 403) process.exit(2);
    })();
    break;
  }
  default:
    stop('Gebruik: maak.js nieuw|reset|check|publiceer <klant> ...');
}
