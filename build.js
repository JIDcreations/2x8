#!/usr/bin/env node
/**
 * 2X8 — vertaalde pagina's genereren.
 *
 *   node build.js          bouwt /fr en /en uit de Nederlandse bronpagina's
 *   node build.js --keys   toont elke vertaalsleutel met haar Nederlandse tekst
 *   node build.js --check  meldt ontbrekende en overtollige sleutels, bouwt niet
 *
 * De Nederlandse HTML in de root is de bron: daar staat de opmaak én de
 * Nederlandse tekst. Wat vertaald moet worden is gemarkeerd met:
 *
 *   data-i18n="sleutel"              vervang de tekst van dit element
 *   data-i18n-html="sleutel"         idem, maar de vertaling mag opmaak bevatten
 *   data-i18n-attr="alt:sleutel"     vervang een attribuut (meerdere: komma's)
 *
 * De vertalingen staan in i18n/<taal>.json, de URL's in i18n/routes.json.
 * Er is bewust geen i18n/nl.json: het Nederlands staat al in de bron, en op
 * twee plaatsen bijhouden loopt gegarandeerd uit elkaar.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const routes = readJson(path.join(ROOT, 'i18n', 'routes.json'));
const BASE = routes.default;

/* ------------------------------------------------------------------ */
/* Kleine HTML-hulpjes                                                  */
/* ------------------------------------------------------------------ */

// Tags zonder sluittag: die hebben geen inhoud om te vervangen.
const VOID = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr',
]);

/**
 * Zoekt vanaf `from` de openingstag waarin `attr` voorkomt en geeft terug waar
 * die tag begint en eindigt. Attributen kunnen `>` bevatten binnen quotes, dus
 * we lopen door de tag in plaats van naar het eerste `>` te springen.
 */
function findTagEnd(html, tagStart) {
  let quote = null;
  for (let i = tagStart; i < html.length; i++) {
    const c = html[i];
    if (quote) {
      if (c === quote) quote = null;
    } else if (c === '"' || c === "'") {
      quote = c;
    } else if (c === '>') {
      return i;
    }
  }
  throw new Error('onafgesloten tag vanaf positie ' + tagStart);
}

/** Naam van de tag die op `tagStart` (een `<`) begint. */
function tagName(html, tagStart) {
  const m = /^<\s*([a-zA-Z][a-zA-Z0-9-]*)/.exec(html.slice(tagStart, tagStart + 40));
  return m ? m[1].toLowerCase() : '';
}

/**
 * Geeft de positie van de sluittag die hoort bij de tag op `tagStart`, rekening
 * houdend met gelijknamige tags erbinnen (een <span> in een <span>).
 */
function findCloseTag(html, name, afterOpen) {
  const open = new RegExp('<' + name + '(?=[\\s/>])', 'gi');
  const close = new RegExp('</' + name + '\\s*>', 'gi');
  let depth = 1;
  let cursor = afterOpen;

  while (depth > 0) {
    close.lastIndex = cursor;
    const c = close.exec(html);
    if (!c) throw new Error('geen sluittag voor <' + name + '>');

    open.lastIndex = cursor;
    let o = open.exec(html);
    while (o && o.index < c.index) {
      depth++;
      open.lastIndex = o.index + 1;
      o = open.exec(html);
    }

    depth--;
    cursor = c.index + c[0].length;
    if (depth === 0) return { start: c.index, end: cursor };
  }
  throw new Error('geen sluittag voor <' + name + '>');
}

/** Leest één attribuut uit een openingstag. */
function readAttr(tag, name) {
  const m = new RegExp('\\s' + name + '\\s*=\\s*"([^"]*)"', 'i').exec(tag);
  return m ? m[1] : null;
}

