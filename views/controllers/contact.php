<?php
$errors = [];
$sent   = false;
$values = ['name' => '', 'email' => '', 'phone' => '', 'subject' => '', 'body' => ''];

if (isPost() && isset($_POST['contact_form'])) {
    Csrf::verify();
    foreach ($values as $key => $_) {
        $values[$key] = post($key);
    }

    if (post('website') !== '') {
        $errors[] = 'Your message could not be sent.';           // honeypot
    }
    if ($values['name'] === '') {
        $errors['name'] = 'Please tell me your name.';
    }
    if ($values['email'] === '' || !filter_var($values['email'], FILTER_VALIDATE_EMAIL)) {
        $errors['email'] = 'A valid email address is needed so I can reply.';
    }
    if (mb_strlen($values['body']) < 10) {
        $errors['body'] = 'Please write a little more detail.';
    }
    if (mb_strlen($values['body']) > 5000) {
        $errors['body'] = 'Please keep the message under 5000 characters.';
    }
    // One submission per minute per session.
    if (!empty($_SESSION['last_contact_at']) && time() - $_SESSION['last_contact_at'] < 60) {
        $errors[] = 'You just sent a message. Please wait a minute before sending another.';
    }

    if (!$errors) {
        $record = [
            'name'       => mb_substr($values['name'], 0, 140),
            'email'      => mb_substr($values['email'], 0, 190),
            'phone'      => mb_substr($values['phone'], 0, 60),
            'subject'    => mb_substr($values['subject'], 0, 200),
            'body'       => $values['body'],
            'ip'         => clientIp(),
            'is_read'    => 0,
            'is_starred' => 0,
            'created_at' => date('Y-m-d H:i:s'),
        ];
        Database::insert('messages', $record);
        Mailer::notifyNewMessage($record);
        $_SESSION['last_contact_at'] = time();
        $sent   = true;
        $values = array_map(static fn() => '', $values);
    }
}

View::render('pages/contact', [
    'title'       => 'Contact — ' . Settings::get('site_name'),
    'description' => Settings::get('contact_intro', ''),
    'errors'      => $errors,
    'sent'        => $sent,
    'values'      => $values,
]);
