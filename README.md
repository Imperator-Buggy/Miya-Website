# Miya's Cookies — cozy pixel bakery PWA

A mobile-first, installable delivery site for Miya's Cookies. PHP renders the pages;
the front end is plain HTML/CSS/JS with a hand-rolled pixel-art intro engine and a
synthesised music-box soundtrack.

## Run locally

```bash
php -S localhost:8000
```

Then open http://localhost:8000. Add `?intro=1` to force the intro to replay
(it normally plays once per browser, remembered in `localStorage`).

## Structure

```
index.php              landing page (Home / Menu / About / Order tab panels)
config.php             brand copy, tab list, asset version, e() escape helper
includes/header.php    <head>, PWA meta, intro overlay markup, header + top tabs
includes/footer.php    bottom tab bar (mobile), footer, script tags
manifest.json          PWA manifest (icons in assets/img/icons)
sw.js                  service worker: cache-first assets, network-first pages
assets/css/style.css   design system: palette tokens, pixel buttons/cards, intro UI
assets/js/intro.js     pixel-art intro: scene, truck, Miya hop-out, timeline
assets/js/music.js     Web Audio music box (no audio files)
assets/js/app.js       tabs, replay intro, cookie bite, SW + install prompt
assets/img/            sprites + props copied from the pixel pack, PWA icons
design/                original brand assets and the full pixel sprite pack
tools/make_icons.py    regenerates PWA icons from the 1x hero sprite (stdlib only)
```

## Intro timeline (seconds after "Tap to begin")

| t     | Beat                                              |
|-------|---------------------------------------------------|
| 0–2.0 | Truck rolls in, world scrolls, exhaust puffs      |
| 2–3.4 | Brakes ease out, stop bounce, dust at the wheels  |
| 3.9   | Miya hops out of the bed (run pose, arc)          |
| 4.45  | Lands in hero pose, sparkles, cookie twinkle      |
| 4.8   | Title, then tagline (5.5), then "Come on in" (6.3)|
| 16    | Auto-enters the site if nobody clicks             |

Adjust in `T` at the top of the timeline section in `assets/js/intro.js`.

## Pixel rules

- Everything scales by whole numbers only (`image-rendering: pixelated`).
- Palette is locked to `design/pixel-pack/palette/palette.json`.
- The truck, wheel, and cookie badge are string grids in `intro.js`; each letter
  is a palette key, `.` is transparent. Edit them like ASCII art.

## Deploy notes

- Bump `ASSET_VERSION` in `config.php` and `CACHE` in `sw.js` on each release.
- Serve over HTTPS for installability and the service worker.
- Set `SITE_URL` in `config.php` for absolute social-preview image URLs.
