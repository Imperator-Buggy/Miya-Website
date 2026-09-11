<?php
/**
 * Miya's Cookies — site configuration.
 * Keep brand copy and settings here so templates stay clean.
 */
declare(strict_types=1);

const SITE_NAME    = "Miya's Cookies";
const SITE_TAGLINE = 'Freshly baked bad decisions.';
const SITE_DESC    = 'Nutella-filled, sea salt on top. Warm cookies delivered to your door.';
const SITE_URL     = '';            // e.g. https://miyascookies.com (leave empty for relative URLs)
const THEME_COLOR  = '#D8B389';     // kraft — used by the PWA UI chrome

/** Cache-busting version for CSS/JS/service worker. Bump on each deploy. */
const ASSET_VERSION = '0.1.0';

/** Tabs: id => [label, icon sprite] */
const TABS = [
    'home'  => ['Home',  'assets/img/props/cookie_signature@4x.png'],
    'menu'  => ['Menu',  'assets/img/props/cookie_tray@4x.png'],
    'about' => ['About', 'assets/img/props/heart@4x.png'],
    'order' => ['Order', 'assets/img/props/milk_glass@4x.png'],
];

/** Escape helper for templates. */
function e(string $s): string
{
    return htmlspecialchars($s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}
