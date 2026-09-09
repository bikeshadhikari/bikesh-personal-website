# bikeshadhikari.com.np

A database-driven personal website for **Bikesh Adhikari** — IT professional, educator,
practitioner, speaker and planner.

Plain PHP on the server, plain HTML, CSS and JavaScript in the browser. No Composer,
no npm, no build step. Upload the folder, run the installer, and it works.

---

## What it does

**Public site**
- Home page assembled from switchable blocks: hero, key numbers, about, skills,
  experience pipeline, services, projects, certifications, testimonials, latest
  writing, contact.
- Standalone pages for About, Experience, Services, Projects and Contact.
- A blog with categories, tags, search, pagination, related posts, share buttons,
  reading time, view counts and moderated comments.
- Contact form and newsletter signup that store to the database.
- Light and dark themes, respecting the visitor's device setting.
- `sitemap.xml`, `robots.txt`, an RSS feed, Open Graph tags and Person structured data.
- Favicon, apple-touch icon and web app manifest included.

**Dashboard** (`/admin/`)
- **Menus & sections** — one switch per page and per home-page block. Switching
  something off removes it from the navigation, makes its address return 404 and
  drops it from the sitemap and feed. Nothing is hard-coded in a template.
- **Blog** — write, edit, schedule, feature and delete posts with a formatting
  toolbar; manage categories; approve or reject comments.
- **Profile** — name, headline, rotating roles, biography, photo, CV.
- **Experience pipeline** — roles, organisations, dates, key points, grouped into
  work, education, volunteer and award tracks.
- **Skills, services, projects, certifications, testimonials, key numbers** — each
  with its own visibility switch and sort order.
- **Messages** and **subscribers**, with CSV export.
- **Settings** — site identity, favicon upload, contact details, social links,
  SEO, analytics, accent colours, blog rules and maintenance mode.
- **Media library**, **users** with roles, and your own account settings.

---

## Requirements

| Need | Minimum |
| --- | --- |
| PHP | 8.0 or newer (8.2+ recommended) |
| Database | MySQL 5.7+ / MariaDB 10.3+, or SQLite for local testing |
| Extensions | `pdo_mysql` (or `pdo_sqlite`), `mbstring`, `gd` optional |
| Server | Apache or LiteSpeed with `mod_rewrite` — standard on Hostinger and cPanel |

---

## Installing

1. Upload everything to `public_html` (or a subfolder).
2. Copy `config/config.sample.php` to `config/config.php` and fill in your
   database name, user and password.
3. Set `uploads/` to permission **755**.
4. Open `https://yourdomain.com/install.php` in a browser and create your account.
5. **Delete `install.php`.** The dashboard will keep warning you until you do.

Full step-by-step instructions for Hostinger are in [DEPLOYMENT.md](DEPLOYMENT.md).

---

## Layout of the code

```
index.php              Front controller for the public site
install.php            One-time installer — delete after use
.htaccess              Clean URLs, security headers, caching
config/config.php      Your database credentials (git-ignored)
app/                   Database, App, Auth, Csrf, Settings, Menu, Content, Upload, View, Mailer
database/              Schema definition and first-run content
views/
  controllers/         One file per route
  layout/ partials/    Shared page chrome and reusable blocks
  pages/               One template per page
admin/
  index.php            Dashboard front controller
  Resource.php         Every content type described in one place
  Crud.php             Generic create / read / update / delete
  pages/ views/        Dashboard screens
assets/css assets/js   One stylesheet and one script per side of the site
uploads/               Everything uploaded through the dashboard
```

**Adding a field** to any content type is one line in `admin/Resource.php` plus a
column in `database/Schema.php`. The list screen, the form, validation, uploads
and saving all follow automatically.

---

## Security

- Passwords hashed with `password_hash()`, rehashed on algorithm changes.
- Every database call uses prepared statements.
- CSRF token on every state-changing form.
- All output escaped; post bodies passed through an HTML allow-list that strips
  scripts, inline event handlers and `javascript:` URLs.
- Uploads validated by extension and image type, renamed, and served from a
  directory where script execution is blocked.
- Login throttled: six failed attempts locks the form for fifteen minutes.
- Honeypot fields and a rate limit on the public contact and comment forms.
- Session cookies are HTTP-only, `SameSite=Lax`, and secure over HTTPS.
- `config/`, `app/`, `database/` and `views/` are unreachable over the web.

---

## Local development

```bash
cp config/config.sample.php config/config.php   # set driver to 'sqlite'
php -S localhost:8000 router.php                # router.php mimics .htaccess
```

Then open `http://localhost:8000/install.php`.
