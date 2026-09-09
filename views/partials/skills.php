<?php /** @var array $skills */ if (!empty($skills)): ?>
<div class="skills-grid">
  <?php foreach ($skills as $category => $items): ?>
    <div class="skill-group">
      <h3><?= e($category) ?></h3>
      <ul>
        <?php foreach ($items as $s): ?>
          <li class="skill">
            <div class="skill-top">
              <span class="skill-name"><?= e($s['name']) ?></span>
              <span class="skill-level"><?= (int) $s['level'] ?>%</span>
            </div>
            <div class="skill-bar" role="img" aria-label="<?= e($s['name']) ?>: <?= (int) $s['level'] ?> percent">
              <span style="--level: <?= (int) $s['level'] ?>%"></span>
            </div>
          </li>
        <?php endforeach; ?>
      </ul>
    </div>
  <?php endforeach; ?>
</div>
<?php endif; ?>
