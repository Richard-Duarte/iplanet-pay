-- iPlanet Pay · carteira + aportes Pix
-- Live: wallet_pix_contributions (+ ledger/rpcs follow-ups). Local file is the full source of truth.
-- Adapted from Smart Pay create_contribution / confirm_contribution (atomic cents model).
--
-- Money model (documented):
--   * Source of truth for paid progress = reservations.amount_paid_cents
--     (bumped ONLY by confirm_contribution / admin_confirm_contribution).
--   * wallet_ledger is append-only audit: amount_cents is SIGNED
--     (positive = crédito aporte/ajuste; negative = estorno).
--   * Clients NEVER insert money rows; only SECURITY DEFINER RPCs.
--   * confirm_contribution is idempotent (pending→confirmed once) and
--     executable only by service_role (webhook). Staff/admin use
--     admin_confirm_contribution.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

do $$ begin
  create type public.contribution_status as enum (
    'pending', 'confirmed', 'failed', 'refunded', 'expired'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.wallet_entry_type as enum (
    'aporte', 'aplicacao', 'estorno', 'ajuste'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.pix_charge_status as enum (
    'pending', 'paid', 'expired', 'cancelled', 'failed'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.webhook_inbox_status as enum (
    'received', 'processed', 'ignored', 'error'
  );
exception when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- contributions
-- ---------------------------------------------------------------------------

create table if not exists public.contributions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  reservation_id uuid not null references public.reservations (id) on delete cascade,
  amount_cents integer not null check (amount_cents > 0),
  payment_method text not null default 'pix',
  status public.contribution_status not null default 'pending',
  pix_code text,
  pix_qr_base64 text,
  gateway_payment_id text,
  gateway_provider text,
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists contributions_user_id_idx on public.contributions (user_id);
create index if not exists contributions_reservation_id_idx on public.contributions (reservation_id);
create index if not exists contributions_status_idx on public.contributions (status);
create index if not exists contributions_gateway_payment_id_idx
  on public.contributions (gateway_payment_id)
  where gateway_payment_id is not null;

create or replace function public.contributions_set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists contributions_set_updated_at on public.contributions;
create trigger contributions_set_updated_at
  before update on public.contributions
  for each row execute function public.contributions_set_updated_at();

alter table public.contributions enable row level security;

drop policy if exists contributions_select_own_or_ops on public.contributions;
create policy contributions_select_own_or_ops
  on public.contributions for select
  to authenticated
  using (
    user_id = auth.uid()
    or public.current_user_role() = any (
      array['staff'::public.user_role, 'admin'::public.user_role]
    )
  );

-- Sem INSERT/UPDATE/DELETE para authenticated: só RPCs SECURITY DEFINER.

revoke all on table public.contributions from anon;
revoke insert, update, delete on table public.contributions from authenticated;
grant select on table public.contributions to authenticated;

-- ---------------------------------------------------------------------------
-- wallet_ledger (append-only audit)
-- ---------------------------------------------------------------------------

create table if not exists public.wallet_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  reservation_id uuid references public.reservations (id) on delete set null,
  contribution_id uuid references public.contributions (id) on delete set null,
  entry_type public.wallet_entry_type not null,
  -- Signed cents: +crédito (aporte/ajuste), -débito (estorno/aplicacao).
  amount_cents integer not null check (amount_cents <> 0),
  memo text,
  created_at timestamptz not null default now()
);

comment on table public.wallet_ledger is
  'Append-only ledger. amount_cents signed (+ crédito, - débito). Paid progress SoT = reservations.amount_paid_cents.';

create index if not exists wallet_ledger_user_id_idx on public.wallet_ledger (user_id);
create index if not exists wallet_ledger_reservation_id_idx on public.wallet_ledger (reservation_id);
create index if not exists wallet_ledger_contribution_id_idx on public.wallet_ledger (contribution_id);

-- One ledger aporte row per contribution (idempotency aid).
create unique index if not exists wallet_ledger_aporte_contribution_uidx
  on public.wallet_ledger (contribution_id)
  where contribution_id is not null and entry_type = 'aporte';

alter table public.wallet_ledger enable row level security;

drop policy if exists wallet_ledger_select_own_or_ops on public.wallet_ledger;
create policy wallet_ledger_select_own_or_ops
  on public.wallet_ledger for select
  to authenticated
  using (
    user_id = auth.uid()
    or public.current_user_role() = any (
      array['staff'::public.user_role, 'admin'::public.user_role]
    )
  );

revoke all on table public.wallet_ledger from anon;
revoke insert, update, delete on table public.wallet_ledger from authenticated;
grant select on table public.wallet_ledger to authenticated;

-- ---------------------------------------------------------------------------
-- pix_charges
-- ---------------------------------------------------------------------------

create table if not exists public.pix_charges (
  id uuid primary key default gen_random_uuid(),
  contribution_id uuid not null references public.contributions (id) on delete cascade,
  provider text not null default 'mercado_pago',
  external_id text,
  txid text,
  qr_copy_paste text,
  qr_base64 text,
  status public.pix_charge_status not null default 'pending',
  amount_cents integer not null check (amount_cents > 0),
  raw_response jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists pix_charges_contribution_id_idx on public.pix_charges (contribution_id);
create unique index if not exists pix_charges_provider_external_uidx
  on public.pix_charges (provider, external_id)
  where external_id is not null;

create or replace function public.pix_charges_set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists pix_charges_set_updated_at on public.pix_charges;
create trigger pix_charges_set_updated_at
  before update on public.pix_charges
  for each row execute function public.pix_charges_set_updated_at();

alter table public.pix_charges enable row level security;

drop policy if exists pix_charges_select_own_or_ops on public.pix_charges;
create policy pix_charges_select_own_or_ops
  on public.pix_charges for select
  to authenticated
  using (
    exists (
      select 1 from public.contributions c
      where c.id = pix_charges.contribution_id
        and (
          c.user_id = auth.uid()
          or public.current_user_role() = any (
            array['staff'::public.user_role, 'admin'::public.user_role]
          )
        )
    )
  );

revoke all on table public.pix_charges from anon;
revoke insert, update, delete on table public.pix_charges from authenticated;
grant select on table public.pix_charges to authenticated;

-- ---------------------------------------------------------------------------
-- webhooks_inbox (idempotent raw payloads)
-- ---------------------------------------------------------------------------

create table if not exists public.webhooks_inbox (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  external_event_id text not null,
  payload jsonb not null default '{}'::jsonb,
  status public.webhook_inbox_status not null default 'received',
  processed_at timestamptz,
  error_message text,
  created_at timestamptz not null default now(),
  unique (provider, external_event_id)
);

create index if not exists webhooks_inbox_status_idx on public.webhooks_inbox (status);

alter table public.webhooks_inbox enable row level security;

-- Sem políticas para authenticated/anon: só service_role (bypass RLS).
revoke all on table public.webhooks_inbox from anon, authenticated;

-- ---------------------------------------------------------------------------
-- create_contribution (authenticated owner)
-- ---------------------------------------------------------------------------

create or replace function public.create_contribution(
  p_reservation_id uuid,
  p_amount_cents integer
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_res public.reservations%rowtype;
  v_remaining integer;
  v_amount integer;
  v_id uuid;
  v_min_cents integer := 500; -- R$ 5,00 (Smart Pay)
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'É necessário estar autenticado para aportar.';
  end if;

  if p_amount_cents is null or p_amount_cents <= 0 then
    raise exception 'Informe um valor válido para o aporte.';
  end if;

  select *
    into v_res
  from public.reservations
  where id = p_reservation_id
  for update;

  if not found then
    raise exception 'Reserva não encontrada.';
  end if;

  if v_res.user_id <> v_uid then
    raise exception 'Você não pode aportar nesta reserva.';
  end if;

  if v_res.status <> 'ativa' then
    raise exception 'Só é possível aportar em reservas ativas.';
  end if;

  v_remaining := v_res.list_price_cents - v_res.amount_paid_cents;
  if v_remaining <= 0 then
    raise exception 'Reserva já está quitada.';
  end if;

  v_amount := least(p_amount_cents, v_remaining);

  if v_amount < v_min_cents and v_amount < v_remaining then
    raise exception 'Valor mínimo de R$ 5,00 por aporte.';
  end if;

  insert into public.contributions (
    user_id,
    reservation_id,
    amount_cents,
    payment_method,
    status
  ) values (
    v_uid,
    p_reservation_id,
    v_amount,
    'pix',
    'pending'
  )
  returning id into v_id;

  return v_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Internal confirm helper (shared by webhook + admin)
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
  v_already boolean := false;
begin
  select *
    into v_contrib
  from public.contributions
  where id = p_contribution_id
  for update;

  if not found then
    raise exception 'Aporte não encontrado.';
  end if;

  -- Idempotent: already confirmed → success no-op
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
    -- Race: another tx confirmed it
    return public._confirm_contribution_internal(p_contribution_id);
  end if;

  update public.reservations
     set amount_paid_cents = amount_paid_cents + v_contrib.amount_cents,
         status = case
           when amount_paid_cents + v_contrib.amount_cents >= list_price_cents
             then 'quitada'::public.reservation_status
           else status
         end
   where id = v_contrib.reservation_id
  returning amount_paid_cents, list_price_cents, status
    into v_paid, v_list, v_new_status;

  -- Append-only ledger (unique on contribution_id + aporte)
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

  -- Mark linked pix charge paid if any
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

-- ---------------------------------------------------------------------------
-- confirm_contribution — service_role / webhook only
-- ---------------------------------------------------------------------------

create or replace function public.confirm_contribution(
  p_contribution_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Block authenticated JWT callers; service_role has no auth.uid() typically,
  -- but also allow when role claim is service_role.
  if auth.uid() is not null
     and coalesce(auth.jwt() ->> 'role', '') <> 'service_role' then
    raise exception 'confirm_contribution é restrito ao service_role (webhook).';
  end if;

  return public._confirm_contribution_internal(p_contribution_id);
end;
$$;

-- ---------------------------------------------------------------------------
-- admin_confirm_contribution — staff/admin ops without gateway
-- ---------------------------------------------------------------------------

create or replace function public.admin_confirm_contribution(
  p_contribution_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role public.user_role;
begin
  if auth.uid() is null then
    raise exception 'É necessário estar autenticado.';
  end if;

  v_role := public.current_user_role();
  if v_role is distinct from 'staff' and v_role is distinct from 'admin' then
    raise exception 'Apenas staff/admin podem confirmar aportes manualmente.';
  end if;

  return public._confirm_contribution_internal(p_contribution_id);
end;
$$;

-- ---------------------------------------------------------------------------
-- attach_pix_charge — service path after gateway create (Next/Edge)
-- Stores QR/copy + external ids; does NOT credit money.
-- ---------------------------------------------------------------------------

create or replace function public.attach_pix_charge(
  p_contribution_id uuid,
  p_provider text,
  p_external_id text,
  p_qr_copy_paste text,
  p_qr_base64 text default null,
  p_raw_response jsonb default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_contrib public.contributions%rowtype;
  v_charge_id uuid;
begin
  -- service_role or staff/admin
  if auth.uid() is not null
     and coalesce(auth.jwt() ->> 'role', '') <> 'service_role' then
    if public.current_user_role() is distinct from 'staff'
       and public.current_user_role() is distinct from 'admin' then
      raise exception 'Sem permissão para anexar cobrança Pix.';
    end if;
  end if;

  select * into v_contrib
  from public.contributions
  where id = p_contribution_id
  for update;

  if not found then
    raise exception 'Aporte não encontrado.';
  end if;

  if v_contrib.status <> 'pending' then
    raise exception 'Só é possível anexar Pix a aportes pendentes.';
  end if;

  update public.contributions
     set pix_code = coalesce(p_qr_copy_paste, pix_code),
         pix_qr_base64 = coalesce(p_qr_base64, pix_qr_base64),
         gateway_payment_id = coalesce(p_external_id, gateway_payment_id),
         gateway_provider = coalesce(p_provider, gateway_provider)
   where id = p_contribution_id;

  if p_external_id is not null then
    select id into v_charge_id
    from public.pix_charges
    where provider = coalesce(p_provider, 'mercado_pago')
      and external_id = p_external_id
    limit 1;

    if v_charge_id is not null then
      update public.pix_charges
         set qr_copy_paste = coalesce(p_qr_copy_paste, qr_copy_paste),
             qr_base64 = coalesce(p_qr_base64, qr_base64),
             raw_response = coalesce(p_raw_response, raw_response),
             contribution_id = p_contribution_id,
             updated_at = now()
       where id = v_charge_id;
      return v_charge_id;
    end if;
  end if;

  insert into public.pix_charges (
    contribution_id,
    provider,
    external_id,
    txid,
    qr_copy_paste,
    qr_base64,
    status,
    amount_cents,
    raw_response
  ) values (
    p_contribution_id,
    coalesce(p_provider, 'mercado_pago'),
    p_external_id,
    p_external_id,
    p_qr_copy_paste,
    p_qr_base64,
    'pending',
    v_contrib.amount_cents,
    p_raw_response
  )
  returning id into v_charge_id;

  return v_charge_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- upsert_webhook_inbox — idempotent raw ingest
-- ---------------------------------------------------------------------------

create or replace function public.upsert_webhook_inbox(
  p_provider text,
  p_external_event_id text,
  p_payload jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.webhooks_inbox%rowtype;
  v_inserted boolean := false;
begin
  insert into public.webhooks_inbox (provider, external_event_id, payload, status)
  values (p_provider, p_external_event_id, coalesce(p_payload, '{}'::jsonb), 'received')
  on conflict (provider, external_event_id) do nothing
  returning * into v_row;

  if found then
    v_inserted := true;
  else
    select * into v_row
    from public.webhooks_inbox
    where provider = p_provider
      and external_event_id = p_external_event_id;
  end if;

  return jsonb_build_object(
    'id', v_row.id,
    'inserted', v_inserted,
    'status', v_row.status,
    'already_processed', v_row.status = 'processed'
  );
end;
$$;

create or replace function public.mark_webhook_processed(
  p_inbox_id uuid,
  p_status public.webhook_inbox_status default 'processed',
  p_error text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.webhooks_inbox
     set status = p_status,
         processed_at = case when p_status = 'processed' then now() else processed_at end,
         error_message = p_error
   where id = p_inbox_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------

revoke all on function public.contributions_set_updated_at() from public, anon, authenticated;
revoke all on function public.pix_charges_set_updated_at() from public, anon, authenticated;

revoke all on function public.create_contribution(uuid, integer) from public, anon;
grant execute on function public.create_contribution(uuid, integer) to authenticated;

revoke all on function public._confirm_contribution_internal(uuid) from public, anon, authenticated;
-- Keep internal helper callable only by definer chain (other SECURITY DEFINER fns).

revoke all on function public.confirm_contribution(uuid) from public, anon, authenticated;
grant execute on function public.confirm_contribution(uuid) to service_role;

revoke all on function public.admin_confirm_contribution(uuid) from public, anon;
grant execute on function public.admin_confirm_contribution(uuid) to authenticated;

revoke all on function public.attach_pix_charge(uuid, text, text, text, text, jsonb) from public, anon, authenticated;
grant execute on function public.attach_pix_charge(uuid, text, text, text, text, jsonb) to service_role;

revoke all on function public.upsert_webhook_inbox(text, text, jsonb) from public, anon, authenticated;
grant execute on function public.upsert_webhook_inbox(text, text, jsonb) to service_role;

revoke all on function public.mark_webhook_processed(uuid, public.webhook_inbox_status, text) from public, anon, authenticated;
grant execute on function public.mark_webhook_processed(uuid, public.webhook_inbox_status, text) to service_role;

comment on function public.create_contribution(uuid, integer) is
  'Cria aporte pending (centavos). Dono da reserva ativa; mínimo R$5; não credita.';
comment on function public.confirm_contribution(uuid) is
  'Confirma aporte atômico (service_role/webhook). Idempotente. Credita amount_paid_cents + ledger.';
comment on function public.admin_confirm_contribution(uuid) is
  'Staff/admin confirma aporte pending sem gateway (ops). Mesma atomicidade de confirm_contribution.';

-- Owner can attach QR after gateway create (no service_role required in Next).
-- Does NOT credit money.
create or replace function public.set_own_contribution_pix(
  p_contribution_id uuid,
  p_provider text,
  p_external_id text,
  p_qr_copy_paste text,
  p_qr_base64 text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_contrib public.contributions%rowtype;
  v_charge_id uuid;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'É necessário estar autenticado.';
  end if;

  select * into v_contrib
  from public.contributions
  where id = p_contribution_id
  for update;

  if not found or v_contrib.user_id <> v_uid then
    raise exception 'Aporte não encontrado.';
  end if;

  if v_contrib.status <> 'pending' then
    raise exception 'Só é possível anexar Pix a aportes pendentes.';
  end if;

  update public.contributions
     set pix_code = coalesce(p_qr_copy_paste, pix_code),
         pix_qr_base64 = coalesce(p_qr_base64, pix_qr_base64),
         gateway_payment_id = coalesce(p_external_id, gateway_payment_id),
         gateway_provider = coalesce(p_provider, gateway_provider)
   where id = p_contribution_id;

  if p_external_id is not null then
    select id into v_charge_id
    from public.pix_charges
    where provider = coalesce(p_provider, 'mercado_pago')
      and external_id = p_external_id
    limit 1;

    if v_charge_id is not null then
      update public.pix_charges
         set qr_copy_paste = coalesce(p_qr_copy_paste, qr_copy_paste),
             qr_base64 = coalesce(p_qr_base64, qr_base64),
             contribution_id = p_contribution_id,
             updated_at = now()
       where id = v_charge_id;
      return v_charge_id;
    end if;
  end if;

  insert into public.pix_charges (
    contribution_id, provider, external_id, txid, qr_copy_paste, qr_base64,
    status, amount_cents
  ) values (
    p_contribution_id, coalesce(p_provider, 'mercado_pago'), p_external_id,
    p_external_id, p_qr_copy_paste, p_qr_base64, 'pending', v_contrib.amount_cents
  )
  returning id into v_charge_id;

  return v_charge_id;
end;
$$;

revoke all on function public.set_own_contribution_pix(uuid, text, text, text, text) from public, anon;
grant execute on function public.set_own_contribution_pix(uuid, text, text, text, text) to authenticated;

comment on function public.set_own_contribution_pix(uuid, text, text, text, text) is
  'Dono anexa QR/copy/gateway id ao aporte pending. NÃO credita dinheiro.';
