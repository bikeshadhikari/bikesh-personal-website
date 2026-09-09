<?php
/**
 * Contact notifications. Messages are always stored in the dashboard; email is
 * a best-effort extra, because shared hosts throttle or silently drop mail().
 */
class Mailer
{
    public static function notifyNewMessage(array $message): bool
    {
        if (App::config('mail.transport', 'none') !== 'mail' || !function_exists('mail')) {
            return false;
        }
        $to = trim((string) Settings::get('notify_email', '')) ?: (string) App::config('mail.to', '');
        if ($to === '' || !filter_var($to, FILTER_VALIDATE_EMAIL)) {
            return false;
        }

        $from     = (string) App::config('mail.from', 'no-reply@localhost');
        $fromName = (string) App::config('mail.from_name', 'Website');
        $subject  = 'New enquiry: ' . ($message['subject'] ?: 'Website contact form');

        $body = "You have a new message from your website.\n\n"
              . "Name:    {$message['name']}\n"
              . "Email:   {$message['email']}\n"
              . "Phone:   " . ($message['phone'] ?: '-') . "\n"
              . "Subject: " . ($message['subject'] ?: '-') . "\n"
              . "Sent:    {$message['created_at']}\n\n"
              . "-------------------------------------\n"
              . $message['body'] . "\n"
              . "-------------------------------------\n\n"
              . 'Read it in the dashboard: ' . url('/admin/?page=messages');

        $headers = [
            'From: ' . self::encodeName($fromName) . ' <' . $from . '>',
            'Reply-To: ' . $message['email'],
            'Content-Type: text/plain; charset=UTF-8',
            'MIME-Version: 1.0',
        ];

        return @mail($to, self::encodeHeader($subject), $body, implode("\r\n", $headers));
    }

    private static function encodeName(string $name): string
    {
        return preg_match('/[^\x20-\x7E]/', $name) ? self::encodeHeader($name) : $name;
    }

    private static function encodeHeader(string $text): string
    {
        return '=?UTF-8?B?' . base64_encode($text) . '?=';
    }
}
