/**
 * seo.js — alles wat een machine van deze site moet kunnen lezen.
 *
 * Draait als onderdeel van `node build.js`, ná vertalen en ná rewriteHead, zodat
 * elke taal haar eigen titels, beschrijvingen en URL's meekrijgt. Niets hiervan
 * wordt met de hand onderhouden: de gegevens komen uit de pagina zelf en uit
 * i18n/routes.json, dus een nieuwe case of een herschreven zin komt vanzelf in
 * de structured data, de sitemap en llms.txt terecht.
 *
 * Wat het toevoegt:
 *   - JSON-LD (schema.org) per paginatype, tussen <!-- seo:start --> en <!-- seo:end -->
 *   - og:url, og:image en twitter-kaarten waar die nog ontbraken
 *   - sitemap.xml met hreflang-alternatieven per URL
 *   - llms.txt: dezelfde structuur als platte tekst, voor taalmodellen
 *
 * De markers laten toe om bij elke build eerst weg te gooien wat er stond. Een
 * tweede build geeft dus exact hetzelfde bestand als de eerste.
 */

'use strict';

const MARK_START = '<!-- seo:start -->';
const MARK_END = '<!-- seo:end -->';

// De merkafbeelding voor sociale kaarten en het logo voor de structured data.
// Allebei PNG: Facebook, LinkedIn en Google doen niets met een SVG. Namen en
// maten komen uit og.js, dat ze ook maakt, zodat een nieuwe versie hier niet
// vergeten kan worden.
const { IMAGES } = require('./og.js');
const OG_IMAGE = IMAGES.card;
const LOGO = IMAGES.logo;

/* ------------------------------------------------------------------ */
/* Kleine HTML-helpers                                                  */
/* ------------------------------------------------------------------ */

const NAMED = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  rsquo: '’', lsquo: '‘', ldquo: '“', rdquo: '”',
  eacute: 'é', egrave: 'è', agrave: 'à', ccedil: 'ç',
  uuml: 'ü', ouml: 'ö', auml: 'ä', iuml: 'ï', euml: 'ë',
  euro: '€', hellip: '…', mdash: '—', ndash: '–',
  laquo: '«', raquo: '»', deg: '°', times: '×'
};

/** Entiteiten terug naar tekens: JSON-LD wil leesbare tekst, geen HTML. */
function decode(s) {
  return String(s)
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&([a-z]+);/gi, (m, n) => (n.toLowerCase() in NAMED ? NAMED[n.toLowerCase()] : m));
}

