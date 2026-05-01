-- ============================================================
-- SUPABASE STORAGE: Bucket & RLS Policies for product images
-- Run this in Supabase SQL Editor → New Query → Run
-- ============================================================

-- 1. Create the bucket if it doesn't already exist
--    (safe to run even if "alfred" already exists)
insert into storage.buckets (id, name, public)
values ('alfred', 'alfred', true)
on conflict (id) do update set public = true;

-- 2. Allow anyone (anon + authenticated) to READ/VIEW images
--    This is what makes images show on the public storefront.
drop policy if exists "Public read access on alfred bucket" on storage.objects;
create policy "Public read access on alfred bucket"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'alfred');

-- 3. Allow authenticated users (admin) to UPLOAD images
drop policy if exists "Authenticated upload to alfred bucket" on storage.objects;
create policy "Authenticated upload to alfred bucket"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'alfred');

-- 4. Allow authenticated users to UPDATE (overwrite) images
drop policy if exists "Authenticated update on alfred bucket" on storage.objects;
create policy "Authenticated update on alfred bucket"
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'alfred');

-- 5. Allow authenticated users to DELETE images
drop policy if exists "Authenticated delete on alfred bucket" on storage.objects;
create policy "Authenticated delete on alfred bucket"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'alfred');

-- Done! The "alfred" bucket is now public and the admin can upload to it.
