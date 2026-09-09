<?php
/** Admin authentication with a simple per-IP login throttle. */
class Auth
{
    private const MAX_ATTEMPTS = 6;
    private const LOCK_SECONDS = 900;

    public static function attempt(string $email, string $password): bool
    {
        if (self::isLocked()) {
            return false;
        }
        $user = Database::first('SELECT * FROM users WHERE email = ? AND is_active = 1', [strtolower(trim($email))]);
        if (!$user || !password_verify($password, $user['password_hash'])) {
            self::recordFailure();
            return false;
        }

        if (password_needs_rehash($user['password_hash'], PASSWORD_DEFAULT)) {
            Database::run('UPDATE users SET password_hash = ? WHERE id = ?', [
                password_hash($password, PASSWORD_DEFAULT), $user['id'],
            ]);
        }

        session_regenerate_id(true);
        $_SESSION['user_id']   = (int) $user['id'];
        $_SESSION['user_name'] = $user['name'];
        $_SESSION['user_role'] = $user['role'];
        unset($_SESSION['login_attempts'], $_SESSION['login_locked_until']);

        Database::run('UPDATE users SET last_login_at = ? WHERE id = ?', [date('Y-m-d H:i:s'), $user['id']]);
        return true;
    }

    public static function logout(): void
    {
        $_SESSION = [];
        if (ini_get('session.use_cookies')) {
            $p = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000, $p['path'], $p['domain'], $p['secure'], $p['httponly']);
        }
        session_destroy();
    }

    public static function check(): bool
    {
        return !empty($_SESSION['user_id']);
    }

    public static function user(): ?array
    {
        if (!self::check()) {
            return null;
        }
        return Database::first('SELECT * FROM users WHERE id = ?', [$_SESSION['user_id']]);
    }

    public static function id(): int
    {
        return (int) ($_SESSION['user_id'] ?? 0);
    }

    public static function isAdmin(): bool
    {
        return ($_SESSION['user_role'] ?? '') === 'admin';
    }

    public static function requireLogin(): void
    {
        if (!self::check()) {
            $_SESSION['intended'] = $_SERVER['REQUEST_URI'] ?? '';
            redirect('/admin/?page=login');
        }
    }

    public static function requireAdmin(): void
    {
        self::requireLogin();
        if (!self::isAdmin()) {
            http_response_code(403);
            exit('Only an administrator can open this page.');
        }
    }

    public static function isLocked(): bool
    {
        return !empty($_SESSION['login_locked_until']) && $_SESSION['login_locked_until'] > time();
    }

    public static function lockRemaining(): int
    {
        return self::isLocked() ? (int) ceil(($_SESSION['login_locked_until'] - time()) / 60) : 0;
    }

    private static function recordFailure(): void
    {
        $_SESSION['login_attempts'] = ($_SESSION['login_attempts'] ?? 0) + 1;
        if ($_SESSION['login_attempts'] >= self::MAX_ATTEMPTS) {
            $_SESSION['login_locked_until'] = time() + self::LOCK_SECONDS;
            $_SESSION['login_attempts']     = 0;
        }
    }
}
