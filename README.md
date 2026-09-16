# 2X8 Portfolio

Plain HTML, CSS and JS. Double-click `index.html` to open it, or drag this folder onto Netlify.

## Files
- `index.html`: homepage (NL) — hero, proof strip, a one-line-per-project work index, condensed
  service/studio teasers, and a contact CTA. Full depth lives on its own page (see below); the homepage
  never repeats a case's cover image more than once.
- `werk.html`, `diensten.html`, `studio.html`, `contact.html`: the full version of each of those
  sections. Same nav on every page, with the current page highlighted (`aria-current="page"`).
- `work/*.html`: case pages (Specter, Studio Klei, Keikoku Atelier, Jasper Impens)
- `css/styles.css`: all styling (colors, type, layout)
- `js/main.js`: all animation (preloader, text reveals, proof panels, spotlight reveals, marquee, nav, mobile menu)
- `assets/`: real project cover images and screen-recording videos, one folder per project; `assets/Studio/`
  holds founder portraits
- `info/`: brand guide (standalone, not linked from the pages)

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
