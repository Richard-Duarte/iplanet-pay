-- iPlanet Pay · reservations + atomic stock hold
-- Applied live as migration name: reservations_and_stock_hold
-- Pix / wallet_ledger / webhook credit remain TODO (do not invent money flows).

create type public.reservation_status as enum (
  'ativa',
  'quitada',
  'cancelada',
  'retirada'
);

create table public.reservations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  product_id uuid not null references public.products (id),
  store_id uuid not null references public.stores (id),
  status public.reservation_status not null default 'ativa',
  list_price_cents integer not null check (list_price_cents > 0),
  amount_paid_cents integer not null default 0 check (amount_paid_cents >= 0),
  notes text,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index reservations_user_id_idx on public.reservations (user_id);
create index reservations_status_idx on public.reservations (status);
create index reservations_store_id_idx on public.reservations (store_id);
create index reservations_product_id_idx on public.reservations (product_id);

create or replace function public.reservations_set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists reservations_set_updated_at on public.reservations;
create trigger reservations_set_updated_at
  before update on public.reservations
  for each row execute function public.reservations_set_updated_at();

alter table public.reservations enable row level security;

-- Cliente lê as próprias; staff/admin/parceiro leem todas.
create policy "reservations_select_own_or_ops"
  on public.reservations for select
  to authenticated
  using (
    user_id = auth.uid()
    or public.current_user_role() = any (
      array[
        'staff'::public.user_role,
        'admin'::public.user_role,
        'parceiro'::public.user_role
      ]
    )
  );

-- INSERT: sem política para authenticated. Criação só via create_reservation
-- (SECURITY DEFINER, user_id = auth.uid(), hold de estoque atômico).
-- Evita reserva sem decrementar store_stock.

-- Staff/admin atualizam status (quitada / retirada / cancelada / notes).
-- Cancelamento que devolve estoque: usar cancel_reservation.
create policy "reservations_staff_update"
  on public.reservations for update
  to authenticated
  using (
    public.current_user_role() = any (
      array['staff'::public.user_role, 'admin'::public.user_role]
    )
  )
  with check (
    public.current_user_role() = any (
      array['staff'::public.user_role, 'admin'::public.user_role]
    )
  );

-- Cliente cancela só via RPC (restaura estoque). Sem UPDATE de cliente.

-- ---------------------------------------------------------------------------
-- Atomic RPCs
-- ---------------------------------------------------------------------------

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
  v_qty integer;
  v_updated integer;
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

  -- Lock da linha de estoque (padrão Smart Pay: SELECT ... FOR UPDATE)
  -- antes de decrementar, para serializar reservas concorrentes na mesma loja+SKU.
  select ss.qty_available
    into v_qty
  from public.store_stock ss
  where ss.store_id = p_store_id
    and ss.product_id = p_product_id
  for update;

  if v_qty is null or v_qty < 1 then
    raise exception 'Sem estoque disponível nesta loja.';
  end if;

  update public.store_stock
     set qty_available = qty_available - 1
   where store_id = p_store_id
     and product_id = p_product_id
     and qty_available > 0;

  get diagnostics v_updated = row_count;
  if v_updated = 0 then
    raise exception 'Sem estoque disponível nesta loja.';
  end if;

  insert into public.reservations (
    user_id,
    product_id,
    store_id,
    status,
    list_price_cents,
    amount_paid_cents
  ) values (
    v_uid,
    p_product_id,
    p_store_id,
    'ativa',
    v_price,
    0
  )
  returning id into v_id;

  return v_id;
end;
$$;

create or replace function public.cancel_reservation(
  p_reservation_id uuid
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
  v_updated integer;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'É necessário estar autenticado.';
  end if;

  select *
    into v_res
  from public.reservations
  where id = p_reservation_id
  for update;

  if not found then
    raise exception 'Reserva não encontrada.';
  end if;

  v_role := public.current_user_role();

  if v_res.user_id <> v_uid
     and v_role is distinct from 'staff'
     and v_role is distinct from 'admin' then
    raise exception 'Você não pode cancelar esta reserva.';
  end if;

  if v_res.status <> 'ativa' then
    raise exception 'Só é possível cancelar reservas ativas.';
  end if;

  update public.reservations
     set status = 'cancelada'
   where id = p_reservation_id
     and status = 'ativa';

  get diagnostics v_updated = row_count;
  if v_updated = 0 then
    raise exception 'Só é possível cancelar reservas ativas.';
  end if;

  update public.store_stock
     set qty_available = qty_available + 1
   where store_id = v_res.store_id
     and product_id = v_res.product_id;

  return p_reservation_id;
end;
$$;

revoke all on function public.reservations_set_updated_at() from public;
revoke all on function public.reservations_set_updated_at() from anon, authenticated;

revoke all on function public.create_reservation(uuid, uuid) from public;
revoke all on function public.create_reservation(uuid, uuid) from anon;
grant execute on function public.create_reservation(uuid, uuid) to authenticated;

revoke all on function public.cancel_reservation(uuid) from public;
revoke all on function public.cancel_reservation(uuid) from anon;
grant execute on function public.cancel_reservation(uuid) to authenticated;

comment on table public.reservations is
  'Reserva de aparelho com snapshot de preço. amount_paid_cents / status quitada virão do webhook Pix (TODO).';
comment on function public.create_reservation(uuid, uuid) is
  'Cria reserva ativa, decrementa store_stock.qty_available em 1 de forma atômica.';
comment on function public.cancel_reservation(uuid) is
  'Cancela reserva ativa (dono ou staff/admin) e devolve 1 ao estoque.';


-- Table grants: create/cancel só via RPC; SELECT autenticado; UPDATE staff via RLS.
revoke all on table public.reservations from anon;
revoke insert, delete on table public.reservations from authenticated;
grant select, update on table public.reservations to authenticated;
