-- iPlanet Pay · indicações (referral)
-- Adapted from Smart Pay apply_referral_code / process_referral_bonus (cents + iPlanet roles).
--
-- Bonus model:
--   * apply_referral_code links referred → referrer once (pending referral row).
--   * On first confirmed contribution(s) reaching min threshold: credit referrer
--     via wallet_ledger entry_type=ajuste (idempotent via bonus_credited + unique index)
--     and optionally bump amount_paid_cents on referrer's active reservation.
--   * Default bonus R$50 (5000 cents) via app_settings.referral_bonus_amount_cents.
--   * No Pix QR invented.

-- ---------------------------------------------------------------------------
-- Enum: bonus
-- ---------------------------------------------------------------------------

-- bonus via entry_type=ajuste + referral_id (avoid new enum in same txn)

-- ---------------------------------------------------------------------------
-- app_settings (minimal)
-- ---------------------------------------------------------------------------

create table if not exists public.app_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

alter table public.app_settings enable row level security;

drop policy if exists app_settings_select_authenticated on public.app_settings;
create policy app_settings_select_authenticated
  on public.app_settings for select
  to authenticated
  using (true);

drop policy if exists app_settings_admin_all on public.app_settings;
create policy app_settings_admin_all
  on public.app_settings for all
  to authenticated
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

revoke all on table public.app_settings from anon;
grant select on table public.app_settings to authenticated;
grant insert, update, delete on table public.app_settings to authenticated;

insert into public.app_settings (key, value) values
  ('referral_bonus_amount_cents', '5000'),
  ('max_referrals_per_user', '20'),
  ('max_referrals_per_day', '5'),
  ('min_contribution_threshold_cents', '1000')
on conflict (key) do nothing;

create or replace function public.get_setting_int(p_key text, p_default integer default 0)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select nullif(trim(value), '')::integer from public.app_settings where key = p_key),
    p_default
  );
$$;

revoke all on function public.get_setting_int(text, integer) from public, anon;
grant execute on function public.get_setting_int(text, integer) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- profiles: referral_code + referred_by
-- ---------------------------------------------------------------------------

alter table public.profiles
  add column if not exists referral_code text,
  add column if not exists referred_by uuid references public.profiles (id) on delete set null;

create unique index if not exists profiles_referral_code_uidx
  on public.profiles (referral_code)
  where referral_code is not null;

create index if not exists profiles_referred_by_idx
  on public.profiles (referred_by)
  where referred_by is not null;

create or replace function public.generate_referral_code()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
  v_exists boolean;
begin
  if new.referral_code is null or btrim(new.referral_code) = '' then
    loop
      v_code := upper(substr(md5(gen_random_uuid()::text), 1, 6));
      select exists(
        select 1 from public.profiles where referral_code = v_code
      ) into v_exists;
      exit when not v_exists;
    end loop;
    new.referral_code := v_code;
  else
    new.referral_code := upper(btrim(new.referral_code));
  end if;
  return new;
end;
$$;

drop trigger if exists trg_generate_referral_code on public.profiles;
create trigger trg_generate_referral_code
  before insert or update of referral_code on public.profiles
  for each row execute function public.generate_referral_code();

-- Backfill existing profiles
update public.profiles
set referral_code = upper(substr(md5(id::text || random()::text), 1, 6))
where referral_code is null;

-- Protect privileged columns on non-admin update
create or replace function public.profiles_protect_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role public.user_role;
begin
  -- Migrations / service SQL (no JWT) or explicit RPC bypass
  if auth.uid() is null
     or current_setting('iplanet.bypass_profile_protect', true) = 'on' then
    return new;
  end if;

  v_role := public.current_user_role();
  if v_role is distinct from 'admin' then
    new.role := old.role;
    new.store_id := old.store_id;
    new.referral_code := old.referral_code;
    new.referred_by := old.referred_by;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_profiles_protect_columns on public.profiles;
