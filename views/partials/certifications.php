<?php /** @var array $certs */ if (!empty($certs)): ?>
<ul class="cert-list">
  <?php foreach ($certs as $c): ?>
    <li class="cert-item">
      <span class="cert-icon"><?= icon('award') ?></span>
      <div>
        <h3><?= e($c['title']) ?></h3>
        <p>
          <?php if ($c['issuer']): ?><?= e($c['issuer']) ?><?php endif; ?>
          <?php if ($c['issue_date']): ?><span class="dot-sep">·</span><?= e(formatDate($c['issue_date'], 'F Y')) ?><?php endif; ?>
        </p>
        <?php if ($c['credential_url']): ?>
          <a class="btn btn-link" href="<?= e($c['credential_url']) ?>" target="_blank" rel="noopener noreferrer">View credential <?= icon('external', 'icon icon-xs') ?></a>
        <?php endif; ?>
      </div>
    </li>
  <?php endforeach; ?>
</ul>
<?php endif; ?>
