# Checklists

## Sandbox (Supabase de teste + Mercado Pago de teste)
- [ ] Migrações 0001–0003 executadas; buckets privados criados.
- [ ] Cadastro → e-mail de confirmação → login; logout; “esqueci minha senha” → nova senha.
- [ ] `/dashboard`, `/resume/*`, `/account`, `/admin` redirecionam ao login sem sessão; `/admin` redireciona usuário comum.
- [ ] Criar currículo, preencher etapas A–G; recarregar e conferir salvamento automático; desligar a rede e ver “Sem conexão”, religar e ver “Salvo”.
- [ ] Enviar foto JPG/PNG/WebP válida; tentar `.exe` renomeado para `.jpg`, arquivo > 2 MB e imagem < 100 px (todos devem ser recusados).
- [ ] Trocar modelo/cor/ordem das seções; ver a nota 0–10 mudar; “Gerar prévia novamente”.
- [ ] Prévia: marca d’água visível; sem botão de baixar; Ctrl+P mostra aviso; seleção desativada.
- [ ] IA (com chave): pedir consentimento, sugestões aparecem, *Aceitar/Ignorar*, nada muda sem aceitar; sugestão com número inventado não aparece.
- [ ] Pix de teste: QR Code aparece; pagar com usuário de teste; webhook chega; botão **Baixar PDF** aparece; PDF sem marca d’água, com texto selecionável.
- [ ] Reenviar o mesmo webhook (Painel MP → reenviar): nenhum pagamento duplicado.
- [ ] Alterar o currículo após pagar: “Baixar” da versão nova exige nova compra; versão antiga continua baixável.
- [ ] Reembolsar no Mercado Pago: status vira `refunded` e o download é bloqueado.
- [ ] Segundo usuário não acessa `/resume/<id>` nem `/api/resumes/<id>/*` do primeiro (404).
- [ ] Pix expirado: botão “Gerar novo Pix”.
- [ ] Excluir currículo e excluir conta.
- [ ] Painel admin: métricas, filtros, transações, preço, modelos, logs, auditoria; *Reconsultar provedor*.
- [ ] Celular real (iOS/Android): formulários, teclado, `type=month`, prévia, QR Code.

## Produção
- [ ] Token de **produção** do Mercado Pago; **nenhuma** credencial de teste.
- [ ] `MERCADOPAGO_WEBHOOK_SECRET` definido; webhook apontando para o domínio final com HTTPS.
- [ ] `SUPABASE_SERVICE_ROLE_KEY` apenas como variável de servidor na Vercel.
- [ ] Buckets `resume-photos`/`resume-files` privados e sem políticas públicas.
- [ ] RLS ativa (`select relrowsecurity from pg_class …` ou aba Auth → Policies) em todas as tabelas.
- [ ] SMTP próprio no Supabase; *Confirm email* ligado; Redirect URLs de produção.
- [ ] Primeiro administrador definido por SQL; nenhum outro admin inesperado.
- [ ] `CRON_SECRET` definido e cron de retenção ativo.
- [ ] Páginas legais revisadas (razão social, CNPJ, contato) por advogado.
- [ ] Domínio com HTTPS; testar `curl -I` e cabeçalhos de segurança.
- [ ] Rate limit global (Upstash) se houver tráfego alto.
- [ ] Backups do Supabase habilitados; alerta de erros (`event_logs`, Vercel logs).
- [ ] Rodar `npm test`, `npm run typecheck`, `npm run lint`, `npm run build` no CI.
- [ ] Fazer 1 compra real de R$ 7,99 e conferir recebimento, download e (opcional) reembolso.
