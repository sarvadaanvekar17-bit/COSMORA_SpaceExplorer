/* ============================================================
   COSMORA — planets.js
   Solar System Explorer: orrery, planet grid, filters,
   size comparison and the planet dossier modal.
   Requires js/main.js (window.COSMORA helpers).
   ============================================================ */
(() => {
  'use strict';
  const { D, $, $$, el, reduce, planetEl, displaySize, openModal } = window.COSMORA;
  if (!D || !D.planets) return;

  /* ---------- Orrery (animated orbits) ---------- */
  const solar = $('#solar-system');
  if (solar) {
    let selected = D.planets[2];
    const bodies = D.planets.map((p, i) => {
      const radius = 12 + i * 5.1; // % of container width, from center
      const orbit = el('div', 'orbit'); orbit.style.width = orbit.style.height = radius * 2 + '%';
      solar.appendChild(orbit);
      const node = el('button', 'p'); node.setAttribute('aria-label', p.name);
      node.appendChild(el('span', 'lbl', p.name));
      solar.appendChild(node);
      node.addEventListener('click', () => selectPlanet(p));
      return { p, orbit, node, radius, angle: Math.random() * Math.PI * 2, period: Math.pow(p.orbit, 1.5), render: null };
    });
    function sizeOrrery() {
      const W = solar.clientWidth;
      bodies.forEach(b => {
        const s = displaySize(b.p, W / 70, 7, W / 17);
        if (b.render) b.render.remove();
        b.render = planetEl(b.p, s); b.size = s;
        b.node.style.width = b.node.style.height = s + 'px';
        b.node.insertBefore(b.render, b.node.firstChild);
      });
    }
    sizeOrrery(); addEventListener('resize', sizeOrrery);
    let speed = 1, paused = false, last = performance.now();
    const speedInput = $('#speed');
    if (speedInput) speedInput.addEventListener('input', e => (speed = +e.target.value));
    solar.addEventListener('mouseenter', () => (paused = true));
    solar.addEventListener('mouseleave', () => (paused = false));
    (function orbitLoop(t) {
      const dt = Math.min(0.05, (t - last) / 1000); last = t;
      if (!document.hidden) {
        const W = solar.clientWidth, c = W / 2;
        bodies.forEach(b => {
          if (!paused && !reduce) b.angle += dt * speed * (0.9 / Math.sqrt(b.period));
          const r = (b.radius / 100) * W;
          const x = c + Math.cos(b.angle) * r - b.size / 2, y = c + Math.sin(b.angle) * r - b.size / 2;
          b.node.style.transform = `translate(${x}px, ${y}px)`;
        });
      }
      requestAnimationFrame(orbitLoop);
    })(last);
    function selectPlanet(p) {
      selected = p;
      bodies.forEach(b => { const on = b.p === p; b.node.classList.toggle('sel', on); b.orbit.classList.toggle('sel', on); });
      const siName = $('#siName'), siTag = $('#siTag'), siDist = $('#siDist'), siYear = $('#siYear'), siMoons = $('#siMoons'), info = $('#solarInfo');
      if (siName) siName.textContent = p.name;
      if (siTag) siTag.textContent = p.tagline;
      if (siDist) siDist.textContent = p.distance;
      if (siYear) siYear.textContent = p.year;
      if (siMoons) siMoons.textContent = p.moons;
      if (info) info.animate([{ opacity: .4, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 500, easing: 'cubic-bezier(.22,1,.36,1)' });
    }
    selectPlanet(selected);
    const siOpen = $('#siOpen');
    if (siOpen) siOpen.addEventListener('click', () => openModal(D.planets.indexOf(selected)));
  }

  /* ---------- Planet cards ---------- */
  const grid = $('#planetGrid');
  if (grid) D.planets.forEach((p, i) => {
    const card = el('article', 'planet-card glass reveal col');
    card.dataset.type = p.type; card.tabIndex = 0; card.style.setProperty('--glow', p.color[1] + '99');
    card.style.transitionDelay = (i % 4) * 0.06 + 's';
    const vis = el('div', 'pc-vis'); vis.appendChild(planetEl(p, p.rings ? 88 : displaySize(p, 70, 64, 120)));
    card.appendChild(el('span', 'num', String(i + 1).padStart(2, '0')));
    card.appendChild(vis);
    card.insertAdjacentHTML('beforeend', `<span class="type-badge">${p.type === 'gas' ? 'Gas giant' : p.type === 'ice' ? 'Ice giant' : 'Terrestrial'}</span>
      <h3>${p.name}</h3><p class="tag">${p.tagline}</p><p class="short">${p.desc.split('. ')[0]}.</p>
      <div class="meta"><div><b>${p.distance.replace(' km','')}</b>km from Sun</div><div><b>${p.year}</b>Orbit</div><div><b>${p.moons}</b>Moons</div></div><span class="card-link">View dossier →</span>`);
    card.addEventListener('click', () => openModal(i));
    card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openModal(i); } });
    grid.appendChild(card);
  });

  /* ---------- Planet filters ---------- */
  const planetFilters = $('#planetFilters');
  if (planetFilters) planetFilters.addEventListener('click', e => {
    const b = e.target.closest('.chip'); if (!b) return;
    $$('.chip', planetFilters).forEach(c => c.classList.toggle('active', c === b));
    const f = b.dataset.filter;
    $$('.planet-card', grid || document).forEach(c => {
      const show = f === 'all' || c.dataset.type === f;
      c.classList.toggle('hide', !show);
      if (show) c.animate([{ opacity: 0, transform: 'translateY(20px) scale(.97)' }, { opacity: 1, transform: 'none' }], { duration: 600, easing: 'cubic-bezier(.22,1,.36,1)' });
    });
  });

  /* ---------- Size comparison ---------- */
  const compare = $('#compare');
  if (compare) {
    const cmp = el('div', 'compare-row row justify-content-center');
    D.planets.forEach((p, i) => {
      const it = el('div', 'compare-item col-auto');
      it.appendChild(planetEl({ ...p, rings: false }, Math.max(10, p.size * 14)));
      it.appendChild(el('span', '', p.name));
      it.addEventListener('click', () => openModal(i));
      cmp.appendChild(it);
    });
    compare.appendChild(cmp);
    compare.insertAdjacentHTML('beforeend', '<p class="muted" style="margin-top:22px;font-size:.85rem">Diameters shown to relative scale. Jupiter could fit 1,300 Earths inside it.</p>');
  }

  /* ---------- Deep link: planets.html#earth opens that planet ---------- */
  const hash = decodeURIComponent(location.hash.slice(1));
  if (hash) {
    const idx = D.planets.findIndex(p => p.id === hash);
    if (idx >= 0) setTimeout(() => openModal(idx), 400);
  }

  window.observeReveals(document.body);
  window.renderIcons && window.renderIcons();
})();
