<?php
/** List / create / edit / delete for anything defined in Resource::all(). */
$def  = $resources[$page];
$name = $page;

switch ($action) {
    case 'create':
    case 'edit':
        $record = $action === 'edit' ? Crud::find($def, $id) : Crud::blank($def);
        if (!$record) {
            flash('That ' . strtolower($def['singular']) . ' no longer exists.', 'error');
            redirect('/admin/?page=' . $name);
        }
        $errors = [];

        if (isPost()) {
            Csrf::verify();
            $result = Crud::save($def, $action === 'edit' ? $id : 0);
            if ($result['ok']) {
                App::bumpAssetVersion();
                flash($def['singular'] . ' saved.');
                redirect(post('save_and_close') !== ''
                    ? '/admin/?page=' . $name
                    : '/admin/?page=' . $name . '&action=edit&id=' . $result['id']);
            }
            $errors = $result['errors'];
            $record = $result['values'];
            $record['id'] = $id;
        }

        adminView('form', [
            'pageTitle' => ($action === 'edit' ? 'Edit ' : 'New ') . strtolower($def['singular']),
            'def' => $def, 'resource' => $name, 'record' => $record, 'errors' => $errors, 'isEdit' => $action === 'edit',
        ]);
        break;

    case 'delete':
        Csrf::verify();
        flash(Crud::delete($def, $id) ? $def['singular'] . ' deleted.' : 'Nothing was deleted.', 'success');
        redirect('/admin/?page=' . $name);

    case 'toggle':
        Csrf::verify();
        Crud::toggle($def, $id, (string) post('column', $def['toggle'] ?? 'enabled'));
        App::bumpAssetVersion();
        flash('Visibility updated.');
        redirect('/admin/?page=' . $name . '&search=' . rawurlencode((string) post('search', '')));

    case 'index':
    default:
        $search = (string) query('search', '');
        $data   = Crud::index($def, $search, max(1, (int) query('p', 1)));
        adminView('list', [
            'pageTitle' => $def['label'],
            'def' => $def, 'resource' => $name, 'data' => $data, 'search' => $search,
        ]);
}
