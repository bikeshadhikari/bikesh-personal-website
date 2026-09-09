<?php View::partial('partials/page-hero', [
    'eyebrow' => 'Portfolio',
    'heading' => 'Projects',
    'sub'     => 'Web systems, portals and programmes I have designed, built or run.',
]); ?>

<section class="section">
  <div class="container">
    <?php if ($categories): ?>
    <div class="filter-bar">
      <a class="filter-chip<?= $active === '' ? ' is-active' : '' ?>" href="<?= e(url('/projects')) ?>">All</a>
      <?php foreach ($categories as $c): ?>
        <a class="filter-chip<?= $active === $c ? ' is-active' : '' ?>" href="<?= e(url('/projects?category=' . rawurlencode($c))) ?>"><?= e($c) ?></a>
      <?php endforeach; ?>
    </div>
    <?php endif; ?>

    <?php if ($projects): ?>
      <?php View::partial('partials/projects', ['projects' => $projects]); ?>
    <?php else: ?>
      <p class="empty-state">No projects in this category yet.</p>
    <?php endif; ?>
  </div>
</section>
