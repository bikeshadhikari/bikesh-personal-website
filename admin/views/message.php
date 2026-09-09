<div class="page-head">
  <div>
    <h2><?= e($message['subject'] ?: 'Message') ?></h2>
    <p class="muted"><a href="<?= e(url('/admin/?page=messages')) ?>">← Back to the inbox</a></p>
  </div>
  <div class="page-head-actions">
    <a class="btn btn-primary btn-sm" href="mailto:<?= e($message['email']) ?>?subject=<?= rawurlencode('Re: ' . ($message['subject'] ?: 'Your message')) ?>">Reply by email</a>
    <form method="post" action="<?= e(url('/admin/?page=messages&action=unread&id=' . $message['id'])) ?>" class="inline-form">
      <?= Csrf::field() ?><button class="btn btn-ghost btn-sm" type="submit">Mark unread</button>
    </form>
  </div>
</div>

<article class="form-panel message-view">
  <dl class="message-meta">
    <div><dt>From</dt><dd><?= e($message['name']) ?></dd></div>
    <div><dt>Email</dt><dd><a href="mailto:<?= e($message['email']) ?>"><?= e($message['email']) ?></a></dd></div>
    <?php if ($message['phone']): ?><div><dt>Phone</dt><dd><a href="tel:<?= e(preg_replace('/[^0-9+]/', '', $message['phone'])) ?>"><?= e($message['phone']) ?></a></dd></div><?php endif; ?>
    <div><dt>Received</dt><dd><?= e(formatDate($message['created_at'], 'F j, Y \a\t g:i a')) ?></dd></div>
    <?php if ($message['ip']): ?><div><dt>IP address</dt><dd><code><?= e($message['ip']) ?></code></dd></div><?php endif; ?>
  </dl>

  <div class="message-body"><?= nl2br(e($message['body'])) ?></div>

  <div class="form-actions">
    <a class="btn btn-primary" href="mailto:<?= e($message['email']) ?>?subject=<?= rawurlencode('Re: ' . ($message['subject'] ?: 'Your message')) ?>">Reply</a>
    <form method="post" action="<?= e(url('/admin/?page=messages&action=delete&id=' . $message['id'])) ?>" class="inline-form" data-confirm="Delete this message permanently?">
      <?= Csrf::field() ?><button class="btn btn-danger" type="submit">Delete</button>
    </form>
  </div>
</article>
