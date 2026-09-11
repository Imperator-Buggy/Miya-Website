<?php
/**
 * Miya's Cookies — site configuration.
 * Brand copy, locale, delivery zones and settings live here so templates stay clean.
 * Secrets (database, Stripe, admin password) live in .env — see .env.example.
 */
declare(strict_types=1);

require_once __DIR__ . '/src/env.php';

const SITE_NAME    = "Miya's Cookies";
const SITE_TAGLINE = 'Freshly baked bad decisions.';
const SITE_DESC    = 'Nutella-filled, sea salt on top. Warm cookies delivered across Abu Dhabi.';
const THEME_COLOR  = '#D8B389';     // kraft — used by the PWA UI chrome

/** Public base URL (no trailing slash). Set APP_URL in .env in production. */
define('SITE_URL', rtrim(env('APP_URL', ''), '/'));

/** Cache-busting version for CSS/JS/service worker. Bump on each deploy. */
const ASSET_VERSION = '0.2.0';

/* ---------------------------------------------------------------------------
   Locale — Abu Dhabi, UAE
   --------------------------------------------------------------------------- */
const TIMEZONE        = 'Asia/Dubai';
const CURRENCY        = 'AED';
const COUNTRY_CODE    = '+971';
const MAP_CENTER      = [24.4539, 54.3773];   // Abu Dhabi Corniche
const MAP_ZOOM        = 11;

/** Money is stored in fils (1 AED = 100 fils) so totals never drift. */
const MIN_ORDER_FILS          = 4000;   // AED 40
const FREE_DELIVERY_OVER_FILS = 15000;  // AED 150

/** Delivery zones: label => fee in fils. Ordered island first, then mainland. */
const DELIVERY_ZONES = [
    'Al Reem Island'              => 1000,
    'Al Maryah Island'            => 1000,
    'Corniche / Al Markaziyah'    => 1000,
    'Al Khalidiyah'               => 1000,
    'Al Bateen'                   => 1000,
    'Al Zahiyah (Tourist Club)'   => 1000,
    'Al Wahdah / Al Nahyan'       => 1000,
    'Al Mushrif / Al Karamah'     => 1000,
    'Madinat Zayed'               => 1000,
    'Saadiyat Island'             => 1500,
    'Al Raha Beach'               => 1500,
    'Khalifa City'                => 1500,
    'Masdar City'                 => 1500,
    'Yas Island'                  => 2000,
    'Mohammed Bin Zayed City'     => 2000,
    'Mussafah'                    => 2000,
    'Al Reef'                     => 2000,
    'Al Shamkha'                  => 2500,
    'Al Bahia'                    => 2500,
];

/** Delivery windows shown at checkout (Gulf Standard Time). */
const DELIVERY_SLOTS = [
    'asap'     => 'As soon as possible (45–60 min)',
    '16-18'    => 'Today, 4–6 pm',
    '18-20'    => 'Today, 6–8 pm',
    '20-22'    => 'Today, 8–10 pm',
    'midnight' => 'Midnight batch, 10 pm – 1 am',
];

/** Opening hours for the "ASAP" slot, 24h GST. Spans midnight. */
const OPEN_HOUR  = 12;
const CLOSE_HOUR = 1;

/** Payment methods offered. 'card' needs STRIPE_SECRET_KEY, 'ziina' needs ZIINA_API_KEY in .env. */
const PAYMENT_METHODS = [
    'cod'   => 'Cash on delivery',
    'ziina' => 'Ziina — card, Apple Pay, wallets (UAE)',
    'card'  => 'Card via Stripe (Apple Pay / Google Pay)',
];

/** Tabs: id => [label, icon sprite] */
const TABS = [
    'home'  => ['Home',  'assets/img/props/cookie_signature@4x.png'],
    'menu'  => ['Menu',  'assets/img/props/cookie_tray@4x.png'],
    'about' => ['About', 'assets/img/props/heart@4x.png'],
    'order' => ['Order', 'assets/img/props/milk_glass@4x.png'],
];

date_default_timezone_set(TIMEZONE);

/** Escape helper for templates. */
function e(string $s): string
{
    return htmlspecialchars($s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

/** Format fils as "AED 12.50". */
function aed(int $fils): string
{
    return CURRENCY . ' ' . number_format($fils / 100, 2);
}
