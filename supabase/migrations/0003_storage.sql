-- =============================================================================
-- EstateFlow CRM - 0003_storage.sql
-- Storage buckets for property photos, documents, attendance selfies, social media.
-- =============================================================================

insert into storage.buckets (id, name, public)
values
  ('property-images', 'property-images', true),
  ('property-documents', 'property-documents', false),
  ('attendance-selfies', 'attendance-selfies', false),
  ('social-media', 'social-media', true)
on conflict (id) do nothing;

-- Read policies for public buckets
create policy "public read property-images"
  on storage.objects for select
  using (bucket_id = 'property-images');

create policy "public read social-media"
  on storage.objects for select
  using (bucket_id = 'social-media');

-- Authenticated users can upload to property-images / social-media for their org.
-- We rely on the path prefix "<organization_id>/..." to enforce isolation.
create policy "auth upload property-images"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'property-images'
    and (storage.foldername(name))[1] = (select organization_id::text from profiles where id = auth.uid())
  );

create policy "auth upload property-documents"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'property-documents'
    and (storage.foldername(name))[1] = (select organization_id::text from profiles where id = auth.uid())
  );

create policy "auth read property-documents same org"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'property-documents'
    and (storage.foldername(name))[1] = (select organization_id::text from profiles where id = auth.uid())
  );

create policy "auth upload attendance-selfies"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'attendance-selfies'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "auth read attendance-selfies same org"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'attendance-selfies'
    and exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and (
          p.role in ('admin', 'sales_manager')
          or (storage.foldername(name))[1] = auth.uid()::text
        )
    )
  );

create policy "auth upload social-media"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'social-media'
    and (storage.foldername(name))[1] = (select organization_id::text from profiles where id = auth.uid())
  );
