-- iPlanet Pay · estoque adjust + admin role RPC
-- set_store_stock: admin/staff any store; parceiro only own profiles.store_id
-- admin_set_user_role: admin-only; when parceiro, set store_id; clear store_id otherwise
-- Also tightens store_stock write RLS so parceiro cannot edit other lojas via direct table writes.

-- ---------------------------------------------------------------------------
-- set_store_stock
-- ---------------------------------------------------------------------------

create or replace function public.set_store_stock(
  p_store_id uuid,
  p_product_id uuid,
  p_qty integer
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_role public.user_role;
  v_partner_store uuid;
  v_id uuid;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'É necessário estar autenticado.';
  end if;

  if p_store_id is null or p_product_id is null then
    raise exception 'Loja e produto são obrigatórios.';
  end if;

  if p_qty is null or p_qty < 0 then
    raise exception 'Quantidade deve ser zero ou positiva.';
  end if;

  if not exists (select 1 from public.stores where id = p_store_id) then
    raise exception 'Loja não encontrada.';
  end if;

  if not exists (select 1 from public.products where id = p_product_id) then
    raise exception 'Produto não encontrado.';
  end if;

  v_role := public.current_user_role();

  if v_role = 'admin' or v_role = 'staff' then
    null; -- any store
  elsif v_role = 'parceiro' then
    select store_id into v_partner_store
    from public.profiles
    where id = v_uid;

    if v_partner_store is null then
      raise exception 'Loja não vinculada. Peça ao admin para associar sua conta a uma loja.';
    end if;

    if v_partner_store is distinct from p_store_id then
      raise exception 'Você só pode ajustar o estoque da sua loja.';
    end if;
  else
    raise exception 'Sem permissão para ajustar estoque.';
  end if;

  insert into public.store_stock (store_id, product_id, qty_available)
  values (p_store_id, p_product_id, p_qty)
  on conflict (store_id, product_id)
  do update set qty_available = excluded.qty_available
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.set_store_stock(uuid, uuid, integer) from public;
revoke all on function public.set_store_stock(uuid, uuid, integer) from anon;
grant execute on function public.set_store_stock(uuid, uuid, integer) to authenticated;

-- ---------------------------------------------------------------------------
-- admin_set_user_role
-- ---------------------------------------------------------------------------

create or replace function public.admin_set_user_role(
  p_user_id uuid,
  p_role public.user_role,
  p_store_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_role public.user_role;
  v_final_store uuid;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'É necessário estar autenticado.';
  end if;

  v_role := public.current_user_role();
  if v_role is distinct from 'admin' then
    raise exception 'Somente admin pode alterar papéis.';
  end if;

  if p_user_id is null then
    raise exception 'Usuário inválido.';
  end if;

  if p_role is null then
    raise exception 'Papel inválido.';
  end if;

  if not exists (select 1 from public.profiles where id = p_user_id) then
    raise exception 'Perfil não encontrado.';
  end if;

  -- Impede auto-rebaixamento acidental
  if p_user_id = v_uid and p_role is distinct from 'admin' then
    raise exception 'Você não pode remover seu próprio acesso de admin.';
  end if;

  if p_role = 'parceiro' then
    if p_store_id is not null
       and not exists (select 1 from public.stores where id = p_store_id) then
      raise exception 'Loja não encontrada.';
    end if;
    v_final_store := p_store_id;
  else
    v_final_store := null;
  end if;

  update public.profiles
  set
    role = p_role,
    store_id = v_final_store
  where id = p_user_id;
end;
$$;

revoke all on function public.admin_set_user_role(uuid, public.user_role, uuid) from public;
revoke all on function public.admin_set_user_role(uuid, public.user_role, uuid) from anon;
grant execute on function public.admin_set_user_role(uuid, public.user_role, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Tighten store_stock write policies (parceiro = own store only)
-- ---------------------------------------------------------------------------

drop policy if exists "store_stock_staff_write" on public.store_stock;
create policy "store_stock_staff_write"
  on public.store_stock for insert
  to authenticated
  with check (
    public.current_user_role() = any (array['admin'::public.user_role, 'staff'::public.user_role])
    or (
      public.current_user_role() = 'parceiro'
      and store_id = (select store_id from public.profiles where id = auth.uid())
    )
  );

drop policy if exists "store_stock_staff_update" on public.store_stock;
create policy "store_stock_staff_update"
  on public.store_stock for update
  to authenticated
  using (
    public.current_user_role() = any (array['admin'::public.user_role, 'staff'::public.user_role])
    or (
      public.current_user_role() = 'parceiro'
      and store_id = (select store_id from public.profiles where id = auth.uid())
    )
  )
  with check (
    public.current_user_role() = any (array['admin'::public.user_role, 'staff'::public.user_role])
    or (
      public.current_user_role() = 'parceiro'
      and store_id = (select store_id from public.profiles where id = auth.uid())
    )
  );
