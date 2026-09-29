-- iPlanet Pay · oferecimento de usado (trade-in na reserva)

do $$ begin
  create type public.used_device_offer_status as enum ('pending', 'approved', 'rejected');
exception when duplicate_object then null;
end $$;

create table if not exists public.used_device_offers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  reservation_id uuid not null references public.reservations (id) on delete cascade,
  device_model text not null,
  imei text not null,
  expected_value_cents integer not null check (expected_value_cents > 0),
  minimum_value_cents integer not null check (minimum_value_cents > 0),
  maintenance_options text[] not null default '{}',
  liquid_exposure boolean not null default false,
  photo_paths text[] not null default '{}',
  status public.used_device_offer_status not null default 'pending',
  admin_message text,
  approved_value_cents integer check (approved_value_cents is null or approved_value_cents > 0),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint used_device_offers_min_lte_expected check (minimum_value_cents <= expected_value_cents)
);

create index if not exists used_device_offers_reservation_idx
  on public.used_device_offers (reservation_id, created_at desc);
create index if not exists used_device_offers_status_idx
  on public.used_device_offers (status, created_at desc);
create index if not exists used_device_offers_user_idx
  on public.used_device_offers (user_id);

create or replace function public.used_device_offers_set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists used_device_offers_set_updated_at on public.used_device_offers;
create trigger used_device_offers_set_updated_at
  before update on public.used_device_offers
  for each row execute function public.used_device_offers_set_updated_at();

alter table public.used_device_offers enable row level security;

drop policy if exists used_device_offers_owner_select on public.used_device_offers;
create policy used_device_offers_owner_select on public.used_device_offers
  for select to authenticated
  using (
    user_id = auth.uid()
    or public.current_user_role() in ('admin', 'staff')
  );

revoke insert, update, delete on public.used_device_offers from authenticated, anon;
grant select on public.used_device_offers to authenticated;

-- ---------------------------------------------------------------------------
-- review_used_device_offer — admin/staff via service_role API
-- ---------------------------------------------------------------------------

create or replace function public.review_used_device_offer(
  p_offer_id uuid,
  p_action text,
  p_admin_message text,
  p_approved_value_cents integer default null,
  p_reviewer_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_offer public.used_device_offers%rowtype;
  v_res public.reservations%rowtype;
  v_credit integer;
  v_paid integer;
  v_list integer;
  v_new_status public.reservation_status;
begin
  if p_action not in ('approve', 'reject') then
    raise exception 'Ação inválida.';
  end if;

  select * into v_offer
  from public.used_device_offers
  where id = p_offer_id
  for update;

  if not found then
    raise exception 'Solicitação não encontrada.';
  end if;

  if v_offer.status <> 'pending' then
    raise exception 'Solicitação já foi avaliada.';
  end if;

  select * into v_res
  from public.reservations
  where id = v_offer.reservation_id
  for update;

  if not found then
    raise exception 'Reserva não encontrada.';
  end if;

  if p_action = 'reject' then
    if coalesce(trim(p_admin_message), '') = '' then
      raise exception 'Informe o motivo da recusa.';
    end if;

    update public.used_device_offers
       set status = 'rejected',
           admin_message = trim(p_admin_message),
           reviewed_at = now(),
           reviewed_by = p_reviewer_id
     where id = p_offer_id;

    return jsonb_build_object('ok', true, 'status', 'rejected');
  end if;

  v_credit := coalesce(p_approved_value_cents, v_offer.expected_value_cents);
  if v_credit <= 0 then
    raise exception 'Valor aprovado inválido.';
  end if;

  update public.used_device_offers
     set status = 'approved',
         approved_value_cents = v_credit,
         admin_message = nullif(trim(coalesce(p_admin_message, '')), ''),
         reviewed_at = now(),
         reviewed_by = p_reviewer_id
   where id = p_offer_id;

  update public.reservations
     set amount_paid_cents = amount_paid_cents + v_credit,
         status = case
           when amount_paid_cents + v_credit >= list_price_cents
             then 'quitada'::public.reservation_status
           else status
         end
   where id = v_offer.reservation_id
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
    v_offer.user_id,
    v_offer.reservation_id,
    null,
    'ajuste',
    v_credit,
    'Crédito usado — oferta ' || v_offer.id::text
  );

  return jsonb_build_object(
    'ok', true,
    'status', 'approved',
    'approved_value_cents', v_credit,
    'amount_paid_cents', v_paid,
    'reservation_status', v_new_status
  );
end;
$$;

revoke all on function public.review_used_device_offer(uuid, text, text, integer, uuid) from public, anon, authenticated;
grant execute on function public.review_used_device_offer(uuid, text, text, integer, uuid) to service_role;

-- Storage bucket (upload via service_role API)
insert into storage.buckets (id, name, public)
values ('used-device-photos', 'used-device-photos', false)
on conflict (id) do nothing;
