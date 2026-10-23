import { env } from "@/lib/env";

export interface ModelRequest {
  system: string;
  user: string;
  maxTokens?: number;
}

export class AiNotConfiguredError extends Error {}
export class AiProviderError extends Error {}

/**
 * Chama o provedor configurado em AI_PROVIDER. A chave nunca sai do servidor.
 *  - "anthropic": API Messages (https://api.anthropic.com/v1/messages)
 *  - "openai-compatible": qualquer endpoint /chat/completions (OpenAI, OpenRouter, Groq, Ollama...)
 */
export async function callModel(req: ModelRequest): Promise<string> {
  if (!env.aiKey || !env.aiModel) throw new AiNotConfiguredError("IA não configurada");
  const maxTokens = req.maxTokens ?? 2000;
  const signal = AbortSignal.timeout(45_000);

  if (env.aiProvider === "anthropic") {
    const res = await fetch(`${env.aiBaseUrl || "https://api.anthropic.com"}/v1/messages`, {
      method: "POST",
      headers: { "x-api-key": env.aiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({ model: env.aiModel, max_tokens: maxTokens, system: req.system, messages: [{ role: "user", content: req.user }] }),
      signal,
    });
    if (!res.ok) throw new AiProviderError(`Provedor de IA respondeu ${res.status}`);
    const json = await res.json();
    return (json.content ?? []).filter((c: { type: string }) => c.type === "text").map((c: { text: string }) => c.text).join("");
  }

  if (env.aiProvider === "openai-compatible") {
    if (!env.aiBaseUrl) throw new AiNotConfiguredError("AI_BASE_URL ausente");
    const res = await fetch(`${env.aiBaseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: { authorization: `Bearer ${env.aiKey}`, "content-type": "application/json" },
      body: JSON.stringify({
        model: env.aiModel, max_tokens: maxTokens, temperature: 0.3,
        messages: [{ role: "system", content: req.system }, { role: "user", content: req.user }],
      }),
      signal,
    });
    if (!res.ok) throw new AiProviderError(`Provedor de IA respondeu ${res.status}`);
    const json = await res.json();
    return json.choices?.[0]?.message?.content ?? "";
  }

  throw new AiNotConfiguredError(`AI_PROVIDER desconhecido: ${env.aiProvider}`);
}
