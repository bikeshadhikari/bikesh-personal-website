<?php
$tags       = csvList($post['tags']);
$commentsOn = Settings::bool('comments_enabled', true) && (int) $post['allow_comments'] === 1;
$shareUrl   = rawurlencode(url('/blog/' . $post['slug']));
$shareText  = rawurlencode($post['title']);
?>
<article class="post-single">
  <header class="post-hero">
    <div class="hero-glow" aria-hidden="true"></div>
    <div class="container narrow">
      <p class="breadcrumb"><a href="<?= e(url('/blog')) ?>">Blog</a>
        <?php if (!empty($post['category_name'])): ?>
          <span>/</span><a href="<?= e(url('/blog/category/' . $post['category_slug'])) ?>"><?= e($post['category_name']) ?></a>
        <?php endif; ?>
      </p>
      <h1><?= e($post['title']) ?></h1>
      <?php if ($post['excerpt']): ?><p class="post-standfirst"><?= e($post['excerpt']) ?></p><?php endif; ?>
      <ul class="post-meta">
        <li><?= icon('calendar', 'icon icon-xs') ?><time datetime="<?= e(formatDate($post['published_at'], 'Y-m-d')) ?>"><?= e(formatDate($post['published_at'], 'F j, Y')) ?></time></li>
        <li><?= icon('clock', 'icon icon-xs') ?><?= readingTime((string) $post['content']) ?> min read</li>
        <li><?= icon('eye', 'icon icon-xs') ?><?= (int) $post['views'] ?> views</li>
        <?php if (!empty($post['author_name'])): ?><li><?= icon('users', 'icon icon-xs') ?><?= e($post['author_name']) ?></li><?php endif; ?>
      </ul>
    </div>
  </header>

  <?php if ($post['cover_image']): ?>
  <figure class="post-cover container narrow">
    <img src="<?= e(media($post['cover_image'])) ?>" alt="<?= e($post['title']) ?>">
  </figure>
  <?php endif; ?>

  <div class="container narrow">
    <div class="prose post-body"><?= safeHtml((string) $post['content']) ?></div>

    <?php if ($tags): ?>
    <ul class="tag-cloud post-tags">
      <?php foreach ($tags as $t): ?><li><a href="<?= e(url('/blog/tag/' . rawurlencode($t))) ?>">#<?= e($t) ?></a></li><?php endforeach; ?>
    </ul>
    <?php endif; ?>

    <div class="share-bar">
      <span>Share</span>
      <a href="https://www.linkedin.com/sharing/share-offsite/?url=<?= $shareUrl ?>" target="_blank" rel="noopener noreferrer" aria-label="Share on LinkedIn"><?= icon('linkedin') ?></a>
      <a href="https://www.facebook.com/sharer/sharer.php?u=<?= $shareUrl ?>" target="_blank" rel="noopener noreferrer" aria-label="Share on Facebook"><?= icon('facebook') ?></a>
      <a href="https://twitter.com/intent/tweet?url=<?= $shareUrl ?>&text=<?= $shareText ?>" target="_blank" rel="noopener noreferrer" aria-label="Share on X"><?= icon('twitter') ?></a>
      <button class="copy-link" type="button" data-url="<?= e(url('/blog/' . $post['slug'])) ?>">Copy link</button>
    </div>
  </div>
</article>

<?php if ($commentsOn): ?>
<section class="section section-alt" id="comments">
  <div class="container narrow">
    <h2 class="comments-title"><?= count($comments) ?> <?= count($comments) === 1 ? 'comment' : 'comments' ?></h2>

    <?php if ($comments): ?>
    <ul class="comment-list">
      <?php foreach ($comments as $c): ?>
        <li class="comment">
          <span class="avatar-initial" aria-hidden="true"><?= e(mb_substr($c['name'], 0, 1)) ?></span>
          <div>
            <p class="comment-head"><strong><?= e($c['name']) ?></strong> <time><?= e(formatDate($c['created_at'], 'M j, Y')) ?></time></p>
            <p><?= nl2br(e($c['body'])) ?></p>
          </div>
        </li>
      <?php endforeach; ?>
    </ul>
    <?php endif; ?>

    <?php if ($commentOk): ?>
      <p class="alert alert-success"><?= icon('check', 'icon icon-sm') ?>
        <?= Settings::bool('comments_moderated', true) ? 'Thank you. Your comment is waiting to be approved.' : 'Thank you. Your comment is published.' ?>
      </p>
    <?php elseif ($commentError): ?>
      <p class="alert alert-error"><?= e($commentError) ?></p>
    <?php endif; ?>

    <form class="comment-form" method="post" action="<?= e(url('/blog/' . $post['slug'])) ?>#comments">
      <?= Csrf::field() ?>
      <input type="text" name="website" class="hp-field" tabindex="-1" autocomplete="off" aria-hidden="true">
      <h3>Leave a comment</h3>
      <div class="field-row">
        <div class="field">
          <label for="c-name">Name <span aria-hidden="true">*</span></label>
          <input type="text" id="c-name" name="comment_name" required>
        </div>
        <div class="field">
          <label for="c-email">Email <small>(not published)</small></label>
          <input type="email" id="c-email" name="comment_email">
        </div>
      </div>
      <div class="field">
        <label for="c-body">Comment <span aria-hidden="true">*</span></label>
        <textarea id="c-body" name="comment_body" rows="5" required></textarea>
      </div>
      <button class="btn btn-primary" type="submit">Post comment</button>
    </form>
  </div>
</section>
<?php endif; ?>

<?php if (!empty($related)): ?>
<section class="section">
  <div class="container">
    <?php View::partial('partials/section-head', ['eyebrow' => 'Keep reading', 'heading' => 'Related articles']); ?>
    <div class="cards-grid posts-grid">
      <?php foreach ($related as $p) { View::partial('partials/post-card', ['post' => $p]); } ?>
    </div>
  </div>
</section>
<?php endif; ?>
