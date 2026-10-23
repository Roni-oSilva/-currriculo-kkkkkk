# Prompt para uma IA configurar tudo no seu computador

Use no **Claude Code** (ou outra IA com acesso ao terminal) aberto na pasta do projeto. Cole o texto abaixo.

```
Você vai colocar o projeto "Currículo Certo" no ar para mim. Leia README.md e docs/DEPLOY.md primeiro.
Trabalhe um passo por vez, explique em português simples e peça para eu fazer apenas o que exige login ou copiar chaves.

REGRAS DE SEGURANÇA (obrigatórias)
- Nunca mostre, repita, registre em log nem faça commit de chaves secretas (SUPABASE_SERVICE_ROLE_KEY,
  MERCADOPAGO_ACCESS_TOKEN, MERCADOPAGO_WEBHOOK_SECRET, AI_API_KEY, CRON_SECRET, senha do banco).
- Nunca coloque segredo em variável NEXT_PUBLIC_*. Nunca versione .env.local.
- Antes de qualquer ação destrutiva ou que gaste dinheiro, peça minha confirmação.

PASSOS
1. Rode `npm install`, depois `npm run typecheck`, `npm test` e `npm run build`. Se algo falhar, corrija e me explique.
2. Rode `npm run setup` (assistente interativo). Ele pergunta as chaves e grava .env.local; diga-me o que digitar em cada pergunta:
   - Supabase: Project Settings > API (URL, anon/publishable = pública, service_role/secret = SECRETA).
   - Mercado Pago: developers > Suas integrações > aplicação > Credenciais de produção > Access Token (APP_USR-...).
3. Banco (Supabase): confirme que as migrações supabase/migrations/0001..0003 já foram aplicadas e rode
   supabase/verificacao.sql (o próprio `npm run setup` faz isso se eu fornecer a connection string do Session pooler).
   Qualquer linha com "ERRO" deve ser corrigida e explicada.
4. Vercel: use `npx vercel login`, `npx vercel link` e envie as variáveis de produção (o `npm run setup` faz). Depois `npx vercel deploy --prod`.
5. Diga-me exatamente o que falta nos painéis (você não consegue por CLI):
   - Supabase > Authentication > URL Configuration: Site URL e Redirect URL <site>/auth/callback; SMTP próprio.
   - Mercado Pago > Webhooks: <site>/api/webhooks/mercadopago, evento Pagamentos; me peça a assinatura secreta e rode `npm run setup` de novo.
6. Me peça para criar minha conta no site e então promova meu e-mail a administrador (o `npm run setup` faz).
7. Teste: abra o site, crie um currículo, veja a prévia e a nota, faça 1 pagamento Pix de R$ 10,00 e confirme que o download libera.
   Se algo falhar, leia os logs da Vercel e /admin/logs e corrija.
8. No final, liste o que ficou pronto, o que ficou pendente e qualquer risco.
```

## Só quer rodar o assistente sozinho?
```bash
npm install
npm run setup
```
