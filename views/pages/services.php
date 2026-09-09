<?php View::partial('partials/page-hero', [
    'eyebrow' => 'Services',
    'heading' => 'How I can help',
    'sub'     => 'Training, web development, academic planning, speaking and mentoring.',
]); ?>

<section class="section">
  <div class="container">
    <?php if ($services): ?>
      <?php View::partial('partials/services', ['services' => $services]); ?>
    <?php else: ?>
      <p class="empty-state">Services will be listed here shortly.</p>
    <?php endif; ?>
  </div>
</section>

<?php if (!empty($highlights)): ?><?php View::partial('partials/highlights', ['highlights' => $highlights]); ?><?php endif; ?>

<section class="section section-alt">
  <div class="container narrow">
    <?php View::partial('partials/section-head', ['eyebrow' => 'How it works', 'heading' => 'A simple way of working', 'center' => true]); ?>
    <ol class="process-list">
      <li><span class="step-num">1</span><div><h3>Conversation</h3><p>We talk about what you actually need, who it is for, and what success looks like. No charge, no obligation.</p></div></li>
      <li><span class="step-num">2</span><div><h3>Plan</h3><p>You get a written outline: scope, schedule, what I deliver and what I need from you. Nothing starts before this is agreed.</p></div></li>
      <li><span class="step-num">3</span><div><h3>Delivery</h3><p>Work happens in visible stages, with something to review at each one, so there are no surprises at the end.</p></div></li>
      <li><span class="step-num">4</span><div><h3>Handover</h3><p>You are trained on whatever was built, so the work keeps running without me. That is the point.</p></div></li>
    </ol>
  </div>
</section>

<?php if (Menu::enabled('contact')): ?>
<section class="cta-band">
  <div class="container">
    <h2>Ready when you are</h2>
    <p><?= e(Settings::get('contact_intro', '')) ?></p>
    <a class="btn btn-primary" href="<?= e(url('/contact')) ?>">Send a message <?= icon('arrow-right', 'icon icon-sm') ?></a>
  </div>
</section>
<?php endif; ?>
