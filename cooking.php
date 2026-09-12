<?php
/**
 * Cooking Miya — Cooking-Mama-style kitchen mini-game chain.
 */
declare(strict_types=1);
require __DIR__ . '/config.php';

$pageTitle = 'Cooking Miya — ' . SITE_NAME;
$noIntro = true; $noNav = true; $base = ''; $fullBleed = true;
require __DIR__ . '/includes/header.php';
?>
<div class="cooking" id="cooking">
  <canvas id="ccanvas" aria-label="Cooking Miya game"></canvas>

  <div class="c-hud" id="c-hud" hidden>
    <div class="c-hud__row">
      <button class="hud__pill hud__pill--link" type="button" id="c-quit">&larr; Recipes</button>
      <span class="hud__pill" id="c-title"></span>
    </div>
    <div class="c-hud__timer" id="c-timer"><i></i></div>
    <div class="hud__hint c-hud__hint" id="c-hint"></div>
  </div>

  <div class="c-menu" id="c-menu"></div>

  <div class="card c-result" id="c-result" hidden>
    <img class="pixel" src="assets/img/sprites/miya_nutella_cheer@4x.png" alt="" width="96" height="96">
    <h3 id="c-result-title"></h3>
    <p class="muted" id="c-result-body"></p>
    <button class="btn" type="button" id="c-result-btn">Back to recipes</button>
  </div>
</div>

<div class="game-help">
  <p class="eyebrow">How to play</p>
  <p class="muted">Each recipe is a chain of kitchen moves. <b>Tap</b> on the beat to crack eggs, <b>stir in circles</b>, <b>shake</b> the sifter, <b>swipe</b> the arrows, <b>drag</b> scoops to the tray, <b>hold and release</b> to fill and pour, and <b>tap at golden</b> in the oven. Score 42+ for a star, 68+ for two, 88+ for three. Two stars on the first five recipes unlock Rush Hour.</p>
  <p><a class="btn btn--ghost btn--sm" href="play.php">&larr; All games</a></p>
</div>

<script src="assets/js/cooking.js?v=<?= e(ASSET_VERSION) ?>"></script>
<?php require __DIR__ . '/includes/footer.php'; ?>
