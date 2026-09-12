<?php
/**
 * Play hub — both games in one place.
 */
declare(strict_types=1);
require __DIR__ . '/config.php';

$pageTitle = 'Play — ' . SITE_NAME;
$noIntro = true; $base = '';
require __DIR__ . '/includes/header.php';
?>
<section class="panel" role="region" aria-label="Games">
  <div class="scene-banner scene-banner--short"><canvas class="pixel-scene" data-scene="strip" aria-hidden="true"></canvas></div>
  <p class="eyebrow">Play &middot; two games, one bakery</p>
  <h2>Pick your apron.</h2>

  <div class="grid grid--2 play-grid">
    <a class="card play-card" href="cooking.php">
      <img class="pixel" src="assets/img/sprites/miya_nutella_mix@4x.png" alt="" width="128" height="128">
      <div>
        <p class="eyebrow">New</p>
        <h3>Cooking Miya</h3>
        <p class="muted">Crack, stir, sift, fold, scoop, fill, salt, bake. Eight recipes that get faster and fussier, three-star scoring, and an endless Rush Hour once you earn your stripes.</p>
        <span class="btn">Start cooking &rarr;</span>
      </div>
    </a>
    <a class="card play-card" href="game.php">
      <img class="pixel" src="assets/img/sprites/miya_nutella_run@4x.png" alt="" width="128" height="128">
      <div>
        <p class="eyebrow">Open world</p>
        <h3>Miya's Cookie Farm</h3>
        <p class="muted">Grow wheat, milk the cows, gather dates, hazelnuts and sea salt, bake, then drive warm cookies to the neighbours before their orders go cold.</p>
        <span class="btn btn--kraft">Open the farm &rarr;</span>
      </div>
    </a>
  </div>
</section>
<?php require __DIR__ . '/includes/footer.php'; ?>
