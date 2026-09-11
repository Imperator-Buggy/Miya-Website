</main>

<!-- mobile bottom tab bar -->
<?php if (!$noNav): ?>
<nav class="tabs tabs--bottom" role="tablist" aria-label="Sections">
  <?php foreach (TABS as $id => $tab): [$label, $icon] = $tab; $page = $tab[2] ?? null; ?>
    <a class="tab<?= $page && $currentPage === $page ? ' is-active' : '' ?>" role="tab" href="<?= $base . ($page ?: 'index.php#' . e($id)) ?>"<?= $page ? '' : ' data-tab="' . e($id) . '" aria-controls="panel-' . e($id) . '"' ?>>
      <img class="pixel" src="<?= $base . e($icon) ?>" alt="" width="24" height="24"><?= e($label) ?><?= $id === 'order' ? ' <span class="badge" data-cart-count hidden>0</span>' : '' ?>
    </a>
  <?php endforeach; ?>
</nav>
<?php endif; ?>

<footer class="site-footer">
  <span class="brand__name">MIYA'S COOKIES</span>
  <p><a href="<?= $base ?>index.php#about">About Miya</a> &middot; <a href="<?= $base ?>game.php">Play the game</a> &middot; <a href="<?= $base ?>cookie3d.php">The cookie in 3D</a></p>
  <p>&copy; <?= date('Y') ?> <?= e(SITE_NAME) ?> &middot; Abu Dhabi, UAE. <?= e(SITE_TAGLINE) ?></p>
</footer>

<script src="<?= $base ?>assets/js/music.js?v=<?= e(ASSET_VERSION) ?>"></script>
<?php if (!$noIntro): ?><script src="<?= $base ?>assets/js/intro.js?v=<?= e(ASSET_VERSION) ?>"></script><?php endif; ?>
<script src="<?= $base ?>assets/js/app.js?v=<?= e(ASSET_VERSION) ?>"></script>
<?php if (!$noNav && !$noIntro): ?>
<script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js" crossorigin=""></script>
<script src="<?= $base ?>assets/js/shop.js?v=<?= e(ASSET_VERSION) ?>"></script>
<?php endif; ?>
</body>
</html>
