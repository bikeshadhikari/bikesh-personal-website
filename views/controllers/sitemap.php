<?php
header('Content-Type: application/xml; charset=UTF-8');
$urls = [['loc' => url('/'), 'priority' => '1.0', 'lastmod' => date('Y-m-d')]];

foreach (Menu::nav() as $item) {
    if ($item['slug'] === 'home') {
        continue;
    }
    $urls[] = ['loc' => Menu::pageUrl($item), 'priority' => '0.8', 'lastmod' => date('Y-m-d')];
}
if (Menu::enabled('projects')) {
    foreach (Content::projects() as $p) {
        $urls[] = ['loc' => url('/projects/' . $p['slug']), 'priority' => '0.6', 'lastmod' => date('Y-m-d')];
    }
}
if (Menu::enabled('blog')) {
    foreach (Content::posts(['per_page' => 500])['items'] as $p) {
        $urls[] = [
            'loc'      => url('/blog/' . $p['slug']),
            'priority' => '0.7',
            'lastmod'  => formatDate($p['updated_at'] ?: $p['published_at'], 'Y-m-d') ?: date('Y-m-d'),
        ];
    }
    foreach (Content::categories() as $c) {
        $urls[] = ['loc' => url('/blog/category/' . $c['slug']), 'priority' => '0.4', 'lastmod' => date('Y-m-d')];
    }
}

echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";
foreach ($urls as $u) {
    echo "  <url>\n";
    echo '    <loc>' . e($u['loc']) . "</loc>\n";
    echo '    <lastmod>' . e($u['lastmod']) . "</lastmod>\n";
    echo '    <priority>' . e($u['priority']) . "</priority>\n";
    echo "  </url>\n";
}
echo '</urlset>';
