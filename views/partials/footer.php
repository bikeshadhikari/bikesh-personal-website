<?php
$socials     = Settings::socials();
$navItems    = Menu::nav();
$newsletter  = Menu::enabled('newsletter') && Settings::bool('newsletter_enabled', true);
$email       = Settings::get('contact_email', '');
$phone       = Settings::get('contact_phone', '');
$location    = Settings::get('contact_location', '');
?>
<?php if ($newsletter): ?>
<section class="newsletter">
  <div class="container newsletter-inner">
    <div>
      <h2>Occasional notes, no noise</h2>
      <p>New articles on IT education, building for the web and working in technology in Nepal. Nothing else.</p>
    </div>
    <form class="newsletter-form" id="newsletterForm" method="post" action="<?= e(url('/subscribe')) ?>">
      <?= Csrf::field() ?>
      <input type="text" name="website" class="hp-field" tabindex="-1" autocomplete="off" aria-hidden="true">
      <label class="visually-hidden" for="newsletterEmail">Email address</label>
      <input type="email" id="newsletterEmail" name="email" placeholder="you@example.com" required>
      <button class="btn btn-primary" type="submit">Subscribe</button>
      <p class="form-note" id="newsletterNote" role="status"></p>
    </form>
  </div>
</section>
<?php endif; ?>

<footer class="site-footer">
  <div class="container footer-grid">
    <div class="footer-about">
      <span class="brand-mark" aria-hidden="true"><?= e(mb_substr(Settings::get('full_name', 'B'), 0, 1)) ?></span>
      <h3><?= e(Settings::get('full_name', Settings::get('site_name'))) ?></h3>
      <p><?= e(Settings::get('site_tagline', '')) ?></p>
      <?php if ($socials): ?>
      <ul class="social-list">
        <?php foreach ($socials as $s): ?>
          <li><a href="<?= e($s['url']) ?>" target="_blank" rel="noopener noreferrer" aria-label="<?= e($s['label']) ?>"><?= icon($s['icon']) ?></a></li>
        <?php endforeach; ?>
        <?php if (Menu::enabled('blog')): ?>
          <li><a href="<?= e(url('/feed')) ?>" aria-label="RSS feed"><?= icon('rss') ?></a></li>
        <?php endif; ?>
      </ul>
      <?php endif; ?>
    </div>

    <div class="footer-links">
      <h4>Explore</h4>
      <ul>
        <?php foreach ($navItems as $item): ?>
          <li><a href="<?= e(Menu::pageUrl($item)) ?>"><?= e($item['label']) ?></a></li>
        <?php endforeach; ?>
      </ul>
    </div>

    <?php if (Menu::enabled('blog')): $cats = Content::categories(); if ($cats): ?>
    <div class="footer-links">
      <h4>Topics</h4>
      <ul>
        <?php foreach (array_slice($cats, 0, 5) as $c): ?>
          <li><a href="<?= e(url('/blog/category/' . $c['slug'])) ?>"><?= e($c['name']) ?></a></li>
        <?php endforeach; ?>
      </ul>
    </div>
    <?php endif; endif; ?>

    <div class="footer-contact">
      <h4>Reach me</h4>
      <ul>
        <?php if ($email): ?><li><?= icon('mail', 'icon icon-sm') ?><a href="mailto:<?= e($email) ?>"><?= e($email) ?></a></li><?php endif; ?>
        <?php if ($phone): ?><li><?= icon('phone', 'icon icon-sm') ?><a href="tel:<?= e(preg_replace('/[^0-9+]/', '', $phone)) ?>"><?= e($phone) ?></a></li><?php endif; ?>
        <?php if ($location): ?><li><?= icon('pin', 'icon icon-sm') ?><span><?= e($location) ?></span></li><?php endif; ?>
      </ul>
    </div>
  </div>

  <div class="container footer-bottom">
    <p>&copy; <?= date('Y') ?> <?= e(Settings::get('full_name', Settings::get('site_name'))) ?>. All rights reserved.</p>
    <p class="footer-note"><?= e(Settings::get('footer_note', '')) ?></p>
  </div>
</footer>
