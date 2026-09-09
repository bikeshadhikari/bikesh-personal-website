<div class="page-head">
  <div>
    <h2>Media library</h2>
    <p class="muted"><?= count($files) ?> <?= count($files) === 1 ? 'file' : 'files' ?>, <?= e(Upload::humanSize($bytes)) ?> in total. Copy a path to reuse an image anywhere.</p>
  </div>
</div>

<form class="form-panel upload-panel" method="post" enctype="multipart/form-data">
  <?= Csrf::field() ?>
  <div class="field-grid">
    <div class="field field-half">
      <label for="m-file">Upload a file</label>
      <input type="file" id="m-file" name="file" required>
      <p class="field-hint">Images, PDFs and documents up to 5 MB.</p>
    </div>
    <div class="field field-half">
      <label for="m-folder">Put it in</label>
      <select id="m-folder" name="folder">
        <option value="site">General</option>
        <option value="posts">Blog covers</option>
        <option value="projects">Project images</option>
        <option value="profile">Profile</option>
      </select>
    </div>
  </div>
  <button class="btn btn-primary" type="submit">Upload</button>
</form>

<?php if (!$files): ?>
  <div class="empty-panel"><p><strong>Nothing uploaded yet.</strong></p><p class="muted">Files you attach to posts, projects and your profile all appear here.</p></div>
<?php else: ?>
<div class="media-grid">
  <?php foreach ($files as $f): ?>
    <figure class="media-item">
      <div class="media-thumb">
        <?php if ($f['is_image']): ?>
          <img src="<?= e(media($f['path'])) ?>" alt="<?= e($f['name']) ?>" loading="lazy">
        <?php else: ?>
          <span><?= icon('download') ?></span>
        <?php endif; ?>
      </div>
      <figcaption>
        <strong title="<?= e($f['name']) ?>"><?= e($f['name']) ?></strong>
        <small><?= e(Upload::humanSize($f['size'])) ?> · <?= e(date('M j, Y', $f['modified'])) ?></small>
        <div class="media-actions">
          <button class="btn btn-ghost btn-xs copy-path" type="button" data-path="<?= e($f['path']) ?>">Copy path</button>
          <a class="btn btn-ghost btn-xs" href="<?= e(media($f['path'])) ?>" target="_blank" rel="noopener">Open</a>
          <form method="post" action="<?= e(url('/admin/?page=media&action=delete')) ?>" class="inline-form" data-confirm="Delete this file? Anything using it will show a broken image.">
            <?= Csrf::field() ?>
            <input type="hidden" name="path" value="<?= e($f['path']) ?>">
            <button class="btn btn-danger btn-xs" type="submit">Delete</button>
          </form>
        </div>
      </figcaption>
    </figure>
  <?php endforeach; ?>
</div>
<?php endif; ?>
