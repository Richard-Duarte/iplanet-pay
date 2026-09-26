-- iPlanet Pay · fichas, sorteio, retirada envio, variantes, fechamento financeiro, regras saque/indicação

insert into public.app_settings (key, value) values
  ('min_contribution_threshold_cents', '10000'),
  ('referral_bonus_amount_cents', '5000'),
  ('withdrawal_min_total_cents', '100000'),
  ('withdrawal_min_account_days', '15'),
  ('ficha_cents_per_ticket', '10000'),
  ('admin_whatsapp_e164', '')
on conflict (key) do update set value = excluded.value
where public.app_settings.key in (
  'min_contribution_threshold_cents',
  'withdrawal_min_total_cents',
  'withdrawal_min_account_days',
  'ficha_cents_per_ticket'
);

alter table public.profiles
  add column if not exists referral_bonus_balance_cents integer not null default 0 check (referral_bonus_balance_cents >= 0);

-- ---------------------------------------------------------------------------
-- Milestones 50% / 70% (WhatsApp admin alert — dedupe)
-- ---------------------------------------------------------------------------

create table if not exists public.reservation_milestone_notifications (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null references public.reservations (id) on delete cascade,
  milestone_pct smallint not null check (milestone_pct in (50, 70)),
  notified_at timestamptz not null default now(),
  unique (reservation_id, milestone_pct)
);

alter table public.reservation_milestone_notifications enable row level security;

-- ---------------------------------------------------------------------------
-- Solicitação de retirada (loja / envio)
-- ---------------------------------------------------------------------------

create table if not exists public.pickup_requests (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null references public.reservations (id) on delete restrict,
  user_id uuid not null references auth.users (id) on delete cascade,
  mode text not null check (mode in ('store', 'shipping')),
  shipping_method text,
  address_json jsonb,
  freight_cents integer not null default 0 check (freight_cents >= 0),
  insurance_cents integer not null default 0 check (insurance_cents >= 0),
  freight_pix_contribution_id uuid references public.contributions (id) on delete set null,
  loan_contract_signed_at timestamptz,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'in_transit', 'ready_pickup', 'completed', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists pickup_requests_reservation_idx on public.pickup_requests (reservation_id);

alter table public.pickup_requests enable row level security;

create policy pickup_requests_owner_select on public.pickup_requests
  for select to authenticated
  using (user_id = auth.uid() or public.current_user_role() in ('admin', 'staff', 'parceiro'));

-- ---------------------------------------------------------------------------
-- Variantes de produto
-- ---------------------------------------------------------------------------

create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  model text,
  color text,
  storage text,
  price_cents integer not null check (price_cents > 0),
  sku_suffix text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (product_id, model, color, storage)
);

alter table public.product_variants enable row level security;

create policy product_variants_public_read on public.product_variants
  for select to anon, authenticated using (active = true);

create policy product_variants_admin_all on public.product_variants
  for all to authenticated
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

-- ---------------------------------------------------------------------------
-- Fechamento financeiro
-- ---------------------------------------------------------------------------

create table if not exists public.financial_closings (
  id uuid primary key default gen_random_uuid(),
  period_start date not null,
  period_end date not null,
  total_revenue_cents bigint not null default 0,
  total_contributions_count integer not null default 0,
  total_withdrawals_cents bigint not null default 0,
  net_cents bigint not null default 0,
  notes text,
  closed_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  check (period_end >= period_start)
);

alter table public.financial_closings enable row level security;

create policy financial_closings_admin on public.financial_closings
  for all to authenticated
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

-- ---------------------------------------------------------------------------
-- Sorteio mensual
-- ---------------------------------------------------------------------------

create table if not exists public.monthly_raffle_draws (
  id uuid primary key default gen_random_uuid(),
  draw_month date not null,
  winner_user_id uuid references auth.users (id) on delete set null,
  winner_name text,
  winner_tickets integer,
  total_tickets_pool integer not null default 0,
  drawn_by uuid references auth.users (id) on delete set null,
  drawn_at timestamptz not null default now(),
  unique (draw_month)
);

alter table public.monthly_raffle_draws enable row level security;

create policy monthly_raffle_admin on public.monthly_raffle_draws
  for all to authenticated
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

create policy monthly_raffle_read on public.monthly_raffle_draws
  for select to authenticated using (true);

-- Fichas = floor(confirmed_contributions / 10000) per user (computed in app/RPC)

create or replace function public.user_raffle_tickets(p_user_id uuid default auth.uid())
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select floor(
    coalesce(
      (select sum(amount_cents) from public.contributions
        where user_id = coalesce(p_user_id, auth.uid()) and status = 'confirmed'),
      0
    )::numeric / nullif(public.get_setting_int('ficha_cents_per_ticket', 10000), 0)
  )::integer;
$$;

