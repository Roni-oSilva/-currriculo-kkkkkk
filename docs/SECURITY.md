# Segurança e privacidade

## Controles implementados
- **RLS** em todas as tabelas; `payments`, `resume_files`, `ai_generations`, logs e configurações só são escritos por `service_role` no servidor (`supabase/migrations/0002_rls.sql`). Testado com PGlite (`tests/db-rls.test.ts`).
- **Autorização no servidor** em todas as rotas: sessão (`auth.getUser`), propriedade (RLS + `user_id`), papel de admin lido do banco. Nenhum campo do cliente concede privilégio.
- **Download**: `decideDownload` (sessão → dono → versão → pagamento aprovado) executa em **cada** requisição; URL assinada de 60 s; buckets privados.
- **Prévia**: o servidor renderiza o PDF em memória com marca d'água e entrega **imagens PNG** (marca d'água gravada nos pixels) por rota autenticada, `Cache-Control: no-store`. Não existe PDF, caminho ou URL permanente antes do pagamento. Na interface: sem botões de baixar/imprimir, `@media print` oculta a prévia, seleção/cópia/menu de contexto/arrastar e atalhos Ctrl+P/S/C bloqueados. **Isso dificulta, mas não impede, capturas de tela.**
- **Fotos**: máx. 2 MB; tipo real por assinatura (JPEG/PNG/WebP); reencodadas com `sharp` (JPEG 600×600, remove EXIF/GPS e payloads embutidos); mín. 100×100; armazenadas em bucket privado com nome aleatório; caminho nunca enviado ao navegador (`maskPhoto`).
- **Validação** com Zod (tamanhos, datas, URLs só http/https, listas limitadas, cores/modelos controlados) + remoção de caracteres de controle/bidi. Conteúdo nunca vira HTML (React/react-pdf escapam).
- **Limites**: login/cadastro/recuperação por IP; salvamento, prévia, IA, pagamento e download por usuário; IA também persistida no banco; webhook por IP.
- **Webhook**: assinatura HMAC + consulta ao provedor + validação de valor/moeda/referência + idempotência. Em produção sem segredo: 503.
- **Segredos** só em variáveis de servidor; `server-only` no cliente admin; logs passam por `redact` (sem e-mail, telefone, senha, token, dados do currículo).
- **Cabeçalhos**: HSTS, `nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`.
- **Open redirect** bloqueado em `next` (login e callback).

## Limites conhecidos (seja transparente com o usuário)
- Capturas de tela da prévia não podem ser impedidas no navegador.
- Rate limit em memória é por instância serverless; para limite global use Upstash Redis (`@upstash/ratelimit`) e troque `src/lib/security/ratelimit.ts`.
- Políticas de CSP estrita não foram adicionadas (Tailwind/Next usam estilos inline); avalie com nonces antes de ativar.
- Textos legais são modelo-base e exigem revisão jurídica.

## LGPD
- Consentimento explícito para IA (registrado) e transparência sobre o que é enviado.
- Exclusão de conta em `/account`: apaga currículos, versões, fotos, PDFs, histórico de IA e o login. `payments` permanece com `user_id`/`resume_id` nulos (obrigação fiscal).
- Retenção: rascunhos sem compra parados há 18 meses e logs > 90 dias são removidos (`purge_stale_data`, cron diário).
