<?php
/**
 * Miya's Cookie Farm — the pixel game page. Full-height canvas with a DOM HUD.
 */
declare(strict_types=1);
require __DIR__ . '/config.php';

$pageTitle = "Miya's Cookie Farm — " . SITE_NAME;
$noIntro = true; $noNav = true; $base = ''; $fullBleed = true;
require __DIR__ . '/includes/header.php';
?>
<div class="game" id="game">
  <canvas id="gcanvas" aria-label="Miya's Cookie Farm game"></canvas>

  <div class="hud">
    <div class="hud__top">
      <span class="hud__pill" id="h-day">Day 1</span>
      <span class="hud__pill" id="h-clock">7:00 am</span>
      <span class="hud__pill"><img class="pixel" src="assets/img/props/star@4x.png" width="18" height="18" alt=""> <b id="h-coins">0</b></span>
      <span class="hud__pill"><img class="pixel" src="assets/img/props/heart@4x.png" width="18" height="18" alt=""> <b id="h-hearts">0</b></span>
      <a class="hud__pill hud__pill--link" href="index.php#home" title="Back to the bakery">&larr; Bakery</a>
      <button class="hud__pill hud__pill--link" type="button" id="h-reset" title="Start over">New farm</button>
    </div>
    <div class="hud__inv inv" id="h-inv"></div>
    <div class="hud__orders" id="h-orders"></div>
    <div class="hud__hint" id="h-hint"></div>
    <div class="toasts" id="toasts"></div>
    <button class="hud__action" id="h-action" type="button" aria-label="Action">A</button>

    <div class="dialog" id="dialog" hidden>
      <img class="pixel dialog__portrait" id="d-portrait" alt="" width="96" height="96">
      <div class="dialog__body">
        <p class="eyebrow" id="d-name"></p>
        <p id="d-text"></p>
        <div class="dialog__buttons" id="d-buttons"></div>
      </div>
    </div>

    <div class="bake card" id="bake" hidden>
      <p class="eyebrow">The oven</p>
      <div class="bake__dial"><div class="bake__zone"></div><div class="bake__zone bake__zone--gold"></div><div class="bake__marker" id="bake-marker"></div></div>
      <p id="bake-msg" class="muted"></p>
      <button class="btn" type="button" id="bake-btn">Take them out!</button>
    </div>
  </div>
</div>

<div class="game-help">
  <p class="eyebrow">How to play</p>
  <p class="muted"><b>Move:</b> drag anywhere on the left of the screen, or WASD / arrow keys. <b>Act:</b> tap the A button, tap the right side of the screen, or press E. Grow, gather, bake in the golden zone, deliver before the order goes cold. Night deliveries pay double. Hearts unlock outfits at the bakery.</p>
</div>

<script src="assets/js/game.js?v=<?= e(ASSET_VERSION) ?>"></script>
<?php require __DIR__ . '/includes/footer.php'; ?>
