-- iPlanet Pay · troca de aparelho (switch_reservation)
-- Applied live as:
--   1) add_reservation_status_trocada  (ALTER TYPE)
--   2) switch_reservation_rpc         (RPC + confirm fix)
-- Adapted from Smart Pay switch_reservation (pending in balance + re-point contributions).
--
-- Design notes:
--   * Same store_id as old reservation (v1 — no store change).
--   * Stock atomic: restore +1 old product, hold -1 new product (FOR UPDATE).
--   * Paid progress: GREATEST(amount_paid_cents, SUM confirmed+pending) → new reservation.
--   * Contributions confirmed|pending re-pointed to new reservation_id.
--   * wallet_ledger: leave historical rows on OLD reservation (audit). New gets amount_paid snapshot only.
--   * Old status → trocada; amount_paid_cents zeroed (balance moved).
--   * If transferred >= new list_price → new status quitada.
--   * Excess (paid > new price): kept on new amount_paid (may exceed list); status quitada.
--     No profile.balance harvest in iPlanet v1.
--   * Who: owner of própria ativa; staff/admin any (p_admin unused — auth via role).
--   * Parceiro: cannot switch (skip).
--   * confirm: _confirm_contribution_internal uses GREATEST recalculation so pending
--     already included at switch is not double-counted on later webhook confirm.

-- ---------------------------------------------------------------------------
-- Enum: trocada
-- ---------------------------------------------------------------------------

alter type public.reservation_status add value if not exists 'trocada';

-- ---------------------------------------------------------------------------
-- switch_reservation
-- ---------------------------------------------------------------------------

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
  v_new_qty integer;
  v_updated integer;
  v_first_product uuid;
  v_second_product uuid;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'É necessário estar autenticado.';
  end if;

  v_role := public.current_user_role();

  select *
    into v_res
  from public.reservations
  where id = p_old_reservation_id
  for update;

  if not found then
    raise exception 'Reserva não encontrada.';
  end if;

  -- Owner or staff/admin. Parceiro: não.
  if v_res.user_id <> v_uid
     and v_role is distinct from 'staff'
     and v_role is distinct from 'admin' then
    raise exception 'Você não pode trocar esta reserva.';
  end if;

  if v_res.status <> 'ativa' then
    raise exception 'Só é possível trocar reservas ativas. Status: %.', v_res.status;
  end if;

  if v_res.product_id = p_new_product_id then
    raise exception 'Este produto já está reservado nesta reserva.';
  end if;

  select p.list_price_cents, p.active
    into v_new_price, v_new_active
  from public.products p
  where p.id = p_new_product_id;

  if v_new_price is null or not v_new_active then
    raise exception 'Produto de destino indisponível ou inativo.';
  end if;

  -- Balance: amount_paid snapshot + any pending not yet in amount_paid
  select coalesce(sum(c.amount_cents), 0)
    into v_contrib_sum
  from public.contributions c
  where c.reservation_id = p_old_reservation_id
    and c.status in ('confirmed', 'pending');

  v_transfer := greatest(v_res.amount_paid_cents, v_contrib_sum);

  -- Lock both stock rows in stable product_id order to avoid deadlock
  if v_res.product_id < p_new_product_id then
    v_first_product := v_res.product_id;
    v_second_product := p_new_product_id;
  else
    v_first_product := p_new_product_id;
    v_second_product := v_res.product_id;
  end if;

  -- Ensure both rows exist and lock them
  perform 1
  from public.store_stock
  where store_id = v_res.store_id
    and product_id = v_first_product
  for update;

  perform 1
  from public.store_stock
  where store_id = v_res.store_id
    and product_id = v_second_product
  for update;

  select ss.qty_available
    into v_new_qty
  from public.store_stock ss
  where ss.store_id = v_res.store_id
    and ss.product_id = p_new_product_id;

  if v_new_qty is null or v_new_qty < 1 then
    raise exception 'Sem estoque disponível nesta loja para o novo aparelho.';
  end if;

  -- Hold new product
  update public.store_stock
     set qty_available = qty_available - 1
   where store_id = v_res.store_id
     and product_id = p_new_product_id
     and qty_available > 0;

  get diagnostics v_updated = row_count;
  if v_updated = 0 then
    raise exception 'Sem estoque disponível nesta loja para o novo aparelho.';
  end if;

  -- Restore old product (row may be missing if seed never had it — upsert-safe)
  update public.store_stock
     set qty_available = qty_available + 1
   where store_id = v_res.store_id
     and product_id = v_res.product_id;

  get diagnostics v_updated = row_count;
  if v_updated = 0 then
    insert into public.store_stock (store_id, product_id, qty_available)
    values (v_res.store_id, v_res.product_id, 1);
  end if;

  if v_transfer >= v_new_price then
    v_new_status := 'quitada';
  else
    v_new_status := 'ativa';
  end if;

  -- Mark old as trocada; zero paid (moved)
  update public.reservations
     set status = 'trocada',
         amount_paid_cents = 0,
         notes = coalesce(nullif(notes, '') || E'\n', '') || 'Trocada → novo produto ' || p_new_product_id::text
   where id = p_old_reservation_id
     and status = 'ativa';

  get diagnostics v_updated = row_count;
  if v_updated = 0 then
    raise exception 'Só é possível trocar reservas ativas.';
  end if;

  insert into public.reservations (
    user_id,
    product_id,
    store_id,
    status,
    list_price_cents,
    amount_paid_cents,
    notes
  ) values (
    v_res.user_id,
    p_new_product_id,
    v_res.store_id,
    v_new_status,
    v_new_price,
    v_transfer,
    'Troca a partir de ' || p_old_reservation_id::text
  )
  returning id into v_new_id;

  -- Re-point confirmed + pending contributions (pix_charges follow via contribution_id)
  update public.contributions
     set reservation_id = v_new_id
   where reservation_id = p_old_reservation_id
     and status in ('confirmed', 'pending');

  -- wallet_ledger: leave historical rows on old reservation (documented choice).

  return v_new_id;
