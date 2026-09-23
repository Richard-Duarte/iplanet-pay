-- Fix anon SELECT on product_categories (current_user_role not granted to anon)
-- Applied live as: product_categories_anon_select_fix

drop policy if exists "product_categories_select_active" on public.product_categories;
drop policy if exists "product_categories_select_anon_active" on public.product_categories;
drop policy if exists "product_categories_select_authenticated" on public.product_categories;

create policy "product_categories_select_anon_active"
  on public.product_categories for select
  to anon
  using (active = true);

create policy "product_categories_select_authenticated"
  on public.product_categories for select
  to authenticated
  using (
    active = true
    or public.current_user_role() = any (
      array['admin'::public.user_role, 'staff'::public.user_role]
    )
  );

grant select on public.product_categories to anon, authenticated;
