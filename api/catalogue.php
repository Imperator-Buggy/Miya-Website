<?php
/** GET /api/catalogue.php — products, delivery zones, slots and shop settings for the front end. */
declare(strict_types=1);
require_once dirname(__DIR__) . '/src/api.php';

ensure_schema();

json_out([
    'currency'          => CURRENCY,
    'products'          => products(),
    'zones'             => DELIVERY_ZONES,
    'slots'             => DELIVERY_SLOTS,
    'kitchen_open'      => kitchen_open(),
    'min_order_fils'    => MIN_ORDER_FILS,
    'free_delivery_over'=> FREE_DELIVERY_OVER_FILS,
    'payment_methods'   => array_filter(PAYMENT_METHODS, fn ($k) => $k === 'cod' || ($k === 'card' && stripe_enabled()) || ($k === 'ziina' && ziina_enabled()), ARRAY_FILTER_USE_KEY),
    'map'               => ['center' => MAP_CENTER, 'zoom' => MAP_ZOOM],
]);
