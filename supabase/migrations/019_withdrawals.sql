-- iPlanet Pay · saque de aportes (withdrawal)
-- Adapted from Smart Pay request_withdrawal / process_withdrawal (cents model).
-- Choice: on approve set reservation status to 'sacada' (clearer than cancelada for UI).
-- Live apply: enum values first (add_reservation_status_saque), then this body (019_withdrawals).
--
-- Money rules:
--   * Confirmed contributions sum = total_paid_cents (SoT for fee base)
--   * Client receives 70%; platform keeps 30% (withdrawal_fee_pct)
--   * Clients NEVER insert withdrawal rows; only RPC request_withdrawal
--   * Admin approve/reject via Next.js API (password check) → process_withdrawal RPC
--   * PIX payout is stubbed: payout_status pending_gateway|queued|sent|failed

-- ---------------------------------------------------------------------------
-- Enum: saque_pendente + sacada
-- (Apply in a separate committed migration before using these values.)
-- ---------------------------------------------------------------------------

alter type public.reservation_status add value if not exists 'saque_pendente';
alter type public.reservation_status add value if not exists 'sacada';

-- ---------------------------------------------------------------------------
-- profiles: terms acceptance (signup)
-- ---------------------------------------------------------------------------

alter table public.profiles
  add column if not exists terms_accepted_at timestamptz,
  add column if not exists terms_version text;

comment on column public.profiles.terms_version is
  'e.g. withdrawal-v1 — covers saque 70/30, prazo 24h, PIX/CPF, cancela reserva';

-- ---------------------------------------------------------------------------
-- app_settings: withdrawal_fee_pct = 30
-- ---------------------------------------------------------------------------

insert into public.app_settings (key, value)
values ('withdrawal_fee_pct', '30')
on conflict (key) do nothing;

create or replace function public.get_setting_numeric(
  p_key text,
  p_default numeric default 0
)
returns numeric
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select nullif(trim(value), '')::numeric from public.app_settings where key = p_key),
    p_default
  );
$$;

revoke all on function public.get_setting_numeric(text, numeric) from public, anon;
grant execute on function public.get_setting_numeric(text, numeric) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- withdrawal_requests
-- ---------------------------------------------------------------------------

create table if not exists public.withdrawal_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  reservation_id uuid not null references public.reservations (id) on delete restrict,
  total_paid_cents integer not null check (total_paid_cents > 0),
  fee_percentage numeric not null default 30,
  fee_amount_cents integer not null check (fee_amount_cents >= 0),
  refund_amount_cents integer not null check (refund_amount_cents >= 0),
  pix_key text not null,
  pix_key_type text not null
    check (pix_key_type = any (array['cpf', 'cnpj', 'email', 'phone', 'random'])),
  holder_full_name text not null,
  holder_cpf text not null,
  status text not null default 'pending'
    check (status = any (array['pending', 'approved', 'rejected', 'cancelled'])),
  payout_status text not null default 'pending_admin'
    check (
      payout_status = any (
        array[
          'pending_admin',
          'pending_gateway',
          'queued',
          'sent',
          'failed'
        ]
      )
    ),
  admin_notes text,
  processed_at timestamptz,
  processed_by uuid references auth.users (id) on delete set null,
  password_confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint withdrawal_fee_sum_check
    check (fee_amount_cents + refund_amount_cents = total_paid_cents)
);

create index if not exists withdrawal_requests_user_id_idx
  on public.withdrawal_requests (user_id);
create index if not exists withdrawal_requests_reservation_id_idx
  on public.withdrawal_requests (reservation_id);
create index if not exists withdrawal_requests_status_idx
  on public.withdrawal_requests (status);
create index if not exists withdrawal_requests_created_at_idx
  on public.withdrawal_requests (created_at desc);

-- At most one pending withdrawal per reservation
create unique index if not exists withdrawal_requests_pending_reservation_uidx
  on public.withdrawal_requests (reservation_id)
  where status = 'pending';

create or replace function public.withdrawal_requests_set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists withdrawal_requests_set_updated_at on public.withdrawal_requests;
create trigger withdrawal_requests_set_updated_at
  before update on public.withdrawal_requests
  for each row execute function public.withdrawal_requests_set_updated_at();

alter table public.withdrawal_requests enable row level security;

