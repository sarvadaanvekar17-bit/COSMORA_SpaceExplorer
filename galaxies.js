/* ============================================================
   COSMORA — galaxies.js
   Galaxy Discovery: deep-field gallery with search + filters,
   lightbox, and the interactive galaxy model.
   Requires js/main.js (window.COSMORA helpers).
   ============================================================ */
(() => {
  'use strict';
  const { D, $, $$, el, reduce, makeGalaxy, drawGalaxy, nasaImg, catLabel, openLightbox } = window.COSMORA;
  if (!D || !D.gallery) return;

  /* ---------- Deep-field gallery ---------- */
  const gal = $('#gallery'), gSearch = $('#gallerySearch'), gFilters = $('#galleryFilters');
  let gCat = 'all', gList = D.gallery;

  if (gFilters) D.galleryCats.forEach(([k, label], i) => {
    const b = el('button', 'chip' + (i ? '' : ' active'), label); b.dataset.cat = k; gFilters.appendChild(b);
  });

  const openItem = g => openLightbox('gallery', gList.indexOf(g), gList);

  if (gal) D.gallery.forEach((g, i) => {
    const f = el('figure', 'g-item'); f.tabIndex = 0; f.dataset.i = i;
    f.setAttribute('role', 'button'); f.setAttribute('aria-label', `Open ${g.name}`);
    f.innerHTML = `<div class="g-img"><img src="${nasaImg(g.id)}" alt="${g.name} — ${g.sub}" loading="lazy" /></div>
      <figcaption><span class="type-badge">${g.kind || catLabel[g.cat]}</span><strong>${g.name}</strong><span>${g.sub}</span></figcaption>
      <span class="g-zoom" aria-hidden="true"><i data-lucide="expand" class="lucide-inline"></i></span>`;
    const img = f.querySelector('img');
    const done = () => f.classList.add('loaded');
    img.complete ? done() : img.addEventListener('load', done);
    img.addEventListener('error', () => f.classList.add('broken'));
    const open = () => openItem(g);
    f.addEventListener('click', open);
    f.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
    gal.appendChild(f);
  });

  function filterGallery() {
    if (!gal) return;
    const q = gSearch ? gSearch.value.trim().toLowerCase() : '';
    gList = D.gallery.filter(g => (gCat === 'all' || g.cat === gCat) &&
      (!q || [g.name, g.sub, g.where, g.inst, g.desc, catLabel[g.cat], g.kind || ''].join(' ').toLowerCase().includes(q)));
    let n = 0;
    $$('.g-item', gal).forEach(f => {
      const show = gList.includes(D.gallery[+f.dataset.i]);
      f.classList.toggle('hide', !show);
      if (show) f.style.animationDelay = (n++ % 12) * 0.04 + 's';
    });
    const gc = $('#galleryCount'); if (gc) gc.textContent = `${gList.length} of ${D.gallery.length} objects`;
    const ge = $('#galleryEmpty'); if (ge) ge.hidden = gList.length > 0;
  }
  if (gFilters) gFilters.addEventListener('click', e => {
    const b = e.target.closest('.chip'); if (!b) return;
    $$('.chip', gFilters).forEach(c => c.classList.toggle('active', c === b)); gCat = b.dataset.cat; filterGallery();
  });
  if (gSearch) gSearch.addEventListener('input', filterGallery);
  filterGallery();

  /* ---------- Interactive galaxy model ---------- */
  const heroCanvas = $('#galaxyHero'), hctx = heroCanvas && heroCanvas.getContext('2d');
  let heroGalaxy, galRot = 0;
  function selectGalaxy(i) {
    const g = D.galaxies[i]; if (!g) return;
    heroGalaxy = makeGalaxy(g.hue, g.arms, innerWidth < 700 ? 2600 : 5000);
    heroGalaxy.flat = g.arms === 0 ? 0.42 : 0.82;
    const gfType = $('#gfType'), gfName = $('#gfName'), gfDesc = $('#gfDesc'), gfDist = $('#gfDist'), gfStars = $('#gfStars'), gfDia = $('#gfDia');
    if (gfType) gfType.textContent = g.type;
    if (gfName) gfName.textContent = g.name;
    if (gfDesc) gfDesc.textContent = g.desc;
    if (gfDist) gfDist.textContent = g.distance;
    if (gfStars) gfStars.textContent = g.stars;
    if (gfDia) gfDia.textContent = g.diameter;
    $$('.galaxy-card').forEach((c, k) => c.classList.toggle('active', k === i));
    const gfCopy = $('.gf-copy'); if (gfCopy) gfCopy.animate([{ opacity: 0, transform: 'translateY(12px)' }, { opacity: 1, transform: 'none' }], { duration: 600, easing: 'cubic-bezier(.22,1,.36,1)' });
  }
  const gg = $('#galaxyGrid');
  if (gg && hctx) D.galaxies.forEach((g, i) => {
    const card = el('article', 'galaxy-card glass reveal col'); card.tabIndex = 0;
    card.style.transitionDelay = (i % 3) * 0.06 + 's';
    const c = el('canvas'); c.width = c.height = 192; card.appendChild(c);
    card.insertAdjacentHTML('beforeend', `<div><p class="eyebrow" style="margin-bottom:6px">${g.type}</p><h3>${g.name}</h3><p>${g.distance}</p></div>`);
    drawGalaxy(c.getContext('2d'), makeGalaxy(g.hue, g.arms, 1400), 192, i, g.arms === 0 ? 0.45 : 1);
    const go = () => { selectGalaxy(i); const feat = $('#galaxyFeature'); if (feat) feat.scrollIntoView({ behavior: 'smooth', block: 'center' }); };
    card.addEventListener('click', go);
    card.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
    gg.appendChild(card);
  });
  if (hctx) {
    selectGalaxy(0);
    (function galLoop() {
      if (hctx && !document.hidden) { galRot += reduce ? 0 : 0.0016; drawGalaxy(hctx, heroGalaxy, heroCanvas.width, galRot, heroGalaxy.flat); }
      requestAnimationFrame(galLoop);
    })();
  }

  /* ---------- Deep link: galaxies.html#<id> opens that object ---------- */
  const hash = decodeURIComponent(location.hash.slice(1));
  if (hash) {
    const idx = D.gallery.findIndex(g => g.id === hash);
    if (idx >= 0) setTimeout(() => openLightbox('gallery', idx, D.gallery), 400);
  }

  window.observeReveals(document.body);
  window.renderIcons && window.renderIcons();
})();
