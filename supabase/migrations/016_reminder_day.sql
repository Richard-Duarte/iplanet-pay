-- 016: reminder_day (1–30) on payment_goals; keep reminder_at for cron

alter table public.payment_goals
  add column if not exists reminder_day smallint
    check (reminder_day is null or (reminder_day >= 1 and reminder_day <= 30));

comment on column public.payment_goals.reminder_day is
  'Dia do mês (1–30) para lembrete WhatsApp; meses sem o dia usam o último dia.';

-- Backfill reminder_day from existing reminder_at (America/Sao_Paulo calendar day, clamped 1–30)
update public.payment_goals
set reminder_day = least(
  30,
  greatest(
    1,
    extract(day from (reminder_at at time zone 'America/Sao_Paulo'))::int
  )
)
where reminder_at is not null
  and reminder_day is null;

-- Optional gallery extras (applied separately via SQL if needed):
-- update products set product_images = array['/products/iphone-17-pro.jpg','/products/iphone-16-pro.jpg']
-- where slug = 'iphone-18-pro-256';
