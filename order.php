<?php
/**
 * Order confirmation page: order.php?ref=MC-...
 * Also the Stripe success/cancel landing page. If Stripe sends us back with a
 * session_id and the webhook has not arrived yet, we verify the session here.
 */
declare(strict_types=1);
require __DIR__ . '/config.php';
require __DIR__ . '/src/db.php';
require __DIR__ . '/src/orders.php';
require __DIR__ . '/src/stripe.php';
require __DIR__ . '/src/ziina.php';

$ref = preg_replace('/[^A-Z0-9-]/', '', strtoupper((string) ($_GET['ref'] ?? '')));
$order = $ref ? find_order($ref) : null;
$cancelled = isset($_GET['cancelled']) || isset($_GET['failed']);

if ($order && $order['payment_method'] === 'card' && $order['payment_status'] !== 'paid' && !empty($_GET['session_id']) && stripe_enabled()) {
    try {
        $s = stripe_session((string) $_GET['session_id']);
        if (($s['payment_status'] ?? '') === 'paid' && ($s['metadata']['order_ref'] ?? '') === $ref) {
            mark_paid($ref, $s['id']);
            $order = find_order($ref);
        }
    } catch (Throwable $e) {
        error_log('session verify failed: ' . $e->getMessage());
    }
}
// Ziina sends the customer back to us; confirm the payment intent server-side.
if ($order && $order['payment_method'] === 'ziina' && $order['payment_status'] !== 'paid' && !empty($order['payment_ref']) && ziina_enabled() && !$cancelled) {
    try {
        if (ziina_is_paid($order['payment_ref'])) {
            mark_paid($ref);
            $order = find_order($ref);
        }
    } catch (Throwable $e) {
        error_log('ziina verify failed: ' . $e->getMessage());
    }
}

$pageTitle = ($order ? 'Order ' . $order['ref'] : 'Order not found') . ' — ' . SITE_NAME;
$noIntro = true; $base = "";
require __DIR__ . '/includes/header.php';
?>

<section class="panel" data-panel="order-status" role="region" aria-label="Order status">
<?php if (!$order): ?>
  <div class="card" style="text-align:center">
    <img class="pixel" src="assets/img/sprites/miya_nutella_wave@4x.png" alt="" width="128" height="128" style="margin:0 auto 1rem">
    <h2>Hmm, we can't find that order.</h2>
    <p class="muted">Check the link, or start a fresh box.</p>
    <a class="btn" href="index.php#order">Order cookies &rarr;</a>
  </div>
<?php else:
  $paid = $order['payment_status'] === 'paid';
  $card = in_array($order['payment_method'], ['card', 'ziina'], true);
?>
  <div class="hero">
    <div>
      <p class="eyebrow">Order <?= e($order['ref']) ?></p>
      <?php if ($card && !$paid && $cancelled): ?>
        <h2>Payment cancelled.</h2>
        <p class="muted">No worries. Your box is saved. You can try paying again or switch to cash on delivery when we call to confirm.</p>
        <a class="btn" href="index.php#order">Back to the order page</a>
      <?php elseif ($card && !$paid): ?>
        <h2>Almost there.</h2>
        <p class="muted">We're waiting for the payment to confirm. This usually takes a few seconds. Refresh this page in a moment.</p>
      <?php else: ?>
        <h2>The oven is on, <?= e(explode(' ', $order['customer_name'])[0]) ?>!</h2>
        <p class="muted">Thank you. We'll message <strong><?= e($order['phone']) ?></strong> when Miya's truck is on its way.<?= $card ? ' Your payment went through.' : ' Please have ' . e(aed((int) $order['total_fils'])) . ' ready in cash.' ?></p>
      <?php endif; ?>
    </div>
    <div class="hero__art"><img class="hero__miya pixel" src="assets/img/sprites/miya_nutella_tray@4x.png" alt="" width="128" height="128"></div>
  </div>

  <div class="grid" style="grid-template-columns:1fr">
    <div class="card">
      <h3>Your box</h3>
      <table class="receipt">
        <?php foreach ($order['items'] as $it): ?>
          <tr><td><?= e($it['name']) ?> <span class="muted">&times; <?= (int) $it['qty'] ?></span></td><td><?= e(aed((int) $it['line_fils'])) ?></td></tr>
        <?php endforeach; ?>
        <tr><td>Delivery &middot; <?= e($order['zone']) ?></td><td><?= (int) $order['delivery_fils'] === 0 ? 'Free' : e(aed((int) $order['delivery_fils'])) ?></td></tr>
        <tr class="receipt__total"><td>Total</td><td><?= e(aed((int) $order['total_fils'])) ?></td></tr>
      </table>
    </div>
    <div class="card card--kraft">
      <h3>Delivering to</h3>
      <p><?= nl2br(e($order['address'])) ?><br><span class="muted"><?= e($order['zone']) ?>, Abu Dhabi</span></p>
      <p class="muted">When: <?= e(DELIVERY_SLOTS[$order['slot']] ?? $order['slot']) ?><br>Payment: <?= e(PAYMENT_METHODS[$order['payment_method']] ?? $order['payment_method']) ?> &middot; <?= $paid ? 'paid' : 'to pay' ?></p>
      <?php if ($order['notes']): ?><p class="muted">Note: <?= e($order['notes']) ?></p><?php endif; ?>
    </div>
  </div>
  <p style="margin-top:1.5rem"><a class="btn btn--ghost" href="index.php">&larr; Back to Miya's</a></p>
<?php endif; ?>
</section>

<?php require __DIR__ . '/includes/footer.php'; ?>
