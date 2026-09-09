<?php
/** @var string|null $slug */
if ($slug !== null && $slug !== '') {
    $project = Content::project($slug);
    if (!$project) {
        notFound('That project is not published.');
    }
    View::render('pages/project', [
        'title'       => $project['title'] . ' — ' . Settings::get('site_name'),
        'description' => excerptOf((string) $project['summary'], 30),
        'image'       => $project['image'],
        'project'     => $project,
        'more'        => array_slice(array_filter(Content::projects(), static fn($p) => $p['id'] !== $project['id']), 0, 3),
    ]);
    return;
}

$category = query('category', '');
$projects = Content::projects();
if ($category !== '') {
    $projects = array_values(array_filter($projects, static fn($p) => $p['category'] === $category));
}

View::render('pages/projects', [
    'title'       => 'Projects — ' . Settings::get('site_name'),
    'description' => 'Selected web systems, portals and programmes delivered by ' . Settings::get('full_name') . '.',
    'projects'    => $projects,
    'categories'  => Content::projectCategories(),
    'active'      => $category,
]);
