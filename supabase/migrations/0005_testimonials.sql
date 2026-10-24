-- Depoimentos enviados pelos clientes.
-- Regras: só quem tem pagamento APROVADO pode enviar; todo envio ou edição volta para "pendente";
-- somente o administrador (service_role) aprova; o público só enxerga os aprovados.
create table public.testimonials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 40),
  quote text not null check (char_length(quote) between 30 and 600),
  photo_path text,
  -- autorização expressa para publicar nome, foto (se houver) e texto
  consent_at timestamptz not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index testimonials_status_idx on public.testimonials (status, created_at desc);
create trigger testimonials_updated_at before update on public.testimonials
  for each row execute function public.set_updated_at();

-- Usuário final nunca aprova o próprio depoimento nem muda de dono; qualquer mudança de conteúdo volta a "pendente".
create or replace function public.testimonials_guard()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and coalesce(auth.role(), '') <> 'service_role' then
    if tg_op = 'INSERT' then
      new.status := 'pending';
      new.reviewed_at := null;
    else
      new.user_id := old.user_id;
      if new.display_name is distinct from old.display_name or new.quote is distinct from old.quote
         or new.photo_path is distinct from old.photo_path then
        new.status := 'pending';
        new.reviewed_at := null;
      else
        new.status := old.status;
        new.reviewed_at := old.reviewed_at;
      end if;
    end if;
  end if;
  return new;
end $$;
create trigger testimonials_guard before insert or update on public.testimonials
  for each row execute function public.testimonials_guard();

alter table public.testimonials enable row level security;

create policy testimonials_public_read on public.testimonials for select to anon, authenticated
  using (status = 'approved');
create policy testimonials_select_own on public.testimonials for select to authenticated
  using (user_id = auth.uid());
create policy testimonials_insert_own on public.testimonials for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (select 1 from public.payments p where p.user_id = auth.uid() and p.status = 'approved')
  );
create policy testimonials_update_own on public.testimonials for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy testimonials_delete_own on public.testimonials for delete to authenticated
  using (user_id = auth.uid());

-- Fotos de depoimento: bucket privado (o servidor entrega URLs assinadas só dos aprovados).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('testimonial-photos', 'testimonial-photos', false, 1048576, array['image/jpeg'])
on conflict (id) do update set public = false;
