<?php /** @var array $testimonials */ if (!empty($testimonials)): ?>
<div class="cards-grid testimonial-grid">
  <?php foreach ($testimonials as $t): ?>
    <figure class="card testimonial-card">
      <span class="quote-mark" aria-hidden="true"><?= icon('quote') ?></span>
      <?php if ((int) $t['rating'] > 0): ?>
        <div class="stars" aria-label="<?= (int) $t['rating'] ?> out of 5">
          <?php for ($i = 0; $i < (int) $t['rating']; $i++) { echo icon('star', 'icon icon-xs star'); } ?>
        </div>
      <?php endif; ?>
      <blockquote><?= nl2br(e($t['quote'])) ?></blockquote>
      <figcaption>
        <?php if ($t['photo']): ?>
          <img src="<?= e(media($t['photo'])) ?>" alt="" loading="lazy">
        <?php else: ?>
          <span class="avatar-initial" aria-hidden="true"><?= e(mb_substr($t['name'], 0, 1)) ?></span>
        <?php endif; ?>
        <span>
          <strong><?= e($t['name']) ?></strong>
          <small><?= e(trim($t['role'] . ($t['organization'] ? ', ' . $t['organization'] : ''), ', ')) ?></small>
        </span>
      </figcaption>
    </figure>
  <?php endforeach; ?>
</div>
<?php endif; ?>
