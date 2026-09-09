<div class="page-head">
  <div>
    <h2><?= e($pageTitle) ?></h2>
    <?php if (!empty($intro)): ?><p class="muted"><?= e($intro) ?></p><?php endif; ?>
  </div>
</div>

<?php if (!empty($errors)): ?>
  <div class="alert alert-error">Please correct the highlighted fields below.</div>
<?php endif; ?>

<form method="post" action="<?= e($formAction) ?>" enctype="multipart/form-data" class="admin-form" novalidate>
  <?= Csrf::field() ?>
  <?php foreach ($groups as $gi => $group): ?>
    <section class="form-panel">
      <div class="panel-head">
        <h3><?= e($group['title']) ?></h3>
        <?php if (!empty($group['note'])): ?><span class="muted"><?= e($group['note']) ?></span><?php endif; ?>
      </div>
      <div class="field-grid">
        <?php foreach ($group['fields'] as $fname => $field):
            $name  = $fname;
            $value = $field['value'] ?? Settings::get($fname, $field['default'] ?? '');
            include __DIR__ . '/field.php';
        endforeach; ?>
      </div>
    </section>
  <?php endforeach; ?>

  <div class="form-actions">
    <button class="btn btn-primary" type="submit">Save changes</button>
    <a class="btn btn-link" href="<?= e(url('/')) ?>" target="_blank" rel="noopener">Preview the site</a>
  </div>
</form>