grant execute on function public.user_raffle_tickets(uuid) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- request_withdrawal: 15 dias + mínimo R$ 1000
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
  v_min_total integer;
  v_min_days integer;
  v_created timestamptz;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Não autenticado';
  end if;

  v_pix := nullif(trim(p_pix_key), '');
  v_name := nullif(trim(p_holder_full_name), '');
  v_cpf := regexp_replace(coalesce(p_holder_cpf, ''), '\D', '', 'g');
  v_type := lower(trim(coalesce(p_pix_key_type, '')));

  if v_pix is null then raise exception 'Informe a chave Pix.'; end if;
  if v_name is null then raise exception 'Informe o nome completo do titular da chave.'; end if;
  if length(v_cpf) <> 11 then raise exception 'CPF do titular deve ter 11 dígitos.'; end if;
  if v_type is null or v_type not in ('cpf', 'cnpj', 'email', 'phone', 'random') then
    raise exception 'Tipo de chave Pix inválido.';
  end if;

  select created_at into v_created from public.profiles where id = v_user_id;
  v_min_days := public.get_setting_int('withdrawal_min_account_days', 15);
  if v_created is not null and v_created + (v_min_days || ' days')::interval > now() then
    raise exception 'Saques liberados após % dias de conta ativa.', v_min_days;
  end if;

  select r.status, r.user_id into v_status, v_owner
  from public.reservations r where r.id = p_reservation_id for update;

  if v_status is null then raise exception 'Reserva não encontrada'; end if;
  if v_owner <> v_user_id then raise exception 'Reserva não pertence ao usuário'; end if;
  if v_status is distinct from 'ativa' then
    raise exception 'Apenas reservas ativas podem solicitar saque. Status: %.', v_status;
  end if;

  select coalesce(sum(c.amount_cents), 0)::integer into v_total
  from public.contributions c
  where c.reservation_id = p_reservation_id and c.user_id = v_user_id and c.status = 'confirmed';

  if v_total <= 0 then raise exception 'Não há aportes confirmados para sacar'; end if;

  v_min_total := public.get_setting_int('withdrawal_min_total_cents', 100000);
  if v_total < v_min_total then
    raise exception 'Saque permitido apenas para aportes confirmados acima de R$ %.',
      (v_min_total / 100.0);
  end if;

  select id into v_existing from public.withdrawal_requests
  where reservation_id = p_reservation_id and status = 'pending';
  if v_existing is not null then
    raise exception 'Já existe uma solicitação de saque pendente para esta reserva';
  end if;

  v_fee_pct := public.get_setting_numeric('withdrawal_fee_pct', 30);
  v_fee := round(v_total::numeric * (v_fee_pct / 100.0))::integer;
  v_refund := v_total - v_fee;

  insert into public.withdrawal_requests (
    user_id, reservation_id, total_paid_cents, fee_percentage, fee_amount_cents,
    refund_amount_cents, pix_key, pix_key_type, holder_full_name, holder_cpf,
    status, payout_status
  ) values (
    v_user_id, p_reservation_id, v_total, v_fee_pct, v_fee, v_refund,
    v_pix, v_type, v_name, v_cpf, 'pending', 'pending_admin'
  ) returning id into v_request_id;

  update public.reservations set status = 'saque_pendente', updated_at = now()
  where id = p_reservation_id;

  update public.contributions set status = 'expired', updated_at = now()
  where reservation_id = p_reservation_id and status = 'pending';

  return v_request_id;
end;
$$;

-- Referral bonus → saldo do indicador (cliente escolhe reserva)
create or replace function public.process_referral_bonus()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_referral public.referrals%rowtype;
  v_bonus int;
  v_threshold int;
  v_total_confirmed int;
begin
  if tg_op <> 'UPDATE' or new.status is distinct from 'confirmed'
     or old.status is not distinct from 'confirmed' then
    return new;
  end if;

  select * into v_referral from public.referrals where referred_id = new.user_id for update;
  if not found or v_referral.bonus_credited then return new; end if;

  v_threshold := public.get_setting_int('min_contribution_threshold_cents', 10000);
  v_bonus := coalesce(nullif(v_referral.bonus_amount_cents, 0),
    public.get_setting_int('referral_bonus_amount_cents', 5000));

  select coalesce(sum(amount_cents), 0) into v_total_confirmed
  from public.contributions where user_id = new.user_id and status = 'confirmed';

  if v_total_confirmed < v_threshold or v_bonus <= 0 then return new; end if;

  update public.referrals
     set bonus_credited = true, credited_at = now(), status = 'completed', bonus_amount_cents = v_bonus
   where id = v_referral.id and bonus_credited = false;

  if not found then return new; end if;

  update public.profiles
     set referral_bonus_balance_cents = referral_bonus_balance_cents + v_bonus
   where id = v_referral.referrer_id;

  insert into public.wallet_ledger (user_id, amount_cents, entry_type, memo)
  values (v_referral.referrer_id, v_bonus, 'ajuste',
    'Bônus indicação — alocar em reserva ativa');

  return new;
end;
$$;

create or replace function public.apply_referral_bonus_to_reservation(p_reservation_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_balance int;
  v_owner uuid;
  v_status public.reservation_status;
  v_list int;
  v_paid int;
  v_apply int;
begin
  if v_user is null then raise exception 'Não autenticado'; end if;

  select referral_bonus_balance_cents into v_balance from public.profiles where id = v_user for update;
  if coalesce(v_balance, 0) <= 0 then raise exception 'Sem bônus disponível'; end if;

  select user_id, status, list_price_cents, amount_paid_cents
    into v_owner, v_status, v_list, v_paid
  from public.reservations where id = p_reservation_id for update;

  if v_owner <> v_user then raise exception 'Reserva inválida'; end if;
  if v_status <> 'ativa' then raise exception 'Reserva não está ativa'; end if;

  v_apply := least(v_balance, greatest(v_list - v_paid, 0));
  if v_apply <= 0 then raise exception 'Nada a aplicar nesta reserva'; end if;

  update public.profiles set referral_bonus_balance_cents = referral_bonus_balance_cents - v_apply where id = v_user;
  update public.reservations
     set amount_paid_cents = amount_paid_cents + v_apply,
         status = case when amount_paid_cents + v_apply >= list_price_cents then 'quitada'::public.reservation_status else status end,
         updated_at = now()
   where id = p_reservation_id;

  return jsonb_build_object('applied_cents', v_apply, 'reservation_id', p_reservation_id);
end;
$$;

grant execute on function public.apply_referral_bonus_to_reservation(uuid) to authenticated;