end;
$$;

revoke all on function public.switch_reservation(uuid, uuid) from public;
revoke all on function public.switch_reservation(uuid, uuid) from anon;
grant execute on function public.switch_reservation(uuid, uuid) to authenticated;

comment on function public.switch_reservation(uuid, uuid) is
  'Troca aparelho: restaura estoque antigo, hold novo (mesma loja), move amount_paid+pending, re-point contributions, old→trocada. wallet_ledger permanece no histórico da antiga.';

-- ---------------------------------------------------------------------------
-- confirm: avoid double-count after switch that already included pending
-- ---------------------------------------------------------------------------

create or replace function public._confirm_contribution_internal(
  p_contribution_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_contrib public.contributions%rowtype;
  v_paid integer;
  v_list integer;
  v_new_status public.reservation_status;
  v_sum_open integer;
begin
  select *
    into v_contrib
  from public.contributions
  where id = p_contribution_id
  for update;

  if not found then
    raise exception 'Aporte não encontrado.';
  end if;

  if v_contrib.status = 'confirmed' then
    select amount_paid_cents, list_price_cents, status
      into v_paid, v_list, v_new_status
    from public.reservations
    where id = v_contrib.reservation_id;

    return jsonb_build_object(
      'ok', true,
      'already_confirmed', true,
      'contribution_id', v_contrib.id,
      'reservation_id', v_contrib.reservation_id,
      'amount_cents', v_contrib.amount_cents,
      'amount_paid_cents', v_paid,
      'reservation_status', v_new_status
    );
  end if;

  if v_contrib.status <> 'pending' then
    raise exception 'Aporte não está pendente (status: %).', v_contrib.status;
  end if;

  update public.contributions
     set status = 'confirmed',
         confirmed_at = now()
   where id = p_contribution_id
     and status = 'pending';

  if not found then
    return public._confirm_contribution_internal(p_contribution_id);
  end if;

  -- Recalculate: confirmed + remaining pending (covers switch that pre-included pending)
  select coalesce(sum(amount_cents), 0)
    into v_sum_open
  from public.contributions
  where reservation_id = v_contrib.reservation_id
    and status in ('confirmed', 'pending');

  update public.reservations
     set amount_paid_cents = greatest(amount_paid_cents, v_sum_open),
         status = case
           when greatest(amount_paid_cents, v_sum_open) >= list_price_cents
                and status = 'ativa'
             then 'quitada'::public.reservation_status
           else status
         end
   where id = v_contrib.reservation_id
  returning amount_paid_cents, list_price_cents, status
    into v_paid, v_list, v_new_status;

  insert into public.wallet_ledger (
    user_id,
    reservation_id,
    contribution_id,
    entry_type,
    amount_cents,
    memo
  ) values (
    v_contrib.user_id,
    v_contrib.reservation_id,
    v_contrib.id,
    'aporte',
    v_contrib.amount_cents,
    'Aporte Pix confirmado'
  )
  on conflict do nothing;

  update public.pix_charges
     set status = 'paid'
   where contribution_id = p_contribution_id
     and status = 'pending';

  return jsonb_build_object(
    'ok', true,
    'already_confirmed', false,
    'contribution_id', v_contrib.id,
    'reservation_id', v_contrib.reservation_id,
    'amount_cents', v_contrib.amount_cents,
    'amount_paid_cents', v_paid,
    'reservation_status', v_new_status
  );
end;
$$;

revoke all on function public._confirm_contribution_internal(uuid) from public, anon, authenticated;

comment on function public._confirm_contribution_internal(uuid) is
  'Confirma aporte. amount_paid = GREATEST(atual, sum confirmed+pending) — safe após switch_reservation.';