create trigger trg_profiles_protect_columns
  before update on public.profiles
  for each row execute function public.profiles_protect_columns();

revoke all on function public.generate_referral_code() from public, anon, authenticated;
revoke all on function public.profiles_protect_columns() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- referrals
-- ---------------------------------------------------------------------------

create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references public.profiles (id) on delete cascade,
  referred_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'completed', 'cap_reached', 'cancelled')),
  bonus_amount_cents integer not null default 5000 check (bonus_amount_cents >= 0),
  bonus_credited boolean not null default false,
  credited_at timestamptz,
  created_at timestamptz not null default now(),
  unique (referred_id),
  constraint referrals_no_self check (referrer_id <> referred_id)
);

create index if not exists referrals_referrer_id_idx on public.referrals (referrer_id);
create index if not exists referrals_bonus_credited_idx
  on public.referrals (bonus_credited)
  where bonus_credited = false;

alter table public.referrals enable row level security;

drop policy if exists referrals_select_own_or_ops on public.referrals;
create policy referrals_select_own_or_ops
  on public.referrals for select
  to authenticated
  using (
    referrer_id = auth.uid()
    or referred_id = auth.uid()
    or public.current_user_role() = any (
      array['staff'::public.user_role, 'admin'::public.user_role]
    )
  );

-- No direct insert/update/delete for clients — only SECURITY DEFINER RPCs / triggers
revoke all on table public.referrals from anon;
revoke insert, update, delete on table public.referrals from authenticated;
grant select on table public.referrals to authenticated;

-- ---------------------------------------------------------------------------
-- wallet_ledger: optional referral_id for bonus idempotency
-- ---------------------------------------------------------------------------

alter table public.wallet_ledger
  add column if not exists referral_id uuid references public.referrals (id) on delete set null;

create unique index if not exists wallet_ledger_bonus_referral_uidx
  on public.wallet_ledger (referral_id)
  where referral_id is not null and entry_type = 'ajuste';

-- ---------------------------------------------------------------------------
-- apply_referral_code
-- ---------------------------------------------------------------------------

