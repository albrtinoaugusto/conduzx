/**
 * Converte um valor escrito pelo utilizador (Meticais) para centavos inteiros.
 * Aceita: "1500", "1.500", "1 500", "1.500,50", "1500,5", "1500.50", "1.500 MT".
 * Devolve null se o texto não for um valor válido. Nunca usa float.
 */
export function parseMeticais(input: string): number | null {
  let s = input.trim().replace(/\s| | /g, "").replace(/mtn?$/i, "");
  if (!s || s.startsWith("-")) return null;

  let integer: string;
  let decimal = "";

  if (s.includes(",")) {
    // Vírgula é o separador decimal (PT); pontos são milhares.
    const parts = s.split(",");
    if (parts.length !== 2) return null;
    integer = parts[0].replace(/\./g, "");
    decimal = parts[1];
  } else if (s.includes(".")) {
    const parts = s.split(".");
    const latest = parts[parts.length - 1];
    if (parts.length > 2 || latest.length === 3) {
      // "1.500" ou "1.500.000" → separador de milhares
      if (parts.slice(1).some((p) => p.length !== 3)) return null;
      integer = parts.join("");
    } else {
      integer = parts[0];
      decimal = latest;
    }
  } else {
    integer = s;
  }

  s = integer;
  if (!/^\d+$/.test(s) || !/^\d{0,2}$/.test(decimal)) return null;
  if (s.length > 13) return null;

  const cents = Number(s) * 100 + Number(decimal.padEnd(2, "0") || "0");
  return Number.isSafeInteger(cents) ? cents : null;
}

/** Centavos → texto para preencher um campo de formulário ("1500,50"). */
export function centsToInput(cents: number): string {
  const integer = Math.trunc(cents / 100);
  const remainder = cents % 100;
  return remainder === 0 ? String(integer) : `${integer},${String(remainder).padStart(2, "0")}`;
}
