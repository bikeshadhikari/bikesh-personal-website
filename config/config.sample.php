<?php
/**
 * Copy this file to config/config.php and fill in your own values.
 * config/config.php is git-ignored so your credentials never reach the repo.
 */

return [
    // 'mysql' on Hostinger / cPanel. Use 'sqlite' only for local development:
    // it puts your whole database in a single file, and while /database is blocked
    // by two .htaccess rules, a live site should use MySQL.
    'db' => [
        'driver'   => 'mysql',
        'host'     => 'localhost',
        'port'     => 3306,
        'database' => 'u000000000_bikesh',
        'username' => 'u000000000_bikesh',
        'password' => 'change-me',
        'charset'  => 'utf8mb4',
        // Only used when driver is sqlite.
        'sqlite_path' => __DIR__ . '/../database/site.sqlite',
    ],

    // Absolute public URL, no trailing slash. Leave '' to auto-detect.
    'base_url' => '',

    // Sub-directory the site lives in, e.g. '/portfolio'. Leave '' for domain root.
    'base_path' => '',

    // Set false on production so visitors never see stack traces.
    'debug' => false,

    // Outgoing mail. 'mail' uses PHP mail(); 'none' stores messages in the
    // dashboard only (recommended default - Hostinger throttles mail()).
    'mail' => [
        'transport' => 'none',
        'to'        => 'hello@bikeshadhikari.com.np',
        'from'      => 'no-reply@bikeshadhikari.com.np',
        'from_name' => 'Bikesh Adhikari Website',
    ],

    // Change this to any long random string before going live.
    'app_key' => 'change-this-to-a-long-random-string',

    'timezone' => 'Asia/Kathmandu',
];
