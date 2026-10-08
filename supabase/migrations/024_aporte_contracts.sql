-- Aceite do contrato no início de cada aporte, com IP e fingerprint do dispositivo.

create table if not exists public.aporte_contracts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  reservation_id uuid not null references public.reservations (id) on delete cascade,
  contribution_id uuid references public.contributions (id) on delete set null,
  contract_version text not null,
  contract_text text not null,
  scrolled_to_end boolean not null default false,
  accepted_at timestamptz not null default now(),
  ip text,
  user_agent text,
  accept_language text,
  fingerprint jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists aporte_contracts_user_idx
  on public.aporte_contracts (user_id, accepted_at desc);

create index if not exists aporte_contracts_reservation_idx
  on public.aporte_contracts (reservation_id, accepted_at desc);

alter table public.aporte_contracts enable row level security;

create policy if not exists aporte_contracts_select_own
  on public.aporte_contracts for select
  to authenticated
  using (
    user_id = auth.uid()
    or public.current_user_role() = 'admin'
  );

create policy if not exists aporte_contracts_insert_own
  on public.aporte_contracts for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and scrolled_to_end = true
    and length(contract_text) > 40
  );

create policy if not exists aporte_contracts_update_own
  on public.aporte_contracts for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

revoke all on table public.aporte_contracts from anon;
grant select, insert, update on table public.aporte_contracts to authenticated;
