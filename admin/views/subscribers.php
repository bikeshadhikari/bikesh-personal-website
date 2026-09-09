<div class="page-head">
  <div>
    <h2>Newsletter subscribers</h2>
    <p class="muted"><?= count($rows) ?> <?= count($rows) === 1 ? 'address' : 'addresses' ?> collected from the footer signup.</p>
  </div>
  <?php if ($rows): ?>
    <a class="btn btn-ghost btn-sm" href="<?= e(url('/admin/?page=subscribers&action=export')) ?>"><?= icon('download', 'icon icon-sm') ?> Export CSV</a>
  <?php endif; ?>
</div>

<?php if (!$rows): ?>
  <div class="empty-panel"><p><strong>No subscribers yet.</strong></p><p class="muted">The signup form sits above the footer. It can be switched off under Settings.</p></div>
<?php else: ?>
<div class="table-wrap">
  <table class="data-table">
    <thead><tr><th>Email</th><th class="num">Subscribed</th><th class="actions-col">Actions</th></tr></thead>
    <tbody>
    <?php foreach ($rows as $s): ?>
      <tr>
        <td><a href="mailto:<?= e($s['email']) ?>"><?= e($s['email']) ?></a></td>
        <td class="num"><?= e(formatDate($s['created_at'], 'M j, Y')) ?></td>
        <td class="actions-col">
          <form method="post" action="<?= e(url('/admin/?page=subscribers&action=delete&id=' . $s['id'])) ?>" class="inline-form" data-confirm="Remove this subscriber?">
            <?= Csrf::field() ?><button class="btn btn-danger btn-xs" type="submit">Remove</button>
          </form>
        </td>
      </tr>
    <?php endforeach; ?>
    </tbody>
  </table>
</div>
<?php endif; ?>
