import type { PaymentStatus } from "@/lib/payments/types";

export interface AccessPayment {
  resume_version: number;
  status: PaymentStatus;
}

export type AccessDecision =
  | { allowed: true; version: number }
  | { allowed: false; reason: "not_owner" | "not_paid" | "refunded" | "pending" | "outdated_version" };

/**
 * Regra única de acesso ao PDF final. Usada em TODAS as requisições de download.
 * - Só o dono acessa.
 * - É preciso um pagamento APROVADO para a versão solicitada (padrão: uma compra = uma versão).
 * - Com `repurchaseOnEdit = false` (configuração administrativa), um pagamento aprovado
 *   de qualquer versão libera também a versão atual.
 * - Pagamentos pendentes, cancelados, expirados ou reembolsados nunca liberam.
 */
export function decideDownload(input: {
  ownerId: string | null;
  userId: string;
  currentVersion: number;
  requestedVersion?: number;
  payments: AccessPayment[];
  repurchaseOnEdit: boolean;
}): AccessDecision {
  const { ownerId, userId, currentVersion, payments, repurchaseOnEdit } = input;
  if (!ownerId || ownerId !== userId) return { allowed: false, reason: "not_owner" };
  const version = input.requestedVersion ?? currentVersion;
  if (version > currentVersion || version < 1) return { allowed: false, reason: "outdated_version" };

  const forVersion = payments.filter((p) => p.resume_version === version);
  if (forVersion.some((p) => p.status === "approved")) return { allowed: true, version };

  if (!repurchaseOnEdit && version === currentVersion && payments.some((p) => p.status === "approved")) {
    return { allowed: true, version };
  }
  if (forVersion.some((p) => p.status === "refunded")) return { allowed: false, reason: "refunded" };
  if (forVersion.some((p) => p.status === "pending")) return { allowed: false, reason: "pending" };
  return { allowed: false, reason: "not_paid" };
}

export const DOWNLOAD_URL_TTL_SECONDS = 60;
