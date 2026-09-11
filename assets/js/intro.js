/* ==========================================================================
   Miya's Cookies — Pixel-art animated intro
   --------------------------------------------------------------------------
   A tiny hand-rolled 2D engine. Everything is drawn onto a low-resolution
   canvas (one canvas pixel = one "art" pixel) which is then scaled up by a
   whole-number factor with `image-rendering: pixelated`, so it stays crisp.

   Scene: a warm dawn. Miya arrives in her cookie pickup, the camera rolls
   with her past hills and trees, the truck brakes with a little bounce,
   she hops out holding the signature cookie, and the title appears.

   Public API (window.MiyaIntro):
     MiyaIntro.shouldAutoPlay()  -> true on first visit
     MiyaIntro.open()            -> show intro + "tap to begin" card
     MiyaIntro.close()           -> dismiss, mark as seen, hand off to page
   ========================================================================== */
(function () {
  'use strict';

  /* ---------- Brand palette (locked, from design/pixel-pack/palette) ---- */
  const PAL = {
    K: '#2B211C', k: '#4A3A30', S: '#F5CDA8', s: '#D6A67C', H: '#1A1414',
    h: '#3A2C26', P: '#E99E9C', W: '#FFF9F0', w: '#DFD2C1', T: '#D8AE7E',
    t: '#B58758', C: '#C68946', c: '#E2AC68', d: '#966030', N: '#3A2014',
    n: '#633821', X: '#FFFFFF', G: '#F3C94C', g: '#C69A28', R: '#D6544F',
    p: '#F0B0BE', B: '#688ABE', M: '#8CC6AA', L: '#A896C9', e: '#785C4A',
  };
  // Scenery-only tints (sky + foliage). Not part of the sprite palette.
  const SKY = ['#A896C9', '#C9A4BE', '#E9B7B0', '#F5CDA8', '#FBE0C2', '#FFF1DC'];
  const GREEN_DEEP = '#5C8F73', GREEN_MID = '#6FA98C', GREEN_LIGHT = '#8CC6AA';
  const HILL_FAR = '#B7A6D2', HILL_FAR_SHADE = '#A896C9';

  /* ---------- The delivery pickup (40 x 20 art px, side view, faces right) */
  // '.' = transparent. Letters index PAL. Wheels are drawn separately so
  // they can spin, and Miya stands in the open bed behind the front rail.
  const TRUCK = [
    '..........................KKKKKKKK......',
    '..........................KBBBBBBBK.....',
    '..........................KBWBBBBBBK....',
    '..........................KBBBBBBBBBK...',
    '..........................KBBBBBBBBBBK..',
    '..KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK..',
    '..KWWWWWWWWWWWWWWWWWWWWWWWKWWWWWWWWWWK..',
    '..KRRRRRRRRRRRRRRRRRRRRRRRKRRRRRRRRRRK..',
    '..KwwwwwwwwwwwwwwwwwwwwwwwKwwwwwwwwwwK..',
    '..KwwwwwwwwwwwwwwwwwwwwwwwKwwwwwwwwwGK..',
    '..KwwwwwwwwwwwwwwwwwwwwwwwKwwwwwwwwwwK..',
    '..KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK..',
    '.KttttttttttttttttttttttttttttttttttttK.',
    '.KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK.',
  ];
  const TRUCK_TOP = 6;          // rows above this in the 20px box are empty
  const TRUCK_W = 40, TRUCK_H = 20;
  const BED_RAIL_Y = 11;        // y of the bed rail (Miya's feet hide below it)
  const WHEELS = [[8, 19], [31, 19]]; // wheel centres in truck space

  // Little cookie badge painted on the bed side (7x7)
  const BADGE = [
    '..KKK..',
    '.KcccK.',
    'KcCcNcK',
    'KcNcccK',
    'KccCcNK',
    '.KcNcK.',
    '..KKK..',
  ];

  const WHEEL = [
    '..KKKKK..',
    '.KHHHHHK.',
    'KHHHHHHHK',
    'KHHWWWHHK',
    'KHHWWWHHK',
    'KHHWWWHHK',
    'KHHHHHHHK',
    '.KHHHHHK.',
    '..KKKKK..',
  ];
  // Where the gold hub-bolt sits for each of 8 rotation steps
  const BOLT = [[2, 0], [2, 2], [0, 2], [-2, 2], [-2, 0], [-2, -2], [0, -2], [2, -2]];

  /* ---------- Deterministic pseudo-random so the world is stable -------- */
  function hash(n) {
    let x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  }
  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
  const easeInQuad = (t) => t * t;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  /* ---------- Engine ---------------------------------------------------- */
  const root = document.getElementById('intro');
  if (!root) return;
  const canvas = root.querySelector('canvas');
  const ctx = canvas.getContext('2d', { alpha: false });
  const ui = {
    gate: root.querySelector('.intro-gate'),
    title: root.querySelector('.intro-title'),
    tagline: root.querySelector('.intro-tagline'),
    enter: root.querySelector('.intro-enter'),
    skip: root.querySelector('.intro-skip'),
    mute: root.querySelector('.intro-mute'),
  };

  const sprites = {};
  const SPRITE_SRC = {
    idle: 'assets/img/sprites/miya_nutella_idle.png',
    run: 'assets/img/sprites/miya_nutella_run.png',
    hero: 'assets/img/sprites/miya_nutella_hero.png',
    tray: 'assets/img/props/cookie_tray.png',
    star: 'assets/img/props/star.png',
  };
  function loadSprites() {
    return Promise.all(Object.entries(SPRITE_SRC).map(([k, src]) => new Promise((res) => {
      const im = new Image();
      im.onload = () => { sprites[k] = im; res(); };
      im.onerror = () => res(); // scene still runs without the sprite
      im.src = src;
    })));
  }

  // Logical canvas size + integer scale, recomputed on resize
  let W = 160, H = 90, SCALE = 3;
  function fit() {
    const vw = root.clientWidth, vh = root.clientHeight;
    SCALE = clamp(Math.floor(Math.min(vw, vh) / 110), 2, 7);
    W = Math.ceil(vw / SCALE);
    H = Math.ceil(vh / SCALE);
    canvas.width = W;
    canvas.height = H;
    canvas.style.width = (W * SCALE) + 'px';
    canvas.style.height = (H * SCALE) + 'px';
    ctx.imageSmoothingEnabled = false;
  }

  /* ---------- Scene layout helpers (all in art pixels) ------------------ */
  function layout() {
    // Anchored from the bottom so tall portrait screens grow the sky, not the meadow.
    const roadH = clamp(Math.round(H * 0.09), 10, 18);
    const roadTop = H - roadH - clamp(Math.round(H * 0.14), 14, 24);
    const horizon = roadTop - clamp(Math.round(H * 0.16), 26, 34);
    return { horizon, roadTop, roadH };
  }

  function px(x, y, color) { ctx.fillStyle = color; ctx.fillRect(x, y, 1, 1); }
  function rect(x, y, w, h, color) { ctx.fillStyle = color; ctx.fillRect(x, y, w, h); }

  function drawGrid(grid, ox, oy) {
    for (let y = 0; y < grid.length; y++) {
      const row = grid[y];
      for (let x = 0; x < row.length; x++) {
        const ch = row[x];
        if (ch !== '.') px(ox + x, oy + y, PAL[ch]);
      }
    }
  }

  function drawSprite(name, x, y) {
    const im = sprites[name];
    if (im) ctx.drawImage(im, Math.round(x), Math.round(y));
  }

  /* ---------- Sky ------------------------------------------------------- */
  function drawSky(L, t) {
    const bandH = L.horizon / SKY.length;
    for (let i = 0; i < SKY.length; i++) {
      rect(0, Math.floor(i * bandH), W, Math.ceil(bandH) + 1, SKY[i]);
    }
    // Sun — a soft gold disc with a paler halo, low on the right
    const sx = Math.round(W * 0.74), sy = Math.round(L.horizon - H * 0.16);
    disc(sx, sy, 9, '#FBE7B2');
    disc(sx, sy, 7, PAL.G);
    disc(sx, sy, 5, '#F8D877');
    // Birds: two little flapping ticks drifting left
    for (let i = 0; i < 2; i++) {
      const bx = Math.round(((W * 0.3 + i * 23) - t * 6 + W) % (W + 20)) - 10;
      const by = Math.round(L.horizon * 0.35 + Math.sin(t * 2 + i) * 2);
      const flap = Math.floor(t * 6 + i) % 2;
      px(bx, by, PAL.k); px(bx + 2, by, PAL.k);
      px(bx + 1, by + (flap ? 1 : -1), PAL.k);
    }
  }

  function disc(cx, cy, r, color) {
    for (let y = -r; y <= r; y++) {
      const half = Math.floor(Math.sqrt(r * r - y * y));
      rect(cx - half, cy + y, half * 2 + 1, 1, color);
    }
  }

  function drawClouds(L, scroll) {
    const spacing = 44;
    const off = scroll * 0.12;
    const first = Math.floor(off / spacing) - 1;
    for (let i = first; i < first + Math.ceil(W / spacing) + 3; i++) {
      const cx = Math.round(i * spacing - off + hash(i) * 30);
      const cy = Math.round(6 + hash(i + 50) * (L.horizon * 0.7));
      const s = 1 + Math.floor(hash(i + 99) * 2);
      cloud(cx, cy, s);
    }
  }

  function cloud(x, y, s) {
    // Three overlapping puffs with a shaded underside
    disc(x, y, 3 * s, PAL.W);
    disc(x + 4 * s, y - 1, 4 * s, PAL.W);
    disc(x + 9 * s, y + 1, 3 * s, PAL.W);
    rect(x - 3 * s, y + 3 * s, 15 * s, 1, PAL.w);
  }

  /* ---------- Hills + trees -------------------------------------------- */
  function hillHeight(worldX, seed, amp, freq) {
    return Math.sin(worldX * freq + seed) * amp + Math.sin(worldX * freq * 2.3 + seed * 3) * amp * 0.35;
  }

  function drawHills(L, scroll) {
    // far lavender hills
    for (let x = 0; x < W; x++) {
      const wx = x + scroll * 0.25;
      const h = Math.round(hillHeight(wx, 1.7, 9, 0.045)) + 14;
      rect(x, L.horizon - h, 1, h + 1, HILL_FAR);
      px(x, L.horizon - h, HILL_FAR_SHADE);
    }
    // mid mint hills
    for (let x = 0; x < W; x++) {
      const wx = x + scroll * 0.5;
      const h = Math.round(hillHeight(wx, 4.2, 6, 0.07)) + 7;
      rect(x, L.horizon - h, 1, h + 1, GREEN_LIGHT);
      px(x, L.horizon - h, GREEN_MID);
    }
  }

  function drawTreeLine(L, scroll) {
    // meadow band between horizon and road
    rect(0, L.horizon, W, L.roadTop - L.horizon, GREEN_MID);
    rect(0, L.horizon, W, 1, GREEN_LIGHT);
    const spacing = 26;
    const off = scroll * 0.8;
    const first = Math.floor(off / spacing) - 1;
    for (let i = first; i < first + Math.ceil(W / spacing) + 3; i++) {
      const tx = Math.round(i * spacing - off + hash(i * 7) * 12);
      const size = 1 + Math.floor(hash(i * 13) * 2);
      tree(tx, L.horizon + 2, size);
    }
    // a wooden fence along the road
    const fenceY = L.roadTop - 5;
    const fOff = Math.round(scroll);
    for (let x = -(fOff % 12); x < W; x += 12) {
      rect(x, fenceY, 1, 5, PAL.e);
      rect(x, fenceY + 1, 12, 1, PAL.t);
      rect(x, fenceY + 3, 12, 1, PAL.t);
    }
  }

  function tree(x, baseY, s) {
    const trunkH = 3 + s;
    rect(x, baseY - trunkH, 2, trunkH, PAL.e);
    const cy = baseY - trunkH - 3 * s;
    disc(x + 1, cy, 3 * s + 1, GREEN_DEEP);
    disc(x, cy - 1, 2 * s + 1, GREEN_LIGHT);
    px(x - 1, cy - 2 * s, PAL.W);
  }

  /* ---------- Road + foreground ---------------------------------------- */
  function drawRoad(L, scroll) {
    rect(0, L.roadTop, W, L.roadH, PAL.e);           // packed dirt road
    rect(0, L.roadTop, W, 1, PAL.k);                 // edge
    const midY = L.roadTop + Math.floor(L.roadH / 2);
    const off = Math.round(scroll) % 10;
    for (let x = -off; x < W; x += 10) rect(x, midY, 5, 1, PAL.T);
    // grass shoulder below the road, with little flowers scrolling faster
    rect(0, L.roadTop + L.roadH, W, H - (L.roadTop + L.roadH), GREEN_LIGHT);
    rect(0, L.roadTop + L.roadH, W, 1, GREEN_MID);
    const fo = scroll * 1.25;
    const first = Math.floor(fo / 9) - 1;
    for (let i = first; i < first + Math.ceil(W / 9) + 2; i++) {
      const fx = Math.round(i * 9 - fo + hash(i * 3) * 6);
      const fy = L.roadTop + L.roadH + 2 + Math.floor(hash(i * 5) * Math.max(1, H - L.roadTop - L.roadH - 4));
      const kind = hash(i * 11);
      const color = kind < 0.33 ? PAL.R : kind < 0.66 ? PAL.p : PAL.G;
      px(fx, fy, color);
      px(fx, fy + 1, GREEN_DEEP);
    }
  }

  /* ---------- Truck + Miya --------------------------------------------- */
  function drawTruck(tx, ty, wheelStep, bounce, miyaInBed, breathe) {
    ty = Math.round(ty + bounce);
    // Miya rides in the bed. Feet hide behind the rail, head pops above.
    if (miyaInBed && sprites.idle) {
      ctx.drawImage(sprites.idle, Math.round(tx + 4), Math.round(ty + BED_RAIL_Y + 6 - 32 + breathe));
    }
    // A tray of cookies riding along beside her
    if (sprites.tray) ctx.drawImage(sprites.tray, Math.round(tx + 14), Math.round(ty + BED_RAIL_Y - 8));
    drawGrid(TRUCK, tx, ty + TRUCK_TOP);
    drawGrid(BADGE, tx + 5, ty + TRUCK_TOP + 6);
    // rear light + exhaust stub
    px(tx + 3, ty + TRUCK_TOP + 9, PAL.R);
    px(tx + 1, ty + TRUCK_TOP + 11, PAL.k);
    for (const [wx, wy] of WHEELS) {
      const cx = tx + wx, cy = ty + wy;
      drawGrid(WHEEL, cx - 4, cy - 4);
      const [bx, by] = BOLT[wheelStep % 8];
      px(cx + bx, cy + by, PAL.G);
    }
  }

  const puffs = []; // exhaust / dust particles
  function spawnPuff(x, y, color, life, vx, vy) {
    puffs.push({ x, y, color, life, max: life, vx, vy });
  }
  function drawPuffs(dt) {
    for (let i = puffs.length - 1; i >= 0; i--) {
      const p = puffs[i];
      p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.life <= 0) { puffs.splice(i, 1); continue; }
      const r = Math.round((1 - p.life / p.max) * 2);
      disc(Math.round(p.x), Math.round(p.y), r, p.color);
    }
  }

  const sparkles = [];
  function spawnSparkles(x, y) {
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      sparkles.push({ x, y, vx: Math.cos(a) * 18, vy: Math.sin(a) * 18 - 10, life: 0.7, max: 0.7 });
    }
  }
  function drawSparkles(dt) {
    for (let i = sparkles.length - 1; i >= 0; i--) {
      const s = sparkles[i];
      s.life -= dt; s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 30 * dt;
      if (s.life <= 0) { sparkles.splice(i, 1); continue; }
      const x = Math.round(s.x), y = Math.round(s.y);
      const c = s.life > 0.35 ? PAL.G : PAL.W;
      px(x, y, c); px(x - 1, y, c); px(x + 1, y, c); px(x, y - 1, c); px(x, y + 1, c);
    }
  }

  /* ---------- Timeline -------------------------------------------------- */
  // Seconds from the moment the user taps "begin".
  const T = {
    driveEnd: 3.4,     // truck fully stopped
    hop: 3.9,          // Miya jumps out
    land: 4.45,        // she lands, sparkles
    title: 4.8,        // title appears
    tagline: 5.5,
    enter: 6.3,        // "Come on in" button
    autoEnter: 16,     // if nobody clicks, drift into the site
  };

  let state = 'idle'; // idle | gate | playing | done
  let startTime = 0, last = 0, scroll = 0, wheelDist = 0, raf = 0;
  let stopped = false, hopped = false, landed = false, titled = false, taglined = false, entered = false;

  function frame(now) {
    if (state !== 'playing' && state !== 'gate') return;
    const dt = Math.min(0.05, (now - last) / 1000) || 0.016;
    last = now;
    const t = state === 'playing' ? (now - startTime) / 1000 : 0;
    const L = layout();

    // --- motion: world scroll speed (px/s) eases from 70 to 0 ---
    let speed = 0;
    if (state === 'playing') {
      if (t < 2.0) speed = 70;
      else if (t < T.driveEnd) speed = 70 * (1 - easeOutCubic((t - 2.0) / (T.driveEnd - 2.0)));
    }
    scroll += speed * dt;

    // --- truck position: slides in from the left, settles centre-left ---
    const targetX = Math.round(W / 2 - TRUCK_W / 2 - Math.min(24, W * 0.08));
    const driveT = clamp(t / T.driveEnd, 0, 1);
    const truckX = state === 'playing'
      ? Math.round(-TRUCK_W - 4 + (targetX + TRUCK_W + 4) * easeOutCubic(driveT))
      : -TRUCK_W - 4;
    const truckY = L.roadTop + L.roadH - TRUCK_H - 3;
    wheelDist += (speed + (truckX - (frame.prevX ?? truckX)) * 60) * dt;
    frame.prevX = truckX;
    const wheelStep = Math.floor(wheelDist / 3) & 7;

    // engine rumble + brake bounce
    let bounce = 0;
    if (state === 'playing' && t < T.driveEnd) bounce = Math.round(Math.sin(t * 40)) * 0.5;
    if (state === 'playing' && t >= T.driveEnd && t < T.driveEnd + 0.5) {
      const b = (t - T.driveEnd) / 0.5;
      bounce = Math.round(Math.sin(b * Math.PI * 2) * (1 - b) * 2);
      if (!stopped) {
        stopped = true;
        for (const [wx] of WHEELS) for (let i = 0; i < 4; i++) {
          spawnPuff(truckX + wx - 2 + i * 2, truckY + TRUCK_H - 1, PAL.w, 0.6, -14 - i * 4, -6);
        }
      }
    }
    if (state === 'playing' && speed > 5 && Math.random() < 0.25) {
      spawnPuff(truckX, truckY + TRUCK_TOP + 11, PAL.w, 0.7, -25, -8);
    }

    // --- draw world ---
    drawSky(L, t);
    drawClouds(L, scroll);
    drawHills(L, scroll);
    drawTreeLine(L, scroll);
    drawRoad(L, scroll);

    const breathe = Math.floor(t * 1.6) % 2 === 0 ? 0 : 1; // gentle 2-frame idle breathe
    const miyaInBed = !(state === 'playing' && t >= T.hop);
    drawTruck(truckX, truckY, wheelStep, bounce, miyaInBed, breathe);

    // --- Miya hops out to the right of the truck ---
    if (state === 'playing' && t >= T.hop) {
      const fromX = truckX + 4, fromY = truckY + BED_RAIL_Y + 6 - 32;
      const toX = truckX + TRUCK_W + 6, toY = L.roadTop + L.roadH - 32 - 1;
      const u = clamp((t - T.hop) / (T.land - T.hop), 0, 1);
      const arc = Math.sin(u * Math.PI) * 16;
      const x = fromX + (toX - fromX) * u;
      const y = fromY + (toY - fromY) * easeInQuad(u) - arc;
      if (u < 1) {
        drawSprite('run', x, y);
      } else {
        if (!landed) {
          landed = true;
          spawnSparkles(toX + 22, toY + 6);
          for (let i = 0; i < 5; i++) spawnPuff(toX + 10 + i * 3, toY + 31, PAL.w, 0.45, (i - 2) * 12, -8);
        }
        const settle = clamp((t - T.land) / 0.25, 0, 1);
        const squash = settle < 1 ? Math.round(Math.sin(settle * Math.PI) * 2) : 0;
        drawSprite('hero', toX, toY + squash + (settle >= 1 ? breathe : 0));
        // a shy little twinkle over the cookie every so often
        if (Math.floor(t * 2) % 5 === 0 && sprites.star) {
          ctx.drawImage(sprites.star, toX + 24, toY - 6, 8, 8);
        }
      }
    }

    drawPuffs(dt);
    drawSparkles(dt);

    // --- DOM overlay beats ---
    if (state === 'playing') {
      if (t >= T.title && !titled) { titled = true; ui.title.classList.add('is-on'); }
      if (t >= T.tagline && !taglined) { taglined = true; ui.tagline.classList.add('is-on'); }
      if (t >= T.enter && !entered) { entered = true; ui.enter.classList.add('is-on'); ui.enter.focus({ preventScroll: true }); }
      if (t >= T.autoEnter) { close(); return; }
    }
    raf = requestAnimationFrame(frame);
  }

  /* ---------- Public flow ------------------------------------------------ */
  const SEEN_KEY = 'miya_intro_seen';
  function shouldAutoPlay() {
    try {
      if (new URLSearchParams(location.search).get('intro') === '1') return true;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
      return !localStorage.getItem(SEEN_KEY);
    } catch (e) { return true; }
  }

  async function open() {
    if (state === 'gate' || state === 'playing') return;
    root.hidden = false;
    document.body.classList.add('intro-open');
    fit();
    await loadSprites();
    state = 'gate';
    ui.gate.classList.add('is-on');
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }

  function begin() {
    if (state !== 'gate') return;
    state = 'playing';
    ui.gate.classList.remove('is-on');
    startTime = performance.now();
    last = startTime;
    if (window.MiyaMusic) window.MiyaMusic.start();
  }

  function close() {
    if (state === 'done') return;
    state = 'done';
    cancelAnimationFrame(raf);
    try { localStorage.setItem(SEEN_KEY, '1'); } catch (e) {}
    if (window.MiyaMusic) window.MiyaMusic.fadeOut(1.6);
    root.classList.add('is-leaving');
    document.body.classList.remove('intro-open');
    setTimeout(() => {
      root.hidden = true;
      root.classList.remove('is-leaving');
      ['title', 'tagline', 'enter', 'gate'].forEach((k) => ui[k].classList.remove('is-on'));
      stopped = hopped = landed = titled = taglined = entered = false;
      scroll = 0; wheelDist = 0; puffs.length = 0; sparkles.length = 0; frame.prevX = undefined;
      state = 'idle';
      document.dispatchEvent(new CustomEvent('miya:intro-closed'));
    }, 900);
  }

  ui.gate.addEventListener('click', begin);
  ui.enter.addEventListener('click', close);
  ui.skip.addEventListener('click', close);
  if (ui.mute) ui.mute.addEventListener('click', () => window.MiyaMusic && window.MiyaMusic.toggle());
  window.addEventListener('resize', () => { if (state !== 'idle' && state !== 'done') fit(); });
  document.addEventListener('keydown', (e) => {
    if (state === 'idle' || state === 'done') return;
    if (e.key === 'Escape') close();
    if ((e.key === 'Enter' || e.key === ' ') && state === 'gate') { e.preventDefault(); begin(); }
  });

  window.MiyaIntro = { shouldAutoPlay, open, close };
  if (shouldAutoPlay()) open();
})();
