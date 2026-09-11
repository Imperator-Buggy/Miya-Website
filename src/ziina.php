<?php
/**
 * Ziina — UAE payment provider (cards, Apple Pay, local wallets), hosted payment page.
 * Flow: create a Payment Intent → redirect the customer to Ziina → Ziina sends them
 * back to success/cancel/failure URLs → we re-check the intent status on return.
 *
 * .env: ZIINA_API_KEY (from Ziina Business → Developers), ZIINA_TEST=true while testing.
 * API reference: https://docs.ziina.com (Payment Intent endpoints).
 */
declare(strict_types=1);

const ZIINA_API = 'https://api-v2.ziina.com/api/';

function ziina_enabled(): bool
{
    return (bool) env('ZIINA_API_KEY');
}

function ziina_request(string $method, string $path, ?array $body = null): array
{
    $ch = curl_init(ZIINA_API . ltrim($path, '/'));
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 20,
        CURLOPT_HTTPHEADER     => [
            'Authorization: Bearer ' . env('ZIINA_API_KEY'),
            'Content-Type: application/json',
            'Accept: application/json',
        ],
    ]);
    if ($method === 'POST') {
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body ?? []));
    }
    $res = curl_exec($ch);
    $status = curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    $err = curl_error($ch);
    if ($res === false) throw new RuntimeException('Ziina unreachable: ' . $err);
    $json = json_decode($res, true) ?? [];
    if ($status >= 400) throw new RuntimeException('Ziina: ' . ($json['message'] ?? $json['error'] ?? "HTTP $status"));
    return $json;
}

/** Create a payment intent for an order and return the hosted-page URL. */
function ziina_checkout_url(array $order, string $baseUrl): string
{
    $return = $baseUrl . '/order.php?ref=' . $order['ref'];
    $intent = ziina_request('POST', 'payment_intent', [
        'amount'             => (int) $order['total_fils'],   // Ziina amounts are in fils
        'currency_code'      => CURRENCY,
        'message'            => SITE_NAME . ' order ' . $order['ref'],
        'success_url'        => $return . '&ziina=success',
        'cancel_url'         => $return . '&cancelled=1',
        'failure_url'        => $return . '&failed=1',
        'test'               => env('ZIINA_TEST', 'true') === 'true',
        'transaction_source' => 'directApi',
    ]);
    if (empty($intent['id']) || empty($intent['redirect_url'])) {
        throw new RuntimeException('Ziina did not return a payment page.');
    }
    set_payment_ref($order['ref'], $intent['id']);
    return $intent['redirect_url'];
}

/** True when the payment intent has been completed. */
function ziina_is_paid(string $intentId): bool
{
    $intent = ziina_request('GET', 'payment_intent/' . rawurlencode($intentId));
    return ($intent['status'] ?? '') === 'completed';
}
