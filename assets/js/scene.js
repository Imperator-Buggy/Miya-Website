/* ==========================================================================
   Miya's Cookies — living pixel scenes
   --------------------------------------------------------------------------
   Small animated canvases sprinkled through the site: the bakery under a
   dawn or night sky with a smoking chimney, swaying blossom trees, lanterns,
   mushrooms, birds by day and fireflies by night, drifting petals. Time of
   day follows the clock in Abu Dhabi, so the site looks different at midnight.

   Usage:  <canvas class="pixel-scene" data-scene="hero|strip|footer"></canvas>
   Each canvas renders at a low logical resolution and is upscaled crisp.
   ========================================================================== */
(function () {
  'use strict';
  const PAL = {
    K: '#2B211C', k: '#4A3A30', W: '#FFF9F0', w: '#DFD2C1', T: '#D8AE7E', t: '#B58758', C: '#C68946', c: '#E2AC68',
    d: '#966030', N: '#3A2014', G: '#F3C94C', g: '#C69A28', R: '#D6544F', p: '#F0B0BE', P: '#E99E9C', B: '#688ABE',
    M: '#8CC6AA', L: '#A896C9', e: '#785C4A', X: '#FFFFFF',
  };
  const DAY = { sky: ['#A896C9', '#C9A4BE', '#E9B7B0', '#F5CDA8', '#FBE0C2', '#FFF1DC'], hillFar: '#B7A6D2', hillMid: '#8CC6AA', hillMidEdge: '#6FA98C', meadow: '#8FC48C', meadow2: '#7DB67F', deep: '#5C8F73', light: '#9DCF9A' };
  const NIGHT = { sky: ['#16122B', '#231C44', '#2E2656', '#3A3168', '#4A3F7A', '#5B4F8C'], hillFar: '#3E3566', hillMid: '#2F4D46', hillMidEdge: '#3D6157', meadow: '#2E4A3D', meadow2: '#28422F', deep: '#1E3A2C', light: '#3F6B52' };
  const hash = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function abuDhabiHour() {
    try { return Number(new Intl.DateTimeFormat('en-GB', { hour: 'numeric', hour12: false, timeZone: 'Asia/Dubai' }).format(new Date())); } catch (e) { return new Date().getHours(); }
  }

  class Scene {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d', { alpha: false });
      this.kind = canvas.dataset.scene || 'hero';
      const h = abuDhabiHour();
      this.night = canvas.dataset.time === 'night' || (canvas.dataset.time !== 'day' && (h >= 19 || h < 5));
      this.C = this.night ? NIGHT : DAY;
      this.t = 0; this.last = performance.now();
      this.fireflies = Array.from({ length: 14 }, (_, i) => ({ x: hash(i) , y: hash(i + 9), p: hash(i + 3) * 6 }));
      this.petals = Array.from({ length: 10 }, (_, i) => ({ x: hash(i + 20), y: hash(i + 30), s: 0.6 + hash(i + 40) }));
      this.fit();
      new ResizeObserver(() => this.fit()).observe(canvas.parentElement || canvas);
      this.visible = true;
      new IntersectionObserver((es) => { this.visible = es[0].isIntersecting; }).observe(canvas);
      requestAnimationFrame((n) => this.frame(n));
    }
    fit() {
      const r = this.canvas.getBoundingClientRect();
      const vw = Math.max(64, Math.round(r.width || this.canvas.parentElement.clientWidth)), vh = Math.max(32, Math.round(r.height || 120));
      const target = this.kind === 'strip' ? 36 : 120; // logical height
      this.S = Math.max(2, Math.round(vh / target));
      this.W = Math.ceil(vw / this.S); this.H = Math.ceil(vh / this.S);
      this.canvas.width = this.W; this.canvas.height = this.H;
      this.ctx.imageSmoothingEnabled = false;
    }
    rect(x, y, w, h, c) { this.ctx.fillStyle = c; this.ctx.fillRect(x, y, w, h); }
    px(x, y, c) { this.rect(x, y, 1, 1, c); }
    disc(cx, cy, r, c) { for (let y = -r; y <= r; y++) { const h = Math.floor(Math.sqrt(r * r - y * y)); this.rect(cx - h, cy + y, h * 2 + 1, 1, c); } }

    tree(x, baseY, size, sway, blossom) {
      const c1 = blossom ? (this.night ? '#8C5C78' : PAL.p) : this.C.deep, c2 = blossom ? (this.night ? '#A87590' : '#F7C9D4') : this.C.light;
      const trunkH = 4 + size * 2;
      this.rect(x, baseY - trunkH, 2, trunkH, this.night ? '#4A3A30' : PAL.e);
      const cy = baseY - trunkH - 3 * size, sx = Math.round(sway);
      this.disc(x + 1 + sx, cy, 3 * size + 1, c1);
      this.disc(x + sx - 1, cy - 1, 2 * size + 1, c2);
      this.px(x + sx - 1, cy - 2 * size, PAL.W);
      if (blossom && !this.night) this.px(x + sx + 2, cy + size, PAL.R);
    }
    mushroom(x, y) { this.rect(x + 1, y - 2, 2, 2, PAL.W); this.rect(x, y - 4, 4, 2, PAL.R); this.px(x + 1, y - 4, PAL.X); this.px(x + 3, y - 3, PAL.X); }
    lantern(x, y) {
      this.rect(x + 1, y - 14, 1, 14, PAL.k); this.rect(x, y - 16, 3, 3, PAL.K);
      this.px(x + 1, y - 15, this.night ? PAL.G : PAL.c);
      if (this.night) { const a = 0.18 + Math.sin(this.t * 3 + x) * 0.05; this.ctx.fillStyle = `rgba(243,201,76,${a})`; this.disc(x + 1, y - 15, 6, this.ctx.fillStyle); }
    }
    bakery(x, baseY) {
      const y = baseY - 44;
      // walls + roof
      this.rect(x, y + 18, 60, 26, PAL.T); this.rect(x, y + 43, 60, 1, PAL.k);
      for (let i = 0; i < 4; i++) this.rect(x - 2 + i * 2, y + 4 + i * 4, 64 - i * 4, 4, i % 2 ? PAL.K : PAL.R);
      this.rect(x - 2, y + 17, 64, 2, PAL.R);
      // chimney + smoke
      this.rect(x + 46, y - 4, 6, 12, PAL.k); this.rect(x + 45, y - 5, 8, 2, PAL.K);
      for (let i = 0; i < 4; i++) {
        const u = ((this.t * 0.35) + i * 0.25) % 1;
        const r = 1 + Math.round(u * 3), sx = Math.round(Math.sin(u * 5 + i) * 3);
        this.ctx.fillStyle = `rgba(255,249,240,${0.85 - u * 0.8})`;
        this.disc(x + 49 + sx + Math.round(u * 6), y - 6 - Math.round(u * 20), r, this.ctx.fillStyle);
      }
      // door, windows, sign
      this.rect(x + 26, y + 30, 8, 14, PAL.K); this.rect(x + 27, y + 31, 6, 13, PAL.e); this.px(x + 32, y + 38, PAL.G);
      [[6, 24], [46, 24]].forEach(([dx, dy]) => { this.rect(x + dx, y + dy, 8, 8, PAL.K); this.rect(x + dx + 1, y + dy + 1, 6, 6, this.night ? PAL.G : PAL.W); this.rect(x + dx - 1, y + dy + 8, 10, 1, PAL.e); this.px(x + dx + 1, y + dy + 7, PAL.R); this.px(x + dx + 6, y + dy + 7, PAL.p); });
      this.rect(x + 18, y + 20, 24, 7, PAL.W); this.rect(x + 18, y + 20, 24, 1, PAL.K); this.rect(x + 18, y + 26, 24, 1, PAL.K);
      // cookie badge on the sign
      this.disc(x + 23, y + 23, 2, PAL.c); this.px(x + 22, y + 23, PAL.N); this.px(x + 24, y + 22, PAL.N);
      this.ctx.fillStyle = PAL.K; this.ctx.font = '5px "Press Start 2P", monospace'; this.ctx.fillText('MIYA', x + 27, y + 25);
      if (this.night) { this.ctx.fillStyle = 'rgba(243,201,76,0.12)'; this.disc(x + 10, y + 28, 9, this.ctx.fillStyle); this.disc(x + 50, y + 28, 9, this.ctx.fillStyle); }
    }
    truck(x, y) {
      this.rect(x + 2, y + 6, 26, 8, PAL.W); this.rect(x + 2, y + 6, 26, 1, PAL.K); this.rect(x + 2, y + 9, 26, 1, PAL.R);
      this.rect(x + 22, y + 1, 8, 6, PAL.K); this.rect(x + 23, y + 2, 6, 4, PAL.B);
      this.rect(x + 2, y + 13, 30, 1, PAL.K); this.rect(x + 2, y + 5, 1, 9, PAL.K); this.rect(x + 29, y + 6, 1, 8, PAL.K);
      this.disc(x + 7, y + 14, 2, PAL.K); this.disc(x + 25, y + 14, 2, PAL.K); this.px(x + 7, y + 14, PAL.W); this.px(x + 25, y + 14, PAL.W);
      this.rect(x + 8, y + 3, 3, 3, PAL.c); this.rect(x + 12, y + 2, 3, 4, PAL.c); this.px(x + 9, y + 4, PAL.N);
    }

    frame(now) {
      const dt = Math.min(0.05, (now - this.last) / 1000); this.last = now;
      if (!reduced) this.t += dt;
      if (this.visible) this.draw();
      requestAnimationFrame((n) => this.frame(n));
    }
    draw() {
      const { W, H, C, t } = this;
      const strip = this.kind === 'strip';
      const horizon = strip ? 0 : Math.round(H * 0.55), ground = strip ? H - 6 : Math.round(H * 0.84);
      if (!strip) {
        const bh = horizon / C.sky.length;
        C.sky.forEach((c, i) => this.rect(0, Math.floor(i * bh), W, Math.ceil(bh) + 1, c));
        if (this.night) {
          for (let i = 0; i < 30; i++) { const tw = Math.sin(t * 2 + i) > 0.3; this.px(Math.floor(hash(i) * W), Math.floor(hash(i + 50) * horizon * 0.9), tw ? PAL.W : PAL.L); }
          this.disc(Math.round(W * 0.8), 14, 7, '#FFF1DC'); this.disc(Math.round(W * 0.8) + 3, 12, 6, C.sky[1]);
        } else {
          this.disc(Math.round(W * 0.8), Math.round(horizon * 0.45), 7, '#FBE7B2'); this.disc(Math.round(W * 0.8), Math.round(horizon * 0.45), 5, PAL.G);
          for (let i = 0; i < 3; i++) { const cx = Math.round(((i * 0.37 + t * 0.012) % 1.2) * W) - 20, cy = 8 + i * 9; this.disc(cx, cy, 3, PAL.W); this.disc(cx + 5, cy - 1, 4, PAL.W); this.disc(cx + 10, cy + 1, 3, PAL.W); }
          for (let i = 0; i < 2; i++) { const bx = Math.round(((0.2 + i * 0.3 - t * 0.02) % 1 + 1) % 1 * W), by = 10 + i * 7 + Math.round(Math.sin(t * 2 + i) * 2), f = Math.floor(t * 6 + i) % 2; this.px(bx, by, PAL.k); this.px(bx + 2, by, PAL.k); this.px(bx + 1, by + (f ? 1 : -1), PAL.k); }
        }
        for (let x = 0; x < W; x++) { const h = Math.round(Math.sin(x * 0.05 + 1.7) * 7 + Math.sin(x * 0.11) * 3) + 12; this.rect(x, horizon - h, 1, h + 1, C.hillFar); }
        for (let x = 0; x < W; x++) { const h = Math.round(Math.sin(x * 0.08 + 4) * 5 + Math.sin(x * 0.19 + 1) * 2) + 6; this.rect(x, horizon - h, 1, h + 1, C.hillMid); this.px(x, horizon - h, C.hillMidEdge); }
      }
      // meadow
      this.rect(0, horizon, W, H - horizon, C.meadow);
      for (let i = 0; i < W * (H - horizon) / 40; i++) { const x = Math.floor(hash(i * 3) * W), y = horizon + Math.floor(hash(i * 5) * (H - horizon)); this.px(x, y, C.meadow2); if (hash(i * 7) < 0.15 && !strip) this.px(x, y - 1, [PAL.R, PAL.p, PAL.G, PAL.W][i % 4]); }
      // path + building (hero/footer only)
      if (!strip) {
        this.rect(0, ground + 2, W, 5, this.night ? '#4A3A30' : PAL.T);
        for (let x = -((Math.round(t * 0) % 10)); x < W; x += 10) this.rect(x, ground + 4, 5, 1, this.night ? '#5C4A3E' : PAL.t);
        const bx = Math.round(W / 2 - 30);
        this.bakery(bx, ground + 2);
        this.truck(bx + 66, ground - 12);
        this.lantern(bx - 10, ground + 2); this.lantern(bx + 64, ground + 2);
      }
      // trees: back row then front row, with sway
      const rowY = strip ? H - 6 : ground - 2;
      const spacing = strip ? 22 : 30;
      for (let i = -1; i < W / spacing + 2; i++) {
        const x = Math.round(i * spacing + hash(i * 11) * 12), size = 1 + Math.floor(hash(i * 13) * 2);
        const nearBuilding = !strip && Math.abs(x - W / 2) < 52;
        const sway = Math.sin(t * 1.2 + i) * 1.2;
        if (!nearBuilding) this.tree(x, rowY - (strip ? 0 : 10 + Math.round(hash(i * 17) * 8)), size, sway, hash(i * 19) < 0.45);
        if (hash(i * 23) < 0.35) this.mushroom(x + 8, rowY + 4);
      }
      // petals / fireflies
      if (this.night) {
        this.fireflies.forEach((f, i) => { const on = Math.sin(t * 2.5 + f.p) > 0.2; if (!on) return; const x = Math.round((f.x + Math.sin(t * 0.3 + i) * 0.03) * W), y = Math.round(horizon * 0.6 + f.y * (H - horizon * 0.6) - Math.sin(t + i) * 3); this.px(x, y, PAL.G); this.ctx.fillStyle = 'rgba(243,201,76,0.25)'; this.disc(x, y, 2, this.ctx.fillStyle); });
      } else {
        this.petals.forEach((p, i) => { const y = ((p.y + t * 0.05 * p.s) % 1) * H, x = (p.x + Math.sin(t * 0.8 + i) * 0.02) * W; this.px(Math.round(x), Math.round(y), PAL.p); });
      }
    }
  }

  const init = () => document.querySelectorAll('canvas.pixel-scene:not([data-ready])').forEach((c) => { c.dataset.ready = '1'; new Scene(c); });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  window.MiyaScene = { init };
})();
