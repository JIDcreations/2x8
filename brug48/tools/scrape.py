"""Haalt de therapeutendata van brug48.be (Weebly) binnen en schrijft data/therapeuten.json.

Teksten blijven letterlijk: de volledige pagina-inhoud gaat als blokken (kop/alinea/lijst) in
`inhoud`, de velden erboven zijn er enkel uit gehaald. De mapping naar vaste thema's en
doelgroepen staat hieronder en is handwerk; elk item wordt gecontroleerd tegen de paginatekst.

Gebruik (vanuit brug48/):  python tools/scrape.py
"""
import html, json, re, sys, urllib.request
from html.parser import HTMLParser
from pathlib import Path

BRON = "https://www.brug48.be"
ROOT = Path(__file__).resolve().parent.parent
UA = {"User-Agent": "Mozilla/5.0"}

# Volgorde en namen zoals in het menu van de huidige site (Michaël zoals op zijn eigen pagina).
THERAPEUTEN = [
    ("katrien-boone", "Katrien Boone"), ("michael-callaert", "Michaël Callaert"),
    ("katja-desauw", "Katja Desauw"), ("pieter-govaerts", "Pieter Govaerts"),
    ("ilse-heylen", "Ilse Heylen"), ("sarah-jocque", "Sarah Jocqué"),
    ("uus-knops", "Uus Knops"), ("kristien-lemaitre", "Kristien Lemaitre"),
    ("charlotte-ohms", "Charlotte Ohms"), ("tine-van-der-heyden", "Tine Van der Heyden"),
    ("iben-verstuyf", "Iben Verstuyf"),
]
OUDE_SLUG = {"sarah-jocque": "sarah-jocqueacute"}

THEMAS = [
    ("angst", "Angst en piekeren"),
    ("somberheid", "Somberheid en depressie"),
    ("stress-burn-out", "Stress en burn-out"),
    ("rouw-verlies", "Rouw en verlies"),
    ("trauma", "Trauma en ingrijpende ervaringen"),
    ("relatie", "Relatie en koppel"),
    ("gezin", "Gezin en opvoeding"),
    ("zelfbeeld", "Zelfbeeld en identiteit"),
    ("levensfase", "Levensfase en zingeving"),
    ("lichaam", "Lichamelijke klachten en ziekte"),
    ("adhd-autisme", "ADHD, autisme en hoogsensitiviteit"),
    ("zelfdestructief", "Zelfdestructieve gedachten"),
    ("verslaving", "Verslaving"),
    ("werk-sociaal", "Werk en sociaal leven"),
]
DOELGROEPEN = [
    ("jongvolwassenen", "Jongvolwassenen"),
    ("volwassenen", "Volwassenen"),
    ("ouderen", "Ouderen"),
    ("koppels", "Koppels"),
    ("gezinnen", "Gezinnen"),
    ("hulpverleners", "Hulpverleners (supervisie en coaching)"),
]
DOELGROEP_MAP = {
    "jongvolwassenen": ["jongvolwassenen"], "volwassenen": ["volwassenen"],
    "ouderen": ["ouderen"], "koppels": ["koppels"], "gezinnen": ["gezinnen"],
    "(jong)volwassenen": ["jongvolwassenen", "volwassenen"],
    "jongvolwassenen (vanaf 15 jaar)": ["jongvolwassenen"],
    "koppels en gezinnen": ["koppels", "gezinnen"],
}

