<?php
if (isPost()) {
    Csrf::verify();
    if ($action === 'delete') {
        Database::delete('subscribers', 'id = ?', [$id]);
        flash('Subscriber removed.');
    }
    redirect('/admin/?page=subscribers');
}

// CSV export for use in any mailing tool.
if ($action === 'export') {
    $rows = Database::all('SELECT email, created_at FROM subscribers WHERE is_active = 1 ORDER BY id DESC');
    header('Content-Type: text/csv; charset=UTF-8');
    header('Content-Disposition: attachment; filename="subscribers-' . date('Y-m-d') . '.csv"');
    $out = fopen('php://output', 'w');
    fputcsv($out, ['Email', 'Subscribed on']);
    foreach ($rows as $r) {
        fputcsv($out, [$r['email'], $r['created_at']]);
    }
    fclose($out);
    exit;
}

$rows = Database::all('SELECT * FROM subscribers ORDER BY id DESC LIMIT 500');
adminView('subscribers', ['pageTitle' => 'Subscribers', 'rows' => $rows]);
