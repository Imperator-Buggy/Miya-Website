/* ==========================================================================
   Miya's Cookies — page behaviour: tabs, replay intro, PWA registration
   ========================================================================== */
(function () {
  'use strict';

  /* --- Tabbed sections (hash-routed so links are shareable) ------------- */
  const tabs = Array.from(document.querySelectorAll('[data-tab]'));
  const panels = Array.from(document.querySelectorAll('[data-panel]'));
  const names = panels.map((p) => p.dataset.panel);

  function show(name, focus) {
    if (!names.length) return;
    if (!names.includes(name)) name = names[0];
    panels.forEach((p) => {
      const on = p.dataset.panel === name;
      p.hidden = !on;
      if (on) { p.classList.remove('is-entering'); void p.offsetWidth; p.classList.add('is-entering'); }
    });
    tabs.forEach((t) => {
      const on = t.dataset.tab === name;
      t.classList.toggle('is-active', on);
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
    });
    document.body.dataset.tab = name;
    document.dispatchEvent(new CustomEvent('miya:tab', { detail: name }));
    if (focus) window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  tabs.forEach((t) => t.addEventListener('click', (e) => {
    e.preventDefault();
    history.replaceState(null, '', '#' + t.dataset.tab);
    show(t.dataset.tab, true);
  }));
  // any in-page link like <a href="#order"> also switches tabs
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    const name = a.getAttribute('href').slice(1);
    if (names.includes(name) && !a.hasAttribute('data-tab')) {
      a.addEventListener('click', (e) => { e.preventDefault(); history.replaceState(null, '', '#' + name); show(name, true); });
    }
  });
  window.addEventListener('hashchange', () => show(location.hash.slice(1), false));
  if (names.length) show(location.hash.slice(1) || names[0], false);

  /* --- Replay intro ------------------------------------------------------ */
  document.querySelectorAll('[data-replay-intro]').forEach((b) => {
    b.addEventListener('click', () => window.MiyaIntro && window.MiyaIntro.open());
  });

  /* --- Cookie "tap to bite" micro-interaction ---------------------------- */
  document.querySelectorAll('[data-bite]').forEach((img) => {
    const states = img.dataset.bite.split(',');
    let i = 0;
    img.addEventListener('click', () => {
      i = (i + 1) % states.length;
      img.src = states[i];
      img.classList.remove('is-bitten'); void img.offsetWidth; img.classList.add('is-bitten');
    });
  });

  /* --- PWA: service worker + install prompt ------------------------------ */
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }
  let deferredInstall = null;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstall = e;
    document.querySelectorAll('[data-install]').forEach((b) => { b.hidden = false; });
  });
  document.querySelectorAll('[data-install]').forEach((b) => b.addEventListener('click', async () => {
    if (!deferredInstall) return;
    deferredInstall.prompt();
    await deferredInstall.userChoice;
    deferredInstall = null;
    b.hidden = true;
  }));
})();
