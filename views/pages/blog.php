<?php View::partial('partials/page-hero', [
    'eyebrow' => 'Blog',
    'heading' => $heading,
    'sub'     => $intro,
]); ?>

<section class="section blog-layout-wrap">
  <div class="container blog-layout">
    <div class="blog-main">
      <?php if (!empty($searchTerm)): ?>
        <form class="inline-search" action="<?= e(url('/search')) ?>" method="get">
          <?= icon('search', 'icon icon-sm') ?>
          <input type="search" name="q" value="<?= e($searchTerm) ?>" placeholder="Search articles">
          <button class="btn btn-primary btn-sm" type="submit">Search</button>
        </form>
      <?php endif; ?>

      <?php if (!empty($result['items'])): ?>
        <div class="cards-grid posts-grid">
          <?php foreach ($result['items'] as $p) { View::partial('partials/post-card', ['post' => $p]); } ?>
        </div>
        <?php View::partial('partials/pagination', ['result' => $result, 'baseUrl' => $baseUrl]); ?>
      <?php else: ?>
        <p class="empty-state">No articles here yet. <?= Menu::enabled('blog') ? 'Check back soon.' : '' ?></p>
      <?php endif; ?>
    </div>

    <aside class="blog-side">
      <div class="side-box">
        <h3>Search</h3>
        <form class="inline-search" action="<?= e(url('/search')) ?>" method="get">
          <?= icon('search', 'icon icon-sm') ?>
          <label class="visually-hidden" for="sideSearch">Search articles</label>
          <input type="search" id="sideSearch" name="q" value="<?= e($searchTerm ?? '') ?>" placeholder="Type and press enter">
        </form>
      </div>

      <?php if (!empty($categories)): ?>
      <div class="side-box">
        <h3>Categories</h3>
        <ul class="side-list">
          <?php foreach ($categories as $c): ?>
            <li>
              <a href="<?= e(url('/blog/category/' . $c['slug'])) ?>"<?= ($activeCat ?? '') === $c['slug'] ? ' class="is-active"' : '' ?>>
                <?= e($c['name']) ?><span><?= (int) $c['post_count'] ?></span>
              </a>
            </li>
          <?php endforeach; ?>
        </ul>
      </div>
      <?php endif; ?>

      <?php if (!empty($tags)): ?>
      <div class="side-box">
        <h3>Tags</h3>
        <ul class="tag-cloud">
          <?php foreach ($tags as $tag => $count): ?>
            <li><a href="<?= e(url('/blog/tag/' . rawurlencode((string) $tag))) ?>">#<?= e((string) $tag) ?></a></li>
          <?php endforeach; ?>
        </ul>
      </div>
      <?php endif; ?>

      <div class="side-box side-cta">
        <h3>Work together?</h3>
        <p>Training, a website, or a session for your college.</p>
        <?php if (Menu::enabled('contact')): ?>
          <a class="btn btn-primary btn-sm" href="<?= e(url('/contact')) ?>">Get in touch</a>
        <?php endif; ?>
      </div>
    </aside>
  </div>
</section>
