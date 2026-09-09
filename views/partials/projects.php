<?php /** @var array $projects */ if (!empty($projects)): ?>
<div class="cards-grid projects-grid">
  <?php foreach ($projects as $p): ?>
    <article class="card project-card" data-category="<?= e($p['category']) ?>">
      <a class="project-thumb<?= $p['image'] ? '' : ' is-placeholder' ?>" href="<?= e(url('/projects/' . $p['slug'])) ?>">
        <?php if ($p['image']): ?>
          <img src="<?= e(media($p['image'])) ?>" alt="<?= e($p['title']) ?>" loading="lazy">
        <?php else: ?>
          <span aria-hidden="true"><?= icon('layers') ?></span>
        <?php endif; ?>
      </a>
      <div class="project-body">
        <div class="card-meta">
          <?php if ($p['category']): ?><span class="chip chip-soft"><?= e($p['category']) ?></span><?php endif; ?>
          <?php if ($p['year']): ?><span class="card-year"><?= e($p['year']) ?></span><?php endif; ?>
        </div>
        <h3><a href="<?= e(url('/projects/' . $p['slug'])) ?>"><?= e($p['title']) ?></a></h3>
        <p><?= e(excerptOf((string) $p['summary'], 24)) ?></p>
        <?php $tech = csvList($p['tech']); if ($tech): ?>
          <ul class="tech-list"><?php foreach ($tech as $t): ?><li><?= e($t) ?></li><?php endforeach; ?></ul>
        <?php endif; ?>
        <div class="card-actions">
          <a class="btn btn-link" href="<?= e(url('/projects/' . $p['slug'])) ?>">Details <?= icon('arrow-right', 'icon icon-xs') ?></a>
          <?php if ($p['live_url']): ?>
            <a class="btn btn-link" href="<?= e($p['live_url']) ?>" target="_blank" rel="noopener noreferrer">Visit <?= icon('external', 'icon icon-xs') ?></a>
          <?php endif; ?>
        </div>
      </div>
    </article>
  <?php endforeach; ?>
</div>
<?php endif; ?>
