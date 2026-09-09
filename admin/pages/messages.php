<?php
if (isPost()) {
    Csrf::verify();
    if ($action === 'delete') {
        Database::delete('messages', 'id = ?', [$id]);
        flash('Message deleted.');
    } elseif ($action === 'star') {
        Database::run('UPDATE messages SET is_starred = CASE WHEN is_starred = 1 THEN 0 ELSE 1 END WHERE id = ?', [$id]);
    } elseif ($action === 'unread') {
        Database::run('UPDATE messages SET is_read = 0 WHERE id = ?', [$id]);
        flash('Marked as unread.');
    } elseif ($action === 'read_all') {
        Database::run('UPDATE messages SET is_read = 1');
        flash('All messages marked as read.');
    }
    redirect('/admin/?page=messages');
}

if ($action === 'view') {
    $message = Database::first('SELECT * FROM messages WHERE id = ?', [$id]);
    if (!$message) {
        flash('That message no longer exists.', 'error');
        redirect('/admin/?page=messages');
    }
    Database::run('UPDATE messages SET is_read = 1 WHERE id = ?', [$id]);
    adminView('message', ['pageTitle' => 'Message from ' . $message['name'], 'message' => $message]);
    return;
}

$filter = (string) query('filter', 'all');
$where  = match ($filter) {
    'unread'  => 'is_read = 0',
    'starred' => 'is_starred = 1',
    default   => '1 = 1',
};
$page_  = max(1, (int) query('p', 1));
$per    = 20;
$total  = (int) Database::value('SELECT COUNT(*) FROM messages WHERE ' . $where, [], 0);
$rows   = Database::all('SELECT * FROM messages WHERE ' . $where . ' ORDER BY id DESC LIMIT ' . $per . ' OFFSET ' . (($page_ - 1) * $per));

adminView('messages', [
    'pageTitle' => 'Messages',
    'rows' => $rows, 'total' => $total, 'filter' => $filter,
    'pages' => (int) ceil($total / $per), 'page_' => $page_,
]);