# Per therapeut: (begin van het lijstitem of exact stuk lopende tekst, [thema- of doelgroep-id's]).
THEMA_ITEMS = {
    "katrien-boone": [
        ("Angst: faalangst", ["angst"]), ("Depressieve klachten", ["somberheid"]),
        ("Burn-out klachten", ["stress-burn-out"]), ("Levensfaseproblematiek", ["levensfase"]),
        ("Stress", ["stress-burn-out"]), ("Psychosomatische klachten", ["lichaam"]),
        ("Piekeren", ["angst"]), ("Omgaan met verlies", ["rouw-verlies"]),
        ("ADHD", ["adhd-autisme"]),
    ],
    "michael-callaert": [
        ("relatieproblemen tussen partners", ["relatie"]),
        ("psychische klachten en/of gedragsproblemen", ["angst", "werk-sociaal", "zelfdestructief"]),
        ("zelfwaardeproblematiek", ["zelfbeeld"]),
        ("energieproblemen", ["stress-burn-out"]),
        ("stemmingsgerelateerde problemen", ["somberheid"]),
        ("nieuw-samengesteld-gezin", ["gezin"]),
        ("slachtofferschap", ["trauma"]),
    ],
    "katja-desauw": [
        ("relatie- en gezinsproblemen", ["relatie", "gezin"]),
        ("terugkerende patronen in relaties", ["relatie"]),
        ("trauma en relationele kwetsuren", ["trauma"]),
        ("moeilijkheden rond verbinding", ["relatie"]),
        ("angst, schaamte, schuld", ["angst", "somberheid"]),
        ("burn-out, stress en slaapproblemen", ["stress-burn-out"]),
        ("psychosomatische klachten", ["lichaam"]),
        ("chronische pijn", ["lichaam"]),
        ("levensfase- en zingevingsvragen", ["levensfase"]),
    ],
    "pieter-govaerts": [
        ("Relatiebegeleiding", ["relatie"]), ("Communicatieproblemen", ["relatie"]),
        ("Opvoedingsvragen", ["gezin"]), ("Nieuw samengestelde gezinnen", ["gezin"]),
        ("Gezinsconflicten", ["gezin"]),
        ("Ingrijpende gebeurtenissen binnen het gezin", ["gezin", "trauma"]),
        ("Gender- en identiteitsvragen", ["zelfbeeld"]),
        ("Overgangen en veranderingen", ["levensfase"]), ("Jongvolwassenheid", ["levensfase"]),
        ("Relatievorming", ["relatie"]), ("Ouderschap", ["gezin"]),
        ("Werk- en loopbaantransities", ["werk-sociaal", "levensfase"]),
        ("Hoogbegaafdheid", ["adhd-autisme"]), ("Rouw en verlies", ["rouw-verlies"]),
        ("Scheiding", ["rouw-verlies", "relatie"]),
        ("Ingrijpende levensgebeurtenissen", ["trauma"]),
        ("Verslavingsproblematiek", ["verslaving"]),
        ("Supervisie voor hulpverleners", ["hulpverleners"]),
        ("Coaching voor zorgverleners", ["hulpverleners"]),
        ("Reflectie op professionele", ["hulpverleners"]),
    ],
    "ilse-heylen": [
        ("Rouw, verlieservaringen", ["rouw-verlies"]), ("Depressie", ["somberheid"]),
        ("Hoogsensitiviteit", ["adhd-autisme"]), ("Relatieproblemen", ["relatie"]),
        ("Angsten", ["angst"]), ("Piekeren", ["angst"]), ("Zingevingsvragen", ["levensfase"]),
        ("Burn-out en bore-out", ["stress-burn-out"]), ("Trauma", ["trauma"]),
        ("Hechting", ["relatie"]),
    ],
    "sarah-jocque": [
        ("Relationele vragen", ["relatie"]), ("Gezinsvragen", ["gezin"]),
        ("Moederschap", ["gezin"]), ("Vragen rond sociaal functioneren", ["werk-sociaal"]),
        ("Verwerking van verlieservaringen", ["rouw-verlies"]),
        ("Emotionele problemen", ["somberheid", "angst", "zelfbeeld", "stress-burn-out"]),
        ("Psycho-oncologie", ["lichaam"]),
    ],
    "uus-knops": [  # lopende tekst, geen lijst op de pagina
        ("tekst:angst- of stemmingsstoornissen, zoals depressiviteit, en zeker ook rouw",
         ["angst", "somberheid", "rouw-verlies"]),
        ("tekst:supervisie of coaching wil als hulpverlener, zorgprofessional, psycholoog, psychiater,…",
         ["hulpverleners"]),
    ],
    "kristien-lemaitre": [],  # geen thema's op de pagina
    "charlotte-ohms": [
        ("Identiteits- en levensfasevragen", ["zelfbeeld", "levensfase"]),
        ("Relationele moeilijkheden", ["relatie"]),
        ("Spanningen binnen het gezin", ["gezin"]),
        ("Gevoelens van angst, somberheid of stress", ["angst", "somberheid", "stress-burn-out"]),
        ("Verlies, rouw en ingrijpende", ["rouw-verlies", "trauma"]),
        ("tekst:supervisie aan voor professionals binnen de geestelijke gezondheidszorg en aanverwante domeinen",
         ["hulpverleners"]),
    ],
    "tine-van-der-heyden": [
        ("Relationele vragen", ["relatie"]),
        ("Emotionele problemen", ["somberheid", "angst", "zelfbeeld"]),
        ("Sociaal functioneren", ["werk-sociaal"]), ("Verlieservaringen", ["rouw-verlies"]),
        ("Zingevingsvragen", ["levensfase"]), ("Burn-out klachten", ["stress-burn-out"]),
    ],
    "iben-verstuyf": [  # één zin met puntkomma's
        ("tekst:relatiemoeilijkheden", ["relatie"]),
        ("tekst:vragen rond seksualiteit en geaardheid", ["zelfbeeld"]),
        ("tekst:levensfasemoeilijkheden", ["levensfase"]), ("tekst:angsten", ["angst"]),
        ("tekst:depressieve gevoelens", ["somberheid"]),
        ("tekst:moeilijke en traumatische ervaringen", ["trauma"]),
        ("tekst:zelfdestructieve neigingen", ["zelfdestructief"]),
        ("tekst:zelfmoordgedachten", ["zelfdestructief"]),
        ("tekst:stress en piekeren", ["stress-burn-out", "angst"]),
        ("tekst:vastgelopen gezinssituaties", ["gezin"]),
        ("tekst:verlieservaringen en rouw", ["rouw-verlies"]),
        ("tekst:identiteitsvragen…", ["zelfbeeld"]),
    ],
}

