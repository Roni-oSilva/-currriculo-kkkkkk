/**
 * Traduz o erro do Supabase Auth em uma mensagem útil. O código técnico aparece entre parênteses
 * para facilitar o suporte; a causa completa fica em /admin/logs (evento signup_failed).
 */
export function signupErrorMessage(error: { message?: string; code?: string; status?: number }): string {
  const code = error.code ?? "";
  const msg = (error.message ?? "").toLowerCase();
  const tag = code ? ` (código: ${code})` : error.status ? ` (código: ${error.status})` : "";

  if (code === "user_already_exists" || code === "email_exists" || msg.includes("already registered")) {
    return "Este e-mail já tem cadastro. Use “Entrar” (ou “Esqueci minha senha”).";
  }
  if (code === "weak_password" || msg.includes("password")) {
    return `A senha não foi aceita. Use pelo menos 8 caracteres, com letras e números.${tag}`;
  }
  if (code === "over_email_send_rate_limit" || code === "over_request_rate_limit" || msg.includes("rate limit")) {
    return `Muitos cadastros em pouco tempo. Aguarde alguns minutos e tente de novo.${tag}`;
  }
  if (code === "email_address_invalid" || msg.includes("invalid email") || msg.includes("is invalid")) {
    return `Este e-mail não foi aceito. Confira se está escrito corretamente.${tag}`;
  }
  if (code === "signup_disabled" || msg.includes("signups not allowed")) {
    return `Os cadastros estão temporariamente desativados.${tag}`;
  }
  return `Não foi possível criar a conta agora. Tente novamente em instantes.${tag}`;
}
