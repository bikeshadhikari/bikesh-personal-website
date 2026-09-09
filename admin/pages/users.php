<?php
Auth::requireAdmin();

$errors = [];
$record = ['id' => 0, 'name' => '', 'email' => '', 'role' => 'editor', 'is_active' => 1];

if (isPost()) {
    Csrf::verify();

    if ($action === 'delete') {
        if ($id === Auth::id()) {
            flash('You cannot delete the account you are signed in with.', 'error');
        } elseif ((int) Database::value("SELECT COUNT(*) FROM users WHERE role = 'admin' AND id <> ?", [$id], 0) === 0) {
            flash('There must always be at least one administrator.', 'error');
        } else {
            Database::run('UPDATE posts SET author_id = NULL WHERE author_id = ?', [$id]);
            Database::delete('users', 'id = ?', [$id]);
            flash('User deleted.');
        }
        redirect('/admin/?page=users');
    }

    $name     = post('name');
    $email    = strtolower(post('email'));
    $role     = in_array(post('role'), ['admin', 'editor'], true) ? post('role') : 'editor';
    $active   = postBool('is_active');
    $password = (string) ($_POST['password'] ?? '');
    $editing  = $action === 'edit' && $id > 0;

    if ($name === '') {
        $errors['name'] = 'A name is required.';
    }
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $errors['email'] = 'Enter a valid email address.';
    } else {
        $clash = (int) Database::value(
            'SELECT COUNT(*) FROM users WHERE email = ?' . ($editing ? ' AND id <> ?' : ''),
            $editing ? [$email, $id] : [$email], 0
        );
        if ($clash > 0) {
            $errors['email'] = 'Another account already uses that email.';
        }
    }
    if (!$editing && strlen($password) < 10) {
        $errors['password'] = 'Use at least 10 characters.';
    }
    if ($editing && $password !== '' && strlen($password) < 10) {
        $errors['password'] = 'Use at least 10 characters, or leave it empty to keep the current one.';
    }
    // Never let the last administrator demote or deactivate themselves.
    if ($editing && $id === Auth::id() && ($role !== 'admin' || !$active)) {
        $others = (int) Database::value("SELECT COUNT(*) FROM users WHERE role = 'admin' AND is_active = 1 AND id <> ?", [$id], 0);
        if ($others === 0) {
            $errors['role'] = 'You are the only active administrator, so this account must stay an active admin.';
        }
    }

    if (!$errors) {
        $data = ['name' => $name, 'email' => $email, 'role' => $role, 'is_active' => $active];
        if ($password !== '') {
            $data['password_hash'] = password_hash($password, PASSWORD_DEFAULT);
        }
        if ($editing) {
            Database::update('users', $data, 'id = :where_id', ['where_id' => $id]);
            flash('User updated.');
        } else {
            $data['created_at'] = date('Y-m-d H:i:s');
            $data['avatar'] = '';
            Database::insert('users', $data);
            flash('User created.');
        }
        redirect('/admin/?page=users');
    }

    $record = ['id' => $id, 'name' => $name, 'email' => $email, 'role' => $role, 'is_active' => $active];
}

if ($action === 'edit' && !isPost()) {
    $found = Database::first('SELECT * FROM users WHERE id = ?', [$id]);
    if (!$found) {
        flash('That user no longer exists.', 'error');
        redirect('/admin/?page=users');
    }
    $record = $found;
}

$users = Database::all('SELECT * FROM users ORDER BY id ASC');
adminView('users', [
    'pageTitle' => 'Users',
    'users' => $users, 'record' => $record, 'errors' => $errors,
    'formAction' => $action === 'edit' ? 'edit' : 'create', 'editId' => $id,
]);
