/* Schultheis Coiffures — interaction layer. No build step, no framework. */
(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const desktop = matchMedia('(min-width: 960px)');

  const BOOK_URL = 'https://schultheis.thera.nl';

  /* Openingstijden: [open, dicht] in minuten, per dag (0 = zondag). */
  const HOURS = {
    0: null,
    1: null,
    2: [540, 1080],
    3: [540, 1080],
    4: [540, 1080],
    5: [540, 1080],
    6: [540, 960],
  };

  /* Smooth scroll */
  let lenis = null;
  if (!reduced && window.Lenis) {
    lenis = new window.Lenis({ duration: 1.1, easing: t => 1 - Math.pow(1 - t, 4) });
    const raf = t => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }
  const hdr = $('#hdr');
  const scrollToEl = el => {
    const below = el.getBoundingClientRect().top > 0;
    if (lenis) lenis.scrollTo(el, { offset: el.id === 'top' || below ? 0 : -hdr.offsetHeight });
    else el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
  };

  /* Intro */
  const heroImg = $('.hero-img img');
  Promise.race([
    Promise.all([
      document.fonts ? document.fonts.ready : Promise.resolve(),
      heroImg.complete ? Promise.resolve() : new Promise(r => { heroImg.onload = heroImg.onerror = r; }),
    ]),
    new Promise(r => setTimeout(r, 1500)),
  ]).then(() => requestAnimationFrame(() => root.classList.add('is-loaded')));

  /* Mobiel menu */
  const menu = $('#menu');
  const burger = $('#burger');
  const setMenu = open => {
    menu.classList.toggle('is-open', open);
    menu.setAttribute('aria-hidden', String(!open));
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Menu sluiten' : 'Menu openen');
    hdr.classList.remove('is-hidden');
    if (lenis) open ? lenis.stop() : lenis.start();
    document.body.style.overflow = open ? 'hidden' : '';
  };
  burger.addEventListener('click', () => setMenu(!menu.classList.contains('is-open')));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && menu.classList.contains('is-open')) { setMenu(false); burger.focus(); }
  });
  desktop.addEventListener('change', () => setMenu(false));

  /* Ankerlinks */
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href');
    const el = id.length > 1 && id !== '#main' ? $(id) : null;
    if (!el) return;
    e.preventDefault();
    if (menu.classList.contains('is-open')) setMenu(false);
    scrollToEl(el);
    history.replaceState(null, '', id === '#top' ? location.pathname : id);
  });

  /* Header en actiebalk */
  const dock = $('#dock');
  let lastY = 0;
  let heroBtnsVisible = true;
  let contactVisible = false;
  const syncDock = () => dock.classList.toggle('is-on', !heroBtnsVisible && !contactVisible);
  new IntersectionObserver(([e]) => { heroBtnsVisible = e.isIntersecting; syncDock(); }).observe($('.hero-btns'));
  new IntersectionObserver(([e]) => { contactVisible = e.isIntersecting; syncDock(); }).observe($('.contact-btns'));

  /* Scroll-gekoppelde beweging: de grote letters */
  // Elk woord begint op zijn plek (de hero bovenaan de pagina, de rest halverwege het scherm)
  // en schuift pas op als je verder scrolt.
  const drifts = $$('[data-drift]').map(el => {
    const box = el.closest('section, footer');
    return { el, box, k: parseFloat(el.dataset.drift), from: Math.min(box.offsetTop, window.innerHeight * .5) };
  });
  const motion = () => {
    if (reduced) return;
    const vh = window.innerHeight;
    drifts.forEach(({ el, k, box, from }) => {
      const r = box.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) return;
      el.style.transform = `translate3d(${(from - r.top) * k}px, 0, 0)`;
    });
  };

  /* Het 3D-deootje: pas laden als de productsectie in de buurt komt */
  const stage = $('#deo-stage');
  const productsSec = $('#producten');
  const sectionProgress = () => {
    const r = productsSec.getBoundingClientRect();
    return reduced ? .35 : (window.innerHeight - r.top) / (r.height + window.innerHeight);
  };
  const hasWebGL = (() => {
    try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; }
  })();
  if (stage && hasWebGL) {
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      // Een gewoon script in plaats van import(): dat werkt ook als je index.html direct opent.
      const tag = document.createElement('script');
      tag.src = 'deo3d.js';
      tag.onload = () => (document.fonts ? document.fonts.ready : Promise.resolve())
        .then(() => window.SchultheisDeo.mountDeo(stage, { getProgress: sectionProgress }))
        .catch(() => {});
      document.head.appendChild(tag);
    }, { rootMargin: '100% 0px' });
    io.observe(stage);
  }

  const onScroll = () => {
    const y = window.scrollY;
    hdr.classList.toggle('is-solid', y > 8);
    if (!menu.classList.contains('is-open')) hdr.classList.toggle('is-hidden', y > lastY && y > 400);
    lastY = y;
    motion();
  };
  window.addEventListener('resize', motion);
  if (lenis) lenis.on('scroll', onScroll);
  else window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* Actieve sectie in het menu */
  const navLinks = $$('.hdr-nav a');
  const navIO = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) navLinks.forEach(a => a.classList.toggle('is-current', a.getAttribute('href') === '#' + e.target.id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  $$('main section[id]').forEach(s => navIO.observe(s));

  /* Reveal */
  const revIO = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-in');
      revIO.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -6% 0px', threshold: .05 });
  $$('[data-reveal]').forEach(el => {
    const sibs = [...el.parentElement.children].filter(x => x.hasAttribute('data-reveal'));
    el.style.transitionDelay = `${Math.min(sibs.indexOf(el), 5) * 60}ms`;
    revIO.observe(el);
  });

  /* Openingstijden: nu open en vandaag */
  const nowAms = () => {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Amsterdam', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    }).formatToParts(new Date());
    const get = t => parts.find(p => p.type === t).value;
    const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'));
    return { day, min: Number(get('hour')) * 60 + Number(get('minute')) };
  };
  const fmt = m => `${String(Math.floor(m / 60)).padStart(2, '0')}.${String(m % 60).padStart(2, '0')}`;
  const DAYS = ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag'];
  const nextOpen = (day, min) => {
    for (let i = 0; i < 8; i++) {
      const d = (day + i) % 7;
      const h = HOURS[d];
      if (!h || (i === 0 && min >= h[0])) continue;
      return `${i === 0 ? 'vandaag' : i === 1 ? 'morgen' : DAYS[d]} vanaf ${fmt(h[0])}`;
    }
    return '';
  };
  const syncStatus = () => {
    const { day, min } = nowAms();
    const h = HOURS[day];
    const open = !!h && min >= h[0] && min < h[1];
    const txt = open ? `Open tot ${fmt(h[1])}` : `Gesloten, open ${nextOpen(day, min)}`;
    $$('[data-status]').forEach(s => {
      s.dataset.open = String(open);
      $('[data-status-text]', s).textContent = txt;
    });
    $$('.hours tr').forEach(tr => tr.classList.toggle('is-today', Number(tr.dataset.day) === day));
  };
  syncStatus();
  setInterval(syncStatus, 60000);

  $$('[data-book]').forEach(a => { a.href = BOOK_URL; });
  const yr = $('[data-year]');
  if (yr) yr.textContent = String(new Date().getFullYear());
})();
