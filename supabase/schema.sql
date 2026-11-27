-- =====================================================================
--  i Fotoz — database schema, security policies and storage rules
--  Run this whole file once in Supabase: Dashboard -> SQL Editor -> New query
--  It is safe to run again (idempotent).
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- Admins: only users listed here can manage the website
-- ---------------------------------------------------------------------
create table if not exists public.admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

grant execute on function public.is_admin() to anon, authenticated;

-- ---------------------------------------------------------------------
-- Categories
-- ---------------------------------------------------------------------
create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 1 and 80),
  slug        text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text not null default '' check (char_length(description) <= 600),
  cover_url   text,
  cover_path  text,
  sort_order  integer not null default 0,
  is_featured boolean not null default false,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Photos
-- ---------------------------------------------------------------------
create table if not exists public.photos (
  id          uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories (id) on delete restrict,
  title       text not null default '' check (char_length(title) <= 140),
  description text not null default '' check (char_length(description) <= 2000),
  tags        text[] not null default '{}',
  url         text not null,
  path        text,              -- storage path of the full image (null for external sample images)
  thumb_url   text not null,
  thumb_path  text,              -- storage path of the thumbnail
  width       integer,
  height      integer,
  status      text not null default 'published' check (status in ('draft', 'published')),
  is_featured boolean not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists photos_category_idx on public.photos (category_id);
create index if not exists photos_status_created_idx on public.photos (status, created_at desc);

-- ---------------------------------------------------------------------
-- Videos
-- ---------------------------------------------------------------------
create table if not exists public.videos (
  id             uuid primary key default gen_random_uuid(),
  title          text not null check (char_length(title) between 1 and 140),
  description    text not null default '' check (char_length(description) <= 2000),
  source         text not null default 'upload' check (source in ('upload', 'youtube')),
  url            text not null,    -- public file URL, or YouTube video id
  path           text,             -- storage path of the video file
  thumbnail_url  text,
  thumbnail_path text,
  status         text not null default 'published' check (status in ('draft', 'published')),
  is_featured    boolean not null default false,
  created_at     timestamptz not null default now()
);

create index if not exists videos_status_created_idx on public.videos (status, created_at desc);

-- ---------------------------------------------------------------------
-- Website settings (single row, id = 1)
-- ---------------------------------------------------------------------
create table if not exists public.settings (
  id               integer primary key default 1 check (id = 1),
  site_name        text not null default 'i Fotoz',
  tagline          text not null default 'Every Frame Tells a Story.',
  logo_url         text,
  logo_path        text,
  favicon_url      text,
  favicon_path     text,
  email            text not null default '',
  phone            text not null default '',
  phone2           text not null default '',
  whatsapp         text not null default '',
  address          text not null default '',
  map_embed_url    text not null default '',
  business_hours   text not null default '',
  instagram_url    text not null default '',
  facebook_url     text not null default '',
  youtube_url      text not null default '',
  hero_heading     text not null default 'Every Frame Tells a Story.',
  hero_description text not null default '',
  hero_image_url   text,
  hero_image_path  text,
  about_heading    text not null default '',
  about_text       text not null default '',
  about_image_url  text,
  about_image_path text,
  banner_enabled   boolean not null default false,
  banner_text      text not null default '',
  banner_link      text not null default '',
  updated_at       timestamptz not null default now()
);

insert into public.settings (id) values (1) on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- Customer enquiries
-- ---------------------------------------------------------------------
create table if not exists public.enquiries (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (char_length(name) between 1 and 120),
  email      text not null default '' check (char_length(email) <= 200),
  phone      text not null default '' check (char_length(phone) <= 40),
  event_type text not null default '' check (char_length(event_type) <= 80),
  event_date date,
  message    text not null check (char_length(message) between 1 and 3000),
  is_read    boolean not null default false,
  created_at timestamptz not null default now(),
  check (email <> '' or phone <> '')
);

-- ---------------------------------------------------------------------
-- Visit statistics (anonymous page views — no personal data stored)
-- ---------------------------------------------------------------------
create table if not exists public.page_views (
  id         bigint generated always as identity primary key,
  path       text not null check (char_length(path) between 1 and 300),
  created_at timestamptz not null default now()
);

create index if not exists page_views_created_idx on public.page_views (created_at);

create or replace function public.page_view_stats(days integer default 14)
returns table (day date, views bigint)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;
  return query
    select d::date as day, count(v.id) as views
    from generate_series(current_date - (greatest(days, 1) - 1), current_date, interval '1 day') d
    left join public.page_views v on v.created_at::date = d::date
    group by d
    order by d;
end;
$$;

grant execute on function public.page_view_stats(integer) to authenticated;

-- ---------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------
alter table public.admins     enable row level security;
alter table public.categories enable row level security;
alter table public.photos     enable row level security;
alter table public.videos     enable row level security;
alter table public.settings   enable row level security;
alter table public.enquiries  enable row level security;
alter table public.page_views enable row level security;

-- admins: an admin can see the admin list; nobody can modify it through the API
drop policy if exists "admins read" on public.admins;
create policy "admins read" on public.admins for select to authenticated using (public.is_admin());

-- categories: everyone can read, admins manage
drop policy if exists "categories public read" on public.categories;
create policy "categories public read" on public.categories for select using (true);
drop policy if exists "categories admin write" on public.categories;
create policy "categories admin write" on public.categories for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- photos: visitors see only published photos, admins see and manage everything
drop policy if exists "photos public read" on public.photos;
create policy "photos public read" on public.photos for select
  using (status = 'published' or public.is_admin());
drop policy if exists "photos admin write" on public.photos;
create policy "photos admin write" on public.photos for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- videos: same rules as photos
drop policy if exists "videos public read" on public.videos;
create policy "videos public read" on public.videos for select
  using (status = 'published' or public.is_admin());
drop policy if exists "videos admin write" on public.videos;
create policy "videos admin write" on public.videos for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- settings: everyone can read, admins update
drop policy if exists "settings public read" on public.settings;
create policy "settings public read" on public.settings for select using (true);
drop policy if exists "settings admin update" on public.settings;
create policy "settings admin update" on public.settings for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- enquiries: anyone can send one (unread), only admins can read / manage them
drop policy if exists "enquiries public insert" on public.enquiries;
create policy "enquiries public insert" on public.enquiries for insert to anon, authenticated
  with check (is_read = false);
drop policy if exists "enquiries admin read" on public.enquiries;
create policy "enquiries admin read" on public.enquiries for select to authenticated using (public.is_admin());
drop policy if exists "enquiries admin update" on public.enquiries;
create policy "enquiries admin update" on public.enquiries for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists "enquiries admin delete" on public.enquiries;
create policy "enquiries admin delete" on public.enquiries for delete to authenticated using (public.is_admin());

-- page views: anyone can record a view, only admins can read
drop policy if exists "page_views public insert" on public.page_views;
create policy "page_views public insert" on public.page_views for insert to anon, authenticated
  with check (path like '/%');
drop policy if exists "page_views admin read" on public.page_views;
create policy "page_views admin read" on public.page_views for select to authenticated using (public.is_admin());

-- Table privileges (Supabase grants these by default; repeated here for clarity)
grant select on public.categories, public.photos, public.videos, public.settings to anon, authenticated;
grant insert on public.enquiries, public.page_views to anon, authenticated;
grant select, insert, update, delete on public.categories, public.photos, public.videos, public.enquiries to authenticated;
grant select, update on public.settings to authenticated;
grant select on public.page_views, public.admins to authenticated;

-- ---------------------------------------------------------------------
-- Storage: one public "media" bucket; only admins can upload / change / delete
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media', 'media', true, 52428800,
  array['image/jpeg','image/png','image/webp','image/gif','image/x-icon','image/vnd.microsoft.icon','image/svg+xml','video/mp4','video/webm','video/quicktime']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "media public read" on storage.objects;
create policy "media public read" on storage.objects for select
  using (bucket_id = 'media');
drop policy if exists "media admin insert" on storage.objects;
create policy "media admin insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and public.is_admin());
drop policy if exists "media admin update" on storage.objects;
create policy "media admin update" on storage.objects for update to authenticated
  using (bucket_id = 'media' and public.is_admin()) with check (bucket_id = 'media' and public.is_admin());
drop policy if exists "media admin delete" on storage.objects;
create policy "media admin delete" on storage.objects for delete to authenticated
  using (bucket_id = 'media' and public.is_admin());
