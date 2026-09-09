<?php View::partial('partials/page-hero', [
    'eyebrow' => 'Contact',
    'heading' => 'Let us talk',
    'sub'     => Settings::get('contact_intro', ''),
]); ?>

<section class="section" id="contact">
  <div class="container contact-layout">
    <?php View::partial('partials/contact-form', ['errors' => $errors, 'sent' => $sent, 'values' => $values]); ?>

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
        <li><span class="contact-icon"><?= icon('clock') ?></span><div><strong>Usual hours</strong><span><?= e(Settings::get('contact_hours')) ?></span></div></li>
        <?php endif; ?>
      </ul>

      <?php $socials = Settings::socials(); if ($socials): ?>
      <div class="contact-social">
        <h3>Elsewhere</h3>
        <ul class="social-list">
          <?php foreach ($socials as $s): ?>
            <li><a href="<?= e($s['url']) ?>" target="_blank" rel="noopener noreferrer" aria-label="<?= e($s['label']) ?>"><?= icon($s['icon']) ?></a></li>
          <?php endforeach; ?>
        </ul>
      </div>
      <?php endif; ?>
    </aside>
  </div>
</section>

<?php $map = trim((string) Settings::get('map_embed', '')); if ($map !== ''): ?>
<section class="map-band"><div class="container"><div class="map-frame"><?= $map ?></div></div></section>
<?php endif; ?>