create or replace function public.apply_referral_code(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_referrer_id uuid;
  v_already uuid;
  v_count int;
  v_max int;
  v_max_day int;
  v_bonus int;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'É necessário estar autenticado.';
  end if;

  if p_code is null or btrim(p_code) = '' then
    raise exception 'Informe um código de indicação.';
  end if;

  select referred_by into v_already
  from public.profiles
  where id = v_user_id
  for update;

  if not found then
    raise exception 'Perfil não encontrado.';
  end if;

  if v_already is not null then
    raise exception 'Você já utilizou um código de indicação.';
  end if;

  if exists (select 1 from public.referrals where referred_id = v_user_id) then
    raise exception 'Você já utilizou um código de indicação.';
  end if;

  select id into v_referrer_id
  from public.profiles
  where referral_code = upper(btrim(p_code));

  if v_referrer_id is null then
    raise exception 'Código de indicação inválido.';
  end if;

  if v_referrer_id = v_user_id then
    raise exception 'Você não pode usar o próprio código.';
  end if;

  v_max := public.get_setting_int('max_referrals_per_user', 20);
  v_max_day := public.get_setting_int('max_referrals_per_day', 5);
  v_bonus := public.get_setting_int('referral_bonus_amount_cents', 5000);

  select count(*) into v_count
  from public.referrals
  where referrer_id = v_referrer_id;

  if v_count >= v_max then
    raise exception 'Este indicador atingiu o limite de indicações.';
  end if;

  if (
    select count(*)
    from public.referrals
    where referrer_id = v_referrer_id
      and created_at > now() - interval '1 day'
  ) >= v_max_day then
    raise exception 'Limite diário de indicações atingido para este código.';
  end if;

  perform set_config('iplanet.bypass_profile_protect', 'on', true);

  update public.profiles
     set referred_by = v_referrer_id
   where id = v_user_id;

  insert into public.referrals (
    referrer_id, referred_id, status, bonus_amount_cents
  ) values (
    v_referrer_id, v_user_id, 'pending', v_bonus
  );

  return jsonb_build_object(
    'ok', true,
    'referrer_id', v_referrer_id,
    'bonus_amount_cents', v_bonus
  );
end;
$$;

revoke all on function public.apply_referral_code(text) from public, anon;
grant execute on function public.apply_referral_code(text) to authenticated;

-- ---------------------------------------------------------------------------
-- process_referral_bonus (trigger on contributions confirm)
-- ---------------------------------------------------------------------------

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
  v_reservation_id uuid;
  v_list int;
  v_paid int;
  v_new_status public.reservation_status;
begin
  if tg_op <> 'UPDATE' then
    return new;
  end if;

  if new.status is distinct from 'confirmed' then
    return new;
  end if;

  if old.status is not distinct from 'confirmed' then
    return new;
  end if;

  select * into v_referral
  from public.referrals
  where referred_id = new.user_id
  for update;

  if not found then
    return new;
  end if;

  if v_referral.bonus_credited then
    return new;
  end if;

  v_threshold := public.get_setting_int('min_contribution_threshold_cents', 1000);
  v_bonus := coalesce(
    nullif(v_referral.bonus_amount_cents, 0),
    public.get_setting_int('referral_bonus_amount_cents', 5000)
  );

  select coalesce(sum(amount_cents), 0) into v_total_confirmed
  from public.contributions
  where user_id = new.user_id
    and status = 'confirmed';

  if v_total_confirmed < v_threshold then
    return new;
  end if;

  if v_bonus <= 0 then
    update public.referrals
       set status = 'cap_reached',
           bonus_credited = true,
           credited_at = now(),
           bonus_amount_cents = 0
     where id = v_referral.id
       and bonus_credited = false;
    return new;
  end if;

  -- Mark credited first (idempotent gate)
  update public.referrals
     set bonus_credited = true,
         credited_at = now(),
         status = 'completed',
         bonus_amount_cents = v_bonus
   where id = v_referral.id
     and bonus_credited = false;

  if not found then
    return new;
  end if;

  -- Optional: apply to referrer's most recent active reservation
  select id, list_price_cents, amount_paid_cents
    into v_reservation_id, v_list, v_paid
  from public.reservations
  where user_id = v_referral.referrer_id
    and status = 'ativa'
  order by created_at desc
  limit 1
  for update;

  if v_reservation_id is not null then
    update public.reservations
       set amount_paid_cents = amount_paid_cents + v_bonus,
           status = case
             when amount_paid_cents + v_bonus >= list_price_cents
               then 'quitada'::public.reservation_status
             else status
           end,
           updated_at = now()
     where id = v_reservation_id
    returning amount_paid_cents, list_price_cents, status
      into v_paid, v_list, v_new_status;
  end if;

  insert into public.wallet_ledger (
    user_id,
    reservation_id,
    contribution_id,
    referral_id,
    entry_type,
    amount_cents,
    memo
  ) values (
    v_referral.referrer_id,
    v_reservation_id,
    null,
    v_referral.id,
    'ajuste',
    v_bonus,
    'Bônus por indicação'
  )
  on conflict do nothing;

  return new;
end;
$$;

drop trigger if exists trg_referral_bonus on public.contributions;
create trigger trg_referral_bonus
  after update of status on public.contributions
  for each row execute function public.process_referral_bonus();

revoke all on function public.process_referral_bonus() from public, anon, authenticated;

comment on table public.referrals is
  'Indicações: referrer ganha bônus (cents) quando indicated confirma aporte(s) ≥ limiar.';
comment on function public.apply_referral_code(text) is
  'Autenticado aplica código uma vez; não self; caps via app_settings.';
comment on function public.process_referral_bonus() is
  'Trigger: ao confirmar aporte, credita bônus idempotente (ledger ajuste/bonus + opcional reserva ativa).';
