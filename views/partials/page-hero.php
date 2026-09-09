<?php /** @var string $heading @var string $sub @var string $eyebrow */ ?>
<section class="page-hero">
  <div class="hero-glow" aria-hidden="true"></div>
  <div class="container">
    <?php if (!empty($eyebrow)): ?><p class="eyebrow"><?= e($eyebrow) ?></p><?php endif; ?>
    <h1><?= e($heading) ?></h1>
    <?php if (!empty($sub)): ?><p class="page-hero-sub"><?= e($sub) ?></p><?php endif; ?>
  </div>
</section>
