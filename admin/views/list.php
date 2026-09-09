<div class="page-head">
  <div>
    <h2><?= e($def['label']) ?></h2>
    <p class="muted"><?= (int) $data['total'] ?> <?= $data['total'] === 1 ? 'entry' : 'entries' ?><?= $search !== '' ? ' matching “' . e($search) . '”' : '' ?>.</p>
  </div>
  <div class="page-head-actions">
    <?php if (!empty($def['search'])): ?>
    <form class="table-search" method="get">
      <input type="hidden" name="page" value="<?= e($resource) ?>">
      <?= icon('search', 'icon icon-sm') ?>
      <label class="visually-hidden" for="tableSearch">Search <?= e($def['label']) ?></label>
      <input type="search" id="tableSearch" name="search" value="<?= e($search) ?>" placeholder="Search…">
    </form>
    <?php endif; ?>
    <a class="btn btn-primary btn-sm" href="<?= e(url('/admin/?page=' . $resource . '&action=create')) ?>">New <?= e(strtolower($def['singular'])) ?></a>
  </div>
</div>

<?php if (empty($data['rows'])): ?>
  <div class="empty-panel">
    <p><strong>Nothing here yet.</strong></p>
    <p class="muted"><?= $search !== '' ? 'No entry matches that search.' : 'Create the first ' . e(strtolower($def['singular'])) . ' and it appears on the website straight away.' ?></p>
    <a class="btn btn-primary btn-sm" href="<?= e(url('/admin/?page=' . $resource . '&action=create')) ?>">New <?= e(strtolower($def['singular'])) ?></a>
  </div>
<?php else: ?>
<div class="table-wrap">
  <table class="data-table">
    <thead>
      <tr>
        <?php foreach ($def['list'] as $col): ?>
          <th<?= in_array($col['type'] ?? '', ['number', 'date'], true) ? ' class="num"' : '' ?>><?= e($col['label']) ?></th>
        <?php endforeach; ?>
        <th class="actions-col">Actions</th>
      </tr>
    </thead>
    <tbody>
    <?php foreach ($data['rows'] as $row): ?>
      <tr>
        <?php foreach ($def['list'] as $col):
            $key   = $col['key'];
            $value = $row[$key] ?? '';
            $type  = $col['type'] ?? 'text';
        ?>
        <td<?= in_array($type, ['number', 'date'], true) ? ' class="num"' : '' ?>>
          <?php if (!empty($col['primary'])): ?>
            <a class="row-title" href="<?= e(url('/admin/?page=' . $resource . '&action=edit&id=' . $row['id'])) ?>"><?= e((string) $value) ?></a>
            <?php if (!empty($col['link']) && !empty($row['slug'])): ?>
              <a class="row-view" href="<?= e(url('/' . str_replace('%slug%', $row['slug'], $col['link']))) ?>" target="_blank" rel="noopener" title="View on the site"><?= icon('external', 'icon icon-xs') ?></a>
            <?php endif; ?>
          <?php elseif ($type === 'status'): ?>
            <span class="status status-<?= e((string) $value) ?>"><?= e((string) $value) ?></span>
          <?php elseif ($type === 'chip'): ?>
            <?= $value !== '' && $value !== null ? '<span class="chip chip-soft">' . e((string) $value) . '</span>' : '<span class="muted">—</span>' ?>
          <?php elseif ($type === 'bool'): ?>
            <?= (int) $value === 1 ? '<span class="status status-published">Yes</span>' : '<span class="muted">No</span>' ?>
          <?php elseif ($type === 'toggle'): ?>
            <form method="post" action="<?= e(url('/admin/?page=' . $resource . '&action=toggle&id=' . $row['id'])) ?>" class="inline-form">
              <?= Csrf::field() ?>
              <input type="hidden" name="column" value="<?= e($key) ?>">
              <input type="hidden" name="search" value="<?= e($search) ?>">
              <button type="submit" class="switch <?= (int) $value === 1 ? 'is-on' : '' ?>" role="switch" aria-checked="<?= (int) $value === 1 ? 'true' : 'false' ?>" title="<?= (int) $value === 1 ? 'Visible — click to hide' : 'Hidden — click to show' ?>">
                <span></span>
              </button>
            </form>
          <?php elseif ($type === 'meter'): ?>
            <div class="mini-meter" title="<?= (int) $value ?>%"><span style="width: <?= (int) $value ?>%"></span></div>
          <?php elseif ($type === 'date'): ?>
            <?= $value ? e(formatDate((string) $value, 'M j, Y')) : '<span class="muted">—</span>' ?>
          <?php elseif ($type === 'mono'): ?>
            <code><?= e((string) $value) ?></code>
          <?php else: ?>
            <?= $value === '' || $value === null ? '<span class="muted">—</span>' : e((string) $value) ?>
          <?php endif; ?>
        </td>
        <?php endforeach; ?>
        <td class="actions-col">
          <div class="row-actions">
            <a class="btn btn-ghost btn-xs" href="<?= e(url('/admin/?page=' . $resource . '&action=edit&id=' . $row['id'])) ?>">Edit</a>
            <form method="post" action="<?= e(url('/admin/?page=' . $resource . '&action=delete&id=' . $row['id'])) ?>" class="inline-form"
                  data-confirm="Delete this <?= e(strtolower($def['singular'])) ?>? This cannot be undone.">
              <?= Csrf::field() ?>
              <button class="btn btn-danger btn-xs" type="submit">Delete</button>
            </form>
          </div>
        </td>
      </tr>
    <?php endforeach; ?>
    </tbody>
  </table>
</div>

<?php if ($data['pages'] > 1): ?>
<nav class="pagination" aria-label="Pagination">
  <?php for ($i = 1; $i <= $data['pages']; $i++): ?>
    <a class="page-link<?= $i === $data['page'] ? ' is-active' : '' ?>"
       href="<?= e(url('/admin/?page=' . $resource . '&p=' . $i . ($search !== '' ? '&search=' . rawurlencode($search) : ''))) ?>"><?= $i ?></a>
  <?php endfor; ?>
</nav>
<?php endif; ?>
<?php endif; ?>
