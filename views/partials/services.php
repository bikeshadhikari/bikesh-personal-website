<?php /** @var array $services */ if (!empty($services)): ?>
<div class="cards-grid services-grid">
  <?php foreach ($services as $s): ?>
    <article class="card service-card">
      <span class="card-icon"><?= icon($s['icon'] ?: 'sparkle') ?></span>
      <h3><?= e($s['title']) ?></h3>
      <p><?= e($s['summary']) ?></p>
      <?php $bullets = lines($s['bullets']); if ($bullets): ?>
        <ul class="card-list">
          <?php foreach ($bullets as $b): ?><li><?= icon('check', 'icon icon-xs') ?><span><?= e($b) ?></span></li><?php endforeach; ?>
        </ul>
      <?php endif; ?>
      <?php if ($s['price_note']): ?><p class="card-note"><?= e($s['price_note']) ?></p><?php endif; ?>
    </article>
  <?php endforeach; ?>
</div>
<?php endif; ?>
