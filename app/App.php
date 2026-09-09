<?php
/** Application bootstrap: config, session, database, settings cache. */
class App
{
    private static array $config = [];
    private static bool $booted = false;

    public static function boot(array $config): void
    {
        if (self::$booted) {
            return;
        }
        self::$config = $config;

        date_default_timezone_set($config['timezone'] ?? 'Asia/Kathmandu');

        if (!empty($config['debug'])) {
            ini_set('display_errors', '1');
            error_reporting(E_ALL);
        } else {
            ini_set('display_errors', '0');
        }

        if (self::$config['base_url'] === '') {
            self::$config['base_url'] = self::detectBaseUrl();
        }

        self::startSession();
        Database::connect($config['db']);
        self::$booted = true;
    }

    private static function detectBaseUrl(): string
    {
        $https  = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
               || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');
        $scheme = $https ? 'https' : 'http';
        $host   = $_SERVER['HTTP_HOST'] ?? 'localhost';
        $path   = rtrim(self::$config['base_path'] ?? '', '/');
        return $scheme . '://' . $host . $path;
    }

    public static function startSession(): void
    {
        if (session_status() === PHP_SESSION_ACTIVE) {
            return;
        }
        $https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
              || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');
        session_set_cookie_params([
            'lifetime' => 0,
            'path'     => '/',
            'secure'   => $https,
            'httponly' => true,
            'samesite' => 'Lax',
        ]);
        session_name('bkshsess');
        session_start();
    }

    public static function config(string $key, $default = null)
    {
        $parts = explode('.', $key);
        $value = self::$config;
        foreach ($parts as $part) {
            if (!is_array($value) || !array_key_exists($part, $value)) {
                return $default;
            }
            $value = $value[$part];
        }
        return $value;
    }

    public static function root(): string
    {
        return dirname(__DIR__);
    }

    public static function assetVersion(): string
    {
        return (string) Settings::get('asset_version', '1');
    }

    public static function bumpAssetVersion(): void
    {
        Settings::set('asset_version', (string) time());
    }

    public static function isInstalled(): bool
    {
        return Database::tableExists('settings') && Database::tableExists('users');
    }
}
