<?php
/**
 * Minimal Stripe client (Checkout Sessions + webhook signature check) using
 * cURL only, so the project stays dependency-free. Stripe supports UAE
 * businesses and AED, with Apple Pay / Google Pay enabled automatically in
 * Checkout. Keys go in .env: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET.
 */
declare(strict_types=1);

function stripe_enabled(): bool
{
    return (bool) env('STRIPE_SECRET_KEY');
}

/** Low-level form-encoded POST/GET to api.stripe.com. Returns decoded JSON. */
function stripe_request(string $method, string $path, array $params = []): array
{
    $ch = curl_init('https://api.stripe.com/v1/' . ltrim($path, '/'));
    $headers = ['Authorization: Bearer ' . env('STRIPE_SECRET_KEY'), 'Stripe-Version: 2024-06-20'];
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER     => $headers,
        CURLOPT_TIMEOUT        => 20,
    ]);
    if ($method === 'POST') {
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($params));
    }
    $body = curl_exec($ch);
    $status = curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    $err = curl_error($ch);
    if ($body === false) throw new RuntimeException('Stripe unreachable: ' . $err);
    $json = json_decode($body, true) ?? [];
    if ($status >= 400) throw new RuntimeException('Stripe: ' . ($json['error']['message'] ?? "HTTP $status"));
    return $json;
}

/** Create a hosted Checkout session for an order. Returns the redirect URL. */
function stripe_checkout_url(array $order, string $baseUrl): string
{
    $params = [
        'mode'                 => 'payment',
        'currency'             => strtolower(CURRENCY),
        'client_reference_id'  => $order['ref'],
        'success_url'          => $baseUrl . '/order.php?ref=' . $order['ref'] . '&session_id={CHECKOUT_SESSION_ID}',
        'cancel_url'           => $baseUrl . '/order.php?ref=' . $order['ref'] . '&cancelled=1',
        'metadata[order_ref]'  => $order['ref'],
        'payment_method_types[0]' => 'card',
    ];
    if (!empty($order['email'])) $params['customer_email'] = $order['email'];
    $i = 0;
    foreach ($order['items'] as $it) {
        $params["line_items[$i][quantity]"] = $it['qty'];
        $params["line_items[$i][price_data][currency]"] = strtolower(CURRENCY);
        $params["line_items[$i][price_data][unit_amount]"] = $it['unit_fils'];
        $params["line_items[$i][price_data][product_data][name]"] = $it['name'];
        $i++;
    }
    if ((int) $order['delivery_fils'] > 0) {
        $params["line_items[$i][quantity]"] = 1;
        $params["line_items[$i][price_data][currency]"] = strtolower(CURRENCY);
        $params["line_items[$i][price_data][unit_amount]"] = (int) $order['delivery_fils'];
        $params["line_items[$i][price_data][product_data][name]"] = 'Delivery — ' . $order['zone'];
    }
    $session = stripe_request('POST', 'checkout/sessions', $params);
    set_payment_ref($order['ref'], $session['id']);
    return $session['url'];
}

/** Retrieve a Checkout session (used on the success page as a webhook fallback). */
function stripe_session(string $id): array
{
    return stripe_request('GET', 'checkout/sessions/' . rawurlencode($id));
}

/** Verify a Stripe-Signature header. Returns the decoded event or throws. */
function stripe_verify_webhook(string $payload, string $sigHeader): array
{
    $secret = env('STRIPE_WEBHOOK_SECRET');
    if (!$secret) throw new RuntimeException('STRIPE_WEBHOOK_SECRET not set');
    $parts = [];
    foreach (explode(',', $sigHeader) as $kv) {
        [$k, $v] = array_pad(explode('=', $kv, 2), 2, '');
        $parts[$k][] = $v;
    }
    $ts = $parts['t'][0] ?? '';
    if ($ts === '' || abs(time() - (int) $ts) > 300) throw new RuntimeException('Webhook timestamp out of range');
    $expected = hash_hmac('sha256', $ts . '.' . $payload, $secret);
    foreach ($parts['v1'] ?? [] as $sig) {
        if (hash_equals($expected, $sig)) return json_decode($payload, true) ?? [];
    }
    throw new RuntimeException('Invalid webhook signature');
}
