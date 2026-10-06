(function () {
  'use strict';

  var PROJECTS = window.SV_PROJECTS || [];
  var byId = {};
  PROJECTS.forEach(function (p) { byId[p.id] = p; });

  var CATS = { badkamer: 'Badkamers', verwarming: 'Verwarming', ventilatie: 'Ventilatie', wellness: 'Wellness' };

  var lb = { el: document.querySelector('[data-lightbox]'), list: [], i: 0, current: null };

  /* ---------- Marked projects (per visitor, browser only) ---------- */
  var KEY = 'sv-gemarkeerd';
  var marked = [];
  try { marked = JSON.parse(localStorage.getItem(KEY) || '[]').filter(function (id) { return byId[id]; }); } catch (e) { marked = []; }

  function save() { try { localStorage.setItem(KEY, JSON.stringify(marked)); } catch (e) { /* storage unavailable: keep in memory */ } }
  function isMarked(id) { return marked.indexOf(id) !== -1; }
  function toggleMark(id) {
    if (isMarked(id)) marked.splice(marked.indexOf(id), 1); else marked.push(id);
    save();
    syncMarks();
    document.querySelectorAll('[data-marked-pill]').forEach(function (el) {
      el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump');
    });
  }

  function syncMarks() {
    document.querySelectorAll('[data-mark-id]').forEach(function (b) {
      var on = isMarked(b.getAttribute('data-mark-id'));
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      b.querySelector('[data-mark-label]').textContent = on ? 'Gemarkeerd' : 'Dit wil ik ook';
    });
    document.querySelectorAll('[data-marked-count]').forEach(function (el) { el.textContent = marked.length; });
    document.querySelectorAll('[data-marked-pill]').forEach(function (el) { el.classList.toggle('has', marked.length > 0); });
    document.querySelectorAll('[data-marked-note]').forEach(function (el) { el.hidden = marked.length === 0; });
    if (lb.current) syncLightboxMark();
    renderPicked();
  }

  /* ---------- Project tiles ---------- */
  function svgUse(id, cls) {
    return '<svg class="icon ' + (cls || '') + '" aria-hidden="true"><use href="#' + id + '"/></svg>';
  }

  function tile(p, list, idx, cls) {
    var el = document.createElement('div');
    el.className = 'proj' + (cls ? ' ' + cls : '');
    el.style.setProperty('--ar', p.w + ' / ' + p.h);
    el.innerHTML =
      '<button class="open" type="button" aria-label="Vergroot: ' + p.alt + '">' +
        '<img src="' + p.src + '" width="' + p.w + '" height="' + p.h + '" alt="' + p.alt + '" loading="lazy" decoding="async">' +
      '</button>' +
      '<button class="mark" type="button" aria-pressed="false" data-mark-id="' + p.id + '">' +
        svgUse('i-mark', 'i-off') + svgUse('i-marked', 'i-on') + '<span data-mark-label>Dit wil ik ook</span><span class="sr-only">: ' + p.alt + '</span>' +
      '</button>';
    el.querySelector('.open').addEventListener('click', function () { openLightbox(list, idx); });
    el.querySelector('.mark').addEventListener('click', function () { toggleMark(p.id); });
    return el;
  }

  var mosaic = document.querySelector('[data-mosaic]');
  if (mosaic) {
    var ids = mosaic.getAttribute('data-ids').split(',');
    var list = ids.map(function (id) { return byId[id]; }).filter(Boolean);
    list.forEach(function (p, i) { mosaic.appendChild(tile(p, list, i, 'p' + (i + 1))); });
  }

  var gallery = document.querySelector('[data-gallery]');
  var filters = document.querySelector('[data-filters]');
  if (gallery) {
    var current = 'alles';
    var renderGallery = function () {
      var order = ['badkamer', 'wellness', 'verwarming', 'ventilatie'];
      var shown = PROJECTS.filter(function (p) { return current === 'alles' || p.cat === current; })
        .sort(function (a, b) { return order.indexOf(a.cat) - order.indexOf(b.cat); });
      gallery.textContent = '';
      shown.forEach(function (p, i) { gallery.appendChild(tile(p, shown, i)); });
      syncMarks();
    };
    if (filters) {
      var counts = { alles: PROJECTS.length };
      PROJECTS.forEach(function (p) { counts[p.cat] = (counts[p.cat] || 0) + 1; });
      var opts = [['alles', 'Alles']].concat(Object.keys(CATS).map(function (k) { return [k, CATS[k]]; }));
      opts.forEach(function (o) {
        var b = document.createElement('button');
        b.type = 'button';
        b.setAttribute('aria-pressed', o[0] === current ? 'true' : 'false');
        b.innerHTML = o[1] + ' <span class="c">' + (counts[o[0]] || 0) + '</span>';
        b.addEventListener('click', function () {
          current = o[0];
          filters.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
          renderGallery();
        });
        filters.appendChild(b);
      });
    }
    renderGallery();
  }

  /* ---------- Lightbox ---------- */
  function openLightbox(list, i) {
    if (!lb.el || typeof lb.el.showModal !== 'function') { window.open(list[i].src, '_blank'); return; }
    lb.list = list; lb.i = i;
    showSlide();
    lb.el.showModal();
  }
  function showSlide() {
    var p = lb.list[lb.i];
    lb.current = p;
    var img = lb.el.querySelector('[data-lb-img]');
    img.src = p.src; img.alt = p.alt; img.width = p.w; img.height = p.h;
    lb.el.querySelector('[data-lb-cap]').textContent = p.alt;
    lb.el.querySelector('[data-lb-count]').textContent = (lb.i + 1) + ' / ' + lb.list.length;
    var single = lb.list.length < 2;
    lb.el.querySelector('[data-lb-prev]').hidden = single;
    lb.el.querySelector('[data-lb-next]').hidden = single;
    syncLightboxMark();
  }
  function syncLightboxMark() {
    var b = lb.el.querySelector('[data-lb-mark]');
    var on = isMarked(lb.current.id);
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
    b.lastChild.textContent = on ? 'Gemarkeerd' : 'Dit wil ik ook';
  }
  function step(d) { lb.i = (lb.i + d + lb.list.length) % lb.list.length; showSlide(); }
  if (lb.el) {
    lb.el.querySelector('[data-lb-close]').addEventListener('click', function () { lb.el.close(); });
    lb.el.querySelector('[data-lb-prev]').addEventListener('click', function () { step(-1); });
    lb.el.querySelector('[data-lb-next]').addEventListener('click', function () { step(1); });
    lb.el.querySelector('[data-lb-mark]').addEventListener('click', function () { toggleMark(lb.current.id); });
    lb.el.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') step(-1);
      if (e.key === 'ArrowRight') step(1);
    });
    lb.el.addEventListener('click', function (e) { if (e.target === lb.el || e.target.classList.contains('lb-stage')) lb.el.close(); });
    lb.el.addEventListener('close', function () { lb.current = null; });
    var tx = null;
    lb.el.addEventListener('touchstart', function (e) { tx = e.touches[0].clientX; }, { passive: true });
    lb.el.addEventListener('touchend', function (e) {
      if (tx === null) return;
      var dx = e.changedTouches[0].clientX - tx;
      if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
      tx = null;
    }, { passive: true });
  }

  /* ---------- Offerte form ---------- */
  var picked = document.querySelector('[data-picked]');
  function renderPicked() {
    if (!picked) return;
    picked.textContent = '';
    if (!marked.length) {
      var p = document.createElement('p');
      p.className = 'picked-empty';
      p.innerHTML = 'Nog niets gemarkeerd. Tik op "Dit wil ik ook" bij een <a href="realisaties.html">realisatie</a> om ze mee te sturen.';
      picked.appendChild(p);
      return;
    }
    var ul = document.createElement('ul');
    ul.className = 'picked-list';
    marked.forEach(function (id) {
      var pr = byId[id];
      var li = document.createElement('li');
      li.className = 'picked-item';
      li.innerHTML = '<img src="' + pr.src + '" alt="' + pr.alt + '" loading="lazy"><button type="button" aria-label="Verwijder: ' + pr.alt + '">' + svgUse('i-x') + '</button>';
      li.querySelector('button').addEventListener('click', function () { toggleMark(id); });
      ul.appendChild(li);
    });
    picked.appendChild(ul);
  }

  var form = document.querySelector('[data-quote]');
  if (form) {
    var status = form.querySelector('[data-status]');
    var setErr = function (input, msg) {
      var err = document.getElementById(input.getAttribute('aria-describedby'));
      input.setAttribute('aria-invalid', msg ? 'true' : 'false');
      if (err) err.textContent = msg || '';
    };
    var check = function (input) {
      var v = input.value.trim();
      if (input.name === 'naam') return v ? '' : 'Vul je naam in.';
      if (input.name === 'telefoon') return v.replace(/\D/g, '').length >= 9 ? '' : 'Vul een telefoonnummer in, bv. 0470 12 34 56.';
      if (input.name === 'email') return !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? '' : 'Dit e-mailadres klopt niet. Controleer het of laat het leeg.';
      return '';
    };
    form.querySelectorAll('input[aria-describedby]').forEach(function (input) {
      input.addEventListener('blur', function () { if (input.value) setErr(input, check(input)); });
      input.addEventListener('input', function () { if (input.getAttribute('aria-invalid') === 'true') setErr(input, check(input)); });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var firstBad = null;
      form.querySelectorAll('input[aria-describedby]').forEach(function (input) {
        var msg = check(input);
        setErr(input, msg);
        if (msg && !firstBad) firstBad = input;
      });
      if (firstBad) { firstBad.focus(); return; }

      var d = new FormData(form);
      var soort = d.getAll('soort');
      var lines = [
        'Naam: ' + d.get('naam'),
        'Telefoon: ' + d.get('telefoon'),
        d.get('email') ? 'E-mail: ' + d.get('email') : null,
        d.get('gemeente') ? 'Gemeente van de werf: ' + d.get('gemeente') : null,
        soort.length ? 'Waarover: ' + soort.join(', ') : null,
        '',
        d.get('bericht') ? d.get('bericht') : null,
        marked.length ? '\nGemarkeerde realisaties:' : null
      ].filter(function (l) { return l !== null; });
      marked.forEach(function (id) {
        var pr = byId[id];
        lines.push('- ' + pr.alt + ': ' + new URL(pr.src, location.href).href);
      });
      var subject = 'Offerteaanvraag' + (soort.length ? ': ' + soort.join(', ') : '') + ' (' + d.get('naam') + ')';
      var href = 'mailto:mario.verschraegen@telenet.be?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(lines.join('\n'));
      window.location.href = href;
      status.hidden = false;
      status.innerHTML = 'Je mailprogramma opent met je aanvraag. Opent er niets? Bel ons op <a href="tel:+3292532037">09 253 20 37</a> of mail naar <a href="mailto:mario.verschraegen@telenet.be">mario.verschraegen@telenet.be</a>.';
    });
  }

  /* ---------- Nav ---------- */
  var nav = document.querySelector('[data-nav]');
  var menuBtn = document.querySelector('[data-menu]');
  if (menuBtn) {
    menuBtn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.querySelectorAll('.nav-links a').forEach(function (a) {
      a.addEventListener('click', function () { nav.classList.remove('open'); menuBtn.setAttribute('aria-expanded', 'false'); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('open')) { nav.classList.remove('open'); menuBtn.setAttribute('aria-expanded', 'false'); menuBtn.focus(); }
    });
  }

  if ('IntersectionObserver' in window) {
    var sentinel = document.createElement('div');
    sentinel.style.cssText = 'position:absolute;top:0;height:1px;width:1px;';
    document.body.prepend(sentinel);
    new IntersectionObserver(function (en) { nav.classList.toggle('is-stuck', !en[0].isIntersecting); }).observe(sentinel);

    // the mobile call bar steps aside once the contact block itself is on screen
    var callbar = document.querySelector('[data-callbar]');
    var targets = document.querySelectorAll('#offerte, .foot');
    if (callbar && targets.length) {
      var visible = new Set();
      new IntersectionObserver(function (en) {
        en.forEach(function (x) { if (x.isIntersecting) visible.add(x.target); else visible.delete(x.target); });
        callbar.classList.toggle('hide', visible.size > 0);
      }, { threshold: 0.15 }).observe(targets[0]);
      if (targets[1]) new IntersectionObserver(function (en) {
        en.forEach(function (x) { if (x.isIntersecting) visible.add(x.target); else visible.delete(x.target); });
        callbar.classList.toggle('hide', visible.size > 0);
      }).observe(targets[1]);
    }
  }

  var year = document.querySelector('[data-year]');
  if (year) year.textContent = new Date().getFullYear();

  syncMarks();
})();
