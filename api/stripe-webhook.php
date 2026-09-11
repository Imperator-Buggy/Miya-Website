<?php
/**
 * POST /api/stripe-webhook.php — Stripe calls this when a Checkout session completes.
 * Configure the endpoint in the Stripe dashboard and put its signing secret in .env.
 */
declare(strict_types=1);
require_once dirname(__DIR__) . '/src/api.php';

$payload = file_get_contents('php://input') ?: '';
try {
    $event = stripe_verify_webhook($payload, $_SERVER['HTTP_STRIPE_SIGNATURE'] ?? '');
} catch (Throwable $e) {
    json_out(['ok' => false, 'error' => $e->getMessage()], 400);
}

if (($event['type'] ?? '') === 'checkout.session.completed') {
    $session = $event['data']['object'] ?? [];
    $ref = $session['metadata']['order_ref'] ?? $session['client_reference_id'] ?? null;
    if ($ref && ($session['payment_status'] ?? '') === 'paid') {
        mark_paid($ref, $session['id'] ?? null);
    }
}
json_out(['ok' => true]);
