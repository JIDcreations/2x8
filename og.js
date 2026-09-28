#!/usr/bin/env node
/**
 * og.js — de twee rasterafbeeldingen die de site zelf niet kan leveren.
 *
 *   node og.js
 *
 * Schrijft:
 *   assets/og/2x8-og.png    1200x630, de kaart die Facebook, LinkedIn, Slack en
 *                           WhatsApp tonen bij een gedeelde link
 *   assets/og/2x8-logo.png  512x512, `Organization.logo` in de structured data
 *
 * Waarom een generator en geen bestand dat er gewoon staat: allebei komen ze uit
 * hetzelfde logo als de site (`assets/2X8_Black.svg` staat in index.html als
 * inline SVG) en uit dezelfde kleuren. Verandert het merk, dan draai je dit
 * opnieuw in plaats van in een beeldbewerker te gaan zoeken.
 *
 * Het rendert met de Chrome die op deze machine staat, headless. Dat is de enige
 * manier om aan de echte Sora en JetBrains Mono te komen zonder ze te
 * installeren: die worden door de pagina zelf bij Google Fonts opgehaald. Dus:
 * dit heeft een netwerkverbinding nodig. Staat Chrome ergens anders, zet dan
 * CHROME naar het pad.
 */

'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = __dirname;
const OUT = path.join(ROOT, 'assets', 'og');

const INK = '#0A0A0A';
const PAPER = '#FAFBFC';
const ORANGE = '#F05522';
const ASH2 = '#9C948C';

/* ------------------------------------------------------------------ */

/** De drie paden van het logo, uit index.html: één bron, geen kopie. */
function logoPaths() {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const svg = html.match(/<svg\s+class="logo"[\s\S]*?<\/svg>/);
  if (!svg) throw new Error('logo niet gevonden in index.html');
  const paths = [...svg[0].matchAll(/<path\s+d="([^"]+)"/g)].map((m) => m[1]);
  if (paths.length !== 3) throw new Error('verwachtte 3 paden, kreeg ' + paths.length);
  return paths;
}

function chrome() {
  if (process.env.CHROME) return process.env.CHROME;
  const guesses = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
  ];
  for (const g of guesses) if (fs.existsSync(g)) return g;
  throw new Error('geen Chrome gevonden — zet CHROME op het pad naar chrome.exe');
}

function shoot(html, out, width, height) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), '2x8-og-'));
  const page = path.join(tmp, 'page.html');
  fs.writeFileSync(page, html, 'utf8');
  fs.mkdirSync(path.dirname(out), { recursive: true });

  execFileSync(chrome(), [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    '--force-device-scale-factor=1',
    '--window-size=' + width + ',' + height,
    // Genoeg tijd om de fonts binnen te halen; zonder dit valt hij terug op
    // een systeemfont en ziet de kaart er anders uit dan de site.
    '--virtual-time-budget=8000',
    '--screenshot=' + out,
    'file:///' + page.replace(/\\/g, '/'),
  ], { stdio: 'ignore' });

  fs.rmSync(tmp, { recursive: true, force: true });
  const size = fs.statSync(out).size;
  console.log('  + ' + path.relative(ROOT, out).replace(/\\/g, '/') +
    ' (' + width + 'x' + height + ', ' + Math.round(size / 1024) + ' kB)');
}

/* ------------------------------------------------------------------ */

function ogCard(paths) {
  const svg = paths.map((d) => '      <path d="' + d + '"></path>').join('\n');
  return `<!doctype html>
<html lang="nl">
<head>
<meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Sora:wght@100..800&family=JetBrains+Mono:wght@500&display=block">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: 1200px; height: 630px; }
  body {
    background: ${INK};
    color: ${PAPER};
    font-family: 'Sora', system-ui, sans-serif;
    position: relative;
    overflow: hidden;
  }
  .frame { position: absolute; inset: 40px; border: 1px solid rgba(250, 251, 252, 0.14); }
  /* Dezelfde hoek als op het briefpapier: één oranje winkelhaak, verder niets. */
  .corner {
    position: absolute; left: 40px; top: 40px; width: 88px; height: 88px;
    border-top: 3px solid ${ORANGE}; border-left: 3px solid ${ORANGE};
  }
  .stage {
    position: absolute; inset: 40px;
    display: flex; flex-direction: column; justify-content: center;
    padding: 0 84px;
  }
  .logo { width: 720px; height: auto; fill: ${PAPER}; display: block; }
  .rule { width: 720px; height: 3px; background: ${ORANGE}; margin-top: 46px; }
  .foot {
    position: absolute; left: 124px; right: 124px; bottom: 84px;
    display: flex; align-items: baseline; justify-content: space-between;
    font-family: 'JetBrains Mono', monospace; font-size: 21px; letter-spacing: 0.16em;
  }
  .dom { color: ${ORANGE}; }
  .who { color: ${ASH2}; }
</style>
</head>
<body>
  <div class="frame"></div>
  <div class="corner"></div>
  <div class="stage">
    <svg class="logo" viewBox="159 334 1602 412" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="2X8">
${svg}
    </svg>
    <div class="rule"></div>
  </div>
  <div class="foot">
    <span class="dom">2X8.BE</span>
    <span class="who">FLORIAN &amp; JASPER</span>
  </div>
</body>
</html>
`;
}

function logoSquare(paths) {
  const svg = paths.map((d) => '    <path d="' + d + '"></path>').join('\n');
  return `<!doctype html>
<html lang="nl">
<head><meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: 512px; height: 512px; }
  body { background: ${PAPER}; display: flex; align-items: center; justify-content: center; }
  svg { width: 404px; height: auto; fill: ${INK}; }
</style></head>
<body>
  <svg viewBox="159 334 1602 412" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="2X8">
${svg}
  </svg>
</body></html>
`;
}

/* ------------------------------------------------------------------ */

function main() {
  const paths = logoPaths();
  shoot(ogCard(paths), path.join(OUT, '2x8-og.png'), 1200, 630);
  shoot(logoSquare(paths), path.join(OUT, '2x8-logo.png'), 512, 512);
  console.log('\nKlaar. seo.js zet ze in og:image en Organization.logo.');
}

main();
