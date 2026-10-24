import { describe, expect, it } from "vitest";
import { signupErrorMessage } from "@/lib/auth-errors";

describe("mensagens de erro do cadastro", () => {
  it("explica limite de e-mails, e-mail repetido, senha fraca, e-mail inválido e cadastro desativado", () => {
    expect(signupErrorMessage({ code: "over_email_send_rate_limit", message: "email rate limit exceeded" })).toMatch(/Aguarde alguns minutos.*over_email_send_rate_limit/);
    expect(signupErrorMessage({ code: "user_already_exists" })).toMatch(/já tem cadastro/);
    expect(signupErrorMessage({ code: "weak_password" })).toMatch(/8 caracteres/);
    expect(signupErrorMessage({ code: "email_address_invalid" })).toMatch(/não foi aceito/);
    expect(signupErrorMessage({ code: "signup_disabled" })).toMatch(/desativados/);
  });
  it("erro desconhecido mostra o código para o suporte, sem vazar a mensagem interna", () => {
    const m = signupErrorMessage({ code: "unexpected_failure", message: "secret internal stack trace", status: 500 });
    expect(m).toContain("unexpected_failure");
    expect(m).not.toContain("secret");
    expect(signupErrorMessage({ message: "x", status: 502 })).toContain("502");
  });
});
