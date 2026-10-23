import crypto from "node:crypto";
import { describe, it, expect } from "vitest";
import { applyProviderState, syncPaymentFromProvider, verifyProviderPayment } from "@/lib/payments/core";
import { mapMercadoPagoStatus, toCents, verifyWebhookSignature } from "@/lib/payments/mercadopago";
import { processMercadoPagoWebhook } from "@/lib/payments/webhook";
import { MemoryStore, makeProvider, makeRecord } from "./helpers/memory-store";

const ID = "11111111-1111-4111-8111-111111111111";

describe("mapeamento de status e valores", () => {
  it("converte R$ 10,00 em 1000 sem erro de ponto flutuante", () => {
    expect(toCents(10)).toBe(1000);
    expect(toCents("10.00")).toBe(1000);
    expect(toCents(7.99)).toBe(799);
    expect(toCents(0.1 + 0.2)).toBe(30);
    expect(toCents(undefined)).toBeNull();
  });
  it("mapeia status do Mercado Pago", () => {
    expect(mapMercadoPagoStatus("approved")).toBe("approved");
    expect(mapMercadoPagoStatus("in_process")).toBe("pending");
    expect(mapMercadoPagoStatus("rejected")).toBe("cancelled");
    expect(mapMercadoPagoStatus("cancelled", "expired")).toBe("expired");
    expect(mapMercadoPagoStatus("refunded")).toBe("refunded");
    expect(mapMercadoPagoStatus("charged_back")).toBe("refunded");
    expect(mapMercadoPagoStatus("???")).toBe("unknown");
  });
});

describe("liberação após pagamento aprovado", () => {
  it("aprova quando valor, moeda, referência e usuário conferem", async () => {
    const store = new MemoryStore([makeRecord()]);
    const r = await applyProviderState(store, (await store.getById(ID))!, makeProvider());
    expect(r).toMatchObject({ status: "approved", changed: true });
    expect((await store.getById(ID))!.confirmed_at).not.toBeNull();
  });

  it.each([["pending", "in_process"], ["cancelled", "rejected"], ["refunded", "refunded"]] as const)("não aprova provedor %s", async (mapped, raw) => {
    const store = new MemoryStore([makeRecord()]);
    const r = await applyProviderState(store, (await store.getById(ID))!, makeProvider({ status: mapped, rawStatus: raw }));
    expect(r.status).not.toBe("approved");
  });

  it("rejeita valor incorreto (R$ 0,01, R$ 7,99 e R$ 100,00)", async () => {
    for (const amountCents of [1, 799, 10000, 999, null]) {
      const store = new MemoryStore([makeRecord()]);
      const r = await applyProviderState(store, (await store.getById(ID))!, makeProvider({ amountCents }));
      expect(r.status).toBe("pending");
      expect(r.rejected).toContain("valor_divergente");
      expect(store.events.some((e) => e.type === "payment_mismatch")).toBe(true);
    }
  });

  it("rejeita moeda diferente de BRL, referência alheia e usuário divergente", async () => {
    const row = makeRecord();
    expect(verifyProviderPayment(row, makeProvider({ currency: "USD" })).reasons).toContain("moeda_divergente");
    expect(verifyProviderPayment(row, makeProvider({ externalReference: "outro" })).reasons).toContain("referencia_divergente");
    expect(verifyProviderPayment(row, makeProvider({ metadata: { user_id: "invasor" } })).reasons).toContain("usuario_divergente");
    expect(verifyProviderPayment(row, makeProvider({ id: "MP-OUTRO" })).reasons).toContain("id_divergente");
  });

  it("é idempotente: processar o mesmo aprovado 5 vezes gera uma única transição", async () => {
    const store = new MemoryStore([makeRecord()]);
    const results = await Promise.all(Array.from({ length: 5 }, async () => applyProviderState(store, (await store.getById(ID))!, makeProvider())));
    expect(results.filter((r) => r.changed)).toHaveLength(1);
    expect(store.transitions).toBe(1);
    expect(store.events.filter((e) => e.type === "payment_approved")).toHaveLength(1);
  });

  it("reembolso só vale sobre pagamento aprovado e é idempotente", async () => {
    const store = new MemoryStore([makeRecord({ status: "approved" })]);
    const refunded = makeProvider({ status: "refunded", rawStatus: "refunded" });
    expect((await applyProviderState(store, (await store.getById(ID))!, refunded)).changed).toBe(true);
    expect((await applyProviderState(store, (await store.getById(ID))!, refunded)).changed).toBe(false);
    expect((await store.getById(ID))!.status).toBe("refunded");
    // aprovado de novo depois de reembolsado não reabre o acesso
    expect((await applyProviderState(store, (await store.getById(ID))!, makeProvider())).status).toBe("refunded");
  });

  it("expira cobrança pendente vencida e cancela no provedor", async () => {
    const store = new MemoryStore([makeRecord({ expires_at: new Date(Date.now() - 1000).toISOString() })]);
    let cancelled = false;
    const provider = { getPayment: async () => makeProvider({ status: "pending", rawStatus: "pending" }), cancelPayment: async () => { cancelled = true; } };
    const r = await syncPaymentFromProvider(store, provider, (await store.getById(ID))!);
    expect(r.status).toBe("expired");
    expect(cancelled).toBe(true);
  });

  it("aceita aprovação tardia de Pix que expirou localmente (provedor é a fonte da verdade)", async () => {
    const store = new MemoryStore([makeRecord({ status: "expired" })]);
    const r = await applyProviderState(store, (await store.getById(ID))!, makeProvider());
    expect(r.status).toBe("approved");
  });
});