function setAttr(tag, name, value) {
  const re = new RegExp('(\\s' + name + '\\s*=\\s*")([^"]*)(")', 'i');
  if (re.test(tag)) return tag.replace(re, (_, a, __, c) => a + value + c);
  // Attribuut bestond nog niet: erbij zetten vlak voor de sluitende punthaak.
  return tag.replace(/\s*\/?>$/, (end) => ' ' + name + '="' + value + '"' + end);
}

/**
 * Loopt door alle elementen met een van de i18n-attributen, van achter naar
 * voren zodat eerdere posities geldig blijven terwijl we vervangen.
 */
function eachMarked(html, fn) {
  const marker = /<[a-zA-Z][^>]*?data-i18n(?:-html|-attr)?\s*=/g;
  const hits = [];
  let m;
  while ((m = marker.exec(html)) !== null) {
    hits.push(m.index);
    marker.lastIndex = m.index + 1;
  }

  for (let i = hits.length - 1; i >= 0; i--) {
    const start = hits[i];
    const gt = findTagEnd(html, start);
    const tag = html.slice(start, gt + 1);
    const name = tagName(html, start);
    const selfClosing = VOID.has(name) || /\/>$/.test(tag);

    let inner = null;
    let innerStart = -1;
    let innerEnd = -1;
    if (!selfClosing) {
      const close = findCloseTag(html, name, gt + 1);
      innerStart = gt + 1;
      innerEnd = close.start;
      inner = html.slice(innerStart, innerEnd);
    }

    const result = fn({ tag, name, inner });
    if (!result) continue;

    if (result.inner !== undefined && !selfClosing) {
      html = html.slice(0, innerStart) + result.inner + html.slice(innerEnd);
    }
    if (result.tag !== undefined) {
      html = html.slice(0, start) + result.tag + html.slice(gt + 1);
    }
  }
  return html;
}

/* ------------------------------------------------------------------ */
/* Sleutels verzamelen                                                  */
/* ------------------------------------------------------------------ */

function collectKeys(html) {
  const found = new Map(); // sleutel -> Nederlandse tekst
  eachMarked(html, ({ tag, inner }) => {
    const text = readAttr(tag, 'data-i18n');
    const rich = readAttr(tag, 'data-i18n-html');
    const attrs = readAttr(tag, 'data-i18n-attr');

    if (text) found.set(text, (inner || '').trim().replace(/\s+/g, ' '));
    if (rich) found.set(rich, (inner || '').trim().replace(/\s+/g, ' '));
    if (attrs) {
      for (const pair of attrs.split(',')) {
        const [attr, key] = pair.split(':').map((x) => x.trim());
        if (attr && key) found.set(key, readAttr(tag, attr) || '');
      }
    }
    return null; // niets wijzigen
  });
  return found;
}

/* ------------------------------------------------------------------ */
/* Vertalen                                                             */
/* ------------------------------------------------------------------ */

function translate(html, dict, missing) {
  function value(key) {
    if (Object.prototype.hasOwnProperty.call(dict, key)) return dict[key];
    missing.add(key);
    return null; // niet vertaald: Nederlands laten staan, beter dan een gat
  }

  return eachMarked(html, ({ tag, inner }) => {
    const out = {};

    const textKey = readAttr(tag, 'data-i18n');
    const richKey = readAttr(tag, 'data-i18n-html');
    const attrSpec = readAttr(tag, 'data-i18n-attr');

    if (textKey !== null) {
      const v = value(textKey);
      if (v !== null) out.inner = escapeText(v);
    }
    if (richKey !== null) {
      const v = value(richKey);
      if (v !== null) out.inner = v; // vertaling mag opmaak bevatten
    }
    if (attrSpec !== null) {
      let t = tag;
      for (const pair of attrSpec.split(',')) {
        const [attr, key] = pair.split(':').map((x) => x.trim());
        if (!attr || !key) continue;
        const v = value(key);
        if (v !== null) t = setAttr(t, attr, escapeAttr(v));
      }
      out.tag = t;
    }

    return Object.keys(out).length ? out : null;
  });
}

