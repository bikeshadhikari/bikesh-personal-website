<?php
// The active dashboard section, read from the URL so this layout works
// regardless of which page script rendered it.
$page   = preg_replace('/[^a-z0-9_-]/', '', (string) ($_GET['page'] ?? 'dashboard')) ?: 'dashboard';
$user   = Auth::user();
$flash  = flash();
$unread  = (int) Database::value('SELECT COUNT(*) FROM messages WHERE is_read = 0', [], 0);
$pending = (int) Database::value("SELECT COUNT(*) FROM comments WHERE status = 'pending'", [], 0);

$navGroups = [
    'Overview' => [
        ['dashboard', 'Dashboard', 'layers'],
        ['menus', 'Menus & sections', 'check'],
    ],
    'Blog' => [
        ['posts', 'Blog posts', 'quote'],
        ['categories', 'Categories', 'tag'],
        ['comments', 'Comments', 'users', $pending],
    ],
    'Profile' => [
        ['profile', 'Profile & bio', 'users'],
        ['experiences', 'Experience pipeline', 'briefcase'],
        ['skills', 'Skills', 'sparkle'],
        ['certifications', 'Certifications', 'award'],
    ],
    'Content' => [
        ['services', 'Services', 'layers'],
        ['projects', 'Projects', 'code'],
        ['testimonials', 'Testimonials', 'quote'],
        ['highlights', 'Key numbers', 'star'],
    ],
    'Inbox' => [
        ['messages', 'Messages', 'mail', $unread],
        ['subscribers', 'Subscribers', 'users'],
    ],
    'System' => [
        ['settings', 'Settings', 'compass'],
        ['media', 'Media library', 'eye'],
        ['users', 'Users', 'users'],
        ['account', 'My account', 'check'],
    ],
];
?>
<!doctype html>
<html lang="en" data-theme="light">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title><?= e($adminTitle) ?> — Dashboard</title>
<meta name="robots" content="noindex, nofollow">
<link rel="icon" href="<?= e(url('/assets/img/favicon.svg')) ?>" type="image/svg+xml">
<link rel="stylesheet" href="<?= e(asset('assets/css/admin.css')) ?>">
<script>
(function(){try{var s=localStorage.getItem('admin-theme');if(s)document.documentElement.setAttribute('data-theme',s);}catch(e){}})();
</script>
</head>
<body class="admin">
<a class="skip-link" href="#adminMain">Skip to content</a>

<aside class="admin-sidebar" id="adminSidebar">
  <div class="sidebar-head">
    <a class="brand" href="<?= e(url('/admin/')) ?>">
      <span class="brand-mark"><?= e(mb_substr(Settings::get('full_name', 'B'), 0, 1)) ?></span>
      <span><strong><?= e(Settings::get('site_short_name', 'Dashboard')) ?></strong><small>Control panel</small></span>
    </a>
    <button class="icon-btn sidebar-close" id="sidebarClose" type="button" aria-label="Close menu"><?= icon('close') ?></button>
  </div>

  <nav class="sidebar-nav" aria-label="Dashboard sections">
    <?php foreach ($navGroups as $group => $items): ?>
      <p class="nav-group"><?= e($group) ?></p>
      <ul>
        <?php foreach ($items as $item):
            [$slug, $label, $ico] = $item;
            $badge  = $item[3] ?? 0;
            $active = $page === $slug;
        ?>
          <li>
            <a href="<?= e(url('/admin/?page=' . $slug)) ?>"<?= $active ? ' class="is-active" aria-current="page"' : '' ?>>
              <?= icon($ico, 'icon icon-sm') ?><span><?= e($label) ?></span>
              <?php if ($badge > 0): ?><em class="nav-badge"><?= $badge ?></em><?php endif; ?>
            </a>
          </li>
        <?php endforeach; ?>
      </ul>
    <?php endforeach; ?>
  </nav>

  <div class="sidebar-foot">
    <a class="btn btn-ghost btn-sm" href="<?= e(url('/')) ?>" target="_blank" rel="noopener"><?= icon('external', 'icon icon-sm') ?> View site</a>
  </div>
</aside>

<div class="admin-shell">
  <header class="admin-topbar">
    <button class="icon-btn sidebar-open" id="sidebarOpen" type="button" aria-label="Open menu"><?= icon('menu') ?></button>
    <h1 class="topbar-title"><?= e($adminTitle) ?></h1>
    <div class="topbar-actions">
      <button class="icon-btn" id="adminThemeToggle" type="button" aria-label="Switch theme">
        <span class="only-light"><?= icon('moon') ?></span><span class="only-dark"><?= icon('sun') ?></span>
      </button>
      <div class="user-chip">
        <span class="avatar-initial"><?= e(mb_substr($user['name'] ?? 'A', 0, 1)) ?></span>
        <span class="user-meta"><strong><?= e($user['name'] ?? '') ?></strong><small><?= e($user['role'] ?? '') ?></small></span>
      </div>
      <a class="btn btn-ghost btn-sm" href="<?= e(url('/admin/?page=logout')) ?>">Sign out</a>
    </div>
  </header>

  <main class="admin-main" id="adminMain">
    <?php if ($flash): ?>
      <div class="alert alert-<?= e($flash['type']) ?>"><?= e($flash['message']) ?></div>
    <?php endif; ?>
    <?= $adminContent ?>
  </main>

  <footer class="admin-foot">
    <p>&copy; <?= date('Y') ?> <?= e(Settings::get('full_name', '')) ?> · Dashboard</p>
    <p><?php if (is_file(App::root() . '/install.php')): ?>
      <strong class="warn">install.php is still on the server — delete it now.</strong>
    <?php endif; ?></p>
  </footer>
</div>

<div class="sidebar-backdrop" id="sidebarBackdrop" hidden></div>
<script src="<?= e(asset('assets/js/admin.js')) ?>" defer></script>
</body>
</html>
