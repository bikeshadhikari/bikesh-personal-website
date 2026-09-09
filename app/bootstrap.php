<?php
declare(strict_types=1);

define('APP_START', microtime(true));

$root = dirname(__DIR__);

require $root . '/app/Database.php';
require $root . '/app/App.php';
require $root . '/app/helpers.php';
require $root . '/app/Settings.php';
require $root . '/app/Menu.php';
require $root . '/app/Csrf.php';
require $root . '/app/Auth.php';
require $root . '/app/Upload.php';
require $root . '/app/Content.php';
require $root . '/app/Mailer.php';
require $root . '/app/View.php';
require $root . '/views/partials/icons.php';
require $root . '/database/Schema.php';
require $root . '/database/Seeder.php';

if (!is_file($root . '/config/config.php')) {
    http_response_code(500);
    exit('Missing config/config.php. Copy config/config.sample.php to config/config.php and add your database details.');
}

$config = require $root . '/config/config.php';

try {
    App::boot($config);
} catch (Throwable $e) {
    http_response_code(500);
    if (!empty($config['debug'])) {
        exit('Database error: ' . $e->getMessage());
    }
    exit('The site cannot reach its database right now. Check config/config.php.');
}
