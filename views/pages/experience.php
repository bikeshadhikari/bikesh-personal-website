<?php
$labels = ['all' => 'Everything', 'work' => 'Work', 'education' => 'Education', 'volunteer' => 'Volunteer', 'award' => 'Awards'];
View::partial('partials/page-hero', [
    'eyebrow' => 'Career pipeline',
    'heading' => 'Experience',
    'sub'     => 'Roles, institutions and study, in one line from the beginning to now.',
]);
?>

<section class="section">
  <div class="container">
    <?php if (count($tracks) > 1): ?>
    <div class="filter-bar" role="tablist" aria-label="Filter experience">
      <a class="filter-chip<?= $track === 'all' ? ' is-active' : '' ?>" href="<?= e(url('/experience')) ?>">Everything</a>
      <?php foreach ($tracks as $t): ?>
        <a class="filter-chip<?= $track === $t ? ' is-active' : '' ?>" href="<?= e(url('/experience?track=' . $t)) ?>"><?= e($labels[$t] ?? ucfirst($t)) ?></a>
      <?php endforeach; ?>
    </div>
    <?php endif; ?>

    <?php if ($experiences): ?>
      <?php View::partial('partials/timeline', ['experiences' => $experiences]); ?>
    <?php else: ?>
      <p class="empty-state">Nothing has been added to this track yet.</p>
    <?php endif; ?>
  </div>
</section>

<?php if (Menu::enabled('contact')): ?>
<section class="cta-band">
  <div class="container">
    <h2>Looking for a trainer, developer or speaker?</h2>
    <p>Tell me what you are planning and I will tell you honestly whether I am the right fit.</p>
    <a class="btn btn-primary" href="<?= e(url('/contact')) ?>">Start a conversation <?= icon('arrow-right', 'icon icon-sm') ?></a>
  </div>
</section>
<?php endif; ?>