# Welke alinea de intro is (begin van de tekst). Keuze: de alinea die de therapeut het best voorstelt.
INTRO = {
    "katrien-boone": "Ik werk hoofdzakelijk", "michael-callaert": "Ik ben een analytisch",
    "katja-desauw": "Als systeemtherapeut vertrek", "pieter-govaerts": "Mensen lopen soms vast",
    "ilse-heylen": "Sinds 2003 coach", "sarah-jocque": "U kan voor therapie",
    "uus-knops": "Welkom! In 2010", "kristien-lemaitre": "Beeldvorming, hypothesevorming",
    "charlotte-ohms": "Soms kom je vast", "tine-van-der-heyden": "Sinds 2003 ben ik",
    "iben-verstuyf": "Veel zorgen en moeilijkheden",
}
# Bereikbaarheid die bij de contactgegevens hoort (letterlijk, begin van de alinea).
CONTACT_OPMERKING = {
    "pieter-govaerts": "Je kan me telefonisch bereiken",
    "kristien-lemaitre": "waar mogelijk wordt telefonisch",
}


KOPPEN = {"Contactgegevens", "Contact", "Doelgroep", "Opleiding"}


def get(url, binary=False):
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30) as r:
        data = r.read()
    return data if binary else data.decode("utf-8")


def cfemail(hexstr):
    key = int(hexstr[:2], 16)
    return "".join(chr(int(hexstr[i:i + 2], 16) ^ key) for i in range(2, len(hexstr), 2))


