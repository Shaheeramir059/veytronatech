# VeytronaTech website

PHP 8.2+ portfolio and business website using SQLite, with reusable layout components, a secure contact workflow, and a small admin inbox.

## Run locally

1. Ensure PHP has the `pdo_sqlite` extension enabled.
2. From this directory, run `php -S localhost:8000`.
3. Visit `http://localhost:8000`.

The SQLite file is created automatically on the first contact or admin request. The `database/` directory must be writable by PHP.

## Admin setup

Before the first admin login, set a strong environment variable named `VEYTRONATECH_ADMIN_PASSWORD`; the application hashes it using `password_hash()` while creating the administrator account at `admin@veytronatech.com`.

For PowerShell during local development:

```powershell
$env:VEYTRONATECH_ADMIN_PASSWORD = 'use-a-long-unique-password'
php -S localhost:8000
```

Then sign in at `/admin/login.php`. Never commit credentials or a generated `database/veytronatech.sqlite` file.

Set `SITE_URL` in `config/config.php` to the deployed HTTPS address before launch.
