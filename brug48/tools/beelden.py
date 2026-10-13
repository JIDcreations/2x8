"""Zet de bronbeelden om naar wat de site serveert (WebP + AVIF).

- Portretten: vierkant en in kleur; de site toont ze zwart-wit en in kleur bij hover (CSS).
- Headerfoto: drie breedtes, kleur ongewijzigd, plus de Open Graph-afbeelding (1200x630).

Gebruik (vanuit brug48/):  python tools/beelden.py
Bronnen: assets/img/bron/ (zoals gedownload van brug48.be, zie data/therapeuten.json voor de URL's).
"""
from pathlib import Path
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
BRON = ROOT / "assets/img/bron"
UIT = ROOT / "assets/img"


def bewaar(im, pad):
    pad.parent.mkdir(parents=True, exist_ok=True)
    im.save(pad.with_suffix(".webp"), quality=80, method=6)
    im.save(pad.with_suffix(".avif"), quality=60)


def main():
    for f in sorted((BRON / "therapeuten").iterdir()):
        im = Image.open(f).convert("RGB")
        if f.stem == "uus-knops":  # rond uitgesneden met zwarte hoeken: neem het vierkant binnen de cirkel
            s = im.size[0]
            m = int(s * 0.15)
            im = im.crop((m, m, s - m, s - m))
        zijde = min(min(im.size), 480)
        bewaar(ImageOps.fit(im, (zijde, zijde), centering=(0.5, 0.4)), UIT / "therapeuten" / f.stem)
        print(f.stem, zijde)

    hdr = Image.open(BRON / "6806649.jpg").convert("RGB")
    for w in (640, 1200, 1754):
        bewaar(hdr.resize((w, round(hdr.height * w / hdr.width)), Image.LANCZOS), UIT / f"gentbruggebrug-{w}")
    ImageOps.fit(hdr, (1200, 630), centering=(0.5, 0.55)).save(UIT / "og-brug48.jpg", quality=82, optimize=True, progressive=True)
    print("headerfoto", hdr.size, "+ og-brug48.jpg")


if __name__ == "__main__":
    main()
