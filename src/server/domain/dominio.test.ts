import { describe, expect, it } from "vitest";
import { centavosParaInput, parseMeticais } from "@/lib/money";
import {
  calcularFinanceiro,
  resumoFinanceiro,
  validarNovoPagamento,
} from "./financeiro";
import { validarEstadoInatro } from "./inatro";
import { pode } from "./permissoes";

describe("parseMeticais", () => {
  it.each([
    ["1500", 150000],
    ["1.500", 150000],
    ["1 500", 150000],
    ["1.500,50", 150050],
    ["1500,5", 150050],
    ["1500.50", 150050],
    ["18.500 MT", 1850000],
    ["1.000.000", 100000000],
    ["0,01", 1],
  ])("%s → %i centavos", (txt, esperado) => {
    expect(parseMeticais(txt)).toBe(esperado);
  });

  it.each(["", "abc", "-100", "1,2,3", "10,123", "1.50.0"])(
    "rejeita %s",
    (txt) => {
      expect(parseMeticais(txt)).toBeNull();
    },
  );

  it("converte de volta para o campo", () => {
    expect(centavosParaInput(150050)).toBe("1500,50");
    expect(centavosParaInput(150000)).toBe("1500");
  });
});

describe("financeiro", () => {
  it("sem pagamentos", () => {
    const f = calcularFinanceiro(1_850_000, []);
    expect(f).toMatchObject({
      pagoCentavos: 0,
      saldoCentavos: 1_850_000,
      percentagem: 0,
      situacao: "sem_pagamento",
    });
  });

  it("parcial (30%) ignora pagamentos anulados", () => {
    const f = calcularFinanceiro(1_000_000, [
      { valorCentavos: 300_000, anulado: false },
      { valorCentavos: 500_000, anulado: true },
    ]);
    expect(f).toMatchObject({
      pagoCentavos: 300_000,
      saldoCentavos: 700_000,
      percentagem: 30,
      situacao: "parcial",
    });
  });

  it("pago na totalidade", () => {
    expect(resumoFinanceiro(950_000, 950_000).situacao).toBe("pago");
    expect(resumoFinanceiro(950_000, 950_000).percentagem).toBe(100);
  });

  it("rejeita valores inválidos e excesso de pagamento", () => {
    expect(validarNovoPagamento(1000, 0, 0)).toMatch(/maior que zero/);
    expect(validarNovoPagamento(1000, 0, -5)).toMatch(/maior que zero/);
    expect(validarNovoPagamento(1000, 600, 500)).toMatch(/excede/);
    expect(validarNovoPagamento(1000, 1000, 1)).toMatch(/totalmente paga/);
    expect(validarNovoPagamento(1000, 600, 400)).toBeNull();
  });
});

describe("INATRO", () => {
  it("registado exige número de processo", () => {
    expect(validarEstadoInatro("registado", "")).not.toBeNull();
    expect(validarEstadoInatro("registado", "  ")).not.toBeNull();
    expect(validarEstadoInatro("registado", "MPT-123")).toBeNull();
    expect(validarEstadoInatro("pendente", null)).toBeNull();
  });
});

describe("permissões", () => {
  it("só gestor e admin anulam pagamentos", () => {
    expect(pode("atendente", "anular_pagamento")).toBe(false);
    expect(pode("gestor", "anular_pagamento")).toBe(true);
    expect(pode("admin", "anular_pagamento")).toBe(true);
  });

  it("só admin gere utilizadores e categorias", () => {
    expect(pode("gestor", "gerir_utilizadores")).toBe(false);
    expect(pode("gestor", "gerir_categorias")).toBe(false);
    expect(pode("admin", "gerir_categorias")).toBe(true);
  });
});
