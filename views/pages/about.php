<?php View::partial('partials/page-hero', [
    'eyebrow' => 'About',
    'heading' => Settings::get('full_name', 'About me'),
    'sub'     => Settings::get('headline', ''),
]); ?>

<section class="section">
  <div class="container about-layout">
    <div class="about-text prose">
      <p class="lead"><?= e(Settings::get('about_lead', '')) ?></p>
      <?php foreach (preg_split('/\n\s*\n/', (string) Settings::get('about_body', '')) as $para): if (trim($para) === '') continue; ?>
        <p><?= nl2br(e(trim($para))) ?></p>
      <?php endforeach; ?>
      <div class="about-actions">
        <?php if (Menu::enabled('contact')): ?><a class="btn btn-primary" href="<?= e(url('/contact')) ?>">Get in touch <?= icon('arrow-right', 'icon icon-sm') ?></a><?php endif; ?>
        <?php if (Settings::get('cv_file')): ?><a class="btn btn-ghost" href="<?= e(media(Settings::get('cv_file'))) ?>" download><?= icon('download', 'icon icon-sm') ?> Download CV</a><?php endif; ?>
      </div>
    </div>
    <aside class="about-side">
      <?php $photo = Settings::get('photo', ''); if ($photo): ?>
        <img class="about-photo" src="<?= e(media($photo)) ?>" alt="<?= e(Settings::get('photo_alt') ?: Settings::get('full_name')) ?>">
      <?php endif; ?>
      <div class="about-facts">
        <h3>At a glance</h3>
        <dl>
          <?php if (Settings::get('contact_location')): ?><dt>Based in</dt><dd><?= e(Settings::get('contact_location')) ?></dd><?php endif; ?>
          <?php if (Settings::get('years_started')): ?><dt>Working since</dt><dd><?= e(Settings::get('years_started')) ?></dd><?php endif; ?>
          <?php if (Settings::get('contact_email')): ?><dt>Email</dt><dd><a href="mailto:<?= e(Settings::get('contact_email')) ?>"><?= e(Settings::get('contact_email')) ?></a></dd><?php endif; ?>
          <?php if (Settings::get('availability')): ?><dt>Status</dt><dd><?= e(Settings::get('availability')) ?></dd><?php endif; ?>
        </dl>
      </div>
    </aside>
  </div>
</section>

<?php if (!empty($highlights)): ?>
<?php View::partial('partials/highlights', ['highlights' => $highlights]); ?>
<?php endif; ?>

<?php if (!empty($skills)): ?>
<section class="section section-alt">
  <div class="container">
    <?php View::partial('partials/section-head', ['eyebrow' => 'Capabilities', 'heading' => 'Skills', 'center' => true]); ?>
    <?php View::partial('partials/skills', ['skills' => $skills]); ?>
  </div>
</section>
<?php endif; ?>

<?php if (!empty($education)): ?>
<section class="section">
  <div class="container narrow">
    <?php View::partial('partials/section-head', ['eyebrow' => 'Academic background', 'heading' => 'Education']); ?>
    <?php View::partial('partials/timeline', ['experiences' => $education]); ?>
  </div>
</section>
<?php endif; ?>

<?php if (!empty($certs)): ?>
<section class="section section-alt">
  <div class="container narrow">
    <?php View::partial('partials/section-head', ['eyebrow' => 'Credentials', 'heading' => 'Certifications & recognition', 'center' => true]); ?>
    <?php View::partial('partials/certifications', ['certs' => $certs]); ?>
  </div>
</section>
<?php endif; ?>
