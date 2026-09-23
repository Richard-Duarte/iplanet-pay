-- Applied live as: email_outbox_and_stale_aporte

create table if not exists public.email_outbox (
  id uuid primary key default gen_random_uuid(),
  to_email text not null,
  template text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending'
    check (status = any (array['pending'::text, 'sent'::text, 'failed'::text])),
  created_at timestamptz not null default now()
);

create index if not exists email_outbox_status_idx on public.email_outbox (status);
create index if not exists email_outbox_created_idx on public.email_outbox (created_at desc);

alter table public.email_outbox enable row level security;

drop policy if exists "email_outbox_admin_select" on public.email_outbox;
create policy "email_outbox_admin_select"
  on public.email_outbox for select
  to authenticated
  using (public.current_user_role() = 'admin');

create or replace function public.find_stale_aporte_candidates(
  p_days integer default 30
)
returns table (
  reservation_id uuid,
  user_id uuid,
  email text,
  full_name text,
  product_name text,
  days_since integer,
  last_activity_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  with last_confirmed as (
    select c.reservation_id, max(c.confirmed_at) as last_at
    from public.contributions c
    where c.status = 'confirmed'
    group by c.reservation_id
  )
  select
    r.id as reservation_id,
    r.user_id,
    u.email::text,
    coalesce(nullif(p.full_name, ''), split_part(u.email, '@', 1)) as full_name,
    pr.name as product_name,
    greatest(
      0,
      floor(extract(epoch from (now() - coalesce(lc.last_at, r.created_at))) / 86400)
    )::integer as days_since,
    coalesce(lc.last_at, r.created_at) as last_activity_at
  from public.reservations r
  join auth.users u on u.id = r.user_id
  left join public.profiles p on p.id = r.user_id
  join public.products pr on pr.id = r.product_id
  left join last_confirmed lc on lc.reservation_id = r.id
  where r.status = 'ativa'
    and coalesce(lc.last_at, r.created_at) < now() - make_interval(days => p_days);
$$;

revoke all on function public.find_stale_aporte_candidates(integer) from public, anon, authenticated;

-- Anon may read public whatsapp_support for FAQ widget on landing
drop policy if exists app_settings_select_anon_public on public.app_settings;
create policy app_settings_select_anon_public
  on public.app_settings for select
  to anon
  using (key = any (array['whatsapp_support'::text]));
grant select on table public.app_settings to anon;
