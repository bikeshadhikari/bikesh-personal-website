<div class="page-head">
  <div>
    <h2>My account</h2>
    <p class="muted">Your sign-in details. Changing your email changes what you log in with.</p>
  </div>
</div>

<div class="split-layout">
  <section class="form-panel">
    <div class="panel-head"><h3>Details</h3></div>
    <form method="post" class="admin-form" novalidate>
      <?= Csrf::field() ?>
      <input type="hidden" name="form" value="details">
      <div class="field<?= !empty($errors['name']) ? ' has-error' : '' ?>">
        <label for="a-name">Name</label>
        <input type="text" id="a-name" name="name" value="<?= e($user['name']) ?>" required>
        <?php if (!empty($errors['name'])): ?><p class="field-error"><?= e($errors['name']) ?></p><?php endif; ?>
      </div>
      <div class="field<?= !empty($errors['email']) ? ' has-error' : '' ?>">
        <label for="a-email">Email</label>
        <input type="email" id="a-email" name="email" value="<?= e($user['email']) ?>" required>
        <?php if (!empty($errors['email'])): ?><p class="field-error"><?= e($errors['email']) ?></p><?php endif; ?>
      </div>
      <div class="form-actions"><button class="btn btn-primary" type="submit">Save details</button></div>
    </form>
  </section>

  <section class="form-panel">
    <div class="panel-head"><h3>Change password</h3></div>
    <form method="post" class="admin-form" novalidate>
      <?= Csrf::field() ?>
      <input type="hidden" name="form" value="password">
      <div class="field<?= !empty($errors['current_password']) ? ' has-error' : '' ?>">
        <label for="a-cur">Current password</label>
        <input type="password" id="a-cur" name="current_password" required autocomplete="current-password">
        <?php if (!empty($errors['current_password'])): ?><p class="field-error"><?= e($errors['current_password']) ?></p><?php endif; ?>
      </div>
      <div class="field<?= !empty($errors['new_password']) ? ' has-error' : '' ?>">
        <label for="a-new">New password <small>(10 characters or more)</small></label>
        <input type="password" id="a-new" name="new_password" required autocomplete="new-password">
        <?php if (!empty($errors['new_password'])): ?><p class="field-error"><?= e($errors['new_password']) ?></p><?php endif; ?>
      </div>
      <div class="field<?= !empty($errors['confirm_password']) ? ' has-error' : '' ?>">
        <label for="a-con">Repeat the new password</label>
        <input type="password" id="a-con" name="confirm_password" required autocomplete="new-password">
        <?php if (!empty($errors['confirm_password'])): ?><p class="field-error"><?= e($errors['confirm_password']) ?></p><?php endif; ?>
      </div>
      <div class="form-actions"><button class="btn btn-primary" type="submit">Change password</button></div>
    </form>
  </section>
</div>
