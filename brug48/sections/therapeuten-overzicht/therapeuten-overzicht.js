// Filter zonder herladen: kaarten, aantallen, actieve filters, lege toestand en URL volgen de keuze.
// Zonder JavaScript doet het formulier hetzelfde via de server (zie therapeuten-overzicht.php).
(() => {
  const form = document.querySelector('[data-filter]');
  if (!form) return;

  const kaarten = [...document.querySelectorAll('.kaart')];
  const pillen = [...document.querySelectorAll('.pil')];
  const radios = [...form.querySelectorAll('input[type="radio"]')];
  const teller = document.querySelector('.teller');
  const eenheid = document.querySelector('[data-eenheid]');
  const actief = document.querySelector('[data-actief]');
  const leeg = document.querySelector('[data-leeg]');
  const opties = document.querySelector('[data-opties]');
  const label = Object.fromEntries(radios.filter((r) => r.value).map((r) => [`${r.name}:${r.value}`, r.dataset.label]));
  const stil = matchMedia('(prefers-reduced-motion: reduce)');

  const set = (k, veld) => k.dataset[veld].split(' ');
  const past = (k, f) =>
    (!f.thema || set(k, 'themas').includes(f.thema)) && (!f.doelgroep || set(k, 'doelgroepen').includes(f.doelgroep));
  const aantal = (f) => kaarten.filter((k) => past(k, f)).length;
  const staat = () => {
    const d = new FormData(form);
    return { thema: d.get('thema') || '', doelgroep: d.get('doelgroep') || '' };
  };
  const adres = (f) => {
    const q = new URLSearchParams(Object.entries(f).filter(([, v]) => v)).toString();
    return form.action + (q ? `?${q}` : '');
  };
  const link = (href, tekst) => Object.assign(document.createElement('a'), { href, textContent: tekst });

  function teken(f) {
    let n = 0;
    for (const k of kaarten) {
      k.hidden = !past(k, f);
      if (!k.hidden) n++;
    }
    // De pill van de gekozen keuze licht op bij elke therapeut.
    for (const p of pillen) {
      p.classList.toggle('is-gekozen', p.dataset.thema ? p.dataset.thema === f.thema : p.dataset.doelgroep === f.doelgroep);
    }
    for (const r of radios) {
      const c = aantal({ ...f, [r.name]: r.value });
      r.closest('label').querySelector('[data-aantal]').textContent = c;
      r.closest('label').classList.toggle('is-leeg', c === 0);
    }
    teller.textContent = n;
    eenheid.textContent = n === 1 ? 'therapeut' : 'therapeuten';

    actief.replaceChildren(
      ...['thema', 'doelgroep'].filter((naam) => f[naam]).map((naam) => {
        const a = link(adres({ ...f, [naam]: '' }), label[`${naam}:${f[naam]}`]);
        a.className = 'wis';
        a.insertAdjacentHTML('afterbegin', '<span class="onzichtbaar">Filter weghalen: </span>');
        a.insertAdjacentHTML('beforeend', '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8"/></svg>');
        const li = document.createElement('li');
        li.append(a);
        return li;
      }),
    );

    leeg.hidden = n > 0;
    opties.replaceChildren(
      ...(n > 0 ? [] : ['thema', 'doelgroep'].map((naam) => {
        const los = { ...f, [naam === 'thema' ? 'doelgroep' : 'thema']: '' };
        const li = document.createElement('li');
        li.append(link(adres(los), `Alle therapeuten voor ${label[`${naam}:${f[naam]}`]} (${aantal(los)})`));
        return li;
      })),
    );

    history.replaceState(null, '', adres(f));
  }

  const toon = (f) => {
    if (!document.startViewTransition || stil.matches) return teken(f);
    const html = document.documentElement;
    html.classList.add('filteren');
    document.startViewTransition(() => teken(f)).finished.finally(() => html.classList.remove('filteren'));
  };

  form.addEventListener('change', () => toon(staat()));

  // Links in de actieve filters en de lege toestand: zelfde keuze, zonder herladen.
  document.querySelector('.overzicht').addEventListener('click', (e) => {
    const a = e.target.closest('[data-actief] a, [data-opties] a');
    if (!a || e.metaKey || e.ctrlKey) return;
    e.preventDefault();
    const q = new URL(a.href).searchParams;
    for (const r of radios) r.checked = r.value === (q.get(r.name) || '');
    toon(staat());
  });
})();
