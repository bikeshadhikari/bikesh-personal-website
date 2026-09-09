<?php
/**
 * Development router for PHP's built-in server. It reproduces what .htaccess
 * does on Apache, so `php -S localhost:8000 router.php` behaves like production.
 * Not used by any real web server.
 */
if (PHP_SAPI !== 'cli-server') {
    require __DIR__ . '/index.php';
    return;
}

$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?: '/';
$file = __DIR__ . $path;

// Serve real files (assets, uploads, install.php) untouched.
if ($path !== '/' && is_file($file)) {
    return false;
}
// Directories with their own front controller, such as /admin/.
if (is_dir($file) && is_file(rtrim($file, '/') . '/index.php')) {
    require rtrim($file, '/') . '/index.php';
    return true;
}

$_GET['route'] = ltrim($path, '/');
require __DIR__ . '/index.php';
