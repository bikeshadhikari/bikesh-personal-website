# bikeshadhikari.com.np

A database-driven personal website for **Bikesh Adhikari** — IT professional, educator,
practitioner, speaker and planner.

Next.js and TypeScript, deployed on Vercel. Server-rendered HTML with hand-written CSS,
no UI framework and no CSS framework, so the markup stays readable and the pages stay fast.

---

## What it does

**Public site**
- Home page assembled from switchable blocks: hero, key numbers, about, skills,
  experience pipeline, services, projects, certifications, testimonials, latest
  writing and contact.
- Standalone pages for About, Experience, Services, Projects, Gallery and Contact.
- A gallery that arranges photos of any shape into columns, keeping each picture
  at its own proportions and revealing its title along the bottom on hover.
- A blog with categories, tags, search, pagination, related posts, share buttons,
  reading time, view counts and moderated comments.
- Contact form and newsletter signup that save to the database.
- Light and dark themes, respecting the visitor's device setting.
- `sitemap.xml`, `robots.txt`, an RSS feed, Open Graph tags and Person structured data.
- A share picture generated for every blog post, so a link posted to Facebook,
  LinkedIn, X or WhatsApp arrives as a card with the title on it. A cover image
  on the post is used when there is one; otherwise the card is drawn on demand.
- A drifting abstract backdrop behind every page, drawn in CSS rather than
  loaded as an image, and switched off for anyone who asks for reduced motion.
- Favicon, apple-touch icon and web app manifest included.

**Dashboard** (`/admin`)
- **Menus & sections** — one switch per page and per home-page block. Switching
  something off removes it from the navigation, makes its address return the
  not-found page, and drops it from the sitemap and RSS feed. Nothing is
  hard-coded in a template.
- **Blog** — write, edit, schedule, feature and delete posts with a formatting
  toolbar; manage categories; approve or reject comments.
- **Profile** — name, headline, rotating roles, biography, photo, CV.
- **Experience pipeline** — roles, organisations, dates and key points, grouped
  into work, education, volunteer and award tracks.
- **Gallery** — upload a photo, give it a title and a caption, and it takes its
  place in the arrangement. Any resolution, size or shape works.
- **Skills, services, projects, certifications, testimonials, key numbers** — each
  with its own visibility switch and sort order.
- **Search** — one box in the dashboard header, or press `/` from anywhere in it.
  It looks through posts, projects, experience, services, skills, certifications,
  testimonials, gallery photos, categories, menus and the settings themselves, so
  you can find, say, the favicon without remembering which screen it is on.
- **Messages** and **subscribers**, with CSV export.
- **Settings** — site identity, favicon upload, contact details, social links,
  SEO, accent colours, blog rules and maintenance mode. While maintenance mode
  is on you keep browsing the real site, with a banner across the top reminding
  you that visitors do not.
- **Media library** — files live in the database, so uploads work as soon as the
  site does. Photos are resized in the browser before they are sent, which keeps
  a phone picture well under the request limit and makes pages load faster.
- **Users** with roles, and your own account settings.

---

## Stack

| Piece | Choice | Why |
| --- | --- | --- |
| Framework | Next.js 15, App Router | Native on Vercel, server-rendered HTML |
| Language | TypeScript | Catches mistakes before they reach the live site |
| Database | Postgres via `postgres` (postgres.js) | Works with Neon, Supabase or any Postgres |
| File storage | The same Postgres database | No second service to set up, and uploads work locally too |
| Auth | `jose` JWT in an httpOnly cookie, `bcryptjs` hashes | No third-party auth service to configure |
| Styling | Plain CSS, two stylesheets | No build-time CSS pipeline, easy to edit by hand |

No ORM, no component library, no Tailwind. Mutations go through Server Actions,
so there are no hand-written API routes for forms and no CSRF tokens to manage.

---

## Getting it running locally

```bash
npm install
cp .env.example .env.local     # fill in DATABASE_URL and AUTH_SECRET
npm run db:setup -- --email you@example.com --password "a long password"
npm run dev
```

Then open `http://localhost:3000`. The dashboard is at `/admin`.

You can also skip the command line entirely and visit `/setup` in the browser,
which is what you will do on Vercel. Full instructions are in
[DEPLOYMENT.md](DEPLOYMENT.md).

### Scripts

| Command | Does |
| --- | --- |
| `npm run dev` | Development server with hot reload |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run typecheck` | Type check without emitting |
| `npm run db:setup` | Create the tables and load the starting content |

---

## Layout of the code

```
src/
  app/
    page.tsx              Home, assembled from enabled sections
    about|experience|services|projects|gallery|contact|blog|search/
    blog/[slug]/opengraph-image.tsx  Share picture for a post
    actions.ts            Public form handlers (contact, comments, newsletter)
    setup/                One-time installer
    admin/
      actions.ts          Every dashboard mutation
      [resource]/         Generic list and form for every content type
      menus|profile|settings|messages|comments|subscribers|media|users|account/
      search/             Dashboard-wide search
    sitemap.ts robots.ts manifest.ts feed.xml/
  components/
    site/                 Header, footer, hero, blocks, backdrop, gallery, forms
    admin/                Shell, resource list, resource form, field, editor
  lib/
    db.ts                 Postgres client
    schema.ts             Table definitions
    seed.ts               First-run content
    resources.ts          Every content type described once
    crud.ts               Generic create / read / update / delete
    auth.ts settings.ts menu.ts content.ts upload.ts utils.ts
    admin-search.ts       What the dashboard search looks through
    client-upload.ts      Browser-side resizing before an upload
  styles/                 site.css and admin.css
  middleware.ts           Guards /admin
```

**Adding a field** to any content type is one entry in `src/lib/resources.ts`
plus a column in `src/lib/schema.ts`. The list screen, the form, validation,
uploads and saving all follow automatically.

---

## Security

- Passwords hashed with bcrypt; sessions are signed JWTs in httpOnly,
  SameSite=Lax cookies, secure in production.
- Login throttled: six failed attempts locks that address for fifteen minutes.
- Every query is parameterised. Table and column names come from a fixed map,
  never from user input.
- Post bodies pass through an allow-list sanitiser that strips scripts, event
  handlers, `javascript:` and `data:` URLs, and unknown tags.
- The map embed accepts a single `iframe` with an https source and a short list
  of attributes; everything else is discarded.
- Accent colours are validated as hex before being written into a `<style>` block,
  and structured data is escaped before entering a `<script>` block.
- Uploads are accepted only from a signed-in user, checked by content type and
  size, and served back with `nosniff` and an immutable cache header.
- Menus, profile, settings and users are administrator-only; editors get content,
  comments, messages and media.
- Server Actions verify the request origin, so form posts cannot be forged from
  another site.
- `/admin` is guarded by middleware before any page renders.
