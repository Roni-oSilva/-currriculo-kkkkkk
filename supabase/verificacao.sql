-- =====================================================================
-- Rode no SQL Editor do Supabase DEPOIS das migrações 0001–0003.
-- 1) aplica o preço de R$ 10,00  2) confere tudo  3) (opcional) cria o admin
-- Cada bloco devolve uma tabela: procure por linhas com "ERRO".
-- =====================================================================

-- 1) Preço R$ 10,00 (migração 0004)
insert into public.app_settings (key, value) values ('price_cents', '1000'::jsonb)
on conflict (key) do update set value = excluded.value, updated_at = now();

-- 2a) RLS ativa em todas as tabelas do app
select c.relname as tabela,
       case when c.relrowsecurity then 'OK' else 'ERRO: RLS desligada' end as rls
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r'
  and c.relname in ('profiles','app_settings','templates','resumes','resume_versions','payments','resume_files','ai_generations','event_logs','admin_audit_log')
order by 1;

-- 2b) Buckets privados
select id as bucket, case when public = false then 'OK' else 'ERRO: bucket público' end as privado
from storage.buckets where id in ('resume-photos','resume-files');

-- 2c) Nenhuma política de storage para anon/authenticated (acesso só pelo servidor)
select count(*) as politicas_storage_abertas,
       case when count(*) = 0 then 'OK' else 'ERRO: remova estas políticas' end as status
from pg_policies
where schemaname = 'storage' and tablename = 'objects' and (roles && array['anon','authenticated']::name[]);

-- 2d) Configurações e modelos
select key, value from public.app_settings order by key;
select id, enabled from public.templates order by sort_order;

-- 2e) Gatilhos essenciais
select tgname as gatilho, case when tgenabled = 'O' then 'OK' else 'ERRO' end as estado
from pg_trigger
where tgname in ('resumes_version_guard','payments_guard_status','profiles_protect_role','on_auth_user_created') and not tgisinternal
order by 1;

-- 3) Tornar-se administrador (troque o e-mail e rode SOMENTE depois de criar a conta no site)
-- update public.profiles set role = 'admin' where email = 'SEU-EMAIL@exemplo.com';
-- select email, role from public.profiles where role = 'admin';
