# 2X8 Portfolio

Plain HTML, CSS and JS. Double-click `index.html` to open it, or drag this folder onto Netlify.

## Files
- `index.html`: homepage (NL)
- `work/*.html`: case pages (Specter, Studio Klei, Keikoku Atelier, Jasper Impens)
- `css/styles.css`: all styling (colors, type, layout)
- `js/main.js`: all animation (preloader, text reveals, proof panels, spotlight reveals, marquee, nav, mobile menu)
- `assets/`: real project cover images and screen-recording videos, one folder per project
- `info/`: brand guide (standalone, not linked from the pages)

The previous version of the site isn't in the working tree anymore, but it's still in git history —
`git log` shows it, and any file from it can be recovered with `git show <commit>:<path>`.

GSAP, Lenis and the fonts (Sora, JetBrains Mono) load from a CDN, so you need an internet connection.

## Assets
Each case under `assets/<Project>/` has a `Cover_*.png` (used as the poster/thumbnail everywhere that
project appears) and, where recorded, a `*-web.mp4` — a compressed, silent, web-ready version of the raw
screen recording. Raw `.mov` originals stay in the folder for reference but are git-ignored (several are
well over 100MB, past GitHub's hard limit) and aren't referenced by any page.

## Still open
- Portraits and roles for Florian & Jasper (Studio section still uses placeholder photos)
- LinkedIn / Instagram links (still placeholders)
- Studio Klei doesn't have a screen-recording video yet — add `assets/StudioKlei/*-web.mp4` and wire it
  into `work/studio-klei.html` the same way the other three case pages do (`<section class="case-reel">`)
