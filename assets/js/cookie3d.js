/* ==========================================================================
   The Signature in 3D — exploded view of the Nutella sea-salt cookie
   --------------------------------------------------------------------------
   Procedural geometry only (no model files): two rustic dough discs with a
   bumpy displaced surface, chocolate chunks, a Nutella core disc, and sea
   salt flakes. Drag to orbit, pinch/wheel to zoom, slider to explode, tap a
   layer to read about it. "Pixel mode" renders at a low resolution and
   upscales with nearest-neighbour so it matches the rest of the site.
   ========================================================================== */
(function () {
  'use strict';
  const canvas = document.getElementById('c3d');
  if (!canvas || !window.THREE) return;
  const THREE = window.THREE;
  const stage = document.getElementById('c3d-stage');
  const label = document.getElementById('c3d-label');
  const slider = document.getElementById('c3d-explode');

  const COL = { dough: 0xC68946, doughLight: 0xE2AC68, crust: 0x966030, nutella: 0x3A2014, nutellaLight: 0x633821, salt: 0xFFFFFF, ink: 0x2B211C, kraft: 0xD8B389 };

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setClearColor(COL.kraft);
  renderer.shadowMap.enabled = true;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);

  scene.add(new THREE.HemisphereLight(0xFFF1DC, 0x785C4A, 0.9));
  const sun = new THREE.DirectionalLight(0xFFF9F0, 0.9);
  sun.position.set(3, 6, 4); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024);
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0xF0B0BE, 0.25); fill.position.set(-4, 2, -3); scene.add(fill);

  // ground plate (the kraft box lid) that catches the shadow
  const plate = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.6, 0.08, 48), new THREE.MeshStandardMaterial({ color: 0xD8AE7E, roughness: 1 }));
  plate.position.y = -0.55; plate.receiveShadow = true; scene.add(plate);

  /* ---------- geometry helpers ---------------------------------------- */
  const rnd = (seed) => { let x = Math.sin(seed * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  function bumpy(geo, amount, seed) {
    // displace vertices outward a little with cheap layered noise for a rustic bake
    const pos = geo.attributes.position;
    const v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      const n = Math.sin(v.x * 4.1 + seed) * Math.cos(v.z * 3.7 - seed) * 0.5 + Math.sin(v.x * 9 + v.z * 7 + seed) * 0.25 + (rnd(i + seed) - 0.5) * 0.3;
      v.multiplyScalar(1 + n * amount);
      pos.setXYZ(i, v.x, v.y, v.z);
    }
    pos.needsUpdate = true; geo.computeVertexNormals();
  }
  function doughHalf(top, seed) {
    const g = new THREE.Group();
    // a squashed sphere half reads as a domed cookie half
    const geo = new THREE.SphereGeometry(1.5, 48, 24, 0, Math.PI * 2, top ? 0 : Math.PI / 2, Math.PI / 2);
    bumpy(geo, 0.06, seed);
    const dough = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: COL.dough, roughness: 0.95, flatShading: false }));
    dough.scale.set(1, 0.38, 1); dough.castShadow = dough.receiveShadow = true;
    g.add(dough);
    // crust ring at the equator
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.47, 0.09, 10, 48), new THREE.MeshStandardMaterial({ color: COL.crust, roughness: 1 }));
    ring.rotation.x = Math.PI / 2; ring.position.y = top ? 0.02 : -0.02; g.add(ring);
    // flat face where the halves meet
    const face = new THREE.Mesh(new THREE.CircleGeometry(1.46, 48), new THREE.MeshStandardMaterial({ color: COL.doughLight, roughness: 1, side: THREE.DoubleSide }));
    face.rotation.x = top ? Math.PI / 2 : -Math.PI / 2; g.add(face);
    // chocolate chunks pressed into the surface
    for (let i = 0; i < 14; i++) {
      const a = rnd(i * 3 + seed) * Math.PI * 2, r = 0.25 + rnd(i * 5 + seed) * 1.05;
      const chip = new THREE.Mesh(new THREE.DodecahedronGeometry(0.09 + rnd(i * 7 + seed) * 0.07, 0), new THREE.MeshStandardMaterial({ color: COL.nutella, roughness: 0.6 }));
      const yy = Math.sqrt(Math.max(0, 1 - (r / 1.5) ** 2)) * 0.5;
      chip.position.set(Math.cos(a) * r, top ? yy : -yy, Math.sin(a) * r);
      chip.rotation.set(rnd(i) * 3, rnd(i + 1) * 3, rnd(i + 2) * 3); chip.castShadow = true;
      g.add(chip);
    }
    return g;
  }

  const layers = {};
  layers.top = doughHalf(true, 1); layers.top.userData = { name: 'Top dough', blurb: 'Brown-butter dough, chilled overnight so it spreads slowly and keeps a thick, soft centre.' };
  layers.bottom = doughHalf(false, 7); layers.bottom.userData = { name: 'Bottom dough', blurb: 'Same dough, baked a touch longer for a crisp base that holds the molten middle.' };

  const core = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.9, 0.34, 40), new THREE.MeshStandardMaterial({ color: COL.nutella, roughness: 0.35, metalness: 0.05 }));
  bumpy(core.geometry, 0.02, 3);
  core.castShadow = true;
  const coreGroup = new THREE.Group(); coreGroup.add(core);
  const drip = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 8), new THREE.MeshStandardMaterial({ color: COL.nutellaLight, roughness: 0.3 }));
  drip.position.set(0.7, -0.22, 0.35); drip.scale.set(1, 1.6, 1); coreGroup.add(drip);
  layers.core = coreGroup; layers.core.userData = { name: 'Nutella core', blurb: 'A frozen disc of hazelnut spread, sealed inside the dough. It melts as the cookie bakes and stays molten while it travels to you.' };

  const salt = new THREE.Group();
  for (let i = 0; i < 26; i++) {
    const a = rnd(i * 11 + 4) * Math.PI * 2, r = rnd(i * 13 + 5) * 1.15;
    const flake = new THREE.Mesh(new THREE.BoxGeometry(0.07 + rnd(i) * 0.06, 0.03, 0.07 + rnd(i + 9) * 0.05), new THREE.MeshStandardMaterial({ color: COL.salt, roughness: 0.4 }));
    const yy = Math.sqrt(Math.max(0, 1 - (r / 1.5) ** 2)) * 0.52 + 0.03;
    flake.position.set(Math.cos(a) * r, yy, Math.sin(a) * r);
    flake.rotation.set((rnd(i + 3) - 0.5) * 0.8, rnd(i + 4) * 3, (rnd(i + 5) - 0.5) * 0.8);
    salt.add(flake);
  }
  layers.salt = salt; layers.salt.userData = { name: 'Sea salt flakes', blurb: 'Flaky sea salt pressed on the moment the tray comes out. It cuts the sweetness and makes the hazelnut taste louder.' };

  const cookie = new THREE.Group();
  Object.values(layers).forEach((l) => cookie.add(l));
  scene.add(cookie);

  // explode offsets (y) per layer at full spread
  const SPREAD = { salt: 1.9, top: 1.15, core: 0.0, bottom: -1.05 };
  let explode = 0, target = 0, bitten = false, autoSpin = true, pixelMode = false;

  /* ---------- bite: hide a wedge with a clipping plane ------------------ */
  const bitePlane = new THREE.Plane(new THREE.Vector3(-1, 0, -0.6).normalize(), 1.05);
  function setBite(on) {
    bitten = on;
    renderer.localClippingEnabled = on;
    cookie.traverse((m) => { if (m.isMesh) m.material.clippingPlanes = on ? [bitePlane] : []; });
    document.getElementById('c3d-bite').textContent = on ? 'Un-bite' : 'Take a bite';
  }

  /* ---------- camera orbit -------------------------------------------- */
  const orbit = { theta: 0.6, phi: 1.05, dist: 6.2, vx: 0 };
  let dragging = false, lx = 0, ly = 0, pinch = 0;
  const onDown = (x, y) => { dragging = true; lx = x; ly = y; orbit.vx = 0; };
  const onMove = (x, y) => { if (!dragging) return; orbit.theta -= (x - lx) * 0.01; orbit.phi = Math.max(0.35, Math.min(1.45, orbit.phi - (y - ly) * 0.01)); orbit.vx = -(x - lx) * 0.01; lx = x; ly = y; };
  canvas.addEventListener('mousedown', (e) => onDown(e.clientX, e.clientY));
  window.addEventListener('mousemove', (e) => onMove(e.clientX, e.clientY));
  window.addEventListener('mouseup', () => { dragging = false; });
  canvas.addEventListener('touchstart', (e) => { if (e.touches.length === 2) pinch = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY); else onDown(e.touches[0].clientX, e.touches[0].clientY); e.preventDefault(); }, { passive: false });
  canvas.addEventListener('touchmove', (e) => { if (e.touches.length === 2) { const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY); orbit.dist = Math.max(3.5, Math.min(10, orbit.dist * (pinch / d))); pinch = d; } else onMove(e.touches[0].clientX, e.touches[0].clientY); e.preventDefault(); }, { passive: false });
  canvas.addEventListener('touchend', () => { dragging = false; });
  canvas.addEventListener('wheel', (e) => { orbit.dist = Math.max(3.5, Math.min(10, orbit.dist + e.deltaY * 0.005)); e.preventDefault(); }, { passive: false });

  /* ---------- tap a layer ----------------------------------------------- */
  const ray = new THREE.Raycaster(), mouse = new THREE.Vector2();
  let downAt = null;
  canvas.addEventListener('pointerdown', (e) => { downAt = [e.clientX, e.clientY]; });
  canvas.addEventListener('pointerup', (e) => {
    if (!downAt || Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) > 6) return;
    const r = canvas.getBoundingClientRect();
    mouse.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(mouse, camera);
    const hit = ray.intersectObjects(cookie.children, true)[0];
    if (!hit) { label.hidden = true; return; }
    let o = hit.object; while (o && !o.userData.name) o = o.parent;
    if (!o) return;
    label.innerHTML = `<b>${o.userData.name}</b><br><span class="muted">${o.userData.blurb}</span>`;
    label.hidden = false;
    if (explode < 0.2) { target = 1; slider.value = 100; }
  });

  /* ---------- controls -------------------------------------------------- */
  slider.addEventListener('input', () => { target = slider.value / 100; });
  document.getElementById('c3d-toggle').addEventListener('click', (e) => { target = target > 0.5 ? 0 : 1; slider.value = target * 100; e.currentTarget.innerHTML = target > 0.5 ? 'Assemble &darr;' : 'Explode &uarr;'; });
  document.getElementById('c3d-bite').addEventListener('click', () => setBite(!bitten));
  document.getElementById('c3d-spin').addEventListener('click', (e) => { autoSpin = !autoSpin; e.currentTarget.setAttribute('aria-pressed', String(autoSpin)); });
  document.getElementById('c3d-pixel').addEventListener('click', (e) => { pixelMode = !pixelMode; e.currentTarget.setAttribute('aria-pressed', String(pixelMode)); canvas.classList.toggle('is-pixel', pixelMode); resize(); });

  function resize() {
    const w = stage.clientWidth, h = stage.clientHeight;
    renderer.setPixelRatio(pixelMode ? 0.28 : Math.min(2, window.devicePixelRatio || 1));
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);
  resize();

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    explode += (target - explode) * Math.min(1, dt * 6);
    const ease = explode < 0.5 ? 2 * explode * explode : 1 - Math.pow(-2 * explode + 2, 2) / 2;
    for (const k in layers) layers[k].position.y = SPREAD[k] * ease;
    if (autoSpin && !dragging) orbit.theta += dt * 0.35; else if (!dragging) { orbit.theta += orbit.vx; orbit.vx *= 0.92; }
    camera.position.set(Math.sin(orbit.theta) * Math.sin(orbit.phi) * orbit.dist, Math.cos(orbit.phi) * orbit.dist, Math.cos(orbit.theta) * Math.sin(orbit.phi) * orbit.dist);
    camera.lookAt(0, 0.25 * ease, 0);
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
