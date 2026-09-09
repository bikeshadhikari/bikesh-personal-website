<?php
class Csrf
{
    public static function token(): string
    {
        if (empty($_SESSION['csrf_token'])) {
            $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
        }
        return $_SESSION['csrf_token'];
    }

    public static function field(): string
    {
        return '<input type="hidden" name="_token" value="' . e(self::token()) . '">';
    }

    public static function check(): bool
    {
        $sent = $_POST['_token'] ?? ($_SERVER['HTTP_X_CSRF_TOKEN'] ?? '');
        return is_string($sent) && $sent !== '' && hash_equals(self::token(), $sent);
    }

    /** Abort the request when a POST arrives without a valid token. */
    public static function verify(): void
    {
        if (!self::check()) {
            http_response_code(419);
            exit('Your session expired. Please go back, reload the page and try again.');
        }
    }
}
