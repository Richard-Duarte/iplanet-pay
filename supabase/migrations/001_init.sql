-- iPlanet Pay · schema inicial (auth + RLS skeleton)
-- Execute no Supabase SQL editor ou via CLI.

create extension if not exists "pgcrypto";

create type public.user_role as enum ('cliente', 'parceiro', 'staff', 'admin');

create table if not exists public.stores (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  address text not null,
  city text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  phone text,
  role public.user_role not null default 'cliente',
  store_id uuid references public.stores (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists profiles_role_idx on public.profiles (role);
create index if not exists profiles_store_id_idx on public.profiles (store_id);

-- Helper: papel do usuário autenticado
create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

revoke all on function public.current_user_role() from public;
grant execute on function public.current_user_role() to authenticated;

-- Trigger: cria profile cliente ao cadastrar
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.raw_user_meta_data->>'phone',
    'cliente'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.stores enable row level security;
alter table public.profiles enable row level security;

-- stores: leitura autenticada; admin gerencia
create policy "stores_select_authenticated"
  on public.stores for select
  to authenticated
  using (true);

create policy "stores_admin_all"
  on public.stores for all
  to authenticated
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

-- profiles: próprio usuário lê/atualiza; staff lê; admin full
create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using (
    id = auth.uid()
    or public.current_user_role() in ('staff', 'admin')
  );

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (id = auth.uid() or public.current_user_role() = 'admin')
  with check (
    id = auth.uid()
    or public.current_user_role() = 'admin'
  );

create policy "profiles_admin_insert"
  on public.profiles for insert
  to authenticated
  with check (public.current_user_role() = 'admin' or id = auth.uid());

create policy "profiles_admin_delete"
  on public.profiles for delete
  to authenticated
  using (public.current_user_role() = 'admin');

-- Seed lojas iPlanet
insert into public.stores (name, slug, address, city)
values
  ('iPlanet Itaim Bibi', 'itaim-bibi', 'Itaim Bibi', 'São Paulo'),
  ('iPlanet São Caetano', 'sao-caetano', 'Centro', 'São Caetano do Sul')
on conflict (slug) do nothing;

-- TODO (próximas migrations):
-- products, reservations, wallet_ledger, pix_charges, webhooks_inbox
