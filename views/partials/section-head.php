<?php /** @var string $eyebrow @var string $heading @var string $sub */ ?>
<div class="section-head<?= !empty($center) ? ' is-center' : '' ?>">
  <?php if (!empty($eyebrow)): ?><p class="eyebrow"><?= e($eyebrow) ?></p><?php endif; ?>
  <h2><?= e($heading) ?></h2>
  <?php if (!empty($sub)): ?><p class="section-sub"><?= e($sub) ?></p><?php endif; ?>
</div>
