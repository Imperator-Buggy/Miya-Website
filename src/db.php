<?php
/**
 * Database access. One PDO connection, chosen by .env:
 *
 *   DATABASE_URL=postgresql://user:pass@host:5432/postgres   paste straight from Supabase (session pooler)
 *   or DB_DSN + DB_USER + DB_PASS:
 *   (default)  sqlite:data/miya.sqlite            zero-setup local development
 *   pgsql:host=...;port=5432;dbname=postgres;sslmode=require   Supabase / Neon
 *   mysql:host=...;dbname=miya                    any MySQL / MariaDB host
 *
 * Schema is created on demand by migrate() using small per-dialect tweaks,
 * so the same code runs everywhere.
 */
declare(strict_types=1);

function db(): PDO
{
    static $pdo = null;
    if ($pdo !== null) {
        return $pdo;
    }
    $dsn  = env('DB_DSN', 'sqlite:' . dirname(__DIR__) . '/data/miya.sqlite');
    $user = env('DB_USER');
    $pass = env('DB_PASS');
    // DATABASE_URL=postgresql://user:pass@host:port/db (what Supabase / Render hand you) wins if set.
    if ($url = env('DATABASE_URL')) {
        $u = parse_url($url);
        if ($u === false || empty($u['host'])) throw new RuntimeException('DATABASE_URL is not a valid URL');
        $scheme = in_array($u['scheme'] ?? '', ['postgres', 'postgresql'], true) ? 'pgsql' : ($u['scheme'] ?? 'pgsql');
        $dsn  = sprintf('%s:host=%s;port=%d;dbname=%s', $scheme, $u['host'], $u['port'] ?? 5432, ltrim($u['path'] ?? '/postgres', '/'));
        if ($scheme === 'pgsql') $dsn .= ';sslmode=require';
        $user = isset($u['user']) ? rawurldecode($u['user']) : $user;
        $pass = isset($u['pass']) ? rawurldecode($u['pass']) : $pass;
    }
    if (str_starts_with($dsn, 'sqlite:')) {
        $path = substr($dsn, 7);
        if ($path !== ':memory:' && !is_dir(dirname($path))) {
            mkdir(dirname($path), 0775, true);
        }
    }
    $pdo = new PDO($dsn, $user, $pass, [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ]);
    if (db_driver($pdo) === 'sqlite') {
        $pdo->exec('PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;');
    }
    return $pdo;
}

function db_driver(?PDO $pdo = null): string
{
    return ($pdo ?? db())->getAttribute(PDO::ATTR_DRIVER_NAME);
}

/** Create tables if missing and seed the catalogue. Safe to run repeatedly. */
function migrate(): void
{
    $pdo = db();
    $id = match (db_driver($pdo)) {
        'sqlite' => 'INTEGER PRIMARY KEY AUTOINCREMENT',
        'pgsql'  => 'SERIAL PRIMARY KEY',
        default  => 'INT AUTO_INCREMENT PRIMARY KEY',
    };

    $pdo->exec("CREATE TABLE IF NOT EXISTS products (
        id          $id,
        sku         VARCHAR(40)  NOT NULL UNIQUE,
        name        VARCHAR(120) NOT NULL,
        description TEXT         NOT NULL,
        price_fils  INTEGER      NOT NULL,
        image       VARCHAR(200) NOT NULL,
        sort        INTEGER      NOT NULL DEFAULT 0,
        active      INTEGER      NOT NULL DEFAULT 1
    )");

    $pdo->exec("CREATE TABLE IF NOT EXISTS orders (
        id                $id,
        ref               VARCHAR(20)  NOT NULL UNIQUE,
        status            VARCHAR(20)  NOT NULL DEFAULT 'new',
        payment_method    VARCHAR(10)  NOT NULL,
        payment_status    VARCHAR(20)  NOT NULL DEFAULT 'unpaid',
        payment_ref       VARCHAR(120),
        customer_name     VARCHAR(120) NOT NULL,
        phone             VARCHAR(20)  NOT NULL,
        email             VARCHAR(160),
        zone              VARCHAR(80)  NOT NULL,
        address           TEXT         NOT NULL,
        lat               DOUBLE PRECISION,
        lng               DOUBLE PRECISION,
        notes             TEXT,
        slot              VARCHAR(20)  NOT NULL,
        subtotal_fils     INTEGER      NOT NULL,
        delivery_fils     INTEGER      NOT NULL,
        total_fils        INTEGER      NOT NULL,
        created_at        VARCHAR(32)  NOT NULL
    )");

    $pdo->exec("CREATE TABLE IF NOT EXISTS order_items (
        id        $id,
        order_id  INTEGER      NOT NULL,
        sku       VARCHAR(40)  NOT NULL,
        name      VARCHAR(120) NOT NULL,
        unit_fils INTEGER      NOT NULL,
        qty       INTEGER      NOT NULL,
        line_fils INTEGER      NOT NULL
    )");
    $pdo->exec('CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items (order_id)');
    $pdo->exec('CREATE INDEX IF NOT EXISTS idx_orders_created ON orders (created_at)');

    seed_products($pdo);
}

/** Insert the starting menu if the catalogue is empty. Prices in fils. */
function seed_products(PDO $pdo): void
{
    if ((int) $pdo->query('SELECT COUNT(*) FROM products')->fetchColumn() > 0) {
        return;
    }
    $rows = [
        ['signature-1',   "Miya's Signature",       'One warm Nutella-filled cookie, sea salt on top.',            1200, 'assets/img/props/cookie_signature@4x.png', 1],
        ['signature-6',   'Signature Box of 6',     'Six signature cookies in a kraft box. Serious business.',      6500, 'assets/img/props/cookie_tray@4x.png',      2],
        ['signature-12',  'Signature Dozen',        'Twelve signature cookies. For sharing, allegedly.',          12000, 'assets/img/props/cookie_bitten@4x.png',    3],
        ['milk-box',      'Milk & Cookies Box',     'Six warm cookies and a bottle of cold milk. The full ritual.', 8500, 'assets/img/props/milk_glass@4x.png',       4],
        ['midnight-6',    'Midnight Batch',         'Six cookies baked fresh for the 10 pm – 1 am run.',            7500, 'assets/img/props/star@4x.png',             5],
        ['nutella-jar',   'Extra Nutella Jar',      'A small jar for dunking. No judgement.',                       1500, 'assets/img/props/nutella_jar@4x.png',      6],
    ];
    $st = $pdo->prepare('INSERT INTO products (sku, name, description, price_fils, image, sort, active) VALUES (?, ?, ?, ?, ?, ?, 1)');
    foreach ($rows as $r) {
        $st->execute($r);
    }
}

/** Active catalogue, in menu order. */
function products(): array
{
    return db()->query('SELECT sku, name, description, price_fils, image FROM products WHERE active = 1 ORDER BY sort, id')->fetchAll();
}
