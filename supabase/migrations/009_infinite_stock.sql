-- iPlanet Pay · infinite stock — reservations ignore store_stock holds
-- Applied live as: infinite_stock_relax_reservation_rpcs

create or replace function public.create_reservation(
  p_product_id uuid,
  p_store_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_price integer;
  v_id uuid;
  v_store_exists boolean;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'É necessário estar autenticado para reservar.';
  end if;

  select p.list_price_cents
    into v_price
  from public.products p
  where p.id = p_product_id
    and p.active = true;

  if v_price is null then
    raise exception 'Produto indisponível ou inativo.';
  end if;

  select exists(select 1 from public.stores s where s.id = p_store_id)
    into v_store_exists;

  if not v_store_exists then
    raise exception 'Loja inválida.';
  end if;

  insert into public.reservations (
    user_id, product_id, store_id, status, list_price_cents, amount_paid_cents
  ) values (
    v_uid, p_product_id, p_store_id, 'ativa', v_price, 0
  )
  returning id into v_id;

  return v_id;
end;
$$;

create or replace function public.cancel_reservation(p_reservation_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_role public.user_role;
  v_res public.reservations%rowtype;
  v_updated integer;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'É necessário estar autenticado.';
  end if;

  select * into v_res from public.reservations where id = p_reservation_id for update;
  if not found then raise exception 'Reserva não encontrada.'; end if;

  v_role := public.current_user_role();
  if v_res.user_id <> v_uid and v_role is distinct from 'staff' and v_role is distinct from 'admin' then
    raise exception 'Você não pode cancelar esta reserva.';
  end if;
  if v_res.status <> 'ativa' then
    raise exception 'Só é possível cancelar reservas ativas.';
  end if;

  update public.reservations set status = 'cancelada'
   where id = p_reservation_id and status = 'ativa';
  get diagnostics v_updated = row_count;
  if v_updated = 0 then raise exception 'Só é possível cancelar reservas ativas.'; end if;

  return p_reservation_id;
end;
$$;

create or replace function public.switch_reservation(
  p_old_reservation_id uuid,
  p_new_product_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_role public.user_role;
  v_res public.reservations%rowtype;
  v_new_price integer;
  v_new_active boolean;
  v_contrib_sum integer;
  v_transfer integer;
  v_new_status public.reservation_status;
  v_new_id uuid;
  v_updated integer;
begin
  v_uid := auth.uid();
  if v_uid is null then raise exception 'É necessário estar autenticado.'; end if;
  v_role := public.current_user_role();

  select * into v_res from public.reservations where id = p_old_reservation_id for update;
  if not found then raise exception 'Reserva não encontrada.'; end if;

  if v_res.user_id <> v_uid and v_role is distinct from 'staff' and v_role is distinct from 'admin' then
    raise exception 'Você não pode trocar esta reserva.';
  end if;
  if v_res.status <> 'ativa' then
    raise exception 'Só é possível trocar reservas ativas. Status: %.', v_res.status;
  end if;
  if v_res.product_id = p_new_product_id then
    raise exception 'Este produto já está reservado nesta reserva.';
  end if;

  select p.list_price_cents, p.active into v_new_price, v_new_active
  from public.products p where p.id = p_new_product_id;
  if v_new_price is null or not v_new_active then
    raise exception 'Produto de destino indisponível ou inativo.';
  end if;

  select coalesce(sum(c.amount_cents), 0) into v_contrib_sum
  from public.contributions c
  where c.reservation_id = p_old_reservation_id and c.status in ('confirmed', 'pending');
  v_transfer := greatest(v_res.amount_paid_cents, v_contrib_sum);

  if v_transfer >= v_new_price then v_new_status := 'quitada'; else v_new_status := 'ativa'; end if;

  update public.reservations
     set status = 'trocada', amount_paid_cents = 0,
         notes = coalesce(nullif(notes, '') || E'\n', '') || 'Trocada → novo produto ' || p_new_product_id::text
   where id = p_old_reservation_id and status = 'ativa';
  get diagnostics v_updated = row_count;
  if v_updated = 0 then raise exception 'Só é possível trocar reservas ativas.'; end if;

  insert into public.reservations (
    user_id, product_id, store_id, status, list_price_cents, amount_paid_cents, notes
  ) values (
    v_res.user_id, p_new_product_id, v_res.store_id, v_new_status, v_new_price, v_transfer,
    'Troca a partir de ' || p_old_reservation_id::text
  ) returning id into v_new_id;

  update public.contributions set reservation_id = v_new_id
   where reservation_id = p_old_reservation_id and status in ('confirmed', 'pending');

  return v_new_id;
end;
$$;

comment on function public.create_reservation(uuid, uuid) is
  'Cria reserva ativa se produto ativo + loja existe. Estoque infinito — não muta store_stock.';
comment on function public.cancel_reservation(uuid) is
  'Cancela reserva ativa. Estoque infinito — não devolve store_stock.';
comment on function public.switch_reservation(uuid, uuid) is
  'Troca aparelho na mesma loja sem hold de estoque.';
