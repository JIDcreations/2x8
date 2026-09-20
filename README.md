# 2X8 Portfolio

Plain HTML, CSS and JS. Double-click `index.html` to open it, or drag this folder onto Netlify.

## Files
- `index.html`: homepage (NL) — hero, a one-line-per-project work index, condensed
  service/studio teasers, and a contact CTA. Full depth lives on its own page (see below); the homepage
  never repeats a case's cover image more than once.
- `werk.html`, `diensten.html`, `studio.html`, `contact.html`: the full version of each of those
  sections. Same nav on every page, with the current page highlighted (`aria-current="page"`).
- `work/*.html`: case pages (Specter, Studio Klei, Keikoku Atelier, Jasper Impens)
- `build.js`: generates the French and English pages from the Dutch sources (see "Languages")
- `i18n/`: `routes.json` (URLs per language) and `fr.json` / `en.json` (the translations)
- `fr/`, `en/`: generated — never edit these by hand, `node build.js` overwrites them
- `mail.php`: the contact form endpoint (see "Contact form")
- `css/styles.css`: all styling (colors, type, layout)
- `js/main.js`: all animation (preloader, text reveals, proof panels, spotlight reveals, marquee, nav, mobile menu)
- `assets/`: real project cover images and screen-recording videos, one folder per project; `assets/Studio/`
  holds founder portraits
- `info/`: brand guide (standalone, not linked from the pages)
- `backup/`: frozen copy of the site as it stood on 2026-09-20, served at `/backup/`. Kept out of
  search results by `robots.txt` (`Disallow: /backup/`), a `noindex, nofollow` meta tag on every page
  in it, and an `X-Robots-Tag` header via `_headers` (Netlify). Its HTML/CSS/JS are its own copies;
  it shares `assets/` with the live site through absolute `/assets/...` paths. Don't edit it.

The work grid on the homepage widens the tile you hover and narrows its row neighbour
(`.cases__grid` is a wrapping flex row, not a grid, so flex-grow can animate per row).

## Languages
The Dutch pages in the root are the source: they hold both the markup and the Dutch copy.
There is deliberately no `i18n/nl.json` — keeping Dutch in two places guarantees drift.

Mark translatable content in the Dutch HTML:

- `data-i18n="key"` — replace this element's text
- `data-i18n-html="key"` — same, but the translation may contain markup (`<br>`, `&amp;`)
- `data-i18n-attr="alt:key,aria-label:key"` — replace attributes

Then run:

```
node build.js          # writes /fr and /en, and refreshes the switcher + hreflang in the Dutch pages
node build.js --keys   # every key with its Dutch text — paste this as the basis for a new language
node build.js --check  # which keys are still missing or have gone stale
```

`i18n/routes.json` holds the URL per page per language, plus `done`: the languages that page is
finished in. Only those get generated. **Every page is now done in nl, fr and en** — 202 keys, 22
generated pages. A page that isn't translated yet keeps its links pointing at the Dutch version (so
nothing dead-ends), gets no false `hreflang` claims, and the language switcher falls back to that
language's home page with a tooltip saying so.

**To add a page:** mark its text in the Dutch HTML, run `node build.js --keys`, copy the new keys
into `i18n/fr.json` and `i18n/en.json`, add it to `routes.json` with `done: ["nl", "fr", "en"]`, and
run `node build.js` again. `--check` lists what's still missing.

**Watch out for a slug that is also a folder.** The work overview lives at `/fr/projets/` and
`/en/work/` — with a trailing slash — because the case pages sit in that same folder. Without the
slash the build would write `fr/projets.html` next to a `fr/projets/` directory, and the `.htaccess`
rule that serves extensionless URLs skips any path that is a real directory, so that page would
never be served. Dutch avoids this by accident: the overview is `/werk` and the cases live in
`/work/`.

The generated pages use root-absolute asset paths (`/css/…`, `/assets/…`); they have to, because
`/fr/` sits a directory deeper than the Dutch pages. The build rewrites those paths itself.

## Contact form
The form sits at the top of `/contact` on a white page — that page deliberately carries almost no
copy beyond the form itself. `/contact` posts to `mail.php`, which sends two mails: the request to
`hello@2x8.be` (with the
visitor as `Reply-To`) and a styled confirmation to the visitor.

Sending goes through the **Brevo API**, with the server's own mail server as a fallback: if Brevo
refuses for any reason, the message still goes out rather than being lost, and the reason is appended
to `~/2x8-mail.log` on the server. The API key lives in `~/2x8-mail-config.php` — one level above
`domains/`, so the web server cannot serve it and git never sees it. See `mail-config.example.php`
for its shape. Without that file everything keeps working through `mail()`.

`2x8.be` is verified and DKIM-authenticated in Brevo, so mail from `hello@2x8.be` is signed by the
domain itself. Delivery can be checked per message in the Brevo dashboard, or via
`GET /v3/smtp/statistics/events`.

Spam is caught by a hidden `website` field and by how long the visitor took to fill the form in —
the browser measures the elapsed milliseconds, not a timestamp, so a visitor's clock can't matter.
Both checks return a normal "sent" so a bot learns nothing. The form works without JavaScript too:
then it posts normally and `mail.php` redirects back to `/contact?verzonden=1`.

## Studio page
Florian and Jasper get the exact same card: same media box size, same baseline, no offset — that's
structural (`.founder`, `.founder__media`), not a styling accident. Florian has no photo yet, so he
gets a branded placeholder (`.founder__media--placeholder`, a big "F" on a grid pattern) instead of a
mismatched stock photo. To swap it for a real photo, replace the placeholder `<div>` in `studio.html`
with an `<img>` the same way Jasper's card already does (see `assets/Studio/jasper.jpeg`).

Each founder also has a "byte" of 8 hoverable skill tags (`.founder__byte` / `.founder__bit`) — a
literal nod to the "2 mensen, 8 bits" name. The skill labels are illustrative placeholder copy; edit
them in `studio.html` to match reality.

The previous version of the site isn't in the working tree anymore, but it's still in git history.
`git log` shows it, and any file from it can be recovered with `git show <commit>:<path>`.

A decorative X anywhere on the site is the x glyph from the logo as inline SVG (`.studio-x`,
`.founders-x`), never the `&times;` character. It scales on width, not font-size.

The tool marquee runs at a fixed, slow pace (80s a lap, `data-marquee-duration` to override) and is
no longer tied to scroll speed. Hovering it glides it to a stop so you can read the names; a touch
pointer is ignored, otherwise a tap would leave the band standing still.

GSAP, Lenis and the fonts (Sora, JetBrains Mono) load from a CDN, so you need an internet connection.

## Assets
Each case under `assets/<Project>/` has a `Cover_*.png` (used as the poster/thumbnail everywhere that
project appears) and, where recorded, a `*-web.mp4`: a compressed, silent, web-ready version of the raw
screen recording. Raw `.mov` originals stay in the folder for reference but are git-ignored (several are
well over 100MB, past GitHub's hard limit) and aren't referenced by any page.

Where a project has a video, it plays directly in the `<figure class="case-cover" data-cover">` slot at
the top of its case page (swap the `<img>` for a `<video autoplay muted loop playsinline>`, and add the
`case-cover--video` class so the frame matches the recording's own aspect ratio instead of cropping it).

## Still open
- A real photo for Florian (see "Studio page" above)
- LinkedIn / Instagram links (still placeholders)
- Studio Klei doesn't have a screen-recording video yet
- The skill labels in each founder's "byte" on the Studio page are placeholder copy, not confirmed facts