describe("assinatura do webhook", () => {
  const secret = "segredo";
  const sign = (dataId: string, requestId: string, ts: number) => `ts=${ts},v1=${crypto.createHmac("sha256", secret).update(`id:${dataId};request-id:${requestId};ts:${ts};`).digest("hex")}`;
  it("aceita assinatura válida e rejeita adulterada, antiga ou ausente", () => {
    const ts = Date.now();
    expect(verifyWebhookSignature({ secret, signatureHeader: sign("123", "req", ts), requestId: "req", dataId: "123" })).toBe(true);
    expect(verifyWebhookSignature({ secret, signatureHeader: sign("123", "req", ts), requestId: "req", dataId: "124" })).toBe(false);
    expect(verifyWebhookSignature({ secret: "outro", signatureHeader: sign("123", "req", ts), requestId: "req", dataId: "123" })).toBe(false);
    expect(verifyWebhookSignature({ secret, signatureHeader: sign("123", "req", ts - 3_600_000), requestId: "req", dataId: "123" })).toBe(false);
    expect(verifyWebhookSignature({ secret, signatureHeader: null, requestId: "req", dataId: "123" })).toBe(false);
    expect(verifyWebhookSignature({ secret, signatureHeader: "ts=1,v1=zz", requestId: "req", dataId: "123" })).toBe(false);
  });
});

describe("processamento do webhook", () => {
  const secret = "segredo";
  const build = (dataId: string, opts: { sign?: boolean; ts?: number } = {}) => {
    const ts = opts.ts ?? Date.now();
    const headers = new Headers({ "x-request-id": "req-1" });
    if (opts.sign !== false) headers.set("x-signature", `ts=${ts},v1=${crypto.createHmac("sha256", secret).update(`id:${dataId.toLowerCase()};request-id:req-1;ts:${ts};`).digest("hex")}`);
    return { query: new URLSearchParams({ "data.id": dataId, type: "payment" }), headers, body: { type: "payment", data: { id: dataId } } };
  };

  it("rejeita webhook sem assinatura válida (401) e não consulta o provedor", async () => {
    const store = new MemoryStore([makeRecord()]);
    let called = false;
    const provider = { getPayment: async () => { called = true; return makeProvider(); } };
    const out = await processMercadoPagoWebhook(build("MP-1", { sign: false }), { store, provider, secret, isProduction: true });
    expect(out.httpStatus).toBe(401);
    expect(called).toBe(false);
    expect((await store.getById(ID))!.status).toBe("pending");
  });

  it("em produção sem segredo configurado, recusa (503)", async () => {
    const out = await processMercadoPagoWebhook(build("MP-1", { sign: false }), { store: new MemoryStore([makeRecord()]), provider: { getPayment: async () => makeProvider() }, secret: "", isProduction: true });
    expect(out.httpStatus).toBe(503);
  });

  it("não confia no corpo: aprovação só vale se o PROVEDOR confirmar", async () => {
    const store = new MemoryStore([makeRecord()]);
    const provider = { getPayment: async () => makeProvider({ status: "pending", rawStatus: "pending" }) };
    const input = build("MP-1");
    input.body = { type: "payment", data: { id: "MP-1" }, status: "approved" } as never;
    await processMercadoPagoWebhook(input, { store, provider, secret, isProduction: true });
    expect((await store.getById(ID))!.status).toBe("pending");
  });

  it("webhooks duplicados/concorrentes aprovam uma única vez", async () => {
    const store = new MemoryStore([makeRecord({ provider_payment_id: null })]);
    const provider = { getPayment: async () => makeProvider() };
    const outs = await Promise.all(Array.from({ length: 4 }, () => processMercadoPagoWebhook(build("MP-1"), { store, provider, secret, isProduction: true })));
    expect(outs.every((o) => o.httpStatus === 200)).toBe(true);
    expect(store.transitions).toBe(1);
    expect((await store.getById(ID))!.status).toBe("approved");
  });

  it("devolve 502 quando o provedor está fora (para o Mercado Pago tentar de novo) e 200 para cobrança desconhecida", async () => {
    const store = new MemoryStore([makeRecord()]);
    expect((await processMercadoPagoWebhook(build("MP-1"), { store, provider: { getPayment: async () => { throw new Error("down"); } }, secret, isProduction: true })).httpStatus).toBe(502);
    const unknown = await processMercadoPagoWebhook(build("MP-9"), { store, provider: { getPayment: async () => makeProvider({ id: "MP-9", externalReference: "desconhecida" }) }, secret, isProduction: true });
    expect(unknown.httpStatus).toBe(200);
    expect(unknown.body.ignored).toBe(true);
  });

  it("webhook com valor errado não libera o download", async () => {
    const store = new MemoryStore([makeRecord()]);
    await processMercadoPagoWebhook(build("MP-1"), { store, provider: { getPayment: async () => makeProvider({ amountCents: 1 }) }, secret, isProduction: true });
    expect((await store.getById(ID))!.status).toBe("pending");
  });
});
