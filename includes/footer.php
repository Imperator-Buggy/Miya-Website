</main>

<!-- mobile bottom tab bar -->
<nav class="tabs tabs--bottom" role="tablist" aria-label="Sections">
  <?php foreach (TABS as $id => [$label, $icon]): ?>
    <a class="tab" role="tab" href="#<?= e($id) ?>" data-tab="<?= e($id) ?>" aria-controls="panel-<?= e($id) ?>">
      <img class="pixel" src="<?= e($icon) ?>" alt="" width="24" height="24"><?= e($label) ?>
    </a>
  <?php endforeach; ?>
</nav>

<footer class="site-footer">
  <span class="brand__name">MIYA'S COOKIES</span>
  <p>&copy; <?= date('Y') ?> <?= e(SITE_NAME) ?>. <?= e(SITE_TAGLINE) ?></p>
</footer>

<script src="assets/js/music.js?v=<?= e(ASSET_VERSION) ?>"></script>
<script src="assets/js/intro.js?v=<?= e(ASSET_VERSION) ?>"></script>
<script src="assets/js/app.js?v=<?= e(ASSET_VERSION) ?>"></script>
</body>
</html>
