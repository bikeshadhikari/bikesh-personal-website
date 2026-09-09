<?php /** @var array $post */ ?>
<article class="card post-card">
  <a class="post-thumb<?= $post['cover_image'] ? '' : ' is-placeholder' ?>" href="<?= e(url('/blog/' . $post['slug'])) ?>">
    <?php if ($post['cover_image']): ?>
      <img src="<?= e(media($post['cover_image'])) ?>" alt="<?= e($post['title']) ?>" loading="lazy">
    <?php else: ?>
      <span aria-hidden="true"><?= e(mb_substr($post['title'], 0, 1)) ?></span>
    <?php endif; ?>
  </a>
  <div class="post-body">
    <div class="card-meta">
      <?php if (!empty($post['category_name'])): ?>
        <a class="chip chip-soft" href="<?= e(url('/blog/category/' . $post['category_slug'])) ?>"><?= e($post['category_name']) ?></a>
      <?php endif; ?>
      <time datetime="<?= e(formatDate($post['published_at'], 'Y-m-d')) ?>"><?= e(formatDate($post['published_at'])) ?></time>
    </div>
    <h3><a href="<?= e(url('/blog/' . $post['slug'])) ?>"><?= e($post['title']) ?></a></h3>
    <p><?= e($post['excerpt'] ?: excerptOf((string) $post['content'], 24)) ?></p>
    <div class="card-actions">
      <a class="btn btn-link" href="<?= e(url('/blog/' . $post['slug'])) ?>">Read <?= icon('arrow-right', 'icon icon-xs') ?></a>
      <span class="reading-time"><?= readingTime((string) $post['content']) ?> min read</span>
    </div>
  </div>
</article>
