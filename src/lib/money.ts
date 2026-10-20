/**
 * Converte um valor escrito pelo utilizador (Meticais) para centavos inteiros.
 * Aceita: "1500", "1.500", "1 500", "1.500,50", "1500,5", "1500.50", "1.500 MT".
 * Devolve null se o texto não for um valor válido. Nunca usa float.
 */
export function parseMeticais(input: string): number | null {
  let s = input.trim().replace(/\s| | /g, "").replace(/mtn?$/i, "");
  if (!s || s.startsWith("-")) return null;

  let inteiro: string;
  let decimal = "";

  if (s.includes(",")) {
    // Vírgula é o separador decimal (PT); pontos são milhares.
    const partes = s.split(",");
    if (partes.length !== 2) return null;
    inteiro = partes[0].replace(/\./g, "");
    decimal = partes[1];
  } else if (s.includes(".")) {
    const partes = s.split(".");
    const ultima = partes[partes.length - 1];
    if (partes.length > 2 || ultima.length === 3) {
      // "1.500" ou "1.500.000" → separador de milhares
      if (partes.slice(1).some((p) => p.length !== 3)) return null;
      inteiro = partes.join("");
    } else {
      inteiro = partes[0];
      decimal = ultima;
    }
  } else {
    inteiro = s;
  }

  s = inteiro;
  if (!/^\d+$/.test(s) || !/^\d{0,2}$/.test(decimal)) return null;
  if (s.length > 13) return null;

  const centavos = Number(s) * 100 + Number(decimal.padEnd(2, "0") || "0");
  return Number.isSafeInteger(centavos) ? centavos : null;
}

/** Centavos → texto para preencher um campo de formulário ("1500,50"). */
export function centavosParaInput(centavos: number): string {
  const inteiro = Math.trunc(centavos / 100);
  const resto = centavos % 100;
  return resto === 0 ? String(inteiro) : `${inteiro},${String(resto).padStart(2, "0")}`;
}
