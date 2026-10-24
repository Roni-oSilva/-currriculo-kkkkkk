import { beforeEach, describe, expect, it, vi } from "vitest";

process.env.NEXT_PUBLIC_SUPABASE_URL = "https://x.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon";

const calls: { fn: string; args: unknown[] }[] = [];
let signUpResult: { data: { session: unknown }; error: unknown } = { data: { session: null }, error: null };
let signInError: unknown = null;
const redirected: string[] = [];

vi.mock("next/headers", () => ({ headers: async () => new Headers({ "x-forwarded-for": "9.9.9.9" }), cookies: async () => ({ getAll: () => [], set: () => {} }) }));
vi.mock("next/navigation", () => ({ redirect: (to: string) => { redirected.push(to); throw new Error("NEXT_REDIRECT"); } }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: {
      signUp: async (...a: unknown[]) => { calls.push({ fn: "signUp", args: a }); return signUpResult; },
      signInWithPassword: async (...a: unknown[]) => { calls.push({ fn: "signIn", args: a }); return { error: signInError }; },
      resetPasswordForEmail: async (...a: unknown[]) => { calls.push({ fn: "reset", args: a }); return {}; },
      signOut: async () => { calls.push({ fn: "signOut", args: [] }); },
    },
  }),
}));

const form = (o: Record<string, string>) => { const f = new FormData(); Object.entries(o).forEach(([k, v]) => f.set(k, v)); return f; };

beforeEach(async () => {
  calls.length = 0; redirected.length = 0; signInError = null; signUpResult = { data: { session: null }, error: null };
  (await import("@/lib/security/ratelimit")).resetRateLimits();
});

describe("ações de autenticação", () => {
  it("cadastro: valida os campos antes de falar com o servidor", async () => {
    const { registerAction } = await import("@/app/auth-actions");
    const bad = await registerAction({}, form({ fullName: "Ana", email: "x", password: "abc12345" }));
    expect(bad.fieldErrors?.email).toBeTruthy();
    expect(calls).toHaveLength(0);
  });
  it("cadastro sem confirmação de e-mail: entra direto e vai escolher a profissão", async () => {
    const { registerAction } = await import("@/app/auth-actions");
    signUpResult = { data: { session: { access_token: "t" } }, error: null };
    await expect(registerAction({}, form({ fullName: "Ana Souza", email: "ana@x.com", password: "abc12345" }))).rejects.toThrow("NEXT_REDIRECT");
    expect(redirected.at(-1)).toBe("/resume/new");
    expect(calls[0].fn).toBe("signUp");
    expect((calls[0].args[0] as { options: { data: { full_name: string } } }).options.data.full_name).toBe("Ana Souza");
  });
  it("cadastro sem sessão imediata: tenta entrar com a mesma senha; se der certo, entra", async () => {
    const { registerAction } = await import("@/app/auth-actions");
    await expect(registerAction({}, form({ fullName: "Ana Souza", email: "ana@x.com", password: "abc12345" }))).rejects.toThrow("NEXT_REDIRECT");
    expect(calls.map((c) => c.fn)).toEqual(["signUp", "signIn"]);
    expect(redirected.at(-1)).toBe("/resume/new");
  });
  it("e-mail já cadastrado com outra senha: não entra e não revela se a conta existe", async () => {
    const { registerAction } = await import("@/app/auth-actions");
    signInError = { message: "Invalid login credentials" };
    const r = await registerAction({}, form({ fullName: "Ana Souza", email: "ana@x.com", password: "abc12345" }));
    expect(r.error).toMatch(/Entrar/);
    expect(redirected).toHaveLength(0);
  });
  it("se a confirmação de e-mail ainda estiver ligada no Supabase, explica como desligar", async () => {
    const { registerAction } = await import("@/app/auth-actions");
    signInError = { message: "Email not confirmed" };
    const r = await registerAction({}, form({ fullName: "Ana Souza", email: "ana@x.com", password: "abc12345" }));
    expect(r.error).toMatch(/Confirm email/);
  });
  it("login: erro genérico para credenciais inválidas e redirecionamento seguro no sucesso", async () => {
    const { loginAction } = await import("@/app/auth-actions");
    signInError = { message: "Invalid" };
    expect((await loginAction({}, form({ email: "a@x.com", password: "x" }))).error).toMatch(/incorretos/);
    signInError = null;
    await expect(loginAction({}, form({ email: "a@x.com", password: "x", next: "https://evil.com" }))).rejects.toThrow("NEXT_REDIRECT");
    expect(redirected.at(-1)).toBe("/dashboard");
    await expect(loginAction({}, form({ email: "a@x.com", password: "x", next: "/resume/1/edit" }))).rejects.toThrow("NEXT_REDIRECT");
    expect(redirected.at(-1)).toBe("/resume/1/edit");
  });
  it("login: limita tentativas por IP", async () => {
    const { loginAction } = await import("@/app/auth-actions");
    signInError = { message: "x" };
    let last;
    for (let i = 0; i < 12; i++) last = await loginAction({}, form({ email: "a@x.com", password: "x" }));
    expect(last?.error).toMatch(/Muitas tentativas/);
  });
  it("recuperação de senha responde igual para e-mail existente ou não", async () => {
    const { forgotAction } = await import("@/app/auth-actions");
    const r = await forgotAction({}, form({ email: "qualquer@x.com" }));
    expect(r.ok).toMatch(/Se o e-mail estiver cadastrado/);
    expect(calls[0].fn).toBe("reset");
  });
});
