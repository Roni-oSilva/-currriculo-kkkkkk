-- =====================================================================
-- Row Level Security
-- Regra geral: o usuário só enxerga e altera o que é dele. Escritas sensíveis
-- (pagamentos, arquivos finais, logs, IA) só acontecem pelo servidor com
-- service_role, que ignora RLS e nunca é exposta ao navegador.
-- =====================================================================

alter table public.profiles        enable row level security;
alter table public.app_settings    enable row level security;
alter table public.templates       enable row level security;
alter table public.resumes         enable row level security;
alter table public.resume_versions enable row level security;
alter table public.payments        enable row level security;
alter table public.resume_files    enable row level security;
alter table public.ai_generations  enable row level security;
alter table public.event_logs      enable row level security;
alter table public.admin_audit_log enable row level security;

-- profiles
create policy profiles_select_own on public.profiles for select to authenticated
  using (id = auth.uid());
create policy profiles_update_own on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- configurações públicas (preço e modelos são exibidos na landing page)
create policy settings_read on public.app_settings for select to anon, authenticated using (true);
create policy templates_read on public.templates for select to anon, authenticated using (true);

-- resumes
create policy resumes_select_own on public.resumes for select to authenticated
  using (user_id = auth.uid());
create policy resumes_insert_own on public.resumes for insert to authenticated
  with check (user_id = auth.uid());
create policy resumes_update_own on public.resumes for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy resumes_delete_own on public.resumes for delete to authenticated
  using (user_id = auth.uid());

-- versões seladas: leitura apenas do dono do currículo
create policy resume_versions_select_own on public.resume_versions for select to authenticated
  using (exists (select 1 from public.resumes r where r.id = resume_id and r.user_id = auth.uid()));

-- payments: somente leitura dos próprios registros
create policy payments_select_own on public.payments for select to authenticated
  using (user_id = auth.uid());

-- resume_files / ai_generations: somente leitura dos próprios registros
create policy resume_files_select_own on public.resume_files for select to authenticated
  using (user_id = auth.uid());
create policy ai_generations_select_own on public.ai_generations for select to authenticated
  using (user_id = auth.uid());

-- event_logs e admin_audit_log: sem política = ninguém além de service_role.

-- Privilégios de tabela: remove escritas diretas onde não fazem sentido.
revoke insert, update, delete on public.payments, public.resume_files, public.ai_generations,
  public.event_logs, public.admin_audit_log, public.app_settings, public.templates,
  public.resume_versions from anon, authenticated;
revoke all on public.event_logs, public.admin_audit_log from anon, authenticated;
revoke insert, delete on public.profiles from anon, authenticated;
revoke all on public.profiles, public.resumes, public.resume_versions, public.payments,
  public.resume_files, public.ai_generations from anon;
