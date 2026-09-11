<?php
/**
 * Orders dashboard for Miya. Protected by HTTP Basic auth using ADMIN_PASSWORD from .env.
 * Lets you move an order through: new → baking → on the way → delivered (or cancelled),
 * and mark cash orders as paid.
 */
declare(strict_types=1);
require dirname(__DIR__) . '/config.php';
require dirname(__DIR__) . '/src/db.php';
require dirname(__DIR__) . '/src/orders.php';

$password = env('ADMIN_PASSWORD');
if (!$password || ($_SERVER['PHP_AUTH_USER'] ?? '') !== 'miya' || !hash_equals($password, $_SERVER['PHP_AUTH_PW'] ?? '')) {
    header('WWW-Authenticate: Basic realm="Miya\'s Cookies admin"');
    http_response_code(401);
    echo $password ? 'Sign in as user "miya" with the admin password.' : 'Set ADMIN_PASSWORD in .env to enable the admin.';
    exit;
}

try { db()->query('SELECT 1 FROM orders LIMIT 1'); } catch (Throwable) { migrate(); }

const STATUSES = ['new' => 'New', 'baking' => 'Baking', 'on-the-way' => 'On the way', 'delivered' => 'Delivered', 'cancelled' => 'Cancelled'];

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    $ref = (string) ($_POST['ref'] ?? '');
    if (isset(STATUSES[$_POST['status'] ?? ''])) {
        db()->prepare('UPDATE orders SET status = ? WHERE ref = ?')->execute([$_POST['status'], $ref]);
    }
    if (!empty($_POST['paid'])) {
        mark_paid($ref);
    }
    header('Location: index.php'); exit;
}

$orders = db()->query('SELECT * FROM orders ORDER BY id DESC LIMIT 200')->fetchAll();
$items = [];
if ($orders) {
    $ids = implode(',', array_map('intval', array_column($orders, 'id')));
    foreach (db()->query("SELECT * FROM order_items WHERE order_id IN ($ids) ORDER BY id") as $it) {
        $items[$it['order_id']][] = $it;
    }
}
$pageTitle = 'Orders — ' . SITE_NAME;
$noIntro = true; $noNav = true; $base = "../";
require dirname(__DIR__) . '/includes/header.php';
?>
<p class="eyebrow">Admin &middot; <?= count($orders) ?> orders</p>
<h2>Orders</h2>
<?php if (!$orders): ?><p class="muted">No orders yet. Go bake something.</p><?php endif; ?>
<div class="grid" style="grid-template-columns:1fr">
<?php foreach ($orders as $o): ?>
  <form class="card admin-order" method="post">
    <input type="hidden" name="ref" value="<?= e($o['ref']) ?>">
    <div class="admin-order__head">
      <div>
        <strong><?= e($o['ref']) ?></strong> <span class="pill pill--<?= e($o['status']) ?>"><?= e(STATUSES[$o['status']] ?? $o['status']) ?></span>
        <span class="pill <?= $o['payment_status'] === 'paid' ? 'pill--paid' : '' ?>"><?= e(PAYMENT_METHODS[$o['payment_method']] ?? $o['payment_method']) ?> &middot; <?= e($o['payment_status']) ?></span>
        <div class="muted"><?= e(date('D j M, g:i a', strtotime($o['created_at']))) ?> &middot; <?= e(DELIVERY_SLOTS[$o['slot']] ?? $o['slot']) ?></div>
      </div>
      <strong><?= e(aed((int) $o['total_fils'])) ?></strong>
    </div>
    <div class="admin-order__body">
      <div>
        <?php foreach ($items[$o['id']] ?? [] as $it): ?><div><?= (int) $it['qty'] ?> &times; <?= e($it['name']) ?></div><?php endforeach; ?>
        <?php if ($o['notes']): ?><div class="muted">Note: <?= e($o['notes']) ?></div><?php endif; ?>
      </div>
      <div>
        <div><?= e($o['customer_name']) ?> &middot; <a href="tel:<?= e($o['phone']) ?>"><?= e($o['phone']) ?></a></div>
        <div class="muted"><?= nl2br(e($o['address'])) ?><br><?= e($o['zone']) ?></div>
        <?php if ($o['lat']): ?><a href="https://www.google.com/maps?q=<?= e((string) $o['lat']) ?>,<?= e((string) $o['lng']) ?>" target="_blank" rel="noopener">Open pin in Google Maps &rarr;</a><?php endif; ?>
      </div>
    </div>
    <div class="admin-order__actions">
      <select name="status"><?php foreach (STATUSES as $k => $v): ?><option value="<?= e($k) ?>" <?= $k === $o['status'] ? 'selected' : '' ?>><?= e($v) ?></option><?php endforeach; ?></select>
      <button class="btn btn--sm" type="submit">Update</button>
      <?php if ($o['payment_status'] !== 'paid'): ?><button class="btn btn--sm btn--kraft" type="submit" name="paid" value="1">Mark paid</button><?php endif; ?>
    </div>
  </form>
<?php endforeach; ?>
</div>
<?php require dirname(__DIR__) . '/includes/footer.php'; ?>
