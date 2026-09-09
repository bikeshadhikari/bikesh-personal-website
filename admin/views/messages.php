<div class="page-head">
  <div>
    <h2>Messages</h2>
    <p class="muted"><?= (int) $total ?> <?= $total === 1 ? 'message' : 'messages' ?>. Everything sent through the contact form arrives here.</p>
  </div>
  <div class="page-head-actions">
    <div class="filter-bar small">
      <a class="filter-chip<?= $filter === 'all' ? ' is-active' : '' ?>" href="<?= e(url('/admin/?page=messages')) ?>">All</a>
      <a class="filter-chip<?= $filter === 'unread' ? ' is-active' : '' ?>" href="<?= e(url('/admin/?page=messages&filter=unread')) ?>">Unread</a>
      <a class="filter-chip<?= $filter === 'starred' ? ' is-active' : '' ?>" href="<?= e(url('/admin/?page=messages&filter=starred')) ?>">Starred</a>
    </div>
    <form method="post" action="<?= e(url('/admin/?page=messages&action=read_all')) ?>" class="inline-form">
      <?= Csrf::field() ?><button class="btn btn-ghost btn-sm" type="submit">Mark all read</button>
    </form>
  </div>
</div>

<?php if (!$rows): ?>
  <div class="empty-panel"><p><strong>Inbox empty.</strong></p><p class="muted">Messages from the contact form will show up here.</p></div>
<?php else: ?>
<div class="table-wrap">
  <table class="data-table">
    <thead><tr><th></th><th>From</th><th>Subject</th><th class="num">Received</th><th class="actions-col">Actions</th></tr></thead>
    <tbody>
    <?php foreach ($rows as $m): ?>
      <tr class="<?= (int) $m['is_read'] === 0 ? 'is-unread' : '' ?>">
        <td>
          <form method="post" action="<?= e(url('/admin/?page=messages&action=star&id=' . $m['id'])) ?>" class="inline-form">
            <?= Csrf::field() ?>
            <button class="star-btn<?= (int) $m['is_starred'] === 1 ? ' is-on' : '' ?>" type="submit" aria-label="Star this message"><?= icon('star', 'icon icon-sm') ?></button>
          </form>
        </td>
        <td>
          <a class="row-title" href="<?= e(url('/admin/?page=messages&action=view&id=' . $m['id'])) ?>"><?= e($m['name']) ?></a>
          <br><small class="muted"><?= e($m['email']) ?></small>
        </td>
        <td>
          <a href="<?= e(url('/admin/?page=messages&action=view&id=' . $m['id'])) ?>"><?= e($m['subject'] ?: '(no subject)') ?></a>
          <br><small class="muted"><?= e(excerptOf($m['body'], 12)) ?></small>
        </td>
        <td class="num"><?= e(formatDate($m['created_at'], 'M j, Y')) ?><br><small class="muted"><?= e(formatDate($m['created_at'], 'g:i a')) ?></small></td>
        <td class="actions-col">
          <div class="row-actions">
            <a class="btn btn-ghost btn-xs" href="<?= e(url('/admin/?page=messages&action=view&id=' . $m['id'])) ?>">Open</a>
            <form method="post" action="<?= e(url('/admin/?page=messages&action=delete&id=' . $m['id'])) ?>" class="inline-form" data-confirm="Delete this message permanently?">
              <?= Csrf::field() ?><button class="btn btn-danger btn-xs" type="submit">Delete</button>
            </form>
          </div>
        </td>
      </tr>
    <?php endforeach; ?>
    </tbody>
  </table>
</div>

<?php if ($pages > 1): ?>
<nav class="pagination">
  <?php for ($i = 1; $i <= $pages; $i++): ?>
    <a class="page-link<?= $i === $page_ ? ' is-active' : '' ?>" href="<?= e(url('/admin/?page=messages&filter=' . $filter . '&p=' . $i)) ?>"><?= $i ?></a>
  <?php endfor; ?>
</nav>
<?php endif; ?>
<?php endif; ?>
