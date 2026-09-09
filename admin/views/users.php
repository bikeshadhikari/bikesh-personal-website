<div class="page-head">
  <div>
    <h2>Users</h2>
    <p class="muted">Administrators can change everything. Editors can manage content but not users or settings.</p>
  </div>
</div>

<div class="split-layout">
  <section class="form-panel">
    <div class="panel-head"><h3><?= $formAction === 'edit' ? 'Edit user' : 'Add a user' ?></h3></div>

    <?php if ($errors): ?><div class="alert alert-error">Please correct the fields below.</div><?php endif; ?>

    <form method="post" action="<?= e(url('/admin/?page=users&action=' . $formAction . ($formAction === 'edit' ? '&id=' . (int) $editId : ''))) ?>" class="admin-form" novalidate>
      <?= Csrf::field() ?>
      <div class="field<?= !empty($errors['name']) ? ' has-error' : '' ?>">
        <label for="u-name">Name</label>
        <input type="text" id="u-name" name="name" value="<?= e($record['name']) ?>" required>
        <?php if (!empty($errors['name'])): ?><p class="field-error"><?= e($errors['name']) ?></p><?php endif; ?>
      </div>
      <div class="field<?= !empty($errors['email']) ? ' has-error' : '' ?>">
        <label for="u-email">Email</label>
        <input type="email" id="u-email" name="email" value="<?= e($record['email']) ?>" required>
        <?php if (!empty($errors['email'])): ?><p class="field-error"><?= e($errors['email']) ?></p><?php endif; ?>
      </div>
      <div class="field<?= !empty($errors['password']) ? ' has-error' : '' ?>">
        <label for="u-pass">Password <?= $formAction === 'edit' ? '<small>(leave empty to keep the current one)</small>' : '' ?></label>
        <input type="password" id="u-pass" name="password" autocomplete="new-password"<?= $formAction === 'edit' ? '' : ' required' ?>>
        <?php if (!empty($errors['password'])): ?><p class="field-error"><?= e($errors['password']) ?></p><?php endif; ?>
      </div>
      <div class="field<?= !empty($errors['role']) ? ' has-error' : '' ?>">
        <label for="u-role">Role</label>
        <select id="u-role" name="role">
          <option value="editor"<?= $record['role'] === 'editor' ? ' selected' : '' ?>>Editor</option>
          <option value="admin"<?= $record['role'] === 'admin' ? ' selected' : '' ?>>Administrator</option>
        </select>
        <?php if (!empty($errors['role'])): ?><p class="field-error"><?= e($errors['role']) ?></p><?php endif; ?>
      </div>
      <label class="checkbox"><input type="checkbox" name="is_active" value="1"<?= (int) $record['is_active'] === 1 ? ' checked' : '' ?>><span>Account is active</span></label>
      <div class="form-actions">
        <button class="btn btn-primary" type="submit"><?= $formAction === 'edit' ? 'Save user' : 'Create user' ?></button>
        <?php if ($formAction === 'edit'): ?><a class="btn btn-link" href="<?= e(url('/admin/?page=users')) ?>">Cancel</a><?php endif; ?>
      </div>
    </form>
  </section>

  <section class="form-panel">
    <div class="panel-head"><h3>All users</h3></div>
    <div class="table-wrap">
      <table class="data-table">
        <thead><tr><th>Name</th><th>Role</th><th>Last signed in</th><th class="actions-col"></th></tr></thead>
        <tbody>
        <?php foreach ($users as $u): ?>
          <tr>
            <td>
              <strong><?= e($u['name']) ?></strong><?= $u['id'] == Auth::id() ? ' <span class="chip chip-soft">you</span>' : '' ?>
              <br><small class="muted"><?= e($u['email']) ?></small>
            </td>
            <td>
              <span class="status status-<?= $u['role'] === 'admin' ? 'published' : 'draft' ?>"><?= e($u['role']) ?></span>
              <?php if ((int) $u['is_active'] === 0): ?><br><small class="muted">inactive</small><?php endif; ?>
            </td>
            <td><small class="muted"><?= $u['last_login_at'] ? e(formatDate($u['last_login_at'], 'M j, Y')) : 'never' ?></small></td>
            <td class="actions-col">
              <div class="row-actions">
                <a class="btn btn-ghost btn-xs" href="<?= e(url('/admin/?page=users&action=edit&id=' . $u['id'])) ?>">Edit</a>
                <?php if ($u['id'] != Auth::id()): ?>
                <form method="post" action="<?= e(url('/admin/?page=users&action=delete&id=' . $u['id'])) ?>" class="inline-form" data-confirm="Delete this user? Their posts stay, but lose their author.">
                  <?= Csrf::field() ?><button class="btn btn-danger btn-xs" type="submit">Delete</button>
                </form>
                <?php endif; ?>
              </div>
            </td>
          </tr>
        <?php endforeach; ?>
        </tbody>
      </table>
    </div>
  </section>
</div>
