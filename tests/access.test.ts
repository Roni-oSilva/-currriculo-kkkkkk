import { describe, it, expect } from "vitest";
import { decideDownload, DOWNLOAD_URL_TTL_SECONDS } from "@/lib/access";

const base = { ownerId: "u1", userId: "u1", currentVersion: 1, repurchaseOnEdit: true };

describe("regra de acesso ao PDF final", () => {
  it("bloqueia antes do pagamento", () => {
    expect(decideDownload({ ...base, payments: [] })).toEqual({ allowed: false, reason: "not_paid" });
  });
  it("bloqueia pendente, cancelado, expirado e reembolsado", () => {
    expect(decideDownload({ ...base, payments: [{ resume_version: 1, status: "pending" }] })).toMatchObject({ allowed: false, reason: "pending" });
    expect(decideDownload({ ...base, payments: [{ resume_version: 1, status: "cancelled" }] })).toMatchObject({ allowed: false });
    expect(decideDownload({ ...base, payments: [{ resume_version: 1, status: "expired" }] })).toMatchObject({ allowed: false });
    expect(decideDownload({ ...base, payments: [{ resume_version: 1, status: "refunded" }] })).toMatchObject({ allowed: false, reason: "refunded" });
  });
  it("libera com pagamento aprovado da versão", () => {
    expect(decideDownload({ ...base, payments: [{ resume_version: 1, status: "approved" }] })).toEqual({ allowed: true, version: 1 });
  });
  it("reembolso posterior bloqueia mesmo com aprovação anterior de OUTRA cobrança reembolsada", () => {
    expect(decideDownload({ ...base, payments: [{ resume_version: 1, status: "refunded" }, { resume_version: 1, status: "cancelled" }] })).toMatchObject({ allowed: false });
  });
  it("não deixa outro usuário acessar (acesso horizontal)", () => {
    expect(decideDownload({ ...base, userId: "u2", payments: [{ resume_version: 1, status: "approved" }] })).toEqual({ allowed: false, reason: "not_owner" });
    expect(decideDownload({ ...base, ownerId: null, payments: [{ resume_version: 1, status: "approved" }] })).toMatchObject({ allowed: false });
  });
  it("edição após a compra exige nova compra; versão paga continua acessível", () => {
    const payments = [{ resume_version: 1, status: "approved" as const }];
    expect(decideDownload({ ...base, currentVersion: 2, payments })).toMatchObject({ allowed: false, reason: "not_paid" });
    expect(decideDownload({ ...base, currentVersion: 2, requestedVersion: 1, payments })).toEqual({ allowed: true, version: 1 });
    expect(decideDownload({ ...base, currentVersion: 2, payments: [...payments, { resume_version: 2, status: "approved" }] })).toEqual({ allowed: true, version: 2 });
  });
  it("política administrativa pode liberar a versão atual sem nova compra", () => {
    expect(decideDownload({ ...base, currentVersion: 3, repurchaseOnEdit: false, payments: [{ resume_version: 1, status: "approved" }] })).toEqual({ allowed: true, version: 3 });
  });
  it("versão inexistente é negada", () => {
    expect(decideDownload({ ...base, requestedVersion: 5, payments: [{ resume_version: 1, status: "approved" }] })).toMatchObject({ allowed: false, reason: "outdated_version" });
  });
  it("links de download expiram em até 60 segundos", () => {
    expect(DOWNLOAD_URL_TTL_SECONDS).toBeLessThanOrEqual(60);
  });
});
