<?php /** @var array $highlights */ if (!empty($highlights)): ?>
<section class="highlights" aria-label="Key numbers">
  <div class="container highlights-grid">
    <?php foreach ($highlights as $h): ?>
      <div class="highlight-card">
        <span class="highlight-icon"><?= icon($h['icon'] ?: 'sparkle') ?></span>
        <strong class="counter" data-target="<?= e($h['value']) ?>"><?= e($h['value']) ?></strong><span class="highlight-suffix"><?= e($h['suffix']) ?></span>
        <span class="highlight-label"><?= e($h['label']) ?></span>
      </div>
    <?php endforeach; ?>
  </div>
</section>
<?php endif; ?>
