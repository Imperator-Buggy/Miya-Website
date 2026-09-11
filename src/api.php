<?php
/** Shared helpers for the JSON endpoints in /api. */
declare(strict_types=1);

require_once dirname(__DIR__) . '/config.php';
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/orders.php';
require_once __DIR__ . '/stripe.php';
require_once __DIR__ . '/ziina.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

function json_out(array $data, int $status = 200): never
{
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function json_in(): array
{
    $raw = file_get_contents('php://input') ?: '';
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

/** Base URL for redirects: APP_URL if set, otherwise derived from the request. */
function base_url(): string
{
    if (SITE_URL !== '') return SITE_URL;
    $https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https';
    $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
    $dir = rtrim(dirname(dirname($_SERVER['SCRIPT_NAME'] ?? '/')), '/');
    return ($https ? 'https' : 'http') . '://' . $host . $dir;
}

/** Make sure the schema exists on first request (cheap after the first run). */
function ensure_schema(): void
{
    try {
        db()->query('SELECT 1 FROM products LIMIT 1');
    } catch (Throwable) {
        migrate();
    }
}
