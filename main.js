/* ============================================================
   COSMORA — main.js
   Shared utilities, site chrome and the Home page.
   Loaded on every page, before the page-specific scripts.
   ============================================================ */
(() => {
  'use strict';

  /* ---------- Shared helpers ---------- */
  const D = window.COSMORA_DATA;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };

  /* ---------- Planet renderer (CSS-built, no images) ---------- */
  function planetEl(p, size) {
    const w = el('div', 'planet-render' + (p.bands ? ' bands' : '') + (p.land ? ' land' : ''));
    w.style.cssText = `--s:${size}px;--c1:${p.color[0]};--c2:${p.color[1]};--c3:${p.color[2]};--glow:${p.color[1]}88;` + (p.ringTilt ? `--rt:${p.ringTilt}deg;` : '');
    if (p.rings) w.appendChild(el('span', 'ring back'));
    const body = el('div', 'body'); if (p.id) { body.appendChild(el('i', 'tex tex-' + p.id)); body.appendChild(el('i', 'clouds clouds-' + p.id)); }
    w.appendChild(body);
    if (p.rings) w.appendChild(el('span', 'ring front'));
    return w;
  }
  const displaySize = (p, base, min, max) => Math.max(min, Math.min(max, base * Math.pow(p.size, 0.42)));

  /* ---------- Galaxy renderer (canvas particles) ---------- */
  function makeGalaxy(hue, arms, n) {
    const pts = [];
    const spiral = arms > 0;
    for (let i = 0; i < n; i++) {
      const r = Math.pow(Math.random(), spiral ? 1.4 : 2.2);
      let a;
      if (spiral && Math.random() < 0.3) a = Math.random() * Math.PI * 2;
      else if (spiral) {
        const arm = Math.floor(Math.random() * arms);
        a = arm * (Math.PI * 2 / arms) + r * 4.6 + (Math.random() - 0.5) * (1.3 - r * 0.5) * (Math.random() < 0.5 ? 1 : 0.4);
      } else a = Math.random() * Math.PI * 2;
      const core = r < 0.15;
      const h = core ? 40 : hue + (Math.random() - 0.5) * 50;
      const l = core ? 85 : 60 + Math.random() * 30;
      pts.push({ r, a, s: Math.random() * 1.3 + 0.3, c: `hsla(${h},90%,${l}%,`, o: Math.random() * 0.7 + 0.3 });
    }
    return { pts, hue, arms };
  }
  function drawGalaxy(ctx, g, size, rot, flat = 1) {
    ctx.clearRect(0, 0, size, size);
    const c = size / 2, R = size * 0.46;
    const halo = ctx.createRadialGradient(c, c, 0, c, c, R);
    halo.addColorStop(0, 'rgba(255,240,220,.9)');
    halo.addColorStop(0.08, `hsla(${g.hue},90%,75%,.45)`);
    halo.addColorStop(0.4, `hsla(${g.hue},80%,50%,.12)`);
    halo.addColorStop(1, 'transparent');
    ctx.save(); ctx.translate(c, c); ctx.scale(1, flat); ctx.translate(-c, -c);
    ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(c, c, R, 0, 6.283); ctx.fill();
    for (const p of g.pts) {
      const a = p.a + rot * (1.2 - p.r);
      const x = c + Math.cos(a) * p.r * R, y = c + Math.sin(a) * p.r * R;
      ctx.fillStyle = p.c + p.o + ')';
      const ps = Math.max(1, p.s * size / 300); ctx.fillRect(x, y, ps, ps);
    }
    if (g.arms === 0) {
      ctx.fillStyle = 'rgba(10,6,4,.75)'; ctx.fillRect(c - R, c - R * 0.04, R * 2, R * 0.08);
    }
    ctx.restore();
  }

  /* ---------- NASA image helpers ---------- */
  const nasaImg = (id, size = 'medium') => `https://images-assets.nasa.gov/image/${id}/${id}~${size}.jpg`;
  const nasaPage = id => `https://images.nasa.gov/details/${encodeURIComponent(id)}`;
  const catLabel = Object.fromEntries(D.galleryCats);

  /* ---------- Loader ---------- */
  const loader = $('#loader');
  if (loader) {
    addEventListener('load', () => setTimeout(() => loader.classList.add('done'), 600));
    setTimeout(() => loader.classList.add('done'), 3000);
  }
  const yearEl = $('#year'); if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Reveal on scroll ---------- */
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  window.observeReveals = root => $$('.reveal:not(.in)', root).forEach(n => io.observe(n));
  window.observeReveals(document.body);

  /* ---------- Counters ---------- */
  function runCounters() {
    $$('[data-count]').forEach(n => {
      const end = parseFloat(n.dataset.count), dec = +(n.dataset.decimals || 0), suf = n.dataset.suffix || '';
      const t0 = performance.now(), dur = 1800;
      const tick = t => { const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 4); n.textContent = (end * e).toFixed(dec) + suf; if (k < 1) requestAnimationFrame(tick); };
      requestAnimationFrame(tick);
    });
  }
  window.runCounters = runCounters;
  runCounters();

  /* ---------- Nav ---------- */
  const nav = $('#nav'), links = $('#navLinks'), burger = $('#burger'), indicator = $('#navIndicator');
  if (nav) {
    addEventListener('scroll', () => nav.classList.toggle('scrolled', scrollY > 30), { passive: true });
    if (burger) burger.addEventListener('click', () => {
      const open = burger.getAttribute('aria-expanded') !== 'true';
      burger.setAttribute('aria-expanded', open); links.classList.toggle('open', open);
    });
    // Close mobile menu after following a link.
    if (links) links.addEventListener('click', e => { if (e.target.closest('a')) { links.classList.remove('open'); burger && burger.setAttribute('aria-expanded', 'false'); } });
  }
  function moveIndicator() {
    const a = links && $('a.active', links);
    if (!indicator) return;
    if (!a) { indicator.style.width = 0; return; }
    indicator.style.left = a.offsetLeft + 'px'; indicator.style.width = a.offsetWidth + 'px';
  }
  if (links) { moveIndicator(); addEventListener('resize', moveIndicator); }

  // Mark the current page in the nav.
  const page = location.pathname.split('/').pop() || 'index.html';
  $$('a[data-route]').forEach(a => a.classList.toggle('active', a.dataset.route === page));

  const soundToggle = $('#soundToggle');
  if (soundToggle) soundToggle.addEventListener('click', e => {
    const on = e.currentTarget.classList.toggle('on');
    window.Starfield && Starfield.warp(on);
  });

  /* ---------- Cursor glow, hero parallax, tilt ---------- */
  const glow = $('.cursor-glow'), heroVis = $('#heroVisual');
  addEventListener('mousemove', e => {
    if (glow) glow.style.transform = `translate(${e.clientX - 260}px, ${e.clientY - 260}px)`;
    if (heroVis && !reduce) {
      const x = e.clientX / innerWidth - 0.5, y = e.clientY / innerHeight - 0.5;
      heroVis.style.transform = `perspective(1000px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) translate(${x * -14}px, ${y * -14}px)`;
    }
  }, { passive: true });
  if (glow) { glow.style.left = glow.style.top = '0'; glow.style.transform = 'translate(-999px,-999px)'; }
  window.bindTilt = function bindTilt(root = document) {
    $$('.tilt', root).forEach(card => {
      card.addEventListener('mousemove', e => {
        const r = card.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        card.style.setProperty('--mx', x * 100 + '%'); card.style.setProperty('--my', y * 100 + '%');
        if (!reduce) card.style.transform = `perspective(900px) rotateY(${(x - 0.5) * 10}deg) rotateX(${(0.5 - y) * 10}deg) translateY(-6px)`;
      });
      card.addEventListener('mouseleave', () => (card.style.transform = ''));
    });
  };
  window.bindTilt();
  setInterval(() => { const v = $('#velocity'); if (v) v.textContent = (29.78 + (Math.random() - 0.5) * 0.06).toFixed(2) + ' km/s'; }, 1400);

  $$('canvas.mini-galaxy').forEach(c => { const g = makeGalaxy(+c.dataset.hue, 2, 900); drawGalaxy(c.getContext('2d'), g, c.width, 0); });

  // Entrance animations are decorative; force them to their end state shortly
  // after opening so rendering-throttled browsers never leave the UI invisible.
  const settleAnim = (selector, ms = 800) => setTimeout(() => {
    const node = $(selector); if (!node) return;
    let anims = [];
    try { anims = node.getAnimations({ subtree: true }); } catch (_) { anims = node.getAnimations(); }
    anims.forEach(a => { try { a.finish(); } catch (_) {} });
  }, ms);

  /* ---------- Planet modal (used by Home strip + Planets page) ---------- */
  const modal = $('#modal');
  let mi = 0, lastFocus = null;
  function fillModal(i) {
    if (!D.planets.length) return;
    mi = (i + D.planets.length) % D.planets.length; const p = D.planets[mi];
    const host = $('#mPlanet');
    host.replaceWith(Object.assign(planetEl(p, Math.min(300, innerWidth * 0.55) * (p.rings ? 0.62 : 0.85)), { id: 'mPlanet' }));
    $('#mType').textContent = `${String(mi + 1).padStart(2, '0')} · ${p.type === 'gas' ? 'Gas giant' : p.type === 'ice' ? 'Ice giant' : 'Terrestrial planet'}`;
    $('#mName').textContent = p.name; $('#mTag').textContent = p.tagline; $('#mDesc').textContent = p.desc;
    $('#mStats').innerHTML = [['Distance from Sun', p.distance], ['Diameter', p.diameter], ['Orbital period', p.year], ['Temperature', p.temp], ['Known moons', p.moons], ['Day length', p.day]].map(([k, v]) => `<div><span>${k}</span><strong>${v}</strong></div>`).join('');
    $('#mFacts').innerHTML = p.facts.map(f => `<li>${f}</li>`).join('');
    const body = $('.modal-body'); if (body) body.animate([{ opacity: 0, transform: 'translateX(14px)' }, { opacity: 1, transform: 'none' }], { duration: 450, easing: 'cubic-bezier(.22,1,.36,1)' });
  }
  function openModal(i) {
    if (!modal) return;
    lastFocus = document.activeElement; fillModal(i);
    modal.hidden = false; document.body.classList.add('no-scroll');
    const c = $('.modal-close', modal); if (c) c.focus();
    settleAnim('.modal-card');
  }
  function closeModal() { if (!modal) return; modal.hidden = true; document.body.classList.remove('no-scroll'); lastFocus && lastFocus.focus(); }
  if (modal) {
    modal.addEventListener('click', e => { if (e.target.closest('[data-close]')) closeModal(); });
    const mp = $('#mPrev'), mn = $('#mNext');
    if (mp) mp.onclick = () => fillModal(mi - 1);
    if (mn) mn.onclick = () => fillModal(mi + 1);
  }
  addEventListener('keydown', e => {
    if (!modal || modal.hidden) return;
    if (e.key === 'Escape') closeModal();
    if (e.key === 'ArrowRight') fillModal(mi + 1);
    if (e.key === 'ArrowLeft') fillModal(mi - 1);
  });
  window.COSMORA = window.COSMORA || {};
  Object.assign(window.COSMORA, { D, $, $$, el, reduce, planetEl, displaySize, makeGalaxy, drawGalaxy, nasaImg, nasaPage, catLabel, openModal, closeModal });

  // Lucide icons are enhanced once the CDN script has loaded.
  window.renderIcons = () => { if (window.lucide) window.lucide.createIcons(); };

  /* ---------- Lightbox (shared by Galaxies + Missions pages) ---------- */
  const lb = $('#lightbox'), lbImg = $('#lbImg');
  if (lb) {
    let lbMode = 'gallery', lbList = [], lbI = 0, lbFocus = null;
    function fillLightbox(i) {
      lbI = (i + lbList.length) % lbList.length;
      const o = lbList[lbI], g = lbMode === 'gallery';
      const id = g ? o.id : o.img;
      lb.classList.remove('ready');
      lbImg.onload = () => lb.classList.add('ready');
      lbImg.onerror = () => { if (lbImg.src.includes('~large')) lbImg.src = nasaImg(id, 'medium'); };
      lbImg.src = nasaImg(id, 'large'); lbImg.alt = o.name;
      $('#lbCat').textContent = g ? `${o.kind || catLabel[o.cat]} · ${o.year}` : `${o.agency} · ${o.status}`;
      $('#lbName').textContent = o.name;
      $('#lbSub').textContent = g ? o.sub : o.target;
      $('#lbDesc').textContent = o.desc;
      const stats = g ? [['Distance', o.dist], ['Location', o.where], ['Captured by', o.inst], ['Released', o.year]]
        : [['Launch', o.date], ['Status', o.status[0].toUpperCase() + o.status.slice(1)], ...o.stats];
      $('#lbStats').innerHTML = stats.map(([k, v]) => `<div><span>${k}</span><strong>${v}</strong></div>`).join('');
      $('#lbFacts').innerHTML = g ? '' : o.facts.map(f => `<li>${f}</li>`).join('');
      $('#lbCredit').textContent = o.credit;
      $('#lbSource').href = nasaPage(id);
      const panel = $('.lb-panel', lb); if (panel) panel.animate([{ opacity: .6 }, { opacity: 1 }], { duration: 400 });
    }
    function openLightbox(mode, i, list) {
      lbMode = mode; lbList = list; lbFocus = document.activeElement;
      lb.classList.toggle('is-mission', mode === 'mission');
      fillLightbox(i); lb.hidden = false; document.body.classList.add('no-scroll');
      requestAnimationFrame(() => { const c = $('.modal-close', lb); if (c) c.focus(); });
      settleAnim('.lb-panel');
    }
    function closeLightbox() { lb.hidden = true; document.body.classList.remove('no-scroll'); lbFocus && lbFocus.focus(); }
    lb.addEventListener('click', e => { if (e.target.closest('[data-close]')) closeLightbox(); });
    const lp = $('#lbPrev'), ln = $('#lbNext');
    if (lp) lp.onclick = () => fillLightbox(lbI - 1);
    if (ln) ln.onclick = () => fillLightbox(lbI + 1);
    addEventListener('keydown', e => {
      if (lb.hidden) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') fillLightbox(lbI + 1);
      if (e.key === 'ArrowLeft') fillLightbox(lbI - 1);
    });
    Object.assign(window.COSMORA, { openLightbox, closeLightbox });
  }

  const yr = $('#year'); if (yr) yr.textContent = new Date().getFullYear();

  /* ---------- Back to top ---------- */
  const toTop = $('#toTop');
  if (toTop) {
    addEventListener('scroll', () => toTop.classList.toggle('show', scrollY > 700), { passive: true });
    toTop.addEventListener('click', () => scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }));
  }

  /* ============================================================
     HOME PAGE
     ============================================================ */
  if (page === 'index.html') {
    const moon = { color: ['#f4f4f8', '#a3a5bd', '#34364d'] };
    const visFor = (v, hue = 210) => {
      if (v === 'galaxy') { const c = el('canvas', 'fo-galaxy'); c.width = c.height = 240; drawGalaxy(c.getContext('2d'), makeGalaxy(hue, 2, 2200), 240, 0.5, 0.7); return c; }
      if (v === 'mars') return planetEl(D.planets[3], 96);
      if (v === 'moon') return planetEl({ ...moon, id: 'moon' }, 96);
      const w = el('div'); w.innerHTML = v === 'nebula' ? '<div class="ov-nebula"><i></i><i></i><i></i></div>' : `<div class="ov-${v}"></div>`; return w.firstChild;
    };

    // Featured celestial discoveries (real NASA photos).
    const fo = $('#featuredObjects');
    if (fo) D.featuredObjects.forEach(id => {
      const o = D.gallery.find(g => g.id === id); if (!o) return;
      const a = el('a', 'feature-card photo-card glass reveal tilt');
      a.href = `galaxies.html#${o.id}`;
      a.innerHTML = `<div class="pc-img"><img src="${nasaImg(o.id)}" alt="${o.name}" loading="lazy" /></div><span class="type-badge">${catLabel[o.cat]}</span><h3>${o.name}</h3><span class="fo-meta">${o.dist} · ${o.where}</span><p>${o.desc.split('. ')[0]}.</p><span class="card-link">View image →</span>`;
      fo.appendChild(a);
    });

    // Solar system strip — clicking opens the planet dossier on planets.html.
    const strip = $('#planetStrip');
    if (strip) D.planets.forEach((p, i) => {
      const a = el('a', 'strip-item'); a.href = `planets.html#${p.id}`;
      a.style.setProperty('--glow', p.color[1] + '88');
      const v = el('div', 'strip-vis'); v.appendChild(planetEl(p, p.rings ? 58 : displaySize(p, 40, 34, 74))); a.appendChild(v);
      a.insertAdjacentHTML('beforeend', `<strong>${p.name}</strong><span>${p.distance} from Sun</span>`);
      strip.appendChild(a);
    });

    // Featured missions.
    const fm = $('#featuredMissions');
    if (fm) D.featuredMissions.forEach(id => {
      const m = D.missions.find(x => x.id === id); if (!m) return;
      const a = el('a', 'fm-card glass reveal tilt'); a.href = `missions.html#${m.id}`;
      a.innerHTML = `<div class="fm-vis photo"><img src="${nasaImg(m.img)}" alt="${m.name}" loading="lazy" /></div><div class="fm-body"><div class="mission-top"><span class="fm-year">${m.year}</span><span class="status ${m.status}">${m.status}</span></div><h3>${m.name}</h3><span class="agency">${m.agency}</span><p>${m.desc}</p><span class="target"><i data-lucide="crosshair" class="lucide-inline"></i>${m.target}</span></div>`;
      fm.appendChild(a);
    });

    // Universe facts grid.
    const fg = $('#factsGrid');
    if (fg) fg.innerHTML = D.facts.map((f, i) => `<div class="fact glass reveal" style="transition-delay:${(i % 3) * 0.08}s"><strong class="grad-text">${f.stat}</strong><p>${f.label}</p></div>`).join('');

    // Latest discoveries.
    const ng = $('#newsGrid');
    if (ng) D.news.forEach((n, i) => {
      const c = el('article', 'news-card glass reveal'); c.style.transitionDelay = i * 0.06 + 's';
      const v = el('div', 'news-vis');
      if (n.planet) v.appendChild(planetEl(D.planets.find(p => p.id === n.planet), 70)); else v.appendChild(visFor('galaxy', 280));
      c.appendChild(v);
      c.insertAdjacentHTML('beforeend', `<div class="news-meta"><span class="type-badge">${n.tag}</span><time>${n.date}</time></div><h3>${n.title}</h3><p>${n.desc}</p>`);
      ng.appendChild(c);
    });

    // Scale band.
    const scaleData = [['Mercury', '3 min 13 s'], ['Venus', '6 min 1 s'], ['Earth', '8 min 20 s'], ['Mars', '12 min 40 s'], ['Jupiter', '43 min 15 s'], ['Saturn', '1 h 19 min'], ['Uranus', '2 h 39 min'], ['Neptune', '4 h 10 min']];
    const dots = $('#scaleDots');
    if (dots) {
      D.planets.forEach((p, i) => {
        const d = el('div', 'sd'); d.appendChild(planetEl({ ...p, rings: false }, displaySize(p, 9, 8, 30))); d.appendChild(el('small', '', p.name));
        d.addEventListener('click', () => { const r = $('#scaleRange'); if (r) { r.value = i; updateScale(); } });
        dots.appendChild(d);
      });
    }
    function updateScale() {
      const r = $('#scaleRange'); if (!r || !dots) return;
      const i = +r.value;
      const sn = $('#scaleName'), sl = $('#scaleLight');
      if (sn) sn.textContent = scaleData[i][0];
      if (sl) sl.textContent = scaleData[i][1] + ' at light speed';
      $$('.sd', dots).forEach((d, k) => d.classList.toggle('on', k === i));
      const target = $$('.sd', dots)[i], track = $('.light-track');
      if (target && track) {
        const left = target.offsetLeft + target.offsetWidth / 2 - track.offsetLeft;
        const ph = $('#photon'); if (ph) ph.style.left = left + 'px';
      }
    }
    const scaleRange = $('#scaleRange');
    if (scaleRange) scaleRange.addEventListener('input', updateScale);
    addEventListener('resize', updateScale);
    setTimeout(updateScale, 50);

    // Cosmic quiz.
    const quiz = $('#quiz');
    if (quiz) {
      let qi = 0, score = 0;
      function renderQuiz() {
        if (qi >= D.quiz.length) {
          const msg = score === D.quiz.length ? 'Flawless navigation, Commander.' : score >= 3 ? 'Impressive — you know your way around the stars.' : 'Every astronaut starts somewhere. Try again!';
          quiz.innerHTML = `<div class="quiz-result"><p class="eyebrow">Mission debrief</p><div class="score grad-text">${score}/${D.quiz.length}</div><p class="muted">${msg}</p><button class="btn btn-primary" id="qRestart" style="margin-top:24px">Relaunch quiz</button></div>`;
          const qr = $('#qRestart', quiz); if (qr) qr.onclick = () => { qi = 0; score = 0; renderQuiz(); };
          return;
        }
        const q = D.quiz[qi];
        quiz.innerHTML = `<div class="quiz-progress"><i style="width:${(qi / D.quiz.length) * 100}%"></i></div>
          <p class="eyebrow">Question ${qi + 1} of ${D.quiz.length}</p><p class="quiz-q">${q.q}</p>
          <div class="quiz-opts">${q.a.map((a, i) => `<button class="quiz-opt" data-i="${i}">${a}</button>`).join('')}</div>
          <div class="quiz-foot"><span>Score: ${score}</span><span id="qFeedback"></span></div>`;
        $$('.quiz-opt', quiz).forEach(b => b.addEventListener('click', () => {
          const i = +b.dataset.i, ok = i === q.c;
          if (ok) score++;
          $$('.quiz-opt', quiz).forEach((o, k) => { o.disabled = true; if (k === q.c) o.classList.add('right'); else if (k === i) o.classList.add('wrong'); });
          const fb = $('#qFeedback', quiz); if (fb) fb.textContent = ok ? 'Correct ✦' : 'Not quite — signal lost';
          setTimeout(() => { qi++; renderQuiz(); }, 1300);
        }));
      }
      renderQuiz();
    }

    // Newsletter.
    const subscribe = $('#subscribe');
    if (subscribe) subscribe.addEventListener('submit', e => {
      e.preventDefault();
      const msg = $('#formMsg'); if (msg) msg.textContent = 'Transmission received. Welcome aboard, explorer ✦';
      e.target.reset();
    });

    window.bindTilt($('#discoveries') || document);
    window.bindTilt($('#featured-missions') || document);
  }
  window.renderIcons && window.renderIcons();
})();
