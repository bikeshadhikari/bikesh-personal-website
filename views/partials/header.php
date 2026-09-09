<?php
$logoImage = Settings::get('logo_image', '');
$navItems  = Menu::nav();
$current   = $currentRoute ?? 'home';
?>
<header class="site-header" id="siteHeader">
  <div class="container header-inner">
    <a class="brand" href="<?= e(url('/')) ?>" aria-label="<?= e(Settings::get('site_name')) ?> — home">
      <?php if ($logoImage): ?>
        <img src="<?= e(media($logoImage)) ?>" alt="<?= e(Settings::get('site_name')) ?>" class="brand-img">
      <?php else: ?>
        <span class="brand-mark" aria-hidden="true"><?= e(mb_substr(Settings::get('full_name', 'B'), 0, 1)) ?></span>
        <span class="brand-text"><?= strip_tags((string) Settings::get('logo_text', e(Settings::get('site_name'))), '<span>') ?></span>
      <?php endif; ?>
    </a>

    <nav class="site-nav" id="siteNav" aria-label="Main">
      <ul>
        <?php foreach ($navItems as $item):
            $slug   = $item['slug'];
            $active = ($current === $slug) || ($current === 'home' && $slug === 'home');
        ?>
        <li>
          <a href="<?= e(Menu::pageUrl($item)) ?>"<?= $active ? ' class="active" aria-current="page"' : '' ?>>
            <?= e($item['label']) ?>
          </a>
        </li>
        <?php endforeach; ?>
      </ul>
      <div class="nav-cta">
        <?php if (Menu::enabled('contact')): ?>
          <a class="btn btn-primary btn-sm" href="<?= e(url('/contact')) ?>">Get in touch</a>
        <?php endif; ?>
      </div>
    </nav>

    <div class="header-actions">
      <?php if (Menu::enabled('blog')): ?>
      <form class="header-search" action="<?= e(url('/search')) ?>" method="get" role="search">
        <label class="visually-hidden" for="siteSearch">Search articles</label>
        <?= icon('search', 'icon icon-sm') ?>
        <input type="search" id="siteSearch" name="q" placeholder="Search" value="<?= e((string) query('q', '')) ?>">
      </form>
      <?php endif; ?>

      <?php if (Settings::bool('show_mode_toggle', true)): ?>
      <button class="icon-btn theme-toggle" id="themeToggle" type="button" aria-label="Switch colour theme">
        <span class="only-light"><?= icon('moon') ?></span>
        <span class="only-dark"><?= icon('sun') ?></span>
      </button>
      <?php endif; ?>

      <button class="icon-btn nav-toggle" id="navToggle" type="button" aria-expanded="false" aria-controls="siteNav" aria-label="Open menu">
        <span class="only-closed"><?= icon('menu') ?></span>
        <span class="only-open"><?= icon('close') ?></span>
      </button>
    </div>
  </div>
  <div class="scroll-progress" id="scrollProgress" aria-hidden="true"></div>
</header>
