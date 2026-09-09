<?php
/** @var array $errors @var bool $sent @var array $values */
$errors = $errors ?? [];
$sent   = $sent ?? false;
$values = $values ?? ['name' => '', 'email' => '', 'phone' => '', 'subject' => '', 'body' => ''];
?>
<form class="contact-form" method="post" action="<?= e(url('/contact')) ?>#contact" novalidate>
  <?= Csrf::field() ?>
  <input type="hidden" name="contact_form" value="1">
  <input type="text" name="website" class="hp-field" tabindex="-1" autocomplete="off" aria-hidden="true">

  <?php if ($sent): ?>
    <p class="alert alert-success"><?= icon('check', 'icon icon-sm') ?> Thank you. Your message has arrived and I will reply soon.</p>
  <?php endif; ?>
  <?php foreach ($errors as $key => $msg): if (is_int($key)): ?>
    <p class="alert alert-error"><?= e($msg) ?></p>
  <?php endif; endforeach; ?>

  <div class="field-row">
    <div class="field">
      <label for="cf-name">Your name <span aria-hidden="true">*</span></label>
      <input type="text" id="cf-name" name="name" value="<?= e($values['name']) ?>" required>
      <?php if (!empty($errors['name'])): ?><small class="field-error"><?= e($errors['name']) ?></small><?php endif; ?>
    </div>
    <div class="field">
      <label for="cf-email">Email <span aria-hidden="true">*</span></label>
      <input type="email" id="cf-email" name="email" value="<?= e($values['email']) ?>" required>
      <?php if (!empty($errors['email'])): ?><small class="field-error"><?= e($errors['email']) ?></small><?php endif; ?>
    </div>
  </div>

  <div class="field-row">
    <div class="field">
      <label for="cf-phone">Phone <small>(optional)</small></label>
      <input type="tel" id="cf-phone" name="phone" value="<?= e($values['phone']) ?>">
    </div>
    <div class="field">
      <label for="cf-subject">Subject</label>
      <input type="text" id="cf-subject" name="subject" value="<?= e($values['subject']) ?>" placeholder="Training, project, speaking…">
    </div>
  </div>

  <div class="field">
    <label for="cf-body">Message <span aria-hidden="true">*</span></label>
    <textarea id="cf-body" name="body" rows="6" required placeholder="Tell me what you have in mind."><?= e($values['body']) ?></textarea>
    <?php if (!empty($errors['body'])): ?><small class="field-error"><?= e($errors['body']) ?></small><?php endif; ?>
  </div>

  <button class="btn btn-primary" type="submit">Send message <?= icon('arrow-right', 'icon icon-sm') ?></button>
  <p class="form-note">Your details are stored only so I can reply. They are never shared.</p>
</form>
