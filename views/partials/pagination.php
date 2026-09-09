<?php
/** @var array $result @var string $baseUrl */
if (($result['pages'] ?? 0) > 1):
  $page = (int) $result['page'];
  $sep  = str_contains($baseUrl, '?') ? '&' : '?';
?>
<nav class="pagination" aria-label="Pagination">
  <?php if ($page > 1): ?>
    <a class="page-link" href="<?= e($baseUrl . $sep . 'page=' . ($page - 1)) ?>" rel="prev">Previous</a>
  <?php endif; ?>
  <?php for ($i = 1; $i <= $result['pages']; $i++): ?>
    <a class="page-link<?= $i === $page ? ' is-active' : '' ?>" href="<?= e($baseUrl . $sep . 'page=' . $i) ?>"<?= $i === $page ? ' aria-current="page"' : '' ?>><?= $i ?></a>
  <?php endfor; ?>
  <?php if ($page < $result['pages']): ?>
    <a class="page-link" href="<?= e($baseUrl . $sep . 'page=' . ($page + 1)) ?>" rel="next">Next</a>
  <?php endif; ?>
</nav>
<?php endif; ?>
