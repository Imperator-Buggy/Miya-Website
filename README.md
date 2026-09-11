# Miya's Cookies — cozy pixel bakery PWA (Abu Dhabi)

A mobile-first, installable cookie-delivery site for Miya's Cookies, Abu Dhabi.
PHP renders the pages and powers a small JSON API; the front end is plain
HTML/CSS/JS with a hand-rolled pixel-art intro and a synthesised music-box
soundtrack. Orders are stored in a database, paid by cash on delivery or by
card through Stripe Checkout.

## Run locally

```bash
cp .env.example .env          # then set ADMIN_PASSWORD (and Stripe keys if you have them)
php tools/migrate.php         # creates data/miya.sqlite and seeds the menu
php -S localhost:8000
```

- Site: http://localhost:8000 (add `?intro=1` to replay the intro)
- Admin: http://localhost:8000/admin/ — user `miya`, password from `.env`

PHP 8.2+ with `pdo_sqlite` (local) and `pdo_pgsql` (production). No Composer.

## Pages

- **Home / Menu / Order** — the shop (index.php tab panels).
- **Play** (`game.php`) — *Miya's Cookie Farm*, a pixel farming → baking → delivery
  game built on the sprite pack. Grow wheat, milk cows, shake date palms, pick
  hazelnuts, scrape sea salt, bake in the oven timing mini-game, deliver before the
  order goes cold. Night orders pay double, hearts unlock the pack's outfits, coins
  buy upgrades. Cast: Miya, Mama Noura, Hessa (farm), Noor (cows), Lulu (orchard),
  Reem (night). Saves to localStorage. Touch + keyboard.
- **3D** (`cookie3d.php`) — the signature cookie exploded in Three.js: drag to orbit,
  slider to lift the layers, tap a layer for a note, take a bite, pixel mode.

## Structure

```
index.php              Home / Menu / About / Order tab panels
order.php              order confirmation + Stripe success/cancel landing
admin/index.php        orders dashboard (HTTP Basic auth)
api/catalogue.php      GET  products, zones, slots, settings
api/orders.php         POST place an order → redirect (confirmation or Stripe)
api/stripe-webhook.php POST Stripe → marks orders paid
config.php             brand copy, AED pricing rules, delivery zones, slots
src/env.php            .env loader        src/db.php     PDO + schema + seed
src/orders.php         validation/pricing src/stripe.php cURL Stripe client
includes/              header/footer partials
assets/js/intro.js     pixel intro       assets/js/music.js  music box
assets/js/shop.js      menu, cart, checkout, Leaflet map
assets/js/app.js       tabs, replay, PWA install
tools/migrate.php      create schema + seed      tools/make_icons.py  PWA icons
Dockerfile, render.yaml, docker/apache.conf   deploy from GitHub
```

## Ordering rules (config.php)

- Prices stored in fils; displayed as AED. Server re-prices every order from the DB.
- Minimum order AED 40. Free delivery over AED 150.
- Delivery zones: Abu Dhabi island areas AED 10, Saadiyat/Raha/Khalifa/Masdar AED 15,
  Yas/MBZ/Mussafah/Reef AED 20, Shamkha/Bahia AED 25. Edit `DELIVERY_ZONES`.
- Slots: ASAP (only while the kitchen is open, 12 pm – 1 am GST), evening windows,
  and the midnight batch. Timezone is Asia/Dubai.
- UAE mobile numbers are normalised to `+9715XXXXXXXX`.

## Payments

- **Cash on delivery** works out of the box.
- **Ziina** (UAE-native: cards, Apple Pay, wallets, AED settlement to a UAE bank).
  Sign up at ziina.com/business, create an API key under Developers, set
  `ZIINA_API_KEY` in `.env`. Keep `ZIINA_TEST=true` until you have tested a
  payment, then set it to `false`. Payments are confirmed when the customer
  returns to the confirmation page.
- **Card / Apple Pay / Google Pay** via Stripe Checkout (Stripe supports UAE
  businesses and AED). Set `STRIPE_SECRET_KEY` in `.env` and the card option
  appears automatically. Add a webhook for `checkout.session.completed` pointing
  at `/api/stripe-webhook.php` and put its signing secret in `STRIPE_WEBHOOK_SECRET`.
  The confirmation page also verifies the session directly, so local testing
  works without a webhook.

## Going live from GitHub

GitHub Pages only serves static files, so it cannot run PHP or hold orders.
Recommended free setup that still deploys on every push:

1. **Database — Supabase** (free Postgres). The project is already created
   (session pooler in Seoul; host and user are in `.env.example` and
   `render.yaml`). Only the database password is secret: put it in `.env`
   locally and in Render's dashboard. Run `php tools/migrate.php` once to
   create the tables.
2. **Hosting — Render** (free web service, region *Singapore*). New → Blueprint →
   pick this repo; `render.yaml` sets everything up. Add the env vars in the
   dashboard. Every push to `main` redeploys. Free instances sleep after 15
   minutes idle, so the first visit can take ~30 s; the paid tier removes that.
3. Set `APP_URL` to the Render URL. When you buy a domain, add it under Render →
   Custom Domains and update `APP_URL`.

Alternatives: Railway or Fly.io for hosting; Neon for Postgres.

## Deploy checklist

- Bump `ASSET_VERSION` in `config.php` and `CACHE` in `sw.js` on each release.
- Never commit `.env` (it is git-ignored).
- Serve over HTTPS (Render does) for installability and the service worker.
