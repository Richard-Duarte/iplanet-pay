-- Applied live as: analytics_events_and_agent_settings

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  path text,
  product_id uuid references public.products (id) on delete set null,
  user_id uuid references auth.users (id) on delete set null,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists analytics_events_type_idx on public.analytics_events (event_type);
create index if not exists analytics_events_created_idx on public.analytics_events (created_at desc);
create index if not exists analytics_events_product_idx on public.analytics_events (product_id);

alter table public.analytics_events enable row level security;

drop policy if exists "analytics_insert_anon_auth" on public.analytics_events;
create policy "analytics_insert_anon_auth"
  on public.analytics_events for insert
  to anon, authenticated
  with check (true);

drop policy if exists "analytics_select_ops" on public.analytics_events;
create policy "analytics_select_ops"
  on public.analytics_events for select
  to authenticated
  using (
    public.current_user_role() = any (array['admin'::public.user_role, 'staff'::public.user_role])
  );

grant select on public.analytics_events to authenticated;
grant insert on public.analytics_events to anon, authenticated;

insert into public.app_settings (key, value) values
  ('whatsapp_support', ''),
  ('agent_enabled', 'false')
on conflict (key) do nothing;