/** Tags eruit, witruimte plat. Bedoeld voor korte stukken lopende tekst. */
function text(html) {
  return decode(String(html).replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();
}

/** De inhoud van het eerste element dat op `re` matcht, of ''. */
function first(html, re) {
  const m = html.match(re);
  return m ? text(m[1]) : '';
}

/** Alle matches van een globale regex, groep 1, als tekst. */
function all(html, re) {
  const out = [];
  let m;
  while ((m = re.exec(html)) !== null) out.push(text(m[1]));
  return out;
}

/* ------------------------------------------------------------------ */
/* Uit de pagina lezen                                                  */
/* ------------------------------------------------------------------ */

function pageTitle(html) {
  return first(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
}

function pageDescription(html) {
  const m = html.match(/<meta\s+name="description"[\s\S]*?content="([^"]*)"/i);
  return m ? text(m[1]) : '';
}

function pageHeading(html) {
  return first(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i);
}

/**
 * De <dl class="case-meta"> van een case-pagina als gewoon object. De labels
 * verschillen per taal, dus de sleutel is de volgorde: klant, jaar, diensten,
 * online, code — zo staat het in elke case.
 */
function caseMeta(html) {
  const block = html.match(/<dl class="case-meta[\s\S]*?<\/dl>/i);
  if (!block) return {};
  const rows = [];
  const re = /<dt[^>]*>([\s\S]*?)<\/dt>\s*<dd[^>]*>([\s\S]*?)<\/dd>/gi;
  let m;
  while ((m = re.exec(block[0])) !== null) {
    const href = m[2].match(/href="(https?:\/\/[^"]+)"/i);
    rows.push({ label: text(m[1]), value: text(m[2]), href: href ? href[1] : null });
  }
  const order = ['client', 'year', 'services', 'online', 'code'];
  const out = {};
  rows.forEach((row, i) => { if (order[i]) out[order[i]] = row; });
  return out;
}

/** Het beeld bovenaan een case: de poster van de reel, of de cover-afbeelding. */
function caseImage(html) {
  const fig = html.match(/<figure class="case-cover[\s\S]*?<\/figure>/i);
  if (!fig) return null;
  const poster = fig[0].match(/poster="([^"]+)"/i);
  const img = fig[0].match(/<img[^>]*\ssrc="([^"]+)"/i);
  const src = poster ? poster[1] : img ? img[1] : null;
  return src ? src.replace(/^\.\.\//, '').replace(/^\.\//, '') : null;
}

/**
 * De diensten van /diensten: de naam op de tegel plus de ene zin eronder. De
 * naam staat bewust als <h2> in de match: het schema onder de tegels herhaalt
 * dezelfde naam in een <span>, en die mag niet als tweede dienst meetellen.
 */
function services(html) {
  const out = [];
  const re = /<h2 class="case-tile__name"[^>]*>([\s\S]*?)<\/h2>[\s\S]*?<p class="svc-tile__desc"[^>]*>([\s\S]*?)<\/p>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    out.push({ name: text(m[1]), description: text(m[2]) });
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Structured data                                                      */
/* ------------------------------------------------------------------ */

/** Welke case-pagina's er zijn, in de volgorde van routes.json. */
function caseFiles(routes) {
  return Object.keys(routes.pages).filter((f) => f.startsWith('work/'));
}

function abs(routes, pathOrSlug) {
  if (/^https?:/i.test(pathOrSlug)) return pathOrSlug;
  return routes.site + (pathOrSlug.startsWith('/') ? pathOrSlug : '/' + pathOrSlug);
}

function slugFor(routes, file, lang) {
  const page = routes.pages[file];
  if (!page) return null;
  if (!page.done.includes(lang) && lang !== routes.default) return null;
  return page.slug[lang] || null;
}

/**
 * De twee knopen die op elke pagina hetzelfde zijn: wie we zijn en welke site
 * dit is. Ze krijgen een vast @id zodat elke andere knoop ernaar kan verwijzen
 * in plaats van het te herhalen.
 */
function orgNode(routes, lang, ctx) {
  const node = {
    '@type': 'Organization',
    '@id': routes.site + '/#org',
    name: '2X8',
    url: routes.site + '/',
    email: 'hello@2x8.be',
    logo: {
      '@type': 'ImageObject',
      url: abs(routes, LOGO.src),
      width: LOGO.width,
      height: LOGO.height
    },
    image: abs(routes, OG_IMAGE.src),
    founder: [
      { '@type': 'Person', name: 'Florian Bracke', jobTitle: ctx.roles.florian },
      { '@type': 'Person', name: 'Jasper Impens', jobTitle: ctx.roles.jasper }
    ],
    numberOfEmployees: { '@type': 'QuantitativeValue', value: 2 },
    areaServed: { '@type': 'Country', name: 'BE' },
    knowsLanguage: ['nl-BE', 'fr-BE', 'en'],
    knowsAbout: ctx.knowsAbout,
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'sales',
      email: 'hello@2x8.be',
      availableLanguage: ['Dutch', 'French', 'English'],
      url: abs(routes, slugFor(routes, 'contact.html', lang) || '/contact')
    }
  };
  if (ctx.slogan) node.slogan = ctx.slogan;
  if (ctx.sameAs && ctx.sameAs.length) node.sameAs = ctx.sameAs;
  return node;
}

function siteNode(routes, lang) {
  return {
    '@type': 'WebSite',
    '@id': routes.site + '/#website',
    url: abs(routes, slugFor(routes, 'index.html', lang) || '/'),
    name: '2X8',
    publisher: { '@id': routes.site + '/#org' },
    inLanguage: routes.languages[lang].htmlLang
  };
}

/** Home > Werk > Specter. De namen komen uit de <h1> van de pagina's zelf. */
function breadcrumb(routes, lang, file, ctx, url, name) {
  const items = [{ name: ctx.labels.home, item: abs(routes, slugFor(routes, 'index.html', lang) || '/') }];
  if (file.startsWith('work/')) {
    const werk = slugFor(routes, 'werk.html', lang);
    if (werk) items.push({ name: ctx.labels.work, item: abs(routes, werk) });
  }
  if (file !== 'index.html') items.push({ name, item: url });
  if (items.length < 2) return null;
  return {
    '@type': 'BreadcrumbList',
    '@id': url + '#breadcrumb',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem', position: i + 1, name: it.name, item: it.item
    }))
  };
}

