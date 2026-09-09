<?php
/** Newsletter signup. Always answers JSON so the footer form stays on the page. */
header('Content-Type: application/json; charset=UTF-8');

if (!isPost()) {
    http_response_code(405);
    echo json_encode(['ok' => false, 'message' => 'Method not allowed.']);
    exit;
}
if (!Csrf::check()) {
    http_response_code(419);
    echo json_encode(['ok' => false, 'message' => 'Your session expired. Please reload the page.']);
    exit;
}
if (!Settings::bool('newsletter_enabled', true) || !Menu::enabled('newsletter')) {
    echo json_encode(['ok' => false, 'message' => 'Signups are closed at the moment.']);
    exit;
}

$email = strtolower(post('email'));
if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['ok' => false, 'message' => 'Please enter a valid email address.']);
    exit;
}
if (post('website') !== '') {
    echo json_encode(['ok' => true, 'message' => 'Thank you for subscribing.']);
    exit;
}

$exists = (int) Database::value('SELECT COUNT(*) FROM subscribers WHERE email = ?', [$email], 0);
if ($exists === 0) {
    Database::insert('subscribers', [
        'email' => mb_substr($email, 0, 190), 'is_active' => 1, 'created_at' => date('Y-m-d H:i:s'),
    ]);
}
echo json_encode(['ok' => true, 'message' => 'You are on the list. Thank you.']);
