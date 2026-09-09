<?php
$roles  = lines(Settings::get('rotating_roles', ''));
$photo  = Settings::get('photo', '');
$cv     = Settings::get('cv_file', '');
$avail  = Settings::get('availability', '');
$native = Settings::get('name_native', '');
?>
<section class="hero" id="hero">
  <div class="hero-glow" aria-hidden="true"></div>
  <div class="container hero-inner">
    <div class="hero-copy">
      <?php if ($avail): ?>
        <p class="availability"><span class="pulse" aria-hidden="true"></span><?= e($avail) ?></p>
      <?php endif; ?>

      <h1 class="hero-name">
        <?= e(Settings::get('full_name', 'Your Name')) ?>
        <?php if ($native): ?><span class="hero-native" lang="ne"><?= e($native) ?></span><?php endif; ?>
      </h1>

      <?php if ($roles): ?>
      <p class="hero-roles">
        <span class="hero-roles-static">I am an</span>
        <span class="rotator" data-roles='<?= e(json_encode(array_values($roles), JSON_UNESCAPED_UNICODE)) ?>'>
          <span class="rotator-text"><?= e($roles[0]) ?></span><span class="rotator-caret" aria-hidden="true"></span>
        </span>
      </p>
      <?php endif; ?>

      <p class="hero-intro"><?= nl2br(e(Settings::get('hero_intro', ''))) ?></p>

      <div class="hero-actions">
        <?php if (Menu::enabled('contact')): ?>
          <a class="btn btn-primary" href="<?= e(url('/contact')) ?>">Work with me <?= icon('arrow-right', 'icon icon-sm') ?></a>
        <?php endif; ?>
        <?php if (Menu::enabled('projects')): ?>
          <a class="btn btn-ghost" href="<?= e(url('/projects')) ?>">See the work</a>
        <?php endif; ?>
        <?php if ($cv): ?>
          <a class="btn btn-link" href="<?= e(media($cv)) ?>" download><?= icon('download', 'icon icon-sm') ?> Download CV</a>
        <?php endif; ?>
      </div>

      <?php $socials = Settings::socials(); if ($socials): ?>
      <ul class="hero-social">
        <?php foreach ($socials as $s): ?>
          <li><a href="<?= e($s['url']) ?>" target="_blank" rel="noopener noreferrer" aria-label="<?= e($s['label']) ?>"><?= icon($s['icon']) ?></a></li>
        <?php endforeach; ?>
      </ul>
      <?php endif; ?>
    </div>

    <div class="hero-media">
      <div class="hero-photo<?= $photo ? '' : ' is-placeholder' ?>">
        <?php if ($photo): ?>
          <img src="<?= e(media($photo)) ?>" alt="<?= e(Settings::get('photo_alt') ?: Settings::get('full_name')) ?>" width="440" height="520">
        <?php else: ?>
          <span class="photo-initial" aria-hidden="true"><?= e(mb_substr(Settings::get('full_name', 'B'), 0, 1)) ?></span>
          <p class="photo-hint">Upload your photo in the dashboard under <strong>Profile</strong>.</p>
        <?php endif; ?>
      </div>
      <?php $first = Content::highlights()[0] ?? null; if ($first): ?>
      <div class="hero-badge">
        <strong><?= e($first['value']) ?><?= e($first['suffix']) ?></strong>
        <span><?= e($first['label']) ?></span>
      </div>
      <?php endif; ?>
    </div>
  </div>
</section>
