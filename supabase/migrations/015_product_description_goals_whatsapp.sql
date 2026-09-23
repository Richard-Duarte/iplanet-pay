-- 015: product descriptions, payment goals, WhatsApp templates + dispatch queue

alter table public.products
  add column if not exists description text,
  add column if not exists product_images text[] default '{}'::text[];

comment on column public.products.description is 'Copy de marketing pt-BR exibida no modal do catálogo';
comment on column public.products.product_images is 'URLs extras de galeria (além de image_url)';

-- ---------------------------------------------------------------------------
-- payment_goals
-- ---------------------------------------------------------------------------
create table if not exists public.payment_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete restrict,
  reservation_id uuid references public.reservations (id) on delete set null,
  name text not null,
  target_date date not null,
  reminder_at timestamptz,
  amount_cents integer not null check (amount_cents > 0),
  installment_cents integer not null check (installment_cents > 0),
  installments_count integer not null check (installments_count >= 1),
  status text not null default 'active'
    check (status = any (array['active'::text, 'paused'::text, 'done'::text, 'cancelled'::text])),
  whatsapp_phone text,
  created_at timestamptz not null default now()
);

create index if not exists payment_goals_user_idx on public.payment_goals (user_id);
create index if not exists payment_goals_status_idx on public.payment_goals (status);
create index if not exists payment_goals_reminder_idx on public.payment_goals (reminder_at)
  where status = 'active' and reminder_at is not null;

alter table public.payment_goals enable row level security;

drop policy if exists payment_goals_select_own on public.payment_goals;
create policy payment_goals_select_own
  on public.payment_goals for select to authenticated
  using (
    user_id = auth.uid()
    or public.current_user_role() = any (array['admin'::public.user_role, 'staff'::public.user_role])
  );

drop policy if exists payment_goals_insert_own on public.payment_goals;
create policy payment_goals_insert_own
  on public.payment_goals for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists payment_goals_update_own on public.payment_goals;
create policy payment_goals_update_own
  on public.payment_goals for update to authenticated
  using (
    user_id = auth.uid()
    or public.current_user_role() = 'admin'::public.user_role
  );

drop policy if exists payment_goals_admin_all on public.payment_goals;
create policy payment_goals_admin_all
  on public.payment_goals for all to authenticated
  using (public.current_user_role() = 'admin'::public.user_role)
  with check (public.current_user_role() = 'admin'::public.user_role);

-- ---------------------------------------------------------------------------
-- whatsapp_templates
-- ---------------------------------------------------------------------------
create table if not exists public.whatsapp_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  kind text not null
    check (kind = any (array['aviso'::text, 'cobranca'::text, 'promocao'::text, 'bonus'::text, 'custom'::text])),
  body text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.whatsapp_templates enable row level security;

drop policy if exists whatsapp_templates_admin on public.whatsapp_templates;
create policy whatsapp_templates_admin
  on public.whatsapp_templates for all to authenticated
  using (public.current_user_role() = 'admin'::public.user_role)
  with check (public.current_user_role() = 'admin'::public.user_role);

drop policy if exists whatsapp_templates_select_ops on public.whatsapp_templates;
create policy whatsapp_templates_select_ops
  on public.whatsapp_templates for select to authenticated
  using (public.current_user_role() = any (array['admin'::public.user_role, 'staff'::public.user_role]));

-- ---------------------------------------------------------------------------
-- whatsapp_dispatch_queue
-- ---------------------------------------------------------------------------
create table if not exists public.whatsapp_dispatch_queue (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid references public.payment_goals (id) on delete set null,
  template_id uuid references public.whatsapp_templates (id) on delete set null,
  to_phone text not null,
  body text not null,
  media_url text,
  status text not null default 'pending'
    check (status = any (array['pending'::text, 'sent'::text, 'failed'::text, 'skipped'::text])),
  scheduled_at timestamptz not null default now(),
  sent_at timestamptz,
  error text,
  created_at timestamptz not null default now()
);

create index if not exists whatsapp_dispatch_status_sched_idx
  on public.whatsapp_dispatch_queue (status, scheduled_at);

alter table public.whatsapp_dispatch_queue enable row level security;

drop policy if exists whatsapp_dispatch_admin on public.whatsapp_dispatch_queue;
create policy whatsapp_dispatch_admin
  on public.whatsapp_dispatch_queue for all to authenticated
  using (public.current_user_role() = 'admin'::public.user_role)
  with check (public.current_user_role() = 'admin'::public.user_role);

