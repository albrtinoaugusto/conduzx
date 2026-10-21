import { describe, expect, it } from "vitest";
import { centsToInput, parseMeticais } from "@/lib/money";
import {
  calculateFinancials,
  summarizeFinancials,
  validateNewPayment,
} from "./finance";
import { validateInatroStatus } from "./inatro";
import { can } from "./permissions";

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
  ])("%s → %i centavos", (txt, expected) => {
    expect(parseMeticais(txt)).toBe(expected);
  });

  it.each(["", "abc", "-100", "1,2,3", "10,123", "1.50.0"])(
    "rejeita %s",
    (txt) => {
      expect(parseMeticais(txt)).toBeNull();
    },
  );

  it("converte de volta para o campo", () => {
    expect(centsToInput(150050)).toBe("1500,50");
    expect(centsToInput(150000)).toBe("1500");
  });
});

describe("financeiro", () => {
  it("sem pagamentos", () => {
    const f = calculateFinancials(1_850_000, []);
    expect(f).toMatchObject({
      paidCents: 0,
      balanceCents: 1_850_000,
      percentage: 0,
      paymentStatus: "sem_pagamento",
    });
  });

  it("parcial (30%) ignora pagamentos anulados", () => {
    const f = calculateFinancials(1_000_000, [
      { amountCents: 300_000, voided: false },
      { amountCents: 500_000, voided: true },
    ]);
    expect(f).toMatchObject({
      paidCents: 300_000,
      balanceCents: 700_000,
      percentage: 30,
      paymentStatus: "parcial",
    });
  });

  it("pago na totalidade", () => {
    expect(summarizeFinancials(950_000, 950_000).paymentStatus).toBe("pago");
    expect(summarizeFinancials(950_000, 950_000).percentage).toBe(100);
  });

  it("rejeita valores inválidos e excesso de pagamento", () => {
    expect(validateNewPayment(1000, 0, 0)).toMatch(/maior que zero/);
    expect(validateNewPayment(1000, 0, -5)).toMatch(/maior que zero/);
    expect(validateNewPayment(1000, 600, 500)).toMatch(/excede/);
    expect(validateNewPayment(1000, 1000, 1)).toMatch(/totalmente paga/);
    expect(validateNewPayment(1000, 600, 400)).toBeNull();
  });
});

describe("INATRO", () => {
  it("registado exige número de processo", () => {
    expect(validateInatroStatus("registado", "")).not.toBeNull();
    expect(validateInatroStatus("registado", "  ")).not.toBeNull();
    expect(validateInatroStatus("registado", "MPT-123")).toBeNull();
    expect(validateInatroStatus("pendente", null)).toBeNull();
  });
});

describe("permissões", () => {
  it("só gestor e admin anulam pagamentos", () => {
    expect(can("atendente", "void_payment")).toBe(false);
    expect(can("gestor", "void_payment")).toBe(true);
    expect(can("admin", "void_payment")).toBe(true);
  });

  it("só admin gere utilizadores e categorias", () => {
    expect(can("gestor", "manage_users")).toBe(false);
    expect(can("gestor", "manage_categories")).toBe(false);
    expect(can("admin", "manage_categories")).toBe(true);
  });
});
