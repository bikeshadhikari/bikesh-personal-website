<?php
$stats = [
    ['label' => 'Published posts', 'value' => (int) Database::value("SELECT COUNT(*) FROM posts WHERE status = 'published'", [], 0), 'icon' => 'quote', 'link' => 'posts'],
    ['label' => 'Drafts',          'value' => (int) Database::value("SELECT COUNT(*) FROM posts WHERE status = 'draft'", [], 0), 'icon' => 'code', 'link' => 'posts'],
    ['label' => 'Unread messages', 'value' => (int) Database::value('SELECT COUNT(*) FROM messages WHERE is_read = 0', [], 0), 'icon' => 'mail', 'link' => 'messages'],
    ['label' => 'Comments waiting','value' => (int) Database::value("SELECT COUNT(*) FROM comments WHERE status = 'pending'", [], 0), 'icon' => 'users', 'link' => 'comments'],
    ['label' => 'Projects',        'value' => (int) Database::value('SELECT COUNT(*) FROM projects', [], 0), 'icon' => 'layers', 'link' => 'projects'],
    ['label' => 'Subscribers',     'value' => (int) Database::value('SELECT COUNT(*) FROM subscribers WHERE is_active = 1', [], 0), 'icon' => 'star', 'link' => 'subscribers'],
];

$recentPosts    = Database::all('SELECT id, title, status, published_at, views FROM posts ORDER BY id DESC LIMIT 5');
$recentMessages = Database::all('SELECT id, name, subject, created_at, is_read FROM messages ORDER BY id DESC LIMIT 5');
$popular        = Database::all("SELECT id, title, views FROM posts WHERE status = 'published' ORDER BY views DESC LIMIT 5");
$disabled       = Database::all('SELECT slug, label, kind FROM menus WHERE enabled = 0 ORDER BY sort_order');

adminView('dashboard', compact('stats', 'recentPosts', 'recentMessages', 'popular', 'disabled') + ['pageTitle' => 'Dashboard']);
