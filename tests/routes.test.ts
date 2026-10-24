import { beforeEach, describe, expect, it, vi } from "vitest";
import { FakeDb } from "./helpers/fake-supabase";
import { resumePayloadSchema } from "@/lib/resume/schema";
import { sampleResume } from "@/lib/resume/sample";

process.env.NEXT_PUBLIC_SUPABASE_URL = "https://x.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon";
process.env.SUPABASE_SERVICE_ROLE_KEY = "service";

let db: FakeDb;
let currentUser: { id: string } | null = null;

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => new FakeDb(currentUser?.id ?? null, { resumes: "user_id", payments: "user_id" }, db).asClient(currentUser),
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ from: (t: string) => db.from(t), storage: db.storageApi }),
}));
vi.mock("@/lib/log", () => ({ logEvent: async () => {}, redact: (m: unknown) => m }));

const A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const R = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";

function seedResume(over: Record<string, unknown> = {}) {
  const s = sampleResume("classic");
  db.table("resumes").push({ id: R, user_id: A, title: "T", data: s.data, design: s.design, template: "classic", status: "ready", version: 1, updated_at: new Date().toISOString(), ...over });
}
const req = (url: string, init?: RequestInit) => new Request(`http://localhost${url}`, init);
const ctx = (id = R) => ({ params: Promise.resolve({ id }) });

beforeEach(async () => {
  db = new FakeDb();
  currentUser = { id: A };
  const { resetRateLimits } = await import("@/lib/security/ratelimit");
  resetRateLimits();
});

describe("GET /api/resumes/[id]/download", () => {
  it("exige sessão (401)", async () => {
    seedResume(); currentUser = null;
    const { GET } = await import("@/app/api/resumes/[id]/download/route");
    expect((await GET(req(`/api/resumes/${R}/download`), ctx())).status).toBe(401);
  });

  it("bloqueia o download antes do pagamento (402) e não gera arquivo nem URL", async () => {
    seedResume();
    const { GET } = await import("@/app/api/resumes/[id]/download/route");
    const res = await GET(req(`/api/resumes/${R}/download`), ctx());
    expect(res.status).toBe(402);
    expect(db.signedCalls).toHaveLength(0);
    expect(db.storage["resume-files"]?.size ?? 0).toBe(0);
  });

  it("não aceita parâmetros de URL/estado do cliente como prova de pagamento", async () => {
    seedResume();
    const { GET } = await import("@/app/api/resumes/[id]/download/route");
    const res = await GET(req(`/api/resumes/${R}/download?paid=true&status=approved&version=1`), ctx());
    expect(res.status).toBe(402);
  });

  it.each(["pending", "cancelled", "expired", "refunded"])("bloqueia com pagamento %s", async (status) => {
    seedResume();
    db.table("payments").push({ id: "p1", user_id: A, resume_id: R, resume_version: 1, status });
    const { GET } = await import("@/app/api/resumes/[id]/download/route");
    expect((await GET(req(`/api/resumes/${R}/download`), ctx())).status).toBe(402);
    expect(db.signedCalls).toHaveLength(0);
  });

  it("libera após pagamento aprovado: PDF real, sem marca d'água, URL assinada de 60 s", async () => {
    seedResume();
    db.table("payments").push({ id: "p1", user_id: A, resume_id: R, resume_version: 1, status: "approved" });
    const { GET } = await import("@/app/api/resumes/[id]/download/route");
    const res = await GET(req(`/api/resumes/${R}/download`), ctx());
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.fileName).toBe("Curriculo_Maria_Exemplo_da_Silva.pdf");
    expect(json.expiresIn).toBe(60);
    expect(db.signedCalls[0]).toMatchObject({ bucket: "resume-files", ttl: 60 });
    const stored = db.storage["resume-files"].get(`${A}/${R}/v1.pdf`)!;
    expect(Buffer.from(stored.subarray(0, 4)).toString()).toBe("%PDF");
    const { extractText } = await import("./helpers/pdf");
    const text = await extractText(stored);
    expect(text).toContain("Maria Exemplo da Silva");
    expect(text).not.toMatch(/PRÉVIA|DESBLOQUEIE/);
  });

  it("pagamento revertido (reembolso) bloqueia novamente, mesmo com arquivo já gerado", async () => {
    seedResume();
    db.table("payments").push({ id: "p1", user_id: A, resume_id: R, resume_version: 1, status: "approved" });
    const { GET } = await import("@/app/api/resumes/[id]/download/route");
    expect((await GET(req(`/api/resumes/${R}/download`), ctx())).status).toBe(200);
    db.table("payments")[0].status = "refunded";
    expect((await GET(req(`/api/resumes/${R}/download`), ctx())).status).toBe(402);
  });

  it("outro usuário não acessa o currículo (404) mesmo que o pagamento exista", async () => {
    seedResume();
    db.table("payments").push({ id: "p1", user_id: A, resume_id: R, resume_version: 1, status: "approved" });
    currentUser = { id: B };
    const { GET } = await import("@/app/api/resumes/[id]/download/route");
    const res = await GET(req(`/api/resumes/${R}/download`), ctx());
    expect(res.status).toBe(404);
    expect(db.signedCalls).toHaveLength(0);
  });

  it("após editar (versão 2) exige nova compra, mas a versão 1 paga segue disponível pelo snapshot", async () => {
    const s = sampleResume("classic");
    seedResume({ version: 2, data: { ...s.data, personal: { ...s.data.personal, fullName: "Nome Editado Depois" } } });
    db.table("resume_versions").push({ resume_id: R, version: 1, title: "T", data: s.data, design: s.design, template: "classic", created_at: new Date().toISOString() });
    db.table("payments").push({ id: "p1", user_id: A, resume_id: R, resume_version: 1, status: "approved" });
    const { GET } = await import("@/app/api/resumes/[id]/download/route");
    expect((await GET(req(`/api/resumes/${R}/download`), ctx())).status).toBe(402);
    const v1 = await GET(req(`/api/resumes/${R}/download?version=1`), ctx());
    expect(v1.status).toBe(200);
    const { extractText } = await import("./helpers/pdf");
    expect(await extractText(db.storage["resume-files"].get(`${A}/${R}/v1.pdf`)!)).toContain("Maria Exemplo");
  });
});

