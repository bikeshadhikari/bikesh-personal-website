<?php
/** Site identity, contact details, social links, SEO, appearance and blog rules. */
$groups = [
    'site' => [
        'title'  => 'Site identity',
        'fields' => [
            'site_name'       => ['type' => 'text', 'label' => 'Site name', 'required' => true],
            'site_short_name' => ['type' => 'text', 'label' => 'Short name', 'hint' => 'Used in the dashboard and on phone home screens.'],
            'site_tagline'    => ['type' => 'text', 'label' => 'Tagline', 'width' => 'full'],
            'logo_text'       => ['type' => 'text', 'label' => 'Logo text', 'hint' => 'A &lt;span&gt; inside it is coloured with your accent.'],
            'logo_image'      => ['type' => 'image', 'label' => 'Logo image', 'folder' => 'site', 'hint' => 'Replaces the text logo. Around 200×60 pixels.'],
            'favicon'         => ['type' => 'image', 'label' => 'Favicon', 'folder' => 'site', 'hint' => 'The small browser-tab icon. A square PNG, SVG or .ico, 64×64 or larger. Leave empty to use the built-in one.'],
            'footer_note'     => ['type' => 'text', 'label' => 'Footer note', 'width' => 'full'],
        ],
    ],
    'contact' => [
        'title'  => 'Contact details',
        'fields' => [
            'contact_email'    => ['type' => 'text', 'label' => 'Public email'],
            'contact_phone'    => ['type' => 'text', 'label' => 'Phone', 'hint' => 'Leave empty to hide it everywhere.'],
            'contact_location' => ['type' => 'text', 'label' => 'Location'],
            'contact_hours'    => ['type' => 'text', 'label' => 'Usual hours'],
            'contact_intro'    => ['type' => 'textarea', 'label' => 'Contact page introduction', 'rows' => 3, 'width' => 'full'],
            'notify_email'     => ['type' => 'text', 'label' => 'Send new enquiries to', 'hint' => 'Leave empty to only keep them in the dashboard inbox.'],
            'map_embed'        => ['type' => 'textarea', 'label' => 'Map embed code', 'rows' => 3, 'width' => 'full', 'hint' => 'Paste the &lt;iframe&gt; from Google Maps. Leave empty to hide the map.'],
        ],
    ],
    'social' => [
        'title'  => 'Social links',
        'note'   => 'Only the ones you fill in are shown.',
        'fields' => [
            'social_linkedin'  => ['type' => 'url', 'label' => 'LinkedIn'],
            'social_facebook'  => ['type' => 'url', 'label' => 'Facebook'],
            'social_instagram' => ['type' => 'url', 'label' => 'Instagram'],
            'social_youtube'   => ['type' => 'url', 'label' => 'YouTube'],
            'social_github'    => ['type' => 'url', 'label' => 'GitHub'],
            'social_twitter'   => ['type' => 'url', 'label' => 'X / Twitter'],
            'social_tiktok'    => ['type' => 'url', 'label' => 'TikTok'],
        ],
    ],
    'seo' => [
        'title'  => 'Search engines & analytics',
        'fields' => [
            'meta_title'       => ['type' => 'text', 'label' => 'Default page title', 'width' => 'full'],
            'meta_description' => ['type' => 'textarea', 'label' => 'Default description', 'rows' => 2, 'width' => 'full', 'hint' => 'Around 155 characters.'],
            'meta_keywords'    => ['type' => 'text', 'label' => 'Keywords', 'width' => 'full'],
            'og_image'         => ['type' => 'image', 'label' => 'Share image', 'folder' => 'site', 'hint' => 'Shown when a link is shared. 1200×630 pixels.'],
            'google_analytics' => ['type' => 'text', 'label' => 'Google Analytics ID', 'hint' => 'Looks like G-XXXXXXXXXX. Leave empty for no tracking.'],
            'search_indexing'  => ['type' => 'checkbox', 'label' => 'Allow search engines to index this site', 'default' => 1],
        ],
    ],
    'appearance' => [
        'title'  => 'Appearance',
        'fields' => [
            'theme_accent'     => ['type' => 'color', 'label' => 'Accent colour', 'default' => '#2563eb'],
            'theme_accent_alt' => ['type' => 'color', 'label' => 'Secondary colour', 'default' => '#0ea5e9'],
            'default_mode'     => ['type' => 'select', 'label' => 'Default theme', 'options' => ['light' => 'Light', 'dark' => 'Dark', 'auto' => 'Follow the visitor\'s device']],
            'show_mode_toggle' => ['type' => 'checkbox', 'label' => 'Let visitors switch between light and dark', 'default' => 1],
        ],
    ],
    'blog' => [
        'title'  => 'Blog',
        'fields' => [
            'blog_title'         => ['type' => 'text', 'label' => 'Blog heading'],
            'posts_per_page'     => ['type' => 'number', 'label' => 'Posts per page', 'default' => 6, 'min' => 1, 'max' => 50],
            'blog_intro'         => ['type' => 'textarea', 'label' => 'Blog introduction', 'rows' => 2, 'width' => 'full'],
            'comments_enabled'   => ['type' => 'checkbox', 'label' => 'Allow comments on posts', 'default' => 1],
            'comments_moderated' => ['type' => 'checkbox', 'label' => 'Hold new comments for my approval', 'default' => 1],
            'newsletter_enabled' => ['type' => 'checkbox', 'label' => 'Show the newsletter signup', 'default' => 1],
        ],
    ],
    'maintenance' => [
        'title'  => 'Maintenance mode',
        'note'   => 'While this is on, visitors see a holding page. You stay able to browse the site while signed in.',
        'fields' => [
            'maintenance_mode' => ['type' => 'checkbox', 'label' => 'Take the site offline'],
            'maintenance_text' => ['type' => 'textarea', 'label' => 'Message for visitors', 'rows' => 2, 'width' => 'full'],
        ],
    ],
];

