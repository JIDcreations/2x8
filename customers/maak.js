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
//   node customers/maak.js cijfers <klant> --bestand <ga.json>
//       zet de GA4-cijfers van één kalendermaand of kalenderkwartaal (uitvoer van
//       `klantcontact.py ga ... --compare`) in het archief "Websitecijfers";
//       dezelfde periode opnieuw = overschrijven.
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
const KANALEN = {
  Direct: 'Rechtstreeks', 'Organic Search': 'Zoekmachines', 'Paid Search': 'Zoekadvertenties',
  'Organic Social': 'Sociale media', 'Paid Social': 'Advertenties op sociale media', Referral: 'Andere websites',
  Email: 'E-mail', Display: 'Banners', 'Organic Video': 'Video', 'Paid Video': 'Videoadvertenties',
  'Organic Shopping': 'Shopping', 'Paid Shopping': 'Shoppingadvertenties', 'Cross-network': 'Advertenties',
  'Paid Other': 'Andere advertenties', Affiliates: 'Partners', SMS: 'Sms', Unassigned: 'Onbekend',
};
const TOESTELLEN = { mobile: 'Gsm', desktop: 'Computer', tablet: 'Tablet', 'smart tv': 'Smart-tv' };
const LANDEN = {
  Belgium: 'België', Netherlands: 'Nederland', France: 'Frankrijk', Germany: 'Duitsland', Luxembourg: 'Luxemburg',
  'United Kingdom': 'Verenigd Koninkrijk', 'United States': 'Verenigde Staten', Spain: 'Spanje', Italy: 'Italië',
  Ireland: 'Ierland', Switzerland: 'Zwitserland', Austria: 'Oostenrijk', Poland: 'Polen', Sweden: 'Zweden',
  Denmark: 'Denemarken', Norway: 'Noorwegen', Finland: 'Finland', Portugal: 'Portugal', Canada: 'Canada',
  China: 'China', India: 'India', Japan: 'Japan', Singapore: 'Singapore', Türkiye: 'Turkije', Morocco: 'Marokko', Czechia: 'Tsjechië',
  '(not set)': 'Onbekend',
};
const DAG = 864e5;
function aantalDagen({ start, end }) {
  return (Date.parse(end) - Date.parse(start)) / DAG + 1;
}
// Eén maand of kwartaal uit de klantcontact.py-uitvoer, compact en met Nederlandse labels.
function maandblok(ga) {
  const h = ga.huidig || stop('Geen "huidig" in het GA-bestand.');
  const { start, end } = h.periode;
  const [j, m] = start.split('-').map(Number);
  const laatsteDag = (mnd) => new Date(Date.UTC(j, mnd, 0)).toISOString().slice(0, 10); // mnd 1-12
  let sleutel;
  if (/^\d{4}-\d{2}-01$/.test(start) && end === laatsteDag(m)) sleutel = start.slice(0, 7);
  else if (/^\d{4}-(01|04|07|10)-01$/.test(start) && end === laatsteDag(m + 2)) sleutel = `${j}-Q${(m + 2) / 3}`;
  else stop(`Geen volledige kalendermaand of kalenderkwartaal: ${start} tot ${end}`);
  const kern = (t = {}) => ({
    bezoekers: t.totalUsers || 0, sessies: t.sessions || 0, weergaven: t.screenPageViews || 0,
    duur: Math.round(t.averageSessionDuration || 0), acties: t.keyEvents || 0,
  });
  const top = (rij, sleutel, waarde, n, namen = {}) =>
    (rij || []).slice(0, n).map((r) => [namen[r[sleutel]] || r[sleutel], r[waarde] || 0]);
  const perDatum = Object.fromEntries((h.per_dag || []).map((r) => [r.date, r.sessions || 0]));
  const per_dag = Array.from({ length: aantalDagen(h.periode) },
    (_, i) => perDatum[new Date(Date.parse(start) + i * DAG).toISOString().slice(0, 10).replace(/-/g, '')] || 0);
  return {
    maand: sleutel, // "2026-09" of "2026-Q3"
    periode: { start, end },
    totalen: kern(h.totalen),
    vorige: ga.vorig ? { periode: ga.vorig.periode, ...kern(ga.vorig.totalen) } : null,
    per_dag,
    kanalen: top(h.kanalen, 'sessionDefaultChannelGroup', 'sessions', 6, KANALEN),
    toestellen: top(h.apparaten, 'deviceCategory', 'sessions', 4, TOESTELLEN),
    landen: top(h.landen, 'country', 'sessions', 5, LANDEN),
    paginas: top(h.paginas, 'pagePath', 'screenPageViews', 6),
  };
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
        const maand = data.cijfers && data.cijfers[0] ? data.cijfers[0].maand : null;
        const okCijfers = !maand || html.includes(`data-maand="${maand}"`);
        console.log(`Met wachtwoord: ${met.status}, naam op de pagina: ${okNaam ? 'ja' : 'NEE'}` +
          (maand ? `, cijfers ${maand}: ${okCijfers ? 'ja' : 'NEE'}` : '') + ' (verwacht 200 en ja)');
        if (met.status !== 200 || !okNaam || !okCijfers) process.exit(2);
      }
      if (zonder.status !== 403) process.exit(2);
    })();
    break;
  }
  case 'cijfers': {
    const data = lees(slug);
    const f = typeof opts.bestand === 'string' ? opts.bestand : stop('--bestand <ga.json> is verplicht');
    const blok = maandblok(JSON.parse(fs.readFileSync(f, 'utf8')));
    if (blok.per_dag.length !== aantalDagen(blok.periode)) stop('Interne fout: per_dag telt niet elke dag.');
    data.cijfers = (data.cijfers || []).filter((m) => m.maand !== blok.maand).concat(blok)
      .sort((a, b) => b.maand.localeCompare(a.maand));
    data.bijgewerkt = vandaag();
    schrijf(slug, data);
    console.log(`Cijfers ${blok.maand} in data/${slug}.json: ${blok.totalen.bezoekers} bezoekers, ${blok.totalen.sessies} bezoeken (${data.cijfers.length} periodes in het archief).`);
    break;
  }
  default:
    stop('Gebruik: maak.js nieuw|reset|check|publiceer|cijfers <klant> ...');
}