describe("GET /api/resumes/[id]/preview", () => {
  it("entrega apenas imagens PNG com marca d'água; nunca PDF nem caminho de arquivo", async () => {
    seedResume();
    const { GET } = await import("@/app/api/resumes/[id]/preview/route");
    const res = await GET(req(`/api/resumes/${R}/preview`), ctx());
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toContain("no-store");
    const json = await res.json();
    expect(json.pages[0]).toMatch(/^data:image\/png;base64,/);
    expect(JSON.stringify(json)).not.toMatch(/\.pdf|resume-files|signed/);
    expect(db.storage["resume-files"]?.size ?? 0).toBe(0);
  });
  it("não permite prévia de currículo alheio", async () => {
    seedResume(); currentUser = { id: B };
    const { GET } = await import("@/app/api/resumes/[id]/preview/route");
    expect((await GET(req(`/api/resumes/${R}/preview`), ctx())).status).toBe(404);
  });
});

describe("PUT/GET/DELETE /api/resumes/[id]", () => {
  const put = (body: unknown) => req(`/api/resumes/${R}`, { method: "PUT", body: JSON.stringify(body) });
  const payload = () => resumePayloadSchema.parse({ ...sampleResume("classic") });

  it("cria/edita e valida dados; ignora photoPath do cliente", async () => {
    seedResume();
    db.table("templates").push({ id: "classic", enabled: true });
    const { PUT } = await import("@/app/api/resumes/[id]/route");
    const p = payload();
    p.data.personal.fullName = "Novo Nome";
    p.data.personal.photoPath = `${B}/outra-pessoa.jpg`;
    const res = await PUT(put(p), ctx());
    expect(res.status).toBe(200);
    const row = db.table("resumes")[0] as { data: { personal: { fullName: string; photoPath: string } } };
    expect(row.data.personal.fullName).toBe("Novo Nome");
    expect(row.data.personal.photoPath).toBe("");
  });

  it("aceita link sem https:// e o salva normalizado", async () => {
    seedResume(); db.table("templates").push({ id: "classic", enabled: true });
    const { PUT } = await import("@/app/api/resumes/[id]/route");
    const p = payload();
    p.data.personal.linkedin = "linkedin.com/in/maria";
    expect((await PUT(put(p), ctx())).status).toBe(200);
    expect((db.table("resumes")[0] as { data: { personal: { linkedin: string } } }).data.personal.linkedin).toBe("https://linkedin.com/in/maria");
  });

  it("rejeita URL maliciosa e payload gigante", async () => {
    seedResume(); db.table("templates").push({ id: "classic", enabled: true });
    const { PUT } = await import("@/app/api/resumes/[id]/route");
    const p = payload() as unknown as { data: { personal: { website: string } } };
    p.data.personal.website = "javascript:alert(1)";
    expect((await PUT(put(p), ctx())).status).toBe(422);
    const big = new Request(`http://localhost/api/resumes/${R}`, { method: "PUT", body: "x".repeat(400_000) });
    expect((await PUT(big, ctx())).status).toBe(413);
  });

  it("isola dados: outro usuário não lê, edita nem exclui", async () => {
    seedResume(); db.table("templates").push({ id: "classic", enabled: true }); currentUser = { id: B };
    const { GET, PUT, DELETE } = await import("@/app/api/resumes/[id]/route");
    expect((await GET(req(`/api/resumes/${R}`), ctx())).status).toBe(404);
    expect((await PUT(put(payload()), ctx())).status).toBe(404);
    expect((await DELETE(req(`/api/resumes/${R}`, { method: "DELETE" }), ctx())).status).toBe(404);
    expect(db.table("resumes")).toHaveLength(1);
  });

  it("dono exclui o próprio currículo", async () => {
    seedResume();
    const { DELETE } = await import("@/app/api/resumes/[id]/route");
    expect((await DELETE(req(`/api/resumes/${R}`, { method: "DELETE" }), ctx())).status).toBe(200);
    expect(db.table("resumes")).toHaveLength(0);
  });
});