-- Seed default templates
insert into public.whatsapp_templates (name, kind, body, active)
values
  (
    'primeiro_aporte',
    'aviso',
    E'Oi {{nome}}! 🎉 Seu primeiro aporte de {{valor}} para *{{produto}}* foi confirmado.\n\nContinue no seu ritmo via Pix. Meta: {{meta}}\n\nAcesse: iPlanet Pay',
    true
  ),
  (
    'boas_vindas',
    'aviso',
    E'Bem-vindo(a) à iPlanet Pay, {{nome}}!\n\nReserve o Apple dos seus sonhos e aporte via Pix no seu ritmo. Estamos aqui se precisar 💙',
    true
  ),
  (
    'cobranca_lembrete',
    'cobranca',
    E'Oi {{nome}}! Lembrete da meta *{{meta}}* ({{produto}}).\n\nSugestão de aporte: {{valor}}\n{{pix}}\n\nQuando quiser, abra o app e gere o Pix.',
    true
  ),
  (
    'promocao',
    'promocao',
    E'{{nome}}, novidade na iPlanet Pay! ✨\n\n{{produto}} — confira no catálogo e reserve com aporte via Pix.',
    true
  )
on conflict (name) do update
  set body = excluded.body,
      kind = excluded.kind,
      active = excluded.active;

-- Seed / update descriptions for ALL products (active + inactive)
-- Real models: accurate marketing tone. Non-announced catalog names: aspirational,
-- no invented chip/display/battery specs.

