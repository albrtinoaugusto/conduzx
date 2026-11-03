/** Conversão entre o formato mostrado (dd/mm/aaaa) e o guardado (AAAA-MM-DD). */

/** "2026-11-03" → "03/11/2026" */
export function isoToDisplay(iso?: string | null) {
  const m = iso ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso) : null;
  return m ? `${m[3]}/${m[2]}/${m[1]}` : "";
}

/** "03/11/2026" → "2026-11-03"; null se a data não existir no calendário. */
export function displayToIso(text: string) {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(text);
  if (!m) return null;
  const [, d, mo, y] = m;
  const date = new Date(Date.UTC(Number(y), Number(mo) - 1, Number(d)));
  if (date.getUTCFullYear() !== Number(y) || date.getUTCMonth() !== Number(mo) - 1 || date.getUTCDate() !== Number(d)) return null;
  return `${y}-${mo}-${d}`;
}

/** Só dígitos, com as barras colocadas automaticamente: dd/mm/aaaa. */
export function maskDate(raw: string) {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}
