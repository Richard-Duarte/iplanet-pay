-- iPlanet Pay · catalog expand (applied live: expand_catalog_with_categories)

alter table public.products
  add column if not exists category text not null default 'iPhone';

create index if not exists products_category_idx on public.products (category);

update public.products set active = false
 where slug in (
   'iphone-15-128-azul',
   'iphone-15-pro-256-titaniobranco',
   'iphone-16-128-preto',
   'iphone-16-plus-128-ultramarino',
   'iphone-16-pro-256-titaniunegro',
   'iphone-16-pro-max-256-titaniudadeserto'
 );

insert into public.products (name, slug, brand, model, storage, color, list_price_cents, image_url, active, category)
values
  ('iPhone 15', 'iphone-15-128', 'Apple', 'iPhone 15', '128 GB', 'Azul', 549900, '/products/iphone-15.jpg', true, 'iPhone'),
  ('iPhone 15 Pro', 'iphone-15-pro-256', 'Apple', 'iPhone 15 Pro', '256 GB', 'Titânio Azul', 699900, '/products/iphone-15-pro.jpg', true, 'iPhone'),
  ('iPhone 16', 'iphone-16-128', 'Apple', 'iPhone 16', '128 GB', 'Preto', 699900, '/products/iphone-16.jpg', true, 'iPhone'),
  ('iPhone 16 Plus', 'iphone-16-plus-256', 'Apple', 'iPhone 16 Plus', '256 GB', 'Ultramarino', 799900, '/products/iphone-16-plus.jpg', true, 'iPhone'),
  ('iPhone 16 Pro', 'iphone-16-pro-256', 'Apple', 'iPhone 16 Pro', '256 GB', 'Titânio Negro', 949900, '/products/iphone-16-pro.jpg', true, 'iPhone'),
  ('iPhone 16 Pro Max', 'iphone-16-pro-max-256', 'Apple', 'iPhone 16 Pro Max', '256 GB', 'Titânio Deserto', 1099900, '/products/iphone-16-pro-max.jpg', true, 'iPhone'),
  ('iPhone 17e', 'iphone-17e-256', 'Apple', 'iPhone 17e', '256 GB', 'Preto', 599900, '/products/iphone-17e.png', true, 'iPhone'),
  ('iPhone 17', 'iphone-17-256', 'Apple', 'iPhone 17', '256 GB', 'Lavanda', 799900, '/products/iphone-17.png', true, 'iPhone'),
  ('iPhone 17 Pro', 'iphone-17-pro-256', 'Apple', 'iPhone 17 Pro', '256 GB', 'Laranja Cósmico', 1049900, '/products/iphone-17-pro.jpg', true, 'iPhone'),
  ('iPhone Air', 'iphone-air-256', 'Apple', 'iPhone Air', '256 GB', 'Azul Céu', 899900, '/products/iphone-air.png', true, 'iPhone'),
  ('iPhone 18 Pro', 'iphone-18-pro-256', 'Apple', 'iPhone 18 Pro', '256 GB', 'Preto', 1199900, '/products/iphone-18-pro.png', true, 'iPhone'),
  ('iPhone 18 Pro Max', 'iphone-18-pro-max-512', 'Apple', 'iPhone 18 Pro Max', '512 GB', 'Prata', 1449900, '/products/iphone-18-pro.png', true, 'iPhone'),
  ('iPhone Duo', 'iphone-duo-256', 'Apple', 'iPhone Duo', '256 GB', 'Star White', 1599900, '/products/iphone-duo.png', true, 'iPhone'),
  ('MacBook Air 13\" M4', 'macbook-air-13-m4-512', 'Apple', 'MacBook Air 13 M4', '512 GB', 'Azul Céu', 1099900, '/products/macbook-air-m4.jpg', true, 'MacBook'),
  ('MacBook Air 13\" M5', 'macbook-air-13-m5-512', 'Apple', 'MacBook Air 13 M5', '512 GB', 'Prata', 1249900, '/products/macbook-air-m5.png', true, 'MacBook'),
  ('MacBook Air 15\" M5', 'macbook-air-15-m5-512', 'Apple', 'MacBook Air 15 M5', '512 GB', 'Meia-noite', 1499900, '/products/macbook-air-m5.png', true, 'MacBook'),
  ('MacBook Pro 14\" M4', 'macbook-pro-14-m4-512', 'Apple', 'MacBook Pro 14 M4', '512 GB', 'Preto Espacial', 1699900, '/products/macbook-pro-m4.jpg', true, 'MacBook'),
  ('MacBook Pro 14\" M5 Pro', 'macbook-pro-14-m5-pro-1tb', 'Apple', 'MacBook Pro 14 M5 Pro', '1 TB', 'Preto Espacial', 2199900, '/products/macbook-pro-m5.png', true, 'MacBook'),
  ('MacBook Pro 16\" M5 Max', 'macbook-pro-16-m5-max-1tb', 'Apple', 'MacBook Pro 16 M5 Max', '1 TB', 'Prata', 3499900, '/products/macbook-pro-m5.png', true, 'MacBook'),
  ('Mac mini M4', 'mac-mini-m4-512', 'Apple', 'Mac mini M4', '512 GB', 'Prata', 699900, '/products/mac-mini.jpg', true, 'Mac'),
  ('iMac 24\" M4', 'imac-24-m4-512', 'Apple', 'iMac 24 M4', '512 GB', 'Azul', 1499900, '/products/imac.jpg', true, 'Mac'),
  ('Mac Studio M4 Max', 'mac-studio-m4-max-1tb', 'Apple', 'Mac Studio M4 Max', '1 TB', 'Prata', 2499900, '/products/mac-studio.jpg', true, 'Mac'),
  ('AirPods 4', 'airpods-4', 'Apple', 'AirPods 4', '—', 'Branco', 149900, '/products/airpods-4.jpg', true, 'AirPods'),
  ('AirPods Pro 2', 'airpods-pro-2', 'Apple', 'AirPods Pro 2', '—', 'Branco', 249900, '/products/airpods-pro.jpg', true, 'AirPods'),
  ('AirPods Max', 'airpods-max', 'Apple', 'AirPods Max', '—', 'Azul', 599900, '/products/airpods-max.jpg', true, 'AirPods'),
  ('Apple Watch SE', 'apple-watch-se-40', 'Apple', 'Apple Watch SE', '40 mm', 'Estelar', 299900, '/products/watch-se.png', true, 'Watch'),
  ('Apple Watch Series', 'apple-watch-series-46', 'Apple', 'Apple Watch Series', '46 mm', 'Preto Jet', 499900, '/products/watch-series.png', true, 'Watch'),
  ('Apple Watch Ultra', 'apple-watch-ultra', 'Apple', 'Apple Watch Ultra', '49 mm', 'Titânio', 899900, '/products/watch-ultra.png', true, 'Watch')
on conflict (slug) do update set
  name = excluded.name,
  model = excluded.model,
  storage = excluded.storage,
  color = excluded.color,
  list_price_cents = excluded.list_price_cents,
  image_url = excluded.image_url,
  active = excluded.active,
  category = excluded.category;

insert into public.store_stock (store_id, product_id, qty_available)
select s.id, p.id, 9999
from public.stores s
cross join public.products p
where s.slug in ('itaim-bibi', 'sao-caetano')
  and p.active = true
on conflict (store_id, product_id) do update set qty_available = 9999;

-- Anon read for landing catalog
drop policy if exists "products_select_anon_active" on public.products;
create policy "products_select_anon_active"
  on public.products for select
  to anon
  using (active = true);
grant select on public.products to anon;

drop policy if exists "store_stock_select_anon" on public.store_stock;
create policy "store_stock_select_anon"
  on public.store_stock for select
  to anon
  using (true);
grant select on public.store_stock to anon;

drop policy if exists "stores_select_anon" on public.stores;
create policy "stores_select_anon"
  on public.stores for select
  to anon
  using (true);
grant select on public.stores to anon;
