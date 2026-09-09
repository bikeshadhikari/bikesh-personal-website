<?php
/**
 * Thin PDO wrapper. Works against MySQL (Hostinger, cPanel) and SQLite
 * (handy for local testing without a database server).
 */
class Database
{
    private static ?PDO $pdo = null;
    private static string $driver = 'mysql';

    public static function connect(array $cfg): PDO
    {
        if (self::$pdo instanceof PDO) {
            return self::$pdo;
        }

        self::$driver = $cfg['driver'] ?? 'mysql';

        if (self::$driver === 'sqlite') {
            $path = $cfg['sqlite_path'];
            $dir  = dirname($path);
            if (!is_dir($dir)) {
                mkdir($dir, 0775, true);
            }
            $pdo = new PDO('sqlite:' . $path, null, null, [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            ]);
            $pdo->exec('PRAGMA foreign_keys = ON');
        } else {
            $dsn = sprintf(
                'mysql:host=%s;port=%d;dbname=%s;charset=%s',
                $cfg['host'], (int)($cfg['port'] ?? 3306), $cfg['database'], $cfg['charset'] ?? 'utf8mb4'
            );
            $pdo = new PDO($dsn, $cfg['username'], $cfg['password'], [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ]);
        }

        self::$pdo = $pdo;
        return $pdo;
    }

    public static function pdo(): PDO
    {
        if (!self::$pdo instanceof PDO) {
            throw new RuntimeException('Database connection has not been established.');
        }
        return self::$pdo;
    }

    public static function driver(): string
    {
        return self::$driver;
    }

    public static function run(string $sql, array $params = []): PDOStatement
    {
        $stmt = self::pdo()->prepare($sql);
        $stmt->execute($params);
        return $stmt;
    }

    /** @return array<int,array<string,mixed>> */
    public static function all(string $sql, array $params = []): array
    {
        return self::run($sql, $params)->fetchAll();
    }

    /** @return array<string,mixed>|null */
    public static function first(string $sql, array $params = []): ?array
    {
        $row = self::run($sql, $params)->fetch();
        return $row === false ? null : $row;
    }

    public static function value(string $sql, array $params = [], $default = null)
    {
        $row = self::run($sql, $params)->fetch(PDO::FETCH_NUM);
        return $row === false ? $default : $row[0];
    }

    public static function insert(string $table, array $data): int
    {
        $cols   = array_keys($data);
        $marks  = array_map(static fn($c) => ':' . $c, $cols);
        $quoted = array_map(static fn($c) => self::q($c), $cols);
        $sql    = 'INSERT INTO ' . self::q($table) . ' (' . implode(', ', $quoted) . ') VALUES (' . implode(', ', $marks) . ')';
        self::run($sql, $data);
        return (int) self::pdo()->lastInsertId();
    }

    public static function update(string $table, array $data, string $where, array $whereParams = []): int
    {
        $sets = [];
        foreach (array_keys($data) as $c) {
            $sets[] = self::q($c) . ' = :' . $c;
        }
        $sql = 'UPDATE ' . self::q($table) . ' SET ' . implode(', ', $sets) . ' WHERE ' . $where;
        return self::run($sql, array_merge($data, $whereParams))->rowCount();
    }

    public static function delete(string $table, string $where, array $params = []): int
    {
        return self::run('DELETE FROM ' . self::q($table) . ' WHERE ' . $where, $params)->rowCount();
    }

    /** Quote an identifier for the active driver. */
    public static function q(string $identifier): string
    {
        return self::$driver === 'mysql' ? '`' . $identifier . '`' : '"' . $identifier . '"';
    }

    public static function tableExists(string $table): bool
    {
        try {
            if (self::$driver === 'sqlite') {
                return (bool) self::value(
                    "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name = ?", [$table]
                );
            }
            self::run('SELECT 1 FROM ' . self::q($table) . ' LIMIT 1');
            return true;
        } catch (Throwable $e) {
            return false;
        }
    }
}
