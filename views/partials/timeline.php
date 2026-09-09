<?php
/**
 * The experience pipeline. Each entry is a stage on a single vertical line.
 * @var array $experiences
 */
if (!empty($experiences)):
  $trackLabels = ['work' => 'Work', 'education' => 'Education', 'volunteer' => 'Volunteer', 'award' => 'Award'];
  $trackIcons  = ['work' => 'briefcase', 'education' => 'graduation', 'volunteer' => 'heart', 'award' => 'award'];
?>
<ol class="timeline">
  <?php foreach ($experiences as $x):
      $range    = dateRange($x['start_date'], $x['end_date'], (int) $x['is_current'] === 1);
      $duration = durationBetween($x['start_date'], $x['end_date'], (int) $x['is_current'] === 1);
      $bullets  = lines($x['highlights']);
      $track    = $x['track'] ?: 'work';
  ?>
  <li class="timeline-item<?= (int) $x['is_current'] === 1 ? ' is-current' : '' ?>" data-track="<?= e($track) ?>">
    <span class="timeline-dot" aria-hidden="true"><?= icon($trackIcons[$track] ?? 'briefcase', 'icon icon-sm') ?></span>
    <div class="timeline-card">
      <div class="timeline-meta">
        <span class="chip chip-<?= e($track) ?>"><?= e($trackLabels[$track] ?? ucfirst($track)) ?></span>
        <?php if ((int) $x['is_current'] === 1): ?><span class="chip chip-live">Current</span><?php endif; ?>
        <?php if ($x['employment_type']): ?><span class="chip chip-soft"><?= e($x['employment_type']) ?></span><?php endif; ?>
      </div>

      <h3 class="timeline-role"><?= e($x['role']) ?></h3>

      <p class="timeline-org">
        <?php if ($x['organization']): ?>
          <?php if ($x['organization_url']): ?>
            <a href="<?= e($x['organization_url']) ?>" target="_blank" rel="noopener noreferrer"><?= e($x['organization']) ?> <?= icon('external', 'icon icon-xs') ?></a>
          <?php else: ?>
            <?= e($x['organization']) ?>
          <?php endif; ?>
        <?php endif; ?>
        <?php if ($x['location']): ?><span class="dot-sep">·</span><?= e($x['location']) ?><?php endif; ?>
      </p>

      <p class="timeline-dates">
        <?= icon('calendar', 'icon icon-xs') ?> <?= e($range) ?>
        <?php if ($duration): ?><span class="dot-sep">·</span><?= e($duration) ?><?php endif; ?>
      </p>

      <?php if ($x['summary']): ?><p class="timeline-summary"><?= nl2br(e($x['summary'])) ?></p><?php endif; ?>

      <?php if ($bullets): ?>
      <ul class="timeline-points">
        <?php foreach ($bullets as $b): ?>
          <li><?= icon('check', 'icon icon-xs') ?><span><?= e($b) ?></span></li>
        <?php endforeach; ?>
      </ul>
      <?php endif; ?>
    </div>
  </li>
  <?php endforeach; ?>
</ol>
<?php endif; ?>
