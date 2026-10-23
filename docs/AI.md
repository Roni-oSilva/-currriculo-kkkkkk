# Integração de IA

Camada em `src/lib/ai/`. A chave fica só no servidor (`AI_API_KEY`); o navegador chama `POST /api/ai/improve`.

## Configuração

```env
# Anthropic
AI_PROVIDER=anthropic
AI_API_KEY=...
AI_MODEL=<id do modelo>

# Qualquer API compatível com /chat/completions (OpenAI, OpenRouter, Groq, Ollama…)
AI_PROVIDER=openai-compatible
AI_BASE_URL=https://api.openai.com/v1
AI_API_KEY=...
AI_MODEL=<id do modelo>
```
Sem essas variáveis a rota responde `503 ai_not_configured` e a interface mostra aviso — nada é simulado.

## Operações
`summary` (resumo), `experience` (atividades/conquistas), `review` (revisão e lacunas), `tailor` (adaptar à vaga; exige a descrição da vaga) e `full`.

## Como evitamos invenção
1. **Prompt** proíbe criar empregos, diplomas, datas, números, ferramentas, habilidades e níveis de idioma.
2. **Entrada mínima**: só conteúdo profissional. Não enviamos nome, e-mail, telefone, endereço, links nem foto.
3. **Guarda no servidor** (`guard.ts`): descarta sugestões com números ou nomes próprios/ferramentas que não existam no currículo do usuário. A descrição da vaga **não** conta como fonte de fatos.
4. **Alvos conferidos**: só campos de texto conhecidos; o texto "original" é lido do banco, não da resposta da IA.
5. **Aprovação**: nada é aplicado sem o usuário clicar em *Aceitar*.
6. **Injeção de prompt**: o texto do usuário vai entre `<dados>…</dados>` com instrução para tratá-lo como dado.

## Limites e privacidade
- Consentimento explícito (`profiles.ai_consent_at`) antes da primeira chamada.
- Limite por usuário: 6 req/min em memória + `AI_RATE_LIMIT_PER_HOUR` (padrão 20) persistido em `ai_generations`.
- `ai_generations` guarda apenas metadados (provedor, modelo, nº de sugestões, duração), nunca o conteúdo.

## Nota 0–10 (não usa IA)
`src/lib/resume/ats.ts` calcula a chance de aceitação para o modelo escolhido: cabeçalho (1,0), resumo (1,5), experiência (2,5), formação (1,0), habilidades (1,2), idiomas (0,5), tamanho 1–2 páginas (1,0) e compatibilidade do modelo/foto/dados sensíveis (1,3). Clássico e Minimalista têm fator 1,0; Criativo 0,65. É uma estimativa baseada em boas práticas de RH, não uma garantia.
