<?php
$q      = mb_substr((string) query('q', ''), 0, 120);
$result = ['items' => [], 'total' => 0, 'pages' => 0, 'page' => 1];

if ($q !== '' && Menu::enabled('blog')) {
    $result = Content::posts([
        'search'   => $q,
        'page'     => max(1, (int) query('page', 1)),
        'per_page' => max(1, (int) Settings::get('posts_per_page', 6)),
    ]);
}

View::render('pages/blog', [
    'title'       => 'Search — ' . Settings::get('site_name'),
    'description' => 'Search results.',
    'result'      => $result,
    'heading'     => $q === '' ? 'Search' : 'Results for “' . $q . '”',
    'intro'       => $result['total'] . ' ' . ($result['total'] === 1 ? 'article' : 'articles') . ' found.',
    'categories'  => Content::categories(),
    'tags'        => Content::tags(),
    'activeCat'   => '',
    'searchTerm'  => $q,
    'baseUrl'     => url('/search?q=' . rawurlencode($q)),
]);
