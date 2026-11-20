/* ============================================================
   COSMORA — facts.js
   Cosmic Facts page: random fact generator, animated statistics,
   flip-card fact deck and the cosmic calendar timeline.
   Requires js/main.js (window.COSMORA helpers).
   ============================================================ */
(() => {
  'use strict';
  const { D, $, $$, el, reduce } = window.COSMORA;
  if (!D) return;

  const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  /* ---------- Random fact generator ---------- */
  const fgNext = $('#fgNext');
  if (fgNext && D.cosmicFacts && D.cosmicFacts.length) {
    let order = [], fi = -1, seen = 0;
    function nextFact() {
      if (!order.length || fi >= order.length - 1) { order = shuffle(D.cosmicFacts.map((_, i) => i)); fi = -1; }
      const f = D.cosmicFacts[order[++fi]]; seen++;
      const body = $('#fgBody'); if (!body) return;
      const set = () => {
        const fgCat = $('#fgCat'), fgStat = $('#fgStat'), fgText = $('#fgText'), fgCount = $('#fgCount');
        if (fgCat) fgCat.textContent = f.cat;
        if (fgStat) fgStat.textContent = f.stat;
        if (fgText) fgText.textContent = f.text;
        if (fgCount) fgCount.textContent = `Fact ${seen} · ${D.cosmicFacts.length} in the archive`;
      };
      if (reduce || seen === 1) return set();
      // Blur-out is decorative; the text swap uses a timer so it never depends on frame rate.
      body.animate([{ opacity: 1, transform: 'none', filter: 'blur(0)' }, { opacity: 0, transform: 'translateY(-14px)', filter: 'blur(6px)' }], { duration: 260, easing: 'ease-in' });
      setTimeout(() => {
        set();
        body.animate([{ opacity: 0, transform: 'translateY(14px)', filter: 'blur(6px)' }, { opacity: 1, transform: 'none', filter: 'blur(0)' }], { duration: 520, easing: 'cubic-bezier(.22,1,.36,1)' });
      }, 280);
      const fg = $('#factGen'); if (fg) { fg.classList.remove('pulse'); void fg.offsetWidth; fg.classList.add('pulse'); }
      window.Starfield && Starfield.pulse();
    }
    fgNext.addEventListener('click', nextFact);
    nextFact();
  }

  /* ---------- Astronomical statistics (count-up) ---------- */
  const statsGrid = $('#statsGrid');
  if (statsGrid && D.stats) {
    statsGrid.innerHTML = D.stats.map((s, i) => `<div class="stat-card glass reveal col" style="transition-delay:${(i % 3) * 0.08}s"><strong><span class="grad-text" data-stat="${i}">0</span></strong><span class="unit">${s.unit}</span><p>${s.label}</p></div>`).join('');
    let statsRun = false;
    function runStats() {
      if (statsRun) return; statsRun = true;
      $$('[data-stat]', statsGrid).forEach(e => {
        const s = D.stats[+e.dataset.stat], t0 = performance.now(), dur = 1800;
        const fmt = v => v.toLocaleString('en-US', { minimumFractionDigits: s.dec, maximumFractionDigits: s.dec }) + s.suf;
        if (reduce) return (e.textContent = fmt(s.n));
        (function step(t) { const k = Math.min(1, (t - t0) / dur); e.textContent = fmt(s.n * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(step); })(t0);
      });
    }
    // Run when the stats section scrolls into view.
    const ioStats = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { runStats(); ioStats.disconnect(); } });
    }, { threshold: 0.3 });
    ioStats.observe(statsGrid);
  }

  /* ---------- Flip-card fact deck ---------- */
  const flip = $('#flipGrid');
  if (flip && D.cosmicFacts) {
    shuffle([...D.cosmicFacts]).slice(0, 8).forEach((f, i) => {
      const c = el('button', 'flip-card reveal col'); c.style.transitionDelay = (i % 4) * 0.06 + 's';
      c.setAttribute('aria-label', `Reveal fact about ${f.cat}`);
      c.innerHTML = `<span class="flip-inner"><span class="flip-front glass"><span class="eyebrow">${f.cat}</span><strong class="grad-text">${f.stat}</strong><em>Tap to reveal ↻</em></span><span class="flip-back glass"><span class="eyebrow">${f.cat}</span><p>${f.text}</p></span></span>`;
      c.addEventListener('click', () => c.classList.toggle('flipped'));
      flip.appendChild(c);
    });
  }

  /* ---------- Cosmic calendar ---------- */
  const cc = $('#ccTrack');
  if (cc) {
    const events = [['13.8 B yrs ago', 'The Big Bang', 'Space, time and all matter burst into existence.'], ['13.6 B', 'First stars ignite', 'Cosmic dawn — the universe lights up for the first time.'], ['13.2 B', 'Milky Way forms', 'Our galaxy begins assembling from gas and dark matter.'], ['4.6 B', 'Sun is born', 'A cloud collapses into our star and its planets.'], ['3.8 B', 'Life on Earth', 'The first microbial life appears in ancient oceans.'], ['300 K', 'Humans arrive', 'Homo sapiens look up — and begin to wonder.']];
    cc.innerHTML = events.map(([y, t, d]) => `<div class="cc-item"><b>${y}</b><strong>${t}</strong><p>${d}</p></div>`).join('');
  }

  window.observeReveals(document.body);
  window.renderIcons && window.renderIcons();
})();
