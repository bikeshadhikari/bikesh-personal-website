<?php
/** Every block below is rendered only if its switch is on in Menus & Sections. */
if (Menu::enabled('hero')) {
    View::partial('partials/hero');
}
if (Menu::enabled('highlights')) {
    View::partial('partials/highlights', ['highlights' => $highlights]);
}
?>

<?php if (Menu::enabled('about-section')): ?>
<section class="section section-about" id="about">
  <div class="container">
    <?php View::partial('partials/section-head', [
        'eyebrow' => 'About',
        'heading' => Menu::label('about-section', 'Who I am'),
        'sub'     => Settings::get('about_lead', ''),
    ]); ?>
    <div class="about-layout">
      <div class="about-text">
        <?php foreach (preg_split('/\n\s*\n/', (string) Settings::get('about_body', '')) as $para): if (trim($para) === '') continue; ?>
          <p><?= nl2br(e(trim($para))) ?></p>
        <?php endforeach; ?>
        <div class="about-actions">
          <?php if (Menu::enabled('about')): ?><a class="btn btn-ghost" href="<?= e(url('/about')) ?>">Full profile <?= icon('arrow-right', 'icon icon-sm') ?></a><?php endif; ?>
          <?php if (Settings::get('cv_file')): ?><a class="btn btn-link" href="<?= e(media(Settings::get('cv_file'))) ?>" download><?= icon('download', 'icon icon-sm') ?> CV</a><?php endif; ?>
        </div>
      </div>
      <aside class="about-facts">
        <h3>At a glance</h3>
        <dl>
          <?php if (Settings::get('contact_location')): ?><dt><?= icon('pin', 'icon icon-sm') ?> Based in</dt><dd><?= e(Settings::get('contact_location')) ?></dd><?php endif; ?>
          <?php if (Settings::get('years_started')): ?><dt><?= icon('clock', 'icon icon-sm') ?> Working since</dt><dd><?= e(Settings::get('years_started')) ?></dd><?php endif; ?>
          <?php if (Settings::get('contact_email')): ?><dt><?= icon('mail', 'icon icon-sm') ?> Email</dt><dd><a href="mailto:<?= e(Settings::get('contact_email')) ?>"><?= e(Settings::get('contact_email')) ?></a></dd><?php endif; ?>
          <?php if (Settings::get('availability')): ?><dt><?= icon('sparkle', 'icon icon-sm') ?> Status</dt><dd><?= e(Settings::get('availability')) ?></dd><?php endif; ?>
        </dl>
      </aside>
    </div>
  </div>
</section>
<?php endif; ?>

<?php if (Menu::enabled('skills') && !empty($skills)): ?>
<section class="section section-alt" id="skills">
  <div class="container">
    <?php View::partial('partials/section-head', [
        'eyebrow' => 'Capabilities',
        'heading' => Menu::label('skills', 'Skills'),
        'sub'     => 'What I build with, what I teach with, and what I plan with.',
        'center'  => true,
    ]); ?>
    <?php View::partial('partials/skills', ['skills' => $skills]); ?>
  </div>
</section>
<?php endif; ?>

<?php if (Menu::enabled('experience-section') && !empty($experiences)): ?>
<section class="section" id="experience">
  <div class="container">
    <?php View::partial('partials/section-head', [
        'eyebrow' => 'Pipeline',
        'heading' => Menu::label('experience-section', 'Experience'),
        'sub'     => 'Where the teaching, the building and the planning have happened.',
    ]); ?>
    <?php View::partial('partials/timeline', ['experiences' => $experiences]); ?>
    <?php if (Menu::enabled('experience')): ?>
      <p class="section-more"><a class="btn btn-ghost" href="<?= e(url('/experience')) ?>">Full timeline <?= icon('arrow-right', 'icon icon-sm') ?></a></p>
    <?php endif; ?>
  </div>
</section>
<?php endif; ?>

<?php if (Menu::enabled('services-section') && !empty($services)): ?>
<section class="section section-alt" id="services">
  <div class="container">
    <?php View::partial('partials/section-head', [
        'eyebrow' => 'What I do',
        'heading' => Menu::label('services-section', 'Services'),
        'sub'     => 'Training, systems and planning for institutions, teams and individuals.',
        'center'  => true,
    ]); ?>
    <?php View::partial('partials/services', ['services' => $services]); ?>
  </div>
