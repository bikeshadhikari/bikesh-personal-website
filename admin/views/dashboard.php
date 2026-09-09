<div class="welcome-card">
  <div>
    <h2>Welcome back, <?= e(explode(' ', (string) Auth::user()['name'])[0]) ?>.</h2>
    <p>Everything on the public site is controlled from here. Start with <a href="<?= e(url('/admin/?page=menus')) ?>">Menus &amp; sections</a> to switch parts of the site on or off.</p>
  </div>
  <div class="welcome-actions">
    <a class="btn btn-primary btn-sm" href="<?= e(url('/admin/?page=posts&action=create')) ?>">Write a post</a>
    <a class="btn btn-ghost btn-sm" href="<?= e(url('/')) ?>" target="_blank" rel="noopener">View site</a>
  </div>
</div>

<div class="stat-grid">
  <?php foreach ($stats as $s): ?>
    <a class="stat-card" href="<?= e(url('/admin/?page=' . $s['link'])) ?>">
      <span class="stat-icon"><?= icon($s['icon']) ?></span>
      <strong><?= (int) $s['value'] ?></strong>
      <span class="stat-label"><?= e($s['label']) ?></span>
    </a>
  <?php endforeach; ?>
</div>

<?php if ($disabled): ?>
<div class="panel panel-notice">
  <h3><?= icon('eye', 'icon icon-sm') ?> Currently hidden from visitors</h3>
  <p>These pages and sections are switched off. Turn any of them back on under Menus &amp; sections.</p>
  <ul class="chip-row">
    <?php foreach ($disabled as $d): ?>
      <li><span class="chip chip-soft"><?= e($d['label']) ?> <small><?= e($d['kind']) ?></small></span></li>
    <?php endforeach; ?>
  </ul>
</div>
<?php endif; ?>

<div class="panel-grid">
  <section class="panel">
    <div class="panel-head"><h3>Recent posts</h3><a href="<?= e(url('/admin/?page=posts')) ?>">All posts</a></div>
    <?php if ($recentPosts): ?>
    <table class="data-table compact">
      <tbody>
      <?php foreach ($recentPosts as $p): ?>
        <tr>
          <td><a href="<?= e(url('/admin/?page=posts&action=edit&id=' . $p['id'])) ?>"><?= e($p['title']) ?></a></td>
          <td><span class="status status-<?= e($p['status']) ?>"><?= e($p['status']) ?></span></td>
          <td class="num"><?= (int) $p['views'] ?> views</td>
        </tr>
      <?php endforeach; ?>
      </tbody>
    </table>
    <?php else: ?><p class="muted">No posts yet. <a href="<?= e(url('/admin/?page=posts&action=create')) ?>">Write the first one.</a></p><?php endif; ?>
  </section>

  <section class="panel">
    <div class="panel-head"><h3>Latest messages</h3><a href="<?= e(url('/admin/?page=messages')) ?>">Inbox</a></div>
    <?php if ($recentMessages): ?>
    <table class="data-table compact">
      <tbody>
      <?php foreach ($recentMessages as $m): ?>
        <tr class="<?= (int) $m['is_read'] === 0 ? 'is-unread' : '' ?>">
          <td><a href="<?= e(url('/admin/?page=messages&action=view&id=' . $m['id'])) ?>"><?= e($m['name']) ?></a><br><small class="muted"><?= e($m['subject'] ?: 'No subject') ?></small></td>
          <td class="num"><?= e(formatDate($m['created_at'], 'M j')) ?></td>
        </tr>
      <?php endforeach; ?>
      </tbody>
    </table>
    <?php else: ?><p class="muted">No messages yet.</p><?php endif; ?>
  </section>

  <section class="panel">
    <div class="panel-head"><h3>Most read</h3></div>
    <?php if ($popular && (int) $popular[0]['views'] > 0): ?>
    <ul class="rank-list">
      <?php foreach ($popular as $i => $p): if ((int) $p['views'] === 0) continue; ?>
        <li><span class="rank"><?= $i + 1 ?></span><a href="<?= e(url('/admin/?page=posts&action=edit&id=' . $p['id'])) ?>"><?= e($p['title']) ?></a><em><?= (int) $p['views'] ?></em></li>
      <?php endforeach; ?>
    </ul>
    <?php else: ?><p class="muted">View counts appear once people start reading.</p><?php endif; ?>
  </section>

  <section class="panel">
    <div class="panel-head"><h3>Quick actions</h3></div>
    <ul class="quick-links">
      <li><a href="<?= e(url('/admin/?page=posts&action=create')) ?>"><?= icon('quote', 'icon icon-sm') ?> Write a blog post</a></li>
      <li><a href="<?= e(url('/admin/?page=experiences&action=create')) ?>"><?= icon('briefcase', 'icon icon-sm') ?> Add an experience entry</a></li>
      <li><a href="<?= e(url('/admin/?page=projects&action=create')) ?>"><?= icon('code', 'icon icon-sm') ?> Add a project</a></li>
      <li><a href="<?= e(url('/admin/?page=profile')) ?>"><?= icon('users', 'icon icon-sm') ?> Edit profile and photo</a></li>
      <li><a href="<?= e(url('/admin/?page=settings')) ?>"><?= icon('compass', 'icon icon-sm') ?> Site settings and favicon</a></li>
    </ul>
  </section>
</div>
