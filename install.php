<?php
/**
 * One-time installer. Creates the tables, seeds the starting content and makes
 * the first administrator. Delete this file once the site is live.
 */
require __DIR__ . '/app/bootstrap.php';

$step   = query('step', '1');
$errors = [];
$done   = false;

// Already installed and an account exists? Nothing to do here.
$alreadyInstalled = App::isInstalled()
    && (int) Database::value('SELECT COUNT(*) FROM users', [], 0) > 0;

if (isPost()) {
    Csrf::verify();
    $name     = post('name');
    $email    = strtolower(post('email'));
    $password = (string) ($_POST['password'] ?? '');
    $confirm  = (string) ($_POST['password_confirm'] ?? '');

    if ($alreadyInstalled) {
        $errors[] = 'This site is already installed. Delete install.php and sign in at /admin/.';
    }
    if ($name === '') {
        $errors['name'] = 'Enter the name that will appear as the author.';
    }
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $errors['email'] = 'Enter a valid email address — this is your login.';
    }
    if (strlen($password) < 10) {
        $errors['password'] = 'Use at least 10 characters.';
    }
    if ($password !== $confirm) {
        $errors['password_confirm'] = 'The two passwords do not match.';
    }

    if (!$errors) {
        try {
            Schema::install(Database::pdo());
            Database::insert('users', [
                'name'          => $name,
                'email'         => $email,
                'password_hash' => password_hash($password, PASSWORD_DEFAULT),
                'role'          => 'admin',
                'avatar'        => '',
                'is_active'     => 1,
                'created_at'    => date('Y-m-d H:i:s'),
            ]);
            Seeder::run();
            Settings::set('full_name', $name, 'profile');
            Settings::set('contact_email', $email, 'contact');
            $done = true;
        } catch (Throwable $e) {
            $errors[] = 'Installation failed: ' . $e->getMessage();
        }
    }
}

$checks = [
    'PHP 8.0 or newer'          => version_compare(PHP_VERSION, '8.0.0', '>='),
    'PDO database driver'       => extension_loaded('pdo_mysql') || extension_loaded('pdo_sqlite'),
    'mbstring extension'        => extension_loaded('mbstring'),
    'uploads/ folder writable'  => is_writable(__DIR__ . '/uploads'),
    'config/config.php present' => is_file(__DIR__ . '/config/config.php'),
];
$allPassed = !in_array(false, $checks, true);
?>
<!doctype html>
<html lang="en" data-theme="light">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Install — <?= e(App::config('db.database', 'Website')) ?></title>
<meta name="robots" content="noindex, nofollow">
<link rel="icon" href="assets/img/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="assets/css/site.css">
<link rel="stylesheet" href="assets/css/admin.css">
</head>
<body class="auth-body">
<main class="auth-card install-card">
  <span class="brand-mark" aria-hidden="true">B</span>
  <h1>Set up your website</h1>

  <?php if ($done): ?>
    <p class="alert alert-success">Everything is ready. Your content, menus and starter blog posts have been created.</p>
    <ol class="install-next">
      <li><strong>Delete <code>install.php</code> from the server.</strong> It is the one file that must not stay.</li>
      <li>Sign in to the dashboard and change anything you like.</li>
    </ol>
    <div class="detail-actions">
      <a class="btn btn-primary" href="<?= e(url('/admin/')) ?>">Open the dashboard</a>
      <a class="btn btn-ghost" href="<?= e(url('/')) ?>">View the site</a>
    </div>

  <?php elseif ($alreadyInstalled): ?>
    <p class="alert alert-error">This site is already installed. Delete <code>install.php</code> and sign in instead.</p>
    <a class="btn btn-primary" href="<?= e(url('/admin/')) ?>">Go to the dashboard</a>

  <?php else: ?>
    <p class="auth-sub">Two minutes. This creates the database tables, adds the starting content and makes your admin account.</p>

    <ul class="check-list">
      <?php foreach ($checks as $label => $ok): ?>
        <li class="<?= $ok ? 'is-ok' : 'is-bad' ?>"><span aria-hidden="true"><?= $ok ? '✓' : '✕' ?></span><?= e($label) ?></li>
      <?php endforeach; ?>
    </ul>

    <?php if (!$allPassed): ?>
      <p class="alert alert-error">Fix the items marked above before continuing. For the uploads folder, set its permission to 755 in your file manager.</p>
    <?php endif; ?>

    <?php foreach ($errors as $k => $msg): if (is_int($k)): ?>
      <p class="alert alert-error"><?= e($msg) ?></p>
    <?php endif; endforeach; ?>

    <form method="post" novalidate>
      <?= Csrf::field() ?>
      <div class="field">
        <label for="i-name">Your full name</label>
        <input type="text" id="i-name" name="name" value="<?= e(post('name', 'Bikesh Adhikari')) ?>" required>
        <?php if (!empty($errors['name'])): ?><small class="field-error"><?= e($errors['name']) ?></small><?php endif; ?>
      </div>
      <div class="field">
        <label for="i-email">Email <small>(this is your login)</small></label>
        <input type="email" id="i-email" name="email" value="<?= e(post('email')) ?>" required>
        <?php if (!empty($errors['email'])): ?><small class="field-error"><?= e($errors['email']) ?></small><?php endif; ?>
      </div>
      <div class="field">
        <label for="i-pass">Password <small>(10 characters or more)</small></label>
        <input type="password" id="i-pass" name="password" required autocomplete="new-password">
        <?php if (!empty($errors['password'])): ?><small class="field-error"><?= e($errors['password']) ?></small><?php endif; ?>
      </div>
      <div class="field">
        <label for="i-pass2">Repeat the password</label>
        <input type="password" id="i-pass2" name="password_confirm" required autocomplete="new-password">
        <?php if (!empty($errors['password_confirm'])): ?><small class="field-error"><?= e($errors['password_confirm']) ?></small><?php endif; ?>
      </div>
      <button class="btn btn-primary" type="submit" <?= $allPassed ? '' : 'disabled' ?>>Install now</button>
    </form>
  <?php endif; ?>
</main>
</body>
</html>
