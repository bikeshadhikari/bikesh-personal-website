# Putting the site live on Vercel

About twenty minutes end to end. You need a GitHub account and a Vercel account,
both free. No terminal required.

---

## 1. Push the code to GitHub

The code already lives on the branch `claude/bike-shadhikari-portfolio-52iwad`
in your repository. Merge it into `main` when you are ready, or point Vercel
straight at that branch in step 2.

---

## 2. Import the project into Vercel

1. Sign in at [vercel.com](https://vercel.com) with your GitHub account.
2. **Add New → Project**, then **Import** your `bikesh-personal-website` repository.
3. Vercel detects Next.js on its own. Leave the build settings untouched.
4. **Do not deploy yet.** Add the environment variables first (step 4), or the
   first build will succeed but the site will not be able to reach a database.

---

## 3. Create the database

In your Vercel project open **Storage → Create Database → Neon** (Postgres).
Choose the free plan and a region close to Nepal — Singapore is the nearest.

Connect it to the project when prompted. Vercel writes `DATABASE_URL` into your
environment variables automatically. Use the pooled connection string, the one
whose host contains `-pooler`; Vercel picks it by default.

Supabase or any other Postgres works too. Paste its pooled connection string as
`DATABASE_URL` by hand instead.

---

## 4. Add file storage

Still under **Storage**, create a **Blob** store and connect it to the project.
Vercel sets `BLOB_READ_WRITE_TOKEN` for you.

Without this the site still runs, and image fields accept a pasted link to a
picture hosted elsewhere. With it, you upload files directly in the dashboard.

---

## 5. Set the environment variables

**Settings → Environment Variables.** Add these three, ticked for Production,
Preview and Development:

| Name | Value |
| --- | --- |
| `AUTH_SECRET` | A long random string. Generate one at [generate-secret.vercel.app/32](https://generate-secret.vercel.app/32) |
| `SETUP_SECRET` | Any password you invent. You type it once during setup |
| `NEXT_PUBLIC_SITE_URL` | `https://bikeshadhikari.com.np` — your live address, no trailing slash |

`DATABASE_URL` and `BLOB_READ_WRITE_TOKEN` are already there from steps 3 and 4.

Then **Deployments → Redeploy** so the new variables take effect.

---

## 6. Run the one-time setup

Open `https://your-project.vercel.app/setup`.

The page checks that each variable is present, then asks for your name, email,
a password and the `SETUP_SECRET` you chose. It creates the tables, loads the
starting content and signs you straight into the dashboard.

The page refuses to run a second time once an account exists, so there is
nothing to delete afterwards.

---

## 7. Point your domain at it

**Settings → Domains → Add**, and enter `bikeshadhikari.com.np`.

Vercel shows you the DNS records to create. In whichever panel manages your
domain's DNS:

| Type | Name | Value |
| --- | --- | --- |
| A | `@` | `76.76.21.21` |
| CNAME | `www` | `cname.vercel-dns.com` |

Vercel shows the exact values for your project — use those rather than the
example above if they differ. HTTPS is issued automatically once DNS resolves,
usually within an hour.

If your domain currently points at your old hosting, changing these two records
is what moves it. Nothing else needs to change.

---

## 8. Make it yours

Sign in at `https://bikeshadhikari.com.np/admin` and work through, in order:

1. **Profile & bio** — your photo, biography and CV. The photo placeholder in the
   hero disappears as soon as you upload one.
2. **Experience pipeline** — correct the roles, organisations and dates. The
   seeded entries were assembled from your public profiles and are a starting
   point only, not verified facts.
3. **Settings** — contact details, social links, favicon, accent colour.
4. **Menus & sections** — switch off anything you are not ready to show.
5. **Testimonials** — replace the two placeholders with real quotes from real
   people, then enable the Testimonials section under Menus & sections. It ships
   switched off on purpose so placeholder text never reaches a visitor.

---

## Everyday use

**Publishing changes to the code.** Push to your branch. Vercel builds and
deploys it, usually in under a minute. Every push to a non-production branch
gets its own preview URL you can check before merging.

**Publishing content.** Everything in the dashboard is live the moment you save.
No deploy, no cache to clear.

**Backups.** Neon keeps point-in-time recovery on the free plan. For a manual
copy, open the Neon dashboard from Vercel's Storage tab and use its SQL editor
to export, or connect any Postgres client with the `DATABASE_URL`.

---

## Costs

Everything above sits inside free tiers for a personal site:

| Service | Free allowance |
| --- | --- |
| Vercel Hobby | 100 GB bandwidth a month |
| Neon Postgres | 0.5 GB storage |
| Vercel Blob | 1 GB storage, 10 GB downloads a month |

You pay for the domain, which you already own. A personal site with a blog will
not come close to these limits.

Note that Vercel's Hobby plan is for non-commercial use. A personal portfolio
that advertises services sits in a grey area; if you start invoicing clients
through the site, move to the Pro plan.

---

## If something goes wrong

| Symptom | Cause and fix |
| --- | --- |
| Setup page says the database check failed | `DATABASE_URL` is missing or wrong. Check Storage is connected to this project, then redeploy. |
| "AUTH_SECRET is missing or too short" | Add `AUTH_SECRET` with at least 16 characters and redeploy. |
| Setup key rejected | The value you typed does not match `SETUP_SECRET` in Vercel. They are case sensitive. |
| Uploads say storage is not connected | Create a Blob store under Storage, connect it, and redeploy. |
| Everything is 500 after a deploy | Open the failing deployment in Vercel and read the runtime logs. They name the exact error. |
| Locked out of the dashboard | Six wrong passwords locks that address for fifteen minutes. Wait it out, or clear the `login_attempts` table from the Neon SQL editor. |
| Content edits do not show | Hard reload with Ctrl+Shift+R. Pages are server-rendered per request, so this is almost always the browser cache. |

---

## Moving off Vercel later

The only Vercel-specific piece is Blob storage for uploads. Postgres is standard,
and the app is an ordinary Next.js project, so it runs on Netlify, Railway, Render,
Fly.io or your own server with `npm run build && npm run start`. Swapping Blob for
S3 or Cloudflare R2 means rewriting one file, `src/lib/upload.ts`.
