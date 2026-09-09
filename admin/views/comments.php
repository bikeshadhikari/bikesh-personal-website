<div class="page-head">
  <div>
    <h2>Comments</h2>
    <p class="muted">New comments wait here until you approve them, if moderation is on under Settings.</p>
  </div>
  <div class="filter-bar small">
    <a class="filter-chip<?= $filter === 'pending' ? ' is-active' : '' ?>" href="<?= e(url('/admin/?page=comments&filter=pending')) ?>">Waiting <em><?= $counts['pending'] ?></em></a>
    <a class="filter-chip<?= $filter === 'approved' ? ' is-active' : '' ?>" href="<?= e(url('/admin/?page=comments&filter=approved')) ?>">Published <em><?= $counts['approved'] ?></em></a>
    <a class="filter-chip<?= $filter === 'spam' ? ' is-active' : '' ?>" href="<?= e(url('/admin/?page=comments&filter=spam')) ?>">Spam <em><?= $counts['spam'] ?></em></a>
    <a class="filter-chip<?= $filter === 'all' ? ' is-active' : '' ?>" href="<?= e(url('/admin/?page=comments&filter=all')) ?>">All</a>
  </div>
</div>

<?php if (!$rows): ?>
  <div class="empty-panel"><p><strong>Nothing here.</strong></p><p class="muted">No comments with this status.</p></div>
<?php else: ?>
<ul class="comment-admin-list">
  <?php foreach ($rows as $c): ?>
    <li class="comment-admin">
      <div class="comment-admin-head">
        <span class="avatar-initial"><?= e(mb_substr($c['name'], 0, 1)) ?></span>
        <div>
          <strong><?= e($c['name']) ?></strong>
          <?php if ($c['email']): ?><a href="mailto:<?= e($c['email']) ?>"><?= e($c['email']) ?></a><?php endif; ?>
          <small class="muted">on <a href="<?= e(url('/blog/' . $c['post_slug'])) ?>" target="_blank" rel="noopener"><?= e($c['post_title'] ?: 'a deleted post') ?></a> · <?= e(formatDate($c['created_at'], 'M j, Y g:i a')) ?></small>
        </div>
        <span class="status status-<?= e($c['status']) ?>"><?= e($c['status']) ?></span>
      </div>
      <p class="comment-admin-body"><?= nl2br(e($c['body'])) ?></p>
      <div class="row-actions">
        <?php if ($c['status'] !== 'approved'): ?>
        <form method="post" action="<?= e(url('/admin/?page=comments&action=approve&id=' . $c['id'])) ?>" class="inline-form">
          <?= Csrf::field() ?><input type="hidden" name="filter" value="<?= e($filter) ?>">
          <button class="btn btn-primary btn-xs" type="submit">Publish</button>
        </form>
        <?php endif; ?>
        <?php if ($c['status'] !== 'spam'): ?>
        <form method="post" action="<?= e(url('/admin/?page=comments&action=reject&id=' . $c['id'])) ?>" class="inline-form">
          <?= Csrf::field() ?><input type="hidden" name="filter" value="<?= e($filter) ?>">
          <button class="btn btn-ghost btn-xs" type="submit">Spam</button>
        </form>
        <?php endif; ?>
        <form method="post" action="<?= e(url('/admin/?page=comments&action=delete&id=' . $c['id'])) ?>" class="inline-form" data-confirm="Delete this comment permanently?">
          <?= Csrf::field() ?><input type="hidden" name="filter" value="<?= e($filter) ?>">
          <button class="btn btn-danger btn-xs" type="submit">Delete</button>
        </form>
      </div>
    </li>
  <?php endforeach; ?>
</ul>
<?php endif; ?>
