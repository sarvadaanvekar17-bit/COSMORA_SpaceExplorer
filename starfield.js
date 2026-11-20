(() => {
  const canvas = document.getElementById('starfield');
  const ctx = canvas.getContext('2d');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let w, h, dpr, stars = [], dust = [], shooters = [];
  let mx = 0, my = 0, tx = 0, ty = 0, scrollY = 0;
  let warp = 0, warpTarget = 0;
  const palette = ['#ffffff', '#E2C5FF', '#cfe9ff', '#9D7BFF', '#42C6FF'];

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.width = innerWidth * dpr;
    h = canvas.height = innerHeight * dpr;
    canvas.style.width = innerWidth + 'px';
    canvas.style.height = innerHeight + 'px';
    const count = Math.min(Math.floor((innerWidth * innerHeight) / 2600), 650);
    stars = Array.from({ length: count }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      z: Math.random() * 0.9 + 0.1,
      r: Math.random() * 1.1 + 0.2,
      t: Math.random() * Math.PI * 2,
      s: Math.random() * 0.02 + 0.005,
      c: palette[Math.random() < 0.82 ? 0 : 1 + Math.floor(Math.random() * 4)]
    }));
    const dcount = innerWidth < 700 ? 18 : 40;
    dust = Array.from({ length: dcount }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      r: (Math.random() * 2 + 0.6) * dpr,
      vx: (Math.random() - 0.5) * 0.15 * dpr,
      vy: (-Math.random() * 0.25 - 0.05) * dpr,
      a: Math.random() * 0.4 + 0.1,
      hue: Math.random() < 0.5 ? 258 : 198
    }));
  }

  function spawnShooter() {
    if (reduce || document.hidden) return;
    shooters.push({ x: Math.random() * w * 0.8 + w * 0.2, y: Math.random() * h * 0.4, vx: -(6 + Math.random() * 6) * dpr, vy: (2 + Math.random() * 3) * dpr, life: 1 });
  }

  function frame() {
    tx += (mx - tx) * 0.04; ty += (my - ty) * 0.04;
    warp += (warpTarget - warp) * 0.05;
    ctx.clearRect(0, 0, w, h);
    const cx = w / 2, cy = h / 2;

    for (const s of stars) {
      s.t += s.s;
      const tw = reduce ? 0.8 : 0.55 + Math.sin(s.t) * 0.45;
      let px = s.x + tx * s.z * 30 * dpr;
      let py = s.y + ty * s.z * 30 * dpr - (scrollY * s.z * 0.15 * dpr) % h;
      if (py < 0) py += h;
      if (warp > 0.01) {
        const dx = s.x - cx, dy = s.y - cy;
        s.x += dx * 0.02 * warp * s.z; s.y += dy * 0.02 * warp * s.z;
        if (s.x < 0 || s.x > w || s.y < 0 || s.y > h) { s.x = cx + (Math.random() - 0.5) * 80 * dpr; s.y = cy + (Math.random() - 0.5) * 80 * dpr; }
        ctx.strokeStyle = s.c; ctx.globalAlpha = tw;
        ctx.lineWidth = s.r * dpr;
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px - dx * 0.06 * warp * s.z, py - dy * 0.06 * warp * s.z); ctx.stroke();
      } else {
        ctx.globalAlpha = tw * (0.4 + s.z * 0.6);
        ctx.fillStyle = s.c;
        ctx.beginPath(); ctx.arc(px, py, s.r * dpr * (0.6 + s.z * 0.6), 0, 6.283); ctx.fill();
        if (s.r > 1.1 && s.z > 0.75) {
          ctx.globalAlpha = tw * 0.15;
          ctx.beginPath(); ctx.arc(px, py, s.r * dpr * 4, 0, 6.283); ctx.fill();
        }
      }
    }

    for (const d of dust) {
      if (!reduce) { d.x += d.vx; d.y += d.vy; }
      if (d.y < -10) { d.y = h + 10; d.x = Math.random() * w; }
      if (d.x < -10) d.x = w + 10; if (d.x > w + 10) d.x = -10;
      const g = ctx.createRadialGradient(d.x, d.y, 0, d.x, d.y, d.r * 3);
      g.addColorStop(0, `hsla(${d.hue},100%,80%,${d.a})`);
      g.addColorStop(1, `hsla(${d.hue},100%,70%,0)`);
      ctx.globalAlpha = 1; ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(d.x, d.y, d.r * 3, 0, 6.283); ctx.fill();
    }

    for (let i = shooters.length - 1; i >= 0; i--) {
      const s = shooters[i];
      s.x += s.vx; s.y += s.vy; s.life -= 0.012;
      const g = ctx.createLinearGradient(s.x, s.y, s.x - s.vx * 14, s.y - s.vy * 14);
      g.addColorStop(0, `rgba(226,197,255,${s.life})`);
      g.addColorStop(1, 'rgba(66,198,255,0)');
      ctx.globalAlpha = 1; ctx.strokeStyle = g; ctx.lineWidth = 1.4 * dpr;
      ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(s.x - s.vx * 14, s.y - s.vy * 14); ctx.stroke();
      if (s.life <= 0) shooters.splice(i, 1);
    }
    ctx.globalAlpha = 1;
    requestAnimationFrame(frame);
  }

  addEventListener('resize', resize);
  addEventListener('mousemove', e => { mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5; }, { passive: true });
  addEventListener('scroll', () => { scrollY = window.scrollY; }, { passive: true });
  resize();
  requestAnimationFrame(frame);
  setInterval(() => { if (Math.random() < 0.6) spawnShooter(); }, 3200);

  window.Starfield = {
    warp(on) { warpTarget = on ? 1 : 0; },
    pulse() { warpTarget = 1; setTimeout(() => (warpTarget = 0), 650); }
  };
})();