</section>
<?php endif; ?>

<?php if (Menu::enabled('projects-section') && !empty($projects)): ?>
<section class="section" id="projects">
  <div class="container">
    <?php View::partial('partials/section-head', [
        'eyebrow' => 'Selected work',
        'heading' => Menu::label('projects-section', 'Featured projects'),
        'sub'     => 'Systems and programmes that shipped and stayed in use.',
    ]); ?>
    <?php View::partial('partials/projects', ['projects' => $projects]); ?>
    <?php if (Menu::enabled('projects')): ?>
      <p class="section-more"><a class="btn btn-ghost" href="<?= e(url('/projects')) ?>">All projects <?= icon('arrow-right', 'icon icon-sm') ?></a></p>
    <?php endif; ?>
  </div>
</section>
<?php endif; ?>

<?php if (Menu::enabled('certifications') && !empty($certs)): ?>
<section class="section section-alt" id="certifications">
  <div class="container narrow">
    <?php View::partial('partials/section-head', [
        'eyebrow' => 'Credentials',
        'heading' => Menu::label('certifications', 'Certifications & recognition'),
        'center'  => true,
    ]); ?>
    <?php View::partial('partials/certifications', ['certs' => $certs]); ?>
  </div>
</section>
<?php endif; ?>

<?php if (Menu::enabled('testimonials') && !empty($testimonials)): ?>
<section class="section" id="testimonials">
  <div class="container">
    <?php View::partial('partials/section-head', [
        'eyebrow' => 'In their words',
        'heading' => Menu::label('testimonials', 'What people say'),
        'center'  => true,
    ]); ?>
    <?php View::partial('partials/testimonials', ['testimonials' => $testimonials]); ?>
  </div>
</section>
<?php endif; ?>

<?php if (Menu::enabled('blog-section') && !empty($posts)): ?>
<section class="section section-alt" id="writing">
  <div class="container">
    <?php View::partial('partials/section-head', [
        'eyebrow' => 'Writing',
        'heading' => Menu::label('blog-section', 'Latest notes'),
        'sub'     => Settings::get('blog_intro', ''),
    ]); ?>
    <div class="cards-grid posts-grid">
      <?php foreach ($posts as $p) { View::partial('partials/post-card', ['post' => $p]); } ?>
    </div>
    <p class="section-more"><a class="btn btn-ghost" href="<?= e(url('/blog')) ?>">All articles <?= icon('arrow-right', 'icon icon-sm') ?></a></p>
  </div>
</section>
<?php endif; ?>

<?php if (Menu::enabled('contact-section') && Menu::enabled('contact')): ?>
<section class="section section-contact" id="contact">
  <div class="container">
    <?php View::partial('partials/section-head', [
        'eyebrow' => 'Contact',
        'heading' => Menu::label('contact-section', 'Let us talk'),
        'sub'     => Settings::get('contact_intro', ''),
    ]); ?>
    <div class="contact-layout">
      <?php View::partial('partials/contact-form'); ?>
      <aside class="contact-aside">
        <ul class="contact-list">
          <?php if (Settings::get('contact_email')): ?>
          <li><span class="contact-icon"><?= icon('mail') ?></span><div><strong>Email</strong><a href="mailto:<?= e(Settings::get('contact_email')) ?>"><?= e(Settings::get('contact_email')) ?></a></div></li>
          <?php endif; ?>
          <?php if (Settings::get('contact_phone')): ?>
          <li><span class="contact-icon"><?= icon('phone') ?></span><div><strong>Phone</strong><a href="tel:<?= e(preg_replace('/[^0-9+]/', '', Settings::get('contact_phone'))) ?>"><?= e(Settings::get('contact_phone')) ?></a></div></li>
          <?php endif; ?>
          <?php if (Settings::get('contact_location')): ?>
          <li><span class="contact-icon"><?= icon('pin') ?></span><div><strong>Location</strong><span><?= e(Settings::get('contact_location')) ?></span></div></li>
          <?php endif; ?>
          <?php if (Settings::get('contact_hours')): ?>
          <li><span class="contact-icon"><?= icon('clock') ?></span><div><strong>Hours</strong><span><?= e(Settings::get('contact_hours')) ?></span></div></li>
          <?php endif; ?>
        </ul>
      </aside>
    </div>
  </div>
</section>
<?php endif; ?>
