# Putting the site live

Two routes are covered: **Hostinger** (or any cPanel host — this is the one you want,
because the site needs PHP) and **Cloudflare**, which cannot run PHP but is worth
putting in front of the site.

---

## Part 1 — Hostinger

### 1. Create the database

In hPanel go to **Databases → Management**.

- Database name: `bikesh_site`
- Username: `bikesh_admin`
- Password: use the generator and copy it somewhere safe

Hostinger prefixes both with your account number, so the real values look like
`u123456789_bikesh_site`. Note down the three values exactly as shown.

### 2. Upload the files

**File Manager:** open **Files → File Manager**, go into `public_html`, upload a ZIP
of this project and extract it there. Make sure the files land *directly* in
`public_html`, not inside a nested folder.

**FTP:** host `ftp.yourdomain.com`, port 21, using the FTP account from hPanel.
Upload the contents of the project folder into `public_html`.

### 3. Add your credentials

Copy `config/config.sample.php` to `config/config.php` and edit it:

```php
'db' => [
    'driver'   => 'mysql',
    'host'     => 'localhost',
    'database' => 'u123456789_bikesh_site',
    'username' => 'u123456789_bikesh_admin',
    'password' => 'the password you generated',
],
'debug' => false,
'app_key' => 'paste-a-long-random-string-here',
```

`localhost` is correct on Hostinger — do not put your domain there.

### 4. Set permissions

In File Manager, right-click `uploads` → **Permissions** → set to **755** and tick
*apply to subdirectories*. Files should be 644, folders 755. Nothing needs 777.

### 5. Run the installer

Open `https://yourdomain.com/install.php`. It checks the server, creates the tables,
loads the starting content and asks for your admin name, email and password.

### 6. Delete install.php

In File Manager, delete `install.php`. This is not optional — anyone who finds it
could otherwise interfere with the site. The dashboard footer nags you until it is gone.

### 7. Turn on SSL

**Websites → SSL → Install SSL** (free, automatic). Once the padlock shows, open
`.htaccess` and uncomment the three "Force HTTPS" lines near the top:

```apache
RewriteCond %{HTTPS} !=on
RewriteCond %{HTTP:X-Forwarded-Proto} !https
RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
```

### 8. Set the PHP version

**Advanced → PHP Configuration**: choose PHP 8.2 or newer. In the **PHP options**
tab, set `upload_max_filesize` and `post_max_size` to at least 8M.

### 9. Make it yours

Sign in at `https://yourdomain.com/admin/` and work through:

1. **Profile** — your photo, biography and CV.
2. **Experience pipeline** — correct the roles, organisations and dates. The seeded
   entries were assembled from your public profiles and are a starting point only.
3. **Settings** — contact details, social links, favicon and accent colour.
4. **Menus & sections** — switch off anything you are not ready to show.
5. **Testimonials** — replace the placeholders with real quotes, then enable the
   section under Menus & sections. It ships switched off on purpose.

---

## Part 2 — Cloudflare

Cloudflare Pages and Workers **cannot run PHP**, so the site itself must stay on
Hostinger. What Cloudflare gives you is a free CDN, caching and DNS in front of it.

1. Add your domain at [dash.cloudflare.com](https://dash.cloudflare.com) and choose
   the free plan.
2. Copy the two Cloudflare nameservers it gives you.
3. In Hostinger, go to **Domains → DNS / Nameservers** and replace the nameservers
   with Cloudflare's. Propagation takes a few hours.
4. Back in Cloudflare, confirm there is an **A record** pointing at your Hostinger
   IP address (hPanel shows it), proxied (orange cloud).
5. **SSL/TLS → Overview:** set the mode to **Full (strict)**. Anything less will
   loop or warn.
6. **Rules → Page Rules** (or Cache Rules), add:
   - `yourdomain.com/admin*` → **Cache Level: Bypass**
   - `yourdomain.com/assets/*` → **Cache Level: Cache Everything**, Edge TTL a month

Purge the Cloudflare cache after any CSS or JavaScript change. The site adds a
version string to those files automatically when you save in the dashboard, which
handles most cases on its own.

---

## Backups

**Database:** hPanel → **Databases → phpMyAdmin** → select the database → **Export**
→ Quick → Go. Do this before any significant change.

**Files:** the only irreplaceable folder is `uploads/`. Download it periodically, or
use hPanel → **Files → Backups**.

---

## If something goes wrong

| Symptom | Cause and fix |
| --- | --- |
| Blank white page | PHP error with display off. Set `'debug' => true` in `config/config.php`, reload, read the message, then set it back to `false`. |
| "Cannot reach its database" | Wrong credentials in `config/config.php`, or the database user is not attached to the database in hPanel. |
| Every page but the home page 404s | `mod_rewrite` is not applying. Confirm `.htaccess` uploaded (it starts with a dot, so enable "show hidden files"). |
| Uploads fail | `uploads/` is not writable. Set it to 755. |
| Contact form saves but no email arrives | Expected: mail is off by default. Set `'transport' => 'mail'` in `config/config.php` and fill in **Send new enquiries to** under Settings. Messages are always kept in the dashboard inbox regardless. |
| Styles look wrong after an update | Browser cache. Hard-reload with Ctrl+Shift+R, and purge Cloudflare if you use it. |
| Locked out of the dashboard | Six wrong passwords locks it for fifteen minutes. To reset a password, run this in phpMyAdmin's SQL tab after generating a hash with `password_hash('newpassword', PASSWORD_DEFAULT)`: `UPDATE users SET password_hash = '...' WHERE email = 'you@example.com';` |

---

## Moving the site into a subfolder

If the site lives at `yourdomain.com/portfolio` rather than the domain root, set:

```php
'base_path' => '/portfolio',
```

in `config/config.php`. Everything else adjusts itself.
