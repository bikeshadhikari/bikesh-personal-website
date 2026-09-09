<?php
$main = $seo = [];
foreach ($def['fields'] as $fname => $field) {
    if (($field['group'] ?? '') === 'seo') { $seo[$fname] = $field; } else { $main[$fname] = $field; }
}
?>
<div class="page-head">
  <div>
    <h2><?= $isEdit ? 'Edit' : 'New' ?> <?= e(strtolower($def['singular'])) ?></h2>
    <p class="muted"><a href="<?= e(url('/admin/?page=' . $resource)) ?>">← Back to <?= e(strtolower($def['label'])) ?></a></p>
  </div>
  <?php if ($isEdit && !empty($record['slug'])): ?>
    <?php $viewPath = $resource === 'posts' ? 'blog/' : ($resource === 'projects' ? 'projects/' : ''); ?>
    <?php if ($viewPath): ?>
      <a class="btn btn-ghost btn-sm" href="<?= e(url('/' . $viewPath . $record['slug'])) ?>" target="_blank" rel="noopener"><?= icon('external', 'icon icon-sm') ?> View</a>
    <?php endif; ?>
  <?php endif; ?>
</div>

<?php if ($errors): ?>
  <div class="alert alert-error">Please correct the highlighted fields below.</div>
<?php endif; ?>

<form method="post" enctype="multipart/form-data" class="admin-form" novalidate>
  <?= Csrf::field() ?>

  <div class="form-panel">
    <div class="field-grid">
      <?php foreach ($main as $fname => $field) {
          $name  = $fname;
          $value = $record[$fname] ?? ($field['default'] ?? '');
          include __DIR__ . '/field.php';
      } ?>
    </div>
  </div>

  <?php if ($seo): ?>
  <details class="form-panel collapsible"<?= array_intersect_key($errors, $seo) ? ' open' : '' ?>>
    <summary><h3>Search engine settings</h3><span class="muted">Optional. Leave empty to use the title and summary.</span></summary>
    <div class="field-grid">
      <?php foreach ($seo as $fname => $field) {
          $name  = $fname;
          $value = $record[$fname] ?? ($field['default'] ?? '');
          include __DIR__ . '/field.php';
      } ?>
    </div>
  </details>
  <?php endif; ?>

  <div class="form-actions">
    <button class="btn btn-primary" type="submit">Save</button>
    <button class="btn btn-ghost" type="submit" name="save_and_close" value="1">Save and close</button>
    <a class="btn btn-link" href="<?= e(url('/admin/?page=' . $resource)) ?>">Cancel</a>
    <?php if ($isEdit): ?>
      <span class="form-actions-right">
        <button class="btn btn-danger btn-sm" type="submit" form="deleteForm">Delete</button>
      </span>
    <?php endif; ?>
  </div>
</form>

<?php if ($isEdit): ?>
<form id="deleteForm" method="post" action="<?= e(url('/admin/?page=' . $resource . '&action=delete&id=' . (int) $record['id'])) ?>"
      data-confirm="Delete this <?= e(strtolower($def['singular'])) ?>? This cannot be undone.">
  <?= Csrf::field() ?>
</form>
<?php endif; ?>
