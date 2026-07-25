<?php
declare(strict_types=1);
require_once __DIR__ . '/../config/config.php';

function db(): PDO {
    static $pdo = null;
    if ($pdo instanceof PDO) return $pdo;
    try {
        $pdo = new PDO('sqlite:' . DB_PATH, null, null, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]);
        $pdo->exec('PRAGMA foreign_keys = ON');
        $pdo->exec('CREATE TABLE IF NOT EXISTS contact_messages (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, email TEXT NOT NULL, company TEXT, project_type TEXT NOT NULL, budget TEXT, message TEXT NOT NULL, status TEXT NOT NULL DEFAULT "unread", created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)');
        $pdo->exec('CREATE TABLE IF NOT EXISTS admins (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)');
        $password = getenv('VEYTRONATECH_ADMIN_PASSWORD');
        if ($password) {
            $statement = $pdo->prepare('SELECT id FROM admins WHERE email = ?'); $statement->execute([ADMIN_EMAIL]);
            if (!$statement->fetch()) $pdo->prepare('INSERT INTO admins (email, password_hash) VALUES (?, ?)')->execute([ADMIN_EMAIL, password_hash($password, PASSWORD_DEFAULT)]);
        }
        return $pdo;
    } catch (PDOException $exception) { throw new RuntimeException('The database could not be opened. Ensure the database directory is writable and PDO SQLite is enabled.'); }
}
