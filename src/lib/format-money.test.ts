import { describe, expect, it } from "vitest";
import { formatMoneyMzn } from "./format-money";

describe("formatMoneyMzn", () => {
  it("formats centavos as Mozambican meticais", () => {
    expect(formatMoneyMzn(125000)).toMatch(/^1250,00\sMTn$/);
  });
});