describe("POST /api/ai/improve e /api/payments sem configuração", () => {
  it("IA não configurada: 503 com instrução, sem simular resultado", async () => {
    seedResume();
    const { POST } = await import("@/app/api/ai/improve/route");
    const res = await POST(req("/api/ai/improve", { method: "POST", body: JSON.stringify({ resumeId: R, operation: "summary" }) }));
    expect(res.status).toBe(503);
    expect((await res.json()).code).toBe("ai_not_configured");
  });
  it("pagamentos não configurados: 503, sem cobrança falsa", async () => {
    seedResume();
    const { POST } = await import("@/app/api/payments/route");
    const res = await POST(req("/api/payments", { method: "POST", body: JSON.stringify({ resumeId: R }) }));
    expect(res.status).toBe(503);
    expect(db.table("payments")).toHaveLength(0);
  });
});

describe("POST /api/resumes com profissão", () => {
  const post = (body: unknown) => req("/api/resumes", { method: "POST", body: JSON.stringify(body) });
  it("usa o modelo recomendado da profissão e preenche cargo e área", async () => {
    const { POST } = await import("@/app/api/resumes/route");
    const res = await POST(post({ profession: "designer-grafico" }));
    expect(res.status).toBe(201);
    const row = db.table("resumes")[0] as { template: string; user_id: string; data: { objective: { targetRole: string; area: string } } };
    expect(row.template).toBe("creative");
    expect(row.user_id).toBe(A);
    expect(row.data.objective.targetRole).toBe("Designer gráfico");
    expect(row.data.objective.area).toBe("Marketing, comunicação e criação");
  });
  it("permite trocar o modelo; ignora profissão e modelo inválidos", async () => {
    const { POST } = await import("@/app/api/resumes/route");
    await POST(post({ profession: "designer-grafico", template: "classic" }));
    await POST(post({ profession: "inventada", template: "hacker" }));
    const rows = db.table("resumes") as { template: string; data: { objective: { targetRole: string } } }[];
    expect(rows[0].template).toBe("classic");
    expect(rows[1].template).toBe("classic");
    expect(rows[1].data.objective.targetRole).toBe("");
  });
});

describe("POST /api/resumes com profissão fora da lista", () => {
  it("usa o texto digitado como cargo desejado (higienizado e limitado)", async () => {
    const { POST } = await import("@/app/api/resumes/route");
    const res = await POST(req("/api/resumes", { method: "POST", body: JSON.stringify({ role: "  Doceira\u0000 de festas  ".padEnd(300, "x"), template: "classic" }) }));
    expect(res.status).toBe(201);
    const row = db.table("resumes")[0] as { data: { objective: { targetRole: string } } };
    expect(row.data.objective.targetRole.startsWith("Doceira de festas")).toBe(true);
    expect(row.data.objective.targetRole.length).toBeLessThanOrEqual(120);
    expect(row.data.objective.targetRole).not.toContain("\u0000");
  });
});
