/** Regras financeiras puras — sem acesso à base de dados. */

export type SituacaoPagamento = "sem_pagamento" | "parcial" | "pago";

export type Financeiro = {
  totalCentavos: number;
  pagoCentavos: number;
  saldoCentavos: number;
  percentagem: number; // 0–100, inteiro arredondado para baixo
  situacao: SituacaoPagamento;
};

export function situacaoPagamento(
  totalCentavos: number,
  pagoCentavos: number,
): SituacaoPagamento {
  if (pagoCentavos <= 0) return totalCentavos === 0 ? "pago" : "sem_pagamento";
  return pagoCentavos < totalCentavos ? "parcial" : "pago";
}

export function calcularFinanceiro(
  totalCentavos: number,
  pagamentos: Array<{ valorCentavos: number; anulado: boolean }>,
): Financeiro {
  const pagoCentavos = pagamentos
    .filter((p) => !p.anulado)
    .reduce((s, p) => s + p.valorCentavos, 0);
  return resumoFinanceiro(totalCentavos, pagoCentavos);
}

export function resumoFinanceiro(
  totalCentavos: number,
  pagoCentavos: number,
): Financeiro {
  const percentagem =
    totalCentavos === 0
      ? 100
      : Math.min(100, Math.floor((pagoCentavos * 100) / totalCentavos));
  return {
    totalCentavos,
    pagoCentavos,
    saldoCentavos: totalCentavos - pagoCentavos,
    percentagem,
    situacao: situacaoPagamento(totalCentavos, pagoCentavos),
  };
}

/** Devolve uma mensagem de erro, ou null se o pagamento pode ser registado. */
export function validarNovoPagamento(
  totalCentavos: number,
  pagoCentavos: number,
  valorCentavos: number,
): string | null {
  if (!Number.isSafeInteger(valorCentavos) || valorCentavos <= 0) {
    return "O valor do pagamento tem de ser maior que zero.";
  }
  const saldo = totalCentavos - pagoCentavos;
  if (saldo <= 0) return "Esta inscrição já está totalmente paga.";
  if (valorCentavos > saldo) {
    return "O valor excede o saldo em falta. Verifique o montante.";
  }
  return null;
}
