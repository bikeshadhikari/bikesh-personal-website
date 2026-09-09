<?php require_once App::root() . '/views/partials/icons.php'; ?>
<!doctype html>
<html lang="en" data-theme="light">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title><?= e($title ?? 'Back soon') ?></title>
<meta name="robots" content="noindex">
<link rel="icon" href="<?= e(url('/assets/img/favicon.svg')) ?>" type="image/svg+xml">
<link rel="stylesheet" href="<?= e(asset('assets/css/site.css')) ?>">
</head>
<body class="maintenance-body">
<main class="maintenance">
  <span class="brand-mark" aria-hidden="true"><?= e(mb_substr(Settings::get('full_name', 'B'), 0, 1)) ?></span>
  <h1><?= e(Settings::get('site_name', 'This site')) ?></h1>
  <p><?= e(Settings::get('maintenance_text', 'We will be back shortly.')) ?></p>
  <?php if (Settings::get('contact_email')): ?>
    <a class="btn btn-primary" href="mailto:<?= e(Settings::get('contact_email')) ?>">Email me instead</a>
  <?php endif; ?>
</main>
</body>
</html>
