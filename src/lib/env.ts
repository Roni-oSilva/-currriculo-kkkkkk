/**
 * Acesso centralizado e tipado às variáveis de ambiente. Nenhum segredo é lido no cliente:
 * apenas variáveis NEXT_PUBLIC_* chegam ao navegador.
 */
export const CONTACT_EMAIL = "miraclestudio.land@gmail.com";
const read = (k: string) => (process.env[k] ?? "").trim();

export const env = {
  get appUrl() { return read("NEXT_PUBLIC_APP_URL") || "http://localhost:3000"; },
  get contactEmail() { return CONTACT_EMAIL; },
  get supabaseUrl() { return read("NEXT_PUBLIC_SUPABASE_URL"); },
  get supabaseAnonKey() { return read("NEXT_PUBLIC_SUPABASE_ANON_KEY"); },
  get supabaseServiceKey() { return read("SUPABASE_SERVICE_ROLE_KEY"); },
  get aiProvider() { return read("AI_PROVIDER") || "anthropic"; },
  get aiKey() { return read("AI_API_KEY"); },
  get aiModel() { return read("AI_MODEL"); },
  get aiBaseUrl() { return read("AI_BASE_URL"); },
  get aiRateLimitPerHour() { return Number(read("AI_RATE_LIMIT_PER_HOUR")) || 20; },
  get mpToken() { return read("MERCADOPAGO_ACCESS_TOKEN"); },
  get mpWebhookSecret() { return read("MERCADOPAGO_WEBHOOK_SECRET"); },
  get pixExpirationMinutes() { return Number(read("PIX_EXPIRATION_MINUTES")) || 30; },
  get cronSecret() { return read("CRON_SECRET"); },
  get isProduction() { return process.env.NODE_ENV === "production"; },
};

export const configStatus = {
  supabase: () => Boolean(env.supabaseUrl && env.supabaseAnonKey),
  supabaseAdmin: () => Boolean(env.supabaseUrl && env.supabaseServiceKey),
  ai: () => Boolean(env.aiKey && env.aiModel && (env.aiProvider !== "openai-compatible" || env.aiBaseUrl)),
  payments: () => Boolean(env.mpToken),
  webhook: () => Boolean(env.mpWebhookSecret),
};

export const SETUP_DOC = "docs/DEPLOY.md";
