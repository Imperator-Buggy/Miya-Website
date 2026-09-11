<?php
/**
 * Create the database schema and seed the menu.
 *
 *     php tools/migrate.php
 *
 * Uses DB_DSN from .env (defaults to a local SQLite file in data/).
 */
declare(strict_types=1);
require dirname(__DIR__) . '/config.php';
require dirname(__DIR__) . '/src/db.php';

migrate();
$driver = db_driver();
$count = (int) db()->query('SELECT COUNT(*) FROM products')->fetchColumn();
echo "Database ready ($driver). Products: $count\n";
