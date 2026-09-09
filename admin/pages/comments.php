<?php
if (isPost()) {
    Csrf::verify();
    if ($action === 'approve') {
        Database::run("UPDATE comments SET status = 'approved' WHERE id = ?", [$id]);
        flash('Comment published.');
    } elseif ($action === 'reject') {
        Database::run("UPDATE comments SET status = 'spam' WHERE id = ?", [$id]);
        flash('Comment marked as spam.');
    } elseif ($action === 'delete') {
        Database::delete('comments', 'id = ?', [$id]);
        flash('Comment deleted.');
    }
    redirect('/admin/?page=comments&filter=' . rawurlencode((string) post('filter', 'pending')));
}

$filter = (string) query('filter', 'pending');
$where  = in_array($filter, ['pending', 'approved', 'spam'], true) ? 'c.status = ?' : '1 = 1';
$params = $where === '1 = 1' ? [] : [$filter];

$rows = Database::all(
    'SELECT c.*, p.title AS post_title, p.slug AS post_slug
     FROM comments c LEFT JOIN posts p ON p.id = c.post_id
     WHERE ' . $where . ' ORDER BY c.id DESC LIMIT 100', $params
);
$counts = [
    'pending'  => (int) Database::value("SELECT COUNT(*) FROM comments WHERE status = 'pending'", [], 0),
    'approved' => (int) Database::value("SELECT COUNT(*) FROM comments WHERE status = 'approved'", [], 0),
    'spam'     => (int) Database::value("SELECT COUNT(*) FROM comments WHERE status = 'spam'", [], 0),
];

adminView('comments', ['pageTitle' => 'Comments', 'rows' => $rows, 'filter' => $filter, 'counts' => $counts]);
