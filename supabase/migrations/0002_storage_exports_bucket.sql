-- Create Storage bucket for exports
-- Supabase Storage uses the `storage` schema and `buckets` table.
-- This insert is safe to run multiple times.
insert into storage.buckets (id, name, public)
select 'exports', 'exports', false
where not exists (
  select 1 from storage.buckets where id = 'exports'
);
