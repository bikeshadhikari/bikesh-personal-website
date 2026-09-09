<?php
$user   = Auth::user();
$errors = [];
$done   = '';

if (isPost()) {
    Csrf::verify();

    if (post('form') === 'details') {
        $name  = post('name');
        $email = strtolower(post('email'));
        if ($name === '') {
            $errors['name'] = 'A name is required.';
        }
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $errors['email'] = 'Enter a valid email address.';
        } elseif ((int) Database::value('SELECT COUNT(*) FROM users WHERE email = ? AND id <> ?', [$email, Auth::id()], 0) > 0) {
            $errors['email'] = 'Another account already uses that email.';
        }
        if (!$errors) {
            Database::update('users', ['name' => $name, 'email' => $email], 'id = :where_id', ['where_id' => Auth::id()]);
            $_SESSION['user_name'] = $name;
            flash('Your details were updated.');
            redirect('/admin/?page=account');
        }
    }

    if (post('form') === 'password') {
        $current = (string) ($_POST['current_password'] ?? '');
        $new     = (string) ($_POST['new_password'] ?? '');
        $confirm = (string) ($_POST['confirm_password'] ?? '');

        if (!password_verify($current, $user['password_hash'])) {
            $errors['current_password'] = 'That is not your current password.';
        }
        if (strlen($new) < 10) {
            $errors['new_password'] = 'Use at least 10 characters.';
        }
        if ($new !== $confirm) {
            $errors['confirm_password'] = 'The two new passwords do not match.';
        }
        if (!$errors) {
            Database::run('UPDATE users SET password_hash = ? WHERE id = ?', [password_hash($new, PASSWORD_DEFAULT), Auth::id()]);
            flash('Your password was changed.');
            redirect('/admin/?page=account');
        }
    }
}

adminView('account', ['pageTitle' => 'My account', 'user' => $user, 'errors' => $errors]);