/**
 * Bouwt de hele @graph voor één pagina in één taal. `ctx` draagt wat niet in de
 * pagina zelf staat (labels, de lijst met cases) en wordt door build.js gevuld.
 */
function graphFor(html, routes, lang, file, ctx) {
  const slug = slugFor(routes, file, lang) || routes.pages[file].slug[routes.default];
  const url = abs(routes, slug);
  const title = pageTitle(html);
  const description = pageDescription(html);
  const heading = pageHeading(html) || title;
  const inLanguage = routes.languages[lang].htmlLang;

  let pageType = 'WebPage';
  if (file === 'werk.html' || file === 'diensten.html') pageType = 'CollectionPage';
  else if (file === 'studio.html') pageType = 'AboutPage';
  else if (file === 'contact.html') pageType = 'ContactPage';
  else if (file.startsWith('work/')) pageType = 'ItemPage';

  const page = {
    '@type': pageType,
    '@id': url + '#page',
    url,
    name: title,
    description,
    isPartOf: { '@id': routes.site + '/#website' },
    about: { '@id': routes.site + '/#org' },
    inLanguage
  };

  const graph = [orgNode(routes, lang, ctx), siteNode(routes, lang), page];
  const crumb = breadcrumb(routes, lang, file, ctx, url, heading);
  if (crumb) {
    graph.push(crumb);
    page.breadcrumb = { '@id': crumb['@id'] };
  }

  /* --- per paginatype iets concreets erbij ------------------------- */

  if (file === 'diensten.html') {
    const list = services(html);
    if (list.length) {
      graph.push({
        '@type': 'ItemList',
        '@id': url + '#services',
        name: heading,
        numberOfItems: list.length,
        itemListElement: list.map((s, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          item: {
            '@type': 'Service',
            name: s.name,
            description: s.description,
            serviceType: s.name,
            provider: { '@id': routes.site + '/#org' },
            areaServed: { '@type': 'Country', name: 'BE' },
            url
          }
        }))
      });
    }
  }

  if (file === 'werk.html') {
    const cases = ctx.cases
      .filter((c) => c.slug[lang])
      .map((c, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: abs(routes, c.slug[lang]),
        name: c.name
      }));
    if (cases.length) {
      graph.push({
        '@type': 'ItemList',
        '@id': url + '#cases',
        name: heading,
        numberOfItems: cases.length,
        itemListElement: cases
      });
    }
  }

  if (file === 'studio.html') {
    graph.push(
      { '@type': 'Person', '@id': routes.site + '/#florian', name: 'Florian Bracke',
        jobTitle: ctx.roles.florian, worksFor: { '@id': routes.site + '/#org' }, url },
      { '@type': 'Person', '@id': routes.site + '/#jasper', name: 'Jasper Impens',
        jobTitle: ctx.roles.jasper, worksFor: { '@id': routes.site + '/#org' }, url }
    );
  }

  if (file === 'contact.html') {
    page.mainEntity = { '@id': routes.site + '/#org' };
  }

  if (file === 'cms.html') {
    graph.push({
      '@type': 'ItemList',
      '@id': url + '#cms',
      name: heading,
      itemListElement: ['WordPress', 'Shopify', 'Wix'].map((n, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: { '@type': 'SoftwareApplication', name: n, applicationCategory: 'Content management system' }
      }))
    });
  }

  if (file.startsWith('work/')) {
    const meta = caseMeta(html);
    const img = caseImage(html);
    const summary = first(html, /<p class="case-head__summary"[^>]*>([\s\S]*?)<\/p>/i) || description;
    const work = {
      '@type': 'CreativeWork',
      '@id': url + '#work',
      name: heading,
      headline: heading,
      description: summary,
      url,
      inLanguage,
      creator: { '@id': routes.site + '/#org' },
      isPartOf: { '@id': routes.site + '/#website' }
    };
    if (img) work.image = abs(routes, img);
    if (meta.client && meta.client.value) {
      work.about = { '@type': 'Organization', name: meta.client.value };
    }
    if (meta.year && /^\d{4}$/.test(meta.year.value)) work.dateCreated = meta.year.value;
    if (meta.services && meta.services.value) {
      work.keywords = meta.services.value.split(/\s*[,/]\s*/).filter(Boolean);
    }
    if (meta.online && meta.online.href) {
      work.workExample = { '@type': 'WebSite', url: meta.online.href };
    }
    // De uitdaging/aanpak/resultaat-blokken zijn de eigenlijke inhoud.
    const blocks = all(html, /<section class="case-block[^"]*"[^>]*>[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/gi);
    if (blocks.length) work.text = blocks.join('\n\n');
    graph.push(work);
    page.mainEntity = { '@id': work['@id'] };
    if (img) page.primaryImageOfPage = { '@type': 'ImageObject', url: abs(routes, img) };
  }

  return { '@context': 'https://schema.org', '@graph': graph };
}

