# Pagamentos (Mercado Pago · Pix)

## Configuração
1. Em <https://www.mercadopago.com.br/developers> crie uma aplicação.
2. **Credenciais de teste** (sandbox): use o `Access Token` de teste em `MERCADOPAGO_ACCESS_TOKEN` apenas em ambientes de teste.
   **Produção:** use o token de produção (`APP_USR-…`). Nunca deixe credencial de teste em produção.
3. **Suas integrações → Webhooks**: URL `https://SEU-DOMINIO/api/webhooks/mercadopago`, evento **Pagamentos**. Copie a **assinatura secreta** para `MERCADOPAGO_WEBHOOK_SECRET`.
4. A conta Mercado Pago precisa ter **chave Pix** cadastrada para gerar cobranças Pix.

## Fluxo implementado
1. Usuário clica **Desbloquear meu currículo** → `POST /api/payments {resumeId}`.
2. Servidor confere a sessão e a propriedade (RLS), lê o **preço em `app_settings`** (1000 centavos = R$ 10,00) e a **versão do banco** — nada disso vem do navegador.
3. Cria linha `payments` (`pending`, `expires_at`) e chama `POST /v1/payments` (Pix) com `external_reference = payments.id`, `X-Idempotency-Key` e metadados (`user_id`, `resume_id`, `resume_version`). Índice único parcial impede duas cobranças pendentes para a mesma versão.
4. A interface mostra QR Code e *copia e cola*, e consulta `GET /api/payments/:id` a cada 4 s (o **servidor** consulta o provedor).
5. Webhook (`src/lib/payments/webhook.ts`): valida `x-signature` (HMAC-SHA256, `ts` com tolerância), usa **apenas o id** do corpo, **consulta a cobrança no Mercado Pago** e confere (`core.ts`):
   - `external_reference` = id local · valor **exato** em centavos · moeda **BRL** · `user_id`/`resume_id` dos metadados · id do provedor.
6. Transição **atômica e condicional** (`update … where status in (…)`): repetir o webhook N vezes aprova uma única vez.
7. Estados: `pending`, `approved`, `cancelled`, `expired`, `refunded`. `approved` só vai para `refunded` (gatilho no banco). Reembolso/chargeback bloqueia o download.
8. Pix vencido: `expired` (e cancelado no provedor). Se o provedor confirmar pagamento tardio, é aceito (fonte da verdade). O usuário pode **gerar novo Pix**.

## Política de compra
Padrão: **um pagamento libera uma versão**. Editar o conteúdo depois cria a versão seguinte (gatilho `resumes_version_guard` no banco, que também guarda snapshot imutável da versão paga). A versão paga continua baixável; a nova exige nova compra. O administrador pode desligar isso em **/admin/settings** (então um pagamento aprovado libera também a versão atual).

## Administração
Preço e política ficam em `/admin/settings` (auditados em `admin_audit_log`). **Não existe** botão para marcar pagamento como pago: o único procedimento é *Reconsultar provedor*, que passa pelas mesmas validações do webhook e é auditado.

## Cartão
O código está estruturado por `PaymentProvider` (`src/lib/payments/types.ts`). Para adicionar cartão: implemente `createCardPayment` com Checkout Bricks (tokenização no navegador, sem tocar em dados de cartão), reutilizando `applyProviderState` e o mesmo webhook.