$errors = [];
if (isPost()) {
    Csrf::verify();
    foreach ($groups as $groupName => $group) {
        $values = [];
        foreach ($group['fields'] as $key => $field) {
            switch ($field['type']) {
                case 'image':
                case 'file':
                    if (postBool('remove_' . $key)) {
                        Upload::remove(Settings::get($key, ''));
                        $values[$key] = '';
                        break;
                    }
                    try {
                        $uploaded = Upload::handle($key, $field['folder'] ?? 'site');
                    } catch (Throwable $e) {
                        $errors[$key] = $e->getMessage();
                        break;
                    }
                    if ($uploaded !== null) {
                        Upload::remove(Settings::get($key, ''));
                        $values[$key] = $uploaded;
                    }
                    break;

                case 'checkbox':
                    $values[$key] = (string) postBool($key);
                    break;

                case 'number':
                    $n = (int) post($key, $field['default'] ?? 0);
                    if (isset($field['min'])) { $n = max((int) $field['min'], $n); }
                    if (isset($field['max'])) { $n = min((int) $field['max'], $n); }
                    $values[$key] = (string) $n;
                    break;

                case 'url':
                    $raw = post($key);
                    if ($raw !== '' && !preg_match('#^https?://#i', $raw)) {
                        $raw = 'https://' . $raw;
                    }
                    $values[$key] = $raw;
                    break;

                case 'textarea':
                    // The map embed is the one place a raw iframe is allowed.
                    $values[$key] = $key === 'map_embed'
                        ? strip_tags((string) ($_POST[$key] ?? ''), '<iframe>')
                        : post($key);
                    break;

                default:
                    $values[$key] = post($key);
            }

            if (!empty($field['required']) && ($values[$key] ?? '') === '') {
                $errors[$key] = $field['label'] . ' is required.';
            }
        }
        if (!$errors) {
            Settings::setMany($values, $groupName === 'maintenance' ? 'site' : $groupName);
        }
    }

    if (!$errors) {
        App::bumpAssetVersion();
        flash('Settings saved.');
        redirect('/admin/?page=settings');
    }
}

adminView('settings-form', [
    'pageTitle'  => 'Settings',
    'intro'      => 'Site-wide options. Every change takes effect on the public site as soon as you save.',
    'groups'     => array_values($groups),
    'errors'     => $errors,
    'formAction' => url('/admin/?page=settings'),
]);