class Tokens(HTMLParser):
    """Zet Weebly-HTML om in een vlakke stroom: tekst (met vet/link), regelbreuk, lijst, blokeinde."""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.out, self.bold, self.href, self.skip, self.cf = [], 0, None, 0, None

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if "data-cfemail" in a:  # Cloudflare verbergt mailadressen; de "[email protected]"-tekst overslaan
            mail = cfemail(a["data-cfemail"])
            self.out.append(("text", mail, self.bold > 0, "mailto:" + mail))
            self.cf, self.skip = tag, self.skip + 1
        elif tag in ("script", "style"):
            self.skip += 1
        elif tag in ("strong", "b"):
            self.bold += 1
        elif tag == "a":
            href = a.get("href") or ""
            if "email-protection#" in href:
                href = "mailto:" + cfemail(href.split("#")[1])
            self.href = href or None
        elif tag == "br":
            self.out.append(("br",))
        elif tag == "ul":
            self.out.append(("ul",))
        elif tag == "li":
            self.out.append(("li",))

    def handle_endtag(self, tag):
        if tag == self.cf and self.skip:
            self.cf, self.skip = None, self.skip - 1
        elif tag in ("script", "style"):
            self.skip -= 1
        elif tag in ("strong", "b"):
            self.bold -= 1
        elif tag == "a":
            self.href = None
        elif tag == "ul":
            self.out.append(("/ul",))
        elif tag in ("div", "h2", "td", "p"):
            self.out.append(("end",))

    def handle_data(self, data):
        if not self.skip:
            self.out.append(("text", data, self.bold > 0, self.href))


def inline(parts):
    """[(tekst, vet, href)] -> HTML met enkel <strong> en <a>."""
    h = ""
    for t, b, href in parts:
        if href and "@" in t and not href.startswith("mailto:"):  # Ilse: href="about:blank"
            href = "mailto:" + t.strip()
        t = html.escape(t, quote=False)
        if href:
            t = f'<a href="{html.escape(href)}">{t}</a>'
        h += f"<strong>{t}</strong>" if b else t
    h = h.replace("</strong><strong>", "")
    h = re.sub(r"<strong>(\s*)</strong>", r"\1", h)
    return re.sub(r"\s+", " ", h).strip()


def plain(h):
    h = h.replace("<br>", " ")
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", "", h))).strip()


def blocks(fragment):
    """Weebly-fragment -> [{type: kop|alinea|lijst, ...}]."""
    p = Tokens()
    p.feed(fragment)
    res, lines, line, items, in_list = [], [], [], [], False

    def clean(parts):
        return [(t.replace("​", "").replace("\xa0", " "), b, h) for t, b, h in parts]

    def flush_line():
        nonlocal line
        parts = clean(line)
        if "".join(t for t, _, _ in parts).strip():
            lines.append(parts)
        elif lines:
            flush_par()
        line = []

    def flush_par():
        nonlocal lines
        if lines:
            # Kristien: "<strong>Contactgegevens</strong> waar mogelijk ..." op één regel.
            lead = lines[0][0]
            if lead[1] and lead[0].strip().rstrip(":") in KOPPEN and len(lines[0]) > 1:
                res.append({"type": "kop", "tekst": lead[0].strip()})
                lines[0] = lines[0][1:]
            # Kop = regel die volledig vet en kort is; die splitst de alinea.
            rest = []
            for l in lines:
                txt = "".join(t for t, _, _ in l).strip()
                if all(b for t, b, _ in l if t.strip()) and len(txt) <= 70:
                    if rest:
                        res.append({"type": "alinea", "html": "<br>".join(inline(x) for x in rest)})
                    res.append({"type": "kop", "tekst": txt})
                    rest = []
                else:
                    rest.append(l)
            if rest:
                res.append({"type": "alinea", "html": "<br>".join(inline(x) for x in rest)})
        lines = []

    for tok in p.out:
        kind = tok[0]
        if kind == "text":
            (items[-1] if in_list and items else line).append(tok[1:])
        elif kind == "br":
            if not in_list:
                flush_line()
        elif kind == "ul":
            flush_line(); flush_par(); in_list, items = True, []
        elif kind == "li":
            items.append([])
        elif kind == "/ul":
            lijst = [inline(clean(i)) for i in items if plain(inline(clean(i)))]
            if lijst:
                res.append({"type": "lijst", "items": lijst})
            in_list = False
        elif kind == "end" and not in_list:
            flush_line(); flush_par()
    flush_line(); flush_par()
    return res


