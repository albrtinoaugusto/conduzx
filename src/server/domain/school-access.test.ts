import { describe, expect, it } from "vitest";
import { schoolBlock, trialDaysLeft, trialEndsAt } from "./school-access";

const createdAt = new Date("2026-01-01T00:00:00Z");
const base = { createdAt, suspendedAt: null, deletedAt: null, trialDays: 45 };

describe("acesso da empresa", () => {
  it("funciona até ao fim do período de teste e bloqueia a partir daí", () => {
    expect(schoolBlock(base, new Date("2026-02-14T23:59:59Z"))).toBeNull();
    expect(schoolBlock(base, new Date("2026-02-15T00:00:00Z"))).toBe("trial_expirado");
  });

  it("aumentar os dias volta a dar acesso", () => {
    expect(schoolBlock({ ...base, trialDays: 60 }, new Date("2026-02-15T00:00:00Z"))).toBeNull();
  });

  it("sem limite nunca expira", () => {
    expect(schoolBlock({ ...base, trialDays: null }, new Date("2036-01-01T00:00:00Z"))).toBeNull();
  });

  it("suspensão e eliminação têm prioridade sobre o teste", () => {
    const expired = new Date("2027-01-01T00:00:00Z");
    expect(schoolBlock({ ...base, suspendedAt: createdAt }, expired)).toBe("suspensa");
    expect(schoolBlock({ ...base, suspendedAt: createdAt, deletedAt: createdAt }, expired)).toBe("eliminada");
  });

  it("calcula os dias que faltam", () => {
    const end = trialEndsAt(createdAt, 45)!;
    expect(trialDaysLeft(end, new Date("2026-02-14T12:00:00Z"))).toBe(1);
    expect(trialDaysLeft(end, new Date("2026-03-01T00:00:00Z"))).toBe(0);
    expect(trialEndsAt(createdAt, null)).toBeNull();
  });
});
