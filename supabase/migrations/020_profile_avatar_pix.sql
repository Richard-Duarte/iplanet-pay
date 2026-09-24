-- profiles: avatar + chave Pix do cliente
alter table public.profiles
  add column if not exists avatar_url text;

alter table public.profiles
  add column if not exists pix_key text;

alter table public.profiles
  add column if not exists pix_key_type text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_pix_key_type_check'
  ) then
    alter table public.profiles
      add constraint profiles_pix_key_type_check
      check (
        pix_key_type is null
        or pix_key_type = any (array['cpf', 'cnpj', 'email', 'phone', 'random'])
      );
  end if;
end $$;

comment on column public.profiles.avatar_url is 'URL pública da foto de perfil (storage avatars ou externa)';
comment on column public.profiles.pix_key is 'Chave Pix preferencial do cliente';
comment on column public.profiles.pix_key_type is 'Tipo da chave Pix: cpf|cnpj|email|phone|random';

-- Bucket público de avatars (leitura pública; escrita só do dono)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "avatars_public_read" on storage.objects;
create policy "avatars_public_read"
  on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "avatars_owner_insert" on storage.objects;
create policy "avatars_owner_insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatars_owner_update" on storage.objects;
create policy "avatars_owner_update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatars_owner_delete" on storage.objects;
create policy "avatars_owner_delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
