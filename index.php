<?php
declare(strict_types=1);
require __DIR__ . '/config.php';

$pageTitle = SITE_NAME . ' — ' . SITE_TAGLINE;
require __DIR__ . '/includes/header.php';
?>

<!-- ===================== HOME ===================== -->
<section class="panel" data-panel="home" id="panel-home" role="tabpanel">
  <div class="hero">
    <div>
      <p class="eyebrow">Home delivery &middot; baked to order</p>
      <h1>Warm cookies,<br>straight to your door.</h1>
      <p class="muted">Miya bakes every batch by hand and drives it over while it's still soft in the middle. Nutella-filled, sea salt on top.</p>
      <div class="hero__cta">
        <a class="btn" href="#order">Order cookies &rarr;</a>
        <a class="btn btn--ghost" href="#menu">See the menu</a>
      </div>
    </div>
    <div class="hero__art">
      <img class="hero__miya pixel" src="assets/img/sprites/miya_nutella_hero@4x.png" alt="Miya, the baker, holding up a Nutella cookie" width="128" height="128">
    </div>
  </div>

  <div class="grid grid--3">
    <div class="card cookie-card">
      <img class="pixel" src="assets/img/props/cookie_signature@4x.png" data-bite="assets/img/props/cookie_signature@4x.png,assets/img/props/cookie_bitten@4x.png,assets/img/props/cookie_split@4x.png" alt="The signature cookie. Tap to take a bite." width="96" height="96">
      <h3>Miya's Signature</h3>
      <p class="muted">Nutella-filled. Sea salt on top. Tap it.</p>
      <span class="price">FROM 3.50</span>
    </div>
    <div class="card cookie-card">
      <img class="pixel" src="assets/img/props/milk_glass@4x.png" alt="" width="96" height="96">
      <h3>Milk &amp; Cookies Box</h3>
      <p class="muted">Six warm cookies and a cold glass. The full ritual.</p>
      <span class="price">FROM 18.00</span>
    </div>
    <div class="card cookie-card">
      <img class="pixel" src="assets/img/props/star@4x.png" alt="" width="96" height="96">
      <h3>Midnight Batch</h3>
      <p class="muted">Late-night delivery, 10pm to 1am. Just one more.</p>
      <span class="price">FROM 12.00</span>
    </div>
  </div>

  <div class="card card--kraft" style="margin-top:1.5rem">
    <p class="eyebrow">How it works</p>
    <div class="grid steps">
      <div class="step"><img class="pixel" src="assets/img/props/cookie_tray@4x.png" alt=""><div><h3>Pick your box</h3><p class="muted">Choose cookies, pick a size, add a note.</p></div></div>
      <div class="step"><img class="pixel" src="assets/img/props/nutella_jar@4x.png" alt=""><div><h3>Tell us where</h3><p class="muted">Drop a pin or type your address. We'll remember it.</p></div></div>
      <div class="step"><img class="pixel" src="assets/img/props/heart@4x.png" alt=""><div><h3>Still warm</h3><p class="muted">Miya's truck arrives. Napkins included.</p></div></div>
    </div>
  </div>
</section>

<!-- ===================== MENU ===================== -->
<section class="panel" data-panel="menu" id="panel-menu" role="tabpanel" hidden>
  <p class="eyebrow">Menu</p>
  <h2>The signature, three ways.</h2>
  <p class="muted">The full catalogue and ordering land in the next phase. For now, meet the cookie.</p>
  <div class="grid grid--3">
    <div class="card cookie-card"><img class="pixel" src="assets/img/props/cookie_signature@4x.png" alt=""><h3>Whole</h3><p class="muted">Golden edges, soft centre.</p></div>
    <div class="card cookie-card"><img class="pixel" src="assets/img/props/cookie_bitten@4x.png" alt=""><h3>Bitten</h3><p class="muted">The filling shows. This is the promise.</p></div>
    <div class="card cookie-card"><img class="pixel" src="assets/img/props/cookie_split@4x.png" alt=""><h3>Split</h3><p class="muted">Molten core. Sea salt. Regret nothing.</p></div>
  </div>
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
  <div class="card" style="text-align:center">
    <img class="pixel" src="assets/img/sprites/miya_nutella_tray@4x.png" alt="" width="128" height="128" style="margin:0 auto 1rem">
    <p class="eyebrow">Order</p>
    <h2>The oven is preheating.</h2>
    <p class="muted">Cart, delivery address, and payment arrive in the checkout phase.</p>
  </div>
</section>

<?php require __DIR__ . '/includes/footer.php'; ?>