drop policy if exists withdrawal_requests_select_own on public.withdrawal_requests;
create policy withdrawal_requests_select_own
  on public.withdrawal_requests for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists withdrawal_requests_admin_all on public.withdrawal_requests;
create policy withdrawal_requests_admin_all
  on public.withdrawal_requests for all
  to authenticated
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

-- No INSERT/UPDATE/DELETE for authenticated clients — only SECURITY DEFINER RPCs.
revoke all on table public.withdrawal_requests from anon;
revoke insert, update, delete on table public.withdrawal_requests from authenticated;
grant select on table public.withdrawal_requests to authenticated;
-- Admin ALL policy needs UPDATE; grant update to authenticated (RLS still gates).
grant update on table public.withdrawal_requests to authenticated;

comment on table public.withdrawal_requests is
  'Saque de aportes confirmados. Fee 30%/refund 70% in cents. INSERT only via request_withdrawal.';

-- ---------------------------------------------------------------------------
-- RPC: request_withdrawal
-- ---------------------------------------------------------------------------

create or replace function public.request_withdrawal(
  p_reservation_id uuid,
  p_pix_key text,
  p_pix_key_type text,
  p_holder_full_name text,
  p_holder_cpf text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_status public.reservation_status;
  v_owner uuid;
  v_total integer;
  v_fee_pct numeric;
  v_fee integer;
  v_refund integer;
  v_existing uuid;
  v_request_id uuid;
  v_cpf text;
  v_pix text;
  v_name text;
  v_type text;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Não autenticado';
  end if;

  v_pix := nullif(trim(p_pix_key), '');
  v_name := nullif(trim(p_holder_full_name), '');
  v_cpf := regexp_replace(coalesce(p_holder_cpf, ''), '\D', '', 'g');
  v_type := lower(trim(coalesce(p_pix_key_type, '')));

  if v_pix is null then
    raise exception 'Informe a chave Pix.';
  end if;
  if v_name is null then
    raise exception 'Informe o nome completo do titular da chave.';
  end if;
  if length(v_cpf) <> 11 then
    raise exception 'CPF do titular deve ter 11 dígitos.';
  end if;
  if v_type is null or v_type not in ('cpf', 'cnpj', 'email', 'phone', 'random') then
    raise exception 'Tipo de chave Pix inválido.';
  end if;

  select r.status, r.user_id
    into v_status, v_owner
  from public.reservations r
  where r.id = p_reservation_id
  for update;

  if v_status is null then
    raise exception 'Reserva não encontrada';
  end if;
  if v_owner <> v_user_id then
    raise exception 'Reserva não pertence ao usuário';
  end if;
  if v_status is distinct from 'ativa' then
    raise exception 'Apenas reservas ativas podem solicitar saque. Status: %.', v_status;
  end if;

  select coalesce(sum(c.amount_cents), 0)::integer
    into v_total
  from public.contributions c
  where c.reservation_id = p_reservation_id
    and c.user_id = v_user_id
    and c.status = 'confirmed';

  if v_total <= 0 then
    raise exception 'Não há aportes confirmados para sacar';
  end if;

  select id into v_existing
  from public.withdrawal_requests
  where reservation_id = p_reservation_id
    and status = 'pending';

  if v_existing is not null then
    raise exception 'Já existe uma solicitação de saque pendente para esta reserva';
  end if;

  v_fee_pct := public.get_setting_numeric('withdrawal_fee_pct', 30);
  v_fee := round(v_total::numeric * (v_fee_pct / 100.0))::integer;
  v_refund := v_total - v_fee;

  insert into public.withdrawal_requests (
    user_id,
    reservation_id,
    total_paid_cents,
    fee_percentage,
    fee_amount_cents,
    refund_amount_cents,
    pix_key,
    pix_key_type,
    holder_full_name,
    holder_cpf,
    status,
    payout_status
  ) values (
    v_user_id,
    p_reservation_id,
    v_total,
    v_fee_pct,
    v_fee,
    v_refund,
    v_pix,
    v_type,
    v_name,
    v_cpf,
    'pending',
    'pending_admin'
  )
  returning id into v_request_id;

  update public.reservations
     set status = 'saque_pendente',
         updated_at = now()
   where id = p_reservation_id;

  -- Cancel pending (unconfirmed) aportes so they cannot confirm after saque
  update public.contributions
     set status = 'expired',
         updated_at = now()
   where reservation_id = p_reservation_id
     and status = 'pending';

  return v_request_id;
end;
$$;

revoke all on function public.request_withdrawal(uuid, text, text, text, text) from public, anon;
grant execute on function public.request_withdrawal(uuid, text, text, text, text) to authenticated;

comment on function public.request_withdrawal(uuid, text, text, text, text) is
  'Cliente solicita saque: fee 30%/refund 70% dos aportes confirmados; reserva → saque_pendente.';

-- ---------------------------------------------------------------------------
-- RPC: process_withdrawal (admin; password checked in Next.js API)
-- ---------------------------------------------------------------------------

create or replace function public.process_withdrawal(
  p_request_id uuid,
  p_action text,
  p_admin_notes text default null,
  p_payout_status text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_req public.withdrawal_requests%rowtype;
  v_action text;
  v_payout text;
begin
  if public.current_user_role() is distinct from 'admin' then
    raise exception 'Acesso negado';
  end if;

  v_action := lower(trim(p_action));
  if v_action not in ('approve', 'reject') then
    raise exception 'Ação inválida. Use approve ou reject';
  end if;

  select * into v_req
  from public.withdrawal_requests
  where id = p_request_id
  for update;

  if not found then
    raise exception 'Solicitação não encontrada';
  end if;
  if v_req.status is distinct from 'pending' then
    raise exception 'Solicitação já processada';
  end if;

  if v_action = 'approve' then
    v_payout := coalesce(
      nullif(trim(p_payout_status), ''),
      'pending_gateway'
    );
    if v_payout not in ('pending_gateway', 'queued', 'sent', 'failed') then
      raise exception 'payout_status inválido';
    end if;

    update public.withdrawal_requests
       set status = 'approved',
           payout_status = v_payout,
           admin_notes = coalesce(p_admin_notes, admin_notes),
           processed_at = now(),
           processed_by = auth.uid(),
           password_confirmed_at = now(),
           updated_at = now()
     where id = p_request_id;

    update public.reservations
       set status = 'sacada',
           updated_at = now()
     where id = v_req.reservation_id
       and status = 'saque_pendente';

    return jsonb_build_object(
      'ok', true,
      'action', 'approve',
      'request_id', p_request_id,
      'reservation_id', v_req.reservation_id,
      'refund_amount_cents', v_req.refund_amount_cents,
      'payout_status', v_payout
    );

  else
    -- reject: restore reservation to ativa
    update public.withdrawal_requests
       set status = 'rejected',
           payout_status = 'pending_admin',
           admin_notes = coalesce(p_admin_notes, admin_notes),
           processed_at = now(),
           processed_by = auth.uid(),
           password_confirmed_at = now(),
           updated_at = now()
     where id = p_request_id;

    update public.reservations
       set status = 'ativa',
           updated_at = now()
     where id = v_req.reservation_id
       and status = 'saque_pendente';

    return jsonb_build_object(
      'ok', true,
      'action', 'reject',
      'request_id', p_request_id,
      'reservation_id', v_req.reservation_id
    );
  end if;
end;
$$;

revoke all on function public.process_withdrawal(uuid, text, text, text) from public, anon;
grant execute on function public.process_withdrawal(uuid, text, text, text) to authenticated;

comment on function public.process_withdrawal(uuid, text, text, text) is
  'Admin aprova (reserva→sacada + payout_status) ou rejeita (reserva→ativa). Senha fora do DB.';

-- ---------------------------------------------------------------------------
-- RPC: cancel_withdrawal_by_user
-- ---------------------------------------------------------------------------

create or replace function public.cancel_withdrawal_by_user(p_request_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_req public.withdrawal_requests%rowtype;
begin
  select * into v_req
  from public.withdrawal_requests
  where id = p_request_id
    and user_id = auth.uid()
  for update;

  if not found then
    raise exception 'Solicitação não encontrada.';
  end if;
  if v_req.status is distinct from 'pending' then
    raise exception 'Só é possível cancelar saques pendentes.';
  end if;

  update public.withdrawal_requests
     set status = 'cancelled',
         processed_at = now(),
         updated_at = now()
   where id = p_request_id;

  update public.reservations
     set status = 'ativa',
         updated_at = now()
   where id = v_req.reservation_id
     and status = 'saque_pendente';
end;
$$;

revoke all on function public.cancel_withdrawal_by_user(uuid) from public, anon;
grant execute on function public.cancel_withdrawal_by_user(uuid) to authenticated;
