# Publicação: Supabase + Vercel

## 1. Supabase

1. Crie um projeto em <https://supabase.com>.
2. **SQL Editor** → execute, em ordem, o conteúdo de:
   - `supabase/migrations/0001_schema.sql`
   - `supabase/migrations/0002_rls.sql`
   - `supabase/migrations/0003_storage.sql` (cria os buckets **privados** `resume-photos` e `resume-files`)
   - `supabase/migrations/0005_testimonials.sql` (depoimentos enviados pelos clientes)
   - `supabase/verificacao.sql` (aplica o preço de R$ 10,00 e confere RLS, buckets, gatilhos)
   
   (ou use a CLI: `supabase link && supabase db push`).
3. **Project Settings → API**: copie `URL`, `anon key` e `service_role key`.
   A `service_role` **nunca** vai para o navegador nem para variáveis `NEXT_PUBLIC_*`.
4. **Authentication → URL Configuration**: `Site URL` = URL de produção; em *Redirect URLs* adicione
   `https://SEU-DOMINIO/auth/callback` (e `http://localhost:3000/auth/callback` para desenvolvimento).
5. **Authentication → Providers → Email**: deixe *Confirm email* **desligado** para a pessoa entrar direto após o cadastro. (Efeito colateral: qualquer um pode criar conta com um e-mail que não é seu; a recuperação de senha continua usando e-mail.) Configure um SMTP próprio em produção
   (o SMTP padrão do Supabase tem limite baixo).
6. **Authentication → Policies**: senha mínima de 8 caracteres (o app também valida).
7. Primeiro administrador — após criar sua conta pelo site, no SQL Editor:
   ```sql
   update public.profiles set role = 'admin' where email = 'voce@dominio.com';
   ```
   O papel só pode ser alterado assim (SQL/painel) ou por `service_role`; usuários finais não conseguem se promover (gatilho `profiles_protect_role`).
8. Confirme em **Storage** que os dois buckets estão como *Private* e **sem** políticas para `anon`/`authenticated`.

## 2. Vercel

1. Importe o repositório. Framework: Next.js (detectado).
2. **Settings → Environment Variables** (Production): todas as variáveis de `.env.example`. Em `NEXT_PUBLIC_APP_URL` use a URL final com `https://`.
3. Região das funções: escolha a mais próxima do seu banco Supabase (ex.: `gru1`).
4. Funções de PDF/prévia usam `maxDuration` de 30 s (plano Hobby aceita até 60 s; confira seu plano).
5. `vercel.json` já agenda `/api/cron/retention` diariamente. Defina `CRON_SECRET` (a Vercel o envia como `Authorization: Bearer`).
6. Deploy. Depois configure o webhook (veja `docs/PAYMENTS.md`).

### Observações de runtime
- `sharp`, `@napi-rs/canvas`, `pdfjs-dist` e `@react-pdf/renderer` são pacotes externos (`serverExternalPackages`) e os arquivos de fontes do pdfjs são incluídos por `outputFileTracingIncludes` em `next.config.ts`.
- O limitador de requisições em memória é por instância. Para limites globais use Upstash Redis (veja `docs/SECURITY.md`).

## 3. Variáveis

| Variável | Obrigatória | Uso |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | sim | links de e-mail, `notification_url` do Pix |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | sim | login e dados do usuário (RLS) |
| `SUPABASE_SERVICE_ROLE_KEY` | sim | servidor: pagamentos, PDFs, admin |
| `AI_PROVIDER`, `AI_API_KEY`, `AI_MODEL`, `AI_BASE_URL` | para usar IA | veja `docs/AI.md` |
| `MERCADOPAGO_ACCESS_TOKEN` | para cobrar | token de **produção** |
| `MERCADOPAGO_WEBHOOK_SECRET` | sim em produção | sem ele o webhook responde 503 |
| `PIX_EXPIRATION_MINUTES` | não (30) | validade da cobrança |
| `CRON_SECRET` | para retenção | protege `/api/cron/retention` |

## 4. Textos legais
Preencha razão social/CNPJ/endereço e peça revisão jurídica das páginas `/termos` e `/privacidade` antes de abrir ao público.

## 5. Antes de publicar: simular a Vercel
```bash
npm run check:deploy
```
Gera o pacote isolado (somente os arquivos que a Vercel inclui), sobe o servidor e testa PDF, imagem da prévia, os 5 modelos e o tratamento de foto. Se faltar algum arquivo (ex.: `Cannot find module .../standard-fonts/Helvetica.cjs`), falha aqui antes de falhar em produção. Em produção, abra `/api/health` para o mesmo diagnóstico.
