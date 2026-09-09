<?php $tech = csvList($project['tech']); ?>
<article class="section project-detail">
  <div class="container narrow">
    <p class="breadcrumb"><a href="<?= e(url('/projects')) ?>">Projects</a> <span>/</span> <?= e($project['title']) ?></p>
    <h1><?= e($project['title']) ?></h1>
    <p class="lead"><?= e($project['summary']) ?></p>

    <ul class="detail-meta">
      <?php if ($project['category']): ?><li><strong>Type</strong><span><?= e($project['category']) ?></span></li><?php endif; ?>
      <?php if ($project['year']): ?><li><strong>Year</strong><span><?= e($project['year']) ?></span></li><?php endif; ?>
      <?php if ($project['client']): ?><li><strong>Client</strong><span><?= e($project['client']) ?></span></li><?php endif; ?>
      <?php if ($tech): ?><li><strong>Built with</strong><span><?= e(implode(', ', $tech)) ?></span></li><?php endif; ?>
    </ul>

    <?php if ($project['image']): ?>
      <figure class="detail-figure"><img src="<?= e(media($project['image'])) ?>" alt="<?= e($project['title']) ?>"></figure>
    <?php endif; ?>

    <?php if (trim((string) $project['description']) !== ''): ?>
      <div class="prose"><?= safeHtml((string) $project['description']) ?></div>
    <?php endif; ?>

    <div class="detail-actions">
      <?php if ($project['live_url']): ?>
        <a class="btn btn-primary" href="<?= e($project['live_url']) ?>" target="_blank" rel="noopener noreferrer">Visit the site <?= icon('external', 'icon icon-sm') ?></a>
      <?php endif; ?>
      <?php if ($project['repo_url']): ?>
        <a class="btn btn-ghost" href="<?= e($project['repo_url']) ?>" target="_blank" rel="noopener noreferrer"><?= icon('github', 'icon icon-sm') ?> Source</a>
      <?php endif; ?>
      <a class="btn btn-link" href="<?= e(url('/projects')) ?>">Back to all projects</a>
    </div>
  </div>
</article>

<?php if (!empty($more)): ?>
<section class="section section-alt">
  <div class="container">
    <?php View::partial('partials/section-head', ['eyebrow' => 'Keep looking', 'heading' => 'Other projects']); ?>
    <?php View::partial('partials/projects', ['projects' => $more]); ?>
  </div>
</section>
<?php endif; ?>