/* ------------------------------------------------------------------ */
/* Injecteren                                                           */
/* ------------------------------------------------------------------ */

/** Gooit weg wat een vorige build schreef, zodat bouwen idempotent blijft. */
function strip(html) {
  return html.replace(
    new RegExp('\\n?[ \\t]*' + MARK_START + '[\\s\\S]*?' + MARK_END, 'g'),
    ''
  );
}

/**
 * Zet de sociale meta en de JSON-LD in de <head>. Alles wat hier bijkomt staat
 * tussen de markers, dus het hoort niet in de bronbestanden thuis en verdwijnt
 * vanzelf bij de volgende build.
 */
function augment(html, routes, lang, file, ctx) {
  html = strip(html);

  const slug = slugFor(routes, file, lang) || routes.pages[file].slug[routes.default];
  const url = abs(routes, slug);
  const lines = [];

  // og:url staat al in de meeste pagina's; de case-pagina's misten hem.
  if (!/property="og:url"/i.test(html)) {
    lines.push('<meta property="og:url" content="' + url + '" />');
  }

  // Een case toont haar eigen cover; elke andere pagina de merkafbeelding. Van
  // die laatste kennen we de maten, van een cover niet, dus die geven we ook
  // niet op: een verkeerde maat is erger dan geen maat.
  const cover = file.startsWith('work/') ? caseImage(html) : null;
  const img = cover || OG_IMAGE.src;
  if (!/property="og:image"/i.test(html)) {
    lines.push('<meta property="og:image" content="' + abs(routes, img) + '" />');
    if (!cover) {
      lines.push('<meta property="og:image:width" content="' + OG_IMAGE.width + '" />');
      lines.push('<meta property="og:image:height" content="' + OG_IMAGE.height + '" />');
    }
  }
  if (!/name="twitter:card"/i.test(html)) {
    lines.push('<meta name="twitter:card" content="summary_large_image" />');
    lines.push('<meta name="twitter:image" content="' + abs(routes, img) + '" />');
  }

  const graph = graphFor(html, routes, lang, file, ctx);
  // </script> in een JSON-string zou de <script> hier voortijdig sluiten.
  const json = JSON.stringify(graph, null, 2).replace(/</g, '\\u003c');
  lines.push('<script type="application/ld+json">');
  for (const line of json.split('\n')) lines.push(line);
  lines.push('</script>');

  const block = '\n    ' + MARK_START + '\n' +
    lines.map((l) => '    ' + l).join('\n') +
    '\n    ' + MARK_END;

  return html.replace(/(\n[ \t]*)<\/head>/i, block + '$1</head>');
}

/* ------------------------------------------------------------------ */
/* sitemap.xml                                                          */
/* ------------------------------------------------------------------ */

/**
 * Eén <url> per pagina per taal, elk met de hreflang-alternatieven erbij. Dat
 * is dezelfde informatie als in de <head>, maar zoekmachines die de sitemap
 * eerst lezen hoeven daardoor niet elke pagina op te halen om te weten dat er
 * drie talen zijn.
 */
