<?php
/** Escape for HTML output. */
function e(?string $value): string
{
    return htmlspecialchars((string) $value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

/** Build a site URL from a path. */
function url(string $path = ''): string
{
    $base = rtrim(App::config('base_url'), '/');
    $path = '/' . ltrim($path, '/');
    return $base . ($path === '/' ? '/' : $path);
}

/** URL for a file inside /assets or /uploads. */
function asset(string $path): string
{
    return url($path) . (str_contains($path, '?') ? '' : '?v=' . App::assetVersion());
}

/** Resolve a stored upload path to a public URL, with a fallback. */
function media(?string $path, string $fallback = ''): string
{
    $path = trim((string) $path);
    if ($path === '') {
        return $fallback === '' ? '' : url($fallback);
    }
    if (preg_match('#^https?://#i', $path)) {
        return $path;
    }
    return url($path);
}

function redirect(string $path): never
{
    header('Location: ' . (preg_match('#^https?://#i', $path) ? $path : url($path)));
    exit;
}

/** Turn any string into a URL-safe slug (keeps Devanagari out of URLs). */
function slugify(string $text, string $fallbackPrefix = 'item'): string
{
    $text = trim($text);
    if (function_exists('iconv')) {
        $converted = @iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $text);
        if ($converted !== false) {
            $text = $converted;
        }
    }
    $text = strtolower(preg_replace('/[^a-zA-Z0-9]+/', '-', $text) ?? '');
    $text = trim($text, '-');
    return $text === '' ? $fallbackPrefix . '-' . substr(bin2hex(random_bytes(4)), 0, 6) : $text;
}

/** Make a slug unique inside a table. */
function uniqueSlug(string $table, string $slug, ?int $ignoreId = null): string
{
    $base = $slug;
    $i    = 1;
    while (true) {
        $sql    = 'SELECT COUNT(*) FROM ' . Database::q($table) . ' WHERE slug = ?';
        $params = [$slug];
        if ($ignoreId !== null) {
            $sql .= ' AND id <> ?';
            $params[] = $ignoreId;
        }
        if ((int) Database::value($sql, $params, 0) === 0) {
            return $slug;
        }
        $slug = $base . '-' . (++$i);
    }
}

function excerptOf(string $html, int $words = 32): string
{
    $text = trim(preg_replace('/\s+/', ' ', strip_tags($html)) ?? '');
    $parts = explode(' ', $text);
    if (count($parts) <= $words) {
        return $text;
    }
    return implode(' ', array_slice($parts, 0, $words)) . '…';
}

function readingTime(string $html): int
{
    $count = str_word_count(strip_tags($html));
    return max(1, (int) ceil($count / 200));
}

function formatDate(?string $date, string $format = 'M j, Y'): string
{
    if (!$date) {
        return '';
    }
    $ts = strtotime($date);
    return $ts ? date($format, $ts) : '';
}

/** "Jan 2021 — Present" style range used by the experience pipeline. */
function dateRange(?string $start, ?string $end, bool $current = false): string
{
    $from = $start ? formatDate($start, 'M Y') : '';
    $to   = $current ? 'Present' : ($end ? formatDate($end, 'M Y') : '');
    if ($from && $to) {
        return $from . ' — ' . $to;
    }
    return $from ?: $to;
}

/** Human duration between two dates, e.g. "2 yrs 3 mos". */
function durationBetween(?string $start, ?string $end, bool $current = false): string
{
    if (!$start) {
        return '';
    }
    try {
        $from = new DateTimeImmutable($start);
        $to   = $current || !$end ? new DateTimeImmutable('today') : new DateTimeImmutable($end);
    } catch (Throwable $e) {
        return '';
    }
    if ($to < $from) {
        return '';
    }
    $diff   = $from->diff($to);
    $months = $diff->y * 12 + $diff->m + 1;
    $years  = intdiv($months, 12);
    $rest   = $months % 12;
    $parts  = [];
    if ($years) {
        $parts[] = $years . ' yr' . ($years > 1 ? 's' : '');
    }
    if ($rest) {
        $parts[] = $rest . ' mo' . ($rest > 1 ? 's' : '');
    }
    return implode(' ', $parts);
}

/** Split a textarea of one-per-line values into a clean array. */
function lines(?string $text): array
{
    if (!$text) {
        return [];
    }
    $out = array_map('trim', preg_split('/\r\n|\r|\n/', $text) ?: []);
    return array_values(array_filter($out, static fn($l) => $l !== ''));
}

/** Split a comma separated list into a clean array. */
function csvList(?string $text): array
{
    if (!$text) {
        return [];
    }
    $out = array_map('trim', explode(',', $text));
    return array_values(array_filter($out, static fn($l) => $l !== ''));
}

function flash(string $message = null, string $type = 'success')
{
    if ($message === null) {
        $f = $_SESSION['flash'] ?? null;
        unset($_SESSION['flash']);
        return $f;
    }
    $_SESSION['flash'] = ['message' => $message, 'type' => $type];
    return null;
}

function old(string $key, $default = '')
{
    return $_SESSION['old'][$key] ?? $default;
}

function keepOld(array $data): void
{
    $_SESSION['old'] = $data;
}

function clearOld(): void
{
    unset($_SESSION['old']);
}

function post(string $key, $default = '')
{
    $value = $_POST[$key] ?? $default;
    return is_string($value) ? trim($value) : $value;
}

function postInt(string $key, int $default = 0): int
{
    return (int) ($_POST[$key] ?? $default);
}

function postBool(string $key): int
{
    return !empty($_POST[$key]) ? 1 : 0;
}

function query(string $key, $default = '')
{
    $value = $_GET[$key] ?? $default;
    return is_string($value) ? trim($value) : $value;
}

/** Very small, safe subset renderer for post bodies stored as HTML. */
function safeHtml(string $html): string
{
    $allowed = '<p><br><b><strong><i><em><u><s><ul><ol><li><a><h2><h3><h4><h5><blockquote>'
             . '<pre><code><img><hr><table><thead><tbody><tr><th><td><figure><figcaption><span><div>';
    $clean = strip_tags($html, $allowed);
    // Drop inline event handlers and javascript: URLs.
    $clean = preg_replace('/\son[a-z]+\s*=\s*("[^"]*"|\'[^\']*\'|[^\s>]+)/i', '', $clean) ?? $clean;
    $clean = preg_replace('/(href|src)\s*=\s*("|\')\s*javascript:[^"\']*(\2)/i', '$1="#"', $clean) ?? $clean;
    return $clean;
}

function isPost(): bool
{
    return ($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'POST';
}

function clientIp(): string
{
    return substr((string) ($_SERVER['REMOTE_ADDR'] ?? ''), 0, 45);
}
