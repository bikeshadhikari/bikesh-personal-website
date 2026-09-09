<?php
require_once App::root() . '/views/partials/icons.php';
$meta        = View::meta(get_defined_vars());
$siteName    = Settings::get('site_name', 'Portfolio');
$favicon     = Settings::get('favicon', '');
$accent      = Settings::get('theme_accent', '#2563eb');
$accentAlt   = Settings::get('theme_accent_alt', '#0ea5e9');
$defaultMode = Settings::get('default_mode', 'light');
$ogImage     = $meta['image'] ? media($meta['image']) : '';
$ga          = trim((string) Settings::get('google_analytics', ''));
$indexable   = Settings::bool('search_indexing', true);
?>
<!doctype html>
<html lang="en" data-default-mode="<?= e($defaultMode) ?>">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title><?= e($meta['title']) ?></title>
<meta name="description" content="<?= e($meta['description']) ?>">
<?php if (Settings::get('meta_keywords')): ?>
<meta name="keywords" content="<?= e(Settings::get('meta_keywords')) ?>">
<?php endif; ?>
<meta name="author" content="<?= e(Settings::get('full_name', $siteName)) ?>">
<?php if (!$indexable): ?><meta name="robots" content="noindex, nofollow"><?php endif; ?>
<?php if (!empty($meta['canonical'])): ?><link rel="canonical" href="<?= e($meta['canonical']) ?>"><?php endif; ?>

<meta property="og:site_name" content="<?= e($siteName) ?>">
<meta property="og:type" content="<?= e($meta['type']) ?>">
<meta property="og:title" content="<?= e($meta['title']) ?>">
<meta property="og:description" content="<?= e($meta['description']) ?>">
<?php if ($ogImage): ?><meta property="og:image" content="<?= e($ogImage) ?>"><?php endif; ?>
<meta name="twitter:card" content="<?= $ogImage ? 'summary_large_image' : 'summary' ?>">

<link rel="icon" href="<?= $favicon ? e(media($favicon)) : e(url('/assets/img/favicon.svg')) ?>" type="<?= $favicon ? 'image/x-icon' : 'image/svg+xml' ?>">
<link rel="apple-touch-icon" href="<?= e(url('/assets/img/apple-touch-icon.png')) ?>">
<link rel="manifest" href="<?= e(url('/site.webmanifest')) ?>">
<link rel="alternate" type="application/rss+xml" title="<?= e($siteName) ?> RSS" href="<?= e(url('/feed')) ?>">

<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Source+Serif+4:opsz,wght@8..60,400;8..60,600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="<?= e(asset('assets/css/site.css')) ?>">
<style>:root{--accent:<?= e($accent) ?>;--accent-alt:<?= e($accentAlt) ?>;}</style>
<script>
// Applied before paint so the theme never flashes.
(function(){try{var s=localStorage.getItem('theme');var d=document.documentElement.getAttribute('data-default-mode')||'light';
document.documentElement.setAttribute('data-theme', s|| (d==='auto'?(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):d));}catch(e){}})();
</script>
<script type="application/ld+json">
<?= json_encode([
    '@context' => 'https://schema.org',
    '@type'    => 'Person',
    'name'     => Settings::get('full_name', $siteName),
    'jobTitle' => Settings::get('headline', ''),
    'url'      => url('/'),
    'image'    => Settings::get('photo') ? media(Settings::get('photo')) : null,
    'email'    => Settings::get('contact_email') ? 'mailto:' . Settings::get('contact_email') : null,
    'address'  => ['@type' => 'PostalAddress', 'addressLocality' => Settings::get('contact_location', '')],
    'sameAs'   => array_values(array_column(Settings::socials(), 'url')),
], JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT) ?>
</script>
<?php if ($ga): ?>
<script async src="https://www.googletagmanager.com/gtag/js?id=<?= e($ga) ?>"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','<?= e($ga) ?>');</script>
<?php endif; ?>
</head>
<body class="<?= !empty($isHome) ? 'is-home' : 'is-inner' ?>">
<a class="skip-link" href="#main">Skip to content</a>
<?php View::partial('partials/header'); ?>
<main id="main"><?= $content ?></main>
<?php View::partial('partials/footer'); ?>
<button class="to-top" id="toTop" type="button" aria-label="Back to top"><?= icon('arrow-up') ?></button>
<script src="<?= e(asset('assets/js/site.js')) ?>" defer></script>
</body>
</html>
