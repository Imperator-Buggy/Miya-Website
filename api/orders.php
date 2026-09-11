<?php
/**
 * POST /api/orders.php — place an order.
 * Body: { name, phone, email?, zone, address, lat?, lng?, notes?, slot, payment_method, items: [{sku, qty}] }
 * Reply: { ok, ref, total_fils, redirect }  — redirect is order.php (cash) or Stripe Checkout (card).
 */
declare(strict_types=1);
require_once dirname(__DIR__) . '/src/api.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    json_out(['ok' => false, 'error' => 'POST only'], 405);
}

ensure_schema();

try {
    $order = create_order(json_in());
    $base  = base_url();
    $redirect = $base . '/order.php?ref=' . $order['ref'];
    if ($order['payment_method'] === 'card') {
        $redirect = stripe_checkout_url($order, $base);
    } elseif ($order['payment_method'] === 'ziina') {
        $redirect = ziina_checkout_url($order, $base);
    }
    json_out(['ok' => true, 'ref' => $order['ref'], 'total_fils' => (int) $order['total_fils'], 'redirect' => $redirect]);
} catch (OrderError $e) {
    json_out(['ok' => false, 'error' => $e->getMessage()], 422);
} catch (Throwable $e) {
    error_log('order failed: ' . $e->getMessage());
    json_out(['ok' => false, 'error' => 'Something went wrong on our side. Please try again or call us.'], 500);
}
