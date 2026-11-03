import { describe, expect, it } from "vitest";
import { displayToIso, isoToDisplay, maskDate } from "./dates";

describe("datas dd/mm/aaaa", () => {
  it("converte nos dois sentidos", () => {
    expect(isoToDisplay("2026-11-03")).toBe("03/11/2026");
    expect(displayToIso("03/11/2026")).toBe("2026-11-03");
    expect(isoToDisplay(null)).toBe("");
  });
  it("rejeita datas que não existem ou incompletas", () => {
    expect(displayToIso("31/02/2026")).toBeNull();
    expect(displayToIso("03/11/26")).toBeNull();
    expect(displayToIso("13/13/2026")).toBeNull();
  });
  it("coloca as barras ao escrever", () => {
    expect(maskDate("0311")).toBe("03/11");
    expect(maskDate("03112026")).toBe("03/11/2026");
    expect(maskDate("03/11/2026999")).toBe("03/11/2026");
  });
});
