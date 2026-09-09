<?php
/**
 * Canonical schema, written once in MySQL syntax and translated for SQLite.
 * Every statement is CREATE TABLE IF NOT EXISTS so install.php is re-runnable.
 */
class Schema
{
    public static function statements(): array
    {
        return [
            'users' => "CREATE TABLE IF NOT EXISTS `users` (
                `id` INT AUTO_INCREMENT PRIMARY KEY,
                `name` VARCHAR(120) NOT NULL,
                `email` VARCHAR(190) NOT NULL UNIQUE,
                `password_hash` VARCHAR(255) NOT NULL,
                `role` VARCHAR(20) NOT NULL DEFAULT 'editor',
                `avatar` VARCHAR(255) DEFAULT NULL,
                `is_active` TINYINT(1) NOT NULL DEFAULT 1,
                `last_login_at` DATETIME DEFAULT NULL,
                `created_at` DATETIME DEFAULT NULL
            )",

            'settings' => "CREATE TABLE IF NOT EXISTS `settings` (
                `id` INT AUTO_INCREMENT PRIMARY KEY,
                `skey` VARCHAR(120) NOT NULL UNIQUE,
                `svalue` TEXT,
                `sgroup` VARCHAR(60) NOT NULL DEFAULT 'general'
            )",

            'menus' => "CREATE TABLE IF NOT EXISTS `menus` (
                `id` INT AUTO_INCREMENT PRIMARY KEY,
                `slug` VARCHAR(60) NOT NULL UNIQUE,
                `label` VARCHAR(80) NOT NULL,
                `kind` VARCHAR(20) NOT NULL DEFAULT 'page',
                `description` VARCHAR(255) DEFAULT NULL,
                `custom_url` VARCHAR(255) DEFAULT NULL,
                `in_nav` TINYINT(1) NOT NULL DEFAULT 1,
                `enabled` TINYINT(1) NOT NULL DEFAULT 1,
                `locked` TINYINT(1) NOT NULL DEFAULT 0,
                `sort_order` INT NOT NULL DEFAULT 0
            )",

            'categories' => "CREATE TABLE IF NOT EXISTS `categories` (
                `id` INT AUTO_INCREMENT PRIMARY KEY,
                `name` VARCHAR(120) NOT NULL,
                `slug` VARCHAR(140) NOT NULL UNIQUE,
                `description` VARCHAR(255) DEFAULT NULL,
                `color` VARCHAR(20) DEFAULT NULL,
                `sort_order` INT NOT NULL DEFAULT 0
            )",

            'posts' => "CREATE TABLE IF NOT EXISTS `posts` (
                `id` INT AUTO_INCREMENT PRIMARY KEY,
                `title` VARCHAR(220) NOT NULL,
                `slug` VARCHAR(240) NOT NULL UNIQUE,
                `excerpt` TEXT,
                `content` MEDIUMTEXT,
                `cover_image` VARCHAR(255) DEFAULT NULL,
                `category_id` INT DEFAULT NULL,
                `author_id` INT DEFAULT NULL,
                `tags` VARCHAR(255) DEFAULT NULL,
                `status` VARCHAR(20) NOT NULL DEFAULT 'draft',
                `is_featured` TINYINT(1) NOT NULL DEFAULT 0,
                `allow_comments` TINYINT(1) NOT NULL DEFAULT 1,
                `views` INT NOT NULL DEFAULT 0,
                `meta_title` VARCHAR(220) DEFAULT NULL,
                `meta_description` VARCHAR(320) DEFAULT NULL,
                `published_at` DATETIME DEFAULT NULL,
                `created_at` DATETIME DEFAULT NULL,
                `updated_at` DATETIME DEFAULT NULL
            )",

            'comments' => "CREATE TABLE IF NOT EXISTS `comments` (
                `id` INT AUTO_INCREMENT PRIMARY KEY,
                `post_id` INT NOT NULL,
                `name` VARCHAR(120) NOT NULL,
                `email` VARCHAR(190) DEFAULT NULL,
                `body` TEXT NOT NULL,
                `status` VARCHAR(20) NOT NULL DEFAULT 'pending',
                `ip` VARCHAR(45) DEFAULT NULL,
                `created_at` DATETIME DEFAULT NULL
            )",

            'experiences' => "CREATE TABLE IF NOT EXISTS `experiences` (
                `id` INT AUTO_INCREMENT PRIMARY KEY,
                `role` VARCHAR(180) NOT NULL,
                `organization` VARCHAR(180) DEFAULT NULL,
                `organization_url` VARCHAR(255) DEFAULT NULL,
                `location` VARCHAR(140) DEFAULT NULL,
                `track` VARCHAR(30) NOT NULL DEFAULT 'work',
                `employment_type` VARCHAR(60) DEFAULT NULL,
                `start_date` DATE DEFAULT NULL,
                `end_date` DATE DEFAULT NULL,
                `is_current` TINYINT(1) NOT NULL DEFAULT 0,
                `summary` TEXT,
                `highlights` TEXT,
                `logo` VARCHAR(255) DEFAULT NULL,
                `enabled` TINYINT(1) NOT NULL DEFAULT 1,
                `sort_order` INT NOT NULL DEFAULT 0
            )",

            'skills' => "CREATE TABLE IF NOT EXISTS `skills` (
                `id` INT AUTO_INCREMENT PRIMARY KEY,
                `name` VARCHAR(120) NOT NULL,
                `category` VARCHAR(80) NOT NULL DEFAULT 'General',
                `level` INT NOT NULL DEFAULT 70,
                `icon` VARCHAR(60) DEFAULT NULL,
                `enabled` TINYINT(1) NOT NULL DEFAULT 1,
                `sort_order` INT NOT NULL DEFAULT 0
            )",

            'services' => "CREATE TABLE IF NOT EXISTS `services` (
                `id` INT AUTO_INCREMENT PRIMARY KEY,
                `title` VARCHAR(160) NOT NULL,
                `summary` TEXT,
                `bullets` TEXT,
                `icon` VARCHAR(60) DEFAULT NULL,
                `price_note` VARCHAR(120) DEFAULT NULL,
                `enabled` TINYINT(1) NOT NULL DEFAULT 1,
                `sort_order` INT NOT NULL DEFAULT 0
            )",

            'projects' => "CREATE TABLE IF NOT EXISTS `projects` (
                `id` INT AUTO_INCREMENT PRIMARY KEY,
                `title` VARCHAR(180) NOT NULL,
                `slug` VARCHAR(200) NOT NULL UNIQUE,
                `summary` TEXT,
                `description` MEDIUMTEXT,
                `image` VARCHAR(255) DEFAULT NULL,
                `live_url` VARCHAR(255) DEFAULT NULL,
                `repo_url` VARCHAR(255) DEFAULT NULL,
                `tech` VARCHAR(255) DEFAULT NULL,
                `client` VARCHAR(160) DEFAULT NULL,
                `year` VARCHAR(20) DEFAULT NULL,
                `category` VARCHAR(80) DEFAULT NULL,
                `is_featured` TINYINT(1) NOT NULL DEFAULT 0,
                `enabled` TINYINT(1) NOT NULL DEFAULT 1,
                `sort_order` INT NOT NULL DEFAULT 0
            )",

            'certifications' => "CREATE TABLE IF NOT EXISTS `certifications` (
                `id` INT AUTO_INCREMENT PRIMARY KEY,
                `title` VARCHAR(200) NOT NULL,
                `issuer` VARCHAR(180) DEFAULT NULL,
                `issue_date` DATE DEFAULT NULL,
                `credential_id` VARCHAR(120) DEFAULT NULL,
                `credential_url` VARCHAR(255) DEFAULT NULL,
                `image` VARCHAR(255) DEFAULT NULL,
                `enabled` TINYINT(1) NOT NULL DEFAULT 1,
                `sort_order` INT NOT NULL DEFAULT 0
            )",

            'testimonials' => "CREATE TABLE IF NOT EXISTS `testimonials` (
                `id` INT AUTO_INCREMENT PRIMARY KEY,
                `name` VARCHAR(140) NOT NULL,
                `role` VARCHAR(180) DEFAULT NULL,
                `organization` VARCHAR(180) DEFAULT NULL,
                `quote` TEXT NOT NULL,
                `photo` VARCHAR(255) DEFAULT NULL,
                `rating` INT NOT NULL DEFAULT 5,
                `enabled` TINYINT(1) NOT NULL DEFAULT 1,
                `sort_order` INT NOT NULL DEFAULT 0
            )",

            'highlights' => "CREATE TABLE IF NOT EXISTS `highlights` (
                `id` INT AUTO_INCREMENT PRIMARY KEY,
                `label` VARCHAR(140) NOT NULL,
                `value` VARCHAR(40) NOT NULL,
                `suffix` VARCHAR(20) DEFAULT NULL,
                `icon` VARCHAR(60) DEFAULT NULL,
                `enabled` TINYINT(1) NOT NULL DEFAULT 1,
                `sort_order` INT NOT NULL DEFAULT 0
            )",

            'messages' => "CREATE TABLE IF NOT EXISTS `messages` (
                `id` INT AUTO_INCREMENT PRIMARY KEY,
                `name` VARCHAR(140) NOT NULL,
                `email` VARCHAR(190) NOT NULL,
                `phone` VARCHAR(60) DEFAULT NULL,
                `subject` VARCHAR(200) DEFAULT NULL,
                `body` TEXT NOT NULL,
                `ip` VARCHAR(45) DEFAULT NULL,
                `is_read` TINYINT(1) NOT NULL DEFAULT 0,
                `is_starred` TINYINT(1) NOT NULL DEFAULT 0,
                `created_at` DATETIME DEFAULT NULL
            )",

            'subscribers' => "CREATE TABLE IF NOT EXISTS `subscribers` (
                `id` INT AUTO_INCREMENT PRIMARY KEY,
                `email` VARCHAR(190) NOT NULL UNIQUE,
                `is_active` TINYINT(1) NOT NULL DEFAULT 1,
                `created_at` DATETIME DEFAULT NULL
            )",
        ];
    }

    public static function indexes(): array
    {
        return [
            'CREATE INDEX idx_posts_status ON posts (status, published_at)',
            'CREATE INDEX idx_posts_category ON posts (category_id)',
            'CREATE INDEX idx_comments_post ON comments (post_id, status)',
            'CREATE INDEX idx_experiences_track ON experiences (track, enabled)',
        ];
    }

    /** Rewrite MySQL DDL so SQLite accepts it. */
    public static function forSqlite(string $sql): string
    {
        $sql = str_replace('`', '"', $sql);
        $sql = preg_replace('/INT AUTO_INCREMENT PRIMARY KEY/i', 'INTEGER PRIMARY KEY AUTOINCREMENT', $sql);
        $sql = preg_replace('/\bMEDIUMTEXT\b/i', 'TEXT', $sql);
        $sql = preg_replace('/\bTINYINT\(1\)/i', 'INTEGER', $sql);
        $sql = preg_replace('/\bDATETIME\b/i', 'TEXT', $sql);
        $sql = preg_replace('/\bDATE\b(?!TIME)/i', 'TEXT', $sql);
        return $sql;
    }

    public static function install(PDO $pdo): void
    {
        $sqlite = Database::driver() === 'sqlite';
        foreach (self::statements() as $sql) {
            $pdo->exec($sqlite ? self::forSqlite($sql) : $sql . ' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci');
        }
        foreach (self::indexes() as $sql) {
            try {
                $pdo->exec($sqlite ? str_replace('CREATE INDEX', 'CREATE INDEX IF NOT EXISTS', $sql) : $sql);
            } catch (Throwable $e) {
                // Index already exists - MySQL has no IF NOT EXISTS for indexes.
            }
        }
    }
}
