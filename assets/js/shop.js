/* ==========================================================================
   Miya's Cookies — shop: menu, cart, checkout, delivery map
   --------------------------------------------------------------------------
   Catalogue + zones come from /api/catalogue.php. The cart lives in
   localStorage. Checkout POSTs to /api/orders.php, which prices everything
   server-side and replies with a redirect (confirmation page or Stripe).
   ========================================================================== */
(function () {
  'use strict';

  const CART_KEY = 'miya_cart';
  const ADDR_KEY = 'miya_address';
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const aed = (fils) => 'AED ' + (fils / 100).toFixed(2);

  const menuGrid = $('#menu-grid');
  const orderRoot = $('#order-root');
  if (!menuGrid && !orderRoot) return;

  let cat = null;          // catalogue payload
  let cart = load(CART_KEY, {});   // { sku: qty }
  let map = null, marker = null;

  function load(k, d) { try { return JSON.parse(localStorage.getItem(k)) || d; } catch (e) { return d; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

  /* ---------- cart maths ------------------------------------------------ */
  const product = (sku) => cat.products.find((p) => p.sku === sku);
  const cartLines = () => Object.entries(cart).filter(([sku, q]) => q > 0 && product(sku)).map(([sku, qty]) => ({ ...product(sku), qty }));
  const subtotal = () => cartLines().reduce((s, l) => s + l.price_fils * l.qty, 0);
  const cartCount = () => cartLines().reduce((s, l) => s + l.qty, 0);
  function deliveryFee(zone) {
    if (!zone || !(zone in cat.zones)) return null;
    return subtotal() >= cat.free_delivery_over ? 0 : cat.zones[zone];
  }

  function setQty(sku, qty) {
    qty = Math.max(0, Math.min(50, qty | 0));
    if (qty === 0) delete cart[sku]; else cart[sku] = qty;
    save(CART_KEY, cart);
    renderAll();
    pop($$(`[data-sku="${sku}"] .qty__num`));
  }
  function pop(els) { els.forEach((el) => { el.classList.remove('is-pop'); void el.offsetWidth; el.classList.add('is-pop'); }); }

  /* ---------- rendering ------------------------------------------------- */
  function qtyControl(sku) {
    const q = cart[sku] || 0;
    return q === 0
      ? `<button class="btn btn--sm add-btn" type="button" data-add="${sku}">Add to box</button>`
      : `<div class="qty" role="group" aria-label="Quantity">
           <button type="button" data-dec="${sku}" aria-label="Remove one">&minus;</button>
           <span class="qty__num">${q}</span>
           <button type="button" data-inc="${sku}" aria-label="Add one">+</button>
         </div>`;
  }

  function productCard(p) {
    return `<div class="card cookie-card product" data-sku="${p.sku}">
      <img class="pixel" src="${p.image}" alt="" width="96" height="96">
      <h3>${p.name}</h3>
      <p class="muted">${p.description}</p>
      <span class="price">${aed(p.price_fils)}</span>
      <div class="product__cta">${qtyControl(p.sku)}</div>
    </div>`;
  }

  function renderMenu() {
    if (menuGrid) menuGrid.innerHTML = cat.products.map(productCard).join('');
  }

  function renderCart() {
    const box = $('#cart-lines');
    if (!box) return;
    const lines = cartLines();
    if (!lines.length) {
      box.innerHTML = `<div class="cart-empty"><img class="pixel" src="assets/img/sprites/miya_nutella_wave@4x.png" alt="" width="96" height="96"><p class="muted">Your box is empty. <a href="#menu">Pick some cookies &rarr;</a></p></div>`;
    } else {
      box.innerHTML = lines.map((l) => `<div class="cart-line" data-sku="${l.sku}">
          <img class="pixel" src="${l.image}" alt="" width="40" height="40">
          <div class="cart-line__name">${l.name}<span class="muted">${aed(l.price_fils)} each</span></div>
          ${qtyControl(l.sku)}
          <strong>${aed(l.price_fils * l.qty)}</strong>
        </div>`).join('');
    }
    $$('[data-cart-count]').forEach((el) => { el.textContent = cartCount(); el.hidden = cartCount() === 0; });
    renderTotals();
  }

  function renderTotals() {
    const zone = $('#f-zone') ? $('#f-zone').value : '';
    const sub = subtotal();
    const fee = deliveryFee(zone);
    const total = sub + (fee || 0);
    $('#t-sub').textContent = aed(sub);
    $('#t-fee').textContent = fee === null ? 'Pick an area' : fee === 0 ? 'Free' : aed(fee);
    $('#t-total').textContent = aed(total);
    const hint = $('#t-hint');
    if (sub === 0) hint.textContent = '';
    else if (sub < cat.min_order_fils) hint.textContent = `Minimum order is ${aed(cat.min_order_fils)}.`;
    else if (sub < cat.free_delivery_over) hint.textContent = `Add ${aed(cat.free_delivery_over - sub)} more for free delivery.`;
    else hint.textContent = 'Free delivery unlocked.';
    $('#place-order').disabled = sub < cat.min_order_fils;
  }

  function renderAll() { renderMenu(); renderCart(); }

  /* ---------- checkout form ---------------------------------------------- */
  function buildForm() {
    if (!orderRoot) return;
    const zones = Object.keys(cat.zones).map((z) => `<option value="${z}">${z} — ${cat.zones[z] === 0 ? 'free' : aed(cat.zones[z])}</option>`).join('');
    const slots = Object.entries(cat.slots).map(([k, v]) => `<option value="${k}" ${k === 'asap' && !cat.kitchen_open ? 'disabled' : ''}>${v}${k === 'asap' && !cat.kitchen_open ? ' (kitchen closed)' : ''}</option>`).join('');
    const pays = Object.entries(cat.payment_methods).map(([k, v], i) => `<label class="choice"><input type="radio" name="payment_method" value="${k}" ${i === 0 ? 'checked' : ''}><span>${v}</span></label>`).join('');

    orderRoot.innerHTML = `
      <div class="checkout">
        <div class="checkout__cart card">
          <p class="eyebrow">Your box</p>
          <div id="cart-lines"></div>
          <table class="receipt">
            <tr><td>Subtotal</td><td id="t-sub"></td></tr>
            <tr><td>Delivery</td><td id="t-fee"></td></tr>
            <tr class="receipt__total"><td>Total</td><td id="t-total"></td></tr>
          </table>
          <p class="muted" id="t-hint"></p>
        </div>

        <form class="checkout__form card card--kraft" id="checkout" novalidate>
          <p class="eyebrow">Delivery details</p>
          <div class="field"><label for="f-name">Your name</label><input id="f-name" name="name" autocomplete="name" required></div>
          <div class="field"><label for="f-phone">UAE mobile</label><input id="f-phone" name="phone" type="tel" inputmode="tel" placeholder="050 123 4567" autocomplete="tel" required></div>
          <div class="field"><label for="f-email">Email <span class="muted">(optional, for the receipt)</span></label><input id="f-email" name="email" type="email" autocomplete="email"></div>
          <div class="field"><label for="f-zone">Area</label><select id="f-zone" name="zone" required><option value="">Choose your area…</option>${zones}</select></div>
          <div class="field"><label for="f-address">Building / villa, street, landmarks</label><textarea id="f-address" name="address" rows="2" placeholder="Villa 12, Street 4, near the mosque" required></textarea></div>

          <div class="field">
            <label>Drop a pin so the truck finds you</label>
            <div id="map" class="map" aria-label="Delivery location map"></div>
            <div class="map__tools">
              <button class="btn btn--sm btn--ghost" type="button" id="locate-me">&#9678; Use my location</button>
              <span class="muted" id="pin-status">Tap the map to place the pin.</span>
            </div>
            <input type="hidden" name="lat" id="f-lat"><input type="hidden" name="lng" id="f-lng">
          </div>

          <div class="field"><label for="f-slot">When</label><select id="f-slot" name="slot">${slots}</select></div>
          <div class="field"><label for="f-notes">Notes for Miya <span class="muted">(optional)</span></label><input id="f-notes" name="notes" placeholder="Gate code, allergies, 'extra salt please'"></div>

          <fieldset class="field"><legend>Payment</legend>${pays}</fieldset>

          <div class="form-error" id="form-error" role="alert" hidden></div>
          <button class="btn btn--lg" type="submit" id="place-order">Place order</button>
          <p class="muted small">Cash orders: please have the exact amount ready. Card payments are handled securely by Stripe.</p>
        </form>
      </div>`;

    // Remember the address between visits (never the card, that's Stripe's job)
    const saved = load(ADDR_KEY, null);
    if (saved) ['name', 'phone', 'email', 'zone', 'address'].forEach((k) => { const el = $('#f-' + k); if (el && saved[k]) el.value = saved[k]; });
    $('#f-zone').addEventListener('change', () => { renderTotals(); if (map) flyToZone($('#f-zone').value); });
    $('#checkout').addEventListener('submit', submitOrder);
    initMap(saved);
  }

  /* ---------- map (Leaflet + OpenStreetMap, no API key) ----------------- */
  function initMap(saved) {
    if (!window.L) { $('#map').innerHTML = '<p class="muted" style="padding:1rem">Map unavailable offline. Your written address is enough.</p>'; return; }
    const start = saved && saved.lat ? [saved.lat, saved.lng] : cat.map.center;
    map = L.map('map', { zoomControl: true, attributionControl: true }).setView(start, saved && saved.lat ? 15 : cat.map.zoom);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap' }).addTo(map);
    const icon = L.icon({ iconUrl: 'assets/img/props/heart@4x.png', iconSize: [32, 32], iconAnchor: [16, 30], className: 'pixel' });
    if (saved && saved.lat) placePin([saved.lat, saved.lng]);
    map.on('click', (e) => placePin([e.latlng.lat, e.latlng.lng]));
    $('#locate-me').addEventListener('click', () => {
      if (!navigator.geolocation) return;
      $('#pin-status').textContent = 'Finding you…';
      navigator.geolocation.getCurrentPosition(
        (pos) => { placePin([pos.coords.latitude, pos.coords.longitude]); map.setView([pos.coords.latitude, pos.coords.longitude], 16); },
        () => { $('#pin-status').textContent = 'Could not get your location. Tap the map instead.'; },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    });
    function placePin(latlng) {
      if (!marker) marker = L.marker(latlng, { icon, draggable: true }).addTo(map).on('dragend', () => placePin([marker.getLatLng().lat, marker.getLatLng().lng]));
      else marker.setLatLng(latlng);
      $('#f-lat').value = latlng[0].toFixed(6);
      $('#f-lng').value = latlng[1].toFixed(6);
      $('#pin-status').textContent = 'Pin placed. Drag it to adjust.';
    }
    // Fix tile layout when the Order tab becomes visible after being hidden
    document.addEventListener('miya:tab', (e) => { if (e.detail === 'order') setTimeout(() => map.invalidateSize(), 50); });
  }

  // Rough centres so choosing an area jumps the map somewhere useful
  const ZONE_CENTRES = {
    'Al Reem Island': [24.497, 54.405], 'Al Maryah Island': [24.501, 54.389], 'Corniche / Al Markaziyah': [24.487, 54.355],
    'Al Khalidiyah': [24.469, 54.343], 'Al Bateen': [24.455, 54.340], 'Al Zahiyah (Tourist Club)': [24.495, 54.375],
    'Al Wahdah / Al Nahyan': [24.466, 54.377], 'Al Mushrif / Al Karamah': [24.446, 54.392], 'Madinat Zayed': [24.478, 54.365],
    'Saadiyat Island': [24.545, 54.435], 'Al Raha Beach': [24.470, 54.600], 'Khalifa City': [24.420, 54.575],
    'Masdar City': [24.427, 54.617], 'Yas Island': [24.488, 54.607], 'Mohammed Bin Zayed City': [24.348, 54.542],
    'Mussafah': [24.355, 54.495], 'Al Reef': [24.470, 54.700], 'Al Shamkha': [24.390, 54.700], 'Al Bahia': [24.560, 54.640],
  };
  function flyToZone(zone) { if (ZONE_CENTRES[zone] && !marker) map.setView(ZONE_CENTRES[zone], 14); }

  /* ---------- submit ---------------------------------------------------- */
  async function submitOrder(e) {
    e.preventDefault();
    const form = e.target;
    const err = $('#form-error');
    err.hidden = true;
    const data = Object.fromEntries(new FormData(form).entries());
    data.items = cartLines().map((l) => ({ sku: l.sku, qty: l.qty }));
    save(ADDR_KEY, { name: data.name, phone: data.phone, email: data.email, zone: data.zone, address: data.address, lat: data.lat, lng: data.lng });

    const btn = $('#place-order');
    btn.disabled = true; btn.classList.add('is-busy'); btn.textContent = 'Warming the oven…';
    try {
      const res = await fetch('api/orders.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      const out = await res.json();
      if (!out.ok) throw new Error(out.error || 'Please check the form.');
      cart = {}; save(CART_KEY, cart);
      btn.textContent = 'Done! Taking you there…';
      location.href = out.redirect;
    } catch (ex) {
      err.textContent = ex.message; err.hidden = false;
      err.scrollIntoView({ behavior: 'smooth', block: 'center' });
      btn.disabled = false; btn.classList.remove('is-busy'); btn.textContent = 'Place order';
    }
  }

  /* ---------- events ---------------------------------------------------- */
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-add],[data-inc],[data-dec]');
    if (!t || !cat) return;
    if (t.dataset.add) setQty(t.dataset.add, 1);
    if (t.dataset.inc) setQty(t.dataset.inc, (cart[t.dataset.inc] || 0) + 1);
    if (t.dataset.dec) setQty(t.dataset.dec, (cart[t.dataset.dec] || 0) - 1);
  });

  /* ---------- boot ------------------------------------------------------ */
  fetch('api/catalogue.php').then((r) => r.json()).then((data) => {
    cat = data;
    buildForm();
    renderAll();
  }).catch(() => {
    if (menuGrid) menuGrid.innerHTML = '<p class="muted">The menu is taking a nap. Please refresh in a moment.</p>';
  });
})();
