<?php
/** Key/value site configuration, cached per request. */
class Settings
{
    private static ?array $cache = null;

    public static function load(bool $force = false): array
    {
        if (self::$cache !== null && !$force) {
            return self::$cache;
        }
        self::$cache = [];
        try {
            foreach (Database::all('SELECT skey, svalue FROM settings') as $row) {
                self::$cache[$row['skey']] = $row['svalue'];
            }
        } catch (Throwable $e) {
            self::$cache = [];
        }
        return self::$cache;
    }

    public static function get(string $key, $default = '')
    {
        $all = self::load();
        $value = $all[$key] ?? null;
        return ($value === null || $value === '') ? $default : $value;
    }

    public static function bool(string $key, bool $default = false): bool
    {
        $all = self::load();
        if (!array_key_exists($key, $all) || $all[$key] === '') {
            return $default;
        }
        return in_array(strtolower((string) $all[$key]), ['1', 'true', 'yes', 'on'], true);
    }

    public static function set(string $key, string $value, string $group = 'general'): void
    {
        $exists = Database::value('SELECT COUNT(*) FROM settings WHERE skey = ?', [$key], 0);
        if ((int) $exists > 0) {
            Database::run('UPDATE settings SET svalue = ? WHERE skey = ?', [$value, $key]);
        } else {
            Database::run('INSERT INTO settings (skey, svalue, sgroup) VALUES (?, ?, ?)', [$key, $value, $group]);
        }
        if (self::$cache !== null) {
            self::$cache[$key] = $value;
        }
    }

    public static function setMany(array $pairs, string $group = 'general'): void
    {
        foreach ($pairs as $key => $value) {
            self::set($key, (string) $value, $group);
        }
    }

    /** All settings belonging to one admin form group. */
    public static function group(string $group): array
    {
        $out = [];
        foreach (Database::all('SELECT skey, svalue FROM settings WHERE sgroup = ? ORDER BY skey', [$group]) as $row) {
            $out[$row['skey']] = $row['svalue'];
        }
        return $out;
    }

    /** Social links that actually have a value, ready for the templates. */
    public static function socials(): array
    {
        $map = [
            'linkedin'  => ['label' => 'LinkedIn',  'icon' => 'linkedin'],
            'facebook'  => ['label' => 'Facebook',  'icon' => 'facebook'],
            'instagram' => ['label' => 'Instagram', 'icon' => 'instagram'],
            'github'    => ['label' => 'GitHub',    'icon' => 'github'],
            'youtube'   => ['label' => 'YouTube',   'icon' => 'youtube'],
            'twitter'   => ['label' => 'X',         'icon' => 'twitter'],
            'tiktok'    => ['label' => 'TikTok',    'icon' => 'tiktok'],
        ];
        $out = [];
        foreach ($map as $key => $meta) {
            $value = trim((string) self::get('social_' . $key, ''));
            if ($value !== '') {
                $out[$key] = $meta + ['url' => $value];
            }
        }
        return $out;
    }
}
