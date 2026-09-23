-- iPlanet Pay · products + store_stock (mirrors applied migration products_and_store_stock)
-- Do not re-apply on project zjnikfrledckmjahwnsb — already live. Keep in repo for fresh envs.

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  brand text not null default 'Apple',
  model text not null,
  storage text not null,
  color text,
  list_price_cents integer not null check (list_price_cents > 0),
  image_url text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.store_stock (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  qty_available integer not null default 0 check (qty_available >= 0),
  unique (store_id, product_id)
);

create index if not exists products_active_idx on public.products (active);
create index if not exists store_stock_product_idx on public.store_stock (product_id);

alter table public.products enable row level security;
alter table public.store_stock enable row level security;

-- products: autenticados veem ativos; staff/admin/parceiro veem todos; admin escreve
drop policy if exists "products_select_authenticated" on public.products;
create policy "products_select_authenticated"
  on public.products for select
  to authenticated
  using (
    active = true
    or public.current_user_role() = any (array['staff'::public.user_role, 'admin'::public.user_role, 'parceiro'::public.user_role])
  );

drop policy if exists "products_admin_write" on public.products;
create policy "products_admin_write"
  on public.products for all
  to authenticated
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

-- store_stock: leitura autenticada; staff/admin/parceiro inserem/atualizam; admin deleta
drop policy if exists "store_stock_select_authenticated" on public.store_stock;
create policy "store_stock_select_authenticated"
  on public.store_stock for select
  to authenticated
  using (true);

drop policy if exists "store_stock_staff_write" on public.store_stock;
create policy "store_stock_staff_write"
  on public.store_stock for insert
  to authenticated
  with check (
    public.current_user_role() = any (array['admin'::public.user_role, 'staff'::public.user_role, 'parceiro'::public.user_role])
  );

drop policy if exists "store_stock_staff_update" on public.store_stock;
create policy "store_stock_staff_update"
  on public.store_stock for update
  to authenticated
  using (
    public.current_user_role() = any (array['admin'::public.user_role, 'staff'::public.user_role, 'parceiro'::public.user_role])
  )
  with check (
    public.current_user_role() = any (array['admin'::public.user_role, 'staff'::public.user_role, 'parceiro'::public.user_role])
  );

drop policy if exists "store_stock_admin_delete" on public.store_stock;
create policy "store_stock_admin_delete"
  on public.store_stock for delete
  to authenticated
  using (public.current_user_role() = 'admin');

-- Seed: 6 iPhones
insert into public.products (name, slug, brand, model, storage, color, list_price_cents)
values
  ('iPhone 15', 'iphone-15-128-azul', 'Apple', 'iPhone 15', '128 GB', 'Azul', 599900),
  ('iPhone 15 Pro', 'iphone-15-pro-256-titaniobranco', 'Apple', 'iPhone 15 Pro', '256 GB', 'Titânio Branco', 799900),
  ('iPhone 16', 'iphone-16-128-preto', 'Apple', 'iPhone 16', '128 GB', 'Preto', 749900),
  ('iPhone 16 Plus', 'iphone-16-plus-128-ultramarino', 'Apple', 'iPhone 16 Plus', '128 GB', 'Ultramarino', 849900),
  ('iPhone 16 Pro', 'iphone-16-pro-256-titaniunegro', 'Apple', 'iPhone 16 Pro', '256 GB', 'Titânio Negro', 999900),
  ('iPhone 16 Pro Max', 'iphone-16-pro-max-256-titaniudadeserto', 'Apple', 'iPhone 16 Pro Max', '256 GB', 'Titânio Deserto', 1199900)
on conflict (slug) do nothing;

-- Estoque inicial: 3 em Itaim Bibi, 2 em São Caetano
insert into public.store_stock (store_id, product_id, qty_available)
select s.id, p.id, case when s.slug = 'itaim-bibi' then 3 else 2 end
from public.stores s
cross join public.products p
where s.slug in ('itaim-bibi', 'sao-caetano')
  and p.slug in (
    'iphone-15-128-azul',
    'iphone-15-pro-256-titaniobranco',
    'iphone-16-128-preto',
    'iphone-16-plus-128-ultramarino',
    'iphone-16-pro-256-titaniunegro',
    'iphone-16-pro-max-256-titaniudadeserto'
  )
on conflict (store_id, product_id) do nothing;
