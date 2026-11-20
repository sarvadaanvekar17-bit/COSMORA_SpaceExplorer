/* ============================================================
   COSMORA — missions.js
   Space Missions: filterable mission cards + detail lightbox.
   Requires js/main.js (window.COSMORA helpers).
   ============================================================ */
(() => {
  'use strict';
  const { D, $, $$, el, nasaImg, openLightbox } = window.COSMORA;
  if (!D || !D.missions) return;

  const mg = $('#missionGrid');
  if (mg) D.missions.forEach((m, i) => {
    const card = el('article', 'm-card glass reveal col'); card.dataset.cat = m.cat;
    card.innerHTML = `<div class="m-img"><img src="${nasaImg(m.img)}" alt="${m.name}" loading="lazy" /><span class="status ${m.status}">${m.status}</span></div>
      <div class="m-body"><div class="m-meta"><span class="agency">${m.agency}</span><span class="m-year">${m.year}</span></div>
      <h3>${m.name}</h3><p class="m-date">Launched ${m.date.replace(/^Artemis I · /, '')}</p><p>${m.desc}</p>
      <button class="btn btn-ghost btn-sm m-explore">Explore mission <span aria-hidden="true">→</span></button></div>`;
    const btn = card.querySelector('.m-explore');
    if (btn) btn.addEventListener('click', () => openLightbox('mission', i, D.missions));
    mg.appendChild(card);
  });

  const missionFilters = $('#missionFilters');
  if (missionFilters) missionFilters.addEventListener('click', e => {
    const b = e.target.closest('.chip'); if (!b) return;
    $$('.chip', missionFilters).forEach(c => c.classList.toggle('active', c === b));
    const f = b.dataset.filter; let n = 0;
    $$('.m-card', mg || document).forEach(c => {
      const show = f === 'all' || c.dataset.cat === f;
      c.classList.toggle('hide', !show);
      if (show) { c.classList.add('in'); c.animate([{ opacity: 0, transform: 'translateY(24px) scale(.98)' }, { opacity: 1, transform: 'none' }], { duration: 600, delay: n++ * 60, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'backwards' }); }
    });
  });

  // Deep link: missions.html#<id> opens that mission.
  const hash = decodeURIComponent(location.hash.slice(1));
  if (hash) {
    const idx = D.missions.findIndex(m => m.id === hash);
    if (idx >= 0) setTimeout(() => openLightbox('mission', idx, D.missions), 400);
  }

  window.observeReveals(document.body);
  window.renderIcons && window.renderIcons();
})();
