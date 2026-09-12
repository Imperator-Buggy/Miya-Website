<?php
declare(strict_types=1);
require __DIR__ . '/config.php';

$pageTitle = SITE_NAME . ' — ' . SITE_TAGLINE;
require __DIR__ . '/includes/header.php';
?>

<!-- ===================== HOME ===================== -->
<section class="panel" data-panel="home" id="panel-home" role="tabpanel">
  <div class="hero hero--scene">
    <canvas class="pixel-scene hero__scene" data-scene="hero" aria-hidden="true"></canvas>
    <div class="hero__copy">
      <p class="eyebrow">Home delivery &middot; baked to order</p>
      <h1>Warm cookies,<br>straight to your door.</h1>
      <p class="muted">Miya bakes every batch by hand in Abu Dhabi and drives it over while it's still soft in the middle. Nutella-filled, sea salt on top.</p>
      <div class="hero__cta">
        <a class="btn" href="#order">Order cookies &rarr;</a>
        <a class="btn btn--ghost" href="#menu">See the menu</a>
        <a class="btn btn--kraft" href="play.php">&#9654; Play</a>
      </div>
    </div>
    <div class="hero__art">
      <img class="hero__miya pixel" src="assets/img/sprites/miya_nutella_hero@4x.png" alt="Miya, the baker, holding up a Nutella cookie" width="128" height="128">
      <span class="sparkle sparkle--1"></span><span class="sparkle sparkle--2"></span><span class="sparkle sparkle--3"></span>
    </div>
  </div>

  <div class="scene-banner scene-banner--short"><canvas class="pixel-scene" data-scene="strip" aria-hidden="true"></canvas></div>

  <div class="grid grid--3">
    <div class="card cookie-card">
      <img class="pixel" src="assets/img/props/cookie_signature@4x.png" data-bite="assets/img/props/cookie_signature@4x.png,assets/img/props/cookie_bitten@4x.png,assets/img/props/cookie_split@4x.png" alt="The signature cookie. Tap to take a bite." width="96" height="96">
      <h3>Miya's Signature</h3>
      <p class="muted">Nutella-filled. Sea salt on top. Tap it.</p>
      <span class="price">AED 12</span>
    </div>
    <div class="card cookie-card">
      <img class="pixel" src="assets/img/props/milk_glass@4x.png" alt="" width="96" height="96">
      <h3>Milk &amp; Cookies Box</h3>
      <p class="muted">Six warm cookies and a cold glass. The full ritual.</p>
      <span class="price">AED 85</span>
    </div>
    <div class="card cookie-card">
      <img class="pixel" src="assets/img/props/star@4x.png" alt="" width="96" height="96">
      <h3>Midnight Batch</h3>
      <p class="muted">Late-night delivery, 10 pm to 1 am. Just one more.</p>
      <span class="price">AED 75</span>
    </div>
  </div>

  <div class="card card--kraft card--wood" style="margin-top:1.5rem">
    <p class="eyebrow">How it works</p>
    <div class="grid steps">
      <div class="step"><img class="pixel" src="assets/img/props/cookie_tray@4x.png" alt=""><div><h3>Pick your box</h3><p class="muted">Choose cookies, pick a size, add a note.</p></div></div>
      <div class="step"><img class="pixel" src="assets/img/props/nutella_jar@4x.png" alt=""><div><h3>Tell us where</h3><p class="muted">Pick your area, drop a pin. We'll remember it.</p></div></div>
      <div class="step"><img class="pixel" src="assets/img/props/heart@4x.png" alt=""><div><h3>Still warm</h3><p class="muted">Pay by cash or card. Miya's truck arrives. Napkins included.</p></div></div>
    </div>
  </div>
</section>

<!-- ===================== MENU ===================== -->
<section class="panel" data-panel="menu" id="panel-menu" role="tabpanel" hidden>
  <p class="eyebrow">Menu &middot; prices in AED</p>
  <h2>Pick your box.</h2>
  <p class="muted">Baked to order and driven over warm. Minimum order <?= e(aed(MIN_ORDER_FILS)) ?>, free delivery over <?= e(aed(FREE_DELIVERY_OVER_FILS)) ?>.</p>
  <div class="grid grid--3" id="menu-grid"><p class="muted">Loading the menu…</p></div>
  <p style="margin-top:1.5rem"><a class="btn" href="#order">Go to your box <span class="badge" data-cart-count hidden>0</span></a></p>
</section>

<!-- ===================== ABOUT ===================== -->
<section class="panel" data-panel="about" id="panel-about" role="tabpanel" hidden>
  <div class="hero">
    <div>
      <p class="eyebrow">About</p>
      <h2>Hi, I'm Miya.</h2>
      <p class="muted">I started baking at midnight because I couldn't sleep, and started delivering because my friends couldn't stop asking. Every cookie is filled by hand and salted with intent.</p>
    </div>
    <div class="hero__art"><img class="hero__miya pixel" src="assets/img/sprites/miya_nutella_wave@4x.png" alt="Miya waving" width="128" height="128"></div>
  </div>
</section>

<!-- ===================== ORDER ===================== -->
<section class="panel" data-panel="order" id="panel-order" role="tabpanel" hidden>
  <p class="eyebrow">Order &middot; Abu Dhabi delivery</p>
  <h2>Where should the truck go?</h2>
  <div id="order-root"><p class="muted">Loading…</p></div>
</section>

<?php require __DIR__ . '/includes/footer.php'; ?>
