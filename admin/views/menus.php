<div class="page-head">
  <div>
    <h2>Menus &amp; sections</h2>
    <p class="muted">One switch per page and per home-page block. Turning something off removes it from the navigation and makes its address return "page not found".</p>
  </div>
</div>

<form method="post" class="admin-form">
  <?= Csrf::field() ?>
  <input type="hidden" name="bulk" value="1">

  <section class="form-panel">
    <div class="panel-head">
      <h3><?= icon('layers', 'icon icon-sm') ?> Pages</h3>
      <span class="muted">These appear in the top navigation and have their own address.</span>
    </div>

    <div class="table-wrap">
      <table class="data-table menu-table">
        <thead>
          <tr><th>Page</th><th>Menu label</th><th class="num">Order</th><th>In navbar</th><th>Live</th><th>Address</th></tr>
        </thead>
        <tbody>
        <?php foreach ($pages as $m): ?>
          <tr class="<?= (int) $m['enabled'] === 0 ? 'is-off' : '' ?>">
            <td>
              <strong><?= e($m['slug']) ?></strong>
              <?php if ((int) $m['locked'] === 1): ?><span class="chip chip-soft">always on</span><?php endif; ?>
              <?php if ($m['description']): ?><br><small class="muted"><?= e($m['description']) ?></small><?php endif; ?>
            </td>
            <td><input type="text" name="items[<?= (int) $m['id'] ?>][label]" value="<?= e($m['label']) ?>" aria-label="Label for <?= e($m['slug']) ?>"></td>
            <td class="num"><input type="number" class="input-narrow" name="items[<?= (int) $m['id'] ?>][sort_order]" value="<?= (int) $m['sort_order'] ?>" aria-label="Sort order"></td>
            <td>
              <label class="checkbox small"><input type="checkbox" name="items[<?= (int) $m['id'] ?>][in_nav]" value="1"<?= (int) $m['in_nav'] === 1 ? ' checked' : '' ?>><span>Show</span></label>
            </td>
            <td>
              <?php if ((int) $m['locked'] === 1): ?>
                <span class="status status-published">on</span>
              <?php else: ?>
                <label class="switch-label">
                  <input type="checkbox" class="switch-input" name="items[<?= (int) $m['id'] ?>][enabled]" value="1"<?= (int) $m['enabled'] === 1 ? ' checked' : '' ?>>
                  <span class="switch"><span></span></span>
                </label>
              <?php endif; ?>
            </td>
            <td>
              <?php if ((int) $m['enabled'] === 1): ?>
                <a href="<?= e(Menu::pageUrl($m)) ?>" target="_blank" rel="noopener"><code>/<?= e($m['slug'] === 'home' ? '' : $m['slug']) ?></code></a>
              <?php else: ?>
                <span class="muted">hidden</span>
              <?php endif; ?>
            </td>
          </tr>
        <?php endforeach; ?>
        </tbody>
      </table>
    </div>
  </section>

  <section class="form-panel">
    <div class="panel-head">
      <h3><?= icon('code', 'icon icon-sm') ?> Home page sections</h3>
      <span class="muted">Blocks stacked down the home page, in the order set here.</span>
    </div>

    <div class="table-wrap">
      <table class="data-table menu-table">
        <thead>
          <tr><th>Section</th><th>Heading</th><th class="num">Order</th><th>Live</th></tr>
        </thead>
        <tbody>
        <?php foreach ($sections as $m): ?>
          <tr class="<?= (int) $m['enabled'] === 0 ? 'is-off' : '' ?>">
            <td>
              <strong><?= e($m['slug']) ?></strong>
              <?php if ((int) $m['locked'] === 1): ?><span class="chip chip-soft">always on</span><?php endif; ?>
              <?php if ($m['description']): ?><br><small class="muted"><?= e($m['description']) ?></small><?php endif; ?>
            </td>
            <td>
              <input type="text" name="items[<?= (int) $m['id'] ?>][label]" value="<?= e($m['label']) ?>" aria-label="Heading for <?= e($m['slug']) ?>">
              <input type="hidden" name="items[<?= (int) $m['id'] ?>][in_nav]" value="0">
            </td>
            <td class="num"><input type="number" class="input-narrow" name="items[<?= (int) $m['id'] ?>][sort_order]" value="<?= (int) $m['sort_order'] ?>" aria-label="Sort order"></td>
            <td>
              <?php if ((int) $m['locked'] === 1): ?>
                <span class="status status-published">on</span>
              <?php else: ?>
                <label class="switch-label">
                  <input type="checkbox" class="switch-input" name="items[<?= (int) $m['id'] ?>][enabled]" value="1"<?= (int) $m['enabled'] === 1 ? ' checked' : '' ?>>
                  <span class="switch"><span></span></span>
                </label>
              <?php endif; ?>
            </td>
          </tr>
        <?php endforeach; ?>
        </tbody>
      </table>
    </div>
  </section>

  <div class="form-actions">
    <button class="btn btn-primary" type="submit">Save changes</button>
    <a class="btn btn-link" href="<?= e(url('/')) ?>" target="_blank" rel="noopener">Preview the site</a>
  </div>
</form>

<div class="panel panel-notice">
  <h3><?= icon('sparkle', 'icon icon-sm') ?> How the switches behave</h3>
  <ul class="plain-list">
    <li><strong>Blog off</strong> removes it from the navigation, blocks <code>/blog</code> and every article address, hides the latest-writing block and drops the posts from the sitemap and RSS feed.</li>
    <li><strong>A section off</strong> only hides that block on the home page. The full page, if it has one, stays reachable.</li>
    <li><strong>In navbar off</strong> keeps a page working at its address but hides it from the menu — useful for a page you link to yourself.</li>
    <li>The home page cannot be switched off. To take the whole site down temporarily, use maintenance mode under Settings.</li>
  </ul>
</div>
