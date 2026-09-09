<section class="section error-page">
  <div class="container narrow">
    <p class="error-code">404</p>
    <h1>Page not found</h1>
    <p><?= e($reason ?? 'The page you were looking for does not exist.') ?></p>
    <div class="detail-actions">
      <a class="btn btn-primary" href="<?= e(url('/')) ?>">Back to home</a>
      <?php if (Menu::enabled('blog')): ?><a class="btn btn-ghost" href="<?= e(url('/blog')) ?>">Read the blog</a><?php endif; ?>
    </div>
  </div>
</section>