// De vertaling is platte tekst: alleen wat de HTML kan breken ontsnappen.
// Entiteiten die de vertaler zelf schreef (&amp;, &rsquo;) blijven staan.
function escapeText(v) {
  return String(v).replace(/&(?!#?[a-zA-Z0-9]+;)/g, '&amp;').replace(/</g, '&lt;');
}

function escapeAttr(v) {
  return escapeText(v).replace(/"/g, '&quot;');
}

/* ------------------------------------------------------------------ */
/* Links, paden en head per taal                                        */
/* ------------------------------------------------------------------ */

/** Nederlandse slug -> bronbestand, om links te kunnen omzetten. */
function slugIndex() {
  const byNl = new Map();
  for (const [file, page] of Object.entries(routes.pages)) {
    byNl.set(page.slug[BASE], file);
  }
  return byNl;
}

/** Waar een pagina in een taal terechtkomt, of null als ze niet vertaald is. */
function slugFor(file, lang) {
  const page = routes.pages[file];
  if (!page) return null;
  if (!page.done.includes(lang)) return null;
  return page.slug[lang];
}

/** De taalhomepage: waar de wisselaar naartoe valt als de pagina ontbreekt. */
function homeFor(lang) {
  return routes.pages['index.html'].slug[lang];
}

/**
 * Herschrijft de interne links naar de doeltaal, en maakt relatieve
 * asset-paden root-absoluut. Dat laatste moet: /fr/ is een map dieper, dus
 * "css/styles.css" zou daar /fr/css/styles.css worden.
 */
function rewriteLinks(html, lang, sourceFile) {
  const bySlug = slugIndex();

  // data-finder-src hoort erbij: de (nu verborgen) verkenner laadt daar zelf
  // beelden mee, en die paden zijn even relatief als de rest.
  const URL_ATTR = /(\s(?:href|src|poster|data-finder-src)\s*=\s*")([^"]+)(")/gi;

  return html.replace(URL_ATTR, (full, pre, url, post) => {
    if (/^(https?:|mailto:|tel:|data:|#)/i.test(url)) return full;

    // Relatief pad naar een asset (css/, js/, assets/, ../assets/, favicon.svg):
    // omzetten naar root-absoluut zodat het vanuit /fr/ ook klopt.
    if (!url.startsWith('/')) {
      const fromDir = path.posix.dirname('/' + sourceFile.replace(/\\/g, '/'));
      const abs = path.posix.normalize(path.posix.join(fromDir, url));
      return pre + abs + post;
    }

    // Interne link: hash en query losknippen, de rest opzoeken.
    const m = /^([^?#]*)(.*)$/.exec(url);
    const clean = m[1].replace(/\.html$/, '');
    const rest = m[2];

    const file = bySlug.get(clean) || bySlug.get(clean === '' ? '/' : clean);
    if (!file) return full; // /mail.php en dergelijke: laten staan

    // Bestaat de pagina nog niet in deze taal, dan linken we naar de
    // Nederlandse versie. De bezoeker komt zo op de juiste inhoud terecht;
    // naar de taalhomepage sturen zou elke link naar een onvertaalde pagina
    // laten doodlopen. Alleen de taalwisselaar valt wél op de homepage terug,
    // want daar vraagt de bezoeker expliciet om die taal.
    const target = slugFor(file, lang) || routes.pages[file].slug[BASE];
    return pre + target + rest + post;
  });
}

/** Zet lang, canonical, og:locale en de hreflang-alternatieven goed. */
function rewriteHead(html, lang, file) {
  const conf = routes.languages[lang];
  const site = routes.site;
  const self = slugFor(file, lang);

  html = html.replace(/<html\s+lang="[^"]*"/i, '<html lang="' + conf.htmlLang + '"');
  html = html.replace(
    /<link rel="canonical" href="[^"]*"\s*\/?>/i,
    '<link rel="canonical" href="' + site + self + '" />'
  );
  html = html.replace(
    /<meta property="og:locale" content="[^"]*"\s*\/?>/i,
    '<meta property="og:locale" content="' + conf.ogLocale + '" />'
  );
  html = html.replace(
    /<meta property="og:url" content="[^"]*"\s*\/?>/i,
    '<meta property="og:url" content="' + site + self + '" />'
  );

  // hreflang: alleen de talen waarin deze pagina echt bestaat.
  const alts = [];
  for (const code of Object.keys(routes.languages)) {
    const slug = slugFor(file, code);
    if (!slug) continue;
    alts.push('    <link rel="alternate" hreflang="' + routes.languages[code].htmlLang +
      '" href="' + site + slug + '" />');
  }
  alts.push('    <link rel="alternate" hreflang="x-default" href="' + site + slugFor(file, BASE) + '" />');

  html = html.replace(/\n\s*<link rel="alternate" hreflang="[^"]*" href="[^"]*"\s*\/?>/gi, '');
  html = html.replace(/(<link rel="canonical"[^>]*>)/i, '$1\n' + alts.join('\n'));

  return html;
}

/* ------------------------------------------------------------------ */
/* Taalwisselaar                                                        */
/* ------------------------------------------------------------------ */

/**
 * Bouwt de wisselaar voor één pagina in één taal. De links zijn statisch: elke
 * taal wijst naar dezelfde pagina in die taal, zodat de bezoeker blijft waar
 * hij is. Bestaat de vertaling niet, dan gaat de link naar de homepage van die
 * taal en zegt het label dat erbij.
 */
function langSwitcher(file, current) {
  // De uitleg bij een ontbrekende vertaling staat in de taal van de pagina
  // waar de bezoeker nú is, niet in de taal waar de link heen gaat.
  const notice = routes.languages[current].notTranslated || '{taal}';

  const items = Object.entries(routes.languages).map(([code, conf]) => {
    const slug = slugFor(file, code);
    const href = slug || homeFor(code);
    const isCurrent = code === current;
    const partial = !slug;

    return '        <li><a class="langs__link' + (isCurrent ? ' is-current' : '') + '"' +
      ' href="' + href + '" hreflang="' + conf.htmlLang + '" lang="' + conf.htmlLang + '"' +
      (isCurrent ? ' aria-current="true"' : '') +
      (partial ? ' title="' + notice.replace('{taal}', conf.name) + '"' : '') +
      '>' + conf.label + '</a></li>';
  });

  return '      <nav class="langs" aria-label="Taal / Langue / Language">\n' +
    '        <ul class="langs__list">\n' + items.join('\n') + '\n        </ul>\n' +
    '      </nav>\n';
}

/** Plaatst (of vervangt) de wisselaar in de nav en in het mobiele menu. */
function injectSwitcher(html, file, lang) {
  const markup = langSwitcher(file, lang);

  html = stripSwitcher(html);

  // In de bovenbalk, vlak voor de "Start een project"-knop. Ook op mobiel
  // blijft ze staan (de knop en de nav-links verdwijnen daar wel): van taal
  // wisselen moet altijd binnen handbereik zijn, niet pas achter het menu.
  html = html.replace(
    /\n\s*(<a class="btn btn--sm")/,
    '\n' + markup.replace(/^ {6}/gm, '        ') + '        $1'
  );

  return html;
}

function stripSwitcher(html) {
  return html.replace(/[ \t]*<nav class="langs[^"]*"[\s\S]*?<\/nav>\n?/g, '');
}

/* ------------------------------------------------------------------ */
/* Bouwen                                                               */
/* ------------------------------------------------------------------ */

function outputPath(slug) {
  // "/fr/" -> fr/index.html, "/fr/travail" -> fr/travail.html
  if (slug.endsWith('/')) return path.join(ROOT, slug.slice(1), 'index.html');
  return path.join(ROOT, slug.slice(1) + '.html');
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function build() {
  const langs = Object.keys(routes.languages).filter((l) => l !== BASE);
  const report = [];

  // De brontaal krijgt alleen een verse wisselaar en hreflang-regels.
  for (const file of Object.keys(routes.pages)) {
    const src = path.join(ROOT, file);
    if (!fs.existsSync(src)) continue;
    let html = fs.readFileSync(src, 'utf8');
    const before = html;
    html = injectSwitcher(html, file, BASE);
    html = rewriteHead(html, BASE, file);
    if (html !== before) {
      fs.writeFileSync(src, html);
      report.push(['  ~', file, '(wisselaar + hreflang)'].join(' '));
    }
  }

  for (const lang of langs) {
    const dictPath = path.join(ROOT, 'i18n', lang + '.json');
    if (!fs.existsSync(dictPath)) {
      console.error('! i18n/' + lang + '.json ontbreekt, taal overgeslagen');
      continue;
    }
    const dict = readJson(dictPath);
    const missing = new Set();

    for (const [file, page] of Object.entries(routes.pages)) {
      if (!page.done.includes(lang)) continue;
      const src = path.join(ROOT, file);
      if (!fs.existsSync(src)) {
        console.error('! bronbestand ontbreekt: ' + file);
        continue;
      }

      let html = fs.readFileSync(src, 'utf8');
      html = stripSwitcher(html);
      html = translate(html, dict, missing);
      html = rewriteLinks(html, lang, file);
      html = rewriteHead(html, lang, file);
      html = injectSwitcher(html, file, lang);

      const out = outputPath(page.slug[lang]);
      fs.mkdirSync(path.dirname(out), { recursive: true });
      fs.writeFileSync(out, html);
      report.push('  + ' + path.relative(ROOT, out).replace(/\\/g, '/'));
    }

    if (missing.size) {
      console.error('! ' + lang + ': ' + missing.size + ' sleutel(s) zonder vertaling, ' +
        'het Nederlands blijft daar staan:');
      for (const key of [...missing].sort()) console.error('    ' + key);
    }
  }

  console.log(report.join('\n'));
  console.log('\nKlaar. Vergeet de cachebuster niet als je css/styles.css of js/main.js aanraakte.');
}

function keys() {
  const all = new Map();
  for (const file of Object.keys(routes.pages)) {
    const src = path.join(ROOT, file);
    if (!fs.existsSync(src)) continue;
    for (const [k, v] of collectKeys(fs.readFileSync(src, 'utf8'))) {
      if (!all.has(k)) all.set(k, v);
    }
  }
  const obj = {};
  for (const k of [...all.keys()].sort()) obj[k] = all.get(k);
  console.log(JSON.stringify(obj, null, 2));
}

function check() {
  const all = new Set();
  for (const file of Object.keys(routes.pages)) {
    const src = path.join(ROOT, file);
    if (!fs.existsSync(src)) continue;
    for (const k of collectKeys(fs.readFileSync(src, 'utf8')).keys()) all.add(k);
  }

  let problems = 0;
  for (const lang of Object.keys(routes.languages)) {
    if (lang === BASE) continue;
    const dictPath = path.join(ROOT, 'i18n', lang + '.json');
    if (!fs.existsSync(dictPath)) {
      console.log(lang + ': geen bestand');
      problems++;
      continue;
    }
    const dict = readJson(dictPath);
    const missing = [...all].filter((k) => !(k in dict)).sort();
    const extra = Object.keys(dict).filter((k) => !all.has(k)).sort();

    console.log(lang + ': ' + (all.size - missing.length) + '/' + all.size + ' vertaald');
    if (missing.length) {
      console.log('  ontbreekt:');
      missing.forEach((k) => console.log('    ' + k));
      problems++;
    }
    if (extra.length) {
      console.log('  overbodig (sleutel bestaat niet meer in de HTML):');
      extra.forEach((k) => console.log('    ' + k));
    }
  }
  process.exitCode = problems ? 1 : 0;
}

const arg = process.argv[2];
if (arg === '--keys') keys();
else if (arg === '--check') check();
else build();
