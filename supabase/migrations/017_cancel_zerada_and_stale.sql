-- Cancel only when reservation is zerada (no paid balance / confirmed aportes).
-- Auto-cancel stale zeradas after 30 days without aporte activity.
-- Applied live via MCP as cancel_zerada_and_stale_reservations

alter table public.reservations
  add column if not exists cancel_reason text;

comment on column public.reservations.cancel_reason is
  'Motivo do cancelamento (manual ou stale_zerada_30d)';

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
  v_confirmed_sum integer;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'É necessário estar autenticado.';
  end if;

  select * into v_res from public.reservations where id = p_reservation_id for update;
  if not found then raise exception 'Reserva não encontrada.'; end if;

  v_role := public.current_user_role();
  if v_res.user_id <> v_uid and v_role is distinct from 'admin' then
    raise exception 'Você não pode cancelar esta reserva.';
  end if;
  if v_res.status <> 'ativa' then
    raise exception 'Só é possível cancelar reservas ativas.';
  end if;

  select coalesce(sum(c.amount_cents), 0) into v_confirmed_sum
  from public.contributions c
  where c.reservation_id = p_reservation_id
    and c.status = 'confirmed';

  if coalesce(v_res.amount_paid_cents, 0) > 0 or v_confirmed_sum > 0 then
    raise exception 'Reserva já possui aportes. Só é possível cancelar reservas zeradas (sem aportes pagos).';
  end if;

  update public.reservations
     set status = 'cancelada',
         cancel_reason = coalesce(cancel_reason, 'manual'),
         updated_at = now()
   where id = p_reservation_id and status = 'ativa';
  get diagnostics v_updated = row_count;
  if v_updated = 0 then raise exception 'Só é possível cancelar reservas ativas.'; end if;

  return p_reservation_id;
end;
$$;

comment on function public.cancel_reservation(uuid) is
  'Cancela reserva ativa somente se zerada (amount_paid_cents=0 e sem aportes confirmed).';

-- Service-role cron: cancel active zeradas with no activity for N days
create or replace function public.cancel_stale_zerada_reservations(
  p_days integer default 30
)
returns table (
  reservation_id uuid,
  user_id uuid,
  days_since integer
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  with last_confirmed as (
    select c.reservation_id, max(c.confirmed_at) as last_at
    from public.contributions c
    where c.status = 'confirmed'
    group by c.reservation_id
  ),
  candidates as (
    select
      r.id,
      r.user_id,
      greatest(
        0,
        floor(extract(epoch from (now() - coalesce(lc.last_at, r.created_at))) / 86400)
      )::integer as days_since
    from public.reservations r
    left join last_confirmed lc on lc.reservation_id = r.id
    where r.status = 'ativa'
      and coalesce(r.amount_paid_cents, 0) = 0
      and not exists (
        select 1 from public.contributions c
        where c.reservation_id = r.id and c.status = 'confirmed'
      )
      and coalesce(lc.last_at, r.created_at) < now() - make_interval(days => p_days)
  ),
  updated as (
    update public.reservations r
       set status = 'cancelada',
           cancel_reason = 'stale_zerada_30d',
           updated_at = now()
      from candidates c
     where r.id = c.id
    returning r.id, r.user_id, c.days_since
  )
  select u.id, u.user_id, u.days_since from updated u;
end;
$$;

revoke all on function public.cancel_stale_zerada_reservations(integer) from public, anon, authenticated;
-- service_role executes via createServiceClient (bypasses revoke for owner / grant below)
grant execute on function public.cancel_stale_zerada_reservations(integer) to service_role;

comment on function public.cancel_stale_zerada_reservations(integer) is
  'Cancela reservas ativas zeradas sem aporte há p_days (default 30). Uso: cron service_role.';
