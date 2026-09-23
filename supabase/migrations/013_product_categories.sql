-- iPlanet Pay · product categories (dynamic catalog tabs + admin CRUD)
-- Applied live as: product_categories

create table if not exists public.product_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists product_categories_active_sort_idx
  on public.product_categories (active, sort_order, name);

-- Slug helper (pt-BR accents)
create or replace function public.slugify_text(t text)
returns text
language sql
immutable
as $$
  select nullif(
    trim(both '-' from regexp_replace(
      lower(
        translate(
          coalesce(t, ''),
          'áàâãäéèêëíìîïóòôõöúùûüçñÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑ',
          'aaaaaeeeeiiiiooooouuuucnaaaaaeeeeiiiiooooouuuucn'
        )
      ),
      '[^a-z0-9]+', '-', 'g'
    )),
    ''
  );
$$;

-- Seed from distinct products.category (preferred order first)
insert into public.product_categories (name, slug, sort_order, active)
select
  d.category,
  coalesce(public.slugify_text(d.category), 'categoria'),
  d.sort_order,
  true
from (
  select distinct
    p.category,
    case p.category
      when 'iPhone' then 1
      when 'MacBook' then 2
      when 'Mac' then 3
      when 'AirPods' then 4
      when 'Watch' then 5
      else 100 + ascii(left(p.category, 1))
    end as sort_order
  from public.products p
  where p.category is not null
    and length(trim(p.category)) > 0
) d
on conflict (name) do nothing;

alter table public.products
  add column if not exists category_id uuid references public.product_categories (id);

create index if not exists products_category_id_idx on public.products (category_id);

-- Backfill category_id from text
update public.products p
set category_id = c.id
from public.product_categories c
where p.category_id is null
  and p.category = c.name;

-- Keep products.category text in sync when category_id is set
create or replace function public.sync_product_category_text()
returns trigger
language plpgsql
as $$
begin
  if new.category_id is not null then
    select c.name into new.category
    from public.product_categories c
    where c.id = new.category_id;
  elsif new.category is not null and length(trim(new.category)) > 0 then
    -- resolve or leave text; category_id may stay null until admin links
    null;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_sync_product_category_text on public.products;
create trigger trg_sync_product_category_text
  before insert or update of category_id, category
  on public.products
  for each row
  execute function public.sync_product_category_text();

-- RLS
alter table public.product_categories enable row level security;

drop policy if exists "product_categories_select_active" on public.product_categories;
create policy "product_categories_select_active"
  on public.product_categories for select
  to anon, authenticated
  using (
    active = true
    or public.current_user_role() = any (
      array['admin'::public.user_role, 'staff'::public.user_role]
    )
  );

drop policy if exists "product_categories_admin_all" on public.product_categories;
create policy "product_categories_admin_all"
  on public.product_categories for all
  to authenticated
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

grant select on public.product_categories to anon, authenticated;
grant insert, update, delete on public.product_categories to authenticated;

-- Optional RPC: create category if missing (admin only)
create or replace function public.admin_upsert_category(p_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text;
  v_slug text;
  v_id uuid;
  v_max int;
begin
  if public.current_user_role() is distinct from 'admin' then
    raise exception 'Somente admin pode criar categorias.';
  end if;

  v_name := trim(p_name);
  if v_name is null or length(v_name) = 0 then
    raise exception 'Nome da categoria é obrigatório.';
  end if;

  select id into v_id from public.product_categories where name = v_name;
  if v_id is not null then
    return v_id;
  end if;

  v_slug := coalesce(public.slugify_text(v_name), 'categoria');
  -- uniquify slug if needed
  if exists (select 1 from public.product_categories where slug = v_slug) then
    v_slug := v_slug || '-' || substr(gen_random_uuid()::text, 1, 8);
  end if;

  select coalesce(max(sort_order), 0) + 1 into v_max from public.product_categories;

  insert into public.product_categories (name, slug, sort_order, active)
  values (v_name, v_slug, v_max, true)
  returning id into v_id;

  return v_id;
end;
$$;

grant execute on function public.admin_upsert_category(text) to authenticated;

comment on table public.product_categories is
  'Categorias dinâmicas do catálogo (abas na landing + admin produtos).';
