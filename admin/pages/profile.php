<?php
/** Everything shown in the hero and the About page. */
$fields = [
    'full_name'      => ['type' => 'text', 'label' => 'Full name', 'required' => true],
    'name_native'    => ['type' => 'text', 'label' => 'Name in Nepali', 'hint' => 'Shown under your name in the hero. Leave empty to hide.'],
    'headline'       => ['type' => 'text', 'label' => 'Headline', 'width' => 'full', 'hint' => 'The one-line description of what you are.'],
    'rotating_roles' => ['type' => 'textarea', 'label' => 'Rotating roles', 'rows' => 5, 'width' => 'full', 'hint' => 'One per line. They type themselves out in the hero.'],
    'availability'   => ['type' => 'text', 'label' => 'Availability note', 'width' => 'full', 'hint' => 'The small green-dot line above your name. Leave empty to hide it.'],
    'hero_intro'     => ['type' => 'textarea', 'label' => 'Hero introduction', 'rows' => 4, 'width' => 'full'],
    'about_lead'     => ['type' => 'textarea', 'label' => 'About: opening line', 'rows' => 2, 'width' => 'full'],
    'about_body'     => ['type' => 'textarea', 'label' => 'About: full biography', 'rows' => 12, 'width' => 'full', 'hint' => 'Leave a blank line between paragraphs.'],
    'photo'          => ['type' => 'image', 'label' => 'Profile photo', 'folder' => 'profile', 'hint' => 'Portrait orientation works best, around 800×1000 pixels.'],
    'photo_alt'      => ['type' => 'text', 'label' => 'Photo description', 'hint' => 'For screen readers. Defaults to your name.'],
    'cv_file'        => ['type' => 'file', 'label' => 'CV / résumé', 'folder' => 'site', 'hint' => 'PDF. A download button appears once this is set.'],
    'years_started'  => ['type' => 'text', 'label' => 'Working since', 'hint' => 'A year, e.g. 2014.'],
];

$errors = [];
if (isPost()) {
    Csrf::verify();
    $values = [];
    foreach ($fields as $key => $field) {
        if (in_array($field['type'], ['image', 'file'], true)) {
            if (postBool('remove_' . $key)) {
                Upload::remove(Settings::get($key, ''));
                $values[$key] = '';
                continue;
            }
            try {
                $uploaded = Upload::handle($key, $field['folder'] ?? 'site');
            } catch (Throwable $e) {
                $errors[$key] = $e->getMessage();
                continue;
            }
            if ($uploaded !== null) {
                Upload::remove(Settings::get($key, ''));
                $values[$key] = $uploaded;
            }
            continue;
        }
        $values[$key] = post($key);
        if (!empty($field['required']) && $values[$key] === '') {
            $errors[$key] = ($field['label']) . ' is required.';
        }
    }

    if (!$errors) {
        Settings::setMany($values, 'profile');
        Settings::set('site_name', $values['full_name'] ?? Settings::get('site_name'), 'site');
        App::bumpAssetVersion();
        flash('Profile updated.');
        redirect('/admin/?page=profile');
    }
}

adminView('settings-form', [
    'pageTitle' => 'Profile & bio',
    'intro'     => 'This is the content of your hero banner and your About page.',
    'groups'    => [['title' => 'Your profile', 'fields' => $fields]],
    'errors'    => $errors,
    'formAction'=> url('/admin/?page=profile'),
]);
