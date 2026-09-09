<?php
/** Switch pages and home-page sections on or off, rename them and reorder them. */
if (isPost()) {
    Csrf::verify();

    if (post('bulk') !== '') {
        foreach ((array) ($_POST['items'] ?? []) as $itemId => $values) {
            $itemId = (int) $itemId;
            $row = Database::first('SELECT * FROM menus WHERE id = ?', [$itemId]);
            if (!$row) {
                continue;
            }
            $update = [
                'label'      => mb_substr(trim((string) ($values['label'] ?? $row['label'])), 0, 80) ?: $row['label'],
                'sort_order' => (int) ($values['sort_order'] ?? $row['sort_order']),
                'custom_url' => mb_substr(trim((string) ($values['custom_url'] ?? '')), 0, 255),
                'in_nav'     => !empty($values['in_nav']) ? 1 : 0,
            ];
            // The home page must always stay reachable.
            $update['enabled'] = (int) $row['locked'] === 1 ? 1 : (!empty($values['enabled']) ? 1 : 0);
            Database::update('menus', $update, 'id = :where_id', ['where_id' => $itemId]);
        }
        Menu::all(true);
        App::bumpAssetVersion();
        flash('Menus and sections updated. The website reflects this immediately.');
        redirect('/admin/?page=menus');
    }

    if ($action === 'toggle') {
        Menu::toggle($id, post('to') === '1');
        App::bumpAssetVersion();
        flash('Visibility updated.');
        redirect('/admin/?page=menus');
    }
}

$pages    = Database::all("SELECT * FROM menus WHERE kind = 'page' ORDER BY sort_order, id");
$sections = Database::all("SELECT * FROM menus WHERE kind = 'section' ORDER BY sort_order, id");

adminView('menus', ['pageTitle' => 'Menus & sections', 'pages' => $pages, 'sections' => $sections]);
