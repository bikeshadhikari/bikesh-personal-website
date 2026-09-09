<?php
/**
 * Navigation pages and home-page sections.
 *
 * A row with kind='page' is a routable URL that also shows in the navbar.
 * A row with kind='section' is a block on the home page.
 * Disabling a row hides it from the navbar AND makes its route 404, so the
 * switch in the dashboard is the single source of truth for the front end.
 */
class Menu
{
    private static ?array $all = null;

    public static function all(bool $force = false): array
    {
        if (self::$all !== null && !$force) {
            return self::$all;
        }
        self::$all = [];
        try {
            foreach (Database::all('SELECT * FROM menus ORDER BY sort_order ASC, id ASC') as $row) {
                self::$all[$row['slug']] = $row;
            }
        } catch (Throwable $e) {
            self::$all = [];
        }
        return self::$all;
    }

    public static function find(string $slug): ?array
    {
        return self::all()[$slug] ?? null;
    }

    /** Is this page or section switched on? Unknown slugs default to visible. */
    public static function enabled(string $slug): bool
    {
        $item = self::find($slug);
        return $item === null ? true : (int) $item['enabled'] === 1;
    }

    public static function label(string $slug, string $default = ''): string
    {
        $item = self::find($slug);
        return $item && trim((string) $item['label']) !== '' ? $item['label'] : $default;
    }

    /** Enabled navbar entries, in order. */
    public static function nav(): array
    {
        return array_values(array_filter(self::all(), static function ($m) {
            return $m['kind'] === 'page' && (int) $m['enabled'] === 1 && (int) $m['in_nav'] === 1;
        }));
    }

    /** Enabled home-page sections, in order. */
    public static function sections(): array
    {
        return array_values(array_filter(self::all(), static function ($m) {
            return $m['kind'] === 'section' && (int) $m['enabled'] === 1;
        }));
    }

    public static function pageUrl(array $item): string
    {
        if (trim((string) $item['custom_url']) !== '') {
            return $item['custom_url'];
        }
        return $item['slug'] === 'home' ? url('/') : url('/' . $item['slug']);
    }

    public static function toggle(int $id, bool $enabled): void
    {
        Database::run('UPDATE menus SET enabled = ? WHERE id = ? AND locked = 0', [$enabled ? 1 : 0, $id]);
        self::all(true);
    }
}
