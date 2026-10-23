-- =====================================================================
-- Currículo IA — esquema principal
-- Todos os valores monetários são inteiros em centavos (1000 = R$ 10,00).
-- Nenhum dado de cartão é armazenado: o processamento ocorre no provedor.
-- =====================================================================


-- ---------- utilidades ----------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------- profiles ----------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '' check (char_length(full_name) <= 120),
  email text not null default '' check (char_length(email) <= 254),
  role text not null default 'user' check (role in ('user', 'admin')),
  ai_consent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- Impede que um usuário final (sessão JWT) altere o próprio papel.
-- Alterações administrativas só por service_role ou SQL direto no painel do Supabase.
create or replace function public.profiles_protect_role()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role and auth.uid() is not null
     and coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'Alteração de papel não permitida' using errcode = '42501';
  end if;
  if new.id is distinct from old.id then
    raise exception 'id imutável' using errcode = '42501';
  end if;
  return new;
end $$;
create trigger profiles_protect_role before update on public.profiles
  for each row execute function public.profiles_protect_role();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, coalesce(new.email, ''), left(coalesce(new.raw_user_meta_data ->> 'full_name', ''), 120))
  on conflict (id) do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- configurações e modelos ----------
create table public.app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null
);
insert into public.app_settings (key, value) values
  ('price_cents', '1000'::jsonb),
  -- true: alterar o conteúdo após a compra exige nova compra (padrão).
  ('repurchase_on_edit', 'true'::jsonb);

create table public.templates (
  id text primary key,
  name text not null,
  enabled boolean not null default true,
  sort_order int not null default 0
);
insert into public.templates (id, name, sort_order) values
  ('classic', 'Clássico e formal', 1),
  ('modern', 'Moderno corporativo', 2),
  ('minimal', 'Minimalista', 3),
  ('first-job', 'Primeiro emprego', 4),
  ('creative', 'Criativo para portfólio', 5);

-- ---------- resumes ----------
create table public.resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null default 'Meu currículo' check (char_length(title) between 1 and 100),
  data jsonb not null default '{}'::jsonb check (pg_column_size(data) < 400000),
  template text not null default 'classic' references public.templates(id),
  design jsonb not null default '{}'::jsonb check (pg_column_size(design) < 20000),
  status text not null default 'draft' check (status in ('draft', 'ready')),
  version int not null default 1 check (version >= 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index resumes_user_idx on public.resumes (user_id, updated_at desc);
create trigger resumes_updated_at before update on public.resumes
  for each row execute function public.set_updated_at();

-- Cópias imutáveis das versões já "seladas" por uma cobrança (para baixar versões compradas).
create table public.resume_versions (
  resume_id uuid not null references public.resumes(id) on delete cascade,
  version int not null,
  title text not null,
  data jsonb not null,
  template text not null,
  design jsonb not null,
  created_at timestamptz not null default now(),
  primary key (resume_id, version)
);

-- ---------- payments ----------
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,   -- mantido (anônimo) por obrigação fiscal
  resume_id uuid references public.resumes(id) on delete set null,
  resume_version int not null check (resume_version >= 1),
  provider text not null default 'mercadopago' check (provider in ('mercadopago')),
  provider_payment_id text,
  amount_cents integer not null check (amount_cents > 0),
  currency text not null default 'BRL' check (currency = 'BRL'),
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'cancelled', 'expired', 'refunded')),
  idempotency_key text not null unique,
  pix_qr_code text,
  pix_qr_base64 text,
  pix_ticket_url text,
  expires_at timestamptz,
  confirmed_at timestamptz,
  refunded_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, provider_payment_id)
);
create index payments_user_idx on public.payments (user_id, created_at desc);
create index payments_resume_idx on public.payments (resume_id, resume_version, status);
-- Apenas uma cobrança pendente por currículo/versão (evita cobranças duplicadas em requisições simultâneas).
create unique index payments_one_pending_idx on public.payments (resume_id, resume_version) where status = 'pending';
create index payments_status_idx on public.payments (status, created_at desc);
create trigger payments_updated_at before update on public.payments
  for each row execute function public.set_updated_at();

-- Um pagamento aprovado não volta para pendente/cancelado: só pode ser reembolsado.
create or replace function public.payments_guard_status()
returns trigger language plpgsql as $$
begin
  if old.status = 'approved' and new.status not in ('approved', 'refunded') then
    raise exception 'Transição inválida de status: approved -> %', new.status;
  end if;
  if old.status = 'refunded' and new.status <> 'refunded' then
    raise exception 'Transição inválida de status: refunded -> %', new.status;
  end if;
  if new.amount_cents is distinct from old.amount_cents or new.currency is distinct from old.currency
     or new.user_id is distinct from old.user_id and new.user_id is not null then
    raise exception 'Valor, moeda e usuário da cobrança são imutáveis';
  end if;
  return new;
