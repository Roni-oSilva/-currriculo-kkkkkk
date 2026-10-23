-- Atualiza o preço padrão para R$ 10,00 (1000 centavos) em bancos já criados.
-- Cobranças já existentes mantêm o valor original (imutável por gatilho).
insert into public.app_settings (key, value) values ('price_cents', '1000'::jsonb)
on conflict (key) do update set value = excluded.value, updated_at = now();
