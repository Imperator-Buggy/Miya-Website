<?php
/** @var string $pageTitle */
$pageTitle = $pageTitle ?? SITE_NAME;
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title><?= e($pageTitle) ?></title>
  <meta name="description" content="<?= e(SITE_DESC) ?>">
  <meta name="theme-color" content="<?= e(THEME_COLOR) ?>">
  <meta name="color-scheme" content="light">

  <!-- PWA -->
  <link rel="manifest" href="manifest.json">
  <link rel="icon" href="assets/img/icons/icon-192.png" sizes="192x192" type="image/png">
  <link rel="apple-touch-icon" href="assets/img/icons/icon-192.png">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="default">
  <meta name="apple-mobile-web-app-title" content="<?= e(SITE_NAME) ?>">

  <!-- Social preview -->
  <meta property="og:title" content="<?= e(SITE_NAME) ?>">
  <meta property="og:description" content="<?= e(SITE_DESC) ?>">
  <meta property="og:image" content="<?= e(SITE_URL) ?>assets/img/hero.png">

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@500;600;700;800&family=Press+Start+2P&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="assets/css/style.css?v=<?= e(ASSET_VERSION) ?>">
</head>
<body>

<!-- ===== Pixel-art intro overlay (hidden until JS decides to play it) ===== -->
<div id="intro" hidden aria-label="Welcome animation">
  <canvas width="160" height="90" aria-hidden="true"></canvas>
  <div class="intro-ui">
    <div class="intro-title" aria-live="polite">MIYA'S<br>COOKIES</div>
    <button class="intro-gate" type="button">
      <img class="pixel" src="assets/img/sprites/miya_nutella_wave@4x.png" alt="">
      <h2>Miya's Cookies</h2>
      <span class="btn">&#9654; Tap to begin</span>
      <small>with soft music &#9834;</small>
    </button>
    <div class="intro-tagline"><?= e(SITE_TAGLINE) ?></div>
    <button class="intro-enter btn" type="button">Come on in &rarr;</button>
  </div>
  <div class="intro-corner">
    <button class="intro-mute icon-btn" type="button" data-music-toggle aria-label="Toggle music">&#9834;</button>
    <button class="intro-skip btn btn--ghost btn--sm" type="button">Skip</button>
  </div>
</div>

<header class="site-header">
  <div class="site-header__inner">
    <a class="brand" href="#home">
      <img class="brand__sprite pixel" src="assets/img/sprites/miya_nutella_idle@4x.png" alt="" width="40" height="40">
      <span class="brand__name">MIYA'S<br>COOKIES<small><?= e(SITE_TAGLINE) ?></small></span>
    </a>

    <nav class="tabs tabs--top" role="tablist" aria-label="Sections">
      <?php foreach (TABS as $id => [$label, $icon]): ?>
        <a class="tab" role="tab" href="#<?= e($id) ?>" data-tab="<?= e($id) ?>" aria-controls="panel-<?= e($id) ?>">
          <img class="pixel" src="<?= e($icon) ?>" alt="" width="24" height="24"><?= e($label) ?>
        </a>
      <?php endforeach; ?>
    </nav>

    <div class="header-actions">
      <button class="icon-btn" type="button" data-music-toggle aria-label="Toggle music">&#9834;</button>
      <button class="btn btn--ghost btn--sm" type="button" data-replay-intro title="Replay the intro" aria-label="Replay the intro">&#9654;<span class="hide-sm"> Intro</span></button>
      <button class="btn btn--sm" type="button" data-install hidden>Install<span class="hide-sm"> app</span></button>
    </div>
  </div>
</header>

<main id="main">