update public.products set description = case slug
  when 'airpods-4' then
    'AirPods 4 com áudio espacial personalizado, equalização adaptativa e estojo com USB-C. Design redesenhado para melhor encaixe e controle por toque. Ideal para o dia a dia com a qualidade de som Apple.'
  when 'airpods-max' then
    'AirPods Max com cancelamento ativo de ruído de alta performance, áudio espacial e design over-ear em alumínio. Drivers dinâmicos de 40 mm e Digital Crown para volume preciso. Experiência premium de fone Apple.'
  when 'airpods-pro-2' then
    'AirPods Pro 2 com cancelamento ativo de ruído de última geração, Áudio Adaptativo, Transparência e estojo MagSafe com USB-C. Pontas de silicone em vários tamanhos e chip H2 para som imersivo.'
  when 'apple-watch-se-40' then
    'Apple Watch SE (40 mm) com detecção de queda e acidente, monitoramento de frequência cardíaca, app Oxigênio no Sangue em modelos compatíveis da linha e integração profunda com iPhone. A porta de entrada ao universo Apple Watch.'
  when 'apple-watch-series-46' then
    'Apple Watch Series com display Always-On brilhante, sensores avançados de saúde, GPS preciso e resistência à água. Acompanhe treinos, sono e notificações no pulso — tela generosa de 46 mm.'
  when 'apple-watch-ultra' then
    'Apple Watch Ultra em titânio, com caixa de 49 mm, display mais brilhante da linha, bateria pensada para aventuras e botão de ação personalizável. Feito para esportes extremos, mergulho e trilhas.'
  when 'imac-24-m4-512' then
    'iMac de 24 polegadas com chip Apple M4, tela Liquid Retina 4.5K vibrante, câmera Center Stage e design ultracompacto em cores. Ideal para criar, estudar e trabalhar com desempenho e silêncio.'
  when 'iphone-15-128' then
    'iPhone 15 com chip A16 Bionic, Dynamic Island, câmera principal de 48 MP e USB-C. Tela Super Retina XDR de 6,1″ e ótima autonomia. O equilíbrio Apple entre desempenho e valor.'
  when 'iphone-15-128-azul' then
    'iPhone 15 (128 GB) com A16 Bionic, Dynamic Island e câmera de 48 MP. Acabamento Azul, USB-C e tela Super Retina XDR — clássico atual da linha iPhone.'
  when 'iphone-15-pro-256' then
    'iPhone 15 Pro em titânio, chip A17 Pro, botão de Ação e sistema de câmeras Pro com zoom óptico. Desempenho gráfico de console portátil e construção leve e resistente.'
  when 'iphone-15-pro-256-titaniobranco' then
    'iPhone 15 Pro (256 GB) em Titânio Branco, A17 Pro, câmeras Pro e USB-C. Design premium com desempenho profissional para foto, vídeo e jogos.'
  when 'iphone-16-128' then
    'iPhone 16 com chip A18, botão Camera Control, câmeras avançadas e Apple Intelligence em mercados compatíveis. Tela Super Retina XDR e autonomia aprimorada para o uso diário.'
  when 'iphone-16-128-preto' then
    'iPhone 16 (128 GB) preto com A18, Camera Control e recursos de foto/vídeo da geração. USB-C, Dynamic Island e integração total ao ecossistema Apple.'
  when 'iphone-16-plus-256' then
    'iPhone 16 Plus com tela maior, chip A18, Camera Control e bateria generosa. Ideal para quem quer mais espaço na tela sem abrir mão do ritmo iPhone 16.'
  when 'iphone-16-plus-128-ultramarino' then
    'iPhone 16 Plus Ultramarino com display ampliado, A18 e Camera Control. Mais tela e autonomia para streaming, jogos e produtividade.'
  when 'iphone-16-pro-256' then
    'iPhone 16 Pro em titânio, chip A18 Pro, câmeras Pro com zoom avançado e gravação em qualidade cinema. Desempenho extremo em um design refinado.'
  when 'iphone-16-pro-256-titaniunegro' then
    'iPhone 16 Pro Titânio Negro (256 GB) com A18 Pro e sistema de câmeras Pro. Feito para criadores e quem exige o máximo da linha Pro.'
  when 'iphone-16-pro-max-256' then
    'iPhone 16 Pro Max com a maior tela da família Pro, A18 Pro, câmeras Pro e autonomia de destaque. O topo de linha para foto, vídeo e multitarefa.'
  when 'iphone-16-pro-max-256-titaniudadeserto' then
    'iPhone 16 Pro Max Titânio Deserto (256 GB) — tela ampla, A18 Pro e câmeras Pro. Experiência Pro Max completa em acabamento exclusivo.'
  when 'iphone-17-256' then
    'iPhone 17 no catálogo iPlanet Pay: escolha o modelo, reserve e aporte via Pix no seu ritmo. Retire nas lojas Itaim Bibi ou São Caetano quando a reserva estiver quitada. Detalhes finais conforme disponibilidade da loja.'
  when 'iphone-17-pro-256' then
    'iPhone 17 Pro no catálogo iPlanet: reserve com layaway inteligente e pague aos poucos via Pix. Sem juros de cartão — você define o ritmo. Atendimento e retirada nas lojas iPlanet.'
  when 'iphone-17e-256' then
    'iPhone 17e: opção acessível da linha no catálogo iPlanet Pay. Reserve, aporte via Pix e retire na loja. Consulte a equipe para configuração e disponibilidade.'
  when 'iphone-18-pro-256' then
    'iPhone 18 Pro disponível para reserva no iPlanet Pay. Monte sua meta de aportes via Pix e retire quando quitar. Experiência premium das lojas iPlanet em SP.'
  when 'iphone-18-pro-max-512' then
    'iPhone 18 Pro Max (512 GB) no catálogo iPlanet Pay. Reserve agora, aporte no seu ritmo e retire em Itaim Bibi ou São Caetano. Layaway sem juros de cartão.'
  when 'iphone-air-256' then
    'iPhone Air no catálogo iPlanet: design leve em destaque. Reserve, crie uma meta de aportes via Pix e acompanhe o progresso no app até a retirada na loja.'
  when 'iphone-duo-256' then
    'iPhone Duo no catálogo iPlanet Pay. Produto especial para reserva com aporte via Pix. Fale com a loja para detalhes de configuração e retirada.'
  when 'mac-mini-m4-512' then
    'Mac mini com chip Apple M4, 512 GB de armazenamento e design compacto em alumínio. Potência de desktop em um volume mínimo — perfeito para mesa limpa e desempenho silencioso.'
  when 'mac-studio-m4-max-1tb' then
    'Mac Studio com chip M4 Max e 1 TB: workstation compacta para edição, 3D e fluxos profissionais. Portas avançadas e desempenho sustentado em um chassi discreto.'
  when 'macbook-air-13-m4-512' then
    'MacBook Air 13″ com chip M4, 512 GB, tela Liquid Retina e design fino sem ventilador. Autonomia excepcional e desempenho silencioso para estudo, criação e trabalho.'
  when 'macbook-air-13-m5-512' then
    'MacBook Air 13″ no catálogo iPlanet Pay (configuração M5). Reserve e aporte via Pix no seu ritmo; retire na loja iPlanet. Consulte a equipe para detalhes de configuração.'
  when 'macbook-air-15-m5-512' then
    'MacBook Air 15″ no catálogo iPlanet Pay — mais tela no formato fino. Reserve com meta de aportes via Pix e retire em Itaim ou São Caetano.'
  when 'macbook-pro-14-m4-512' then
    'MacBook Pro 14″ com chip M4, tela Liquid Retina XDR, sistema térmico avançado e portas profissionais. Feito para quem precisa de potência contínua em um notebook compacto.'
  when 'macbook-pro-14-m5-pro-1tb' then
    'MacBook Pro 14″ (configuração Pro, 1 TB) no catálogo iPlanet Pay. Reserve, defina aportes via Pix e retire na loja. Ideal para fluxos exigentes — confirme specs com a equipe.'
  when 'macbook-pro-16-m5-max-1tb' then
    'MacBook Pro 16″ no catálogo iPlanet Pay (configuração Max, 1 TB). Tela ampla para criação profissional. Reserve com layaway Pix e retire nas lojas iPlanet.'
  else coalesce(description, name || ' disponível no catálogo iPlanet Pay. Reserve e aporte via Pix no seu ritmo — retire em Itaim Bibi ou São Caetano.')
end
where description is null or description = '';

-- Also force-refresh descriptions for seeded marketing (overwrite empty OR previous nulls already handled)
-- For products that already had empty string after first update with else — ok.

insert into public.app_settings (key, value)
values
  ('whatsapp_waba_id', ''),
  ('whatsapp_phone_number_id', '')
on conflict (key) do nothing;
