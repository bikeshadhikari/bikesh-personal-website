<?php
if (Auth::check()) {
    redirect('/admin/');
}

$error = '';
if (isPost()) {
    Csrf::verify();
    if (Auth::isLocked()) {
        $error = 'Too many failed attempts. Try again in ' . Auth::lockRemaining() . ' minutes.';
    } elseif (Auth::attempt(post('email'), (string) ($_POST['password'] ?? ''))) {
        $intended = $_SESSION['intended'] ?? '';
        unset($_SESSION['intended']);
        redirect($intended !== '' && str_contains($intended, '/admin') ? $intended : '/admin/');
    } else {
        $error = Auth::isLocked()
            ? 'Too many failed attempts. Try again in ' . Auth::lockRemaining() . ' minutes.'
            : 'That email and password combination did not work.';
    }
}
?>
<!doctype html>
<html lang="en" data-theme="light">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Sign in — <?= e(Settings::get('site_name', 'Dashboard')) ?></title>
<meta name="robots" content="noindex, nofollow">
<link rel="icon" href="<?= e(url('/assets/img/favicon.svg')) ?>" type="image/svg+xml">
<link rel="stylesheet" href="<?= e(asset('assets/css/admin.css')) ?>">
</head>
<body class="auth-body">
<main class="auth-card">
  <span class="brand-mark"><?= e(mb_substr(Settings::get('full_name', 'B'), 0, 1)) ?></span>
  <h1>Sign in</h1>
  <p class="auth-sub">The dashboard for <?= e(Settings::get('site_name', 'this website')) ?>.</p>

  <?php if ($error): ?><p class="alert alert-error"><?= e($error) ?></p><?php endif; ?>

  <form method="post" novalidate>
    <?= Csrf::field() ?>
    <div class="field">
      <label for="l-email">Email</label>
      <input type="email" id="l-email" name="email" value="<?= e(post('email')) ?>" required autofocus autocomplete="username">
    </div>
    <div class="field">
      <label for="l-pass">Password</label>
      <input type="password" id="l-pass" name="password" required autocomplete="current-password">
    </div>
    <button class="btn btn-primary btn-block" type="submit">Sign in</button>
  </form>

  <p class="auth-foot"><a href="<?= e(url('/')) ?>">← Back to the website</a></p>
</main>
</body>
</html>
