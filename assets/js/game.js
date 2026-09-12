/* ==========================================================================
   Miya's Cookie Farm — a tiny pixel farming / baking / delivery game
   --------------------------------------------------------------------------
   Loop: grow wheat, milk the cows, shake date & hazelnut trees, gather sea
   salt on the beach, bake batches in Miya's oven (timing mini-game), then
   deliver warm cookies to the neighbours before their orders go cold.
   Coins buy seeds and upgrades; hearts unlock outfits from the sprite pack.

   Tech: one canvas at integer pixel scale, sprite sheets from the Miya pack
   (32×32 characters, 16×16 props), procedurally drawn tiles/buildings using
   the locked brand palette, DOM overlay for HUD/dialogue, localStorage save.
   Works with keyboard (WASD/arrows + E/Space) and touch (drag = move, A = act).
   ========================================================================== */
(function () {
  'use strict';

  /* ---------- palette + tiny helpers ----------------------------------- */
  const PAL = {
    K: '#2B211C', k: '#4A3A30', S: '#F5CDA8', s: '#D6A67C', H: '#1A1414', h: '#3A2C26',
    P: '#E99E9C', W: '#FFF9F0', w: '#DFD2C1', T: '#D8AE7E', t: '#B58758', C: '#C68946',
    c: '#E2AC68', d: '#966030', N: '#3A2014', n: '#633821', X: '#FFFFFF', G: '#F3C94C',
    g: '#C69A28', R: '#D6544F', p: '#F0B0BE', B: '#688ABE', M: '#8CC6AA', L: '#A896C9', e: '#785C4A',
  };
  const GREEN = { deep: '#5C8F73', mid: '#6FA98C', light: '#8CC6AA', grass: '#9DCF9A', grass2: '#8FC48C', soil: '#7A5237', soilWet: '#5E3E2A', water: '#7FB4D8', water2: '#9CC8E6', sand: '#F1DDB0', sand2: '#E6CE9C' };
  const hash = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const $ = (s) => document.querySelector(s);

  /* ---------- world constants ------------------------------------------ */
  const TILE = 16, MAP_W = 48, MAP_H = 36;
  const T = { GRASS: 0, PATH: 1, SAND: 2, WATER: 3, SOIL: 4, FLOOR: 5 };
  const SOLID_TILES = new Set([T.WATER]);
  const OUTFITS = ['classic', 'kraft', 'midnight', 'sprinkle', 'nutella', 'barista'];
  const POSES = { idle: 0, wave: 1, tray: 2, mix: 3, cheer: 4, run: 5, hero: 6, sleepy: 7 };
  const PROPS = { signature: [0, 0], bitten: [1, 0], split: [2, 0], dough: [3, 0], golden: [4, 0], burnt: [5, 0], crumbs: [6, 0], nutella: [0, 1], salt: [1, 1], milk: [2, 1], tray: [3, 1], heart: [4, 1], star: [5, 1], hat: [6, 1] };

  const RECIPE = { wheat: 2, milk: 1, dates: 2, salt: 1, hazel: 3 };
  const ING = { wheat: 'Wheat', milk: 'Milk', dates: 'Dates', salt: 'Sea salt', hazel: 'Hazelnuts', cookies: 'Cookies', seeds: 'Seeds', water: 'Water' };
  const ING_ICON = { wheat: '🌾', milk: 'milk', dates: '🌴', salt: 'salt', hazel: '🌰', cookies: 'signature', seeds: '🌱', water: '💧' };
  const PRICE_PER_COOKIE = 12;
  const DAY_START = 7 * 60, NIGHT_AT = 19 * 60, DAY_END = 24 * 60, MIN_PER_SEC = 2.2;

  /* ---------- cast ------------------------------------------------------- */
  const CAST = {
    miya:  { name: 'Miya',   outfit: 'nutella',  role: 'Baker & driver. That is you.' },
    mama:  { name: 'Mama Noura', outfit: 'classic', role: 'Runs the bakery. Bake, sleep, upgrades.' },
    hessa: { name: 'Hessa',  outfit: 'kraft',    role: 'Farmer. Sells wheat seeds.' },
    noor:  { name: 'Noor',   outfit: 'barista',  role: 'Looks after the cows.' },
    lulu:  { name: 'Lulu',   outfit: 'sprinkle', role: 'Keeps the orchard.' },
    reem:  { name: 'Reem',   outfit: 'midnight', role: 'Night owl. Midnight orders pay double.' },
  };
  const HOUSES = [
    { id: 'h1', x: 3,  y: 22, who: 'Bu Saif',        color: 'R' },
    { id: 'h2', x: 14, y: 23, who: 'Auntie Aisha',   color: 'B' },
    { id: 'h3', x: 40, y: 22, who: 'Khalid & Sara',  color: 'L' },
    { id: 'h4', x: 43, y: 12, who: 'The Twins',      color: 'p' },
    { id: 'h5', x: 3,  y: 3,  who: 'Grandpa Zayed',  color: 'M' },
  ];

  /* ---------- pixel grids ----------------------------------------------- */
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
  const WHEEL = ['..KKKKK..', '.KHHHHHK.', 'KHHHHHHHK', 'KHHWWWHHK', 'KHHWWWHHK', 'KHHWWWHHK', 'KHHHHHHHK', '.KHHHHHK.', '..KKKKK..'];
  const COW = [
    '..KKK...........', '.KWWWK..........', '.KWKWWKKKKKKKK..', 'KWWWWWWWWWWWWWK.', 'KPWWWWKKWWWWWWK.',
    'KWWWWWKKWWKKWWK.', '.KWWWWWWWWKKWWK.', '.KsKWWWWWWWWWWK.', '..KWKKWWWWKKWK..', '..KWK.KWK.KWK...', '..KKK.KKK.KKK...',
  ];
  const BADGE = ['..KKK..', '.KcccK.', 'KcCcNcK', 'KcNcccK', 'KccCcNK', '.KcNcK.', '..KKK..'];

  /* ---------- canvas ----------------------------------------------------- */
  const canvas = $('#gcanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d', { alpha: false });
  let W = 200, H = 120, SCALE = 3;
  function fit() {
    const vw = canvas.parentElement.clientWidth, vh = canvas.parentElement.clientHeight;
    SCALE = clamp(Math.round(Math.min(vw, vh) / 240), 2, 4);
    W = Math.ceil(vw / SCALE); H = Math.ceil(vh / SCALE);
    canvas.width = W; canvas.height = H;
    canvas.style.width = W * SCALE + 'px'; canvas.style.height = H * SCALE + 'px';
    ctx.imageSmoothingEnabled = false;
  }
  window.addEventListener('resize', fit);

  const sheets = {};
  function loadImg(k, src) { return new Promise((r) => { const i = new Image(); i.onload = () => { sheets[k] = i; r(); }; i.onerror = r; i.src = src; }); }

  const px = (x, y, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, 1, 1); };
  const rect = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
  function grid(g, ox, oy, flip) {
    for (let y = 0; y < g.length; y++) for (let x = 0; x < g[y].length; x++) {
      const ch = g[y][x]; if (ch === '.') continue;
      px(ox + (flip ? g[y].length - 1 - x : x), oy + y, PAL[ch]);
    }
  }
  function disc(cx, cy, r, c) { for (let y = -r; y <= r; y++) { const h = Math.floor(Math.sqrt(r * r - y * y)); rect(cx - h, cy + y, h * 2 + 1, 1, c); } }
  function chr(outfit, pose, x, y, flip) {
    const im = sheets.miya; if (!im) return;
    const sx = POSES[pose] * 32, sy = OUTFITS.indexOf(outfit) * 32;
    if (flip) { ctx.save(); ctx.translate(Math.round(x) + 32, Math.round(y)); ctx.scale(-1, 1); ctx.drawImage(im, sx, sy, 32, 32, 0, 0, 32, 32); ctx.restore(); }
    else ctx.drawImage(im, sx, sy, 32, 32, Math.round(x), Math.round(y), 32, 32);
  }
  function prop(name, x, y, size) {
    const im = sheets.props; if (!im) return;
    const [c, r] = PROPS[name]; size = size || 16;
    ctx.drawImage(im, c * 16, r * 16, 16, 16, Math.round(x), Math.round(y), size, size);
  }
  function propURL(name) {
    const [c, r] = PROPS[name];
    const off = document.createElement('canvas'); off.width = off.height = 16;
    const o = off.getContext('2d'); o.imageSmoothingEnabled = false;
    if (sheets.props) o.drawImage(sheets.props, c * 16, r * 16, 16, 16, 0, 0, 16, 16);
    return off.toDataURL();
  }
  function portraitURL(outfit, pose) {
    const off = document.createElement('canvas'); off.width = off.height = 32;
    const o = off.getContext('2d'); o.imageSmoothingEnabled = false;
    if (sheets.miya) o.drawImage(sheets.miya, POSES[pose || 'idle'] * 32, OUTFITS.indexOf(outfit) * 32, 32, 32, 0, 0, 32, 32);
    return off.toDataURL();
  }

  /* ---------- map ------------------------------------------------------- */
  const map = new Uint8Array(MAP_W * MAP_H);
  const tileAt = (tx, ty) => (tx < 0 || ty < 0 || tx >= MAP_W || ty >= MAP_H) ? T.WATER : map[ty * MAP_W + tx];
  const setT = (tx, ty, t) => { if (tx >= 0 && ty >= 0 && tx < MAP_W && ty < MAP_H) map[ty * MAP_W + tx] = t; };
  const fillT = (x, y, w, h, t) => { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) setT(i, j, t); };

  const objects = [];   // static things with footprints and interactions
  const solid = new Set(); // "x,y" tiles blocked by objects
  function block(x, y, w, h) { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) solid.add(i + ',' + j); }
  function addObj(o) { objects.push(o); if (o.bw) block(o.x, o.y + (o.bh_off || 0), o.bw, o.bh); return o; }

  function buildWorld() {
    map.fill(T.GRASS);
    fillT(0, 31, MAP_W, 5, T.WATER); fillT(0, 28, MAP_W, 3, T.SAND);     // sea + beach
    fillT(2, 19, 44, 2, T.PATH);                                          // main road
    fillT(23, 21, 2, 7, T.PATH);                                          // to the beach
    fillT(8, 5, 2, 14, T.PATH);                                           // to the farm
    fillT(36, 11, 2, 8, T.PATH);                                          // to the orchard
    fillT(5, 10, 6, 4, T.SOIL);                                           // 24 plots
    fillT(32, 13, 8, 4, T.FLOOR);                                         // cow pen dirt

    // bakery (6x4 footprint, door bottom middle)
    addObj({ kind: 'bakery', x: 20, y: 12, bw: 7, bh: 5, name: 'Bakery' });
    addObj({ kind: 'bed', x: 19, y: 15, bw: 0 });
    addObj({ kind: 'truck', x: 29, y: 18, bw: 0 });
    addObj({ kind: 'well', x: 4, y: 8, bw: 1, bh: 1 });
    addObj({ kind: 'mill', x: 12, y: 8, bw: 2, bh: 2 });
    for (let j = 10; j < 14; j++) for (let i = 5; i < 11; i++) addObj({ kind: 'plot', x: i, y: j, bw: 0 });
    // fence around the pen
    for (let i = 31; i <= 40; i++) { addObj({ kind: 'fence', x: i, y: 12, bw: i === 36 || i === 37 ? 0 : 1, bh: 1 }); addObj({ kind: 'fence', x: i, y: 17, bw: 1, bh: 1 }); }
    for (let j = 13; j < 17; j++) { addObj({ kind: 'fence', x: 31, y: j, bw: 1, bh: 1 }); addObj({ kind: 'fence', x: 40, y: j, bw: 1, bh: 1 }); }
    addObj({ kind: 'cow', id: 'cow1', x: 33, y: 14, bw: 1, bh: 1 });
    addObj({ kind: 'cow', id: 'cow2', x: 37, y: 15, bw: 1, bh: 1 });
    // orchard
    [[30, 4], [33, 3], [36, 5], [39, 3], [42, 5], [31, 8], [35, 8]].forEach(([x, y], i) => addObj({ kind: 'palm', id: 'palm' + i, x, y, bw: 1, bh: 1 }));
    [[39, 8], [42, 9], [44, 6], [45, 2], [28, 7]].forEach(([x, y], i) => addObj({ kind: 'hazel', id: 'hazel' + i, x, y, bw: 1, bh: 1 }));
    // beach salt rocks
    [[6, 29], [12, 30], [18, 29], [30, 30], [38, 29], [44, 30]].forEach(([x, y], i) => addObj({ kind: 'rock', id: 'rock' + i, x, y, bw: 1, bh: 1 }));
    // decorative trees
    [[1, 6], [14, 3], [18, 6], [26, 3], [16, 16], [2, 16], [46, 16], [46, 25], [28, 25], [10, 26], [20, 25], [34, 24]].forEach(([x, y]) => addObj({ kind: 'tree', x, y, bw: 1, bh: 1 }));
    HOUSES.forEach((h) => addObj({ kind: 'house', ...h, bw: 3, bh: 3 }));
    // NPC spots
    addObj({ kind: 'npc', who: 'mama', x: 26, y: 17, bw: 1, bh: 1 });
    addObj({ kind: 'npc', who: 'hessa', x: 12, y: 12, bw: 1, bh: 1 });
    addObj({ kind: 'npc', who: 'noor', x: 34, y: 18, bw: 1, bh: 1 });
    addObj({ kind: 'npc', who: 'lulu', x: 38, y: 10, bw: 1, bh: 1 });
    addObj({ kind: 'npc', who: 'reem', x: 22, y: 21, bw: 1, bh: 1, nightOnly: true });
  }

  /* ---------- state + save --------------------------------------------- */
  const SAVE_KEY = 'miya_farm_v1';
  let S;
  function freshState() {
    return {
      day: 1, time: DAY_START, coins: 20, hearts: 0, delivered: 0,
      inv: { seeds: 6, water: 8, wheat: 0, milk: 0, dates: 0, salt: 0, hazel: 0, cookies: 0 },
      plots: {}, nodes: {}, cows: {}, orders: [], upgrades: {}, outfit: 'nutella', unlocked: ['nutella'],
      px: 23.5 * TILE, py: 19.5 * TILE, tutorial: 0, riding: false,
    };
  }
  function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) {} }
  function load() { try { const s = JSON.parse(localStorage.getItem(SAVE_KEY)); if (s && s.inv) return Object.assign(freshState(), s); } catch (e) {} return freshState(); }

  /* ---------- player + camera ------------------------------------------ */
  const player = { x: 0, y: 0, dir: 1, moving: false, anim: 0 };
  const cam = { x: 0, y: 0 };
  const isNight = () => S.time >= NIGHT_AT;
  function blockedAt(x, y) {
    const tx = Math.floor(x / TILE), ty = Math.floor(y / TILE);
    return SOLID_TILES.has(tileAt(tx, ty)) || solid.has(tx + ',' + ty);
  }
  function tryMove(dx, dy) {
    // feet box: 10 wide, 6 tall, at the sprite's bottom centre
    const nx = player.x + dx, ny = player.y + dy;
    const ok = (x, y) => !blockedAt(x - 5, y) && !blockedAt(x + 5, y) && !blockedAt(x - 5, y - 5) && !blockedAt(x + 5, y - 5);
    if (ok(nx, player.y)) player.x = clamp(nx, 8, MAP_W * TILE - 8);
    if (ok(player.x, ny)) player.y = clamp(ny, 8, MAP_H * TILE - 8);
  }

  /* ---------- input ----------------------------------------------------- */
  const keys = {};
  let actionQueued = false;
  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT') return;
    keys[e.key.toLowerCase()] = true;
    if (['e', ' ', 'enter'].includes(e.key.toLowerCase())) { e.preventDefault(); actionQueued = true; }
    if (e.key === 'Escape') closeDialog();
  });
  document.addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });
  const joy = { active: false, ox: 0, oy: 0, dx: 0, dy: 0 };
  canvas.addEventListener('touchstart', (e) => {
    const t = e.changedTouches[0];
    if (t.clientX < window.innerWidth * 0.6) { joy.active = true; joy.ox = t.clientX; joy.oy = t.clientY; joy.dx = joy.dy = 0; joy.id = t.identifier; }
    else actionQueued = true;
    e.preventDefault();
  }, { passive: false });
  canvas.addEventListener('touchmove', (e) => {
    for (const t of e.changedTouches) if (t.identifier === joy.id) { joy.dx = clamp((t.clientX - joy.ox) / 40, -1, 1); joy.dy = clamp((t.clientY - joy.oy) / 40, -1, 1); }
    e.preventDefault();
  }, { passive: false });
  const endJoy = (e) => { for (const t of e.changedTouches) if (t.identifier === joy.id) { joy.active = false; joy.dx = joy.dy = 0; } };
  canvas.addEventListener('touchend', endJoy); canvas.addEventListener('touchcancel', endJoy);
  $('#h-action').addEventListener('click', () => { actionQueued = true; });

  /* ---------- dialogue (DOM) -------------------------------------------- */
  const dlg = $('#dialog'), dText = $('#d-text'), dPortrait = $('#d-portrait'), dButtons = $('#d-buttons'), dName = $('#d-name');
  let dialogOpen = false;
  function say(who, text, buttons) {
    const c = CAST[who] || { name: who, outfit: 'nutella' };
    dName.textContent = c.name;
    dPortrait.src = portraitURL(c.outfit, buttons ? 'idle' : 'wave');
    dText.innerHTML = text;
    dButtons.innerHTML = '';
    (buttons || [{ label: 'Okay', fn: closeDialog }]).forEach((b) => {
      const el = document.createElement('button'); el.className = 'btn btn--sm' + (b.ghost ? ' btn--ghost' : ''); el.type = 'button'; el.innerHTML = b.label;
      el.addEventListener('click', () => { closeDialog(); b.fn && b.fn(); });
      dButtons.appendChild(el);
    });
    dlg.hidden = false; dialogOpen = true;
  }
  function closeDialog() { dlg.hidden = true; dialogOpen = false; }
  function toast(msg, icon) {
    const el = document.createElement('div'); el.className = 'toast';
    el.innerHTML = (icon && PROPS[icon] ? `<img class="pixel" src="${propURL(icon)}" width="24" height="24" alt="">` : (icon || '')) + `<span>${msg}</span>`;
    $('#toasts').appendChild(el); setTimeout(() => el.remove(), 2600);
  }

  /* ---------- sound (tiny blips via Web Audio) -------------------------- */
  let ac = null;
  function blip(freq, dur, type) {
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)();
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = type || 'square'; o.frequency.value = freq;
      g.gain.setValueAtTime(0.06, ac.currentTime); g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + (dur || 0.12));
      o.connect(g).connect(ac.destination); o.start(); o.stop(ac.currentTime + (dur || 0.12));
    } catch (e) {}
  }
  const sfx = { pick: () => blip(660, 0.1), coin: () => { blip(880, 0.08); setTimeout(() => blip(1320, 0.12), 70); }, no: () => blip(160, 0.2, 'sawtooth'), plant: () => blip(440, 0.08, 'triangle'), water: () => blip(300, 0.15, 'sine') };

  /* ---------- economy helpers ------------------------------------------- */
  const inv = () => S.inv;
  function give(k, n, icon) { inv()[k] = (inv()[k] || 0) + n; toast(`+${n} ${ING[k] || k}`, icon || ING_ICON[k]); sfx.pick(); updateHUD(); save(); }
  function nodeReady(id) { const n = S.nodes[id]; return !n || n.day < S.day; }
  function useNode(id) { S.nodes[id] = { day: S.day }; }
  const batchSize = () => (S.upgrades.oven ? 10 : 6);
  function canBake() { return Object.entries(RECIPE).every(([k, n]) => inv()[k] >= n); }
  function recipeText() { return Object.entries(RECIPE).map(([k, n]) => `${n} ${ING[k].toLowerCase()} <small class="muted">(${inv()[k]})</small>`).join(', '); }

  /* ---------- orders ---------------------------------------------------- */
  let orderTimer = 25;
  function spawnOrder() {
    const busy = new Set(S.orders.map((o) => o.house));
    const free = HOUSES.filter((h) => !busy.has(h.id));
    if (!free.length) return;
    const h = free[Math.floor(Math.random() * free.length)];
    const qty = 1 + Math.floor(Math.random() * (S.upgrades.oven ? 6 : 3));
    S.orders.push({ house: h.id, who: h.who, qty, left: 170, total: 170 });
    toast(`${h.who} wants ${qty} cookie${qty > 1 ? 's' : ''}!`, 'heart'); blip(520, 0.1, 'triangle'); updateHUD();
  }
  function deliver(o) {
    if (inv().cookies < o.qty) { say(o.who, `I ordered ${o.qty} cookies and you have ${inv().cookies}. Come back when the tray is full!`); sfx.no(); return; }
    inv().cookies -= o.qty;
    const night = isNight();
    const fast = o.left > o.total * 0.5;
    const pay = o.qty * PRICE_PER_COOKIE * (night ? 2 : 1) + (fast ? 10 : 0);
    S.coins += pay; S.hearts += 1; S.delivered += 1;
    S.orders = S.orders.filter((x) => x !== o);
    sfx.coin();
    say(o.who, `${['Still warm!', 'You are an angel.', 'The kids will riot for these.', 'Sea salt on top? Genius.'][Math.floor(Math.random() * 4)]}<br><b>+${pay} coins</b>${night ? ' (midnight double!)' : ''}${fast ? ' + fast tip' : ''} · +1 ❤`);
    checkUnlocks(); updateHUD(); save();
  }
  function checkUnlocks() {
    const tiers = [[3, 'kraft'], [6, 'barista'], [10, 'sprinkle'], [15, 'midnight'], [20, 'classic']];
    tiers.forEach(([n, o]) => { if (S.hearts >= n && !S.unlocked.includes(o)) { S.unlocked.push(o); setTimeout(() => say('mama', `${S.hearts} hearts! You unlocked the <b>${o}</b> outfit. Change it at the bakery.`), 400); } });
  }

  /* ---------- interactions ---------------------------------------------- */
  function nearest() {
    let best = null, bd = 22;
    for (const o of objects) {
      if (o.nightOnly && !isNight()) continue;
      // distance from the player's feet to the closest edge of the object's footprint
      const x0 = o.x * TILE, y0 = o.y * TILE, x1 = (o.x + (o.bw || 1)) * TILE, y1 = (o.y + (o.bh || 1)) * TILE;
      const d = Math.hypot(player.x - clamp(player.x, x0, x1), player.y - clamp(player.y, y0, y1));
      if (d < bd) { bd = d; best = o; }
    }
    return best;
  }
  function hintFor(o) {
    if (!o) return '';
    switch (o.kind) {
      case 'plot': { const p = S.plots[o.x + ',' + o.y]; if (!p) return inv().seeds ? 'Plant wheat' : 'Need seeds (Hessa sells them)'; if (p.stage >= 3) return 'Harvest wheat'; return p.watered ? 'Growing…' : (inv().water ? 'Water' : 'Refill can at the well'); }
      case 'well': return 'Refill watering can';
      case 'mill': return 'The old mill';
      case 'cow': return nodeReady(o.id) ? 'Milk the cow' : 'Milked today';
      case 'palm': return nodeReady(o.id) ? 'Shake for dates' : 'No dates left today';
      case 'hazel': return nodeReady(o.id) ? 'Pick hazelnuts' : 'Picked today';
      case 'rock': return nodeReady(o.id) ? 'Scrape sea salt' : 'Dry — back tomorrow';
      case 'bakery': return 'Bakery: bake / sleep / shop';
      case 'bed': return 'Sleep until morning';
      case 'truck': return S.riding ? 'Hop out' : 'Hop in the truck';
      case 'house': { const o2 = S.orders.find((x) => x.house === o.id); return o2 ? `Deliver ${o2.qty} to ${o.who}` : o.who + "'s house"; }
      case 'npc': return 'Talk to ' + CAST[o.who].name;
      case 'tree': return '';
    }
    return '';
  }
  function interact(o) {
    if (!o) return;
    switch (o.kind) {
      case 'plot': {
        const key = o.x + ',' + o.y, p = S.plots[key];
        if (!p) { if (inv().seeds > 0) { inv().seeds--; S.plots[key] = { stage: 0, watered: false }; sfx.plant(); } else sfx.no(); }
        else if (p.stage >= 3) { delete S.plots[key]; give('wheat', 2 + (Math.random() < 0.4 ? 1 : 0)); }
        else if (!p.watered) { if (inv().water > 0) { inv().water--; p.watered = true; sfx.water(); } else sfx.no(); }
        break;
      }
      case 'well': inv().water = 10; sfx.water(); toast('Watering can full', '💧'); break;
      case 'mill': say('hessa', 'The mill grinds wheat into flour while you bake. Just bring the wheat to the bakery.'); break;
      case 'cow': if (nodeReady(o.id)) { useNode(o.id); give('milk', 1); } else sfx.no(); break;
      case 'palm': if (nodeReady(o.id)) { useNode(o.id); give('dates', 2); } else sfx.no(); break;
      case 'hazel': if (nodeReady(o.id)) { useNode(o.id); give('hazel', 3); } else sfx.no(); break;
      case 'rock': if (nodeReady(o.id)) { useNode(o.id); give('salt', 1); } else sfx.no(); break;
      case 'bakery': bakeryMenu(); break;
      case 'bed': sleep(); break;
      case 'truck': S.riding = !S.riding; if (S.riding) { player.x = (o.x + 1.2) * TILE; player.y = (o.y + 1.2) * TILE; } toast(S.riding ? 'Vroom. Roads are fast.' : 'Parked.'); break;
      case 'house': { const ord = S.orders.find((x) => x.house === o.id); if (ord) deliver(ord); else say(o.who, `Hi Miya! No order right now, but I can smell the oven from here.`); break; }
      case 'npc': talk(o.who); break;
    }
    updateHUD(); save();
  }

  function talk(who) {
    switch (who) {
      case 'mama': bakeryMenu(); break;
      case 'hessa': say('hessa', `Wheat seeds, 2 coins each. Plant them in the soil, water every morning, harvest on day three. You have <b>${S.coins}</b> coins.`, [
        { label: 'Buy 5 seeds (10c)', fn: () => { if (S.coins >= 10) { S.coins -= 10; give('seeds', 5); } else { sfx.no(); toast('Not enough coins'); } } },
        { label: 'Buy 1 seed (2c)', fn: () => { if (S.coins >= 2) { S.coins -= 2; give('seeds', 1); } else { sfx.no(); toast('Not enough coins'); } } },
        { label: 'Later', ghost: true },
      ]); break;
      case 'noor': say('noor', 'Daisy and Rose give one milk each per day. Be gentle, they gossip.'); break;
      case 'lulu': say('lulu', 'Shake the palms for dates and pick the hazelnut trees. They refill overnight. Dates are our sugar, hazelnuts become the spread.'); break;
      case 'reem': say('reem', 'Psst. After 7 pm every delivery pays <b>double</b>. The midnight batch is where the money is.'); break;
    }
  }

  function bakeryMenu() {
    const buttons = [
      { label: `Bake a batch`, fn: startBake },
      { label: 'Sleep', fn: sleep },
      { label: 'Upgrades', fn: shopMenu },
      { label: 'Outfits', fn: outfitMenu },
      { label: 'Close', ghost: true },
    ];
    say('mama', `Recipe for ${batchSize()} cookies: ${recipeText()}.<br>You are holding <b>${inv().cookies}</b> cookies.`, buttons);
  }
  function shopMenu() {
    const items = [
      ['oven', 'Bigger oven — 10 cookies per batch', 120],
      ['shoes', 'Running shoes — walk faster', 80],
      ['sprinkler', 'Sprinkler — plots water themselves each morning', 150],
    ];
    say('mama', `Coins: <b>${S.coins}</b>. Investments, habibti.`, items.filter(([k]) => !S.upgrades[k]).map(([k, label, cost]) => ({
      label: `${label} (${cost}c)`, fn: () => { if (S.coins >= cost) { S.coins -= cost; S.upgrades[k] = true; sfx.coin(); toast('Upgrade bought!', 'star'); } else { sfx.no(); toast('Not enough coins'); } updateHUD(); save(); },
    })).concat([{ label: 'Back', ghost: true }]));
  }
  function outfitMenu() {
    say('mama', 'Pick an outfit. More unlock as you earn hearts.', OUTFITS.filter((o) => S.unlocked.includes(o)).map((o) => ({ label: o, fn: () => { S.outfit = o; save(); } })).concat([{ label: 'Back', ghost: true }]));
  }

  /* ---------- sleep / new day ------------------------------------------- */
  let fade = 0;
  function sleep() {
    fade = 1;
    setTimeout(() => {
      S.day++; S.time = DAY_START; S.orders = [];
      for (const k in S.plots) { const p = S.plots[k]; if (p.watered && p.stage < 3) p.stage++; p.watered = !!S.upgrades.sprinkler; }
      inv().water = 10;
      player.x = 23.5 * TILE; player.y = 18.6 * TILE; S.riding = false;
      toast(`Day ${S.day}. Fresh start.`, 'star'); updateHUD(); save();
    }, 500);
  }

  /* ---------- baking mini-game ------------------------------------------ */
  const bakeEl = $('#bake'), bakeMarker = $('#bake-marker'), bakeMsg = $('#bake-msg'), bakeBtn = $('#bake-btn');
  let baking = false, bakeT = 0, bakeSpeed = 1.1;
  function startBake() {
    if (!canBake()) { say('mama', `Not enough ingredients. You need ${recipeText()}.`); sfx.no(); return; }
    Object.entries(RECIPE).forEach(([k, n]) => { inv()[k] -= n; });
    baking = true; bakeT = 0; bakeSpeed = 0.9 + Math.random() * 0.5;
    bakeEl.hidden = false; bakeMsg.textContent = 'Stop the dial in the golden zone!'; bakeBtn.textContent = 'Take them out!';
    updateHUD();
  }
  function stopBake() {
    if (!baking) return;
    baking = false;
    const v = (Math.sin(bakeT) + 1) / 2;     // 0..1, drifting back and forth
    let made, name, icon;
    if (v >= 0.58 && v <= 0.72) { made = batchSize(); name = 'Golden!'; icon = 'golden'; sfx.coin(); }
    else if (v >= 0.42 && v <= 0.85) { made = Math.round(batchSize() * 0.7); name = 'Nicely baked.'; icon = 'signature'; sfx.pick(); }
    else { made = 1; name = v < 0.42 ? 'Raw in the middle. One survived.' : 'Burnt! Mama is not angry, just disappointed.'; icon = v < 0.42 ? 'dough' : 'burnt'; sfx.no(); }
    inv().cookies += made;
    bakeMsg.textContent = `${name} +${made} cookies`;
    bakeBtn.textContent = 'Done';
    toast(`+${made} cookies`, icon);
    if (S.tutorial < 2) { S.tutorial = 2; setTimeout(() => say('mama', 'Now watch for <b>!</b> above the houses. Neighbours will order, and their patience runs out. Deliver while warm!'), 300); }
    updateHUD(); save();
  }
  bakeBtn.addEventListener('click', () => { if (baking) stopBake(); else bakeEl.hidden = true; });

  /* ---------- HUD -------------------------------------------------------- */
  const hClock = $('#h-clock'), hCoins = $('#h-coins'), hHearts = $('#h-hearts'), hInv = $('#h-inv'), hOrders = $('#h-orders'), hHint = $('#h-hint'), hDay = $('#h-day');
  let hudDirty = true;
  function updateHUD() { hudDirty = true; }
  function renderHUD() {
    const h = Math.floor(S.time / 60), m = Math.floor(S.time % 60);
    hClock.textContent = `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h >= 12 ? 'pm' : 'am'}`;
    hDay.textContent = 'Day ' + S.day;
    hCoins.textContent = S.coins; hHearts.textContent = S.hearts;
    if (!hudDirty) return; hudDirty = false;
    hInv.innerHTML = ['cookies', 'wheat', 'milk', 'dates', 'salt', 'hazel', 'seeds', 'water'].map((k) => {
      const ic = ING_ICON[k];
      const img = PROPS[ic] ? `<img class="pixel" src="${propURL(ic)}" width="20" height="20" alt="">` : `<span>${ic}</span>`;
      return `<div class="inv__item" title="${ING[k]}">${img}<b>${inv()[k] || 0}</b></div>`;
    }).join('');
    hOrders.innerHTML = S.orders.map((o) => `<div class="order"><b>${o.who}</b> · ${o.qty} 🍪<div class="order__bar"><i style="width:${(o.left / o.total) * 100}%"></i></div></div>`).join('');
  }

  const puffs = [];
  function spawnPuff(x, y, color, life, vx, vy) { puffs.push({ x, y, color, life, max: life, vx, vy }); }
  function drawPuffs(dt) { for (let i = puffs.length - 1; i >= 0; i--) { const p = puffs[i]; p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; if (p.life <= 0) { puffs.splice(i, 1); continue; } const r = Math.round((1 - p.life / p.max) * 2); disc(Math.round(p.x - cam.x), Math.round(p.y - cam.y), r, p.color); } }

  /* ---------- drawing the world ------------------------------------------ */
  function drawTile(t, x, y, tx, ty, time) {
    switch (t) {
      case T.GRASS: {
        rect(x, y, TILE, TILE, (tx + ty) % 2 ? GREEN.grass : GREEN.grass2);
        const h1 = hash(tx * 31 + ty * 7);
        if (h1 < 0.22) { px(x + 4, y + 9, GREEN.deep); px(x + 5, y + 8, GREEN.deep); px(x + 11, y + 5, GREEN.deep); px(x + 12, y + 4, GREEN.deep); }
        else if (h1 < 0.30) { rect(x + 3, y + 10, 3, 1, GREEN.deep); rect(x + 9, y + 5, 3, 1, GREEN.deep); }
        const h2 = hash(tx * 13 + ty * 17);
        if (h2 < 0.06) { const c = [PAL.R, PAL.p, PAL.G, PAL.W][ty % 4]; px(x + 7, y + 6, c); px(x + 9, y + 6, c); px(x + 8, y + 5, c); px(x + 8, y + 7, c); px(x + 8, y + 6, PAL.G); px(x + 8, y + 9, GREEN.deep); }
        else if (h2 < 0.09) { rect(x + 5, y + 10, 2, 2, PAL.W); rect(x + 5, y + 9, 2, 1, PAL.R); px(x + 5, y + 9, PAL.X); }
        // soft edge where grass meets a path or sand
        if (tileAt(tx, ty + 1) === T.PATH) for (let i = 0; i < TILE; i += 3) px(x + i + (ty % 3), y + 15, PAL.T);
        if (tileAt(tx, ty - 1) === T.PATH) for (let i = 1; i < TILE; i += 4) px(x + i, y, PAL.T);
        break;
      }
      case T.PATH: rect(x, y, TILE, TILE, PAL.T); if (hash(tx * 5 + ty * 3) < 0.3) px(x + 3 + (tx % 7), y + 2 + (ty % 9), PAL.t); break;
      case T.SAND: rect(x, y, TILE, TILE, (tx + ty) % 2 ? GREEN.sand : GREEN.sand2); if (hash(tx * 9 + ty) < 0.1) px(x + 6, y + 10, PAL.w); break;
      case T.WATER: { rect(x, y, TILE, TILE, GREEN.water); const wv = Math.floor(time * 2 + tx) % 4; if (ty === 31) { rect(x, y, TILE, 2, PAL.W); rect(x + ((tx * 5 + Math.floor(time * 3)) % 8), y + 2, 4, 1, PAL.W); } if ((tx + ty) % 3 === wv % 3) rect(x + 3, y + 6 + (wv % 2), 6, 1, GREEN.water2); if (hash(tx * 3 + ty * 11 + Math.floor(time)) < 0.04) px(x + 8, y + 9, PAL.X); break; }
      case T.SOIL: rect(x, y, TILE, TILE, GREEN.soil); rect(x, y + 3, TILE, 1, GREEN.soilWet); rect(x, y + 9, TILE, 1, GREEN.soilWet); break;
      case T.FLOOR: rect(x, y, TILE, TILE, PAL.t); if (hash(tx + ty * 3) < 0.3) px(x + 5, y + 7, PAL.e); break;
    }
  }
  function drawTree(x, y, time, seed) {
    const sway = Math.round(Math.sin((time || 0) * 1.3 + (seed || 0)) * 1.2);
    const blossom = ((seed || 0) % 3) === 1;
    ellipse(x + 8, y + 16, 7, 2, 'rgba(43,33,28,0.18)');
    rect(x + 7, y + 8, 2, 8, PAL.e); px(x + 7, y + 11, PAL.d);
    disc(x + 8 + sway, y + 4, 7, blossom ? '#D98BA3' : GREEN.deep); disc(x + 7 + sway, y + 2, 5, blossom ? PAL.p : GREEN.light);
    px(x + 5 + sway, y, PAL.W); if (blossom) { px(x + 11 + sway, y + 5, PAL.R); px(x + 3 + sway, y + 6, PAL.W); }
  }
  function ellipse(cx, cy, rx, ry, c) { for (let y = -ry; y <= ry; y++) { const h = Math.floor(rx * Math.sqrt(1 - (y * y) / (ry * ry))); rect(cx - h, cy + y, h * 2 + 1, 1, c); } }
  function drawShadow(x, y, w) { ellipse(Math.round(x), Math.round(y), w, 2, 'rgba(43,33,28,0.22)'); }
  const PALM_CROWN = ['....LL.LL....', '..LLDDLDDLL..', '.LDD.DDD.DDL.', 'LD..DDDDD..DL', 'L..DD.D.DD..L', '..D..DDD..D..', '.....D.D.....'];
  const GMAP = { D: GREEN.deep, L: GREEN.light, C: PAL.C };
  function gridc(g, ox, oy, map) { for (let y = 0; y < g.length; y++) for (let x = 0; x < g[y].length; x++) { const ch = g[y][x]; if (ch !== '.') px(ox + x, oy + y, map[ch]); } }
  function drawPalm(x, y, ready) {
    ellipse(x + 8, y + 16, 6, 2, 'rgba(43,33,28,0.18)');
    rect(x + 7, y - 1, 2, 17, PAL.d); px(x + 7, y + 3, PAL.e); px(x + 8, y + 7, PAL.e); px(x + 7, y + 11, PAL.e);
    const sway = Math.round(Math.sin(smokeT * 1.1 + x * 0.05) * 1);
    gridc(PALM_CROWN, x + 2 + sway, y - 6, GMAP);
    if (ready) { px(x + 6 + sway, y + 1, PAL.C); px(x + 9 + sway, y + 1, PAL.C); px(x + 7 + sway, y + 2, PAL.d); px(x + 8 + sway, y + 2, PAL.C); }
  }
  function drawHazel(x, y, ready) { ellipse(x + 8, y + 16, 7, 2, 'rgba(43,33,28,0.18)'); rect(x + 7, y + 9, 2, 7, PAL.e); disc(x + 8, y + 5, 7, GREEN.mid); disc(x + 7, y + 3, 5, GREEN.light); if (ready) { px(x + 4, y + 6, PAL.d); px(x + 10, y + 4, PAL.d); px(x + 8, y + 9, PAL.d); px(x + 12, y + 8, PAL.d); } }
  function drawRock(x, y, ready) { disc(x + 8, y + 10, 5, PAL.k); disc(x + 7, y + 9, 4, PAL.w); if (ready) { px(x + 6, y + 7, PAL.X); px(x + 9, y + 8, PAL.X); px(x + 8, y + 10, PAL.X); } }
  function drawWell(x, y) { rect(x + 2, y + 6, 12, 8, PAL.t); rect(x + 2, y + 6, 12, 1, PAL.K); rect(x + 4, y + 8, 8, 3, PAL.B); rect(x + 3, y - 2, 1, 9, PAL.e); rect(x + 12, y - 2, 1, 9, PAL.e); rect(x + 1, y - 4, 14, 3, PAL.R); rect(x + 1, y - 4, 14, 1, PAL.K); }
  function drawMill(x, y, time) { rect(x + 8, y + 6, 16, 26, PAL.w); rect(x + 8, y + 6, 16, 1, PAL.K); rect(x + 6, y, 20, 7, PAL.e); rect(x + 14, y + 22, 5, 10, PAL.K); const a = time * 1.5; ctx.save(); ctx.translate(x + 16, y + 10); ctx.rotate(a); for (let i = 0; i < 4; i++) { ctx.rotate(Math.PI / 2); rect(-1, 0, 2, 14, PAL.K); rect(1, 3, 3, 10, PAL.W); } ctx.restore(); }
  function drawFence(x, y) { rect(x + 2, y + 4, 2, 10, PAL.e); rect(x + 12, y + 4, 2, 10, PAL.e); rect(x, y + 6, TILE, 2, PAL.t); rect(x, y + 10, TILE, 2, PAL.t); }
  function drawHouse(o, x, y) {
    const c = PAL[o.color] || PAL.R;
    rect(x, y + 20, 48, 28, PAL.W); rect(x, y + 20, 48, 1, PAL.K); rect(x, y + 47, 48, 1, PAL.k);
    for (let i = 0; i < 4; i++) rect(x - 2 + i * 2, y + 2 + i * 5, 52 - i * 4, 5, i % 2 ? c : PAL.K); rect(x - 2, y + 17, 52, 4, c);
    rect(x + 20, y + 33, 8, 14, PAL.K); rect(x + 21, y + 34, 6, 13, PAL.e); px(x + 26, y + 41, PAL.G);
    rect(x + 6, y + 27, 8, 8, PAL.K); rect(x + 7, y + 28, 6, 6, isNight() ? PAL.G : PAL.B);
    rect(x + 34, y + 27, 8, 8, PAL.K); rect(x + 35, y + 28, 6, 6, isNight() ? PAL.G : PAL.B);
    rect(x + 5, y + 35, 10, 2, PAL.e); px(x + 7, y + 34, PAL.R); px(x + 10, y + 34, PAL.p); px(x + 12, y + 34, PAL.G);
    rect(x + 38, y + 4, 5, 10, PAL.k); rect(x + 37, y + 3, 7, 2, PAL.K);
    for (let i = 0; i < 3; i++) { const u = (smokeT * 0.5 + i * 0.33 + (o.x % 5) * 0.1) % 1; disc(x + 40 + Math.round(Math.sin(u * 6 + i) * 2), y + 1 - Math.round(u * 14), 1 + Math.round(u * 2), `rgba(255,249,240,${0.8 - u * 0.75})`); }
  }
  let smokeT = 0;
  function drawBakery(x, y, time) {
    rect(x, y + 28, 112, 52, PAL.T); rect(x, y + 28, 112, 1, PAL.K); rect(x, y + 79, 112, 1, PAL.k);
    for (let i = 0; i < 5; i++) rect(x - 3 + i * 3, y + 2 + i * 6, 118 - i * 6, 6, i % 2 ? PAL.R : PAL.K);
    rect(x - 3, y + 26, 118, 4, PAL.R);
    rect(x + 90, y - 10, 8, 16, PAL.k); rect(x + 89, y - 11, 10, 2, PAL.K);
    for (let i = 0; i < 3; i++) { const t = (time * 0.6 + i * 0.33) % 1; disc(x + 94 + Math.round(Math.sin(t * 6) * 3), y - 12 - Math.round(t * 18), 2 + Math.round(t * 2), 'rgba(255,249,240,' + (0.8 - t * 0.7) + ')'); }
    rect(x + 48, y + 58, 16, 22, PAL.K); rect(x + 49, y + 59, 14, 21, PAL.e); px(x + 60, y + 70, PAL.G);
    [[8, 40], [30, 40], [72, 40], [94, 40]].forEach(([dx, dy]) => { rect(x + dx, y + dy, 12, 12, PAL.K); rect(x + dx + 1, y + dy + 1, 10, 10, isNight() ? PAL.G : PAL.W); rect(x + dx - 1, y + dy + 12, 14, 2, PAL.e); px(x + dx + 2, y + dy + 11, PAL.R); px(x + dx + 8, y + dy + 11, PAL.p); });
    rect(x + 36, y + 30, 40, 12, PAL.W); rect(x + 36, y + 30, 40, 1, PAL.K); rect(x + 36, y + 41, 40, 1, PAL.K); rect(x + 36, y + 30, 1, 12, PAL.K); rect(x + 75, y + 30, 1, 12, PAL.K);
    grid(BADGE, x + 40, y + 32); ctx.fillStyle = PAL.K; ctx.font = '7px "Press Start 2P", monospace'; ctx.fillText("MIYA'S", x + 50, y + 39);
  }
  function drawTruck(x, y, moving, time) {
    grid(TRUCK, x, y + 6 - 20 + 20 - 6);
    grid(BADGE, x + 5, y + 6 + 6);
    const step = moving ? Math.floor(time * 12) & 7 : 0;
    const bolt = [[2, 0], [2, 2], [0, 2], [-2, 2], [-2, 0], [-2, -2], [0, -2], [2, -2]][step];
    [[8, 19], [31, 19]].forEach(([wx, wy]) => { grid(WHEEL, x + wx - 4, y + wy - 4); px(x + wx + bolt[0], y + wy + bolt[1], PAL.G); });
  }
  function drawCrop(x, y, p) {
    if (p.watered) rect(x, y, TILE, TILE, 'rgba(60,40,25,0.35)');
    if (p.stage === 0) { px(x + 5, y + 10, GREEN.light); px(x + 10, y + 9, GREEN.light); }
    else if (p.stage === 1) { rect(x + 5, y + 6, 1, 6, GREEN.deep); rect(x + 10, y + 5, 1, 7, GREEN.deep); px(x + 4, y + 6, GREEN.light); px(x + 11, y + 5, GREEN.light); }
    else if (p.stage === 2) { [4, 8, 12].forEach((dx) => { rect(x + dx, y + 3, 1, 10, GREEN.deep); px(x + dx - 1, y + 4, GREEN.light); px(x + dx + 1, y + 6, GREEN.light); }); }
    else { [3, 7, 11].forEach((dx) => { rect(x + dx, y + 4, 1, 9, PAL.g); rect(x + dx - 1, y + 1, 3, 4, PAL.G); px(x + dx, y, PAL.g); }); }
  }

  function drawWorld(time) {
    const x0 = Math.floor(cam.x / TILE), y0 = Math.floor(cam.y / TILE);
    for (let ty = y0; ty <= y0 + Math.ceil(H / TILE) + 1; ty++) for (let tx = x0; tx <= x0 + Math.ceil(W / TILE) + 1; tx++) {
      drawTile(tileAt(tx, ty), tx * TILE - cam.x, ty * TILE - cam.y, tx, ty, time);
      const p = S.plots[tx + ',' + ty]; if (p) drawCrop(tx * TILE - cam.x, ty * TILE - cam.y, p);
    }
    // depth-sorted sprites
    const draws = [];
    for (const o of objects) {
      if (o.nightOnly && !isNight()) continue;
      const x = o.x * TILE - cam.x, y = o.y * TILE - cam.y;
      if (x < -130 || y < -100 || x > W + 40 || y > H + 60) continue;
      const bottom = (o.y + (o.bh || 1)) * TILE + (o.kind === 'house' ? 32 : o.kind === 'bakery' ? 0 : 0);
      draws.push({ z: bottom + (o.kind === 'plot' ? -100 : 0), fn: () => {
        switch (o.kind) {
          case 'tree': drawTree(x, y, time, o.x * 7 + o.y); break;
          case 'palm': drawPalm(x, y, nodeReady(o.id)); break;
          case 'hazel': drawHazel(x, y, nodeReady(o.id)); break;
          case 'rock': drawRock(x, y, nodeReady(o.id)); break;
          case 'well': drawWell(x, y); break;
          case 'mill': drawMill(x, y, time); break;
          case 'fence': drawFence(x, y); break;
          case 'cow': grid(COW, x, y + 4, o.id === 'cow2'); if (!nodeReady(o.id)) px(x + 3, y + 2, PAL.P); break;
          case 'house': drawHouse(o, x, y - 32); { const ord = S.orders.find((q) => q.house === o.id); if (ord) { const bob = Math.round(Math.sin(time * 6) * 2); rect(x + 20, y - 44 + bob, 8, 10, PAL.W); rect(x + 20, y - 44 + bob, 8, 1, PAL.K); rect(x + 20, y - 34 + bob, 8, 1, PAL.K); ctx.fillStyle = PAL.R; ctx.fillRect(x + 23, y - 42 + bob, 2, 5); ctx.fillRect(x + 23, y - 36 + bob, 2, 1); } } break;
          case 'bakery': drawBakery(x, y - 28, time); break;
          case 'bed': rect(x + 2, y + 4, 12, 8, PAL.B); rect(x + 2, y + 4, 4, 8, PAL.W); rect(x + 2, y + 3, 12, 1, PAL.K); break;
          case 'truck': if (!S.riding) drawTruck(x - 8, y - 8, false, time); break;
          case 'npc': { const c = CAST[o.who]; drawShadow(x + 8, y + 17, 7); chr(c.outfit, Math.floor(time * 1.4) % 2 ? 'idle' : (o.who === 'mama' ? 'tray' : o.who === 'noor' ? 'mix' : 'idle'), x - 8, y - 20, false); break; }
        }
      } });
    }
    // player
    const pz = player.y;
    draws.push({ z: pz, fn: () => {
      const x = player.x - cam.x, y = player.y - cam.y;
      drawShadow(x, y + 1, S.riding ? 18 : 7);
      if (S.riding) { drawTruck(x - 20, y - 26, player.moving, time); chr(S.outfit, 'idle', x - 20 + 4, y - 26 + 6 + 11 - 32 + 6 - 3, false); }
      else chr(S.outfit, player.moving ? (Math.floor(player.anim * 8) % 2 ? 'run' : 'idle') : (inv().cookies > 0 ? 'tray' : 'idle'), x - 16, y - 30, player.dir < 0);
    } });
    draws.sort((a, b) => a.z - b.z).forEach((d) => d.fn());
    drawPuffs(1 / 60);
    // butterflies by day, fireflies by night
    for (let i = 0; i < 6; i++) { const bx = Math.round((hash(i) * MAP_W * TILE + Math.sin(time * 0.7 + i) * 30) - cam.x), by = Math.round((hash(i + 40) * MAP_H * TILE * 0.8 + Math.cos(time * 0.9 + i) * 12) - cam.y); if (bx < 0 || by < 0 || bx > W || by > H) continue; if (isNight()) { if (Math.sin(time * 3 + i) > 0) { px(bx, by, PAL.G); disc(bx, by, 2, 'rgba(243,201,76,0.25)'); } } else { const f = Math.floor(time * 8 + i) % 2; const c = [PAL.G, PAL.p, PAL.W][i % 3]; px(bx, by, c); px(bx + (f ? 1 : 2), by - 1, c); px(bx - (f ? 1 : 2), by - 1, c); } }

    // night tint + window glow
    if (isNight()) { const a = clamp((S.time - NIGHT_AT) / 120, 0, 1) * 0.45; rect(0, 0, W, H, `rgba(40,30,80,${a})`); }
    if (fade > 0) { rect(0, 0, W, H, `rgba(43,33,28,${fade})`); }
  }

  /* ---------- main loop ---------------------------------------------------- */
  let last = performance.now(), time = 0, autosave = 0;
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now; time += dt;

    if (!dialogOpen && !baking && fade <= 0.01) {
      let dx = (keys.arrowright || keys.d ? 1 : 0) - (keys.arrowleft || keys.a ? 1 : 0);
      let dy = (keys.arrowdown || keys.s ? 1 : 0) - (keys.arrowup || keys.w ? 1 : 0);
      if (joy.active) { dx = joy.dx; dy = joy.dy; }
      const len = Math.hypot(dx, dy);
      player.moving = len > 0.2;
      if (player.moving) {
        dx /= len; dy /= len;
        const onRoad = tileAt(Math.floor(player.x / TILE), Math.floor(player.y / TILE)) === T.PATH;
        let speed = 58 * (S.upgrades.shoes ? 1.3 : 1);
        if (S.riding) speed = onRoad ? 150 : 70;
        tryMove(dx * speed * dt, dy * speed * dt);
        if (Math.abs(dx) > 0.2) player.dir = dx > 0 ? 1 : -1;
        player.anim += dt;
        if (Math.random() < (S.riding ? 0.5 : 0.18)) spawnPuff(player.x + (Math.random() - 0.5) * 6, player.y, S.riding ? PAL.T : 'rgba(216,174,126,0.8)', 0.4, -dx * 10, -6);
      }
      if (actionQueued) { interact(nearest()); }
      // clock
      S.time += dt * MIN_PER_SEC;
      if (S.time >= DAY_END) sleep();
      orderTimer -= dt;
      if (orderTimer <= 0 && S.orders.length < 3 && S.tutorial >= 1) { spawnOrder(); orderTimer = 35 + Math.random() * 30; }
      for (const o of S.orders) o.left -= dt;
      const expired = S.orders.filter((o) => o.left <= 0);
      if (expired.length) { S.orders = S.orders.filter((o) => o.left > 0); toast(`${expired[0].who} gave up waiting.`, 'crumbs'); sfx.no(); updateHUD(); }
    }
    actionQueued = false;
    if (fade > 0) fade = Math.max(0, fade - dt * 1.2);
    if (baking) { bakeT += dt * 3.2 * bakeSpeed; bakeMarker.style.left = ((Math.sin(bakeT) + 1) / 2 * 100) + '%'; }

    cam.x = clamp(Math.round(player.x - W / 2), 0, MAP_W * TILE - W);
    cam.y = clamp(Math.round(player.y - H / 2), 0, MAP_H * TILE - H);
    smokeT = time;
    drawWorld(time);
    hHint.textContent = dialogOpen || baking ? '' : hintFor(nearest());
    renderHUD();
    if ((autosave += dt) > 5) { autosave = 0; S.px = player.x; S.py = player.y; save(); }
    requestAnimationFrame(frame);
  }

  /* ---------- boot -------------------------------------------------------- */
  Promise.all([loadImg('miya', 'assets/img/sprites/miya_sheet.png'), loadImg('props', 'assets/img/sprites/props_sheet.png')]).then(() => {
    buildWorld();
    S = load();
    player.x = S.px; player.y = S.py;
    fit(); updateHUD();
    $('#h-reset').addEventListener('click', () => { if (confirm('Start a brand new farm? Your progress will be lost.')) { localStorage.removeItem(SAVE_KEY); location.reload(); } });
    if (S.tutorial === 0) {
      say('mama', `Morning, Miya! The oven is warm and the neighbours are hungry. Grow <b>wheat</b> on the farm, milk the <b>cows</b>, shake the <b>palms</b>, pick <b>hazelnuts</b>, scrape <b>sea salt</b> on the beach, then come bake.<br><small>Move: drag / WASD. Act: A / E.</small>`, [{ label: "Let's bake", fn: () => { S.tutorial = 1; save(); } }]);
    }
    requestAnimationFrame(frame);
    // tiny hook for tests / tinkering in the console
    window.MiyaFarm = { get state() { return S; }, player, act: () => interact(nearest()), hint: () => hintFor(nearest()), save, goto: (tx, ty) => { player.x = tx * TILE; player.y = ty * TILE; } };
  });
})();