def secties(bl):
    """Groepeer blokken per kop: {kop: [blokken]} (kop None = vóór de eerste kop)."""
    out, kop = {}, None
    for b in bl:
        if b["type"] == "kop":
            kop = b["tekst"].rstrip(":").strip()
            out.setdefault(kop, [])
        else:
            out.setdefault(kop, []).append(b)
    return out


def regels(bl):
    r = []
    for b in bl:
        for x in (b["html"].split("<br>") if b["type"] == "alinea" else b["items"]):
            x = plain(x)
            if not x or re.fullmatch(r"(https?://)?www\.\S+", x):  # losse URL-regel: staat al in links
                continue
            if r and re.search(r"(,| en)$", r[-1]):  # Tine, Iben: zin loopt door over een <br>
                r[-1] += " " + x
            else:
                r.append(x)
    return r


def scrape(slug, naam):
    oud = OUDE_SLUG.get(slug, slug)
    page = get(f"{BRON}/{oud}.html")
    banner = page[page.find('<div class="banner-wrap">'):page.find('id="wsite-content"')]
    body = page[page.find('id="wsite-content"'):page.find('<div class="footer-wrap">')]
    body = re.split(r'<div class="paragraph" style="text-align:center;">', body)[0]  # adresregel weg
    kolommen = re.split(r'<td class="wsite-multicol-col"[^>]*>', body)[1:] or [body]
    hoofd, zij = blocks(kolommen[0]), blocks("".join(kolommen[1:]))
    sect = {**secties(hoofd), **secties(zij)}
    alle = hoofd + zij
    tekst = " ".join(plain(b.get("html", "")) + " " + " ".join(plain(i) for i in b.get("items", [])) for b in alle)

    m = re.search(r'<h2[^>]*>(.*?)</h2>', banner, re.S)
    naam_op_pagina = plain(m.group(1)) if m else ""
    img = re.search(r'<img src="(/uploads/[^"?]+)', banner)
    foto = None
    if img:
        ext = Path(img.group(1)).suffix.lower().replace(".jpeg", ".jpg")
        rel = f"assets/img/bron/therapeuten/{slug}{ext}"
        (ROOT / rel).write_bytes(get(BRON + img.group(1), binary=True))
        from PIL import Image
        w, h = Image.open(ROOT / rel).size
        foto = {"bestand": rel, "bron_url": BRON + img.group(1), "breedte": w, "hoogte": h}

    def sectie(*namen):
        for k, v in sect.items():
            if k and any(k.lower().startswith(n) for n in namen):
                return v
        return []

    stop = next((k for k in sect if k and "aanmeldingsstop" in k.lower()), None)
    aanmeldingsstop = ""
    if stop:
        aanmeldingsstop = " ".join(regels(sect[stop])) or stop
    else:  # Ilse: de stop staat als vette alinea, niet als kop
        for b in alle:
            if b["type"] == "alinea" and "aanmeldingsstop" in b["html"].lower():
                aanmeldingsstop = plain(b["html"])

    opl = regels(sectie("opleiding"))
    erk_re = re.compile(r"^(erkend|lid van|lid door)\b", re.I)
    opl = [r for r in opl if not r.startswith("Naast ")]  # Sarah: lopende tekst onder Opleiding
    erkenningen = [r for r in opl if erk_re.search(r)] + regels(sectie("erkenning"))
    opleiding = [r for r in opl if not erk_re.search(r)]
    # Charlotte: lidmaatschap staat als lijstitem met "- " ervoor in de bron.
    erkenningen = [re.sub(r"^-\s*", "", r) for r in erkenningen]

    contactblokken = sectie("contact")
    ctekst = " ".join(regels(contactblokken))
    telefoons = []
    for t in re.findall(r"0\d{2,3} ?/? ?[\d. ]{5,}\d", ctekst):
        if re.sub(r"\D", "", t) not in [re.sub(r"\D", "", x) for x in telefoons]:
            telefoons.append(t.strip())
    emails = sorted(set(re.findall(r"[\w.+-]+@[\w-]+\.[\w.]+\w", tekst)))
    opmerking = []
    if slug in CONTACT_OPMERKING:
        b = next(b for b in alle if b["type"] == "alinea" and plain(b["html"]).startswith(CONTACT_OPMERKING[slug]))
        opmerking = regels([b])
    links = []
    for b in alle:
        for href, t in re.findall(r'<a href="(http[^"]+)">(.*?)</a>', b.get("html", "") + "".join(b.get("items", []))):
            if href not in [l["url"] for l in links]:
                links.append({"tekst": plain(t), "url": html.unescape(href)})

    intro = next(b["html"] for b in alle if b["type"] == "alinea" and plain(b["html"]).startswith(INTRO[slug]))

    # Thema-items: lijstitems die met het opgegeven begin starten, of exacte stukken lopende tekst.
    alle_items = [plain(i) for b in alle if b["type"] == "lijst" for i in b["items"]]
    vlak = re.sub(r"\s+", " ", tekst)
    thema_items = []
    for sleutel, ids in THEMA_ITEMS[slug]:
        if sleutel.startswith("tekst:"):
            item = sleutel[6:]
            assert item in vlak, f"{slug}: niet gevonden in tekst: {item}"
        else:
            hits = [i for i in alle_items if i.startswith(sleutel)]
            assert len(hits) == 1, f"{slug}: {sleutel!r} -> {hits}"
            item = hits[0]
        thema_items.append({"tekst": item, "ids": ids})

    doelgroep_origineel = list(dict.fromkeys(regels(sectie("doelgroep"))))  # Pieter: dubbele regel
    tid = {i for i, _ in THEMAS}
    did = {i for i, _ in DOELGROEPEN}
    for it in thema_items:
        assert set(it["ids"]) <= tid | did, it
    # Volgorde van de therapeut zelf (eerst genoemd = eerst getoond), niet die van de vaste lijst.
    themas = list(dict.fromkeys(i for it in thema_items for i in it["ids"] if i in tid))
    dg = set()
    for d in doelgroep_origineel:
        assert d.lower() in DOELGROEP_MAP, f"{slug}: onbekende doelgroep {d!r}"
        dg.update(DOELGROEP_MAP[d.lower()])
    dg.update(i for it in thema_items for i in it["ids"] if i in did)
    doelgroepen = [i for i, _ in DOELGROEPEN if i in dg]

    return {
        "slug": slug,
        "naam": naam,
        "naam_op_pagina": naam_op_pagina,
        "oude_url": f"/{oud}.html",
        "foto": foto,
        "aanmeldingsstop": aanmeldingsstop,
        "intro": intro,
        "themas": themas,
        "doelgroepen": doelgroepen,
        "themas_origineel": thema_items,
        "doelgroep_origineel": doelgroep_origineel,
        "opleiding": opleiding,
        "erkenningen": erkenningen,
        "werkmomenten": " ".join(regels(sectie("werkmoment", "werkdag"))),
        "contact": {"telefoon": telefoons, "email": emails, "opmerking": opmerking},
        "links": links,
        "inhoud": {"hoofd": hoofd, "zij": zij},
    }


def main():
    (ROOT / "assets/img/bron/therapeuten").mkdir(parents=True, exist_ok=True)
    data = {
        "bron": BRON,
        "opgehaald": __import__("datetime").date.today().isoformat(),
        "themas": [{"id": i, "label": l} for i, l in THEMAS],
        "doelgroepen": [{"id": i, "label": l} for i, l in DOELGROEPEN],
        "therapeuten": [scrape(s, n) for s, n in THERAPEUTEN],
    }
    (ROOT / "data").mkdir(exist_ok=True)
    (ROOT / "data/therapeuten.json").write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    for t in data["therapeuten"]:
        leeg = [k for k in ("foto", "aanmeldingsstop", "intro", "themas", "opleiding", "erkenningen", "werkmomenten", "links")
                if not t[k]] + [f"contact.{k}" for k in ("telefoon", "email") if not t["contact"][k]]
        print(f"{t['slug']:22} thema's {len(t['themas']):2}  doelgr {','.join(t['doelgroepen'])}  leeg: {', '.join(leeg) or '-'}")


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
