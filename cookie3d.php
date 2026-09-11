<?php
/**
 * The Signature, exploded — an interactive 3D cookie (Three.js).
 */
declare(strict_types=1);
require __DIR__ . '/config.php';

$pageTitle = 'The Signature in 3D — ' . SITE_NAME;
$noIntro = true; $base = '';
require __DIR__ . '/includes/header.php';
?>
<section class="panel" data-panel="cookie" role="region" aria-label="3D cookie">
  <p class="eyebrow">The signature &middot; exploded view</p>
  <h2>Inside the cookie.</h2>
  <p class="muted">Drag to spin. Pull the slider to lift the layers apart. Tap a layer to hear what it does.</p>

  <div class="c3d card">
    <div class="c3d__stage" id="c3d-stage"><canvas id="c3d" aria-label="Interactive 3D cookie"></canvas>
      <div class="c3d__label card" id="c3d-label" hidden></div>
    </div>
    <div class="c3d__controls">
      <label class="c3d__slider"><span>Explode</span><input type="range" id="c3d-explode" min="0" max="100" value="0"></label>
      <div class="c3d__buttons">
        <button class="btn btn--sm" type="button" id="c3d-toggle">Explode &uarr;</button>
        <button class="btn btn--sm btn--ghost" type="button" id="c3d-bite">Take a bite</button>
        <button class="btn btn--sm btn--ghost" type="button" id="c3d-pixel" aria-pressed="false">Pixel mode</button>
        <button class="btn btn--sm btn--ghost" type="button" id="c3d-spin" aria-pressed="true">Auto-spin</button>
      </div>
    </div>
  </div>

  <div class="grid grid--3" id="c3d-legend">
    <div class="card cookie-card"><img class="pixel" src="assets/img/props/cookie_signature@4x.png" alt="" width="96" height="96"><h3>Brown-butter dough</h3><p class="muted">Two halves, crisp edge, soft middle. Baked to the golden zone.</p></div>
    <div class="card cookie-card"><img class="pixel" src="assets/img/props/nutella_jar@4x.png" alt="" width="96" height="96"><h3>Nutella core</h3><p class="muted">A frozen disc of hazelnut spread goes in the middle so it stays molten.</p></div>
    <div class="card cookie-card"><img class="pixel" src="assets/img/props/salt_shaker@4x.png" alt="" width="96" height="96"><h3>Sea salt flakes</h3><p class="muted">On top, right out of the oven. The sweet needs the salt.</p></div>
  </div>
  <p style="margin-top:1.5rem"><a class="btn" href="index.php#order">Order the real thing &rarr;</a></p>
</section>

<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js" crossorigin=""></script>
<script src="assets/js/cookie3d.js?v=<?= e(ASSET_VERSION) ?>"></script>
<?php require __DIR__ . '/includes/footer.php'; ?>
