<?php
/**
 * Renders one form control from a Resource field definition.
 * @var string $name @var array $field @var mixed $value @var array $errors
 */
$id      = 'f-' . $name;
$type    = $field['type'];
$label   = $field['label'] ?? ucfirst($name);
$error   = $errors[$name] ?? '';
$width   = $field['width'] ?? 'half';
$required= !empty($field['required']);
?>
<div class="field field-<?= e($width) ?><?= $error ? ' has-error' : '' ?>">
  <?php if ($type !== 'checkbox'): ?>
    <label for="<?= e($id) ?>"><?= e($label) ?><?= $required ? ' <span aria-hidden="true">*</span>' : '' ?></label>
  <?php endif; ?>

  <?php if ($type === 'textarea'): ?>
    <textarea id="<?= e($id) ?>" name="<?= e($name) ?>" rows="<?= (int) ($field['rows'] ?? 4) ?>"<?= $required ? ' required' : '' ?>><?= e((string) $value) ?></textarea>

  <?php elseif ($type === 'richtext'): ?>
    <div class="editor" data-editor>
      <div class="editor-toolbar" role="toolbar" aria-label="Formatting">
        <button type="button" data-cmd="bold" title="Bold"><strong>B</strong></button>
        <button type="button" data-cmd="italic" title="Italic"><em>I</em></button>
        <button type="button" data-block="h2" title="Heading">H2</button>
        <button type="button" data-block="h3" title="Sub-heading">H3</button>
        <button type="button" data-cmd="insertUnorderedList" title="Bullet list">• List</button>
        <button type="button" data-cmd="insertOrderedList" title="Numbered list">1. List</button>
        <button type="button" data-block="blockquote" title="Quote">&ldquo;</button>
        <button type="button" data-cmd="createLink" title="Link">Link</button>
        <button type="button" data-cmd="unlink" title="Remove link">Unlink</button>
        <button type="button" data-html title="Edit the HTML directly">HTML</button>
      </div>
      <div class="editor-surface prose" contenteditable="true" role="textbox" aria-multiline="true" aria-label="<?= e($label) ?>"><?= safeHtml((string) $value) ?></div>
      <textarea class="editor-source" name="<?= e($name) ?>" id="<?= e($id) ?>" hidden><?= e((string) $value) ?></textarea>
    </div>
    <p class="field-hint">Paste from Word or Google Docs works. Switch to HTML if you want full control.</p>

  <?php elseif ($type === 'select'): ?>
    <?php
      $options = $field['options'] ?? [];
      if ($options === 'categories') {
          $options = ['' => '— none —'];
          foreach (Database::all('SELECT id, name FROM categories ORDER BY name') as $c) {
              $options[(string) $c['id']] = $c['name'];
          }
      }
    ?>
    <select id="<?= e($id) ?>" name="<?= e($name) ?>">
      <?php foreach ($options as $key => $text): ?>
        <option value="<?= e((string) $key) ?>"<?= (string) $value === (string) $key ? ' selected' : '' ?>><?= e($text) ?></option>
      <?php endforeach; ?>
    </select>

  <?php elseif ($type === 'icon'): ?>
    <div class="icon-picker">
      <select id="<?= e($id) ?>" name="<?= e($name) ?>">
        <option value="">— none —</option>
        <?php foreach (Resource::iconChoices() as $choice): ?>
          <option value="<?= e($choice) ?>"<?= (string) $value === $choice ? ' selected' : '' ?>><?= e($choice) ?></option>
        <?php endforeach; ?>
      </select>
      <span class="icon-preview"><?= icon((string) $value ?: 'sparkle') ?></span>
    </div>

  <?php elseif ($type === 'checkbox'): ?>
    <label class="checkbox">
      <input type="checkbox" id="<?= e($id) ?>" name="<?= e($name) ?>" value="1"<?= (int) $value === 1 ? ' checked' : '' ?>>
      <span><?= e($label) ?></span>
    </label>

  <?php elseif ($type === 'range'): ?>
    <div class="range-row">
      <input type="range" id="<?= e($id) ?>" name="<?= e($name) ?>" min="0" max="100" step="1" value="<?= (int) $value ?>" oninput="this.nextElementSibling.textContent = this.value + '%'">
      <output><?= (int) $value ?>%</output>
    </div>

  <?php elseif ($type === 'image' || $type === 'file'): ?>
    <div class="upload-field">
      <?php if (!empty($value)): ?>
        <div class="upload-current">
          <?php if ($type === 'image'): ?>
            <img src="<?= e(media((string) $value)) ?>" alt="">
          <?php else: ?>
            <?= icon('download') ?>
          <?php endif; ?>
          <div>
            <code><?= e((string) $value) ?></code>
            <label class="checkbox small"><input type="checkbox" name="remove_<?= e($name) ?>" value="1"><span>Remove this file</span></label>
          </div>
        </div>
      <?php endif; ?>
      <input type="file" id="<?= e($id) ?>" name="<?= e($name) ?>"<?= $type === 'image' ? ' accept="image/*"' : '' ?>>
      <input type="hidden" name="<?= e($name) ?>_path" value="">
      <p class="field-hint">Up to 5 MB.<?= $type === 'image' ? ' JPG, PNG, WebP, GIF or SVG.' : '' ?></p>
    </div>

  <?php elseif ($type === 'datetime'): ?>
    <input type="datetime-local" id="<?= e($id) ?>" name="<?= e($name) ?>"
           value="<?= e($value ? date('Y-m-d\TH:i', strtotime((string) $value)) : '') ?>">

  <?php elseif ($type === 'date'): ?>
    <input type="date" id="<?= e($id) ?>" name="<?= e($name) ?>" value="<?= e($value ? date('Y-m-d', strtotime((string) $value)) : '') ?>">

  <?php elseif ($type === 'color'): ?>
    <input type="color" id="<?= e($id) ?>" name="<?= e($name) ?>" value="<?= e((string) $value ?: '#2563eb') ?>">

  <?php elseif ($type === 'number'): ?>
    <input type="number" id="<?= e($id) ?>" name="<?= e($name) ?>" value="<?= e((string) $value) ?>"
           <?= isset($field['min']) ? 'min="' . (int) $field['min'] . '"' : '' ?>
           <?= isset($field['max']) ? 'max="' . (int) $field['max'] . '"' : '' ?>>

  <?php else: ?>
    <input type="<?= $type === 'url' ? 'url' : 'text' ?>" id="<?= e($id) ?>" name="<?= e($name) ?>"
           value="<?= e((string) $value) ?>"<?= $required ? ' required' : '' ?>
           <?= $type === 'slug' ? ' data-slug' : '' ?>>
  <?php endif; ?>

  <?php if (!empty($field['hint'])): ?><p class="field-hint"><?= e($field['hint']) ?></p><?php endif; ?>
  <?php if ($error): ?><p class="field-error"><?= e($error) ?></p><?php endif; ?>
</div>
