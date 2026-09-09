<?php
header('Content-Type: application/rss+xml; charset=UTF-8');
$posts = Content::posts(['per_page' => 20])['items'];
$site  = Settings::get('site_name', 'Blog');

echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
echo '<rss version="2.0"><channel>' . "\n";
echo '<title>' . e($site . ' — ' . Settings::get('blog_title', 'Blog')) . "</title>\n";
echo '<link>' . e(url('/blog')) . "</link>\n";
echo '<description>' . e(Settings::get('blog_intro', '')) . "</description>\n";
echo '<language>en</language>' . "\n";
foreach ($posts as $p) {
    echo "<item>\n";
    echo '<title>' . e($p['title']) . "</title>\n";
    echo '<link>' . e(url('/blog/' . $p['slug'])) . "</link>\n";
    echo '<guid isPermaLink="true">' . e(url('/blog/' . $p['slug'])) . "</guid>\n";
    echo '<pubDate>' . date(DATE_RSS, strtotime($p['published_at'] ?: 'now')) . "</pubDate>\n";
    echo '<description><![CDATA[' . ($p['excerpt'] ?: excerptOf((string) $p['content'])) . "]]></description>\n";
    echo "</item>\n";
}
echo '</channel></rss>';
