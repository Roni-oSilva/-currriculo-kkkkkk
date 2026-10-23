-- Buckets PRIVADOS. Não há políticas para anon/authenticated: todo acesso a fotos e
-- PDFs passa pelo servidor (service_role), que valida sessão, propriedade e pagamento,
-- e então entrega URLs assinadas de curta duração.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('resume-photos', 'resume-photos', false, 2097152, array['image/jpeg']),
  ('resume-files', 'resume-files', false, 10485760, array['application/pdf'])
on conflict (id) do update set public = false;
