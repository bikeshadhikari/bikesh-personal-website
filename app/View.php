<?php
/** Template rendering with a shared layout. */
class View
{
    private static array $shared = [];

    public static function share(string $key, $value): void
    {
        self::$shared[$key] = $value;
    }

    public static function render(string $template, array $data = [], string $layout = 'layout/main'): void
    {
        $data = array_merge(self::$shared, $data);
        $content = self::capture($template, $data);
        if ($layout === '') {
            echo $content;
            return;
        }
        $data['content'] = $content;
        echo self::capture($layout, $data);
    }

    public static function partial(string $template, array $data = []): void
    {
        echo self::capture($template, array_merge(self::$shared, $data));
    }

    public static function capture(string $template, array $data = []): string
    {
        $file = App::root() . '/views/' . ltrim($template, '/') . '.php';
        if (!is_file($file)) {
            throw new RuntimeException('View not found: ' . $template);
        }
        extract($data, EXTR_SKIP);
        ob_start();
        include $file;
        return (string) ob_get_clean();
    }

    /** Page <title> and meta values with sensible fallbacks. */
    public static function meta(array $data): array
    {
        return [
            'title'       => $data['title'] ?? Settings::get('meta_title', Settings::get('site_name', 'Portfolio')),
            'description' => $data['description'] ?? Settings::get('meta_description', ''),
            'image'       => $data['image'] ?? Settings::get('og_image', ''),
            'canonical'   => $data['canonical'] ?? null,
            'type'        => $data['type'] ?? 'website',
        ];
    }
}
