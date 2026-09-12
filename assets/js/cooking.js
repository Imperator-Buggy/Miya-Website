/* ==========================================================================
   Cooking Miya — a Cooking-Mama-style kitchen game
   --------------------------------------------------------------------------
   Every recipe (level) is a chain of hands-on stages: crack eggs on the beat,
   cream butter with circular stirs, sift flour by shaking, fold with swipe
   sequences, scoop dough onto the tray, fill cookies with Nutella, salt them
   just right, bake to golden, pour milk, box it up. Each stage scores 0–100;
   the recipe average earns 1–3 stars, stars unlock recipes, and a final
   "Rush Hour" mode chains random stages with lives and a combo multiplier.

   Stage engine: each stage object implements
     init(), update(dt), draw(), down(x,y), move(x,y), up(x,y), result()
   and calls finish(score) when it is done or when the timer runs out.
   Canvas is low-res pixel art (16×16 props + 32×32 Miya from the pack).
   ========================================================================== */
(function () {
  'use strict';
  const PAL = {
    K: '#2B211C', k: '#4A3A30', S: '#F5CDA8', s: '#D6A67C', W: '#FFF9F0', w: '#DFD2C1', T: '#D8AE7E', t: '#B58758',
    C: '#C68946', c: '#E2AC68', d: '#966030', N: '#3A2014', n: '#633821', X: '#FFFFFF', G: '#F3C94C', g: '#C69A28',
    R: '#D6544F', p: '#F0B0BE', P: '#E99E9C', B: '#688ABE', M: '#8CC6AA', L: '#A896C9', e: '#785C4A', H: '#1A1414',
  };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rnd = (a, b) => a + Math.random() * (b - a);
  const $ = (s) => document.querySelector(s);
  const OUTFITS = ['classic', 'kraft', 'midnight', 'sprinkle', 'nutella', 'barista'];
  const POSES = { idle: 0, wave: 1, tray: 2, mix: 3, cheer: 4, run: 5, hero: 6, sleepy: 7 };
  const PROPS = { signature: [0, 0], bitten: [1, 0], split: [2, 0], dough: [3, 0], golden: [4, 0], burnt: [5, 0], crumbs: [6, 0], nutella: [0, 1], salt: [1, 1], milk: [2, 1], tray: [3, 1], heart: [4, 1], star: [5, 1], hat: [6, 1] };

  /* ---------- canvas ---------------------------------------------------- */
  const canvas = $('#ccanvas'); if (!canvas) return;
  const ctx = canvas.getContext('2d', { alpha: false });
  let W = 160, H = 200, SCALE = 3;
  function fit() {
    const vw = canvas.parentElement.clientWidth, vh = canvas.parentElement.clientHeight;
    SCALE = clamp(Math.round(Math.min(vw / 170, vh / 200)), 2, 6);
    W = Math.floor(vw / SCALE); H = Math.floor(vh / SCALE);
    canvas.width = W; canvas.height = H; canvas.style.width = W * SCALE + 'px'; canvas.style.height = H * SCALE + 'px';
    ctx.imageSmoothingEnabled = false;
  }
  window.addEventListener('resize', fit);
  const sheets = {};
  const loadImg = (k, src) => new Promise((r) => { const i = new Image(); i.onload = () => { sheets[k] = i; r(); }; i.onerror = r; i.src = src; });

  const px = (x, y, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, 1, 1); };
  const rect = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
  function disc(cx, cy, r, c) { cx = Math.round(cx); cy = Math.round(cy); for (let y = -r; y <= r; y++) { const h = Math.floor(Math.sqrt(r * r - y * y)); rect(cx - h, cy + y, h * 2 + 1, 1, c); } }
  function ellipse(cx, cy, rx, ry, c) { cx = Math.round(cx); cy = Math.round(cy); for (let y = -ry; y <= ry; y++) { const h = Math.floor(rx * Math.sqrt(1 - (y * y) / (ry * ry))); rect(cx - h, cy + y, h * 2 + 1, 1, c); } }
  function prop(name, x, y, size) { const im = sheets.props; if (!im) return; const [c, r] = PROPS[name]; size = size || 16; ctx.drawImage(im, c * 16, r * 16, 16, 16, Math.round(x), Math.round(y), size, size); }
  function miya(pose, x, y, outfit) { const im = sheets.miya; if (!im) return; ctx.drawImage(im, POSES[pose] * 32, OUTFITS.indexOf(outfit || S.outfit) * 32, 32, 32, Math.round(x), Math.round(y), 32, 32); }
  function text(str, x, y, c, size, align) { ctx.fillStyle = c || PAL.K; ctx.font = `${size || 6}px "Press Start 2P", monospace`; ctx.textAlign = align || 'left'; ctx.fillText(str, Math.round(x), Math.round(y)); ctx.textAlign = 'left'; }
  function panel(x, y, w, h, c) { rect(x, y, w, h, c || PAL.W); rect(x, y, w, 1, PAL.K); rect(x, y + h - 1, w, 1, PAL.K); rect(x, y, 1, h, PAL.K); rect(x + w - 1, y, 1, h, PAL.K); }
  function bar(x, y, w, h, v, c) { panel(x, y, w, h, PAL.w); rect(x + 1, y + 1, Math.round((w - 2) * clamp(v, 0, 1)), h - 2, c || PAL.G); }

  /* ---------- sound ------------------------------------------------------ */
  let ac = null;
  function blip(f, d, type, vol) { try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); const o = ac.createOscillator(), g = ac.createGain(); o.type = type || 'square'; o.frequency.value = f; g.gain.setValueAtTime(vol || 0.05, ac.currentTime); g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + (d || 0.1)); o.connect(g).connect(ac.destination); o.start(); o.stop(ac.currentTime + (d || 0.1)); } catch (e) {} }
  const sfx = { tap: () => blip(700, 0.06), good: () => { blip(880, 0.08); setTimeout(() => blip(1320, 0.1), 60); }, great: () => { [660, 880, 1100, 1320].forEach((f, i) => setTimeout(() => blip(f, 0.12, 'triangle'), i * 70)); }, bad: () => blip(150, 0.25, 'sawtooth'), tick: () => blip(1000, 0.03, 'sine', 0.03), pour: () => blip(300, 0.05, 'sine', 0.03) };

  /* ---------- save --------------------------------------------------------- */
  const SAVE_KEY = 'miya_cooking_v1';
  let S = { best: {}, outfit: 'nutella', rushBest: 0 };
  try { S = Object.assign(S, JSON.parse(localStorage.getItem(SAVE_KEY)) || {}); } catch (e) {}
  const save = () => { try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) {} };

  /* ---------- pointer (logical coords) --------------------------------------- */
  const ptr = { x: 0, y: 0, down: false };
  let current = null; // active stage
  function toLogical(e) { const r = canvas.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * W, (e.clientY - r.top) / r.height * H]; }
  canvas.addEventListener('pointerdown', (e) => { canvas.setPointerCapture(e.pointerId); const [x, y] = toLogical(e); ptr.x = x; ptr.y = y; ptr.down = true; if (current && current.down && phase === 'play') current.down(x, y); e.preventDefault(); });
  canvas.addEventListener('pointermove', (e) => { const [x, y] = toLogical(e); const dx = x - ptr.x, dy = y - ptr.y; ptr.x = x; ptr.y = y; if (current && current.move && ptr.down && phase === 'play') current.move(x, y, dx, dy); });
  const upH = (e) => { if (!ptr.down) return; ptr.down = false; const [x, y] = toLogical(e); if (current && current.up && phase === 'play') current.up(x, y); };
  canvas.addEventListener('pointerup', upH); canvas.addEventListener('pointercancel', upH);
  canvas.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });

  /* ---------- stage engine ------------------------------------------------- */
  let phase = 'menu'; // menu | intro | play | result | recipeDone
  let timer = 0, timeLimit = 0, stageIdx = 0, recipe = null, scores = [], diff = 1, introT = 0, resultT = 0, lastScore = 0, animT = 0, phaseAt = 0;
  let rush = null; // { lives, combo, score, count }

  function finish(score) {
    if (phase !== 'play') return;
    score = clamp(Math.round(score), 0, 100);
    lastScore = score; scores.push(score); phase = 'result'; resultT = 0; phaseAt = performance.now();
    if (score >= 90) sfx.great(); else if (score >= 60) sfx.good(); else sfx.bad();
    if (rush) { rush.count++; if (score >= 60) { rush.combo++; rush.score += Math.round(score * (1 + rush.combo * 0.1)); } else { rush.combo = 0; rush.lives--; } }
  }

  // Shared cookie drawing: dough ball / cookie with optional fill + salt
  function drawDough(x, y, r, fill, salt) { disc(x, y, r, PAL.c); disc(x, y - 1, r - 1, '#EDBD7C'); if (fill) disc(x, y, Math.max(1, r - 3), PAL.N); for (let i = 0; i < (salt || 0); i++) px(x - r + 2 + ((i * 7) % (r * 2 - 3)), y - r + 2 + ((i * 5) % (r * 2 - 3)), PAL.X); }
  function drawBowl(x, y, w, contents) {
    const r = w / 2;
    ellipse(x, y + 13, r + 2, 3, 'rgba(43,33,28,0.18)');          // shadow on the counter
    ellipse(x, y + 7, r, 7, PAL.K); ellipse(x, y + 6, r - 1, 6, PAL.B); rect(x - r + 1, y, w - 2, 7, PAL.B);
    rect(x - r + 2, y + 2, 2, 6, '#8FB0DE');                         // rim highlight
    rect(x - r + 1, y + 5, w - 2, 2, PAL.W);                          // stripe
    ellipse(x, y + 11, Math.round(r * 0.5), 2, PAL.K);                // foot
    ellipse(x, y, r, 4, PAL.K); ellipse(x, y, r - 1, 3, contents || '#5A7DB0');
    if (contents) { ellipse(x + 3, y - 1, Math.max(2, r * 0.3), 1, 'rgba(255,255,255,0.35)'); }
  }
  function drawCounter() { rect(0, H * 0.9, W, H * 0.1, PAL.T); rect(0, H * 0.9, W, 1, PAL.K); for (let x = 0; x < W; x += 12) rect(x, H * 0.9 + 4, 1, H * 0.1, PAL.t); }
  function drawMiyaAtCounter(pose) { rect(W - 40, H * 0.9 - 2, 32, 4, 'rgba(43,33,28,0.2)'); miya(pose, W - 40, H * 0.9 - 30); }

  const STAGES = {
    /* Crack eggs: an egg swings; tap when it is over the bowl. n eggs. */
    crack: (n) => ({
      title: 'Crack the eggs', hint: 'Tap when the egg is over the bowl', time: 9 + n * 2,
      init() { this.eggs = 0; this.t = 0; this.hits = []; this.speed = 1.6 * diff; this.n = n; this.msg = ''; },
      update(dt) { this.t += dt; },
      pos() { return W / 2 + Math.sin(this.t * this.speed) * (W * 0.34); },
      down() {
        const dxv = Math.abs(this.pos() - W / 2);
        const q = dxv < 6 ? 100 : dxv < 12 ? 75 : dxv < 20 ? 45 : 10;
        this.hits.push(q); this.eggs++; this.msg = q >= 90 ? 'Perfect!' : q >= 60 ? 'Good' : 'Shell in the bowl…';
        if (q >= 60) sfx.good(); else sfx.bad();
        if (this.eggs >= this.n) finish(this.hits.reduce((a, b) => a + b, 0) / this.n);
      },
      draw() {
        drawBowl(W / 2, H * 0.62, 56, this.eggs ? PAL.G : null);
        const ex = this.pos(), ey = H * 0.35;
        rect(W / 2 - 3, H * 0.52, 6, 1, PAL.k);
        ellipse(ex, ey, 5, 7, PAL.W); ellipse(ex - 1, ey - 2, 2, 3, '#FFFFFF'); px(ex + 2, ey + 2, PAL.w);
        for (let i = 0; i < this.n; i++) prop(i < this.eggs ? 'star' : 'crumbs', 8 + i * 14, 8, 12);
        text(this.msg, W / 2, H * 0.82, PAL.K, 6, 'center');
      },
    }),
    /* Cream: drag in circles around the bowl to fill the meter. */
    cream: () => ({
      title: 'Cream butter & sugar', hint: 'Stir in circles', time: 10,
      init() { this.v = 0; this.ang = null; this.spin = 0; },
      update(dt) { this.v = Math.max(0, this.v - dt * 0.02 * diff); this.spin += dt; },
      move(x, y) { const a = Math.atan2(y - H * 0.55, x - W / 2); if (this.ang !== null) { let d = a - this.ang; if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; this.v += Math.abs(d) * 0.045 / diff; if (Math.abs(d) > 0.3) sfx.tick(); } this.ang = a; if (this.v >= 1) finish(100 - (timer / timeLimit) * 30); },
      up() { this.ang = null; },
      draw() {
        miya('mix', W / 2 - 16 + 40, H * 0.16);
        drawBowl(W / 2, H * 0.55, 60, this.v < 0.5 ? PAL.c : this.v < 0.9 ? '#F5D48F' : PAL.W);
        const a = this.ang ?? this.spin * 2; const sx = W / 2 + Math.cos(a) * 14, sy = H * 0.55 + Math.sin(a) * 3;
        rect(sx - 1, sy - 22, 2, 24, PAL.e); ellipse(sx, sy, 4, 3, PAL.w);
        bar(W / 2 - 40, H * 0.8, 80, 8, this.v);
        text('creamy', W / 2, H * 0.9, PAL.K, 6, 'center');
      },
    }),
    /* Sift: shake left/right fast (drag reversals). */
    sift: () => ({
      title: 'Sift the flour', hint: 'Shake left and right, fast!', time: 8,
      init() { this.v = 0; this.dir = 0; this.lastx = 0; this.dust = []; },
      update(dt) { this.v = Math.max(0, this.v - dt * 0.05 * diff); this.dust = this.dust.filter((d) => (d.y += 25 * dt) < H * 0.7); },
      move(x, y, dx) { const d = Math.sign(dx); if (d && d !== this.dir && Math.abs(dx) > 1) { this.dir = d; this.v += 0.07 / diff; sfx.tick(); for (let i = 0; i < 3; i++) this.dust.push({ x: W / 2 + rnd(-14, 14), y: H * 0.42 }); if (this.v >= 1) finish(100 - (timer / timeLimit) * 25); } },
      draw() {
        drawBowl(W / 2, H * 0.62, 56, this.v > 0.3 ? PAL.W : null);
        const sx = W / 2 + (this.dir * 3 * (ptr.down ? 1 : 0));
        rect(sx - 16, H * 0.3, 32, 10, PAL.w); rect(sx - 16, H * 0.3, 32, 1, PAL.K); rect(sx - 16, H * 0.39, 32, 1, PAL.k); rect(sx + 16, H * 0.33, 10, 3, PAL.e);
        for (let i = 0; i < 6; i++) px(sx - 12 + i * 5, H * 0.36, PAL.K);
        this.dust.forEach((d) => px(Math.round(d.x), Math.round(d.y), PAL.W));
        bar(W / 2 - 40, H * 0.8, 80, 8, this.v);
      },
    }),
    /* Fold: swipe in the direction shown, sequence of n. */
    fold: (n) => ({
      title: 'Fold in the chocolate', hint: 'Swipe the arrows', time: 6 + n * 1.5,
      init() { this.seq = Array.from({ length: n }, () => Math.floor(Math.random() * 4)); this.i = 0; this.miss = 0; this.sx = 0; this.sy = 0; this.flash = 0; },
      update(dt) { this.flash = Math.max(0, this.flash - dt); },
      down(x, y) { this.sx = x; this.sy = y; },
      up(x, y) { const dx = x - this.sx, dy = y - this.sy; if (Math.hypot(dx, dy) < 8) return; const d = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 1 : 3) : (dy > 0 ? 2 : 0); if (d === this.seq[this.i]) { this.i++; sfx.good(); this.flash = 0.2; if (this.i >= n) finish(100 - this.miss * 15 - (timer / timeLimit) * 15); } else { this.miss++; sfx.bad(); } },
      draw() {
        drawBowl(W / 2, H * 0.6, 60, '#E8C48A'); for (let i = 0; i < 5; i++) px(W / 2 - 12 + i * 6, H * 0.6 - 1 + (i % 2), PAL.N);
        const arrows = ['↑', '→', '↓', '←'];
        this.seq.forEach((d, i) => { const x = W / 2 - (n * 7) + i * 14; panel(x, H * 0.22, 12, 12, i < this.i ? PAL.G : i === this.i && this.flash ? PAL.M : PAL.W); text(arrows[d], x + 6, H * 0.22 + 9, PAL.K, 6, 'center'); });
        text('misses: ' + this.miss, W / 2, H * 0.88, PAL.k, 5, 'center');
      },
    }),
    /* Scoop: drag dough balls from the bowl into tray slots. */
    scoop: (n) => ({
      title: 'Scoop the dough', hint: 'Drag scoops onto the tray', time: 8 + n * 1.3,
      init() { this.cols = Math.min(4, n); this.rows = Math.ceil(n / this.cols); this.slots = Array.from({ length: n }, (_, i) => ({ x: W / 2 - (this.cols - 1) * 9 + (i % this.cols) * 18, y: H * 0.62 + Math.floor(i / this.cols) * 16, filled: false })); this.drag = null; this.placed = 0; this.sloppy = 0; },
      update() {},
      down(x, y) { if (Math.hypot(x - W / 2, y - H * 0.28) < 34) this.drag = { x, y }; },
      move(x, y) { if (this.drag) { this.drag.x = x; this.drag.y = y; } },
      up(x, y) { if (!this.drag) return; this.drag = null; const s = this.slots.find((s) => !s.filled && Math.hypot(s.x - x, s.y - y) < 10); if (s) { s.filled = true; this.placed++; sfx.good(); if (this.placed >= n) finish(100 - this.sloppy * 6 - (timer / timeLimit) * 20); } else { this.sloppy++; sfx.bad(); } },
      draw() {
        drawBowl(W / 2, H * 0.28, 64, PAL.c);
        rect(W / 2 - this.cols * 9 - 4, H * 0.62 - 10, this.cols * 18 + 8, this.rows * 16 + 6, PAL.w); rect(W / 2 - this.cols * 9 - 4, H * 0.62 - 10, this.cols * 18 + 8, 1, PAL.K); rect(W / 2 - this.cols * 9 - 4, H * 0.62 - 10 + this.rows * 16 + 5, this.cols * 18 + 8, 1, PAL.K);
        this.slots.forEach((s) => { if (s.filled) drawDough(s.x, s.y, 6); else { ellipse(s.x, s.y, 6, 3, PAL.T); } });
        if (this.drag) drawDough(this.drag.x, this.drag.y, 6);
        text(`${this.placed}/${n}`, W - 6, 12, PAL.K, 6, 'right');
      },
    }),
    /* Fill: hold to fill each cookie with Nutella up to the line; release in the band. */
    fill: (n) => ({
      title: 'Fill with Nutella', hint: 'Hold to fill, release at the line', time: 6 + n * 3,
      init() { this.i = 0; this.v = 0; this.scores = []; this.hold = false; },
      update(dt) { if (this.hold) { this.v += dt * 0.55 * diff; sfx.pour(); if (this.v > 1.2) this.release(); } },
      down() { this.hold = true; },
      up() { this.release(); },
      release() { if (!this.hold) return; this.hold = false; const err = Math.abs(this.v - 0.8); const q = err < 0.05 ? 100 : err < 0.12 ? 75 : err < 0.25 ? 45 : 10; this.scores.push(q); if (q >= 60) sfx.good(); else sfx.bad(); this.i++; this.v = 0; if (this.i >= n) finish(this.scores.reduce((a, b) => a + b, 0) / n); },
      draw() {
        prop('nutella', W / 2 - 8 + 44, H * 0.18, 24);
        // big cookie cross-section
        const cx = W / 2, cy = H * 0.55;
        ellipse(cx, cy + 14, 30, 6, PAL.c); rect(cx - 30, cy - 6, 60, 20, PAL.c); rect(cx - 30, cy + 14, 60, 1, PAL.d);
        rect(cx - 22, cy - 6, 44, 20, PAL.s);
        const fillH = Math.round(20 * clamp(this.v, 0, 1.2)); rect(cx - 22, cy + 14 - fillH, 44, fillH, PAL.N);
        rect(cx - 26, cy + 14 - 16, 52, 1, PAL.R); text('line', cx + 30, cy - 1, PAL.R, 5);
        if (this.hold) { rect(cx - 1, cy - 30, 2, 30 - fillH + 12, PAL.N); }
        text(`cookie ${Math.min(this.i + 1, n)}/${n}`, W / 2, H * 0.85, PAL.K, 6, 'center');
      },
    }),
    /* Salt: tap to sprinkle; hit the target count exactly. */
    salt: (target) => ({
      title: 'Sea salt on top', hint: `Sprinkle exactly ${target} flakes, then wait`, time: 7,
      init() { this.n = 0; this.flakes = []; this.idle = 0; },
      update(dt) { this.idle += dt; if (this.n > 0 && this.idle > 1.6) finish(Math.max(0, 100 - Math.abs(this.n - target) * 25)); },
      down() { this.n++; this.idle = 0; sfx.tick(); for (let i = 0; i < 2; i++) this.flakes.push({ x: W / 2 + rnd(-18, 18), y: H * 0.5 + rnd(-8, 8) }); },
      draw() {
        prop('salt', W / 2 - 12, H * 0.18, 24);
        drawDough(W / 2, H * 0.54, 22, false, 0); this.flakes.forEach((f) => { px(Math.round(f.x), Math.round(f.y), PAL.X); px(Math.round(f.x) + 1, Math.round(f.y), PAL.w); });
        text(`${this.n} / ${target}`, W / 2, H * 0.85, this.n > target ? PAL.R : PAL.K, 7, 'center');
      },
    }),
    /* Bake: the cookie darkens; tap in the golden window. */
    bake: () => ({
      title: 'Bake', hint: 'Tap when it turns golden', time: 12,
      init() { this.t = 0; this.rate = 0.11 * diff; this.done = false; },
      update(dt) { this.t += dt * this.rate; if (this.t > 1.05 && !this.done) { this.done = true; finish(5); } },
      down() { if (this.done) return; this.done = true; const v = this.t; finish(v < 0.5 ? 20 : v < 0.62 ? 60 : v < 0.8 ? 100 : v < 0.9 ? 55 : 15); },
      draw() {
        rect(W / 2 - 40, H * 0.22, 80, 70, PAL.k); rect(W / 2 - 40, H * 0.22, 80, 1, PAL.K); rect(W / 2 - 34, H * 0.3, 68, 40, PAL.N);
        const glow = 0.15 + Math.sin(animT * 6) * 0.05; ctx.fillStyle = `rgba(243,201,76,${glow})`; rect(W / 2 - 34, H * 0.3, 68, 40, ctx.fillStyle);
        const mix = clamp(this.t, 0, 1); const col = this.t < 0.62 ? PAL.c : this.t < 0.8 ? PAL.C : this.t < 0.9 ? PAL.d : PAL.N;
        disc(W / 2, H * 0.3 + 20, 12, col); disc(W / 2, H * 0.3 + 19, 10, this.t < 0.62 ? '#EDBD7C' : col); px(W / 2 - 4, H * 0.3 + 16, PAL.N); px(W / 2 + 3, H * 0.3 + 22, PAL.N);
        rect(W / 2 - 40, H * 0.22 + 70, 80, 6, PAL.K); px(W / 2 + 30, H * 0.22 + 73, this.t > 0.62 && this.t < 0.8 ? PAL.G : PAL.R);
        bar(W / 2 - 40, H * 0.8, 80, 6, mix, this.t < 0.62 ? PAL.c : this.t < 0.8 ? PAL.G : PAL.R);
        rect(W / 2 - 40 + Math.round(78 * 0.62), H * 0.8 - 2, 1, 10, PAL.K); rect(W / 2 - 40 + Math.round(78 * 0.8), H * 0.8 - 2, 1, 10, PAL.K);
      },
    }),
    /* Pour milk: hold to pour up to the line. */
    pour: () => ({
      title: 'Pour the milk', hint: 'Hold to pour, stop at the line', time: 7,
      init() { this.v = 0; this.hold = false; this.done = false; },
      update(dt) { if (this.hold) { this.v += dt * 0.5 * diff; sfx.pour(); if (this.v > 1.15) this.up(); } },
      down() { if (!this.done) this.hold = true; },
      up() { if (!this.hold) return; this.hold = false; this.done = true; const err = Math.abs(this.v - 0.85); finish(err < 0.04 ? 100 : err < 0.1 ? 75 : err < 0.2 ? 45 : 10); },
      draw() {
        const gx = W / 2, gy = H * 0.7;
        rect(gx - 14, gy - 40, 28, 40, PAL.w); rect(gx - 14, gy - 40, 1, 40, PAL.K); rect(gx + 13, gy - 40, 1, 40, PAL.K); rect(gx - 14, gy, 28, 1, PAL.K);
        const fh = Math.round(38 * clamp(this.v, 0, 1.15)); rect(gx - 13, gy - fh, 26, fh, PAL.W);
        rect(gx - 18, gy - Math.round(38 * 0.85), 36, 1, PAL.R);
        if (this.hold) rect(gx - 1, gy - 60, 2, 60 - fh + 2, PAL.W);
        rect(gx - 8, H * 0.16, 16, 22, PAL.B); rect(gx - 8, H * 0.16, 16, 4, PAL.W); rect(gx - 10, H * 0.16 + 4, 4, 3, PAL.W);
        text('milk', gx, H * 0.9, PAL.K, 6, 'center');
      },
    }),
    /* Box: drag the lid down onto the box, then swipe right for the ribbon. */
    box: () => ({
      title: 'Box it up', hint: 'Drag the lid down, then swipe right for the ribbon', time: 8,
      init() { this.lidY = H * 0.22; this.drag = false; this.lidOn = false; this.sx = 0; },
      update() {},
      down(x, y) { if (!this.lidOn && Math.abs(y - this.lidY) < 12) this.drag = true; this.sx = x; },
      move(x, y) { if (this.drag) this.lidY = clamp(y, H * 0.2, H * 0.52); },
      up(x) { if (this.drag) { this.drag = false; if (this.lidY > H * 0.46) { this.lidOn = true; sfx.good(); } } else if (this.lidOn && x - this.sx > 30) finish(100 - (timer / timeLimit) * 30); },
      draw() {
        rect(W / 2 - 34, H * 0.52, 68, 30, PAL.T); rect(W / 2 - 34, H * 0.52, 68, 1, PAL.K); rect(W / 2 - 34, H * 0.52 + 29, 68, 1, PAL.k);
        if (!this.lidOn) for (let i = 0; i < 3; i++) prop('signature', W / 2 - 26 + i * 18, H * 0.54, 16);
        rect(W / 2 - 36, this.lidY, 72, 10, PAL.T); rect(W / 2 - 36, this.lidY, 72, 1, PAL.K); rect(W / 2 - 36, this.lidY + 9, 72, 1, PAL.k);
        disc(W / 2, this.lidY + 5, 3, PAL.c); px(W / 2 - 1, this.lidY + 5, PAL.N);
        if (this.lidOn) { rect(W / 2 - 2, H * 0.5, 4, 34, PAL.R); text('swipe →', W / 2, H * 0.9, PAL.K, 6, 'center'); }
      },
    }),
    /* Sprinkles: drag across every cookie until all are covered. */
    sprinkle: (n) => ({
      title: 'Sprinkle party', hint: 'Drag over every cookie', time: 6 + n,
      init() { this.cookies = Array.from({ length: n }, (_, i) => ({ x: W / 2 - (n - 1) * 12 + i * 24, y: H * 0.55, v: 0 })); this.dots = []; },
      update() {},
      move(x, y) { this.cookies.forEach((c) => { if (Math.hypot(c.x - x, c.y - y) < 12 && c.v < 1) { c.v += 0.06; this.dots.push({ x: c.x + rnd(-7, 7), y: c.y + rnd(-6, 6), c: [PAL.R, PAL.p, PAL.G, PAL.B, PAL.M][this.dots.length % 5] }); if (Math.random() < 0.3) sfx.tick(); } }); if (this.cookies.every((c) => c.v >= 1)) finish(100 - (timer / timeLimit) * 25); },
      draw() { this.cookies.forEach((c) => drawDough(c.x, c.y, 10)); this.dots.forEach((d) => px(Math.round(d.x), Math.round(d.y), d.c)); text(`${this.cookies.filter((c) => c.v >= 1).length}/${n}`, W - 6, 12, PAL.K, 6, 'right'); },
    }),
  };

  /* ---------- recipes ------------------------------------------------------- */
  const RECIPES = [
    { id: 'signature', name: 'The Signature', blurb: 'One tray of Nutella sea-salt cookies. Learn the kitchen.', diff: 1.0, icon: 'signature', stages: ['crack:2', 'cream', 'sift', 'scoop:4', 'fill:2', 'salt:4', 'bake'] },
    { id: 'dozen', name: 'The Dozen', blurb: 'Bigger batch, chocolate folded in, more to fill.', diff: 1.1, icon: 'bitten', stages: ['crack:3', 'cream', 'sift', 'fold:3', 'scoop:8', 'fill:3', 'salt:5', 'bake'] },
    { id: 'milk', name: 'Milk & Cookies', blurb: 'Cookies, a glass of milk, boxed with a bow.', diff: 1.2, icon: 'milk', stages: ['crack:2', 'cream', 'sift', 'scoop:6', 'fill:3', 'salt:5', 'bake', 'pour', 'box'] },
    { id: 'party', name: 'Sprinkle Party', blurb: 'A birthday order. Sprinkles on everything.', diff: 1.3, icon: 'star', stages: ['crack:3', 'cream', 'sift', 'fold:4', 'scoop:8', 'fill:4', 'sprinkle:4', 'bake', 'box'] },
    { id: 'midnight', name: 'Midnight Batch', blurb: 'Late, dark and fast. The oven is unforgiving.', diff: 1.5, icon: 'burnt', stages: ['crack:4', 'cream', 'sift', 'fold:5', 'scoop:8', 'fill:4', 'salt:6', 'bake', 'bake'], night: true },
    { id: 'zayed', name: "Grandpa Zayed's Order", blurb: 'Every step, twelve cookies, extra salt. He notices everything.', diff: 1.6, icon: 'heart', stages: ['crack:4', 'cream', 'sift', 'fold:6', 'scoop:12', 'fill:5', 'salt:7', 'bake', 'pour', 'box'] },
    { id: 'truck', name: 'Truck Rush', blurb: 'The truck leaves in a minute. No time to breathe.', diff: 1.9, icon: 'tray', stages: ['crack:3', 'sift', 'fold:6', 'scoop:8', 'fill:4', 'salt:6', 'bake', 'box'] },
    { id: 'rush', name: 'Rush Hour', blurb: 'Endless random stages, three lives, combo multiplier. How far can you go?', diff: 1.4, icon: 'hat', rush: true },
  ];
  function starsFor(avg) { return avg >= 88 ? 3 : avg >= 68 ? 2 : avg >= 42 ? 1 : 0; }
  function unlocked(i) { if (i === 0) return true; const r = RECIPES[i]; if (r.rush) return RECIPES.slice(0, 5).every((x) => (S.best[x.id] || 0) >= 2); return (S.best[RECIPES[i - 1].id] || 0) >= 1; }
  function makeStage(spec) { const [k, n] = spec.split(':'); return STAGES[k](n ? Number(n) : undefined); }

  /* ---------- DOM ----------------------------------------------------------- */
  const menuEl = $('#c-menu'), hudTitle = $('#c-title'), hudHint = $('#c-hint'), timerEl = $('#c-timer i'), resultEl = $('#c-result'), resultTitle = $('#c-result-title'), resultBody = $('#c-result-body'), resultBtn = $('#c-result-btn'), hudTop = $('#c-hud');
  function renderMenu() {
    menuEl.innerHTML = `<p class="eyebrow">Cooking Miya &middot; pick a recipe</p>` + RECIPES.map((r, i) => {
      const best = S.best[r.id] || 0, open = unlocked(i);
      const stars = r.rush ? (S.rushBest ? `best ${S.rushBest} pts` : '') : '★'.repeat(best) + '<span class="dim">' + '★'.repeat(3 - best) + '</span>';
      return `<button class="recipe card ${open ? '' : 'is-locked'}" type="button" data-i="${i}" ${open ? '' : 'disabled'}>
        <img class="pixel" src="assets/img/props/${{ signature: 'cookie_signature', bitten: 'cookie_bitten', milk: 'milk_glass', star: 'star', burnt: 'cookie_burnt', heart: 'heart', tray: 'cookie_tray', hat: 'chef_hat' }[r.icon]}@4x.png" alt="" width="48" height="48">
        <div><b>${i + 1}. ${r.name}</b><small>${open ? r.blurb : (r.rush ? 'Earn 2 stars on the first five recipes.' : 'Earn a star on the previous recipe.')}</small><span class="stars">${open ? stars : '🔒'}</span></div></button>`;
    }).join('');
    menuEl.querySelectorAll('.recipe').forEach((b) => b.addEventListener('click', () => startRecipe(Number(b.dataset.i))));
    menuEl.hidden = false; hudTop.hidden = true;
  }
  function startRecipe(i) {
    recipe = RECIPES[i]; diff = recipe.diff; scores = []; stageIdx = 0;
    rush = recipe.rush ? { lives: 3, combo: 0, score: 0, count: 0 } : null;
    document.getElementById('cooking').classList.toggle('is-night', !!recipe.night);
    menuEl.hidden = true; hudTop.hidden = false;
    nextStage();
  }
  function nextStage() {
    if (rush) { const keys = Object.keys(STAGES); const k = keys[Math.floor(Math.random() * keys.length)]; const n = { crack: 2 + Math.floor(rush.count / 3), fold: 3 + Math.floor(rush.count / 2), scoop: 4 + rush.count % 5, fill: 2 + Math.floor(rush.count / 4), salt: 3 + (rush.count % 4), sprinkle: 2 + (rush.count % 3) }[k]; diff = 1.2 + rush.count * 0.06; current = STAGES[k](n); }
    else { if (stageIdx >= recipe.stages.length) { recipeDone(); return; } current = makeStage(recipe.stages[stageIdx]); }
    current.init(); timeLimit = current.time; timer = 0; phase = 'intro'; introT = 0; phaseAt = performance.now();
    hudTitle.textContent = current.title; hudHint.textContent = current.hint;
  }
  function recipeDone() {
    phase = 'recipeDone';
    const avg = scores.reduce((a, b) => a + b, 0) / Math.max(1, scores.length);
    const stars = starsFor(avg);
    if (!rush) { S.best[recipe.id] = Math.max(S.best[recipe.id] || 0, stars); save(); }
    resultTitle.textContent = rush ? `Rush over — ${rush.score} points` : `${recipe.name}: ${'★'.repeat(stars) || 'no stars yet'}`;
    resultBody.innerHTML = rush ? `${rush.count} stages, best combo streak counted. ${rush.score > (S.rushBest || 0) ? 'New record!' : `Record: ${S.rushBest}`}` : `Average ${Math.round(avg)} / 100 across ${scores.length} stages.<br>${stars === 3 ? 'Perfect batch. Mama is speechless.' : stars === 2 ? 'Lovely. A little faster next time.' : stars === 1 ? 'Edible! Practice the tricky stages.' : 'The cat ate that batch. Try again.'}`;
    if (rush) { S.rushBest = Math.max(S.rushBest || 0, rush.score); save(); }
    resultBtn.textContent = 'Back to recipes'; resultEl.hidden = false;
    if (stars >= 2 || (rush && rush.score > 300)) sfx.great(); else sfx.good();
  }
  resultBtn.addEventListener('click', () => { resultEl.hidden = true; phase = 'menu'; document.getElementById('cooking').classList.remove('is-night'); renderMenu(); });
  $('#c-quit').addEventListener('click', () => { phase = 'menu'; document.getElementById('cooking').classList.remove('is-night'); renderMenu(); });

  /* ---------- loop ------------------------------------------------------------ */
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now; animT += dt;
    const night = recipe && recipe.night;
    rect(0, 0, W, H, night ? '#3A3168' : '#F7E7CF');
    // kitchen backdrop: counter + tiles
    for (let y = 0; y < H * 0.18; y += 8) for (let x = 0; x < W; x += 8) rect(x, y, 7, 7, night ? '#4A3F7A' : (Math.floor(x / 8 + y / 8) % 2 ? PAL.W : '#FBEFD9'));
    rect(0, H * 0.18, W, 2, PAL.K);
    // a window onto the garden + a shelf of jars
    rect(6, 3, 30, 22, PAL.K); rect(7, 4, 28, 20, night ? '#231C44' : '#BFE0F5'); rect(7, 16, 28, 8, night ? '#1E3A2C' : '#8FC48C'); rect(20, 4, 1, 20, PAL.K); rect(7, 13, 28, 1, PAL.K);
    if (night) { px(12, 8, PAL.W); px(28, 6, PAL.W); px(24, 11, PAL.W); } else { disc(30, 8, 3, PAL.G); }
    rect(W - 46, 20, 40, 2, PAL.e); ['#E2AC68', PAL.N, PAL.W, PAL.R].forEach((c, i) => { rect(W - 42 + i * 10, 11, 6, 9, c); rect(W - 42 + i * 10, 10, 6, 2, PAL.K); });
    drawCounter();

    if (phase === 'menu') {
      miya('wave', W / 2 - 16, H * 0.45); text('Cooking Miya', W / 2, H * 0.36, PAL.K, 7, 'center');
    } else if (phase === 'intro') {
      introT = (now - phaseAt) / 1000; current.draw(); drawMiyaAtCounter('idle');
      panel(W / 2 - 60, H * 0.38, 120, 30, PAL.W); text(current.title, W / 2, H * 0.38 + 13, PAL.K, 6, 'center'); text(introT < 0.8 ? 'Ready…' : 'Go!', W / 2, H * 0.38 + 24, PAL.R, 6, 'center');
      if (introT > 1.2) { phase = 'play'; }
    } else if (phase === 'play') {
      timer += dt; current.update(dt); current.draw();
      drawMiyaAtCounter(current.title.startsWith('Cream') ? 'mix' : ptr.down ? 'mix' : (Math.floor(animT * 2) % 2 ? 'idle' : 'tray'));
      timerEl.style.width = (100 - (timer / timeLimit) * 100) + '%';
      if (timer >= timeLimit) finish(current.result ? current.result() : 0);
    } else if (phase === 'result') {
      resultT = (now - phaseAt) / 1000; current.draw();
      const good = lastScore >= 60, great = lastScore >= 90;
      miya(great ? 'cheer' : good ? 'hero' : 'sleepy', W / 2 - 16, H * 0.22);
      panel(W / 2 - 50, H * 0.62, 100, 26, great ? PAL.G : good ? PAL.W : PAL.p);
      text(great ? 'PERFECT!' : good ? 'Nice!' : 'Oops…', W / 2, H * 0.62 + 11, PAL.K, 7, 'center'); text(`${lastScore} / 100`, W / 2, H * 0.62 + 21, PAL.k, 5, 'center');
      if (rush) text(`♥ ${rush.lives}  combo x${rush.combo}  ${rush.score}`, W / 2, H * 0.95, PAL.W, 5, 'center');
      if (resultT > 1.4) { if (rush && rush.lives <= 0) recipeDone(); else { stageIdx++; nextStage(); } }
    } else if (phase === 'recipeDone') {
      miya(scores.length && starsFor(scores.reduce((a, b) => a + b, 0) / scores.length) >= 2 ? 'cheer' : 'tray', W / 2 - 16, H * 0.4);
    }
    if (rush && phase === 'play') text(`♥ ${rush.lives}  x${rush.combo}  ${rush.score}`, W / 2, H * 0.96, PAL.W, 5, 'center');
    requestAnimationFrame(frame);
  }

  Promise.all([loadImg('miya', 'assets/img/sprites/miya_sheet.png'), loadImg('props', 'assets/img/sprites/props_sheet.png')]).then(() => { fit(); renderMenu(); requestAnimationFrame(frame); });
  window.CookingMiya = { get state() { return S; }, start: startRecipe, finish, get phase() { return phase; }, get stage() { return current; }, skipIntro: () => { if (phase === 'intro') phase = 'play'; } };
})();
