<?php
/**
 * Public front controller. Every visitor request lands here; .htaccess rewrites
 * clean URLs into ?route=. Falls back to PATH_INFO / REQUEST_URI parsing so the
 * site still works if mod_rewrite is unavailable.
 */
require __DIR__ . '/app/bootstrap.php';

if (!App::isInstalled()) {
    redirect('/install.php');
}

$route = trim((string) ($_GET['route'] ?? ''), '/');
if ($route === '') {
    $uri  = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?? '/';
    $base = rtrim((string) App::config('base_path', ''), '/');
    if ($base !== '' && str_starts_with($uri, $base)) {
        $uri = substr($uri, strlen($base));
    }
    $route = trim(rawurldecode($uri), '/');
    if (str_ends_with($route, 'index.php')) {
        $route = trim(substr($route, 0, -9), '/');
    }
}

$segments = $route === '' ? [] : explode('/', $route);
$first    = $segments[0] ?? '';

View::share('menuNav', Menu::nav());
View::share('socials', Settings::socials());
View::share('currentRoute', $first === '' ? 'home' : $first);

// A site-wide "we are working on it" switch, bypassed for logged-in admins.
if (Settings::bool('maintenance_mode') && !Auth::check() && $first !== 'admin') {
    http_response_code(503);
    View::render('pages/maintenance', ['title' => Settings::get('site_name') . ' — Coming back soon'], '');
    exit;
}

/** Refuse a page whose switch is off in Menus & Sections. */
function requirePage(string $slug): void
{
    if (!Menu::enabled($slug)) {
        notFound('That section is currently switched off.');
    }
}

function notFound(string $reason = 'The page you were looking for does not exist.'): never
{
    http_response_code(404);
    View::render('pages/404', ['title' => 'Page not found', 'reason' => $reason]);
    exit;
}

try {
    switch ($first) {
        case '':
        case 'home':
            require __DIR__ . '/views/controllers/home.php';
            break;

        case 'about':
            requirePage('about');
            require __DIR__ . '/views/controllers/about.php';
            break;

        case 'experience':
            requirePage('experience');
            require __DIR__ . '/views/controllers/experience.php';
            break;

        case 'services':
            requirePage('services');
            require __DIR__ . '/views/controllers/services.php';
            break;

        case 'projects':
            requirePage('projects');
            $slug = $segments[1] ?? null;
            require __DIR__ . '/views/controllers/projects.php';
            break;

        case 'blog':
            requirePage('blog');
            $slug = $segments[1] ?? null;
            $sub  = $segments[1] ?? '';
            require __DIR__ . '/views/controllers/blog.php';
            break;

        case 'contact':
            requirePage('contact');
            require __DIR__ . '/views/controllers/contact.php';
            break;

        case 'search':
            require __DIR__ . '/views/controllers/search.php';
            break;

        case 'subscribe':
            require __DIR__ . '/views/controllers/subscribe.php';
            break;

        case 'sitemap.xml':
            require __DIR__ . '/views/controllers/sitemap.php';
            break;

        case 'robots.txt':
            header('Content-Type: text/plain; charset=UTF-8');
            $allow = Settings::bool('search_indexing', true);
            echo "User-agent: *\n";
            echo $allow ? "Allow: /\nDisallow: /admin/\n" : "Disallow: /\n";
            echo "Sitemap: " . url('/sitemap.xml') . "\n";
            break;

        case 'feed':
        case 'rss.xml':
            requirePage('blog');
            require __DIR__ . '/views/controllers/feed.php';
            break;

        default:
            notFound();
    }
} catch (Throwable $e) {
    if (App::config('debug')) {
        throw $e;
    }
    error_log('[site] ' . $e->getMessage() . ' @ ' . $e->getFile() . ':' . $e->getLine());
    http_response_code(500);
    View::render('pages/500', ['title' => 'Something went wrong']);
}
