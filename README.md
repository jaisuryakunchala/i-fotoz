# i Fotoz — Photography Studio Website

*Every Frame Tells a Story.*

A complete photography studio website with a private admin dashboard. The studio owner can upload photos and videos, manage categories, answer enquiries and change every piece of website content (logo, contact details, homepage text and images, banner) without touching code.

**Stack:** Next.js 15 (App Router) · TypeScript · Tailwind CSS · Supabase (Postgres, Auth, Storage) · Lucide icons

---

## Run it on your computer

You need [Node.js](https://nodejs.org) (LTS version) installed. Open a terminal in this folder (the one containing `package.json`) and run, one at a time:

```bash
npm install
```

```bash
npm run dev
```

When it says **Ready**, open http://localhost:3000.

> On Windows PowerShell, if you see "running scripts is disabled on this system", use `npm.cmd install` and `npm.cmd run dev` instead.

Without Supabase keys the public site runs on built-in sample content (handy for previewing the design), and `/admin` shows setup instructions. Follow the setup below to switch on the admin dashboard.

---

## What's included

**Public website**
- Home: hero, featured collections, featured-work slideshow, latest uploads, videos, about the photographer, services, enquiry form
- Gallery with category filter (`/gallery`) and a page per category (`/gallery/wedding`, …)
- Masonry grid, lazy loading, "load more", full-screen lightbox (keyboard, swipe, slideshow, full screen)
- Video showcase (`/videos`) for uploaded MP4/WebM files or YouTube links
- Contact page with Google Map, WhatsApp, enquiry form (saved to the dashboard)
- Floating WhatsApp button, optional promotional banner, SEO metadata, sitemap, robots.txt, structured data

**Admin dashboard (`/admin`)**
- Secure email/password login, forgot password, change password
- Dashboard: totals, published vs draft, new enquiries, 14-day visit chart, photos per category, recent uploads
- Photos: drag-and-drop multi-upload with per-file progress, automatic compression + thumbnails, titles, descriptions, tags, category, publish/draft, featured; search & filter; bulk publish/unpublish/move/delete
- Videos: upload with progress (thumbnail auto-captured from the video) or YouTube link; edit, publish, feature, delete
- Categories: create, edit, cover image, reorder, feature on homepage; safe delete (move photos elsewhere, or delete everything after typing the name)
- Enquiries inbox with one-click reply by phone, WhatsApp or email
- Website settings: branding (name, tagline, logo, favicon), contact, social links, homepage (hero, about, photographer photo, name and qualification, featured collections and videos), promo banner, account

**Security**
- Row Level Security: visitors can only read *published* content; only accounts in the `admins` table can change anything, including storage files
- Server-side checks in middleware and in the admin layout, plus an authorised server action
- File type and size validation; deleting content also deletes its stored files

---

## Setup: switch on the admin dashboard (about 15 minutes)

### 1. Create a Supabase project
1. Sign up at [supabase.com](https://supabase.com) and create a new project.
2. Open **SQL Editor → New query**, paste the contents of [`supabase/schema.sql`](supabase/schema.sql) and click **Run**. This creates the tables, security policies and the `media` storage bucket.
3. *(Optional)* Run [`supabase/seed.sql`](supabase/seed.sql) the same way to load the studio details plus sample categories, photos and videos. Sample items can be deleted from the dashboard at any time.

### 2. Create the owner's admin login
1. In Supabase go to **Authentication → Users → Add user → Create new user**. Enter the owner's email and a strong password and tick *Auto Confirm User*.
2. Back in the **SQL Editor**, run (with the real email):
   ```sql
   insert into public.admins (user_id)
   select id from auth.users where email = 'owner@example.com';
   ```
3. Recommended: **Authentication → Sign In / Providers → Email** → turn off *Allow new users to sign up*, so nobody else can create accounts.
4. For password-reset emails, set **Authentication → URL Configuration → Site URL** to your website address.

### 3. Add the keys
Copy `.env.example` to a new file named `.env.local` and fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from Supabase **Project Settings → API**. Stop the site (`Ctrl + C`) and run `npm run dev` again. Then sign in at http://localhost:3000/admin.

### 4. Deploy (Vercel recommended)
1. Push this folder to a GitHub repository.
2. Import it at [vercel.com/new](https://vercel.com/new).
3. Add the same environment variables (plus `NEXT_PUBLIC_SITE_URL` = your domain) and deploy.
4. Add your custom domain in Vercel, then update the Supabase *Site URL* to match.

---

## Guide for the studio owner

| I want to… | Go to |
|---|---|
| Upload photos | Admin → **Photos → Upload photos**, pick a category, drop the files, click Upload |
| Hide a photo without deleting it | Click the eye icon (or Edit → Status → Draft) |
| Show a photo in the homepage slideshow | Click the star icon |
| Add a new kind of shoot (e.g. Baby Photography) | Admin → **Categories → New category** |
| Change the order of galleries | Admin → Categories → arrows |
| Add a video | Admin → **Videos → Add video** (file or YouTube link) |
| Change phone, WhatsApp, address, map | Admin → **Website Settings → Contact** |
| Change logo, name or tagline | Website Settings → **Branding** |
| Change the big homepage photo, about text or photographer photo | Website Settings → **Homepage** |
| Announce an offer at the top of the site | Website Settings → **Promo Banner** |
| Read customer messages | Admin → **Enquiries** |

Changes appear on the public site immediately after saving.

---

## Notes
- **Photographer photo:** save the picture as `public/photographer.jpg` (portrait orientation works best). Until then, the hero photo is shown in the About section. After the dashboard is connected it can also be uploaded from Website Settings → Homepage.
- **Upload limits:** Supabase's free plan allows files up to 50 MB. Photos are compressed in the browser before upload (max 2560px, WebP) and a ~900px thumbnail is generated for the grids. For longer videos, upload them to YouTube and add the link, or raise the limit on a paid plan (then update `NEXT_PUBLIC_MAX_VIDEO_MB` and the bucket's limit in `schema.sql`).
- **Sample content** uses free Unsplash photos and Google sample videos. Replace them with the studio's own work.
- **Visit statistics** count anonymous page views (no personal data, no cookies).
- To regenerate the sample data after editing `scripts/sample-source.mjs`: `npm run seed:generate`.

## Project structure
```
src/app/(site)/          public pages (home, gallery, videos, contact)
src/app/admin/           login + dashboard pages
src/components/site/     public UI (gallery, lightbox, slideshow, forms…)
src/components/admin/    admin UI (modals, toasts, image field…)
src/lib/                 data access, upload helpers, types, config
src/middleware.ts        protects /admin routes
public/                  static files (put photographer.jpg here)
supabase/schema.sql      database, security policies, storage
supabase/seed.sql        optional studio details + sample content
```