end $$;
create trigger payments_guard_status before update on public.payments
  for each row execute function public.payments_guard_status();

-- ---------- resume_files ----------
create table public.resume_files (
  id uuid primary key default gen_random_uuid(),
  resume_id uuid not null references public.resumes(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  version int not null check (version >= 1),
  payment_id uuid references public.payments(id) on delete set null,
  storage_path text not null,
  created_at timestamptz not null default now(),
  unique (resume_id, version)
);
create index resume_files_user_idx on public.resume_files (user_id);

-- ---------- ai_generations ----------
create table public.ai_generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  resume_id uuid references public.resumes(id) on delete cascade,
  operation text not null check (operation in ('summary', 'experience', 'review', 'tailor', 'full')),
  status text not null default 'started' check (status in ('started', 'succeeded', 'failed', 'rejected')),
  -- apenas metadados: provedor, modelo, nº de sugestões, duração. Nunca o conteúdo do currículo.
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index ai_generations_rate_idx on public.ai_generations (user_id, created_at desc);

-- ---------- logs e auditoria ----------
create table public.event_logs (
  id bigint generated always as identity primary key,
  level text not null default 'info' check (level in ('info', 'warn', 'error')),
  type text not null,
  message text not null default '',
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index event_logs_created_idx on public.event_logs (created_at desc);

create table public.admin_audit_log (
  id bigint generated always as identity primary key,
  admin_id uuid references public.profiles(id) on delete set null,
  action text not null,
  target text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ---------- versionamento automático do currículo ----------
-- A versão NUNCA é controlada pelo cliente: o gatilho a calcula.
-- Se o conteúdo mudou e a versão atual já tem cobrança (pendente/aprovada), guardamos
-- um snapshot imutável e incrementamos a versão.
create or replace function public.resumes_version_guard()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  content_changed boolean;
begin
  new.user_id := old.user_id;
  new.created_at := old.created_at;
  content_changed := new.data is distinct from old.data
                  or new.design is distinct from old.design
                  or new.template is distinct from old.template;
  new.version := old.version;
  if content_changed and exists (
    select 1 from public.payments p
    where p.resume_id = old.id and p.resume_version = old.version and p.status in ('pending', 'approved')
  ) then
    insert into public.resume_versions (resume_id, version, title, data, template, design)
    values (old.id, old.version, old.title, old.data, old.template, old.design)
    on conflict do nothing;
    new.version := old.version + 1;
  end if;
  return new;
end $$;
create trigger resumes_version_guard before update on public.resumes
  for each row execute function public.resumes_version_guard();

-- ---------- métricas do painel administrativo (somente service_role) ----------
create or replace function public.admin_metrics(p_from timestamptz, p_to timestamptz)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'users_total', (select count(*) from profiles),
    'resumes_created', (select count(*) from resumes where created_at >= p_from and created_at < p_to),
    'payments_approved', (select count(*) from payments where status = 'approved' and confirmed_at >= p_from and confirmed_at < p_to),
    'gross_cents', coalesce((select sum(amount_cents) from payments where status in ('approved', 'refunded') and confirmed_at >= p_from and confirmed_at < p_to), 0),
    'refunded_cents', coalesce((select sum(amount_cents) from payments where status = 'refunded' and confirmed_at >= p_from and confirmed_at < p_to), 0),
    'resumes_purchased', (select count(distinct resume_id) from payments where status = 'approved' and confirmed_at >= p_from and confirmed_at < p_to)
  );
$$;
revoke all on function public.admin_metrics(timestamptz, timestamptz) from public, anon, authenticated;

-- ---------- política de retenção ----------
-- Remove rascunhos sem nenhuma cobrança parados há 18 meses e logs com mais de 90 dias.
-- Dados de pagamento são mantidos (anonimizados na exclusão da conta) por obrigação fiscal.
create or replace function public.purge_stale_data()
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  r int; l int;
begin
  delete from resumes r2
   where r2.updated_at < now() - interval '18 months'
     and not exists (select 1 from payments p where p.resume_id = r2.id);
  get diagnostics r = row_count;
  delete from event_logs where created_at < now() - interval '90 days';
  get diagnostics l = row_count;
  return jsonb_build_object('resumes_deleted', r, 'logs_deleted', l);
end $$;
revoke all on function public.purge_stale_data() from public, anon, authenticated;