function sitemapXml(routes, today) {
  const out = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
    '        xmlns:xhtml="http://www.w3.org/1999/xhtml">'
  ];

  for (const file of Object.keys(routes.pages)) {
    const alts = [];
    for (const code of Object.keys(routes.languages)) {
      const slug = slugFor(routes, file, code);
      if (slug) alts.push([routes.languages[code].htmlLang, abs(routes, slug)]);
    }
    const priority = file === 'index.html' ? '1.0'
      : /^(werk|diensten|contact|studio)\.html$/.test(file) ? '0.9'
      : file.startsWith('work/') ? '0.7'
      : '0.4';

    for (const code of Object.keys(routes.languages)) {
      const slug = slugFor(routes, file, code);
      if (!slug) continue;
      out.push('  <url>');
      out.push('    <loc>' + abs(routes, slug) + '</loc>');
      for (const [hl, href] of alts) {
        out.push('    <xhtml:link rel="alternate" hreflang="' + hl + '" href="' + href + '" />');
      }
      out.push('    <xhtml:link rel="alternate" hreflang="x-default" href="' +
        abs(routes, slugFor(routes, file, routes.default)) + '" />');
      out.push('    <lastmod>' + today + '</lastmod>');
      out.push('    <priority>' + priority + '</priority>');
      out.push('  </url>');
    }
  }

  out.push('</urlset>');
  return out.join('\n') + '\n';
}

/* ------------------------------------------------------------------ */
/* llms.txt                                                             */
/* ------------------------------------------------------------------ */

/**
 * Dezelfde site als platte tekst. Een taalmodel dat naar 2x8.be gestuurd wordt
 * hoeft hiermee geen tien pagina's met animatie en accordeons te ontleden om te
 * weten wat we doen, wie we zijn en wat we gebouwd hebben.
 */
function llmsTxt(routes, pages, ctx) {
  const L = [];
  const home = pages['index.html'];

  L.push('# 2X8');
  L.push('');
  if (home && home.description) {
    L.push('> ' + home.description);
    L.push('');
  }
  L.push('2X8 is een tweekoppige digitale studio uit België: Florian Bracke (' +
    ctx.roles.florian.toLowerCase() + ') en Jasper Impens (' + ctx.roles.jasper.toLowerCase() +
    '). We ontwerpen en bouwen websites, webshops en apps, en we adviseren over ' +
    'softwarepakketten en AI-workflows. Je werkt rechtstreeks met ons, zonder ' +
    'account-manager ertussen.');
  L.push('');
  L.push('- Contact: hello@2x8.be');
  L.push('- Talen: Nederlands (' + routes.site + '/), Frans (' + routes.site +
    '/fr/), Engels (' + routes.site + '/en/)');
  L.push('- Werkgebied: België');
  L.push('');

  if (ctx.services && ctx.services.length) {
    L.push('## Diensten');
    L.push('');
    for (const s of ctx.services) L.push('- **' + s.name + '**: ' + s.description);
    L.push('');
  }

  L.push('## Pagina' + '’' + 's');
  L.push('');
  const order = ['index.html', 'werk.html', 'diensten.html', 'studio.html',
    'cms.html', 'contact.html', 'privacy.html'];
  for (const file of order) {
    const p = pages[file];
    if (!p) continue;
    L.push('- [' + p.title + '](' + p.url + '): ' + p.description);
  }
  L.push('');

  L.push('## Werk');
  L.push('');
  for (const file of caseFiles(routes)) {
    const p = pages[file];
    if (!p) continue;
    const bits = [];
    if (p.client) bits.push(p.client);
    if (p.year) bits.push(p.year);
    if (p.services) bits.push(p.services);
    L.push('- [' + p.heading + '](' + p.url + ')' +
      (bits.length ? ' — ' + bits.join(' · ') : '') +
      (p.summary ? ': ' + p.summary : ''));
  }
  L.push('');

  L.push('## Ook in het Frans en het Engels');
  L.push('');
  L.push('Elke pagina hierboven bestaat in drie talen: de Franse versie onder /fr, de');
  L.push('Engelse onder /en. Elke pagina verwijst met hreflang naar haar tegenhangers.');
  L.push('De volledige lijst met URL' + '’' + 's staat in ' + routes.site + '/sitemap.xml.');
  L.push('');

  return L.join('\n');
}

module.exports = {
  augment, strip, sitemapXml, llmsTxt,
  pageTitle, pageDescription, pageHeading, caseMeta, caseImage, services,
  text, caseFiles, abs, slugFor
};
