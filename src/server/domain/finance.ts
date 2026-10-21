/** Regras financeiras puras — sem acesso à base de dados. */

export type PaymentStatus = "sem_pagamento" | "parcial" | "pago";

export type Financials = {
  totalCents: number;
  paidCents: number;
  balanceCents: number;
  percentage: number; // 0–100, inteiro arredondado para baixo
  paymentStatus: PaymentStatus;
};

export function paymentStatus(
  totalCents: number,
  paidCents: number,
): PaymentStatus {
  if (paidCents <= 0) return totalCents === 0 ? "pago" : "sem_pagamento";
  return paidCents < totalCents ? "parcial" : "pago";
}

export function calculateFinancials(
  totalCents: number,
  payments: Array<{ amountCents: number; voided: boolean }>,
): Financials {
  const paidCents = payments
    .filter((p) => !p.voided)
    .reduce((s, p) => s + p.amountCents, 0);
  return summarizeFinancials(totalCents, paidCents);
}

export function summarizeFinancials(
  totalCents: number,
  paidCents: number,
): Financials {
  const percentage =
    totalCents === 0
      ? 100
      : Math.min(100, Math.floor((paidCents * 100) / totalCents));
  return {
    totalCents,
    paidCents,
    balanceCents: totalCents - paidCents,
    percentage,
    paymentStatus: paymentStatus(totalCents, paidCents),
  };
}

/** Devolve uma mensagem de erro, ou null se o pagamento pode ser registado. */
export function validateNewPayment(
  totalCents: number,
  paidCents: number,
  amountCents: number,
): string | null {
  if (!Number.isSafeInteger(amountCents) || amountCents <= 0) {
    return "O valor do pagamento tem de ser maior que zero.";
  }
  const balance = totalCents - paidCents;
  if (balance <= 0) return "Esta inscrição já está totalmente paga.";
  if (amountCents > balance) {
    return "O valor excede o saldo em falta. Verifique o montante.";
  }
  return null;
}
