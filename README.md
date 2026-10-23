# Currículo Certo

Plataforma web para criar currículos profissionais com assistente de sugestões. Prévia gratuita protegida; PDF sem marca d'água liberado após pagamento Pix (R$ 7,99 por currículo) confirmado no servidor.

**Stack:** Next.js 15 (App Router, TypeScript) · Tailwind CSS 4 · Supabase (Postgres, Auth, Storage privado) · Mercado Pago (Pix) · `@react-pdf/renderer` (PDF no servidor) · Zod · Vitest + PGlite + Playwright.

## O que está implementado

| Área | Situação |
|---|---|
| Landing page (exemplos reais dos modelos, 3 etapas, preço, FAQ, rodapé legal) | ✅ |
| Cadastro, login, logout, recuperação de senha, rotas protegidas | ✅ (precisa do Supabase) |
| Assistente em etapas A–G + modelo + revisão, salvamento automático, reordenar seções | ✅ |
| **Nota de aceitação 0–10 (RH/ATS) para o modelo escolhido**, com dicas, atualizada ao vivo | ✅ (regras determinísticas, sem serviços externos) |
| Assistente de sugestões configurável (Anthropic ou compatível com OpenAI), sugestões aprovadas pelo usuário, guarda contra fatos inventados | ✅ (precisa de chave) |
| 5 modelos (Clássico, Moderno, Minimalista, Primeiro emprego, Criativo), 8 cores, foto opcional | ✅ |
| Prévia protegida: imagens PNG com marca d'água gravada, sem PDF/URL permanente | ✅ |
| Pix Mercado Pago, webhook com assinatura, validação por consulta ao provedor, idempotência | ✅ (precisa de credenciais) |
| PDF final no servidor, download por URL assinada de 60 s, revalidado a cada requisição | ✅ |
| Versionamento: editar após comprar exige nova compra (configurável) | ✅ (gatilho no banco) |
| Painel do usuário e painel administrativo (métricas, transações, preço, modelos, logs, auditoria) | ✅ |
| Migrações SQL + RLS, retenção, exclusão de conta | ✅ |

Nada é simulado: sem credenciais, o recurso mostra **“configuração pendente”** (veja `/configuracao-pendente`).

## Desenvolvimento local

```bash
npm install
cp .env.example .env.local   # preencha o que for usar
npm run dev                  # http://localhost:3000
```

Sem `.env.local` a landing page, os exemplos e as páginas legais já funcionam. Para login, banco e pagamentos siga [docs/DEPLOY.md](docs/DEPLOY.md).

### Comandos

```bash
npm run typecheck   # TypeScript
npm run lint        # ESLint
npm test            # 100+ testes (unitários, RLS com PGlite, rotas, PDF)
npm run test:e2e    # Playwright (layout mobile/desktop, rotas privadas)
npm run build
```

Se o Playwright não achar o Chromium: `PW_CHROMIUM_PATH=/caminho/do/chrome npm run test:e2e`.

## Documentação

- [docs/DEPLOY.md](docs/DEPLOY.md) — Supabase, Vercel, variáveis, primeiro administrador
- [docs/AI.md](docs/AI.md) — integração de IA e regras anti-invenção
- [docs/PAYMENTS.md](docs/PAYMENTS.md) — Mercado Pago, webhook, política de compra
- [docs/SECURITY.md](docs/SECURITY.md) — modelo de ameaças, proteção da prévia, limites conhecidos
- [docs/CHECKLISTS.md](docs/CHECKLISTS.md) — checklist de sandbox e de produção

## Estrutura

```
src/app            páginas e rotas de API (App Router)
src/components     UI, assistente (wizard), prévia, painéis
src/lib/resume     schema (Zod), modelos, nota ATS, formatação
src/lib/pdf        documento react-pdf, renderização, rasterização da prévia
src/lib/payments   Mercado Pago, regras de validação/idempotência, webhook
src/lib/ai         provedor, prompts, guarda de fatos
src/lib/security   limite de requisições, imagem, sanitização
supabase/migrations  esquema, RLS, storage
tests, e2e         testes automatizados
```
