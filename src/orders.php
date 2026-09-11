<?php
/**
 * Order creation: validation, server-side pricing, persistence.
 * The client only sends SKUs and quantities — prices always come from the DB.
 */
declare(strict_types=1);

require_once __DIR__ . '/db.php';

class OrderError extends RuntimeException {}

/** Normalise a UAE mobile number to +9715XXXXXXXX. Throws on anything else. */
function normalise_uae_phone(string $raw): string
{
    $digits = preg_replace('/\D+/', '', $raw);
    if (str_starts_with($digits, '00971')) $digits = substr($digits, 5);
    elseif (str_starts_with($digits, '971')) $digits = substr($digits, 3);
    elseif (str_starts_with($digits, '0'))   $digits = substr($digits, 1);
    if (!preg_match('/^5[0-9]{8}$/', $digits)) {
        throw new OrderError('Please enter a valid UAE mobile number, e.g. 050 123 4567.');
    }
    return COUNTRY_CODE . $digits;
}

function delivery_fee(string $zone, int $subtotal): int
{
    if (!array_key_exists($zone, DELIVERY_ZONES)) {
        throw new OrderError('Please choose a delivery area.');
    }
    return $subtotal >= FREE_DELIVERY_OVER_FILS ? 0 : DELIVERY_ZONES[$zone];
}

/** Is the kitchen open right now (Gulf Standard Time)? */
function kitchen_open(?DateTimeImmutable $now = null): bool
{
    $h = (int) ($now ?? new DateTimeImmutable('now', new DateTimeZone(TIMEZONE)))->format('G');
    return $h >= OPEN_HOUR || $h < CLOSE_HOUR;
}

function order_ref(): string
{
    $alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    $code = '';
    for ($i = 0; $i < 4; $i++) $code .= $alphabet[random_int(0, strlen($alphabet) - 1)];
    return 'MC-' . date('ymd') . '-' . $code;
}

/**
 * Validate the checkout payload and store the order.
 * @return array the stored order (with items), ready for JSON or Stripe
 */
function create_order(array $in): array
{
    $name  = trim((string) ($in['name'] ?? ''));
    $phone = normalise_uae_phone((string) ($in['phone'] ?? ''));
    $email = trim((string) ($in['email'] ?? ''));
    $zone  = (string) ($in['zone'] ?? '');
    $addr  = trim((string) ($in['address'] ?? ''));
    $notes = trim((string) ($in['notes'] ?? ''));
    $slot  = (string) ($in['slot'] ?? '');
    $pay   = (string) ($in['payment_method'] ?? 'cod');
    $lat   = isset($in['lat']) && $in['lat'] !== '' ? (float) $in['lat'] : null;
    $lng   = isset($in['lng']) && $in['lng'] !== '' ? (float) $in['lng'] : null;
    $items = is_array($in['items'] ?? null) ? $in['items'] : [];

    if (mb_strlen($name) < 2)  throw new OrderError('Please tell us your name.');
    if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) throw new OrderError('That email address does not look right.');
    if (mb_strlen($addr) < 8)  throw new OrderError('Please add your building or villa, street and any landmarks.');
    if (!isset(DELIVERY_SLOTS[$slot])) throw new OrderError('Please pick a delivery time.');
    if ($slot === 'asap' && !kitchen_open()) throw new OrderError('The kitchen is closed right now. Pick a later slot and we will bake it fresh.');
    if (!isset(PAYMENT_METHODS[$pay])) throw new OrderError('Please choose a payment method.');
    if ($pay === 'card' && !env('STRIPE_SECRET_KEY')) throw new OrderError('Stripe card payment is not available yet. Please choose another method.');
    if ($pay === 'ziina' && !env('ZIINA_API_KEY')) throw new OrderError('Ziina is not available yet. Please choose another method.');
    if (!$items) throw new OrderError('Your box is empty. Add some cookies first.');

    // Price every line from the database, never from the client.
    $catalogue = [];
    foreach (products() as $p) $catalogue[$p['sku']] = $p;
    $lines = [];
    $subtotal = 0;
    foreach ($items as $it) {
        $sku = (string) ($it['sku'] ?? '');
        $qty = (int) ($it['qty'] ?? 0);
        if (!isset($catalogue[$sku]) || $qty < 1 || $qty > 50) continue;
        $unit = (int) $catalogue[$sku]['price_fils'];
        $lines[] = ['sku' => $sku, 'name' => $catalogue[$sku]['name'], 'unit_fils' => $unit, 'qty' => $qty, 'line_fils' => $unit * $qty];
        $subtotal += $unit * $qty;
    }
    if (!$lines) throw new OrderError('Your box is empty. Add some cookies first.');
    if ($subtotal < MIN_ORDER_FILS) throw new OrderError('Minimum order is ' . aed(MIN_ORDER_FILS) . '. Add a little more.');

    $fee   = delivery_fee($zone, $subtotal);
    $total = $subtotal + $fee;
    $pdo   = db();
    $pdo->beginTransaction();
    try {
        $ref = order_ref();
        $pdo->prepare('INSERT INTO orders (ref, status, payment_method, payment_status, customer_name, phone, email, zone, address, lat, lng, notes, slot, subtotal_fils, delivery_fils, total_fils, created_at)
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
            ->execute([$ref, 'new', $pay, 'unpaid', $name, $phone, $email ?: null, $zone, $addr, $lat, $lng, $notes ?: null, $slot, $subtotal, $fee, $total, date('c')]);
        $orderId = (int) $pdo->lastInsertId(db_driver() === 'pgsql' ? 'orders_id_seq' : null);
        $st = $pdo->prepare('INSERT INTO order_items (order_id, sku, name, unit_fils, qty, line_fils) VALUES (?, ?, ?, ?, ?, ?)');
        foreach ($lines as $l) $st->execute([$orderId, $l['sku'], $l['name'], $l['unit_fils'], $l['qty'], $l['line_fils']]);
        $pdo->commit();
    } catch (Throwable $t) {
        $pdo->rollBack();
        throw $t;
    }
    return find_order($ref);
}

function find_order(string $ref): ?array
{
    $st = db()->prepare('SELECT * FROM orders WHERE ref = ?');
    $st->execute([$ref]);
    $order = $st->fetch();
    if (!$order) return null;
    $it = db()->prepare('SELECT sku, name, unit_fils, qty, line_fils FROM order_items WHERE order_id = ? ORDER BY id');
    $it->execute([$order['id']]);
    $order['items'] = $it->fetchAll();
    return $order;
}

function mark_paid(string $ref, ?string $paymentRef = null): void
{
    db()->prepare("UPDATE orders SET payment_status = 'paid', payment_ref = COALESCE(?, payment_ref) WHERE ref = ?")
        ->execute([$paymentRef, $ref]);
}

/** Remember the provider's id (Stripe session / Ziina payment intent) for an order. */
function set_payment_ref(string $ref, string $paymentRef): void
{
    db()->prepare('UPDATE orders SET payment_ref = ? WHERE ref = ?')->execute([$paymentRef, $ref]);
}
